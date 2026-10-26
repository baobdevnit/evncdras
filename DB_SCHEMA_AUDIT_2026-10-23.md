# BÁO CÁO RÀ SOÁT TÍNH NHẤT QUÁN THIẾT KẾ CSDL – EVN CDR AS (lần 2)

> **Ngày lập**: 2026-10-23 · **Phạm vi**: `docs/**` (01 schema, 00 overview, 02 API, 03 UI, 15 module docs, catalog đầu số, intent, SQL dump thật `voip_cdr_20250817.sql`) đối chiếu `templates/admin/**`, `templates/member/**`.
> **Nguyên tắc**: chỉ đọc. Không sửa file nào trong `docs/`, `templates/` hay các báo cáo cũ. Mọi "Hướng sửa" là đề xuất.
> **Nguồn chuẩn**: `docs/01_database_schema.md` (viết tắt `01`). Module docs viết `M02`, `M05`… (= `docs/modules/02_*.md`…). Template viết `admin/…`, `member/…` (= `templates/admin/…`).
> **Tham chiếu** `file:line` theo trạng thái file ngày 2026-10-23.

---

> [!IMPORTANT]
> **Trạng thái cập nhật 2026-10-26: đã xử lý toàn bộ phát hiện Critical/Major phía `docs/`.**
> - Đã chốt **28 quyết định thiết kế** qua phỏng vấn: Q1–Q11 (báo cáo này), R1–R13 (lượt rà lại thứ hai), D1–D4 (lượt rà cuối). Tất cả đã ghi vào `docs/`. Nhật ký đầy đủ, kèm danh sách việc cần sửa `templates/` cho đợt sau, nằm tại `docs/intent/docs-readiness-for-codegen.md`.
> - **Lượt rà độc lập thứ hai** tìm thêm khoảng 50 điểm; **lượt rà cuối** tìm 7 Critical, 7 Major và khoảng 60 Minor. Toàn bộ Critical và Minor máy móc đã sửa, các Major đã chốt ở D1–D4.
> - **Kiểm tra cuối**: DDL `01` có 25 bảng, thứ tự FK đúng, cú pháp hợp lệ với MariaDB 10.6 (partition, cột ảo UNIQUE); không còn tham chiếu tới thiết kế đã bỏ; mọi mã quyền thuộc catalog 26 mã; mọi action audit thuộc danh mục `01` §13; mọi setting được dùng đều có seed.
> - **Chưa làm (ngoài phạm vi đợt này)**: sửa `templates/` (nhóm T trong báo cáo), sinh code. Phần mô tả bên dưới phản ánh trạng thái **trước** khi sửa; các mục đã xử lý được đánh dấu ✅.

## 0. Tóm tắt điều hành

| Mức độ | Số lượng | Ý nghĩa |
|---|---|---|
| **Critical** | **13** | Làm theo tài liệu thì DDL không chạy hoặc số liệu thống kê sai |
| **Major** | **33** | Mô hình dữ liệu mâu thuẫn giữa các tài liệu/template, cần chốt thiết kế |
| **Minor** | **16** | Lệch COMMENT, ví dụ, mock data, dọn tài liệu |
| **Tổng** | **62** | S (dữ liệu thật): 11 · D (docs↔docs): 22 · A (API/quyền): 4 · T (templates): 25 |

**Kết luận chính**

1. **Lớp DDL ứng dụng** trong `01` tự nhất quán hơn lần rà trước (FK `fk_ug_rep_user` đã chuyển sang `ALTER TABLE`, `idx_users_group_admin` đã có, `metadata` thông báo đã dùng `user_group_id`). Nhưng **chạy `01` từ trên xuống vẫn lỗi** vì `cdr_enriched` (§2.1) tham chiếu `user_groups` (§5) trước khi bảng này được tạo (D-01), và module 02 vẫn giữ FK vòng (D-02).
2. **Lớp ngữ nghĩa dữ liệu `cdr` vẫn sai so với dữ liệu thật.** Thống kê lại 5.369 dòng dump cho thấy:
   - `Answered_Duration` tính bằng **ms**, khớp 3.347/3.347 dòng; tài liệu ghi là giây.
   - `Direction='remote'` ở 100 % dòng.
   - `DisconnectionStatus` là reason-phrase SIP, không phải `ANSWERED/NO ANSWER`.
   - MOS là **số nguyên** (chỉ có giá trị 2/3/4).
   - **Leg kép**: 5.369 dòng chỉ ứng với khoảng 3.506 cuộc (1.863 cuộc có 2 leg), nên đếm theo dòng sẽ thổi số cuộc gọi lên khoảng 53 %.

   `cdr_enriched` chưa có cột nào để chuẩn hóa các điểm này.
3. **Templates xây trên một mô hình khác `01`**:
   - FK 1-1 đặt ngược chiều (`prefixGroups[].userGroupId`) và có thao tác "Hủy gán" phá ràng buộc `NOT NULL`.
   - Kho số 90.000 thay vì 99.999.
   - Trạng thái và action history dạng tiếng Việt tự do.
   - Báo cáo khóa theo đầu số/tổ chức thay vì `user_groups.id`.
   - Mỗi trang dùng một bộ dữ liệu nhóm riêng, không khớp nhau.

**Top Critical cần xử lý trước**: S-01 (ms), S-02/D-03 (thiếu cột chuẩn hóa), S-04 (leg kép), D-01/D-02 (DDL không chạy), D-04/S-03 (thang MOS), T-01 (FK đảo + hủy gán).

---

## 1. Phương pháp

1. Trích mô hình chuẩn (bảng, cột, kiểu, enum, index, FK) từ `01`.
2. Đối chiếu từng module doc, `00`, `02`, `03`, catalog với `01`: DDL chép lại, tên bảng/cột, enum, đơn vị, mã quyền, DTO.
3. Phân tích dump `voip_cdr_20250817.sql` bằng script Node (Phụ lục B): phân bố giá trị, đơn vị, độ dài số, leg kép, cột luôn NULL.
4. Đối chiếu mock data, form và enum hiển thị trong `templates/admin|member` với `01`.
5. Kiểm tra lại từng trích dẫn trọng yếu bằng cách mở đúng dòng. Kiểm tra trạng thái các phát hiện của báo cáo cũ (mục 7).

---

## 2. Nhóm S – Dữ liệu thật (`voip_cdr_20250817.sql`) mâu thuẫn tài liệu

#### S-01 · Critical · `Answered_Duration` là mili-giây, tài liệu ghi giây
- **Docs**:
  - `01:93,221` "Thời lượng đàm thoại thực tế tính bằng giây (seconds)".
  - `01:820,903` `total_duration_sec` "Answered_Duration (giây)".
  - `M12:57`, `M13:61`, `M14:28` cùng ghi "giây".
  - Ví dụ `02_api_contracts.md:58` `"Answered_Duration": 135`.
- **Dữ liệu**: cả 3.347/3.347 dòng có `Answered` thỏa `Answered_Duration/1000 ≈ Destroyed − Answered` (±2 s). Ví dụ dòng id 1: 08:02:40 → 08:03:06 (26 s), `Answered_Duration=26102`.
- **Tác động**: `*_duration_sec`, ACD/ALOC, `call_duration_records.duration_seconds` và `analysis_min_duration_seconds` sai 1.000 lần.
- **Hướng sửa**: sửa COMMENT thành ms; thêm cột dẫn xuất `answered_duration_sec` trên `cdr_enriched` (`ROUND(Answered_Duration/1000)`); các stats chỉ cộng từ cột này.

