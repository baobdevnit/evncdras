# BÁO CÁO RÀ SOÁT THIẾT KẾ CSDL – EVN CDR AS (lần 10)

> **Ngày lập**: 2026-11-04 · **Nhánh**: `docs/db-design-readiness` (sau HEAD `d3a8c05`)
> **Phạm vi**: `docs/01_database_schema.md` (`01`), `docs/00_overview_and_architecture.md` (`00`), `docs/02_api_contracts.md` (`02`), `docs/modules/02, 10, 11, 12`.
> **Trọng tâm**: tìm phần thiết kế rườm rà có thể làm gọn, chỉ dựa trên thông tin đã có trong tài liệu. Mọi thay đổi dưới đây đã được chủ dự án quyết định qua phỏng vấn và **đã sửa** trong cùng commit.

## Phỏng vấn: đề xuất làm gọn bị từ chối (giữ nguyên)

| Đề xuất | Quyết định | Lý do của chủ dự án |
|---|---|---|
| Gộp `phone_prefix_groups` vào `user_groups` | Giữ bảng | Nhóm đầu số là phần mở rộng để dễ quản lý nhóm người dùng; chấp nhận nhóm đầu số rỗng |
| Thay 5 bảng RBAC bằng cột `role` trên tài khoản | Giữ 5 bảng | Ứng dụng còn mở rộng, sẽ có thêm vai trò ngoài 5 vai trò hiện tại |
| Bỏ `stats_daily`, chỉ giữ bộ đếm cộng được | Giữ nguyên | — |
| Bỏ dòng `phone_number_range_history` cho từng số khi thao tác trên dải | Giữ nguyên | — |

## Major

| Mã | Vấn đề | Kịch bản lỗi | Đã sửa |
|---|---|---|---|
| R10-01 | Nhóm đầu số chưa gắn nhóm người dùng vẫn được cấp dải. Khi sau đó `POST /admin/user-groups` gắn nhóm đầu số đó vào nhóm mới, quyền sở hữu số đổi (chuỗi `range_id → prefix_group_id → user_groups`) nhưng thao tác này không tăng `cache_version` (`00` §2.1 chỉ liệt kê cấp phát/thu hồi dải, lưu setting) | Admin cấp dải 42000–42499 cho `PG-KD`, rồi tạo nhóm `UMO-KD` gắn `PG-KD`. Worker vẫn giữ cache cũ (số không có nhóm), nên mọi CDR của 500 số bị gán `caller_group_id`/`called_group_id = NULL` cho tới lần cấp phát kế tiếp. Nhóm chốt lúc làm giàu, nên các CDR đó mất khỏi phạm vi nhóm vĩnh viễn | **Quyết định**: nhóm đầu số luôn đi liền nhóm người dùng. Tạo tự động trong transaction `POST /admin/user-groups` (`code = 'PG-' + code nhóm`, `name = 'Nhóm đầu số ' + tên nhóm`); bỏ `POST`/`DELETE`/`GET available` của `/admin/prefix-groups`, chỉ giữ xem và sửa tên/mô tả; bỏ `phonePrefixGroupId` khỏi body tạo/sửa nhóm (`400`). Cấp/sửa dải chỉ cho nhóm `ACTIVE` (`409 GROUP_INACTIVE`). Không còn nhóm đầu số chưa gắn, nên quyền sở hữu số chỉ đổi qua thao tác trên dải (đã tăng `cache_version`). `phone_prefix_groups.code` nới lên `varchar(53)` cho đủ `PG-` + 50 ký tự (`01` §4.1, §8, §14; `02`; M02; M11) |
| R10-02 | Ngừng hoạt động nhóm luôn thu hồi toàn bộ dải số | Chủ dự án yêu cầu dải **có thể** được thu hồi, không bắt buộc | `DELETE /admin/user-groups/:id?revokeRanges=true\|false`, **mặc định `false`**. Không thu hồi thì số vẫn thuộc nhóm `INACTIVE`, CDR mới vẫn gán cho nhóm đó; thu hồi sau bằng `DELETE /admin/prefixes/:id` (được cả khi nhóm `INACTIVE`, vẫn khóa dòng nhóm trước) (`01` §14, `02`, M02 §1.4, §3.4, TC-UG-06) |

## Minor (làm gọn)

| Mã | Vấn đề | Đã sửa |
|---|---|---|
| R10-03 | `phone_prefix_groups.status` không có quy tắc nào (INACTIVE không chặn cấp dải, không chặn gắn nhóm); nhóm đầu số không dùng nữa đã có xóa cứng | Bỏ cột `status`. Trạng thái nhóm đầu số = trạng thái nhóm người dùng gắn với nó; nhóm đầu số không bao giờ bị xóa. Bỏ mã audit `CREATE_PREFIX_GROUP`, `DELETE_PREFIX_GROUP` (`01` §4.1, §13, §14) |
| R10-04 | Job thống kê dùng 3 cơ chế chồng nhau: cửa sổ trực tiếp `H−2..H`, hàng đợi cho khung cũ hơn với điều kiện "bắt đầu trước `H−1`", và chốt sổ 00:05 tính lại 24 giờ + cờ `stats_daily.is_finalized` không API nào đọc | Hàng đợi là nguồn duy nhất: mỗi batch làm giàu đưa khung giờ của **mọi** leg vừa ghi (và của leg chính cũ khi đổi leg chính) vào `stats_recompute_queue`; job chỉ tính khung trong hàng đợi, ưu tiên các khung từ `H−2` trở đi rồi tới tối đa 144 dòng cũ nhất. Bỏ cửa sổ cố định, bỏ chốt sổ, bỏ cột `is_finalized` (`01` §15.0, `00` §2, M12 §4.2) |
| R10-05 | `cdr_enriched` có 2 index thừa trên bảng lớn nhất: `idx_cdre_sipcallid` (không API hay tiến trình nào tra theo `SipCallId`), `idx_cdre_disconnection_code` (không có `Created`, trái quy tắc §15 "đi qua index có `Created`"; mã 200 chiếm ~62 % dòng) | Bỏ cả hai; giảm chi phí ghi của tiến trình làm giàu (`01` §2.1) |

## Ngoài phạm vi CSDL (chưa sửa)

- `templates/admin/user_group.*` (dropdown chọn nhóm đầu số) và `templates/admin/prefix-management.*` (thêm/xóa nhóm đầu số) vẫn theo luồng cũ; khi sinh giao diện Vue thì theo M02 §1.4 và `00` mục route.
- `docs/intent/*.md` là ghi chép lịch sử, không cập nhật.

## Kiểm chứng

- DDL mới của `phone_prefix_groups`, `cdr_enriched`, `stats_daily`, `stats_recompute_queue` chạy được trên container `mariadb-local-1` trong một database tạm (đã xóa sau khi chạy).
- Grep toàn bộ `docs/` (trừ `intent/`): không còn tham chiếu tới `prefix-groups/available`, `validatePhonePrefixGroupBinding`, `is_finalized`, chốt sổ 00:05, `CREATE_PREFIX_GROUP`/`DELETE_PREFIX_GROUP`.
- R10-01, R10-02, R10-04 là quy tắc ở tầng service, chưa kiểm chứng bằng code (backend chưa có).
