# MODULE 04: XÁC THỰC & QUẢN LÝ QUẢN TRỊ VIÊN HỆ THỐNG (ADMIN AUTH & ADMIN MANAGEMENT)
## Đường dẫn tài liệu: `docs/modules/04_auth_admin.md`
## Ánh xạ giao diện mẫu (chỉ khu vực Admin): `templates/admin/login.html` → `AdminLoginView.vue` (route `admin.login`); bố cục `templates/admin/system-settings.html` → mục `admins` của `SystemSettingsView.vue` (`/admin/settings?section=admins`)

---

## 1. Mục tiêu & Nghiệp vụ (Business Overview)

### 1.1. Bối cảnh & Nguyên tắc an toàn EVN
Hạ tầng viễn thông IP PABX của EVN đòi hỏi tính bảo mật tối thượng:
1. **Không chung bảng dữ liệu với người dùng**: Toàn bộ dữ liệu Quản trị viên hệ thống được lưu trữ trong bảng `admins`, tách biệt 100% với bảng `users` của các đơn vị. Điều này loại trừ hoàn toàn nguy cơ leo thang đặc quyền (Privilege Escalation) từ người dùng đơn vị lên quản trị hệ thống.
2. **Chứng thực độc lập (Independent Authentication)**:
   - Cơ chế ký JWT riêng biệt sử dụng `JWT_ADMIN_SECRET` (khác với `JWT_USER_SECRET`).
   - Token của User không thể dùng để gọi bất kỳ API nào trong tuyến `/api/v1/admin/*` và ngược lại.
3. **Phân cấp Root Admin (Super Admin Privilege)**:
   - Mỗi Admin mang đúng 1 vai trò, lưu ở bảng `admin_roles`: `ROOT_ADMIN` (Quản trị viên tối cao, do EVNICT chỉ định khi cài đặt hệ thống qua seed) hoặc `SYSTEM_ADMIN` (Quản trị viên hệ thống). Bảng `admins` không có cột vai trò hay quyền.
   - **Chỉ vai trò `ROOT_ADMIN` có quyền `admin:manage`**: tạo mới, chỉnh sửa, khóa hoặc xóa tài khoản của các Admin khác.
   - `SYSTEM_ADMIN` không có `admin:manage` nên không can thiệp được vào danh sách tài khoản Admin.
   - Kiểm tra quyền Admin chỉ xét vai trò trong `admin_roles` và quyền của vai trò trong `permission_roles` (`docs/modules/10_permissions_and_roles.md` mục 2.3).
   - Không ai có thể xóa hoặc khóa tài khoản Root Admin.

---

## 2. Thiết kế Dữ liệu (Database Schema)

Bảng MariaDB: `admins`, `admin_roles`, `roles`, `permission_roles`, `permissions` (xem `docs/01_database_schema.md` mục 3 và 7).

> DDL chuẩn của `admins` (mục 3) chỉ định nghĩa tại `docs/01_database_schema.md`. Module này không chép lại DDL để tránh lệch; khi sinh code, entity và migration lấy từ `01`.

---

## 3. Đặc tả API Contracts

### 3.1. Đăng nhập Admin (`POST /api/v1/admin/auth/login`)
- **Guard**: Public (không cần Access Token). Không bị chế độ bảo trì chặn (`docs/02_api_contracts.md` mục 1.2).
- **Request Body**:
```json
{
  "username": "root.admin@evnict.vn",
  "password": "RootSecurePassword2026!@",
  "rememberMe": true
}
```

| Trường | Kiểu | Bắt buộc | Ràng buộc |
|---|---|---|---|
| `username` | string | Có | Username **hoặc** email; cắt khoảng trắng hai đầu; 1–150 ký tự (`admins.username` ≤ 100, `admins.email` ≤ 150) |
| `password` | string | Có | 1–255 ký tự; không cắt khoảng trắng, không kiểm tra chính sách mật khẩu ở bước đăng nhập |
| `rememberMe` | boolean | Không | Mặc định `false` |

  Thiếu trường bắt buộc, sai kiểu, quá độ dài hoặc có trường khác trả `400 VALIDATION_ERROR` (`docs/02_api_contracts.md` mục 2.3), không ghi `audit_logs`.
