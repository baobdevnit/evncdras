# Intent: Chuẩn hóa `docs/` sẵn sàng sinh code

> Chốt ngày 2026-10-23 · Nguồn: phỏng vấn sau báo cáo `DB_SCHEMA_AUDIT_2026-10-23.md`
>
> **Lưu ý (2026-10-26)**: Q6 và phần `role_permissions`/`role:manage` của Q7 đã được thay thế bởi `docs/intent/roles-permissions-redesign.md`.

- **Kết quả**: `docs/` đủ chuẩn để sinh code toàn bộ dự án; mỗi quyết định Q1–Q11 (mục 6 báo cáo) có một đáp án duy nhất, ghi vào `docs/01_database_schema.md` và các module liên quan.
- **Cách làm**: phỏng vấn từng câu (kèm đề xuất + bằng chứng dữ liệu thật); chốt câu nào cập nhật docs câu đó rồi mới hỏi tiếp.
- **Thứ tự**: Q2 → Q3 → Q1 → Q4 → Q5 → Q9 → Q6 → Q7 → Q8 → Q10 → Q11.
- **`templates/`**: chỉ dùng tham chiếu; điểm vướng giữa docs và template được nêu trong câu hỏi. Không sửa template trong đợt này; gom danh sách việc cần sửa template cho đợt sau.
- **Tự sửa không hỏi**: các điểm dữ liệu thật đã chứng minh (`Answered_Duration` là ms, `Direction='remote'`, MOS số nguyên, ghi âm `.wav`, bảng `cdr` 87 cột).
- **Hoàn tất khi**: rà lại toàn bộ `docs/`, báo cáo cập nhật không còn Critical/Major; kèm danh sách việc cần sửa template.
- **Ngoài phạm vi**: sửa `templates/`, sinh code; lỗi Minor chỉ sửa khi nằm cùng chỗ đang sửa.

## Nhật ký quyết định