#### S-02 · Critical · `Direction`/`DisconnectionStatus` thật không chứa giá trị nghiệp vụ mà docs dùng để lọc/đếm
- **Dữ liệu**:
  - `Direction='remote'` ở 5.369/5.369 dòng.
  - `DisconnectionStatus` gồm: OK 3.347, RequestTerminated 1.446, TemporarilyUnavailable 333, RequestTimeout 117, ServiceUnavailable 64, BusyHere 46, Declined 9, NotFound 7.
- **Docs dùng giá trị không tồn tại**:
  - `01:814` "DisconnectionStatus = ANSWERED".
  - `M12:49` "Direction: Inbound, Outbound, Internal"; `M12:55` "ANSWERED, NO ANSWER…".
  - `M14:27` `'ANSWERED'`; `M14:162` `'NO ANSWER'`.
- `01:62` đã thừa nhận giá trị raw và hứa "chuẩn hóa … tại bảng làm giàu `cdr_enriched`". Nhưng DDL `cdr_enriched` (`01:193-296`) **không có cột chuẩn hóa nào** (xem D-03).
- **Tác động**: bộ lọc CDR trả về rỗng; `answered_calls`/ASR = 0 nếu cài đặt theo COMMENT.

#### S-03 · Critical · MOS lưu số nguyên, thống kê lại giả định thập phân ×100 và chia dải 0,5
- **Dữ liệu**: `RTP_Caller_G107MOS` chỉ có 4 (4.153 dòng), 2 (7), NULL (1.209). `RTP_Called_G107MOS` chỉ có 4/3/2/NULL. `G107R` nằm trong khoảng 42–93.
- **Docs**:
  - `M13:52` thừa nhận "Lưu trữ số nguyên từ 1 đến 5".
  - `01:831` "nhân 100, ví dụ 425 = 4.25".
  - Dải `01:836-838` "Tốt (3.5 <= MOS < 4.0)", "Trung bình (3.0 <= MOS < 3.5)".
- **Tác động**: `mos_good_count` luôn = 0; `mos_fair_count` thực chất là "MOS = 3"; điểm trung bình trông chính xác giả tạo.
- **Hướng sửa**: hoặc tính MOS thập phân từ `G107R` theo E-model khi làm giàu (thêm `mos_caller_x100`, `mos_called_x100` vào `cdr_enriched`), hoặc định nghĩa lại dải theo số nguyên.

#### S-04 · Critical · Cuộc gọi qua lõi PABX có 2 bản ghi (2 SIP leg)
> ✅ **Đã chốt Q2 (2026-10-23)** và cập nhật vào `01` §2.1/§9/§15, `M07`, `M12`, `M14`.
> - **Cột mới** trên `cdr_enriched`: `leg_role`, `call_group_key`, `is_primary_leg`.
> - **Setting mới**: `pabx_core_ip_list`.
> - **Đo lại với dung sai ±2 s**: 1.863 cuộc có 2 leg (đều đúng dạng A+B), khoảng 3.506 cuộc trên 5.369 dòng. Số đo cũ theo `Created` khớp tuyệt đối (1.671 nhóm) chưa tính đủ.
- **Dữ liệu**: gom theo (`CallerId`, `CalledId`, `Created`) thì 5.369 dòng chỉ còn 3.698 cuộc. Có 1.671 nhóm gồm 2 dòng (3.342 dòng), mỗi leg mang `SipCallId` khác nhau. Ví dụ id 4/5, 6/7, 8/9: cùng caller/called/Created, một leg có `CallerIp=10.65.7.1`, leg còn lại có `CallerIp=10.128.16.252`.
- **Docs**: `M12:11` "Mỗi cuộc gọi sinh ra một bản ghi". `01:810` `total_calls` đếm theo dòng. `call_duration_records.uniq_duration_cdr` (`01:658`) là 1 dòng/1 leg.
- **Tác động**: tổng cuộc gọi, tổng thời lượng và số file ghi âm bị đếm đôi (đếm theo dòng thổi số cuộc gọi lên khoảng 53 %).
- **Hướng sửa**: thêm `call_group_key` + `is_primary_leg` vào `cdr_enriched`, quy tắc chọn leg chính (vd. leg có `CallerIp` thuộc PABX lõi); stats chỉ đếm `is_primary_leg = 1`.

#### S-05 · Major · Bộ đếm mã SIP/kết cục cuộc gọi không bao phủ dữ liệu thật
> ✅ **Đã chốt Q3 (2026-10-23)**: cột `cdr_enriched.call_status` + bảng ánh xạ ở `01` §2.1; bộ đếm stats theo `call_status`, thêm `sip_480_count`; ASR/NER thống nhất ở `01`, `M05`, `M13`, `M14`; `M12` bỏ giá trị `ANSWERED/NO ANSWER` khỏi `DisconnectionStatus`. Giải quyết luôn phần trạng thái của S-02/D-03.
- **Docs**:
  - `01:815-817` busy = 486, no_answer = 487, failed = "500, 503, 408…".
  - `01:860-865` chỉ có `sip_200/486/487/503/408/other`.
  - NER `01:828` = (answered + busy + no_answer)/total.
- **Dữ liệu**: 480 TemporarilyUnavailable chiếm 333 dòng (6,2 %), cùng 603 và 404, đều rơi vào `sip_other_count`. 487 chủ yếu là phía gọi tự hủy, không hẳn "không trả lời".
- **Docs tự mâu thuẫn**: `M05:41` định nghĩa ASR theo "SIP 200 OK", `01:814` lại theo "Answered IS NOT NULL". Trên dump hai định nghĩa trùng nhau (3.347 dòng), nhưng nên chốt một.
- **Hướng sửa**: thêm bảng ánh xạ `DisconnectionCode → call_status` vào `01` (gồm 480, 603, 404) và thêm `sip_480_count`.

#### S-06 · Minor · `ReleasedBy` chỉ có `caller`/`called` chữ thường
- **Dữ liệu**: caller 3.235, called 2.134, không có giá trị kiểu SYSTEM.
- **Docs**: `01:866-868` "ReleasedBy = CALLER / CALLED / SYSTEM". `released_by_system_count` sẽ luôn = 0.

#### S-07 · Major · Có số ẩn danh và số không phải 5 chữ số, trái giả định "100 % nội bộ 5 số"
- **Dữ liệu**:
  - `CallerId='Anonymous'`: 241 dòng.
  - `CalledId` không phải 5 chữ số: 214 dòng, độ dài 1–11 chữ số (10 số: 49, 11 số: 12, 4 số: 36…).
  - Chữ số đầu của số 5 chữ số: **9xxxx 2.453 / 5xxxx 2.261 / 4xxxx 407**.
- **Docs**: `01:644` "100% cuộc gọi … máy cố định 5 số". `01:652-653` `caller_number`/`called_number` mô tả "5 số".
- **Tác động**: phân loại `call_type` và regex nội bộ (D-08) cần xử lý số ngoài mạng/ẩn danh; khối 9xxxx là lưu lượng lớn nhất.

#### S-08 · Major · File ghi âm là `.wav`, đường dẫn Windows tuyệt đối, chỉ có kênh Mix; PCAP đang được ghi
- **Dữ liệu**:
  - `Recorded_Mix_FileName` có ở 5.369/5.369 dòng, 100 % đuôi `.wav`, dạng `D:\StarTrinity\recordings\…`.
  - `Recorded_RX/TX_FileName` NULL 100 %.
  - `Sip_And_Rtp_Pcap_FileName` có ở 5.255 dòng.