- **Xử lý Backend** (theo đúng thứ tự):
  1. Tìm tài khoản theo `username_active = :username`; không thấy thì theo `email_active = :username` (chỉ tài khoản chưa `INACTIVE`; so sánh không phân biệt hoa thường theo collation). Không thấy: `401 INVALID_CREDENTIALS`, ghi `LOGIN_FAILED` với `reason = UNKNOWN_USER`, `actor_id = NULL`, `actor_name` = chuỗi đã nhập (như `docs/modules/03_auth_user.md` mục 3.1).
  2. `status = 'LOCKED'`: `403 ACCOUNT_LOCKED`, ghi `LOGIN_FAILED` (`reason = ACCOUNT_LOCKED`). `locked_until > NOW()`: `423` với body `{ "success": false, "statusCode": 423, "errorCode": "ACCOUNT_TEMPORARILY_LOCKED", "message": "...", "errors": { "lockedUntil": "2026-10-26T09:45:00+07:00" }, "timestamp": "..." }` (khung lỗi `docs/02_api_contracts.md` mục 2.3), ghi `LOGIN_FAILED` (`reason = TEMPORARILY_LOCKED`). Hai nhánh này không kiểm tra mật khẩu, không tăng bộ đếm.
  3. Xác thực `bcrypt.compare(password, admin.password_hash)`. Sai: tăng `failed_login_count` bằng một câu `UPDATE` nguyên tử; đạt `security_login_max_failed` thì đặt `locked_until` và đặt lại `failed_login_count = 0` trong cùng câu lệnh (`docs/01_database_schema.md` mục 6.1); trả `401 INVALID_CREDENTIALS` (cùng mã, cùng thông điệp với bước 1, kể cả lần sai làm tài khoản bị khóa tạm), ghi `LOGIN_FAILED` (`reason = BAD_PASSWORD`).
  4. Đúng mật khẩu: một câu `UPDATE admins SET failed_login_count = 0, last_login_at = NOW()`. Đọc vai trò từ `admin_roles` (join `roles`) và `permissions` từ `permission_roles` của vai trò đó.
  5. Xác định loại token:
     - **Đầy đủ** (bình thường): Access Token (`security_access_token_minutes`, mặc định 15 phút) ký bằng `JWT_ADMIN_SECRET`, mang `sub`, `roleCode`, `sid` (id dòng `auth_sessions` vừa tạo, `docs/01_database_schema.md` mục 6.1); tạo một dòng `auth_sessions` (`actor_type = 'ADMIN'`, `actor_id`, `refresh_token_hash` = SHA-256 của Refresh Token, `ip_address`, `user_agent` của request, `remember_me` = `rememberMe`, `expires_at = NOW() + security_refresh_token_days`, mặc định 7 ngày) và gửi Refresh Token qua cookie.
     - **Giới hạn**, khi `must_change_password = 1` hoặc `password_changed_at` quá `security_password_max_age_days`: chỉ cấp Access Token có thêm claim `scope: "PASSWORD_CHANGE_ONLY"` (không có `sid`); **không** tạo dòng `auth_sessions`, không gửi cookie; response có `mustChangePassword: true`. Chính sách đầy đủ tại `docs/01_database_schema.md` mục 6.1.
  6. Ghi `audit_logs` `AUTH / LOGIN` (`actor_type = ADMIN`, `actor_id`, `ip_address`, `user_agent`) cho cả hai loại token. Bước 4–6 trong một transaction.
