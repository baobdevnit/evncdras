# BÁO CÁO RÀ SOÁT THIẾT KẾ CSDL – EVN CDR AS (lần 9)

> **Ngày lập**: 2026-11-04 · **Nhánh**: `docs/db-design-readiness` (sau HEAD `2c6902b`)
> **Phạm vi**: `docs/01_database_schema.md` (`01`), `docs/00_overview_and_architecture.md` (`00`), `docs/modules/02, 03, 04, 10`.
> **Trọng tâm**: ràng buộc nghiệp vụ kiểm tra bằng `SELECT` thường khi nhiều request chạy song song (đếm Quản trị viên nhóm, bộ đếm đăng nhập sai), thứ tự đọc/ghi `cache_version`. Toàn bộ lỗi dưới đây **đã sửa** trong cùng commit.
> **Phỏng vấn**: R9-02 có một điểm tài liệu chưa nói (hết khóa tạm mà sai tiếp thì sao). Chủ dự án chọn: **đặt lại bộ đếm về 0 khi khóa**.

## Major

| Mã | Vấn đề | Kịch bản lỗi | Đã sửa |
|---|---|---|---|
| R9-01 | Quy tắc "nhóm `ACTIVE` có ít nhất 1 Quản trị viên nhóm `ACTIVE`" (BR-UG-02) được kiểm tra bằng `SELECT COUNT(*)` thường, chỉ khóa dòng `user_roles` của người đích (M10 §3.2) | Nhóm có 2 Quản trị viên A, B. Request hạ quyền A và request khóa B (hoặc hạ quyền / ngừng hoạt động B) chạy cùng lúc. Mỗi request khóa dòng của người mình xử lý, rồi đếm theo snapshot thấy người kia vẫn là Quản trị viên, nên cả hai đều qua. Nhóm không còn Quản trị viên nào. Cùng kiểu lỗi: tạo user trong nhóm đang bị ngừng hoạt động, đặt người đại diện là người đang bị hạ quyền, cấp dải số cho nhóm đang bị ngừng hoạt động | Câu đầu tiên của các thao tác thuộc một nhóm là `SELECT ... FROM user_groups WHERE id = :groupId FOR UPDATE`; thứ tự khóa thống nhất (nhóm trước, rồi `users`/`user_roles`/`phone_numbers`). Danh sách thao tác ở `01` §14; thêm bước 0 ở M10 §3.2; M02 §3.3 kiểm tra người đại diện sau khi khóa |
| R9-02 | Bộ đếm `failed_login_count` chỉ ghi là "tăng", không nói cách tăng; hết khóa tạm mà sai tiếp thì bộ đếm cứ tăng | (a) Kẻ tấn công gửi song song nhiều request sai mật khẩu: các request cùng đọc `0` rồi cùng ghi `1` nên tài khoản không bao giờ bị khóa, thử mật khẩu không giới hạn. (b) Bộ đếm không về 0 khi khóa: sau mỗi lần hết khóa, mỗi lần sai lại tăng tiếp, tới 255 thì cột `tinyint unsigned` tràn, câu `UPDATE` lỗi và API đăng nhập trả `500` | Tăng bằng một câu `UPDATE` nguyên tử; đạt ngưỡng thì đặt `locked_until` và đưa bộ đếm về 0 trong cùng câu lệnh (`locked_until` đứng trước vì MariaDB gán `SET` từ trái sang phải) (`01` §6.1, M03, M04) |

## Minor

| Mã | Vấn đề | Đã sửa |
|---|---|---|
| R9-03 | `cache_version` được tăng "trong cùng transaction" nhưng không nói ở vị trí nào. Câu `UPDATE` khóa dòng `cdr_enrichment_state.id = 1`, là dòng batch làm giàu giữ `FOR UPDATE` suốt batch, nên tăng sớm thì làm giàu bị chặn suốt transaction cấp phát. Ngoài ra nếu khi nạp lại cache, tiến trình đọc dữ liệu trước rồi mới đọc `cache_version`, một lần cấp phát commit xen giữa sẽ để cache giữ dữ liệu cũ kèm phiên bản mới, và không bao giờ nạp lại (CDR bị gán sai nhóm vĩnh viễn vì nhóm chốt lúc làm giàu) | Tăng `cache_version` bằng câu ghi cuối cùng trước commit; khi nạp lại thì đọc `cache_version` trước, dữ liệu sau (`00` §2.1) |

## Đã rà, không phát hiện lỗi

- Đối chiếu tự động mọi tham chiếu `bảng.cột` trong `00`, `02`, `03` và 15 module với DDL ở `01`: không có cột lạ (chỉ có tên file/lớp và các cột đã ghi chú là bị loại bỏ).
- Đối chiếu khóa `system_settings` và mã `audit_logs.action` dùng trong module với danh mục ở `01` §12, §13: khớp (`analysis_min_duration_seconds` chỉ xuất hiện trong câu ghi chú "đã bỏ").
- Tiến trình làm giàu (M12 §4.2), chốt chặn giao nhau khi cấp phát dải số (M11 §3.2), thông báo và poller (`01` §10–11), thuật toán tổng hợp (`01` §15.0): không thấy lỗi mới.

## Kiểm chứng

- Chưa chạy được trên container `mariadb-local-1`: lần này không đọc được thông tin đăng nhập root của container.
- R9-01 là hiện tượng write skew đã biết của InnoDB ở mức `REPEATABLE READ` (câu `SELECT` không có `FOR UPDATE` đọc snapshot, không khóa). R9-02 (a) là lost update khi đọc rồi ghi từ code. Cả hai là quy tắc ở tầng service, backend chưa có code để kiểm chứng.