- **Docs**:
  - "MP3" ở `01:445`, `02_api_contracts.md:139,187`, `M02:108,213,403`, `M12:33,73,128,361`.
  - `M12:58` "Đường dẫn tương đối".
  - `01:96-97` COMMENT PCAP "chưa triển khai", trong khi dữ liệu đã có.
- **Hướng sửa**: cấu hình ánh xạ đường dẫn PABX → File Server (chưa có nơi lưu trong `system_settings`); thống nhất định dạng `.wav`.

#### S-09 · Major · 22 cột luôn NULL khiến các KPI dựa trên chúng luôn = 0
- **Dữ liệu**: NULL 100 % ở:
  - `RTCP_RTT_*`, `RTCP_*_Jitter_*`, `RTCP_*_LostPackets`
  - `RTP_Rx_Packets*`
  - `Test_ID`, `from_no`, `to_no`, `duration`, `time_end`, `created_at`, `updated_at`
- **Docs**:
  - `01:845-850,928-933`: `avg_rtcp_rtt_ms`, `max_rtcp_rtt_ms`, `total/discarded_*_packets` là `NOT NULL DEFAULT 0`, nên "không có dữ liệu" bị hiển thị thành "0 ms / 0 gói".
  - `01:160-161` đánh index trên `from_no`/`to_no` dù hai cột luôn rỗng.

#### S-10 · Minor · Kiểu jitter không đối xứng giữa Caller và Called
- `01:106-107` `RTP_Caller_*Rfc3550Jitter bigint` vs `01:122-123` `RTP_Called_* double`.
- Dữ liệu: caller = 4 (số nguyên), called = 6.427407.
- `avg_jitter_ms int` (`01:843`) làm mất độ chính xác. Đây là kiểu do PABX đặt; cần ghi chú khi tổng hợp.

#### S-11 · Minor · Số cột ghi "85" nhưng DDL có 87 (`cdr`) / 90 (`cdr_enriched`)
- "85 cột/trường" xuất hiện ở `00:140-141,246`, `01:62`, `M02:24,33,106`, `M10:74`, `M12:11,45`.
- Dump và DDL `01:66-152` đều có 87 cột.

---

## 3. Nhóm D – Mâu thuẫn trong và giữa các tài liệu `docs/`

#### D-01 · Critical · Chạy `01` từ trên xuống bị lỗi FK: `cdr_enriched` tham chiếu `user_groups` chưa tồn tại
> ✅ **Đã sửa 2026-10-23**: bỏ 2 FK inline khỏi `cdr_enriched`, bổ sung `ALTER TABLE cdr_enriched ADD CONSTRAINT fk_cdre_caller_group / fk_cdre_called_group` ngay sau `CREATE TABLE user_groups` (§5).
- `01:294-295` `REFERENCES user_groups` nằm ở §2.1, trong khi `CREATE TABLE user_groups` ở `01:406` (§5).
- `call_duration_records` (§9) thì đặt đúng thứ tự.
- **Hướng sửa**: sắp lại thứ tự `organizations → phone_prefix_groups → user_groups → users → … → cdr_enriched`, hoặc dồn FK xuống cuối thành `ALTER TABLE`.

#### D-02 · Critical · Module 02 vẫn khai báo FK vòng `fk_ug_rep_user` ngay trong `CREATE TABLE user_groups`
> ✅ **Đã sửa 2026-10-23**: bỏ FK inline trong `M02` §2.2, thêm `ALTER TABLE user_groups ADD CONSTRAINT fk_ug_rep_user` sau `CREATE TABLE users` (§2.3), giống `01`.
- `M02:190` `CONSTRAINT fk_ug_rep_user … REFERENCES users`, trong khi bảng `users` (`M02:202-223`) lại tham chiếu `user_groups`.
- `01:458-460` đã sửa đúng bằng `ALTER TABLE`.
- **Tác động**: chạy DDL module 02 báo lỗi errno 150.

#### D-03 · Critical · `cdr_enriched` thiếu toàn bộ cột dẫn xuất mà các module nghiệp vụ phụ thuộc
> ✅ **Đã chốt Q1 (2026-10-23)**: thêm `answered_duration_sec`, `call_type` (cùng `leg_role`, `call_group_key`, `is_primary_leg`, `call_status` từ Q2/Q3). Hướng gọi tính lúc truy vấn. Bỏ bảng `call_duration_records` (giải quyết luôn D-18 về lọc theo thời điểm cuộc gọi, và giảm một FK cản trở partition ở D-16). S-01 đã sửa: COMMENT ms ở `01`, `M12`, `M13`, `M14`, ví dụ `02_api`. Còn MOS (Q4).
- §2/§2.1 (`01:62,185-190`) chỉ thêm `caller_group_id`, `called_group_id`, `enriched_at`.
- Các module lại cần: hướng gọi chuẩn hóa (M12 lọc Inbound/Outbound/Internal), trạng thái chuẩn hóa (M12, M14, stats), thời lượng giây (S-01), MOS thập phân (S-03), leg chính (S-04), `call_type` (M14).
- **Hướng sửa**: bổ sung `call_direction`, `call_status`, `answered_duration_sec`, `call_type`, `is_primary_leg`, `call_group_key`, `mos_*_x100`, kèm index.

#### D-04 · Critical · Dải phân loại MOS khác nhau ở 4 nơi
> ✅ **Đã chốt Q4 (2026-10-23)**: MOS thập phân từ `G107R` theo E-model (`mos_caller_x100`, `mos_called_x100`, `mos_x100` trên `cdr_enriched`); một bộ 4 dải ở `01` §2.1, áp dụng ở `M13`, `M15`, `03_ui_design`; stats thêm `qos_sample_count` và quy tắc roll-up (`01` §15), `M05` gia quyền theo cột này. Giải quyết luôn S-03, D-05; phần UI (T-07, T-08) chuyển sang danh sách sửa template.
| Nguồn | Dải |
|---|---|
| `01:835-838` | 4 dải: ≥4.0 / 3.5–4.0 / 3.0–3.5 / <3.0 |
| `M13:27`, `M15:14,194` | 3 dải: ≥4.0 / 3.0–3.9 / <3.0 |
| `03_ui_design.md:51,53` | "QoS Fair (3.6 - 3.9)", "QoS Poor (< 3.6)" |
| Templates (T-08) | thêm nhãn "Khá", "Xuất sắc" với ngưỡng khác |
- **Hướng sửa**: chỉ giữ một bảng dải trong `01`, các tài liệu khác tham chiếu tới đó.

#### D-05 · Critical · MOS trung bình được gia quyền theo `total_calls`; stats không lưu số mẫu QoS
- `M05:83,101` `SUM(avg_mos * total_calls) / NULLIF(SUM(total_calls),0) / 100`. Nhưng cuộc gọi lỗi/hủy có MOS NULL (~1.200 dòng dump), nên chúng không được tính vào trung bình nhưng vẫn nằm trong trọng số.
- `stats_*` không có `qos_sample_count`; mọi cột QoS đều `NOT NULL DEFAULT 0`.
- `M05:42` lại định nghĩa KPI là `AVG((RTP_Caller_G107MOS + RTP_Called_G107MOS)/2)` tính trực tiếp trên CDR, vi phạm Zero CDR Scan.
- **Tác động**: cuộn giờ → ngày → kỳ cho ra số sai.
- **Hướng sửa**: thêm `qos_sample_count` (hoặc `sum_mos_x100`) và gia quyền theo cột này.