- **Refresh Token** gửi qua cookie `HttpOnly; Secure; SameSite=Strict; Path=/api/v1/admin/auth`, không nằm trong body response. `rememberMe = true` thì cookie có `Max-Age` = `security_refresh_token_days` (lúc đăng nhập bằng số giây còn lại tới `expires_at`; các lần refresh giữ quy tắc này nhờ cột `auth_sessions.remember_me`, mục 3.5); `false` thì không đặt `Max-Age` (mất khi đóng trình duyệt), hạn phiên phía server vẫn là `expires_at`. Token giới hạn không có cookie nên `rememberMe` không có tác dụng.
- **Response** `200`:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Đăng nhập quản trị viên thành công",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900,
    "mustChangePassword": false,
    "admin": {
      "id": 1,
      "username": "root.admin@evnict.vn",
      "fullName": "Quản trị viên Tối cao EVNICT",
      "email": "root.admin@evnict.vn",
      "avatarUrl": null,
      "roleCode": "ROOT_ADMIN",
      "roleName": "Quản trị viên tối cao",
      "permissions": ["admin:manage", "cdr:download_audio", "cdr:listen_audio", "cdr:view", "role:view", "system:manage"]
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
| `admin.id`, `username`, `fullName`, `email`, `avatarUrl` | `admins` | `avatarUrl` = `null` khi chưa tải ảnh |
| `admin.roleCode`, `roleName` | `roles.code`, `roles.name` qua `admin_roles` | |
| `admin.permissions` | `permissions.code` qua `permission_roles` của vai trò, sắp xếp theo `code` | Ví dụ trên rút gọn: `ROOT_ADMIN` có đủ 25 mã, `SYSTEM_ADMIN` 24 mã (`docs/modules/10_permissions_and_roles.md` mục 2.2) |

  Token giới hạn trả **cùng cấu trúc** (`admin` đầy đủ, kể cả `permissions`), `mustChangePassword = true`; frontend thấy cờ này thì chuyển thẳng tới trang đổi mật khẩu, không vào layout chính. `admin` cũng là `data` của `GET /api/v1/admin/auth/me` (mục 3.1.1).
- **Lỗi**:

| HTTP | `errorCode` | Khi nào | `LOGIN_FAILED.reason` |
|---|---|---|---|
| `400` | `VALIDATION_ERROR` | Body sai (bảng request) | *(không ghi)* |
| `401` | `INVALID_CREDENTIALS` | Không thấy tài khoản (kể cả `INACTIVE`) hoặc sai mật khẩu | `UNKNOWN_USER` / `BAD_PASSWORD` |
| `403` | `ACCOUNT_LOCKED` | `status = 'LOCKED'` | `ACCOUNT_LOCKED` |
| `423` | `ACCOUNT_TEMPORARILY_LOCKED` | `locked_until > NOW()`, `errors.lockedUntil` | `TEMPORARILY_LOCKED` |

### 3.1.1. Thông tin Admin đang đăng nhập (`GET /api/v1/admin/auth/me`)

- **Guard**: `AdminAuthGuard`, nhận cả token `PASSWORD_CHANGE_ONLY` (`docs/01_database_schema.md` mục 6.1); không cần mã quyền. Không bị chế độ bảo trì chặn (`docs/02_api_contracts.md` mục 1.2).
- **Request**: không có query, không có body. Gửi query param bất kỳ trả `400 VALIDATION_ERROR`.
- **Xử lý** (chỉ đọc, không ghi CSDL: không ghi `audit_logs`, không cập nhật `last_login_at`):
  1. Đọc `admins` theo khóa chính `id = sub` của Access Token, join `admin_roles` → `roles` (khóa chính `admin_roles.admin_id`).
  2. Không thấy dòng, hoặc `status` khác `ACTIVE` (bị khóa hay ngừng hoạt động trong lúc Access Token còn hạn, vì guard chỉ verify JWT): `401 UNAUTHORIZED`. Không xóa cookie (phiên đã bị thu hồi khi khóa/ngừng hoạt động, `docs/01_database_schema.md` mục 6.1), nên client refresh một lần, refresh trả `401` và frontend về trang đăng nhập. Không xét `locked_until` (khóa tạm chỉ chặn đăng nhập), `must_change_password`, tuổi mật khẩu.
  3. `permissions` = `ROLE_PERMISSIONS[roleCode]` (nạp từ `permission_roles`, `docs/modules/10_permissions_and_roles.md` mục 2.3), sắp xếp theo `code`, giống response đăng nhập. `roleCode` đọc từ `admin_roles`; không có API đổi vai trò Admin nên luôn trùng claim `roleCode` của token mà `PermissionsGuard` dùng.
- **Response** `200`: `data` đúng cấu trúc `admin` của mục 3.1 (cùng bảng nguồn trường), kể cả khi gọi bằng token `PASSWORD_CHANGE_ONLY`; không có `mustChangePassword` (cờ này chỉ có ở response đăng nhập, và token giới hạn không có Refresh Token nên không tồn tại qua tải lại trang).

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy thông tin tài khoản thành công",
  "data": {
    "id": 1,
    "username": "root.admin@evnict.vn",
    "fullName": "Quản trị viên Tối cao EVNICT",
    "email": "root.admin@evnict.vn",
    "avatarUrl": null,
    "roleCode": "ROOT_ADMIN",
    "roleName": "Quản trị viên tối cao",
    "permissions": ["admin:manage", "audit:view", "cdr:download_audio", "cdr:export", "cdr:filter_advanced", "cdr:listen_audio", "cdr:view"]
  },
  "timestamp": "2026-10-26T09:31:00+07:00"
}
```

  Ví dụ `permissions` rút gọn (`ROOT_ADMIN` có đủ 25 mã).
- **Lỗi**:

| HTTP | `errorCode` | Khi nào |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Có query param |
| `401` | `UNAUTHORIZED` | Access Token thiếu, sai, hết hạn hoặc của cổng User (guard); tài khoản không còn `ACTIVE` (bước 2) |

- **Frontend**: chỉ gọi khi store chưa có `admin`, tức sau lần refresh lúc vào cổng hoặc tải lại trang (`docs/00_overview_and_architecture.md` mục 5.3.2); sau đăng nhập và đổi mật khẩu không gọi (đăng nhập đã trả `admin`). Gọi qua API client của cổng (`401` → refresh một lần rồi gửi lại); thành công thì lưu `data` vào `authAdmin.admin`, router guard và menu đọc `permissions` từ đây. Header của `AdminLayout` hiển thị `fullName`, `roleName`, ảnh `avatarUrl` (`null` thì ảnh chữ cái đầu tạo từ `fullName` ở frontend). Mẫu: `window.adminSession.loadMe`, `renderAccount` trong `templates/admin/main.js`.
- Index phục vụ: khóa chính `admins`, `admin_roles`, `roles`.

### 3.2. Danh sách Quản trị viên (`GET /api/v1/admin/admins`)
- **Guard**: `AdminAuthGuard`, `Permission: admin:manage`
- Chỉ vai trò `ROOT_ADMIN` có quyền này.
- **Query**: `page` (mặc định 1), `limit` (mặc định 10, tối đa 100), `search` (khớp `username`, `email`, `full_name`), `status` (`ACTIVE` | `LOCKED` | `INACTIVE`), như `GET /api/v1/users` (`docs/modules/03_auth_user.md` mục 3.3). Khung phân trang theo `docs/02_api_contracts.md` mục 2.2.
- **Phần tử**: `id`, `username`, `email`, `fullName`, `phoneNumber`, `avatarUrl`, `status`, `roleCode`, `roleName` (từ `admin_roles`), `lastLoginAt`, `createdAt`, `updatedAt`. Không trả `password_hash`, `failed_login_count`, `locked_until` hay thông tin phiên.

### 3.3. Tạo mới Quản trị viên (`POST /api/v1/admin/admins`)
- **Guard**: `AdminAuthGuard`, `Permission: admin:manage`
- **Body**:
```json
{
  "username": "admin.hanoi",
  "email": "admin.hanoi@evnhanoi.vn",
  "fullName": "Kỹ thuật viên Trực ban EVNHANOI",
  "phoneNumber": "0912345678"
}
```
- Admin tạo qua API luôn mang vai trò `SYSTEM_ADMIN`: cùng transaction tạo dòng `admins` (`created_by_admin_id` = Admin gọi API), dòng `admin_roles` (`role_id` của `SYSTEM_ADMIN`) và dòng `user_settings` (`user_type = ADMIN`, giá trị mặc định, `docs/01_database_schema.md` mục 12); ghi `audit_logs` `ADMIN / CREATE`. Body không có trường vai trò.
- **Mật khẩu ban đầu do hệ thống sinh**: body không có `password`. Hệ thống sinh mật khẩu tạm 16 ký tự đạt chính sách (`docs/01_database_schema.md` mục 6.1), đặt `must_change_password = 1`, và trả **một lần** trong response (`temporaryPassword`); hệ thống chỉ lưu bản băm, không có API xem lại.
- **Lưu ý**: Không có API gán hoặc đổi vai trò Admin. Vai trò `ROOT_ADMIN` chỉ được gán qua seed ban đầu (`npm run seed:root`, `docs/01_database_schema.md` mục 3).

### 3.4. Khóa / Mở khóa Admin (`PUT /api/v1/admin/admins/:id/status`)
- **Guard**: `AdminAuthGuard`, `Permission: admin:manage`
- Body `{ "status": "ACTIVE" | "LOCKED" }`. Khóa thu hồi mọi phiên của admin đó (`ACCOUNT_LOCKED`).
- Chặn không cho phép khóa tài khoản chính mình (`403 SELF_ACTION_FORBIDDEN`) hoặc tài khoản mang vai trò `ROOT_ADMIN` (`403 ROOT_ADMIN_PROTECTED`).
- Tài khoản đã `INACTIVE` trả `409` (`ACCOUNT_INACTIVE`): `INACTIVE` là trạng thái cuối, không kích hoạt lại (`docs/01_database_schema.md` mục 14).

### 3.5. Làm mới phiên và Đăng xuất (`POST /api/v1/admin/auth/refresh`, `POST /api/v1/admin/auth/logout`)

- **`refresh`**: xử lý, response và lỗi theo đặc tả chung `docs/modules/03_auth_user.md` mục 3.2.1. Khác bản User:
  - Cookie `Path=/api/v1/admin/auth`; tìm phiên với `actor_type = 'ADMIN'` (phiên của User không bao giờ khớp, kể cả khi cookie bị gửi nhầm).
  - Bước kiểm tra tài khoản: `admins.status` khác `ACTIVE` thì `401 UNAUTHORIZED` (không có điều kiện nhóm).
  - Access Token ký bằng `JWT_ADMIN_SECRET`, mang `sub`, `roleCode` đọc lại từ `admin_roles` lúc cấp và `sid` (như bản User).
  - Không bị chế độ bảo trì chặn (`docs/02_api_contracts.md` mục 1.2).
  - `audit_logs` `TOKEN_REUSE_DETECTED` ghi `actor_type = ADMIN`.
  - Index phục vụ: `uniq_session_token` (tìm phiên), `idx_session_actor` (thu hồi mọi phiên khi dùng lại token).
- **`logout`**: xử lý, response và lỗi theo đặc tả chung `docs/modules/03_auth_user.md` mục 3.2.1. Khác bản User:
  - Guard `AdminAuthGuard` (nhận cả token `PASSWORD_CHANGE_ONLY`, verify bằng `JWT_ADMIN_SECRET`); cookie `Path=/api/v1/admin/auth`.
  - Tìm phiên với `actor_type = 'ADMIN'` và `actor_id` = `sub` của token (cookie của User hay của Admin khác không bao giờ bị thu hồi qua route này).
  - `audit_logs` `AUTH / LOGOUT` ghi `actor_type = ADMIN`, chỉ khi thực sự thu hồi một phiên.
  - Không bị chế độ bảo trì chặn (`docs/02_api_contracts.md` mục 1.2).
  - Frontend: nút "Đăng xuất" trong menu tài khoản mở hộp xác nhận (`ConfirmModal`); bấm xác nhận thì khóa nút, gọi API rồi luôn xóa store `authAdmin`, ngắt Socket.IO namespace `/admin/notifications` và chuyển về `admin.login` (mẫu `window.adminSession.logout` trong `templates/admin/main.js`).

### 3.6. Đặt lại mật khẩu Admin khác (`PUT /api/v1/admin/admins/:id/reset-password`)

- **Guard**: `AdminAuthGuard`, `Permission: admin:manage`. Không có body.
- Sinh mật khẩu tạm 16 ký tự đạt chính sách (`docs/01_database_schema.md` mục 6.1), lưu bản băm, đặt `must_change_password = 1`; thu hồi mọi phiên của admin đó (`PASSWORD_CHANGED`); ghi `audit_logs` `AUTH / PASSWORD_RESET` (`resource_id` = id admin được đặt lại). Tất cả trong một transaction.
- **Response** `200`: `data = { "id": 5, "temporaryPassword": "<16 ký tự>" }`, trả **một lần**, không có API xem lại.
- Chặn đặt lại cho chính mình (`403 SELF_ACTION_FORBIDDEN`; tự đổi qua `PUT /admin/profile/change-password`) và cho tài khoản mang vai trò `ROOT_ADMIN` (`403 ROOT_ADMIN_PROTECTED`). Tài khoản `INACTIVE` trả `409 ACCOUNT_INACTIVE`. Tài khoản `LOCKED` vẫn đặt lại được, trạng thái giữ `LOCKED`.

### 3.7. Thu hồi mọi phiên của Admin khác (`DELETE /api/v1/admin/admins/:id/sessions`)

- **Guard**: `AdminAuthGuard`, `Permission: admin:manage`. Không có body.
- Thu hồi mọi phiên còn hiệu lực của admin `:id` (`revoked_reason = 'REVOKED_BY_ADMIN'`), ghi `audit_logs` `AUTH / SESSION_REVOKED` với `action_details = { "targetActorType": "ADMIN", "revokedCount": n }`. Response `200`: `data = { "revokedCount": n }` (0 nếu không còn phiên nào).
- Chặn chính mình (`403 SELF_ACTION_FORBIDDEN`; thu hồi phiên của mình qua `DELETE /admin/auth/sessions/:id`) và tài khoản mang vai trò `ROOT_ADMIN` (`403 ROOT_ADMIN_PROTECTED`). Tài khoản `INACTIVE` không còn phiên nên trả `200` với `revokedCount = 0`.
- Bản tương ứng cho người dùng đơn vị là `DELETE /api/v1/admin/users/:id/sessions` (quyền `user:edit`, `docs/modules/03_auth_user.md` mục 3.10), cùng cách xử lý, `targetActorType = "USER"`.

### 3.8. Sửa thông tin Admin khác (`PUT /api/v1/admin/admins/:id`)

- **Guard**: `AdminAuthGuard`, `Permission: admin:manage`.
- **Body**: `{ "fullName"?: string, "email"?: string, "phoneNumber"?: string | null }`, ít nhất một trường. Có `username`, `status`, `roleCode`, `avatarUrl`, `password` hoặc trường khác thì trả `400` (trạng thái đổi qua mục 3.4, mật khẩu qua mục 3.6; không có API đổi vai trò Admin).
- Chặn chính mình (`403 SELF_ACTION_FORBIDDEN`; tự sửa họ tên, điện thoại qua `PUT /admin/profile`, `docs/modules/09_admin_profile.md` mục 3.2). Tài khoản `INACTIVE` trả `409 ACCOUNT_INACTIVE`. `email` trùng tài khoản Admin chưa `INACTIVE` khác trả `409 ACCOUNT_DUPLICATE`.
- Đổi `email` không thu hồi phiên (đăng nhập bằng `username` hoặc `email` mới). Ghi `audit_logs` `ADMIN / UPDATE`, `action_details = { "changedFields": ["email", …] }`.
- **Response** `200`: `data` là phần tử của mục 3.2 sau khi sửa.

### 3.9. Ngừng hoạt động Admin (`DELETE /api/v1/admin/admins/:id`)

- **Guard**: `AdminAuthGuard`, `Permission: admin:manage`. Không có body.
- Chặn chính mình (`403 SELF_ACTION_FORBIDDEN`) và tài khoản mang vai trò `ROOT_ADMIN` (`403 ROOT_ADMIN_PROTECTED`; ghi thêm `audit_logs` `ADMIN / ACCESS_DENIED`, `docs/01_database_schema.md` mục 13). Tài khoản đã `INACTIVE` trả `409 ACCOUNT_INACTIVE`.
- Trong một transaction: `status = 'INACTIVE'`; thu hồi mọi phiên (`ACCOUNT_LOCKED`); giữ dòng `admin_roles` (`docs/01_database_schema.md` mục 14); ghi `audit_logs` `ADMIN / DEACTIVATE`.
- **Response** `200`: `data = { id, status: "INACTIVE" }`. Không xóa cứng, không kích hoạt lại; `username`/`email` được dùng lại cho tài khoản mới.

---

## 4. Kiến trúc Backend NestJS (`backend/src/core`, `apps/*`)

Theo quy tắc `docs/00_overview_and_architecture.md` mục 5.1: nghiệp vụ và entity ở `core`, controller ở `apps/admin` / `apps/member`, job nền ở `apps/worker`; các phần `apps/*` không import lẫn nhau.

```
backend/src/
├── core/admins/
│   ├── admins.module.ts
│   ├── admins.service.ts               <-- CRUD Admin, khóa/mở, reset mật khẩu (chặn thao tác lên ROOT_ADMIN)
│   └── entities/
│       └── admin.entity.ts
├── apps/admin/auth/
│   ├── admin-auth.module.ts
│   ├── admin-auth.controller.ts        <-- /api/v1/admin/auth/login, refresh, logout, me, sessions*
│   ├── admin-auth.service.ts           <-- đăng nhập Admin; ký JWT qua core/auth AdminJwtService, phiên qua AuthSessionsService
│   ├── strategies/
│   │   └── admin-jwt.strategy.ts
│   └── guards/
│       └── admin-auth.guard.ts
└── apps/admin/admins/
    ├── admin-admins.module.ts
    ├── admins.controller.ts            <-- /api/v1/admin/admins* (quyền admin:manage)
    └── dto/
        ├── create-admin.dto.ts
        └── update-admin.dto.ts
```

### 4.1. Phân quyền API quản lý Admin

Không có guard riêng cho Root Admin. Controller quản lý Admin dùng `PermissionsGuard` chung (`docs/modules/10_permissions_and_roles.md` mục 4.1):

```typescript
@Controller('admins') // AdminAppModule đăng ký RouterModule tiền tố 'admin' → /api/v1/admin/admins
@UseGuards(AdminAuthGuard, PermissionsGuard)
@RequirePermissions('admin:manage')
export class AdminsController { /* ... */ } // backend/src/apps/admin/admins/admins.controller.ts
```

Service chặn thao tác khóa/xóa trên tài khoản mang vai trò `ROOT_ADMIN` (`403 ROOT_ADMIN_PROTECTED`, ghi `audit_logs` `ACCESS_DENIED`) và tự khóa/tự xóa chính mình (`403 SELF_ACTION_FORBIDDEN`).

---

## 5. Kiến trúc Frontend Vue 3 (chỉ khu vực Admin: `frontend/src/apps/admin/views/auth/AdminLoginView.vue` & `views/settings/sections/AdminAccountsSection.vue`)

### 5.1. Màn hình Đăng nhập Quản trị (`AdminLoginView.vue`, route `admin.login`)
- Giao diện thiết kế theo phong cách trang nghiêm của EVN (`templates/admin/login.html`, `templates/admin/login.css`):
  - Panel bên trái hiển thị Logo EVN (`logo_evn.svg`), tiêu đề "EVN CDR Analysis System - Quản trị hệ thống".
  - Panel bên phải: Form đăng nhập tài khoản Quản trị với nhãn cảnh báo đỏ nhỏ: "Khu vực dành riêng cho Quản trị viên hạ tầng viễn thông EVNICT".
  - Access Token Admin chỉ giữ trong bộ nhớ (Pinia store riêng của Admin Portal), không lưu `localStorage`; Refresh Token nằm trong cookie `HttpOnly` có `Path=/api/v1/admin/auth`, nên không xung đột với phiên của User Portal (chính sách tại `docs/01_database_schema.md` mục 6.1).
- Form gửi đúng 3 trường của mục 3.1: ô "Tên đăng nhập / Email" (`username`, `maxlength="150"`), ô mật khẩu (`password`, nút hiện/ẩn), ô chọn "Ghi nhớ phiên quản trị" (`rememberMe`). Không điền sẵn tài khoản/mật khẩu mẫu. Không có liên kết "Quên mật khẩu": hệ thống không có API tự khôi phục; Admin quên mật khẩu nhờ Quản trị viên tối cao đặt lại (mục 3.6), trang hiển thị dòng hướng dẫn này.
- Khi gửi: khóa nút, hiển thị trạng thái đang xác thực. Thành công thì lưu `accessToken` và `admin` vào `authAdmin` store; `mustChangePassword = true` thì chuyển tới `admin.change-password` (không vào layout chính), ngược lại chuyển tới `admin.dashboard` (hoặc trang đích trước khi bị guard chuyển về login).
- Hộp lỗi `#adminLoginError` theo `errorCode`: `INVALID_CREDENTIALS` → "Tên đăng nhập hoặc mật khẩu không đúng"; `ACCOUNT_LOCKED` → "Tài khoản quản trị đã bị khóa. Liên hệ Quản trị viên tối cao"; `ACCOUNT_TEMPORARILY_LOCKED` → "Đăng nhập sai quá nhiều lần. Thử lại sau HH:mm" (giờ lấy từ `errors.lockedUntil`, frontend tự định dạng); `VALIDATION_ERROR` → thông điệp theo trường trong `errors`; lỗi mạng/`5xx` → "Không kết nối được máy chủ".

