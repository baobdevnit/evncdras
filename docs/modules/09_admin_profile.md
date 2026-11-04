# MODULE 09: HỒ SƠ & THIẾT LẬP CỦA QUẢN TRỊ VIÊN HỆ THỐNG (ADMIN PROFILE & SECURITY)
## Đường dẫn tài liệu: `docs/modules/09_admin_profile.md`
## Ánh xạ giao diện mẫu (chỉ khu vực Admin): `templates/admin/profile.html`, `templates/admin/change-password.html`, `templates/admin/user-settings.html` (bản tương ứng cho khu vực Member thuộc `docs/modules/08_user_profile.md`)

---

## 1. Mục tiêu & Nghiệp vụ (Business Overview)

### 1.1. Bối cảnh nghiệp vụ
Quản trị viên hạ tầng viễn thông (Admin Portal) của EVNICT nắm quyền quản lý toàn bộ hệ thống log và file ghi âm nhạy cảm:
1. **Quản lý hồ sơ cá nhân Quản trị viên**: Xem hồ sơ; tự cập nhật họ tên, số điện thoại trực ban (mục 3.2) và ảnh đại diện (chỉ qua `POST /api/v1/admin/profile/avatar`). Không tự sửa email; email của Admin khác sửa qua `PUT /api/v1/admin/admins/:id` (`admin:manage`). Nhận diện cấp bậc rõ ràng giữa **Root Admin** và **System Admin**.
2. **Tiêu chuẩn An toàn thông tin cấp cao**:
   - Mật khẩu tối thiểu 10 ký tự (3 trong 4 loại ký tự), bắt đổi sau 90 ngày (`password_changed_at`). Chính sách áp dụng chung cho cả hai portal, ngưỡng cấu hình qua `system_settings` (`security_*`), chi tiết tại `docs/01_database_schema.md` mục 6.1.
   - Quản lý phiên đăng nhập đang hoạt động (Active Sessions): đọc từ bảng `auth_sessions` (`GET /api/v1/admin/auth/sessions`), cho phép thu hồi từng phiên từ xa (`DELETE /api/v1/admin/auth/sessions/:id`) khi nghi ngờ lộ lọt thông tin. Root Admin thu hồi được mọi phiên của admin khác.
   - Truy vết nhật ký hành động (Personal Audit Log): Xem lại lịch sử các tác vụ quản trị do chính tài khoản này thực hiện gần đây.
3. **Thiết lập Dashboard Quản trị**: ẩn/hiện và sắp thứ tự các widget của Dashboard Admin. Lưu ở `user_settings.custom_preferences.dashboardWidgets` (`user_type = ADMIN`) dạng mảng `[{ "key": "kpiCards", "visible": true, "order": 1 }, ...]`, qua `GET`/`PUT /api/v1/admin/profile/preferences`. Ở API là trường cấp cao `dashboardWidgets`, cạnh 5 trường thiết lập chung của bản User (`theme`, `isSidebarCollapsed`, `itemsPerPage`, `emailNotificationEnabled`, `soundAlertEnabled`, `docs/modules/08_user_profile.md` mục 3.5); `custom_preferences` chỉ là nơi lưu, không xuất hiện trong body/response. Bộ `key` cố định: `kpiCards`, `poolWidget`, `quantityChart`, `qualityChart`, `topGroupsChart`, `groupMonitorTable`. Thiếu cấu hình thì dùng thứ tự mặc định như liệt kê.

---

## 2. Thiết kế Dữ liệu (Database Schema)

Dữ liệu lưu tại bảng `admins`, `user_settings` (`user_type = 'ADMIN'`) và truy vấn bảng `audit_logs`.

---

## 3. Đặc tả API Contracts

### 3.1. `GET /api/v1/admin/profile`
- **Guard**: `AdminAuthGuard`; không cần mã quyền. Token `PASSWORD_CHANGE_ONLY` trả `403 PASSWORD_CHANGE_REQUIRED` (`docs/01_database_schema.md` mục 6.1). Chế độ bảo trì không áp dụng cho cổng Admin.
- **Request**: không có query, không có body. Gửi query param bất kỳ trả `400 VALIDATION_ERROR`.
- **Xử lý** (chỉ đọc, không ghi CSDL, không ghi `audit_logs`): đọc `admins` theo khóa chính `id = sub` của Access Token, join `admin_roles` → `roles`. Không thấy dòng hoặc `status` khác `ACTIVE` trả `401 UNAUTHORIZED`, cùng quy tắc `GET /api/v1/admin/auth/me` (`docs/modules/04_auth_admin.md` mục 3.1.1 bước 2).
- **Response** `200`: hồ sơ để hiển thị và làm giá trị ban đầu cho form `PUT` (mục 3.2). Không có `permissions`: quyền chỉ lấy từ store `authAdmin.admin` (nạp từ đăng nhập hoặc `/auth/me`).

| Trường | Nguồn | Ghi chú |
|---|---|---|
| `id` | `admins.id` | |
| `username` | `admins.username` | Chỉ đọc |
| `email` | `admins.email` | Chỉ đọc (mục 1.1) |
| `fullName` | `admins.full_name` | Sửa qua mục 3.2 |
| `phoneNumber` | `admins.phone_number` | `null` khi chưa nhập; sửa qua mục 3.2 |
| `avatarUrl` | `admins.avatar_url` | `null` khi chưa tải ảnh (frontend dựng ảnh chữ cái đầu từ `fullName`); đổi qua `POST /admin/profile/avatar` |
| `status` | `admins.status` | Luôn `ACTIVE` (tài khoản khác `ACTIVE` nhận `401`) |
| `roleCode`, `roleName` | `roles.code`, `roles.name` qua `admin_roles` | Huy hiệu vai trò (mục 5.1) |
| `lastLoginAt` | `admins.last_login_at` | Lần đăng nhập thành công gần nhất (chính là phiên hiện tại nếu chưa đăng nhập lại ở nơi khác) |
| `passwordChangedAt` | `admins.password_changed_at` | `null` khi chưa từng đổi; frontend tự tính ngày hết hạn từ `security_password_max_age_days` nếu cần |
| `createdAt` | `admins.created_at` | |

Không trả `password_hash`, `must_change_password`, `failed_login_count`, `locked_until`, `created_by_admin_id`, `updated_at`. Thời gian theo ISO 8601 `+07:00` (`docs/02_api_contracts.md` mục 2).

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy hồ sơ thành công",
  "data": {
    "id": 1,
    "username": "root.admin@evnict.vn",
    "email": "root.admin@evnict.vn",
    "fullName": "Quản trị viên Tối cao EVNICT",
    "phoneNumber": "02422222222",
    "avatarUrl": null,
    "status": "ACTIVE",
    "roleCode": "ROOT_ADMIN",
    "roleName": "Quản trị viên tối cao",
    "lastLoginAt": "2026-10-12T08:15:00+07:00",
    "passwordChangedAt": "2026-09-01T10:20:00+07:00",
    "createdAt": "2026-08-15T09:00:00+07:00"
  },
  "timestamp": "2026-10-12T09:45:00+07:00"
}
```

- **Lỗi**:

| HTTP | `errorCode` | Khi nào |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Có query param |
| `401` | `UNAUTHORIZED` | Access Token thiếu, sai, hết hạn hoặc của cổng User (guard); tài khoản không còn `ACTIVE` |
| `403` | `PASSWORD_CHANGE_REQUIRED` | Gọi bằng token `PASSWORD_CHANGE_ONLY` |

- **Frontend** (`AdminProfileView`): gọi mỗi lần vào màn hình qua API client của cổng (`401` → refresh một lần rồi gửi lại). Phần đầu thẻ hiển thị `avatarUrl`, `fullName`, huy hiệu `roleName`, `email`; form điền `fullName`, `phoneNumber` (sửa được), `username`, `email`, `roleName` (chỉ đọc); khối thông tin tài khoản hiển thị `lastLoginAt`, `passwordChangedAt` (`null` → "Chưa đổi"), `createdAt` do frontend tự định dạng. Lỗi tải thì hiện thông báo và nút thử lại, không hiện dữ liệu mẫu. Mẫu: `templates/admin/profile.js`.
- Index phục vụ: khóa chính `admins`, `admin_roles`, `roles`.

### 3.2. `PUT /api/v1/admin/profile`
- **Guard**: `AdminAuthGuard`; không cần mã quyền. Token `PASSWORD_CHANGE_ONLY` trả `403 PASSWORD_CHANGE_REQUIRED`. Chế độ bảo trì không áp dụng cho cổng Admin. Không có query (có thì `400`).
- **Body** (`application/json`, cập nhật một phần, **ít nhất một trường**):

| Trường | Kiểu | Bắt buộc | Quy tắc | Cột đích |
|---|---|---|---|---|
| `fullName` | string | Không | Cắt khoảng trắng hai đầu; sau khi cắt dài 1–150 ký tự; `null` hoặc chuỗi rỗng trả `400` | `admins.full_name` |
| `phoneNumber` | string \| null | Không | Cắt khoảng trắng hai đầu; `null` hoặc chuỗi rỗng sau khi cắt = xóa số (`NULL`); còn lại theo quy tắc số điện thoại `docs/02_api_contracts.md` mục 2 (≤ 30 ký tự, chỉ chữ số, khoảng trắng, `+ - . ( )`, có ít nhất một chữ số) | `admins.phone_number` |

  Body rỗng `{}` trả `400` (`errors` có khóa `fullName` và `phoneNumber`, thông điệp "Cần gửi ít nhất một trường"). Mọi trường khác (`email`, `username`, `avatarUrl`, `status`, `roleCode`, `password`…) trả `400`, `errors` theo tên trường đó: email Admin chỉ sửa qua `PUT /api/v1/admin/admins/:id` (`docs/modules/04_auth_admin.md` mục 3.8), ảnh đại diện chỉ đổi qua `POST /api/v1/admin/profile/avatar` (API đó lưu file, ghi luôn `admins.avatar_url` và trả `avatarUrl` mới).
- **Xử lý** (một transaction):
  1. Validate body như bảng trên (lỗi trả `400`, không đọc CSDL).
  2. `SELECT ... FROM admins WHERE id = sub FOR UPDATE`. Không thấy dòng hoặc `status` khác `ACTIVE` trả `401 UNAUTHORIZED` (cùng quy tắc mục 3.1).
  3. So từng trường đã gửi (sau chuẩn hóa) với giá trị hiện tại; `changedFields` = các trường khác giá trị, theo thứ tự `fullName`, `phoneNumber`.
  4. `changedFields` rỗng: không `UPDATE`, không ghi `audit_logs`, trả `200` như bước 6.
  5. Ngược lại: `UPDATE admins` chỉ các cột đổi; ghi `audit_logs` `actor_type = 'ADMIN'`, `actor_id = sub`, `actor_name` = `full_name` sau khi sửa, `resource_name = 'ADMIN'`, `action = 'UPDATE'`, `resource_id` = id Admin, `ip_address`, `user_agent` của request, `action_details = { "changedFields": [...] }` (không ghi giá trị cũ/mới). Không thu hồi phiên, không gửi thông báo.
  6. Trả `200`, `data` = hồ sơ sau khi sửa, **đúng 12 trường** của mục 3.1 (đọc lại cùng transaction).
- **Ví dụ**:

```http
PUT /api/v1/admin/profile
Authorization: Bearer <access_token>
Content-Type: application/json

