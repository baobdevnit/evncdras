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

- **Request Body**:

```json
{
  "username": "cdr.evnit@evn.com.vn",
  "password": "Password123@",
  "rememberMe": true
}
```

- **Validation**:
  - Trường `username` nhận **username hoặc email**: tìm theo `username_active`, nếu không thấy thì theo `email_active` (chỉ tài khoản chưa `INACTIVE`). Không thấy thì trả `401 INVALID_CREDENTIALS` và ghi `LOGIN_FAILED` (`reason = UNKNOWN_USER`); sai mật khẩu cũng trả đúng mã và thông điệp này (`docs/02_api_contracts.md` mục 2.3).
  - Kiểm tra `status == 'ACTIVE'`. Nếu `LOCKED`, trả về `403` với `errorCode = "ACCOUNT_LOCKED"` ("Tài khoản đã bị khóa") (tài khoản `INACTIVE` không tìm thấy qua `username_active` nên trả `401 INVALID_CREDENTIALS`). Nhóm của user có `status = 'INACTIVE'` trả `403` với `errorCode = "GROUP_INACTIVE"` (`docs/02_api_contracts.md` mục 2.3).
  - Nếu `locked_until > NOW()` (khóa tạm do sai mật khẩu), trả về `423` với body `{ "success": false, "statusCode": 423, "errorCode": "ACCOUNT_TEMPORARILY_LOCKED", "message": "...", "errors": { "lockedUntil": "2026-10-26T09:45:00+07:00" }, "timestamp": "..." }` (khung lỗi `docs/02_api_contracts.md` mục 2.3).
  - Sai mật khẩu: tăng `failed_login_count` bằng một câu `UPDATE` nguyên tử; đạt `security_login_max_failed` (mặc định 5) thì `locked_until = NOW() + security_lockout_minutes` (mặc định 15 phút) và đặt lại `failed_login_count = 0` trong cùng câu lệnh (câu SQL tại `docs/01_database_schema.md` mục 6.1). Đúng: đặt `failed_login_count = 0`.
