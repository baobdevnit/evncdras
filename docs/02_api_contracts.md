# QUY CHUẨN API & DANH SÁCH ENDPOINTS TOÀN CỤC (API CONTRACTS)

## Dự án: EVN CDR Analysis System (EVN CDR AS)

## Chuẩn thiết kế: RESTful API & WebSocket Gateway | NestJS v10+

---

## 1. Nguyên tắc thiết kế chung

### 1.1. Tiêu chuẩn đường dẫn (URL Conventions)

- **Base URL**: `https://cdr-pabx.evn.com.vn/api/v1`
- **Gọi API từ frontend**: frontend là một ứng dụng chạy cùng domain với API (`docs/00_overview_and_architecture.md` mục 5.3) nên gọi bằng đường dẫn tương đối: khu vực Admin (`frontend/src/apps/admin`) dùng `/api/v1/admin`, khu vực Member (`frontend/src/apps/member`) dùng `/api/v1`; không cần cấu hình CORS ở production.
- **Phần backend phục vụ**: `/api/v1/admin/*` do `backend/src/apps/admin` phục vụ, `/api/v1/*` còn lại do `backend/src/apps/member` phục vụ; cả hai chạy trong tiến trình `backend-api`. WebSocket (mục 4) do `backend/src/realtime` phục vụ.
- **Phân tách Portal** (tách tuyến tuyệt đối, **không có guard dùng chung**):
  - Admin Portal: **mọi** API Admin gọi đều nằm dưới `/api/v1/admin/*`, chỉ `AdminAuthGuard` (secret `JWT_ADMIN_SECRET`).
  - User Portal: `/api/v1/*` (không có tiền tố `/admin`), chỉ `UserAuthGuard` (secret `JWT_USER_SECRET`).
  - Token User gọi `/api/v1/admin/*` và token Admin gọi route User đều bị `401`.
- **Cột "Portal" trong các bảng mục 3**:
  - `ADMIN`: chỉ có bản `/api/v1/admin/...` như ghi trong bảng.
  - `USER + ADMIN`: có **hai route cùng hành vi**. Route User là đường dẫn ghi trong bảng, ví dụ `GET /api/v1/cdr`. Route Admin là bản sao có tiền tố, ví dụ `GET /api/v1/admin/cdr`.
    - Bản User luôn tự áp cô lập nhóm (`group_id = nhóm của người dùng`).
    - Bản Admin có phạm vi toàn hệ thống và nhận thêm tham số riêng của Admin (`groupId`, `callType`, `includeArchive`…).
    - DTO bản User không có các tham số riêng của Admin: gửi `groupId`, `includeArchive`… lên route User trả `400` (tham số không hợp lệ), không bỏ qua im lặng.
    - Hai bản dùng **chung service và DTO response** đặt trong `backend/src/core/<x>/`, chỉ khác controller (`backend/src/apps/member/<x>/` và `backend/src/apps/admin/<x>/`) và guard. Response giống hệt nhau.
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
- Định dạng dữ liệu trao đổi: `application/json; charset=utf-8` (Trừ audio streaming sử dụng `audio/wav` và file export sử dụng `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`, `text/csv; charset=utf-8`, `application/pdf`).

### 1.2. Tiêu chuẩn xác thực (Authentication Headers)

Mọi request (ngoại trừ các endpoint public như Login) đều phải mang theo Bearer Token:

```http
Authorization: Bearer <access_token>
```

- Admin Access Token được ký bằng `JWT_ADMIN_SECRET`, kiểm tra bởi `AdminAuthGuard`.
- User Access Token được ký bằng `JWT_USER_SECRET`, kiểm tra bởi `UserAuthGuard`.
- Access Token sống 15 phút, chỉ giữ trong bộ nhớ frontend; Refresh Token 7 ngày đi qua cookie `HttpOnly; Secure; SameSite=Strict` và được xoay vòng mỗi lần refresh. Phiên lưu ở bảng `auth_sessions`. Chính sách đầy đủ tại `docs/01_database_schema.md` mục 6.1.
- **Chế độ bảo trì** (`system_maintenance_mode = true`): mọi API của User Portal (`/api/v1/*` không có tiền tố `/admin`) trả `503` với `errorCode = "MAINTENANCE"`, trừ `GET /api/v1/auth/me`, `POST /api/v1/auth/refresh` (để phiên đang có giữ nguyên và frontend vẫn biết tài khoản, hiển thị thông báo bảo trì; hết bảo trì dùng tiếp không cần đăng nhập lại, chủ dự án chốt ở U02) và `POST /api/v1/auth/logout` (đăng xuất vẫn thu hồi phiên và xóa cookie, để trên máy dùng chung hết bảo trì không tự vào lại tài khoản qua refresh, chủ dự án chốt ở U03). Với `POST /api/v1/auth/login`, `503` được trả **trước mọi bước** (trước kiểm tra body, tìm tài khoản), không ghi `audit_logs`, không tăng bộ đếm sai (`docs/modules/03_auth_user.md` mục 3.1). Admin Portal không bị ảnh hưởng (`docs/modules/07_system_settings.md` mục 2).

---

## 2. Chuẩn định dạng phản hồi (Response Envelope Format)

- **Tên trường**: mọi trường JSON (request body, response, query param, DTO) dùng **camelCase**, ví dụ `callerId`, `callStatus`, `userGroupId`. Cột `snake_case` của bảng ứng dụng đổi sang camelCase theo quy tắc thông thường (`is_primary_leg` → `isPrimaryLeg`, `call_status` → `callStatus`). Riêng `cdr_enriched.answered_duration_sec` có tên trường `durationSec` ở mọi API danh sách/chi tiết cuộc gọi (`GET /cdr`, `GET /cdr/:id`, `/qos/debug-table`, `/traffic/records`, `/dashboard/recent-calls`). **Mọi trường thời lượng trong API tính bằng giây** (tên có hậu tố `Sec`), kể cả API tổng hợp (`/dashboard/stats` trả `durationSec`, `/traffic/summary` trả `totalDurationSec`); không có trường thời lượng tính bằng phút, frontend tự quy đổi khi hiển thị. Chỉ có **hai ngoại lệ**: (1) object `raw` của `GET /cdr/:id` giữ **nguyên tên 87 cột PABX** (`RTP_Caller_G107MOS`, `_100_Delay`…); (2) khóa của map cài đặt hệ thống là chính `setting_key` (`analysis_internal_extension_pattern`…).
- **Giá trị enum** của query param và response viết hoa dạng `UPPER_SNAKE` (`ANSWERED`, `INTRA_GROUP`, `INBOUND`, `CRITICAL`…), trừ giá trị giữ nguyên của PABX (`releasedBy` = `caller`/`called`, `codec`). Tham số lọc không có giá trị `all`: không truyền tham số nghĩa là không lọc.
- **Độ dài chuỗi**: mọi trường chuỗi trong request giới hạn theo độ dài cột đích ở `docs/01_database_schema.md` (vd. `code` của đơn vị và nhóm người dùng ≤ 50, `username` ≤ 100, `email` ≤ 150, `fullName` ≤ 150, `phoneNumber` ≤ 30, `decisionNumber` ≤ 100, `note` của dải ≤ 255); vượt quá trả `400`, không để CSDL báo lỗi. `user_groups.code` ≤ 50 bảo đảm `phone_prefix_groups.code` (`PG-` + mã) vừa 53 ký tự.
- **Số điện thoại liên hệ** (`phoneNumber` của `admins`, `users` ở mọi API tạo/sửa tài khoản và hồ sơ): cắt khoảng trắng hai đầu; `null` hoặc chuỗi rỗng sau khi cắt lưu `NULL`; còn lại phải khớp `^(?=.*[0-9])[0-9+\-.() ]{1,30}$` (chỉ chữ số, dấu cách, `+ - . ( )`, có ít nhất một chữ số, ≤ 30 ký tự), sai trả `400 VALIDATION_ERROR`. Không chuẩn hóa thêm (giữ nguyên dấu cách, dấu chấm người dùng nhập). Không áp cho số máy PABX 5 chữ số (`phone_numbers.phone_number`).
- **Tên đăng nhập và email** (`username`, `email` của `admins`, `users` ở mọi API tạo tài khoản: `POST /admin/admins`, `POST /users`, `initialAdmin` của `POST /admin/user-groups`; và `email` ở `PUT /admin/admins/:id`): cắt khoảng trắng hai đầu rồi kiểm tra. `username` khớp `^[A-Za-z0-9._@-]{3,100}$` (3–100 ký tự: chữ Latin không dấu, chữ số, `.`, `_`, `@`, `-`); `email` ≤ 150 ký tự, khớp `^[^\s@]+@[^\s@]+\.[^\s@]+$`; sai trả `400 VALIDATION_ERROR` (`errors.username`, `errors.email`). Lưu đúng chữ hoa/thường đã nhập, không hạ chữ; so trùng không phân biệt hoa thường theo collation `utf8mb4_unicode_ci` (như `uniq_*_username`, `uniq_*_email`). **Trùng** trả `409 ACCOUNT_DUPLICATE` với `errors` có khóa `username` và/hoặc `email` (để frontend hiện dưới ô): so với các tài khoản chưa `INACTIVE` **cùng bảng** (`username_active`, `email_active`), gồm cả trùng chéo: `username` mới trùng `email` của tài khoản khác, hoặc `email` mới trùng `username` của tài khoản khác, vì đăng nhập nhận username hoặc email trong cùng một ô (`docs/modules/04_auth_admin.md` mục 3.1, `docs/modules/03_auth_user.md` mục 3.1). Tài khoản có `username` trùng `email` của chính nó (vd. `root.admin@evnict.vn`) vẫn hợp lệ. Cách khóa để kiểm tra chéo an toàn khi tạo đồng thời: `docs/modules/04_auth_admin.md` mục 3.3 bước 2.
- **Không trả chuỗi hiển thị**: API chỉ trả giá trị (số, mã enum, thời điểm ISO 8601), không trả chuỗi đã định dạng cho giao diện như số có dấu phân cách, đơn vị ("phút"), thời lượng dạng `mm:ss`, nhãn so sánh ("+12% so với kỳ trước"), nhãn chất lượng MOS, thời gian tương đối ("15 phút trước") hay nhãn dải số ("42000 - 42499", "42xxx"); dải số trả dạng `{ rangeFrom, rangeTo }`. Frontend tự định dạng và tự lấy nhãn (dải MOS ở `docs/01_database_schema.md` mục 2.1).
- **Định danh CDR**: `cdr_enriched.id` và `call_group_key` (bigint, cột `id` khai báo `zerofill`) luôn trả về dạng **chuỗi số thập phân không đệm số 0** (`"5370"`) ở mọi trường `id`, `cdrId`, `callGroupKey` của CDR, để không mất chính xác với số nguyên lớn trong JavaScript. Tham số đường dẫn `/cdr/:id` nhận cả dạng có và không có số 0 đệm (so sánh theo giá trị số). Các bảng ứng dụng khác (`int`) trả `id` dạng số.
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
    { "id": "5370", "callerId": "45678", "calledId": "46001", "callStatus": "ANSWERED", "durationSec": 135 }
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