{ "fullName": "Quản trị viên Tối cao EVNICT", "phoneNumber": "024 2222 2223" }
```

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Cập nhật hồ sơ thành công",
  "data": {
    "id": 1,
    "username": "root.admin@evnict.vn",
    "email": "root.admin@evnict.vn",
    "fullName": "Quản trị viên Tối cao EVNICT",
    "phoneNumber": "024 2222 2223",
    "avatarUrl": null,
    "status": "ACTIVE",
    "roleCode": "ROOT_ADMIN",
    "roleName": "Quản trị viên tối cao",
    "lastLoginAt": "2026-10-12T08:15:00+07:00",
    "passwordChangedAt": "2026-09-01T10:20:00+07:00",
    "createdAt": "2026-08-15T09:00:00+07:00"
  },
  "timestamp": "2026-10-12T09:50:00+07:00"
}
```

```json
{
  "success": false,
  "statusCode": 400,
  "errorCode": "VALIDATION_ERROR",
  "message": "Dữ liệu không hợp lệ",
  "errors": { "phoneNumber": ["Số điện thoại chỉ gồm chữ số, khoảng trắng và các ký tự + - . ( )"] },
  "timestamp": "2026-10-12T09:50:00+07:00"
}
```

- **Lỗi**:

| HTTP | `errorCode` | Khi nào |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Body rỗng, sai kiểu, `fullName` rỗng/quá 150 ký tự, `phoneNumber` sai định dạng/quá 30 ký tự, có trường không được nhận, có query param |
| `401` | `UNAUTHORIZED` | Access Token thiếu, sai, hết hạn hoặc của cổng User (guard); tài khoản không còn `ACTIVE` |
| `403` | `PASSWORD_CHANGE_REQUIRED` | Gọi bằng token `PASSWORD_CHANGE_ONLY` |

- **Frontend** (`AdminProfileView`, form "Thông tin cá nhân"): giá trị ban đầu lấy từ `GET` (mục 3.1); gửi `fullName`, `phoneNumber` (ô trống → `null`) qua API client của cổng (`401` → refresh một lần rồi gửi lại), kiểm tra trước ở client cùng quy tắc của bảng body. Đang gửi thì khóa nút "Lưu thay đổi". Thành công: thay hồ sơ bằng `data`, điền lại form, cập nhật `fullName` của `authAdmin.admin` để header `AdminLayout` đổi theo ngay (không gọi lại `/auth/me`). `400` thì hiện `errors[field]` dưới ô tương ứng (khóa không ứng với ô nào thì hiện ở toast). Nút "Khôi phục" điền lại giá trị của lần tải/lưu gần nhất, không gọi API. Mẫu: `templates/admin/profile.js`, `window.adminSession.updateAccount` trong `templates/admin/main.js`.
- Index phục vụ: khóa chính `admins`, `admin_roles`, `roles`.

### 3.2.1. `POST /api/v1/admin/profile/avatar`

Đặc tả chung cho cả hai cổng; bản User `POST /api/v1/profile/avatar` khác ở các điểm ghi tại `docs/modules/08_user_profile.md` mục 3.3. Đây là cách **duy nhất** đổi ảnh đại diện (mọi `PUT` có `avatarUrl` trả `400`); chưa có API gỡ ảnh về `null` (chỉ thay bằng ảnh khác).

- **Guard**: `AdminAuthGuard`; không cần mã quyền. Token `PASSWORD_CHANGE_ONLY` trả `403 PASSWORD_CHANGE_REQUIRED`. Chế độ bảo trì không áp dụng cho cổng Admin. Không có query (có thì `400`).
- **Lưu trữ và phục vụ file** (dùng chung `admins.avatar_url`, `users.avatar_url`):
  - Thư mục `AVATAR_STORAGE_DIR` (biến môi trường, vd. `/srv/evn-cdr/media/avatars`) là **volume chung** gắn đọc-ghi vào mọi instance `backend-api`; `backend-worker` không cần. Không lưu ảnh trong CSDL.
  - Tên file `<uuid v4>.png` hoặc `<uuid v4>.jpg`, sinh mới mỗi lần tải (không dùng tên file của client, không dùng id tài khoản). Cột `avatar_url` lưu **đường dẫn tương đối** `/media/avatars/<tên file>` (55 ký tự, vừa `varchar(255)`); API trả nguyên giá trị đó, frontend dùng làm `src` của `<img>` cùng domain.
  - Nginx phục vụ `/media/avatars/` trực tiếp từ thư mục đó (`docs/00_overview_and_architecture.md` mục 5.3.1): không qua backend, không cần token (thẻ `<img>` không gửi được `Authorization`); tên file ngẫu nhiên nên không đoán được ảnh của người khác. Vì tên đổi mỗi lần tải nên được cache lâu (`immutable`).
- **Body** (`multipart/form-data`, đúng **một** phần file, không có trường văn bản nào khác):

| Phần | Kiểu | Bắt buộc | Quy tắc |
|---|---|---|---|
| `file` | file | Có | ≤ 2 MB (2 097 152 byte); định dạng PNG hoặc JPEG xác định bằng **magic bytes** của nội dung (không tin `Content-Type` của phần file hay đuôi tên file); giải mã được; tối đa 25 000 000 điểm ảnh (chống ảnh nén "bom") |

  `Content-Type` của request không phải `multipart/form-data`, thiếu `file`, có hơn một file, có trường khác hoặc sai quy tắc trả `400 VALIDATION_ERROR`, `errors` theo tên phần (`{ "file": ["Ảnh tối đa 2 MB"] }`, `{ "file": ["Chỉ nhận ảnh PNG hoặc JPEG"] }`, `{ "file": ["Không đọc được ảnh"] }`; trường lạ `{ "<tên>": ["Trường không được nhận"] }`). Vượt 2 MB cũng trả `400` (không dùng `413`): `multer` đặt `limits = { fileSize: 2097152, files: 1, fields: 0 }`, lỗi `LIMIT_*` đổi thành `400`; Nginx đặt `client_max_body_size 3m` để request tới được backend.
- **Xử lý** (theo thứ tự):
  1. Validate request như bảng trên (lỗi trả `400`, không đọc CSDL, không ghi file).
  2. Xử lý ảnh trong bộ nhớ bằng `sharp` (`limitInputPixels: 25000000`): xoay theo EXIF, cắt vuông ở giữa và thu về **256×256** (`fit: 'cover'`), mã hóa lại **cùng định dạng** với file gốc (PNG giữ nền trong suốt; JPEG chất lượng 85), **bỏ toàn bộ metadata** (EXIF, GPS, ICC). Lỗi giải mã trả `400` (`errors.file`). Không bao giờ lưu file gốc.
  3. Ghi kết quả vào `AVATAR_STORAGE_DIR` dưới tên tạm `.<uuid>.tmp` rồi `rename` sang `<uuid>.<png|jpg>` (cùng thư mục nên nguyên tử; Nginx không bao giờ thấy file dở).
  4. Một transaction: `SELECT ... FROM admins WHERE id = sub FOR UPDATE`; không thấy dòng hoặc `status` khác `ACTIVE` thì rollback, xóa file vừa ghi, trả `401 UNAUTHORIZED` (cùng quy tắc mục 3.1). Ngược lại giữ `avatar_url` cũ, `UPDATE admins SET avatar_url = '/media/avatars/<tên file mới>'`; ghi `audit_logs` `actor_type = 'ADMIN'`, `actor_id = sub`, `actor_name` = `full_name`, `resource_name = 'ADMIN'`, `action = 'UPDATE'`, `resource_id` = id Admin, `ip_address`, `user_agent` của request, `action_details = { "changedFields": ["avatarUrl"] }` (luôn ghi, vì tên file luôn mới; không ghi đường dẫn cũ/mới); đọc lại hồ sơ đủ 12 trường của mục 3.1; commit. Lỗi bất kỳ trước commit thì xóa file vừa ghi.
  5. Sau commit: nếu `avatar_url` cũ khớp `^/media/avatars/[0-9a-f-]{36}\.(png|jpg)$` thì xóa file đó (bỏ qua nếu không còn; lỗi xóa chỉ ghi log, không đổi response). Giá trị cũ khác mẫu (dữ liệu nhập tay trước đây) thì không xóa gì.
  6. Trả `200`, `data` = hồ sơ sau khi đổi, **đúng 12 trường** của mục 3.1. Không thu hồi phiên, không gửi thông báo.
- **Ví dụ**:

