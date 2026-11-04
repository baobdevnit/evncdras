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
  8. Tạo đúng một phiên mới: `refresh_token_hash` của Refresh Token mới, `ip_address`/`user_agent` của request, `remember_me` của bước 6, `expires_at = NOW() + security_refresh_token_days` (hạn tuyệt đối mới, như đăng nhập), `last_used_at = NULL`.
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
- **Mục đích**: Lấy 20 hành động gần nhất của Admin từ bảng `audit_logs`.
- **Response**: Trả về thời gian, địa chỉ IP, hành động (`LISTEN_AUDIO`, `EXPORT_REPORT`, `UPDATE_SETTINGS`...).
- **Phần tử**: `id`, `action`, `resourceName`, `resourceId`, `ipAddress`, `userAgent`, `actionDetails`, `createdAt`, cùng ý nghĩa với `GET /admin/audit-logs` (`docs/modules/07_system_settings.md` mục 3.4); sắp `created_at` giảm dần; không phân trang.

### 3.5. Phiên đăng nhập của chính mình (`GET /api/v1/admin/auth/sessions`, `DELETE /api/v1/admin/auth/sessions/:id`)

- Giống bản User (`docs/modules/08_user_profile.md` mục 3.6), khác ở `AdminAuthGuard`, cookie `Path=/api/v1/admin/auth` và `actor_type = 'ADMIN'`. Thu hồi mọi phiên của Admin khác dùng `DELETE /api/v1/admin/admins/:id/sessions` (`docs/modules/04_auth_admin.md` mục 3.7).

---

## 4. Kiến trúc Backend NestJS (`backend/src/core`, `apps/*`)

Theo quy tắc `docs/00_overview_and_architecture.md` mục 5.1: nghiệp vụ và entity ở `core`, controller ở `apps/admin` / `apps/member`, job nền ở `apps/worker`; các phần `apps/*` không import lẫn nhau.

```
backend/src/
├── core/profile/                       <-- dùng chung với hồ sơ User (docs/modules/08_user_profile.md mục 4)
└── apps/admin/profile/
    ├── admin-profile.module.ts
    ├── admin-profile.controller.ts     <-- /api/v1/admin/profile* (gồm recent-activity đọc qua core/audit)
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
- Kế thừa bố cục thẻ từ `templates/admin/profile.html` nhưng áp dụng theme Quản trị:
  - Header: Huy hiệu vai trò hiển thị `roles.name` (seed: `ROOT_ADMIN` "Quản trị viên tối cao" màu vàng, `SYSTEM_ADMIN` "Quản trị viên hệ thống" màu xanh dương).
  - Tab 1: Thông tin liên lạc trực ban.
  - Tab 2: Bảo mật tài khoản & Đổi mật khẩu.
  - Tab 3: Nhật ký kiểm toán cá nhân (Bảng hiển thị IP đăng nhập, thiết bị và các thao tác gần đây).

---

## 6. Kịch bản kiểm thử (Test Plan for Agent)
1. **TC-AP-01**: Admin đổi mật khẩu thành chuỗi dưới 10 ký tự trả `400 VALIDATION_ERROR` với `errors.newPassword = ["Mật khẩu phải từ 10 ký tự trở lên"]`; chuỗi 73 byte UTF-8, chỉ 2 loại ký tự, trùng `currentPassword`, `confirmPassword` khác `newPassword`, thêm trường lạ đều trả `400` đúng khóa `errors`, không tăng `failed_login_count`.
2. **TC-AP-02**: Xem tab "Nhật ký kiểm toán cá nhân", xác nhận hiển thị đúng lịch sử đăng nhập vừa thực hiện kèm IP client.
3. **TC-AP-03**: `GET /api/v1/admin/profile` trả đủ 12 trường của mục 3.1, không có `permissions`, `password_hash`, `locked_until`; gửi `?x=1` trả `400`; gọi bằng token `PASSWORD_CHANGE_ONLY` trả `403 PASSWORD_CHANGE_REQUIRED`; Root Admin khóa tài khoản trong lúc Access Token còn hạn thì lần gọi kế tiếp trả `401 UNAUTHORIZED`.
4. **TC-AP-04**: `PUT /api/v1/admin/profile` với `{ "fullName": "  Nguyễn Văn A  " }` lưu `Nguyễn Văn A`, trả đủ 12 trường của mục 3.1, ghi một dòng `audit_logs` `ADMIN / UPDATE` với `changedFields = ["fullName"]`, header đổi tên ngay; gửi lại đúng giá trị đó trả `200` và không ghi thêm dòng audit; `{}`, `{ "fullName": "" }`, `{ "phoneNumber": "abc" }`, `{ "email": "x@evn.vn" }` đều trả `400 VALIDATION_ERROR`; `{ "phoneNumber": null }` xóa số.
5. **TC-AP-05**: Đăng nhập trên 2 trình duyệt (A có `rememberMe = true`). Ở A `PUT /api/v1/admin/profile/change-password` đúng: `200` `{ accessToken, expiresIn }`, `Set-Cookie` `Path=/api/v1/admin/auth` có `Max-Age` ≈ 7 ngày; `admins.must_change_password = 0`, `password_changed_at` mới; cả 2 phiên cũ `PASSWORD_CHANGED`, có đúng 1 phiên mới `remember_me = 1`; `audit_logs` `AUTH / PASSWORD_CHANGED` `revokedCount = 2`, `forced = false`. Refresh ở B trả `401`. Gọi bằng token `PASSWORD_CHANGE_ONLY` (Admin mới tạo): `200`, phiên mới `remember_me = 0`, `forced = true`, token mới gọi được `GET /admin/profile`. Sai `currentPassword` 5 lần: 5 lần `400` (`errors.currentPassword`), lần 6 `423 ACCOUNT_TEMPORARILY_LOCKED` có `errors.lockedUntil`, không có dòng audit nào.
