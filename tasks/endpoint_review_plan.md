# KẾ HOẠCH RÀ SOÁT & TINH CHỈNH TỪNG API ENDPOINT (API + CSDL + TEMPLATES)

> **Ngày lập**: 2026-11-04 · **Nhánh làm việc**: `docs/db-design-readiness`
> **Cách dùng**: mỗi hội thoại mới làm **1 endpoint** (một dòng ở mục 5) theo quy trình mục 3, xong thì cập nhật mục 5, mục 6 và commit.
> **Lần rà soát trong `DB_AUDIT_CONSOLIDATED.md`**: toàn bộ chiến dịch này là **Lần 26** (mục 1 và mục 3.6 của file đó).

---

## 0. Câu lệnh mở hội thoại mới (copy & dán)

Làm endpoint tiếp theo:

```text
Đọc tasks/endpoint_review_plan.md rồi làm endpoint tiếp theo (dòng ⬜ đầu tiên ở mục 5) theo đúng quy trình mục 3. Xong thì cập nhật tiến độ (mục 5, 6), ghi phát hiện vào DB_AUDIT_CONSOLIDATED.md mục 3.6 và commit.
```

Làm một endpoint chỉ định (thay `G04` bằng ID cần làm):

```text
Đọc tasks/endpoint_review_plan.md rồi làm endpoint G04 theo đúng quy trình mục 3. Xong thì cập nhật tiến độ (mục 5, 6), ghi phát hiện vào DB_AUDIT_CONSOLIDATED.md mục 3.6 và commit.
```

---

## 1. Mục tiêu & phạm vi

Mỗi endpoint được rà và tinh chỉnh **đồng thời ở 3 lớp**, sao cho một AI sinh code đọc tài liệu là làm đúng, và template hiển thị đúng dữ liệu API trả:

| Lớp | Nguồn chuẩn (được sửa) | Đối chiếu |
|---|---|---|
| **API** | `docs/02_api_contracts.md` (dòng endpoint) + module doc `docs/modules/Mxx` (đặc tả chi tiết) | `docs/00_overview_and_architecture.md` §5.3 (route, quyền màn hình) |
| **CSDL** | `docs/01_database_schema.md` (DDL, COMMENT, quy tắc), seed ở M10 §2.1 | Số liệu thật `DB_AUDIT_CONSOLIDATED.md` §5 |
| **Giao diện** | `templates/admin/*`, `templates/member/*` (HTML/CSS/JS mẫu) | `docs/03_ui_design.md` (quy chuẩn UI), `DB_AUDIT_CONSOLIDATED.md` §2.2 (danh sách sửa template còn nợ) |

**Ngoài phạm vi**: `backend/`, `frontend/` (chưa sinh code); `docs/intent/` (nhật ký lịch sử, không sửa); báo cáo cũ (cấm đọc theo `AGENTS.md`).

**Nguyên tắc ưu tiên khi mâu thuẫn**: `docs/` > `DB_AUDIT_CONSOLIDATED.md` > `templates/`. Template phải theo docs, không ngược lại — trừ khi template lộ ra nhu cầu nghiệp vụ thật mà docs thiếu; khi đó **hỏi chủ dự án** trước khi thêm vào docs.

---

## 2. Chú giải trạng thái

| Ký hiệu | Nghĩa |
|---|---|
| ⬜ | Chưa làm |
| 🔄 | Đang làm (hội thoại đang mở; ghi ngày vào cột Ghi chú) |
| ✅ | Xong cả 3 lớp, đã commit |
| ⏸ | Tạm dừng, chờ chủ dự án trả lời (ghi câu hỏi vào mục 7) |
| 🔁 | Đã xong nhưng cần rà lại vì một endpoint làm sau đã đổi thứ nó phụ thuộc (ghi lý do) |

---

## 3. Quy trình chuẩn cho mỗi hội thoại

### Bước 0 – Nhận việc

1. Đọc file này (mục 4 quy ước chung, mục 7 câu hỏi đang mở).
2. Chọn endpoint: dòng ⬜ đầu tiên ở mục 5 (hoặc ID được chỉ định). Bỏ qua dòng 🔁 trừ khi được chỉ định — dòng 🔁 làm lại theo cùng quy trình.
3. Kiểm tra `git status`: nếu cây làm việc còn thay đổi chưa commit **không phải của mình**, dừng lại hỏi chủ dự án trước khi sửa file.
4. Đổi trạng thái dòng sang 🔄 kèm ngày.

### Bước 1 – Thu thập ngữ cảnh (chỉ đọc)

- Dòng endpoint trong `02` §3.x và mục chi tiết trong module doc (cột "Module" ở mục 5).
- Các bảng CSDL liên quan trong `01` (cột "CSDL chính" chỉ là gợi ý — tự grep tên bảng/cột để tìm đủ).
- Route/màn hình/quyền gọi endpoint này trong `00` §5.3.3, §5.3.4 (và bảng "mục/thành phần" sau §5.3.3).
- Template (cột "Template"): HTML (form, bộ lọc, cột bảng, modal, nút), JS (dữ liệu mock, tên trường, hàm gọi giả lập, xử lý lỗi), CSS chỉ khi cần.
- `DB_AUDIT_CONSOLIDATED.md`: §2.2 (việc template còn nợ cho file này), §2.3 (quy tắc service liên quan), §2.4 (C-xx/I-xx liên quan), các R-xx đã chốt có nhắc endpoint — **không đề xuất lại điều đã bị từ chối** (cuối §3.5).
- Tìm mọi nơi khác nhắc endpoint: `grep -rn "<path>" docs templates`.

### Bước 2 – Rà lớp API (checklist)

- [ ] Method, path, tên tài nguyên đúng chuẩn §1.1; cột Portal đúng; bản User/Admin (nếu `USER + ADMIN`) khác nhau đúng chỗ (cô lập nhóm, tham số riêng Admin → `400` ở route User).
- [ ] Guard + mã quyền tồn tại trong seed 25 mã (M10 §2.1) và khớp `meta.permissions` của màn hình gọi nó; quyền nhóm (`allowRecordingAccess`…) nếu có.
- [ ] Request: đủ trường, kiểu, bắt buộc/tùy chọn, mặc định, độ dài tối đa = độ dài cột, enum (chữ hoa), trường lạ/không được sửa → `400`; query phân trang/lọc/sắp xếp theo §2.2.
- [ ] Response: đúng envelope §2.1/§2.2, tên trường camelCase, kiểu/độ chính xác, `null` khi nào, không trả trường nhạy cảm, không trả chuỗi đã định dạng (R16-07).
- [ ] Lỗi: mọi nhánh lỗi có mã HTTP + `errorCode` thuộc danh mục §2.3 (`400/401/403/404/409/422/423`).
- [ ] Hiệu ứng phụ: `audit_logs` (`resource_name`/`action` có trong enum), thu hồi phiên, thông báo, `cache_version`, transaction & thứ tự khóa (§2.3 của file tổng hợp).
- [ ] Hiệu năng: lọc/sắp xếp có index phục vụ; giới hạn khoảng ngày, `limit` tối đa; không đọc bảng `cdr` thô ở API.
- [ ] Ví dụ request/response trong module doc khớp tất cả các điểm trên.

### Bước 3 – Rà lớp CSDL (checklist)

- [ ] Mỗi trường request/response ↔ cột nguồn: kiểu, độ dài, `NULL`, enum, đơn vị (ms/giây, ×100…).
- [ ] Index cho mọi điều kiện lọc/sắp xếp/khóa duy nhất của endpoint; FK và `ON DELETE` đúng hành vi xóa của endpoint.
- [ ] Các dòng phải tạo/sửa cùng transaction có đủ cột; giá trị mặc định hợp lý.
- [ ] Nếu đổi DDL: sửa `01`, ghi vào `DB_AUDIT_CONSOLIDATED.md` §2.1 (cần chạy lại trên MariaDB 10.6), cập nhật số bảng/seed nếu đổi.

### Bước 4 – Rà & sửa lớp giao diện (checklist)

- [ ] Template hiển thị/gửi **đúng và đủ** trường API (không có ô nhập cho trường API không nhận; không hiển thị dữ liệu API không trả).
- [ ] Bộ lọc, phân trang, sắp xếp khớp query của endpoint; giá trị enum và nhãn tiếng Việt khớp docs.
- [ ] Ẩn/hiện/khóa nút theo quyền; route User không có điều khiển dành cho Admin.
- [ ] Hiển thị trạng thái lỗi chính (`409`, `403`, `422`, `423`…) và trạng thái rỗng/đang tải.
- [ ] Dữ liệu mock trong JS có **đúng cấu trúc response** (tên trường, kiểu) để làm mẫu sinh code Vue.
- [ ] Theo quy chuẩn `03` (token màu, component class, Do's/Don'ts); không có Role Simulator.
- [ ] Gạch/cập nhật dòng tương ứng ở `DB_AUDIT_CONSOLIDATED.md` §2.2 nếu đã sửa xong.
- [ ] Endpoint không có template (vd. `/traffic/*`): ghi rõ màn hình nào dùng; nếu cần template mới thì **hỏi chủ dự án** trước.

### Bước 5 – Hỏi chủ dự án (nếu cần)

- Mọi điểm docs **chưa quy định** hoặc phải chọn giữa nhiều cách: hỏi bằng câu hỏi có lựa chọn (kèm khuyến nghị), không tự quyết.
- Chưa có câu trả lời thì ghi vào mục 7, đặt dòng ⏸, phần đã chắc chắn vẫn sửa.

### Bước 6 – Sửa

- Sửa `02`, module doc, `01`, `03`, templates theo kết quả bước 2–5. Mỗi thay đổi phải nhất quán ở **mọi** nơi nhắc tới (grep lại).
- Thay đổi quy ước dùng chung (ảnh hưởng nhiều endpoint) → ghi vào mục 4 của file này; các endpoint ✅ bị ảnh hưởng chuyển 🔁 kèm lý do.

