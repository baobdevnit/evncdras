# MODULE 08: HỒ SƠ & THIẾT LẬP CỦA NGƯỜI DÙNG THÀNH VIÊN (USER PROFILE & PREFERENCES)

## Đường dẫn tài liệu: `docs/modules/08_user_profile.md`

## Ánh xạ giao diện mẫu (chỉ khu vực Member): `templates/member/profile.html`, `templates/member/change-password.html`, `templates/member/user-settings.html` (+ `.css`, `.js`) (bản tương ứng cho khu vực Admin thuộc `docs/modules/09_admin_profile.md`)

---

## 1. Mục tiêu & Nghiệp vụ (Business Overview)

### 1.1. Bối cảnh nghiệp vụ

Người dùng thành viên thuộc các đơn vị EVN có nhu cầu cá nhân hóa trải nghiệm làm việc và bảo vệ an toàn thông tin tài khoản:

1. **Quản lý thông tin cá nhân**: Cập nhật họ tên hiển thị, số điện thoại liên lạc, ảnh đại diện (avatar). Các thông tin hành chính như Tên đăng nhập, Email EVN, Đơn vị tổ chức và Nhóm QLND do Quản trị viên chỉ định nên hiển thị ở chế độ Chỉ đọc (Read-only).
2. **Bảo mật & Đổi mật khẩu**: Tự thay đổi mật khẩu định kỳ, tuân thủ chính sách mật khẩu mạnh của EVN (tối thiểu 10 ký tự, có ít nhất 3 trong 4 loại: chữ hoa, chữ thường, chữ số, ký tự đặc biệt; hết hạn sau 90 ngày, theo `docs/01_database_schema.md` mục 6.1).
3. **Tùy chỉnh giao diện & Thiết lập cá nhân (Preferences)**:
   - Giao diện Sáng / Tối / Theo hệ thống (`theme`: `LIGHT`, `DARK`, `SYSTEM`; mặc định `SYSTEM`, theo `user_settings.theme`).
   - Trạng thái thanh Sidebar thu gọn hoặc mở rộng mặc định.
   - Số lượng bản ghi hiển thị trên mỗi trang (`itemsPerPage`: 10, 20, 50).
   - Bật/tắt nhận thông báo qua email và âm thanh chuông khi có sự cố mới.

---

## 2. Thiết kế Dữ liệu (Database Schema)

Bảng MariaDB: `users` và `user_settings`.

> DDL chuẩn của `user_settings` (mục 12) chỉ định nghĩa tại `docs/01_database_schema.md`. Module này không chép lại DDL để tránh lệch; khi sinh code, entity và migration lấy từ `01`.

---

## 3. Đặc tả API Contracts

### 3.1. `GET /api/v1/profile`

Cùng khung với bản Admin (`docs/modules/09_admin_profile.md` mục 3.1); mục này ghi đủ cho bản User. Điểm khác bản Admin: kiểm tra nhóm, `roleCode` theo claim của Access Token, response có `jobTitle`, `userGroup`, `organization`, bị chế độ bảo trì chặn.

- **Guard**: `UserAuthGuard`; không cần mã quyền (không qua `PermissionsGuard`). Token `PASSWORD_CHANGE_ONLY` trả `403 PASSWORD_CHANGE_REQUIRED` (`docs/01_database_schema.md` mục 6.1). **Bị** chế độ bảo trì chặn: `503 MAINTENANCE` (`docs/02_api_contracts.md` mục 1.2; không thuộc danh sách miễn `/auth/me`, `/auth/refresh`, `/auth/logout`). Thứ tự: guard (`401`/`403`) → bảo trì (`503`) → kiểm tra query (`400`) → xử lý.
- **Request**: header `Authorization: Bearer <accessToken>`; không có query, không có body. Gửi query param bất kỳ trả `400 VALIDATION_ERROR`.
- **Xử lý** (chỉ đọc, không ghi CSDL, không ghi `audit_logs`):
  1. Đọc `users` theo khóa chính `id = sub` của Access Token, join `user_groups` theo khóa chính `users.user_group_id`, left join `organizations` theo khóa chính `user_groups.organization_id` (đọc thường, không khóa).
  2. **Kiểm tra tài khoản ở mỗi request** (cùng quy tắc `GET /api/v1/auth/me`, `docs/modules/03_auth_user.md` mục 3.2 bước 2): không thấy dòng, `users.status` khác `ACTIVE`, `user_groups.status = 'INACTIVE'` (chốt phòng vệ) hoặc `must_change_password = 1` (token đầy đủ) → `401 UNAUTHORIZED`, không xóa cookie.
  3. **Vai trò** (chủ dự án chốt ở U05): `roleCode` = claim `roleCode` của Access Token, **không** đọc `user_roles`; `roleName` = `roles.name` của vai trò có `code` đó (như `/auth/me` bước 3). Lý do: hồ sơ, header và menu (đều từ `/auth/me`) luôn hiện cùng một vai trò với `PermissionsGuard`; vai trò vừa đổi qua `PUT /users/:id/role` hiện từ lần refresh kế tiếp (tối đa `security_access_token_minutes`).
- **Response** `200`: hồ sơ để hiển thị và làm giá trị ban đầu cho form `PUT` (mục 3.2); `PUT /profile` và `POST /profile/avatar` trả `data` đúng 15 trường này. Không có `permissions`, `allowRecordingAccess` (quyền và cờ nhóm chỉ lấy từ store `authUser.user`, nạp từ đăng nhập hoặc `/auth/me`).

| Trường | Nguồn | Ghi chú |
|---|---|---|
| `id` | `users.id` | |
| `username` | `users.username` | Chỉ đọc (bất biến, `docs/01_database_schema.md` mục 6) |
| `email` | `users.email` | Chỉ đọc (bất biến) |
| `fullName` | `users.full_name` | Sửa qua mục 3.2 |
| `jobTitle` | `users.job_title` | `null` khi chưa có; chỉ đọc ở hồ sơ (Quản trị viên nhóm/Admin sửa qua `PUT /users/:id`) |
| `phoneNumber` | `users.phone_number` | `null` khi chưa nhập; sửa qua mục 3.2 |
| `avatarUrl` | `users.avatar_url` | `null` khi chưa tải ảnh (frontend dựng ảnh chữ cái đầu từ `fullName`); đổi qua mục 3.3 |
| `status` | `users.status` | Luôn `ACTIVE` (tài khoản khác `ACTIVE` nhận `401`) |
| `userGroup` | `{ id, code, name }` từ `user_groups` | Nhóm QLND, chỉ đọc (`user_group_id` bất biến) |
| `organization` | `{ id, code, name }` từ `organizations` qua `user_groups.organization_id` | `null` khi nhóm độc lập (`organization_id IS NULL`); đơn vị `INACTIVE` vẫn trả bình thường |
| `roleCode`, `roleName` | Claim `roleCode`, `roles.name` (bước 3) | Huy hiệu vai trò (mục 5.1) |
| `lastLoginAt` | `users.last_login_at` | |
| `passwordChangedAt` | `users.password_changed_at` | `null` khi chưa từng đổi |
| `createdAt` | `users.created_at` | |

