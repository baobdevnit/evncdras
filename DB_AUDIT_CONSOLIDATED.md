# TỔNG HỢP RÀ SOÁT THIẾT KẾ CSDL – EVN CDR AS

> **Ngày lập**: 2026-11-04 · **Nhánh**: `docs/db-design-readiness` (sau HEAD `bbbc0f9`)
> **Vai trò của file**: đây là **nguồn tham chiếu duy nhất** về kết quả các lần rà soát CSDL. Các báo cáo cũ đã bị xóa khỏi cây thư mục; nội dung gốc chỉ còn trong lịch sử git (xem mục 6). Agent và người đọc **không khôi phục hay đọc lại** các báo cáo cũ; mọi thông tin cần thiết đã gom vào đây.
> **Nguồn chuẩn của thiết kế** vẫn là `docs/` (`docs/01_database_schema.md` cho CSDL, `docs/02_api_contracts.md` cho API). File này chỉ ghi lại *đã phát hiện gì, đã sửa ở đâu, còn gì mở*. Khi file này và `docs/` khác nhau thì `docs/` đúng.
> **Viết tắt**: `00`, `01`, `02`, `03` = `docs/0x_*.md`; `M01`…`M15` = `docs/modules/01..15_*.md`.

---

## 0. Kết luận

- **`docs/` không còn phát hiện Critical/Major/Minor nào về CSDL đang mở.** Đã kiểm lại ngày 2026-11-04 (mục 4): mọi mục của 12 lần rà soát đều đã phản ánh trong `docs/`. Lần kiểm này sửa thêm 1 lỗi Minor còn sót: ví dụ mã nhóm `UG-KT-01`/`UG-IT-01` ở M12 §3.1, đổi thành `UMO-KT-01`/`UMO-IT-01` theo quy ước `user_groups.code` (`01` §5).
- **Còn mở (mục 2)**: chạy lại DDL + seed trên **MariaDB 10.6**; sửa `templates/`; viết test cho các quy tắc tầng service khi có backend. C-01 (`trend` M05) đã được chủ dự án xác nhận ở lần 17.
- **Lần 13 (2026-11-04)**: 2 Major, 7 Minor, đã sửa theo quyết định chủ dự án (mục 3.5).
- **Lần 14 (2026-11-04)**: 3 Major, 10 Minor, đã sửa; 4 điểm thiếu quy định chốt theo phỏng vấn chủ dự án (mục 3.5, R14-*).
- **Lần 15 (2026-11-04)**: 8 Minor, đã sửa; 4 điểm thiếu quy định chốt theo phỏng vấn chủ dự án (mục 3.5, R15-*).
- **Lần 16 (2026-11-04)**: 13 Minor, tập trung vào API (M03, M05, M06, M08–M10, M13, M14 so với `02`), đã sửa; 7 điểm chốt theo phỏng vấn chủ dự án (mục 3.5, R16-07…R16-13). Không đổi DDL.
- **Lần 17 (2026-11-04)**: 12 Minor, tập trung vào M01, M02, M04, M07, M11, M12, M15 so với `01`/`02`, đã sửa; 5 điểm chốt theo phỏng vấn chủ dự án (mục 3.5, R17-01…R17-05) và xác nhận C-01. Không đổi DDL.
- **Lần 18 (2026-11-04)**: 8 Minor, tập trung vào xác thực/phiên (M03, M04, M08, M09), xuất CDR (M12) và xuất báo cáo (M15) so với `01`/`02`, đã sửa; 4 điểm chốt theo phỏng vấn chủ dự án (mục 3.5, R18-05…R18-08). Không đổi DDL.
- **Sẵn sàng sinh migration/entity** sau khi chạy xong DDL trên MariaDB 10.6 (mục 2.1).

## 1. Các lần rà soát

| Lần | Ngày | Báo cáo gốc (đã xóa) | Commit sửa | Phát hiện | Trạng thái |
|---|---|---|---|---|---|
| 1 | 2026-10-22 | `DB_SCHEMA_CONSISTENCY_REPORT.md` (chưa từng commit), `db_audit_1.md`, `db_audit_2.md` (commit dạng file rỗng) | — | 61 (D-01…D-29, S-01…S-12, T-01…T-09, M-01…M-12) + 16 mục db_audit_2 | Đã gộp vào lần 2 (bảng ánh xạ ở mục 3.1) |
| 2 | 2026-10-23 | `DB_SCHEMA_AUDIT_2026-10-23.md` | `4418b77` | 62: 13 Critical, 33 Major, 16 Minor (S 11, D 22, A 4, T 25) | ✅ phía `docs/`; nhóm T chuyển sang việc sửa `templates/` (mục 2.2) |
| 3 | 2026-10-23 → 26 | Nhật ký `docs/intent/docs-readiness-for-codegen.md` (vòng 2, vòng 3) | `4418b77` | Vòng 2 ~50 điểm (R1–R13); vòng 3: 7 Critical, 7 Major, ~60 Minor (D1–D4) | ✅ |
| — | 2026-10-26 → 11-03 | Thiết kế lại: `docs/intent/roles-permissions-redesign.md`, `docs/intent/single-app-architecture.md` | `eeb3d72`…`71c1122` | — | Thay thế Q6 và phần `role_permissions`/`role:manage` của Q7 |
| 4 | 2026-11-03 | `db_audit_00.md` | `1843320`, `9d6898e` | 34: 1 Critical, 4 Major, 24 Minor, 5 Info | ✅ (Info giữ ở mục 2.4) |
| 5 | 2026-11-03 | (không có file, nội dung ở commit) | `2a1c4f2` | 6 nhóm Major/Minor | ✅ |
| 6 | 2026-11-03 | `db_audit_06.md` | `a500388` | 6 Major, 2 Minor | ✅ |
| 7 | 2026-11-04 | `db_audit_07.md` | `96bafde` | 1 Critical, 2 Major, 1 Minor | ✅ |
| 8 | 2026-11-04 | `db_audit_08.md` | `2c6902b` | 2 Major, 1 Minor | ✅ |
| 9 | 2026-11-04 | `db_audit_09.md` | `d3a8c05` | 2 Major, 1 Minor | ✅ |
| 10 | 2026-11-04 | `db_audit_10.md` | `1b1a309` | 2 Major, 3 Minor (làm gọn) | ✅ |
| 11 | 2026-11-04 | `db_audit_11.md` | `b30e46c` | 3 Major, 6 Minor | ✅ |
| 12 | 2026-11-04 | `db_audit_12.md` | `9084f1d`, `bbbc0f9` | 3 Major, 7 Minor, 2 ngoài CSDL | ✅ |
| 13 | 2026-11-04 | (ghi thẳng vào file này, mục 3.5) | `728e996` | 2 Major, 7 Minor | ✅ |
| 14 | 2026-11-04 | (ghi thẳng vào file này, mục 3.5) | `94b96b3` | 3 Major, 10 Minor | ✅ |
| 15 | 2026-11-04 | (ghi thẳng vào file này, mục 3.5) | `104660f` | 8 Minor | ✅ |
| 16 | 2026-11-04 | (ghi thẳng vào file này, mục 3.5) | `eeda0b6` | 13 Minor | ✅ |
| 17 | 2026-11-04 | (ghi thẳng vào file này, mục 3.5) | `c13212d` | 12 Minor | ✅ |
| 18 | 2026-11-04 | (ghi thẳng vào file này, mục 3.5) | `1d54b6e` | 8 Minor | ✅ |

---

## 2. Việc còn mở

### 2.1. Kiểm chứng DDL trên đúng phiên bản

