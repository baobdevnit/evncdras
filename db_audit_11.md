# BÁO CÁO RÀ SOÁT THIẾT KẾ CSDL – EVN CDR AS (lần 11)

> **Ngày lập**: 2026-11-04 · **Nhánh**: `docs/db-design-readiness` (sau HEAD `1b1a309`)
> **Phạm vi**: `docs/01_database_schema.md` (`01`), `docs/02_api_contracts.md` (`02`), `docs/modules/01, 02, 05, 07, 11, 12, 13, 14`.
> **Trọng tâm**: tính nhất quán giữa DDL/quy tắc ở `01` và đặc tả API ở module, chỉ dựa trên thông tin đã có. Các điểm tài liệu chưa nói hoặc nói hai cách đã được chủ dự án quyết định qua phỏng vấn; mọi thay đổi dưới đây **đã sửa** trong cùng commit.

## Phỏng vấn

| Câu hỏi | Quyết định |
|---|---|
| User mở `GET /cdr/:id` / API audio của CDR lưu trữ (cũ hơn `retention_online_months`) | **Cho phép**: tra theo `id` không giới hạn theo cửa sổ trực tuyến, vẫn kiểm tra cô lập nhóm và quyền ghi âm 2 tầng. Chỉ API danh sách bị giới hạn |
| Cách khớp `callerId` / `calledId` | **Khớp đúng** |
| Kiểu `id` của CDR trong API | **Chuỗi không đệm số 0** (`"5370"`) |
| `organizations.level` | Gốc = 0, con = cha + 1, tối đa 3; đổi cha thì tính lại cả nhánh |
| Giảm `retention_archive_months` | **Bắt xác nhận** (`confirmPurge: true`) |
| `organizations.status = INACTIVE` | **Chặn gắn mới** (đơn vị con, nhóm người dùng); dữ liệu đã gắn giữ nguyên |
| `"id": 42100` trong ví dụ kho số | **Sửa ví dụ** (id là khóa nội bộ, API tra theo `:number`) |

## Major

| Mã | Vấn đề | Kịch bản lỗi | Đã sửa |
|---|---|---|---|
| R11-01 | `01` §2.1 ghi "Người dùng nhóm không xem được dữ liệu lưu trữ", nhưng `GET /cdr/:id` và API audio (M12 §3.2–3.4) chỉ kiểm tra cô lập nhóm. Hai tài liệu cho hai kết quả khác nhau | Người viết code theo `01` thì chặn chi tiết/ghi âm của CDR lưu trữ; người viết theo M12 thì không chặn. Một đường link chi tiết đã lưu, quá 6 tháng thì có bản trả dữ liệu, có bản trả lỗi | Theo quyết định: tra theo `id` không giới hạn cửa sổ trực tuyến; giới hạn chỉ áp cho API danh sách (`01` §2.1, M12 §3.2) |
| R11-02 | Giảm `retention_archive_months` (vd. 60 → 12) chỉ bị kiểm tra `>= retention_online_months` | Lần chạy kế tiếp của job partition `DROP PARTITION` 48 tháng CDR, không khôi phục được; chỉ còn dòng audit `UPDATE_SETTINGS` | `PUT /admin/settings/system` giảm giá trị phải kèm `confirmPurge: true`, thiếu thì `409 RETENTION_PURGE_CONFIRM_REQUIRED` kèm số tháng sẽ bị xóa (`01` §2.1, `02`, M07 §3.2) |
| R11-03 | `organizations.level` mặc định `1` trong DDL nhưng comment ghi `0 = Tập đoàn`; M01 chỉ nói `level = parent.level + 1`, không nói gốc, độ sâu tối đa, hay khi `PUT` đổi `parentId` | Tạo đơn vị gốc "EVN" nhận level 1 (như Tổng công ty). Chuyển một Tổng công ty sang làm con của đơn vị khác thì level của nó và các đơn vị con giữ giá trị cũ, sắp xếp `ORDER BY level, sort_order` (M01 §4) ra sai thứ tự | Gốc = 0 (DDL `DEFAULT 0`), tối đa 3 (`400`), đổi cha thì tính lại cả nhánh trong một transaction; sửa ví dụ cây ở M01 §3.1 (`01` §4, M01 §3.2, §3.3) |

## Minor

| Mã | Vấn đề | Đã sửa |
|---|---|---|
| R11-04 | `cdr_enriched.id` trả dạng chuỗi đệm 0 `"00000000000000005370"` (`02` §2.2, M12 §3.1) nhưng dạng số `1` ở M13 (`id`, `callGroupKey`); M14 `cdrId` không nói | Quy ước ở `02` §2: `id`, `cdrId`, `callGroupKey` của CDR là chuỗi số không đệm 0; `/cdr/:id` nhận cả hai dạng. Sửa ví dụ `02`, M12, M13, M14 |
| R11-05 | `callerId`/`calledId` chỉ ghi "chuỗi tìm kiếm"; cách khớp quyết định có dùng được `idx_cdre_caller_created` / `idx_cdre_called_created` hay không | Ghi rõ khớp đúng ở M12 §3.1, M13 §3.1, M14 |
| R11-06 | `legs[]` của trang chi tiết đọc theo `call_group_key` không kèm `Created`, trái quy tắc `01` §2.1 "mọi truy vấn có điều kiện `Created`"; `idx_cdre_call_group` quét mọi partition | Kèm `Created` trong ±2 giây quanh leg đang xem (khóa gom leg đã giới hạn 2 giây) (`01` §2.1, M12 §3.2) |
| R11-07 | Giới hạn xuất CDR 100.000 dòng (`01` §15) không có ở đặc tả `GET /cdr/export` | Thêm vào M12 §3.1.1 |
| R11-08 | `organizations.status = INACTIVE` không có hệ quả nào được ghi | Chặn tạo đơn vị con, chuyển sang cha `INACTIVE`, tạo nhóm hoặc đổi `organization_id` sang đơn vị `INACTIVE` (`409 ORGANIZATION_INACTIVE`); nhóm đã gắn giữ nguyên (`01` §4, M01, M02 §3.2, §3.3) |
| R11-09 | Ví dụ `GET /admin/phone-numbers` có `"id": 42100` trùng số máy, trong khi `phone_numbers.id` là `AUTO_INCREMENT` và seed không gán id | Sửa ví dụ (`32101`, `90000`) (M11) |

## Đã rà, không phát hiện lỗi

- Khóa `system_settings` dùng ở mọi module khớp seed `01` §12 (chỉ `analysis_min_duration_seconds` trong câu ghi chú "đã bỏ").
- Catalog quyền M10 §2.1 đủ 25 mã như ghi chú.
- Truy vấn KPI M05, nguồn dữ liệu M13/M14/M15 chỉ đọc `stats_*` (trừ danh sách từng cuộc gọi); `disconnection-codes` M13 dùng tổng `sip_*_count` khớp `total_calls`.
- Giới hạn 31 ngày, `includeArchive`, `stats/recalculate` 366 ngày, `revokeRanges`, `409 GROUP_INACTIVE`: khớp giữa `01`, `02` và module.

## Kiểm chứng

- Thay đổi DDL duy nhất là `organizations.level DEFAULT 0` và comment; chưa chạy lại trên container `mariadb-local-1`.
- R11-02, R11-03, R11-08 là quy tắc tầng service, chưa có code backend để kiểm chứng.
