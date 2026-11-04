# BÁO CÁO RÀ SOÁT THIẾT KẾ CSDL – EVN CDR AS (lần 12)

> **Ngày lập**: 2026-11-04 · **Nhánh**: `docs/db-design-readiness` (sau HEAD `b30e46c`)
> **Phạm vi**: `docs/01_database_schema.md` (`01`), `docs/02_api_contracts.md` (`02`), `docs/modules/05, 06, 08, 09, 13, 14, 15` (ưu tiên các module ít được rà ở lần 6–11).
> **Trọng tâm**: nhất quán giữa quy tắc ở `01`/`02` và đặc tả API ở module, chỉ dựa trên thông tin đã có. Điểm tài liệu chưa nói hoặc nói hai cách đã được chủ dự án quyết định qua phỏng vấn; mọi thay đổi dưới đây **đã sửa** trong cùng commit.

## Phỏng vấn

| Câu hỏi | Quyết định |
|---|---|
| "Báo cáo so sánh nhiều nhóm" ở M15 trong khi `/reports/*` chỉ nhận một `groupId` | **Bỏ khỏi M15**: mỗi báo cáo một phạm vi; so sánh nhóm xem ở `/admin/dashboard/groups`, `/admin/traffic/summary` |
| Route User nhận `groupId` / tham số riêng của Admin | **Trả `400`** (DTO bản User không có các tham số này) |
| Người nhận thông báo do Admin soạn | **Chỉ tài khoản `ACTIVE`**, người dùng chỉ thuộc nhóm `ACTIVE` |
| `target = GROUP:{id}` với nhóm `INACTIVE` | **`409 GROUP_INACTIVE`** |
| Thẻ "ASR đơn vị so với mức TB toàn EVN" (User Portal đọc dòng toàn hệ thống) | **Bỏ so sánh** |
| Kỳ so sánh của `trend` ở dashboard | **Kỳ liền trước cùng số ngày**, `null` khi kỳ trước không có dữ liệu |
| `/admin/traffic/summary` không `groupId` trả mọi nhóm, không phân trang | **Phân trang** như `/admin/dashboard/groups` |
| `rows` của báo cáo khi `period = today` | **Thêm `hour`** (0–23) |

## Major

| Mã | Vấn đề | Kịch bản lỗi | Đã sửa |
|---|---|---|---|
| R12-01 | M15 §1.1 và TC-REP-03 mô tả báo cáo/Excel "so sánh nhiều nhóm", nhưng `GET /reports/summary` và `POST /reports/export/*` chỉ nhận một `groupId` | Người làm frontend dựng bộ chọn nhiều nhóm và quy tắc dòng "Toàn hệ thống" trong Excel mà backend không có API phục vụ; tester viết TC-REP-03 không thực hiện được | Theo quyết định: mỗi báo cáo một phạm vi; sửa M15 §1.1, mẫu `ExcelExporterService` (bỏ cột nhóm), TC-REP-03; `01` §15 ghi rõ danh sách so sánh nhóm là `/admin/dashboard/groups`, `/admin/traffic/summary` |
| R12-02 | M05 §1.2 B: thẻ ASR đơn vị "so với mức TB toàn EVN" buộc bản User đọc dòng `group_id IS NULL`, trái `02` §1.1 (bản User luôn cô lập nhóm) và M05 §2.2 (mỗi truy vấn một phạm vi) | Một bản cài đặt cho User Portal thấy số liệu toàn hệ thống; bản khác chặn. Hai cách hiểu cho hai hành vi phân quyền khác nhau | Bỏ so sánh; công thức thêm `NULLIF` (M05 §1.2) |
| R12-03 | Thông báo do Admin soạn: `01` §10, `02`, M06 không nói người nhận gồm tài khoản nào, và `GROUP:{id}` của nhóm `INACTIVE` | Thông báo `ALL_USERS` tạo dòng `notification_recipients` cho cả tài khoản `INACTIVE` (không bao giờ đăng nhập lại) và gửi email `CRITICAL` tới họ; `GROUP:{id}` của nhóm đã ngừng tạo thông báo với 0 người nhận mà Admin tưởng đã gửi | Chỉ tài khoản `ACTIVE` (nhóm `ACTIVE`), nhóm `INACTIVE` trả `409 GROUP_INACTIVE`, dropdown chỉ liệt kê nhóm `ACTIVE` (`01` §10, `02` §3.12, M06 §1.2, §5.2) |

## Minor

