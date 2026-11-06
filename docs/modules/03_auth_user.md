# MODULE 03: XÁC THỰC & QUẢN LÝ NGƯỜI DÙNG ĐƠN VỊ (USER AUTH & USER MANAGEMENT)

## Đường dẫn tài liệu: `docs/modules/03_auth_user.md`

## Ánh xạ giao diện mẫu
- **Khu vực Member**: `templates/member/login.html` → `src/apps/member/views/auth/LoginView.vue` (route `member.login`, `/login`); quản lý thành viên nhóm `templates/member/group-admin.html` → `GroupAdminView.vue` (đặc tả tại `docs/modules/02_user_group.md` mục 5.3).
- **Khu vực Admin**: `templates/admin/users.html` → `src/apps/admin/views/users/UserListView.vue` (route `admin.users`, `/admin/users`), mục 5 dưới đây.

---

## 1. Mục tiêu & Nghiệp vụ (Business Overview)

### 1.1. Bối cảnh nghiệp vụ

Hệ thống EVN CDR AS phân tách người dùng thành hai tầng dữ liệu độc lập:

1. **Admin Portal**: Quản trị viên hệ thống (Lưu tại bảng `admins`, mô tả tại Module 04).
2. **User Portal**: Cán bộ, kỹ sư, nhân viên các đơn vị trực thuộc EVN (Lưu tại bảng `users`).

### 1.2. Quy tắc nghiệp vụ cốt lõi

1. **Người dùng luôn thuộc một nhóm người dùng cố định ngay từ lúc tạo (Không chuyển nhóm)**:
   - Mọi tài khoản `users` bắt buộc phải được gán vào đúng một nhóm người dùng (`user_group_id NOT NULL`) ngay thời điểm khởi tạo (bản chất là người dùng thuộc về đơn vị tổ chức sở hữu nhóm đó).
   - **Tính bất biến (Immutability)**: Thuộc tính `user_group_id` là bất biến. Hệ thống **tuyệt đối không có khái niệm chuyển người dùng giữa các nhóm** (No Group Transfer).
   - Khi cập nhật thông tin người dùng (`PUT /api/v1/users/:id`), trường `user_group_id` không được phép chỉnh sửa. Nếu nhân sự chuyển đơn vị công tác: đặt tài khoản cũ `status = INACTIVE`, rồi tạo tài khoản mới ở nhóm mới, **được dùng lại cùng `username`/`email`** (ràng buộc UNIQUE chỉ áp cho tài khoản chưa `INACTIVE`, qua cột ảo `username_active`/`email_active`, `docs/01_database_schema.md` mục 6). Lịch sử của tài khoản cũ giữ nguyên. `INACTIVE` là trạng thái cuối, không có API kích hoạt lại (`docs/01_database_schema.md` mục 14).
2. **Thẩm quyền tạo người dùng (Quản trị hệ thống & Quản trị nhóm)**:
   - Tài khoản người dùng có thể được tạo ra bởi 2 chủ thể:
     - **Quản trị viên hệ thống (System Admin / Root Admin)**: Thuộc tầng Quản trị (`admins`), có toàn quyền tạo tài khoản người dùng cho bất kỳ Nhóm người dùng nào trong toàn hệ thống (tùy ý chỉ định `userGroupId`).
     - **Quản trị viên nhóm (Group Admin)**: Bản chất **cũng là một thành viên trong nhóm nhưng được phân quyền quản trị** (mang vai trò `GROUP_ADMIN` trong `user_roles`). Group Admin có thẩm quyền tạo tài khoản người dùng mới nhưng **chỉ được phép tạo trong phạm vi nhóm người dùng của chính mình** (`userGroupId` tự động gán cố định theo nhóm của Group Admin, không thể chọn nhóm khác).
3. **Quy tắc Quản trị viên nhóm (Group Admin Rule & Safeguard)**:
   - Mỗi nhóm người dùng phải có **ít nhất một người dùng `ACTIVE` mang vai trò `GROUP_ADMIN`**.
   - Mỗi người dùng mang đúng 1 vai trò trong `user_roles`: `GROUP_ADMIN` (Quản trị viên nhóm), `USER_RECORDING` (Thành viên nghe ghi âm) hoặc `REGULAR_USER` (Thành viên). Bảng `users` không có cột vai trò hay quyền.
   - Group Admin có thẩm quyền: Tạo mới thành viên trong nhóm của mình, sửa thông tin, đặt lại mật khẩu, và đổi vai trò thành viên trong nhóm (bổ nhiệm/hạ quyền `GROUP_ADMIN`; chuyển `REGULAR_USER` ↔ `USER_RECORDING`) qua `PUT /users/:id/role` (`docs/modules/10_permissions_and_roles.md` mục 1.3).
   - Kiểm tra quyền người dùng: quyền nhóm trước (`user_groups.status`, `allow_recording_access`), sau đó quyền của vai trò (`docs/modules/10_permissions_and_roles.md` mục 2.3).
   - Group Admin không được phép quản lý hoặc xem dữ liệu của nhóm khác.
   - **Bảo toàn Group Admin**: Khi một user là Group Admin duy nhất của một nhóm, hệ thống không cho phép thu hồi quyền Group Admin hoặc xóa/khóa tài khoản đó cho đến khi đã chỉ định một Group Admin khác thay thế (do không có thao tác chuyển nhóm).
4. **Phạm vi truy cập dữ liệu (Data Scope)**:
   - Thành viên thường chỉ xem được dữ liệu CDR của các máy nhánh/đầu số thuộc nhóm người dùng của mình.
   - Không thể can thiệp vào cấu hình hệ thống hay dữ liệu ngoài phạm vi nhóm.

---

## 2. Thiết kế Dữ liệu (Database Schema)

Bảng MariaDB: `users`, `user_roles`, `user_groups`, `roles`, `permission_roles`, `permissions` (xem `docs/01_database_schema.md` mục 6 và 7).

> DDL chuẩn của `users` (mục 6) chỉ định nghĩa tại `docs/01_database_schema.md`. Module này không chép lại DDL để tránh lệch; khi sinh code, entity và migration lấy từ `01`.

---

## 3. Đặc tả API Contracts

### 3.1. Đăng nhập User (`POST /api/v1/auth/login`)

Cùng khung với bản Admin (`docs/modules/04_auth_admin.md` mục 3.1); mục này ghi đủ cho bản User. Điểm khác bản Admin: kiểm tra chế độ bảo trì (bước 0), nhánh nhóm `INACTIVE` (bước 2), quyền hiệu lực theo cờ nhóm (bước 4), claim `userGroupId`, cookie `Path=/api/v1/auth`, response có `user.userGroup`.

- **Guard**: Public (không cần Access Token). **Bị** chế độ bảo trì chặn (`docs/02_api_contracts.md` mục 1.2, bước 0 dưới đây).
- **Request Body**:

```json
{
  "username": "cdr.evnit",
  "password": "Password123@",
  "rememberMe": true
}
```

| Trường | Kiểu | Bắt buộc | Ràng buộc |
|---|---|---|---|
| `username` | string | Có | Username **hoặc** email; cắt khoảng trắng hai đầu; 1–150 ký tự (`users.username` ≤ 100, `users.email` ≤ 150) |
| `password` | string | Có | 1–255 ký tự; không cắt khoảng trắng, không kiểm tra chính sách mật khẩu ở bước đăng nhập |
| `rememberMe` | boolean | Không | Mặc định `false` |

  Thiếu trường bắt buộc, sai kiểu, quá độ dài hoặc có trường khác trả `400 VALIDATION_ERROR` (`docs/02_api_contracts.md` mục 2.3), không ghi `audit_logs`.
- **Xử lý Backend** (theo đúng thứ tự):
  0. `system_maintenance_mode = true`: `503 MAINTENANCE` **trước mọi bước** (trước cả kiểm tra body): không tìm tài khoản, không đổi bộ đếm sai, không ghi `audit_logs` (chủ dự án chốt ở U01). Setting đọc từ bộ nhớ đệm `system_settings` (`docs/modules/07_system_settings.md` mục 2).
  1. Kiểm tra body (bảng trên), sai thì `400`. Tìm tài khoản theo `users.username_active = :username`; không thấy thì theo `email_active = :username` (chỉ tài khoản chưa `INACTIVE`; so sánh không phân biệt hoa thường theo collation), join `user_groups` theo khóa chính. Không thấy: `401 INVALID_CREDENTIALS`, ghi `LOGIN_FAILED` với `actor_type = USER`, `actor_id = NULL`, `actor_name` = chuỗi đã nhập, `reason = UNKNOWN_USER`.
  2. Theo thứ tự dưới đây; các nhánh này không kiểm tra mật khẩu, không tăng bộ đếm, ghi `LOGIN_FAILED` với `actor_id` = id tài khoản:
     - `users.status = 'LOCKED'`: `403 ACCOUNT_LOCKED` (`reason = ACCOUNT_LOCKED`).
     - `user_groups.status = 'INACTIVE'`: `403 GROUP_INACTIVE` (`reason = GROUP_INACTIVE`). **Chốt phòng vệ** (chủ dự án chốt giữ ở U01): bình thường không xảy ra, vì ngừng hoạt động nhóm chuyển mọi tài khoản của nhóm sang `INACTIVE` trong cùng transaction (`docs/01_database_schema.md` mục 14) nên bước 1 đã trả `401`; nhánh này chỉ chạy khi dữ liệu lệch bất biến.
     - `locked_until > NOW()`: `423 ACCOUNT_TEMPORARILY_LOCKED`, `errors = { "lockedUntil": "<ISO 8601>" }` (`reason = TEMPORARILY_LOCKED`).
  3. `bcrypt.compare(password, users.password_hash)`. Sai: tăng `failed_login_count` bằng một câu `UPDATE` nguyên tử; đạt `security_login_max_failed` (mặc định 5) thì `locked_until = NOW() + security_lockout_minutes` (mặc định 15 phút) và đặt lại `failed_login_count = 0` trong cùng câu lệnh (câu SQL tại `docs/01_database_schema.md` mục 6.1); trả `401 INVALID_CREDENTIALS` (cùng mã, cùng thông điệp với bước 1, kể cả lần sai làm tài khoản bị khóa tạm), ghi `LOGIN_FAILED` (`reason = BAD_PASSWORD`).
  4. Đúng mật khẩu: một câu `UPDATE users SET failed_login_count = 0, last_login_at = NOW()`. Đọc vai trò từ `user_roles` (khóa chính `user_id`, join `roles`); `permissions` = `ROLE_PERMISSIONS[roleCode]`, **bỏ** `cdr:listen_audio`, `cdr:download_audio` khi `user_groups.allow_recording_access = 0` (quyền hiệu lực, `docs/modules/10_permissions_and_roles.md` mục 2.3), sắp xếp theo `code`.
  5. Xác định loại token:
     - **Đầy đủ** (bình thường): Access Token (`security_access_token_minutes`, mặc định 15 phút) ký bằng `JWT_USER_SECRET`, mang `sub`, `userGroupId`, `roleCode` (đọc ở bước 4), `sid` (id dòng `auth_sessions` vừa tạo); tạo một dòng `auth_sessions` (`actor_type = 'USER'`, `actor_id`, `refresh_token_hash` = SHA-256 của Refresh Token, `ip_address`, `user_agent` của request, `remember_me` = `rememberMe`, `logged_in_at = NOW()`, `expires_at = NOW() + security_refresh_token_days`, mặc định 7 ngày) và gửi Refresh Token qua cookie.
     - **Giới hạn**, khi `must_change_password = 1` hoặc `password_changed_at` quá `security_password_max_age_days` (90): chỉ cấp Access Token có thêm claim `scope: "PASSWORD_CHANGE_ONLY"` (vẫn có `sub`, `userGroupId`, `roleCode`; không có `sid`); **không** tạo dòng `auth_sessions`, không gửi cookie; response có `mustChangePassword: true`. Chính sách đầy đủ tại `docs/01_database_schema.md` mục 6.1.
  6. Ghi `audit_logs` `AUTH / LOGIN` (`actor_type = USER`, `actor_id`, `actor_name` = `full_name`, `ip_address`, `user_agent`) cho cả hai loại token. Bước 4–6 trong một transaction.
