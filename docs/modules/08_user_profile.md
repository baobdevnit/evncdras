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

- Body, lưu trữ (`AVATAR_STORAGE_DIR`, `/media/avatars/<uuid>.<png|jpg>`), xử lý ảnh, lỗi và hành vi frontend theo đặc tả chung `docs/modules/09_admin_profile.md` mục 3.2.1 (một phần `file` ≤ 2 MB, PNG/JPEG theo magic bytes, cắt vuông 256×256, bỏ metadata, xóa file cũ sau commit). Đây là cách duy nhất đổi ảnh đại diện. Khác bản Admin:
  - Guard `UserAuthGuard`; bảng `users`; `audit_logs` `actor_type = 'USER'`, `resource_name = 'USER'`, `action = 'UPDATE'`, `action_details = { "changedFields": ["avatarUrl"] }`.
  - `data` = hồ sơ đủ trường như `GET /api/v1/profile` (mục 3.1).
  - *(Còn rà ở U08: nhóm `INACTIVE`, chế độ bảo trì `503`, mẫu `templates/member/profile.*`.)*

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
- `GET`: xử lý, response, lỗi và cách frontend nạp/áp dụng theo bản Admin `docs/modules/09_admin_profile.md` mục 3.6, khác ở `UserAuthGuard`, `user_type = 'USER'`, store `preferencesUser`, khóa `localStorage` `memberTheme` và **không** có `dashboardWidgets`. *(Còn rà ở U11: nhóm `INACTIVE`, chế độ bảo trì `503`, mẫu `templates/member/user-settings.*`.)*
- `PUT`: body, xử lý (upsert theo `uniq_user_settings`, không ghi `audit_logs`), response, lỗi và cách frontend lưu (áp ngay, lỗi thì hoàn tác) theo bản Admin `docs/modules/09_admin_profile.md` mục 3.7, khác ở `UserAuthGuard`, `user_type = 'USER'`, store `preferencesUser` và **không** nhận `dashboardWidgets` (gửi thì `400` như trường lạ). *(Còn rà ở U12: nhóm `INACTIVE`, chế độ bảo trì `503`, mẫu `templates/member/user-settings.*`, nút theme ở `templates/member/main.js`.)*

### 3.6. Phiên đăng nhập của chính mình (`GET /api/v1/auth/sessions`, `DELETE /api/v1/auth/sessions/:id`)

- **Guard**: `UserAuthGuard` (không nhận token `PASSWORD_CHANGE_ONLY`). Chỉ thao tác trên phiên của chính người gọi (`actor_type = 'USER'`, `actor_id` = người gọi).
- **Phiên hiện tại**: xác định từ claim `sid` của Access Token, đi theo chuỗi `replaced_by_session_id` tới phiên còn hiệu lực, **không** từ cookie (đặc tả chung `docs/modules/09_admin_profile.md` mục 3.5).
- **`GET`**: query, xử lý, response (`data` là mảng các phiên còn hiệu lực, phiên hiện tại đứng đầu; mỗi phần tử `id`, `ipAddress`, `userAgent`, `loggedInAt`, `lastActiveAt`, `expiresAt`, `isCurrent`), lỗi và khối giao diện theo bản Admin `docs/modules/09_admin_profile.md` mục 3.5.1, khác ở `UserAuthGuard`, `actor_type = 'USER'`, bước 1 đọc `users`. *(Còn rà ở U09: nhóm `INACTIVE`, chế độ bảo trì `503`, mẫu `templates/member/profile.*`.)*
- **`DELETE /:id`**: request, xử lý (khóa và đi chuỗi `replaced_by_session_id`, xác định phiên hiện tại bằng đọc khóa sau khi khóa phiên đích), response `{ revoked }`, lỗi và cách frontend thu hồi (hộp xác nhận, tải lại danh sách) theo bản Admin `docs/modules/09_admin_profile.md` mục 3.5.2, khác ở `UserAuthGuard`, `actor_type = 'USER'`, bước 1 đọc `users`. Tóm tắt: `:id` không tồn tại hoặc không phải phiên của người gọi `404 NOT_FOUND`; phiên đích là phiên hiện tại `400 VALIDATION_ERROR` (`errors.id`, dùng `POST /auth/logout`); tới được phiên hiệu lực khác thì thu hồi (`REVOKED_BY_SELF`), ghi `audit_logs` `AUTH / SESSION_REVOKED` (`resource_id` = id phiên bị thu hồi), `200` `{ "revoked": true }`; không tới được thì không ghi gì, `200` `{ "revoked": false }`. *(Còn rà ở U10: nhóm `INACTIVE`, chế độ bảo trì `503`, mẫu `templates/member/profile.*`.)*

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