| # | Quyết định | Chốt |
|---|---|---|
| Q2 | Gộp leg / chọn leg chính | Khóa (`CallerId`, `CalledId`, `Created` ± 2 s), tối đa 1 leg A + 1 leg B mỗi cuộc (ghép B với A gần nhất); leg chính = leg A (`CalledIp` thuộc `pabx_core_ip_list`); cuộc 1 leg thì leg đó là chính; leg B lưu `is_primary_leg = 0`, không đếm stats, vẫn xem được ở QoS debug; danh sách IP lõi lưu ở setting `pabx_core_ip_list` (mặc định `10.128.16.252,10.128.16.253`). Đã kiểm tra trên dump: 1.859/1.859 cặp đúng dạng A+B, 0 leg UNKNOWN |
| Q3 | Ánh xạ mã SIP → `call_status`, ASR/NER | Cột `cdr_enriched.call_status` enum `ANSWERED` (200) / `BUSY` (486, 603) / `NO_ANSWER` (487, 480) / `FAILED` (còn lại); trạng thái cuộc gọi = trạng thái leg chính; `ASR = answered/total`, `NER = (answered+busy+no_answer)/total`, tỷ lệ kỳ dài tính lại từ bộ đếm; thêm `sip_480_count`; bảng ánh xạ cố định trong code (`01` §2.1) |
| Q1 | Bộ cột dẫn xuất `cdr_enriched` | `Answered_Duration` sửa COMMENT thành ms; thêm `answered_duration_sec` (= ROUND(ms/1000) nếu ANSWERED, ngược lại 0) và `call_type`; hướng gọi Inbound/Outbound/Internal **không lưu**, tính lúc truy vấn theo nhóm người xem (Admin không chọn nhóm thì lọc `call_type`); **bỏ bảng `call_duration_records`**, `/traffic/records` đọc `cdr_enriched` leg chính; MOS ×100 để Q4 |
| Q4 | Thang MOS & dải phân loại | MOS thập phân tính từ `G107R` theo E-model (khớp `ROUND` 8.334/8.334 giá trị PABX); cột `mos_caller_x100`, `mos_called_x100`, `mos_x100` (= trung bình hai chiều) trên `cdr_enriched`; 1 bộ 4 dải duy nhất ở `01` §2.1 (≥4.0 / 3.5–<4.0 / 3.0–<3.5 / <3.0, + "không có dữ liệu"); stats thêm `qos_sample_count`, trung bình QoS gia quyền theo cột này, trả `null` khi không có mẫu; hiển thị 2 chữ số thập phân |
| Q5 | Không gian số | Kho `phone_numbers` = 90.000 số `10000`–`99999` (khối 1–9); khối 0 (`0xxxx`) là dịch vụ đặc biệt, không phải máy lẻ; regex mặc định `^[1-9]\d{4}$`; số không khớp là **số ngoài kho** (Anonymous, 0xxxx, 1–4 chữ số kể cả trạm cũ, di động) → nhóm NULL; dải số `number_length = 5`, nằm trọn trong một `prefix` và trong 10000–99999; bỏ các câu "100 % cuộc gọi nội bộ 5 số" |
| Q9 | Chiều lưu lượng | Dòng nhóm: outbound/inbound tính cả phía NULL, `total = out + in + intra`; dòng toàn hệ thống: thêm `calls_inter_group`, `calls_unassigned` (+ `inter/unassigned_duration_sec`), out/in = 0, `total = intra + inter + unassigned`; **không bao giờ cộng các dòng nhóm** ra tổng hệ thống, báo cáo nhiều nhóm không có dòng "Tổng cộng"; đổi enum `INTERNAL_EVN` → `UNASSIGNED` ("Chưa xác định nhóm") |
| Q6 | Nguồn sự thật cho vai trò | Cờ là nguồn duy nhất: `is_root` → ROOT/SYSTEM_ADMIN; `is_group_admin` → GROUP_ADMIN, nếu không `can_access_recording` → USER_RECORDING, còn lại REGULAR_USER; **bỏ bảng `user_roles`, `admin_roles`**; `roles` seed cố định 5 dòng, không tạo/xóa; `role:manage` chỉ chỉnh ma trận `role_permissions`; quyền ghi âm thực tế = `allow_recording_access AND (is_group_admin OR can_access_recording)`; API bỏ `roleIds`, trả `roleCode` chỉ đọc; quyền mới hiệu lực từ lần cấp token kế tiếp |
| Q7 | Catalog mã quyền | Catalog duy nhất 26 mã ở `M10` kèm seed SQL `permissions` + `role_permissions`; quy ước `:view`/`:manage` (gộp `org:create/edit/delete` → `org:manage`, `user_group:*` → `user_group:manage`, `permission:view` → `role:view`, `qos:sip_trace` → `qos:view`); thêm `cdr:export` (+ API `GET /cdr/export`); category `DATA, SPECIAL, QOS, USER_MGMT, ORG, SYSTEM`; "ROOT ONLY"/"GROUP_ADMIN ONLY" thể hiện qua seed ma trận, không qua `scope`; thao tác cá nhân (dashboard, thông báo, hồ sơ, đổi mật khẩu) không cần mã quyền |
| Q8 | Chính sách xóa | Mục mới `01` §14. Xóa mềm (`INACTIVE`) cho `user_groups` (kèm thu hồi dải số, giữ CDR/stats/liên kết nhóm đầu số), `users`, `admins`; xóa cứng có điều kiện cho `phone_prefix_groups`, `organizations`; thu hồi dải = dọn số → ghi lịch sử → xóa dải. FK đổi sang RESTRICT: `fk_ug_org`, `fk_cdre_*_group`, `fk_ppr_group`, `fk_pn_range`, `fk_stat_*_group`. Cấp phát gán `range_id` cho mọi số (FREE→ALLOCATED, RESERVED/LOCKED giữ nguyên); thu hồi ALLOCATED→FREE, RESERVED/LOCKED giữ nguyên; số có `range_id` thuộc nhóm bất kể trạng thái |
| Q10 | Phiên & mật khẩu | Bảng mới `auth_sessions` (`01` §6.1, polymorphic ADMIN/USER, lưu hash Refresh Token, xoay vòng + phát hiện dùng lại); Access Token 15 phút trong bộ nhớ, Refresh Token 7 ngày qua cookie HttpOnly; `admins`/`users` thêm `password_changed_at`, `must_change_password`, `failed_login_count`, `locked_until`; khóa tạm 15 phút sau 5 lần sai (`423`); mật khẩu ≥10 ký tự, 3/4 loại, hết hạn 90 ngày; 6 setting `security_*` (ADVANCED); API sessions + thu hồi phiên; 2FA ngoài phạm vi |
| Q11 | Partition & vòng đời | Không đụng bảng `cdr` của PABX (bỏ gợi ý partition, 9 index chỉ là khuyến nghị cần PABX đồng ý, bỏ `AUTO_INCREMENT=5370`); `cdr_enriched` partition RANGE theo tháng trên `Created` (NOT NULL, fallback Destroyed/thời điểm làm giàu), PK (`id`,`Created`), **bỏ 2 FK `fk_cdre_*`** (tham chiếu logic); job tạo trước partition; trực tuyến 6 tháng, 6–60 tháng chỉ Admin xem qua `includeArchive=true` (tối đa 31 ngày/lần), quá 60 tháng `DROP PARTITION`; stats/audit/lịch sử không dọn. **Điều chỉnh so với đề xuất ban đầu**: bỏ bảng lưu trữ nén riêng qua `EXCHANGE PARTITION` vì MariaDB yêu cầu hai bảng cùng định nghĩa (kể cả `ROW_FORMAT`), nên không nén được; dữ liệu lưu trữ nằm ngay trong các partition cũ |