- **Refresh Token** gửi qua cookie `HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth`, không nằm trong body response. `rememberMe = true` thì cookie có `Max-Age` = số giây còn lại tới `expires_at`; `false` thì không đặt `Max-Age` (mất khi đóng trình duyệt), hạn phiên phía server vẫn là `expires_at`. Token giới hạn không có cookie nên `rememberMe` không có tác dụng.
- **Response** `200`:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Đăng nhập thành công",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900,
    "mustChangePassword": false,
    "user": {
      "id": 10,
      "username": "cdr.evnit",
      "fullName": "Trần Thị B",
      "email": "cdr.evnit@evn.com.vn",
      "avatarUrl": "/media/avatars/8a1d2c3e-5b6f-4a7d-9e0f-1b2c3d4e5f60.jpg",
      "userGroup": {
        "id": 1,
        "name": "Nhóm QLND Khối CNTT",
        "organizationId": 2,
        "organizationName": "Khối CNTT",
        "allowRecordingAccess": true
      },
      "roleCode": "GROUP_ADMIN",
      "roleName": "Quản trị viên nhóm",
      "permissions": ["cdr:download_audio", "cdr:export", "cdr:filter_advanced", "cdr:listen_audio", "cdr:view", "group:manage_admin", "group:toggle_recording", "org:view", "prefix:view", "qos:view", "report:export", "report:view", "user:create", "user:delete", "user:edit", "user:view", "user_group:view"]
    }
  },
  "timestamp": "2026-10-26T09:30:00+07:00"
}
```

| Trường | Nguồn | Ghi chú |
|---|---|---|
| `accessToken` | JWT | Chỉ giữ trong bộ nhớ frontend |
| `expiresIn` | `security_access_token_minutes` × 60 | Giây |
| `mustChangePassword` | `true` khi cấp token giới hạn (bước 5) | |
| `user.id`, `username`, `fullName`, `email`, `avatarUrl` | `users` | `avatarUrl` = `null` khi chưa tải ảnh |
| `user.userGroup.id`, `name`, `allowRecordingAccess` | `user_groups` (`allow_recording_access` → boolean) | |
| `user.userGroup.organizationId`, `organizationName` | `user_groups.organization_id`, `organizations.name` | Cả hai `null` khi nhóm độc lập (`organization_id` NULL) |
| `user.roleCode`, `roleName` | `roles.code`, `roles.name` qua `user_roles` | |
| `user.permissions` | Quyền hiệu lực (bước 4), sắp xếp theo `code` | Ví dụ trên đủ 17 mã của `GROUP_ADMIN` thuộc nhóm đã được cấp ghi âm; nhóm chưa cấp còn 15 mã (`docs/modules/10_permissions_and_roles.md` mục 2.2) |

  Token giới hạn trả **cùng cấu trúc** (`user` đầy đủ, kể cả `permissions`), `mustChangePassword = true`; frontend thấy cờ này thì chuyển thẳng tới trang đổi mật khẩu, không vào layout chính. `user` cũng là `data` của `GET /api/v1/auth/me` (mục 3.2).
- **Lỗi**:

| HTTP | `errorCode` | Khi nào | `LOGIN_FAILED.reason` |
|---|---|---|---|
| `400` | `VALIDATION_ERROR` | Body sai (bảng request) | *(không ghi)* |
| `401` | `INVALID_CREDENTIALS` | Không thấy tài khoản (kể cả `INACTIVE`) hoặc sai mật khẩu | `UNKNOWN_USER` / `BAD_PASSWORD` |
| `403` | `ACCOUNT_LOCKED` | `users.status = 'LOCKED'` | `ACCOUNT_LOCKED` |
| `403` | `GROUP_INACTIVE` | Nhóm `INACTIVE` (chốt phòng vệ, bước 2) | `GROUP_INACTIVE` |
| `423` | `ACCOUNT_TEMPORARILY_LOCKED` | `locked_until > NOW()`, `errors.lockedUntil` | `TEMPORARILY_LOCKED` |
| `503` | `MAINTENANCE` | Chế độ bảo trì đang bật (bước 0) | *(không ghi)* |

- Index phục vụ: `uniq_users_username` (`username_active`), `uniq_users_email` (`email_active`), khóa chính `user_groups`, `organizations`, `user_roles`, `roles`.

### 3.2. Thông tin User đang đăng nhập (`GET /api/v1/auth/me`)

Cùng khung với bản Admin (`docs/modules/04_auth_admin.md` mục 3.1.1); mục này ghi đủ cho bản User. Điểm khác bản Admin: kiểm tra nhóm (bước 2), `roleCode` lấy từ claim của Access Token (bước 3), quyền hiệu lực theo cờ nhóm, response có `userGroup`, không bị chế độ bảo trì chặn.

- **Guard**: `UserAuthGuard`, nhận cả token `PASSWORD_CHANGE_ONLY` (`docs/01_database_schema.md` mục 6.1); không cần mã quyền (không qua `PermissionsGuard`). **Không** bị chế độ bảo trì chặn (`docs/02_api_contracts.md` mục 1.2): đang bảo trì vẫn trả `200`, để guard của cổng khôi phục phiên khi tải lại trang (refresh rồi `/auth/me`) và layout vẫn vẽ được tài khoản cùng thông báo bảo trì.
- **Request**: header `Authorization: Bearer <accessToken>`; không có query, không có body. Gửi query param bất kỳ trả `400 VALIDATION_ERROR`.
- **Xử lý** (chỉ đọc, không ghi CSDL: không ghi `audit_logs`, không cập nhật `last_login_at`):
  1. Đọc `users` theo khóa chính `id = sub` của Access Token, join `user_groups` theo khóa chính `users.user_group_id`, left join `organizations` theo khóa chính `user_groups.organization_id` (đọc thường, không khóa).
  2. **Kiểm tra tài khoản ở mỗi request** (cùng quy tắc mọi API cổng User, `docs/01_database_schema.md` mục 6.1): không thấy dòng, hoặc `users.status` khác `ACTIVE`, hoặc `user_groups.status = 'INACTIVE'` (chốt phòng vệ như bước 2 của mục 3.1: ngừng hoạt động nhóm đã chuyển mọi tài khoản sang `INACTIVE`), hoặc token đầy đủ (không có `scope: "PASSWORD_CHANGE_ONLY"`) mà `must_change_password = 1` (vừa bị quản trị viên đặt lại mật khẩu): `401 UNAUTHORIZED`. Không xóa cookie (phiên đã bị thu hồi khi khóa/ngừng hoạt động/đặt lại mật khẩu), nên client refresh một lần, refresh trả `401` và frontend về trang đăng nhập. Không xét `locked_until` (khóa tạm chỉ chặn đăng nhập), tuổi mật khẩu; token `PASSWORD_CHANGE_ONLY` với `must_change_password = 1` là bình thường. `users.user_group_id` bất biến (mục 1.2) nên luôn trùng claim `userGroupId`.
  3. **Vai trò và quyền** (chủ dự án chốt ở U04): `roleCode` = claim `roleCode` của Access Token, **không** đọc `user_roles`; `roleName` = `roles.name` của vai trò có `code` đó (5 dòng seed cố định, đọc qua `uniq_roles_code` hoặc nạp sẵn cùng `ROLE_PERMISSIONS`). `permissions` = `ROLE_PERMISSIONS[roleCode]`, **bỏ** các mã trong `GROUP_GATED_PERMISSIONS` (`cdr:listen_audio`, `cdr:download_audio`) khi `user_groups.allow_recording_access = 0` đọc ở bước 1, sắp xếp theo `code` (`docs/modules/10_permissions_and_roles.md` mục 2.3). Lý do: `PermissionsGuard` kiểm tra quyền vai trò theo claim `roleCode`, nên quyền trả cho frontend phải tính từ cùng giá trị đó; nếu đọc `user_roles`, vai trò vừa đổi qua `PUT /users/:id/role` (không thu hồi phiên) sẽ hiện menu mà backend còn trả `403 FORBIDDEN_PERMISSION` tới lần cấp token kế tiếp. Vai trò mới có hiệu lực đồng thời ở guard và `/auth/me` từ lần refresh hoặc đăng nhập kế tiếp (tối đa `security_access_token_minutes`); luồng tải lại trang refresh trước rồi mới gọi `/auth/me` (`docs/00_overview_and_architecture.md` mục 5.3.2) nên lúc đó luôn là vai trò mới nhất. Cờ nhóm thì có hiệu lực ngay vì đọc từ CSDL.
- **Response** `200`: `data` đúng cấu trúc `user` của mục 3.1 (cùng bảng nguồn trường, trừ `roleCode`/`roleName` lấy theo bước 3), kể cả khi gọi bằng token `PASSWORD_CHANGE_ONLY`; không có `mustChangePassword` (cờ này chỉ có ở response đăng nhập; token giới hạn không có Refresh Token nên không tồn tại qua tải lại trang).

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy thông tin tài khoản thành công",
  "data": {
    "id": 10,
    "username": "cdr.evnit",
    "fullName": "Trần Thị B",
    "email": "cdr.evnit@evn.com.vn",
    "avatarUrl": "/media/avatars/8a1d2c3e-5b6f-4a7d-9e0f-1b2c3d4e5f60.jpg",
    "userGroup": {
      "id": 1,
      "name": "Nhóm QLND Khối CNTT",
      "organizationId": 2,
      "organizationName": "Khối CNTT",
      "allowRecordingAccess": false
    },
    "roleCode": "USER_RECORDING",
    "roleName": "Thành viên nghe ghi âm",
    "permissions": ["cdr:export", "cdr:filter_advanced", "cdr:view", "org:view", "prefix:view", "qos:view", "report:export", "report:view", "user_group:view"]
  },
  "timestamp": "2026-10-26T09:31:00+07:00"
}
```

  Ví dụ: `USER_RECORDING` (11 mã) trong nhóm chưa được cấp ghi âm nên còn 9 mã, không có `cdr:listen_audio`, `cdr:download_audio`; nhóm độc lập thì `organizationId`, `organizationName` là `null`.
- **Lỗi**:

| HTTP | `errorCode` | Khi nào |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Có query param |
| `401` | `UNAUTHORIZED` | Access Token thiếu, sai, hết hạn hoặc của cổng Admin (guard); kiểm tra tài khoản ở mỗi request không qua (bước 2) |

  Không có `403` (không qua `PermissionsGuard`, nhóm `INACTIVE` trả `401` ở bước 2), `404`, `503`.