**Khóa phụ cấp cao**: ngoài `success`, `statusCode`, `message`, `data`, `pagination`, `timestamp`, chỉ các API sau có thêm khóa cấp cao, đúng tên dưới đây; API khác không thêm khóa nào:

| Khóa | API | Nội dung |
|---|---|---|
| `unreadCount` | `GET /notifications`, `PUT /notifications/:id/read` (cả bản Admin) | Số thông báo chưa đọc của người gọi (`docs/modules/06_notifications.md` mục 3.1) |
| `systemTotal` | `GET /api/v1/admin/traffic/summary` khi không truyền `groupId` | Số liệu dòng toàn hệ thống (`docs/modules/14_core_business_call_traffic.md` mục 3.1) |
| `meta.thresholds` | `GET /qos/debug-table` (cả bản Admin) | Ngưỡng QoS để tô màu (`docs/modules/13_core_business_qos_analysis.md` mục 3.1) |

**Tham số phân trang, tìm kiếm, lọc** (mọi API trả khung trên, trừ khi đặc tả của API ghi khác):

- `page`: số nguyên ≥ 1 (chuỗi `^[1-9][0-9]{0,8}$`), mặc định 1. `limit`: số nguyên từ 1 tới mức tối đa của API (thường 100), mặc định theo đặc tả API. Sai định dạng hoặc ngoài khoảng trả `400 VALIDATION_ERROR` (`errors.page`, `errors.limit`), **không** tự kẹp về giá trị hợp lệ.
- `pagination`: `total` = số bản ghi khớp bộ lọc, `totalPages = ceil(total / limit)` (`0` khi `total = 0`), `hasNext = page < totalPages`, `hasPrev = page > 1`. `page` lớn hơn `totalPages` trả `200` với `data = []`, `total` vẫn là tổng thật (frontend tự lùi về trang cuối nếu cần).
- `search`: cắt khoảng trắng hai đầu; rỗng sau khi cắt coi như không gửi; tối đa 100 ký tự (vượt `400`, `errors.search`). Khớp **chứa** (`LIKE CONCAT('%', :search, '%') ESCAPE '\\'`, backend thoát `\`, `%`, `_` trong chuỗi người nhập) trên các cột đặc tả API liệt kê, nối bằng `OR`; không phân biệt hoa thường theo collation `utf8mb4_unicode_ci`.
- Bộ lọc enum (`status`, `roleCode`…): đúng một giá trị chữ hoa trong danh mục của API, giá trị lạ trả `400`; bỏ trống hoặc không gửi = không lọc. Mỗi tham số chỉ gửi một lần (lặp lại trả `400`); tham số không có trong đặc tả trả `400` (mục 2.3).
- Thứ tự sắp xếp do đặc tả từng API quy định và luôn kết thúc bằng một khóa duy nhất (thường `id`) để phân trang ổn định; API không nhận tham số sắp xếp thì gửi `sort`/`order` trả `400`.

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

- Mã lỗi `400`: `VALIDATION_ERROR` cho mọi lỗi dữ liệu đầu vào (thiếu trường bắt buộc, sai kiểu, vượt độ dài cột, giá trị enum lạ, trường hoặc tham số không được nhận), `errors = { "<tênTrường>": ["<thông điệp>", …] }` theo tên trường camelCase của request.
- Mã lỗi `401`: `INVALID_CREDENTIALS` khi đăng nhập sai (`POST .../auth/login`): dùng **cùng một** mã và thông điệp cho username/email không tồn tại (kể cả tài khoản `INACTIVE`) và sai mật khẩu, để không lộ tài khoản có tồn tại hay không; `UNAUTHORIZED` cho mọi trường hợp còn lại (thiếu, sai chữ ký hoặc hết hạn Access Token, token của cổng kia, cookie Refresh Token thiếu/hết hạn/đã thu hồi).
- Lỗi `403` do cô lập nhóm (route User truy cập bản ghi không thuộc nhóm mình, vd. `GET /cdr/:id`, `/cdr/:id/audio/*`, đổi vai trò người dùng nhóm khác) dùng `errorCode = "FORBIDDEN_SCOPE_ACCESS"` như ví dụ trên; thiếu mã quyền (kể cả gửi tham số lọc nâng cao khi thiếu `cdr:filter_advanced`) dùng `FORBIDDEN_PERMISSION`.
- Mã lỗi `403` khác: `GROUP_RECORDING_DISABLED` (nghe/tải ghi âm khi nhóm chưa được cấp phép Tầng 1), `GROUP_INACTIVE` (người dùng của nhóm đã `INACTIVE` đăng nhập hoặc gọi API, `docs/modules/10_permissions_and_roles.md` mục 2.3), `PASSWORD_CHANGE_REQUIRED` (token `PASSWORD_CHANGE_ONLY` gọi API khác, `docs/01_database_schema.md` mục 6.1), `ROOT_ADMIN_PROTECTED` (sửa, khóa, ngừng hoạt động, đặt lại mật khẩu hoặc thu hồi phiên của tài khoản mang vai trò `ROOT_ADMIN`), `SELF_ACTION_FORBIDDEN` (Admin tự khóa, tự sửa, tự ngừng hoạt động, tự đặt lại mật khẩu hoặc tự thu hồi mọi phiên của chính mình qua API quản lý Admin; Quản trị viên nhóm tự khóa, tự ngừng hoạt động hoặc tự đặt lại mật khẩu của chính mình qua route User `/users/:id/status`, `/users/:id/reset-password`, `DELETE /users/:id`). `GROUP_INACTIVE` và `GROUP_RECORDING_DISABLED` dùng `403` khi chặn truy cập, `409` khi chặn thao tác ghi (danh mục `409` dưới đây). Đăng nhập bằng tài khoản quản trị viên đã khóa (`status = LOCKED`) trả `403 ACCOUNT_LOCKED`, khác với khóa tạm do sai mật khẩu (`423 ACCOUNT_TEMPORARILY_LOCKED`).
- Mã lỗi `404`: `NOT_FOUND` là mã mặc định khi tài nguyên theo tham số đường dẫn (`:id`, `:cdrId`, `:number`…) không tồn tại, hoặc thuộc tài khoản khác mà người gọi không được biết là có (vd. phiên đăng nhập của tài khoản khác: cùng thông điệp với không tồn tại, để không lộ id), `errors = null`. Chỉ dùng mã riêng khi client cần phân biệt: `RECORDING_FILE_NOT_FOUND` (bản ghi CDR có nhưng không thấy file ghi âm, `docs/modules/12_core_business_cdr_and_audio.md`). Route không tồn tại cũng trả `404 NOT_FOUND`. Bản ghi thuộc nhóm khác mà route User có quyền biết là tồn tại dùng `403 FORBIDDEN_SCOPE_ACCESS` (trên), không dùng `404`.
- Mã lỗi `409`: `LAST_GROUP_ADMIN` (hạ quyền, khóa hoặc ngừng hoạt động Quản trị viên nhóm `ACTIVE` cuối cùng của nhóm), `ORGANIZATION_IN_USE` (xóa đơn vị còn đơn vị con hoặc còn nhóm người dùng tham chiếu), `RANGE_OVERLAP` (dải số mới hoặc phần mở rộng giao với dải đã cấp), `ACCOUNT_DUPLICATE` (`username`/`email` trùng tài khoản chưa `INACTIVE`), `CODE_DUPLICATE` (`code` của đơn vị tổ chức hoặc nhóm người dùng đã có, `errors = { "code": [...] }`), `GROUP_INACTIVE` (thao tác ghi trên nhóm đã `INACTIVE`, kể cả `DELETE` lại nhóm đó), `ACCOUNT_INACTIVE`, `ORGANIZATION_INACTIVE`, `GROUP_RECORDING_DISABLED`, `RETENTION_PURGE_CONFIRM_REQUIRED`.
- Mã lỗi `422`: `ENRICHMENT_FAILED` (làm giàu lại CDR bị cách ly vẫn lỗi, `errors = { message }`, `docs/modules/07_system_settings.md` mục 3.7).
- Mã lỗi `423`: `ACCOUNT_TEMPORARILY_LOCKED` (đăng nhập hoặc tự đổi mật khẩu khi `locked_until > NOW()`). Tự đổi mật khẩu sai `currentPassword` trả `400 VALIDATION_ERROR` (`errors.currentPassword`), không dùng `401` để client không refresh rồi gửi lại.
- Mã lỗi `503`: `MAINTENANCE` (chế độ bảo trì đang bật, mọi API User Portal trừ `GET /api/v1/auth/me`, `POST /api/v1/auth/refresh`, `POST /api/v1/auth/logout`, mục 1.2), `errors = null`. Frontend User hiển thị thông báo bảo trì, không coi là lỗi mạng và không coi là hết phiên (không refresh, không xóa phiên).
- Dữ liệu chi tiết của lỗi nằm trong `errors`, không thêm khóa cấp cao, vd. `423 ACCOUNT_TEMPORARILY_LOCKED` có `errors = { "lockedUntil": "..." }` (`docs/01_database_schema.md` mục 6.1), `409 RETENTION_PURGE_CONFIRM_REQUIRED` có `errors = { currentMonths, newMonths, monthsToPurge }`.

---

## 3. Danh mục API Endpoints toàn hệ thống

### 3.1. Phân hệ Xác thực & Hồ sơ Quản trị viên (Admin Auth & Profile)

Toàn bộ endpoint của mục này thuộc portal **ADMIN**.

| Method | Endpoint | Quyền / Guard | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/admin/auth/login` | Public | Đăng nhập tài khoản Quản trị viên hệ thống: body `{ username, password, rememberMe? }`; sai thông tin `401 INVALID_CREDENTIALS`, `LOCKED` `403 ACCOUNT_LOCKED`, khóa tạm `423 ACCOUNT_TEMPORARILY_LOCKED`. Đặc tả `docs/modules/04_auth_admin.md` mục 3.1 |
| `POST` | `/api/v1/admin/auth/refresh` | Public (cookie Refresh Token) | Xoay vòng Refresh Token và cấp Access Token mới: không có body, trả `{ accessToken, expiresIn }` kèm cookie mới; mọi lỗi phiên/tài khoản `401 UNAUTHORIZED` và xóa cookie. Đặc tả `docs/modules/03_auth_user.md` mục 3.2.1, `docs/modules/04_auth_admin.md` mục 3.5 (chính sách `docs/01_database_schema.md` mục 6.1) |
| `POST` | `/api/v1/admin/auth/logout` | `AdminAuthGuard` (nhận cả token `PASSWORD_CHANGE_ONLY`) | Đăng xuất: không có body; thu hồi phiên ứng với cookie (`LOGOUT`, đi theo chuỗi nếu đã `ROTATED`), luôn xóa cookie, trả `200` `data = null` (idempotent); audit `AUTH / LOGOUT` chỉ khi thu hồi được phiên. Đặc tả `docs/modules/03_auth_user.md` mục 3.2.1, `docs/modules/04_auth_admin.md` mục 3.5 |
| `GET` | `/api/v1/admin/auth/me` | `AdminAuthGuard` (nhận cả token `PASSWORD_CHANGE_ONLY`) | Lấy thông tin tài khoản Admin đang đăng nhập: không có query; `data` cùng cấu trúc `admin` của đăng nhập (`id`, `username`, `fullName`, `email`, `avatarUrl`, `roleCode`, `roleName`, `permissions`); tài khoản không còn `ACTIVE` trả `401 UNAUTHORIZED`; không ghi audit. Đặc tả `docs/modules/04_auth_admin.md` mục 3.1.1 |
| `GET` | `/api/v1/admin/profile` | `AdminAuthGuard` | Xem hồ sơ Admin: không có query; trả `id`, `username`, `email`, `fullName`, `phoneNumber`, `avatarUrl`, `status`, `roleCode`, `roleName`, `lastLoginAt`, `passwordChangedAt`, `createdAt` (không có `permissions`); tài khoản không còn `ACTIVE` trả `401 UNAUTHORIZED`; không ghi audit. Đặc tả `docs/modules/09_admin_profile.md` mục 3.1 |
| `PUT` | `/api/v1/admin/profile` | `AdminAuthGuard` | Cập nhật một phần `{ fullName?, phoneNumber? }` (ít nhất một trường; `phoneNumber: null` xóa số); trường khác (`email`, `avatarUrl`…) trả `400`; trả `data` = hồ sơ đủ 12 trường như `GET`; tài khoản không còn `ACTIVE` `401 UNAUTHORIZED`; ghi `audit_logs` `ADMIN / UPDATE` với `changedFields`, không có gì đổi thì không ghi. Đặc tả `docs/modules/09_admin_profile.md` mục 3.2 |
| `PUT` | `/api/v1/admin/profile/change-password` | `AdminAuthGuard` (nhận cả token `PASSWORD_CHANGE_ONLY`) | Đổi mật khẩu Admin (body `currentPassword`, `newPassword`, `confirmPassword`; sai `currentPassword` → `400` và tăng bộ đếm khóa tạm, đang khóa tạm → `423`); cập nhật `password_changed_at`, `must_change_password = 0`, thu hồi mọi phiên cũ (kể cả phiên đang dùng) rồi tạo một phiên mới chép `remember_me` theo claim `sid`, trả `{ accessToken, expiresIn }` và cookie mới. Đặc tả chung `docs/modules/09_admin_profile.md` mục 3.3 |
| `POST` | `/api/v1/admin/profile/avatar` | `AdminAuthGuard` | Tải ảnh đại diện: `multipart/form-data` đúng một phần `file` (≤ 2 MB, PNG/JPEG theo magic bytes); backend cắt vuông 256×256, bỏ metadata, lưu `/media/avatars/<uuid>.<png\|jpg>` trên volume chung (Nginx phục vụ), ghi `admins.avatar_url`, xóa file cũ; trả `data` = hồ sơ đủ 12 trường như `GET`; sai file `400 VALIDATION_ERROR` (`errors.file`, kể cả quá 2 MB), token `PASSWORD_CHANGE_ONLY` `403`, tài khoản không còn `ACTIVE` `401`; ghi `audit_logs` `ADMIN / UPDATE` `changedFields = ["avatarUrl"]`. Cách duy nhất đổi ảnh đại diện. Đặc tả `docs/modules/09_admin_profile.md` mục 3.2.1 |
| `GET` | `/api/v1/admin/profile/preferences` | `AdminAuthGuard` | Lấy thiết lập giao diện của Admin (`user_settings`, `user_type = ADMIN`): 5 trường như bản User (mục 3.2) và `dashboardWidgets` luôn đủ 6 phần tử đã chuẩn hóa; không có dòng thì trả mặc định, không chèn; không query (`400`), token `PASSWORD_CHANGE_ONLY` `403`, tài khoản không còn `ACTIVE` `401`. Frontend nạp một lần khi vào cổng (store `preferencesAdmin`). Đặc tả `docs/modules/09_admin_profile.md` mục 3.6 |
| `PUT` | `/api/v1/admin/profile/preferences` | `AdminAuthGuard` | Cập nhật một phần thiết lập giao diện của Admin (ít nhất một trong 6 trường của `GET`; không nhận `null`, không ép kiểu; `dashboardWidgets` phải đủ đúng 6 phần tử `{ key, visible, order }`, mỗi `key` một lần, `order` 1…6, sai thì `400`); upsert theo `uniq_user_settings`, giữ các khóa khác của `custom_preferences`; trả `data` đủ 6 trường như `GET`; không ghi `audit_logs`; token `PASSWORD_CHANGE_ONLY` `403`, tài khoản không còn `ACTIVE` `401`. Đặc tả `docs/modules/09_admin_profile.md` mục 3.7 |
| `GET` | `/api/v1/admin/profile/recent-activity` | `AdminAuthGuard` | 20 dòng `audit_logs` gần nhất có tác nhân là chính Admin (`actor_type = ADMIN`, `actor_id` = mình; gồm cả `LOGIN_FAILED`, không gồm việc người khác làm lên tài khoản mình), sắp `createdAt` rồi `id` giảm dần; không query (`400`), không phân trang; `data` là mảng phần tử `id`, `action`, `resourceName`, `resourceId`, `ipAddress`, `userAgent`, `actionDetails`, `createdAt` (như `/admin/audit-logs`, không có trường tác nhân); token `PASSWORD_CHANGE_ONLY` `403`, tài khoản không còn `ACTIVE` `401`; không ghi audit. Đặc tả `docs/modules/09_admin_profile.md` mục 3.4 |
| `GET` | `/api/v1/admin/auth/sessions` | `AdminAuthGuard` | Danh sách phiên đăng nhập còn hiệu lực của chính Admin; không query (`400`), không phân trang; `data` là mảng phần tử `id`, `ipAddress`, `userAgent` (chuỗi gốc), `loggedInAt` (`logged_in_at`), `lastActiveAt` (`COALESCE(last_used_at, created_at)`), `expiresAt`, `isCurrent` (theo claim `sid` của Access Token, không theo cookie), phiên hiện tại đứng đầu; token `PASSWORD_CHANGE_ONLY` `403`, tài khoản không còn `ACTIVE` `401`; không ghi audit. Đặc tả `docs/modules/09_admin_profile.md` mục 3.5.1 |
| `DELETE` | `/api/v1/admin/auth/sessions/:id` | `AdminAuthGuard` | Thu hồi một phiên của chính mình (`REVOKED_BY_SELF`); không query, không body; `:id` đã `ROTATED` thì đi theo `replaced_by_session_id` tới phiên đang hiệu lực (`docs/01_database_schema.md` mục 6.1). `200` `data = { revoked }` (`false` khi không tới được phiên hiệu lực, không ghi gì); thu hồi được thì ghi `audit_logs` `AUTH / SESSION_REVOKED` (`resource_id` = id phiên bị thu hồi). Phiên hiện tại (theo claim `sid`, đọc khóa sau khi khóa phiên đích) trả `400 VALIDATION_ERROR` (`errors.id`, dùng `logout`); `:id` không phải số nguyên dương `400`; không tồn tại hoặc không phải phiên của mình `404 NOT_FOUND`; token `PASSWORD_CHANGE_ONLY` `403`, tài khoản không còn `ACTIVE` `401`. Đặc tả `docs/modules/09_admin_profile.md` mục 3.5.2 |
| `DELETE` | `/api/v1/admin/admins/:id/sessions` | `admin:manage` | Thu hồi mọi phiên còn hiệu lực của một Admin khác (`REVOKED_BY_ADMIN`); không query, không body; `200` `data = { revokedCount }`; `revokedCount > 0` thì ghi `audit_logs` `AUTH / SESSION_REVOKED` (`resource_id` = id admin đích, `action_details = { targetActorType: "ADMIN", revokedCount }`), `0` không ghi gì. Chặn chính mình (`403 SELF_ACTION_FORBIDDEN`) và tài khoản `ROOT_ADMIN` (`403 ROOT_ADMIN_PROTECTED`, không ghi audit); `:id` sai định dạng `400`; không tồn tại `404 NOT_FOUND`; token `PASSWORD_CHANGE_ONLY` `403`, tài khoản người gọi không còn `ACTIVE` `401`. Access Token đã cấp cho thiết bị bị thu hồi còn dùng được tới khi hết hạn. Đặc tả `docs/modules/04_auth_admin.md` mục 3.7 |
| `GET` | `/api/v1/admin/admins` | `admin:manage` | Danh sách quản trị viên (mọi trạng thái, kể cả `INACTIVE`), khung phân trang mục 2.2. Query `page` (mặc định 1), `limit` (mặc định 10, ≤ 100), `search` (khớp chứa `username`, `email`, `full_name`), `status` (`ACTIVE` \| `LOCKED` \| `INACTIVE`, bỏ trống = tất cả); không có tham số sắp xếp: `ROOT_ADMIN` trước, rồi `ACTIVE` → `LOCKED` → `INACTIVE`, rồi `full_name`, `id` tăng dần. Phần tử: `id`, `username`, `email`, `fullName`, `phoneNumber`, `avatarUrl`, `status`, `roleCode`, `roleName`, `lastLoginAt`, `createdAt`, `updatedAt` (không có mật khẩu, bộ đếm sai, khóa tạm, phiên). Query sai `400`; token `PASSWORD_CHANGE_ONLY` `403`, thiếu quyền `403 FORBIDDEN_PERMISSION`, tài khoản người gọi không còn `ACTIVE` `401`; không ghi audit. Đặc tả `docs/modules/04_auth_admin.md` mục 3.2 |
| `POST` | `/api/v1/admin/admins` | `admin:manage` | Tạo mới quản trị viên. Body `{ username, email, fullName, phoneNumber? }` (định dạng `username`/`email`, `phoneNumber` theo mục 2; trường khác, kể cả `password`, `roleCode`, `status`, trả `400`); luôn gán vai trò `SYSTEM_ADMIN` vào `admin_roles` (chỉ vai trò `ROOT_ADMIN` có `admin:manage`), tạo dòng `user_settings` mặc định, `created_by_admin_id` = người gọi, `must_change_password = 1`, ghi `audit_logs` `ADMIN / CREATE` (`resource_id` = id mới, `action_details = { username, email, roleCode }`), tất cả một transaction. Sinh mật khẩu tạm 16 ký tự trả **một lần**: `201`, `data` = phần tử của `GET /admin/admins` (12 trường) + `temporaryPassword`, header `Cache-Control: no-store`. Trùng `username`/`email` (kể cả trùng chéo username ↔ email, mục 2) với Admin chưa `INACTIVE` trả `409 ACCOUNT_DUPLICATE` (`errors.username`/`errors.email`); token `PASSWORD_CHANGE_ONLY` `403`, thiếu quyền `403 FORBIDDEN_PERMISSION`, tài khoản người gọi không còn `ACTIVE` `401`. Đặc tả `docs/modules/04_auth_admin.md` mục 3.3 |
| `PUT` | `/api/v1/admin/admins/:id/status` | `admin:manage` | Khóa / Mở khóa tài khoản Admin khác. Body đúng một trường `{ "status": "ACTIVE" \| "LOCKED" }` (giá trị khác, kể cả `INACTIVE`, hoặc có trường khác trả `400`); không query. Trạng thái mới bằng trạng thái hiện tại: `200`, không ghi gì. Khóa: `status = LOCKED`, thu hồi mọi phiên còn hiệu lực (`ACCOUNT_LOCKED`), ghi `audit_logs` `ADMIN / LOCK` (`resource_id` = id admin đích, `action_details = { revokedCount }`); mở khóa: ghi `ADMIN / UNLOCK`, không đổi bộ đếm sai/khóa tạm; một transaction. Trả `200` `data = { id, status }`. Chặn chính mình (`403 SELF_ACTION_FORBIDDEN`) và tài khoản mang vai trò `ROOT_ADMIN` (`403 ROOT_ADMIN_PROTECTED`, không ghi audit) với cả hai giá trị; không tồn tại `404 NOT_FOUND`; đã `INACTIVE` `409 ACCOUNT_INACTIVE` (`docs/01_database_schema.md` mục 14); `:id` sai định dạng `400`; token `PASSWORD_CHANGE_ONLY` `403`, thiếu quyền `403 FORBIDDEN_PERMISSION`, tài khoản người gọi không còn `ACTIVE` `401`. Khóa có hiệu lực ngay (guard đọc `status` mỗi request). Đặc tả `docs/modules/04_auth_admin.md` mục 3.4 |
| `PUT` | `/api/v1/admin/admins/:id` | `admin:manage` | Sửa họ tên, email, số điện thoại của Admin khác. Body cập nhật một phần `{ fullName?, email?, phoneNumber? }`, ít nhất một trường (định dạng `email`, `phoneNumber` theo mục 2; `fullName`/`email` không nhận `null`/rỗng; trường khác, kể cả `username`, `status`, `roleCode`, `avatarUrl`, trả `400`; không có API đổi vai trò Admin); không query. Không trường nào khác giá trị hiện tại: `200`, không ghi gì. Ngược lại `UPDATE` các cột đổi và ghi `audit_logs` `ADMIN / UPDATE` (`resource_id` = id admin đích, `action_details = { changedFields }`), một transaction; không thu hồi phiên. Trả `200` `data` = phần tử của `GET /admin/admins` (12 trường). `email` mới trùng `email` hoặc `username` (trùng chéo, mục 2) của Admin chưa `INACTIVE` khác trả `409 ACCOUNT_DUPLICATE` (`errors.email`). Chặn chính mình (`403 SELF_ACTION_FORBIDDEN`) và tài khoản mang vai trò `ROOT_ADMIN` (`403 ROOT_ADMIN_PROTECTED`, không ghi audit); không tồn tại `404 NOT_FOUND`; đã `INACTIVE` `409 ACCOUNT_INACTIVE` (`LOCKED` vẫn sửa được); `:id` sai định dạng `400`; token `PASSWORD_CHANGE_ONLY` `403`, thiếu quyền `403 FORBIDDEN_PERMISSION`, tài khoản người gọi không còn `ACTIVE` `401`. Đặc tả `docs/modules/04_auth_admin.md` mục 3.8 |
| `PUT` | `/api/v1/admin/admins/:id/reset-password` | `admin:manage` | Đặt lại mật khẩu Admin khác, giống `PUT /users/:id/reset-password` (mục 3.5). Không query, không body (có thì `400`). Một transaction: sinh mật khẩu tạm 16 ký tự (sinh và băm trước transaction, không ghi log), đặt `must_change_password = 1`, xóa khóa tạm (`failed_login_count = 0`, `locked_until = NULL`), thu hồi mọi phiên còn hiệu lực (`PASSWORD_CHANGED`), ghi `audit_logs` `AUTH / PASSWORD_RESET` (`resource_id` = id admin đích, `action_details = { targetActorType: "ADMIN", revokedCount }`). Trả `200` `data = { id, temporaryPassword }` **một lần**, header `Cache-Control: no-store`. Access Token đầy đủ còn hạn của tài khoản đích bị từ chối ngay (`401`, kiểm tra `must_change_password` ở mỗi request). Chặn chính mình (`403 SELF_ACTION_FORBIDDEN`) và tài khoản `ROOT_ADMIN` (`403 ROOT_ADMIN_PROTECTED`, không ghi audit); không tồn tại `404 NOT_FOUND`; đã `INACTIVE` `409 ACCOUNT_INACTIVE`; `LOCKED` đặt lại được, giữ `LOCKED`; `:id` sai định dạng `400`; token `PASSWORD_CHANGE_ONLY` `403`, thiếu quyền `403 FORBIDDEN_PERMISSION`, tài khoản người gọi không còn `ACTIVE` `401`. Đặc tả `docs/modules/04_auth_admin.md` mục 3.6 |
| `GET` | `/api/v1/admin/audit-logs` | `audit:view` | Tra cứu `audit_logs` của mọi tác nhân, chỉ đọc, không ghi audit. Query `fromDate`/`toDate` bắt buộc (`YYYY-MM-DD`, ≤ 31 ngày tính cả hai đầu), lọc tùy chọn `actorType`, `actorId` (cần `actorType` `ADMIN`/`USER`), `action` (danh mục `docs/01_database_schema.md` mục 13), `resourceName`, `resourceId` (khớp chính xác, cần `resourceName`), `page`, `limit` (mặc định 20, tối đa 100); sai → `400`. Sắp `createdAt` rồi `id` giảm dần, khung mục 2.2; phần tử `id`, `actorType`, `actorId`, `actorName`, `action`, `resourceName`, `resourceId` (chuỗi), `ipAddress`, `userAgent`, `actionDetails` (JSON gốc), `createdAt`. Đặc tả `docs/modules/07_system_settings.md` mục 3.4 |
| `DELETE` | `/api/v1/admin/admins/:id` | `admin:manage` | Ngừng hoạt động tài khoản Admin khác (xóa mềm, không hoàn tác). Không query, không body (có thì `400`). Một transaction: `status = INACTIVE` (`username`/`email` được dùng lại ngay cho tài khoản mới; giữ `admin_roles`, `user_settings`), thu hồi mọi phiên còn hiệu lực (`ACCOUNT_LOCKED`), ghi `audit_logs` `ADMIN / DEACTIVATE` (`resource_id` = id admin đích, `action_details = { revokedCount }`, kể cả `0`). Trả `200` `data = { id, status: "INACTIVE" }`. Access Token còn hạn của tài khoản đích bị từ chối ngay (`401`). Chặn chính mình (`403 SELF_ACTION_FORBIDDEN`, không ghi audit) và tài khoản mang vai trò `ROOT_ADMIN` (`403 ROOT_ADMIN_PROTECTED`; rollback rồi ghi riêng `ADMIN / ACCESS_DENIED`, `action_details = { attemptedAction: "DEACTIVATE", errorCode: "ROOT_ADMIN_PROTECTED" }`); không tồn tại `404 NOT_FOUND`; đã `INACTIVE` `409 ACCOUNT_INACTIVE` (`LOCKED` ngừng hoạt động được); `:id` sai định dạng `400`; token `PASSWORD_CHANGE_ONLY` `403`, thiếu quyền `403 FORBIDDEN_PERMISSION`, tài khoản người gọi không còn `ACTIVE` `401`. Đặc tả `docs/modules/04_auth_admin.md` mục 3.9 |

### 3.2. Phân hệ Xác thực & Hồ sơ Người dùng đơn vị (User Auth & Profile)

Toàn bộ endpoint của mục này thuộc portal **USER**.

| Method | Endpoint | Quyền / Guard | Mô tả |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/auth/login` | Public (bị chế độ bảo trì chặn) | Đăng nhập tài khoản Người dùng đơn vị EVN: body `{ username, password, rememberMe? }` (username hoặc email); bảo trì `503 MAINTENANCE` trước mọi bước (không audit), sai thông tin `401 INVALID_CREDENTIALS`, `LOCKED` `403 ACCOUNT_LOCKED`, nhóm `INACTIVE` `403 GROUP_INACTIVE` (chốt phòng vệ), khóa tạm `423 ACCOUNT_TEMPORARILY_LOCKED`; trả `accessToken`, `mustChangePassword`, `user` (kèm `userGroup`, `permissions` hiệu lực theo cờ nhóm). Đặc tả `docs/modules/03_auth_user.md` mục 3.1 |
| `POST` | `/api/v1/auth/refresh` | Public (cookie Refresh Token; không bị chế độ bảo trì chặn) | Xoay vòng Refresh Token và cấp Access Token mới: không có body, trả `{ accessToken, expiresIn }` kèm cookie mới; mọi lỗi phiên/tài khoản (kể cả tài khoản không còn `ACTIVE`, nhóm `INACTIVE`) `401 UNAUTHORIZED` và xóa cookie. Đặc tả `docs/modules/03_auth_user.md` mục 3.2.1 |
| `POST` | `/api/v1/auth/logout` | `UserAuthGuard` (nhận cả token `PASSWORD_CHANGE_ONLY`; không bị chế độ bảo trì chặn) | Đăng xuất: không có body; thu hồi phiên ứng với cookie (`LOGOUT`, đi theo chuỗi nếu đã `ROTATED`), luôn xóa cookie, trả `200` `data = null` (idempotent); audit `AUTH / LOGOUT` chỉ khi thu hồi được phiên. Đặc tả `docs/modules/03_auth_user.md` mục 3.2.1 |
| `GET` | `/api/v1/auth/me` | `UserAuthGuard` (nhận cả token `PASSWORD_CHANGE_ONLY`; không bị chế độ bảo trì chặn) | Lấy thông tin User đang đăng nhập: không có query; `data` cùng cấu trúc `user` của đăng nhập (`id`, `username`, `fullName`, `email`, `avatarUrl`, `userGroup`, `roleCode`, `roleName`, `permissions`); `roleCode` theo claim của Access Token (cùng giá trị `PermissionsGuard` dùng), `permissions` hiệu lực = quyền vai trò bỏ quyền ghi âm khi nhóm chưa được cấp (`docs/modules/10_permissions_and_roles.md` mục 2.3); tài khoản không còn `ACTIVE`, nhóm `INACTIVE` hoặc token đầy đủ mà `must_change_password = 1` trả `401 UNAUTHORIZED`; không ghi audit. Đặc tả `docs/modules/03_auth_user.md` mục 3.2 |
| `GET` | `/api/v1/profile` | `UserAuthGuard` | Xem hồ sơ User: không có query; trả `id`, `username`, `email`, `fullName`, `jobTitle`, `phoneNumber`, `avatarUrl`, `status`, `userGroup { id, code, name }`, `organization { id, code, name }` (`null` khi nhóm độc lập), `roleCode`, `roleName`, `lastLoginAt`, `passwordChangedAt`, `createdAt` (không có `permissions`); `roleCode` theo claim của Access Token như `/auth/me`; tài khoản không còn `ACTIVE`, nhóm `INACTIVE` hoặc token đầy đủ mà `must_change_password = 1` `401 UNAUTHORIZED`; token `PASSWORD_CHANGE_ONLY` `403`; bị chế độ bảo trì chặn (`503`); không ghi audit. Đặc tả `docs/modules/08_user_profile.md` mục 3.1 |
| `PUT` | `/api/v1/profile` | `UserAuthGuard` | Cập nhật một phần `{ fullName?, phoneNumber? }` (ít nhất một trường; `phoneNumber: null` xóa số); trường khác (`email`, `username`, `jobTitle`, `roleCode`, `avatarUrl`…) trả `400` (`username`, `email` bất biến, `docs/01_database_schema.md` mục 6); trả `data` = hồ sơ đủ 15 trường như `GET`; tài khoản không còn `ACTIVE`, nhóm `INACTIVE` hoặc token đầy đủ mà `must_change_password = 1` `401 UNAUTHORIZED`; token `PASSWORD_CHANGE_ONLY` `403`; bị chế độ bảo trì chặn (`503`); ghi `audit_logs` `USER / UPDATE` với `changedFields`, không có gì đổi thì không ghi. Đặc tả `docs/modules/08_user_profile.md` mục 3.2 |
| `PUT` | `/api/v1/profile/change-password` | `UserAuthGuard` (nhận cả token `PASSWORD_CHANGE_ONLY`; bị chế độ bảo trì chặn) | Đổi mật khẩu User: body `currentPassword`, `newPassword`, `confirmPassword` (chính sách như bản Admin); bảo trì `503` trước kiểm tra body; tài khoản không còn `ACTIVE`, nhóm `INACTIVE` hoặc token đầy đủ mà `must_change_password = 1` `401 UNAUTHORIZED`; sai `currentPassword` `400` + tăng bộ đếm khóa tạm, đang khóa tạm `423`; thu hồi mọi phiên cũ (`PASSWORD_CHANGED`), tạo một phiên mới chép `remember_me` theo claim `sid`; trả `{ accessToken, expiresIn }` (token mang `sub`, `userGroupId`, `roleCode`, `sid`) và cookie mới `Path=/api/v1/auth`; audit `AUTH / PASSWORD_CHANGED` `{ revokedCount, forced }`. Đặc tả `docs/modules/08_user_profile.md` mục 3.4 (khung chung `docs/modules/09_admin_profile.md` mục 3.3) |
| `POST` | `/api/v1/profile/avatar` | `UserAuthGuard` | Tải ảnh đại diện theo đặc tả chung `docs/modules/09_admin_profile.md` mục 3.2.1: `multipart/form-data` đúng một phần `file` (≤ 2 MB, PNG/JPEG theo magic bytes), cắt vuông 256×256, bỏ metadata, lưu `/media/avatars/<uuid>.<png\|jpg>`, ghi `users.avatar_url`, xóa file cũ; trả `data` = hồ sơ đủ 15 trường như `GET /profile`; sai file `400 VALIDATION_ERROR` (`errors.file`, kể cả quá 2 MB), token `PASSWORD_CHANGE_ONLY` `403`, tài khoản không còn `ACTIVE`, nhóm `INACTIVE` hoặc token đầy đủ mà `must_change_password = 1` `401` (xóa file vừa ghi), bảo trì `503 MAINTENANCE` trước khi phân tích multipart; ghi `audit_logs` `USER / UPDATE` `changedFields = ["avatarUrl"]`. Cách duy nhất đổi ảnh đại diện. Đặc tả `docs/modules/08_user_profile.md` mục 3.3 |
| `GET` | `/api/v1/auth/sessions` | `UserAuthGuard` | Danh sách phiên đăng nhập còn hiệu lực của chính User, như bản Admin (mục 3.1; đặc tả chung `docs/modules/09_admin_profile.md` mục 3.5.1): không query (có thì `400 VALIDATION_ERROR`), `data` là mảng 7 trường `{ id, ipAddress, userAgent, loggedInAt, lastActiveAt, expiresAt, isCurrent }`, phiên hiện tại (theo claim `sid`) đứng đầu; token `PASSWORD_CHANGE_ONLY` `403`, tài khoản không còn `ACTIVE`, nhóm `INACTIVE` hoặc token đầy đủ mà `must_change_password = 1` `401`, bảo trì `503 MAINTENANCE`; chỉ đọc, không audit. Đặc tả `docs/modules/08_user_profile.md` mục 3.6.1 |
| `DELETE` | `/api/v1/auth/sessions/:id` | `UserAuthGuard` | Thu hồi một phiên của chính User (`REVOKED_BY_SELF`), như bản Admin (mục 3.1; đặc tả chung `docs/modules/09_admin_profile.md` mục 3.5.2): không query, không body; `:id` đã `ROTATED` thì đi theo `replaced_by_session_id` tới phiên đang hiệu lực. `200` `data = { revoked }` (`false` khi không tới được phiên hiệu lực, không ghi gì); thu hồi được thì ghi `audit_logs` `AUTH / SESSION_REVOKED` (`resource_id` = id phiên bị thu hồi). Phiên hiện tại (theo claim `sid`) `400 VALIDATION_ERROR` (`errors.id`, dùng `logout`); `:id` không phải số nguyên dương `400`; không tồn tại hoặc không phải phiên của mình (kể cả phiên Admin trùng id số) `404 NOT_FOUND`; token `PASSWORD_CHANGE_ONLY` `403`, tài khoản không còn `ACTIVE`, nhóm `INACTIVE` hoặc token đầy đủ mà `must_change_password = 1` `401`, bảo trì `503 MAINTENANCE`. Đặc tả `docs/modules/08_user_profile.md` mục 3.6.2 |
| `GET` | `/api/v1/profile/preferences` | `UserAuthGuard` | Lấy thiết lập giao diện của chính User, như bản Admin (mục 3.1; đặc tả chung `docs/modules/09_admin_profile.md` mục 3.6) nhưng **không** có `dashboardWidgets`: không query (có thì `400 VALIDATION_ERROR`), `data` đúng 5 trường `{ theme, isSidebarCollapsed, itemsPerPage, emailNotificationEnabled, soundAlertEnabled }`; chưa có dòng `user_settings` thì trả mặc định DDL, không chèn; token `PASSWORD_CHANGE_ONLY` `403`, tài khoản không còn `ACTIVE`, nhóm `INACTIVE` hoặc token đầy đủ mà `must_change_password = 1` `401`, bảo trì `503 MAINTENANCE`; chỉ đọc, không audit. Đặc tả `docs/modules/08_user_profile.md` mục 3.5.1 |
| `PUT` | `/api/v1/profile/preferences` | `UserAuthGuard` | Cập nhật một phần thiết lập giao diện của chính User, như bản Admin (mục 3.1; đặc tả chung `docs/modules/09_admin_profile.md` mục 3.7) nhưng **không** nhận `dashboardWidgets`: ít nhất một trong 5 trường của `GET`, không nhận `null`, không ép kiểu, `theme`/`itemsPerPage` ngoài tập cho phép, trường lạ hoặc có query → `400 VALIDATION_ERROR`; upsert theo `uniq_user_settings` chỉ cột đã gửi (`user_type = 'USER'`, không đụng `custom_preferences`); trả `data` đúng 5 trường như `GET`; không ghi `audit_logs`; token `PASSWORD_CHANGE_ONLY` `403`, tài khoản không còn `ACTIVE`, nhóm `INACTIVE` hoặc token đầy đủ mà `must_change_password = 1` `401`, bảo trì `503 MAINTENANCE` (trước kiểm tra body). Frontend áp ngay, lỗi thì hoàn tác. Đặc tả `docs/modules/08_user_profile.md` mục 3.5.2 |

### 3.3. Phân hệ Cây tổ chức EVN (Organizations)

| Method | Endpoint | Quyền / Guard | Mô tả | Portal |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/organizations/tree` | `org:view` | Lấy toàn bộ cây tổ chức (mọi đơn vị, cả `INACTIVE`), không phân trang: không có query (có thì `400 VALIDATION_ERROR`); `data` là mảng nút gốc, mỗi nút `{ id, parentId, code, name, level, sortOrder, status, children }`, anh em sắp `sortOrder`, `name`, `id`; bản Admin thêm `userGroupCount` (số nhóm gắn trực tiếp, kể cả `INACTIVE`); không cô lập theo nhóm; token `PASSWORD_CHANGE_ONLY` `403`, tài khoản không còn `ACTIVE`, nhóm `INACTIVE` hoặc token đầy đủ mà `must_change_password = 1` `401`; bản User bị chế độ bảo trì chặn (`503`), chưa màn hình Member nào gọi; chỉ đọc, không audit. Đặc tả `docs/modules/01_organization.md` mục 3.1 | USER + ADMIN |
| `GET` | `/api/v1/organizations` | `org:view` | Danh sách đơn vị phẳng, phân trang (`page` mặc định 1, `limit` mặc định 20 tối đa 100), lọc `search` (chứa, trên `code`, `name`), `status`, `parentId` (con trực tiếp; id không tồn tại `200` `data = []`), `level` (`0` = đơn vị gốc); tham số khác/sai `400 VALIDATION_ERROR`; sắp `level`, `sortOrder`, `name`, `id`; phần tử `{ id, parentId, parentName, code, name, level, sortOrder, status, childCount }`, bản Admin thêm `userGroupCount`; không cô lập theo nhóm; lỗi xác thực/tài khoản như `/organizations/tree`, bản User bị chế độ bảo trì chặn (`503`); chưa màn hình nào gọi; chỉ đọc, không audit. Đặc tả `docs/modules/01_organization.md` mục 3.1.1 | USER + ADMIN |
| `GET` | `/api/v1/organizations/:id` | `org:view` | Chi tiết một đơn vị (kể cả `INACTIVE`): không query (`400`), `:id` sai định dạng `400`, không tồn tại `404 NOT_FOUND`; `data = { id, parentId, parentName, code, name, level, sortOrder, status, description, representativeName, representativePhone, representativeEmail, createdAt, updatedAt, children }`, `children` là đơn vị con trực tiếp `{ id, code, name, level, status }` sắp `sortOrder`, `name`, `id`; bản Admin thêm `userGroups` (nhóm gắn trực tiếp, kể cả `INACTIVE`, `{ id, code, name, status }` sắp `name`, `id`); không có `childCount`/`userGroupCount`; không cô lập theo nhóm; lỗi xác thực/tài khoản như `/organizations/tree`, bản User bị chế độ bảo trì chặn (`503`), chưa màn hình Member nào gọi; chỉ đọc, không audit. Đặc tả `docs/modules/01_organization.md` mục 3.1.2 | USER + ADMIN |
| `POST` | `/api/v1/admin/organizations` | `org:manage` | Thêm đơn vị gốc hoặc đơn vị con. Body `{ code, name, parentId?, sortOrder?, description?, representativeName?, representativePhone?, representativeEmail? }`, không query; trường khác (kể cả `level`, `status`) `400`; `code` 2–50 ký tự `^[A-Z0-9]+(-[A-Z0-9]+)*$` (không tự viết hoa), `name` 3–255, `representativePhone` theo quy tắc số điện thoại mục 2, `representativeEmail` ≤ 150; `level` = cha + 1 (gốc 0), cha không tồn tại hoặc ở cấp 3 `400` (`errors.parentId`), cha `INACTIVE` `409 ORGANIZATION_INACTIVE`, trùng mã `409 CODE_DUPLICATE` (`errors.code`); đơn vị mới luôn `ACTIVE`; `201`, `data` 16 trường như `GET /admin/organizations/:id` (`children = []`, `userGroups = []`); audit `ORGANIZATION / CREATE` `{ code, name, parentId }`. Đặc tả `docs/modules/01_organization.md` mục 3.2 | ADMIN |
| `PUT` | `/api/v1/admin/organizations/:id` | `org:manage` | Sửa đơn vị, cập nhật một phần (ít nhất một trường, `{}` `400`): body `{ name?, parentId?, sortOrder?, status?, description?, representativeName?, representativePhone?, representativeEmail? }`, không query; `code` (bất biến), `level` và trường khác `400`; `name`/`sortOrder` không nhận `null`; `:id` sai `400`, không tồn tại `404 NOT_FOUND`; đơn vị `INACTIVE` vẫn sửa được, kích hoạt lại (`status = ACTIVE`) được kể cả khi cha `INACTIVE`; đổi `parentId`: bằng chính nó, không tồn tại, nằm trong nhánh của chính nó hoặc làm nhánh vượt cấp 3 `400` (`errors.parentId`), cha mới `INACTIVE` `409 ORGANIZATION_INACTIVE`, tính lại `level` cả nhánh cùng transaction (khóa mọi dòng `organizations` theo khóa chính); đổi `status` không lan sang con/nhóm; không đổi gì `200` không ghi; `200`, `data` 16 trường như `GET /admin/organizations/:id`; audit `ORGANIZATION / UPDATE` `{ changedFields }`. Đặc tả `docs/modules/01_organization.md` mục 3.3 | ADMIN |
| `DELETE` | `/api/v1/admin/organizations/:id` | `org:manage` | Xóa cứng đơn vị ở mọi trạng thái (`ACTIVE`/`INACTIVE`): không query, không body (`400`), `:id` sai định dạng `400`, không tồn tại `404 NOT_FOUND`; còn đơn vị con (mọi trạng thái) hoặc còn nhóm người dùng tham chiếu (kể cả `INACTIVE`) `409 ORGANIZATION_IN_USE` (`errors = null`, thông điệp nêu lý do); khóa dòng đích `FOR UPDATE`, kiểm tra tham chiếu bằng đọc khóa; audit `ORGANIZATION / DELETE` `{ code, name, parentId }`; `200` `data = { id }`. Chi tiết `docs/modules/01_organization.md` mục 3.4 | ADMIN |

### 3.4. Phân hệ Nhóm người dùng (User Groups - Tổ chức QLND)

| Method | Endpoint | Quyền / Guard | Mô tả | Portal |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/user-groups` | `user_group:view` | Danh sách các nhóm QLND (kèm số lượng users) | USER + ADMIN |
| `GET` | `/api/v1/user-groups/tree` | `user_group:view` | Cấu trúc cây nhóm QLND theo tổ chức (`{ organizations, standaloneGroups }`; bản User chỉ nhánh của nhóm người gọi). Đặc tả `docs/modules/02_user_group.md` mục 3.1.1 | USER + ADMIN |
| `GET` | `/api/v1/user-groups/:id` | `user_group:view` | Xem chi tiết nhóm QLND và người đại diện. Bản User chỉ nhóm của người gọi. Đặc tả `docs/modules/02_user_group.md` mục 3.1.2 | USER + ADMIN |
| `GET` | `/api/v1/user-groups/me/members` | `user_group:view` | Danh bạ thành viên **nhóm của người gọi** (màn hình Danh bạ nhóm, khu vực Member): chỉ tài khoản `status = 'ACTIVE'`, trường danh bạ `id`, `fullName`, `jobTitle`, `email`, `phoneNumber`, `avatarUrl`, `roleCode`; không trả `username`, `status`, `lastLoginAt` hay thông tin phiên. Query `page`, `limit` (≤ 100), `search` (họ tên, email, chức danh, số điện thoại), `roleCode`. Đặc tả `docs/modules/02_user_group.md` mục 3.6 | USER |
| `POST` | `/api/v1/admin/user-groups` | `user_group:manage` | Thiết lập nhóm QLND mới gắn vào nút tổ chức (kèm `allowRecordingAccess`). Bắt buộc `initialAdmin`: trong cùng transaction tạo nhóm đầu số, nhóm, Quản trị viên nhóm đầu tiên (`user_roles` `GROUP_ADMIN`, `representative_user_id` trỏ tới người đó) và dòng `user_settings`; trả `initialAdmin.temporaryPassword` **một lần**; trùng `username`/`email` trả `409 ACCOUNT_DUPLICATE`, không tạo gì. Đặc tả `docs/modules/02_user_group.md` mục 3.2 | ADMIN |
| `PUT` | `/api/v1/admin/user-groups/:id` | `user_group:manage` | Cập nhật thông tin nhóm QLND (kèm quyền bật/tắt ghi âm nhóm `allowRecordingAccess`); không nhận `status`, `code`, `phonePrefixGroupId` (`400`); `409` nếu nhóm đã `INACTIVE` | ADMIN |
| `DELETE` | `/api/v1/admin/user-groups/:id` | `user_group:manage` | Ngừng hoạt động nhóm (xóa mềm `status = INACTIVE`) kèm mọi thành viên chưa `INACTIVE` và phiên của họ, trong một transaction. Query `revokeRanges=true\|false` (mặc định `false`): `true` thì thu hồi toàn bộ dải số của nhóm trong cùng transaction; `409` nếu nhóm đã `INACTIVE`. Đặc tả `docs/modules/02_user_group.md` mục 3.4 | ADMIN |

### 3.5. Phân hệ Quản lý Người dùng & Phân quyền (Users & Roles)

| Method | Endpoint | Quyền / Guard | Mô tả | Portal |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/users` | `user:view` | Danh sách người dùng. Query `page`, `limit`, `search`, `status` (cả hai bản); bản User chỉ trả user thuộc nhóm của người gọi; bản Admin trả toàn hệ thống, lọc tùy chọn `groupId` (chỉ bản Admin). Đặc tả `docs/modules/03_auth_user.md` mục 3.3 | USER + ADMIN |
| `GET` | `/api/v1/users/:id` | `user:view` | Chi tiết thông tin người dùng. Đặc tả `docs/modules/03_auth_user.md` mục 3.3.1 | USER + ADMIN |
| `POST` | `/api/v1/users` | `user:create` | Tạo mới tài khoản người dùng trong nhóm, kèm `roleCode`. Bản Admin bắt buộc `userGroupId`; bản User luôn tạo trong nhóm của người gọi và không nhận `userGroupId` (`400`, mục 1.1) (mặc định `REGULAR_USER`; gán `GROUP_ADMIN` cần thêm `group:manage_admin`, gán `USER_RECORDING` cần thêm `group:toggle_recording` và nhóm có `allowRecordingAccess = true`); tạo dòng `user_roles` cùng transaction. Body không có `password`: sinh mật khẩu tạm 16 ký tự trả **một lần** (`temporaryPassword`), `must_change_password = 1` (`docs/modules/03_auth_user.md` mục 3.4); trùng `username`/`email` trả `409 ACCOUNT_DUPLICATE` | USER + ADMIN |
| `PUT` | `/api/v1/users/:id` | `user:edit` | Cập nhật thông tin tài khoản người dùng (họ tên, chức danh, số điện thoại); không nhận `status`, `roleCode`, `userGroupId`, `avatarUrl`, `username`, `email` (`400`; `username`/`email` bất biến sau khi tạo) | USER + ADMIN |
| `PUT` | `/api/v1/users/:id/status` | `user:edit` | Khóa / Mở khóa tài khoản, body `{ "status": "ACTIVE" \| "LOCKED" }`; khóa thu hồi mọi phiên (`ACCOUNT_LOCKED`); `409` nếu khóa Quản trị viên nhóm đang hoạt động cuối cùng hoặc tài khoản đã `INACTIVE`. Đặc tả `docs/modules/03_auth_user.md` mục 3.7 | USER + ADMIN |
| `PUT` | `/api/v1/users/:id/reset-password` | `user:edit` | Đặt lại mật khẩu người dùng: sinh mật khẩu tạm 16 ký tự trả **một lần** (`temporaryPassword`), đặt `must_change_password = 1`, xóa khóa tạm (`failed_login_count = 0`, `locked_until = NULL`), thu hồi mọi phiên của user (`PASSWORD_CHANGED`), ghi `audit_logs` `AUTH / PASSWORD_RESET` (`action_details = { targetActorType: "USER", revokedCount }`); header `Cache-Control: no-store`. Đặc tả `docs/modules/03_auth_user.md` mục 3.8 | USER + ADMIN |
| `PUT` | `/api/v1/users/:id/role` | `group:manage_admin` hoặc `group:toggle_recording` | Đổi vai trò người dùng `{ "roleCode": "GROUP_ADMIN" \| "USER_RECORDING" \| "REGULAR_USER" }`: chuyển sang/khỏi `GROUP_ADMIN` cần `group:manage_admin` (chặn `409` hạ quyền Quản trị viên nhóm đang hoạt động cuối cùng); `REGULAR_USER` ↔ `USER_RECORDING` cần `group:toggle_recording` (sang `USER_RECORDING` cần nhóm có `allowRecordingAccess = true`, ngược lại `409`). Đặc tả `docs/modules/10_permissions_and_roles.md` mục 1.3, 3.2 | USER + ADMIN |
| `DELETE` | `/api/v1/admin/users/:id/sessions` | `user:edit` | Thu hồi mọi phiên đăng nhập của một người dùng (`REVOKED_BY_ADMIN`). Đặc tả `docs/modules/03_auth_user.md` mục 3.10 | ADMIN |
| `DELETE` | `/api/v1/users/:id` | `user:delete` | Ngừng hoạt động tài khoản (xóa mềm `status = INACTIVE`; `409` nếu là Quản trị viên nhóm cuối cùng còn hoạt động; không xóa cứng). Đặc tả `docs/modules/03_auth_user.md` mục 3.9 | USER + ADMIN |
| `GET` | `/api/v1/admin/roles` | `role:view` | Danh sách 5 vai trò cố định (lọc tùy chọn `scope=ADMIN\|USER`), mỗi vai trò kèm danh sách quyền (`code`, `name`, `category`, `groupGated`) và số tài khoản đang mang vai trò (đếm `admin_roles`/`user_roles`, chỉ tài khoản chưa `INACTIVE`). Chỉ đọc: không có API tạo/sửa/xóa vai trò hay sửa quyền của vai trò | ADMIN |

### 3.6. Phân hệ Quản lý Đầu số PABX, Dải số & Kho số máy lẻ (Prefixes & Phone Inventory)

| Method | Endpoint | Quyền / Guard | Mô tả | Portal |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/prefixes` | `prefix:view` | Danh sách các nhóm đầu số (`phone_prefix_groups`) và dải số (`phone_prefix_ranges`) theo Nhóm người dùng | USER + ADMIN |
| `GET` | `/api/v1/prefixes/:id` | `prefix:view` | Chi tiết dải số, tỷ lệ sử dụng kho số. Đặc tả `docs/modules/11_core_business_phone_numbers.md` mục 4.1.1 | USER + ADMIN |
| `GET` | `/api/v1/admin/prefix-groups` | `prefix:view` | Danh sách nhóm đầu số (`phone_prefix_groups`) kèm nhóm người dùng liên kết và số dải. Nhóm đầu số được tạo tự động cùng nhóm người dùng (`docs/01_database_schema.md` mục 4.1), không có API tạo/xóa. Đặc tả `docs/modules/11_core_business_phone_numbers.md` mục 4.6 | ADMIN |
| `PUT` | `/api/v1/admin/prefix-groups/:id` | `prefix:manage` | Body chỉ `{ name, description }`; có `code` hoặc trường khác trả `400`; ghi `audit_logs` `PREFIX / UPDATE_PREFIX_GROUP`. Đặc tả `docs/modules/11_core_business_phone_numbers.md` mục 4.6 | ADMIN |
| `POST` | `/api/v1/admin/prefixes` | `prefix:manage` | Cấp phát dải số mới cho Nhóm người dùng (Kiểm tra xung đột Overlap Check); `409 GROUP_INACTIVE` nếu nhóm người dùng của nhóm đầu số đã `INACTIVE` | ADMIN |
| `PUT` | `/api/v1/admin/prefixes/:id` | `prefix:manage` | Cập nhật dải số (body `{ rangeFrom, rangeTo, note, decisionNumber, historyNote }`, `decisionNumber` bắt buộc; không đổi được `prefix`, `prefixGroupId`, gửi giá trị khác thì `400`) (mở rộng / thu hẹp khoảng số) theo quy tắc `docs/01_database_schema.md` mục 8 (`409` nếu phần mở rộng chứa số đã thuộc dải khác; `409 GROUP_INACTIVE` nếu nhóm đã `INACTIVE`) | ADMIN |
| `DELETE` | `/api/v1/admin/prefixes/:id` | `prefix:manage` | Thu hồi dải số về kho số dùng chung theo quy tắc `docs/01_database_schema.md` mục 8 (số `ALLOCATED` về `FREE`, `RESERVED`/`LOCKED` giữ trạng thái), ghi lịch sử và nhật ký kiểm toán, rồi mới xóa dòng dải. Body tùy chọn `{ decisionNumber?, historyNote? }` ghi vào `prefix_allocation_history`, thiếu thì NULL. Được cả khi nhóm đã `INACTIVE` | ADMIN |
| `GET` | `/api/v1/prefixes/history` | `prefix:view` | Tra cứu lịch sử cấp phát / thu hồi dải số (`prefix_allocation_history`). Query `actionType`, `page`, `limit`, `groupId` (chỉ bản Admin); bản User lọc `prefix_allocation_history.user_group_id` = nhóm của người gọi (`docs/modules/11_core_business_phone_numbers.md` mục 4.5) | USER + ADMIN |
| `GET` | `/api/v1/phone-numbers/pool` | `prefix:view` | Tra cứu kho số tổng thể 90.000 số máy 5 số PABX (`v_phone_numbers_detail` / `phone_numbers` - hỗ trợ lọc theo nhóm, dải số, trạng thái FREE/ALLOCATED/RESERVED/LOCKED, số máy; cấu trúc bảng vật lý tuân thủ chuẩn hóa 3NF chỉ giữ `range_id`) | USER + ADMIN |
| `GET` | `/api/v1/admin/phone-numbers/pool/summary` | `prefix:view` | Số lượng số trong kho theo trạng thái (`FREE`, `ALLOCATED`, `RESERVED`, `LOCKED`) và tổng 90.000 | ADMIN |
| `PUT` | `/api/v1/admin/phone-numbers/:number` | `prefix:manage` | Body `{ displayName?, description?, status?: "LOCKED" \| "RESERVED" \| "NORMAL" }`; `NORMAL` = bỏ khóa/bỏ dự phòng (về `ALLOCATED` nếu có `range_id`, ngược lại `FREE`); lịch sử `phone_number_range_history`: đổi trạng thái ghi `LOCK`/`UNLOCK`/`RESERVE`/`UNRESERVE` (chuyển thẳng giữa `RESERVED` và `LOCKED` ghi 2 dòng, vd. `UNRESERVE` rồi `LOCK`, `docs/01_database_schema.md` mục 8), đổi thông tin ghi 1 dòng `UPDATE_INFO` mỗi request | ADMIN |
| `GET` | `/api/v1/phone-numbers/history` | `prefix:view` | Tra cứu lịch sử biến động gán số vào dải & điều chuyển (`phone_number_range_history`). Query `phoneNumber`, `actionType`, `page`, `limit`, `groupId` (chỉ bản Admin); bản User lọc `phone_number_range_history.user_group_id` = nhóm của người gọi (`docs/modules/11_core_business_phone_numbers.md` mục 4.4) | USER + ADMIN |

### 3.7. Phân hệ Tra cứu Log CDR & Nghe/Tải Ghi âm (CDR & Audio)

> [!IMPORTANT]
> Toàn bộ các API phân hệ CDR hoạt động trên bảng dữ liệu làm giàu `cdr_enriched` và áp dụng mô hình phân quyền **Group-Based Data Isolation** kết hợp **2-Tier Recording Access Gate**:
> - User Portal tự động bị ràng buộc `WHERE (caller_group_id = :userGroupId OR called_group_id = :userGroupId)`.
> - Admin Portal có quyền truy cập 100% bản ghi (kể cả bản ghi chưa gán nhóm) và hỗ trợ tham số `groupId`.
> - **Chốt chặn Tầng 1 (Quyền nhóm)**: Nếu `user_groups.allow_recording_access = 0`, cột ghi âm bị ẩn trên bảng chính, API stream và download bị chặn (`403 GROUP_RECORDING_DISABLED`).
> - **Chốt chặn Tầng 2 (Vai trò)**: Khi nhóm được cấp phép, chỉ vai trò có `cdr:listen_audio`/`cdr:download_audio` (`GROUP_ADMIN`, `USER_RECORDING`) được nghe/tải; `REGULAR_USER` bị chặn `403 FORBIDDEN_PERMISSION`. Admin chỉ xét vai trò, không qua Tầng 1.

| Method | Endpoint | Quyền / Guard | Mô tả | Portal |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/cdr` | `cdr:view` | Tra cứu lịch sử cuộc gọi từ `cdr_enriched` (luôn lọc theo `fromDate`/`toDate`, thiếu thì mặc định 7 ngày gần nhất, tối đa 31 ngày; mặc định trong `retention_online_months`, Admin dùng `includeArchive=true` để xem dữ liệu lưu trữ; Cô lập dữ liệu nhóm; nếu nhóm chưa cấp quyền ghi âm thì ẩn cột và trả về hasAudio=false; Admin xem toàn bộ kèm badge nhóm và lọc `groupId`) | USER + ADMIN |
| `GET` | `/api/v1/cdr/:id` | `cdr:view` | Xem chi tiết 87 tham số kỹ thuật + thông tin nhóm (Kiểm tra cô lập nhóm với User Portal; nếu nhóm chưa kích hoạt ghi âm thì thay player bằng thông báo) | USER + ADMIN |
| `GET` | `/api/v1/cdr/export` | `cdr:export` | Xuất danh sách cuộc gọi (Excel / CSV, query `format=xlsx\|csv`, thiếu thì `xlsx`) theo đúng bộ lọc của `GET /api/v1/cdr` (chỉ leg chính, cô lập nhóm; không kèm file ghi âm) | USER + ADMIN |
| `GET` | `/api/v1/cdr/:id/audio/stream` | `cdr:listen_audio` | Stream phát âm thanh HTTP 206 (`PermissionsGuard`: quyền nhóm `allowRecordingAccess` rồi quyền vai trò; service kiểm tra cô lập nhóm) | USER + ADMIN |
| `GET` | `/api/v1/cdr/:id/audio/download` | `cdr:download_audio` | Tải về file ghi âm (.wav) (`PermissionsGuard`: quyền nhóm `allowRecordingAccess` rồi quyền vai trò; service kiểm tra cô lập nhóm) | USER + ADMIN |

### 3.8. Phân hệ Phân tích Chất lượng thoại QoS (QoS Debug & Analytics)

> [!NOTE]
> `/qos/summary`, `/qos/disconnection-codes` là số liệu tổng hợp, chỉ đọc `stats_*`. `/qos/debug-table` là danh sách từng leg, đọc `cdr_enriched` có khoảng thời gian bắt buộc và phân trang (nguyên tắc tại `docs/01_database_schema.md` mục 15).

| Method | Endpoint | Quyền / Guard | Mô tả | Portal |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/qos/debug-table` | `qos:view` (bộ lọc `disconnectionCode`, `codec`, `minMos`/`maxMos` cần thêm `cdr:filter_advanced`) | Bảng phân tích QoS chi tiết từng phiên đàm thoại gần đây (đọc từ `cdr_enriched`); bản Admin nhận `groupId` tùy chọn (chỉ truyền khi xem một nhóm). Đặc tả `docs/modules/13_core_business_qos_analysis.md` mục 3.1 | USER + ADMIN |
| `GET` | `/api/v1/qos/summary` | `qos:view` | Thống kê tỷ lệ ASR, NER, phân khúc điểm MOS G.107, R-Value trung bình (`avgRValue`), MOS riêng phía gọi/phía nhận (`avgCallerMos`, `avgCalledMos`), Packet Loss, Jitter, SIP Delays (đọc từ `stats_daily`/`stats_hourly`, cô lập theo nhóm) | USER + ADMIN |
| `GET` | `/api/v1/qos/disconnection-codes` | `qos:view` | Thống kê phân bố mã ngắt kết nối SIP (200, 486, 487, 503...) và bên cúp máy (đọc từ `stats_daily`/`stats_hourly`) | USER + ADMIN |
| `GET` | `/api/v1/admin/qos/thresholds` | `qos:view` | Lấy cấu hình ngưỡng cảnh báo MOS, Jitter, Packet Loss | ADMIN |
| `PUT` | `/api/v1/admin/qos/thresholds` | `qos:manage` | Cập nhật ngưỡng cảnh báo QoS: body đủ 5 `metricName`; `operator` cố định theo seed (`docs/01_database_schema.md` mục 10), gửi khác trả `400`; `RTT_DELAY_MS` gửi `isEnabled: true` trả `400`. Đặc tả `docs/modules/13_core_business_qos_analysis.md` mục 3.3 | ADMIN |

### 3.9. Phân hệ Thống kê Thời lượng & Lưu lượng (Call Duration & Traffic)

> [!NOTE]
> Phần lớn cuộc gọi là mạng thoại nội bộ dùng riêng EVN giữa các máy lẻ 5 số `[H][C][XXX]` (kho 10000–99999). Dữ liệu thật vẫn có số ngoài kho (`Anonymous`, `0xxxx` dịch vụ đặc biệt, số di động, số không đủ 5 chữ số); phía đó có nhóm sở hữu = NULL. Phạm vi nhóm bóc tách 3 hướng: Gọi đi (`calls_outbound`, phía nhận thuộc nhóm khác hoặc không có nhóm), Gọi đến (`calls_inbound`), Nội bộ nhóm (`calls_intra_group`). Phạm vi toàn hệ thống chia theo `call_type`: `calls_intra_group`, `calls_inter_group`, `calls_unassigned`. Không cộng các nhóm để ra tổng hệ thống (quy tắc tại `docs/01_database_schema.md` mục 15). Phân loại lưu tại `cdr_enriched.call_type`, thời lượng tại `cdr_enriched.answered_duration_sec` (chỉ leg chính `is_primary_leg = 1`).

| Method | Endpoint | Quyền / Guard | Mô tả | Portal |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/traffic/summary` | `cdr:view` | Thống kê sản lượng 3 chiều và tổng thời lượng đàm thoại thực tế theo kỳ theo Nhóm người dùng (đọc từ `stats_daily`/`stats_hourly`); bản Admin phân trang danh sách nhóm (`page`, `limit` ≤ 100, `sort`, `order`) | USER + ADMIN |
| `GET` | `/api/v1/traffic/records` | `cdr:view` | Danh sách chi tiết cuộc gọi kèm phân loại lưu lượng và thời lượng (đọc `cdr_enriched` với `is_primary_leg = 1`: `caller_group_id`, `called_group_id`, `call_type`, `answered_duration_sec`) | USER + ADMIN |

### 3.10. Phân hệ Báo cáo & Xuất dữ liệu (Reports & Export - Zero CDR Scan)

> [!NOTE]
> Số liệu báo cáo hoàn toàn bóc tách theo Nhóm người dùng (`groupId`). Cây tổ chức đóng vai trò tham chiếu danh mục phân cấp.

| Method | Endpoint | Quyền / Guard | Mô tả | Portal |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/reports/summary` | `report:view` | Xem trước dữ liệu báo cáo tổng hợp lưu lượng & chất lượng (đọc tức thì từ `stats_daily`, riêng `period=today` đọc `stats_hourly`; lọc theo `groupId`). Đặc tả `docs/modules/15_core_business_reports_export.md` mục 2.1 | USER + ADMIN |
| `POST` | `/api/v1/reports/export/excel` | `report:export` | Xuất file Excel (.xlsx) chuẩn biểu mẫu EVN từ cùng dữ liệu của `/reports/summary` (`stats_daily`, riêng `period=today` đọc `stats_hourly`) theo `groupId` (thời gian xử lý $< 1\text{s}$) | USER + ADMIN |
| `POST` | `/api/v1/reports/export/pdf` | `report:export` | Xuất file PDF chuẩn khổ A4 từ cùng dữ liệu của `/reports/summary` (`stats_daily`, riêng `period=today` đọc `stats_hourly`) theo `groupId` (thời gian xử lý $< 1\text{s}$) | USER + ADMIN |

### 3.11. Phân hệ Bảng điều khiển & Tái tính toán Thống kê (Dashboard & Stats Management)

| Method | Endpoint | Quyền / Guard | Mô tả | Portal |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/dashboard/stats` | Authenticated | Dữ liệu KPI Dashboard (Hôm nay: đọc `stats_hourly`; Tuần/Tháng/Khoảng ngày: đọc `stats_daily`). Cô lập nhóm tự động | USER + ADMIN |
| `GET` | `/api/v1/dashboard/recent-calls` | Authenticated | Tối đa `limit` (mặc định 5, tối đa 20) cuộc gọi gần nhất trong 24 giờ: leg chính, cô lập nhóm, sắp `Created` giảm dần; trường giống item của `GET /cdr` (gồm `callStatus`, `disconnectionCode`, `mos`, `callType`, `direction`, `durationSec`) | USER + ADMIN |
| `GET` | `/api/v1/admin/dashboard/groups` | Authenticated | Danh sách nhóm theo lưu lượng trong kỳ (`period`, `sort` = `totalCalls`\|`totalDurationSec`\|`asrPercentage`\|`avgMos`, `order`, `page`, `limit` ≤ 100): mỗi dòng `groupId`, `groupCode`, `groupName`, `ranges` (mảng `{ rangeFrom, rangeTo }` các dải hiện có của nhóm; frontend tự ghép nhãn), `totalCalls`, `totalDurationSec`, `asrPercentage`, `avgMos`; đọc từng dòng nhóm của `stats_*`, không có dòng tổng cộng | ADMIN |
| `GET` | `/api/v1/dashboard/charts` | Authenticated | Dữ liệu biểu đồ phân bố 24 giờ trong ngày (đọc `stats_hourly`) hoặc biến thiên theo ngày (đọc `stats_daily`) | USER + ADMIN |
| `POST` | `/api/v1/admin/stats/recalculate` | `system:manage` | Tính lại thống kê **bất đồng bộ**: body `{ "fromDate": "YYYY-MM-DD", "toDate": "YYYY-MM-DD" }` (tối đa 366 ngày; `400` nếu `fromDate` trước mốc `:purgeBoundary` = `cdr_enrichment_state.cdr_purged_before` (ngày đầu còn CDR sau các lần `DROP PARTITION`; NULL thì không chặn), vì CDR kỳ đó đã bị xóa, `docs/01_database_schema.md` mục 15.0 bước 5); đẩy mọi khung giờ trong khoảng vào `stats_recompute_queue`, trả `202 { "queuedHours": n }`; job tổng hợp xử lý ở các lần chạy kế tiếp, cho mọi phạm vi; ghi `audit_logs` `SYSTEM / RECALCULATE_STATS` | ADMIN |

### 3.12. Phân hệ Thông báo & Cài đặt hệ thống (Notifications & Settings)

| Method | Endpoint | Quyền / Guard | Mô tả | Portal |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/notifications` | Authenticated | Danh sách thông báo của người dùng/admin | USER + ADMIN |
| `PUT` | `/api/v1/notifications/:id/read` | Authenticated | Đánh dấu thông báo đã đọc | USER + ADMIN |
| `POST` | `/api/v1/admin/notifications` | `system:manage` | Admin soạn thông báo `SYSTEM_MAINTENANCE`/`GENERAL` (`title`, `content`, `severity` = `INFO` \| `WARNING` \| `CRITICAL`, `CRITICAL` xếp email vào hàng đợi `email_status = PENDING`, job `email-dispatch` của worker gửi, `docs/01_database_schema.md` mục 10, 11; API không gửi email; `target` = `ALL_ADMINS` \| `ALL_USERS` \| `GROUP:{id}` \| `EVERYONE`); tạo một dòng người nhận cho mỗi tài khoản `ACTIVE` (người dùng chỉ thuộc nhóm `ACTIVE`); `GROUP:{id}` của nhóm `INACTIVE` trả `409 GROUP_INACTIVE`; ghi `audit_logs` `SYSTEM / CREATE_NOTIFICATION`; trả `201` với `data = { id, recipientCount }` | ADMIN |
| `PUT` | `/api/v1/notifications/mark-all-read` | Authenticated | Đánh dấu tất cả thông báo đã đọc | USER + ADMIN |
| `GET` | `/api/v1/admin/settings/system` | `system:manage` | Lấy cấu hình hệ thống (Quy tắc phân tích, retention, bảo trì...) | ADMIN |
| `PUT` | `/api/v1/admin/settings/system` | `system:manage` | Lưu cấu hình hệ thống. Key bí mật (`smtp_password`) thiếu hoặc bằng mặt nạ `********` thì giữ giá trị cũ, `""` thì xóa. Giảm `retention_archive_months` phải kèm `confirmPurge: true`, thiếu thì `409 RETENTION_PURGE_CONFIRM_REQUIRED` (`docs/modules/07_system_settings.md` mục 3.2) | ADMIN |
| `POST` | `/api/v1/admin/settings/reload-cache` | `system:manage` | Nạp lại cache sở hữu số và cache setting trên mọi tiến trình backend (API và worker, qua `cache_version`) | ADMIN |
| `GET` | `/api/v1/admin/system/jobs` | `system:manage` | Tình trạng các job nền (`worker_job_status`, kèm `isStale`) và số liệu tiến trình làm giàu (watermark, số bản ghi cách ly, kích thước hàng đợi tính lại, số email chờ gửi). Đặc tả `docs/modules/07_system_settings.md` mục 3.5 | ADMIN |
| `GET` | `/api/v1/admin/system/enrichment-errors` | `system:manage` | Danh sách CDR bị cách ly khi làm giàu (`cdr_enrichment_errors`), phân trang. Đặc tả `docs/modules/07_system_settings.md` mục 3.6 | ADMIN |
| `POST` | `/api/v1/admin/system/enrichment-errors/:cdrId/retry` | `system:manage` | Làm giàu lại một CDR bị cách ly; `404` nếu không có trong danh sách, `422 ENRICHMENT_FAILED` nếu vẫn lỗi; ghi `audit_logs` `SYSTEM / RETRY_ENRICHMENT`. Đặc tả `docs/modules/07_system_settings.md` mục 3.7 | ADMIN |

---

## 4. WebSocket Gateway Events (`/notifications`, `/admin/notifications`)

Dùng cho việc bắn thông báo tức thời về giao diện người dùng:

- **Client Connect**: Socket.IO với **hai namespace tách theo portal**: User kết nối `/notifications` (xác minh bằng `JWT_USER_SECRET`), Admin kết nối `/admin/notifications` (xác minh bằng `JWT_ADMIN_SECRET`). Access Token gửi trong payload `auth: { token }` lúc handshake, **không** đặt trên query string. Khi token hết hạn, client refresh rồi kết nối lại.
- **Room**: `user:{id}` và `group:{groupId}` ở namespace User; `admin:{id}` và `admins` ở namespace Admin.
- **Server Events**:
  - `notification:new`: Khi có thông báo mới (sự cố QoS, cảnh báo tổng đài, thông báo hệ thống). Payload cùng cấu trúc phần tử của `GET /notifications` (`docs/modules/06_notifications.md` mục 3.1) để frontend chèn thẳng vào danh sách: `{ id, type, severity, title, content, isRead: false, createdAt, metadata }`. Không có `timeAgo`: frontend tự tính từ `createdAt`.
