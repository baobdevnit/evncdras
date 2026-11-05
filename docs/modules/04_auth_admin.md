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
     - **Đầy đủ** (bình thường): Access Token (`security_access_token_minutes`, mặc định 15 phút) ký bằng `JWT_ADMIN_SECRET`, mang `sub`, `roleCode`, `sid` (id dòng `auth_sessions` vừa tạo, `docs/01_database_schema.md` mục 6.1); tạo một dòng `auth_sessions` (`actor_type = 'ADMIN'`, `actor_id`, `refresh_token_hash` = SHA-256 của Refresh Token, `ip_address`, `user_agent` của request, `remember_me` = `rememberMe`, `logged_in_at = NOW()`, `expires_at = NOW() + security_refresh_token_days`, mặc định 7 ngày) và gửi Refresh Token qua cookie.
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
  2. Không thấy dòng, hoặc `status` khác `ACTIVE` (bị khóa hay ngừng hoạt động trong lúc Access Token còn hạn, vì guard chỉ verify JWT), hoặc token đầy đủ (không có `scope: "PASSWORD_CHANGE_ONLY"`) mà `must_change_password = 1` (mật khẩu vừa bị Root Admin đặt lại, mục 3.6): `401 UNAUTHORIZED`. Không xóa cookie (phiên đã bị thu hồi khi khóa/ngừng hoạt động/đặt lại mật khẩu, `docs/01_database_schema.md` mục 6.1), nên client refresh một lần, refresh trả `401` và frontend về trang đăng nhập. Không xét `locked_until` (khóa tạm chỉ chặn đăng nhập), tuổi mật khẩu; token `PASSWORD_CHANGE_ONLY` với `must_change_password = 1` là bình thường. Đây là **kiểm tra tài khoản ở mỗi request** mà bước 1 của mọi API cổng Admin dẫn tới ("cùng quy tắc mục 3.1.1").
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
| `401` | `UNAUTHORIZED` | Access Token thiếu, sai, hết hạn hoặc của cổng User (guard); tài khoản không còn `ACTIVE`, hoặc token đầy đủ mà `must_change_password = 1` (bước 2) |

- **Frontend**: chỉ gọi khi store chưa có `admin`, tức sau lần refresh lúc vào cổng hoặc tải lại trang (`docs/00_overview_and_architecture.md` mục 5.3.2); sau đăng nhập và đổi mật khẩu không gọi (đăng nhập đã trả `admin`). Gọi qua API client của cổng (`401` → refresh một lần rồi gửi lại); thành công thì lưu `data` vào `authAdmin.admin`, router guard và menu đọc `permissions` từ đây. Header của `AdminLayout` hiển thị `fullName`, `roleName`, ảnh `avatarUrl` (`null` thì ảnh chữ cái đầu tạo từ `fullName` ở frontend). Mẫu: `window.adminSession.loadMe`, `renderAccount` trong `templates/admin/main.js`.
- Index phục vụ: khóa chính `admins`, `admin_roles`, `roles`.

### 3.2. Danh sách Quản trị viên (`GET /api/v1/admin/admins`)
- **Guard**: `AdminAuthGuard`, `PermissionsGuard` với `admin:manage` (chỉ vai trò `ROOT_ADMIN` có, mục 4.1). Token `PASSWORD_CHANGE_ONLY` trả `403 PASSWORD_CHANGE_REQUIRED`; thiếu quyền trả `403 FORBIDDEN_PERMISSION`.
- **Query** (quy tắc chung `docs/02_api_contracts.md` mục 2.2; không có body):

| Tham số | Kiểu | Mặc định | Ràng buộc |
|---|---|---|---|
| `page` | số nguyên | 1 | ≥ 1 |
| `limit` | số nguyên | 10 | 1–100 |
| `search` | string | — | Cắt khoảng trắng hai đầu, rỗng = không lọc, ≤ 100 ký tự; khớp chứa trên `username`, `email`, `full_name` (`OR`) |
| `status` | enum | — (tất cả, kể cả `INACTIVE`) | `ACTIVE` \| `LOCKED` \| `INACTIVE` |

  Sai định dạng, ngoài khoảng, giá trị enum lạ, tham số lặp lại hoặc tham số khác (`sort`, `order`, `roleCode`…) trả `400 VALIDATION_ERROR` với `errors` theo tên tham số.
- **Xử lý** (chỉ đọc, không ghi CSDL, không ghi `audit_logs`):
  1. Đọc `admins` theo khóa chính `id = sub`; không thấy dòng hoặc `status` khác `ACTIVE` trả `401 UNAUTHORIZED` (cùng quy tắc mục 3.1.1).
  2. Đếm và lấy trang trong cùng một điều kiện:

```sql
SELECT a.id, a.username, a.email, a.full_name, a.phone_number, a.avatar_url, a.status,
       r.code AS role_code, r.name AS role_name, a.last_login_at, a.created_at, a.updated_at
FROM admins a
JOIN admin_roles ar ON ar.admin_id = a.id
JOIN roles r ON r.id = ar.role_id
WHERE (:status IS NULL OR a.status = :status)
  AND (:search IS NULL OR a.username LIKE :pattern ESCAPE '\\'
       OR a.email LIKE :pattern ESCAPE '\\' OR a.full_name LIKE :pattern ESCAPE '\\')
ORDER BY (r.code = 'ROOT_ADMIN') DESC, FIELD(a.status, 'ACTIVE', 'LOCKED', 'INACTIVE'), a.full_name, a.id
LIMIT :limit OFFSET (:page - 1) * :limit;
-- :pattern = CONCAT('%', <search đã thoát \ % _>, '%'); total: SELECT COUNT(*) cùng FROM/JOIN/WHERE
```

  Thứ tự cố định (không có tham số sắp xếp): Root Admin trước, rồi `ACTIVE` → `LOCKED` → `INACTIVE`, rồi họ tên, cuối cùng `id` để phân trang ổn định. `page` vượt `totalPages` trả `200`, `data = []`.