#### D-06 · Major · Kích thước và biên kho số không thống nhất
> ✅ **Đã chốt Q5 (2026-10-23)**: kho 90.000 số `10000`–`99999` ở `01`, `M11`, `M02` ERD, `02_api`; regex mặc định `^[1-9]\d{4}$` (`M07`); định nghĩa "số ngoài kho" và ràng buộc dải số trong một `prefix` (`01` §8, `M11`); bỏ câu "100 % nội bộ 5 số" ở `00`, `01`, `02_api`, `M14`. Giải quyết luôn D-08, S-07, T-03, T-17 (phía docs).
| Nguồn | Nội dung |
|---|---|
| `01:524,553`, `M11:15-17,383`, `02_api:168` | 99.999 số, `00001`–`99999` |
| `M05:21-22,209-210,248` | `10000 ➔ 99999`, "90.000 số" |
| `M07:33,60` regex `^[1-8]\d{4}$` | 80.000 số |
| Catalog `:41` | `0xxxx` là PTT, liên tỉnh, di động, quốc tế (không phải máy lẻ EVN) |
| Catalog `:640` | "hỗ trợ số máy lẻ 4 chữ số" |
- **Cần chốt**: không gian số hợp lệ, số dòng seed `phone_numbers`, và ý nghĩa của `number_length`.

#### D-07 · Major · Phạm vi dữ liệu theo tổ chức, trái nguyên tắc "100 % `user_groups`"
- **Nguyên tắc**: `01:11-12`.
- **Trái nguyên tắc**:
  - `00:21` "Multi-tenancy by Organization".
  - `02_api:145` "Scoped theo tổ chức nếu là Group Admin".
  - `M01:26` cây tổ chức dùng để "Filter CDR, Reports".
  - `M15:138` `item.orgName`; `M15:169` dropdown `#organization` liệt kê đầu số `96xxx`; `M15:70` `"groupId": "51"` (đây là đầu số, không phải `user_groups.id`).

#### D-08 · Critical · Regex nội bộ mặc định loại khối 9xxxx, trong khi đây là khối lưu lượng lớn nhất
- `M07:33,60` `'^[1-8]\\d{4}$'`, nhưng ví dụ `M07:86` và TC `M07:133` lại dùng `^[1-9]`.
- Catalog `:40` khối 9 = Tổng công ty (96xxx EVNNPT…). Dữ liệu thật có 2.453 dòng caller 9xxxx (S-07).
- Template `admin/system-settings.html:313` dùng giá trị `^[1-8]\d{4}$`.

#### D-09 · Major · Quyền nhóm được lưu hai nơi: vai trò (`user_roles`) và cờ trên `users`
> ✅ **Đã chốt Q6 (2026-10-23)**: cờ là nguồn sự thật, vai trò suy ra (`01` §7); bỏ `user_roles`, `admin_roles` (DDL còn 23 bảng); seed cố định 5 vai trò; cập nhật `M02`, `M03`, `M04`, `M10`, `02_api` (bỏ `roleIds`, bỏ API tạo/xóa vai trò, sửa TC-PERM-01 bỏ vai trò "Kỹ thuật viên" không tồn tại).
- `01:470` có role `GROUP_ADMIN, USER_RECORDING, REGULAR_USER`; `01:444-445` có cờ `is_group_admin`, `can_access_recording`.
- `M02:37` "is_group_admin = 1 hoặc vai trò GROUP_ADMIN". `M10:71-72` định nghĩa role theo cờ. Body tạo user ở `M03:145-146` chứa cả `isGroupAdmin` và `roleIds`.
- **Tác động**: bật/tắt cờ (`M02:403-418`) không cập nhật `user_roles`, nên hai nguồn lệch nhau.
- **Hướng sửa**: chọn một nguồn sự thật và ghi rõ quy tắc đồng bộ.

#### D-10 · Major · Tạo nhóm bắt buộc có admin, nhưng user không thể tồn tại ngoài nhóm; TC xóa nhóm mâu thuẫn tính bất biến
- `M02:335` `initialAdminUserId` "Bắt buộc"; `01:436` `user_group_id NOT NULL`; `M02:36` user không chuyển nhóm.
- `M02:555` (TC-UG-06) "Chuyển toàn bộ thành viên ra khỏi nhóm", trái quy tắc không chuyển nhóm.
- **Hướng sửa**: tạo nhóm và admin đầu tiên trong cùng một transaction; sửa TC-UG-06.

#### D-11 · Major · Hai nguồn sự thật cho quyền sở hữu số; số RESERVED/LOCKED bị bỏ sót hoặc mở khóa nhầm
- `00:156-157,178-179` mô tả tra cứu 2 cấp, rơi về `range_from..range_to`/prefix. `01:526` chỉ dùng `phone_numbers.range_id` (3NF).
- `M11:197` khi cấp phát chỉ cập nhật số `AND status = 'FREE'`, nên số RESERVED/LOCKED trong dải vẫn có `range_id NULL`.
- `M11:206` khi thu hồi lại reset **mọi** số, kể cả LOCKED, về FREE.

#### D-12 · Major · Chính sách `ON DELETE` để lại trạng thái lệch hoặc xóa mất lịch sử
> ✅ **Đã chốt Q8 (2026-10-23)**: mục mới `01` §14 (lấp luôn §14 bị thiếu ở D-22); 7 FK đổi sang RESTRICT; quy tắc cấp phát/thu hồi theo trạng thái số ở `01` §8 và `M11`; `M01`, `M02` (§3.4, TC-UG-06), `02_api` (thêm `DELETE /users/:id`, `DELETE /admin/admins/:id` dạng xóa mềm). Giải quyết luôn D-10 (TC-UG-06), D-11, D-20 (phần quy tắc xóa tổ chức).
- `01:547` `phone_prefix_ranges … ON DELETE CASCADE` theo nhóm đầu số. Sau đó `01:565` `phone_numbers.range_id SET NULL` nhưng `status` vẫn là `ALLOCATED`.
- `01:874,957` `stats_hourly/daily … ON DELETE CASCADE`, trong khi `cdr_enriched` và `call_duration_records` dùng `SET NULL` (`01:294,663`). Xóa nhóm sẽ mất toàn bộ lịch sử thống kê, còn CDR thì giữ lại.
- **Hướng sửa**: xóa mềm (`status = INACTIVE`) hoặc dùng `RESTRICT`; thống nhất chính sách.

#### D-13 · Major · Bảng lịch sử không có FK; ERD vẽ quan hệ không tồn tại và bỏ sót FK có thật
- `prefix_allocation_history.prefix_group_id/user_group_id` (`01:594-595,608-611`) và mọi cột `*_id` của `phone_number_range_history` (`01:616-635`) chỉ có index, không có FK.
- ERD `01:23-24` vẽ `USER_GROUPS→PREFIX_ALLOCATION_HISTORY` và `PHONE_NUMBERS→PHONE_NUMBER_RANGE_HISTORY` (thực tế nối bằng chuỗi `phone_number`).
- ERD lại thiếu FK có thật: `ADMINS→PAH/PNRH` (`01:610,635`), `user_groups.representative_user_id→users` (`01:460`). Thiếu luôn các bảng `cdr_enrichment_state`, `qos_threshold_configs`, `system_settings`.
- `01:51-55` vẽ USER_SETTINGS/AUDIT_LOGS như quan hệ FK, nhưng thực chất là khóa polymorphic (type + id), không có FK.
- **Hướng sửa**: ghi rõ "lịch sử là snapshot, cố ý không có FK" và vẽ nét đứt trên ERD.