## Vòng 2 – sau lượt rà lại toàn bộ docs (2026-10-23)

**Đã sửa máy móc (không cần quyết định)**:
- Bỏ mọi bản sao DDL trong module (M01, M02, M03, M04, M08, M11), thay bằng tham chiếu `01`.
- Viết lại mẫu tiến trình làm giàu ở M12 (transaction, đủ cột dẫn xuất, gộp leg).
- Thống nhất quy tắc xác định nhóm sở hữu số (chỉ qua `range_id`) ở `00`, M12, M14.
- Sửa ví dụ QoS debug (giây, MOS thập phân, thông tin leg) và hợp đồng `GET /cdr/:id` (`legs[]`).
- DTO dùng `roleCode` thay mảng `roles`, thêm `allowRecordingAccess`; bỏ lưu token `evn_admin_token`; mật khẩu ≥10 ký tự ở M08.
- Sửa các quy tắc xóa nhóm cũ ở M02/M03/M11 (chỉ đếm admin/thành viên đang hoạt động).
- `audit_logs`: thêm `actor_type = SYSTEM`, `actor_id` NULL-able, danh mục hành động duy nhất ở `01` §13; đổi `ADMIN_LOGIN`, `MEMBER_RECORDING_ACCESS_TOGGLED`.
- Đổi "85 cột" thành 87; sửa mô tả `Direction`, ReleasedBy không phân biệt hoa thường, các tham số phân trang, nhãn dải MOS, ERD vẽ khóa polymorphic bằng nét đứt.
- Thêm tham số bộ lọc nâng cao cho `GET /cdr`; `00` và `03_ui_design` ghi rõ docs được ưu tiên hơn templates.

**Cần quyết định (R1–R13)**:

| # | Chủ đề | Nguồn |
|---|---|---|
| R1 | Thuật toán tổng hợp `stats_*` (khóa thời gian, tính lại idempotent) | C3 |
| R2 | Múi giờ lưu trữ và trả về API | C4 |
| R3 | File ghi âm: ánh xạ đường dẫn, `.wav`, kênh | C5 |
| R4 | Guard cho route dùng chung Admin/User | J1 |
| R5 | Tạo nhóm và Quản trị viên nhóm đầu tiên | J4 |
| R6 | Hợp đồng API: 02 là nguồn duy nhất, endpoint lệch/thiếu | J2, J3 |
| R7 | Phạm vi Zero CDR Scan và widget M05 không có nguồn | J8, J9 |
| R8 | Trọng số roll-up QoS còn lại và KPI dựa trên cột luôn NULL | J11, J12 |
| R9 | Ngưỡng QoS, sinh cảnh báo và thông báo toàn hệ thống | J13, J14 |
| R10 | Phạm vi theo tổ chức và quy tắc báo cáo M15 | J16, J17 |
| R11 | Vòng đời nhóm đầu số/dải/số đơn lẻ, chuyển người sang nhóm khác | J6, J20, J23 |
| R12 | Admin bật ghi âm/bổ nhiệm admin nhóm, SIP Ladder, token giới hạn | J7, J18, J19 |
| R13 | Các setting chưa có hành vi | J22 |

