# QUY CHUẨN API & DANH SÁCH ENDPOINTS TOÀN CỤC (API CONTRACTS)

## Dự án: EVN CDR Analysis System (EVN CDR AS)

## Chuẩn thiết kế: RESTful API & WebSocket Gateway | NestJS v10+

---

## 1. Nguyên tắc thiết kế chung

### 1.1. Tiêu chuẩn đường dẫn (URL Conventions)

- **Base URL**: `https://cdr-pabx.evn.com.vn/api/v1`
- **Gọi API từ frontend**: Admin App và Member App chạy cùng domain với API (`docs/00_overview_and_architecture.md` mục 5.3) nên gọi bằng đường dẫn tương đối (`/api/v1/admin` cho Admin App, `/api/v1` cho Member App), không cần cấu hình CORS ở production.
- **Phân tách Portal** (tách tuyến tuyệt đối, **không có guard dùng chung**):
  - Admin Portal: **mọi** API Admin gọi đều nằm dưới `/api/v1/admin/*`, chỉ `AdminAuthGuard` (secret `JWT_ADMIN_SECRET`).
  - User Portal: `/api/v1/*` (không có tiền tố `/admin`), chỉ `UserAuthGuard` (secret `JWT_USER_SECRET`).
  - Token User gọi `/api/v1/admin/*` và token Admin gọi route User đều bị `401`.
- **Cột "Portal" trong các bảng mục 3**:
  - `ADMIN`: chỉ có bản `/api/v1/admin/...` như ghi trong bảng.
  - `USER + ADMIN`: có **hai route cùng hành vi**. Route User là đường dẫn ghi trong bảng, ví dụ `GET /api/v1/cdr`. Route Admin là bản sao có tiền tố, ví dụ `GET /api/v1/admin/cdr`.
    - Bản User luôn tự áp cô lập nhóm (`group_id = nhóm của người dùng`).
    - Bản Admin có phạm vi toàn hệ thống và nhận thêm tham số riêng của Admin (`groupId`, `callType`, `includeArchive`…).
    - Hai bản dùng **chung service và DTO**, chỉ khác controller và guard. Response giống hệt nhau.
  - `USER`: chỉ có bản User (`/api/v1/auth/*`, `/api/v1/profile/*`).
- Tài liệu module ghi đường dẫn bản User cho các route `USER + ADMIN`; bản Admin suy ra theo quy tắc trên.
- **Kỳ thời gian (`period`) dùng chung** cho mọi API thống kê (dashboard, QoS, lưu lượng, báo cáo), tính theo giờ Việt Nam:

  | `period` | Khoảng ngày |
  |---|---|
  | `today` | hôm nay (đọc `stats_hourly`) |
  | `yesterday` | hôm qua |
  | `last_7_days` | 7 ngày gần nhất, tính cả hôm nay |
  | `this_week` | tuần ISO hiện tại: từ thứ Hai đến hôm nay |
  | `this_month` | tháng lịch hiện tại: từ ngày 1 đến hôm nay |
  | `last_month` | trọn tháng lịch trước |
  | `custom` | `fromDate`..`toDate` (`YYYY-MM-DD`, bắt buộc, tối đa 366 ngày) |

  Kỳ khác `today` đọc `stats_daily`. Không dùng tên tham số nào khác (`dateRange`, `month`, `week`…).