```http
POST /api/v1/admin/profile/avatar
Authorization: Bearer <access_token>
Content-Type: multipart/form-data; boundary=----evn

------evn
Content-Disposition: form-data; name="file"; filename="anh-the.jpg"
Content-Type: image/jpeg

<nội dung ảnh>
------evn--
```

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Cập nhật ảnh đại diện thành công",
  "data": {
    "id": 1,
    "username": "root.admin@evnict.vn",
    "email": "root.admin@evnict.vn",
    "fullName": "Quản trị viên Tối cao EVNICT",
    "phoneNumber": "024 2222 2223",
    "avatarUrl": "/media/avatars/3f2b8c1e-9d4a-4f6b-8e21-7c5d0a9b1e44.jpg",
    "status": "ACTIVE",
    "roleCode": "ROOT_ADMIN",
    "roleName": "Quản trị viên tối cao",
    "lastLoginAt": "2026-10-12T08:15:00+07:00",
    "passwordChangedAt": "2026-09-01T10:20:00+07:00",
    "createdAt": "2026-08-15T09:00:00+07:00"
  },
  "timestamp": "2026-10-12T09:55:00+07:00"
}
```

```json
{
  "success": false,
  "statusCode": 400,
  "errorCode": "VALIDATION_ERROR",
  "message": "Dữ liệu không hợp lệ",
  "errors": { "file": ["Ảnh tối đa 2 MB"] },
  "timestamp": "2026-10-12T09:55:00+07:00"
}
```

- **Lỗi**:

| HTTP | `errorCode` | Khi nào |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Không phải multipart, thiếu `file`, hơn một file, có trường khác, quá 2 MB, không phải PNG/JPEG theo magic bytes, không giải mã được, quá 25 000 000 điểm ảnh, có query param |
| `401` | `UNAUTHORIZED` | Access Token thiếu, sai, hết hạn hoặc của cổng User (guard); tài khoản không còn `ACTIVE` (bước 4) |
| `403` | `PASSWORD_CHANGE_REQUIRED` | Gọi bằng token `PASSWORD_CHANGE_ONLY` |

- **Frontend** (`AdminProfileView`, nút `.btn-change-avatar` trên ảnh): mở hộp chọn file `accept="image/png,image/jpeg"`; kiểm tra trước ở client (`file.type` là `image/png`/`image/jpeg`, `file.size` ≤ 2 MB; backend là nơi quyết định), sai thì toast, không gọi API. Gửi `FormData` có đúng phần `file` qua API client của cổng (`401` → refresh một lần rồi gửi lại cùng `FormData`; không tự đặt header `Content-Type` để trình duyệt thêm `boundary`). Đang tải thì khóa nút và hiện trạng thái tải trên ảnh; **không** hiện ảnh xem trước cục bộ như đã lưu. Thành công: thay hồ sơ bằng `data`, đổi ảnh ở thẻ hồ sơ, cập nhật `avatarUrl` của `authAdmin.admin` để header `AdminLayout` đổi ngay (không gọi lại `/auth/me`), toast `message`. `400` hiện `errors.file` (hoặc mọi thông điệp trong `errors`) ở toast, giữ ảnh cũ. Luôn xóa giá trị ô file sau mỗi lần chọn để chọn lại cùng file vẫn gửi được. Mẫu: `templates/admin/profile.js`, `window.adminSession.updateAccount` trong `templates/admin/main.js`.
- Index phục vụ: khóa chính `admins`, `admin_roles`, `roles`.

### 3.3. `PUT /api/v1/admin/profile/change-password`

Đặc tả chung cho cả hai cổng; bản User `PUT /api/v1/profile/change-password` khác ở các điểm ghi tại `docs/modules/08_user_profile.md` mục 3.4. Chính sách mật khẩu và phiên: `docs/01_database_schema.md` mục 6.1.

- **Guard**: `AdminAuthGuard`, nhận cả token `PASSWORD_CHANGE_ONLY`; không cần mã quyền. Chế độ bảo trì không áp dụng cho cổng Admin. Không có query (có thì `400`). Cookie Refresh Token (`Path=/api/v1/admin/auth`) **không** được gửi kèm vì route nằm ngoài `Path`; backend chỉ đặt cookie mới (cookie `Set-Cookie` có `Path=/api/v1/admin/auth`, trình duyệt vẫn nhận). Vì vậy phiên hiện tại xác định bằng claim `sid` của Access Token (id dòng `auth_sessions`, `docs/01_database_schema.md` mục 6.1), không bằng cookie.
- **Body** (`application/json`, đủ 3 trường):

| Trường | Kiểu | Bắt buộc | Quy tắc |
|---|---|---|---|
| `currentPassword` | string | Có | 1–255 ký tự như `password` của đăng nhập; không cắt khoảng trắng |
| `newPassword` | string | Có | Không cắt khoảng trắng; dài tối thiểu `security_password_min_length` (10) ký tự, tối đa **72 byte UTF-8** (giới hạn của `bcrypt`); có ít nhất 3 trong 4 loại ký tự (`docs/01_database_schema.md` mục 6.1); khác `currentPassword` |
| `confirmPassword` | string | Có | Trùng đúng `newPassword` |

  Thiếu trường, sai kiểu, sai quy tắc hoặc có trường khác trả `400 VALIDATION_ERROR`, `errors` theo tên trường (vd. `{ "newPassword": ["Mật khẩu phải từ 10 ký tự trở lên"], "confirmPassword": ["Mật khẩu xác nhận không khớp"] }`); thông điệp độ dài tối thiểu ghi đúng giá trị `security_password_min_length` hiện hành. Bước này không đọc CSDL, không tăng bộ đếm sai mật khẩu.
- **Xử lý** (một transaction, theo thứ tự):
  1. Validate body như bảng trên.
  2. `SELECT ... FROM admins WHERE id = sub FOR UPDATE`. Không thấy dòng hoặc `status` khác `ACTIVE`: `401 UNAUTHORIZED` (cùng quy tắc mục 3.1).
  3. `locked_until > NOW()`: `423 ACCOUNT_TEMPORARILY_LOCKED`, `errors = { "lockedUntil": "<ISO 8601>" }`; không so mật khẩu, không tăng bộ đếm (như đăng nhập, `docs/modules/04_auth_admin.md` mục 3.1 bước 2).
  4. `bcrypt.compare(currentPassword, password_hash)` sai: tăng bộ đếm bằng **đúng câu `UPDATE` nguyên tử** của đăng nhập (đạt `security_login_max_failed` thì đặt `locked_until` và đưa bộ đếm về 0, `docs/01_database_schema.md` mục 6.1), **commit** câu này rồi trả `400 VALIDATION_ERROR` với `errors = { "currentPassword": ["Mật khẩu hiện tại không đúng"] }` (kể cả lần sai làm tài khoản bị khóa tạm; lần gọi kế tiếp mới trả `423`). Không ghi `audit_logs`, không thu hồi phiên. Không dùng `401` để client không refresh rồi gửi lại.
  5. Đúng: `UPDATE admins SET password_hash = bcrypt(newPassword, 10), password_changed_at = NOW(), must_change_password = 0, failed_login_count = 0, locked_until = NULL`.
  6. `remember_me` của phiên mới = `remember_me` của phiên có `id` = claim `sid` của Access Token, `actor_type = 'ADMIN'`, `actor_id = sub` (đọc trước khi thu hồi, không xét phiên đó còn hiệu lực hay không); token `PASSWORD_CHANGE_ONLY` không có `sid` (chưa có phiên) thì `0`.
  7. Thu hồi mọi phiên còn lại: `UPDATE auth_sessions SET revoked_at = NOW(), revoked_reason = 'PASSWORD_CHANGED' WHERE actor_type = 'ADMIN' AND actor_id = sub AND revoked_at IS NULL` (kể cả phiên đang dùng), `n` = số dòng bị ảnh hưởng.
  8. Tạo đúng một phiên mới: `refresh_token_hash` của Refresh Token mới, `ip_address`/`user_agent` của request, `remember_me` của bước 6, `logged_in_at = NOW()`, `expires_at = NOW() + security_refresh_token_days` (hạn tuyệt đối mới, như đăng nhập), `last_used_at = NULL`.
  9. Ghi `audit_logs` `AUTH / PASSWORD_CHANGED`: `actor_type = 'ADMIN'`, `actor_id = sub`, `actor_name` = `full_name`, `resource_id` = id Admin, `ip_address`, `user_agent` của request, `action_details = { "revokedCount": n, "forced": true|false }` (`forced` = gọi bằng token `PASSWORD_CHANGE_ONLY`). Không ghi mật khẩu hay bản băm.
  10. Commit; ký Access Token **đầy đủ** (không có `scope`) bằng `JWT_ADMIN_SECRET`, mang `sub`, `roleCode` (đọc lại từ `admin_roles`), `sid` = id phiên mới; trả `200` kèm `Set-Cookie` Refresh Token mới (`HttpOnly; Secure; SameSite=Strict; Path=/api/v1/admin/auth`, `Max-Age` = số giây còn lại tới `expires_at` khi `remember_me = 1`, không có `Max-Age` khi `0`).

  Không gửi thông báo, không ngắt Socket.IO. Thiết bị khác giữ Access Token cũ tối đa `security_access_token_minutes` (15) phút rồi bị đưa về đăng nhập ở lần refresh kế tiếp (phiên đã `PASSWORD_CHANGED`). Các tab khác của cùng trình duyệt dùng chung cookie mới nên vẫn đăng nhập.
- **Ví dụ**:

```http
PUT /api/v1/admin/profile/change-password
Authorization: Bearer <access_token>
Content-Type: application/json

{ "currentPassword": "OldPassword123@", "newPassword": "NewSecurePassword2026!@", "confirmPassword": "NewSecurePassword2026!@" }
```

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Đổi mật khẩu thành công",
  "data": { "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", "expiresIn": 900 },
  "timestamp": "2026-10-12T10:05:00+07:00"
}
```

  `data` cùng cấu trúc với `refresh` (`docs/modules/03_auth_user.md` mục 3.2.1), không trả thông tin tài khoản: store đã có `admin` từ đăng nhập hoặc `/auth/me`, và đổi mật khẩu không đổi trường nào của `admin`.

```json
{
  "success": false,
  "statusCode": 400,
  "errorCode": "VALIDATION_ERROR",
  "message": "Dữ liệu không hợp lệ",
  "errors": { "currentPassword": ["Mật khẩu hiện tại không đúng"] },
  "timestamp": "2026-10-12T10:05:00+07:00"
}
```

- **Lỗi**:

| HTTP | `errorCode` | Khi nào |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Body sai (bảng body), có query param; `currentPassword` sai (bước 4, có tăng bộ đếm) |
| `401` | `UNAUTHORIZED` | Access Token thiếu, sai, hết hạn hoặc của cổng User (guard); tài khoản không còn `ACTIVE` (bước 2) |
| `423` | `ACCOUNT_TEMPORARILY_LOCKED` | `locked_until > NOW()` (bước 3), `errors.lockedUntil` |

  Không có `403 PASSWORD_CHANGE_REQUIRED` (route nhận token giới hạn).
- **Frontend** (`ChangePasswordView`, mục 5): kiểm tra trước ở client cùng quy tắc bảng body (độ dài tối thiểu lấy mặc định 10, backend là nơi quyết định), danh sách yêu cầu tự tích khi gõ, ô xác nhận báo khớp/không khớp. Gửi qua API client của cổng (`401` → refresh một lần rồi gửi lại; token `PASSWORD_CHANGE_ONLY` không có phiên nên refresh `401` và về đăng nhập). Đang gửi thì khóa nút. Thành công: lưu `accessToken` mới vào `authAdmin` (thay token cũ, kể cả token giới hạn), xóa form; chế độ bị buộc đổi thì vào `admin.dashboard`, chế độ thường ở lại trang và báo toast "Đã đổi mật khẩu. Các thiết bị khác đã bị đăng xuất." `400` hiện `errors[field]` dưới ô tương ứng (khóa không có ô thì toast); sai `currentPassword` thì xóa ô đó. `423` báo "Tài khoản bị khóa tạm đến <giờ>" theo `errors.lockedUntil`. Mẫu: `templates/admin/change-password.js`, `window.adminSession.setAccessToken` trong `templates/admin/main.js`.
- Index phục vụ: khóa chính `admins`, `admin_roles`, `auth_sessions` (đọc phiên theo `sid`); `idx_session_actor` (thu hồi mọi phiên); `uniq_session_token` (chèn phiên mới).

### 3.4. `GET /api/v1/admin/profile/recent-activity`
- **Mục đích**: 20 dòng `audit_logs` gần nhất mà **chính Admin đang đăng nhập là tác nhân** (khối "Hoạt động gần đây" của `admin.profile`).
- **Guard**: `AdminAuthGuard`; không cần mã quyền (xem nhật ký của chính mình không cần `audit:view`). Token `PASSWORD_CHANGE_ONLY` trả `403 PASSWORD_CHANGE_REQUIRED`. Chế độ bảo trì không áp dụng cho cổng Admin.
- **Request**: không có query, không có body; số dòng cố định 20, không phân trang. Gửi query param bất kỳ (kể cả `page`, `limit`) trả `400 VALIDATION_ERROR`.
- **Xử lý** (chỉ đọc, không ghi CSDL; bản thân lời gọi **không** ghi `audit_logs`):
  1. Đọc `admins` theo khóa chính `id = sub`; không thấy dòng hoặc `status` khác `ACTIVE` trả `401 UNAUTHORIZED` (cùng quy tắc mục 3.1).
  2. Đọc:

     ```sql
     SELECT id, action, resource_name, resource_id, ip_address, user_agent, action_details, created_at
     FROM audit_logs
     WHERE actor_type = 'ADMIN' AND actor_id = :sub
     ORDER BY created_at DESC, id DESC
     LIMIT 20;
     ```

     - Gồm **mọi** dòng có tác nhân là chính Admin, mọi `resource_name`/`action`, kể cả `AUTH / LOGIN_FAILED` (khi `username` tồn tại, `actor_id` là tài khoản bị thử, kể cả khi do người khác gõ sai, giúp Admin phát hiện bị dò mật khẩu) và `ACCESS_DENIED`.
     - **Không** gồm dòng do người khác tác động lên tài khoản này (tác nhân khác, `resource_name = 'ADMIN'`, `resource_id` = id này, vd. Root Admin khóa, đặt lại mật khẩu, thu hồi phiên): tra ở `GET /api/v1/admin/audit-logs` (`audit:view`, `docs/modules/07_system_settings.md` mục 3.4).
     - Không giới hạn khoảng thời gian (`audit_logs` không bị dọn, `docs/01_database_schema.md` mục 2.1 "Không bị dọn", mục 13); ít hơn 20 dòng thì trả hết, không có dòng nào thì trả mảng rỗng.
