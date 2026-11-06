---
sessionId: session-261022-152333-9g2r
---

# Requirements

### Overview & Goals
Rà soát toàn bộ tài liệu thiết kế trong `docs/` (schema toàn cục, overview, API contracts, 15 module docs, SQL dump thật, catalog đầu số) và bộ giao diện mẫu `templates/` để **phát hiện và báo cáo** mọi điểm **không thống nhất về thiết kế cơ sở dữ liệu**. Kết quả là **một file báo cáo duy nhất** đặt tại thư mục gốc dự án: `DB_SCHEMA_CONSISTENCY_REPORT.md` (tiếng Việt, thuật ngữ kỹ thuật giữ nguyên tiếng Anh).

**Không sửa bất kỳ file tài liệu / template nào** – chỉ đọc, đối chiếu và ghi nhận.

### Scope

#### In Scope
- **Docs ↔ Docs**: Mâu thuẫn DDL (cột, kiểu dữ liệu, enum, index, FK, thứ tự tạo bảng), ERD, mô tả nghiệp vụ liên quan dữ liệu giữa `docs/01_database_schema.md` (nguồn chuẩn ứng dụng) và `docs/00_overview_and_architecture.md`, `docs/02_api_contracts.md`, `docs/modules/01..15_*.md`, `docs/evn_pabx_prefix_numbers_catalog.md`.
- **Docs ↔ SQL dump**: Đối chiếu DDL + giá trị dữ liệu thật trong `docs/voip_cdr_20250817.sql` (đơn vị `Answered_Duration`, giá trị `Direction`, `DisconnectionStatus`, `ReleasedBy`, định dạng đường dẫn file ghi âm, thang điểm MOS…).
- **Docs ↔ Templates**: Đối chiếu mock data / field names trong `templates/admin/*.js` và `templates/member/*.js` với schema (trường `extension`, hướng FK nhóm đầu số, kích thước kho số, mã nhóm, mã quyền…).
- **Thiếu bảng / cột**: Tính năng được mô tả trong docs nhưng không có bảng/cột hỗ trợ (refresh token, active sessions, lockout, normalized CDR columns, QoS thresholds…).

#### Out of Scope
- Sửa lỗi trong docs/templates (chỉ đề xuất hướng sửa).
- Rà soát mã nguồn `backend/`, `frontend/`.
- Mâu thuẫn thuần UI/UX không liên quan dữ liệu (chỉ ghi nh��n ngắn trong Phụ lục nếu phát hiện kèm, ví dụ đường dẫn template lỗi thời).

### User Stories
- Là **DB/Backend Agent**, tôi muốn biết chính xác chỗ nào các tài liệu mâu thuẫn nhau về schema để không sinh ra migration/entity sai.
- Là **Tech Lead**, tôi muốn một danh sách có **mức độ nghiêm trọng** và **đề xuất nguồn chuẩn (source of truth)** để quyết định sửa tài liệu nào trước.
- Là **Reviewer**, tôi muốn mỗi phát hiện có **vị trí `file:line` cụ thể** để kiểm chứng nhanh bằng grep.

### Functional Requirements
1. Báo cáo có **tóm tắt điều hành**: tổng số phát hiện theo mức độ và Top phát hiện Critical.
2. Báo cáo nêu rõ **phương pháp & thứ tự ưu tiên nguồn chuẩn**: SQL dump (cho bảng `cdr` thô) → `01_database_schema.md` (bảng ứng dụng) → module docs → templates.
3. Có **bảng kiểm kê schema chuẩn**: toàn bộ bảng/view trong `01_database_schema.md` và nơi chúng được định nghĩa lại/tham chiếu.
4. Mỗi phát hiện là một bản ghi chuẩn gồm: `ID` (D-xx / S-xx / T-xx / M-xx), `Mức độ` (Critical / Major / Minor), `Vị trí` (file + dòng/section), `Mô tả mâu thuẫn` (trích dẫn ngắn hai phía), `Nguồn chuẩn đề xuất`, `Hướng sửa đề xuất`.
5. Phát hiện được **nhóm theo 4 phạm vi** (Docs↔Docs, Docs↔SQL, Docs↔Templates, Thiếu bảng/cột) và có **ma trận tổng hợp** cuối báo cáo.
6. Toàn bộ `file:line` trong báo cáo phải kiểm chứng được tại thời điểm viết (agent phải mở lại/grep lại trước khi chốt).