- Định dạng dữ liệu trao đổi: `application/json; charset=utf-8` (Trừ audio streaming sử dụng `audio/wav` và file export sử dụng `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `application/pdf`).

### 1.2. Tiêu chuẩn xác thực (Authentication Headers)

Mọi request (ngoại trừ các endpoint public như Login) đều phải mang theo Bearer Token:

```http
Authorization: Bearer <access_token>
```

- Admin Access Token được ký bằng `JWT_ADMIN_SECRET`, kiểm tra bởi `AdminAuthGuard`.
- User Access Token được ký bằng `JWT_USER_SECRET`, kiểm tra bởi `UserAuthGuard`.
- Access Token sống 15 phút, chỉ giữ trong bộ nhớ frontend; Refresh Token 7 ngày đi qua cookie `HttpOnly; Secure; SameSite=Strict` và được xoay vòng mỗi lần refresh. Phiên lưu ở bảng `auth_sessions`. Chính sách đầy đủ tại `docs/01_database_schema.md` mục 6.1.

---

## 2. Chuẩn định dạng phản hồi (Response Envelope Format)

- **Tên trường**: mọi trường JSON (request body, response, query param, DTO) dùng **camelCase**, ví dụ `callerId`, `callStatus`, `answeredDurationSec`, `userGroupId`. Cột `snake_case` của bảng ứng dụng đổi sang camelCase theo quy tắc thông thường (`is_primary_leg` → `isPrimaryLeg`). Chỉ có **hai ngoại lệ**: (1) object `raw` của `GET /cdr/:id` giữ **nguyên tên 87 cột PABX** (`RTP_Caller_G107MOS`, `_100_Delay`…); (2) khóa của map cài đặt hệ thống là chính `setting_key` (`analysis_internal_extension_pattern`…).
- **Định dạng thời gian**: mọi trường thời gian trong response là ISO 8601 có offset `+07:00` (vd. `2025-06-11T08:02:37+07:00`). Tham số thời gian gửi lên (`fromDate`, `toDate`…) dùng ISO 8601; không có offset thì hiểu là giờ Việt Nam. Ngày thuần (`stat_date`, `month`) dùng `YYYY-MM-DD` / `YYYY-MM` theo giờ Việt Nam.

### 2.1. Phản hồi thành công đơn bản ghi (Single Item Success)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Thực hiện thành công",
  "data": {
    "id": 1,
    "code": "TC-71",
    "name": "Tổng công ty 71"
  },
  "timestamp": "2026-10-12T09:45:00+07:00"
}
```

### 2.2. Phản hồi phân trang danh sách (Paginated List Success)

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy danh sách thành công",
  "data": [
    { "id": "00000000000000005370", "callerId": "45678", "calledId": "46001", "callStatus": "ANSWERED", "answeredDurationSec": 135 }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1245,
    "totalPages": 125,
    "hasNext": true,
    "hasPrev": false
  },
  "timestamp": "2026-10-12T09:45:00+07:00"
}
```

### 2.3. Phản hồi lỗi chuẩn (Error Response)

```json
{
  "success": false,
  "statusCode": 403,
  "errorCode": "FORBIDDEN_SCOPE_ACCESS",
  "message": "Bạn không có quyền truy cập dữ liệu cuộc gọi ngoài dải số đơn vị quản lý",
  "errors": null,
  "timestamp": "2026-10-12T09:45:00+07:00"
}
```

---

## 3. Danh mục API Endpoints toàn hệ thống

### 3.1. Phân hệ Xác thực & Hồ sơ Quản trị viên (Admin Auth & Profile)

Toàn bộ endpoint của mục này thuộc portal **ADMIN**.

| Method | Endpoint | Quyền / Guard | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/admin/auth/login` | Public | Đăng nhập tài khoản Quản trị viên hệ thống |
| `POST` | `/api/v1/admin/auth/refresh` | Public (cookie Refresh Token) | Xoay vòng Refresh Token và cấp Access Token mới (chính sách `docs/01_database_schema.md` mục 6.1) |
| `POST` | `/api/v1/admin/auth/logout` | `AdminAuthGuard` | Đăng xuất: thu hồi phiên hiện tại trong `auth_sessions` (`LOGOUT`), xóa cookie |
| `GET` | `/api/v1/admin/auth/me` | `AdminAuthGuard` | Lấy thông tin tài khoản Admin đang đăng nhập |
| `GET` | `/api/v1/admin/profile` | `AdminAuthGuard` | Xem chi tiết hồ sơ Admin |
| `PUT` | `/api/v1/admin/profile` | `AdminAuthGuard` | Cập nhật họ tên, điện thoại, avatar của Admin |
| `PUT` | `/api/v1/admin/profile/change-password` | `AdminAuthGuard` (nhận cả token `PASSWORD_CHANGE_ONLY`) | Đổi mật khẩu Admin; cập nhật `password_changed_at`, `must_change_password = 0`, thu hồi các phiên khác |
| `POST` | `/api/v1/admin/profile/avatar` | `AdminAuthGuard` | Tải ảnh đại diện (multipart, tối đa 2 MB, `image/png`/`image/jpeg`), trả `avatarUrl` |
| `GET` | `/api/v1/admin/profile/preferences` | `AdminAuthGuard` | Lấy thiết lập giao diện của Admin (`user_settings`, `user_type = ADMIN`) |
| `PUT` | `/api/v1/admin/profile/preferences` | `AdminAuthGuard` | Cập nhật thiết lập giao diện của Admin |
| `GET` | `/api/v1/admin/profile/recent-activity` | `AdminAuthGuard` | 20 hành động gần nhất của chính Admin trong `audit_logs` |
| `GET` | `/api/v1/admin/auth/sessions` | `AdminAuthGuard` | Danh sách phiên đăng nhập đang hoạt động của chính Admin (IP, thiết bị, lần dùng cuối) |
| `DELETE` | `/api/v1/admin/auth/sessions/:id` | `AdminAuthGuard` | Thu hồi một phiên của chính mình (`REVOKED_BY_SELF`) |
| `DELETE` | `/api/v1/admin/admins/:id/sessions` | `admin:manage` | Thu hồi mọi phiên của một Admin khác (`REVOKED_BY_ADMIN`) |
| `GET` | `/api/v1/admin/admins` | `admin:manage` | Danh sách các quản trị viên hệ thống, kèm `roleCode` |
| `POST` | `/api/v1/admin/admins` | `admin:manage` | Tạo mới quản trị viên; luôn gán vai trò `SYSTEM_ADMIN` vào `admin_roles` (chỉ vai trò `ROOT_ADMIN` có `admin:manage`) |
| `PUT` | `/api/v1/admin/admins/:id/status` | `admin:manage` | Khóa / Kích hoạt tài khoản Admin |
| `PUT` | `/api/v1/admin/admins/:id` | `admin:manage` | Sửa họ tên, email, số điện thoại của Admin khác (không đổi vai trò; không có API đổi vai trò Admin) |
| `PUT` | `/api/v1/admin/admins/:id/reset-password` | `admin:manage` | Đặt lại mật khẩu Admin khác: `must_change_password = 1`, thu hồi mọi phiên, trả mật khẩu tạm một lần |
| `GET` | `/api/v1/admin/audit-logs` | `audit:view` | Tra cứu `audit_logs` (lọc `actorType`, `actorId`, `action`, `resourceName`, `fromDate`/`toDate` bắt buộc, phân trang) |
| `DELETE` | `/api/v1/admin/admins/:id` | `admin:manage` | Ngừng hoạt động tài khoản Admin (xóa mềm `status = INACTIVE`; chặn tài khoản mang vai trò `ROOT_ADMIN` và tự xóa chính mình) |