- **Response** `200` (khung `docs/02_api_contracts.md` mục 2.2, không có khóa cấp cao khác):

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy danh sách quản trị viên thành công",
  "data": [
    {
      "id": 1,
      "username": "root.admin@evnict.vn",
      "email": "root.admin@evnict.vn",
      "fullName": "Quản trị viên Tối cao EVNICT",
      "phoneNumber": "02422222222",
      "avatarUrl": "/media/avatars/3f2a9c4e-7b1d-4e8a-9c2f-1a2b3c4d5e6f.png",
      "status": "ACTIVE",
      "roleCode": "ROOT_ADMIN",
      "roleName": "Quản trị viên tối cao",
      "lastLoginAt": "2026-11-05T08:15:00+07:00",
      "createdAt": "2026-08-15T09:00:00+07:00",
      "updatedAt": "2026-11-05T08:15:00+07:00"
    },
    {
      "id": 7,
      "username": "admin.npc",
      "email": "admin.npc@npc.com.vn",
      "fullName": "Nguyễn Văn Trực",
      "phoneNumber": null,
      "avatarUrl": null,
      "status": "ACTIVE",
      "roleCode": "SYSTEM_ADMIN",
      "roleName": "Quản trị viên hệ thống",
      "lastLoginAt": null,
      "createdAt": "2026-09-20T14:00:00+07:00",
      "updatedAt": "2026-09-20T14:00:00+07:00"
    }
  ],
  "pagination": { "page": 1, "limit": 10, "total": 2, "totalPages": 1, "hasNext": false, "hasPrev": false },
  "timestamp": "2026-11-05T10:00:00+07:00"
}
```

| Trường | Nguồn | Ghi chú |
|---|---|---|
| `id`, `username`, `email`, `fullName`, `phoneNumber`, `status` | `admins` | `phoneNumber` `null` khi chưa có |
| `avatarUrl` | `admins.avatar_url` | Đường dẫn tương đối `/media/avatars/...` hoặc `null` (`docs/modules/09_admin_profile.md` mục 3.2.1) |
| `roleCode`, `roleName` | `roles.code`, `roles.name` qua `admin_roles` | `ROOT_ADMIN` \| `SYSTEM_ADMIN` |
| `lastLoginAt` | `admins.last_login_at` | `null` khi chưa đăng nhập |
| `createdAt`, `updatedAt` | `admins` | ISO 8601 `+07:00` |

  Không trả `password_hash`, `must_change_password`, `password_changed_at`, `failed_login_count`, `locked_until`, `created_by_admin_id` hay thông tin phiên. Phần tử này cũng là `data` của `PUT /admin/admins/:id` (mục 3.8).
- **Lỗi**:

| HTTP | `errorCode` | Khi nào |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Query sai (bảng trên) |
| `401` | `UNAUTHORIZED` | Access Token thiếu, sai, hết hạn hoặc của cổng User (guard); tài khoản người gọi không còn `ACTIVE` (bước 1) |
| `403` | `PASSWORD_CHANGE_REQUIRED` | Gọi bằng token `PASSWORD_CHANGE_ONLY` |
| `403` | `FORBIDDEN_PERMISSION` | Thiếu `admin:manage` (`SYSTEM_ADMIN`) |

- **Frontend** (mục 5.2): ô tìm kiếm (`maxlength="100"`, gửi sau 300 ms ngừng gõ hoặc khi nhấn Enter, chuỗi rỗng sau khi cắt thì bỏ tham số), ô chọn trạng thái ("Tất cả trạng thái" = không gửi `status`), thanh phân trang `limit = 10` (thông tin "Hiển thị x–y / tổng" và nút trang). Đổi tìm kiếm/trạng thái thì về trang 1; chỉ hiển thị kết quả của request gửi sau cùng. `data` rỗng mà `page > 1` và `totalPages > 0` (vd. sau khi một thao tác làm danh sách ngắn lại) thì tải lại trang `totalPages`. Trạng thái: đang tải; lỗi (thông điệp + nút "Thử lại"); rỗng: không lọc thì "Chưa có quản trị viên nào", có lọc thì "Không có quản trị viên phù hợp với bộ lọc". `401` do API client xử lý (refresh một lần rồi gửi lại). Thời gian định dạng ở frontend (`Asia/Ho_Chi_Minh`), nhãn trạng thái: `ACTIVE` "Hoạt động", `LOCKED` "Đã khóa", `INACTIVE` "Ngừng hoạt động". Mẫu: `mockGetAdmins`, `loadAdmins` trong `templates/admin/system-settings.js`.
- Index phục vụ: khóa chính `admins`, `admin_roles`, `roles`. Bảng `admins` chỉ vài chục dòng nên lọc/sắp xếp quét bảng, không thêm index (`search` khớp chứa cũng không dùng được index).

### 3.3. Tạo mới Quản trị viên (`POST /api/v1/admin/admins`)
- **Guard**: `AdminAuthGuard`, `PermissionsGuard` với `admin:manage` (chỉ vai trò `ROOT_ADMIN` có, mục 4.1). Token `PASSWORD_CHANGE_ONLY` trả `403 PASSWORD_CHANGE_REQUIRED`; thiếu quyền trả `403 FORBIDDEN_PERMISSION`.
- **Body** (JSON; không có query, gửi query param trả `400`):
```json
{
  "username": "admin.hanoi",
  "email": "admin.hanoi@evnhanoi.vn",
  "fullName": "Kỹ thuật viên Trực ban EVNHANOI",
  "phoneNumber": "0912345678"
}
```

| Trường | Kiểu | Bắt buộc | Ràng buộc (cột đích) |
|---|---|---|---|
| `username` | string | Có | Cắt khoảng trắng hai đầu; `^[A-Za-z0-9._@-]{3,100}$` (`docs/02_api_contracts.md` mục 2, `admins.username` ≤ 100) |
| `email` | string | Có | Cắt khoảng trắng hai đầu; ≤ 150 ký tự, `^[^\s@]+@[^\s@]+\.[^\s@]+$` (`admins.email`) |
| `fullName` | string | Có | Cắt khoảng trắng hai đầu; 1–150 ký tự sau khi cắt (`admins.full_name`) |
| `phoneNumber` | string \| null | Không | Quy tắc chung `docs/02_api_contracts.md` mục 2: rỗng/`null`/không gửi → `NULL`, còn lại `^(?=.*[0-9])[0-9+\-.() ]{1,30}$` |

  Thiếu trường bắt buộc, sai kiểu, sai định dạng, quá độ dài hoặc có trường khác (`password`, `roleCode`, `status`, `avatarUrl`, `mustChangePassword`…) trả `400 VALIDATION_ERROR` với `errors` theo tên trường; không ghi `audit_logs`. Body không có trường vai trò: Admin tạo qua API luôn mang `SYSTEM_ADMIN`. Không có API gán hoặc đổi vai trò Admin; `ROOT_ADMIN` chỉ được gán qua seed ban đầu (`npm run seed:root`, `docs/01_database_schema.md` mục 3).
- **Mật khẩu tạm** (sinh **trước** khi mở transaction, vì `bcrypt` tốn ~100 ms): 16 ký tự lấy bằng `crypto.randomInt` từ 4 nhóm đã bỏ ký tự dễ nhầm: chữ hoa `ABCDEFGHJKLMNPQRSTUVWXYZ`, chữ thường `abcdefghjkmnpqrstuvwxyz`, chữ số `23456789`, ký tự đặc biệt `!@#$%^&*-_=+?`; có ít nhất một ký tự mỗi nhóm (đạt chính sách 3/4 loại, ≥ `security_password_min_length`, ≤ 72 byte, `docs/01_database_schema.md` mục 6.1), xáo trộn vị trí bằng `crypto.randomInt`. Băm `bcrypt` cost 10. Chỉ lưu bản băm; mật khẩu gốc chỉ có trong response, **không** ghi vào `audit_logs`, log ứng dụng hay log request/response (logger bỏ `data.temporaryPassword`); không có API xem lại, quên thì Root Admin đặt lại (mục 3.6). Cùng cách sinh cho `reset-password` (mục 3.6) và các API tạo/đặt lại mật khẩu người dùng.
- **Xử lý** (một transaction, sau khi kiểm tra body):
  1. Đọc `admins` theo khóa chính `id = sub`; không thấy dòng hoặc `status` khác `ACTIVE` trả `401 UNAUTHORIZED` (cùng quy tắc mục 3.1.1).
  2. Kiểm tra trùng (`docs/02_api_contracts.md` mục 2) bằng đọc khóa, để chạy tuần tự với lần tạo hoặc sửa `email` đồng thời (gap lock của `REPEATABLE READ` trên index duy nhất chặn `INSERT` giá trị đó tới khi commit):

```sql
SELECT id, username_active, email_active FROM admins
 WHERE username_active IN (:username, :email) FOR UPDATE;   -- uniq_admins_username
SELECT id, username_active, email_active FROM admins
 WHERE email_active IN (:username, :email) FOR UPDATE;      -- uniq_admins_email
```

     `username` trùng `username_active` hoặc `email_active` của một dòng thì có `errors.username`; `email` trùng `email_active` hoặc `username_active` của một dòng thì có `errors.email`; có lỗi thì `409 ACCOUNT_DUPLICATE` (rollback, không ghi `audit_logs`). So sánh theo collation (không phân biệt hoa thường). Hai lần tạo đồng thời cùng giữ gap lock rồi cùng `INSERT` có thể gặp deadlock (`1213`): backend chạy lại cả transaction tối đa 2 lần; lần chạy lại thấy dòng vừa commit thì trả `409`. `INSERT` vẫn gặp `ER_DUP_ENTRY` trên `uniq_admins_username`/`uniq_admins_email` (lớp chặn cuối) thì cũng trả `409 ACCOUNT_DUPLICATE` với khóa `errors` theo index, không trả `500`.
  3. `INSERT INTO admins` với `username`, `email`, `full_name` đã cắt khoảng trắng, `phone_number` đã chuẩn hóa, `password_hash`, `status = 'ACTIVE'`, `must_change_password = 1`, `password_changed_at = NULL` (chưa tự đặt mật khẩu lần nào; lần đổi bắt buộc đầu tiên ghi `NOW()`), `failed_login_count = 0`, `locked_until = NULL`, `avatar_url = NULL`, `created_by_admin_id = sub`.
  4. `INSERT INTO admin_roles (admin_id, role_id, role_scope)` với `role_id = (SELECT id FROM roles WHERE code = 'SYSTEM_ADMIN')` (`uniq_roles_code`), `role_scope = 'ADMIN'` (`docs/01_database_schema.md` mục 7).
  5. `INSERT INTO user_settings (user_type, user_id)` với `user_type = 'ADMIN'`, `user_id` = id mới, các cột khác lấy mặc định DDL (`docs/01_database_schema.md` mục 12).
  6. Ghi `audit_logs` `ADMIN / CREATE`: `actor_type = 'ADMIN'`, `actor_id = sub`, `actor_name` = `admins.full_name` của người gọi, `resource_id` = id admin mới, `ip_address`, `user_agent` của request, `action_details = { "username": "<username>", "email": "<email>", "roleCode": "SYSTEM_ADMIN" }` (không có mật khẩu).
  7. Đọc lại dòng vừa tạo bằng câu `SELECT` của mục 3.2 với `WHERE a.id = :newId` (lấy `created_at`, `updated_at` do CSDL gán), rồi commit.

  Không tạo `auth_sessions`, không gửi thông báo hay email: Root Admin tự chuyển mật khẩu tạm cho người được tạo. Lần đăng nhập đầu tiên nhận token `PASSWORD_CHANGE_ONLY` và phải đổi mật khẩu (mục 3.1 bước 5, TC-ADM-06).