### Non-Functional Requirements
- Chỉ tạo **1 file mới** ở project root; không chỉnh sửa file khác.
- Markdown chuẩn, bảng render được trên GitHub/IDE; không dùng ký tự gây lỗi bảng (`|` trong nội dung phải escape).
- Ngôn ngữ: tiếng Việt, giữ tên bảng/cột/enum nguyên văn trong backtick.

# Technical Design

### Current Implementation
- `docs/01_database_schema.md` (961 dòng) là schema toàn cục: 25 bảng + 1 view (`cdr`, `cdr_enriched`, `cdr_enrichment_state`, `admins`, `organizations`, `phone_prefix_groups`, `user_groups`, `users`, `roles`, `permissions`, `role_permissions`, `admin_roles`, `user_roles`, `phone_prefix_ranges`, `phone_numbers`, `v_phone_numbers_detail`, `prefix_allocation_history`, `phone_number_range_history`, `call_duration_records`, `qos_threshold_configs`, `notifications`, `notification_recipients`, `system_settings`, `user_settings`, `audit_logs`, `stats_hourly`, `stats_daily`).
- 7 module docs **định nghĩa lại DDL** (`01_organization`, `02_user_group`, `03_auth_user`, `04_auth_admin`, `08_user_profile`, `11_core_business_phone_numbers`, `14_core_business_call_traffic`) → nguồn trôi dạt (drift) chính.
- `docs/voip_cdr_20250817.sql` là dump thật từ PABX (MariaDB 11.7.2, 5.369 dòng) – nguồn chuẩn duy nhất cho bảng `cdr`.
- `templates/admin/*.js`, `templates/member/*.js` chứa mock data mô phỏng API response, phản ánh ngầm mô hình dữ liệu (ví dụ `MEMBERS_DATA`, `initialPrefixGroups`, `mockCdrRecords`).
- Chưa có bất kỳ báo cáo rà soát nào; `backend/` chưa có migration để đối chiếu.

### Key Decisions
1. **Thứ tự ưu tiên nguồn chuẩn (Source-of-Truth Hierarchy)**: (a) `voip_cdr_20250817.sql` cho cấu trúc & ngữ nghĩa dữ liệu bảng `cdr`; (b) `01_database_schema.md` cho mọi bảng ứng dụng; (c) module docs cho nghiệp vụ; (d) templates chỉ là minh họa. Mâu thuẫn được quy trách nhiệm sửa cho nguồn có ưu tiên thấp hơn, trừ khi nguồn cao hơn rõ ràng sai so với dữ liệu thật.
2. **Thang mức độ**: `Critical` = sai sẽ dẫn tới dữ liệu/tính toán sai hoặc DDL không chạy được (vd đơn vị ms/s, FK vòng); `Major` = mô hình dữ liệu khác nhau giữa các tài liệu, cần quyết định thiết kế; `Minor` = lệch comment/ví dụ/tên mã, không ảnh hưởng cấu trúc.
3. **Vị trí & tên file**: `DB_SCHEMA_CONSISTENCY_REPORT.md` tại project root (theo lựa chọn người dùng).
4. **Chỉ báo cáo, không sửa**: mọi "Hướng sửa" là đề xuất; không chạm file gốc.
5. **Tham chiếu bằng `file:line` + tên section** để chịu được việc dòng bị trôi sau này.

### Proposed Changes
Tạo mới duy nhất file báo cáo với cấu trúc:

```

# BÁO CÁO RÀ SOÁT TÍNH NHẤT QUÁN THIẾT KẾ CSDL – EVN CDR AS

0. Tóm tắt điều hành (đếm theo mức độ, Top Critical)
1. Phạm vi, phương pháp & thứ tự nguồn chuẩn
2. Kiểm kê schema chuẩn (bảng → file/section định nghĩa lại hoặc tham chiếu)
3. Phát hiện Docs ↔ Docs            (D-01..)
4. Phát hiện Docs ↔ SQL dump        (S-01..)
5. Phát hiện Docs ↔ Templates       (T-01..)
6. Thiếu bảng / cột hỗ trợ tính năng (M-01..)
7. Ma trận tổng hợp & thứ tự xử lý đề xuất
Phụ lục A. Mâu thuẫn ngoài phạm vi CSDL phát hiện kèm
```