- **Frontend**: chỉ gọi khi store `authUser` chưa có `user`, tức sau lần refresh lúc vào cổng hoặc tải lại trang (`docs/00_overview_and_architecture.md` mục 5.3.2); sau đăng nhập không gọi (đăng nhập đã trả `user`), sau tự đổi mật khẩu không gọi. Gọi qua API client cổng Member (`401` → refresh một lần rồi gửi lại); thành công thì lưu `data` vào `authUser.user`. Router guard kiểm `meta.permissions` và sidebar `MemberLayout` ẩn mục thiếu quyền (`docs/00_overview_and_architecture.md` mục 5.3.4) theo `permissions`; ẩn/hiện chức năng ghi âm theo `permissions` (đã áp cờ nhóm) và `userGroup.allowRecordingAccess` (`docs/modules/02_user_group.md` mục 5.3). Header `MemberLayout` hiển thị `fullName`, `roleName` và tên nhóm `userGroup.name`, ảnh `avatarUrl` (`null` thì ảnh chữ cái đầu tạo từ `fullName` ở frontend). Đăng xuất xóa `user` cùng Access Token (mục 3.2.1). **Thông báo bảo trì** (chủ dự án chốt ở U04): `/auth/me` không cho biết chế độ bảo trì; `MemberLayout` hiện `.maintenance-alert-banner` (`docs/03_ui_design.md` mục 6.7, bản cổng Member không có liên kết tới cài đặt hệ thống) khi API client phát sự kiện nhận `503 MAINTENANCE` từ một API nghiệp vụ, và ẩn khi một API nghiệp vụ (không phải `/auth/me`, `/auth/refresh`, `/auth/logout`) trả thành công; không đọc cờ từ `localStorage`/`sessionStorage`. Mẫu: `window.memberSession.loadMe`, `renderAccount`, `getAccount` và biểu ngữ `#maintenanceAlertBanner` trong `templates/member/main.js`.
- Index phục vụ: khóa chính `users`, `user_groups`, `organizations`; `uniq_roles_code` (nếu không nạp sẵn `roles`).

### 3.2.1. Làm mới phiên và Đăng xuất (`POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`)

- **`POST /auth/refresh`** (đặc tả chung cho cả hai cổng; bản Admin `POST /api/v1/admin/auth/refresh` khác ở các điểm ghi tại `docs/modules/04_auth_admin.md` mục 3.5):
  - **Guard**: public (không cần Access Token). **Không** bị chế độ bảo trì chặn (`docs/02_api_contracts.md` mục 1.2, chủ dự án chốt ở U02): đang bảo trì vẫn xoay vòng và cấp token như bình thường, để phiên giữ nguyên và frontend gọi được `GET /auth/me` rồi hiển thị thông báo bảo trì; các API nghiệp vụ khác vẫn `503`. Không có body; gửi body có trường thì `400 VALIDATION_ERROR`. Đọc Refresh Token từ cookie (`Path=/api/v1/auth`).
  - **Xử lý** (một transaction, theo thứ tự; chính sách `docs/01_database_schema.md` mục 6.1):
    1. Không có cookie: `401`.
    2. `SELECT ... FOR UPDATE` phiên theo `refresh_token_hash` = SHA-256 của cookie và `actor_type` của cổng (`USER`). Không thấy: `401`.
    3. Phiên đã thu hồi:
       - `ROTATED` và `revoked_at` cách hiện tại ≤ 30 giây: đi theo `replaced_by_session_id` (tối đa 5 bước) tới phiên đang hiệu lực. Có thì kiểm tra tài khoản (bước 5) rồi chỉ cấp Access Token mới (`sid` = id phiên đích), **không** `Set-Cookie`, không ghi CSDL. Không có thì `401` (không coi là dùng lại).
       - `ROTATED` quá 30 giây (dùng lại token): thu hồi mọi phiên còn hiệu lực của tài khoản (`REUSE_DETECTED`), ghi `audit_logs` `AUTH / TOKEN_REUSE_DETECTED` (`actor_type` = `USER`, `actor_id` = chủ phiên, `actor_name` = `users.full_name`, `resource_id` = id tài khoản, `ip_address`, `user_agent` của request, `action_details = { "revokedCount": n }`), **commit** rồi trả `401`.
       - Lý do thu hồi khác: `401`.
    4. `expires_at <= NOW()`: `401`.
    5. Đọc `users` theo khóa chính `actor_id` của phiên, join `user_groups` theo khóa chính (đọc thường, không khóa). Tài khoản `status` khác `ACTIVE` hoặc nhóm `INACTIVE`: `401` (bình thường phiên đã bị thu hồi khi khóa/ngừng hoạt động; nhánh nhóm `INACTIVE` là chốt phòng vệ như bước 2 của mục 3.1). Không xét `locked_until`, `must_change_password`, tuổi mật khẩu, không ghi `audit_logs`.
    6. Xoay vòng: tạo phiên mới (`refresh_token_hash` của Refresh Token mới, `ip_address`/`user_agent` của request, `last_used_at = NOW()`, chép `actor_type`, `actor_id`, `remember_me`, `logged_in_at`, `expires_at` của phiên cũ); phiên cũ `revoked_at = NOW()`, `revoked_reason = 'ROTATED'`, `replaced_by_session_id` = id phiên mới. Ký Access Token mới bằng `JWT_USER_SECRET` với `sub`, `userGroupId`, `roleCode` (đọc lại từ `user_roles` lúc cấp, nên vai trò vừa đổi có hiệu lực ngay), `sid` = id phiên mới. Nhánh ân hạn (bước 3) ký cùng các claim này.
  - **Response** `200`, `Set-Cookie` cookie mới (`Max-Age` = số giây còn lại tới `expires_at` khi `remember_me = 1`, không có `Max-Age` khi `0`; trừ nhánh ân hạn):

    ```json
    {
      "success": true,
      "statusCode": 200,
      "message": "Làm mới phiên thành công",
      "data": { "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...", "expiresIn": 900 },
      "timestamp": "2026-10-26T09:45:00+07:00"
    }
    ```

    `expiresIn` = `security_access_token_minutes` × 60 (giây). Không trả thông tin tài khoản: frontend gọi `GET /auth/me` sau đó (`docs/00_overview_and_architecture.md` mục 5.3.2).
  - **Lỗi**: `400 VALIDATION_ERROR` (body có trường); mọi nhánh còn lại `401 UNAUTHORIZED`, cùng thông điệp, và luôn kèm `Set-Cookie` xóa cookie (cùng `Path`, `Max-Age=0`). Không có `403`/`503`. Refresh thành công không ghi `audit_logs`; chỉ nhánh dùng lại token ghi `TOKEN_REUSE_DETECTED`.
  - **Frontend** (`docs/00_overview_and_architecture.md` mục 5.3.2): API client cổng Member gọi refresh **một lần** cho mọi request đồng thời (single-flight); không áp refresh-khi-`401` cho chính `/auth/refresh` và `/auth/login`; `503 MAINTENANCE` của API khác không kích hoạt refresh và không xóa phiên. Access Token chỉ giữ trong store `authUser` (bộ nhớ). Mẫu `window.memberSession` (`refreshOnce`, `request`, `ensureSession`) trong `templates/member/main.js`.
  - Index phục vụ: `uniq_session_token` (bước 2), khóa chính `auth_sessions` (đi chuỗi `replaced_by_session_id`), khóa chính `users`, `user_groups`, `user_roles` (bước 5–6), `idx_session_actor` (thu hồi mọi phiên khi dùng lại token).
- **`POST /auth/logout`** (đặc tả chung cho cả hai cổng; bản Admin `POST /api/v1/admin/auth/logout` khác ở các điểm ghi tại `docs/modules/04_auth_admin.md` mục 3.5):
  - **Guard**: `UserAuthGuard`, nhận cả token `PASSWORD_CHANGE_ONLY`; không cần mã quyền. **Không** bị chế độ bảo trì chặn (`docs/02_api_contracts.md` mục 1.2, chủ dự án chốt ở U03): đang bảo trì vẫn thu hồi phiên, xóa cookie và ghi audit như bình thường; nếu bị chặn thì frontend chỉ xóa store, cookie và phiên còn sống nên hết bảo trì người kế tiếp trên cùng trình duyệt (máy dùng chung) tự vào lại tài khoản qua refresh. Kiểm tra tài khoản ở mỗi request của guard (tài khoản không còn `ACTIVE`, nhóm `INACTIVE`, token đầy đủ mà `must_change_password = 1`) vẫn áp: trả `401`, nhưng các trường hợp đó phiên đã bị thu hồi từ trước (khóa, ngừng hoạt động, đặt lại mật khẩu), client refresh một lần, refresh `401` xóa cookie. Không có body; gửi body có trường thì `400 VALIDATION_ERROR`. Không có query. Đọc Refresh Token từ cookie (`Path=/api/v1/auth`, cookie được gửi kèm vì `/api/v1/auth/logout` nằm trong `Path`).
  - **Xử lý** (một transaction):
    1. Không có cookie (kể cả khi gọi bằng token `PASSWORD_CHANGE_ONLY`, vốn không có Refresh Token): bỏ qua bước 2–3.
    2. `SELECT ... FOR UPDATE` phiên theo `refresh_token_hash` = SHA-256 của cookie, `actor_type` của cổng (`USER`) **và** `actor_id` = `sub` của Access Token. Không thấy (kể cả cookie thuộc tài khoản khác): không thu hồi gì.
    3. Phiên `ROTATED` (tab khác vừa xoay vòng): đi theo chuỗi `replaced_by_session_id` (tối đa 5 bước, không xét khoảng ân hạn 30 giây, không coi là dùng lại token) tới phiên đang hiệu lực, như `DELETE /auth/sessions/:id` (`docs/01_database_schema.md` mục 6.1). Phiên đích còn hiệu lực (`revoked_at IS NULL AND expires_at > NOW()`): `revoked_at = NOW()`, `revoked_reason = 'LOGOUT'`, ghi `audit_logs` `AUTH / LOGOUT` (`actor_type`, `actor_id` = người gọi, `actor_name` = `users.full_name` (bản Admin: `admins.full_name`), `resource_id` = id phiên bị thu hồi, `action_details` `NULL`, `ip_address`, `user_agent` của request). Phiên đích đã thu hồi vì lý do khác hoặc đã hết hạn: không ghi gì.
    4. Luôn trả `200` kèm `Set-Cookie` xóa cookie (cùng `Path`, `Max-Age=0`). `audit_logs` `LOGOUT` chỉ ghi khi bước 3 thực sự thu hồi một phiên, nên bấm đăng xuất hai lần hoặc đăng xuất bằng token `PASSWORD_CHANGE_ONLY` không sinh dòng audit.
  - **Response** `200`:

    ```json
    {
      "success": true,
      "statusCode": 200,
      "message": "Đăng xuất thành công",
      "data": null,
      "timestamp": "2026-10-26T09:50:00+07:00"
    }
    ```

  - **Lỗi**: `400 VALIDATION_ERROR` (body có trường, có query); `401 UNAUTHORIZED` (Access Token thiếu, sai hoặc hết hạn, hoặc kiểm tra tài khoản ở mỗi request không qua; do guard trả, không xóa cookie). Không có `403`/`404`/`409`/`503`: không có cookie, phiên đã thu hồi hay phiên không thuộc người gọi đều trả `200` (idempotent); chế độ bảo trì không chặn.
  - **Frontend**: gọi qua API client của cổng, nên Access Token hết hạn thì client refresh một lần rồi gửi lại logout (`docs/00_overview_and_architecture.md` mục 5.3.2). Sau khi gọi, **dù thành công hay lỗi** (mạng, `401`), frontend xóa Access Token và thông tin tài khoản khỏi store, ngắt Socket.IO của cổng rồi chuyển về trang đăng nhập của cổng. Access Token cũ (và token đang giữ ở tab khác) hết hiệu lực tự nhiên sau tối đa `security_access_token_minutes` (15) phút; tab khác bị đưa về đăng nhập ở lần refresh kế tiếp. Đăng xuất một cổng không ảnh hưởng phiên của cổng kia.
  - **Frontend cổng Member** (bản Admin ở `docs/modules/04_auth_admin.md` mục 3.5): nút "Đăng xuất" ở sidebar (`MemberLayout`) mở hộp xác nhận `ConfirmModal` (`docs/03_ui_design.md` mục 6.6, biến thể `danger`); bấm xác nhận thì khóa nút ("Đang đăng xuất..."), gọi API qua `request()` của client cổng Member, rồi **luôn** xóa store `authUser` và `preferencesUser` (`docs/modules/08_user_profile.md` mục 3.5.1; cache `memberTheme` ở `localStorage` giữ lại), ngắt Socket.IO namespace `/notifications` và chuyển về `member.login`. `503 MAINTENANCE` không thể xảy ra với route này; nếu vẫn nhận (máy chủ cấu hình sai) thì xử lý như lỗi khác. Mẫu `window.memberSession.logout` và `confirmLogout` trong `templates/member/main.js`; mọi trang `templates/member/*` (trừ `login.html`) dùng cùng hộp `#logoutModal`.
  - Index phục vụ: `uniq_session_token` (tìm phiên theo `refresh_token_hash`), khóa chính (đi theo `replaced_by_session_id`).