- **Response** `201 Created`, header `Cache-Control: no-store` (response chứa mật khẩu). `data` = phần tử của mục 3.2 (đúng 12 trường, cùng bảng nguồn trường) thêm `temporaryPassword`:

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Tạo quản trị viên thành công",
  "data": {
    "id": 19,
    "username": "admin.hanoi",
    "email": "admin.hanoi@evnhanoi.vn",
    "fullName": "Kỹ thuật viên Trực ban EVNHANOI",
    "phoneNumber": "0912345678",
    "avatarUrl": null,
    "status": "ACTIVE",
    "roleCode": "SYSTEM_ADMIN",
    "roleName": "Quản trị viên hệ thống",
    "lastLoginAt": null,
    "createdAt": "2026-11-05T14:00:00+07:00",
    "updatedAt": "2026-11-05T14:00:00+07:00",
    "temporaryPassword": "q7Vt#2mPz9Lw!4Rk"
  },
  "timestamp": "2026-11-05T14:00:00+07:00"
}
```

  `temporaryPassword` chỉ có ở response này (và ở response `PUT /admin/admins/:id/reset-password`, mục 3.6); `GET` không bao giờ trả.
- **Lỗi**:

| HTTP | `errorCode` | Khi nào |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Body sai (bảng trên), có query param |
| `401` | `UNAUTHORIZED` | Access Token thiếu, sai, hết hạn hoặc của cổng User (guard); tài khoản người gọi không còn `ACTIVE` (bước 1) |
| `403` | `PASSWORD_CHANGE_REQUIRED` | Gọi bằng token `PASSWORD_CHANGE_ONLY` |
| `403` | `FORBIDDEN_PERMISSION` | Thiếu `admin:manage` (`SYSTEM_ADMIN`) |
| `409` | `ACCOUNT_DUPLICATE` | `username`/`email` trùng (kể cả trùng chéo) với Admin chưa `INACTIVE` (bước 2), `errors.username` và/hoặc `errors.email` |

- **Frontend** (mục 5.2): nút "Thêm quản trị viên" ở đầu mục `admins` mở hộp `#adminCreateModal` gồm đúng 4 ô (`username` `maxlength="100"`, `email` `maxlength="150"`, `fullName` `maxlength="150"`, `phoneNumber` `maxlength="30"`; ba ô đầu bắt buộc), không có ô mật khẩu hay vai trò (dòng ghi chú: tài khoản mới mang vai trò Quản trị viên hệ thống, mật khẩu tạm do hệ thống sinh). Gửi qua API client của cổng (`401` → refresh một lần rồi gửi lại); `phoneNumber` rỗng gửi `null`. Trong lúc gửi khóa các nút và không đóng hộp. `400`/`409`: hiện `errors[field]` dưới ô tương ứng (khóa không có ô thì toast), giữ hộp mở để sửa. `403` toast cảnh báo theo `message`; lỗi khác toast lỗi. `201`: đóng hộp, xóa form, mở hộp `#adminTempPasswordModal` hiển thị họ tên, tên đăng nhập và `temporaryPassword` (phông đơn cách, nút "Sao chép" dùng `navigator.clipboard`), cảnh báo "Mật khẩu chỉ hiển thị một lần; người được cấp phải đổi ở lần đăng nhập đầu tiên"; mật khẩu chỉ nằm trong biến cục bộ của hộp, không lưu store, `localStorage`/`sessionStorage` hay URL, đóng hộp thì xóa khỏi DOM. Sau `201` tải lại danh sách (giữ bộ lọc và trang hiện tại). Mẫu: `mockCreateAdmin`, `submitCreateAdmin`, `showTempPassword` trong `templates/admin/system-settings.js`.
- Index phục vụ: khóa chính `admins` (bước 1, 7); `uniq_admins_username`, `uniq_admins_email` (bước 2, chặn trùng ở mức CSDL); `uniq_roles_code` (bước 4); `uniq_user_settings` (bước 5).

### 3.4. Khóa / Mở khóa Admin (`PUT /api/v1/admin/admins/:id/status`)

- **Guard**: `AdminAuthGuard`, `PermissionsGuard` với `admin:manage` (chỉ vai trò `ROOT_ADMIN` có, mục 4.1). Token `PASSWORD_CHANGE_ONLY` trả `403 PASSWORD_CHANGE_REQUIRED`; thiếu quyền trả `403 FORBIDDEN_PERMISSION`.
- **Request**: `:id` là `admins.id` như mục 3.7 (`^[1-9][0-9]{0,9}$` và ≤ 4294967295, sai thì `400` với `errors.id`). Không có query (gửi query param trả `400`). Body JSON đúng một trường:

```json
{ "status": "LOCKED" }
```

| Trường | Kiểu | Bắt buộc | Ràng buộc |
|---|---|---|---|
| `status` | string | Có | `ACTIVE` (mở khóa) hoặc `LOCKED` (khóa), đúng chữ hoa; giá trị khác, kể cả `INACTIVE` (ngừng hoạt động qua mục 3.9) và `active`, trả `400` |

  Thiếu `status`, sai kiểu, sai giá trị hoặc có trường khác trả `400 VALIDATION_ERROR` với `errors` theo tên trường; không ghi `audit_logs`.
- **Xử lý** (một transaction, theo thứ tự; dừng ở lỗi đầu tiên):
  1. Đọc `admins` theo khóa chính `id = sub`; không thấy dòng hoặc `status` khác `ACTIVE` trả `401 UNAUTHORIZED` (cùng quy tắc mục 3.1.1).
  2. `:id` = `sub` trả `403 SELF_ACTION_FORBIDDEN` với cả hai giá trị `status` (không tự khóa/tự mở khóa).
  3. `SELECT id, status, full_name, username FROM admins WHERE id = :id FOR UPDATE` (khóa chính; chạy tuần tự với thu hồi phiên, đặt lại mật khẩu, sửa, ngừng hoạt động cùng tài khoản: mọi thao tác quản trị trên một Admin khóa dòng `admins` trước rồi mới tới `auth_sessions`). Không thấy trả `404 NOT_FOUND`.
  4. Vai trò của tài khoản đích (`admin_roles` theo khóa chính `admin_id`, nối `roles`) là `ROOT_ADMIN` trả `403 ROOT_ADMIN_PROTECTED` với cả hai giá trị `status`; không ghi `audit_logs` (chỉ Root Admin gọi được API này, như mục 3.7; riêng mục 3.9 ghi `ACCESS_DENIED`).
  5. `status` hiện tại là `INACTIVE` trả `409 ACCOUNT_INACTIVE` (trạng thái cuối, không kích hoạt lại, `docs/01_database_schema.md` mục 14).
  6. `status` hiện tại bằng `status` trong body: trả `200` với `data` như dưới, không `UPDATE`, không thu hồi phiên, không ghi `audit_logs` (như `docs/modules/03_auth_user.md` mục 3.7).
  7. Sang `LOCKED`: `UPDATE admins SET status = 'LOCKED' WHERE id = :id`; rồi `UPDATE auth_sessions SET revoked_at = NOW(), revoked_reason = 'ACCOUNT_LOCKED' WHERE actor_type = 'ADMIN' AND actor_id = :id AND revoked_at IS NULL AND expires_at > NOW()` (qua `idx_session_actor`, cùng điều kiện mục 3.7 bước 5), `n` = số dòng bị sửa; ghi `audit_logs` `ADMIN / LOCK` với `action_details = { "revokedCount": n }` (kể cả `n = 0`).
     Sang `ACTIVE`: `UPDATE admins SET status = 'ACTIVE' WHERE id = :id`; ghi `audit_logs` `ADMIN / UNLOCK` với `action_details = NULL`.
     Cả hai: `actor_type = 'ADMIN'`, `actor_id = sub`, `actor_name` = `admins.full_name` của người gọi, `resource_id` = `:id`, `ip_address`, `user_agent` của request. Không đổi `failed_login_count`, `locked_until` (khóa tạm do sai mật khẩu tách biệt với `LOCKED`), `must_change_password`, `password_hash`; mở khóa không khôi phục phiên cũ, Admin phải đăng nhập lại.
