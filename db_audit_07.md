# BÁO CÁO RÀ SOÁT THIẾT KẾ CSDL – EVN CDR AS (lần 7)

> **Ngày lập**: 2026-11-04 · **Nhánh**: `docs/db-design-readiness` (sau HEAD `a500388`)
> **Phạm vi**: `docs/01_database_schema.md` (`01`), `docs/00_overview_and_architecture.md`, `docs/modules/06, 12`.
> **Trọng tâm**: khóa giữa các kết nối trong tiến trình nền, watermark trên bảng do nhiều tiến trình ghi, dòng thống kê ngày bị bỏ sót khi tính lại. Toàn bộ lỗi dưới đây **đã sửa** trong cùng commit.

## Critical

| Mã | Vấn đề | Kịch bản lỗi | Đã sửa |
|---|---|---|---|
| R7-01 | `runBatch` (M12 §4.2) khóa dòng `cdr_enrichment_state` bằng `SELECT ... FOR UPDATE` trong transaction `qr`, rồi ghi `status = 'PROCESSING'` vào **cùng dòng** bằng `this.dataSource.query` (kết nối khác) | Mọi batch có dữ liệu: câu `UPDATE` ở kết nối thứ hai chờ khóa của `qr`, còn code lại chờ câu `UPDATE` đó, nên không bên nào đi tiếp. InnoDB không phát hiện được deadlock vì hai bên ở hai kết nối. Sau `innodb_lock_wait_timeout` (50 s) thì lỗi 1205, batch rollback, trạng thái `ERROR`. Tiến trình làm giàu không bao giờ tiến watermark | Ghi `PROCESSING` (autocommit) **trước** `startTransaction()`; nhánh không có dữ liệu ghi `IDLE` qua chính `qr`; thêm quy tắc: khi transaction còn mở, mọi câu ghi vào dòng `id = 1` phải đi qua `qr` (M12 §4.2) |

## Major

| Mã | Vấn đề | Kịch bản lỗi | Đã sửa |
|---|---|---|---|
| R7-02 | `NotificationPushPoller` dùng watermark `notifications.id` trên bảng mà `backend-api` và `backend-worker` cùng ghi | Worker tạo cảnh báo id 101 (đang ghi người nhận) thì Admin soạn thông báo id 102 và commit trước. Poller thấy 102, đặt `lastId = 102`, nên id 101 không bao giờ được phát qua WebSocket. Ngoài ra giới hạn "500 dòng người nhận" rồi đặt `lastId` = id lớn nhất đã đọc làm thông báo `EVERYONE` hơn 500 người nhận chỉ phát cho 500 người đầu | Poller đọc thông báo có `created_at` trong 5 phút gần nhất, bỏ id đã có trong tập `pushedIds`, đọc **toàn bộ** người nhận của từng thông báo; thêm `KEY idx_notif_created (created_at)`; quy định ghi thông báo + người nhận trong một transaction, email gửi sau commit (`01` §11, M06 §4.1, `00` §2) |
| R7-03 | Job ngày (`01` §15.0 bước 3) ghi đè `stats_daily` bằng `INSERT ... SELECT ... GROUP BY` từ `stats_hourly`, nhưng không xóa dòng nhóm không còn dữ liệu | Bước 2 xóa mọi dòng giờ của nhóm `g` trong ngày D (vd. đổi leg chính làm `g` không còn tham gia cuộc gọi duy nhất). `GROUP BY` không sinh dòng cho `g`, nên dòng `stats_daily` cũ của `g` vẫn còn và báo cáo ngày/kỳ đếm thừa | Trong cùng transaction, `DELETE` dòng nhóm `stats_daily` của ngày đó khi không còn dòng `stats_hourly` cùng `group_id` |

## Minor

| Mã | Vấn đề | Đã sửa |
|---|---|---|
| R7-04 | `dedupe_key` của `QOS_ALERT` không có `severity`. Khung `H − 2` được đánh giá ở cả 6 lần chạy trong giờ `H`, và số liệu vẫn đổi khi cuộc gọi dài kết thúc. Nếu lần đầu chỉ ra `WARNING` thì `CRITICAL` về sau bị bỏ qua, nên không có email | Khóa thành `QOS:{scope}:{metric}:{stat_date}:{stat_hour}:{severity}`; đã có `CRITICAL` thì không tạo `WARNING`; tối đa 2 cảnh báo cho mỗi chỉ số trong một khung giờ (`01` §10) |

## Kiểm chứng

- R7-01: tái hiện trên container `mariadb-local-1` (MariaDB 13.0). Phiên 1 `BEGIN; SELECT ... FOR UPDATE` rồi giữ transaction; phiên 2 `UPDATE` cùng dòng trả `ERROR 1205 Lock wait timeout exceeded`.
- R7-03: câu `DELETE d FROM stats_daily d ... NOT EXISTS (...)` đã chạy trên cùng container: chỉ xóa dòng nhóm không còn dòng giờ, giữ dòng toàn hệ thống (`group_id IS NULL`) và dòng nhóm còn dữ liệu.
- Không chạy lại toàn bộ DDL + seed (DDL lần này chỉ thêm `idx_notif_created`).