### 3.2. Phân hệ Xác thực & Hồ sơ Người dùng đơn vị (User Auth & Profile)

Toàn bộ endpoint của mục này thuộc portal **USER**.

| Method | Endpoint | Quyền / Guard | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Public | Đăng nhập tài khoản Người dùng đơn vị EVN |
| `POST` | `/api/v1/auth/refresh` | Public (cookie Refresh Token) | Xoay vòng Refresh Token và cấp Access Token mới |
| `POST` | `/api/v1/auth/logout` | `UserAuthGuard` | Đăng xuất: thu hồi phiên hiện tại (`LOGOUT`), xóa cookie |
| `GET` | `/api/v1/auth/me` | `UserAuthGuard` | Lấy thông tin User, nhóm, `roleCode` và `permissions` hiệu lực (quyền vai trò sau khi áp quyền nhóm, `docs/modules/10_permissions_and_roles.md` mục 2.3) |
| `GET` | `/api/v1/profile` | `UserAuthGuard` | Xem chi tiết thông tin cá nhân |
| `PUT` | `/api/v1/profile` | `UserAuthGuard` | Cập nhật thông tin cá nhân |
| `PUT` | `/api/v1/profile/change-password` | `UserAuthGuard` (nhận cả token `PASSWORD_CHANGE_ONLY`) | Đổi mật khẩu cá nhân; cập nhật `password_changed_at`, `must_change_password = 0`, thu hồi các phiên khác |
| `POST` | `/api/v1/profile/avatar` | `UserAuthGuard` | Tải ảnh đại diện (multipart, tối đa 2 MB, `image/png`/`image/jpeg`), trả `avatarUrl` |
| `GET` | `/api/v1/auth/sessions` | `UserAuthGuard` | Danh sách phiên đăng nhập đang hoạt động của chính User |
| `DELETE` | `/api/v1/auth/sessions/:id` | `UserAuthGuard` | Thu hồi một phiên của chính mình (`REVOKED_BY_SELF`) |
| `GET` | `/api/v1/profile/preferences` | `UserAuthGuard` | Lấy thiết lập giao diện (theme, items_per_page) |
| `PUT` | `/api/v1/profile/preferences` | `UserAuthGuard` | Cập nhật thiết lập giao diện người dùng |

### 3.3. Phân hệ Cây tổ chức EVN (Organizations)

