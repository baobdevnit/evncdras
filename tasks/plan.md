# Kế hoạch: Rà soát docs – đảm bảo hệ thống gồm 2 app riêng biệt (Admin App & Member App)

## Tổng quan

Commit `48bb93d` đã đặt kiến trúc 2 ứng dụng frontend trong `docs/00_overview_and_architecture.md` (mục 2.2, 5.2, 5.3): monorepo pnpm `frontend/apps/admin` (`/admin/*`), `frontend/apps/member` (`/*`), `packages/shared`; API tách `/api/v1/admin/*` và `/api/v1/*`; template nguồn `templates/admin/` và `templates/member/`.

Rà soát chéo cho thấy phần còn lại của bộ docs **chưa nhất quán** với kiến trúc này: còn mâu thuẫn về lưu token, thiếu đặc tả/API cho một số màn hình, module docs vẫn trỏ template phẳng `templates/X.html` (đã không còn tồn tại), danh mục màn hình trong `03_ui_design.md` còn cây template cũ. Kế hoạch này chỉ sửa **docs** (không sinh code, không sửa `templates/` — theo phạm vi `docs/intent/docs-readiness-for-codegen.md`); điểm lệch của templates được ghi vào backlog.

**Đích đến:** một AI coding agent đọc bất kỳ module doc nào cũng biết chính xác: màn hình thuộc app nào, file Vue nào, route/URL nào, template nguồn nào (`templates/admin|member/...`), gọi API base nào, cần quyền gì — và không có hai tài liệu nói khác nhau.

## Phát hiện từ rà soát

### Mâu thuẫn / lỗ hổng (rủi ro cao – ảnh hưởng sinh code)

| # | Vấn đề | Vị trí |
|---|---|---|
| F1 | **Lưu token mâu thuẫn**: `00` mục 5.3.2 quy tắc 5 nói Access Token lưu `localStorage` (`evn_admin_token` / `evn_user_token`), `createClient({ tokenKey })`; trong khi `03_auth_user` (TC-USR-01) và `04_auth_admin` §5.1 nói Access Token **chỉ giữ trong bộ nhớ Pinia**, không `localStorage`, phiên duy trì bằng cookie Refresh Token `Path` riêng từng portal. | `00` §5.2 (createClient, client.ts), §5.3.2 #5, #6; `03`, `04` |
| F2 | **Màn hình Danh bạ nhóm không có API dùng được**: route `/group-members` yêu cầu `user_group:view` (mọi vai trò User có), nhưng danh sách thành viên chỉ có `GET /api/v1/users` cần `user:view` – vai trò `USER_RECORDING`, `REGULAR_USER` **không có** (`10` §2). `GroupMembersView` không được đặc tả ở module doc nào. | `00` §5.3.4, `02_api` §3.3, `10` ma trận, `02_user_group` |
| F3 | **Admin App thiếu route cho chức năng đã có API**: `GET /admin/audit-logs` (`audit:view`), quản lý tài khoản Admin (`/admin/admins*`, `04` gọi là `AdminManagementView.vue` nhưng cũng nói là "Tab trong `SystemSettingsView`"), soạn thông báo `POST /admin/notifications`, kho số `/phone-numbers/pool`. Không rõ là route riêng hay tab, không có trong bảng route §5.3.3. | `00` §5.3.3, `04` §5, `06`, `07`, `11` |

### Lệch tham chiếu (rủi ro trung bình)

| # | Vấn đề | Vị trí |
|---|---|---|
| F4 | Module docs trỏ template phẳng không còn tồn tại: `templates/organization.html`, `templates/login.html` (cả cho Admin), `templates/dashboard.html`, `templates/member-dashboard.html`, `templates/notifications.html`, `templates/profile.html`, `templates/cdr-history.html`, `templates/qos-debug.html`, `templates/reports.html`, `templates/users.html`. | `01`, `03`, `04`, `05`, `06`, `08`, `09`, `12`, `13`, `15` §4 |
| F5 | Màn hình có ở 2 cổng nhưng module doc chỉ đặc tả 1 app hoặc không nêu file Vue: `05` (không có đường dẫn Vue cho cả 2 dashboard), `15` (không có Vue), `11` (thiếu `OrgPrefixView` của Member), `08` (thiếu `AccountSettingsView`, `ChangePasswordView`), `09` (thiếu `ChangePasswordView`/`AccountSettingsView` Admin), `02_user_group` (thiếu `GroupAdminView`, `GroupMembersView`). | các module tương ứng |
| F6 | `03_ui_design.md` §8 "Danh mục màn hình": cây `templates/` phẳng cũ (`login_admin.html`, `users4group.html`, `member-dashboard`), bảng 8.1 không nói màn hình thuộc cổng nào. | `03_ui_design.md` §8, §8.1 |
| F7 | `README.md`, `require_for_writing_docs.md`: cây thư mục chưa có `frontend/apps/admin|member`, `packages/shared`, `templates/admin|member`. | 2 file gốc |