- **Hiệu lực**: khóa có tác dụng ngay ở request kế tiếp của tài khoản bị khóa, kể cả với Access Token còn hạn: `AdminAuthGuard` đọc `admins.status` mỗi request và trả `401 UNAUTHORIZED` khi không còn `ACTIVE` (mục 3.1.1); `refresh` trả `401` và xóa cookie (`docs/modules/03_auth_user.md` mục 3.2.1 bước 3 hoặc 5); đăng nhập trả `403 ACCOUNT_LOCKED` (mục 3.1). Refresh đồng thời commit trước lần khóa (đọc `status` lúc còn `ACTIVE`) có thể tạo phiên mới lọt câu thu hồi bước 7, nhưng phiên đó không dùng được vì các kiểm tra trên đọc `status` mới. Không có sự kiện Socket.IO đẩy ra; tab đang mở của tài khoản bị khóa về trang đăng nhập ở lần gọi API kế tiếp.
- **Response** `200`: `data = { id, status }` (trạng thái sau khi xử lý).

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Đã khóa tài khoản quản trị viên",
  "data": { "id": 7, "status": "LOCKED" },
  "timestamp": "2026-11-05T15:00:00+07:00"
}
```

  Thông điệp: "Đã khóa tài khoản quản trị viên" / "Đã mở khóa tài khoản quản trị viên"; bước 6: "Tài khoản đã ở trạng thái này".
- **Lỗi**:

| HTTP | `errorCode` | Khi nào |
|---|---|---|
| `400` | `VALIDATION_ERROR` | `:id` sai định dạng (`errors.id`); body sai (bảng trên); có query param |
| `401` | `UNAUTHORIZED` | Access Token thiếu, sai, hết hạn hoặc của cổng User (guard); tài khoản người gọi không còn `ACTIVE` (bước 1) |
| `403` | `PASSWORD_CHANGE_REQUIRED` | Gọi bằng token `PASSWORD_CHANGE_ONLY` |
| `403` | `FORBIDDEN_PERMISSION` | Thiếu `admin:manage` (`SYSTEM_ADMIN`) |
| `403` | `SELF_ACTION_FORBIDDEN` | `:id` là chính người gọi (bước 2) |
| `403` | `ROOT_ADMIN_PROTECTED` | Tài khoản đích mang vai trò `ROOT_ADMIN` (bước 4) |
| `404` | `NOT_FOUND` | Không có admin `:id` (bước 3) |
| `409` | `ACCOUNT_INACTIVE` | Tài khoản đích đã `INACTIVE` (bước 5) |

- **Frontend** (mục 5.2): nút "Khóa" chỉ có ở dòng `status = ACTIVE`, nút "Mở khóa" chỉ ở dòng `status = LOCKED`; cả hai chỉ khi `roleCode` khác `ROOT_ADMIN` và `id` khác `authAdmin.admin.id` (dòng `INACTIVE` không có nút). Bấm nút mở `ConfirmModal` (`docs/03_ui_design.md` mục 6.6) nêu họ tên và tên đăng nhập: Khóa loại nguy hiểm, nói rõ tài khoản bị đăng xuất khỏi mọi thiết bị ngay và không đăng nhập được tới khi mở khóa; Mở khóa loại thường (`primary`), nói rõ tài khoản đăng nhập lại được bằng mật khẩu hiện tại. Xác nhận thì gửi `{ status }` qua API client của cổng (`401` → refresh một lần rồi gửi lại); trong lúc gửi khóa hai nút, không đóng hộp. Kết quả: `200` toast thành công theo `message` rồi **tải lại** danh sách (giữ bộ lọc và trang; thứ tự sắp xếp đổi theo trạng thái, lọc theo trạng thái có thể làm dòng biến mất); `403`, `404`, `409` toast cảnh báo theo `message` rồi tải lại danh sách; lỗi khác toast lỗi, giữ nguyên danh sách. Mẫu: `mockSetAdminStatus`, `confirmSetAdminStatus` trong `templates/admin/system-settings.js`.
- Index phục vụ: khóa chính `admins`, `admin_roles` (bước 1, 3, 4); `idx_session_actor` (bước 7).
- Bản tương ứng cho người dùng đơn vị là `PUT /api/v1/users/:id/status` (`docs/modules/03_auth_user.md` mục 3.7), khác ở khóa dòng nhóm trước và chặn Quản trị viên nhóm cuối cùng (`409 LAST_GROUP_ADMIN`).

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
  - Frontend: nút "Đăng xuất" trong menu tài khoản mở hộp xác nhận (`ConfirmModal`); bấm xác nhận thì khóa nút, gọi API rồi luôn xóa store `authAdmin` và `preferencesAdmin` (`docs/modules/09_admin_profile.md` mục 3.6), ngắt Socket.IO namespace `/admin/notifications` và chuyển về `admin.login` (mẫu `window.adminSession.logout` trong `templates/admin/main.js`).

### 3.6. Đặt lại mật khẩu Admin khác (`PUT /api/v1/admin/admins/:id/reset-password`)

- **Guard**: `AdminAuthGuard`, `PermissionsGuard` với `admin:manage` (chỉ vai trò `ROOT_ADMIN` có, mục 4.1). Token `PASSWORD_CHANGE_ONLY` trả `403 PASSWORD_CHANGE_REQUIRED`; thiếu quyền trả `403 FORBIDDEN_PERMISSION`.
- **Request**: `:id` là `admins.id` như mục 3.7 (`^[1-9][0-9]{0,9}$` và ≤ 4294967295, sai thì `400` với `errors.id`). Không có query, không có body; gửi query param hoặc body có trường trả `400 VALIDATION_ERROR` (không ghi `audit_logs`). Người gọi không chọn mật khẩu: luôn do hệ thống sinh.
- **Mật khẩu tạm**: sinh và băm **trước** khi mở transaction, cùng cách của mục 3.3 (16 ký tự, 4 nhóm bỏ ký tự dễ nhầm, `bcrypt` cost 10, không ghi vào `audit_logs`/log ứng dụng/log request-response). Không so với mật khẩu hiện tại (sinh ngẫu nhiên; quy tắc "khác mật khẩu hiện tại" của `docs/01_database_schema.md` mục 6.1 áp cho lần tự đổi).
- **Xử lý** (một transaction, sau khi kiểm tra request; theo thứ tự, dừng ở lỗi đầu tiên):
  1. Đọc `admins` theo khóa chính `id = sub`; không thấy dòng hoặc `status` khác `ACTIVE` trả `401 UNAUTHORIZED` (cùng quy tắc mục 3.1.1).
  2. `:id` = `sub` trả `403 SELF_ACTION_FORBIDDEN` (tự đổi qua `PUT /admin/profile/change-password`, `docs/modules/09_admin_profile.md` mục 3.3).
  3. `SELECT id, status FROM admins WHERE id = :id FOR UPDATE` (khóa chính; khóa dòng `admins` đích trước `auth_sessions` như mục 3.4 bước 3). Không thấy trả `404 NOT_FOUND`.
  4. Vai trò của tài khoản đích (`admin_roles` theo khóa chính `admin_id`, nối `roles`) là `ROOT_ADMIN` trả `403 ROOT_ADMIN_PROTECTED`; không ghi `audit_logs` (như mục 3.4, 3.7, 3.8). Root Admin quên mật khẩu thì Root Admin khác đặt lại qua CSDL/seed (`npm run seed:root`).
  5. `status` là `INACTIVE` trả `409 ACCOUNT_INACTIVE` (`docs/01_database_schema.md` mục 14). Tài khoản `LOCKED` vẫn đặt lại được, trạng thái giữ `LOCKED` (muốn đăng nhập thì mở khóa qua mục 3.4).
  6. Đổi mật khẩu và xóa khóa tạm do sai mật khẩu (người được cấp đăng nhập được ngay bằng mật khẩu tạm):

```sql
UPDATE admins
   SET password_hash = :hash, must_change_password = 1, failed_login_count = 0, locked_until = NULL
 WHERE id = :id;   -- updated_at tự cập nhật; password_changed_at giữ nguyên (lần đổi bắt buộc kế tiếp ghi NOW())
```

  7. `UPDATE auth_sessions SET revoked_at = NOW(), revoked_reason = 'PASSWORD_CHANGED' WHERE actor_type = 'ADMIN' AND actor_id = :id AND revoked_at IS NULL AND expires_at > NOW()` (qua `idx_session_actor`, cùng điều kiện mục 3.7 bước 5); `n` = số dòng bị sửa.
  8. Ghi `audit_logs` `AUTH / PASSWORD_RESET` (luôn ghi, kể cả `n = 0`): `actor_type = 'ADMIN'`, `actor_id = sub`, `actor_name` = `admins.full_name` của người gọi, `resource_id` = `:id` (id admin đích), `ip_address`, `user_agent` của request, `action_details = { "targetActorType": "ADMIN", "revokedCount": n }` (không có mật khẩu). Commit.

  Không gửi thông báo hay email: Root Admin tự chuyển mật khẩu tạm cho người được cấp. Lần đăng nhập kế tiếp bằng mật khẩu tạm nhận token `PASSWORD_CHANGE_ONLY` (mục 3.1 bước 5); mật khẩu cũ trả `401 INVALID_CREDENTIALS`.
- **Hiệu lực ngay trên thiết bị của tài khoản đích**: Access Token đầy đủ còn hạn bị từ chối ở request kế tiếp: kiểm tra tài khoản ở mỗi request (mục 3.1.1 bước 2) trả `401 UNAUTHORIZED` khi token không phải `PASSWORD_CHANGE_ONLY` mà `must_change_password = 1`; client refresh một lần, refresh trả `401` (phiên đã `PASSWORD_CHANGED`) và xóa cookie, frontend về trang đăng nhập. Refresh đồng thời: câu bước 7 là đọc khóa nên chạy tuần tự với refresh (như mục 3.7); phiên mới do refresh commit trước tạo ra bị bước 7 thu hồi, token mới cấp kèm vẫn bị chặn vì `must_change_password = 1`.
- **Response** `200`, header `Cache-Control: no-store` (response chứa mật khẩu). `data = { id, temporaryPassword }`, trả **một lần**, không có API xem lại:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Đã đặt lại mật khẩu quản trị viên",
  "data": { "id": 7, "temporaryPassword": "Hn4#xT9qWm2!pRz7" },
  "timestamp": "2026-11-05T17:00:00+07:00"
}
```

- **Lỗi**:

| HTTP | `errorCode` | Khi nào |
|---|---|---|
| `400` | `VALIDATION_ERROR` | `:id` sai định dạng (`errors.id`); có query param hoặc body có trường |
| `401` | `UNAUTHORIZED` | Access Token thiếu, sai, hết hạn hoặc của cổng User (guard); tài khoản người gọi không còn `ACTIVE` (bước 1) |
| `403` | `PASSWORD_CHANGE_REQUIRED` | Gọi bằng token `PASSWORD_CHANGE_ONLY` |
| `403` | `FORBIDDEN_PERMISSION` | Thiếu `admin:manage` (`SYSTEM_ADMIN`) |
| `403` | `SELF_ACTION_FORBIDDEN` | `:id` là chính người gọi (bước 2) |
| `403` | `ROOT_ADMIN_PROTECTED` | Tài khoản đích mang vai trò `ROOT_ADMIN` (bước 4) |
| `404` | `NOT_FOUND` | Không có admin `:id` (bước 3) |
| `409` | `ACCOUNT_INACTIVE` | Tài khoản đích đã `INACTIVE` (bước 5) |