Quy trình thu thập cho từng phạm vi:
- **Docs↔Docs**: diff thủ công từng DDL trong module docs với `01_database_schema.md` (cột, COMMENT, index, FK, thứ tự `CREATE`); grep các enum/giá trị (`Direction`, `DisconnectionStatus`, `ReleasedBy`, role codes, permission codes, `status` enums, mã nhóm) qua toàn bộ `docs/**/*.md`.
- **Docs↔SQL**: đọc DDL dump (dòng 18–107) và lấy mẫu ≥5 dòng `REPLACE INTO` để kiểm tra: `Destroyed − Answered` so với `Answered_Duration`; tập giá trị `Direction`, `DisconnectionStatus`, `ReleasedBy`; định dạng `Recorded_*_FileName`; kiểu MOS.
- **Docs↔Templates**: grep field names trong tất cả `templates/**/*.js` (`extension`, `title`, `userGroupId`, `status:`, `totalCapacity`, permission codes, role codes, `direction`, `mos`) và so với cột schema / enum.
- **Thiếu bảng/cột**: với mỗi API trong `02_api_contracts.md` và mỗi nghiệp vụ trong module docs, xác định bảng/cột lưu trữ; ghi nhận nếu không tồn tại.

### Data Models / Contracts
Mẫu bản ghi phát hiện (dùng thống nhất trong mục 3–6):

```markdown
#### D-06 · Critical · Chuẩn hóa `Direction` / `DisconnectionStatus` trong `cdr_enriched`
| | |
|---|---|
| **Vị trí** | `docs/01_database_schema.md:62` (§2), `docs/01_database_schema.md:193-296` (DDL `cdr_enriched`), `docs/modules/12_core_business_cdr_and_audio.md:49,55,89-90,277-286` |
| **Mâu thuẫn** | §2 nói chuẩn hóa "sẽ được xử lý tại `cdr_enriched`" nhưng DDL không có cột chuẩn hóa; scheduler copy `...r` nguyên trạng; module 12 lại mô tả `Direction` = Inbound/Outbound/Internal |
| **Nguồn chuẩn đề xuất** | SQL dump (giá trị thô `remote`, `OK`) + bổ sung cột chuẩn hóa vào `01` |
| **Hướng sửa** | Thêm `direction_norm enum(...)`, `status_norm enum(...)`, `call_type` vào `cdr_enriched` + bảng mapping; cập nhật 12 §2.1/§3.1 |
```

Ma trận tổng hợp (mục 7): cột `ID | Mức độ | Phạm vi | Bảng/cột liên quan | Files liên quan | Ưu tiên xử lý`.

### File Structure
- **Thêm mới**: `D:\EVN\evn-cdr-as\DB_SCHEMA_CONSISTENCY_REPORT.md`
- **Không thay đổi**: toàn bộ `docs/**`, `templates/**`, `backend/**`, `frontend/**`.

### Risks
- **Số dòng trôi** nếu docs được sửa song song → luôn kèm tên section/heading bên cạnh `file:line`.
- **Suy diễn quá mức từ mock data** (templates là minh họa) → gắn nhãn rõ "Templates" và đa số ở mức Minor/Major, chỉ Critical khi templates là bằng chứng cho mâu thuẫn trong docs.
- **Dump chỉ có 5.369 dòng** → kết luận về tập giá tr�� (`Direction`, `ReleasedBy`) nêu rõ là "theo mẫu dump", đề xuất xác nhận với PABX.
- **Bảng Markdown chứa ký tự `|`** trong trích dẫn SQL → escape hoặc dùng code block.

# Preliminary Findings

### Danh sách phát hiện sơ bộ (đã xác minh trong quá trình khảo sát – sẽ được chuẩn hóa, bổ sung và gắn `file:line` đầy đủ trong báo cáo)