#### D-14 · Major · Chiều lưu lượng không xác định khi một phía không thuộc nhóm nào, và ở phạm vi toàn hệ thống
> ✅ **Đã chốt Q9 (2026-10-23)**: bảng quy chiếu lưu lượng ở `01` §15; thêm `calls_inter_group`, `calls_unassigned`, `inter_duration_sec`, `unassigned_duration_sec`; enum `INTERNAL_EVN` → `UNASSIGNED`; quy tắc không cộng nhóm áp dụng ở `M05`, `M14` (`systemTotal`), `M15`, `02_api`.
- `01:792-795` `total_calls = outbound + inbound + intra_group`.
- `M02:205`, `M14:22-23` ánh xạ outbound/inbound vào `INTER_GROUP`, nhưng `M14:135` trả về `INTERNAL_EVN` khi một nhóm NULL. Khi đó cuộc gọi tính vào cột nào?
- Với `group_id IS NULL` (toàn hệ thống), khái niệm outbound/inbound không có nghĩa; cộng các nhóm lại sẽ đếm đôi cuộc gọi INTER_GROUP.

#### D-15 · Major · Nguyên tắc "Zero CDR Scan" bị chính tài liệu vi phạm
- **Nguyên tắc**: `01:784`, `02_api:192`.
- **Vi phạm**:
  - `02_api:196` `qos/debug-table` "(đọc từ cdr_enriched)".
  - `M12:16` thống kê QoS/thời lượng "độc quyền trên bảng cdr_enriched".
  - `M05:42` KPI MOS tính trên cột thô.
  - `M05:30,238-239` "5 cuộc gọi mới nhất".
- **Hướng sửa**: giới hạn nguyên tắc cho KPI/báo cáo tổng hợp, liệt kê rõ các truy vấn từng cuộc gọi được phép.

#### D-16 · Major · Partition xung đột với FK và cột nullable
> ✅ **Đã chốt Q11 (2026-10-23)**: `cdr_enriched` partition theo tháng, `Created NOT NULL`, PK (`id`,`Created`), bỏ FK `fk_cdre_*`; vòng đời trực tuyến/lưu trữ/xóa ở `01` §2.1, `M07`, `M12`, `02_api`; bảng `cdr` của PABX không bị đổi cấu trúc (bỏ gợi ý partition, index thành khuyến nghị, bỏ `AUTO_INCREMENT=5370`). DDL còn 24 bảng, thứ tự FK đúng.
- `01:172` đổi PK thành (`id`, `Created`) trong khi `Created DEFAULT NULL` (`01:67`).
- `00:394` khuyên "tận dụng Partitioning", nhưng mọi truy vấn chạy trên `cdr_enriched`. Bảng này có FK (`01:294-295`) và là bảng cha của `fk_duration_cdr` (`01:662`), mà InnoDB không cho bảng partition có FK.

#### D-17 · Major · Thiếu bảng/cột cho token, phiên đăng nhập, chính sách mật khẩu
> ✅ **Đã chốt Q10 (2026-10-23)**: bảng `auth_sessions` + chính sách xác thực ở `01` §6.1; 4 cột bảo mật trên `admins`/`users`; 6 setting `security_*` (`M07`); luồng đăng nhập ở `M03`, `M04` (bỏ Access Token 8 tiếng, Refresh Token ra khỏi body); `M09` và `02_api` (API phiên, refresh/logout/đổi/đặt lại mật khẩu). DDL còn 24 bảng, thứ tự FK đúng.
- **Docs yêu cầu**:
  - `02_api:94-95,109-110` refresh/logout "hủy bỏ Token".
  - `M04:66` refresh token 7 ngày.
  - `M09:14` "Active Sessions … thu hồi token từ xa".
  - `M09:13` đổi mật khẩu 90 ngày.
  - `M03:249` khóa tài khoản sau 5 lần sai.
- **`01` không có**: `refresh_tokens`/`auth_sessions`, `password_changed_at`, `failed_login_count`, `locked_until`.

#### D-18 · Major · UI cần dữ liệu mà không có cột/bảng nào cung cấp
- `call_duration_records` chỉ có `created_at` (thời điểm insert, `01:656`), nhưng `/traffic/records` lọc theo `fromDate/toDate` của cuộc gọi (`M14:97`).
- `M05:29,232` "Đang gán nhân sự (342 số active)", `M05:210` "Tạm ngưng": trái `01:525` (không gán số cho cá nhân) và enum `01:555`.
- `M05:24,218` "Trạng thái Trunk SIP": không có nguồn dữ liệu.
- Biểu đồ "theo Thuê bao/Đầu số": không có bảng stats tương ứng, buộc phải quét CDR.

#### D-19 · Minor · `permissions.scope`/`category` không biểu diễn được catalog
- `01:486` `enum('ADMIN','USER','BOTH')`, nhưng `M10:43` ghi "ADMIN (ROOT ONLY)" và `M10:51-52` ghi "USER (GROUP_ADMIN ONLY)".
- `01:485` category có `QOS`, trong khi catalog xếp `qos:view` vào DATA (`M10:40`).

#### D-20 · Minor · `organizations.level` và quy tắc xóa không khớp
- `M01:82` "TC-71" (Tổng công ty) mang `level: 0`, trong khi `01:367` quy định "0: Tập đoàn".
- `DEFAULT 1` mâu thuẫn quy tắc `level = parent.level + 1` (`M01:122`).
- `M01:130` chặn xóa khi còn `user_groups` tham chiếu, nhưng DDL `01:422` là `ON DELETE SET NULL`.

#### D-21 · Minor · Danh mục `audit_logs.action/resource_name` không chuẩn hóa
- `01:764-765` vs `M04:68` `ADMIN_LOGIN`, `M02:434` `MEMBER_RECORDING_ACCESS_TOGGLED`. Không có resource USER_GROUP/PREFIX/ADMIN.
- `M12:167` ghi `user_group_id` nhưng bảng không có cột này (phải đưa vào `action_details`).

#### D-22 · Minor · Các lệch nhỏ khác
- §13 (`01:754`) nhảy thẳng sang §15 (`01:780`), không có §14.
- DDL `users` ở `M03:60-64` thiếu `idx_users_group_admin` (`01:454`).
- `01:154` chép `AUTO_INCREMENT=5370` từ dump; `01:157-165` thêm 9 index vào bảng `cdr` do PABX sở hữu (cần PABX đồng ý).
- Ngưỡng QoS hard-code (`M06:15`, `02_api:250` MOS<2.5, loss >5 %; `01:842` >2 %; `M13:16,29` jitter 30/40 ms) bỏ qua `qos_threshold_configs` (`01:673-684`); bảng này lại không có seed và không có module nghiệp vụ.
- `notifications.is_global` (`01:699`) không có dòng recipient nên không theo dõi được trạng thái đã đọc (`M06:70`). Enum `type` (`01:694`) khác danh mục UI ở `03:482`.
- `M07:21` xếp API token vào "Reporting", nhưng `M07:42` lưu ở ADVANCED; `02_api:115` dùng `page_size`, còn `01:744` là `items_per_page`.
- `01:799` chu kỳ "10-15 phút" vs `00:122,198` "10 phút".
- `M10:112` `SYSTEM_ADMIN isSystem: false`; `M10:265` nhắc vai trò "Kỹ thuật viên" không tồn tại; `M12:113` mã nhóm `UG-KT-01`, trái quy ước `UMO-…` (`01:410`).
- Đường dẫn template lỗi thời: `M01:5,185` `templates/organization.html`, `M02:5` `templates/user-management-orgs.html`, `M03:5` (chưa theo cấu trúc `templates/admin|member/`).