### Lệch của templates (ghi backlog, không sửa đợt này)

| # | Vấn đề |
|---|---|
| T-a | Sidebar `templates/admin/*.html` (17 trang) còn link `permissions.html`, `data-permissions.html` – docs nói không triển khai. |
| T-b | Nút demo chuyển dashboard chéo cổng `admin/dashboard.html:263` → `../member/dashboard.html`, `member/dashboard.html:214` → `../admin/dashboard.html` – `05` §5.1 nói không có nút này. |
| T-c | `admin/reports.js`, `member/reports.js` còn `currentRole` (dư âm Role Simulator). |
| T-d | CSS mồ côi không có HTML: `admin/settings.css`, `member/organization.css`, `member/prefix-management.css`, `member/users.css`. |
| T-e | Link chuyển cổng trên trang login dùng `../member/login.html` / `../admin/login.html`; khi chuyển Vue phải là `/login`, `/admin/login` (`00` §5.3.2 #4) – ghi chú ánh xạ. |
| T-f | `member/group-members.js` mock có trường `extension` (máy lẻ) không có trong bảng `users`; docs `02_user_group` §5.4 không triển khai trường này. |

## Quyết định kiến trúc (đề xuất – cần xác nhận ở Open Questions)

- **D1 (F1):** Theo chính sách bảo mật đã có trong `01` §6.1/`03`/`04`: Access Token chỉ trong bộ nhớ (Pinia store auth của từng app), khởi động app / reload gọi `POST <base>/auth/refresh` bằng cookie `Path` riêng; **không** dùng `localStorage` cho token. `createClient` nhận `getAccessToken`/`refresh` thay cho `tokenKey`. Sửa `00` cho khớp (docs bảo mật thắng docs kiến trúc).
- **D2 (F2):** Thêm endpoint User-only `GET /api/v1/user-groups/me/members` (quyền `user_group:view`, chỉ nhóm của người gọi, chỉ trả trường danh bạ: họ tên, chức danh, máy lẻ, email, avatar, vai trò hiển thị; không trả trạng thái khóa/đăng nhập). Không nới `user:view` cho thành viên.
- **D3 (F3):** Admin App: Quản lý tài khoản Admin và Nhật ký kiểm toán là **tab** trong `/admin/settings` (khớp template `system-settings.html`), mỗi tab có `meta`/điều kiện quyền riêng (`admin:manage`, `audit:view`); soạn thông báo là action trong `/admin/notifications` (quyền `system:manage`); kho số là tab trong `/admin/prefixes`. Ghi rõ trong bảng route §5.3.3 cột ghi chú, bỏ tên `AdminManagementView.vue` hoặc khai báo là component con.
- **D4:** Quy ước tham chiếu thống nhất trong mọi module doc: dòng "Ánh xạ giao diện mẫu" liệt kê theo cổng – `Admin: templates/admin/x.html → apps/admin/src/views/.../XView.vue (route admin.x)`; `Member: templates/member/x.html → apps/member/...`. Màn hình chỉ một cổng ghi rõ "Chỉ Admin App" / "Chỉ Member App".

## Đồ thị phụ thuộc

```
D1 token (T1) ─────────────┐
D2 API danh bạ (T2) ───────┼──> 00 §5.3 bảng route chốt ──> module docs (T4, T5, T6) ──> 03_ui §8 (T7) ──> README/require (T8)
D3 route Admin (T3) ───────┘                                                              │
                                                                     backlog templates (T9) ┘──> rà soát cuối (T10)
```

T1–T3 sửa "nguồn chuẩn" (`00`, `02_api`, `10`) trước để các module doc trỏ về đúng. T4–T6 độc lập nhau (khác file) → có thể song song sau checkpoint 1.

## Danh sách task

Chi tiết tiêu chí nghiệm thu và kiểm tra ở `tasks/todo.md`.

### Phase 1 – Chốt nguồn chuẩn (rủi ro cao)
- [x] T1: Thống nhất lưu token & refresh cho 2 app (F1)
- [x] T2: Đặc tả màn hình Danh bạ nhóm + API thành viên nhóm (F2)
- [x] T3: Hoàn thiện bảng route Admin App cho chức năng còn thiếu (F3)

### Checkpoint 1
- [ ] `00`, `02_api`, `10`, `03`, `04` không còn nói khác nhau về token, API danh bạ, route Admin; người duyệt xác nhận D1–D3

### Phase 2 – Chuẩn hóa module docs theo 2 app
- [ ] T4: Module chỉ-Admin & kho số: `01`, `04`, `09`, `11` (F4, F5)
- [ ] T5: Module xác thực/hồ sơ/dashboard User: `03`, `05`, `08` (F4, F5)
- [ ] T6: Module dùng cả 2 cổng: `06`, `12`, `13`, `15` (F4, F5)

### Checkpoint 2
- [ ] Không còn tham chiếu template phẳng trong `docs/modules`; mọi view trong bảng route §5.3.3/5.3.4 có module doc đặc tả

### Phase 3 – Tài liệu tổng & backlog
- [ ] T7: Viết lại danh mục màn hình `03_ui_design.md` §8 theo 2 cổng (F6)
- [ ] T8: Cập nhật cây thư mục `README.md`, `require_for_writing_docs.md` (F7)
- [ ] T9: Ghi backlog sửa templates vào `docs/intent/docs-readiness-for-codegen.md` (T-a…T-e)
- [ ] T10: Rà soát cuối bằng lệnh grep + đối chiếu bảng route

### Checkpoint 3 – Hoàn tất
- [ ] Mọi lệnh kiểm tra ở T10 sạch; người duyệt đồng ý; commit theo từng phase

## Rủi ro & giảm thiểu

| Rủi ro | Mức | Giảm thiểu |
|---|---|---|
| D1 đổi cách lưu token làm lệch các TC đã viết (TC-USR-01, TC admin) | Trung bình | T1 rà toàn bộ chuỗi `localStorage`, `tokenKey`, `evn_*_token` trong docs; giữ TC hiện có vì chúng đã đúng hướng in-memory |
| D2 thêm endpoint mới làm `02_api` không còn là nguồn duy nhất nếu chỉ sửa module doc | Trung bình | Thêm endpoint vào `02_api` trước, module doc chỉ tham chiếu |
| Sửa diện rộng module docs gây lệch nội dung nghiệp vụ ngoài ý muốn | Thấp | Chỉ sửa dòng ánh xạ/đường dẫn và mục "Kiến trúc Frontend"; diff từng file được duyệt ở checkpoint |
| Templates vẫn lệch docs, agent chép theo template | Trung bình | `00` §6 #5 đã quy định docs thắng; T9 ghi backlog cụ thể |

## Câu hỏi mở (cần người duyệt trả lời trước T1–T3)

1. **D1** – Đồng ý Access Token chỉ trong bộ nhớ + refresh cookie (bỏ `localStorage` ở `00` §5.3.2)? Hay muốn giữ `localStorage` và sửa ngược `03`/`04`/`01` §6.1?
2. **D2** – Đồng ý endpoint mới `GET /api/v1/user-groups/me/members` cho Danh bạ nhóm? (Phương án khác: cấp `user:view` cho mọi vai trò User nhưng giới hạn trường trả về.)
3. **D3** – Quản lý Admin & Nhật ký kiểm toán là tab trong `/admin/settings` hay route riêng (`/admin/admins`, `/admin/audit-logs`)?
4. T9 – Chỉ ghi backlog templates, hay muốn sửa luôn `templates/` trong đợt này (sẽ thêm task)?