| # | Chốt |
|---|---|
| R1 | Tổng hợp stats **tính lại idempotent** (không cộng dồn): khóa thời gian = `Created` của leg chính; job 10 phút tính lại 3 giờ gần nhất + khung giờ trong bảng mới `stats_recompute_queue`; `stats_daily` tính lại từ `stats_hourly`; chốt sổ 00:05 tính lại 24 giờ; khóa `GET_LOCK`; tiến trình làm giàu đẩy khung giờ trễ > 3 giờ vào hàng đợi (`01` §15.0, `00`, M12) |
| R2 | Múi giờ: DB lưu giờ Việt Nam (UTC+7) không kèm múi giờ; cấu hình MariaDB `default-time-zone=+07:00`, TypeORM `timezone=+07:00`, `TZ=Asia/Ho_Chi_Minh`; API trả ISO 8601 có `+07:00`, tham số không offset hiểu là giờ VN; ngày thống kê do backend tính và truyền tham số (bỏ `CURRENT_DATE()` ở M05, "Tháng này" = tháng lịch); sửa mọi ví dụ `Z` (`01` đầu file, `00` §2.3, `02_api` §2) |
| R3 | File ghi âm: setting `recording_path_map` (JSON, ADVANCED) ánh xạ đường dẫn Windows của PABX sang thư mục SMB/NFS gắn chỉ đọc, có chặn path traversal; giữ `.wav`, `audio/wav`, hỗ trợ Range, không chuyển mã; chỉ kênh Mix (bỏ tham số `channel`, RX/TX không dùng); `hasAudio` theo cột, thiếu file trả `404 RECORDING_FILE_NOT_FOUND`; mỗi leg một file; PCAP có dữ liệu nhưng chưa khai thác; bỏ mọi chữ MP3 (M12 §2.3, M07, `01`, `00`, `02_api`, M02, M10, `03_ui`) |
| R4 | **Không dùng guard chung**: mọi API Admin nằm dưới `/api/v1/admin/*` (`AdminAuthGuard`), User ở `/api/v1/*` (`UserAuthGuard`), token sai portal trả 401; route dùng chung có 2 bản (User tự cô lập nhóm; bản `/admin` phạm vi toàn hệ thống + tham số Admin) dùng chung service/DTO; cột `Portal` (ADMIN / USER + ADMIN / USER) cho mọi endpoint ở `02_api` mục 3; route chỉ-Admin đổi sang `/admin` (tạo/sửa/xóa tổ chức, nhóm, dải số, vai trò, ngưỡng QoS); WebSocket 2 namespace `/notifications`, `/admin/notifications`, token trong payload `auth` |
| R5 | Tạo nhóm + Quản trị viên nhóm đầu tiên trong **một transaction**: bỏ `initialAdminUserId`/`adminUserIds`, body có `initialAdmin {username, email, fullName, phoneNumber?, jobTitle?}`; user tạo với `is_group_admin = 1`, `must_change_password = 1`, mật khẩu tạm 16 ký tự; `representative_user_id` = user đó; mật khẩu tạm trả về **một lần** trong response; trùng username/email thì 409 và rollback (M02 §2, §3.2, §5, TC-UG-02) |
| R6 | `02_api` là nguồn hợp đồng API duy nhất. Hợp nhất: ma trận quyền `GET/PUT /admin/permissions/matrix` (bỏ `GET /permissions`, `PUT /roles/:id/permissions`); bỏ `PUT /prefixes/group/:groupId` (thao tác theo từng dải); `/qos/analytics` → `/qos/summary` + `/qos/disconnection-codes`; `/reports/data` → `/reports/summary`; bổ nhiệm/hạ quyền admin nhóm chỉ qua `PUT /users/:id/group-admin`. Bổ sung: CRUD `/admin/prefix-groups` + `/available`, `PUT /admin/phone-numbers/:number` (enum lịch sử thêm `RESERVE`/`UNRESERVE`/`UPDATE_INFO`), `/admin/phone-numbers/pool/summary`, sửa/đặt lại mật khẩu admin, thu hồi phiên user, `/admin/audit-logs`, preferences + recent-activity của admin, avatar 2 portal; hợp đồng `/dashboard/charts` (M05 §3.2) và ngưỡng QoS (M13 §3.3) |
| R7 | Zero CDR Scan phát biểu lại (`01` §15, `00`, `02_api`, M05): số liệu tổng hợp chỉ đọc `stats_*`; danh sách từng cuộc gọi được đọc `cdr_enriched` với khoảng `Created` ≤ 31 ngày, qua index, trang ≤ 100 dòng, xuất ≤ 100.000 dòng; thêm `GET /dashboard/recent-calls` (24 giờ, tối đa 20); widget M05: kho số theo 4 trạng thái thật, bỏ "Đang gán nhân sự", "Trunk SIP", nút demo; biểu đồ theo thuê bao/đầu số thay bằng Top 10 nhóm |
| R8 | Bỏ 8 cột stats luôn NULL (`avg/max_rtcp_rtt_ms`, `total/discarded_*_packets`, `avg_audio_signal_delay_ms`) và `released_by_system_count`; độ trễ SIP/nhấc máy lưu `sum_*_delay_ms` + `cnt_*_delay`; mất gói lưu `rtp_packets_total` + `rtp_lost_packets_total` (hai chiều), `high_packet_loss_calls_count` theo ngưỡng critical `PACKET_LOSS_PERCENT`; jitter `decimal(8,3)`, trung bình gia quyền `qos_sample_count`; quy tắc roll-up bổ sung ở `01` §15; bỏ RTCP RTT khỏi `00`, M13, M15 |
| R9 | Seed 5 ngưỡng `qos_threshold_configs` (MOS 3.5/3.0, mất gói 1/2 %, jitter 30/50 ms, ASR 70/50 %, RTT tắt); Alert Engine ở `01` §10: `QOS_ALERT` theo giờ sau job tổng hợp (đủ `qos_alert_min_calls` = 20), `PABX_OFFLINE` sau `pabx_offline_minutes` = 60; `notifications.dedupe_key` UNIQUE, thêm `created_by_admin_id`, **bỏ `is_global`**, luôn tạo 1 dòng người nhận mỗi tài khoản; `POST /admin/notifications` với `target`; email chỉ cho CRITICAL qua `smtp_*`; WebSocket chỉ `notification:new` (bỏ `cdr:new_alert`, `notification:broadcast`); bỏ ngưỡng viết cứng ở M06, M13, `02_api` |
| R10 | Cây tổ chức chỉ tham chiếu (hiển thị `hierarchyPath`, lọc danh sách nhóm theo nhánh trên Admin), không phân quyền/lọc/cộng số liệu (`00` §1, M01, `02_api`); báo cáo dùng `groupId` = `user_groups.id` số nguyên, `null` = toàn hệ thống (bỏ `"all"`, bỏ đầu số làm id, bỏ `orgName`); Excel/PDF: dòng tổng chỉ cho một phạm vi theo thời gian, tỷ lệ/trung bình tính lại từ bộ đếm, báo cáo nhiều nhóm không có dòng tổng cộng; doughnut theo `call_type`; bỏ Role Switcher (M15) |
| R11 | Không đổi `phone_prefix_group_id` sau khi tạo nhóm (`409`); enum `prefix_allocation_history.action_type` chỉ còn `ALLOCATE`/`REVOKE`/`UPDATE`; bỏ `assign-to-range`/`revoke-from-range` (số chỉ đổi `range_id` qua thao tác dải); sửa dải: phần mở rộng chỉ chứa số chưa thuộc dải nào, thu hẹp xử lý như thu hồi, ghi lịch sử theo từng số; kiểm tra giao nhau với mọi dải, kể cả cùng nhóm, trả `409`; UNIQUE `username`/`email` qua cột ảo `username_active`/`email_active` (chỉ tài khoản chưa INACTIVE) trên `users` và `admins`, đăng nhập tìm theo cột này; chuyển công tác = INACTIVE tài khoản cũ + tạo mới cùng username/email (`01` §3, §6, §8; M02, M03, M04, M11, `02_api`) |
| R12 | `group:toggle_recording` và `group:manage_admin` đổi scope sang `BOTH` (seed cấp cho ROOT/SYSTEM_ADMIN trên mọi nhóm và GROUP_ADMIN trong nhóm mình); bỏ "Root bypass" trong PermissionGuard; bỏ SIP Call Flow Ladder (ngoài phạm vi cùng PCAP); token giới hạn = Access Token claim `scope: "PASSWORD_CHANGE_ONLY"`, không có Refresh Token, chỉ dùng cho `change-password`/`logout`/`auth/me`, endpoint khác trả `403 PASSWORD_CHANGE_REQUIRED`; phiên có hạn tuyệt đối 7 ngày, xoay vòng giữ nguyên `expires_at` (M10, M13, `01` §6.1, M03, M04, `02_api`) |
| R13 | Bỏ `analysis_min_duration_seconds` (ACD = tổng thời lượng / số cuộc nhấc máy), bỏ `external_api_token` + `generate-api-token`, bỏ `auto_report_*` (ngoài phạm vi); `system_maintenance_mode`: User API trả `503 MAINTENANCE` trừ `/auth/me`, Admin và job vẫn chạy; thêm `POST /admin/settings/reload-cache`; seed đầy đủ 19 key `system_settings` ở `01` §12; Root Admin đầu tiên qua `npm run seed:root` đọc biến môi trường, kèm thứ tự seed khi cài mới (`01` §3) |