#### Critical
- **S-01 Đơn vị `Answered_Duration`**: dump dòng id=1: `Answered 08:02:40`, `Destroyed 08:03:06` (26 s) nhưng `Answered_Duration = 26102` ⇒ **mili-giây**. `01_database_schema.md:93,221` COMMENT "giây (seconds)"; `stats_hourly.total_duration_sec`, `14_core_business_call_traffic.md:28`, `02_api_contracts.md:58` (`135`) đều coi là giây.
- **D-06 Chuẩn hóa `Direction`/`DisconnectionStatus`**: `01:62` hứa chuẩn hóa tại `cdr_enriched` nhưng DDL `cdr_enriched` không có cột chuẩn hóa; `12:277-286` scheduler copy nguyên trạng; `12:49,55,89-90`, `stats_*` comment `DisconnectionStatus = ANSWERED`, `14:27`, templates `cdr-history.js:14-15` dùng giá trị chuẩn hóa trong khi dump chứa `remote`, `OK`.
- **D-02 FK vòng trong module 02**: `02_user_group.md:190` khai báo `fk_ug_rep_user` ngay trong `CREATE TABLE user_groups` (tham chiếu `users` chưa tồn tại) – `01:458-460` dùng `ALTER TABLE` sau khi tạo `users`.

#### Major
- **D-07 / T-03 Kích thước kho số**: `01:524`, `11:17` = 99.999 số (`00001–99999`); `05:21-22,209`, `templates/admin/dashboard.html:322-337`, `prefix-management.js:399-401` = 90.000 số (`10000–99999`); `evn_pabx_prefix_numbers_catalog.md:41` nói `0xxxx` là đầu số dịch vụ đặc biệt; `07:33` regex `^[1-8]\d{4}$` loại cả khối `9xxxx` đang dùng cho Tổng công ty (`96xxx` trong 05/15).
- **D-10 Thang điểm MOS**: `13:52` MOS lưu **số nguyên 1–5** (xác nhận bởi dump `RTP_Caller_G107MOS = 4`), nhưng `stats_*` định nghĩa `mos_good_count (3.5 ≤ MOS < 4.0)`, `mos_fair_count (3.0–3.5)`, `avg_mos ×100 (425 = 4.25)`; `13:27` UI dùng 3 dải, `stats_*`/`require_for_writing_docs.md:164` dùng 4 dải.
- **D-11 / T-04 Danh mục mã quyền không thống nhất**: `02_api_contracts.md` dùng `org:view/create/edit/delete`, `user_group:*`, `role:view`, `permission:view`, `prefix:view`, `qos:manage`; `10_permissions_and_roles.md:36-56` chỉ có `org:manage`, `role:manage`, `prefix:manage`…; `13:40` dùng `qos:sip_trace`; `templates/admin/data-permissions.js` dùng `cdr:export`, `qos:sip_trace`; `01:485` category có `QOS` không xuất hiện trong catalog.
- **D-08 Gán máy lẻ cho nhân sự**: `05:29,232-233` "Đang gán nhân sự (342 số)" mâu thuẫn `11:19-21` "không cấp phát máy lẻ cho cá nhân"; `phone_numbers.status` không có trạng thái tương ứng.
- **T-01 Trường `extension` trên user**: `templates/member/group-members.js:136`, `group-admin.js:144` (và ~26 chỗ khác) có `extension: "42101"`, `title` – `users` không có `extension` (bị phủ định rõ ở `11:21`) và cột là `job_title`.
- **T-02 Hướng FK nhóm đầu số**: `prefix-management.js:45`, `org-prefix.js:103` dùng `prefixGroups[].userGroupId` (FK ở phía nhóm đầu số) – schema đặt FK `user_groups.phone_prefix_group_id` (`01:409,420`); templates thiếu `code`, `prefix`, `number_length`; `status: 'Đang dùng'` vs enum `ACTIVE/INACTIVE`; id chuỗi `'ug-evnict'` vs `int`.
- **D-15 Xóa nhóm vs bất biến nhóm**: `02:555` TC-UG-06 "Chuyển toàn bộ thành viên ra khỏi nhóm" mâu thuẫn `02:36`, `03:20-23` (`user_group_id` immutable) và `fk_users_group ON DELETE RESTRICT`.
- **D-23 Vai trò bảng `call_duration_records`**: `14:67-98` đọc từ `call_duration_records`; `02:209`, `00:111` nói `traffic/summary` đọc từ `stats_daily`; bảng 1:1 với `cdr_enriched` trùng lặp `Answered_Duration`, `caller/called_group_id`; `call_type` 3 giá trị (`INTRA/INTER/INTERNAL_EVN`) không ánh xạ 1:1 với 3 chiều `stats_*` (`outbound/inbound/intra`) – cuộc gọi có 1 phía `NULL` không thuộc chiều nào.
- **S-05 Đường dẫn file ghi âm**: dump `Recorded_Mix_FileName = 'D:\StarTrinity\recordings\2025_06_11\…wav'` (đường dẫn tuyệt đối Windows, `.wav`, RX/TX NULL) vs `12:67-76` layout Linux tương đối `/data/pabx_recordings/2026/05/25/rec_*_mix.mp3`, `Content-Type: audio/mpeg`, 3 kênh rx/tx/mix.
- **M-01 Thiếu bảng refresh token / session**: `02:94-95,109-110` (`/auth/refresh`, `/auth/logout` hủy token), `09:14` (Active Sessions thu hồi token từ xa) – không có bảng `refresh_tokens`/`sessions`.