### 5.2. Quản lý Quản trị viên trong Cài đặt hệ thống
- Là mục `admins` (component `AdminAccountsSection.vue`) trong `SystemSettingsView.vue`, mở trực tiếp tại `/admin/settings?section=admins` (`docs/00_overview_and_architecture.md` mục 5.3.3, bảng "Chức năng đặt bên trong màn hình"). Không có route hay view riêng.
- Template `system-settings.html` chưa có mục này: dựng theo cùng bố cục `.settings-section` và bảng `.data-table` của template.
- Hiển thị danh sách các Admin, nhãn vai trò theo `roleCode` (`ROOT_ADMIN` nổi bật màu vàng gold); thao tác Thêm (hiển thị `temporaryPassword` một lần), Sửa, Khóa/Kích hoạt, Đặt lại mật khẩu, Thu hồi phiên, Ngừng hoạt động – theo các endpoint `/api/v1/admin/admins*`.
- Ẩn toàn bộ mục (cả nút trên menu `.settings-sidebar`) nếu tài khoản đang đăng nhập không có `admin:manage` (`!authAdminStore.permissions.includes('admin:manage')`).

---

## 6. Kịch bản kiểm thử (Test Plan for Agent)
1. **TC-ADM-01**: Đăng nhập bằng tài khoản Root Admin, xác nhận nhận được `roleCode: "ROOT_ADMIN"`, `permissions` có `admin:manage` và truy cập được danh sách Quản trị viên.
2. **TC-ADM-02**: Đăng nhập bằng `SYSTEM_ADMIN`, thử gọi API `POST /api/v1/admin/admins`, xác nhận hệ thống trả về lỗi `403 FORBIDDEN_PERMISSION`.
3. **TC-ADM-03**: Dùng Token của User để gọi API `GET /api/v1/admin/auth/me`, xác nhận hệ thống từ chối với lỗi `401 UNAUTHORIZED`.
4. **TC-ADM-04**: Thử xóa tài khoản Root Admin, xác nhận hệ thống từ chối với `403 ROOT_ADMIN_PROTECTED` và ghi nhận cảnh báo an ninh vào `audit_logs` (`action = ACCESS_DENIED`, `resource_name = ADMIN`).
5. **TC-ADM-05**: Đăng nhập Admin với username không tồn tại, với username của tài khoản `INACTIVE` và với mật khẩu sai: cả ba trả `401 INVALID_CREDENTIALS` cùng thông điệp; `audit_logs` có `LOGIN_FAILED` với `reason` lần lượt `UNKNOWN_USER`, `UNKNOWN_USER`, `BAD_PASSWORD`. Sai lần thứ 5 vẫn trả `401`, lần thứ 6 trả `423` với `errors.lockedUntil`.
6. **TC-ADM-06**: Đăng nhập Admin vừa tạo (`must_change_password = 1`): `200`, `mustChangePassword = true`, có `admin` đầy đủ, không có `Set-Cookie`, không có dòng `auth_sessions` mới; gọi `GET /api/v1/admin/cdr` bằng token này trả `403 PASSWORD_CHANGE_REQUIRED`.
7. **TC-ADM-07**: Đăng nhập Admin với `rememberMe = true`, gọi `POST /api/v1/admin/auth/refresh`: `200` có `data = { accessToken, expiresIn }`, cookie mới có `Max-Age` ≈ số giây còn lại tới `expires_at`, phiên cũ `ROTATED` và phiên mới cùng `expires_at`, `remember_me = 1`; với `rememberMe = false` cookie mới không có `Max-Age`. Khóa admin đó rồi refresh bằng cookie cũ: `401 UNAUTHORIZED`, response có `Set-Cookie` `Max-Age=0`. Gửi cookie Refresh Token của User tới route Admin: `401`.
8. **TC-ADM-08**: Đăng nhập Admin, gọi `POST /api/v1/admin/auth/logout`: `200` với `data = null`, `Set-Cookie` `Max-Age=0`, phiên có `revoked_reason = 'LOGOUT'`, một dòng `audit_logs` `AUTH / LOGOUT` (`resource_id` = id phiên); gọi lại lần nữa: `200`, không thêm dòng audit; refresh bằng cookie cũ: `401`. Gọi logout bằng cookie vừa `ROTATED` (trong lúc tab khác refresh): phiên mới trong chuỗi bị thu hồi. Gọi bằng token `PASSWORD_CHANGE_ONLY`: `200`, không ghi audit. Gọi kèm body `{"x":1}`: `400 VALIDATION_ERROR`.
9. **TC-ADM-09**: Đăng nhập Admin, gọi `GET /api/v1/admin/auth/me`: `200`, `data` trùng `data.admin` của response đăng nhập (`permissions` sắp theo `code`, 25 mã với `ROOT_ADMIN`, 24 với `SYSTEM_ADMIN`), không thêm dòng `audit_logs`. Gọi bằng token `PASSWORD_CHANGE_ONLY`: `200` cùng cấu trúc. Gọi kèm `?x=1`: `400 VALIDATION_ERROR`. Khóa admin đó rồi gọi lại bằng Access Token cũ (còn hạn): `401 UNAUTHORIZED`, không có `Set-Cookie`. Bật chế độ bảo trì: vẫn `200`.