### 3.3. Danh sách người dùng (`GET /api/v1/users`)

- **Mục đích**: danh sách tài khoản người dùng có tìm kiếm, lọc và phân trang. Dùng cho: bảng người dùng của màn hình Người dùng (`admin.users`, bản Admin, mục 5.1) và bảng thành viên của màn hình Quản trị nhóm (`member.group-admin`, bản User, `docs/modules/02_user_group.md` mục 5.3). Phần tử là bản **thu gọn** (chủ dự án chốt ở N01, theo quy ước danh sách O02): không trả `updatedAt`, `mustChangePassword`, `lockedUntil` (xem ở `GET /users/:id`, mục 3.3.1).
- **Hai route**, chung service `UsersService.list(filter, scope)` và DTO phần tử:
  - Bản Admin `GET /api/v1/admin/users`: `AdminAuthGuard` → `PermissionsGuard` `user:view` (seed: `ROOT_ADMIN`, `SYSTEM_ADMIN`). Token `PASSWORD_CHANGE_ONLY` `403 PASSWORD_CHANGE_REQUIRED`; tài khoản không còn `ACTIVE` hoặc token đầy đủ mà `must_change_password = 1` `401 UNAUTHORIZED` (`docs/modules/04_auth_admin.md` mục 3.1.1). Không bị chế độ bảo trì chặn. Phạm vi toàn hệ thống, lọc tùy chọn theo nhóm bằng `userGroupId` (chỉ bản Admin).
  - Bản User `GET /api/v1/users`: `UserAuthGuard` → bảo trì (`503 MAINTENANCE`) → `PermissionsGuard` `user:view` theo claim `roleCode` (seed: chỉ `GROUP_ADMIN`); kiểm tra tài khoản ở mỗi request (mục 3.2). **Cô lập nhóm**: thêm điều kiện `u.user_group_id = <user_group_id của người gọi đọc từ CSDL ở bước kiểm tra tài khoản>`. DTO query không có `userGroupId`: gửi tham số này (kể cả đúng nhóm của mình) trả `400` (`docs/02_api_contracts.md` mục 1.1). Không có `403 FORBIDDEN_SCOPE_ACCESS` (không nhận tham số nhóm).
  - Thứ tự kiểm tra: guard xác thực (`401`/`403 PASSWORD_CHANGE_REQUIRED`) → bảo trì (`503`, chỉ bản User) → quyền (`403 FORBIDDEN_PERMISSION`) → query (`400`) → kiểm tra tài khoản (`401`).
- **Query** (quy tắc chung `docs/02_api_contracts.md` mục 2.2; không có body):

| Tham số | Kiểu | Mặc định | Ràng buộc | Điều kiện SQL |
|---|---|---|---|---|
| `page` | số nguyên | 1 | ≥ 1 | |
| `limit` | số nguyên | 20 | 1–100 | |
| `search` | chuỗi | — | Cắt khoảng trắng hai đầu, rỗng = không lọc, ≤ 100 ký tự; khớp **chứa** trên họ tên, tên đăng nhập, email, chức danh, số điện thoại (`OR`) | `u.full_name LIKE :pattern OR u.username LIKE :pattern OR u.email LIKE :pattern OR u.job_title LIKE :pattern OR u.phone_number LIKE :pattern` |
| `status` | enum | — (`ACTIVE` + `LOCKED`) | `ACTIVE` \| `LOCKED` \| `INACTIVE`. Không gửi thì **bỏ** tài khoản `INACTIVE` (chủ dự án chốt ở N01: tài khoản ngừng hoạt động tích lũy dần do chuyển công tác, chỉ xem khi chọn `INACTIVE`) | `u.status = :status`; không gửi: `u.status <> 'INACTIVE'` |
| `roleCode` | enum | — | `GROUP_ADMIN` \| `USER_RECORDING` \| `REGULAR_USER` | `r.code = :roleCode` |
| `userGroupId` | số nguyên | — | **Chỉ bản Admin** (bản User `400`). `^[1-9][0-9]{0,9}$` và ≤ 4294967295; không nhận chuỗi `null`. Id không tồn tại không phải lỗi: `200`, `data = []` (quy ước O02) | `u.user_group_id = :userGroupId` |

  Các bộ lọc kết hợp bằng `AND`. Sai định dạng, ngoài khoảng, enum lạ, tham số lặp lại hoặc tham số khác (`groupId`, `sort`, `order`, `isGroupAdmin`…) trả `400 VALIDATION_ERROR` với `errors` theo tên tham số.
- **Xử lý** (chỉ đọc, không transaction, không ghi `audit_logs`):
  1. Kiểm tra tài khoản theo khóa chính (`admins`, hoặc `users` + `user_groups` ở bản User; bản User lấy `user_group_id` từ dòng `users` vừa đọc làm `:scopeGroupId`).
  2. Đếm và lấy trang trong cùng một điều kiện:

```sql
SELECT u.id, u.username, u.email, u.full_name, u.job_title, u.phone_number, u.avatar_url, u.status,
       u.last_login_at, u.created_at,
       r.code AS role_code, r.name AS role_name,
       ug.id AS ug_id, ug.code AS ug_code, ug.name AS ug_name,
       IFNULL(ug.representative_user_id = u.id, 0) AS is_representative
FROM users u
JOIN user_roles ur ON ur.user_id = u.id
JOIN roles r ON r.id = ur.role_id
JOIN user_groups ug ON ug.id = u.user_group_id
WHERE (:scopeGroupId IS NULL OR u.user_group_id = :scopeGroupId)     -- chỉ bản User
  AND (:userGroupId IS NULL OR u.user_group_id = :userGroupId)       -- chỉ bản Admin
  AND (:status IS NULL AND u.status <> 'INACTIVE' OR u.status = :status)
  AND (:roleCode IS NULL OR r.code = :roleCode)
  AND (:search IS NULL OR u.full_name LIKE :pattern ESCAPE '\' OR u.username LIKE :pattern ESCAPE '\'
       OR u.email LIKE :pattern ESCAPE '\' OR u.job_title LIKE :pattern ESCAPE '\' OR u.phone_number LIKE :pattern ESCAPE '\')
ORDER BY ug.code, is_representative DESC, (r.code = 'GROUP_ADMIN') DESC, u.full_name, u.id
LIMIT :limit OFFSET (:page - 1) * :limit;
-- :pattern = CONCAT('%', <search đã thoát \ % _>, '%'); total: SELECT COUNT(*) cùng FROM/JOIN/WHERE (không ORDER BY)
```

  3. Thứ tự cố định (không có tham số sắp xếp, chủ dự án chốt ở N01): mã nhóm (`ug.code`, collation `utf8mb4_unicode_ci`), rồi trong mỗi nhóm người đại diện → Quản trị viên nhóm → còn lại, mỗi khối `full_name`, `id` tăng dần. Bản User (một nhóm) vì vậy cùng thứ tự với danh bạ `GET /user-groups/me/members` (`docs/modules/02_user_group.md` mục 3.6). `page` vượt `totalPages` trả `200`, `data = []`.
- **Lưu ý dữ liệu**: tài khoản của nhóm `INACTIVE` đều `INACTIVE` (`docs/modules/02_user_group.md` mục 3.4) nên chỉ hiện khi `status=INACTIVE`. Mỗi người dùng có đúng một dòng `user_roles` (khóa chính `user_id`), JOIN không nhân dòng.
- **Response** `200` (khung `docs/02_api_contracts.md` mục 2.2, không có khóa cấp cao khác; không có số liệu thống kê tổng hợp). Mỗi phần tử đúng 14 trường:

