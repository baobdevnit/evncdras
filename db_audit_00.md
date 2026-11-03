# BÁO CÁO RÀ SOÁT THIẾT KẾ CSDL – EVN CDR AS (lần 4, sau thiết kế lại vai trò và kiến trúc 1 ứng dụng)

> **Ngày lập**: 2026-11-03 · **Nhánh**: `docs/db-design-readiness` (HEAD `71c1122`)
> **Phạm vi**: `docs/01_database_schema.md` (nguồn chuẩn, viết tắt `01`), `docs/00_overview_and_architecture.md` (`00`), `docs/02_api_contracts.md` (`02`), `docs/03_ui_design.md` (`03`), `docs/modules/01..15` (`M01`…`M15`), `docs/intent/*.md`. `templates/` ngoài phạm vi.
> **Nguyên tắc**: chỉ đọc. Không sửa file nào trong `docs/`, `templates/` hay các báo cáo cũ. Mọi "Hướng sửa" là đề xuất.
> **Tham chiếu** `file:line` theo trạng thái file ngày 2026-11-03.

---

> [!IMPORTANT]
> **Cập nhật 2026-11-03: đã sửa toàn bộ Critical và Major trong `docs/`** (D-01, D-02, X-01, X-02, X-03, đánh dấu ✅ bên dưới). DDL `01` + seed `M10` đã chạy lại trên MariaDB 13.0.2: gán `GROUP_ADMIN`/`REGULAR_USER` cho user và `ROOT_ADMIN` cho admin thành công; gán vai trò sai cổng bị FK chặn (`1452`); ép `role_scope` sai bị `CHECK` chặn (`4025`); đổi vai trò user sang `USER_RECORDING` được, sang `SYSTEM_ADMIN` bị chặn. **Chưa làm**: chạy lại trên MariaDB 10.6.
>
> **Cập nhật 2026-11-03 (lần 2): đã sửa toàn bộ 24 Minor** (D-03…D-10, A-01, X-04…X-18, đánh dấu ✅). Thay đổi schema: bỏ `phone_prefix_ranges.status` (D-09); thêm `range_id`/`range_from`/`range_to` + index vào `prefix_allocation_history` (D-07); thêm `uniq_notif_recipient` (D-08); COMMENT `assigned_at`, `metadata`, stats; partition khởi tạo sinh theo dữ liệu thật (D-04); bảng §14 thêm cột điều kiện khóa (X-18). DDL + seed chạy lại trên MariaDB 13.0.2 không lỗi; UNIQUE người nhận chặn trùng (`1062`); FK vai trò vẫn đúng. Phụ lục A (template) chưa xử lý.

## 0. Tóm tắt điều hành

### 0.1. Bối cảnh

Ba vòng rà trước (`DB_SCHEMA_CONSISTENCY_REPORT.md`, `DB_SCHEMA_AUDIT_2026-10-23.md`, nhật ký `docs/intent/docs-readiness-for-codegen.md`) đã đưa `docs/` về trạng thái "không còn Critical/Major". Sau đó có hai thay đổi chưa được rà lại:

- `docs/intent/roles-permissions-redesign.md` (2026-10-26): khôi phục bảng `admin_roles`/`user_roles` với khóa ngoại phạm vi `(role_id, role_scope) → roles(id, scope)`, bỏ cờ vai trò trên tài khoản, đổi `role_permissions` → `permission_roles`, catalog còn 25 mã.
- `docs/intent/single-app-architecture.md` (2026-11-03): backend 1 ứng dụng `src/apps/{admin,member,worker}` + `src/core`.

Báo cáo này rà lại toàn bộ thiết kế CSDL sau hai thay đổi đó, và lần đầu **chạy thật DDL** trên MariaDB.

### 0.2. Số liệu