#### Minor
- **D-01** `01_database_schema.md` đánh số mục nhảy 13 → 15 (thiếu §14).
- **D-03** `03_auth_user.md:44-65` DDL `users` thiếu `idx_users_group_admin` có trong `01:454` và `02:222`.
- **D-04** ERD `02:59-79` thiếu `allow_recording_access`, `description` (USER_GROUPS) và `can_access_recording`, `job_title`, `phone_number` (USERS).
- **D-05** `01_organization.md:39-57` DDL bỏ COMMENT cột `level`, `representative_name` so với `01:361-367`.
- **D-09** `05:42` KPI MOS tính `AVG((RTP_Caller_G107MOS + RTP_Called_G107MOS)/2)` trực tiếp trên cột `cdr` dù tuyên bố Zero CDR Scan (phải là `stats_*.avg_mos/100`).
- **D-12** `permissions.scope enum('ADMIN','USER','BOTH')` không biểu diễn được "ADMIN (ROOT ONLY)" / "USER (GROUP_ADMIN ONLY)" trong `10:43,51-52`.
- **D-13** Vai trò "Kỹ thu���t viên" (`10:265`, `09:81`) không có trong catalog roles (`01:470`).
- **D-14** Danh mục `audit_logs.action` không chuẩn: `01:764` vs `ADMIN_LOGIN` (04:68), `MEMBER_RECORDING_ACCESS_TOGGLED` (02:434), `EXPORT_REPORT (Type: EXCEL)` (15:61); `resource_name` thiếu `USER_GROUP`, `PREFIX`.
- **D-17 / S-04** `ReleasedBy`: dump `'caller'` (thường) vs `stats_*` comment `CALLER/CALLED/SYSTEM`; `13:58` "caller, called".
- **D-18 / T-06** Định dạng `user_groups.code`: `UMO-IT-01` (01, 14), `UMO-IT`/`UMO-AUDIT` (02), `UG-KT-01`/`UG-IT-01` (12, templates).
- **D-19** `organizations.level`: `01:367` (0 = Tập đoàn, 1 = Tổng công ty) nhưng `01_organization.md:77-82` root "Tổng công ty 71" có `level: 0`; `DEFAULT 1` vs quy tắc `parent.level + 1`.
- **D-26** `notifications.type = PABX_OFFLINE` mô tả theo cơ chế "file log/polling" (`06:16`) trong khi `07:17` khẳng định ingestion real-time không FTP; ngưỡng MOS < 2.5 / Loss > 5% hard-code (`06:15`) thay vì `qos_threshold_configs`.
- **D-27 / M-04** `qos_threshold_configs` (`01:673`) có endpoint `/qos/thresholds` (`02:199-200`) nhưng module 13 không mô tả API/nghiệp vụ, chỉ liệt kê entity.
- **D-20 / M-10** Chiến lược partition/retention chỉ nêu cho `cdr`; `cdr_enriched`, `call_duration_records` không có; `stats_* ON DELETE CASCADE` theo `user_groups` xóa lịch sử thống kê trong khi `cdr_enriched` chỉ `SET NULL`.
- **D-21** `00:176-179` mô tả tra cứu 2 cấp (`phone_numbers` rồi `phone_prefix_ranges`) nhưng theo `01:526` số chỉ có nhóm qua `range_id` ⇒ 2 cấp là cùng một nguồn.
- **D-22 (Phụ lục)** `05:6-7`, `06:5`, `10:5`, `12:3`, `13:5` tham chiếu `templates/*.html` lỗi thời sau khi tách `templates/admin|member/` (`docs/intent/split-templates-dual-portal.md`).
- **S-09** Dump từ MariaDB `11.7.2` vs docs "MariaDB 10.6+" (tương thích, chỉ ghi nhận); kiểu `json` là alias `longtext` trên MariaDB.
- **S-11** `templates/member/cdr-history.js:70` `callerId: "0912345678"` (di động) và catalog `0xxxx` dịch vụ mâu thuẫn giả định "100% cuộc gọi nội bộ 5 số" (`01:644`, `14:19`); `call_duration_records.caller_number varchar(50)` vs `phone_numbers.phone_number varchar(10)`.
- **M-02** Chính sách đổi mật khẩu 90 ngày (`09:13`), khóa sau 5 lần sai (`03:249`) – thiếu `password_changed_at`, `failed_login_attempts`, `locked_until`.
- **M-05** `external_api_token` lưu 1 dòng `system_settings` nhưng `07:95` nói "vô hiệu hóa khóa cũ" (cần lịch sử/multi-token cho ETMS, VTDR).
- **M-06** `05:214-215` biểu đồ "theo Thuê bao" / "theo Đầu số" không có bảng stats theo prefix/số máy ⇒ buộc quét CDR trái nguyên tắc Zero CDR Scan.
- **M-07** Sinh cảnh báo QoS (`06`, `02:250 cdr:new_alert`) chưa có bảng trạng thái/dedupe (`qos_alerts`).
- **M-08** `12:167,175` ghi `user_group_id` vào audit log nhưng `audit_logs` không có cột (chỉ `action_details json`).
- **M-11 (informational)** `user_settings.user_id`, `notification_recipients.recipient_id`, `audit_logs.actor_id` là polymorphic kh��ng FK – ghi nhận là quyết định thiết kế.