Không trả `password_hash`, `must_change_password`, `failed_login_count`, `locked_until`, `updated_at`, `user_group_id` riêng lẻ. Thời gian theo ISO 8601 `+07:00` (`docs/02_api_contracts.md` mục 2).

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy hồ sơ thành công",
  "data": {
    "id": 10,
    "username": "cdr.evnit",
    "email": "cdr.evnit@evn.com.vn",
    "fullName": "Trần Thị B",
    "jobTitle": "Trưởng nhóm Kỹ thuật Vận hành",
    "phoneNumber": "0912345678",
    "avatarUrl": "/media/avatars/8a1d2c3e-5b6f-4a7d-9e0f-1b2c3d4e5f60.jpg",
    "status": "ACTIVE",
    "userGroup": {
      "id": 1,
      "code": "UMO-IT",
      "name": "Nhóm QLND Khối CNTT"
    },
    "organization": {
      "id": 2,
      "code": "IT-01",
      "name": "Khối CNTT"
    },
    "roleCode": "GROUP_ADMIN",
    "roleName": "Quản trị viên nhóm",
    "lastLoginAt": "2026-10-26T08:05:00+07:00",
    "passwordChangedAt": "2026-10-01T14:30:00+07:00",
    "createdAt": "2026-09-15T09:00:00+07:00"
  },
  "timestamp": "2026-10-26T09:31:00+07:00"
}
```

- **Lỗi**:

| HTTP | `errorCode` | Khi nào |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Có query param |
| `401` | `UNAUTHORIZED` | Access Token thiếu, sai, hết hạn hoặc của cổng Admin (guard); kiểm tra tài khoản không qua (bước 2) |
| `403` | `PASSWORD_CHANGE_REQUIRED` | Gọi bằng token `PASSWORD_CHANGE_ONLY` |
| `503` | `MAINTENANCE` | Đang bật `system_maintenance_mode` (`errors = null`) |

- **Frontend** (`UserProfileView`): gọi mỗi lần vào màn hình qua API client cổng Member (`window.memberSession.request`: `401` → refresh một lần rồi gửi lại; `503` → biểu ngữ bảo trì, không refresh). Phần đầu thẻ hiển thị `avatarUrl`, `fullName`, huy hiệu `roleName`, `email`; khối thông tin tài khoản hiển thị `lastLoginAt`, `passwordChangedAt` (`null` → "Chưa đổi"), `createdAt` do frontend tự định dạng; form điền `fullName`, `phoneNumber` (sửa được), `username`, `email`, `jobTitle` (`null` → "—"), `userGroup.name` (kèm `code`), `organization.name` (`null` → "Nhóm độc lập"), `roleName` (chỉ đọc). Lỗi tải (kể cả `503`) thì hiện thông báo và nút thử lại, không hiện dữ liệu mẫu. Mẫu: `templates/member/profile.js` (`mockGetUserProfile`, `loadProfile`).
- Index phục vụ: khóa chính `users`, `user_groups`, `organizations`; `uniq_roles_code` (nếu không nạp sẵn `roles`).

### 3.2. `PUT /api/v1/profile`

Cùng khung với bản Admin (`docs/modules/09_admin_profile.md` mục 3.2: cập nhật một phần, không đổi gì thì không ghi); mục này ghi đủ cho bản User. Điểm khác bản Admin: kiểm tra nhóm, bị chế độ bảo trì chặn, bảng `users`, response 15 trường của mục 3.1, header `MemberLayout` cập nhật qua `memberSession.updateAccount`.

- **Guard**: `UserAuthGuard`; không cần mã quyền. Token `PASSWORD_CHANGE_ONLY` trả `403 PASSWORD_CHANGE_REQUIRED`. **Bị** chế độ bảo trì chặn (`503 MAINTENANCE`, như mục 3.1). Thứ tự: guard (`401`/`403`) → bảo trì (`503`) → kiểm tra query, body (`400`) → xử lý. Không có query (có thì `400`).
- **Body** (`application/json`, cập nhật một phần, **ít nhất một trường**):

| Trường | Kiểu | Bắt buộc | Quy tắc | Cột đích |
|---|---|---|---|---|
| `fullName` | string | Không | Cắt khoảng trắng hai đầu; sau khi cắt dài 1–150 ký tự; `null` hoặc chuỗi rỗng trả `400` | `users.full_name` |
| `phoneNumber` | string \| null | Không | Cắt khoảng trắng hai đầu; `null` hoặc chuỗi rỗng sau khi cắt = xóa số (`NULL`); còn lại theo quy tắc số điện thoại `docs/02_api_contracts.md` mục 2 (≤ 30 ký tự, chỉ chữ số, khoảng trắng, `+ - . ( )`, có ít nhất một chữ số) | `users.phone_number` |

  Body rỗng `{}` trả `400` (`errors` có khóa `fullName` và `phoneNumber`, thông điệp "Cần gửi ít nhất một trường"). Mọi trường khác trả `400`, `errors` theo tên trường đó: `username`, `email` bất biến (`docs/01_database_schema.md` mục 6); `jobTitle` chỉ Quản trị viên nhóm/Admin sửa qua `PUT /users/:id`; `roleCode` chỉ đổi qua `PUT /users/:id/role`; `userGroupId`/`userGroup` bất biến; `avatarUrl` chỉ đổi qua mục 3.3; `status`, `password`… không bao giờ nhận ở đây.
- **Xử lý** (một transaction):
  1. Validate query, body như bảng trên (lỗi trả `400`, không đọc CSDL).
  2. `SELECT ... FROM users WHERE id = sub FOR UPDATE` (chỉ khóa dòng `users`, không khóa `user_groups`), rồi đọc `user_groups.status` theo khóa chính `users.user_group_id`. **Kiểm tra tài khoản** như mục 3.1 bước 2: không thấy dòng, `status` khác `ACTIVE`, nhóm `INACTIVE` hoặc `must_change_password = 1` → `401 UNAUTHORIZED` (rollback, không ghi gì).
  3. So từng trường đã gửi (sau chuẩn hóa) với giá trị hiện tại, so chính xác (phân biệt hoa thường); `changedFields` = các trường khác giá trị, theo thứ tự `fullName`, `phoneNumber`.
  4. `changedFields` rỗng: không `UPDATE`, không ghi `audit_logs`, trả `200` như bước 6.
  5. Ngược lại: `UPDATE users` chỉ các cột đổi; ghi `audit_logs` `actor_type = 'USER'`, `actor_id = sub`, `actor_name` = `full_name` sau khi sửa, `resource_name = 'USER'`, `action = 'UPDATE'`, `resource_id` = id người gọi, `ip_address`, `user_agent` của request, `action_details = { "changedFields": [...] }` (không ghi giá trị cũ/mới). Không thu hồi phiên, không gửi thông báo.
  6. Trả `200`, `data` = hồ sơ sau khi sửa, **đúng 15 trường** của mục 3.1 (đọc lại cùng transaction; `roleCode` theo claim như mục 3.1 bước 3).
- **Ví dụ**:

```http
PUT /api/v1/profile
Authorization: Bearer <access_token>
Content-Type: application/json

{ "fullName": "Trần Thị Bích", "phoneNumber": null }
```

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Cập nhật hồ sơ thành công",
  "data": {
    "id": 10,
    "username": "cdr.evnit",
    "email": "cdr.evnit@evn.com.vn",
    "fullName": "Trần Thị Bích",
    "jobTitle": "Trưởng nhóm Kỹ thuật Vận hành",
    "phoneNumber": null,
    "avatarUrl": "/media/avatars/8a1d2c3e-5b6f-4a7d-9e0f-1b2c3d4e5f60.jpg",
    "status": "ACTIVE",
    "userGroup": { "id": 1, "code": "UMO-IT", "name": "Nhóm QLND Khối CNTT" },
    "organization": { "id": 2, "code": "IT-01", "name": "Khối CNTT" },
    "roleCode": "GROUP_ADMIN",
    "roleName": "Quản trị viên nhóm",
    "lastLoginAt": "2026-10-26T08:05:00+07:00",
    "passwordChangedAt": "2026-10-01T14:30:00+07:00",
    "createdAt": "2026-09-15T09:00:00+07:00"
  },
  "timestamp": "2026-10-26T09:40:00+07:00"
}
```

```json
{
  "success": false,
  "statusCode": 400,
  "errorCode": "VALIDATION_ERROR",
  "message": "Dữ liệu không hợp lệ",
  "errors": { "jobTitle": ["Trường không được nhận"] },
  "timestamp": "2026-10-26T09:40:00+07:00"
}
```

- **Lỗi**:

| HTTP | `errorCode` | Khi nào |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Body rỗng, sai kiểu, `fullName` rỗng/quá 150 ký tự, `phoneNumber` sai định dạng/quá 30 ký tự, có trường không được nhận, có query param |
| `401` | `UNAUTHORIZED` | Access Token thiếu, sai, hết hạn hoặc của cổng Admin (guard); kiểm tra tài khoản không qua (bước 2) |
| `403` | `PASSWORD_CHANGE_REQUIRED` | Gọi bằng token `PASSWORD_CHANGE_ONLY` |
| `503` | `MAINTENANCE` | Đang bật `system_maintenance_mode` (`errors = null`) |

- **Frontend** (`UserProfileView`, form "Thông tin cá nhân"): giá trị ban đầu lấy từ `GET` (mục 3.1); gửi `fullName`, `phoneNumber` (ô trống → `null`) qua `window.memberSession.request` (`401` → refresh một lần rồi gửi lại; `503` → biểu ngữ bảo trì), kiểm tra trước ở client cùng quy tắc của bảng body. Đang gửi thì khóa nút "Lưu thay đổi". Thành công: thay hồ sơ bằng `data`, điền lại form, cập nhật `fullName` của `authUser.user` để header `MemberLayout` đổi theo ngay (không gọi lại `/auth/me`). `400` thì hiện `errors[field]` dưới ô tương ứng (khóa không ứng với ô nào thì hiện ở toast); `503` và lỗi khác hiện toast, giữ nguyên giá trị đang nhập. Nút "Khôi phục" điền lại giá trị của lần tải/lưu gần nhất, không gọi API. Mẫu: `templates/member/profile.js` (`normalizeProfileBody`, `mockPutUserProfile`), `window.memberSession.updateAccount` trong `templates/member/main.js`.
- Index phục vụ: khóa chính `users`, `user_groups`, `organizations`; `uniq_roles_code` (nếu không nạp sẵn `roles`).

### 3.3. `POST /api/v1/profile/avatar`

Body, lưu trữ (`AVATAR_STORAGE_DIR`, `/media/avatars/<uuid>.<png|jpg>`, Nginx phục vụ), quy tắc file và xử lý ảnh theo đặc tả chung `docs/modules/09_admin_profile.md` mục 3.2.1; mục này ghi đủ các bước cho bản User. Đây là cách **duy nhất** đổi ảnh đại diện (`PUT /profile` có `avatarUrl` trả `400`, `PUT /users/:id` không nhận `avatarUrl`); chưa có API gỡ ảnh về `null`. Điểm khác bản Admin: bị chế độ bảo trì chặn, kiểm tra nhóm, bảng `users`, response 15 trường của mục 3.1, header `MemberLayout` cập nhật qua `memberSession.updateAccount`.

- **Guard**: `UserAuthGuard`; không cần mã quyền. Token `PASSWORD_CHANGE_ONLY` trả `403 PASSWORD_CHANGE_REQUIRED`. **Bị** chế độ bảo trì chặn (`503 MAINTENANCE`, như mục 3.1; không thuộc danh sách miễn `docs/02_api_contracts.md` mục 1.2). Thứ tự: guard (`401`/`403`) → bảo trì (`503`) → kiểm tra query, multipart (`400`) → xử lý. Kiểm tra bảo trì là guard nên chạy **trước** `FileInterceptor` (`multer`): request `503` không được phân tích multipart, không ghi file tạm. Không có query (có thì `400`).
- **Body** (`multipart/form-data`, đúng **một** phần `file`, không có trường văn bản nào khác): như bảng body của `docs/modules/09_admin_profile.md` mục 3.2.1 (≤ 2 097 152 byte, PNG/JPEG theo magic bytes, giải mã được, ≤ 25 000 000 điểm ảnh; `multer` `limits = { fileSize: 2097152, files: 1, fields: 0 }`, lỗi `LIMIT_*` đổi thành `400`). Lỗi trả `400 VALIDATION_ERROR`, `errors` theo tên phần (`errors.file`; trường lạ `{ "<tên>": ["Trường không được nhận"] }`).
- **Xử lý** (theo thứ tự):
  1. Validate query, multipart (lỗi trả `400`, không đọc CSDL, không ghi file).
  2. Xử lý ảnh trong bộ nhớ bằng `sharp` như bản Admin (bước 2: xoay theo EXIF, cắt vuông 256×256 `fit: 'cover'`, mã hóa lại cùng định dạng, bỏ toàn bộ metadata; lỗi giải mã `400` `errors.file`).
  3. Ghi `.<uuid>.tmp` vào `AVATAR_STORAGE_DIR` rồi `rename` sang `<uuid>.<png|jpg>` (bản Admin bước 3).
  4. Một transaction: `SELECT ... FROM users WHERE id = sub FOR UPDATE` (chỉ khóa dòng `users`, không khóa `user_groups`), rồi đọc `user_groups.status` theo khóa chính `users.user_group_id`. **Kiểm tra tài khoản** như mục 3.1 bước 2: không thấy dòng, `status` khác `ACTIVE`, nhóm `INACTIVE` (chốt phòng vệ) hoặc `must_change_password = 1` → rollback, xóa file vừa ghi, `401 UNAUTHORIZED` (không ghi gì). Ngược lại giữ `avatar_url` cũ, `UPDATE users SET avatar_url = '/media/avatars/<tên file mới>'`; ghi `audit_logs` `actor_type = 'USER'`, `actor_id = sub`, `actor_name` = `full_name`, `resource_name = 'USER'`, `action = 'UPDATE'`, `resource_id` = id người gọi, `ip_address`, `user_agent` của request, `action_details = { "changedFields": ["avatarUrl"] }` (luôn ghi, tên file luôn mới; không ghi đường dẫn cũ/mới); đọc lại hồ sơ đủ 15 trường của mục 3.1 (`roleCode` theo claim như mục 3.1 bước 3); commit. Lỗi bất kỳ trước commit thì xóa file vừa ghi.
  5. Sau commit: `avatar_url` cũ khớp `^/media/avatars/[0-9a-f-]{36}\.(png|jpg)$` thì xóa file đó (bỏ qua nếu không còn; lỗi xóa chỉ ghi log). Giá trị cũ khác mẫu thì không xóa gì.
  6. Trả `200`, `message` "Cập nhật ảnh đại diện thành công", `data` = hồ sơ sau khi đổi, **đúng 15 trường** của mục 3.1. Không thu hồi phiên, không gửi thông báo.