- **`rememberMe`**: `false` thì cookie Refresh Token không đặt `Max-Age` (mất khi đóng trình duyệt); hạn phiên phía server vẫn là 7 ngày.
- **Token**: Access Token 15 phút (ký `JWT_USER_SECRET`, mang `sub`, `userGroupId`, `roleCode` đọc từ `user_roles` lúc cấp, `sid` = id dòng `auth_sessions` vừa tạo), Refresh Token 7 ngày lưu dạng băm trong `auth_sessions` (`remember_me` = `rememberMe`, `logged_in_at = NOW()`) và gửi qua cookie `HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth`, không nằm trong body. Nếu `must_change_password = 1` hoặc mật khẩu quá 90 ngày: chỉ cấp Access Token `scope: "PASSWORD_CHANGE_ONLY"` (không có Refresh Token), `mustChangePassword: true`. Chính sách đầy đủ tại `docs/01_database_schema.md` mục 6.1.
- **Response**:

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
      "username": "cdr.evnit@evn.com.vn",
      "fullName": "Trần Thị B",
      "email": "tran.b@71portal.vn",
      "avatarUrl": "/media/avatars/8a1d2c3e-5b6f-4a7d-9e0f-1b2c3d4e5f60.jpg",
      "userGroup": {
        "id": 1,
        "name": "Khối Công nghệ Thông tin",
        "organizationId": 2,
        "organizationName": "Khối CNTT",
        "allowRecordingAccess": true
      },
      "roleCode": "GROUP_ADMIN",
      "roleName": "Quản trị viên nhóm",
      "permissions": ["cdr:view", "cdr:listen_audio", "cdr:download_audio", "user:view", "user:create", "user:edit", "group:manage_admin", "group:toggle_recording"]
    }
  }
}
```

### 3.2. Lấy thông tin cá nhân hiện tại (`GET /api/v1/auth/me`)

- **Headers**: `Authorization: Bearer <accessToken>`
- Trả về payload tương tự đối tượng `user` khi login để Vue Frontend khôi phục Auth State khi reload trang.
- `permissions` là quyền hiệu lực: quyền của vai trò, bỏ `cdr:listen_audio`/`cdr:download_audio` khi nhóm có `allowRecordingAccess = false` (`docs/modules/10_permissions_and_roles.md` mục 2.3).

### 3.2.1. Làm mới phiên và Đăng xuất (`POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`)

- **`POST /auth/refresh`** (đặc tả chung cho cả hai cổng; bản Admin `POST /api/v1/admin/auth/refresh` khác ở các điểm ghi tại `docs/modules/04_auth_admin.md` mục 3.5):
  - **Guard**: public (không cần Access Token). Không có body; gửi body có trường thì `400 VALIDATION_ERROR`. Đọc Refresh Token từ cookie (`Path=/api/v1/auth`).
  - **Xử lý** (một transaction, theo thứ tự; chính sách `docs/01_database_schema.md` mục 6.1):
    1. Không có cookie: `401`.
    2. `SELECT ... FOR UPDATE` phiên theo `refresh_token_hash` = SHA-256 của cookie và `actor_type` của cổng (`USER`). Không thấy: `401`.
    3. Phiên đã thu hồi:
       - `ROTATED` và `revoked_at` cách hiện tại ≤ 30 giây: đi theo `replaced_by_session_id` (tối đa 5 bước) tới phiên đang hiệu lực. Có thì kiểm tra tài khoản (bước 5) rồi chỉ cấp Access Token mới (`sid` = id phiên đích), **không** `Set-Cookie`, không ghi CSDL. Không có thì `401` (không coi là dùng lại).
       - `ROTATED` quá 30 giây (dùng lại token): thu hồi mọi phiên còn hiệu lực của tài khoản (`REUSE_DETECTED`), ghi `audit_logs` `AUTH / TOKEN_REUSE_DETECTED` (`actor_type`, `actor_id` = chủ phiên, `ip_address`, `user_agent` của request, `action_details = { "revokedCount": n }`), **commit** rồi trả `401`.
       - Lý do thu hồi khác: `401`.
    4. `expires_at <= NOW()`: `401`.
    5. Tài khoản `status` khác `ACTIVE` hoặc nhóm `INACTIVE`: `401` (bình thường phiên đã bị thu hồi khi khóa/ngừng hoạt động). Không xét `locked_until`, `must_change_password`, tuổi mật khẩu.
    6. Xoay vòng: tạo phiên mới (`refresh_token_hash` của Refresh Token mới, `ip_address`/`user_agent` của request, `last_used_at = NOW()`, chép `actor_type`, `actor_id`, `remember_me`, `logged_in_at`, `expires_at` của phiên cũ); phiên cũ `revoked_at = NOW()`, `revoked_reason = 'ROTATED'`, `replaced_by_session_id` = id phiên mới. Ký Access Token mới với `roleCode` (và `userGroupId`) đọc lại từ CSDL lúc cấp, `sid` = id phiên mới.
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
  - **Lỗi**: `400 VALIDATION_ERROR` (body có trường); mọi nhánh còn lại `401 UNAUTHORIZED`, cùng thông điệp, và luôn kèm `Set-Cookie` xóa cookie (cùng `Path`, `Max-Age=0`). Refresh thành công không ghi `audit_logs`; chỉ nhánh dùng lại token ghi `TOKEN_REUSE_DETECTED`.
- **`POST /auth/logout`** (đặc tả chung cho cả hai cổng; bản Admin `POST /api/v1/admin/auth/logout` khác ở các điểm ghi tại `docs/modules/04_auth_admin.md` mục 3.5):
  - **Guard**: `UserAuthGuard`, nhận cả token `PASSWORD_CHANGE_ONLY`; không cần mã quyền. Không có body; gửi body có trường thì `400 VALIDATION_ERROR`. Đọc Refresh Token từ cookie (`Path=/api/v1/auth`, cookie được gửi kèm vì `/api/v1/auth/logout` nằm trong `Path`).
  - **Xử lý** (một transaction):
    1. Không có cookie (kể cả khi gọi bằng token `PASSWORD_CHANGE_ONLY`, vốn không có Refresh Token): bỏ qua bước 2–3.
    2. `SELECT ... FOR UPDATE` phiên theo `refresh_token_hash` = SHA-256 của cookie, `actor_type` của cổng (`USER`) **và** `actor_id` = `sub` của Access Token. Không thấy (kể cả cookie thuộc tài khoản khác): không thu hồi gì.
    3. Phiên `ROTATED` (tab khác vừa xoay vòng): đi theo chuỗi `replaced_by_session_id` (tối đa 5 bước, không xét khoảng ân hạn 30 giây, không coi là dùng lại token) tới phiên đang hiệu lực, như `DELETE /auth/sessions/:id` (`docs/01_database_schema.md` mục 6.1). Phiên đích còn hiệu lực (`revoked_at IS NULL AND expires_at > NOW()`): `revoked_at = NOW()`, `revoked_reason = 'LOGOUT'`, ghi `audit_logs` `AUTH / LOGOUT` (`actor_type`, `actor_id` = người gọi, `resource_id` = id phiên bị thu hồi, `ip_address`, `user_agent` của request). Phiên đích đã thu hồi vì lý do khác hoặc đã hết hạn: không ghi gì.
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

  - **Lỗi**: `400 VALIDATION_ERROR` (body có trường); `401 UNAUTHORIZED` (Access Token thiếu, sai hoặc hết hạn, do guard trả, không xóa cookie). Không có `403`/`404`/`409`: không có cookie, phiên đã thu hồi hay phiên không thuộc người gọi đều trả `200` (idempotent).
  - **Frontend**: gọi qua API client của cổng, nên Access Token hết hạn thì client refresh một lần rồi gửi lại logout (`docs/00_overview_and_architecture.md` mục 5.3.2). Sau khi gọi, **dù thành công hay lỗi** (mạng, `401`), frontend xóa Access Token và thông tin tài khoản khỏi store, ngắt Socket.IO của cổng rồi chuyển về trang đăng nhập của cổng. Access Token cũ (và token đang giữ ở tab khác) hết hiệu lực tự nhiên sau tối đa `security_access_token_minutes` (15) phút; tab khác bị đưa về đăng nhập ở lần refresh kế tiếp. Đăng xuất một cổng không ảnh hưởng phiên của cổng kia.
  - Index phục vụ: `uniq_session_token` (tìm phiên theo `refresh_token_hash`), khóa chính (đi theo `replaced_by_session_id`).

### 3.3. Danh sách người dùng (`GET /api/v1/users`)

- **Scoped Query**:
  - Nếu là System Admin: Xem được user của mọi đơn vị.
  - Nếu là Group Admin: Chỉ xem được user có `user_group_id` bằng nhóm của mình.
- **Query Params**: `page=1`, `limit=10`, `search=nguyen`, `status=ACTIVE`, `groupId=1` (chỉ bản Admin; bản User gửi thì `400` theo `docs/02_api_contracts.md` mục 1.1)

### 3.3.1. Chi tiết người dùng (`GET /api/v1/users/:id`)

- **Response**: `data = { id, userGroupId, userGroupCode, userGroupName, username, email, fullName, jobTitle, phoneNumber, avatarUrl, status, roleCode, roleName, isRepresentative, mustChangePassword, lockedUntil, lastLoginAt, createdAt, updatedAt }`. `isRepresentative` = tài khoản là `user_groups.representative_user_id` của nhóm. `lockedUntil` chỉ khác `null` khi đang bị khóa tạm do sai mật khẩu. Không trả `password_hash`, `failed_login_count` hay thông tin phiên.
- Phần tử của `GET /users` (mục 3.3) có cùng các trường, trừ `mustChangePassword`, `lockedUntil`.
- **Phạm vi**: bản User chỉ xem người dùng trong nhóm của người gọi; người nhóm khác trả `403 FORBIDDEN_SCOPE_ACCESS`. Tài khoản `INACTIVE` vẫn xem được. `:id` không tồn tại trả `404`.

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
- Trong một transaction: sinh mật khẩu tạm 16 ký tự đạt chính sách (`docs/01_database_schema.md` mục 6.1), lưu bản băm, đặt `must_change_password = 1`; thu hồi mọi phiên (`PASSWORD_CHANGED`); ghi `audit_logs` `AUTH / PASSWORD_RESET` (`resource_id` = id người dùng, `action_details = { "targetActorType": "USER" }`). Tài khoản `LOCKED` vẫn đặt lại được, trạng thái giữ `LOCKED`.
- **Response** `200`: `data = { "id": 25, "temporaryPassword": "<16 ký tự>" }`, trả **một lần**, giống `docs/modules/04_auth_admin.md` mục 3.6.

### 3.9. Ngừng hoạt động người dùng (`DELETE /api/v1/users/:id`)

- Khóa dòng nhóm và kiểm tra như mục 3.7 (bước 1, 2; bước 3 áp cho mọi `GROUP_ADMIN` `ACTIVE` cuối cùng: `409 LAST_GROUP_ADMIN`).
- Trong một transaction: `status = 'INACTIVE'`; thu hồi mọi phiên (`ACCOUNT_LOCKED`); nếu là `representative_user_id` của nhóm thì đặt `NULL`; giữ dòng `user_roles` (`docs/01_database_schema.md` mục 14); ghi `audit_logs` `USER / DEACTIVATE`.
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

- Form nhận username hoặc email, mật khẩu, `rememberMe`; gọi `POST /api/v1/auth/login`, lưu Access Token vào `authUser` store (không lưu trình duyệt).
- `mustChangePassword: true` → chuyển sang `member.change-password`; `423` → hiển thị thời điểm mở khóa (`errors.lockedUntil`); `503 MAINTENANCE` → thông báo bảo trì.
- Liên kết "Dành cho Quản trị viên hệ thống" là `<RouterLink :to="{ name: 'admin.login' }">` (cùng router, chuyển cổng không mất phiên, `docs/00_overview_and_architecture.md` mục 5.3.2). Hộp "tài khoản mẫu" trong template không triển khai.

### 5.1. Khu vực Admin – `UserListView.vue`: Bố cục Split-View (Theo `templates/admin/users.html`)

- **Bên trái (`.group-sidebar`)**:
  - Danh sách nhóm người dùng (`.group-list`, `.group-item`).
  - Hỗ trợ tìm kiếm nhóm nhanh (`#groupSearchInput`).
  - Chọn nhóm người dùng để lọc tức thời danh sách user bên phải, hiển thị badge đếm số lượng người dùng trực thuộc và thông tin Quản trị viên nhóm.