| Mức độ | Số phát hiện | Ý nghĩa |
|---|---|---|
| **Critical** | **1** | Sinh migration theo tài liệu thì hệ thống không tạo được người dùng nào |
| **Major** | **4** | Sinh code theo tài liệu sẽ cho số liệu/nhật ký sai hoặc quyền lệch giữa route và API |
| **Minor** | **24** | Lệch COMMENT, ERD, ví dụ, đường dẫn, nhãn hiển thị |
| Informational | 5 | Ghi nhận rủi ro thiết kế, không bắt buộc sửa |
| **Tổng** | **34** | D (nội tại `01`): 10 · A (kiến trúc): 1 · X (lệch chéo): 18 · I: 5 — chi tiết mục 3 |

### 0.3. Kết luận

- **Chưa sẵn sàng sinh migration** cho đến khi sửa **D-01**: khóa ngoại phạm vi vai trò của `user_roles` dùng hai kiểu `ENUM` khác danh sách giá trị. InnoDB so sánh **chỉ số nội bộ** của ENUM, nên `'USER'` (chỉ số 1 trong `enum('USER')`) được đối chiếu với `'ADMIN'` (chỉ số 1 trong `enum('ADMIN','USER')`). Đã kiểm chứng: gán `GROUP_ADMIN` cho user bị từ chối (`ERROR 1452`), gán `ROOT_ADMIN` cho user lại được chấp nhận.
- Ngoài D-01, **cấu trúc schema đúng và chạy được**: 27 bảng + 1 view tạo không lỗi, thứ tự FK đúng, seed vai trò/quyền/setting/ngưỡng QoS chạy được và khớp catalog (mục 2.2).
- **Thiết kế lại vai trò đã được áp dụng sạch**: không còn tham chiếu nào tới `is_root`, `is_group_admin`, `can_access_recording`, `role_permissions`, `role:manage`, "26 mã", `permissions/matrix`, `RootAdminOnlyGuard` ngoài các câu ghi "đã bỏ".
- **Kiến trúc 1 ứng dụng đã được áp dụng sạch**: không còn `src/modules/`, `packages/shared`, monorepo pnpm. Chỉ còn 2 đường dẫn job trong `01` thiếu tiền tố `src/` (A-01, Minor).

### 0.4. Phát hiện cần xử lý trước khi sinh code

| ID | Mức | Tóm tắt |
|---|---|---|
| ✅ D-01 | Critical | FK `fk_ur_role_scope` so sai ENUM → không tạo được user; user nhận được vai trò Admin |
| ✅ D-02 | Major | `PABX_OFFLINE` dựa trên `MAX(cdr.Created)` trong khi bảng `cdr` không bảo đảm có index `Created` → quét toàn bảng PABX mỗi chu kỳ |
| ✅ X-01 | Major | M12 ghi audit nghe/tải ghi âm vào các cột `user_id`, `user_group_id`, `cdr_id` không tồn tại trong `audit_logs` |
| ✅ X-02 | Major | M13 hiển thị thời lượng từ `Answered_Duration` (ms) thay vì `answered_duration_sec` |
| ✅ X-03 | Major | Mã quyền của route frontend (`00`) lệch với API (`02`) ở Lưu lượng và Dashboard |

---

## 1. Phạm vi & phương pháp

