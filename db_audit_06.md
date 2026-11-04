# BÁO CÁO RÀ SOÁT THIẾT KẾ CSDL – EVN CDR AS (lần 6)

> **Ngày lập**: 2026-11-03 · **Nhánh**: `docs/db-design-readiness` (sau HEAD `2a1c4f2`)
> **Phạm vi**: `docs/01_database_schema.md` (`01`), `docs/02_api_contracts.md` (`02`), `docs/00_overview_and_architecture.md`, `docs/modules/02, 03, 04, 06, 08, 11, 12, 13`.
> **Trọng tâm**: lỗi còn sót sau lần 5: tranh chấp đồng thời, ranh giới thời gian của job tổng hợp, vòng đời trạng thái. Toàn bộ lỗi dưới đây **đã sửa** trong cùng commit.

## Major

| Mã | Vấn đề | Kịch bản lỗi | Đã sửa |
|---|---|---|---|
| R6-01 | Hàng đợi tính lại xét theo **tuổi leg** ("`Created` cũ hơn 3 giờ") trong khi cửa sổ job tính theo **khung giờ** | Lúc 10:52 làm giàu một leg 07:58 (tuổi 2 giờ 54 phút) nên leg không vào hàng đợi. Lần chạy 11:00 chỉ tính 09–11, nên khung 07 không bao giờ được tính lại | `01` §15.0 bước 2 định nghĩa cửa sổ `H−2..H`; bước 5 đưa vào hàng đợi khi khung giờ `<= H−2`; M12 §4.2 |
| R6-02 | `INSERT IGNORE` + "xóa dòng hàng đợi đã xử lý" làm mất yêu cầu đến giữa chừng | Job đang tính khung X thì tiến trình làm giàu ghi thêm leg vào X (`INSERT IGNORE` không làm gì). Job xóa dòng hàng đợi nên leg mới không được tính | Ghi hàng đợi bằng `ON DUPLICATE KEY UPDATE queued_at = CURRENT_TIMESTAMP(6)`; job chỉ xóa dòng có `queued_at <=` giá trị đã đọc; `queued_at` đổi sang `timestamp(6)` và thêm index; mỗi lần chạy xử lý tối đa 144 dòng |
| R6-03 | Tính lại kỳ đã `DROP PARTITION` sẽ xóa thống kê dài hạn | Gọi `POST /admin/stats/recalculate` cho năm 2020 (CDR đã bị xóa). Job ghi đè `stats_*` bằng số 0 và xóa các dòng nhóm, trái với quy định "stats không bị dọn" | Thêm mốc `:purgeBoundary` (`01` §15.0 bước 5): không đưa vào hàng đợi và không tính lại khung trước mốc; API trả `400` (`02`) |
| R6-04 | Kiểm tra giao nhau của dải số không khóa gì | Hai Admin cùng cấp hai dải chồng lấn. Cả hai đều qua được `SELECT` kiểm tra, rồi request sau âm thầm chuyển số của dải trước sang dải của nó | `UPDATE phone_numbers ... AND range_id IS NULL` + so `affectedRows`, khác thì `409` (`01` §8, M11 §3.2) |
| R6-05 | `INACTIVE` không được chặn ở các API đổi trạng thái | `PUT /users/:id/status {ACTIVE}` trên tài khoản `INACTIVE`: lỗi `UNIQUE` (500) nếu username đã có người dùng lại, hoặc tài khoản của nhóm `INACTIVE` sống lại. Ví dụ body `PUT /admin/user-groups/:id` có `status`, nên nhóm có thể được kích hoạt lại mà không có Quản trị viên nhóm nào | `INACTIVE` là trạng thái cuối (`01` §14); `409 ACCOUNT_INACTIVE` / `GROUP_INACTIVE`; PUT nhóm không nhận `status` (M02, M03, M04, `02`) |
| R6-06 | Không quy định khi nào tạo dòng `user_settings` | Tài khoản mới chưa từng lưu thiết lập. Truy vấn người nhận email dùng `JOIN` nên bỏ qua tài khoản này, dẫn đến không bao giờ nhận email `CRITICAL` dù mặc định là bật | Tạo dòng cùng transaction tạo tài khoản; thiếu dòng thì coi là mặc định (`LEFT JOIN ... COALESCE(..., 1)`) (`01` §10, §12) |

## Minor

| Mã | Vấn đề | Đã sửa |
|---|---|---|
| R6-07 | `phone_number_range_history` có cả `range_id`/`user_group_id` lẫn `previous_*`/`new_*` nhưng không định nghĩa cột lọc theo từng `action_type`. Vì vậy lọc lịch sử theo nhóm có thể bỏ sót dòng thu hồi | COMMENT định nghĩa rõ từng cột (`01` §8.5) |
| R6-08 | §14 ghi "`notifications` xóa cứng được (dọn thông báo cũ)" nhưng không có API hay job nào làm việc này | Ghi rõ: phiên bản này giữ vĩnh viễn, chỉ DBA xóa thủ công |

## Kiểm chứng

- DDL mới của `stats_recompute_queue` và câu upsert `ON DUPLICATE KEY UPDATE queued_at = CURRENT_TIMESTAMP(6)` đã chạy trên container `mariadb-local-1`: `queued_at` được cập nhật khi có yêu cầu trùng.
- Không chạy lại toàn bộ DDL + seed (lần này chỉ đổi `stats_recompute_queue` và COMMENT của `phone_number_range_history`).