### Bước 7 – Ghi nhận & commit

1. `DB_AUDIT_CONSOLIDATED.md` mục 3.6: thêm các phát hiện mã `E-<ID>-<nn>` (vd. `E-A01-01`), cột: ID · Mức (Major/Minor) · Phát hiện · Cách sửa. Không phát hiện gì thì ghi một dòng "không có phát hiện". Cập nhật dòng "Lần 26" ở mục 1 (đếm tiến độ), mục 2 nếu phát sinh việc mở.
2. File này: dòng mục 5 → ✅ (hoặc ⏸/🔁), điền cột Commit; thêm một dòng nhật ký ở mục 6; cập nhật số liệu tiến độ đầu mục 5.
3. Commit một lần cho endpoint, chỉ add các file đã sửa (không `git add -A`):
   `docs(api): rà soát <ID> <METHOD> <path>` — rồi điền hash vào cột Commit (sửa nhỏ, có thể gộp vào commit kế tiếp hoặc commit riêng `docs: ghi commit <ID>`).
4. Không push trừ khi chủ dự án yêu cầu.

---

## 4. Quy ước chung đã chốt trong chiến dịch

> Ghi các quyết định có hiệu lực cho **nhiều endpoint** để hội thoại sau áp dụng thống nhất. Mỗi dòng: ngày · endpoint phát sinh · quy ước · nơi ghi trong docs.