> Danh sách trên là kết quả khảo sát ban đầu; giai đoạn thực hiện sẽ quét nốt các file template chưa đọc (`users.js`, `user_group.js`, `roles.js`, `permissions.js`, `prefix-history.js`, `qos-debug.js`, `reports.js`, `dashboard.js`, `system-settings.js`, `notifications.js`, `profile.js`) và module docs còn lại để bổ sung.

# Testing

### Validation Approach
Đây là deliverable dạng tài liệu nên kiểm chứng tập trung vào **tính đúng của tham chiếu** và **tính tái lập của phát hiện**:
1. Mỗi `file:line` trong báo cáo được mở lại (`open`) hoặc grep lại ngay trước khi chốt; nội dung trích dẫn phải khớp.
2. Mỗi phát hiện có ít nhất **2 phía bằng chứng** (vị trí A nói X, vị trí B nói Y).
3. Các kết luận từ SQL dump phải dựa trên **≥ 5 dòng mẫu** (vd. so `Destroyed − Answered` với `Answered_Duration` trên nhiều `id`).
4. Kiểm tra tổng số phát hiện trong Tóm tắt điều hành = số dòng trong Ma trận tổng hợp = số bản ghi ở mục 3–6.
5. Xác nhận **không có file nào khác** bị thay đổi ngoài file báo cáo mới (git status chỉ hiển thị 1 untracked file).

### Key Scenarios
- Mở `DB_SCHEMA_CONSISTENCY_REPORT.md` – tất cả bảng Markdown render đúng (không vỡ cột do ký tự `|`).
- Chọn ngẫu nhiên 5 phát hiện mỗi nhóm (D/S/T/M), grep từ khóa trong file được dẫn chiếu → tìm thấy đúng dòng.
- Kiểm tra phát hiện S-01: grep 5 dòng `REPLACE INTO` trong dump, tính chênh lệch `Destroyed − Answered` (giây) và so với `Answered_Duration/1000`.
- Kiểm tra D-11: grep toàn bộ mã quyền dạng `xxx:yyy` trong `docs/**/*.md` và `templates/**/*.js`, đối chiếu tập hợp với catalog `10_permissions_and_roles.md`.
- Kiểm tra T-01: grep `extension` trong `templates/**/*.js` → số lần xuất hiện khớp con số nêu trong báo cáo.

### Edge Cases
- Dòng tham chiếu bị lệch do file có CRLF/BOM → dùng cả tên section/heading bên cạnh số dòng.
- Phát hiện chỉ dựa trên mock data templates → gắn rõ nhãn nguồn "Templates" và không nâng lên Critical nếu docs tự nhất quán.
- Cuộc gọi trong dump có `Answered = NULL` (không nhấc máy) → loại khỏi mẫu kiểm tra đơn vị thời lượng.
- Giá trị `Direction`/`ReleasedBy` chỉ quan sát trên mẫu dump → ghi chú "theo mẫu 5.369 dòng".