1. Đọc trọn `01` (1.252 dòng), kiểm kê bảng, cột, enum, FK, index, partition, seed.
2. **Chạy DDL thật**: trích toàn bộ khối ```` ```sql ```` của `01` và `M10` rồi chạy trên container MariaDB tạm (`mariadb:latest` = **MariaDB 13.0.2**, không phải 10.6 như tài liệu yêu cầu; container đã xóa sau khi kiểm tra). Thử các thao tác gán vai trò hợp lệ và sai cổng.
3. Grep toàn `docs/` các tên đã bỏ trong thiết kế lại vai trò và các đường dẫn kiến trúc cũ.
4. Đối chiếu chéo mọi bảng/cột/enum/setting/mã quyền/action audit được nhắc trong `00`, `02`, `03`, M01–M15 với DDL và seed của `01`. Mỗi phát hiện đã được mở và đọc tận dòng trích dẫn.

---

## 2. Kiểm kê schema hiện tại

### 2.1. Danh mục bảng

| Mục `01` | Bảng | PK | FK ra ngoài | Ghi chú |
|---|---|---|---|---|
| §2 | `cdr` | `id` | — | Của PABX, chỉ đọc, 87 cột (đã đếm) |
| §2.1 | `cdr_enriched` | (`id`, `Created`) | — (tham chiếu logic) | Partition RANGE theo tháng, 12 index phụ |
| §2.2 | `cdr_enrichment_state` | `id` | — | 1 dòng watermark |
| §3 | `admins` | `id` | `admins` (SET NULL) | UNIQUE qua cột ảo `*_active` |
| §4 | `organizations` | `id` | `organizations` (RESTRICT) | |
| §4.1 | `phone_prefix_groups` | `id` | — | |
| §5 | `user_groups` | `id` | `organizations`, `phone_prefix_groups` (RESTRICT), `users` (SET NULL, qua `ALTER`) | |
| §6 | `users` | `id` | `user_groups` (RESTRICT) | UNIQUE qua cột ảo `*_active` |
| §6.1 | `auth_sessions` | `id` | — (polymorphic) | |
| §7 | `roles`, `permissions`, `permission_roles`, `admin_roles`, `user_roles` | | `admin_roles`/`user_roles` → `roles(id, scope)` | Xem D-01 |
| §8 | `phone_prefix_ranges`, `phone_numbers`, `prefix_allocation_history`, `phone_number_range_history`, view `v_phone_numbers_detail` | | | |
| §10 | `qos_threshold_configs` | `id` | — | Seed 5 ngưỡng |
| §11 | `notifications`, `notification_recipients` | | `admins` (SET NULL), `notifications` (CASCADE) | |
| §12 | `system_settings`, `user_settings` | | — | Seed 19 key |
| §13 | `audit_logs` | `id` | — | |
| §15 | `stats_recompute_queue`, `stats_hourly`, `stats_daily` | | `user_groups` (RESTRICT) | 56 cột mỗi bảng stats |

### 2.2. Kết quả chạy thử DDL và seed

| Kiểm tra | Kết quả |
|---|---|
| Toàn bộ DDL `01` (27 `CREATE TABLE` + 1 view + `ALTER` + seed) | ✅ Chạy không lỗi |
| `cdr` | ✅ 87 cột |
| `cdr_enriched` partition | ✅ `p_2025_06`, `p_2025_07`, `p_2025_08`, `p_future` |
| Seed `M10` §2.1 | ✅ 25 mã quyền; `permission_roles`: ROOT_ADMIN 25, SYSTEM_ADMIN 24, GROUP_ADMIN 17, USER_RECORDING 11, REGULAR_USER 9 |
| Seed `system_settings` | ✅ 19 key, khớp mọi key được nhắc trong M07 và `01` |
| `INSERT INTO user_roles (user_id, role_id) VALUES (1, 3)` (GROUP_ADMIN) | ❌ `ERROR 1452 … fk_ur_role_scope` |
| `INSERT INTO user_roles (user_id, role_id) VALUES (2, 1)` (ROOT_ADMIN) | ❌ **Được chấp nhận** |
| `INSERT INTO admin_roles (admin_id, role_id) VALUES (1, 1)` (ROOT_ADMIN) | ✅ |
| `INSERT INTO admin_roles (admin_id, role_id) VALUES (2, 5)` (REGULAR_USER) | ✅ Bị chặn đúng |

---

## 3. Phát hiện chi tiết

### 3.1. Nhóm D – Nội tại `01_database_schema.md`

#### ✅ D-01 · Critical · Khóa ngoại phạm vi vai trò của `user_roles` so sai giá trị ENUM

- **Bằng chứng**: `01:644` `role_scope enum('ADMIN')`, `01:656` `role_scope enum('USER')`, đích `01:609` `scope enum('ADMIN','USER')`, FK `01:649`, `01:661`.
- **Cơ chế**: InnoDB lưu ENUM bằng chỉ số (1, 2…) và FK so sánh giá trị lưu trữ. Trong `enum('USER')`, `'USER'` có chỉ số 1; trong `roles.scope`, chỉ số 1 là `'ADMIN'`. `admin_roles` chạy đúng chỉ vì `'ADMIN'` tình cờ có chỉ số 1 ở cả hai bên.
- **Hậu quả**:
  - Mọi thao tác tạo user đều lỗi, vì user phải có dòng `user_roles` trong cùng transaction (`01:679`). Bao gồm tạo nhóm kèm Quản trị viên nhóm đầu tiên (M02) và `PUT /users/:id/role`.
  - Mục tiêu "chặn ở mức CSDL việc gán vai trò User cho Admin và ngược lại" (`01:679`) bị đảo ngược phía User: user nhận được `ROOT_ADMIN`/`SYSTEM_ADMIN`.
- **Hướng sửa (đã thử trên MariaDB, chạy đúng)**: hai bảng con khai báo `role_scope` **cùng định nghĩa** với cột đích, cố định giá trị bằng `CHECK`:
  ```sql
  `role_scope` enum('ADMIN','USER') NOT NULL DEFAULT 'USER',
  CONSTRAINT `chk_ur_scope` CHECK (`role_scope` = 'USER'),
  ```
  Tương tự `admin_roles` với `DEFAULT 'ADMIN'` và `CHECK (role_scope = 'ADMIN')`. Kết quả thử: gán `GROUP_ADMIN` thành công, gán `ROOT_ADMIN` bị FK chặn, ép `role_scope = 'ADMIN'` bị `CHECK` chặn (`ERROR 4025`). Cập nhật cả `docs/intent/roles-permissions-redesign.md` R4 nếu có mô tả kiểu cột.
- **Lưu ý**: đã thử trên MariaDB 13.0.2. Nên chạy lại trên 10.6 trước khi chốt, kể cả hướng sửa.

#### ✅ D-02 · Major · `PABX_OFFLINE` đọc `MAX(cdr.Created)` trên bảng PABX không bảo đảm có index

- **Bằng chứng**: `01:863` "tiến trình làm giàu theo dõi `MAX(cdr.Created)`"; `01:161` index `Created` trên `cdr` "chỉ tham khảo, không đưa vào migration", hệ thống "chỉ đọc theo khóa chính `id > watermark`".
- **Hậu quả**: không có index thì mỗi chu kỳ kiểm tra là một lần quét toàn bảng `cdr` của PABX. Điều này trái với cam kết chỉ đọc theo PK, và gây tải lên CSDL dùng chung với PABX.
- **Hướng sửa**: lấy thời điểm của bản ghi mới nhất theo PK (`SELECT Created FROM cdr ORDER BY id DESC LIMIT 1`), hoặc lưu `MAX(Created)` của batch vừa làm giàu vào `cdr_enrichment_state` (thêm cột `last_cdr_created_at`) và so sánh trên đó.

#### ✅ D-03 · Minor · ERD §1 lệch DDL

- `01:22` `USER_GROUPS ||--|| PHONE_PREFIX_GROUPS`: một nhóm đầu số có thể chưa gắn nhóm người dùng nào (`01:1015`), phía `phone_prefix_groups` nên là `|o`.
- `01:24` `PHONE_PREFIX_RANGES ||--o{ PHONE_NUMBERS`: `phone_numbers.range_id` NULL-able (`01:731`), phía dải nên là `|o`.
- ERD thiếu các FK thật từ `ADMINS`: `fk_admins_created_by` (`01:435`), `fk_pah_admin` (`01:787`), `fk_pnrh_admin` (`01:812`), `fk_notif_admin` (`01:888`).

#### ✅ D-04 · Minor · Partition khởi tạo viết cứng theo tháng của dữ liệu mẫu

- **Bằng chứng**: `01:359-362` (`p_2025_06`…`p_2025_08`).
- Cài mới vào năm 2026 thì toàn bộ CDR cũ hơn 2025-07 dồn vào `p_2025_06`, và các tháng 2025-09 → hiện tại nằm trong `p_future` cho tới khi job tách. Job khởi động (`01:370`) xử lý được phần sau, nhưng phần trước làm `DROP PARTITION` theo hạn 60 tháng (`01:375`) kém chính xác.
- **Hướng sửa**: migration tạo partition đầu tiên theo `MIN(cdr.Created)` lúc cài, hoặc ghi rõ khối DDL là ví dụ và job khởi động sinh danh sách thật.

#### ✅ D-05 · Minor · `01:374` dùng đường dẫn User cho tham số chỉ dành cho Admin

- "qua tham số `includeArchive=true` trên `GET /api/v1/cdr`", trong khi `02:24` chỉ cho bản Admin (`/api/v1/admin/cdr`) nhận `includeArchive`. Sửa thành `GET /api/v1/admin/cdr`.

#### ✅ D-06 · Minor · COMMENT cột stats dùng tên API thay tên cột

- `01:1133`, `01:1219` "> criticalThreshold của PACKET_LOSS_PERCENT". Cột thật là `qos_threshold_configs.critical_threshold` (`01:840`).

#### ✅ D-07 · Minor · `prefix_allocation_history` không lưu dải có cấu trúc

- `01:769-788` chỉ có `range_text` (chuỗi hiển thị), không có `range_id`/`range_from`/`range_to`. Sau khi dải bị xóa cứng (`01:1016`), không truy vấn lịch sử theo dải hay theo khoảng số được.
- **Hướng sửa**: thêm `range_id` (không FK, snapshot), `range_from`, `range_to`.

#### ✅ D-08 · Minor · `notification_recipients` không chặn trùng người nhận

- `01:891-903` không có UNIQUE (`notification_id`, `recipient_type`, `recipient_id`). Với `target = EVERYONE` hoặc cảnh báo nhóm (Admin + Quản trị viên nhóm, `01:866`), lỗi gộp danh sách sẽ tạo 2 dòng cho một người.
- **Hướng sửa**: thêm UNIQUE đó; index `idx_notif_recipient` giữ nguyên.

#### ✅ D-09 · Minor · `phone_prefix_ranges.status` không có ngữ nghĩa

- `01:717` `status enum('ACTIVE','INACTIVE')`, nhưng thu hồi dải là xóa cứng (`01:1016`), không có thao tác nào đặt `INACTIVE`. Bỏ cột hoặc định nghĩa khi nào dùng.

#### ✅ D-10 · Minor · `assigned_at` của `admin_roles`/`user_roles` có `ON UPDATE`

- `01:645`, `01:657` `assigned_at … ON UPDATE CURRENT_TIMESTAMP`. Với `user_roles` đây là "thời điểm gán vai trò hiện tại" và đúng ý; nên ghi rõ trong COMMENT để người sinh entity không hiểu là thời điểm tạo tài khoản. Lịch sử đổi vai trò nằm ở `audit_logs` (`CHANGE_ROLE`).

### 3.2. Nhóm A – Kiến trúc 1 ứng dụng

#### ✅ A-01 · Minor · Đường dẫn job trong `01` thiếu tiền tố `src/`

- `01:370` `apps/worker/partition-maintenance`, `01:596` `apps/worker/session-cleanup`. Cây thư mục chuẩn ở `00:344-351` là `backend/src/apps/worker/...`. Tên tiến trình `backend-worker` khớp `00:135-136`, không phải lỗi.
- Các module dùng cùng cách viết tắt nhưng luôn đặt sau ngữ cảnh `backend/src/`, nên không tính là lỗi.

### 3.3. Nhóm X – Lệch chéo giữa `01` và tài liệu khác

#### ✅ X-01 · Major · M12 ghi audit nghe/tải ghi âm vào cột không tồn tại

- **Bằng chứng**: `M12:187` "Ghi Audit Log: `LISTEN_AUDIO` (Lưu user_id, user_group_id, cdr_id, IP)", `M12:195` tương tự cho `DOWNLOAD_AUDIO`.
- `audit_logs` (`01:969-985`) chỉ có `actor_type`, `actor_id`, `actor_name`, `action`, `resource_name`, `resource_id`, `ip_address`, `user_agent`, `action_details`. API này cũng phục vụ Admin, khi đó tác nhân không phải user.
- Đây là nhật ký bắt buộc theo quy định an toàn thông tin (`01:966`); sinh code theo M12 sẽ lỗi hoặc ghi sai.
- **Hướng sửa**: `actor_type`/`actor_id`/`actor_name` theo người gọi, `resource_name = 'AUDIO'`, `resource_id = <cdr id>`, `ip_address`, `user_agent`, `action_details = { "userGroupId": …, "callGroupKey": … }`.

#### ✅ X-02 · Major · M13 hiển thị thời lượng từ cột mili-giây

- **Bằng chứng**: `M13:276` "Thời gian & Thời lượng đàm thoại (`Created`, `Answered_Duration`)".
- `01:218`: `answered_duration_sec` là nguồn duy nhất cho mọi thời lượng nghiệp vụ; `Answered_Duration` tính bằng ms (`01:95`). Chính `M13:75` cũng nói `duration` = `answered_duration_sec`.
- **Hướng sửa**: đổi thành `answered_duration_sec`.

#### ✅ X-03 · Major · Mã quyền của route frontend lệch với API

| Màn hình | Route (`00`) | API (`02`) |
|---|---|---|
| Lưu lượng | `00:609`, `00:651`: `report:view` | `02:259-260` `/traffic/*`: `cdr:view` |
| Dashboard Admin | `00:604`, `00:634`: `report:view` | `02:277-280`, `02:279` `/admin/dashboard/groups`: Authenticated |
| Dashboard Member | `00:646`: `report:view` | `02:277-280`: Authenticated |

- Người có `cdr:view` nhưng không có `report:view` gọi được API nhưng không vào được màn hình, hoặc ngược lại. Theo seed hiện tại mọi vai trò đều có cả hai mã nên chưa lộ ra, nhưng sinh guard/`meta.permissions` theo hai nguồn sẽ ra hai quy tắc khác nhau.
- **Hướng sửa**: chốt một mã cho mỗi màn hình và ghi ở cả `00` lẫn `02` (đề xuất: Lưu lượng = `cdr:view` như API; Dashboard = không cần mã quyền, theo Q7 "thao tác cá nhân (dashboard…) không cần mã quyền").

#### ✅ X-04 · Minor · M01 ví dụ `level` sai thang

- `M01:62` "Tổng công ty 71" `"level": 0`; `M01:71` "Khối Công nghệ Thông tin" `"level": 1`. Thang ở `01:459`: 0 Tập đoàn, 1 Tổng công ty, 2 Khối/Công ty, 3 Phòng ban/Điện lực.

#### ✅ X-05 · Minor · ERD M02 lệch ERD `01`

- `M02:58` `PHONE_PREFIX_GROUPS ||--|{ PHONE_PREFIX_RANGES` (1..n), `01:23` là 0..N.
- `M02:60`, `M02:61` vẽ nét liền (FK) cho `PREFIX_ALLOCATION_HISTORY`, `PHONE_NUMBER_RANGE_HISTORY`; `01:26-27` và DDL là snapshot, không FK.
- `M02:56` `USER_GROUPS ||--|{ USERS` (1..n), `01:29` là 0..n. Chấp nhận được nếu muốn thể hiện quy tắc "ít nhất 1 GROUP_ADMIN", nhưng nên thống nhất một cách vẽ.

#### ✅ X-06 · Minor · M03 nhãn trạng thái trộn `LOCKED` và `INACTIVE`

- `M03:252` `badge-status inactive` hiển thị "Khóa". `users.status` có 3 giá trị (`01:536`); "Khóa" là `LOCKED`, còn `INACTIVE` là ngừng hoạt động (xóa mềm, `01:1013`).

#### ✅ X-07 · Minor · M05 dùng tên claim token không tồn tại

- `M05:235` `user.role`, `user.groupId`. Token mang `roleCode` (`01:683`), claim User là `sub`, `userGroupId`, `roleCode` (`M03:71`, `M03:218`).

#### ✅ X-08 · Minor · M06 khóa `metadata` khác COMMENT cột

- `M06:54-61` trả `userGroupId`, `statDate`, `statHour`; COMMENT `01:882` ghi `user_group_id`, `stat_date`, `stat_hour`. Theo D1 API dùng camelCase, nên cần nói rõ hoặc **lưu** JSON bằng camelCase, hoặc service đổi khóa khi trả về. Đề xuất lưu camelCase và sửa COMMENT `01:882`.

#### ✅ X-09 · Minor · M08 không có giá trị `system` của theme

- `M08:18`, `M08:140` chỉ có công tắc Sáng/Tối; `user_settings.theme` là `enum('light','dark','system')`, mặc định `system` (`01:950`).

#### ✅ X-10 · Minor · M13 thang MOS tối đa 5.0

- `M13:15` "từ 1.0 … đến 5.0". MOS thập phân hệ thống dùng tính từ E-model, tối đa 4.5 (`01:227`). Chỉ cột thô `RTP_*_G107MOS` lên tới 5.

#### ✅ X-11 · Minor · M13 hiển thị cột luôn NULL

- `M13:64`, `M13:288` hiển thị `Audio_Signal_Delay` trong modal QoS; `01:1046` ghi cột này luôn NULL trên dữ liệu thật. Cùng module lại ẩn RTT với cùng lý do (`M13:65`). Nên xử lý như RTT.

#### ✅ X-12 · Minor · M09 tên vai trò khác seed

- `M09:93` nhãn `SYSTEM_ADMIN` là "Kỹ thuật viên Quản trị"; seed `01:667` và `M10:26` là "Quản trị viên hệ thống". Giao diện nên hiển thị `roles.name`.

#### ✅ X-13 · Minor · M10 nhắc service không có trong cây thư mục

- `M10:293` "dùng chung `RoleAssignmentService`", nhưng cây `core/permissions/` ở `M10:270-291` không có file này. Thêm vào cây (service ghi `user_roles`/`admin_roles`).

#### ✅ X-14 · Minor · `02:161` tên trường snake_case

- "Lấy thiết lập giao diện (theme, items_per_page)" trái quy ước camelCase `02:59`; nên là `itemsPerPage`.

#### ✅ X-15 · Minor · `03` danh mục thông báo không khớp enum

- `03:485` "phân loại theo icon (User, System, Alert, Report, Org)"; `notifications.type` là `QOS_ALERT`, `PABX_OFFLINE`, `SYSTEM_MAINTENANCE`, `GENERAL` (`01:878`).

#### ✅ X-16 · Minor · `03` mô tả cài đặt không có trong seed

- `03:441` "Cài đặt tích hợp PABX, MariaDB & Sao lưu", `03:486` "Thông số MariaDB, Danger Zone". Seed `01:924-943` là danh mục key duy nhất (`01:923`), không có key MariaDB/sao lưu; `00:367` nói cấu hình CSDL không lưu trong DB.

#### ✅ X-17 · Minor · `03` nhắc template và thao tác không tồn tại

- `03:456`, `03:481` `users4group.html` "chọn người dùng vào nhóm": file không có trong `templates/`, và đổi nhóm của user trái với `users.user_group_id` bất biến (`M10:81`).

#### ✅ X-18 · Minor · Quy tắc khóa tài khoản chặt hơn `01` §14

- `M03:36` cấm khóa Quản trị viên nhóm cuối cùng; `M04:20`, `M04:96` cấm khóa Root Admin. `01:1013-1014` chỉ nói chặn **xóa mềm**. Không mâu thuẫn, nhưng nên bổ sung cột "Khóa (`LOCKED`)" vào bảng §14 để nguồn chuẩn đầy đủ.

### 3.4. Nhóm I – Ghi nhận (không bắt buộc sửa)

| ID | Ghi nhận | Tham chiếu |
|---|---|---|
| I-01 | `high_packet_loss_calls_count` phụ thuộc ngưỡng tại thời điểm tính. Đổi ngưỡng rồi tính lại (`stats_recompute_queue`) sẽ đổi số liệu lịch sử, còn các ngày không tính lại thì giữ ngưỡng cũ | `01:1133`, `01:1069` |
| I-02 | `representative_user_id` "phải mang vai trò GROUP_ADMIN" và cùng nhóm chỉ do service bảo đảm; M10 đã xử lý khi hạ quyền (`M10:260`), §14 xử lý khi xóa mềm | `01:505` |
| I-03 | `cdr_enriched` có 12 index phụ trên bảng ghi liên tục; truy vấn theo nhóm `caller_group_id = g OR called_group_id = g` cần index merge hoặc `UNION`. Nên đo trên dữ liệu thật trước khi chốt bộ index | `01:344-355` |
| I-04 | `02:200` trả `groupGated` cho mỗi quyền: không phải cột, là hằng số trong code (`M10:65`). Nên ghi rõ nguồn trong `02` | `02:200` |
| I-05 | `02:219` `status: "NORMAL"` chỉ có trong request, ánh xạ về `ALLOCATED`/`FREE`; đã giải thích tại chỗ | `02:219` |

---

## 4. Việc cần làm (đề xuất, theo thứ tự)

1. **Sửa D-01** trong `01` §7 (và intent R4), chạy lại DDL trên MariaDB 10.6, thêm test case: tạo user với `GROUP_ADMIN` thành công, gán `ROOT_ADMIN` cho user bị chặn.
2. **Sửa D-02**: chọn cách theo dõi PABX offline không quét bảng `cdr`; nếu thêm cột vào `cdr_enrichment_state` thì cập nhật DDL §2.2.
3. **Sửa X-01, X-02** trong M12, M13.
4. **Chốt X-03**: một mã quyền cho mỗi màn hình, sửa `00` hoặc `02`.
5. Gom các Minor (D-03…D-10, A-01, X-04…X-18) vào một commit dọn tài liệu.
6. Sau khi sửa: chạy lại toàn bộ DDL + seed trên MariaDB 10.6 như mục 2.2 làm bước kiểm tra cuối trước khi sinh migration/entity.

## 5. Trạng thái các quyết định trước

| Quyết định | Trạng thái |
|---|---|
| Q1–Q5, Q8–Q11, R1–R13, D1–D4 (`docs/intent/docs-readiness-for-codegen.md`) | Còn hiệu lực, đã phản ánh đúng trong `01` (ngoại lệ: D-02 liên quan R9/Alert Engine) |
| Q6 (vai trò suy ra từ cờ), phần `role_permissions`/`role:manage` của Q7 | Đã bị thay bởi `roles-permissions-redesign.md`; không còn dấu vết trong `docs/` |
| R1–R6 của `roles-permissions-redesign.md` | Đã áp dụng đầy đủ; **R4 có lỗi cài đặt ở mức DDL (D-01)** |
| A1–A6 của `single-app-architecture.md` | Đã áp dụng; chỉ còn A-01 (đường dẫn viết tắt) |

## Phụ lục A – Ngoài phạm vi CSDL

- `03:437-489` danh mục template cũ: còn `login_admin.html`, `users4group.html` (không tồn tại); thiếu `templates/member/group-admin.html`, `group-members.html` (`00:653-654`). Cần cập nhật khi sửa `templates/`.