| Ngày | Từ | Quy ước | Ghi ở |
|---|---|---|---|
| 2026-11-04 | A01 | Mã lỗi `400` = `VALIDATION_ERROR` (`errors = { field: [..] }`); `401` = `INVALID_CREDENTIALS` cho đăng nhập sai (một mã cho mọi trường hợp), `UNAUTHORIZED` cho token/cookie. Mọi endpoint ghi rõ mã lỗi theo danh mục này | `02` §2.3 |
| 2026-11-04 | A01 | `templates/` đã đưa vào git (commit `67f0cdb`); mỗi endpoint commit kèm file template đã sửa | — |
| 2026-11-04 | A01 | Template mock gọi API bằng hàm trả Promise với **đúng** envelope thành công/lỗi; không ghi token/tài khoản vào `localStorage`/`sessionStorage` (ghi chú chỗ store Pinia) | `templates/admin/login.js` (mẫu) |
| 2026-11-04 | A02 | Mọi `401` của `refresh` (và `logout`) xóa cookie; cookie Refresh Token `Max-Age` = số giây còn lại tới `expires_at` khi `auth_sessions.remember_me = 1`; client không áp refresh-khi-`401` cho `/auth/login`, `/auth/refresh`, chỉ gửi lại một lần. Mẫu client phiên: `window.adminSession` | `01` §6.1, M03 §3.2.1, `00` §5.3.2, `templates/admin/main.js` |
| 2026-11-04 | A03 | Đăng xuất phía client luôn xóa store, ngắt Socket.IO và về login của cổng dù API lỗi; mẫu `window.adminSession.logout()`. Endpoint thu hồi phiên theo cookie phải khớp `actor_type`/`actor_id` của token và đi theo chuỗi `ROTATED` | M03 §3.2.1, `templates/admin/main.js` |
| 2026-11-04 | A04 | Header `AdminLayout`/`MemberLayout` đọc `fullName`, `roleName`, `avatarUrl` từ store (`/auth/me` hoặc response đăng nhập), không cứng chữ; `/auth/me` chỉ gọi khi store chưa có tài khoản; tài khoản không còn `ACTIVE` → `401 UNAUTHORIZED` (áp cho U04). Mẫu `window.adminSession.loadMe`/`renderAccount` | M04 §3.1.1, `templates/admin/main.js` |
| 2026-11-04 | A06 | `phoneNumber` của `admins`/`users` ở mọi API: cắt khoảng trắng, rỗng/`null` → `NULL`, còn lại khớp `^(?=.*[0-9])[0-9+\-.() ]{1,30}$`, sai `400`. Tự sửa hồ sơ: cập nhật một phần (ít nhất một trường), response = hồ sơ đủ trường như `GET`, không có trường nào đổi thì `200` không ghi CSDL/audit, `changedFields` chỉ gồm trường thực sự đổi. Sau khi lưu, frontend cập nhật `fullName`/`avatarUrl` trong store để header đổi ngay (mẫu `adminSession.updateAccount`); lỗi `400` hiện dưới ô theo `errors[field]` | `02` §2, M09 §3.2, `templates/admin/{main,profile}.js` |
| 2026-11-04 | A05 | API hồ sơ (`GET .../profile`) không trả `permissions` (quyền chỉ từ store của `/auth/me`/đăng nhập), trả thêm `lastLoginAt`, `passwordChangedAt`, `createdAt`; cùng quy tắc `401` khi không còn `ACTIVE`, token `PASSWORD_CHANGE_ONLY` → `403`. Màn hình tải dữ liệu có trạng thái tải/lỗi + nút thử lại, mock gọi qua `adminSession.request` và đổ vào phần tử `data-field`; template không có ô cho trường không có cột/API | M09 §3.1, `templates/admin/profile.js` |
| 2026-11-04 | A07 | Access Token đầy đủ mang claim `sid` = `auth_sessions.id` (đăng nhập, refresh kể cả nhánh ân hạn, đổi mật khẩu); API ngoài `Path` cookie xác định phiên hiện tại bằng `sid`. Tự đổi mật khẩu (cả hai cổng, đặc tả chung M09 §3.3): sai `currentPassword` → `400` (`errors.currentPassword`) + tăng bộ đếm khóa tạm chung với đăng nhập, đang khóa → `423`; mật khẩu tối đa 72 byte UTF-8, 3/4 loại ký tự (định nghĩa ở `01` §6.1). Màn hình bị buộc đổi: bố cục riêng không sidebar; mẫu `adminSession.setAccessToken`/`getAccount`, `change-password.html?forced=1` | `01` §6.1, `02` §2.3, M03, M04, M09 §3.3, §5, `templates/admin/{main,change-password,login}.js` |
| 2026-11-04 | A08 | Ảnh đại diện (hai cổng, đặc tả chung M09 §3.2.1): volume chung `AVATAR_STORAGE_DIR`, Nginx phục vụ `/media/avatars/<uuid>.<png\|jpg>` (không token), cột `avatar_url` lưu đường dẫn tương đối; một phần multipart `file` ≤ 2 MB PNG/JPEG theo magic bytes, mã hóa lại 256×256 bỏ metadata; quá 2 MB → `400` (Nginx `client_max_body_size 3m`); response = hồ sơ đủ trường như `GET`; chưa có API gỡ ảnh. Ví dụ `avatarUrl` trong docs dùng `/media/avatars/...` hoặc `null`, không dùng dịch vụ ngoài. Mẫu upload `FormData` + `adminSession.updateAccount({ avatarUrl })` | `00` §5.1–5.3, `01` (COMMENT `avatar_url`), M08 §3.3, M09 §3.2.1, `templates/admin/profile.js` |
| 2026-11-05 | A09 | Thiết lập giao diện (hai cổng): nạp **một lần khi vào cổng** (sau khi store có tài khoản) vào store `preferencesAdmin`/`preferencesUser`, lỗi khác `401` không chặn (dùng mặc định DDL), đăng xuất xóa store; chỉ cache `theme` ở `localStorage` (`adminTheme`/`memberTheme`) chống nháy, không lưu trường khác. `GET` không có dòng `user_settings` → mặc định, không chèn; `dashboardWidgets` (Admin) luôn đủ 6 phần tử do backend chuẩn hóa. Màn hình cài đặt chỉ có điều khiển cho đúng các trường API. Mẫu `adminSession.loadPreferences`/`getPreferences`/`setPreferences` | M09 §3.6, §5.2, M08 §3.5, `03` §1, `templates/admin/{main,user-settings}.js` |
| 2026-11-05 | A10 | Lưu thiết lập giao diện (hai cổng): `PUT` cập nhật một phần (ít nhất một trường, không `null`, không ép kiểu), response đủ trường như `GET`, không ghi `audit_logs`, upsert theo `uniq_user_settings` chỉ cột đã gửi. Frontend **áp ngay, lỗi thì hoàn tác**: gửi chỉ trường vừa đổi, khóa điều khiển đang gửi, lỗi trả các trường đó về giá trị cũ + toast, không có nút "Lưu"; nút theme ở header lưu qua API, nút thu gọn sidebar không lưu. Mẫu `adminSession.savePreferences` | M09 §3.7, M08 §3.5, `templates/admin/{main,user-settings}.js` |
| 2026-11-05 | A11 | Nhãn tiếng Việt của mã `audit_logs.action` do frontend ánh xạ theo **một** bảng (M09 §5.1, mẫu `activityLabel` trong `templates/admin/profile.js`), mã chưa có nhãn hiện nguyên mã; API nhật ký chỉ trả mã. Danh sách cố định không phân trang trả `data` là mảng (không có khung §2.2), vẫn `400` khi có query. Khối phụ trên một màn hình tải độc lập với khối chính (trạng thái tải/lỗi/rỗng riêng) | M09 §3.4, §5.1, `templates/admin/profile.js` |
| 2026-11-05 | A12 | Phiên hiện tại (`isCurrent` của danh sách phiên, chặn thu hồi phiên hiện tại) xác định từ claim `sid` của Access Token, đi chuỗi `replaced_by_session_id` ≤ 5 bước, **không** từ cookie (áp cho A13, U09, U10). `auth_sessions.logged_in_at` giữ thời điểm đăng nhập qua các lần xoay vòng; API phiên trả `loggedInAt`, `lastActiveAt`, `expiresAt`. Tên thiết bị do frontend rút từ `userAgent` (hàm nội bộ, mẫu `describeUserAgent`) | `01` §6.1, M09 §3.5, M08 §3.6, `templates/admin/profile.js` |
| 2026-11-05 | A13 | `404` dùng `errorCode = NOT_FOUND` mặc định (tài nguyên theo tham số đường dẫn không tồn tại, hoặc của tài khoản khác mà người gọi không được biết là có — cùng thông điệp; route không tồn tại), mã riêng chỉ khi client cần phân biệt (`RECORDING_FILE_NOT_FOUND`); bản ghi nhóm khác mà route User được biết là có vẫn `403 FORBIDDEN_SCOPE_ACCESS`. Lỗi nghiệp vụ không có mã riêng trong danh mục dùng `400 VALIDATION_ERROR` + `errors.<trường>` (vd. `errors.id`). Thao tác nguy hiểm trên một dòng danh sách: hộp xác nhận `ConfirmModal` (`03` §6.6) nêu đối tượng, khóa nút khi gửi, xong thì **tải lại** danh sách (không xóa dòng tại chỗ). Thu hồi phiên không đẩy thiết bị ra ngay (Access Token còn hạn ≤ `security_access_token_minutes`) | `02` §2.3, M09 §3.5.2, `templates/admin/profile.{html,js}` |
| 2026-11-05 | A14 | API thu hồi hàng loạt / thao tác quản trị trên tài khoản khác: chỉ ghi `audit_logs` khi thực sự đổi dữ liệu (`revokedCount > 0`), `resource_id` = id tài khoản đích; chặn `ROOT_ADMIN_PROTECTED` ở API mà chỉ Root Admin gọi được thì không ghi `ACCESS_DENIED` (trừ §3.9 đã chốt). Nút thao tác chỉ hiện ở dòng mà backend cho phép (trạng thái, vai trò, không phải mình); `403`/`404` từ thao tác trên một dòng thì toast cảnh báo + tải lại danh sách. Mục cần quyền trong `system-settings` dùng thuộc tính `data-permission` (ẩn khi store thiếu mã) | M04 §3.7, M03 §3.10, `templates/admin/system-settings.{html,js}` |
| 2026-11-05 | A15 | Mọi API phân trang: `page` ≥ 1, `limit` 1…tối đa, sai/vượt → `400` (không kẹp); `page` vượt `totalPages` → `200` `data = []`; `search` cắt khoảng trắng, rỗng = không lọc, ≤ 100 ký tự, khớp **chứa** có thoát `\`/`%`/`_`, không phân biệt hoa thường; enum lạ, tham số lặp lại, `sort`/`order` khi API không nhận → `400`; thứ tự sắp xếp do từng API ghi, kết thúc bằng `id`. Frontend danh sách: tìm kiếm 300 ms/Enter, đổi lọc về trang 1, chỉ hiển thị request sau cùng, trang rỗng mà `page > 1` thì lùi về trang cuối, rỗng có lọc/không lọc khác thông điệp. Mẫu `mockGetAdmins`/`loadAdmins` | `02` §2.2, M04 §3.2, `templates/admin/system-settings.js` |
| 2026-11-05 | A16 | Mọi API tạo tài khoản (`POST /admin/admins`, `POST /users`, `initialAdmin` của `POST /admin/user-groups`) và `email` của `PUT /admin/admins/:id`: `username` `^[A-Za-z0-9._@-]{3,100}$`, `email` ≤ 150 dạng `a@b.c`, cắt khoảng trắng, giữ hoa/thường; trùng kể cả **chéo** username ↔ email trong tài khoản chưa `INACTIVE` cùng bảng → `409 ACCOUNT_DUPLICATE` có `errors.username`/`errors.email`, kiểm tra bằng `SELECT ... FOR UPDATE` (gap lock) + `ER_DUP_ENTRY` → `409`. Response chứa `temporaryPassword` (tạo tài khoản, `reset-password`): header `Cache-Control: no-store`, không ghi vào audit/log; mật khẩu tạm sinh và băm trước transaction (M04 §3.3). API tạo tài nguyên trả `201`. Frontend: hộp mật khẩu tạm một lần (bấm nền không đóng, đóng thì xóa khỏi DOM, không lưu store); lỗi `400`/`409` của form hiện dưới ô. Mẫu `mockCreateAdmin`, `showTempPassword` | `02` §2, M04 §3.3, M03 §3.4, M02 §3.2, `templates/admin/system-settings.{html,css,js}` |
| 2026-11-05 | A17 | Đổi trạng thái tài khoản (`PUT /admin/admins/:id/status`, áp cho N05 `PUT /users/:id/status`): chặn chính mình/`ROOT_ADMIN` với **mọi** giá trị `status` (trước bước so trạng thái); trùng trạng thái `200` không ghi gì; khóa ghi `LOCK` `{ revokedCount }` kể cả `0`, mở khóa `UNLOCK` không đổi bộ đếm sai/khóa tạm, không khôi phục phiên; `data = { id, status }`. Thao tác quản trị trên một Admin khóa dòng `admins` đích trước `auth_sessions`. Chặn `ROOT_ADMIN_PROTECTED` chỉ ghi `ACCESS_DENIED` ở `DELETE /admin/admins/:id`. Frontend: thao tác đổi trạng thái qua `ConfirmModal` (khóa `danger`, mở khóa `primary`), mọi kết quả `200`/`403`/`404`/`409` tải lại danh sách. Mẫu `mockSetAdminStatus`, `confirmSetAdminStatus` | `01` §13, M04 §3.4, §4.1, `templates/admin/system-settings.{js,css}` |
| 2026-11-05 | A18 | Sửa tài khoản khác (`PUT /admin/admins/:id`, áp cho N04 `PUT /users/:id`): cập nhật một phần, trường bắt buộc khi tạo không nhận `null`/rỗng; thứ tự chặn như A17 (chính mình → khóa dòng đích/`404` → `ROOT_ADMIN` → `INACTIVE`), tài khoản `LOCKED` sửa được; `changedFields` so chính xác (phân biệt hoa thường), rỗng `200` không ghi; trùng của trường định danh kiểm **sau** khi khóa dòng đích, loại trừ chính nó (`id <> :id`); `action_details = { changedFields }` không ghi giá trị cũ/mới; không thu hồi phiên. Frontend: hộp sửa riêng, định danh bất biến hiện chỉ đọc, chỉ gửi trường đã đổi, không đổi gì thì không gọi API; `400`/`409` trùng dưới ô, `403`/`404`/`409` trạng thái đóng hộp + tải lại. Mẫu `mockUpdateAdmin`, `openEditAdmin`, `submitEditAdmin`, `showFormErrors` | `01` §13, `02` §2.3, M04 §3.8, `templates/admin/system-settings.{html,css,js}` |
| 2026-11-05 | A19 | Đặt lại mật khẩu tài khoản khác (`PUT /admin/admins/:id/reset-password`, áp cho N06 `PUT /users/:id/reset-password`): không query/body; thứ tự chặn như A17 (chính mình → khóa dòng đích/`404` → `ROOT_ADMIN` không audit → `INACTIVE`), `LOCKED` đặt lại được; đặt `must_change_password = 1`, **xóa khóa tạm** (`failed_login_count = 0`, `locked_until = NULL`), giữ `password_changed_at`; thu hồi phiên còn hiệu lực `PASSWORD_CHANGED`; `AUTH / PASSWORD_RESET` `{ targetActorType, revokedCount }` luôn ghi; `200` `{ id, temporaryPassword }` + `no-store`. **Kiểm tra tài khoản ở mỗi request (hai cổng)**: token đầy đủ mà `must_change_password = 1` → `401 UNAUTHORIZED` (áp cho U04 và mọi API User). Frontend: xác nhận `danger` → hộp mật khẩu tạm dùng chung `showTempPassword(data, title)`, `200` không tải lại. Mẫu `mockResetAdminPassword`, `confirmResetAdminPassword` | `01` §6.1, §13, `02` §3.1, §3.5, M03 §3.8, M04 §3.1.1, §3.6, `templates/admin/system-settings.{html,css,js}` |
| 2026-11-05 | A20 | Tra cứu theo khoảng ngày `YYYY-MM-DD` (chỉ ngày, giờ Việt Nam): "tối đa N ngày" tính **cả hai đầu** (`toDate − fromDate ≤ N − 1`), lọc `created_at >= fromDate AND < toDate + 1 ngày`, ngày lịch sai/có giờ → `400`; frontend chặn trước (thiếu, ngược thứ tự, quá N ngày) không gọi API. Tham số lọc theo id phải đi cùng tham số loại (`actorId` ↔ `actorType`, `resourceId` ↔ `resourceName`), thiếu → `400`; giao diện không có ô nhập id: đặt bằng thao tác trên dòng (bấm tên, nút trong hộp chi tiết), hiện chip có nút bỏ, đổi ô loại thì bỏ id. Cột `varchar` id trả chuỗi, cột `json` trả đối tượng. Mục cần quyền khác nhau trên cùng màn hình khởi tạo độc lập (mẫu `initAuditLogs`, không phụ thuộc `return` sớm của mục khác). Nhãn `resourceName` ở M07 §5.2, nhãn hành động bảng chung M09 §5.1 | M07 §3.4, §5.2, M09 §5.1, `templates/admin/system-settings.{html,css,js}` |
| 2026-11-05 | A21 | Ngừng hoạt động tài khoản (`DELETE /admin/admins/:id`, áp cho N07 `DELETE /users/:id`): không query/body; thứ tự chặn như A17 (chính mình không audit → khóa dòng đích/`404` → `ROOT_ADMIN` → `INACTIVE` `409`, gọi lại cũng `409`), `LOCKED` ngừng hoạt động được; `status = INACTIVE` giải phóng `username`/`email` ngay, giữ dòng vai trò và `user_settings`; thu hồi phiên còn hiệu lực `ACCOUNT_LOCKED` (dùng chung cho khóa và ngừng hoạt động, không thêm enum); `DEACTIVATE` `{ revokedCount }` luôn ghi; `data = { id, status: "INACTIVE" }`. **`ACCESS_DENIED`** (mọi API ghi mã này): `ROLLBACK` transaction của thao tác bị chặn rồi `INSERT` riêng, `action_details = { attemptedAction, errorCode }`, lỗi ghi audit không đổi response. Frontend: `ConfirmModal` `danger` nêu không hoàn tác được (không ô gõ xác nhận), mọi kết quả `200`/`403`/`404`/`409` tải lại danh sách. Mẫu `mockDeactivateAdmin`, `confirmDeactivateAdmin` | `01` §13, §14, `02` §3.1, M03 §3.9, M04 §3.9, `templates/admin/system-settings.js` |
| 2026-11-05 | U01 | Chế độ bảo trì ở API đăng nhập User: `503 MAINTENANCE` trả **trước mọi bước** (trước kiểm tra body, tìm tài khoản), không ghi audit, không đổi bộ đếm sai; `503 MAINTENANCE` có trong danh mục `02` §2.3 (`errors = null`). Frontend hiển thị `503` như cảnh báo (vàng), không như lỗi mạng. Nhánh không thể xảy ra với dữ liệu đúng (vd. `GROUP_INACTIVE` khi đăng nhập) vẫn giữ làm chốt phòng vệ, ghi rõ lý do. Mẫu đăng nhập cổng Member: `templates/member/login.js` (`mockUserLogin`, `errorText`, `.is-warning`) | `02` §1.2, §2.3, M03 §3.1, §5.0, M07 §2, `templates/member/login.{html,css,js}` |

---

## 5. Bảng tiến độ

**Tiến độ**: 22 / 99 ✅ · 0 ⏸ · 0 🔁

- Một dòng `USER + ADMIN` gồm **cả hai route** (bản User và bản `/api/v1/admin/...`) và cả hai template: rà trong cùng một hội thoại.
- Cột **Module**: `Mxx` = `docs/modules/xx_*.md`. Cột **Template**: `A/` = `templates/admin/`, `M/` = `templates/member/` (tên file HTML; JS/CSS cùng tên). Cột **CSDL chính**: gợi ý điểm bắt đầu, phải tự grep đủ.
- Thứ tự dòng = thứ tự khuyến nghị (nền tảng xác thực → danh mục → nghiệp vụ lõi → tổng hợp → hệ thống).

### 5.1. Xác thực & hồ sơ Quản trị viên (`02` §3.1)

| ID | Method | Endpoint | Portal | Module | CSDL chính | Template | TT | Commit | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|
| A01 | POST | `/api/v1/admin/auth/login` | ADMIN | M04 | `admins`, `auth_sessions`, `audit_logs` | A/login | ✅ | `26651e5` | 2026-11-04; U01 cần áp mã `401`/`400` mới và rà `member/login` |
| A02 | POST | `/api/v1/admin/auth/refresh` | ADMIN | M04 | `auth_sessions` | A/main.js | ✅ | `72f8056` | 2026-11-04; thêm cột `auth_sessions.remember_me`; đặc tả chung ở M03 §3.2.1 |
| A03 | POST | `/api/v1/admin/auth/logout` | ADMIN | M04 | `auth_sessions` | A/main.js | ✅ | `85e7b8c` | 2026-11-04; đặc tả chung ở M03 §3.2.1 (U03 chỉ còn rà bản User) |
| A04 | GET | `/api/v1/admin/auth/me` | ADMIN | M04, M10 | `admins`, `admin_roles`, `permission_roles` | A/main.js | ✅ | `74e3b1d` | 2026-11-04; đặc tả M04 §3.1.1; U04 áp cùng quy tắc `401` khi tài khoản không còn `ACTIVE` |
| A05 | GET | `/api/v1/admin/profile` | ADMIN | M09 | `admins` | A/profile | ✅ | `8c8da4c` | 2026-11-04; đặc tả M09 §3.1; bỏ `permissions`, thêm `passwordChangedAt`, `createdAt`; A06 dùng form đã dọn (`fullName`, `phoneNumber`) |
| A06 | PUT | `/api/v1/admin/profile` | ADMIN | M09 | `admins`, `audit_logs` | A/profile | ✅ | `e61a41d` | 2026-11-04; đặc tả M09 §3.2; quy tắc số điện thoại chung `02` §2; mẫu `adminSession.updateAccount` |
| A07 | PUT | `/api/v1/admin/profile/change-password` | ADMIN | M09 | `admins`, `auth_sessions` | A/change-password | ✅ | `9ccaa83` | 2026-11-04; đặc tả chung hai cổng M09 §3.3; claim `sid`; sai `currentPassword` → `400` + đếm khóa tạm; bố cục bị buộc đổi `?forced=1` |
| A08 | POST | `/api/v1/admin/profile/avatar` | ADMIN | M09 | `admins.avatar_url`, `audit_logs` | A/profile | ✅ | `ae3d510` | 2026-11-04; đặc tả chung hai cổng M09 §3.2.1; volume chung + Nginx `/media/avatars/`; mã hóa lại 256×256; response hồ sơ đủ 12 trường |
| A09 | GET | `/api/v1/admin/profile/preferences` | ADMIN | M09 | `user_settings` | A/user-settings | ✅ | `881385d` | 2026-11-05; đặc tả M09 §3.6, §5.2; `dashboardWidgets` luôn đủ 6 phần tử; store `preferencesAdmin` nạp khi vào cổng; template chỉ còn 6 trường |
| A10 | PUT | `/api/v1/admin/profile/preferences` | ADMIN | M09 | `user_settings` | A/user-settings | ✅ | `91ed34a` | 2026-11-05; đặc tả M09 §3.7; cập nhật một phần, `dashboardWidgets` kiểm tra chặt, không audit; upsert giữ khóa khác của `custom_preferences`; mẫu `adminSession.savePreferences` (áp ngay, lỗi hoàn tác) |
| A11 | GET | `/api/v1/admin/profile/recent-activity` | ADMIN | M09 | `audit_logs` | A/profile | ✅ | `7b7f8f6` | 2026-11-05; đặc tả M09 §3.4; mọi dòng có tác nhân là chính mình (gồm `LOGIN_FAILED`), `data` mảng ≤ 20; đổi DDL `idx_audit_actor` (+`created_at`, `id`); khối "Hoạt động gần đây" ở `profile.html`, nhãn hành động M09 §5.1 |
| A12 | GET | `/api/v1/admin/auth/sessions` | ADMIN | M09 | `auth_sessions` | A/profile | ✅ | `95c31d4` | 2026-11-05; đặc tả chung hai cổng M09 §3.5.1; `isCurrent` theo claim `sid`; thêm cột `auth_sessions.logged_in_at`; khối "Phiên đăng nhập của tôi" ở `profile.html` |
| A13 | DELETE | `/api/v1/admin/auth/sessions/:id` | ADMIN | M09 | `auth_sessions` | A/profile | ✅ | `b2c4292` | 2026-11-05; đặc tả chung hai cổng M09 §3.5.2; `404 NOT_FOUND` mặc định (`02` §2.3); phiên hiện tại `400 VALIDATION_ERROR` (`errors.id`), xác định bằng đọc khóa sau khi khóa phiên đích; nút "Thu hồi" + `#revokeSessionModal` ở `profile.html` |
| A14 | DELETE | `/api/v1/admin/admins/:id/sessions` | ADMIN | M04 | `auth_sessions` | A/system-settings (tab admins) | ✅ | `15800b7` | 2026-11-05; đặc tả M04 §3.7 (6 bước, `resource_id` = id admin đích, audit chỉ khi `n > 0`, `ROOT_ADMIN_PROTECTED` không audit); dựng khung mục `admins` ở `system-settings.*` (mock `GET` + nút "Thu hồi phiên") |
| A15 | GET | `/api/v1/admin/admins` | ADMIN | M04 | `admins`, `admin_roles`, `roles` | A/system-settings (tab admins) | ✅ | `da47f22` | 2026-11-05; đặc tả M04 §3.2 (SQL, thứ tự `ROOT_ADMIN` → trạng thái → `full_name` → `id`, mọi trạng thái); quy ước phân trang/tìm kiếm chung `02` §2.2; không thêm index (bảng nhỏ); `#adminsSearch`, `#adminsStatusFilter`, `#adminsPagination` |
| A16 | POST | `/api/v1/admin/admins` | ADMIN | M04 | `admins`, `admin_roles`, `user_settings`, `audit_logs` | A/system-settings (tab admins) | ✅ | `008ac4c` | 2026-11-05; đặc tả M04 §3.3 (7 bước, khóa kiểm tra trùng chéo); quy tắc `username`/`email` chung `02` §2; `201` 12 trường + `temporaryPassword`, `no-store`; `#btnCreateAdmin`, `#adminCreateModal`, `#adminTempPasswordModal` |
| A17 | PUT | `/api/v1/admin/admins/:id/status` | ADMIN | M04 | `admins`, `auth_sessions`, `audit_logs` | A/system-settings (tab admins) | ✅ | `9e955b2` | 2026-11-05; đặc tả M04 §3.4 (7 bước, khóa dòng `admins` đích trước `auth_sessions`); `data = { id, status }`; `ROOT_ADMIN_PROTECTED` không ghi audit (§4.1 sửa theo); `LOCK` `{ revokedCount }`; nút "Khóa"/"Mở khóa" + `#confirmModal`, mock `mockSetAdminStatus` |
| A18 | PUT | `/api/v1/admin/admins/:id` | ADMIN | M04 | `admins`, `audit_logs` | A/system-settings (tab admins) | ✅ | `165b50a` | 2026-11-05; đặc tả M04 §3.8 (9 bước, khóa dòng đích trước kiểm trùng `email` `id <> :id`); `ROOT_ADMIN` → `403` không audit; `LOCKED` sửa được; không đổi gì `200` không ghi; `changedFields` so chính xác; `#adminEditModal`, mock `mockUpdateAdmin` |
| A19 | PUT | `/api/v1/admin/admins/:id/reset-password` | ADMIN | M04 | `admins`, `auth_sessions`, `audit_logs` | A/system-settings (tab admins) | ✅ | `6e7cfc0` | 2026-11-05; đặc tả M04 §3.6 (8 bước, khóa dòng đích trước `auth_sessions`); xóa khóa tạm, giữ `password_changed_at`; audit `{ targetActorType, revokedCount }`; token đầy đủ + `must_change_password = 1` → `401` ở mọi API (M04 §3.1.1); nút "Đặt lại mật khẩu" + `#confirmModal` → `#adminTempPasswordModal` dùng chung, mock `mockResetAdminPassword` |
| A20 | GET | `/api/v1/admin/audit-logs` | ADMIN | M07 | `audit_logs` | A/system-settings (tab audit-logs) | ✅ | `92f7e0e` | 2026-11-05; đặc tả M07 §3.4 (bảng query, SQL, ánh xạ index, 11 trường); thêm query `resourceId` (cần `resourceName`); đổi DDL `idx_audit_action` (+`created_at`, `id`), thêm `idx_audit_resource`; dựng `#section-audit-logs` (lọc tác nhân/đối tượng bằng chip, không ô id), `#auditDetailModal`, mock `mockGetAuditLogs` |
| A21 | DELETE | `/api/v1/admin/admins/:id` | ADMIN | M04 | `admins`, `auth_sessions`, `audit_logs` | A/system-settings (tab admins) | ✅ | `088acdd` | 2026-11-05; đặc tả M04 §3.9 (8 bước, khóa dòng đích trước `auth_sessions`); `ROOT_ADMIN` → `403` + `ACCESS_DENIED` ghi riêng sau `ROLLBACK`; `DEACTIVATE` `{ revokedCount }` (áp cả `DELETE /users/:id`); giữ `revoked_reason = ACCOUNT_LOCKED`; nút "Ngừng hoạt động" + `#confirmModal`, mock `mockDeactivateAdmin` |