- **Response** `200`: `data` là **mảng** (không có khung phân trang của `docs/02_api_contracts.md` mục 2.2), tối đa 20 phần tử, đã sắp `createdAt` giảm dần rồi `id` giảm dần. Mỗi phần tử cùng tên và ý nghĩa với phần tử của `GET /admin/audit-logs`, bỏ ba trường tác nhân (`actorType`, `actorId`, `actorName` luôn là chính mình):

| Trường | Kiểu | Nguồn | Ghi chú |
|---|---|---|---|
| `id` | number | `audit_logs.id` | `bigint`, trả dạng số (không chạm ngưỡng `2^53`) |
| `action` | string | `action` | Mã trong danh mục `docs/01_database_schema.md` mục 13; frontend tự ánh xạ nhãn tiếng Việt (mục 5.1), API không trả nhãn |
| `resourceName` | string | `resource_name` | `AUTH`, `AUDIO`, `CDR`, `REPORT`, `USER`, `ADMIN`, `USER_GROUP`, `PREFIX`, `ORGANIZATION`, `SYSTEM` |
| `resourceId` | string \| null | `resource_id` | Giữ nguyên chuỗi đã ghi (vd. id Admin, `cdr_id`, mã nhóm) |
| `ipAddress` | string \| null | `ip_address` | |
| `userAgent` | string \| null | `user_agent` | Chuỗi gốc, frontend không phân tích |
| `actionDetails` | object \| null | `action_details` | JSON gốc (vd. `{ "changedFields": ["fullName"] }`, `{ "reason": "BAD_PASSWORD" }`, `{ "format": "EXCEL" }`) |
| `createdAt` | string | `created_at` | ISO 8601 `+07:00` |

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy hoạt động gần đây thành công",
  "data": [
    {
      "id": 10452,
      "action": "UPDATE",
      "resourceName": "ADMIN",
      "resourceId": "1",
      "ipAddress": "10.0.12.34",
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
      "actionDetails": { "changedFields": ["phoneNumber"] },
      "createdAt": "2026-10-12T09:40:12+07:00"
    },
    {
      "id": 10398,
      "action": "LISTEN_AUDIO",
      "resourceName": "AUDIO",
      "resourceId": "5370",
      "ipAddress": "10.0.12.34",
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
      "actionDetails": null,
      "createdAt": "2026-10-12T08:31:05+07:00"
    },
    {
      "id": 10377,
      "action": "LOGIN",
      "resourceName": "AUTH",
      "resourceId": null,
      "ipAddress": "10.0.12.34",
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
      "actionDetails": null,
      "createdAt": "2026-10-12T08:15:00+07:00"
    },
    {
      "id": 10371,
      "action": "LOGIN_FAILED",
      "resourceName": "AUTH",
      "resourceId": null,
      "ipAddress": "10.0.40.7",
      "userAgent": "Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0",
      "actionDetails": { "reason": "BAD_PASSWORD" },
      "createdAt": "2026-10-12T07:58:44+07:00"
    }
  ],
  "timestamp": "2026-10-12T09:45:00+07:00"
}
```

- **Lỗi**:

| HTTP | `errorCode` | Khi nào |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Có query param |
| `401` | `UNAUTHORIZED` | Access Token thiếu, sai, hết hạn hoặc của cổng User (guard); tài khoản không còn `ACTIVE` (bước 1) |
| `403` | `PASSWORD_CHANGE_REQUIRED` | Gọi bằng token `PASSWORD_CHANGE_ONLY` |

- **Frontend** (`AdminProfileView`, khối "Hoạt động gần đây", mục 5.1): gọi mỗi lần vào màn hình, độc lập với `GET /admin/profile` (lỗi khối này không ẩn hồ sơ), qua API client của cổng (`401` → refresh một lần rồi gửi lại). Có trạng thái đang tải, lỗi + nút "Thử lại", rỗng ("Chưa có hoạt động nào"). Mỗi dòng: thời gian (frontend định dạng), nhãn hành động tiếng Việt ánh xạ từ `resourceName` + `action` (mã chưa có nhãn thì hiện nguyên mã), `resourceId` nếu có, `ipAddress`; `userAgent` ở `title` (tooltip); `LOGIN_FAILED` và `ACCESS_DENIED` tô màu cảnh báo, `LOGIN_FAILED` kèm lý do từ `actionDetails.reason`. Tải lại sau khi `PUT /admin/profile` hoặc `POST /admin/profile/avatar` thành công (hai API đó ghi `ADMIN / UPDATE`). Không có liên kết sang nhật ký kiểm toán. Mẫu: `templates/admin/profile.js`.
- Index phục vụ: khóa chính `admins`; `idx_audit_actor` (`actor_type`, `actor_id`, `created_at`, `id`) đọc đúng 20 dòng theo thứ tự, không sắp xếp thêm (`docs/01_database_schema.md` mục 13).

### 3.5. Phiên đăng nhập của chính mình (`GET /api/v1/admin/auth/sessions`, `DELETE /api/v1/admin/auth/sessions/:id`)

Đặc tả chung cho hai cổng: bản User (`GET /api/v1/auth/sessions`, `docs/modules/08_user_profile.md` mục 3.6) khác ở `UserAuthGuard` và `actor_type = 'USER'`. Thu hồi mọi phiên của Admin khác dùng `DELETE /api/v1/admin/admins/:id/sessions` (`docs/modules/04_auth_admin.md` mục 3.7).

- **Phiên hiện tại** (dùng cho `isCurrent` của `GET` và chặn thu hồi phiên hiện tại ở `DELETE`): xác định từ claim `sid` của Access Token, **không** từ cookie (cookie dùng chung giữa các tab có thể là của tài khoản khác vừa đăng nhập; cách này cũng dùng được ở API ngoài `Path` cookie, như `change-password`). Đọc phiên `id = sid` có `actor_type = 'ADMIN'`, `actor_id = sub`; còn hiệu lực (`revoked_at IS NULL AND expires_at > NOW()`) thì đó là phiên hiện tại; đã `ROTATED` (tab khác vừa refresh, Access Token của tab này còn mang `sid` cũ) thì đi theo chuỗi `replaced_by_session_id` tối đa 5 bước tới phiên còn hiệu lực, như `docs/01_database_schema.md` mục 6.1; không tới được thì không có phiên hiện tại.

#### 3.5.1. `GET /api/v1/admin/auth/sessions`

- **Guard**: `AdminAuthGuard`; không cần mã quyền. Token `PASSWORD_CHANGE_ONLY` trả `403 PASSWORD_CHANGE_REQUIRED` (token này không có phiên). Cookie Refresh Token (`Path=/api/v1/admin/auth`) được trình duyệt gửi kèm nhưng API **không** đọc.
- **Request**: không có query, không có body. Gửi query param bất kỳ trả `400 VALIDATION_ERROR`.
- **Xử lý** (chỉ đọc, không ghi CSDL, không ghi `audit_logs`, không cập nhật `last_used_at`):
  1. Đọc `admins` theo khóa chính `id = sub`; không thấy dòng hoặc `status` khác `ACTIVE` trả `401 UNAUTHORIZED` (cùng quy tắc mục 3.1).
  2. Xác định phiên hiện tại như trên.
  3. Đọc các phiên `actor_type = 'ADMIN' AND actor_id = sub AND revoked_at IS NULL AND expires_at > NOW()` (`idx_session_actor`), sắp: phiên hiện tại đứng đầu, sau đó `COALESCE(last_used_at, created_at)` giảm dần, rồi `id` giảm dần. Không phân trang, không giới hạn số dòng (mỗi lần đăng nhập đầy đủ thêm một phiên, phiên hết hạn sau `security_refresh_token_days` ngày).
- **Response** `200`: `data` là **mảng** (không có khung phân trang `docs/02_api_contracts.md` mục 2.2), mỗi phần tử:

| Trường | Kiểu | Nguồn | Ghi chú |
|---|---|---|---|
| `id` | number | `auth_sessions.id` | Id đổi sau mỗi lần xoay vòng; `DELETE` nhận cả id cũ (mục 3.5.2) |
| `ipAddress` | string \| `null` | `ip_address` | IP của lần đăng nhập/refresh gần nhất |
| `userAgent` | string \| `null` | `user_agent` | Chuỗi gốc; frontend tự rút tên trình duyệt/hệ điều hành, API không trả tên ghép sẵn (`docs/02_api_contracts.md` mục 2) |
| `loggedInAt` | string (ISO 8601) | `logged_in_at` | Lúc đăng nhập (giữ nguyên qua các lần xoay vòng) |
| `lastActiveAt` | string (ISO 8601) | `COALESCE(last_used_at, created_at)` | Lần cấp token gần nhất (đăng nhập hoặc refresh); sai lệch tới `security_access_token_minutes` phút vì gọi API bằng Access Token còn hạn không ghi CSDL |
| `expiresAt` | string (ISO 8601) | `expires_at` | Hạn tuyệt đối, phải đăng nhập lại sau thời điểm này |
| `isCurrent` | boolean | so `id` với phiên hiện tại | Tối đa một phần tử `true` |

Không trả `actor_type`, `actor_id`, `refresh_token_hash`, `remember_me`, `revoked_*`, `replaced_by_session_id`. Phiên `remember_me = 0` mà trình duyệt đã đóng (cookie mất) vẫn được liệt kê tới `expiresAt` vì máy chủ không biết cookie đã mất; người dùng thu hồi bằng `DELETE`.

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy danh sách phiên đăng nhập thành công",
  "data": [
    {
      "id": 4821,
      "ipAddress": "10.0.12.34",
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36",
      "loggedInAt": "2026-11-05T08:15:00+07:00",
      "lastActiveAt": "2026-11-05T09:42:10+07:00",
      "expiresAt": "2026-11-12T08:15:00+07:00",
      "isCurrent": true
    },
    {
      "id": 4790,
      "ipAddress": "10.0.40.7",
      "userAgent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15",
      "loggedInAt": "2026-11-03T14:02:00+07:00",
      "lastActiveAt": "2026-11-04T17:30:45+07:00",
      "expiresAt": "2026-11-10T14:02:00+07:00",
      "isCurrent": false
    }
  ],
  "timestamp": "2026-11-05T09:45:00+07:00"
}
```

- **Lỗi**:

| HTTP | `errorCode` | Khi nào |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Có query param |
| `401` | `UNAUTHORIZED` | Access Token thiếu, sai, hết hạn hoặc của cổng User (guard); tài khoản không còn `ACTIVE` (bước 1) |
| `403` | `PASSWORD_CHANGE_REQUIRED` | Gọi bằng token `PASSWORD_CHANGE_ONLY` |

- **Frontend** (`AdminProfileView`, khối "Phiên đăng nhập của tôi", mục 5.1): gọi mỗi lần vào màn hình, độc lập với `GET /admin/profile` và khối "Hoạt động gần đây" (lỗi khối này không ẩn khối khác), qua API client của cổng (`401` → refresh một lần rồi gửi lại). Có trạng thái đang tải, lỗi + nút "Thử lại", rỗng ("Không có phiên nào đang hoạt động", chỉ xảy ra khi phiên hiện tại vừa bị thu hồi). Mỗi dòng: tên trình duyệt + hệ điều hành rút từ `userAgent` bằng hàm nội bộ (không thư viện ngoài; không nhận ra thì "Thiết bị không xác định", chuỗi gốc ở `title`), nhãn "Phiên này" khi `isCurrent`, `ipAddress`, "Đăng nhập" `loggedInAt`, "Hoạt động gần nhất" `lastActiveAt`, "Hết hạn" `expiresAt` (frontend định dạng). Nút thu hồi từng phiên (`DELETE`) theo mục 3.5.2; không có nút "Đăng xuất khỏi tất cả thiết bị khác" (không có API). Mẫu: `templates/admin/profile.js`.
- Index phục vụ: khóa chính `admins`, khóa chính `auth_sessions` (đi chuỗi `sid`); `idx_session_actor` (`actor_type`, `actor_id`, `revoked_at`) lọc phiên còn mở của tài khoản, `expires_at` lọc trên các dòng đó; sắp xếp trong bộ nhớ trên vài dòng.

#### 3.5.2. `DELETE /api/v1/admin/auth/sessions/:id`

Đặc tả chung cho hai cổng: bản User (`DELETE /api/v1/auth/sessions/:id`, `docs/modules/08_user_profile.md` mục 3.6) khác ở `UserAuthGuard`, `actor_type = 'USER'`, bước 1 đọc `users`.

- **Guard**: `AdminAuthGuard`; không cần mã quyền. Token `PASSWORD_CHANGE_ONLY` trả `403 PASSWORD_CHANGE_REQUIRED`. Cookie Refresh Token được trình duyệt gửi kèm nhưng API **không** đọc.
- **Request**: `:id` là số nguyên dương (`auth_sessions.id`, `bigint unsigned`; chuỗi `^[1-9][0-9]{0,18}$`), sai thì `400 VALIDATION_ERROR` với `errors.id`. Không có query, không có body; gửi query param hoặc body có trường thì `400 VALIDATION_ERROR`. `:id` có thể là id đọc từ danh sách trước đó mà phiên đã xoay vòng (`ROTATED`) sau đó.
- **Xử lý** (một transaction):
  1. Đọc `admins` theo khóa chính `id = sub`; không thấy dòng hoặc `status` khác `ACTIVE` trả `401 UNAUTHORIZED` (cùng quy tắc mục 3.1).
  2. `SELECT ... FOR UPDATE` phiên theo khóa chính `id = :id` **và** `actor_type = 'ADMIN' AND actor_id = sub`. Không thấy (không tồn tại hoặc là phiên của tài khoản khác, kể cả của cổng User) trả `404 NOT_FOUND`, cùng thông điệp cho cả hai trường hợp để không lộ id phiên của người khác.
  3. Tìm phiên đích: phiên ở bước 2 còn hiệu lực (`revoked_at IS NULL AND expires_at > NOW()`) thì là phiên đích; đã `ROTATED` thì đi theo `replaced_by_session_id`, mỗi bước `SELECT ... FOR UPDATE` theo khóa chính (cùng điều kiện `actor_type`/`actor_id`), tối đa 5 bước, tới phiên còn hiệu lực (`docs/01_database_schema.md` mục 6.1). Không tới được (phiên đã thu hồi vì lý do khác `ROTATED`, đã hết hạn, chuỗi dài quá 5 bước): không ghi gì, trả `200` với `data = { "revoked": false }`.
  4. Xác định phiên hiện tại như đầu mục 3.5, **sau** bước 3 và bằng đọc khóa (`SELECT ... FOR UPDATE` theo khóa chính trên chuỗi `sid`), không bằng đọc thường: đọc thường trong transaction trả ảnh chụp có thể cũ, nên nếu tab này vừa refresh song song (phiên `sid` vừa `ROTATED` sang phiên đích) thì phiên đang dùng bị coi là "phiên khác" và bị thu hồi. Phiên đích là phiên hiện tại (kể cả khi `:id` là id cũ của phiên hiện tại trước khi xoay vòng) trả `400 VALIDATION_ERROR` với `errors = { "id": ["Không thể thu hồi phiên đang dùng, hãy dùng Đăng xuất"] }`; kết thúc phiên hiện tại dùng `POST /admin/auth/logout`. Không có phiên hiện tại (chuỗi `sid` đã bị thu hồi từ thiết bị khác) thì mọi phiên đích đều thu hồi được.
  5. `UPDATE auth_sessions SET revoked_at = NOW(), revoked_reason = 'REVOKED_BY_SELF' WHERE id = <phiên đích>`; ghi `audit_logs` `AUTH / SESSION_REVOKED` (`actor_type = 'ADMIN'`, `actor_id` = `sub`, `actor_name` = `admins.full_name`, `resource_id` = id phiên đích (không phải `:id` khi đã đi theo chuỗi), `ip_address`, `user_agent` của request, `action_details = NULL`). Trả `200` với `data = { "revoked": true }`.
- Thứ tự khóa: chuỗi phiên đích rồi chuỗi `sid`, đều theo khóa chính; `refresh` khóa phiên theo `refresh_token_hash` (một dòng), nên refresh đồng thời của phiên đích chạy tuần tự với API này: refresh trước thì bước 3 đi tới phiên mới và thu hồi phiên đó; API này trước thì refresh thấy `REVOKED_BY_SELF` và trả `401` (xóa cookie).
- **Hiệu lực trên thiết bị bị thu hồi**: Access Token đã cấp cho thiết bị đó vẫn dùng được tới khi hết hạn (tối đa `security_access_token_minutes` phút), như mọi trường hợp thu hồi khác (`docs/01_database_schema.md` mục 6.1); lần refresh kế tiếp trả `401` và thiết bị về trang đăng nhập. Không có sự kiện Socket.IO đẩy ra ngay.
- **Response** `200`:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Đã thu hồi phiên đăng nhập",
  "data": { "revoked": true },
  "timestamp": "2026-11-05T09:50:00+07:00"
}
```

`revoked = false` (thông điệp "Phiên đăng nhập đã kết thúc trước đó") khi bước 3 không tới được phiên hiệu lực: gọi lại lần hai, hoặc phiên đã hết hạn/bị thu hồi trong lúc màn hình còn hiện danh sách cũ. Không trả id phiên đã thu hồi; frontend tải lại danh sách.

- **Lỗi**:

| HTTP | `errorCode` | Khi nào |
|---|---|---|
| `400` | `VALIDATION_ERROR` | `:id` không phải số nguyên dương (`errors.id`); có query param hoặc body có trường; phiên đích là phiên hiện tại (bước 4, `errors.id`) |
| `401` | `UNAUTHORIZED` | Access Token thiếu, sai, hết hạn hoặc của cổng User (guard); tài khoản không còn `ACTIVE` (bước 1) |
| `403` | `PASSWORD_CHANGE_REQUIRED` | Gọi bằng token `PASSWORD_CHANGE_ONLY` |
| `404` | `NOT_FOUND` | `:id` không tồn tại hoặc không phải phiên của người gọi (bước 2) |

- **Frontend** (`AdminProfileView`, khối "Phiên đăng nhập của tôi", mục 5.1): mỗi dòng có `isCurrent = false` có nút "Thu hồi"; dòng "Phiên này" không có nút. Bấm nút mở hộp xác nhận dùng chung (`ConfirmModal`, `docs/03_ui_design.md` mục 6.6, loại nguy hiểm) nêu tên thiết bị (rút từ `userAgent`) và IP, nói rõ thiết bị đó bị đăng xuất khi Access Token hiện tại hết hạn. Xác nhận thì gọi qua API client của cổng (`401` → refresh một lần rồi gửi lại); trong lúc gửi khóa hai nút, không đóng hộp. Kết quả:
  - `200` `revoked = true`: toast thành công, tải lại danh sách phiên và khối "Hoạt động gần đây" (có thêm dòng "Thu hồi phiên đăng nhập").
  - `200` `revoked = false`: toast thông tin "Phiên này đã kết thúc trước đó", tải lại danh sách phiên.
  - `404`: toast cảnh báo "Phiên đăng nhập không còn tồn tại", tải lại danh sách phiên.
  - `400`: toast lỗi theo `errors.id`, tải lại danh sách phiên (danh sách đang hiện đã cũ).
  - Lỗi khác (mạng, `5xx`): toast lỗi, giữ nguyên danh sách để thử lại.
  Không có nút "Đăng xuất khỏi tất cả thiết bị khác" (không có API). Mẫu: `templates/admin/profile.js` (`mockDeleteMySession`, `#revokeSessionModal`).
- Index phục vụ: khóa chính `admins`; khóa chính `auth_sessions` (bước 2–4). Không cần index khác.

### 3.6. `GET /api/v1/admin/profile/preferences`
- **Guard**: `AdminAuthGuard`; không cần mã quyền. Token `PASSWORD_CHANGE_ONLY` trả `403 PASSWORD_CHANGE_REQUIRED`. Chế độ bảo trì không áp dụng cho cổng Admin.
- **Request**: không có query, không có body. Gửi query param bất kỳ trả `400 VALIDATION_ERROR`.
- **Xử lý** (chỉ đọc, không ghi CSDL, không ghi `audit_logs`):
  1. Đọc `admins` theo khóa chính `id = sub`; không thấy dòng hoặc `status` khác `ACTIVE` trả `401 UNAUTHORIZED` (cùng quy tắc mục 3.1).
  2. Đọc `user_settings` theo `uniq_user_settings` (`user_type = 'ADMIN'`, `user_id = sub`). **Không có dòng thì trả giá trị mặc định của DDL** (`docs/01_database_schema.md` mục 12) và **không** chèn dòng (chèn chỉ ở `PUT`, dạng upsert).
  3. `itemsPerPage`: giá trị lưu ngoài `10`/`20`/`50` (chỉ xảy ra khi sửa tay CSDL) trả `10`.
  4. Chuẩn hóa `dashboardWidgets` từ `custom_preferences.dashboardWidgets` để response **luôn đủ 6 phần tử**, theo bộ `key` cố định ở mục 1.1 (thứ tự mặc định `kpiCards`, `poolWidget`, `quantityChart`, `qualityChart`, `topGroupsChart`, `groupMonitorTable`):
     - `custom_preferences` là `NULL`, không có khóa `dashboardWidgets` hoặc giá trị không phải mảng: dùng mặc định (cả 6 `visible = true`, `order` 1…6).
     - Bỏ phần tử có `key` lạ; `key` lặp lại chỉ lấy phần tử đầu; `visible` không phải boolean coi là `true`; `order` không phải số coi là đứng sau các phần tử có `order`.
     - Sắp theo `order` tăng dần (bằng nhau thì theo thứ tự mặc định), thêm `key` còn thiếu (`visible = true`) vào cuối theo thứ tự mặc định, rồi đánh lại `order` liên tục 1…6.
     - Các khóa khác trong `custom_preferences` (nếu có) bỏ qua, không trả.