| Trường | Kiểu | Nguồn | Ghi chú |
|---|---|---|---|
| `id` | số | `users.id` | |
| `username` | chuỗi ≤ 100 | `username` | |
| `email` | chuỗi ≤ 150 | `email` | |
| `fullName` | chuỗi ≤ 150 | `full_name` | |
| `jobTitle` | chuỗi ≤ 150 \| `null` | `job_title` | |
| `phoneNumber` | chuỗi ≤ 30 \| `null` | `phone_number` | |
| `avatarUrl` | chuỗi \| `null` | `avatar_url` | Đường dẫn tương đối `/media/avatars/...` |
| `status` | `ACTIVE` \| `LOCKED` \| `INACTIVE` | `status` | |
| `roleCode` | `GROUP_ADMIN` \| `USER_RECORDING` \| `REGULAR_USER` | `roles.code` qua `user_roles` | |
| `roleName` | chuỗi ≤ 150 | `roles.name` | Tên vai trò từ seed (dữ liệu, không phải chuỗi định dạng) |
| `isRepresentative` | boolean | `user_groups.representative_user_id = users.id` | Người đại diện nhóm |
| `userGroup` | đối tượng | `user_groups` | `{ id, code, name }` (quy ước U05); bản User luôn là nhóm của người gọi |
| `lastLoginAt` | chuỗi ISO 8601 `+07:00` \| `null` | `last_login_at` | `null`: chưa đăng nhập lần nào |
| `createdAt` | chuỗi ISO 8601 `+07:00` | `created_at` | Ngày tham gia |

  Không trả `password_hash`, `must_change_password`, `failed_login_count`, `locked_until`, `password_changed_at`, `updated_at`, `permissions` hay thông tin phiên.

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy danh sách người dùng thành công",
  "data": [
    {
      "id": 10,
      "username": "tran.b",
      "email": "tran.b@71portal.vn",
      "fullName": "Trần Thị B",
      "jobTitle": "Trưởng nhóm Kỹ thuật Vận hành",
      "phoneNumber": "0912.345.678",
      "avatarUrl": "/media/avatars/8a1d2c3e-5b6f-4a7d-9e0f-1b2c3d4e5f60.jpg",
      "status": "ACTIVE",
      "roleCode": "GROUP_ADMIN",
      "roleName": "Quản trị viên nhóm",
      "isRepresentative": true,
      "userGroup": { "id": 1, "code": "UMO-IT-01", "name": "Khối Công nghệ Thông tin - Nhóm Vận hành" },
      "lastLoginAt": "2026-11-05T08:12:40+07:00",
      "createdAt": "2026-03-15T08:30:00+07:00"
    },
    {
      "id": 104,
      "username": "anh.nt",
      "email": "anh.nt@71portal.vn",
      "fullName": "Nguyễn Tuấn Anh",
      "jobTitle": null,
      "phoneNumber": null,
      "avatarUrl": null,
      "status": "LOCKED",
      "roleCode": "REGULAR_USER",
      "roleName": "Thành viên",
      "isRepresentative": false,
      "userGroup": { "id": 1, "code": "UMO-IT-01", "name": "Khối Công nghệ Thông tin - Nhóm Vận hành" },
      "lastLoginAt": null,
      "createdAt": "2026-04-02T10:00:00+07:00"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 2, "totalPages": 1, "hasNext": false, "hasPrev": false },
  "timestamp": "2026-11-06T09:00:00+07:00"
}
```

Ví dụ trên là bản Admin với `?userGroupId=1&search=an` (không gửi `status` nên không có tài khoản `INACTIVE`); bản User của Quản trị viên nhóm 1 cùng cấu trúc.

- **Lỗi**:

| HTTP | `errorCode` | Khi nào |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Query sai định dạng/ngoài khoảng, enum lạ, tham số lặp lại hoặc không có trong bảng trên; bản User gửi `userGroupId` (`errors.<tên tham số>`) |
| `401` | `UNAUTHORIZED` | Thiếu/sai/hết hạn Access Token; tài khoản người gọi không còn `ACTIVE` (bản User: cả nhóm `INACTIVE`) hoặc token đầy đủ mà `must_change_password = 1` |
| `403` | `PASSWORD_CHANGE_REQUIRED` | Gọi bằng token `PASSWORD_CHANGE_ONLY` |
| `403` | `FORBIDDEN_PERMISSION` | Vai trò thiếu `user:view` (bản User: `USER_RECORDING`, `REGULAR_USER`) |
| `503` | `MAINTENANCE` | Chỉ bản User, chế độ bảo trì đang bật |

Không có `404` (kể cả `userGroupId` không tồn tại), `409`, `403 FORBIDDEN_SCOPE_ACCESS`.

- **Frontend**: Admin theo mục 5.1 (mẫu `templates/admin/users.js`: `mockGetUsers`, `loadUsers`, `renderUsersTable`, `renderUsersPagination`, `mockGetGroupOptions`, `loadGroupSidebar`); Member theo `docs/modules/02_user_group.md` mục 5.3 (mẫu `templates/member/group-admin.js`: `mockGetUsers`, `loadMembers`, `renderMembers`). Chung cho hai màn hình:
  - Gọi qua `adminSession.request`/`memberSession.request`; quy ước danh sách `docs/modules/04_auth_admin.md` mục 5.2: tìm kiếm 300 ms/Enter, đổi bộ lọc về trang 1, chỉ hiển thị response của request sau cùng, trang rỗng mà `page > 1` thì lùi về trang cuối, rỗng có lọc/không lọc khác thông điệp, trạng thái tải/lỗi + "Thử lại" (cổng Member: `503` hiện thông điệp bảo trì + "Thử lại" trong khối, cùng biểu ngữ). `limit` = `itemsPerPage` của store `preferencesAdmin`/`preferencesUser` (10/20/50), đọc lại mỗi lần gửi. Tổng theo bộ lọc lấy `pagination.total`; không có thẻ đếm theo trạng thái (API không trả).
  - Ô vai trò: "Tất cả vai trò", `GROUP_ADMIN` "Quản trị viên nhóm", `USER_RECORDING` "Thành viên nghe ghi âm", `REGULAR_USER` "Thành viên". Ô trạng thái: "Đang sử dụng" (không gửi `status`, mặc định), `ACTIVE` "Hoạt động", `LOCKED` "Đã khóa", `INACTIVE` "Ngừng hoạt động".
  - Ảnh `null` → chữ cái đầu của họ tên (không dùng dịch vụ ảnh ngoài); `isRepresentative` → nhãn "★ Đại diện"; nhãn vai trò theo `roleCode` (nhãn tiếng Việt do frontend ánh xạ, `roleName` dùng khi mã chưa có nhãn); `createdAt` `dd/MM/yyyy`, `lastLoginAt` `dd/MM/yyyy HH:mm` hoặc "Chưa đăng nhập".
  - Dòng `INACTIVE` (trạng thái cuối) không có nút thao tác ghi; nút ghi theo mã quyền của store (`user:edit`, `user:delete`, `group:manage_admin`, `group:toggle_recording`) và điều kiện của từng API (N02–N09).
- **Index phục vụ**: khóa chính `admins`/`users` (kiểm tra tài khoản); `idx_users_group` cho `u.user_group_id = :scopeGroupId`/`:userGroupId` (một nhóm vài chục tới vài trăm người); bản Admin không lọc nhóm quét `users` (vài nghìn dòng) rồi sắp xếp trong bộ nhớ, chấp nhận được với quy mô này; khóa chính `user_roles`, `roles`, `user_groups` cho JOIN. `search` khớp chứa không dùng index (như G01, G04).

### 3.3.1. Chi tiết người dùng (`GET /api/v1/users/:id`)

- **Mục đích**: thông tin **đầy đủ** của một tài khoản người dùng: các trường của phần tử danh sách (mục 3.3) cộng trạng thái mật khẩu/khóa tạm và thời điểm cập nhật. Dùng cho: hộp sửa `#userModal` của `admin.users` (bản Admin, tải mỗi lần mở hộp, mục 5.1; phần lưu đặc tả ở mục 3.5) và hộp "Xem chi tiết" `#viewMemberModal` của `member.group-admin` (bản User, tải mỗi lần mở hộp, `docs/modules/02_user_group.md` mục 5.3). Chủ dự án chốt ở N02: đúng 17 trường (không thêm `passwordChangedAt`).
- **Hai route**, chung service `UsersService.getDetail(id, scope)` và DTO (hai bản trả cùng trường):
  - Bản Admin `GET /api/v1/admin/users/:id`: `AdminAuthGuard` → `PermissionsGuard` `user:view` (seed: `ROOT_ADMIN`, `SYSTEM_ADMIN`); `401`/`403` như mục 3.3; không bị chế độ bảo trì chặn. Xem mọi người dùng của mọi nhóm, kể cả `INACTIVE`.
  - Bản User `GET /api/v1/users/:id`: `UserAuthGuard` → bảo trì (`503 MAINTENANCE`) → `PermissionsGuard` `user:view` theo claim `roleCode` (seed: chỉ `GROUP_ADMIN`); kiểm tra tài khoản ở mỗi request (mục 3.2). **Cô lập nhóm**: người dùng đích có `user_group_id` khác `user_group_id` của người gọi (đọc từ dòng `users` ở bước kiểm tra tài khoản, không dùng claim) trả `403 FORBIDDEN_SCOPE_ACCESS` (quy ước A13: bản ghi nhóm khác vẫn `403`, chỉ id không tồn tại mới `404`). Người gọi xem được chính mình.
  - Thứ tự kiểm tra: guard xác thực (`401`/`403 PASSWORD_CHANGE_REQUIRED`) → bảo trì (`503`, chỉ bản User) → quyền (`403 FORBIDDEN_PERMISSION`) → `:id` và query (`400`) → kiểm tra tài khoản (`401`) → tìm người dùng (`404`) → phạm vi (`403 FORBIDDEN_SCOPE_ACCESS`, chỉ bản User).
- **Request**: `:id` là `users.id` (`^[1-9][0-9]{0,9}$` và ≤ 4294967295, sai thì `400` với `errors.id`). Không có query, không có body; gửi query param trả `400 VALIDATION_ERROR` với `errors.<tên tham số>`.
- **Xử lý** (chỉ đọc, không transaction, không ghi `audit_logs`; dữ liệu chỉ để hiển thị, thao tác ghi mục 3.4–3.10 tự kiểm tra lại khi chạy):
  1. Kiểm tra tài khoản theo khóa chính (`admins`, hoặc `users` + `user_groups` ở bản User; bản User lấy `user_group_id` từ dòng `users` vừa đọc làm `:scopeGroupId`).
  2. Đọc người dùng; không có dòng → `404 NOT_FOUND`; bản User `ug.id <> :scopeGroupId` → `403 FORBIDDEN_SCOPE_ACCESS`. Tài khoản `INACTIVE` (kể cả của nhóm `INACTIVE`) vẫn trả `200`.

```sql
SELECT u.id, u.username, u.email, u.full_name, u.job_title, u.phone_number, u.avatar_url, u.status,
       u.must_change_password,
       IF(u.locked_until > NOW(), u.locked_until, NULL) AS locked_until,
       u.last_login_at, u.created_at, u.updated_at,
       r.code AS role_code, r.name AS role_name,
       ug.id AS ug_id, ug.code AS ug_code, ug.name AS ug_name,
       IFNULL(ug.representative_user_id = u.id, 0) AS is_representative
FROM users u
JOIN user_roles ur ON ur.user_id = u.id
JOIN roles r ON r.id = ur.role_id
JOIN user_groups ug ON ug.id = u.user_group_id
WHERE u.id = :id;
```

- **Response** `200`: `data` là một đối tượng đúng 17 trường: 14 trường của phần tử mục 3.3 (cùng kiểu, cùng nguồn, cùng nghĩa) cộng 3 trường dưới.