### 5.2. Xác thực & hồ sơ Người dùng đơn vị (`02` §3.2)

| ID | Method | Endpoint | Portal | Module | CSDL chính | Template | TT | Commit | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|
| U01 | POST | `/api/v1/auth/login` | USER | M03 | `users`, `user_groups`, `auth_sessions`, `audit_logs` | M/login | ✅ | `COMMIT_U01` | 2026-11-05; đặc tả M03 §3.1 (7 bước theo khung A01); bảo trì `503 MAINTENANCE` trước mọi bước, không audit (`02` §1.2, §2.3 thêm mã `503`); `GROUP_INACTIVE` giữ làm chốt phòng vệ; mock `mockUserLogin`; `member/change-password.html?forced=1` chưa có chế độ bị buộc đổi (U07) |
| U02 | POST | `/api/v1/auth/refresh` | USER | M03 | `auth_sessions` | M/main.js | ⬜ | | Đặc tả M03 §3.2.1 đã viết ở A02; còn rà: chế độ bảo trì (`02` §1.2 chặn mọi API User trừ `/auth/me`, nhưng không refresh được thì không có token gọi `/auth/me`), mock `member/main.js` theo mẫu `admin/main.js` |
| U03 | POST | `/api/v1/auth/logout` | USER | M03 | `auth_sessions` | M/main.js | ⬜ | | Đặc tả M03 §3.2.1 đã viết ở A03; còn rà: chế độ bảo trì (`02` §1.2 trả `503` cho mọi API User trừ `/auth/me`, nên không đăng xuất được, cookie không bị xóa; mã `503 MAINTENANCE` đã thêm vào `02` §2.3 ở U01), mock `member/main.js` theo `adminSession.logout` |
| U04 | GET | `/api/v1/auth/me` | USER | M03, M10 | `users`, `user_roles`, `permission_roles`, `user_groups` | M/main.js | ⬜ | | Theo mẫu A04 (M04 §3.1.1): `401` khi tài khoản/nhóm không còn `ACTIVE` hoặc token đầy đủ mà `must_change_password = 1` (A19, `01` §6.1), không ghi audit, header member đổ từ store; còn rà: `permissions` hiệu lực theo cờ nhóm, ngoại lệ chế độ bảo trì |
| U05 | GET | `/api/v1/profile` | USER | M08 | `users`, `user_groups` | M/profile | ⬜ | | Theo mẫu A05 (M09 §3.1): không query, `401` khi không còn `ACTIVE`, không trả `permissions`, bảng nguồn trường, trạng thái tải/lỗi |
| U06 | PUT | `/api/v1/profile` | USER | M08 | `users`, `audit_logs` | M/profile | ⬜ | | Theo mẫu A06 (M09 §3.2): cập nhật một phần, trả hồ sơ đủ trường như `GET`, không đổi gì thì không ghi audit, `phoneNumber` theo `02` §2, header đổi tên từ store |
| U07 | PUT | `/api/v1/profile/change-password` | USER | M08 | `users`, `auth_sessions` | M/change-password | ⬜ | | Đặc tả chung đã viết ở A07 (M09 §3.3, M08 §3.4 ghi điểm khác); còn rà: nhóm `INACTIVE` (`401`/`403 GROUP_INACTIVE`?), chế độ bảo trì `503` chặn đổi mật khẩu bắt buộc, `userGroupId` trong token mới, template `member/change-password.*` theo mẫu admin (`?forced=1`, `setAccessToken`) |
| U08 | POST | `/api/v1/profile/avatar` | USER | M08 | `users.avatar_url`, `audit_logs` | M/profile | ⬜ | | Đặc tả chung đã viết ở A08 (M09 §3.2.1, M08 §3.3 ghi điểm khác); còn rà: nhóm `INACTIVE`, chế độ bảo trì `503`, response = hồ sơ đủ trường như `GET /profile` (U05), mẫu `member/profile.js` theo `admin/profile.js` |
| U09 | GET | `/api/v1/auth/sessions` | USER | M08 | `auth_sessions` | M/profile | ⬜ | | Đặc tả chung đã viết ở A12 (M09 §3.5.1); còn rà: nhóm `INACTIVE`, chế độ bảo trì `503`, khối phiên ở `member/profile.*` theo `admin/profile.js` |
| U10 | DELETE | `/api/v1/auth/sessions/:id` | USER | M08 | `auth_sessions` | M/profile | ⬜ | | Đặc tả chung đã viết ở A13 (M09 §3.5.2); còn rà: nhóm `INACTIVE`, chế độ bảo trì `503`, nút thu hồi + hộp xác nhận ở `member/profile.*` theo `admin/profile.js` (`mockDeleteMySession`) |
| U11 | GET | `/api/v1/profile/preferences` | USER | M08 | `user_settings` | M/user-settings | ⬜ | | Theo mẫu A09 (M09 §3.6, M08 §3.5): không `dashboardWidgets`, store `preferencesUser`, cache `memberTheme`; còn rà nhóm `INACTIVE`, bảo trì `503`, `member/user-settings.*`, `member/main.js` |
| U12 | PUT | `/api/v1/profile/preferences` | USER | M08 | `user_settings` | M/user-settings | ⬜ | | Theo mẫu A10 (M09 §3.7, M08 §3.5): không nhận `dashboardWidgets`, store `preferencesUser`, mẫu `savePreferences` cho `member/main.js` (nút theme) và `member/user-settings.js`; còn rà nhóm `INACTIVE`, bảo trì `503` |