- **Bên phải (`.user-content`)**:
  - Thanh tìm kiếm người dùng theo từ khóa (họ tên, email, tên đăng nhập), bộ lọc theo vai trò (Quản trị viên nhóm / Thành viên nghe ghi âm / Thành viên).
  - Bảng người dùng:
    - Cột Người dùng: Avatar tròn, Họ tên, Username, Email.
    - Cột Nhóm người dùng: Tên nhóm, Mã nhóm (`UMO-IT-01`,...).
    - Cột Vai trò trong nhóm: Huy hiệu theo `roleCode` (`<span class="badge-role admin">★ Quản trị viên nhóm</span>`, Thành viên nghe ghi âm, Thành viên), kèm chức danh chuyên môn.
    - Cột Ngày tham gia.
    - Cột Trạng thái theo `users.status` (`<span class="badge-status active">Hoạt động</span>` = `ACTIVE`, `<span class="badge-status locked">Khóa</span>` = `LOCKED`, `<span class="badge-status inactive">Ngừng hoạt động</span>` = `INACTIVE`, chỉ hiện khi bật bộ lọc "Đã ngừng hoạt động").
    - Cột Hành động: Sửa thông tin, Xóa tài khoản.
- Modal tạo mới / sửa người dùng (`#userModal`): Form nhập thông tin người dùng và chọn Nhóm người dùng (`user_group_id`), chọn vai trò (`roleCode`: Quản trị viên nhóm / Thành viên nghe ghi âm / Thành viên) khi tạo mới; khi sửa, đổi vai trò gọi `PUT /users/:id/role`. Không phụ thuộc hay tham chiếu trực tiếp đến tổ chức.