- **Ví dụ**: request như `docs/modules/09_admin_profile.md` mục 3.2.1, đổi đường dẫn thành `POST /api/v1/profile/avatar`; response `200` như ví dụ của mục 3.2 với `avatarUrl` mới (vd. `"/media/avatars/3f2b8c1e-9d4a-4f6b-8e21-7c5d0a9b1e44.jpg"`), `message` "Cập nhật ảnh đại diện thành công"; lỗi `400` `{ "file": ["Ảnh tối đa 2 MB"] }`.
- **Lỗi**:

| HTTP | `errorCode` | Khi nào |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Không phải multipart, thiếu `file`, hơn một file, có trường khác, quá 2 MB, không phải PNG/JPEG theo magic bytes, không giải mã được, quá 25 000 000 điểm ảnh, có query param |
| `401` | `UNAUTHORIZED` | Access Token thiếu, sai, hết hạn hoặc của cổng Admin (guard); kiểm tra tài khoản không qua (bước 4) |
| `403` | `PASSWORD_CHANGE_REQUIRED` | Gọi bằng token `PASSWORD_CHANGE_ONLY` |
| `503` | `MAINTENANCE` | Đang bật `system_maintenance_mode` (`errors = null`; không phân tích multipart, không ghi file) |

- **Frontend** (`UserProfileView`, nút `.btn-change-avatar` trên ảnh): như bản Admin (`docs/modules/09_admin_profile.md` mục 3.2.1): hộp chọn file `accept="image/png,image/jpeg"`, kiểm tra trước ở client (`file.type`, `file.size` ≤ 2 MB; sai thì toast, không gọi API), gửi `FormData` đúng một phần `file` qua `window.memberSession.request` (`401` → refresh một lần rồi gửi lại cùng `FormData`; `503` → biểu ngữ bảo trì; không tự đặt `Content-Type`). Đang tải thì khóa nút, hiện trạng thái tải trên ảnh (`.profile-avatar-wrapper.is-uploading`), **không** hiện ảnh xem trước cục bộ như đã lưu. Thành công: thay hồ sơ bằng `data`, đổi ảnh ở thẻ hồ sơ, `memberSession.updateAccount({ avatarUrl })` để header `MemberLayout` đổi ngay (không gọi lại `/auth/me`), toast `message`; form "Thông tin cá nhân" đang sửa dở **không** bị điền lại. `400` hiện mọi thông điệp trong `errors` ở toast; `503` toast cảnh báo; lỗi khác toast lỗi; mọi lỗi giữ ảnh cũ. Luôn xóa giá trị ô file sau mỗi lần chọn. Mẫu: `templates/member/profile.js` (`checkAvatarFile`, `mockPostUserAvatar`), `window.memberSession.updateAccount` trong `templates/member/main.js`.
- Index phục vụ: khóa chính `users`, `user_groups`, `organizations`; `uniq_roles_code` (nếu không nạp sẵn `roles`).

### 3.4. `PUT /api/v1/profile/change-password`

Body, chính sách mật khẩu, response và lỗi theo đặc tả chung `docs/modules/09_admin_profile.md` mục 3.3; mục này ghi đủ các bước cho bản User. Điểm khác bản Admin: bị chế độ bảo trì chặn, kiểm tra nhóm, claim `userGroupId`, cookie `Path=/api/v1/auth`.

- **Guard**: `UserAuthGuard` (verify bằng `JWT_USER_SECRET`), nhận cả token `PASSWORD_CHANGE_ONLY`; không cần mã quyền. **Bị** chế độ bảo trì chặn: `503 MAINTENANCE` (`docs/02_api_contracts.md` mục 1.2; không thuộc danh sách miễn `/auth/me`, `/auth/refresh`, `/auth/logout`), kể cả khi gọi bằng token `PASSWORD_CHANGE_ONLY` (đang bảo trì thì đăng nhập cũng `503`, người dùng đổi mật khẩu sau khi hết bảo trì; đăng xuất vẫn dùng được). Thứ tự: guard (`401`) → bảo trì (`503`, không đọc body, không tăng bộ đếm sai) → kiểm tra query, body (`400`) → xử lý. Không có query (có thì `400`). Cookie Refresh Token (`Path=/api/v1/auth`) không được gửi kèm vì route nằm ngoài `Path`; phiên hiện tại xác định bằng claim `sid`.
- **Body**: đúng 3 trường `currentPassword`, `newPassword`, `confirmPassword`, quy tắc như bảng body của `docs/modules/09_admin_profile.md` mục 3.3 (10 ký tự – 72 byte UTF-8, 3/4 loại ký tự, khác `currentPassword`, `confirmPassword` trùng `newPassword`; không cắt khoảng trắng; trường khác `400`). Bước này không đọc CSDL.
- **Xử lý** (một transaction, theo thứ tự):
  1. Validate query, body.
  2. `SELECT ... FROM users WHERE id = sub FOR UPDATE` (chỉ khóa dòng `users`, không khóa `user_groups`), rồi đọc `user_groups.status` theo khóa chính `users.user_group_id`. **Kiểm tra tài khoản** như `docs/modules/03_auth_user.md` mục 3.2 bước 2: không thấy dòng, `status` khác `ACTIVE`, nhóm `INACTIVE` (chốt phòng vệ) hoặc token đầy đủ mà `must_change_password = 1` → `401 UNAUTHORIZED` (rollback, không ghi gì, không tăng bộ đếm). Token `PASSWORD_CHANGE_ONLY` với `must_change_password = 1` là bình thường. Không trả `403 GROUP_INACTIVE` (mã đó chỉ dùng ở đăng nhập).
  3. `locked_until > NOW()`: `423 ACCOUNT_TEMPORARILY_LOCKED`, `errors = { "lockedUntil": "<ISO 8601>" }`; không so mật khẩu, không tăng bộ đếm.
  4. `bcrypt.compare(currentPassword, password_hash)` sai: tăng bộ đếm bằng đúng câu `UPDATE users` nguyên tử của đăng nhập (`docs/01_database_schema.md` mục 6.1; đạt `security_login_max_failed` thì đặt `locked_until`, bộ đếm về 0), **commit** câu này rồi trả `400 VALIDATION_ERROR` `errors = { "currentPassword": ["Mật khẩu hiện tại không đúng"] }`. Không ghi `audit_logs`, không thu hồi phiên.
  5. Đúng: `UPDATE users SET password_hash = bcrypt(newPassword, 10), password_changed_at = NOW(), must_change_password = 0, failed_login_count = 0, locked_until = NULL`.
  6. `remember_me` của phiên mới = `remember_me` của phiên `id = sid`, `actor_type = 'USER'`, `actor_id = sub` (đọc trước khi thu hồi, không xét còn hiệu lực); token `PASSWORD_CHANGE_ONLY` (không có `sid`) thì `0`.
  7. `UPDATE auth_sessions SET revoked_at = NOW(), revoked_reason = 'PASSWORD_CHANGED' WHERE actor_type = 'USER' AND actor_id = sub AND revoked_at IS NULL` (kể cả phiên đang dùng), `n` = số dòng bị ảnh hưởng.
  8. Tạo đúng một phiên mới `actor_type = 'USER'`, `actor_id = sub`: `refresh_token_hash` của Refresh Token mới, `ip_address`/`user_agent` của request, `remember_me` của bước 6, `logged_in_at = NOW()`, `expires_at = NOW() + security_refresh_token_days`, `last_used_at = NULL`.
  9. Ghi `audit_logs` `AUTH / PASSWORD_CHANGED`: `actor_type = 'USER'`, `actor_id = sub`, `actor_name` = `full_name`, `resource_id` = id người gọi, `ip_address`, `user_agent` của request, `action_details = { "revokedCount": n, "forced": true|false }` (`forced` = gọi bằng token `PASSWORD_CHANGE_ONLY`). Không ghi mật khẩu hay bản băm.
  10. Commit; ký Access Token **đầy đủ** (không có `scope`) bằng `JWT_USER_SECRET`, mang `sub`, `userGroupId` (= `users.user_group_id` đọc ở bước 2), `roleCode` (đọc lại từ `user_roles`, như refresh), `sid` = id phiên mới; trả `200` `data = { accessToken, expiresIn }` kèm `Set-Cookie` Refresh Token mới (`HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth`, `Max-Age` = số giây còn lại tới `expires_at` khi `remember_me = 1`, không có `Max-Age` khi `0`).

  Không gửi thông báo, không ngắt Socket.IO; thiết bị khác giữ Access Token cũ tối đa `security_access_token_minutes` phút rồi bị đưa về đăng nhập ở lần refresh kế tiếp.
- **Ví dụ**: request/response như `docs/modules/09_admin_profile.md` mục 3.3, đổi đường dẫn thành `PUT /api/v1/profile/change-password`.
- **Lỗi**:

| HTTP | `errorCode` | Khi nào |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Body sai, có query param; `currentPassword` sai (bước 4, có tăng bộ đếm) |
| `401` | `UNAUTHORIZED` | Access Token thiếu, sai, hết hạn hoặc của cổng Admin (guard); kiểm tra tài khoản không qua (bước 2) |
| `423` | `ACCOUNT_TEMPORARILY_LOCKED` | `locked_until > NOW()` (bước 3), `errors.lockedUntil` |
| `503` | `MAINTENANCE` | Đang bật `system_maintenance_mode` (`errors = null`) |

  Không có `403 PASSWORD_CHANGE_REQUIRED` (route nhận token giới hạn).
- **Frontend** (`ChangePasswordView`, mục 5): như bản Admin (`docs/modules/09_admin_profile.md` mục 3.3), gửi qua `window.memberSession.request` (`401` → refresh một lần rồi gửi lại; token `PASSWORD_CHANGE_ONLY` không có cookie nên refresh `401` và về `member.login`). Thẻ tài khoản đọc `fullName`, `roleName`, `userGroup.name`, `email` từ store `authUser.user` (`memberSession.getAccount`), không cứng chữ. Thành công: `memberSession.setAccessToken(data.accessToken)` (thay token cũ, kể cả token giới hạn), xóa form; chế độ bị buộc đổi vào `member.dashboard`, chế độ thường ở lại trang và báo toast "Đã đổi mật khẩu. Các thiết bị khác đã bị đăng xuất." `400` hiện `errors[field]` dưới ô (sai `currentPassword` thì xóa ô đó); `423` hiện ở hộp lỗi chung của form; `503` hiện ở hộp lỗi chung dạng cảnh báo (vàng) và biểu ngữ bảo trì do `request()` phát sự kiện `member-maintenance`, giữ nguyên giá trị đang nhập. Chế độ bị buộc đổi (`member.change-password` khi store giữ token giới hạn; mẫu tĩnh `?forced=1`, `login.js` chuyển tới khi `mustChangePassword`): bố cục riêng không sidebar/menu (`body.forced-mode`), có banner giải thích và nút "Đăng xuất" (`memberSession.logout`). Mẫu: `templates/member/change-password.{html,css,js}` (`validate`, `mockChangeUserPassword`).
- Index phục vụ: khóa chính `users`, `user_groups`, `user_roles` (PK `user_id`), `auth_sessions` (đọc phiên theo `sid`); `idx_session_actor` (thu hồi mọi phiên); `uniq_session_token` (chèn phiên mới).

### 3.5. `GET /api/v1/profile/preferences` & `PUT /api/v1/profile/preferences`

- Lấy và lưu thiết lập: `theme`, `isSidebarCollapsed`, `itemsPerPage`, `emailNotificationEnabled`, `soundAlertEnabled`.
- `itemsPerPage` chỉ nhận `10`, `20`, `50` (mục 1.1, khớp `limit` của `GET /cdr`); `theme` chỉ nhận `LIGHT`, `DARK`, `SYSTEM`; giá trị khác trả `400`. `PUT` không ghi `audit_logs`.
- **Chế độ bảo trì**: cả hai API **bị** chặn (`503 MAINTENANCE`; không thuộc danh sách miễn `/auth/me`, `/auth/refresh`, `/auth/logout` của `docs/02_api_contracts.md` mục 1.2). Vào cổng lúc bảo trì vẫn dùng được giao diện: frontend dùng `memberTheme` đã cache và giá trị mặc định (mục 3.5.1).

#### 3.5.1. `GET /api/v1/profile/preferences`

Cùng khung với bản Admin (`docs/modules/09_admin_profile.md` mục 3.6: không chèn dòng khi thiếu, `itemsPerPage` ngoài 10/20/50 trả `10`, `tinyint(1)` trả boolean, nạp một lần khi vào cổng, cache `theme`); mục này ghi đủ các bước cho bản User. Điểm khác bản Admin: bị chế độ bảo trì chặn, kiểm tra tài khoản bản User (nhóm, `must_change_password`), `user_type = 'USER'`, **không** có `dashboardWidgets` (bỏ qua `custom_preferences`), store `preferencesUser`, khóa `localStorage` `memberTheme`, mẫu `templates/member/user-settings.*`.

- **Guard**: `UserAuthGuard`; không cần mã quyền. Token `PASSWORD_CHANGE_ONLY` trả `403 PASSWORD_CHANGE_REQUIRED`. **Bị** chế độ bảo trì chặn (`503 MAINTENANCE`). Thứ tự: guard (`401`/`403`) → bảo trì (`503`) → kiểm tra query (`400`) → xử lý.
- **Request**: không có query, không có body. Gửi query param bất kỳ trả `400 VALIDATION_ERROR`.
- **Xử lý** (chỉ đọc, không ghi CSDL, không ghi `audit_logs`):
  1. Đọc `users` theo khóa chính `id = sub`, join `user_groups` theo khóa chính `users.user_group_id` (đọc thường, không khóa). **Kiểm tra tài khoản ở mỗi request** (cùng quy tắc `GET /api/v1/auth/me`, `docs/modules/03_auth_user.md` mục 3.2 bước 2): không thấy dòng, `users.status` khác `ACTIVE`, `user_groups.status = 'INACTIVE'` (chốt phòng vệ) hoặc `must_change_password = 1` (token đầy đủ) → `401 UNAUTHORIZED`, không xóa cookie.
  2. Đọc `user_settings` theo `uniq_user_settings` (`user_type = 'USER'`, `user_id = sub`). **Không có dòng thì trả giá trị mặc định của DDL** (`docs/01_database_schema.md` mục 12) và **không** chèn dòng (chèn chỉ ở `PUT`, dạng upsert).
  3. `itemsPerPage`: giá trị lưu ngoài `10`/`20`/`50` (chỉ xảy ra khi sửa tay CSDL) trả `10`. `custom_preferences` của dòng `USER` không đọc, không trả (hiện không có khóa nào dành cho cổng User).
- **Response** `200`: `message` = "Lấy thiết lập thành công"; `data` đúng 5 trường:

| Trường | Kiểu | Nguồn | Mặc định (không có dòng) |
|---|---|---|---|
| `theme` | `LIGHT` \| `DARK` \| `SYSTEM` | `user_settings.theme` | `SYSTEM` |
| `isSidebarCollapsed` | boolean | `is_sidebar_collapsed` | `false` |
| `itemsPerPage` | `10` \| `20` \| `50` | `items_per_page` | `10` |
| `emailNotificationEnabled` | boolean | `email_notification_enabled` (email cho thông báo `CRITICAL`, `docs/01_database_schema.md` mục 10) | `true` |
| `soundAlertEnabled` | boolean | `sound_alert_enabled` (chuông khi nhận thông báo `CRITICAL` qua Socket.IO namespace `/notifications`, `docs/modules/06_notifications.md`) | `true` |