---

## 4. Nhóm A – API & danh mục quyền

#### A-01 · Major · Mã quyền dùng trong API không có trong catalog module 10
> ✅ **Đã chốt Q7 (2026-10-23)**: catalog duy nhất 26 mã kèm seed SQL ở `M10`; `02_api` và `M13` đổi sang mã catalog; thêm `cdr:export` và `GET /api/v1/cdr/export` (`M12` §3.1.1); `01` cập nhật COMMENT `permissions.code`/`category`. Quét toàn `docs/` không còn mã quyền ngoài catalog (chỉ còn tên sự kiện WebSocket `notification:new`, `cdr:new_alert`). Giải quyết luôn D-19; A-02 chuyển sang danh sách sửa template.
- **Có trong `02_api_contracts.md` nhưng không có trong catalog `M10:38-56`**:
  - `org:view/create/edit/delete` (`:122-127`)
  - `user_group:view/create/edit/delete` (`:133-138`)
  - `role:view` (`:151`), `permission:view` (`:155`), `prefix:view` (`:162`), `qos:manage` (`:200`)
  - `qos:sip_trace` (`M13:40,44`)
- **Có trong catalog nhưng API không dùng**: `org:manage`, `admin:manage`, `audit:view`, `cdr:filter_advanced`.
- **Hướng sửa**: một catalog duy nhất, dùng làm seed cho bảng `permissions`.

#### A-02 · Major · `data-permissions.js` dùng 14 mã quyền ngoài catalog
`cdr:export`, `qos:sip_trace`, `org:view`, `prefix:audit_view`, `org_prefix:view`, `group:view/create/edit/delete`, `group_member:view`, `dashboard:view`, `notification:view`, `profile:edit_self`, `auth:change_password` (`admin/data-permissions.js:106…938`). `permissions.js` thì thiếu `admin:manage`, `group:toggle_recording`, `group:manage_admin`. `admin/login.js:100-101` dùng `roles: ['ADMIN']`, `permissions: ['*']`, không phải mã role trong `01:470`.

#### A-03 · Major · DTO thống kê dùng đầu số/tổ chức làm khóa
Xem D-07 và T-05: `M15:70` `"groupId": "51"`, `admin/reports.js:37` `orgId: '96', groupId: '96'`.

#### A-04 · Minor · Ví dụ API dùng sai đơn vị
`02_api:58` `"Answered_Duration": 135`, tức giây (S-01).

---

## 5. Nhóm T – Templates mâu thuẫn mô hình CSDL

#### T-01 · Critical · FK 1-1 đặt ngược chiều và thao tác "Hủy gán" phá ràng buộc `NOT NULL`
- `admin/prefix-management.js:45` `userGroupId: 'ug-evn-b'` nằm trên đối tượng *nhóm đầu số*; `:929` `group.userGroupId = null;`. `member/org-prefix.js:103` tra cứu theo cùng kiểu.
- **Docs**: `01:409` `user_groups.phone_prefix_group_id NOT NULL`, `01:420` UNIQUE.
- **Tác động**: "Hủy gán" sẽ để `user_groups` không còn nhóm đầu số, điều DB cấm.
- **Hướng sửa**: thay "Hủy gán" bằng "Chuyển sang nhóm đầu số khác"; giữ FK ở `user_groups`.

#### T-02 · Critical · Xóa nhóm đầu số không kiểm tra liên kết với nhóm người dùng
`admin/prefix-management.js:1504` `prefixGroups.filter(g => g.id !== currentTargetGroupId)`, không kiểm tra `user_groups` đang tham chiếu. Trong khi đó `01:423` là `ON DELETE RESTRICT`, nên thao tác này sẽ lỗi FK ở DB.

#### T-03 · Critical · Kho số 90.000 bắt đầu từ 10000
`admin/prefix-management.js:399` "(90,000 số: 10000 - 99999)", `:401` `const totalCapacity = 90000;`, `:1584` kho trống bắt đầu từ 10000. Trái `01:524` (99.999 số, từ 00001). Liên quan D-06.

#### T-04 · Major · Trạng thái nhóm đầu số dạng tiếng Việt 3 giá trị
`'Đang dùng' / 'Tạm ngưng' / 'Chưa dùng'` (`admin/prefix-management.js:44,230,250`; `.html:288-290`), so với `01:391` `enum('ACTIVE','INACTIVE')`. "Chưa dùng" thực chất là trạng thái suy ra (chưa có `user_groups` liên kết).

#### T-05 · Major · Báo cáo và stats khóa theo đầu số/tổ chức thay vì `user_groups.id`
`admin/reports.js:37` `orgId: '96', groupId: '96'`; `admin/reports.html:313-318` option `value="96"…"62"` nhưng nhãn là "Nhóm người dùng"; `member/reports.js:14-16` `organization: '51'`. Trái `01:806` `group_id (user_groups.id)`.

#### T-06 · Major · Hai bộ dữ liệu nhóm không liên quan nhau, cùng một dải số thuộc nhóm khác nhau tùy trang
- `admin/user_group.js:9-204`: id số 1–6, mã `UMO-IT-01`, `PG-IT-01` gồm 42xxx/46xxx.
- `admin/prefix-management.js:15-36`: id chuỗi `'ug-evnict'`, không có mã; 46000–46999 thuộc pg-2 (NOC).
- `member/group-admin.js:21-24`: UMO-IT-01 có 42000–42999 và 46000–46999.

#### T-07 · Major · MOS hiển thị theo 3 thang khác nhau
`admin/dashboard.js:101-102` "Điểm MOS (x10)" `[41, 42, …]`; `member/dashboard.js:112-113` `[4.15, 4.18, …]`; `qos-debug.js` dùng giá trị thô `4`. DB lưu ×100 (`01:831`).

#### T-08 · Major · Dải MOS trên template không khớp 4 dải trong stats
`qos-debug.html:338-341` (3 dải, FAIR 3.0–4.0); `reports.js:561` "Trung bình (3.0 - 3.9)"; `cdr-history.js:21,41,61` "4.22 (Tốt)", "3.80 (Khá)", "4.35 (Xuất sắc)". Liên quan D-04.

#### T-09 · Major · `action_type` của lịch sử dải số là chuỗi tiếng Việt và có giá trị ngoài enum
`admin/prefix-history.html:275-281` gồm "Cấp phát dải mới / Thu hồi về kho / Gán nhóm (1-1) / Hủy gán nhóm / Tạm ngưng / Kích hoạt lại / Xóa nhóm đầu số"; `prefix-management.js:359` có thêm "Khôi phục Danh mục gốc EVN". So với `01:596` enum 5 giá trị: tạm ngưng, kích hoạt, xóa và khôi phục không có mã tương ứng.

#### T-10 · Major · `decision_number` lấy từ 30 ký tự đầu của ghi chú
`admin/prefix-management.js:859,1070,1127` `decisionNumber: note ? note.slice(0, 30) : …`. Theo `01:601` đây là trường căn cứ pháp lý riêng.

#### T-11 · Major · Lịch sử lưu tên thay vì ID, có `orgName` và tác nhân "Auditor"
`admin/prefix-history.js:26-28,51` dùng `prefixGroupName`, `userGroupName`, `orgName`, `performedBy: '… (Auditor)'`, so với `01:594-602` (ID + `performed_by_admin_id`, không có cột tổ chức).