- DDL + seed mới chỉ chạy thật trên **MariaDB 13.0.2** (lần 4, 6, 7, 8, 10, từng phần). Tài liệu yêu cầu **MariaDB 10.6**. Lần 9 không chạy được (thiếu thông tin đăng nhập container), lần 11 đổi `organizations.level DEFAULT 0` chưa chạy lại, lần 13 đổi `prefix_allocation_history` (thêm `previous_range_from`/`previous_range_to`, `status_before`/`status_after` thành `enum`) chưa chạy lại. Lần 14 chỉ đổi COMMENT (`admin_roles.assigned_at`, `user_groups.code`, `user_settings.custom_preferences`). Lần 15 chỉ đổi COMMENT (`organizations.code`, `prefix_allocation_history.cdr_ownership_note`). Lần 16 không đổi DDL (chỉ thêm một câu chính sách phiên ở `01` §6.1). Lần 17 không đổi DDL (chỉ sửa câu mã lỗi `423` ở `01` §6.1). Lần 18 không đổi DDL (chỉ sửa câu chính sách phiên ở `01` §6.1).
- **Việc cần làm**: trích toàn bộ khối ```` ```sql ```` của `01` và seed `M10` §2.1, chạy trên MariaDB 10.6, kiểm tra:
  - 27 bảng + 1 view tạo không lỗi; partition `cdr_enriched` đúng.
  - Seed: 25 mã quyền; `permission_roles` ROOT_ADMIN 25, SYSTEM_ADMIN 24, GROUP_ADMIN 17, USER_RECORDING 11, REGULAR_USER 9; 19 key `system_settings`; 5 ngưỡng QoS.
  - Gán `GROUP_ADMIN` cho user thành công; gán `ROOT_ADMIN` cho user bị FK chặn (`1452`); ép `role_scope` sai bị `CHECK` chặn (`4025`); `uniq_notif_recipient` chặn trùng (`1062`).
  - `CHECK` trên cột `enum` và cột ảo UNIQUE `*_active` hoạt động trên 10.6.

### 2.2. Sửa `templates/` (ngoài phạm vi CSDL, chưa làm)

Danh sách chi tiết theo quyết định Q/R/D nằm ở `docs/intent/docs-readiness-for-codegen.md` mục "Việc cần sửa `templates/`". Danh sách đó viết trước các thay đổi sau, khi sửa phải áp dụng bản mới:

| Dòng trong danh sách cũ | Áp dụng thay bằng |
|---|---|
| Q6 (`roles.html`, form user dùng 2 công tắc `is_group_admin`, `can_access_recording`) | Vai trò lưu ở `admin_roles`/`user_roles`, không còn cờ trên tài khoản; đổi vai trò user qua `PUT /users/:id/role`; 5 vai trò cố định (`roles-permissions-redesign.md`, M10) |
| Q7 "26 mã catalog" | **25 mã** (M10 §2.1); không còn `role:manage` |
| Q8 `prefix-management.js` "chặn xóa nhóm đầu số…" | Bỏ hẳn thêm/xóa nhóm đầu số: nhóm đầu số tạo tự động khi tạo nhóm người dùng, chỉ sửa tên/mô tả (R10-01) |
| `admin/user_group.*` dropdown chọn nhóm đầu số | Bỏ; body tạo/sửa nhóm không có `phonePrefixGroupId` (R10-01). Ngừng hoạt động nhóm có tùy chọn `revokeRanges`, mặc định `false` (R10-02) |
| `admin|member/reports.*` | Mỗi báo cáo một phạm vi, không có bộ chọn nhiều nhóm (R12-01); `period = today` có cột `hour` (R12-08) |
| `admin/notifications.*` (form Admin soạn) | Có trường `type`; dropdown nhóm chỉ liệt kê nhóm `ACTIVE` (R12-03, R12-09) |
| `user-settings.*` | Theme có 3 giá trị `light`/`dark`/`system` (X-09) |
| `admin|member/dashboard.*`, `notifications.*` | Frontend tự định dạng số, đơn vị, nhãn xu hướng, nhãn MOS và thời gian tương đối; API không trả `formatted`/`trendLabel`/`qualityLabel`/`timeAgo` (R16-07) |
| `admin|member/profile.*` | Ảnh đại diện chỉ đổi qua nút tải ảnh (`POST .../avatar`); form sửa người dùng của quản trị viên không có ô ảnh (R16-12) |
| `03` §danh mục template | Bỏ `login_admin.html`, `users4group.html` (không tồn tại); thêm `templates/member/group-admin.html`, `group-members.html` (Phụ lục A lần 4) |

Các phát hiện template gốc của lần 2 (T-01…T-25, A-02, A-03) là căn cứ của danh sách trên; chúng không còn tác dụng với `docs/`.

### 2.3. Quy tắc tầng service cần test khi có backend

Các quy tắc sau đã ghi trong `docs/` nhưng chỉ kiểm chứng được bằng code. Khi sinh backend, mỗi mục cần ít nhất một test:

| Quy tắc | Nơi ghi | Từ |
|---|---|---|
| Ghi `PROCESSING` (autocommit) trước `startTransaction()`; khi transaction mở, mọi câu ghi dòng `cdr_enrichment_state.id = 1` đi qua `qr` | M12 §4.2 | R7-01 |
| Khóa dòng `user_groups ... FOR UPDATE` đầu mọi thao tác thuộc một nhóm, thứ tự khóa nhóm → `users`/`user_roles`/`phone_numbers` | `01` §14, M10 §3.2, M02 §3.3 | R9-01 |
| Bộ đếm đăng nhập sai tăng bằng một câu `UPDATE` nguyên tử, đạt ngưỡng thì đặt `locked_until` và về 0 | `01` §6.1, M03, M04 | R9-02 |
| Refresh token: `SELECT ... FOR UPDATE`, ân hạn 30 giây cho token `ROTATED` | `01` §6.1, `00` §5.3.2, TC-USR-02c | R8-01 |
| `cache_version` tăng bằng câu ghi cuối trước commit; nạp cache đọc `cache_version` trước | `00` §2.1 | R9-03 |
| Cấp dải số: `UPDATE ... AND range_id IS NULL` + so `affectedRows`, khác thì `409` | `01` §8, M11 §3.2 | R6-04 |
| Hàng đợi tính lại: upsert `queued_at`, chỉ xóa dòng `queued_at <=` giá trị đã đọc, chặn trước `cdr_purged_before` | `01` §15.0 | R6-02, R6-03, R8-02, R10-04 |
| Poller thông báo theo cửa sổ `created_at` 5 phút + tập `pushedIds`, đọc đủ người nhận | `01` §11, M06 §4.1 | R7-02 |
| Giảm `retention_archive_months` cần `confirmPurge` | `01` §2.1, M07 §3.2 | R11-02 |
| Đổi cha tổ chức tính lại `level` cả nhánh; tối đa 3 | `01` §4, M01 §3.2–3.3 | R11-03 |
| Route User nhận tham số riêng của Admin trả `400` (kể cả `userGroupId` trong body `POST /users`) | `02` §1.1, M03 §3.4 | R12-04, R14-06 |
| `PUT /admin/user-groups/:id` có `code` trả `400` | `01` §5, M02 §3.3 | R14-11 |
| `PUT /admin/organizations/:id` có `code` trả `400` | `01` §4, M01 §3.3 | R15-05 |
| `PUT /users/:id` có `userGroupId` (kể cả trùng nhóm) trả `400` | `02` §3.5, M03 §3.5 | R15-02 |
| `PUT /admin/prefixes/:id` thiếu `decisionNumber` trả `400`; dòng `UPDATE`/`REVOKE` có `cdr_ownership_note = NULL` | `01` §8 điểm 5, M11 §4.2 | R15-06 |
| Đổi trạng thái số `RESERVED` ↔ `LOCKED` ghi 2 dòng `phone_number_range_history` cùng transaction | `01` §8, M11 §4.4 | R14-13 |
| `/qos/debug-table` gửi `disconnectionCode`/`codec`/`minMos`/`maxMos` khi thiếu `cdr:filter_advanced` trả `403`; bản User gửi `groupId` trả `400` | `02` §3.8, M13 §3.1 | R16-09, R16-10 |
| Tự đổi mật khẩu thu hồi mọi phiên cũ, kể cả phiên đang dùng (`PASSWORD_CHANGED`), tạo đúng 1 phiên mới | `01` §6.1, M08 §3.4, M09 §3.3 | R16-11 |
| `PUT /profile`, `PUT /admin/profile`, `PUT /users/:id` có `avatarUrl` trả `400`; `POST .../avatar` ghi `avatar_url` | `02` §3.1, §3.2, §3.5, M03 §3.5, M08 §3.2–3.3, M09 §3.2 | R16-12 |
| Bản User của `/phone-numbers/pool`, `/phone-numbers/history`, `/prefixes/history` gửi `groupId` trả `400` | `02` §1.1, M11 §4.3–4.5 | R17-01 |
| Khóa tạm đăng nhập trả `423 ACCOUNT_TEMPORARILY_LOCKED`, `errors.lockedUntil` | `01` §6.1, M03 §3.1, M04 §3.1 | R17-04 |
| `PUT /admin/settings/system` có `smtp_password` thiếu hoặc `********` giữ giá trị cũ; `""` xóa | M07 §3.2, `02` §3.12 | R17-05 |
| Route User đọc CDR/ghi âm của nhóm khác trả `403 FORBIDDEN_SCOPE_ACCESS` | `02` §2.3, M12 §3.2–3.3 | R17-08 |
| Đăng nhập tài khoản `LOCKED` trả `403 ACCOUNT_LOCKED` (Admin và User) | `01` §6.1, `02` §2.3, M03 §3.1, M04 §3.1 | R18-05 |
| `reset-password` (User và Admin) thu hồi phiên với `PASSWORD_CHANGED`, trả `temporaryPassword` 16 ký tự, ghi `AUTH / PASSWORD_RESET` | `01` §6.1, `02` §3.1, §3.5 | R18-06, R18-07 |
| `GET /cdr/export` thiếu `format` xuất `xlsx` | `02` §3.7, M12 §3.1.1 | R18-08 |

### 2.4. Cần xác nhận / ghi nhận rủi ro

| ID | Nội dung | Tham chiếu |
|---|---|---|
| C-01 | ✅ **Đã xác nhận** (lần 17): `trend` cho `last_month` so với tháng liền trước nữa, `custom` so với khoảng cùng số ngày ngay trước `fromDate`, giữ như M05 | M05 §3.1 (R12-05) |
| I-01 | `high_packet_loss_legs_count` phụ thuộc ngưỡng tại thời điểm tính; đổi ngưỡng rồi tính lại sẽ đổi số liệu lịch sử của các khung được tính lại | `01` §15 |
| I-02 | `representative_user_id` phải là GROUP_ADMIN cùng nhóm: chỉ service bảo đảm | `01` §5, M10 |
| I-03 | `cdr_enriched` có nhiều index phụ trên bảng ghi liên tục; truy vấn `caller_group_id = g OR called_group_id = g` cần index merge hoặc `UNION`. Đo trên dữ liệu thật trước khi chốt bộ index | `01` §2.1 |
| I-04 | `groupGated` trong `GET` quyền là hằng số trong code (M10), không phải cột | `02`, M10 |
| I-05 | `status: "NORMAL"` của `PUT /admin/phone-numbers/:number` chỉ có trong request, ánh xạ về `ALLOCATED`/`FREE` | `02` |
| I-06 | Cột `timestamp` giới hạn năm 2038 (đã ghi chú ở `01`, lần 5) | `01` |

---

## 3. Nhật ký phát hiện

Tất cả mục dưới đây **đã sửa** trong `docs/` và đã kiểm lại ngày 2026-11-04 (mục 4), trừ khi ghi khác.

### 3.1. Lần 1 (2026-10-22) → ánh xạ sang lần 2

| Mã lần 1 | Mã lần 2 |
|---|---|
| D-01, D-03 / D-06 / D-07 / D-08 / D-09 / D-10 / D-11 / D-12 / D-13 / D-14 / D-15 / D-17 / D-18 / D-19 / D-20 / D-21 / D-22 / D-23 / D-24 / D-25 / D-26 / D-27 / D-28 / D-29 | D-22, D-22 / D-03 / D-06 / D-18 / D-05 / D-04 / A-01 / D-19 / D-22 / D-21 / D-10 / S-06 / D-22 / D-20 / D-12 / D-11 / D-22 / D-14 / D-10 / D-13 / D-22 / D-22 / S-11 / D-16 |
| D-02 (FK vòng) | D-02 |
| D-04, D-05, D-16 (COMMENT/ERD DDL chép trong M01/M02/M04/M08/M11) | Đã hết: module không còn chép DDL, chỉ tham chiếu `01` |
| S-01…S-12 | S-01…S-11 (S-10 cũ → D-22) |
| T-01…T-09 | T-15, T-01/T-04/T-12, T-03, A-02, T-19, T-18, T-05, T-25, T-09/T-11 |
| M-01…M-12 | D-17, D-17, D-03, D-22, M-05 (token tích hợp: **bỏ khỏi phạm vi**, M07), D-18, M-07 (chống trùng cảnh báo QoS: **giải quyết** bằng `notifications.dedupe_key`, `01` §10–11), D-21, S-04, D-16, D-13, S-08 |
| db_audit_2 mục 01–16 | FTP/Billing/`phone_extensions`/`settings.js`/`metadata.organization_id`: đã sửa; còn lại → D-02, D-03, D-07, D-22, A-01, T-01, T-12, T-24, T-25 |

### 3.2. Lần 2 (2026-10-23) – 62 phát hiện, quyết định Q1–Q11

| Mã | Mức | Tóm tắt | Xử lý |
|---|---|---|---|
| S-01 | Critical | `Answered_Duration` là ms, tài liệu ghi giây | Q1: cột `answered_duration_sec`; mọi thời lượng nghiệp vụ đọc cột này |
| S-02 | Critical | `Direction` luôn `remote`; `DisconnectionStatus` là reason-phrase SIP | Q1, Q3: `call_status`; hướng gọi tính lúc truy vấn (M12 §3.1) |
| S-03 | Critical | MOS lưu số nguyên | Q4: MOS thập phân từ `G107R` (`mos_*_x100`) |
| S-04 | Critical | Cuộc qua lõi PABX có 2 leg | Q2: `leg_role`, `call_group_key`, `is_primary_leg`, setting `pabx_core_ip_list` |
| S-05 | Major | Bộ đếm mã SIP không phủ 480/603/404; ASR hai định nghĩa | Q3: bảng ánh xạ `call_status`, thêm `sip_480_count` |
| S-06 | Minor | `ReleasedBy` chỉ có `caller`/`called` | Bỏ `released_by_system_count` |
| S-07 | Major | Số ẩn danh, số không 5 chữ số | Q5: định nghĩa "số ngoài kho"; bỏ câu "100 % nội bộ 5 số" |
| S-08 | Major | Ghi âm `.wav`, đường dẫn Windows tuyệt đối | Setting `recording_path_map`, M12 §2.3; PCAP ghi "chưa khai thác" |
| S-09 | Major | 22 cột luôn NULL làm KPI = 0 | Bỏ cột stats RTCP/packets; không index `from_no`/`to_no` |
| S-10 | Minor | Jitter caller `bigint`, called `double` | Ghi chú kiểu PABX |
| S-11 | Minor | "85 cột" thay vì 87 | Sửa |
| D-01 | Critical | DDL `01` lỗi thứ tự FK | Q11: FK sau bảng đích; về sau bỏ FK trên `cdr_enriched` (partition) |
| D-02 | Critical | FK vòng `fk_ug_rep_user` ở M02 | `ALTER TABLE` sau `users` |
| D-03 | Critical | `cdr_enriched` thiếu cột dẫn xuất | Q1–Q4 |
| D-04 | Critical | Dải MOS khác nhau ở 4 nơi | Q4: một bộ 4 dải ở `01` §2.1 |
| D-05 | Critical | MOS gia quyền theo `total_calls` | Q4: `qos_sample_count`, roll-up `01` §15 |
| D-06 | Major | Kích thước kho số | Q5: 90.000 số `10000`–`99999` |
| D-07 | Major | Phạm vi dữ liệu theo tổ chức | Cô lập theo `user_groups` (`00` §1, `01` §15) |
| D-08 | Critical | Regex nội bộ loại khối 9xxxx | Q5: `^[1-9]\d{4}$` |
| D-09 | Major | Quyền nhóm lưu ở 2 nơi | Q6, sau đó thay bằng thiết kế lại vai trò (`admin_roles`/`user_roles`) |
| D-10 | Major | Tạo nhóm bắt buộc admin; TC chuyển thành viên | Tạo nhóm + Quản trị viên đầu tiên cùng transaction; sửa TC-UG-06 |
| D-11 | Major | Hai nguồn sở hữu số; RESERVED/LOCKED khi cấp/thu hồi | Q8: `phone_numbers.range_id` là nguồn duy nhất; quy tắc theo trạng thái (`01` §8) |
| D-12 | Major | `ON DELETE` để lại trạng thái lệch | Q8: `01` §14 xóa mềm, RESTRICT |
| D-13 | Major | Bảng lịch sử không FK; ERD sai | ERD nét đứt "snapshot, no FK" |
| D-14 | Major | Chiều lưu lượng khi một phía NULL | Q9: `calls_inter_group`, `calls_unassigned`, `UNASSIGNED` |
| D-15 | Major | Tài liệu vi phạm Zero CDR Scan | Giới hạn nguyên tắc cho KPI/báo cáo; liệt kê truy vấn từng cuộc gọi được phép (`01` §15) |
| D-16 | Major | Partition xung đột FK/cột nullable | Q11: `Created NOT NULL`, PK (`id`,`Created`), bỏ FK |
| D-17 | Major | Thiếu bảng phiên/token, cột mật khẩu | Q10: `auth_sessions`, 4 cột bảo mật, 6 setting `security_*` |
| D-18 | Major | UI cần dữ liệu không có nguồn | Bỏ "Đang gán nhân sự", Trunk SIP; `/traffic/records` lọc theo `Created` |
| D-19 | Minor | `permissions.scope`/`category` không biểu diễn catalog | Q7 |
| D-20 | Minor | `organizations.level` và quy tắc xóa | Q8 + R11-03 |
| D-21 | Minor | Danh mục `audit_logs.action` chưa chuẩn | `01` §13 là danh mục duy nhất |
| D-22 | Minor | Lệch nhỏ: §14 thiếu, `AUTO_INCREMENT=5370`, ngưỡng hard-code, `is_global`, `page_size`, chu kỳ 10–15 phút, "Kỹ thuật viên", mã `UG-…`, đường dẫn template | Đã sửa; mã nhóm `UG-KT-01`/`UG-IT-01` ở M12 sửa ngày 2026-11-04 |
| A-01 | Major | Mã quyền API ngoài catalog | Q7: catalog duy nhất ở M10 (nay 25 mã) |
| A-02 | Major | `data-permissions.js` dùng mã ngoài catalog | Chuyển sang mục 2.2 |
| A-03 | Major | DTO thống kê khóa theo đầu số/tổ chức | Phía `docs/` đã theo `user_groups.id`; template ở mục 2.2 |
| A-04 | Minor | Ví dụ `Answered_Duration: 135` | Sửa |
| T-01…T-25 | 3 Critical, 14 Major, 8 Minor | Template xây trên mô hình khác `01` | Chuyển sang mục 2.2 |

Quyết định Q1–Q11 (lần 2), R1–R13 (vòng 2), D1–D4 (vòng 3) ghi đầy đủ ở `docs/intent/docs-readiness-for-codegen.md`. Q6 và phần `role_permissions`/`role:manage` của Q7 đã bị thay bởi `docs/intent/roles-permissions-redesign.md`.

### 3.3. Lần 4 (2026-11-03) – sau thiết kế lại vai trò và kiến trúc 1 ứng dụng

| Mã | Mức | Tóm tắt | Xử lý |
|---|---|---|---|
| D-01 | Critical | FK `fk_ur_role_scope` so ENUM theo chỉ số nội bộ: user không nhận được vai trò User nhưng nhận được `ROOT_ADMIN` | `role_scope enum('ADMIN','USER')` giống `roles.scope` + `CHECK` (`01` §7) |
| D-02 | Major | `PABX_OFFLINE` dùng `MAX(cdr.Created)` không index | Truy vấn theo PK `ORDER BY id DESC LIMIT 1` (`01` §10); sau đó R8-03 |
| D-03 | Minor | ERD §1 lệch DDL | Sửa |
| D-04 | Minor | Partition khởi tạo cứng theo tháng mẫu | Sinh theo dữ liệu thật lúc cài |
| D-05 | Minor | `includeArchive` gắn sai route User | `GET /api/v1/admin/cdr` |
| D-06 | Minor | COMMENT stats dùng tên API | `critical_threshold` |
| D-07 | Minor | `prefix_allocation_history` không lưu dải có cấu trúc | Thêm `range_id`, `range_from`, `range_to` + index |
| D-08 | Minor | `notification_recipients` không chặn trùng | `uniq_notif_recipient` |
| D-09 | Minor | `phone_prefix_ranges.status` vô nghĩa | Bỏ cột |
| D-10 | Minor | `assigned_at ON UPDATE` dễ hiểu sai | COMMENT rõ |
| A-01 | Minor | Đường dẫn job thiếu `src/` | Sửa |
| X-01 | Major | M12 ghi audit ghi âm vào cột không tồn tại | `actor_*`, `resource_name = 'AUDIO'`, `action_details` |
| X-02 | Major | M13 hiển thị thời lượng từ cột ms | `answered_duration_sec` |
| X-03 | Major | Mã quyền route frontend lệch API | Lưu lượng = `cdr:view`; Dashboard không cần mã quyền |
| X-04…X-18 | Minor | `level` ví dụ M01; ERD M02; nhãn LOCKED/INACTIVE M03; claim token M05; khóa `metadata` camelCase M06; theme `system` M08; thang MOS ≤ 4.5 M13; `Audio_Signal_Delay` luôn NULL M13; tên vai trò M09; `RoleAssignmentService` M10; `itemsPerPage` `02`; danh mục thông báo `03`; cài đặt MariaDB `03`; `users4group.html` `03`; cột khóa `LOCKED` ở `01` §14 | Sửa |
| I-01…I-05 | Info | | Mục 2.4 |

### 3.4. Lần 5 (2026-11-03, commit `2a1c4f2`)

- Ngừng hoạt động nhóm kéo theo toàn bộ thành viên (gỡ bế tắc với quy tắc tối thiểu 1 Quản trị viên nhóm).
- Cảnh báo QoS chỉ chấm khung giờ đã kết thúc ít nhất 60 phút.
- Khối QoS của `stats_*` tính trên mọi leg, bộ đếm mẫu riêng cho từng trung bình.
- Hàng đợi tính lại gồm cả khung giờ của leg chính cũ; cửa sổ trực tuyến dùng tham số backend.
- Tách đổi trạng thái khỏi `PUT /users/:id`; `audit_logs` chỉ ghi thêm ở mức CSDL.
- Ghi chú: nhóm sở hữu số chốt lúc làm giàu, mã nhóm không dùng lại, giới hạn `timestamp` 2038.

### 3.5. Lần 6–17

| Mã | Mức | Vấn đề | Xử lý (nơi sửa) |
|---|---|---|---|
| R6-01 | Major | Hàng đợi tính lại xét theo tuổi leg, job theo khung giờ | Về sau thay bằng R10-04 |
| R6-02 | Major | `INSERT IGNORE` + xóa dòng hàng đợi làm mất yêu cầu | Upsert `queued_at timestamp(6)`, chỉ xóa `queued_at <=` giá trị đã đọc (`01` §15.0) |
| R6-03 | Major | Tính lại kỳ đã `DROP PARTITION` xóa stats dài hạn | Mốc `:purgeBoundary`; API `400` |
| R6-04 | Major | Kiểm tra giao nhau dải số không khóa | `UPDATE ... AND range_id IS NULL` + `affectedRows` (`01` §8, M11 §3.2) |
| R6-05 | Major | `INACTIVE` không chặn ở API đổi trạng thái | Trạng thái cuối; `409 ACCOUNT_INACTIVE`/`GROUP_INACTIVE` |
| R6-06 | Major | Không quy định tạo `user_settings` | Tạo cùng transaction; thiếu dòng = mặc định (`LEFT JOIN … COALESCE`) |
| R6-07 | Minor | Cột lọc của `phone_number_range_history` theo `action_type` | COMMENT (`01` §8.5) |
| R6-08 | Minor | "`notifications` xóa cứng được" không có API | Giữ vĩnh viễn, chỉ DBA xóa |
| R7-01 | Critical | `runBatch` tự khóa chính mình qua 2 kết nối | Ghi `PROCESSING` trước transaction; ghi dòng `id = 1` qua `qr` (M12 §4.2) |
| R7-02 | Major | Watermark `notifications.id` bỏ sót thông báo, cắt 500 người nhận | Cửa sổ `created_at` 5 phút + `pushedIds`; `idx_notif_created` |
| R7-03 | Major | Job ngày không xóa dòng nhóm không còn dữ liệu | `DELETE` dòng `stats_daily` không còn dòng giờ |
| R7-04 | Minor | `dedupe_key` QoS thiếu `severity` | `QOS:{scope}:{metric}:{date}:{hour}:{severity}` |
| R8-01 | Major | Nhiều tab cùng refresh bị coi là đánh cắp token | `replaced_by_session_id`, `FOR UPDATE`, ân hạn 30 giây |
| R8-02 | Major | `:purgeBoundary` tính từ setting sửa được | `cdr_enrichment_state.cdr_purged_before` (chỉ tăng) |
| R8-03 | Minor | `PABX_OFFLINE` dùng `Created`; trạng thái offline không lưu | `COALESCE(Destroyed, Created)`; trạng thái từ thông báo gần nhất; `idx_notif_type` |
| R9-01 | Major | Write skew khi đếm Quản trị viên nhóm | Khóa dòng `user_groups` trước (`01` §14, M10 §3.2) |
| R9-02 | Major | Bộ đếm đăng nhập sai lost update, tràn `tinyint` | `UPDATE` nguyên tử, về 0 khi khóa (quyết định chủ dự án) |
| R9-03 | Minor | Vị trí tăng `cache_version` và thứ tự đọc khi nạp cache | `00` §2.1 |
| R10-01 | Major | Gắn nhóm đầu số đã có dải vào nhóm mới không tăng `cache_version` | Nhóm đầu số tạo tự động cùng nhóm người dùng; bỏ API tạo/xóa/`available`; `code varchar(53)` |
| R10-02 | Major | Ngừng nhóm luôn thu hồi dải | `revokeRanges`, mặc định `false` |
| R10-03 | Minor | `phone_prefix_groups.status` không có quy tắc | Bỏ cột; bỏ audit `CREATE/DELETE_PREFIX_GROUP` |
| R10-04 | Minor | Job thống kê 3 cơ chế chồng nhau | Hàng đợi là nguồn duy nhất; bỏ chốt sổ, bỏ `is_finalized` |
| R10-05 | Minor | 2 index thừa trên `cdr_enriched` | Bỏ `idx_cdre_sipcallid`, `idx_cdre_disconnection_code` |
| R11-01 | Major | Tra CDR lưu trữ theo `id`: `01` chặn, M12 không | Cho phép; giới hạn chỉ áp cho API danh sách |
| R11-02 | Major | Giảm `retention_archive_months` mất dữ liệu không xác nhận | `confirmPurge`, thiếu thì `409 RETENTION_PURGE_CONFIRM_REQUIRED` |
| R11-03 | Major | `organizations.level` gốc, độ sâu, đổi cha | Gốc 0, tối đa 3, tính lại nhánh |
| R11-04 | Minor | `id` CDR chuỗi đệm 0 / số | Chuỗi không đệm 0 |
| R11-05 | Minor | Cách khớp `callerId`/`calledId` | Khớp đúng |
| R11-06 | Minor | `legs[]` truy vấn không kèm `Created` | `Created` ±2 giây |
| R11-07 | Minor | Giới hạn xuất 100.000 dòng thiếu ở M12 | Thêm M12 §3.1.1 |
| R11-08 | Minor | `organizations.status = INACTIVE` không có hệ quả | `409 ORGANIZATION_INACTIVE` khi gắn mới |
| R11-09 | Minor | Ví dụ `phone_numbers.id` trùng số máy | Sửa ví dụ |
| R12-01 | Major | M15 "so sánh nhiều nhóm" không có API | Mỗi báo cáo một phạm vi |
| R12-02 | Major | Dashboard User so với toàn EVN | Bỏ so sánh |
| R12-03 | Major | Người nhận thông báo Admin soạn | Chỉ `ACTIVE`; nhóm `INACTIVE` `409` |
| R12-04 | Minor | Route User nhận `groupId` | `400` (`02` §1.1) |
| R12-05 | Minor | `trend` không định nghĩa kỳ so sánh | Kỳ liền trước cùng số ngày (xem C-01) |
| R12-06 | Minor | Tên trường/nguồn/phân trang `/traffic/summary` | `totalDurationSec`, `avgDurationSec`, phân trang |
| R12-07 | Minor | `/traffic/records`, `/qos/debug-table` thiếu giới hạn | 31 ngày, cửa sổ trực tuyến, `limit` ≤ 100 |
| R12-08 | Minor | Báo cáo `today` thiếu `hour`; mẫu Excel sai tên trường | Sửa |
| R12-09 | Minor | Ví dụ `QOS_ALERT`, `pagination`, `type` | Sửa |
| R12-10 | Minor | preferences User ở `02` thiếu trường | Đồng bộ theo M08 |
| R12-11 | — | Tiêu đề email CRITICAL cố định | Lấy từ `notifications` |
| R12-12 | — | Payload `notification:new` thiếu trường | Cùng cấu trúc `GET /notifications` |

| R13-01 | Major | Cùng cột `cdr_enriched.call_status`/`answered_duration_sec` mang 4 cặp tên khác nhau giữa API: M12 `status`/`duration`, M13 `callStatus`/`duration`, M14 `callStatus`/`durationSec`, `02` §2.2 `callStatus`/`answeredDurationSec` | Chủ dự án chốt `callStatus` + `durationSec` cho mọi API danh sách/chi tiết cuộc gọi; `02` §2 ghi ngoại lệ tên `durationSec`; sửa M12 §2.1, §3.1, §3.2, M13 §3.1, `02` §2.2, §3.11 |
| R13-02 | Major | `prefix_allocation_history`: `status_before`/`status_after` là varchar tự do không có quy tắc (dải số đã bỏ cột trạng thái); dòng `UPDATE` không quy định lưu khoảng nào, `numbers_count` đếm gì, nên không tái dựng được khoảng trước khi sửa | Chủ dự án chốt: `status_*` thành `enum('FREE','ALLOCATED')` (nhãn "Kho tự do"/"Đang dùng"); thêm `previous_range_from`/`previous_range_to` (chỉ `UPDATE`); `range_from`/`to` = khoảng sau thao tác; `range_text` của `UPDATE` ghi cũ và mới; `numbers_count` = số số thay đổi. Bảng giá trị theo `action_type` ở `01` §8 điểm 5; M11 §3.2 tham chiếu |
| R13-03 | Minor | `POST /admin/stats/recalculate` và `POST /admin/notifications` là thao tác ghi của Admin nhưng không có mã trong danh mục `audit_logs` | Chủ dự án chốt ghi cả hai: `SYSTEM / RECALCULATE_STATS`, `SYSTEM / CREATE_NOTIFICATION` (`01` §13, `02` §3.11–3.12, M06 §1.2, M07 §5) |
| R13-04 | Minor | M13 debug-table trả `callerGroup`/`calledGroup` dạng chuỗi tên nhóm, M12 trả object `{ id, code, name }` cho cùng tên trường | Theo M12 (object) |
| R13-05 | Minor | M11 `GET /phone-numbers/pool` dùng `data: { total, page, limit, items }`, khác khung phân trang chung `02` §2.2 | Đổi sang `data: []` + `pagination` |
| R13-06 | Minor | M11 `pool`, `phone-numbers/history` nhận `userGroupId` trên cả route User, trái `02` §1.1 (R12-04) | Ghi rõ chỉ bản Admin, bản User gửi thì `400`; bản User lọc theo `phone_number_range_history.user_group_id` (theo COMMENT `01` §8.5) |
| R13-07 | Minor | Ví dụ lệch quy ước: M02 `phonePrefixGroup.code` `PG-IT-01`/`PG-AUDIT` (quy tắc `PG-` + `user_groups.code`); M11 `GET /prefixes` thiếu `counts` mô tả ở cùng mục, `updatedAt` không theo ISO 8601 (`02` §2) | `PG-UMO-IT`, `PG-UMO-AUDIT`; thêm `counts`; `updatedAt` có giờ và `+07:00` |
| R13-08 | Minor | Ví dụ `pagination` thiếu `hasNext`/`hasPrev` (M02 §3.1, §3.6, M12 §3.1, M13 §3.1); file này ghi `high_packet_loss_calls_count` thay vì tên cột `high_packet_loss_legs_count` (I-01) | Sửa |
| R13-09 | Minor | Đơn vị thời lượng ở API tổng hợp lệch: M05 `/dashboard/stats` trả `durationMinutes`, M14 `/traffic/summary` trả cả `totalDurationSec` và `totalDurationMinutes`, các API khác dùng giây | Chủ dự án chốt chỉ dùng giây: M05 đổi `durationMinutes` → `durationSec` (SQL bỏ `/ 60`), M14 bỏ `totalDurationMinutes`, frontend tự đổi sang phút; quy tắc ghi ở `02` §2 |
| R14-01 | Minor | `01` §2.1 còn ghi "trường `duration` trả về API", trái R13-01 | `durationSec` |
| R14-02 | Minor | COMMENT `admin_roles.assigned_at` ghi "cập nhật khi đổi vai trò, lịch sử ở `audit_logs`", nhưng không có API đổi vai trò Admin (`02` §3.1, M10 §1.2) và `CHANGE_ROLE` chỉ cho `USER` (`01` §13) | Sửa COMMENT: gán cùng lúc tạo tài khoản, không đổi |
| R14-03 | Minor | ERD M02 §1.2 còn cột `PHONE_PREFIX_GROUPS.status` (đã bỏ ở R10-03) | Bỏ |
| R14-04 | Minor | M02 BR-UG-03 ghi đổi nhóm đầu số trả `409`, M02 §3.2–3.3 và TC ghi `400` | `400` |
| R14-05 | Minor | M03 §3.3 `GET /users` lọc bằng `userGroupId`, `02` §3.5 dùng `groupId` | `groupId`, chỉ bản Admin; bản User gửi thì `400` |
| R14-06 | Major | M03 §3.4 `POST /users` route User: gửi `userGroupId` khác nhóm trả `403`, trái `02` §1.1 (tham số riêng Admin trên route User trả `400`) | Chủ dự án chốt: DTO bản User không có `userGroupId`, gửi lên (kể cả đúng nhóm) trả `400`; sửa M03 §3.4, `02` §3.5 |
| R14-07 | Minor | M13 §3.3 ghi audit `PUT /admin/qos/thresholds` là `SYSTEM / UPDATE_SETTINGS`, danh mục `01` §13 không nêu | Thêm vào mô tả `UPDATE_SETTINGS` |
| R14-08 | Minor | COMMENT `user_settings.custom_preferences` nêu khóa `date_format`, `language`, `active_tabs` không dùng ở đâu; khóa duy nhất có đặc tả là `dashboardWidgets` (M09 §1, camelCase) | Sửa COMMENT |
| R14-09 | Minor | M09 §1 ghi Admin tự sửa email, M09 §3.2 và `02` §3.1 chỉ có họ tên, điện thoại, avatar | Theo §3.2: không tự sửa email |
| R14-10 | Major | Dòng `prefix_allocation_history` `REVOKE` không có nguồn cho `decision_number`/`note`: `DELETE /admin/prefixes/:id` không có body, ngừng nhóm `revokeRanges=true` không nói | Chủ dự án chốt: `DELETE` nhận body tùy chọn `{ decisionNumber?, historyNote? }`, thiếu thì NULL; ngừng nhóm ghi `decision_number = NULL`, `note` nêu lý do. `01` §8 điểm 5, `02` §3.6, M02 §3.4, M11 §4.2 |
| R14-11 | Major | Không quy định `user_groups.code` sửa được hay không; nếu sửa thì `phone_prefix_groups.code` (`PG-` + mã, không sửa được) lệch, mã cũ được giải phóng đụng `uniq_ppg_code` khi tạo nhóm mới | Chủ dự án chốt: bất biến, gửi `code` trong `PUT` trả `400`. `01` §5 COMMENT, `02` §3.4, M02 §3.3 |
| R14-12 | Minor | `GET /prefixes/history` (USER + ADMIN) không có query params, không nói bản User lọc theo cột nào | Chủ dự án chốt theo R13-06: `userGroupId` chỉ bản Admin, bản User lọc `prefix_allocation_history.user_group_id`; thêm M11 §4.5, `02` §3.6 |
| R14-13 | Minor | `PUT /admin/phone-numbers/:number` không quy định chuyển thẳng `RESERVED` ↔ `LOCKED` ghi lịch sử thế nào | Chủ dự án chốt: cho chuyển, ghi 2 dòng (vd. `UNRESERVE` rồi `LOCK`) cùng transaction. `01` §8, `02` §3.6, M11 §4.4 |
| R15-01 | Minor | M03 §1.2 ghi "kích hoạt lại tài khoản `INACTIVE` ... trả `409`", trái `01` §14 (`INACTIVE` là trạng thái cuối, không có API kích hoạt lại) | Bỏ câu, dẫn `01` §14 |
| R15-02 | Minor | M03 §3.5 chỉ chặn `userGroupId` **khác** nhóm hiện tại; `02` §3.5 ghi `PUT /users/:id` không nhận `userGroupId` (`400`) | Theo `02`: có trường là `400`, kể cả trùng nhóm |
| R15-03 | Minor | M02 §5.1 ví dụ `PG-IT-01` sai quy ước `PG-` + `user_groups.code`; M02 §5.2 store còn `availablePrefixGroups` (chọn nhóm đầu số đã bỏ ở R10-01) | `PG-UMO-IT`; bỏ `availablePrefixGroups` |
| R15-04 | Minor | M12 §4.2 và `00` §3 ghi tăng `cache_version` "sau mỗi cấp phát/thu hồi", thiếu sửa dải (`01` §8) và lệch vị trí "câu ghi cuối trước commit" (`00` §2.1) | "trong cùng transaction của mỗi cấp phát/sửa/thu hồi dải" |
| R15-05 | Minor | Không quy định `organizations.code` sửa được hay không: M01 §1.2 liệt kê "Mã đơn vị" trong trường sửa được, `01` §14 ngầm coi mã cố định | Chủ dự án chốt: bất biến, `PUT` có `code` trả `400`. `01` §4 COMMENT + ghi chú, M01 §1.2, §3.3, `02` §3.3 |
| R15-06 | Minor | `prefix_allocation_history.cdr_ownership_note` không có nguồn cho dòng `UPDATE`/`REVOKE`; không nói `decisionNumber` của `PUT /admin/prefixes/:id` có bắt buộc | Chủ dự án chốt: chỉ `ALLOCATE` có giá trị, `UPDATE`/`REVOKE` ghi NULL; `decisionNumber` bắt buộc ở `PUT` như `POST`. `01` §8 điểm 5 + COMMENT, M11 §4.2, `02` §3.6 |
| R15-07 | Minor | Không quy định `representative_user_id` khi người đại diện bị `LOCKED` (chỉ có quy tắc khi ngừng hoạt động và hạ quyền) | Chủ dự án chốt: giữ nguyên. `01` §14 dòng `users` |
| R15-08 | Minor | M12 §3.1 ghi `fromDate`/`toDate` vừa "bắt buộc" vừa "mặc định 7 ngày" | Chủ dự án chốt: tùy chọn, thiếu thì 7 ngày gần nhất (vẫn luôn lọc `Created`); bắt buộc khi `includeArchive=true`. M12 §3.1, `02` §3.7 |
| R16-01 | Minor | M05 §1.2 thẻ "Tổng Thời Lượng" lấy nguồn `ROUND(SUM(total_duration_sec) / 60)`, trái R13-09 (API chỉ trả giây) | `SUM(total_duration_sec)`, frontend đổi sang phút |
| R16-02 | Minor | M05 §5.1 ghi "2 Biểu đồ toàn mạng" nhưng liệt kê 3 (`quantityChart`, `qualityChart`, `topGroupsChart`, khớp bộ widget M09 §1) | "3 Biểu đồ" |
| R16-03 | Minor | M05 §3.2 `/dashboard/charts` chỉ nêu `period`, thiếu `fromDate`/`toDate` (bắt buộc với `custom`, `02` §1.1) và `groupId` bản Admin (nêu ở dòng Guard) | Thêm vào Query params |
| R16-04 | Minor | M05 §2.1 bảng nguồn dữ liệu thiếu `yesterday`, `this_week`, `last_month` | Thêm ghi chú dẫn `02` §1.1 |
| R16-05 | Minor | M10 TC-PERM-01 so `accountCount` với số dòng `admin_roles`/`user_roles`, trái M10 §3.1 (chỉ tính tài khoản chưa `INACTIVE`; dòng vai trò của tài khoản `INACTIVE` vẫn còn vì RESTRICT); `02` §3.5 không nêu | Theo M10 §3.1; sửa TC và `02` §3.5 |
| R16-06 | Minor | `02` không có quy tắc chế độ bảo trì (`503 MAINTENANCE`, trừ `GET /auth/me`) dù M07 §2 và M03 §5.0 dùng | Thêm `02` §1.2 |
| R16-07 | Minor | Chuỗi hiển thị do server dựng: M06 §3.1 `GET /notifications` có `timeAgo`, trái M06 §5.3 và `02` §4 (frontend tự tính từ `createdAt`); M05 `/dashboard/stats` có `formatted` (vd. "3,845,200 phút", lệch R13-09), `trendLabel`, `qualityLabel`, `label`; `"4.18/5.0"` trái M13 §1 (MOS E-model tối đa 4.5) | Chủ dự án chốt: API không trả chuỗi hiển thị. Quy tắc ở `02` §2; bỏ các trường trên ở M05 §3.1, M06 §3.1; `avgMos` chỉ còn `value` (bỏ `trendType` vì không có `trend`); M05 §5.1 hiển thị `4.18` |
| R16-08 | Minor | Khóa cấp cao ngoài khung `02` §2.2: `unreadCount` (M06), `systemTotal` (M14), `meta.thresholds` (M13 §3.3 nhắc nhưng ví dụ debug-table không có) | Chủ dự án chốt: giữ tên riêng, liệt kê 3 khóa được phép ở `02` §2.2; thêm `meta.thresholds` vào ví dụ M13 §3.1 |
| R16-09 | Minor | M12 `GET /cdr` đòi `cdr:filter_advanced` cho `disconnectionCode`, `codec`, `minMos`/`maxMos`; M13 debug-table nhận cùng tham số chỉ với `qos:view` | Chủ dự án chốt: debug-table cũng đòi `cdr:filter_advanced` (`403`). M13 §3.1, `02` §3.8 |
| R16-10 | Minor | M13 §3.1 debug-table bản Admin không có `groupId`, khác `/cdr`, `/traffic/records` | Chủ dự án chốt: `groupId` tùy chọn, chỉ truyền khi Admin xem một nhóm; không truyền là toàn hệ thống. M13 §3.1, M05 §3.2, `02` §3.8 |
| R16-11 | Minor | Phiên khi tự đổi mật khẩu: `01` §6.1 "thu hồi toàn bộ phiên", `02` §3.1–3.2 "thu hồi các phiên khác", M08/M09 "phiên mới, thu hồi mọi phiên khác" | Chủ dự án chốt: thu hồi mọi phiên cũ kể cả phiên đang dùng (`PASSWORD_CHANGED`), tạo 1 phiên mới. `01` §6.1, `02` §3.1–3.2, M08 §3.4, M09 §3.3 |
| R16-12 | Minor | Cách đổi ảnh đại diện lệch nhau: M09 `PUT /admin/profile` nhận `avatarUrl`, M08 `PUT /profile` không; `02` §3.5 `PUT /users/:id` có "ảnh" nhưng không có API tải ảnh cho người khác | Chủ dự án chốt: chỉ đổi qua `POST .../avatar` (ghi luôn `avatar_url`); các `PUT` có `avatarUrl` trả `400`; quản trị viên không đổi ảnh người khác. `02` §3.1, §3.2, §3.5, M03 §3.5, M08 §3.2–3.3, M09 §1, §3.2 |
| R16-13 | Minor | `dashboardWidgets` (M09 §1) lưu ở `custom_preferences` nhưng `02` §3.1 không nêu trường của preferences Admin hay vị trí trường này | Chủ dự án chốt: trường cấp cao `dashboardWidgets` cạnh 5 trường chung; `custom_preferences` chỉ là nơi lưu. `02` §3.1, M09 §1 |
| R17-01 | Minor | Tham số lọc nhóm của bản Admin lệch tên: `groupId` ở `/users`, `/cdr`, `/qos/*`, `/traffic/*`, `/dashboard/*`, `/reports/*`; `userGroupId` ở `/phone-numbers/pool`, `/phone-numbers/history`, `/prefixes/history` (M11 §4.3–4.5, `02` §3.6) | Chủ dự án chốt: `groupId` cho mọi API. Sửa M11 §4.3–4.5, `02` §3.6 |
| R17-02 | Minor | Tham số tìm kiếm văn bản lệch tên: `search` ở `GET /users`, `/user-groups/me/members`; `keyword` ở `GET /user-groups` (M02 §3.1), `/phone-numbers/pool` (M11 §4.3) | Chủ dự án chốt: `search`. Sửa M02 §3.1, M11 §4.3 |
| R17-03 | Minor | Chuỗi hiển thị còn sót, trái R16-07: M12 `durationFormatted` ("02:15"); M11 `fullRange`, `badgeText` ("42 xxx (500 số)") và `count` trùng `counts.total`; M02 `phonePrefixGroup.prefixes` (`["42xxx"]`); `02` §3.11 `rangesText` của `/admin/dashboard/groups` | Chủ dự án chốt: bỏ; dải số trả mảng `ranges: [{ rangeFrom, rangeTo }]`, frontend tự ghép nhãn. Quy tắc bổ sung ở `02` §2; sửa M02 §3.1, M05 §5.1, M11 §4.1, M12 §3.1, `02` §3.11 |
| R17-04 | Minor | Khóa tạm đăng nhập: `01` §6.1 và TC-USR-02 ghi `423 LOCKED`, M03/M04 ghi `errorCode = ACCOUNT_TEMPORARILY_LOCKED` với `lockedUntil` ở cấp cao, ngoài khung lỗi `02` §2.3 | Chủ dự án chốt: `ACCOUNT_TEMPORARILY_LOCKED`, `errors = { lockedUntil }`. Sửa `01` §6.1, M03 §3.1, §5, TC-USR-02, M04 §3.1; quy tắc "chi tiết lỗi nằm trong `errors`" ở `02` §2.3 |
| R17-05 | Minor | M07 §3.1 trả `smtp_password` dạng `********` nhưng §3.2 không nói `PUT` xử lý giá trị mặt nạ | Chủ dự án chốt: thiếu hoặc bằng `********` thì giữ giá trị cũ, `""` thì xóa. M07 §3.2, `02` §3.12 |
| R17-06 | Minor | M15 §1.2 ghi User Portal có bộ chọn nhóm bị khóa (nhãn "🔒 Khóa theo phân quyền nhóm…"), M15 §4.1 và TC-REP-02 ghi không có bộ chọn | Theo §4.1: không có bộ chọn |
| R17-07 | Minor | `02` §3.10 `/reports/summary` ghi chỉ đọc `stats_daily`, M15 §2.1 đọc `stats_hourly` khi `period=today` | Thêm `stats_hourly` cho `today` ở `02` §3.10 |
| R17-08 | Minor | Mã lỗi cô lập nhóm không thống nhất: M12 §3.2 `403 FORBIDDEN`, M12 §3.3 chỉ có thông điệp; `02` §2.3 ví dụ `FORBIDDEN_SCOPE_ACCESS` đúng cho trường hợp này | `FORBIDDEN_SCOPE_ACCESS` (theo ví dụ `02` §2.3); ghi quy tắc ở `02` §2.3, sửa M12 §3.2, §3.3 |
| R17-09 | Minor | M12 §3.2 nói chi tiết CDR gồm "toàn bộ trường của item `GET /cdr`" nhưng liệt kê `answered`, `destroyed`, `releasedBy` (item không có) và thiếu `audioFileName` (item có) | Liệt kê đúng trường item, ba trường kia chuyển sang "cộng thêm" |
| R17-10 | Minor | M04 §3.1 không nêu mã HTTP khi không tìm thấy tài khoản Admin; M03 §3.1 trả `401` | `401` như M03 |
| R17-11 | Minor | M02 BR-UG-02 chỉ chặn hạ quyền/xóa Quản trị viên nhóm cuối cùng; `01` §14 chặn cả khóa (`LOCKED`) | Thêm khóa, dẫn `01` §14 |
| R17-12 | Minor | M11 §3.1 thông báo `409` "trùng lặp với dải số của đơn vị khác", trong khi dải trùng có thể cùng nhóm (M11 §1.2, `01` §8) | "trùng lặp với dải số đã cấp" |
| R18-01 | Minor | M08 §3.4 và M09 §3.3 dòng Response còn ghi "thu hồi mọi phiên khác", trái câu ngay sau và R16-11 (thu hồi cả phiên đang dùng) | Sửa thành "mọi phiên cũ, kể cả phiên đang dùng" |
| R18-02 | Minor | `02` §1.1 liệt kê kiểu nội dung file xuất chỉ có xlsx và pdf, trong khi `GET /cdr/export` nhận `format=xlsx\|csv` (M12 §3.1.1, `02` §3.7) | Thêm `text/csv; charset=utf-8` |
| R18-03 | Minor | `02` §3.10 ghi `export/excel`, `export/pdf` chỉ đọc `stats_daily`; M15 §2.1 ghi Excel/PDF dùng đúng dữ liệu của `/reports/summary` (`period=today` đọc `stats_hourly`, cùng lỗi với R17-07) | Sửa `02` §3.10 theo M15 |
| R18-04 | Minor | `02` §3.1 `PUT /admin/admins/:id/status` không nêu chặn khóa `ROOT_ADMIN`/tự khóa và thu hồi phiên, M04 §3.4 và `01` §14 có | Bổ sung vào `02` §3.1 |
| R18-05 | Minor | Đăng nhập tài khoản `status = LOCKED`: M03 §3.1 ghi `403 FORBIDDEN`, M04 §3.1 chỉ ghi `403`, không có `errorCode` | Chủ dự án chốt: `403 ACCOUNT_LOCKED` cho cả hai cổng. Sửa `01` §6.1, `02` §2.3, M03 §3.1, M04 §3.1 |
| R18-06 | Minor | `01` §6.1 ghi gộp "đổi mật khẩu, đặt lại mật khẩu, khóa hoặc ngừng hoạt động ... (`PASSWORD_CHANGED` / `ACCOUNT_LOCKED`)", không nói đặt lại mật khẩu dùng lý do nào | Chủ dự án chốt: đổi và đặt lại mật khẩu ghi `PASSWORD_CHANGED`; khóa và ngừng hoạt động ghi `ACCOUNT_LOCKED`. Sửa `01` §6.1, `02` §3.1, §3.5 |
| R18-07 | Minor | `PUT /admin/admins/:id/reset-password` chỉ ghi "trả mật khẩu tạm một lần", M04 không có đặc tả; bản User ghi rõ `temporaryPassword` 16 ký tự | Chủ dự án chốt: giống bản User, ghi `AUTH / PASSWORD_RESET`. Sửa `02` §3.1, §3.5 |
| R18-08 | Minor | `GET /cdr/export` có `format=xlsx\|csv` nhưng không nói bắt buộc hay mặc định | Chủ dự án chốt: tùy chọn, thiếu thì `xlsx`. Sửa M12 §3.1.1, `02` §3.7 |

Đề xuất làm gọn **bị từ chối** ở lần 10 (giữ nguyên, không đề xuất lại): gộp `phone_prefix_groups` vào `user_groups`; thay 5 bảng RBAC bằng cột `role`; bỏ `stats_daily`; bỏ dòng `phone_number_range_history` cho từng số.

---

## 4. Kiểm lại ngày 2026-11-04

Cách kiểm: grep toàn `docs/` (trừ `docs/intent/`, là nhật ký lịch sử) theo dấu hiệu của từng phát hiện, mở dòng trùng khớp để xác nhận.

| Kiểm tra | Kết quả |
|---|---|
| Dấu vết thiết kế cũ: `MP3`, `85 cột`, `[1-8]`, `AUTO_INCREMENT=5370`, `is_global`, `page_size`, `released_by_system`, `avg_rtcp_rtt`, `is_finalized`, `idx_cdre_sipcallid`, `idx_cdre_disconnection_code`, `00000000000000005370`, `totalDurationSeconds`, `prefix-groups/available`, cột audit `user_id, user_group_id, cdr_id` | Không còn (hoặc chỉ trong câu ghi "đã bỏ"/"không nhận") |
| Dấu hiệu đã sửa: `role_scope enum('ADMIN','USER')` + `CHECK`, `COALESCE(Destroyed, Created)`, `uniq_notif_recipient`, `range_from`/`range_to`, `idx_notif_created`, `idx_notif_type`, `replaced_by_session_id`, `cdr_purged_before`, `ON DUPLICATE KEY UPDATE queued_at`, `revokeRanges`, `RETENTION_PURGE_CONFIRM_REQUIRED`, `ORGANIZATION_INACTIVE`, `ACCOUNT_INACTIVE`, `RoleAssignmentService`, `recording_path_map`, ERD "snapshot, no FK", quy tắc cấp/thu hồi RESERVED/LOCKED | Có đủ trong `01`/`02`/module |
| Mã nhóm ví dụ theo quy ước `UMO-…` | Lệch ở M12 §3.1 → **đã sửa** |
| DDL chép trong module (lần 1 D-04, D-05, D-16) | Module không còn khối `CREATE TABLE`, chỉ tham chiếu `01` |

---

## 5. Số liệu dữ liệu thật (`docs/voip_cdr_20250817.sql`)

Căn cứ của S-01…S-11; dùng khi viết test làm giàu CDR.

- 5.369 dòng, 87 cột; `Created` từ 2025-06-11 đến 2025-08-16.
- `Direction`: `remote` 100 %. `ReleasedBy`: `caller` 3.235, `called` 2.134.
- Mã ngắt: 200: 3.347 · 487: 1.446 · 480: 333 · 408: 117 · 503: 64 · 486: 46 · 603: 9 · 404: 7.
- `Answered_Duration` khớp đơn vị **ms** ở 3.347/3.347 dòng có `Answered`.
- MOS thô chỉ có số nguyên (2/3/4) hoặc NULL; `G107R` trong khoảng 42–93.
- Leg kép (dung sai ±2 giây): 1.863 cuộc có 2 leg dạng A+B, khoảng 3.506 cuộc trên 5.369 dòng.
- `CallerId = 'Anonymous'` 241 dòng; `CalledId` không phải 5 chữ số 214 dòng; chữ số đầu số 5 chữ số: 9xxxx 2.453, 5xxxx 2.261, 4xxxx 407.
- `Recorded_Mix_FileName` `.wav` 100 %, đường dẫn `D:\StarTrinity\recordings\…`; RX/TX luôn NULL; `Sip_And_Rtp_Pcap_FileName` có ở 5.255 dòng.
- Luôn NULL: `RTCP_*`, `RTP_Rx_*`, `Test_ID`, `from_no`, `to_no`, `duration`, `time_end`, `created_at`, `updated_at`.

## 6. Báo cáo cũ đã xóa

`DB_SCHEMA_CONSISTENCY_REPORT.md` (chưa từng commit), `DB_SCHEMA_AUDIT_2026-10-23.md`, `db_audit_00.md`, `db_audit_1.md`, `db_audit_2.md` (rỗng), `db_audit_06.md` … `db_audit_12.md`. Bản gốc của các file đã commit còn trong git ở commit `bbbc0f9`; chỉ mở lại khi chủ dự án yêu cầu truy vết.

**Rà soát lần sau**: ghi kết quả bằng cách cập nhật file này (thêm dòng ở mục 1, mục mới ở mục 3, cập nhật mục 2), không tạo file báo cáo riêng.