| Mã | Vấn đề | Đã sửa |
|---|---|---|
| R12-04 | Route User nhận `groupId`: M15 TC-REP-02 "bỏ qua hoặc `403`", M05 "tự ép", các module khác không nói | Quy tắc chung `02` §1.1: gửi tham số riêng của Admin lên route User trả `400`; sửa M05 §3.1, §4.1, M14 §3.1, M15 §2.1, TC-REP-02 |
| R12-05 | `trend`/`trendLabel` ở M05 §3.1 ghi "so với tháng trước", "so với tuần trước", "đạt chuẩn viễn thông EVN" mà không định nghĩa kỳ so sánh | Định nghĩa kỳ liền trước cùng số ngày cho từng `period`, cùng phạm vi, đọc `stats_*`; `null` khi kỳ trước không có dữ liệu (M05 §3.1) |
| R12-06 | M14 `/traffic/summary`: tên trường `totalDurationSeconds`, `averageDurationPerCallSec` khác quy ước `02` §2 (`total_duration_sec` → `totalDurationSec`) và M05/M15; ghi "đọc `stats_daily`" trong khi `period = today` đọc `stats_hourly` (`02` §1.1); bản Admin trả mọi nhóm không phân trang | Đổi thành `totalDurationSec`, `avgDurationSec` (công thức roll-up ACD `01` §15); nguồn theo `period`; bản Admin không `groupId` có `page`, `limit` ≤ 100, `sort` = `totalCalls`\|`totalDurationSec`, `order` (`02` §3.9, M14 §2.1, §3.1, TC-TRAF-04) |
| R12-07 | `/traffic/records` (M14 §3.2) và `/qos/debug-table` (M13 §3.1) không ghi giới hạn cửa sổ trực tuyến (`01` §2.1); M13 thiếu giới hạn 31 ngày và `limit` ≤ 100 (`01` §15) | Ghi rõ: tối đa 31 ngày, `fromDate` cũ hơn cửa sổ trả `400` ở cả hai bản (dữ liệu lưu trữ chỉ qua `GET /admin/cdr?includeArchive=true`), `limit` ≤ 100 |
| R12-08 | M15: `period = today` trả `rows` theo giờ nhưng chỉ có `date`; mẫu `ExcelExporterService` dùng `item.answered`, `durationMinutes`, `asr`, `ner`, `mosAvg` không có trong response mục 2.1 | Thêm `hour` (0–23) khi `period = today`; mẫu code dùng đúng tên trường `rows` (`answeredCalls`, `totalDurationSec`, `asrPercentage`…) |
| R12-09 | M06 ví dụ `QOS_ALERT` khung 09:00–10:00 có `createdAt` 09:30, trái quy tắc đánh giá khung đã kết thúc ít nhất 60 phút (`01` §10); `GET /notifications` có `page`/`limit` nhưng response không có `pagination`; modal soạn thông báo thiếu `type` (`02` ghi `SYSTEM_MAINTENANCE`/`GENERAL`) | Sửa `createdAt` 11:00 kèm ghi chú; thêm `pagination` theo `02` §2.2; thêm `type` vào M06 §1.2, §5.2 |
| R12-10 | `02` §3.2 ghi preferences User chỉ có `theme`, `itemsPerPage`; M08 §3.5 có 5 trường khớp cột `user_settings` | Đồng bộ `02` theo M08 |

## Ngoài phạm vi CSDL (đã sửa theo yêu cầu bổ sung)

| Mã | Vấn đề | Đã sửa |
|---|---|---|
| R12-11 | M06 §4.2: tiêu đề email cố định "Sự cố chất lượng thoại" dùng cho mọi thông báo `CRITICAL` (kể cả `PABX_OFFLINE` và thông báo Admin soạn) | Tiêu đề và nội dung email lấy từ `notifications.title`/`content`/`created_at`; escape HTML nội dung (M06 §4.2) |
| R12-12 | `02` §4: payload `notification:new` chỉ có `{ id, title, content, severity, createdAt }`, nhưng M06 §5.3 chèn thẳng vào danh sách (cần `type`, `isRead`, `metadata`) | Payload cùng cấu trúc phần tử `GET /notifications`: `{ id, type, severity, title, content, isRead: false, createdAt, metadata }`, `timeAgo` tính ở frontend; poller đọc dòng `notifications` để dựng payload (`02` §4, M06 §4.1, §5.3) |

## Đã rà, không phát hiện lỗi

- Mã quyền dùng ở M05, M06, M13, M14, M15 đều có trong catalog M10 §2.1; mã `audit_logs` ở M04, M08, M09, M12, M13, M15 khớp danh mục `01` §13.
- `counts` của `GET /prefixes` (M11) khớp widget dải số M05; `pool/summary` khớp 4 trạng thái `phone_numbers.status`.
- Công thức KPI M05 §2.2 và roll-up M15 khớp `01` §15 (cộng bộ đếm rồi chia, MOS gia quyền `qos_sample_count`).
- `GET /admin/profile/recent-activity` (20 dòng theo `actor_type`, `actor_id`) đi được qua `idx_audit_actor` (InnoDB kèm PK `id` trong index phụ).

## Kiểm chứng

- Không đổi DDL. Mọi thay đổi là đặc tả API/quy tắc service; chưa có code backend để kiểm chứng.
- Định nghĩa `trend` cho `last_month` (so với tháng liền trước nữa) và `custom` (khoảng cùng số ngày ngay trước `fromDate`) là cách áp dụng quyết định "kỳ liền trước cùng số ngày"; cần xác nhận lại nếu ý định khác.