Không trả `id`, `user_type`, `user_id`, `custom_preferences`, `updated_at`, không có `dashboardWidgets`. Cột `tinyint(1)` trả boolean, không trả `0`/`1`.

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
    "soundAlertEnabled": false
  },
  "timestamp": "2026-11-05T09:00:00+07:00"
}
```

- **Lỗi**:

| HTTP | `errorCode` | Khi nào |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Có query param |
| `401` | `UNAUTHORIZED` | Access Token thiếu, sai, hết hạn hoặc của cổng Admin (guard); kiểm tra tài khoản không qua (bước 1) |
| `403` | `PASSWORD_CHANGE_REQUIRED` | Gọi bằng token `PASSWORD_CHANGE_ONLY` |
| `503` | `MAINTENANCE` | Đang bật `system_maintenance_mode` (`errors = null`) |

- **Frontend**: thiết lập dùng cho **toàn cổng Member**, nạp một lần khi vào cổng (cùng cách bản Admin):
  - Guard của khu vực Member, khi store `authUser` đã có `user` (sau đăng nhập hoặc sau `GET /api/v1/auth/me`, `docs/modules/03_auth_user.md` mục 3.2) mà store `preferencesUser` (`src/apps/member/stores/preferencesUser.store.ts`) còn trống, gọi API này qua `request()` của client cổng Member (`401` → refresh một lần rồi gửi lại; `503` → biểu ngữ bảo trì) và lưu `data` vào store. Store đã có dữ liệu thì không gọi lại; đăng xuất thì xóa store (giữ `memberTheme`). Token `PASSWORD_CHANGE_ONLY` không gọi (route bị buộc đổi mật khẩu dùng mặc định và `memberTheme` đã cache). Gọi lỗi (trừ `401`, kể cả `503`) **không chặn** vào cổng: dùng giá trị mặc định ở bảng trên, store vẫn trống để lần vào màn hình cài đặt gọi lại.
  - Áp dụng: `theme` → `LIGHT` gắn `data-theme="light"`, `DARK` gắn `data-theme="dark"`, `SYSTEM` bỏ thuộc tính để theo `prefers-color-scheme`; `isSidebarCollapsed` → trạng thái ban đầu của sidebar (nút thu gọn ở sidebar chỉ đổi tạm, không ghi storage, không lưu); `itemsPerPage` → `limit` mặc định của các bảng phân trang (đổi tạm ở từng màn hình không lưu); `soundAlertEnabled` → phát chuông khi nhận thông báo `CRITICAL`; `emailNotificationEnabled` chỉ hiển thị ở màn hình cài đặt.
  - Chống nháy giao diện (FOUC): sau khi nạp, ghi **riêng giá trị `theme`** vào `localStorage` khóa `memberTheme`; script đầu trang đọc khóa này trước khi Vue chạy (`SYSTEM` hoặc chưa có thì theo `prefers-color-scheme`). Không ghi trường khác, không dùng `sessionStorage`.
  - `AccountSettingsView` (`/account-settings`, mục 5.2) đọc từ store, không gọi lại API; store trống (lần nạp ở guard lỗi) thì gọi API, hiện trạng thái tải/lỗi kèm nút "Thử lại" (`503`: thông điệp bảo trì của API trong khối trạng thái, cùng biểu ngữ của `request()`; `401` sau refresh thất bại: `request()` đã về `member.login`). Màn hình chỉ có điều khiển cho đúng 5 trường của response. Mẫu: `templates/member/user-settings.js`, `window.memberSession.loadPreferences`/`getPreferences`/`hasPreferences`/`applyPreferences` trong `templates/member/main.js` (lưu: `savePreferences`, mục 3.5.2).
- Index phục vụ: khóa chính `users`, `user_groups`; `uniq_user_settings` (`user_type`, `user_id`). Không cần index khác.

#### 3.5.2. `PUT /api/v1/profile/preferences`

Cùng khung với bản Admin (`docs/modules/09_admin_profile.md` mục 3.7: cập nhật một phần, không `null`, không ép kiểu, upsert chỉ cột đã gửi, không ghi `audit_logs`, áp ngay lỗi thì hoàn tác); mục này ghi đủ các bước cho bản User. Điểm khác bản Admin: bị chế độ bảo trì chặn, kiểm tra tài khoản bản User (nhóm, `must_change_password`), `user_type = 'USER'`, **không** nhận `dashboardWidgets` và không đụng `custom_preferences`, store `preferencesUser`, khóa `localStorage` `memberTheme`, mẫu `templates/member/{main,user-settings}.js`.

- **Guard**: `UserAuthGuard`; không cần mã quyền. Token `PASSWORD_CHANGE_ONLY` trả `403 PASSWORD_CHANGE_REQUIRED`. **Bị** chế độ bảo trì chặn (`503 MAINTENANCE`, trả trước khi kiểm tra body). Thứ tự: guard (`401`/`403`) → bảo trì (`503`) → kiểm tra query/body (`400`) → kiểm tra tài khoản (`401`) → ghi.
- **Request**: không có query (có thì `400`). **Body** (`application/json`, cập nhật một phần, **ít nhất một trường**; trường không gửi giữ nguyên giá trị đã lưu, chưa có dòng thì giữ mặc định DDL). Không trường nào nhận `null`. Kiểu phải đúng JSON, không tự ép kiểu (`"20"`, `1`/`0`, `"true"` đều trả `400`):

| Trường | Kiểu | Quy tắc | Cột đích |
|---|---|---|---|
| `theme` | string | Đúng một trong `LIGHT`, `DARK`, `SYSTEM` (chữ hoa) | `user_settings.theme` |
| `isSidebarCollapsed` | boolean | `true` / `false` | `is_sidebar_collapsed` |
| `itemsPerPage` | integer | Đúng một trong `10`, `20`, `50` | `items_per_page` |
| `emailNotificationEnabled` | boolean | `true` / `false` | `email_notification_enabled` |
| `soundAlertEnabled` | boolean | `true` / `false` | `sound_alert_enabled` |

  Body rỗng `{}` trả `400` (`errors` có đủ 5 khóa trên, thông điệp "Cần gửi ít nhất một trường"). Mọi trường khác (`dashboardWidgets`, `customPreferences`, `id`, `userType`, `userId`, `updatedAt`…) trả `400`, `errors` theo tên trường đó ("Trường không được phép cập nhật").
- **Xử lý** (một transaction, **không** ghi `audit_logs`: thiết lập cá nhân, R24-04):
  1. Validate query/body như trên (lỗi trả `400`, không đọc CSDL).
  2. Đọc `users` theo khóa chính `id = sub`, join `user_groups` theo khóa chính (đọc thường, **không** khóa: API không sửa `users`). **Kiểm tra tài khoản ở mỗi request** như mục 3.5.1 bước 1: không thấy dòng, `users.status` khác `ACTIVE`, `user_groups.status = 'INACTIVE'` (chốt phòng vệ) hoặc `must_change_password = 1` (token đầy đủ) → `401 UNAUTHORIZED`, không xóa cookie, không ghi.
  3. Upsert một câu theo `uniq_user_settings`, chỉ các cột của trường đã gửi (cột không gửi khi chèn mới lấy mặc định DDL; `custom_preferences` không có trong câu lệnh nên dòng mới là `NULL`, dòng cũ giữ nguyên):
     ```sql
     INSERT INTO user_settings (user_type, user_id, <cột đã gửi>)
     VALUES ('USER', :sub, <giá trị>)
     ON DUPLICATE KEY UPDATE <cột đã gửi> = VALUES(<cột>);
     ```
  4. Không so sánh giá trị cũ: gửi lại đúng giá trị đang lưu vẫn trả `200`. Không thu hồi phiên, không gửi thông báo, không đẩy Socket.IO: tab/thiết bị khác của cùng user nhận giá trị mới ở lần vào cổng kế tiếp.
  5. Đọc lại dòng `user_settings` trong cùng transaction, chuẩn hóa như mục 3.5.1 bước 3, trả `200`, `data` = **đúng 5 trường** như response của mục 3.5.1.
- **Ví dụ**:

```http
PUT /api/v1/profile/preferences
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
    "soundAlertEnabled": false
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
  "errors": { "dashboardWidgets": ["Trường không được phép cập nhật"] },
  "timestamp": "2026-11-05T09:10:00+07:00"
}
```

- **Lỗi**:

| HTTP | `errorCode` | Khi nào |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Body rỗng, giá trị `null`, sai kiểu, `theme`/`itemsPerPage` ngoài tập cho phép, có trường không được nhận (kể cả `dashboardWidgets`), có query param |
| `401` | `UNAUTHORIZED` | Access Token thiếu, sai, hết hạn hoặc của cổng Admin (guard); kiểm tra tài khoản không qua (bước 2) |
| `403` | `PASSWORD_CHANGE_REQUIRED` | Gọi bằng token `PASSWORD_CHANGE_ONLY` |
| `503` | `MAINTENANCE` | Đang bật `system_maintenance_mode` (`errors = null`), kể cả khi body sai |

- **Frontend** (áp ngay, lỗi thì hoàn tác; không có nút "Lưu"; cùng cách bản Admin):
  - Mỗi lần đổi một điều khiển ở `AccountSettingsView` (mục 5.2), hoặc bấm nút Sáng/Tối ở header `MemberLayout`: chụp lại giá trị cũ, cập nhật store `preferencesUser` và áp lên giao diện ngay (`data-theme`, sidebar), rồi gửi `PUT` **chỉ trường vừa đổi** qua `request()` của client cổng Member (`401` → refresh một lần rồi gửi lại; `503` → biểu ngữ bảo trì). Lúc áp tạm **chưa** ghi cache `memberTheme`.
  - Đang gửi thì khóa điều khiển đó (nhóm chọn theme khóa cả 3 lựa chọn; nút header khóa nút). Thành công: thay store bằng `data`, áp lại, ghi cache `memberTheme` (chỉ `theme`), toast ngắn. Lỗi (trừ `401` đã chuyển về đăng nhập): trả **các trường của lần gửi đó** về giá trị cũ trong store và điều khiển, áp lại giao diện, toast `message` của lỗi (`400`: thông điệp đầu tiên của `errors`); `503` toast **cảnh báo** (vàng) kèm biểu ngữ bảo trì, các lỗi khác toast lỗi.
  - **Store trống** (lần nạp ở guard lỗi, vd. vào cổng lúc bảo trì; chỉ nút header gửi được vì màn hình cài đặt chưa hiện điều khiển): áp tạm trên nền mặc định DDL + `memberTheme` đã cache; thành công thì store = `data` (đủ 5 trường, coi như đã nạp); lỗi thì store **trở lại trống** (không giữ giá trị mặc định như dữ liệu đã nạp, để màn hình cài đặt vẫn gọi lại `GET`) và giao diện về theme đã cache, cache không đổi.
  - Nút thu gọn sidebar ở header **không** gọi API (chỉ thu gọn/mở tạm, mục 3.5.1); giá trị mặc định chỉ đổi ở màn hình cài đặt.
  - Mẫu: `window.memberSession.savePreferences` (mock `mockPutUserPreferences`) trong `templates/member/main.js`, hàm `change()` trong `templates/member/user-settings.js`; mock lỗi lưu: `?prefsSave=fail` (lỗi mạng lần đầu), `?prefsSave=503` (bảo trì bật sau khi đã nạp).
- Index phục vụ: khóa chính `users`, `user_groups`; `uniq_user_settings` (`user_type`, `user_id`) cho upsert. Không cần index khác.

### 3.6. Phiên đăng nhập của chính mình (`GET /api/v1/auth/sessions`, `DELETE /api/v1/auth/sessions/:id`)

- **Guard**: `UserAuthGuard` (không nhận token `PASSWORD_CHANGE_ONLY`). Chỉ thao tác trên phiên của chính người gọi (`actor_type = 'USER'`, `actor_id` = người gọi).
- **Phiên hiện tại**: xác định từ claim `sid` của Access Token, đi theo chuỗi `replaced_by_session_id` tới phiên còn hiệu lực, **không** từ cookie (đặc tả chung `docs/modules/09_admin_profile.md` mục 3.5).
- **Chế độ bảo trì**: cả hai API **bị** chặn (`503 MAINTENANCE`; không thuộc danh sách miễn `/auth/me`, `/auth/refresh`, `/auth/logout` của `docs/02_api_contracts.md` mục 1.2, dù cùng tiền tố `/auth`). Kết thúc phiên hiện tại lúc bảo trì vẫn dùng được `POST /auth/logout`.

#### 3.6.1. `GET /api/v1/auth/sessions`

Cùng khung với bản Admin (`docs/modules/09_admin_profile.md` mục 3.5.1: thứ tự sắp xếp, 7 trường response, ví dụ, index); mục này ghi đủ các bước cho bản User. Điểm khác bản Admin: bị chế độ bảo trì chặn, kiểm tra tài khoản bản User (nhóm, `must_change_password`), `actor_type = 'USER'`, khối giao diện ở `templates/member/profile.*`.

- **Guard**: `UserAuthGuard`; không cần mã quyền. Token `PASSWORD_CHANGE_ONLY` trả `403 PASSWORD_CHANGE_REQUIRED` (token này không có phiên). Cookie Refresh Token (`Path=/api/v1/auth`) được trình duyệt gửi kèm nhưng API **không** đọc. **Bị** chế độ bảo trì chặn (`503 MAINTENANCE`). Thứ tự: guard (`401`/`403`) → bảo trì (`503`) → kiểm tra query (`400`) → xử lý.
- **Request**: không có query, không có body. Gửi query param bất kỳ trả `400 VALIDATION_ERROR`.
- **Xử lý** (chỉ đọc, không ghi CSDL, không ghi `audit_logs`, không cập nhật `last_used_at`):
  1. Đọc `users` theo khóa chính `id = sub`, join `user_groups` theo khóa chính `users.user_group_id` (đọc thường, không khóa). **Kiểm tra tài khoản ở mỗi request** (cùng quy tắc `GET /api/v1/auth/me`, `docs/modules/03_auth_user.md` mục 3.2 bước 2): không thấy dòng, `users.status` khác `ACTIVE`, `user_groups.status = 'INACTIVE'` (chốt phòng vệ) hoặc `must_change_password = 1` (token đầy đủ) → `401 UNAUTHORIZED`, không xóa cookie.
  2. Xác định phiên hiện tại từ claim `sid` như trên: đọc phiên `id = sid` có `actor_type = 'USER'`, `actor_id = sub`; đã `ROTATED` thì đi chuỗi `replaced_by_session_id` tối đa 5 bước tới phiên còn hiệu lực; không tới được thì không có phiên hiện tại (mọi `isCurrent = false`).
  3. Đọc các phiên `actor_type = 'USER' AND actor_id = sub AND revoked_at IS NULL AND expires_at > NOW()` (`idx_session_actor`), sắp: phiên hiện tại đứng đầu, sau đó `COALESCE(last_used_at, created_at)` giảm dần, rồi `id` giảm dần. Không phân trang, không giới hạn số dòng.
- **Response** `200`: `message` = "Lấy danh sách phiên đăng nhập thành công"; `data` là **mảng** (không có khung phân trang), mỗi phần tử đúng 7 trường `id`, `ipAddress`, `userAgent`, `loggedInAt`, `lastActiveAt`, `expiresAt`, `isCurrent` với nguồn, kiểu, `null` và ví dụ như bảng của bản Admin. Không trả `actor_type`, `actor_id`, `refresh_token_hash`, `remember_me`, `revoked_*`, `replaced_by_session_id`. Danh sách rỗng chỉ xảy ra khi phiên hiện tại vừa bị thu hồi/hết hạn mà Access Token còn hạn.
- **Lỗi**:

| HTTP | `errorCode` | Khi nào |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Có query param |
| `401` | `UNAUTHORIZED` | Access Token thiếu, sai, hết hạn hoặc của cổng Admin (guard); kiểm tra tài khoản không qua (bước 1) |
| `403` | `PASSWORD_CHANGE_REQUIRED` | Gọi bằng token `PASSWORD_CHANGE_ONLY` |
| `503` | `MAINTENANCE` | Đang bật `system_maintenance_mode` (`errors = null`) |

- **Frontend** (`UserProfileView`, khối "Phiên đăng nhập của tôi" dưới form "Thông tin cá nhân", mục 5.1): gọi mỗi lần vào màn hình, **độc lập** với `GET /api/v1/profile` (lỗi khối này không ẩn hồ sơ và ngược lại), qua API client cổng Member (`window.memberSession.request`: `401` → refresh một lần rồi gửi lại; `503` → biểu ngữ bảo trì, không refresh). Trạng thái đang tải, lỗi + nút "Thử lại" (kể cả `503`: hiện thông điệp bảo trì của API), rỗng ("Không có phiên nào đang hoạt động"). Mỗi dòng: tên trình duyệt + hệ điều hành rút từ `userAgent` bằng hàm nội bộ (mẫu `describeUserAgent`, giống bản Admin; không nhận ra thì "Thiết bị không xác định", chuỗi gốc ở `title`), nhãn "Phiên này" khi `isCurrent`, `ipAddress` (`null` thì bỏ), "Đăng nhập" `loggedInAt`, "Hoạt động gần nhất" `lastActiveAt`, "Hết hạn" `expiresAt` (frontend định dạng giờ Việt Nam). Dựng bằng `textContent` (`userAgent`, `ipAddress` do client gửi lên). Không có nút "Đăng xuất khỏi tất cả thiết bị khác" (không có API). Mẫu: `templates/member/profile.js` (`mockGetMySessions`, `loadSessions`, `renderSessions`). Nút "Thu hồi" từng phiên: mục 3.6.2.
- Index phục vụ: khóa chính `users`, `user_groups`, `auth_sessions` (đi chuỗi `sid`); `idx_session_actor` (`actor_type`, `actor_id`, `revoked_at`), `expires_at` lọc trên các dòng đó; sắp xếp trong bộ nhớ trên vài dòng.

#### 3.6.2. `DELETE /api/v1/auth/sessions/:id`

Cùng khung với bản Admin (`docs/modules/09_admin_profile.md` mục 3.5.2: khóa và đi chuỗi `replaced_by_session_id`, xác định phiên hiện tại bằng đọc khóa sau khi khóa phiên đích, thứ tự khóa với `refresh`, ví dụ response); mục này ghi đủ các bước cho bản User. Điểm khác bản Admin: bị chế độ bảo trì chặn, kiểm tra tài khoản bản User (nhóm, `must_change_password`), `actor_type = 'USER'`, `actor_name` = `users.full_name`, khối giao diện ở `templates/member/profile.*` (không có khối "Hoạt động gần đây").

- **Guard**: `UserAuthGuard`; không cần mã quyền. Token `PASSWORD_CHANGE_ONLY` trả `403 PASSWORD_CHANGE_REQUIRED`. Cookie Refresh Token (`Path=/api/v1/auth`) được trình duyệt gửi kèm nhưng API **không** đọc. **Bị** chế độ bảo trì chặn (`503 MAINTENANCE`). Thứ tự: guard (`401`/`403`) → bảo trì (`503`) → kiểm tra `:id`, query, body (`400`) → xử lý.
- **Request**: `:id` là số nguyên dương (`auth_sessions.id`, `bigint unsigned`; chuỗi `^[1-9][0-9]{0,18}$`), sai thì `400 VALIDATION_ERROR` với `errors.id`. Không có query, không có body; gửi query param hoặc body có trường thì `400 VALIDATION_ERROR`. `:id` có thể là id đọc từ danh sách trước đó mà phiên đã xoay vòng (`ROTATED`) sau đó.
- **Xử lý** (một transaction):
  1. Đọc `users` theo khóa chính `id = sub`, join `user_groups` theo khóa chính `users.user_group_id` (đọc thường, không khóa dòng `users`/`user_groups`: API chỉ ghi `auth_sessions`). **Kiểm tra tài khoản ở mỗi request** như mục 3.6.1 bước 1: không thấy dòng, `users.status` khác `ACTIVE`, `user_groups.status = 'INACTIVE'` (chốt phòng vệ) hoặc `must_change_password = 1` (token đầy đủ) → `401 UNAUTHORIZED`, không xóa cookie, không ghi gì.
  2. `SELECT ... FOR UPDATE` phiên theo khóa chính `id = :id` **và** `actor_type = 'USER' AND actor_id = sub`. Không thấy (không tồn tại, là phiên của user khác, hoặc phiên cổng Admin trùng `actor_id` số) trả `404 NOT_FOUND`, cùng thông điệp cho mọi trường hợp để không lộ id phiên của người khác.
  3. Tìm phiên đích: phiên ở bước 2 còn hiệu lực (`revoked_at IS NULL AND expires_at > NOW()`) thì là phiên đích; đã `ROTATED` thì đi theo `replaced_by_session_id`, mỗi bước `SELECT ... FOR UPDATE` theo khóa chính (cùng điều kiện `actor_type`/`actor_id`), tối đa 5 bước, tới phiên còn hiệu lực (`docs/01_database_schema.md` mục 6.1). Không tới được (đã thu hồi vì lý do khác `ROTATED`, đã hết hạn, chuỗi dài quá 5 bước): không ghi gì, trả `200` với `data = { "revoked": false }`.
  4. Xác định phiên hiện tại từ claim `sid` (mục 3.6), **sau** bước 3 và bằng đọc khóa (`SELECT ... FOR UPDATE` theo khóa chính trên chuỗi `sid`), không bằng đọc thường (lý do: bản Admin bước 4). Phiên đích là phiên hiện tại (kể cả khi `:id` là id cũ của phiên hiện tại trước khi xoay vòng) trả `400 VALIDATION_ERROR` với `errors = { "id": ["Không thể thu hồi phiên đang dùng, hãy dùng Đăng xuất"] }`; kết thúc phiên hiện tại dùng `POST /api/v1/auth/logout`. Không có phiên hiện tại (chuỗi `sid` đã bị thu hồi từ thiết bị khác) thì mọi phiên đích đều thu hồi được.
  5. `UPDATE auth_sessions SET revoked_at = NOW(), revoked_reason = 'REVOKED_BY_SELF' WHERE id = <phiên đích>`; ghi `audit_logs` `AUTH / SESSION_REVOKED` (`actor_type = 'USER'`, `actor_id` = `sub`, `actor_name` = `users.full_name`, `resource_id` = id phiên đích (không phải `:id` khi đã đi theo chuỗi), `ip_address`, `user_agent` của request, `action_details = NULL`). Trả `200` với `data = { "revoked": true }`.
- Thứ tự khóa và hiệu lực trên thiết bị bị thu hồi như bản Admin: chuỗi phiên đích rồi chuỗi `sid`, theo khóa chính; `refresh` đồng thời của phiên đích chạy tuần tự với API này; thiết bị bị thu hồi còn dùng Access Token tới khi hết hạn (tối đa `security_access_token_minutes` phút), lần refresh kế tiếp `401` + xóa cookie, về `member.login`. Không có sự kiện Socket.IO đẩy ra ngay.
- **Response** `200`: `message` = "Đã thu hồi phiên đăng nhập", `data = { "revoked": true }`; `revoked = false` (`message` = "Phiên đăng nhập đã kết thúc trước đó") khi bước 3 không tới được phiên hiệu lực (gọi lại lần hai, hoặc phiên đã hết hạn/bị thu hồi trong lúc màn hình còn hiện danh sách cũ). `data` chỉ có `revoked`, không trả id phiên đã thu hồi; frontend tải lại danh sách.
- **Lỗi**:

| HTTP | `errorCode` | Khi nào |
|---|---|---|
| `400` | `VALIDATION_ERROR` | `:id` không phải số nguyên dương (`errors.id`); có query param hoặc body có trường; phiên đích là phiên hiện tại (bước 4, `errors.id`) |
| `401` | `UNAUTHORIZED` | Access Token thiếu, sai, hết hạn hoặc của cổng Admin (guard); kiểm tra tài khoản không qua (bước 1) |
| `403` | `PASSWORD_CHANGE_REQUIRED` | Gọi bằng token `PASSWORD_CHANGE_ONLY` |
| `404` | `NOT_FOUND` | `:id` không tồn tại hoặc không phải phiên của người gọi (bước 2) |
| `503` | `MAINTENANCE` | Đang bật `system_maintenance_mode` (`errors = null`); không khóa, không ghi gì |

- **Frontend** (`UserProfileView`, khối "Phiên đăng nhập của tôi", mục 5.1): mỗi dòng có `isCurrent = false` có nút "Thu hồi"; dòng "Phiên này" không có nút. Bấm nút mở hộp xác nhận dùng chung (`ConfirmModal`, `docs/03_ui_design.md` mục 6.6, loại nguy hiểm) nêu tên thiết bị (rút từ `userAgent`) và IP, nói rõ thiết bị đó bị đăng xuất khi Access Token hiện tại hết hạn. Xác nhận thì gọi qua `window.memberSession.request` (`401` → refresh một lần rồi gửi lại; `503` → biểu ngữ bảo trì); trong lúc gửi khóa hai nút, không đóng hộp (bấm nền, `Esc` bị bỏ qua). Kết quả (đều đóng hộp):
  - `200` `revoked = true`: toast thành công, tải lại danh sách phiên.
  - `200` `revoked = false`: toast thông tin "Phiên này đã kết thúc trước đó", tải lại danh sách phiên.
  - `404`: toast cảnh báo "Phiên đăng nhập không còn tồn tại", tải lại danh sách phiên.
  - `400`: toast lỗi theo `errors.id`, tải lại danh sách phiên (danh sách đang hiện đã cũ).
  - `503`: toast cảnh báo (thông điệp bảo trì của API) cùng biểu ngữ bảo trì, giữ nguyên danh sách (tải lại cũng bị `503`).
  - `401` sau khi refresh thất bại: `request()` đã chuyển về `member.login`, không làm gì thêm.
  - Lỗi khác (mạng, `5xx`): toast lỗi, giữ nguyên danh sách để thử lại.

  Không có nút "Đăng xuất khỏi tất cả thiết bị khác" (không có API). Mẫu: `templates/member/profile.js` (`mockDeleteMySession`, `openRevokeModal`, `confirmRevoke`, `#revokeSessionModal`).