- **Frontend** (mục 5.2): nút "Đặt lại mật khẩu" chỉ có ở dòng `status` `ACTIVE` hoặc `LOCKED`, `roleCode` khác `ROOT_ADMIN` và `id` khác `authAdmin.admin.id` (như nút "Sửa"). Bấm nút mở `ConfirmModal` (`docs/03_ui_design.md` mục 6.6, loại nguy hiểm) nêu họ tên và tên đăng nhập, nói rõ mật khẩu hiện tại hết hiệu lực ngay, mọi thiết bị bị đăng xuất, mật khẩu tạm chỉ hiển thị một lần và người được cấp phải đổi khi đăng nhập; dòng `LOCKED` thêm câu "Tài khoản vẫn bị khóa; cần mở khóa để đăng nhập". Xác nhận thì gọi qua API client của cổng (`401` → refresh một lần rồi gửi lại); trong lúc gửi khóa hai nút, không đóng hộp. `200`: đóng hộp xác nhận, mở `#adminTempPasswordModal` (dùng lại của mục 3.3, tiêu đề "Đã đặt lại mật khẩu") với họ tên, tên đăng nhập lấy từ dòng danh sách và `temporaryPassword` từ response; cùng quy tắc giữ mật khẩu (chỉ trong DOM khi mở, đóng thì xóa, bấm nền không đóng); không tải lại danh sách (cột hiển thị không đổi). `403`, `404`, `409` toast cảnh báo theo `message` rồi tải lại danh sách; lỗi khác toast lỗi, giữ nguyên danh sách. Mẫu: `mockResetAdminPassword`, `confirmResetAdminPassword`, `showTempPassword` trong `templates/admin/system-settings.js`.
- Index phục vụ: khóa chính `admins`, `admin_roles` (bước 1, 3, 4, 6); `idx_session_actor` (bước 7). Không cần index mới.
- Bản tương ứng cho người dùng đơn vị là `PUT /api/v1/users/:id/reset-password` (`docs/modules/03_auth_user.md` mục 3.8), `action_details = { "targetActorType": "USER", "revokedCount": n }`.

### 3.7. Thu hồi mọi phiên của Admin khác (`DELETE /api/v1/admin/admins/:id/sessions`)

- **Guard**: `AdminAuthGuard`, `PermissionsGuard` với `admin:manage` (chỉ vai trò `ROOT_ADMIN` có, mục 4.1). Token `PASSWORD_CHANGE_ONLY` trả `403 PASSWORD_CHANGE_REQUIRED`; thiếu quyền trả `403 FORBIDDEN_PERMISSION`.
- **Request**: `:id` là `admins.id` (`int(11) unsigned`): chuỗi `^[1-9][0-9]{0,9}$` và ≤ 4294967295, sai thì `400 VALIDATION_ERROR` với `errors.id`. Không có query, không có body; gửi query param hoặc body có trường thì `400 VALIDATION_ERROR`.
- **Xử lý** (một transaction):
  1. Đọc `admins` theo khóa chính `id = sub`; không thấy dòng hoặc `status` khác `ACTIVE` trả `401 UNAUTHORIZED` (cùng quy tắc mục 3.1.1).
  2. `:id` = `sub` trả `403 SELF_ACTION_FORBIDDEN` (thu hồi phiên khác của mình qua `DELETE /admin/auth/sessions/:id`, phiên đang dùng qua `logout`).
  3. `SELECT ... FROM admins WHERE id = :id FOR UPDATE` (khóa chính; chạy tuần tự với khóa, ngừng hoạt động, đặt lại mật khẩu cùng tài khoản). Không thấy trả `404 NOT_FOUND`.
  4. Vai trò của tài khoản đích (`admin_roles` theo khóa chính `admin_id`, nối `roles`) là `ROOT_ADMIN` trả `403 ROOT_ADMIN_PROTECTED`; không ghi `audit_logs` (chỉ người có `admin:manage`, tức Root Admin, gọi được API này).
  5. `UPDATE auth_sessions SET revoked_at = NOW(), revoked_reason = 'REVOKED_BY_ADMIN' WHERE actor_type = 'ADMIN' AND actor_id = :id AND revoked_at IS NULL AND expires_at > NOW()` (qua `idx_session_actor`); `n` = số dòng bị sửa. Phiên đã hết hạn mà chưa thu hồi để nguyên (job dọn dẹp xóa, `docs/01_database_schema.md` mục 6.1). Không xét `status` của tài khoản đích: `LOCKED`/`INACTIVE` đã bị thu hồi mọi phiên khi khóa/ngừng hoạt động nên thường `n = 0`.
  6. `n > 0`: ghi `audit_logs` `AUTH / SESSION_REVOKED` (`actor_type = 'ADMIN'`, `actor_id` = `sub`, `actor_name` = `admins.full_name` của người gọi, `resource_id` = `:id` (id admin đích, không phải id phiên), `ip_address`, `user_agent` của request, `action_details = { "targetActorType": "ADMIN", "revokedCount": n }`). `n = 0`: không ghi gì (như `logout` và `DELETE /admin/auth/sessions/:id`).