- **Response** `200`:

| Trường | Kiểu | Nguồn | Mặc định (không có dòng) |
|---|---|---|---|
| `theme` | `LIGHT` \| `DARK` \| `SYSTEM` | `user_settings.theme` | `SYSTEM` |
| `isSidebarCollapsed` | boolean | `is_sidebar_collapsed` | `false` |
| `itemsPerPage` | `10` \| `20` \| `50` | `items_per_page` | `10` |
| `emailNotificationEnabled` | boolean | `email_notification_enabled` (email cho thông báo `CRITICAL`, `docs/01_database_schema.md` mục 10) | `true` |
| `soundAlertEnabled` | boolean | `sound_alert_enabled` (chuông khi nhận thông báo `CRITICAL` qua Socket.IO, `docs/modules/06_notifications.md`) | `true` |
| `dashboardWidgets` | mảng 6 phần tử `{ key, visible, order }` | `custom_preferences.dashboardWidgets` (đã chuẩn hóa ở bước 4) | 6 widget theo thứ tự mặc định, đều hiện |

Không trả `id`, `user_type`, `user_id`, `custom_preferences`, `updated_at`. Cột `tinyint(1)` trả boolean, không trả `0`/`1`.

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy thiết lập thành công",
  "data": {
    "theme": "DARK",
    "isSidebarCollapsed": false,
    "itemsPerPage": 20,
    "emailNotificationEnabled": true,
    "soundAlertEnabled": true,
    "dashboardWidgets": [
      { "key": "kpiCards", "visible": true, "order": 1 },
      { "key": "groupMonitorTable", "visible": true, "order": 2 },
      { "key": "quantityChart", "visible": true, "order": 3 },
      { "key": "qualityChart", "visible": true, "order": 4 },
      { "key": "topGroupsChart", "visible": false, "order": 5 },
      { "key": "poolWidget", "visible": true, "order": 6 }
    ]
  },
  "timestamp": "2026-11-05T09:00:00+07:00"
}
```

- **Lỗi**:

| HTTP | `errorCode` | Khi nào |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Có query param |
| `401` | `UNAUTHORIZED` | Access Token thiếu, sai, hết hạn hoặc của cổng User (guard); tài khoản không còn `ACTIVE` |
| `403` | `PASSWORD_CHANGE_REQUIRED` | Gọi bằng token `PASSWORD_CHANGE_ONLY` |

- **Frontend**: thiết lập dùng cho **toàn cổng Admin**, nên nạp một lần khi vào cổng, không chỉ ở màn hình cài đặt.
  - Guard của khu vực Admin, khi store `authAdmin` đã có `admin` (sau đăng nhập hoặc sau `GET /admin/auth/me`, `docs/modules/04_auth_admin.md` mục 3.1.1) mà store `preferencesAdmin` còn trống, gọi API này qua API client của cổng (`401` → refresh một lần rồi gửi lại) và lưu `data` vào store `preferencesAdmin` (`src/apps/admin/stores/preferencesAdmin.store.ts`). Store đã có dữ liệu thì không gọi lại; đăng xuất thì xóa store. Token `PASSWORD_CHANGE_ONLY` không gọi (route bị buộc đổi mật khẩu không cần), dùng mặc định và `adminTheme` đã cache. Gọi lỗi (trừ `401`) **không chặn** vào cổng: dùng giá trị mặc định ở bảng trên.
  - Áp dụng: `theme` → `LIGHT` gắn `data-theme="light"`, `DARK` gắn `data-theme="dark"`, `SYSTEM` bỏ thuộc tính để theo `prefers-color-scheme`; `isSidebarCollapsed` → trạng thái ban đầu của sidebar; `itemsPerPage` → `limit` mặc định của các bảng phân trang (người dùng đổi tạm ở từng màn hình không lưu); `soundAlertEnabled` → phát chuông khi nhận thông báo `CRITICAL`; `dashboardWidgets` → `DashboardView` vẽ các widget `visible = true` theo `order` (widget `poolWidget` vẫn cần `prefix:view`, `docs/00_overview_and_architecture.md` mục 5.3.3); `emailNotificationEnabled` chỉ hiển thị ở màn hình cài đặt.
  - Chống nhấp nháy giao diện (FOUC): sau khi nạp, ghi **riêng giá trị `theme`** vào `localStorage` khóa `adminTheme`; script đầu trang đọc khóa này trước khi Vue chạy (`SYSTEM` hoặc chưa có thì theo `prefers-color-scheme`). Không ghi các trường khác hay dữ liệu tài khoản vào storage.
  - `AccountSettingsView` (`/admin/account-settings`) đọc từ store, không gọi lại API; nếu store chưa có (lần nạp ở guard lỗi) thì gọi API, hiện trạng thái tải/lỗi kèm nút thử lại. Màn hình chỉ có điều khiển cho đúng 6 trường của response (mục 5.2). Mẫu: `templates/admin/user-settings.js`, `window.adminSession.loadPreferences` trong `templates/admin/main.js`.
- Index phục vụ: khóa chính `admins`; `uniq_user_settings` (`user_type`, `user_id`).

### 3.7. `PUT /api/v1/admin/profile/preferences`
- **Guard**: `AdminAuthGuard`; không cần mã quyền. Token `PASSWORD_CHANGE_ONLY` trả `403 PASSWORD_CHANGE_REQUIRED`. Chế độ bảo trì không áp dụng cho cổng Admin. Không có query (có thì `400`).
- **Body** (`application/json`, cập nhật một phần, **ít nhất một trường**; trường không gửi giữ nguyên giá trị đã lưu, chưa có dòng thì giữ mặc định DDL). Không trường nào nhận `null`. Kiểu phải đúng JSON, không tự ép kiểu (`"20"`, `1`/`0`, `"true"` đều trả `400`):

| Trường | Kiểu | Quy tắc | Cột đích |
|---|---|---|---|
| `theme` | string | Đúng một trong `LIGHT`, `DARK`, `SYSTEM` (chữ hoa) | `user_settings.theme` |
| `isSidebarCollapsed` | boolean | `true` / `false` | `is_sidebar_collapsed` |
| `itemsPerPage` | integer | Đúng một trong `10`, `20`, `50` | `items_per_page` |
| `emailNotificationEnabled` | boolean | `true` / `false` | `email_notification_enabled` |
| `soundAlertEnabled` | boolean | `true` / `false` | `sound_alert_enabled` |
| `dashboardWidgets` | mảng | **Đúng 6 phần tử**; mỗi phần tử là object có **đúng** 3 khóa `key`, `visible`, `order`; `key` thuộc bộ cố định ở mục 1.1, không lặp (nên đủ cả 6 `key`); `visible` boolean; `order` số nguyên và tập `order` đúng bằng `{1, 2, 3, 4, 5, 6}`. Không chuẩn hóa hộ: sai bất kỳ điều nào trả `400`, `errors.dashboardWidgets` (không dùng khóa lồng) | `custom_preferences.dashboardWidgets` |

  Body rỗng `{}` trả `400` (`errors` có đủ 6 khóa trên, thông điệp "Cần gửi ít nhất một trường"). Mọi trường khác (`customPreferences`, `id`, `userType`, `userId`, `updatedAt`…) trả `400`, `errors` theo tên trường đó.
- **Xử lý** (một transaction, **không** ghi `audit_logs`: thiết lập cá nhân, không phải thao tác quản trị; cùng quy tắc với bản User `docs/modules/08_user_profile.md` mục 3.5):
  1. Validate body như bảng trên (lỗi trả `400`, không đọc CSDL).
  2. Đọc `admins` theo khóa chính `id = sub`; không thấy dòng hoặc `status` khác `ACTIVE` trả `401 UNAUTHORIZED` (cùng quy tắc mục 3.1).
  3. Upsert một câu theo `uniq_user_settings`, chỉ các cột của trường đã gửi (cột không gửi khi chèn mới lấy mặc định DDL):
     ```sql
     INSERT INTO user_settings (user_type, user_id, <cột đã gửi>)
     VALUES ('ADMIN', :sub, <giá trị>)
     ON DUPLICATE KEY UPDATE <cột đã gửi> = VALUES(<cột>);
     ```
     `dashboardWidgets` ghi vào khóa `dashboardWidgets` của `custom_preferences`, **giữ nguyên các khóa khác**: khi chèn `custom_preferences = JSON_OBJECT('dashboardWidgets', JSON_EXTRACT(:widgets, '$'))`; khi cập nhật `custom_preferences = JSON_SET(IF(JSON_TYPE(custom_preferences) = 'OBJECT', custom_preferences, '{}'), '$.dashboardWidgets', JSON_EXTRACT(:widgets, '$'))` (`JSON_EXTRACT(..., '$')` để giá trị được chèn dạng mảng JSON, không phải chuỗi). Mảng lưu theo thứ tự `order` tăng dần.
  4. Không so sánh giá trị cũ: gửi lại đúng giá trị đang lưu vẫn trả `200` (MariaDB không đổi `updated_at` khi giá trị không đổi). Không thu hồi phiên, không gửi thông báo, không đẩy Socket.IO: tab/thiết bị khác của cùng Admin nhận giá trị mới ở lần vào cổng kế tiếp.
  5. Đọc lại dòng `user_settings` trong cùng transaction, chuẩn hóa như bước 3–4 mục 3.6, trả `200`, `data` = **đúng 6 trường** như response của mục 3.6.
- **Ví dụ**:

```http
PUT /api/v1/admin/profile/preferences
Authorization: Bearer <access_token>
Content-Type: application/json

{ "theme": "DARK" }
```

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Cập nhật thiết lập thành công",
  "data": {
    "theme": "DARK",
    "isSidebarCollapsed": false,
    "itemsPerPage": 20,
    "emailNotificationEnabled": true,
    "soundAlertEnabled": true,
    "dashboardWidgets": [
      { "key": "kpiCards", "visible": true, "order": 1 },
      { "key": "groupMonitorTable", "visible": true, "order": 2 },
      { "key": "quantityChart", "visible": true, "order": 3 },
      { "key": "qualityChart", "visible": true, "order": 4 },
      { "key": "topGroupsChart", "visible": false, "order": 5 },
      { "key": "poolWidget", "visible": true, "order": 6 }
    ]
  },
  "timestamp": "2026-11-05T09:10:00+07:00"
}
```

```json
{
  "success": false,
  "statusCode": 400,
  "errorCode": "VALIDATION_ERROR",
  "message": "Dữ liệu không hợp lệ",
  "errors": { "dashboardWidgets": ["Phải gồm đúng 6 widget, mỗi key một lần, order từ 1 đến 6 không trùng"] },
  "timestamp": "2026-11-05T09:10:00+07:00"
}
```