### 5.3. Cây tổ chức (`02` §3.3)

| ID | Method | Endpoint | Portal | Module | CSDL chính | Template | TT | Commit | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|
| O01 | GET | `/api/v1/organizations/tree` | USER + ADMIN | M01 | `organizations` | A/organization; M/: xác định màn hình dùng | ⬜ | | |
| O02 | GET | `/api/v1/organizations` | USER + ADMIN | M01 | `organizations` | A/organization | ⬜ | | |
| O03 | GET | `/api/v1/organizations/:id` | USER + ADMIN | M01 | `organizations` | A/organization | ⬜ | | |
| O04 | POST | `/api/v1/admin/organizations` | ADMIN | M01 | `organizations`, `audit_logs` | A/organization | ⬜ | | |
| O05 | PUT | `/api/v1/admin/organizations/:id` | ADMIN | M01 | `organizations`, `audit_logs` | A/organization | ⬜ | | |
| O06 | DELETE | `/api/v1/admin/organizations/:id` | ADMIN | M01 | `organizations`, `user_groups` | A/organization | ⬜ | | |

### 5.4. Nhóm người dùng (`02` §3.4)

| ID | Method | Endpoint | Portal | Module | CSDL chính | Template | TT | Commit | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|
| G01 | GET | `/api/v1/user-groups` | USER + ADMIN | M02 | `user_groups`, `users` | A/user_group | ⬜ | | |
| G02 | GET | `/api/v1/user-groups/tree` | USER + ADMIN | M02 | `user_groups`, `organizations` | A/user_group | ⬜ | | |
| G03 | GET | `/api/v1/user-groups/:id` | USER + ADMIN | M02 | `user_groups`, `users`, `phone_prefix_groups` | A/user_group; M/group-admin, M/group-members | ⬜ | | |
| G04 | GET | `/api/v1/user-groups/me/members` | USER | M02 | `users`, `user_roles` | M/group-members | ⬜ | | |
| G05 | POST | `/api/v1/admin/user-groups` | ADMIN | M02 | `user_groups`, `phone_prefix_groups`, `users`, `user_roles`, `user_settings`, `audit_logs` | A/user_group | ⬜ | | `initialAdmin`: quy tắc `username`/`email` + trùng chéo `02` §2 (A16) |
| G06 | PUT | `/api/v1/admin/user-groups/:id` | ADMIN | M02 | `user_groups`, `audit_logs` | A/user_group | ⬜ | | |
| G07 | DELETE | `/api/v1/admin/user-groups/:id` | ADMIN | M02 | `user_groups`, `users`, `auth_sessions`, `phone_prefix_ranges` | A/user_group | ⬜ | | |