#### T-12 · Major · Mã nhóm đầu số và dải số thiếu cột `NOT NULL`
- Seed nhóm đầu số không có `code` (`prefix-management.js:40-49`), dù form `:707` bắt buộc nhập và `01:388` là `NOT NULL UNIQUE`.
- Đối tượng dải `{id, from, to, count, note}` (`:47`) và modal cấp phát (`.html:617-646`) không có `prefix`/`number_length` (`01:534-535` là `NOT NULL`). Kho trống như `52200–56999` (`:1590`) trải qua nhiều đầu số.

#### T-13 · Major · Không có UI cho trạng thái từng số và lịch sử từng số
Không có kết quả khi grep `ALLOCATED|RESERVED|LOCKED|display_name|ASSIGN_TO_RANGE` trên toàn `templates/`. Dòng số chỉ có `{number, rangeStr}` (`prefix-management.js:1529-1533`). Trong khi `01:555-556,620` định nghĩa trạng thái, `display_name` và lịch sử LOCK/UNLOCK.

#### T-14 · Major · Trạng thái user khác nhau giữa 2 portal, không portal nào đủ 3 giá trị
`admin/users.html:1198-1199` có ACTIVE/INACTIVE, nhưng INACTIVE lại mang nhãn "Khóa"; `member/group-admin.html:565-566` có ACTIVE/LOCKED. Enum `01:446` có 3 giá trị.

#### T-15 · Major · User có `extension` cá nhân
`member/group-admin.js:144` `extension: "42101"`, tương tự ở `member/group-members.js`. Trái `01:525` (số không gắn với cá nhân), và bảng `users` không có cột này.

#### T-16 · Major · Member portal không cố định một nhóm; có bộ chuyển nhóm phá cô lập dữ liệu
`member/dashboard.html:273` "51000 ➔ 51999 (EVNICT Đà Nẵng)"; `member/group-admin.js:352` `currentGroupId: 1` (42/46xxx) kèm switcher (`:373-383`); `member/org-prefix.js:11` `'ug-evnict'` kèm switcher qua 20 nhóm (`:84-95`). Trong khi đó dải 51700–51899 lại thuộc EVNCPC ở `admin/prefix-management.js:193`.

#### T-17 · Major · Regex nội bộ trong template loại chính các dải 9xxxx mà mock đang cấp
`admin/system-settings.html:313` `^[1-8]\d{4}$`, nhưng mock cấp các dải `90000–90499`, `93000…`, `99900…` (`prefix-management.js:192,203,273`). Liên quan D-08.

#### T-18 · Minor · Mock CDR: mã nhóm, dải và hướng gọi sai
- `cdr-history.js:11,33` dùng `UG-IT-01`, `{id: 2, "Khối Kinh doanh", UG-KD-02}`, trong khi `user_group.js:43` id 2 là `UMO-IT-02`.
- `:10` caller 45678 nằm ngoài dải của IT-01.
- `:14` `"Inbound"` cho cuộc gọi mà cả hai phía cùng nhóm.
- `:70` có số di động 10 chữ số.

#### T-19 · Minor · Giá trị trạng thái CDR khác nhau giữa 2 trang
`qos-debug.html:317` `value="CANCEL"` vs `cdr-history.html:312` `value="NO ANSWER"`. `qos-debug.js` dùng giá trị thô, `cdr-history.js` dùng giá trị chuẩn hóa, mà giá trị chuẩn hóa lại không có cột lưu (D-03).

#### T-20 · Minor · Form tổ chức: `code` không bắt buộc, thiếu `level`/`status`/người đại diện
`admin/organization.html:466-495` vs `01:361-369`.

#### T-21 · Minor · ID tổ chức lệch giữa trang tổ chức và trang nhóm; cây không có gốc "Tập đoàn"
`admin/user_group.html:432-433` (id 3 = Khối Kinh doanh) vs `organization.js:103-105` (id 3 = Phòng Phát triển Phần mềm). Gốc cây là "Tổng công ty 71" (`organization.js:101`), trong khi `hierarchyPath` bắt đầu bằng "Tập đoàn…" (`user_group.js:17`).

#### T-22 · Minor · Mock nhóm thiếu `allowRecordingAccess`; admin giả id 99
`user_group.js:157-158,187-188` thiếu cờ, trong khi `01:414` là `NOT NULL`. Nhóm 6 có `userCount: 0` nhưng vẫn có người đại diện (`:176-185`). Nhóm mới được gán admin giả id 99 (`:798-814`). Tên/mã nhóm không khớp giữa `users.js:23` và `users.html:326`.

#### T-23 · Minor · Form tạo user không có mật khẩu; form admin thiếu cờ ghi âm
`admin/users.html:1137-1199` và form ở `member/group-admin.html` không có trường mật khẩu (`01:439` `password_hash NOT NULL`). Form admin thiếu `can_access_recording`.

#### T-24 · Minor · Modal vai trò không sinh được dòng `roles` hợp lệ
`admin/roles.html:353-359` không có ô nhập `code`; option "Quản trị/Người dùng" không có `value`. So với `01:470,473` (`code NOT NULL UNIQUE`, scope ADMIN/USER).

#### T-25 · Minor · Settings, profile, thông báo, dashboard không khớp cột
- `user-settings.html:324` theme chỉ là checkbox light/dark (`01:740` có cả `system`); `:353` mặc định 20 dòng/trang (`01:744` là 10). 2FA, phiên đăng nhập, push không có cột tương ứng.
- Input `system-settings.html` không gắn `setting_key`; `:371` có `value="never"` cho trường số. Không có màn hình nào cho `qos_threshold_configs`.
- `profile.html:331,360` có `department`, `bio` nhưng không có cột; `job_title` lại không hiển thị.
- `admin/main.js:14` có thông báo "vừa đăng ký tài khoản mới" dù hệ thống không cho tự đăng ký; mock thông báo gộp phẳng, không tách theo người nhận (`notification_recipients`).
- `member/dashboard.html:404-421` đọc từng dòng CDR trên dashboard, trái nguyên tắc Zero CDR Scan.
- `member/group-admin.js:36` có `recordingAccessEnabled`, trùng `allowRecordingAccess` và không có cột.

---

## 6. Quyết định thiết kế cần chốt (đề xuất thứ tự ưu tiên)

| # | Quyết định | Liên quan | Đề xuất |
|---|---|---|---|
| Q1 | Bộ cột dẫn xuất của `cdr_enriched` | S-01–S-04, D-03 | Thêm `call_direction`, `call_status`, `answered_duration_sec`, `call_type`, `is_primary_leg`, `call_group_key`, `mos_*_x100` |
| Q2 | Quy tắc gộp leg / chọn leg chính | S-04 | Khóa (`CallerId`, `CalledId`, `Created`) ± 2 s; leg chính theo IP PABX lõi |
| Q3 | Ánh xạ `DisconnectionCode → call_status` + công thức ASR/NER | S-02, S-05 | Bảng ánh xạ trong `01` §15; thêm 480 |
| Q4 | Thang MOS và dải phân loại duy nhất | S-03, D-04, D-05, T-07, T-08 | Tính từ G107R, lưu ×100, 4 dải theo `01`, thêm `qos_sample_count` |
| Q5 | Không gian số hợp lệ (00001–99999 hay 10000–99999), có hay không số 4 chữ số / 0xxxx; regex mặc định | D-06, D-08, S-07, T-03, T-17 | Lấy theo catalog; regex `^[1-9]\d{4}$` |
| Q6 | Nguồn sự thật cho quyền nhóm: cờ hay vai trò | D-09 | Cờ là nguồn chính, vai trò suy ra |
| Q7 | Catalog mã quyền duy nhất | A-01, A-02, D-19 | Hợp nhất 3 nguồn thành seed `permissions` |
| Q8 | Chính sách xóa (mềm/RESTRICT) cho nhóm, dải số, stats | D-12, T-02 | Xóa mềm |
| Q9 | Định nghĩa chiều lưu lượng khi một phía NULL và ở phạm vi hệ thống | D-14 | Thêm `calls_external` hoặc quy tắc rõ ràng |
| Q10 | Bảng phiên/token và cột an toàn mật khẩu | D-17 | `auth_sessions` + 3 cột trên `admins`/`users` |
| Q11 | Thứ tự DDL và chiến lược partition `cdr_enriched` | D-01, D-16 | FK dồn cuối file; `Created NOT NULL` |