| Trường | Kiểu | Nguồn | Ghi chú |
|---|---|---|---|
| `id`, `username`, `email`, `fullName`, `jobTitle`, `phoneNumber`, `avatarUrl`, `status`, `roleCode`, `roleName`, `isRepresentative`, `userGroup`, `lastLoginAt`, `createdAt` | như mục 3.3 | | `userGroup = { id, code, name }`; bản User luôn là nhóm của người gọi |
| `mustChangePassword` | boolean | `must_change_password` | `true`: mật khẩu ban đầu/do quản trị viên đặt lại, người dùng chưa đổi (lần đăng nhập kế tiếp bị buộc đổi) |
| `lockedUntil` | chuỗi ISO 8601 `+07:00` \| `null` | `locked_until` | Chỉ khác `null` khi đang khóa tạm do sai mật khẩu (`locked_until > NOW()`); đã hết hạn thì `null`. Tách biệt với `status = LOCKED` |
| `updatedAt` | chuỗi ISO 8601 `+07:00` | `updated_at` | |

  Không trả `password_hash`, `failed_login_count`, `password_changed_at`, `permissions`, `allowRecordingAccess` hay thông tin phiên.

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy chi tiết người dùng thành công",
  "data": {
    "id": 104,
    "username": "anh.nt",
    "email": "anh.nt@71portal.vn",
    "fullName": "Nguyễn Tuấn Anh",
    "jobTitle": null,
    "phoneNumber": null,
    "avatarUrl": null,
    "status": "ACTIVE",
    "roleCode": "REGULAR_USER",
    "roleName": "Thành viên",
    "isRepresentative": false,
    "userGroup": { "id": 1, "code": "UMO-IT-01", "name": "Khối Công nghệ Thông tin - Nhóm Vận hành" },
    "mustChangePassword": true,
    "lockedUntil": "2026-11-06T09:15:00+07:00",
    "lastLoginAt": null,
    "createdAt": "2026-04-02T10:00:00+07:00",
    "updatedAt": "2026-11-06T09:00:00+07:00"
  },
  "timestamp": "2026-11-06T09:00:30+07:00"
}
```

- **Lỗi**:

| HTTP | `errorCode` | Khi nào |
|---|---|---|
| `400` | `VALIDATION_ERROR` | `:id` sai định dạng (`errors.id`), có query param (`errors.<tên tham số>`) |
| `401` | `UNAUTHORIZED` | Như mục 3.3 |
| `403` | `PASSWORD_CHANGE_REQUIRED` | Gọi bằng token `PASSWORD_CHANGE_ONLY` |
| `403` | `FORBIDDEN_PERMISSION` | Vai trò thiếu `user:view` (bản User: `USER_RECORDING`, `REGULAR_USER`) |
| `403` | `FORBIDDEN_SCOPE_ACCESS` | Chỉ bản User: người dùng đích thuộc nhóm khác |
| `404` | `NOT_FOUND` | Không có người dùng `:id` |
| `503` | `MAINTENANCE` | Chỉ bản User, chế độ bảo trì đang bật |

- **Frontend** (quy ước hộp chi tiết `docs/modules/01_organization.md` mục 3.1.2: gọi API **mỗi lần mở**, không dùng dữ liệu dòng danh sách; tiêu đề/tên lấy từ dòng đã bấm; thân hộp tải/lỗi + "Thử lại" riêng; chỉ hiển thị response của lần mở sau cùng; `404`/`403 FORBIDDEN_SCOPE_ACCESS` đóng hộp + toast cảnh báo + tải lại danh sách):
  - Admin – hộp sửa `#userModal` (mẫu `templates/admin/users.js`: `mockGetUserDetail`, `editUser`, `loadUserEdit`, `fillUserEditForm`): form ẩn khi đang tải/lỗi; điền họ tên, chức danh, số điện thoại từ `data`; `username`, `email`, nhóm (`userGroup.code – name`) chỉ đọc; vai trò hiện nhãn theo `roleCode`, không sửa trong hộp (đổi vai trò là `PUT /users/:id/role`, N07); không có ô trạng thái (khóa/mở khóa, ngừng hoạt động là API riêng, N05, N09). Dải thông tin trong hộp: "Chưa đổi mật khẩu tạm" khi `mustChangePassword`, "Đang khóa tạm do sai mật khẩu đến HH:mm dd/MM/yyyy" khi `lockedUntil`, cập nhật lần cuối `updatedAt`. `data.status = INACTIVE` (vừa ngừng hoạt động ở nơi khác) → đóng hộp + toast cảnh báo + tải lại danh sách. Phần gửi `PUT` đặc tả ở mục 3.5 (N04).
  - Member – hộp "Xem chi tiết" `#viewMemberModal` (mẫu `templates/member/group-admin.js`: `mockGetUserDetail`, `openViewMemberModal`, `loadMemberDetail`, `renderMemberDetail`): gọi qua `memberSession.request`; `503` hiện thông điệp bảo trì + "Thử lại" trong hộp (cùng biểu ngữ, U09). Hiển thị ảnh (hoặc chữ cái đầu), họ tên, `@username`, nhãn vai trò, trạng thái, "★ Đại diện" khi `isRepresentative`, nhóm `userGroup.code – userGroup.name`, chức danh, số điện thoại ("Chưa cập nhật" khi `null`), email, quyền ghi âm (chỉ khi nhóm `allowRecordingAccess` của store: `GROUP_ADMIN`/`USER_RECORDING` "Được cấp quyền"), mật khẩu ("Chưa đổi mật khẩu tạm" khi `mustChangePassword`), khóa tạm (`lockedUntil`), lần đăng nhập cuối ("Chưa đăng nhập" khi `null`), ngày tham gia `createdAt`, cập nhật `updatedAt`.
- **Index phục vụ**: khóa chính `admins`/`users` (kiểm tra tài khoản, bước 2), khóa chính `user_roles`, `roles`, `user_groups` cho JOIN. Không cần index mới.

### 3.4. Tạo người dùng mới (`POST /api/v1/users`)

- **Thẩm quyền thực hiện (Authorization)**:
  - **Quản trị viên hệ thống (System Admin)**: Được phép chỉ định `userGroupId` tùy ý hợp lệ trong danh mục nhóm người dùng.
  - **Quản trị viên nhóm (Group Admin, route User)**: Hệ thống tự động gán `userGroupId = req.user.userGroupId`. DTO bản User **không có** trường `userGroupId`: body có trường này (kể cả đúng nhóm của mình) thì trả `400` (`docs/02_api_contracts.md` mục 1.1).
- **Ràng buộc tạo tài khoản**:
  - `userGroupId`: Bắt buộc trên bản Admin (`users.user_group_id NOT NULL`). Người dùng luôn gắn cố định với nhóm người dùng ngay từ lúc khởi tạo.
  - Không có tùy chọn khởi tạo người dùng mà không thuộc nhóm nào.
- **Request Body**:

```json
{
  "userGroupId": 1,
  "username": "nguyen.vanc",
  "email": "vanc@evn.com.vn",
  "fullName": "Nguyễn Văn C",
  "jobTitle": "Kỹ sư Vận hành",
  "phoneNumber": "0987654321",
  "roleCode": "REGULAR_USER"
}
```

- **Mật khẩu ban đầu do hệ thống sinh**: body không có `password`. Hệ thống sinh mật khẩu tạm 16 ký tự đạt chính sách (`docs/01_database_schema.md` mục 6.1), đặt `must_change_password = 1`, và trả **một lần** trong response (`temporaryPassword`); hệ thống chỉ lưu bản băm, không có API xem lại.
- `roleCode` tùy chọn, mặc định `REGULAR_USER`; chỉ nhận `GROUP_ADMIN`, `USER_RECORDING`, `REGULAR_USER`. Gán `GROUP_ADMIN` cần thêm `group:manage_admin`; gán `USER_RECORDING` cần thêm `group:toggle_recording` và nhóm có `allow_recording_access = 1` (ngược lại `409 GROUP_RECORDING_DISABLED`).
- `jobTitle`, `phoneNumber` tùy chọn (`users.job_title`, `users.phone_number` cho phép NULL).
- `username`, `email`: định dạng và kiểm tra trùng (kể cả trùng chéo username ↔ email trong các user chưa `INACTIVE`, `409 ACCOUNT_DUPLICATE` có `errors.username`/`errors.email`) theo quy tắc chung `docs/02_api_contracts.md` mục 2; cách khóa và sinh mật khẩu tạm như `POST /admin/admins` (`docs/modules/04_auth_admin.md` mục 3.3), trên bảng `users` (`uniq_users_username`, `uniq_users_email`) thay cho `admins`. Đặc tả đầy đủ rà ở N03.
- Cùng transaction tạo dòng `users`, dòng `user_roles` và dòng `user_settings` (`user_type = USER`, giá trị mặc định, `docs/01_database_schema.md` mục 12); ghi `audit_logs` `USER / CREATE`. Response trả về `roleCode`, `roleName`.

- Mật khẩu được mã hóa `bcrypt.hash(password, 10)` trước khi lưu vào CSDL.

### 3.5. Cập nhật thông tin người dùng (`PUT /api/v1/users/:id`)

- **Mục đích**: Chỉnh sửa họ tên, chức danh, số điện thoại. Không nhận `roleCode` (vai trò chỉ đổi qua API 3.6) và không nhận `status`: khóa/mở khóa chỉ qua `PUT /api/v1/users/:id/status` (`ACTIVE` | `LOCKED`), ngừng hoạt động chỉ qua `DELETE /api/v1/users/:id`. Không nhận `avatarUrl`: ảnh đại diện chỉ do chính chủ tài khoản đổi qua `POST /api/v1/profile/avatar` (`docs/modules/08_user_profile.md` mục 3.3), quản trị viên không đổi ảnh của người khác. `username` và `email` bất biến sau khi tạo, không API nào sửa (`docs/01_database_schema.md` mục 6). Body có `roleCode`, `status`, `avatarUrl`, `username` hoặc `email` thì trả `400`.
- **`PUT /users/:id/status` chỉ chuyển giữa `ACTIVE` và `LOCKED`**: tài khoản đã `INACTIVE` trả `409` (`ACCOUNT_INACTIVE`), không kích hoạt lại được (`docs/01_database_schema.md` mục 14).
- **Tối thiểu 1 Quản trị viên nhóm**: `PUT /users/:id/status` sang `LOCKED` và `DELETE /users/:id` đều bị chặn `409 LAST_GROUP_ADMIN` nếu tài khoản là `GROUP_ADMIN` `ACTIVE` cuối cùng của nhóm (`docs/01_database_schema.md` mục 14). Ngoại lệ duy nhất là khi Quản trị viên hệ thống ngừng hoạt động cả nhóm (`docs/modules/02_user_group.md` mục 3.4).
- **Quy tắc bất biến nhóm (Group Immutability Rule)**:
  - **Nghiêm cấm thay đổi `user_group_id`**: Người dùng gắn liền với đơn vị tổ chức/nhóm người dùng suốt vòng đời tài khoản. Tuyệt đối không có khái niệm chuyển người dùng giữa các nhóm.
  - DTO không có trường `userGroupId`: body có trường này (kể cả trùng nhóm hiện tại) thì chặn với mã lỗi `400 BAD REQUEST: Thuộc tính nhóm người dùng là cố định từ lúc tạo, không thể thay đổi hoặc chuyển nhóm` (`docs/02_api_contracts.md` mục 3.5).

### 3.6. Đổi vai trò người dùng (`PUT /api/v1/users/:id/role`)

- **Body**: `{ "roleCode": "GROUP_ADMIN" | "USER_RECORDING" | "REGULAR_USER" }`.
- Quyền cần, điều kiện và xử lý: đặc tả tại `docs/modules/10_permissions_and_roles.md` mục 1.3 và 3.2.
- Hạ quyền Quản trị viên nhóm `ACTIVE` cuối cùng của nhóm bị từ chối `409` với thông báo: "Nhóm người dùng bắt buộc phải có ít nhất 1 quản trị viên".
- Không còn các endpoint `PUT /users/:id/group-admin` và `PATCH /user-groups/:id/members/:userId/recording-access`.

### 3.7. Khóa / Mở khóa người dùng (`PUT /api/v1/users/:id/status`)

- **Body**: `{ "status": "ACTIVE" | "LOCKED" }`; giá trị khác (kể cả `INACTIVE`) trả `400`.
- Câu đầu của transaction khóa dòng nhóm của tài khoản đích (`SELECT ... FOR UPDATE`, `docs/01_database_schema.md` mục 14), rồi kiểm tra theo thứ tự:
  1. Bản User: tài khoản đích thuộc nhóm khác trả `403 FORBIDDEN_SCOPE_ACCESS`; tài khoản đích là chính người gọi trả `403 SELF_ACTION_FORBIDDEN`.
  2. Tài khoản `INACTIVE` trả `409 ACCOUNT_INACTIVE`.
  3. Sang `LOCKED` mà tài khoản là `GROUP_ADMIN` `ACTIVE` cuối cùng của nhóm trả `409 LAST_GROUP_ADMIN`.
- Trạng thái mới bằng trạng thái hiện tại: trả `200`, không ghi gì.
- Sang `LOCKED`: thu hồi mọi phiên (`ACCOUNT_LOCKED`), ghi `audit_logs` `USER / LOCK`. Sang `ACTIVE`: ghi `USER / UNLOCK`. Không đổi `representative_user_id`, `locked_until`, `failed_login_count`.
- **Response** `200`: `data = { id, status }`.

### 3.8. Đặt lại mật khẩu người dùng (`PUT /api/v1/users/:id/reset-password`)