| Method | Endpoint | Quyền / Guard | Mô tả | Portal |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/organizations/tree` | `org:view` | Lấy toàn bộ cây phân cấp tổ chức EVN | USER + ADMIN |
| `GET` | `/api/v1/organizations` | `org:view` | Lấy danh sách tổ chức phẳng (hỗ trợ filter, pagination) | USER + ADMIN |
| `GET` | `/api/v1/organizations/:id` | `org:view` | Xem chi tiết 1 đơn vị tổ chức | USER + ADMIN |
| `POST` | `/api/v1/admin/organizations` | `org:manage` | Thêm mới đơn vị / phòng ban trực thuộc | ADMIN |
| `PUT` | `/api/v1/admin/organizations/:id` | `org:manage` | Sửa thông tin đơn vị tổ chức | ADMIN |
| `DELETE` | `/api/v1/admin/organizations/:id` | `org:manage` | Xóa cứng đơn vị (`409` nếu còn đơn vị con hoặc còn nhóm người dùng tham chiếu) | ADMIN |

### 3.4. Phân hệ Nhóm người dùng (User Groups - Tổ chức QLND)

| Method | Endpoint | Quyền / Guard | Mô tả | Portal |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/user-groups` | `user_group:view` | Danh sách các nhóm QLND (kèm số lượng users) | USER + ADMIN |
| `GET` | `/api/v1/user-groups/tree` | `user_group:view` | Cấu trúc cây nhóm QLND theo tổ chức | USER + ADMIN |
| `GET` | `/api/v1/user-groups/:id` | `user_group:view` | Xem chi tiết nhóm QLND và người đại diện | USER + ADMIN |
| `POST` | `/api/v1/admin/user-groups` | `user_group:manage` | Thiết lập nhóm QLND mới gắn vào nút tổ chức (kèm `allowRecordingAccess`) | ADMIN |
| `PUT` | `/api/v1/admin/user-groups/:id` | `user_group:manage` | Cập nhật thông tin nhóm QLND (kèm quyền bật/tắt ghi âm nhóm `allowRecordingAccess`) | ADMIN |
| `DELETE` | `/api/v1/admin/user-groups/:id` | `user_group:manage` | Ngừng hoạt động nhóm (xóa mềm `status = INACTIVE`, thu hồi dải số; `409` nếu còn thành viên đang hoạt động) | ADMIN |

### 3.5. Phân hệ Quản lý Người dùng & Phân quyền (Users & Roles)