- **Refresh đồng thời của tài khoản đích**: `refresh` khóa phiên theo `refresh_token_hash`; câu `UPDATE` bước 5 là đọc khóa nên chạy tuần tự với nó: refresh commit trước thì phiên mới (vừa xoay vòng) bị bước 5 thu hồi; bước 5 trước thì refresh thấy `REVOKED_BY_ADMIN` và trả `401` (xóa cookie, không phải `REUSE_DETECTED`), kể cả nhánh ân hạn đi theo chuỗi tới phiên đã bị thu hồi. Lần đăng nhập commit sau thời điểm thu hồi tạo phiên mới hợp lệ, không bị ảnh hưởng.
- **Hiệu lực trên thiết bị bị thu hồi**: Access Token đã cấp vẫn dùng được tới khi hết hạn (tối đa `security_access_token_minutes` phút), như `docs/modules/09_admin_profile.md` mục 3.5.2; lần refresh kế tiếp trả `401`. Không có sự kiện Socket.IO đẩy ra ngay. Muốn chặn ngay cả Access Token thì khóa tài khoản (mục 3.4: guard trả `401` khi không còn `ACTIVE`).
- **Response** `200`:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Đã thu hồi phiên đăng nhập của quản trị viên",
  "data": { "revokedCount": 2 },
  "timestamp": "2026-11-05T10:30:00+07:00"
}
```

`revokedCount = 0` (thông điệp "Tài khoản không có phiên đăng nhập nào đang hoạt động") khi bước 5 không sửa dòng nào. Không trả danh sách phiên.

- **Lỗi**:

| HTTP | `errorCode` | Khi nào |
|---|---|---|
| `400` | `VALIDATION_ERROR` | `:id` sai định dạng (`errors.id`); có query param hoặc body có trường |
| `401` | `UNAUTHORIZED` | Access Token thiếu, sai, hết hạn hoặc của cổng User (guard); tài khoản người gọi không còn `ACTIVE` (bước 1) |
| `403` | `PASSWORD_CHANGE_REQUIRED` | Gọi bằng token `PASSWORD_CHANGE_ONLY` |
| `403` | `FORBIDDEN_PERMISSION` | Thiếu `admin:manage` (`SYSTEM_ADMIN`) |
| `403` | `SELF_ACTION_FORBIDDEN` | `:id` là chính người gọi (bước 2) |
| `403` | `ROOT_ADMIN_PROTECTED` | Tài khoản đích mang vai trò `ROOT_ADMIN` (bước 4) |
| `404` | `NOT_FOUND` | Không có admin `:id` (bước 3) |

- **Frontend** (mục 5.2): nút "Thu hồi phiên" chỉ có ở dòng `status = ACTIVE`, `roleCode` khác `ROOT_ADMIN` và `id` khác `authAdmin.admin.id`. Bấm nút mở `ConfirmModal` (`docs/03_ui_design.md` mục 6.6, loại nguy hiểm) nêu họ tên và tên đăng nhập, nói rõ các thiết bị của tài khoản đó bị đăng xuất khi Access Token hiện tại hết hạn (tối đa 15 phút mặc định) và tài khoản vẫn đăng nhập lại được. Xác nhận thì gọi qua API client của cổng (`401` → refresh một lần rồi gửi lại); trong lúc gửi khóa hai nút, không đóng hộp. Kết quả: `200` `revokedCount > 0` toast thành công "Đã thu hồi n phiên đăng nhập của <họ tên>"; `revokedCount = 0` toast thông tin "Tài khoản không có phiên nào đang hoạt động"; `403 SELF_ACTION_FORBIDDEN`/`ROOT_ADMIN_PROTECTED`, `404` toast cảnh báo theo `message` rồi tải lại danh sách (dữ liệu trên màn hình đã cũ); lỗi khác toast lỗi, giữ nguyên danh sách. Danh sách không hiển thị số phiên nên `200` không cần tải lại. Mẫu: `mockRevokeAdminSessions`, `confirmRevokeAdminSessions` trong `templates/admin/system-settings.js`.
- Index phục vụ: khóa chính `admins`, `admin_roles`; `idx_session_actor` (bước 5).
- Bản tương ứng cho người dùng đơn vị là `DELETE /api/v1/admin/users/:id/sessions` (quyền `user:edit`, `docs/modules/03_auth_user.md` mục 3.10), cùng cách xử lý, `targetActorType = "USER"`.

### 3.8. Sửa thông tin Admin khác (`PUT /api/v1/admin/admins/:id`)

- **Guard**: `AdminAuthGuard`, `PermissionsGuard` với `admin:manage` (chỉ vai trò `ROOT_ADMIN` có, mục 4.1). Token `PASSWORD_CHANGE_ONLY` trả `403 PASSWORD_CHANGE_REQUIRED`; thiếu quyền trả `403 FORBIDDEN_PERMISSION`.
- **Request**: `:id` là `admins.id` như mục 3.7 (`^[1-9][0-9]{0,9}$` và ≤ 4294967295, sai thì `400` với `errors.id`). Không có query (gửi query param trả `400`). Body JSON, **cập nhật một phần**, ít nhất một trường:

```json
{ "email": "admin.npc.moi@npc.com.vn", "phoneNumber": "0243 888 999" }
```

| Trường | Kiểu | Bắt buộc | Ràng buộc (cột đích) |
|---|---|---|---|
| `fullName` | string | Không | Cắt khoảng trắng hai đầu; 1–150 ký tự sau khi cắt; `null` hoặc chuỗi rỗng trả `400` (`admins.full_name`) |
| `email` | string | Không | Cắt khoảng trắng hai đầu; ≤ 150 ký tự, `^[^\s@]+@[^\s@]+\.[^\s@]+$` (`docs/02_api_contracts.md` mục 2); `null` hoặc chuỗi rỗng trả `400` (`admins.email`) |
| `phoneNumber` | string \| null | Không | Quy tắc chung `docs/02_api_contracts.md` mục 2: `null`/rỗng sau khi cắt = xóa số (`NULL`), còn lại `^(?=.*[0-9])[0-9+\-.() ]{1,30}$` (`admins.phone_number`) |

  Body rỗng `{}` trả `400` (`errors` có khóa `fullName`, `email`, `phoneNumber`, thông điệp "Cần gửi ít nhất một trường"). Sai kiểu, sai định dạng, quá độ dài hoặc có trường khác (`username`, `status`, `roleCode`, `avatarUrl`, `password`…) trả `400 VALIDATION_ERROR` với `errors` theo tên trường; không ghi `audit_logs`. `username` bất biến sau khi tạo; trạng thái đổi qua mục 3.4, mật khẩu qua mục 3.6, ảnh đại diện chỉ chủ tài khoản tự đổi (`docs/modules/09_admin_profile.md` mục 3.2.1); không có API đổi vai trò Admin.
- **Xử lý** (một transaction, sau khi kiểm tra request; theo thứ tự, dừng ở lỗi đầu tiên):
  1. Đọc `admins` theo khóa chính `id = sub`; không thấy dòng hoặc `status` khác `ACTIVE` trả `401 UNAUTHORIZED` (cùng quy tắc mục 3.1.1).
  2. `:id` = `sub` trả `403 SELF_ACTION_FORBIDDEN` (tự sửa họ tên, điện thoại qua `PUT /admin/profile`, `docs/modules/09_admin_profile.md` mục 3.2; email của chính mình không đổi qua API).
  3. `SELECT id, username, email, full_name, phone_number, status FROM admins WHERE id = :id FOR UPDATE` (khóa chính; khóa dòng `admins` đích trước mọi khóa khác như mục 3.4 bước 3). Không thấy trả `404 NOT_FOUND`.
  4. Vai trò của tài khoản đích (`admin_roles` theo khóa chính `admin_id`, nối `roles`) là `ROOT_ADMIN` trả `403 ROOT_ADMIN_PROTECTED`; không ghi `audit_logs` (như mục 3.4, 3.7). Họ tên, điện thoại của Root Admin do chính họ sửa qua `PUT /admin/profile`; email của Root Admin chỉ đổi qua seed/CSDL.
  5. `status` là `INACTIVE` trả `409 ACCOUNT_INACTIVE` (`docs/01_database_schema.md` mục 14). Tài khoản `LOCKED` vẫn sửa được, trạng thái giữ nguyên.
  6. So từng trường đã gửi (sau chuẩn hóa) với giá trị hiện tại bằng so sánh **chính xác** (phân biệt hoa thường, để đổi được `Admin.NPC@…` thành `admin.npc@…`); `changedFields` = các trường khác giá trị, theo thứ tự `fullName`, `email`, `phoneNumber`. Rỗng: không `UPDATE`, không ghi `audit_logs`, sang bước 9 (thông điệp "Không có thay đổi nào").
  7. `email` thuộc `changedFields`: kiểm tra trùng (kể cả chéo, `docs/02_api_contracts.md` mục 2) với các Admin chưa `INACTIVE` **khác** tài khoản đích bằng đọc khóa như mục 3.3 bước 2:

```sql
SELECT id FROM admins WHERE username_active = :email AND id <> :id FOR UPDATE;  -- uniq_admins_username
SELECT id FROM admins WHERE email_active = :email AND id <> :id FOR UPDATE;     -- uniq_admins_email
```

     Có dòng thì `409 ACCOUNT_DUPLICATE` với `errors.email` (rollback, không ghi `audit_logs`). `username` của chính tài khoản đích trùng `email` mới vẫn hợp lệ. Deadlock `1213` chạy lại cả transaction tối đa 2 lần; `UPDATE` gặp `ER_DUP_ENTRY` trên `uniq_admins_email` thì cũng trả `409 ACCOUNT_DUPLICATE` (`errors.email`), không trả `500`.
  8. `UPDATE admins` chỉ các cột trong `changedFields` (`updated_at` tự cập nhật); ghi `audit_logs` `ADMIN / UPDATE`: `actor_type = 'ADMIN'`, `actor_id = sub`, `actor_name` = `admins.full_name` của người gọi, `resource_id` = `:id`, `ip_address`, `user_agent` của request, `action_details = { "changedFields": [...] }` (không ghi giá trị cũ/mới, như `docs/modules/09_admin_profile.md` mục 3.2).
  9. Đọc lại bằng câu `SELECT` của mục 3.2 với `WHERE a.id = :id`, rồi commit.

  Không thu hồi phiên, không gửi thông báo hay email: đổi `email` có hiệu lực ngay ở lần đăng nhập kế tiếp (đăng nhập bằng `username` hoặc `email` mới; `email` cũ không còn đăng nhập được), phiên đang có vẫn dùng tiếp. Header của tài khoản đích đọc `fullName` từ store của chính họ nên chỉ đổi ở lần `GET /admin/auth/me` kế tiếp (đăng nhập lại hoặc tải lại trang).
- **Response** `200`: `data` = phần tử của mục 3.2 sau khi sửa (đúng 12 trường, cùng bảng nguồn trường).

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Cập nhật quản trị viên thành công",
  "data": {
    "id": 7,
    "username": "admin.npc",
    "email": "admin.npc.moi@npc.com.vn",
    "fullName": "Nguyễn Văn Trực",
    "phoneNumber": "0243 888 999",
    "avatarUrl": null,
    "status": "ACTIVE",
    "roleCode": "SYSTEM_ADMIN",
    "roleName": "Quản trị viên hệ thống",
    "lastLoginAt": null,
    "createdAt": "2026-09-20T14:00:00+07:00",
    "updatedAt": "2026-11-05T16:00:00+07:00"
  },
  "timestamp": "2026-11-05T16:00:00+07:00"
}
```

- **Lỗi**:

| HTTP | `errorCode` | Khi nào |
|---|---|---|
| `400` | `VALIDATION_ERROR` | `:id` sai định dạng (`errors.id`); body sai (bảng trên); có query param |
| `401` | `UNAUTHORIZED` | Access Token thiếu, sai, hết hạn hoặc của cổng User (guard); tài khoản người gọi không còn `ACTIVE` (bước 1) |
| `403` | `PASSWORD_CHANGE_REQUIRED` | Gọi bằng token `PASSWORD_CHANGE_ONLY` |
| `403` | `FORBIDDEN_PERMISSION` | Thiếu `admin:manage` (`SYSTEM_ADMIN`) |
| `403` | `SELF_ACTION_FORBIDDEN` | `:id` là chính người gọi (bước 2) |
| `403` | `ROOT_ADMIN_PROTECTED` | Tài khoản đích mang vai trò `ROOT_ADMIN` (bước 4) |
| `404` | `NOT_FOUND` | Không có admin `:id` (bước 3) |
| `409` | `ACCOUNT_INACTIVE` | Tài khoản đích đã `INACTIVE` (bước 5) |
| `409` | `ACCOUNT_DUPLICATE` | `email` mới trùng `email` hoặc `username` của Admin chưa `INACTIVE` khác (bước 7), `errors.email` |

- **Frontend** (mục 5.2): nút "Sửa" chỉ có ở dòng `status` `ACTIVE` hoặc `LOCKED`, `roleCode` khác `ROOT_ADMIN` và `id` khác `authAdmin.admin.id`. Bấm nút mở hộp `#adminEditModal` điền sẵn từ phần tử của danh sách: tên đăng nhập chỉ đọc (không phải ô nhập) và đúng 3 ô `fullName` (`maxlength="150"`, bắt buộc), `email` (`maxlength="150"`, bắt buộc), `phoneNumber` (`maxlength="30"`); dòng ghi chú: đổi email thì tài khoản đăng nhập bằng email mới từ lần sau, các phiên đang có không bị đăng xuất. Lưu: so giá trị đã cắt khoảng trắng với giá trị ban đầu, chỉ gửi các trường khác (`phoneNumber` rỗng gửi `null`); không có trường nào đổi thì toast thông tin "Không có thay đổi nào", đóng hộp, không gọi API. Gửi qua API client của cổng (`401` → refresh một lần rồi gửi lại); trong lúc gửi khóa các nút và không đóng hộp. `400`/`409 ACCOUNT_DUPLICATE`: hiện `errors[field]` dưới ô (khóa không có ô thì toast), giữ hộp mở. `200`: đóng hộp, toast thành công theo `message`, tải lại danh sách (giữ bộ lọc và trang; `fullName` đổi làm đổi thứ tự). `403`, `404`, `409 ACCOUNT_INACTIVE`: đóng hộp, toast cảnh báo theo `message`, tải lại danh sách; lỗi khác toast lỗi, giữ hộp mở. Mẫu: `mockUpdateAdmin`, `openEditAdmin`, `submitEditAdmin` trong `templates/admin/system-settings.js`.
- Index phục vụ: khóa chính `admins`, `admin_roles` (bước 1, 3, 4, 9); `uniq_admins_username`, `uniq_admins_email` (bước 7, chặn trùng ở mức CSDL). Không cần index mới.

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