### 5.2. Khu vực Admin – Pinia Store (`useUserStore`)

- State: `users: UserItem[]`, `total: number`, `selectedGroupId: number | null` (null = mọi nhóm, chỉ Admin), `loading: boolean`.
- Actions: `fetchUsers()`, `createUser()`, `updateUser()`, `changeRole()`, `toggleStatus()`, `resetPassword()`.

---

## 6. Kịch bản kiểm thử (Test Plan for Agent)

1. **TC-USR-01**: Đăng nhập bằng tài khoản user hợp lệ, kiểm tra nhận về Access Token (chỉ giữ trong Pinia, không có trong `localStorage`) và cookie Refresh Token `HttpOnly`; có 1 dòng mới trong `auth_sessions`.
2. **TC-USR-02**: Đăng nhập sai mật khẩu 5 lần liên tiếp, kiểm tra lần thứ 6 (kể cả đúng mật khẩu) trả về `423 ACCOUNT_TEMPORARILY_LOCKED` kèm `errors.lockedUntil`; sau 15 phút đăng nhập đúng được và `failed_login_count` về 0.
   - **TC-USR-02b**: Dùng lại một Refresh Token đã được xoay vòng, kiểm tra mọi phiên của tài khoản bị thu hồi (`revoked_reason = 'REUSE_DETECTED'`).
   - **TC-USR-02c**: Gửi đồng thời 2 request `refresh` cùng một Refresh Token (giả lập 2 tab), kiểm tra cả hai nhận Access Token, chỉ request đầu có `Set-Cookie`, không phiên nào bị `REUSE_DETECTED`. Dùng lại token đó sau 30 giây thì mọi phiên bị thu hồi.
3. **TC-USR-03**: Gọi `PUT /users/:id/role` đổi Quản trị viên nhóm duy nhất trong nhóm sang `REGULAR_USER`, kiểm tra hệ thống chặn `409` với cảnh báo thích hợp và `user_roles` không đổi.
4. **TC-USR-04**: Group Admin tạo người dùng mới trong nhóm của mình, xác nhận có dòng `user_roles` với vai trò `REGULAR_USER` và người dùng mới tạo có thể đăng nhập bình thường.
