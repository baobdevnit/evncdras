# Intent: Thiết kế lại hệ thống vai trò – quyền hạn

> Chốt ngày 2026-10-26 · Thay thế quyết định Q6 và một phần Q7 trong `docs/intent/docs-readiness-for-codegen.md`

- **Kết quả**: vai trò và quyền là dữ liệu seed cố định; mỗi tài khoản gán đúng 1 vai trò qua bảng quan hệ riêng; quyền không còn lưu trên từng tài khoản.
- **Phạm vi**: chỉ sửa tài liệu trong `docs/`. Không sửa `templates/`, không sinh code.

## Quyết định

| # | Nội dung | Chốt |
|---|---|---|
| R1 | Vai trò | 5 vai trò seed trong `roles`: `ROOT_ADMIN` Quản trị viên tối cao, `SYSTEM_ADMIN` Quản trị viên hệ thống (cổng Admin); `GROUP_ADMIN` Quản trị viên nhóm, `USER_RECORDING` Thành viên nghe ghi âm, `REGULAR_USER` Thành viên (cổng User) |
| R2 | Giao diện vai trò | Chỉ có màn hình xem danh sách vai trò kèm quyền rút gọn (`roles.html`). Không có giao diện/API sửa vai trò hay quyền. Bỏ `permissions.html`, `data-permissions.html`, `PUT /admin/roles/:id`, `GET\|PUT /admin/permissions/matrix`, mã quyền `role:manage` (catalog còn 25 mã) |
| R3 | Lưu quyền | `permissions` và `permission_roles` (đổi tên từ `role_permissions`) là seed cố định. Bỏ cột `admins.is_root`, `users.is_group_admin`, `users.can_access_recording`. Quyền cấp nhóm duy nhất giữ lại là `user_groups.allow_recording_access` |
| R4 | Gán vai trò | Bảng `admin_roles` và `user_roles`, PK là id tài khoản (mỗi tài khoản 1 vai trò); khóa ngoại `(role_id, role_scope) → roles(id, scope)` chặn gán sai cổng (`role_scope` cùng kiểu `enum('ADMIN','USER')` với `roles.scope`, cố định bằng `CHECK`; sửa 2026-11-03 theo rà soát CSDL lần 4 D-01, xem `DB_AUDIT_CONSOLIDATED.md`). Đổi vai trò người dùng qua một API `PUT /users/:id/role` (thay `PUT /users/:id/group-admin` và `PATCH .../recording-access`); không có API đổi vai trò Admin |
| R5 | Kiểm tra quyền Admin | Chỉ xét vai trò trong `admin_roles` và `permission_roles`. Bỏ `RootAdminOnlyGuard`, dùng `@RequirePermissions('admin:manage')` |
| R6 | Kiểm tra quyền User | Quyền nhóm trước (nhóm `ACTIVE`; `cdr:listen_audio`/`cdr:download_audio` cần `allow_recording_access = 1`), sau đó quyền vai trò. Token mang `roleCode`; cờ nhóm đọc từ CSDL mỗi request |

## Giả định cần xác nhận

- Yêu cầu gốc liệt kê 4 tên vai trò cho "5 vai trò". Giữ 2 vai trò thành viên như thiết kế trước (`USER_RECORDING`, `REGULAR_USER`) vì việc bỏ cờ `can_access_recording` cần một vai trò mang quyền nghe ghi âm cho thành viên.
- Giao diện hạ quyền Quản trị viên nhóm đưa người đó về `REGULAR_USER`; API cho chọn vai trò đích bất kỳ trong 3 vai trò User.

## Việc cần làm ở `templates/` (đợt sau)

- `templates/admin/roles.html`: bỏ nút/thao tác sửa, hiển thị danh sách quyền rút gọn cho từng vai trò.
- `templates/admin/permissions.html`, `templates/admin/data-permissions.html`: gỡ khỏi menu điều hướng.
- `templates/member/group-admin.html`: switch ghi âm và nút bổ nhiệm gọi `PUT /users/:id/role`.