- Không có body. Kiểm tra phạm vi như mục 3.7 bước 1 (bản User: nhóm khác `403 FORBIDDEN_SCOPE_ACCESS`, chính mình `403 SELF_ACTION_FORBIDDEN`, tự đổi qua `PUT /profile/change-password`); tài khoản `INACTIVE` trả `409 ACCOUNT_INACTIVE`.
- Trong một transaction: sinh mật khẩu tạm 16 ký tự đạt chính sách (`docs/01_database_schema.md` mục 6.1; sinh và băm trước transaction như `docs/modules/04_auth_admin.md` mục 3.3), lưu bản băm, đặt `must_change_password = 1`, `failed_login_count = 0`, `locked_until = NULL` (giữ `password_changed_at`); thu hồi mọi phiên còn hiệu lực (`PASSWORD_CHANGED`, `n` = số phiên); ghi `audit_logs` `AUTH / PASSWORD_RESET` (`resource_id` = id người dùng, `action_details = { "targetActorType": "USER", "revokedCount": n }`, luôn ghi kể cả `n = 0`). Tài khoản `LOCKED` vẫn đặt lại được, trạng thái giữ `LOCKED`. Access Token đầy đủ còn hạn của người dùng đích bị từ chối ngay (`401` khi `must_change_password = 1`, `docs/01_database_schema.md` mục 6.1).
- **Response** `200`, header `Cache-Control: no-store`: `data = { "id": 25, "temporaryPassword": "<16 ký tự>" }`, trả **một lần**, giống `docs/modules/04_auth_admin.md` mục 3.6.

### 3.9. Ngừng hoạt động người dùng (`DELETE /api/v1/users/:id`)

- Khóa dòng nhóm và kiểm tra như mục 3.7 (bước 1, 2; bước 3 áp cho mọi `GROUP_ADMIN` `ACTIVE` cuối cùng: `409 LAST_GROUP_ADMIN`).
- Trong một transaction: `status = 'INACTIVE'`; thu hồi mọi phiên (`ACCOUNT_LOCKED`); nếu là `representative_user_id` của nhóm thì đặt `NULL`; giữ dòng `user_roles` (`docs/01_database_schema.md` mục 14); ghi `audit_logs` `USER / DEACTIVATE` (`action_details = { "revokedCount": n }`, kể cả `0`, như `docs/modules/04_auth_admin.md` mục 3.9).
- **Response** `200`: `data = { id, status: "INACTIVE" }`. Không xóa cứng, không kích hoạt lại; `username`/`email` được dùng lại cho tài khoản mới (mục 1.2).

### 3.10. Thu hồi mọi phiên của người dùng (`DELETE /api/v1/admin/users/:id/sessions`)

- Chỉ bản Admin, quyền `user:edit`. Không có body. Quản trị viên nhóm không có API này; họ khóa tài khoản (mục 3.7) để thu hồi phiên.
- Cùng cách xử lý `docs/modules/04_auth_admin.md` mục 3.7 (bỏ bước chặn chính mình và `ROOT_ADMIN`; bước 3, 5 đọc `users`, `actor_type = 'USER'`): thu hồi mọi phiên còn hiệu lực (`REVOKED_BY_ADMIN`); `n > 0` thì ghi `audit_logs` `AUTH / SESSION_REVOKED` (`resource_id` = id người dùng) với `action_details = { "targetActorType": "USER", "revokedCount": n }`, `n = 0` không ghi gì; trả `200` với `data = { revokedCount }`. Tài khoản `INACTIVE` trả `revokedCount = 0`. `:id` không tồn tại trả `404 NOT_FOUND`.

---

## 4. Kiến trúc Backend NestJS (`backend/src/core`, `apps/*`)

Theo quy tắc `docs/00_overview_and_architecture.md` mục 5.1: nghiệp vụ và entity ở `core`, controller ở `apps/admin` / `apps/member`, job nền ở `apps/worker`; các phần `apps/*` không import lẫn nhau.

```
backend/src/
├── core/auth/                          <-- dùng chung cho apps/member, apps/admin và realtime
│   ├── auth.module.ts
│   ├── auth-sessions.service.ts        <-- auth_sessions, Refresh Token xoay vòng, thu hồi phiên (dùng chung với Admin)
│   ├── password.service.ts             <-- bcrypt, chính sách mật khẩu, khóa tạm khi sai nhiều lần
│   ├── jwt/
│   │   ├── user-jwt.service.ts         <-- ký/xác minh Access Token User (JWT_USER_SECRET)
│   │   └── admin-jwt.service.ts        <-- ký/xác minh Access Token Admin (JWT_ADMIN_SECRET)
│   └── entities/
│       └── auth-session.entity.ts
├── core/users/
│   ├── users.module.ts
│   ├── users.service.ts                <-- CRUD người dùng, đổi vai trò, reset mật khẩu; nhận scope SYSTEM | GROUP
│   ├── dto/
│   │   ├── create-user.dto.ts
│   │   ├── update-user.dto.ts
│   │   └── user-query.dto.ts
│   └── entities/
│       └── user.entity.ts
├── apps/member/auth/
│   ├── member-auth.module.ts
│   ├── user-auth.controller.ts         <-- /api/v1/auth/login, refresh, logout, me, sessions*
│   ├── user-auth.service.ts            <-- đăng nhập User; ký JWT qua core/auth UserJwtService
│   ├── strategies/
│   │   └── user-jwt.strategy.ts
│   └── guards/
│       └── user-auth.guard.ts
├── apps/member/users/
│   ├── member-users.module.ts
│   └── users.controller.ts             <-- /api/v1/users* (Quản trị viên nhóm, scope GROUP)
└── apps/admin/users/
    ├── admin-users.module.ts
    └── users.controller.ts             <-- /api/v1/admin/users* (scope SYSTEM), DELETE /admin/users/:id/sessions
```

### 4.1. Implementation `UserJwtStrategy`

```typescript
@Injectable()
export class UserJwtStrategy extends PassportStrategy(Strategy, 'user-jwt') {
  constructor(private readonly configService: ConfigService, private readonly userRepo: UserRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_USER_SECRET'),
    });
  }

  async validate(payload: { sub: number; username: string; userGroupId: number; roleCode: string }) {
    const user = await this.userRepo.findUserWithGroup(payload.sub);
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Tài khoản không hợp lệ hoặc đã bị khóa');
    }
    return { ...user, roleCode: payload.roleCode }; // Gắn vào req.user; PermissionsGuard dùng roleCode
  }
}
```

---

## 5. Kiến trúc Frontend Vue 3

| App | Route | View | Template nguồn | API |
| :--- | :--- | :--- | :--- | :--- |
| Member | `/login` (`member.login`, public) | `src/apps/member/views/auth/LoginView.vue` | `templates/member/login.html` | `POST /api/v1/auth/login`, `/auth/refresh`, `/auth/me` |
| Admin | `/admin/users` (`admin.users`, `user:view`) | `src/apps/admin/views/users/UserListView.vue` | `templates/admin/users.html` | `/api/v1/admin/users*`, `DELETE /api/v1/admin/users/:id/sessions` |
| Member | `/group-admin` (`member.group-admin`, `user:view`) | `src/apps/member/views/group/GroupAdminView.vue` | `templates/member/group-admin.html` | `/api/v1/users*` – đặc tả `docs/modules/02_user_group.md` mục 5.3 |

### 5.0. Màn hình Đăng nhập (Khu vực Member – `LoginView.vue`)

- Form gửi đúng 3 trường của mục 3.1: ô "Tên đăng nhập / Email" (`username`, `type="text"`, `maxlength="150"`, `autocomplete="username"`), ô mật khẩu (`password`, `maxlength="255"`, nút hiện/ẩn), ô chọn "Ghi nhớ đăng nhập" (`rememberMe`). Không điền sẵn tài khoản/mật khẩu mẫu, không có hộp "tài khoản mẫu". Không có liên kết "Quên mật khẩu" hay "Chưa có tài khoản": hệ thống không có API tự khôi phục hay tự đăng ký; người dùng nhờ Quản trị viên nhóm đặt lại mật khẩu (mục 3.8) hoặc tạo tài khoản, trang hiển thị dòng hướng dẫn này.
- Khi gửi: khóa nút, hiển thị trạng thái đang xử lý. Thành công thì lưu `accessToken` và `user` vào `authUser` store (chỉ trong bộ nhớ, không `localStorage`/`sessionStorage`, `docs/01_database_schema.md` mục 6.1); `mustChangePassword = true` thì chuyển tới `member.change-password` ở chế độ bị buộc đổi (không vào layout chính), ngược lại chuyển tới `member.dashboard` (hoặc trang đích trước khi bị guard chuyển về login). Lỗi thì mở khóa nút, xóa ô mật khẩu.
- Hộp lỗi `#loginError` theo `errorCode`: `INVALID_CREDENTIALS` → "Tên đăng nhập hoặc mật khẩu không đúng"; `ACCOUNT_LOCKED` → "Tài khoản đã bị khóa. Liên hệ Quản trị viên nhóm"; `GROUP_INACTIVE` → "Nhóm người dùng của tài khoản đã ngừng hoạt động"; `ACCOUNT_TEMPORARILY_LOCKED` → "Đăng nhập sai quá nhiều lần. Thử lại sau HH:mm" (giờ lấy từ `errors.lockedUntil`, frontend tự định dạng); `MAINTENANCE` → "Hệ thống đang bảo trì, vui lòng quay lại sau" (kiểu cảnh báo vàng, không phải lỗi đỏ); `VALIDATION_ERROR` → thông điệp theo trường trong `errors`; lỗi mạng/`5xx` khác → "Không kết nối được máy chủ". Không áp quy tắc refresh-khi-`401` cho API này (`docs/00_overview_and_architecture.md` mục 5.3.2).
- Liên kết "Dành cho Quản trị viên hệ thống" là `<RouterLink :to="{ name: 'admin.login' }">` (cùng router, chuyển cổng không mất phiên, `docs/00_overview_and_architecture.md` mục 5.3.2).
- Mẫu: `templates/member/login.{html,js}` (mock `mockUserLogin` đủ nhánh của mục 3.1).

### 5.1. Khu vực Admin – `UserListView.vue`: Bố cục Split-View (Theo `templates/admin/users.html`)

- **Bên trái (`.group-sidebar`) – danh mục nhóm để lọc**: mục "Tất cả nhóm" (không gửi `userGroupId`) và các nhóm từ `GET /api/v1/admin/user-groups?limit=100` (`docs/modules/02_user_group.md` mục 3.1, mọi trạng thái; ô `#groupSearchInput` gửi `search` của API đó, 300 ms/Enter, chỉ nhận response sau cùng). Mỗi mục: `name`, `code`, người đại diện (`representative.fullName` hoặc "Chưa có người đại diện"), số `userCount` (thành viên chưa `INACTIVE`), nhãn "Ngừng hoạt động" khi nhóm `INACTIVE`. Danh mục có trạng thái tải/lỗi + "Thử lại" riêng (lỗi không chặn bảng người dùng); `pagination.total > 100` thì ghi chú "Hiển thị 100 nhóm đầu, gõ để tìm". Chọn nhóm thì gửi `userGroupId`, về trang 1; tiêu đề bảng = tên + mã nhóm đã chọn, số bên cạnh = `pagination.total` của danh sách người dùng.
- **Bên phải (`.user-content`) – bảng người dùng** (`GET /api/v1/admin/users`, mục 3.3; bộ lọc, nhãn, phân trang theo mục 3.3 "Frontend"):
  - Thanh lọc: ô tìm kiếm (họ tên, tên đăng nhập, email, chức danh, số điện thoại), ô vai trò, ô trạng thái (mặc định "Đang sử dụng" = không gửi `status`).
  - Cột Người dùng: ảnh (hoặc chữ cái đầu), họ tên, nhãn "★ Đại diện" khi `isRepresentative`, `email` • `@username`.
  - Cột Nhóm: `userGroup.code`, `userGroup.name`.
  - Cột Vai trò: nhãn theo `roleCode` (`<span class="badge-role admin">★ Quản trị viên nhóm</span>`, `recording` Thành viên nghe ghi âm, `member` Thành viên), dưới là `jobTitle`.
  - Cột Tham gia: `createdAt` (`dd/MM/yyyy`), dưới là lần đăng nhập cuối (`lastLoginAt` hoặc "Chưa đăng nhập").
  - Cột Trạng thái theo `status` (`<span class="badge-status active">Hoạt động</span>` = `ACTIVE`, `<span class="badge-status locked">Đã khóa</span>` = `LOCKED`, `<span class="badge-status inactive">Ngừng hoạt động</span>` = `INACTIVE`, chỉ gặp khi lọc `INACTIVE`).
  - Cột Hành động: Sửa thông tin (`user:edit`), Ngừng hoạt động (`user:delete`); chỉ hiện ở dòng chưa `INACTIVE`. Nút "Thêm mới người dùng" chỉ hiện khi store có `user:create`. Hành vi các nút đặc tả ở N03–N09.
  - Không có ô chọn số dòng mỗi trang: `limit` = `itemsPerPage` của store `preferencesAdmin`.