Service chặn khóa/mở khóa, đặt lại mật khẩu, thu hồi phiên, ngừng hoạt động trên tài khoản mang vai trò `ROOT_ADMIN` (`403 ROOT_ADMIN_PROTECTED`), và chặn các thao tác đó cùng sửa thông tin (mục 3.8) trên chính mình (`403 SELF_ACTION_FORBIDDEN`). Chỉ ngừng hoạt động (mục 3.9) ghi thêm `audit_logs` `ADMIN / ACCESS_DENIED` khi chặn `ROOT_ADMIN`; các API còn lại không ghi (chỉ Root Admin gọi được, mục 3.4, 3.7).

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
- Template `system-settings.html` có khung mục `#section-admins` (dựng ở A14): bảng `.data-table` với cột họ tên/tên đăng nhập, email, vai trò, trạng thái, đăng nhập gần nhất và thao tác, dữ liệu mock đúng phần tử mục 3.2; thanh công cụ tìm kiếm `#adminsSearch` + lọc trạng thái `#adminsStatusFilter`, thanh phân trang `#adminsPagination` (A15, mục 3.2 Frontend); thao tác "Thu hồi phiên" (mục 3.7) với hộp xác nhận dùng chung `#confirmModal`; nút "Thêm quản trị viên" `#btnCreateAdmin` mở `#adminCreateModal`, thành công mở `#adminTempPasswordModal` (A16, mục 3.3 Frontend); nút "Khóa"/"Mở khóa" với `#confirmModal` (A17, mục 3.4 Frontend); nút "Sửa" mở `#adminEditModal` (A18, mục 3.8 Frontend); nút "Đặt lại mật khẩu" với `#confirmModal`, thành công mở `#adminTempPasswordModal` (A19, mục 3.6 Frontend). Các thao tác còn lại dựng tiếp khi rà từng endpoint.
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
10. **TC-ADM-10**: `SYSTEM_ADMIN` B đăng nhập trên 2 trình duyệt (phiên P1, P2) và có một phiên P0 đã hết hạn chưa thu hồi. Root Admin gọi `DELETE /api/v1/admin/admins/<B>/sessions`: `200` `{ "revokedCount": 2 }`; P1, P2 có `revoked_reason = 'REVOKED_BY_ADMIN'`, P0 giữ nguyên; một dòng `audit_logs` `AUTH / SESSION_REVOKED`, `resource_id` = id của B, `action_details = {"targetActorType":"ADMIN","revokedCount":2}`; refresh ở P1 trả `401` và xóa cookie (không thu hồi thêm, không ghi `TOKEN_REUSE_DETECTED`), Access Token còn hạn của P1 vẫn gọi được API tới khi hết hạn. Gọi lại lần hai: `200` `{ "revokedCount": 0 }`, không thêm dòng audit. B đăng nhập lại được. `:id` là chính Root Admin: `403 SELF_ACTION_FORBIDDEN`; là một Root Admin khác: `403 ROOT_ADMIN_PROTECTED`, không có dòng audit; id không tồn tại: `404 NOT_FOUND`; `:id` = `abc`, `0`, `4294967296`: `400` có `errors.id`; gửi `?x=1` hoặc body `{"x":1}`: `400`. `SYSTEM_ADMIN` gọi: `403 FORBIDDEN_PERMISSION`; token `PASSWORD_CHANGE_ONLY`: `403 PASSWORD_CHANGE_REQUIRED`. Ở mục `admins`, dòng của chính mình, dòng `ROOT_ADMIN`, dòng `LOCKED`/`INACTIVE` không có nút "Thu hồi phiên"; trong "Hoạt động gần đây" của Root Admin có dòng "Thu hồi mọi phiên của quản trị viên".

11. **TC-ADM-11**: Dữ liệu: Root Admin R1 (người gọi), Root Admin R2, `SYSTEM_ADMIN` "Nguyễn Văn Trực" `ACTIVE`, "Trần Thị Giám Sát" `LOCKED`, "Lê Văn Chuyển Công Tác" `INACTIVE`. R1 gọi `GET /api/v1/admin/admins`: `200`, 5 phần tử theo thứ tự R1/R2 (theo `full_name`), rồi `ACTIVE`, `LOCKED`, `INACTIVE`; mỗi phần tử đúng 12 trường mục 3.2 (không có `passwordHash`, `failedLoginCount`, `lockedUntil`, `mustChangePassword`); `pagination = { page: 1, limit: 10, total: 5, totalPages: 1, hasNext: false, hasPrev: false }`. `?status=LOCKED`: 1 phần tử. `?search=%20NGUYỄN%20VĂN%20` (cắt khoảng trắng, không phân biệt hoa thường): 1 phần tử "Nguyễn Văn Trực"; `?search=npc.com`: khớp theo `email`; `?search=%25` chỉ khớp bản ghi chứa ký tự `%` (không khớp mọi dòng); `?search=` (rỗng) như không lọc. `?limit=2&page=3`: `data` 1 phần tử, `totalPages = 3`, `hasNext = false`, `hasPrev = true`; `?page=9`: `200`, `data = []`, `total = 5`. `400` (có `errors` theo tên tham số): `page=0`, `page=abc`, `limit=0`, `limit=101`, `status=active`, `status=DELETED`, `status=ACTIVE&status=LOCKED`, `search` 101 ký tự, `sort=fullName`, `x=1`. `SYSTEM_ADMIN` gọi: `403 FORBIDDEN_PERMISSION`; token `PASSWORD_CHANGE_ONLY`: `403 PASSWORD_CHANGE_REQUIRED`; R1 bị khóa trong lúc Access Token còn hạn: `401 UNAUTHORIZED`. Không có dòng `audit_logs` mới. Giao diện: gõ "giám" → sau 300 ms một request `search=giám&page=1`; đổi trạng thái về trang 1; ở trang 2 mà danh sách chỉ còn 1 trang thì tự tải trang 1.

12. **TC-ADM-12**: Dữ liệu: Root Admin R1 (người gọi) `username = root.admin@evnict.vn`, `SYSTEM_ADMIN` `admin.npc` / `admin.npc@npc.com.vn` `ACTIVE`, `admin.old` / `admin.old@evnict.vn` `INACTIVE`. R1 gọi `POST /api/v1/admin/admins` với `{ "username": "  admin.hanoi ", "email": "admin.hanoi@evnhanoi.vn", "fullName": " Kỹ thuật viên Trực ban ", "phoneNumber": "" }`: `201`, header `Cache-Control: no-store`; `data` đúng 12 trường mục 3.2 (`username = "admin.hanoi"`, `fullName` đã cắt, `phoneNumber = null`, `status = ACTIVE`, `roleCode = SYSTEM_ADMIN`, `lastLoginAt = null`) và `temporaryPassword` 16 ký tự, có đủ chữ hoa, chữ thường, chữ số, ký tự đặc biệt, không có `I O l o i 0 1`. CSDL: một dòng `admins` (`must_change_password = 1`, `password_changed_at = NULL`, `created_by_admin_id` = R1, `password_hash` khớp `bcrypt.compare(temporaryPassword)`), một dòng `admin_roles` vai trò `SYSTEM_ADMIN`, một dòng `user_settings` (`ADMIN`, mặc định DDL), một dòng `audit_logs` `ADMIN / CREATE` (`resource_id` = id mới, `action_details = {"username":"admin.hanoi","email":"admin.hanoi@evnhanoi.vn","roleCode":"SYSTEM_ADMIN"}`, không chứa mật khẩu); log ứng dụng không chứa chuỗi mật khẩu. Đăng nhập bằng tài khoản mới: `mustChangePassword = true` (TC-ADM-06). `409 ACCOUNT_DUPLICATE`, không có dòng mới nào ở 4 bảng: `username = "ADMIN.NPC"` (`errors.username`); `email = "Admin.NPC@npc.com.vn"` (`errors.email`); `username = "admin.npc@npc.com.vn"` (trùng chéo email, `errors.username`); `email = "root.admin@evnict.vn"` (trùng `email` và chéo `username` của R1, `errors.email`); cả hai trùng: `errors` có cả hai khóa. `username = "admin.old"`, `email = "admin.old@evnict.vn"` (của tài khoản `INACTIVE`): `201`. Hai request tạo cùng `username` gửi đồng thời: một `201`, một `409` (không `500`). `400 VALIDATION_ERROR` (`errors` theo tên trường): thiếu `email`; `username` `ab`, `admin hanoi`, `quản.trị`, 101 ký tự; `email` `abc`, `a@b`, 151 ký tự; `fullName` `"   "`; `phoneNumber` `"abc"`; có `password`, `roleCode`, `status`; `?x=1`. `SYSTEM_ADMIN` gọi: `403 FORBIDDEN_PERMISSION`; token `PASSWORD_CHANGE_ONLY`: `403 PASSWORD_CHANGE_REQUIRED`. Giao diện: hộp Thêm chỉ có 4 ô; `409` hiện lỗi dưới ô, hộp không đóng; `201` mở hộp mật khẩu tạm có nút "Sao chép", đóng hộp thì mật khẩu không còn trong DOM và danh sách được tải lại có dòng mới.