| Method | Endpoint | Quyền / Guard | Mô tả | Portal |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/users` | `user:view` | Danh sách người dùng. Bản User chỉ trả user thuộc nhóm của người gọi; bản Admin trả toàn hệ thống, lọc tùy chọn `groupId`, `status` | USER + ADMIN |
| `GET` | `/api/v1/users/:id` | `user:view` | Chi tiết thông tin người dùng | USER + ADMIN |
| `POST` | `/api/v1/users` | `user:create` | Tạo mới tài khoản người dùng trong nhóm, kèm `roleCode` (mặc định `REGULAR_USER`; gán `GROUP_ADMIN` cần thêm `group:manage_admin`, gán `USER_RECORDING` cần thêm `group:toggle_recording` và nhóm có `allowRecordingAccess = true`); tạo dòng `user_roles` cùng transaction | USER + ADMIN |
| `PUT` | `/api/v1/users/:id` | `user:edit` | Cập nhật thông tin tài khoản người dùng | USER + ADMIN |
| `PUT` | `/api/v1/users/:id/status` | `user:edit` | Khóa / Mở khóa tài khoản | USER + ADMIN |
| `PUT` | `/api/v1/users/:id/reset-password` | `user:edit` | Đặt lại mật khẩu người dùng: sinh mật khẩu tạm 16 ký tự trả **một lần** (`temporaryPassword`), đặt `must_change_password = 1`, thu hồi mọi phiên của user | USER + ADMIN |
| `PUT` | `/api/v1/users/:id/role` | `group:manage_admin` hoặc `group:toggle_recording` | Đổi vai trò người dùng `{ "roleCode": "GROUP_ADMIN" \| "USER_RECORDING" \| "REGULAR_USER" }`: chuyển sang/khỏi `GROUP_ADMIN` cần `group:manage_admin` (chặn `409` hạ quyền Quản trị viên nhóm đang hoạt động cuối cùng); `REGULAR_USER` ↔ `USER_RECORDING` cần `group:toggle_recording` (sang `USER_RECORDING` cần nhóm có `allowRecordingAccess = true`, ngược lại `409`). Đặc tả `docs/modules/10_permissions_and_roles.md` mục 1.3, 3.2 | USER + ADMIN |
| `DELETE` | `/api/v1/admin/users/:id/sessions` | `user:edit` | Thu hồi mọi phiên đăng nhập của một người dùng (`REVOKED_BY_ADMIN`) | ADMIN |
| `DELETE` | `/api/v1/users/:id` | `user:delete` | Ngừng hoạt động tài khoản (xóa mềm `status = INACTIVE`; `409` nếu là Quản trị viên nhóm cuối cùng còn hoạt động; không xóa cứng) | USER + ADMIN |
| `GET` | `/api/v1/admin/roles` | `role:view` | Danh sách 5 vai trò cố định (lọc tùy chọn `scope=ADMIN\|USER`), mỗi vai trò kèm danh sách quyền (`code`, `name`, `category`, `groupGated`) và số tài khoản đang mang vai trò (đếm `admin_roles`/`user_roles`). Chỉ đọc: không có API tạo/sửa/xóa vai trò hay sửa quyền của vai trò | ADMIN |

### 3.6. Phân hệ Quản lý Đầu số PABX, Dải số & Kho số máy lẻ (Prefixes & Phone Inventory)

| Method | Endpoint | Quyền / Guard | Mô tả | Portal |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/prefixes` | `prefix:view` | Danh sách các nhóm đầu số (`phone_prefix_groups`) và dải số (`phone_prefix_ranges`) theo Nhóm người dùng | USER + ADMIN |
| `GET` | `/api/v1/prefixes/:id` | `prefix:view` | Chi tiết dải số, tỷ lệ sử dụng kho số | USER + ADMIN |
| `GET` | `/api/v1/admin/prefix-groups` | `prefix:view` | Danh sách nhóm đầu số (`phone_prefix_groups`) kèm nhóm người dùng liên kết (nếu có) và số dải | ADMIN |
| `GET` | `/api/v1/admin/prefix-groups/available` | `prefix:view` | Nhóm đầu số `ACTIVE` chưa liên kết với nhóm người dùng nào (dùng cho form tạo/sửa nhóm) | ADMIN |
| `POST` | `/api/v1/admin/prefix-groups` | `prefix:manage` | Tạo nhóm đầu số (`code`, `name`, `description`) | ADMIN |
| `PUT` | `/api/v1/admin/prefix-groups/:id` | `prefix:manage` | Sửa tên/mô tả/trạng thái nhóm đầu số | ADMIN |
| `DELETE` | `/api/v1/admin/prefix-groups/:id` | `prefix:manage` | Xóa cứng khi không có nhóm người dùng liên kết và không còn dải (`409` nếu vi phạm, `docs/01_database_schema.md` mục 14) | ADMIN |
| `POST` | `/api/v1/admin/prefixes` | `prefix:manage` | Cấp phát dải số mới cho Nhóm người dùng (Kiểm tra xung đột Overlap Check) | ADMIN |
| `PUT` | `/api/v1/admin/prefixes/:id` | `prefix:manage` | Cập nhật dải số (body `{ rangeFrom, rangeTo, note, decisionNumber, historyNote }`; không đổi được `prefix`, `prefixGroupId`, gửi giá trị khác thì `400`) (mở rộng / thu hẹp khoảng số) theo quy tắc `docs/01_database_schema.md` mục 8 (`409` nếu phần mở rộng chứa số đã thuộc dải khác) | ADMIN |
| `DELETE` | `/api/v1/admin/prefixes/:id` | `prefix:manage` | Thu hồi dải số về kho số dùng chung theo quy tắc `docs/01_database_schema.md` mục 8 (số `ALLOCATED` về `FREE`, `RESERVED`/`LOCKED` giữ trạng thái), ghi lịch sử và nhật ký kiểm toán, rồi mới xóa dòng dải | ADMIN |
| `GET` | `/api/v1/prefixes/history` | `prefix:view` | Tra cứu lịch sử cấp phát / thu hồi dải số (`prefix_allocation_history`) | USER + ADMIN |
| `GET` | `/api/v1/phone-numbers/pool` | `prefix:view` | Tra cứu kho số tổng thể 90.000 số máy 5 số PABX (`v_phone_numbers_detail` / `phone_numbers` - hỗ trợ lọc theo nhóm, dải số, trạng thái FREE/ALLOCATED/RESERVED/LOCKED, số máy; cấu trúc bảng vật lý tuân thủ chuẩn hóa 3NF chỉ giữ `range_id`) | USER + ADMIN |
| `GET` | `/api/v1/admin/phone-numbers/pool/summary` | `prefix:view` | Số lượng số trong kho theo trạng thái (`FREE`, `ALLOCATED`, `RESERVED`, `LOCKED`) và tổng 90.000 | ADMIN |
| `PUT` | `/api/v1/admin/phone-numbers/:number` | `prefix:manage` | Body `{ displayName?, description?, status?: "LOCKED" \| "RESERVED" \| "NORMAL" }`; `NORMAL` = bỏ khóa/bỏ dự phòng (về `ALLOCATED` nếu có `range_id`, ngược lại `FREE`); lịch sử `phone_number_range_history`: đổi trạng thái ghi `LOCK`/`UNLOCK`/`RESERVE`/`UNRESERVE`, đổi thông tin ghi 1 dòng `UPDATE_INFO` mỗi request | ADMIN |
| `GET` | `/api/v1/phone-numbers/history` | `prefix:view` | Tra cứu lịch sử biến động gán số vào dải & điều chuyển (`phone_number_range_history`) | USER + ADMIN |