- Index phục vụ: khóa chính `users`, `user_groups`; khóa chính `auth_sessions` (bước 2–4). Không cần index khác.

---

## 4. Kiến trúc Backend NestJS (`backend/src/core`, `apps/*`)

Theo quy tắc `docs/00_overview_and_architecture.md` mục 5.1: nghiệp vụ và entity ở `core`, controller ở `apps/admin` / `apps/member`, job nền ở `apps/worker`; các phần `apps/*` không import lẫn nhau.

```
backend/src/
├── core/profile/
│   ├── profile.module.ts
│   ├── profile.service.ts              <-- hồ sơ, avatar, preferences, đổi mật khẩu cho cả User và Admin (tham số user_type)
│   └── entities/
│       └── user-setting.entity.ts
└── apps/member/profile/
    ├── member-profile.module.ts
    ├── user-profile.controller.ts      <-- /api/v1/profile*
    └── dto/
        ├── update-profile.dto.ts
        ├── change-password.dto.ts
        └── update-preferences.dto.ts
```

---

## 5. Kiến trúc Frontend Vue 3 (chỉ khu vực Member)

| Route | View | Template nguồn | API |
| :--- | :--- | :--- | :--- |
| `/profile` (`member.profile`) | `src/apps/member/views/profile/UserProfileView.vue` | `templates/member/profile.html` | `GET`/`PUT /api/v1/profile`, `POST /api/v1/profile/avatar`, `/api/v1/auth/sessions*` |
| `/change-password` (`member.change-password`) | `src/apps/member/views/profile/ChangePasswordView.vue` | `templates/member/change-password.html` | `PUT /api/v1/profile/change-password` |
| `/account-settings` (`member.account-settings`) | `src/apps/member/views/settings/AccountSettingsView.vue` | `templates/member/user-settings.html` | `GET`/`PUT /api/v1/profile/preferences` |

