# BÁO CÁO RÀ SOÁT THIẾT KẾ CSDL – EVN CDR AS (lần 8)

> **Ngày lập**: 2026-11-04 · **Nhánh**: `docs/db-design-readiness` (sau HEAD `96bafde`)
> **Phạm vi**: `docs/01_database_schema.md` (`01`), `docs/02_api_contracts.md`, `docs/00_overview_and_architecture.md`, `docs/modules/03`.
> **Trọng tâm**: refresh token khi nhiều tab chạy đồng thời, mốc chặn tính lại thống kê sau khi xóa partition, tín hiệu phát hiện PABX ngừng ghi. Toàn bộ lỗi dưới đây **đã sửa** trong cùng commit.

## Major

| Mã | Vấn đề | Kịch bản lỗi | Đã sửa |
|---|---|---|---|
| R8-01 | Dùng lại Refresh Token đã `ROTATED` luôn bị coi là đánh cắp token, trong khi frontend cho mỗi tab tự gọi `refresh` lúc tải trang (`00` §5.3.2) và các tab dùng chung cookie | Người dùng mở lại trình duyệt, 2 tab được khôi phục cùng lúc và cùng gửi một Refresh Token. Request đầu xoay vòng, request sau thấy token đã `ROTATED` nên ghi `REUSE_DETECTED` và thu hồi mọi phiên của tài khoản trên mọi thiết bị. Không có khóa dòng nên hai request còn có thể cùng xoay vòng, sinh 2 phiên con | Thêm cột `auth_sessions.replaced_by_session_id`; đọc phiên bằng `SELECT ... FOR UPDATE`; khoảng ân hạn 30 giây: token `ROTATED` dùng lại trong 30 giây thì cấp Access Token cho phiên con đang hiệu lực, không gửi `Set-Cookie`; quá 30 giây mới là `REUSE_DETECTED` (`01` §6.1, `00` §5.3.2, TC-USR-02c ở M03) |
| R8-02 | Mốc `:purgeBoundary` (chặn tính lại thống kê của kỳ đã mất CDR) tính từ setting `retention_archive_months`, là setting Admin sửa được | Partition trước 2021-11 đã bị `DROP`. Admin tăng `retention_archive_months` 60 → 72, mốc lùi về 2020-11. `POST /admin/stats/recalculate` từ 2020-11 được chấp nhận; job tính lại 12 tháng đó từ `cdr_enriched` rỗng, ghi đè dòng toàn hệ thống bằng 0 và xóa dòng nhóm, nên mất báo cáo dài hạn mà mục 2.1 cam kết giữ | Lưu mốc thật vào `cdr_enrichment_state.cdr_purged_before`; job partition ghi mốc (chỉ tăng, `GREATEST`) **trước** mỗi `DROP PARTITION` vì DDL không nằm trong transaction được; `:purgeBoundary` đọc cột này, NULL = không chặn (`01` §2.1, §2.2, §15.0 bước 5; `02` `POST /admin/stats/recalculate`) |

## Minor

| Mã | Vấn đề | Đã sửa |
|---|---|---|
| R8-03 | Phát hiện `PABX_OFFLINE` dùng `Created` (lúc **bắt đầu** cuộc gọi) của bản ghi mới nhất, trong khi PABX chỉ ghi lúc kết thúc: bản ghi vừa ghi của cuộc gọi dài 90 phút trông như đã cũ 90 phút, nên lúc vắng cuộc gọi hệ thống báo offline sai. Ngoài ra trạng thái "đang offline" không có nơi lưu, nên `backend-worker` khởi động lại thì mất thông báo phục hồi hoặc báo offline lặp lại | Dùng `COALESCE(Destroyed, Created)`; trạng thái đọc từ thông báo `PABX_OFFLINE` gần nhất (`CRITICAL` = offline, `INFO` = bình thường); thêm `KEY idx_notif_type (type, id)` (`01` §10, §11) |

## Kiểm chứng

- DDL mới của `cdr_enrichment_state`, `auth_sessions`, `notifications` (bỏ FK tới `admins`) chạy trên container `mariadb-local-1` trong một database tạm.
- R8-02: hai câu `UPDATE ... GREATEST(COALESCE(cdr_purged_before, :bound), :bound)` với `:bound` 2021-11-01 rồi 2021-10-01 giữ nguyên 2021-11-01 (mốc không lùi).
- R8-03: `EXPLAIN` truy vấn thông báo `PABX_OFFLINE` gần nhất dùng `idx_notif_type` và trả đúng `INFO` sau chuỗi CRITICAL → INFO.
- R8-01 là quy tắc ở tầng service, chưa kiểm chứng bằng code (backend chưa có).