### 3.7. Phân hệ Tra cứu Log CDR & Nghe/Tải Ghi âm (CDR & Audio)

> [!IMPORTANT]
> Toàn bộ các API phân hệ CDR hoạt động trên bảng dữ liệu làm giàu `cdr_enriched` và áp dụng mô hình phân quyền **Group-Based Data Isolation** kết hợp **2-Tier Recording Access Gate**:
> - User Portal tự động bị ràng buộc `WHERE (caller_group_id = :userGroupId OR called_group_id = :userGroupId)`.
> - Admin Portal có quyền truy cập 100% bản ghi (kể cả bản ghi chưa gán nhóm) và hỗ trợ tham số `groupId`.
> - **Chốt chặn Tầng 1 (Quyền nhóm)**: Nếu `user_groups.allow_recording_access = 0`, cột ghi âm bị ẩn trên bảng chính, API stream và download bị chặn (`403 GROUP_RECORDING_DISABLED`).
> - **Chốt chặn Tầng 2 (Vai trò)**: Khi nhóm được cấp phép, chỉ vai trò có `cdr:listen_audio`/`cdr:download_audio` (`GROUP_ADMIN`, `USER_RECORDING`) được nghe/tải; `REGULAR_USER` bị chặn `403 FORBIDDEN_PERMISSION`. Admin chỉ xét vai trò, không qua Tầng 1.

| Method | Endpoint | Quyền / Guard | Mô tả | Portal |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/cdr` | `cdr:view` | Tra cứu lịch sử cuộc gọi từ `cdr_enriched` (luôn lọc theo `fromDate`/`toDate`; mặc định trong `retention_online_months`, Admin dùng `includeArchive=true` để xem dữ liệu lưu trữ; Cô lập dữ liệu nhóm; nếu nhóm chưa cấp quyền ghi âm thì ẩn cột và trả về hasAudio=false; Admin xem toàn bộ kèm badge nhóm và lọc `groupId`) | USER + ADMIN |
| `GET` | `/api/v1/cdr/:id` | `cdr:view` | Xem chi tiết 87 tham số kỹ thuật + thông tin nhóm (Kiểm tra cô lập nhóm với User Portal; nếu nhóm chưa kích hoạt ghi âm thì thay player bằng thông báo) | USER + ADMIN |
| `GET` | `/api/v1/cdr/export` | `cdr:export` | Xuất danh sách cuộc gọi (Excel / CSV) theo đúng bộ lọc của `GET /api/v1/cdr` (chỉ leg chính, cô lập nhóm; không kèm file ghi âm) | USER + ADMIN |
| `GET` | `/api/v1/cdr/:id/audio/stream` | `cdr:listen_audio` | Stream phát âm thanh HTTP 206 (`PermissionsGuard`: quyền nhóm `allowRecordingAccess` rồi quyền vai trò; service kiểm tra cô lập nhóm) | USER + ADMIN |
| `GET` | `/api/v1/cdr/:id/audio/download` | `cdr:download_audio` | Tải về file ghi âm (.wav) (`PermissionsGuard`: quyền nhóm `allowRecordingAccess` rồi quyền vai trò; service kiểm tra cô lập nhóm) | USER + ADMIN |

### 3.8. Phân hệ Phân tích Chất lượng thoại QoS (QoS Debug & Analytics)

> [!NOTE]
> `/qos/summary`, `/qos/disconnection-codes` là số liệu tổng hợp, chỉ đọc `stats_*`. `/qos/debug-table` là danh sách từng leg, đọc `cdr_enriched` có khoảng thời gian bắt buộc và phân trang (nguyên tắc tại `docs/01_database_schema.md` mục 15).

| Method | Endpoint | Quyền / Guard | Mô tả | Portal |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/qos/debug-table` | `qos:view` | Bảng phân tích QoS chi tiết từng phiên đàm thoại gần đây (đọc từ `cdr_enriched`) | USER + ADMIN |
| `GET` | `/api/v1/qos/summary` | `qos:view` | Thống kê tỷ lệ ASR, NER, phân khúc điểm MOS G.107, Packet Loss, Jitter, SIP Delays (đọc từ `stats_daily`/`stats_hourly`, cô lập theo nhóm) | USER + ADMIN |
| `GET` | `/api/v1/qos/disconnection-codes` | `qos:view` | Thống kê phân bố mã ngắt kết nối SIP (200, 486, 487, 503...) và bên cúp máy (đọc từ `stats_daily`/`stats_hourly`) | USER + ADMIN |
| `GET` | `/api/v1/admin/qos/thresholds` | `qos:view` | Lấy cấu hình ngưỡng cảnh báo MOS, Jitter, Packet Loss | ADMIN |
| `PUT` | `/api/v1/admin/qos/thresholds` | `qos:manage` | Cập nhật ngưỡng cảnh báo QoS | ADMIN |