- **Lỗi**:

| HTTP | `errorCode` | Khi nào |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Body rỗng, giá trị `null`, sai kiểu, `theme`/`itemsPerPage` ngoài tập cho phép, `dashboardWidgets` sai cấu trúc (bảng body), có trường không được nhận, có query param |
| `401` | `UNAUTHORIZED` | Access Token thiếu, sai, hết hạn hoặc của cổng User (guard); tài khoản không còn `ACTIVE` |
| `403` | `PASSWORD_CHANGE_REQUIRED` | Gọi bằng token `PASSWORD_CHANGE_ONLY` |

- **Frontend** (áp ngay, lỗi thì hoàn tác; không có nút "Lưu"):
  - Mỗi lần đổi một điều khiển ở `AccountSettingsView` (mục 5.2), hoặc bấm nút Sáng/Tối ở header `AdminLayout`: chụp lại giá trị cũ, cập nhật store `preferencesAdmin` và áp lên giao diện ngay (như mục 3.6), rồi gửi `PUT` **chỉ trường vừa đổi** qua API client của cổng (`401` → refresh một lần rồi gửi lại). Đổi widget (công tắc hoặc lên/xuống) gửi đủ mảng `dashboardWidgets` 6 phần tử, `order` đánh lại 1…6.
  - Đang gửi thì khóa điều khiển đó (nút header: khóa nút). Thành công: thay store bằng `data`, áp lại, ghi cache `adminTheme` (chỉ `theme`), toast ngắn. Lỗi (trừ `401` đã chuyển về đăng nhập): trả **các trường của lần gửi đó** về giá trị cũ trong store và điều khiển, áp lại giao diện, toast `message` của lỗi.
  - Nút thu gọn sidebar ở header **không** gọi API (chỉ thu gọn/mở tạm, mục 3.6); giá trị mặc định chỉ đổi ở màn hình cài đặt.
  - Mẫu: `window.adminSession.savePreferences` trong `templates/admin/main.js`, hàm `change()` trong `templates/admin/user-settings.js`.
- Index phục vụ: khóa chính `admins`; `uniq_user_settings` (`user_type`, `user_id`) cho upsert.

---

## 4. Kiến trúc Backend NestJS (`backend/src/core`, `apps/*`)

Theo quy tắc `docs/00_overview_and_architecture.md` mục 5.1: nghiệp vụ và entity ở `core`, controller ở `apps/admin` / `apps/member`, job nền ở `apps/worker`; các phần `apps/*` không import lẫn nhau.

```
backend/src/
├── core/profile/                       <-- dùng chung với hồ sơ User (docs/modules/08_user_profile.md mục 4)
└── apps/admin/profile/
    ├── admin-profile.module.ts
    ├── admin-profile.controller.ts     <-- /api/v1/admin/profile* (recent-activity đọc qua core/audit, mục 3.4)
    └── dto/
        ├── update-admin-profile.dto.ts
        └── change-admin-password.dto.ts
```

---

## 5. Kiến trúc Frontend Vue 3 (chỉ khu vực Admin)

| Route | View | Template nguồn | API |
| :--- | :--- | :--- | :--- |
| `/admin/profile` (`admin.profile`) | `src/apps/admin/views/profile/AdminProfileView.vue` | `templates/admin/profile.html` | `GET`/`PUT /api/v1/admin/profile`, `POST /admin/profile/avatar`, `GET /admin/profile/recent-activity`, `/admin/auth/sessions*` |
| `/admin/change-password` (`admin.change-password`) | `src/apps/admin/views/profile/ChangePasswordView.vue` | `templates/admin/change-password.html` | `PUT /api/v1/admin/profile/change-password` |
| `/admin/account-settings` (`admin.account-settings`) | `src/apps/admin/views/settings/AccountSettingsView.vue` | `templates/admin/user-settings.html` | `GET`/`PUT /api/v1/admin/profile/preferences` |

Cả 3 route chỉ cần đăng nhập (không mã quyền). `ChangePasswordView` là route duy nhất mở được bằng token `PASSWORD_CHANGE_ONLY`: guard của khu vực Admin chuyển mọi route khác về `admin.change-password` khi `authAdmin` đang giữ token giới hạn (`mustChangePassword = true` của response đăng nhập).

`ChangePasswordView` có hai chế độ (mục 3.3):
- **Bị buộc đổi** (token giới hạn): bố cục riêng như trang đăng nhập, **không** có sidebar/menu/header của `AdminLayout`; hiện banner lý do ("Bạn cần đổi mật khẩu trước khi tiếp tục": mật khẩu ban đầu/được đặt lại hoặc đã quá `security_password_max_age_days` ngày), thẻ tài khoản (`fullName`, `roleName`, `email` từ store) và nút "Đăng xuất" (`POST /admin/auth/logout`). Thành công: lưu Access Token đầy đủ mới, vào `admin.dashboard`.
- **Thường** (đã đăng nhập đầy đủ): trong `AdminLayout`. Thành công: lưu Access Token mới, xóa form, ở lại trang, toast "Đã đổi mật khẩu. Các thiết bị khác đã bị đăng xuất."

Mẫu tĩnh: `templates/admin/change-password.html` (chế độ thường), `change-password.html?forced=1` (chế độ bị buộc đổi, `login.js` chuyển tới khi `mustChangePassword`).

### 5.1. Bố cục Giao diện (`AdminProfileView.vue`)
- Ánh xạ `templates/admin/profile.html`, một trang không chia tab (đổi mật khẩu là route riêng `admin.change-password`):
  - **Thẻ trái**: ảnh đại diện (nút đổi ảnh, mục 3.2.1), `fullName`, huy hiệu vai trò hiển thị `roles.name` (seed: `ROOT_ADMIN` "Quản trị viên tối cao" màu vàng, `SYSTEM_ADMIN` "Quản trị viên hệ thống" màu xanh dương), `email`, khối chỉ đọc `lastLoginAt`/`passwordChangedAt`/`createdAt` (mục 3.1).
  - **Thông tin cá nhân**: form `PUT /admin/profile` (mục 3.2).
  - **Hoạt động gần đây**: 20 dòng của `GET /admin/profile/recent-activity` (mục 3.4), trạng thái tải/lỗi/rỗng riêng. Nhãn hành động do frontend ánh xạ từ `resourceName` + `action`: `AUTH` `LOGIN` "Đăng nhập", `LOGIN_FAILED` "Đăng nhập thất bại" (lý do `BAD_PASSWORD` "sai mật khẩu", `ACCOUNT_LOCKED` "tài khoản bị khóa", `TEMPORARILY_LOCKED` "đang khóa tạm"), `LOGOUT` "Đăng xuất", `SESSION_REVOKED` "Thu hồi phiên đăng nhập", `TOKEN_REUSE_DETECTED` "Phát hiện dùng lại phiên", `PASSWORD_CHANGED` "Đổi mật khẩu", `PASSWORD_RESET` "Đặt lại mật khẩu"; `AUDIO` `LISTEN_AUDIO` "Nghe ghi âm", `DOWNLOAD_AUDIO` "Tải ghi âm"; `CDR` `EXPORT_CDR` "Xuất CDR"; `REPORT` `EXPORT_REPORT` "Xuất báo cáo"; `CREATE`/`UPDATE`/`LOCK`/`UNLOCK`/`DEACTIVATE`/`DELETE`/`CHANGE_ROLE` "Tạo"/"Cập nhật"/"Khóa"/"Mở khóa"/"Ngừng hoạt động"/"Xóa"/"Đổi vai trò" + đối tượng (`ADMIN` "quản trị viên" — riêng `resourceId` = id của chính mình là "Cập nhật hồ sơ của tôi", `USER` "người dùng", `USER_GROUP` "nhóm người dùng", `ORGANIZATION` "đơn vị"); `TOGGLE_GROUP_RECORDING` "Đổi quyền nghe ghi âm của nhóm"; `PREFIX` `UPDATE_PREFIX_GROUP` "Sửa nhóm đầu số", `ALLOCATE_RANGE` "Cấp dải số", `UPDATE_RANGE` "Sửa dải số", `REVOKE_RANGE` "Thu hồi dải số", `UPDATE_NUMBER` "Sửa thông tin số"; `SYSTEM` `UPDATE_SETTINGS` "Cập nhật cài đặt hệ thống", `RECALCULATE_STATS` "Tính lại thống kê", `CREATE_NOTIFICATION` "Gửi thông báo", `RETRY_ENRICHMENT` "Xử lý lại CDR lỗi"; `ACCESS_DENIED` "Thao tác bị từ chối". Mã chưa có nhãn hiện nguyên mã.
  - **Phiên đăng nhập của tôi** (mục 3.5.1): danh sách `GET /admin/auth/sessions`, nằm giữa "Thông tin cá nhân" và "Hoạt động gần đây", trạng thái tải/lỗi/rỗng riêng; mỗi dòng tên trình duyệt + hệ điều hành rút từ `userAgent`, nhãn "Phiên này" (`isCurrent`), IP, "Đăng nhập", "Hoạt động gần nhất", "Hết hạn"; dòng không phải "Phiên này" có nút "Thu hồi" (hộp xác nhận rồi `DELETE /admin/auth/sessions/:id`, mục 3.5.2).

### 5.2. Bố cục Giao diện (`AccountSettingsView.vue`, ánh xạ `templates/admin/user-settings.html`)
- Thẻ trái: `avatarUrl`, `fullName`, `roleName`, `email` đọc từ store `authAdmin` (không cứng chữ), cùng nút điều hướng hai nhóm và liên kết sang `admin.profile` (phiên đăng nhập, đổi mật khẩu nằm ở hồ sơ, không lặp lại ở đây).
- Nhóm **Giao diện & Hiển thị**: `theme` là nhóm chọn 3 giá trị Sáng / Tối / Theo hệ thống; công tắc `isSidebarCollapsed` ("Menu thu gọn mặc định"); ô chọn `itemsPerPage` chỉ 10 / 20 / 50.
- Nhóm **Dashboard Quản trị**: danh sách 6 widget theo `order` của `dashboardWidgets`, mỗi dòng có nhãn tiếng Việt, công tắc `visible` và nút lên/xuống đổi thứ tự. Nhãn: `kpiCards` "Thẻ KPI toàn hệ thống", `poolWidget` "Kho số chung", `quantityChart` "Biểu đồ số lượng cuộc gọi", `qualityChart` "Biểu đồ chất lượng cuộc gọi", `topGroupsChart` "Top nhóm theo lưu lượng", `groupMonitorTable` "Bảng giám sát nhóm".
- Nhóm **Thông báo**: công tắc `emailNotificationEnabled` ("Nhận email khi có sự cố Nghiêm trọng", gửi tới `email` của tài khoản) và `soundAlertEnabled` ("Âm thanh chuông khi có sự cố Nghiêm trọng").
- Không có điều khiển nào khác (ngôn ngữ, định dạng ngày, 2FA, trích xuất dữ liệu, xóa/vô hiệu hóa tài khoản không có API/cột). Mỗi điều khiển lưu ngay khi đổi qua `PUT /api/v1/admin/profile/preferences` (mục 3.7: áp ngay, lỗi thì hoàn tác, đang gửi thì khóa điều khiển đó); không có nút "Lưu".