- Modal tạo mới / sửa người dùng (`#userModal`): Form nhập thông tin người dùng và chọn Nhóm người dùng (`user_group_id`), chọn vai trò (`roleCode`: Quản trị viên nhóm / Thành viên nghe ghi âm / Thành viên) khi tạo mới. Khi sửa: tải `GET /api/v1/admin/users/:id` **mỗi lần mở** (mục 3.3.1 "Frontend": tải/lỗi + "Thử lại" trong hộp, `404` hoặc tài khoản đã `INACTIVE` đóng hộp + tải lại danh sách), `username`, `email`, nhóm, vai trò chỉ đọc, không có ô trạng thái; đổi vai trò gọi `PUT /users/:id/role` (N07). Không phụ thuộc hay tham chiếu trực tiếp đến tổ chức.

### 5.2. Khu vực Admin – Pinia Store (`useUserStore`)

- State: `users: UserItem[]` (phần tử mục 3.3), `pagination: PaginationInfo`, `query: { page, search, status, roleCode, userGroupId }` (`userGroupId = null`: mọi nhóm, chỉ Admin), `loading: boolean`, `error: string | null`.
- Actions: `fetchUsers()` (chỉ gửi tham số có giá trị, `limit` từ `preferencesAdmin.itemsPerPage`, chỉ nhận response của request sau cùng), `createUser()`, `updateUser()`, `changeRole()`, `toggleStatus()`, `resetPassword()`.

---

## 6. Kịch bản kiểm thử (Test Plan for Agent)

1. **TC-USR-01**: Đăng nhập bằng tài khoản user hợp lệ (một lần bằng username, một lần bằng email), kiểm tra nhận về Access Token (chỉ giữ trong Pinia, không có trong `localStorage`) mang `sub`, `userGroupId`, `roleCode`, `sid`, và cookie Refresh Token `HttpOnly` `Path=/api/v1/auth`; có 1 dòng mới trong `auth_sessions` (`actor_type = USER`, `remember_me` đúng `rememberMe`, `logged_in_at`) và 1 dòng `AUTH / LOGIN`; `user.permissions` của nhóm `allow_recording_access = 0` không có `cdr:listen_audio`, `cdr:download_audio`.
   - **TC-USR-01b**: Username không tồn tại, username của tài khoản `INACTIVE`, sai mật khẩu: cả ba `401 INVALID_CREDENTIALS` cùng thông điệp (`LOGIN_FAILED` `UNKNOWN_USER`, `UNKNOWN_USER`, `BAD_PASSWORD`); tài khoản `LOCKED` → `403 ACCOUNT_LOCKED` không tăng `failed_login_count`; body có trường lạ hoặc `username` 151 ký tự → `400 VALIDATION_ERROR` không ghi audit; tài khoản `must_change_password = 1` → `200` `mustChangePassword: true`, không có cookie, không có dòng `auth_sessions`.
   - **TC-USR-01c**: Bật `system_maintenance_mode`: đăng nhập (kể cả body sai, mật khẩu sai) trả `503 MAINTENANCE`, `failed_login_count` không đổi, không có dòng `audit_logs` mới; đăng nhập Admin vẫn `200`.
2. **TC-USR-02**: Đăng nhập sai mật khẩu 5 lần liên tiếp, kiểm tra lần thứ 6 (kể cả đúng mật khẩu) trả về `423 ACCOUNT_TEMPORARILY_LOCKED` kèm `errors.lockedUntil`; sau 15 phút đăng nhập đúng được và `failed_login_count` về 0.
   - **TC-USR-02b**: Dùng lại một Refresh Token đã được xoay vòng, kiểm tra mọi phiên của tài khoản bị thu hồi (`revoked_reason = 'REUSE_DETECTED'`).
   - **TC-USR-02c**: Gửi đồng thời 2 request `refresh` cùng một Refresh Token (giả lập 2 tab), kiểm tra cả hai nhận Access Token, chỉ request đầu có `Set-Cookie`, không phiên nào bị `REUSE_DETECTED`. Dùng lại token đó sau 30 giây thì mọi phiên bị thu hồi.
   - **TC-USR-02d**: Đăng nhập User với `rememberMe = true`, gọi `POST /api/v1/auth/refresh`: `200` `data = { accessToken, expiresIn }`, Access Token mới mang `sub`, `userGroupId`, `roleCode`, `sid` = id phiên mới; cookie mới `Path=/api/v1/auth`, `Max-Age` ≈ số giây còn lại tới `expires_at`; phiên cũ `ROTATED`, không có dòng `audit_logs` mới. Bật `system_maintenance_mode` rồi refresh: vẫn `200`, sau đó `GET /api/v1/auth/me` `200`, `GET /api/v1/profile` `503 MAINTENANCE`. Body `{ "x": 1 }`: `400`. Khóa user đó rồi refresh bằng cookie cũ: `401 UNAUTHORIZED` kèm `Set-Cookie` `Max-Age=0`. Gửi cookie Refresh Token của Admin tới route User: `401`.
   - **TC-USR-02e**: Đăng nhập User, gọi `POST /api/v1/auth/logout`: `200` `data = null`, `Set-Cookie` `Path=/api/v1/auth` `Max-Age=0`, phiên có `revoked_reason = 'LOGOUT'`, một dòng `audit_logs` `AUTH / LOGOUT` (`actor_type = USER`, `actor_name` = họ tên, `resource_id` = id phiên); gọi lại: `200`, không thêm dòng audit; refresh bằng cookie cũ: `401`. Cookie vừa `ROTATED` (tab khác refresh): phiên mới trong chuỗi bị thu hồi. Cookie của User khác kèm Access Token của mình: `200`, phiên kia không đổi. Token `PASSWORD_CHANGE_ONLY` (không cookie): `200`, không audit. Body `{"x":1}` hoặc `?x=1`: `400 VALIDATION_ERROR`. Bật `system_maintenance_mode`: logout vẫn `200`, phiên `LOGOUT`, cookie bị xóa; tắt bảo trì rồi refresh bằng cookie cũ: `401`. Gọi logout ở cổng Member không làm mất phiên cổng Admin trên cùng trình duyệt. Giao diện: mọi trang Member có nút "Đăng xuất" mở hộp xác nhận, bấm xác nhận khóa nút rồi về trang đăng nhập dù API lỗi.
   - **TC-USR-02f**: Đăng nhập User `GROUP_ADMIN` của nhóm đã được cấp ghi âm, gọi `GET /api/v1/auth/me`: `200`, `data` trùng `data.user` của response đăng nhập (`permissions` 17 mã sắp theo `code`, có `userGroup`), không có `mustChangePassword`, không thêm dòng `audit_logs`, `last_login_at` không đổi. Admin tắt ghi âm của nhóm: gọi lại ngay (cùng token) không còn `cdr:listen_audio`, `cdr:download_audio` (15 mã), `userGroup.allowRecordingAccess = false`. Quản trị viên nhóm đổi vai trò người này sang `REGULAR_USER`: gọi lại bằng Access Token cũ vẫn `roleCode = GROUP_ADMIN` (theo claim, khớp `PermissionsGuard`); refresh rồi gọi lại: `REGULAR_USER`, 9 mã. Token `PASSWORD_CHANGE_ONLY`: `200` cùng cấu trúc. `?x=1`: `400 VALIDATION_ERROR`. Khóa tài khoản, ngừng hoạt động tài khoản, hoặc quản trị viên đặt lại mật khẩu, rồi gọi bằng Access Token đầy đủ còn hạn: `401 UNAUTHORIZED`, không có `Set-Cookie`; refresh sau đó `401` và xóa cookie. Access Token của Admin: `401`. Bật `system_maintenance_mode`: vẫn `200`. Giao diện: tải lại trang → refresh → `/auth/me` một lần, header hiện họ tên, vai trò, tên nhóm; `REGULAR_USER` không thấy mục "Quản trị nhóm" ở sidebar; đang bảo trì thì biểu ngữ vàng hiện sau API nghiệp vụ đầu tiên trả `503`.
3. **TC-USR-03**: Gọi `PUT /users/:id/role` đổi Quản trị viên nhóm duy nhất trong nhóm sang `REGULAR_USER`, kiểm tra hệ thống chặn `409` với cảnh báo thích hợp và `user_roles` không đổi.
4. **TC-USR-04**: Group Admin tạo người dùng mới trong nhóm của mình, xác nhận có dòng `user_roles` với vai trò `REGULAR_USER` và người dùng mới tạo có thể đăng nhập bình thường.
5. **TC-USR-05** (`GET /users`, mục 3.3): Admin gọi `GET /api/v1/admin/users` không query: `200`, mọi nhóm, không có tài khoản `INACTIVE`, phần tử đúng 14 trường (có `userGroup { id, code, name }`, không có `updatedAt`, `mustChangePassword`, `lockedUntil`), sắp mã nhóm → người đại diện → `GROUP_ADMIN` → `fullName`, `id`; `?userGroupId=1&status=INACTIVE` chỉ trả tài khoản ngừng hoạt động của nhóm 1; `?userGroupId=999999` `200` `data = []`; `?roleCode=USER_RECORDING&search=%` chỉ khớp chuỗi chứa `%` thật; `?groupId=1`, `?status=active`, `?limit=101`, `?userGroupId=null`, `?page=1&page=2` → `400 VALIDATION_ERROR`; không có dòng `audit_logs` mới. Quản trị viên nhóm gọi `GET /api/v1/users`: chỉ người cùng nhóm; `?userGroupId=<nhóm mình>` → `400`; thành viên `REGULAR_USER` → `403 FORBIDDEN_PERMISSION`; bật bảo trì → `503 MAINTENANCE` (bản Admin vẫn `200`); khóa tài khoản người gọi rồi gọi bằng token còn hạn → `401`.
   - **TC-USR-05b** (`GET /users/:id`, mục 3.3.1): Admin gọi `GET /api/v1/admin/users/104`: `200`, `data` đúng 17 trường (14 trường của phần tử `GET /users` + `mustChangePassword`, `lockedUntil`, `updatedAt`), không có `passwordChangedAt`, `failedLoginCount`; sai mật khẩu 5 lần cho tài khoản này rồi gọi lại: `lockedUntil` khác `null`, sau thời gian khóa tạm: `null` (dù cột chưa xóa); tài khoản `INACTIVE` `200`; `/999999` → `404 NOT_FOUND`; `/abc`, `/0`, `/104?x=1` → `400 VALIDATION_ERROR`; không có dòng `audit_logs` mới. Quản trị viên nhóm 1 gọi `GET /api/v1/users/<id người nhóm 1>` và chính mình: `200`; người nhóm 2: `403 FORBIDDEN_SCOPE_ACCESS`; id không tồn tại: `404`; `REGULAR_USER` gọi: `403 FORBIDDEN_PERMISSION`; bật bảo trì: `503` (bản Admin vẫn `200`).