### 3.9. Phân hệ Thống kê Thời lượng & Lưu lượng (Call Duration & Traffic)

> [!NOTE]
> Phần lớn cuộc gọi là mạng thoại nội bộ dùng riêng EVN giữa các máy lẻ 5 số `[H][C][XXX]` (kho 10000–99999). Dữ liệu thật vẫn có số ngoài kho (`Anonymous`, `0xxxx` dịch vụ đặc biệt, số di động, số không đủ 5 chữ số); phía đó có nhóm sở hữu = NULL. Phạm vi nhóm bóc tách 3 hướng: Gọi đi (`calls_outbound`, phía nhận thuộc nhóm khác hoặc không có nhóm), Gọi đến (`calls_inbound`), Nội bộ nhóm (`calls_intra_group`). Phạm vi toàn hệ thống chia theo `call_type`: `calls_intra_group`, `calls_inter_group`, `calls_unassigned`. Không cộng các nhóm để ra tổng hệ thống (quy tắc tại `docs/01_database_schema.md` mục 15). Phân loại lưu tại `cdr_enriched.call_type`, thời lượng tại `cdr_enriched.answered_duration_sec` (chỉ leg chính `is_primary_leg = 1`).

| Method | Endpoint | Quyền / Guard | Mô tả | Portal |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/traffic/summary` | `cdr:view` | Thống kê sản lượng 3 chiều và tổng thời lượng đàm thoại thực tế theo kỳ theo Nhóm người dùng (đọc từ `stats_daily`/`stats_hourly`) | USER + ADMIN |
| `GET` | `/api/v1/traffic/records` | `cdr:view` | Danh sách chi tiết cuộc gọi kèm phân loại lưu lượng và thời lượng (đọc `cdr_enriched` với `is_primary_leg = 1`: `caller_group_id`, `called_group_id`, `call_type`, `answered_duration_sec`) | USER + ADMIN |

### 3.10. Phân hệ Báo cáo & Xuất dữ liệu (Reports & Export - Zero CDR Scan)

> [!NOTE]
> Số liệu báo cáo hoàn toàn bóc tách theo Nhóm người dùng (`groupId`). Cây tổ chức đóng vai trò tham chiếu danh mục phân cấp.

| Method | Endpoint | Quyền / Guard | Mô tả | Portal |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/reports/summary` | `report:view` | Xem trước dữ liệu báo cáo tổng hợp lưu lượng & chất lượng (đọc tức thì từ `stats_daily`, lọc theo `groupId`) | USER + ADMIN |
| `POST` | `/api/v1/reports/export/excel` | `report:export` | Xuất file Excel (.xlsx) chuẩn biểu mẫu EVN từ dữ liệu `stats_daily` theo `groupId` (thời gian xử lý $< 1\text{s}$) | USER + ADMIN |
| `POST` | `/api/v1/reports/export/pdf` | `report:export` | Xuất file PDF chuẩn khổ A4 từ dữ liệu `stats_daily` theo `groupId` (thời gian xử lý $< 1\text{s}$) | USER + ADMIN |

### 3.11. Phân hệ Bảng điều khiển & Tái tính toán Thống kê (Dashboard & Stats Management)