## Vòng 3 – lượt rà cuối (2026-10-26)

**Đã sửa máy móc**:
- 7 lỗi Critical: COMMENT có nháy đơn lồng trong `stats_hourly` (DDL không chạy); body cấp dải trùng khóa `note` (thêm `historyNote`, `cdrOwnershipNote`); TC-PREF-05 trái quy tắc prefix; mẫu `validateGroupAdminSafeguard` (đếm admin ACTIVE trừ người bị hạ, trả 409); gateway WebSocket M06 theo 2 namespace + token trong `auth`; `MailerService` đọc `smtp_*` từ `system_settings`; kiểm tra trùng `initialAdmin` theo `username_active`.
- Major máy móc: index khuyến nghị trên bảng `cdr` chuyển ra khỏi khối DDL chạy được; item `GET /cdr` thêm `callType`, `disconnectionCode`, `disconnectionStatus`, `mos`.
- Minor: route/guard theo portal (M02, M11), bỏ RX/TX ở `00`/`03_ui`/M12, bỏ câu Trunk SIP, setting đã bỏ ở M07, ngưỡng viết cứng ở M13/M15/`00`, `groupId: number | null`, RTT ở `03_ui`, `callerId`/`limit`, lớp CSS mất gói, quyền khóa/mở khóa, ERD (nét đứt cho bảng lịch sử, 0..N dải), audit `UPDATE_RANGE`, thông báo PABX khôi phục, đánh số M02, giới hạn 31 ngày ở M12, partition chạy cả lúc khởi động.