### Test Changes
- Không thêm/sửa test tự động (deliverable là tài liệu). Việc kiểm chứng được thực hiện thủ công bằng `open`/`grep_search` trong giai đoạn cuối.

# Delivery Steps

### ✓ Step 1: Tạo khung báo cáo và kiểm kê schema chuẩn
File `DB_SCHEMA_CONSISTENCY_REPORT.md` tồn tại ở project root với mục 0–2 hoàn chỉnh và bảng kiểm kê 25 bảng + 1 view.

- Tạo file `D:\EVN\evn-cdr-as\DB_SCHEMA_CONSISTENCY_REPORT.md` với outline 0–7 + Phụ lục A (các mục 3–7 để placeholder).
- Viết mục 1: phạm vi (docs/, templates/, SQL dump), phương pháp đối chiếu, thứ tự nguồn chuẩn (SQL dump → `01_database_schema.md` → module docs → templates), định nghĩa thang Critical/Major/Minor, mẫu bản ghi phát hiện.
- Viết mục 2: bảng kiểm kê từ `docs/01_database_schema.md` – mỗi bảng/view: section, số cột, enum chính, FK; cột "Định nghĩa lại tại" (01_organization §2, 02_user_group §2.1–2.3, 03_auth_user §2, 04_auth_admin §2, 08_user_profile §2, 11_core_business_phone_numbers §2, 14_core_business_call_traffic §2.1) và cột "Tham chiếu tại" (02_api_contracts, 05, 06, 07, 09, 10, 12, 13, 15).
- Ghi nhận ngay D-01 (thiếu §14 trong `01_database_schema.md`) làm ví dụ bản ghi mẫu.

### ✓ Step 2: Rà soát và ghi nhận mâu thuẫn Docs ↔ Docs
Mục 3 của báo cáo chứa đầy đủ các phát hiện D-xx với `file:line`, mức độ và hướng sửa.

- Diff từng DDL trong module docs với `01_database_schema.md`: `organizations` (01_organization), `phone_prefix_groups`/`user_groups`/`users` (02_user_group – FK vòng `fk_ug_rep_user` dòng 190), `users` (03_auth_user – thiếu `idx_users_group_admin`), `admins` (04), `user_settings` (08), 5 bảng kho số + view (11), `call_duration_records` (14).
- Grep toàn bộ `docs/**/*.md` các giá trị enum/mã: `Direction`, `DisconnectionStatus`, `ReleasedBy`, role codes, permission codes (`[a-z_]+:[a-z_]+`), `user_groups.code` mẫu, `audit_logs.action`, kích thước kho số (99.999 / 90.000), regex `analysis_internal_extension_pattern`, thang MOS/dải MOS.
- Chuẩn hóa và ghi các phát hiện đã xác định: D-02, D-04, D-05, D-06, D-07, D-08, D-09, D-10, D-11, D-12, D-13, D-14, D-15, D-17, D-18, D-19, D-20, D-21, D-23, D-26, D-27; bổ sung phát hiện mới nếu có khi đọc kỹ 05, 06, 07, 09, 13, 15.
- Với mỗi mục ghi rõ nguồn chuẩn đề xuất (ví dụ: D-06 → bổ sung cột chuẩn hóa vào `cdr_enriched` trong `01`; D-11 → chốt catalog trong `10` và sửa `02`).
- Đưa các mâu thuẫn ngoài CSDL phát hiện kèm (đường dẫn template lỗi thời D-22) vào Phụ lục A.

### ✓ Step 3: Rà soát và ghi nhận mâu thuẫn Docs ↔ SQL dump
Mục 4 của báo cáo chứa các phát hiện S-xx dựa trên bằng chứng dữ liệu thật từ `docs/voip_cdr_20250817.sql`.

