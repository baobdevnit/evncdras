# Hướng dẫn cho agent – EVN CDR AS

## Rà soát thiết kế CSDL

- Kết quả mọi lần rà soát CSDL nằm **duy nhất** ở `DB_AUDIT_CONSOLIDATED.md` (thư mục gốc). Đọc file này để biết đã phát hiện gì, đã sửa ở đâu, còn gì mở.
- **Không** đọc, khôi phục hay trích dẫn các báo cáo cũ (`DB_SCHEMA_CONSISTENCY_REPORT.md`, `DB_SCHEMA_AUDIT_2026-10-23.md`, `db_audit_*.md`), kể cả qua lịch sử git, trừ khi chủ dự án yêu cầu truy vết.
- Nguồn chuẩn của thiết kế là `docs/` (`docs/01_database_schema.md`, `docs/02_api_contracts.md`). Khi `DB_AUDIT_CONSOLIDATED.md` và `docs/` khác nhau thì `docs/` đúng.
- Rà soát mới: cập nhật `DB_AUDIT_CONSOLIDATED.md` (thêm lần rà ở mục 1, phát hiện ở mục 3, cập nhật việc còn mở ở mục 2), **không** tạo file báo cáo riêng.