| Method | Endpoint | Quyền / Guard | Mô tả | Portal |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/dashboard/stats` | Authenticated | Dữ liệu KPI Dashboard (Hôm nay: đọc `stats_hourly`; Tuần/Tháng/Khoảng ngày: đọc `stats_daily`). Cô lập nhóm tự động | USER + ADMIN |
| `GET` | `/api/v1/dashboard/recent-calls` | Authenticated | Tối đa `limit` (mặc định 5, tối đa 20) cuộc gọi gần nhất trong 24 giờ: leg chính, cô lập nhóm, sắp `Created` giảm dần; trường giống item của `GET /cdr` (gồm `disconnectionCode`, `mos`, `callType`, `direction`, `duration`) | USER + ADMIN |
| `GET` | `/api/v1/admin/dashboard/groups` | Authenticated | Danh sách nhóm theo lưu lượng trong kỳ (`period`, `sort` = `totalCalls`\|`totalDurationSec`\|`asrPercentage`\|`avgMos`, `order`, `page`, `limit` ≤ 100): mỗi dòng `groupId`, `groupCode`, `groupName`, `rangesText`, `totalCalls`, `totalDurationSec`, `asrPercentage`, `avgMos`; đọc từng dòng nhóm của `stats_*`, không có dòng tổng cộng | ADMIN |
| `GET` | `/api/v1/dashboard/charts` | Authenticated | Dữ liệu biểu đồ phân bố 24 giờ trong ngày (đọc `stats_hourly`) hoặc biến thiên theo ngày (đọc `stats_daily`) | USER + ADMIN |
| `POST` | `/api/v1/admin/stats/recalculate` | `system:manage` | Tính lại thống kê **bất đồng bộ**: body `{ "fromDate": "YYYY-MM-DD", "toDate": "YYYY-MM-DD" }` (tối đa 366 ngày); đẩy mọi khung giờ trong khoảng vào `stats_recompute_queue`, trả `202 { "queuedHours": n }`; job tổng hợp xử lý ở các lần chạy kế tiếp, cho mọi phạm vi | ADMIN |

### 3.12. Phân hệ Thông báo & Cài đặt hệ thống (Notifications & Settings)

| Method | Endpoint | Quyền / Guard | Mô tả | Portal |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/notifications` | Authenticated | Danh sách thông báo của người dùng/admin | USER + ADMIN |
| `PUT` | `/api/v1/notifications/:id/read` | Authenticated | Đánh dấu thông báo đã đọc | USER + ADMIN |
| `POST` | `/api/v1/admin/notifications` | `system:manage` | Admin soạn thông báo `SYSTEM_MAINTENANCE`/`GENERAL` (`title`, `content`, `severity`, `target` = `ALL_ADMINS` \| `ALL_USERS` \| `GROUP:{id}` \| `EVERYONE`); tạo một dòng người nhận cho mỗi tài khoản | ADMIN |
| `PUT` | `/api/v1/notifications/mark-all-read` | Authenticated | Đánh dấu tất cả thông báo đã đọc | USER + ADMIN |
| `GET` | `/api/v1/admin/settings/system` | `system:manage` | Lấy cấu hình hệ thống (Quy tắc phân tích, retention, bảo trì...) | ADMIN |
| `PUT` | `/api/v1/admin/settings/system` | `system:manage` | Lưu cấu hình hệ thống | ADMIN |
| `POST` | `/api/v1/admin/settings/reload-cache` | `system:manage` | Nạp lại cache sở hữu số và cache setting trên mọi instance backend | ADMIN |

---

## 4. WebSocket Gateway Events (`/notifications`, `/admin/notifications`)

Dùng cho việc bắn thông báo tức thời về giao diện người dùng:

- **Client Connect**: Socket.IO với **hai namespace tách theo portal**: User kết nối `/notifications` (xác minh bằng `JWT_USER_SECRET`), Admin kết nối `/admin/notifications` (xác minh bằng `JWT_ADMIN_SECRET`). Access Token gửi trong payload `auth: { token }` lúc handshake, **không** đặt trên query string. Khi token hết hạn, client refresh rồi kết nối lại.
- **Room**: `user:{id}` và `group:{groupId}` ở namespace User; `admin:{id}` và `admins` ở namespace Admin.
- **Server Events**:
  - `notification:new`: Khi có thông báo mới (sự cố QoS, cảnh báo tổng đài, thông báo hệ thống). Payload: `{ id, title, content, severity, createdAt }`.