**Cần quyết định (D1–D4)**:

| # | Chủ đề |
|---|---|
| D1 | Quy ước tên trường JSON và DTO `GET /cdr/:id` |
| D2 | Hình dạng response `/reports/summary`, `/qos/summary`, `/qos/disconnection-codes`; bộ giá trị `period`/`dateRange` |
| D3 | Tính năng trong module chưa có endpoint (Top 10 nhóm, bảng giám sát nhóm, widget dải số của thành viên, sửa quyền, xuất Excel lưu lượng, tùy biến widget Admin) |
| D4 | Các khoảng trống request/response (mật khẩu khi tạo user/admin, đặt lại mật khẩu, tính lại stats, phản hồi đổi mật khẩu, body 423, sửa dải/số) |

| # | Chốt |
|---|---|
| D1 | Mọi trường JSON dùng camelCase; 2 ngoại lệ: object `raw` của `GET /cdr/:id` giữ nguyên tên 87 cột PABX, và khóa map cài đặt là `setting_key`; `GET /cdr/:id` = trường nghiệp vụ camelCase (+ `legs[]`, `qos`, `sipDelays`) + `raw` (`02_api` §2, M12 §3.2) |
| D2 | Bộ `period` dùng chung (`02_api` §1.1): `today`, `yesterday`, `last_7_days`, `this_week` (tuần ISO), `this_month`, `last_month`, `custom` (≤ 366 ngày), bỏ `dateRange`/`month`/`week`; `/reports/summary` khung chung `{reportType, scope, period, kpis, chart, rows, totals}` + bảng chỉ số theo 4 `reportType` (M15 §2.1); `/qos/summary` và `/qos/disconnection-codes` tách hợp đồng riêng, 7 nhóm mã (gồm `OTHER`), `null` khi không có mẫu (M13 §3.2, §3.2.1) |
| D3 | Thêm `GET /admin/dashboard/groups` (Top 10 nhóm + bảng giám sát, đọc dòng nhóm của stats, không có dòng tổng); `GET /prefixes` trả thêm `counts {total, allocated, reserved, locked}` cho mỗi dải (widget thành viên); bỏ màn hình sửa tên/phân nhóm quyền (catalog cố định); xuất Excel lưu lượng dùng `/reports/export/excel` với `reportType=traffic`; tùy biến widget Admin lưu ở `user_settings.custom_preferences.dashboardWidgets` với 6 `key` cố định; chart series thêm `totalDurationSec` |
| D4 | Mật khẩu ban đầu luôn do hệ thống sinh (tạo user, tạo admin, tạo nhóm, đặt lại mật khẩu user/admin): body không có `password`, trả `temporaryPassword` một lần, `must_change_password = 1`; đổi mật khẩu trả `{accessToken, expiresIn}` + cookie phiên mới, thu hồi phiên khác; 423 trả `errorCode ACCOUNT_TEMPORARILY_LOCKED` + `lockedUntil`; đăng nhập 2 portal nhận username hoặc email; `rememberMe` cho User như Admin; body `PUT /admin/prefixes/:id` (không đổi `prefix`/`prefixGroupId`) và `PUT /admin/phone-numbers/:number` (`status` `LOCKED|RESERVED|NORMAL`, `UPDATE_INFO` mỗi request); `POST /admin/stats/recalculate` bất đồng bộ qua `stats_recompute_queue`, trả `202 {queuedHours}` |