---

## 6. Kịch bản kiểm thử (Test Plan for Agent)

1. **TC-UP-01** (`PUT /api/v1/profile`): `{ "fullName": "  Trần Thị Bích  " }` lưu `Trần Thị Bích`, trả `200` đủ 15 trường của mục 3.1, ghi một dòng `audit_logs` `USER / UPDATE` (`resource_id` = id người gọi, `actor_name` = tên mới, `changedFields = ["fullName"]`), header đổi tên ngay không gọi lại `/auth/me`, F5 vẫn là tên mới; gửi lại đúng giá trị đó trả `200` và không ghi thêm dòng audit; `{ "phoneNumber": null }` xóa số. `{}`, `{ "fullName": "" }`, `{ "fullName": null }`, `{ "phoneNumber": "abc" }`, `{ "email": "x@evn.vn" }`, `{ "jobTitle": "Kỹ sư" }`, `{ "avatarUrl": "/media/avatars/x.jpg" }`, `?x=1` đều trả `400 VALIDATION_ERROR` đúng khóa `errors`, CSDL không đổi. Token `PASSWORD_CHANGE_ONLY` → `403`; khóa user hoặc ngừng hoạt động nhóm trong lúc token còn hạn → `401`, không ghi audit; bật `system_maintenance_mode` → `503 MAINTENANCE`, biểu ngữ bảo trì hiện.
2. **TC-UP-02** (`PUT /api/v1/profile/change-password`): đăng nhập trên 2 trình duyệt (A có `rememberMe = true`); ở A đổi đúng: `200` `{ accessToken, expiresIn }`, `Set-Cookie` `Path=/api/v1/auth` có `Max-Age` ≈ 7 ngày; token mới mang `sub`, `userGroupId`, `roleCode`, `sid` = id phiên mới, không có `scope`; `users.must_change_password = 0`, `password_changed_at` mới; 2 phiên cũ `PASSWORD_CHANGED`, đúng 1 phiên mới `actor_type = USER`, `remember_me = 1`; `audit_logs` `AUTH / PASSWORD_CHANGED` `resource_id` = id user, `{ revokedCount: 2, forced: false }`; refresh ở B `401`. Gọi bằng token `PASSWORD_CHANGE_ONLY` (user vừa được đặt lại mật khẩu): `200`, phiên mới `remember_me = 0`, `forced = true`, token mới gọi được `GET /api/v1/profile`. Sai mật khẩu hiện tại: `400 VALIDATION_ERROR` `errors.currentPassword = ["Mật khẩu hiện tại không đúng"]`, `users.failed_login_count` tăng 1; sai 5 lần thì lần 6 `423 ACCOUNT_TEMPORARILY_LOCKED` có `errors.lockedUntil`, không có dòng audit. Body thiếu trường / có trường lạ / `newPassword` 9 ký tự / 73 byte / 2 loại ký tự / trùng `currentPassword` / `confirmPassword` khác, `?x=1`: `400`, bộ đếm không đổi. Khóa user hoặc ngừng hoạt động nhóm trong lúc token còn hạn → `401`, không ghi gì. Bật `system_maintenance_mode` → `503 MAINTENANCE` (cả khi gọi bằng token `PASSWORD_CHANGE_ONLY`, cả khi `currentPassword` sai: bộ đếm không đổi), biểu ngữ bảo trì hiện.
3. **TC-UP-03**: Bật Chế độ Tối (Dark Mode), đăng xuất rồi đăng nhập lại trên thiết bị khác, kiểm tra hệ thống vẫn giữ nguyên theme Dark Mode từ CSDL.
4. **TC-UP-04** (`GET /api/v1/profile`): user `ACTIVE` gọi được `200` đủ 15 trường, không có `permissions`, `password_hash`; nhóm độc lập → `organization = null`. `?x=1` → `400 VALIDATION_ERROR`. Token `PASSWORD_CHANGE_ONLY` → `403 PASSWORD_CHANGE_REQUIRED`. Khóa user (hoặc đặt lại mật khẩu) rồi gọi bằng Access Token cũ → `401 UNAUTHORIZED`. Đổi vai trò qua `PUT /users/:id/role`: `roleCode` vẫn theo token cũ, sau refresh là vai trò mới. Bật `system_maintenance_mode` → `503 MAINTENANCE`. Không có dòng `audit_logs` mới.