---

## 6. Kịch bản kiểm thử (Test Plan for Agent)
1. **TC-AP-01**: Admin đổi mật khẩu thành chuỗi dưới 10 ký tự trả `400 VALIDATION_ERROR` với `errors.newPassword = ["Mật khẩu phải từ 10 ký tự trở lên"]`; chuỗi 73 byte UTF-8, chỉ 2 loại ký tự, trùng `currentPassword`, `confirmPassword` khác `newPassword`, thêm trường lạ đều trả `400` đúng khóa `errors`, không tăng `failed_login_count`.
2. **TC-AP-02**: Admin A đăng nhập sai mật khẩu một lần rồi đăng nhập đúng, sửa `phoneNumber`, nghe một file ghi âm; Root Admin đặt lại mật khẩu của một Admin B. `GET /api/v1/admin/profile/recent-activity` của A trả `200`, `data` là mảng có 4 dòng mới nhất theo thứ tự `LISTEN_AUDIO`, `UPDATE` (`actionDetails.changedFields = ["phoneNumber"]`), `LOGIN`, `LOGIN_FAILED` (`actionDetails.reason = "BAD_PASSWORD"`), mỗi phần tử đúng 8 trường của mục 3.4 (không có `actorType`/`actorId`/`actorName`), `ipAddress` là IP client; của B không có dòng `PASSWORD_RESET` do Root Admin thực hiện. Admin có hơn 20 dòng chỉ nhận 20 dòng mới nhất; `EXPLAIN` dùng `idx_audit_actor`, không `Using filesort`. Gọi xong không phát sinh dòng `audit_logs` mới. Gửi `?limit=50` trả `400`; token `PASSWORD_CHANGE_ONLY` trả `403`; tài khoản bị khóa trong lúc token còn hạn trả `401`. Ở màn hình hồ sơ, lưu họ tên thành công thì khối "Hoạt động gần đây" có thêm dòng "Cập nhật hồ sơ của tôi".
3. **TC-AP-03**: `GET /api/v1/admin/profile` trả đủ 12 trường của mục 3.1, không có `permissions`, `password_hash`, `locked_until`; gửi `?x=1` trả `400`; gọi bằng token `PASSWORD_CHANGE_ONLY` trả `403 PASSWORD_CHANGE_REQUIRED`; Root Admin khóa tài khoản trong lúc Access Token còn hạn thì lần gọi kế tiếp trả `401 UNAUTHORIZED`.
4. **TC-AP-04**: `PUT /api/v1/admin/profile` với `{ "fullName": "  Nguyễn Văn A  " }` lưu `Nguyễn Văn A`, trả đủ 12 trường của mục 3.1, ghi một dòng `audit_logs` `ADMIN / UPDATE` với `changedFields = ["fullName"]`, header đổi tên ngay; gửi lại đúng giá trị đó trả `200` và không ghi thêm dòng audit; `{}`, `{ "fullName": "" }`, `{ "phoneNumber": "abc" }`, `{ "email": "x@evn.vn" }` đều trả `400 VALIDATION_ERROR`; `{ "phoneNumber": null }` xóa số.
5. **TC-AP-05**: Đăng nhập trên 2 trình duyệt (A có `rememberMe = true`). Ở A `PUT /api/v1/admin/profile/change-password` đúng: `200` `{ accessToken, expiresIn }`, `Set-Cookie` `Path=/api/v1/admin/auth` có `Max-Age` ≈ 7 ngày; `admins.must_change_password = 0`, `password_changed_at` mới; cả 2 phiên cũ `PASSWORD_CHANGED`, có đúng 1 phiên mới `remember_me = 1`; `audit_logs` `AUTH / PASSWORD_CHANGED` `revokedCount = 2`, `forced = false`. Refresh ở B trả `401`. Gọi bằng token `PASSWORD_CHANGE_ONLY` (Admin mới tạo): `200`, phiên mới `remember_me = 0`, `forced = true`, token mới gọi được `GET /admin/profile`. Sai `currentPassword` 5 lần: 5 lần `400` (`errors.currentPassword`), lần 6 `423 ACCOUNT_TEMPORARILY_LOCKED` có `errors.lockedUntil`, không có dòng audit nào.
6. **TC-AP-06**: `POST /api/v1/admin/profile/avatar` với ảnh JPEG 1,5 MB 1200×800 có EXIF GPS: `200`, `data` đủ 12 trường, `avatarUrl` dạng `/media/avatars/<uuid>.jpg`; file trên đĩa 256×256, không còn EXIF; `GET` đường dẫn đó qua Nginx trả ảnh với `X-Content-Type-Options: nosniff`; một dòng `audit_logs` `ADMIN / UPDATE` `changedFields = ["avatarUrl"]`; tải ảnh PNG kế tiếp thì file JPEG cũ bị xóa, header đổi ảnh ngay. File 2,1 MB, file `.png` thực chất là PDF, thiếu phần `file`, thêm phần `fullName`, gửi JSON đều trả `400 VALIDATION_ERROR` và không có file mới trong `AVATAR_STORAGE_DIR`; token `PASSWORD_CHANGE_ONLY` trả `403`; tài khoản bị khóa trong lúc token còn hạn trả `401` và không còn file mồ côi.
7. **TC-AP-07**: Admin mới tạo bằng `npm run seed:root` rồi xóa dòng `user_settings` của mình: `GET /api/v1/admin/profile/preferences` trả `200` với `theme = "SYSTEM"`, `isSidebarCollapsed = false`, `itemsPerPage = 10`, hai cờ thông báo `true`, `dashboardWidgets` đủ 6 phần tử theo thứ tự mặc định đều `visible = true`; sau lời gọi vẫn không có dòng `user_settings` mới, không có dòng `audit_logs`. Sửa tay `custom_preferences = '{"dashboardWidgets":[{"key":"groupMonitorTable","visible":true,"order":1},{"key":"foo","visible":true,"order":2},{"key":"kpiCards","visible":"no","order":3}]}'` và `items_per_page = 30`: response có `itemsPerPage = 10`, `dashboardWidgets` 6 phần tử, `groupMonitorTable` thứ 1, `kpiCards` thứ 2 `visible = true`, không có `foo`, 4 key còn lại theo thứ tự mặc định, `order` liên tục 1…6. Gửi `?x=1` trả `400`; token `PASSWORD_CHANGE_ONLY` trả `403`; tài khoản bị khóa trong lúc token còn hạn trả `401`. Đăng nhập lại ở trình duyệt khác: giao diện, sidebar, số dòng mỗi trang và thứ tự widget Dashboard giữ đúng giá trị CSDL.
8. **TC-AP-08**: Admin chưa có dòng `user_settings`: `PUT /api/v1/admin/profile/preferences` với `{ "theme": "DARK" }` trả `200`, `data` đủ 6 trường (`theme = "DARK"`, còn lại mặc định, `dashboardWidgets` 6 phần tử mặc định); CSDL có đúng một dòng `user_settings` mới `user_type = 'ADMIN'`, `custom_preferences = NULL`; không có dòng `audit_logs`. Gửi `dashboardWidgets` đủ 6 phần tử hợp lệ: `custom_preferences.dashboardWidgets` lưu đúng thứ tự, khóa khác đã có trong `custom_preferences` (sửa tay) vẫn còn. Mỗi body sau trả `400 VALIDATION_ERROR` và CSDL không đổi: `{}`, `{ "theme": "dark" }`, `{ "theme": null }`, `{ "itemsPerPage": 100 }`, `{ "itemsPerPage": "20" }`, `{ "isSidebarCollapsed": 1 }`, `dashboardWidgets` 5 phần tử, có `key` lặp, có `key` lạ, `order` 1,2,3,4,5,5, phần tử thừa khóa `label`, `{ "customPreferences": {} }`; gửi `?x=1` trả `400`; token `PASSWORD_CHANGE_ONLY` trả `403`; tài khoản bị khóa trong lúc token còn hạn trả `401`. Ở màn hình cài đặt, giả lập `PUT` lỗi: điều khiển và giao diện trở về giá trị cũ, có toast lỗi.
9. **TC-AP-09**: Admin A đăng nhập ở trình duyệt X (08:15) rồi Y (09:00); ở X refresh lúc 09:40. `GET /api/v1/admin/auth/sessions` từ X trả `200`, `data` là mảng 2 phần tử, phần tử đầu là phiên của X (`isCurrent = true`, `id` = phiên mới sau xoay vòng, `loggedInAt` = 08:15, `lastActiveAt` = 09:40, `expiresAt` = 08:15 + 7 ngày), phần tử sau là Y (`isCurrent = false`); mỗi phần tử đúng 7 trường, không có `refresh_token_hash`/`rememberMe`. Tab thứ hai của X vừa refresh (Access Token tab đầu còn `sid` cũ): gọi từ tab đầu vẫn đánh dấu đúng phiên mới của X. Gọi bằng token của Admin B (cookie trình duyệt là của A) chỉ trả phiên của B. Phiên đã thu hồi, đã hết hạn và phiên của Admin khác không có trong danh sách. Gọi xong không phát sinh dòng `audit_logs`, `last_used_at` không đổi. Gửi `?x=1` trả `400`; token `PASSWORD_CHANGE_ONLY` trả `403`; tài khoản bị khóa trong lúc token còn hạn trả `401`. Phiên mới sau xoay vòng có `logged_in_at` bằng phiên cũ; sau tự đổi mật khẩu có `logged_in_at` mới.
10. **TC-AP-10**: Admin A có phiên X (đang dùng) và Y (trình duyệt khác). Từ X, `DELETE /api/v1/admin/auth/sessions/<Y>` trả `200` `{ "revoked": true }`; Y có `revoked_reason = 'REVOKED_BY_SELF'`; một dòng `audit_logs` `AUTH / SESSION_REVOKED`, `resource_id` = id của Y, `action_details` `NULL`; refresh ở Y trả `401` và xóa cookie, Access Token còn hạn của Y vẫn gọi được API tới khi hết hạn. Gọi lại cùng id: `200` `{ "revoked": false }`, không thêm dòng audit. Y refresh (Y → Y') rồi X gọi `DELETE` với id cũ của Y: Y' bị thu hồi, `resource_id` = id của Y'. `DELETE` id của X, hoặc id cũ của X trước khi X xoay vòng: `400 VALIDATION_ERROR` có `errors.id`, X vẫn hiệu lực. Tab thứ hai của X refresh đúng lúc tab đầu gọi `DELETE` với id cũ của X (đã `ROTATED` sang phiên mới của X): vẫn `400`, phiên mới của X không bị thu hồi. Id phiên của Admin B, id phiên của User, id không tồn tại: `404 NOT_FOUND` cùng thông điệp. `:id` = `abc`, `0`, `-1`: `400` có `errors.id`; gửi `?x=1` hoặc body `{"x":1}`: `400`; token `PASSWORD_CHANGE_ONLY` trả `403`; tài khoản bị khóa trong lúc token còn hạn trả `401`. Ở màn hình hồ sơ, dòng "Phiên này" không có nút "Thu hồi"; thu hồi Y qua hộp xác nhận thì Y biến khỏi danh sách và "Hoạt động gần đây" có dòng "Thu hồi phiên đăng nhập".