---

## 7. Đối chiếu báo cáo cũ

### 7.1. `DB_SCHEMA_CONSISTENCY_REPORT.md` (2026-10-22, 61 phát hiện)

| Trạng thái | Mã cũ | Ghi chú |
|---|---|---|
| **Đã sửa (một phần)** | D-02 | `01:458-460` đã chuyển sang ALTER; **module 02 vẫn chưa sửa** (D-02 mới) |
| Còn tồn tại | D-01, D-03, D-06, D-07, D-08, D-09, D-10, D-11, D-12, D-13, D-14, D-15, D-17, D-18, D-19, D-20, D-21, D-22, D-23, D-24, D-25, D-26, D-27, D-28, D-29 | Ánh xạ sang D-22, D-22, D-03, D-06, D-18, D-05, D-04, A-01, D-19, D-22, D-21, D-10, S-06, D-22, D-20, D-12, D-11, D-22, D-14, D-10, D-13, D-22, D-22, S-11, D-16 |
| Còn tồn tại | S-01 … S-12 | Dữ liệu dump không đổi; docs chưa cập nhật (S-01–S-11 mới, S-10 cũ → D-22) |
| Còn tồn tại | T-01 (`extension`), T-02, T-03, T-04, T-05, T-06, T-07, T-08, T-09 | → T-15, T-01/T-04/T-12, T-03, A-02, T-19, T-18, T-05, T-25, T-09/T-11. Riêng phần `title` của T-01 cũ: `admin/users.js` không còn `title:`; `member/group-admin.js` còn 14 chỗ (chưa kiểm từng chỗ) |
| Còn tồn tại | M-01 … M-12 | → D-17, D-17, D-03, D-22, (M-05 chưa kiểm lại), D-18, (M-07: `01` vẫn không có bảng `qos_alerts`), D-21, S-04, D-16, D-13, S-08 |
| Chưa kiểm lại | D-04, D-05, D-16 (lệch COMMENT trong ERD/DDL module 01/02/04/08/11) | Agent chỉ ghi nhận: DDL module 04/11/14 khớp `01`; module 08 chỉ khác thứ tự cột và COMMENT |

### 7.2. `db_audit_1.md` / `db_audit_2.md` (2026-10-23)

| Mục db_audit_2 | Trạng thái hiện tại |
|---|---|
| 01 FTP/COLLECTION/test-ftp | **Đã sửa**: grep không còn kết quả trong `docs/` |
| 02 "Billing" / đổi tên module 14 | **Đã sửa**: file là `14_core_business_call_traffic.md`; chỉ còn câu phủ định "không tính cước" |
| 03 `phone_extensions`, `range_start` | **Đã sửa**: grep không còn kết quả |
| 04 DTO traffic theo tổ chức | Module 14 đã theo nhóm; **M15/templates vẫn theo tổ chức/đầu số** (D-07, T-05) |
| 05 `Direction`/`DisconnectionStatus` | **Một phần**: `01:62` đã ghi rõ giá trị raw, nhưng chưa có cột chuẩn hóa (D-03) |
| 06 FK đảo trên template | Còn tồn tại (T-01) |
| 07 Thiếu `code` trên modal | Form có `code` (`:707`), nhưng seed vẫn thiếu (T-12) |
| 08 `idx_users_group_admin` thiếu trong `01` | **Đã sửa** ở `01:454`; còn thiếu ở `M03` (D-22) |
| 09 FK vòng | Một phần (xem D-02 cũ) |
| 10 Vai trò lỗi thời trong `roles.html` | **Đã sửa**: `roles.html:316` đã có `USER_RECORDING`; modal vẫn thiếu `code` (T-24) |
| 11 Thuộc tính UI trong `permissions.js` | Không phải lỗi CSDL; còn vấn đề mã quyền (A-02) |
| 12 Mã quyền không khớp | Còn tồn tại (A-01) |
| 13 Đường dẫn template cũ | Còn tồn tại (D-22) |
| 14 `templates/admin/settings.js` thừa | **Đã sửa**: file không còn (chỉ còn `settings.css`) |
| 15 Thông báo gộp phẳng | Còn tồn tại (T-25) |
| 16 `metadata { organization_id }` | **Đã sửa**: `01:698` đã là `user_group_id` |

**Phát hiện mới so với các báo cáo cũ**: D-01 (thứ tự DDL trong `01`), D-05 (gia quyền MOS / thiếu số mẫu), D-11 (RESERVED/LOCKED khi cấp phát/thu hồi), D-12 (CASCADE để `phone_numbers` ở trạng thái ALLOCATED), D-14 (chiều lưu lượng khi một phía NULL), T-02, T-10, T-13, T-14, T-16, T-17, T-20 … T-24.

---

## Phụ lục A – Các phần không có vấn đề CSDL
- `docs/intent/split-templates-dual-portal.md`: chỉ nói về tách UI.
- DDL trong `M04` (admins), `M11`, `M14` (`call_duration_records`) khớp `01` (chỉ khác lời COMMENT). `M08` (`user_settings`) chỉ khác thứ tự cột và thiếu COMMENT.
- `qos-debug.js` và `notifications.js` giống hệt nhau giữa admin và member.

## Phụ lục B – Tái lập số liệu dữ liệu thật
Script đã dùng (chỉ đọc), lưu tại `C:\Users\baobd\AppData\Local\Temp\claude\D--EVN-evn-cdr-as\6f47cb26-ad71-41be-8ef0-e2cf8217bd97\scratchpad\cdr_stats.js`:

```bash
node cdr_stats.js docs/voip_cdr_20250817.sql
```

Kết quả chính:
- 5.369 dòng, 87 cột; `Created` từ 2025-06-11 đến 2025-08-16.
- `Direction`: remote 5.369.
- Mã ngắt: 200: 3.347 · 487: 1.446 · 480: 333 · 408: 117 · 503: 64 · 486: 46 · 603: 9 · 404: 7.
- `ReleasedBy`: caller 3.235 · called 2.134.
- MOS caller: 4 → 4.153 · 2 → 7 · NULL → 1.209; G107R trong khoảng 42–93.
- `Answered_Duration` khớp đơn vị ms ở 3.347/3.347 dòng, khớp giây ở 0 dòng.
- Gom (caller, called, Created): 3.698 nhóm, trong đó 1.671 nhóm có 2 dòng (3.342 dòng).
- `CallerId='Anonymous'`: 241; `CalledId` không phải 5 chữ số: 214.
- `Recorded_Mix_FileName` `.wav`: 5.369; RX/TX: 0; `Sip_And_Rtp_Pcap_FileName`: 5.255.
- Luôn NULL: `RTCP_*`, `RTP_Rx_*`, `Test_ID`, `from_no`, `to_no`, `duration`, `time_end`, `created_at`, `updated_at`.