### 5.5. Người dùng & vai trò (`02` §3.5)

| ID | Method | Endpoint | Portal | Module | CSDL chính | Template | TT | Commit | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|
| N01 | GET | `/api/v1/users` | USER + ADMIN | M03 | `users`, `user_roles`, `user_groups` | A/users; M/group-admin | ⬜ | | |
| N02 | GET | `/api/v1/users/:id` | USER + ADMIN | M03 | `users`, `user_roles` | A/users; M/group-admin | ⬜ | | |
| N03 | POST | `/api/v1/users` | USER + ADMIN | M03 | `users`, `user_roles`, `user_settings`, `audit_logs` | A/users; M/group-admin | ⬜ | | Áp quy tắc `username`/`email` + trùng chéo `02` §2 và cách khóa/sinh mật khẩu M04 §3.3 (A16); `201` + `no-store`; `member/group-admin.js` có hàm sinh mật khẩu riêng (dòng ~1201) cần đổi theo |
| N04 | PUT | `/api/v1/users/:id` | USER + ADMIN | M03 | `users`, `audit_logs` | A/users; M/group-admin | ⬜ | | Áp quy tắc `phoneNumber` `02` §2 (A06) |
| N05 | PUT | `/api/v1/users/:id/status` | USER + ADMIN | M03 | `users`, `auth_sessions`, `audit_logs` | A/users; M/group-admin | ⬜ | | Đối chiếu bản Admin M04 §3.4 (A17): `USER / LOCK` ghi `action_details = { revokedCount }` (`01` §13), trùng trạng thái `200` không ghi, chặn chính mình với cả hai giá trị, `data = { id, status }` |
| N06 | PUT | `/api/v1/users/:id/reset-password` | USER + ADMIN | M03 | `users`, `auth_sessions`, `audit_logs` | A/users; M/group-admin | ⬜ | | Theo khung M04 §3.6 (A19): thứ tự kiểm tra (thêm khóa dòng nhóm, phạm vi nhóm bản User), xóa khóa tạm, `{ targetActorType: "USER", revokedCount }` luôn ghi, `no-store`; dùng mẫu xác nhận + hộp mật khẩu tạm của `admin/system-settings.js` |
| N07 | PUT | `/api/v1/users/:id/role` | USER + ADMIN | M10, M03 | `user_roles`, `user_groups`, `audit_logs` | A/users; M/group-admin | ⬜ | | |
| N08 | DELETE | `/api/v1/admin/users/:id/sessions` | ADMIN | M03 | `auth_sessions` | A/users | ⬜ | | |
| N09 | DELETE | `/api/v1/users/:id` | USER + ADMIN | M03 | `users`, `user_roles`, `auth_sessions`, `audit_logs` | A/users; M/group-admin | ⬜ | | |
| N10 | GET | `/api/v1/admin/roles` | ADMIN | M10 | `roles`, `permissions`, `permission_roles` | A/roles | ⬜ | | |

### 5.6. Đầu số, dải số & kho số (`02` §3.6)