- So sánh DDL `cdr` trong dump (dòng 18–107) với `01_database_schema.md` §2 và `require_for_writing_docs.md` – xác nhận cột/kiểu khớp, ghi nhận khác biệt COMMENT (`Answered_Duration` "giây").
- Lấy mẫu ≥ 5 dòng `REPLACE INTO` có `Answered IS NOT NULL`: tính `Destroyed − Answered` và so với `Answered_Duration` → chốt S-01 (mili-giây) kèm bảng số liệu minh chứng.
- Grep tập giá trị quan sát được của `Direction`, `DisconnectionStatus`, `DisconnectionCode`, `ReleasedBy`, `RTP_Codec` trong dump; đối chiếu với giá trị docs/templates mong đợi (S-02, S-03, S-04).
- Ghi nhận định dạng `Recorded_*_FileName` (đường dẫn Windows tuyệt đối, `.wav`, RX/TX NULL) so với `12_core_business_cdr_and_audio.md` §2.3 và API stream (S-05).
- Ghi nhận kiểu/thang MOS số nguyên (S-06 → liên kết D-10), phiên bản MariaDB 11.7.2 vs "10.6+" và kiểu `json` (S-09), số liệu ngoại mạng/0xxxx (S-11).
- Mỗi phát hiện kèm trích dẫn dòng dump cụ thể (`docs/voip_cdr_20250817.sql:111` …).

### ✓ Step 4: Rà soát Docs ↔ Templates và tính năng thiếu bảng/cột
Mục 5 (T-xx) và mục 6 (M-xx) của báo cáo hoàn chỉnh.

- Grep field names trong toàn bộ `templates/admin/*.js` và `templates/member/*.js` (đặc biệt các file chưa đọc: `users.js`, `user_group.js`, `roles.js`, `permissions.js`, `prefix-history.js`, `qos-debug.js`, `reports.js`, `dashboard.js`, `system-settings.js`, `notifications.js`, `profile.js`, `user-settings.js`) và ánh xạ sang cột schema.
- Ghi nhận T-01 (`extension`, `title` trên user – đếm số lần xuất hiện), T-02 (hướng FK `prefixGroups.userGroupId`, thiếu `code`/`prefix`, status tiếng Việt, id chuỗi), T-03 (kho số 90.000 trong `dashboard.html`, `prefix-management.js`), T-04 (`cdr:export`, `qos:sip_trace` trong `data-permissions.js`), T-05 (`direction`/`status`/`mos` chuẩn hóa trong `cdr-history.js`), T-06 (mã nhóm `UG-` vs `UMO-`), cùng phát hiện mới từ các file vừa quét.
- Rà `02_api_contracts.md` endpoint-by-endpoint và các nghiệp vụ trong module docs để xác định bảng/cột lưu trữ; ghi nhận M-01 (refresh token/sessions), M-02 (password policy/lockout), M-03 (cột chuẩn hóa `cdr_enriched`), M-04 (`qos_threshold_configs` orphan), M-05 (API token history), M-06 (stats theo prefix/thuê bao), M-07 (`qos_alerts`), M-08 (`audit_logs.user_group_id`), M-10 (partition/retention `cdr_enriched`), M-11 (polymorphic no-FK – informational).
- Mỗi mục ghi nguồn chuẩn và hướng sửa (thêm bảng/cột vào `01`, hoặc điều chỉnh mô tả module).

### ✓ Step 5: Hoàn thiện tóm tắt, ma trận tổng hợp và tự kiểm chứng
Báo cáo hoàn chỉnh, mọi tham chiếu đã được xác minh, chỉ 1 file mới được tạo.

- Viết mục 7: ma trận `ID | Mức độ | Phạm vi | Bảng/cột | Files | Ưu tiên` cho toàn bộ D/S/T/M; đề xuất thứ tự xử lý (Critical → Major → Minor) và danh sách quyết định thiết kế cần chốt (đơn vị thời lượng, kích thước kho số, thang MOS, catalog quyền, hướng FK nhóm đầu số, vai trò `call_duration_records`).
- Viết mục 0: tổng số phát hiện theo mức độ, Top Critical/Major, 3–5 khuyến nghị hành động đầu tiên.
- Tự kiểm chứng: mở lại/grep lại từng `file:line` được dẫn chiếu; đảm bảo số lượng ở mục 0 = mục 7 = tổng mục 3–6; kiểm tra bảng Markdown không vỡ (escape `|`).
- Xác nhận `git status` chỉ có 1 file untracked `DB_SCHEMA_CONSISTENCY_REPORT.md`, không file nào trong `docs/`, `templates/` bị thay đổi.