Cả 3 route chỉ cần đăng nhập (không mã quyền). `ChangePasswordView` là route duy nhất mở được bằng token `PASSWORD_CHANGE_ONLY`: guard của khu vực Member chuyển mọi route khác về `member.change-password` khi `authUser` đang giữ token giới hạn; đổi mật khẩu thành công thì lưu Access Token mới trả về và vào `member.dashboard`.

### 5.1. Bố cục Giao diện (`UserProfileView.vue`, ánh xạ `templates/member/profile.html`)

Dữ liệu từ `GET /api/v1/profile` (mục 3.1); trạng thái tải/lỗi `#profileLoadState` (nút thử lại), nội dung `#profileLayout` chỉ hiện khi tải xong. Đổi mật khẩu và thiết lập giao diện là màn hình riêng (`member.change-password`, `member.account-settings`), không phải tab của trang này.

- **Panel bên trái (`.profile-sidebar`)**:
  - Avatar cỡ lớn (`.profile-avatar-large`) kèm nút tải ảnh đại diện `.btn-change-avatar` (mục 3.3).
  - `fullName`, huy hiệu vai trò `.role-badge` (`roleName`), `email`.
  - Khối thông tin tài khoản `.account-meta` (chỉ đọc): `lastLoginAt`, `passwordChangedAt`, `createdAt`.
- **Panel bên phải (`.profile-content`)**: form "Thông tin cá nhân": `fullName`, `phoneNumber` sửa được (mục 3.2); `username`, `email`, `jobTitle`, nhóm QLND (`userGroup`), đơn vị (`organization`), vai trò (`roleName`) chỉ đọc. Không có ô cho trường không có cột/API (phòng ban tự nhập, ghi chú hồ sơ…).
- **Khối "Phiên đăng nhập của tôi" (`#my-sessions`)**, dưới form: `GET /api/v1/auth/sessions` (mục 3.6.1), trạng thái tải/lỗi/rỗng riêng `#sessionsState` (nút "Thử lại" `#btnRetrySessions`), danh sách `#sessionList`; tải độc lập với hồ sơ. Dòng không phải "Phiên này" có nút "Thu hồi" (`.session-revoke`) mở hộp xác nhận `#revokeSessionModal` rồi gọi `DELETE /api/v1/auth/sessions/:id` (mục 3.6.2).

### 5.2. Bố cục Giao diện (`AccountSettingsView.vue`, ánh xạ `templates/member/user-settings.html`)

Dữ liệu từ store `preferencesUser` (mục 3.5.1); store trống thì gọi `GET /api/v1/profile/preferences`, trạng thái tải/lỗi `#prefsLoadState` (nút "Thử lại" `#btnRetryPrefs`), nội dung `#settingsLayout` chỉ hiện khi có dữ liệu.

- **Thẻ trái**: `avatarUrl`, `fullName`, `roleName`, `userGroup.name`, `email` đọc từ store `authUser` (không cứng chữ), nút điều hướng hai nhóm và liên kết sang `member.profile` (phiên đăng nhập) và `member.change-password`; không lặp lại các khối đó ở đây.
- Nhóm **Giao diện & Hiển thị**: `theme` là nhóm chọn 3 giá trị Sáng / Tối / Theo hệ thống; công tắc `isSidebarCollapsed` ("Menu thu gọn mặc định"); ô chọn `itemsPerPage` chỉ 10 / 20 / 50.
- Nhóm **Thông báo**: công tắc `emailNotificationEnabled` ("Nhận email khi có sự cố Nghiêm trọng", gửi tới `email` của tài khoản) và `soundAlertEnabled` ("Âm thanh chuông khi có sự cố Nghiêm trọng").
- Không có điều khiển nào khác (ngôn ngữ, định dạng ngày, thông báo đẩy, báo cáo tuần, lọc loại cảnh báo, 2FA, danh sách thiết bị, trích xuất dữ liệu, vô hiệu hóa/xóa tài khoản không có API/cột), không có widget Dashboard. Lưu từng điều khiển khi đổi qua `PUT /api/v1/profile/preferences` (mục 3.5.2); không có nút "Lưu".

---

## 6. Kịch bản kiểm thử (Test Plan for Agent)