| ID | Method | Endpoint | Portal | Module | CSDL chính | Template | TT | Commit | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|
| P01 | GET | `/api/v1/prefixes` | USER + ADMIN | M11 | `phone_prefix_groups`, `phone_prefix_ranges` | A/prefix-management; M/org-prefix | ⬜ | | |
| P02 | GET | `/api/v1/prefixes/:id` | USER + ADMIN | M11 | `phone_prefix_ranges`, `phone_numbers` | A/prefix-management; M/org-prefix | ⬜ | | |
| P03 | GET | `/api/v1/admin/prefix-groups` | ADMIN | M11 | `phone_prefix_groups`, `user_groups` | A/prefix-management | ⬜ | | |
| P04 | PUT | `/api/v1/admin/prefix-groups/:id` | ADMIN | M11 | `phone_prefix_groups`, `audit_logs` | A/prefix-management | ⬜ | | |
| P05 | POST | `/api/v1/admin/prefixes` | ADMIN | M11 | `phone_prefix_ranges`, `phone_numbers`, `prefix_allocation_history`, `phone_number_range_history` | A/prefix-management | ⬜ | | |
| P06 | PUT | `/api/v1/admin/prefixes/:id` | ADMIN | M11 | như P05 | A/prefix-management | ⬜ | | |
| P07 | DELETE | `/api/v1/admin/prefixes/:id` | ADMIN | M11 | như P05 | A/prefix-management | ⬜ | | |
| P08 | GET | `/api/v1/prefixes/history` | USER + ADMIN | M11 | `prefix_allocation_history` | A/prefix-history; M/org-prefix | ⬜ | | |
| P09 | GET | `/api/v1/phone-numbers/pool` | USER + ADMIN | M11 | `phone_numbers`, `v_phone_numbers_detail` | A/prefix-management (#poolModal); M/org-prefix | ⬜ | | |
| P10 | GET | `/api/v1/admin/phone-numbers/pool/summary` | ADMIN | M11, M05 | `phone_numbers` | A/prefix-management; A/dashboard | ⬜ | | |
| P11 | PUT | `/api/v1/admin/phone-numbers/:number` | ADMIN | M11 | `phone_numbers`, `phone_number_range_history` | A/prefix-management (#numbersListModal) | ⬜ | | |
| P12 | GET | `/api/v1/phone-numbers/history` | USER + ADMIN | M11 | `phone_number_range_history` | A/prefix-history (tab Lịch sử số); M/org-prefix | ⬜ | | |

### 5.7. CDR & ghi âm (`02` §3.7)

| ID | Method | Endpoint | Portal | Module | CSDL chính | Template | TT | Commit | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|
| C01 | GET | `/api/v1/cdr` | USER + ADMIN | M12 | `cdr_enriched` | A/cdr-history; M/cdr-history | ⬜ | | |
| C02 | GET | `/api/v1/cdr/:id` | USER + ADMIN | M12 | `cdr_enriched` | A/cdr-history; M/cdr-history | ⬜ | | |
| C03 | GET | `/api/v1/cdr/export` | USER + ADMIN | M12 | `cdr_enriched`, `audit_logs` | A/cdr-history; M/cdr-history | ⬜ | | |
| C04 | GET | `/api/v1/cdr/:id/audio/stream` | USER + ADMIN | M12 | `cdr_enriched`, `user_groups`, `system_settings` | A/cdr-history; M/cdr-history | ⬜ | | |
| C05 | GET | `/api/v1/cdr/:id/audio/download` | USER + ADMIN | M12 | như C04, `audit_logs` | A/cdr-history; M/cdr-history | ⬜ | | |

### 5.8. QoS (`02` §3.8)

| ID | Method | Endpoint | Portal | Module | CSDL chính | Template | TT | Commit | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|
| Q01 | GET | `/api/v1/qos/debug-table` | USER + ADMIN | M13 | `cdr_enriched`, `qos_thresholds` | A/qos-debug; M/qos-debug | ⬜ | | |
| Q02 | GET | `/api/v1/qos/summary` | USER + ADMIN | M13 | `stats_daily`, `stats_hourly` | A/qos-debug; M/qos-debug | ⬜ | | |
| Q03 | GET | `/api/v1/qos/disconnection-codes` | USER + ADMIN | M13 | `stats_daily`, `stats_hourly` | A/qos-debug; M/qos-debug | ⬜ | | |
| Q04 | GET | `/api/v1/admin/qos/thresholds` | ADMIN | M13 | `qos_thresholds` | A/system-settings (tab qos-thresholds) | ⬜ | | |
| Q05 | PUT | `/api/v1/admin/qos/thresholds` | ADMIN | M13 | `qos_thresholds`, `audit_logs` | A/system-settings (tab qos-thresholds) | ⬜ | | |

### 5.9. Lưu lượng & thời lượng (`02` §3.9)

| ID | Method | Endpoint | Portal | Module | CSDL chính | Template | TT | Commit | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|
| T01 | GET | `/api/v1/traffic/summary` | USER + ADMIN | M14 | `stats_daily`, `stats_hourly` | *(không có template — TrafficSummaryView)* | ⬜ | | |
| T02 | GET | `/api/v1/traffic/records` | USER + ADMIN | M14 | `cdr_enriched` | *(không có template — TrafficSummaryView)* | ⬜ | | |

### 5.10. Báo cáo & xuất (`02` §3.10)

| ID | Method | Endpoint | Portal | Module | CSDL chính | Template | TT | Commit | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|
| R01 | GET | `/api/v1/reports/summary` | USER + ADMIN | M15 | `stats_daily`, `stats_hourly` | A/reports; M/reports | ⬜ | | |
| R02 | POST | `/api/v1/reports/export/excel` | USER + ADMIN | M15 | như R01, `audit_logs` | A/reports; M/reports | ⬜ | | |
| R03 | POST | `/api/v1/reports/export/pdf` | USER + ADMIN | M15 | như R01, `audit_logs` | A/reports; M/reports | ⬜ | | |

### 5.11. Dashboard & tính lại thống kê (`02` §3.11)

| ID | Method | Endpoint | Portal | Module | CSDL chính | Template | TT | Commit | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|
| D01 | GET | `/api/v1/dashboard/stats` | USER + ADMIN | M05 | `stats_hourly`, `stats_daily` | A/dashboard; M/dashboard | ⬜ | | `admin/dashboard` chưa có khối `topGroupsChart`, khối chưa gắn `key` theo `dashboardWidgets` (E-A09-04) |
| D02 | GET | `/api/v1/dashboard/recent-calls` | USER + ADMIN | M05 | `cdr_enriched` | A/dashboard; M/dashboard | ⬜ | | |
| D03 | GET | `/api/v1/admin/dashboard/groups` | ADMIN | M05 | `stats_daily`, `user_groups` | A/dashboard | ⬜ | | |
| D04 | GET | `/api/v1/dashboard/charts` | USER + ADMIN | M05 | `stats_hourly`, `stats_daily` | A/dashboard; M/dashboard | ⬜ | | |
| D05 | POST | `/api/v1/admin/stats/recalculate` | ADMIN | M05, M07 | hàng đợi tính lại (`01` §15.0), `worker_job_status` | A/system-settings (tab reporting) | ⬜ | | |

### 5.12. Thông báo & cài đặt hệ thống (`02` §3.12)

| ID | Method | Endpoint | Portal | Module | CSDL chính | Template | TT | Commit | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|
| S01 | GET | `/api/v1/notifications` | USER + ADMIN | M06 | `notifications`, `notification_recipients` | A/notifications; M/notifications; main.js (chuông) | ⬜ | | |
| S02 | PUT | `/api/v1/notifications/:id/read` | USER + ADMIN | M06 | `notification_recipients` | A/notifications; M/notifications | ⬜ | | |
| S03 | POST | `/api/v1/admin/notifications` | ADMIN | M06 | `notifications`, `notification_recipients`, `audit_logs` | A/notifications (modal Soạn) | ⬜ | | |
| S04 | PUT | `/api/v1/notifications/mark-all-read` | USER + ADMIN | M06 | `notification_recipients` | A/notifications; M/notifications | ⬜ | | |
| S05 | GET | `/api/v1/admin/settings/system` | ADMIN | M07 | `system_settings` | A/system-settings | ⬜ | | |
| S06 | PUT | `/api/v1/admin/settings/system` | ADMIN | M07 | `system_settings`, `audit_logs` | A/system-settings | ⬜ | | |
| S07 | POST | `/api/v1/admin/settings/reload-cache` | ADMIN | M07 | `system_settings` (`cache_version`) | A/system-settings | ⬜ | | |
| S08 | GET | `/api/v1/admin/system/jobs` | ADMIN | M07 | `worker_job_status`, `cdr_enrichment_state` | A/system-settings | ⬜ | | |
| S09 | GET | `/api/v1/admin/system/enrichment-errors` | ADMIN | M07 | `cdr_enrichment_errors` | A/system-settings | ⬜ | | |
| S10 | POST | `/api/v1/admin/system/enrichment-errors/:cdrId/retry` | ADMIN | M07 | `cdr_enrichment_errors`, `cdr_enriched` | A/system-settings | ⬜ | | |

### 5.13. WebSocket (`02` §4)

| ID | Method | Endpoint | Portal | Module | CSDL chính | Template | TT | Commit | Ghi chú |
|---|---|---|---|---|---|---|---|---|---|
| W01 | WS | `/notifications`, `/admin/notifications` (`notification:new`…) | USER + ADMIN | M06 | `notifications`, `notification_recipients` | A/main.js; M/main.js | ⬜ | | Làm sau S01–S04 |

---

## 6. Nhật ký phiên

> Mỗi hội thoại thêm **một dòng** khi kết thúc (kể cả khi chỉ làm được một phần).

| Ngày | ID | Kết quả | Phát hiện (`E-<ID>-nn`) | File đã sửa | Commit |
|---|---|---|---|---|---|
| 2026-11-04 | — | Lập kế hoạch | — | `tasks/endpoint_review_plan.md`, `DB_AUDIT_CONSOLIDATED.md` | `387684d` |
| 2026-11-04 | A01 | ✅ Xong 3 lớp; không đổi DDL; 3 câu hỏi chốt ngay trong phiên (mã 400/401, `admin` với token giới hạn, `avatarUrl`) | E-A01-01…06 | `02`, `03`, M03, M04, `templates/admin/login.*`, `DB_AUDIT_CONSOLIDATED.md`, file này | `26651e5` |
| 2026-11-04 | A02 | ✅ Xong 3 lớp; đổi DDL (`auth_sessions.remember_me`); 3 câu hỏi chốt ngay trong phiên (lưu `rememberMe`, không xét tuổi mật khẩu khi refresh, mọi `401` xóa cookie) | E-A02-01…05 | `00`, `01`, `02`, M03, M04, `templates/admin/main.js`, `DB_AUDIT_CONSOLIDATED.md`, file này | `72f8056` |
| 2026-11-04 | A03 | ✅ Xong 3 lớp; không đổi DDL; 4 câu hỏi chốt ngay trong phiên (audit chỉ khi thu hồi được, cookie `ROTATED` đi theo chuỗi, idempotent `200` + không thu hồi phiên người khác, giữ guard) | E-A03-01…04 | `01`, `02`, M03, M04, `templates/admin/main.js`, `templates/admin/data-permissions.html`, `templates/admin/user_group.html`, `DB_AUDIT_CONSOLIDATED.md`, file này | `85e7b8c` |
| 2026-11-04 | A04 | ✅ Xong 3 lớp; không đổi DDL; 3 câu hỏi chốt ngay trong phiên (`status` khác `ACTIVE` → `401`, token giới hạn trả đúng cấu trúc `admin`, mock `/me` + đổ header); chuyển dòng nhật ký A03 bị đặt nhầm ở mục 4 về mục 6 | E-A04-01…04 | `02`, M04, `templates/admin/main.js`, `DB_AUDIT_CONSOLIDATED.md`, file này | `74e3b1d` |
| 2026-11-04 | A05 | ✅ Xong 3 lớp; không đổi DDL; 2 câu hỏi chốt ngay trong phiên (bỏ `permissions` + thêm `passwordChangedAt`/`createdAt`; xóa ô `department`/`bio` khỏi template) | E-A05-01…03 | `02`, M09, `templates/admin/profile.{html,css,js}`, `DB_AUDIT_CONSOLIDATED.md`, file này | `8c8da4c` |
| 2026-11-04 | A06 | ✅ Xong 3 lớp; không đổi DDL; 4 câu hỏi chốt ngay trong phiên (cập nhật một phần, response = hồ sơ đủ 12 trường, không đổi gì thì không ghi audit, quy tắc định dạng `phoneNumber` chung) | E-A06-01…04 | `02`, M09, `templates/admin/main.js`, `templates/admin/profile.{html,css,js}`, `DB_AUDIT_CONSOLIDATED.md`, file này | `e61a41d` |
| 2026-11-04 | A07 | ✅ Xong 3 lớp; chỉ đổi COMMENT `failed_login_count` (`admins`, `users`); 5 câu hỏi chốt ngay trong phiên (sai `currentPassword` → `400` + đếm khóa tạm, tối đa 72 byte, bố cục riêng khi bị buộc đổi, ở lại trang sau khi đổi, claim `sid` vì cookie không tới route) | E-A07-01…05 | `01`, `02`, M03, M04, M08, M09, `templates/admin/{main,login}.js`, `templates/admin/change-password.{html,css,js}`, `DB_AUDIT_CONSOLIDATED.md`, file này | `9ccaa83` |
| 2026-11-04 | A08 | ✅ Xong 3 lớp; chỉ đổi COMMENT `avatar_url` (`admins`, `users`); 4 câu hỏi chốt ngay trong phiên (volume chung + Nginx `/media/avatars/`, mã hóa lại 256×256, response hồ sơ đủ 12 trường, chưa thêm API gỡ ảnh) | E-A08-01…04 | `00`, `01`, `02`, M02, M03, M08, M09, `templates/admin/profile.{html,css,js}`, `DB_AUDIT_CONSOLIDATED.md`, file này | `ae3d510` |
| 2026-11-05 | A09 | ✅ Xong 3 lớp; không đổi DDL; 4 câu hỏi chốt ngay trong phiên (xóa điều khiển không có API + khối phiên, nạp khi vào cổng + cache `theme`, `dashboardWidgets` luôn đủ 6, giao diện widget ở `user-settings`). Lưu ý: khối phiên đăng nhập trước đó chỉ có ở `user-settings.html` (không phải `profile.html` như câu hỏi đã nêu) → A12 phải dựng mới ở `profile.html` | E-A09-01…04 | `02`, `03`, M04, M08, M09, `templates/admin/main.js`, `templates/admin/user-settings.{html,css,js}`, `DB_AUDIT_CONSOLIDATED.md`, file này | `881385d` |
| 2026-11-05 | A10 | ✅ Xong 3 lớp; không đổi DDL; 4 câu hỏi chốt ngay trong phiên (cập nhật một phần, `dashboardWidgets` kiểm tra chặt, không ghi audit, áp ngay + hoàn tác khi lỗi). Không kiểm được trên trình duyệt (điều hướng bị từ chối), đã kiểm hàm validate của mock bằng Node | E-A10-01…03 | `02`, M08, M09, `templates/admin/{main,user-settings}.js`, `DB_AUDIT_CONSOLIDATED.md`, file này | `91ed34a` |
| 2026-11-05 | A11 | ✅ Xong 3 lớp; đổi DDL (`audit_logs.idx_audit_actor` thêm `created_at`, `id`); 3 câu hỏi chốt ngay trong phiên (mọi dòng có tác nhân là chính mình gồm `LOGIN_FAILED`, mở rộng index, thẻ riêng không liên kết nhật ký). Không kiểm được trên trình duyệt (điều hướng tới localhost bị từ chối), đã kiểm mock/nhãn/dựng danh sách bằng Node với DOM giả | E-A11-01…04 | `01`, `02`, M09, `templates/admin/profile.{html,css,js}`, `DB_AUDIT_CONSOLIDATED.md`, file này | `7b7f8f6` |
| 2026-11-05 | A12 | ✅ Xong 3 lớp; đổi DDL (thêm `auth_sessions.logged_in_at`); 2 câu hỏi chốt ngay trong phiên (`isCurrent` theo claim `sid`, thêm cột `logged_in_at`). Kiểm template bằng Chrome headless (`--dump-dom`, chụp ảnh): đi chuỗi `sid` 4801→4821, loại phiên đã thu hồi/hết hạn/của Admin khác | E-A12-01…04 | `01`, `02`, M03, M04, M08, M09, `templates/admin/profile.{html,css,js}`, `DB_AUDIT_CONSOLIDATED.md`, file này | `95c31d4` |
| 2026-11-05 | A13 | ✅ Xong 3 lớp; không đổi DDL (thêm câu khóa/đọc khóa ở `01` §6.1); 4 câu hỏi chốt ngay trong phiên (`404 NOT_FOUND` chung, phiên hiện tại `400 VALIDATION_ERROR` + `errors.id`, hộp xác nhận + tải lại, chấp nhận ≤ 15 phút không đẩy Socket.IO). Kiểm template bằng Chrome headless (`--dump-dom`, chụp ảnh): luồng thu hồi 4790 + 16 nhánh mock (id cũ của phiên hiện tại, `ROTATED` 4755→4900, `404`, `400`, gọi lại `revoked = false`) | E-A13-01…05 | `01`, `02`, M08, M09, `templates/admin/profile.{html,css,js}`, `DB_AUDIT_CONSOLIDATED.md`, file này | `b2c4292` |
| 2026-11-05 | A14 | ✅ Xong 3 lớp; không đổi DDL; 4 câu hỏi chốt ngay trong phiên (dựng khung mục `admins` ngay, audit chỉ khi `revokedCount > 0`, `ROOT_ADMIN_PROTECTED` không ghi `ACCESS_DENIED`, nút chỉ ở dòng `ACTIVE`/không `ROOT_ADMIN`/không phải mình). Kiểm template bằng Chrome headless (`--dump-dom`, chụp ảnh): 13 nhánh mock (`200` n=2 rồi 0, phiên hết hạn không bị thu hồi, `403` ×2, `404`, `400` ×5, `401`) và luồng nút → hộp xác nhận (không đóng khi gửi) → toast | E-A14-01…05 | `02`, M03, M04, M09, `templates/admin/profile.js`, `templates/admin/system-settings.{html,css,js}`, `DB_AUDIT_CONSOLIDATED.md`, file này | `15800b7` |
| 2026-11-05 | A15 | ✅ Xong 3 lớp; không đổi DDL; 4 câu hỏi chốt ngay trong phiên (page/limit chặt `400`, `search` khớp chứa ≤ 100 ký tự, thứ tự Root → trạng thái → tên, bỏ trống `status` gồm `INACTIVE`). Kiểm template bằng Chrome headless (`--dump-dom`, chụp ảnh): 18 nhánh mock (thứ tự, lọc, `search` có dấu/hoa thường/`%`, `page` vượt, 9 nhánh `400`) và luồng UI (trang 2, đổi lọc về trang 1, debounce 300 ms, rỗng có lọc, lùi về trang cuối) | E-A15-01…05 | `02`, M04, `templates/admin/system-settings.{html,css,js}`, `DB_AUDIT_CONSOLIDATED.md`, file này | `da47f22` |
| 2026-11-05 | A16 | ✅ Xong 3 lớp; không đổi DDL; 4 câu hỏi chốt ngay trong phiên (`201` + 12 trường + `temporaryPassword`, quy tắc `username`/`email` chung ở `02` §2, chặn trùng chéo username ↔ email, hộp mật khẩu tạm riêng xem một lần). Kiểm template bằng Chrome headless (`--dump-dom`, chụp ảnh): 38 kiểm tra (500 mật khẩu tạm, 6 nhánh `409`/`201`, 14 nhánh `400`, `401`, luồng UI khóa khi gửi → lỗi dưới ô → hộp mật khẩu → đóng thì xóa khỏi DOM) | E-A16-01…06 | `02`, M02, M03, M04, `templates/admin/system-settings.{html,css,js}`, `DB_AUDIT_CONSOLIDATED.md`, file này |`008ac4c` |
| 2026-11-05 | A17 | ✅ Xong 3 lớp; không đổi DDL (chỉ thêm `action_details` của `LOCK`/`UNLOCK` vào danh mục `01` §13); 4 câu hỏi chốt ngay trong phiên (`data = { id, status }`, không ghi `ACCESS_DENIED`, `LOCK` ghi `revokedCount`, cả Khóa và Mở khóa đều xác nhận). Kiểm template bằng Chrome headless (`--dump-dom`, chụp ảnh): 42 kiểm tra (9 nhánh `400`, `401`, `403` ×4, `404`, `409` ×2, trùng trạng thái, thu hồi phiên, audit, luồng UI khóa → mở khóa → `409` tải lại) | E-A17-01…05 | `01`, `02`, M04, `templates/admin/system-settings.{css,js}`, `DB_AUDIT_CONSOLIDATED.md`, file này | `9e955b2` |
| 2026-11-05 | A18 | ✅ Xong 3 lớp; không đổi DDL (chỉ thêm `PUT /admin/admins/:id` vào danh mục `UPDATE` của `01` §13); 4 câu hỏi chốt ngay trong phiên (`ROOT_ADMIN` → `403` không audit, `action_details` chỉ `changedFields`, `LOCKED` sửa được + không đổi gì `200`, hộp riêng gửi trường đã đổi). Kiểm template bằng Chrome headless (`--dump-dom`): 40 kiểm tra (16 nhánh `400`, `401`, `403` ×2, `404`, `409` ×4, 5 nhánh `200`, đếm audit, luồng UI); lần chạy đầu lộ lỗi ở TC-ADM-14 (`email = admin.hanoi` không qua định dạng nên không thể là ca trùng chéo) → đã sửa TC | E-A18-01…05 | `01`, `02`, M04, `templates/admin/system-settings.{html,css,js}`, `DB_AUDIT_CONSOLIDATED.md`, file này | `165b50a` |
| 2026-11-05 | A19 | ✅ Xong 3 lớp; không đổi DDL (chỉ thêm `action_details` của `PASSWORD_RESET` vào `01` §13 và quy tắc `must_change_password` ở `01` §6.1); 4 câu hỏi chốt ngay trong phiên (`{ targetActorType, revokedCount }`, xóa khóa tạm, token đầy đủ + `must_change_password = 1` → `401`, response giữ `{ id, temporaryPassword }`). Kiểm template bằng Chrome headless (`--dump-dom`): 27 kiểm tra (5 nhánh `400`, `401`, `403` ×2, `404`, `409`, 5 nhánh `200`, luồng UI xác nhận → hộp mật khẩu tạm → `409` tải lại, hộp Thêm giữ tiêu đề); lần chạy đầu lộ lỗi ca kiểm (admin 9 `LOCKED` ở trang 2) → đổi sang admin 18 | E-A19-01…05 | `01`, `02`, M03, M04, `templates/admin/system-settings.{html,css,js}`, `DB_AUDIT_CONSOLIDATED.md`, file này | `6e7cfc0` |
| 2026-11-05 | A20 | ✅ Xong 3 lớp; đổi DDL (`audit_logs.idx_audit_action` thêm `created_at`, `id`; thêm `idx_audit_resource`; COMMENT `resource_id`); 4 câu hỏi chốt ngay trong phiên (thêm `resourceId`, mở rộng 2 index, lọc tác nhân bằng bấm tên ở dòng, dựng mục ngay). Kiểm template bằng Chrome headless (`--dump-dom`, chụp ảnh): 63 kiểm tra (20 nhánh `400`, `401`, lọc/sắp xếp, nhãn, luồng UI chip → chi tiết → lọc đối tượng → bỏ chip → chặn ngày → trang 2); lần chạy đầu lộ lỗi ca kiểm (giả định 90412 đứng đầu, nhưng dòng sinh tự động hôm nay giờ muộn hơn) → sửa ca kiểm | E-A20-01…05 | `01`, `02`, M07, M09, `templates/admin/system-settings.{html,css,js}`, `templates/admin/profile.js`, `DB_AUDIT_CONSOLIDATED.md`, file này | `92f7e0e` |
| 2026-11-05 | A21 | ✅ Xong 3 lớp; không đổi DDL (chỉ thêm `action_details` của `DEACTIVATE`, `ACCESS_DENIED` vào `01` §13 và sửa câu danh sách mặc định ở `01` §14); 4 câu hỏi chốt ngay trong phiên (`DEACTIVATE` `{ revokedCount }`, `ACCESS_DENIED` ghi riêng sau rollback, giữ `ACCOUNT_LOCKED`, `ConfirmModal` `danger`). Kiểm template bằng Chrome headless (`--dump-dom`): 38 kiểm tra (7 nhánh `400`, `401`, `403` ×2, `404`, `409` ×2, 3 nhánh `200`, dùng lại username/email, luồng UI xác nhận → tải lại → `409` cảnh báo); lần chạy đầu lộ lỗi ca kiểm (admin 9 `LOCKED` và dòng vừa `INACTIVE` ở trang 2) → sửa ca kiểm. Mục `admins` của `system-settings` đã đủ thao tác A14–A21 | E-A21-01…05 | `01`, `02`, M03, M04, `templates/admin/system-settings.js`, `DB_AUDIT_CONSOLIDATED.md`, file này | `088acdd` |
| 2026-11-05 | U01 | ✅ Xong 3 lớp; không đổi DDL; 2 câu hỏi chốt ngay trong phiên (`503 MAINTENANCE` trước mọi bước không audit, giữ `GROUP_INACTIVE` làm chốt phòng vệ). Kiểm template bằng Chrome headless (`--dump-dom`, chụp ảnh): 24 kiểm tra (cấu trúc form, `400`, `401`, `403` ×2, `423`, `503` trước kiểm tra body, quyền hiệu lực 15/9/17 mã, đăng nhập bằng email, đích chuyển trang, không lưu token); lần chạy đầu lộ lỗi mock (đăng nhập bằng email so cả chuỗi) → so theo phần tên tài khoản | E-U01-01…05 | `02`, M03, M07, `templates/member/login.{html,css,js}`, `DB_AUDIT_CONSOLIDATED.md`, file này | `COMMIT_U01` |

---

## 7. Câu hỏi đang chờ chủ dự án

| ID câu hỏi | Endpoint | Câu hỏi | Khuyến nghị | Trả lời |
|---|---|---|---|---|
| — | — | *(chưa có)* | — | — |