13. **TC-ADM-13**: Dữ liệu: Root Admin R1 (người gọi), Root Admin R2, `SYSTEM_ADMIN` B `ACTIVE` có 2 phiên còn hạn và 1 phiên đã hết hạn chưa thu hồi, C `LOCKED`, D `INACTIVE`. R1 gọi `PUT /api/v1/admin/admins/<B>/status` `{ "status": "LOCKED" }`: `200` `data = { "id": <B>, "status": "LOCKED" }`; `admins.status = LOCKED`, 2 phiên còn hạn có `revoked_reason = 'ACCOUNT_LOCKED'`, phiên hết hạn giữ nguyên; một dòng `audit_logs` `ADMIN / LOCK` (`resource_id` = id B, `action_details = {"revokedCount":2}`); Access Token còn hạn của B gọi `GET /api/v1/admin/auth/me` trả `401`, refresh trả `401` và xóa cookie, đăng nhập trả `403 ACCOUNT_LOCKED`. Gọi lại cùng body: `200`, không thêm dòng audit. Mở khóa B `{ "status": "ACTIVE" }`: `200`, một dòng `ADMIN / UNLOCK` (`action_details = NULL`), `failed_login_count`/`locked_until` không đổi, B đăng nhập lại được, phiên cũ vẫn bị thu hồi. Mở khóa C: `200`. D (cả hai giá trị): `409 ACCOUNT_INACTIVE`. `:id` là R1: `403 SELF_ACTION_FORBIDDEN`; là R2 (cả hai giá trị): `403 ROOT_ADMIN_PROTECTED`, không có dòng audit; id không tồn tại: `404 NOT_FOUND`. `400 VALIDATION_ERROR`: `:id` = `abc`, `0`, `4294967296` (`errors.id`); body `{}`, `{ "status": "INACTIVE" }`, `{ "status": "locked" }`, `{ "status": 1 }`, `{ "status": "LOCKED", "x": 1 }`; `?x=1`. `SYSTEM_ADMIN` gọi: `403 FORBIDDEN_PERMISSION`; token `PASSWORD_CHANGE_ONLY`: `403 PASSWORD_CHANGE_REQUIRED`. Giao diện: dòng R1, R2, D không có nút Khóa/Mở khóa; B có "Khóa", C có "Mở khóa"; xác nhận Khóa → toast thành công, danh sách tải lại và B hiện "Đã khóa"; "Hoạt động gần đây" của R1 có "Khóa quản trị viên", "Mở khóa quản trị viên".

14. **TC-ADM-14**: Dữ liệu: Root Admin R1 (người gọi) `root.admin@evnict.vn`, Root Admin R2, `SYSTEM_ADMIN` B `admin.npc` / `admin.npc@npc.com.vn` `ACTIVE`, chưa có số điện thoại, có 1 phiên còn hạn, C `admin.cpc` / `admin.cpc@cpc.vn` `LOCKED`, D `admin.old` / `admin.old@evnict.vn` `INACTIVE`, E `admin.hanoi` / `admin.hanoi@evnhanoi.vn` `ACTIVE`. R1 gọi `PUT /api/v1/admin/admins/<B>` với `{ "email": "  admin.npc.moi@npc.com.vn ", "phoneNumber": "" }`: `200`, `data` đúng 12 trường mục 3.2 (`email` đã cắt, `phoneNumber = null`, `updatedAt` mới); một dòng `audit_logs` `ADMIN / UPDATE` (`resource_id` = id B, `action_details = {"changedFields":["email"]}`: `phoneNumber` rỗng = `NULL`, bằng giá trị hiện tại nên không tính); phiên của B vẫn còn hiệu lực; B đăng nhập bằng `admin.npc.moi@npc.com.vn` được, bằng `admin.npc@npc.com.vn` trả `401 INVALID_CREDENTIALS`. Gửi lại cùng body: `200` "Không có thay đổi nào", không thêm dòng audit, `updatedAt` không đổi. `{ "email": "Admin.Npc.Moi@npc.com.vn" }`: `200`, `changedFields = ["email"]` (chỉ đổi hoa/thường). Sửa `fullName` của C (`LOCKED`): `200`, `status` vẫn `LOCKED`. `409 ACCOUNT_DUPLICATE` có `errors.email`, không đổi dữ liệu, không audit: `email` = `admin.hanoi@evnhanoi.vn` (trùng email E), `ADMIN.HANOI@EVNHANOI.VN`, `root.admin@evnict.vn` (trùng `email` và chéo `username` của R1; `username` không có dạng email như `admin.hanoi` thì bị `400` định dạng trước khi xét trùng). `email` = `admin.old@evnict.vn` (của D `INACTIVE`): `200`. D: `409 ACCOUNT_INACTIVE`; `:id` là R1: `403 SELF_ACTION_FORBIDDEN`; R2: `403 ROOT_ADMIN_PROTECTED`, không có dòng audit; id không tồn tại: `404 NOT_FOUND`. `400 VALIDATION_ERROR`: `:id` = `abc`, `0`, `4294967296` (`errors.id`); body `{}`; `{ "fullName": "   " }`, `{ "fullName": null }`, `{ "email": "abc" }`, `{ "email": null }`, `email` 151 ký tự, `{ "phoneNumber": "abc" }`, `{ "username": "x.y" }`, `{ "status": "LOCKED" }`, `{ "roleCode": "ROOT_ADMIN" }`, `{ "avatarUrl": null }`; `?x=1`. `SYSTEM_ADMIN` gọi: `403 FORBIDDEN_PERMISSION`; token `PASSWORD_CHANGE_ONLY`: `403 PASSWORD_CHANGE_REQUIRED`. Hai request đổi `email` của B và E sang cùng một giá trị gửi đồng thời: một `200`, một `409` (không `500`). Giao diện: dòng R1, R2, D không có nút "Sửa"; hộp Sửa có tên đăng nhập chỉ đọc và đúng 3 ô; bấm Lưu khi không sửa gì thì không có request; `409` hiện lỗi dưới ô Email, hộp không đóng; `200` đóng hộp, danh sách tải lại hiện email mới; "Hoạt động gần đây" của R1 có "Cập nhật quản trị viên".

15. **TC-ADM-15**: Dữ liệu: Root Admin R1 (người gọi), Root Admin R2, `SYSTEM_ADMIN` B `ACTIVE` có 2 phiên còn hạn và 1 phiên đã hết hạn chưa thu hồi, đang khóa tạm (`failed_login_count = 3`, `locked_until` còn hiệu lực), C `LOCKED`, D `INACTIVE`. R1 gọi `PUT /api/v1/admin/admins/<B>/reset-password` (không body): `200`, header `Cache-Control: no-store`, `data` đúng 2 trường `{ id, temporaryPassword }` (16 ký tự, đủ 4 nhóm, không có `I O l o i 0 1`). CSDL: `password_hash` khớp `bcrypt.compare(temporaryPassword)`, `must_change_password = 1`, `failed_login_count = 0`, `locked_until = NULL`, `password_changed_at` không đổi, `status` vẫn `ACTIVE`; 2 phiên còn hạn có `revoked_reason = 'PASSWORD_CHANGED'`, phiên hết hạn giữ nguyên; một dòng `audit_logs` `AUTH / PASSWORD_RESET` (`resource_id` = id B, `action_details = {"targetActorType":"ADMIN","revokedCount":2}`, không chứa mật khẩu); log ứng dụng không chứa chuỗi mật khẩu. Access Token đầy đủ còn hạn của B gọi `GET /api/v1/admin/auth/me` trả `401`, refresh trả `401` và xóa cookie; đăng nhập bằng mật khẩu cũ `401 INVALID_CREDENTIALS`, bằng mật khẩu tạm `200` `mustChangePassword = true` (không `423`). Gọi lại lần hai: `200` mật khẩu mới khác lần trước, một dòng audit mới `revokedCount = 0`. C: `200`, `status` vẫn `LOCKED`, đăng nhập trả `403 ACCOUNT_LOCKED`. D: `409 ACCOUNT_INACTIVE`; `:id` là R1: `403 SELF_ACTION_FORBIDDEN`; R2: `403 ROOT_ADMIN_PROTECTED`, không có dòng audit; id không tồn tại: `404 NOT_FOUND`. `400 VALIDATION_ERROR`: `:id` = `abc`, `0`, `4294967296` (`errors.id`); body `{"password":"x"}`; `?x=1`. `SYSTEM_ADMIN` gọi: `403 FORBIDDEN_PERMISSION`; token `PASSWORD_CHANGE_ONLY`: `403 PASSWORD_CHANGE_REQUIRED`. Giao diện: dòng R1, R2, D không có nút "Đặt lại mật khẩu"; xác nhận → hộp mật khẩu tạm "Đã đặt lại mật khẩu" có họ tên, tên đăng nhập của B và nút "Sao chép", đóng hộp thì mật khẩu không còn trong DOM; "Hoạt động gần đây" của R1 có "Đặt lại mật khẩu".