1. **TC-UP-01** (`PUT /api/v1/profile`): `{ "fullName": "  Trần Thị Bích  " }` lưu `Trần Thị Bích`, trả `200` đủ 15 trường của mục 3.1, ghi một dòng `audit_logs` `USER / UPDATE` (`resource_id` = id người gọi, `actor_name` = tên mới, `changedFields = ["fullName"]`), header đổi tên ngay không gọi lại `/auth/me`, F5 vẫn là tên mới; gửi lại đúng giá trị đó trả `200` và không ghi thêm dòng audit; `{ "phoneNumber": null }` xóa số. `{}`, `{ "fullName": "" }`, `{ "fullName": null }`, `{ "phoneNumber": "abc" }`, `{ "email": "x@evn.vn" }`, `{ "jobTitle": "Kỹ sư" }`, `{ "avatarUrl": "/media/avatars/x.jpg" }`, `?x=1` đều trả `400 VALIDATION_ERROR` đúng khóa `errors`, CSDL không đổi. Token `PASSWORD_CHANGE_ONLY` → `403`; khóa user hoặc ngừng hoạt động nhóm trong lúc token còn hạn → `401`, không ghi audit; bật `system_maintenance_mode` → `503 MAINTENANCE`, biểu ngữ bảo trì hiện.
2. **TC-UP-02** (`PUT /api/v1/profile/change-password`): đăng nhập trên 2 trình duyệt (A có `rememberMe = true`); ở A đổi đúng: `200` `{ accessToken, expiresIn }`, `Set-Cookie` `Path=/api/v1/auth` có `Max-Age` ≈ 7 ngày; token mới mang `sub`, `userGroupId`, `roleCode`, `sid` = id phiên mới, không có `scope`; `users.must_change_password = 0`, `password_changed_at` mới; 2 phiên cũ `PASSWORD_CHANGED`, đúng 1 phiên mới `actor_type = USER`, `remember_me = 1`; `audit_logs` `AUTH / PASSWORD_CHANGED` `resource_id` = id user, `{ revokedCount: 2, forced: false }`; refresh ở B `401`. Gọi bằng token `PASSWORD_CHANGE_ONLY` (user vừa được đặt lại mật khẩu): `200`, phiên mới `remember_me = 0`, `forced = true`, token mới gọi được `GET /api/v1/profile`. Sai mật khẩu hiện tại: `400 VALIDATION_ERROR` `errors.currentPassword = ["Mật khẩu hiện tại không đúng"]`, `users.failed_login_count` tăng 1; sai 5 lần thì lần 6 `423 ACCOUNT_TEMPORARILY_LOCKED` có `errors.lockedUntil`, không có dòng audit. Body thiếu trường / có trường lạ / `newPassword` 9 ký tự / 73 byte / 2 loại ký tự / trùng `currentPassword` / `confirmPassword` khác, `?x=1`: `400`, bộ đếm không đổi. Khóa user hoặc ngừng hoạt động nhóm trong lúc token còn hạn → `401`, không ghi gì. Bật `system_maintenance_mode` → `503 MAINTENANCE` (cả khi gọi bằng token `PASSWORD_CHANGE_ONLY`, cả khi `currentPassword` sai: bộ đếm không đổi), biểu ngữ bảo trì hiện.
3. **TC-UP-03** (`GET /api/v1/profile/preferences`): user mới tạo qua `POST /users` rồi xóa dòng `user_settings` của mình: `200`, `data` đúng 5 trường `theme = "SYSTEM"`, `isSidebarCollapsed = false`, `itemsPerPage = 10`, hai cờ thông báo `true`, không có `dashboardWidgets`; sau lời gọi vẫn không có dòng `user_settings` mới, không có dòng `audit_logs`. Sửa tay `items_per_page = 30`, `custom_preferences = '{"dashboardWidgets":[]}'`: `itemsPerPage = 10`, response vẫn 5 trường. Bật Chế độ Tối (lưu qua `PUT`), đăng xuất rồi đăng nhập lại trên thiết bị khác: giao diện Tối, sidebar và số dòng mỗi trang đúng giá trị CSDL, `localStorage.memberTheme = "DARK"`, không có khóa `sessionStorage` nào. `?x=1` → `400 VALIDATION_ERROR`; token `PASSWORD_CHANGE_ONLY` → `403`; khóa user, ngừng hoạt động nhóm hoặc đặt lại mật khẩu trong lúc token còn hạn → `401`. Bật `system_maintenance_mode` rồi tải lại trang: vào được cổng, giao diện theo `memberTheme` đã cache, biểu ngữ bảo trì hiện; màn hình cài đặt hiện thông điệp bảo trì + "Thử lại".
4. **TC-UP-04** (`GET /api/v1/profile`): user `ACTIVE` gọi được `200` đủ 15 trường, không có `permissions`, `password_hash`; nhóm độc lập → `organization = null`. `?x=1` → `400 VALIDATION_ERROR`. Token `PASSWORD_CHANGE_ONLY` → `403 PASSWORD_CHANGE_REQUIRED`. Khóa user (hoặc đặt lại mật khẩu) rồi gọi bằng Access Token cũ → `401 UNAUTHORIZED`. Đổi vai trò qua `PUT /users/:id/role`: `roleCode` vẫn theo token cũ, sau refresh là vai trò mới. Bật `system_maintenance_mode` → `503 MAINTENANCE`. Không có dòng `audit_logs` mới.
5. **TC-UP-05** (`POST /api/v1/profile/avatar`): ảnh JPEG 1,5 MB 1200×800 có EXIF GPS: `200`, `data` đủ 15 trường của mục 3.1, `avatarUrl` dạng `/media/avatars/<uuid>.jpg`; file trên đĩa 256×256, không còn EXIF; một dòng `audit_logs` `USER / UPDATE` (`resource_id` = id người gọi, `actor_name` = `full_name`, `changedFields = ["avatarUrl"]`); header `MemberLayout` đổi ảnh ngay không gọi lại `/auth/me`, form "Thông tin cá nhân" đang sửa dở giữ nguyên; tải PNG kế tiếp thì file JPEG cũ bị xóa. File 2,1 MB, file `.png` thực chất là PDF, thiếu phần `file`, hai phần `file`, thêm phần `fullName`, gửi JSON, `?x=1` đều trả `400 VALIDATION_ERROR` và không có file mới trong `AVATAR_STORAGE_DIR`. Token `PASSWORD_CHANGE_ONLY` → `403`; khóa user hoặc ngừng hoạt động nhóm trong lúc token còn hạn → `401`, không ghi audit, không còn file mồ côi. Bật `system_maintenance_mode` → `503 MAINTENANCE` (cả khi file sai định dạng), không có file tạm, biểu ngữ bảo trì hiện, ảnh cũ giữ nguyên.
6. **TC-UP-06** (`GET /api/v1/auth/sessions`): user A đăng nhập ở trình duyệt X (08:15) rồi Y (09:00); ở X refresh lúc 09:40. Gọi từ X: `200`, `data` mảng 2 phần tử, phần tử đầu là phiên của X (`isCurrent = true`, `id` = phiên mới sau xoay vòng, `loggedInAt` = 08:15, `lastActiveAt` = 09:40), sau là Y; mỗi phần tử đúng 7 trường. Tab thứ hai của X vừa refresh (tab đầu còn `sid` cũ): vẫn đánh dấu đúng phiên mới của X. Gọi bằng token của user B (cookie trình duyệt của A) chỉ trả phiên của B; phiên Admin cùng `id` số với A không xuất hiện (`actor_type`). Không phát sinh `audit_logs`, `last_used_at` không đổi. `?x=1` → `400`; token `PASSWORD_CHANGE_ONLY` → `403`; khóa user, ngừng hoạt động nhóm hoặc đặt lại mật khẩu trong lúc token còn hạn → `401`. Bật `system_maintenance_mode` → `503 MAINTENANCE` (khối phiên hiện lỗi + "Thử lại" riêng, biểu ngữ bảo trì hiện), `POST /auth/logout` vẫn `200`.
7. **TC-UP-07** (`DELETE /api/v1/auth/sessions/:id`): user A có phiên X (đang dùng) và Y (trình duyệt khác). Từ X, `DELETE /api/v1/auth/sessions/<Y>` trả `200` `{ "revoked": true }`; Y có `revoked_reason = 'REVOKED_BY_SELF'`; một dòng `audit_logs` `AUTH / SESSION_REVOKED` (`actor_type = 'USER'`, `actor_name` = `full_name` của A, `resource_id` = id của Y, `action_details` `NULL`); refresh ở Y trả `401` và xóa cookie, Access Token còn hạn của Y vẫn gọi được API tới khi hết hạn. Gọi lại cùng id: `200` `{ "revoked": false }`, không thêm dòng audit. Y refresh (Y → Y') rồi X gọi `DELETE` với id cũ của Y: Y' bị thu hồi, `resource_id` = id của Y'. `DELETE` id của X, hoặc id cũ của X trước khi xoay vòng: `400 VALIDATION_ERROR` có `errors.id`, X vẫn hiệu lực. Id phiên của user B, id phiên Admin trùng `actor_id` số với A, id không tồn tại: `404 NOT_FOUND` cùng thông điệp. `:id` = `abc`, `0`, `-1`: `400` có `errors.id`; `?x=1` hoặc body `{"x":1}`: `400`; token `PASSWORD_CHANGE_ONLY` → `403`; khóa A, ngừng hoạt động nhóm hoặc đặt lại mật khẩu trong lúc token còn hạn → `401`, Y không bị thu hồi. Bật `system_maintenance_mode` → `503 MAINTENANCE` (kể cả `:id` = `abc`), Y không bị thu hồi, toast cảnh báo + biểu ngữ bảo trì, danh sách giữ nguyên. Ở màn hình hồ sơ, dòng "Phiên này" không có nút "Thu hồi"; thu hồi Y qua hộp xác nhận thì Y biến khỏi danh sách.
8. **TC-UP-08** (`PUT /api/v1/profile/preferences`): user chưa có dòng `user_settings`: `{ "theme": "DARK" }` trả `200`, `data` đúng 5 trường (`theme = "DARK"`, còn lại mặc định, không có `dashboardWidgets`); CSDL có đúng một dòng `user_settings` mới `user_type = 'USER'`, `custom_preferences = NULL`; không có dòng `audit_logs`. Dòng đã có `custom_preferences` (sửa tay) thì sau `{ "itemsPerPage": 50 }` vẫn giữ nguyên `custom_preferences`. Mỗi body sau trả `400 VALIDATION_ERROR` đúng khóa `errors` và CSDL không đổi: `{}`, `{ "theme": "dark" }`, `{ "theme": null }`, `{ "itemsPerPage": 100 }`, `{ "itemsPerPage": "20" }`, `{ "isSidebarCollapsed": 1 }`, `{ "dashboardWidgets": [] }`, `{ "customPreferences": {} }`; `?x=1` → `400`; token `PASSWORD_CHANGE_ONLY` → `403`; khóa user, ngừng hoạt động nhóm hoặc đặt lại mật khẩu trong lúc token còn hạn → `401`, CSDL không đổi. Bật `system_maintenance_mode` → `503 MAINTENANCE` (kể cả body `{}`), CSDL không đổi. Ở màn hình cài đặt: đổi "Tối" thì giao diện tối ngay, nhóm chọn theme khóa tới khi xong, `localStorage.memberTheme = "DARK"` sau khi `200`; giả lập lỗi lưu (`?prefsSave=fail`) thì điều khiển và giao diện trở về giá trị cũ, toast lỗi, cache không đổi; bảo trì bật sau khi đã nạp (`?prefsSave=503`) thì cũng hoàn tác, toast cảnh báo, biểu ngữ hiện. Vào cổng lúc bảo trì (store trống) rồi bấm nút theme ở header: `503`, giao diện về theme đã cache, màn hình cài đặt vẫn hiện thông điệp bảo trì + "Thử lại" (không hiện giá trị mặc định như đã nạp).