## Việc cần sửa `templates/` (đợt sau)

| Từ | Template | Việc |
|---|---|---|
| Q2 | `admin/system-settings.html` | Thêm ô nhập `pabx_core_ip_list` vào nhóm ANALYSIS |
| Q2 | `admin|member/cdr-history.*` | Danh sách chỉ hiển thị leg chính; modal chi tiết hiển thị leg A/B cùng `call_group_key` (mỗi leg một file ghi âm) |
| Q2 | `admin|member/qos-debug.*` | Hiển thị cả 2 leg theo `call_group_key`, nhãn `leg_role` |
| Q3 | `admin|member/cdr-history.html` | Option lọc `value="NO ANSWER"` → `NO_ANSWER`; mock `status` theo enum `call_status` |
| Q3 | `admin|member/qos-debug.html` | Option `value="CANCEL"` → dùng enum `call_status` (`NO_ANSWER`…); giữ hiển thị mã SIP thô ở cột riêng |
| Q3 | `admin|member/reports.*`, `dashboard.*` | Biểu đồ mã SIP thêm nhóm 480 |
| Q4 | `admin/dashboard.js` | Bỏ series "Điểm MOS (x10)", dùng MOS thập phân 2 chữ số |
| Q4 | `qos-debug.html`, `reports.js`, `cdr-history.js`, `member/dashboard.html` | Dùng 4 dải + `.mos-na` với nhãn Xuất sắc/Tốt/Trung bình/Kém; bỏ nhãn "Khá", dải FAIR 3.0–4.0 và "3.0 - 3.9" |
| Q5 | `admin/system-settings.html` | Giá trị mặc định regex `^[1-9]\d{4}$` |
| Q5 | `admin/prefix-management.*` | Dải cấp phát phải nằm trong một `prefix`; kho trống (vd. `52200–56999`) tách theo đầu số. Kho 90.000 số giữ nguyên (đã khớp) |
| Q9 | `admin/dashboard.*`, `admin/reports.*` | Phạm vi toàn hệ thống hiển thị Nội bộ nhóm / Liên nhóm / Chưa xác định nhóm; bảng nhiều nhóm bỏ dòng "Tổng cộng" cộng dồn; mọi nhãn `INTERNAL_EVN` → "Chưa xác định nhóm" (`UNASSIGNED`) |
| Q6 | `admin/roles.html` | Bỏ nút/modal "Thêm vai trò" và xóa vai trò; chỉ sửa tên/mô tả và ma trận quyền của 5 vai trò |
| Q6 | `admin/users.html`, `member/group-admin.html` | Form tạo/sửa user không chọn vai trò; dùng 2 công tắc `is_group_admin`, `can_access_recording`; cột vai trò hiển thị `roleCode` suy ra |
| Q6 | `admin/login.js` | Mock `roles: ['ADMIN']`, `permissions: ['*']` → `roleCode: 'ROOT_ADMIN' | 'SYSTEM_ADMIN'` và danh sách mã quyền thật |
| Q7 | `admin/data-permissions.js`, `admin/permissions.js` | Dùng đúng 26 mã catalog `M10`; bỏ `dashboard:view`, `notification:view`, `profile:edit_self`, `auth:change_password`, `prefix:audit_view`, `org_prefix:view`, `group:view/create/edit/delete`, `group_member:view`, `qos:sip_trace`; thêm `admin:manage`, `group:toggle_recording`, `group:manage_admin` còn thiếu |
| Q8 | `admin/prefix-management.js` | Chặn xóa nhóm đầu số khi còn nhóm người dùng liên kết hoặc còn dải (`409`); bỏ thao tác "Hủy gán" (vi phạm `NOT NULL`) |
| Q8 | `admin/user_group.*`, `admin/users.*`, `member/group-admin.*` | "Xóa" = ngừng hoạt động (`INACTIVE`), thêm bộ lọc "Đã ngừng hoạt động"; trạng thái user đủ 3 giá trị ACTIVE/LOCKED/INACTIVE |
| Q10 | `admin|member/login.js`, `main.js` | Không lưu token vào `localStorage`; xử lý `423 LOCKED` và `mustChangePassword` (chuyển sang trang đổi mật khẩu) |
| Q10 | `admin|member/user-settings.*`, `profile.*` | Danh sách phiên đăng nhập + nút thu hồi; bỏ/ẩn công tắc 2FA (ngoài phạm vi); quy tắc mật khẩu ≥10 ký tự, 3/4 loại |
| Q10 | `admin/system-settings.html` | Thêm 6 ô `security_*` vào tab Nâng cao |
| R3 | `admin|member/cdr-history.*` | Trình phát/tải dùng `.wav`; bỏ chọn kênh rx/tx; xử lý `404 RECORDING_FILE_NOT_FOUND` |
| R4 | `templates/admin/*.js` | Mọi lời gọi API của Admin Portal dùng tiền tố `/api/v1/admin/`; WebSocket Admin kết nối `/admin/notifications` |
| R5 | `admin/user_group.*` | Modal tạo nhóm: thay chọn admin từ danh sách bằng khối nhập Quản trị viên đầu tiên; hộp thoại hiển thị mật khẩu tạm một lần |
| R7 | `admin|member/dashboard.*` | Widget kho số 4 trạng thái (`ALLOCATED`/`RESERVED`/`LOCKED`/`FREE`); bỏ "Đang gán nhân sự", cột Trunk SIP, nút demo; thêm biểu đồ Top 10 nhóm; bảng cuộc gọi gần đây gọi `/dashboard/recent-calls` |
| R9 | `admin/system-settings.html`, `admin/notifications.*` | Màn hình cấu hình ngưỡng QoS; ô `qos_alert_min_calls`, `pabx_offline_minutes`, `smtp_*`; form Admin soạn thông báo theo `target` |
| R10 | `admin|member/reports.*` | `#groupSelect` theo `user_groups.id` (bỏ `#organization` liệt kê đầu số, bỏ `orgId`/`orgName`); bỏ Role Switcher; bảng nhiều nhóm không có dòng tổng; doughnut theo `call_type` |
| R11 | `admin/prefix-management.*` | Bỏ thao tác gán/thu hồi từng số vào dải; sửa dải hiển thị lỗi `409` khi giao nhau; form sửa nhóm không cho đổi nhóm đầu số |
| D3 | `admin/permissions.*`, `admin/data-permissions.*` | Bỏ modal sửa tên/phân nhóm/mô tả quyền (chỉ đọc) |
| Q1 | `admin|member/cdr-history.*` | Bộ lọc hướng gọi chỉ hiện khi có nhóm đang xem; Admin không chọn nhóm thì hiện bộ lọc `call_type`; mock `direction` phải khớp nhóm người xem (vd. cuộc cùng nhóm là `Internal`) |
