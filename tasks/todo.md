# Todo: Rà soát docs – 2 app riêng biệt (Admin App & Member App)

Kế hoạch và phát hiện (F1–F7, T-a…T-e), quyết định D1–D4: `tasks/plan.md`.
Chỉ sửa docs; không sửa `templates/`, `frontend/`, `backend/`.

---

## Phase 1 – Chốt nguồn chuẩn

### Task 1: Thống nhất lưu token & refresh cho 2 app (F1, D1)

**Mô tả:** Sửa `00` §5.2 và §5.3.2 để khớp chính sách bảo mật ở `01` §6.1, `03`, `04`: Access Token chỉ trong Pinia store auth của từng app, reload/khởi động gọi `POST <base>/auth/refresh` (cookie `Path=/api/v1/auth` hoặc `/api/v1/admin/auth`), 401 → thử refresh một lần rồi về login của app. `createClient` nhận `getAccessToken` + `refresh` + `onUnauthorized` thay `tokenKey`. Nêu rõ: đăng xuất một cổng không ảnh hưởng cổng kia vì cookie khác `Path`.

**Tiêu chí nghiệm thu:**
- [x] `00` không còn `localStorage`, `tokenKey`, `evn_admin_token`, `evn_user_token`
- [x] §5.3.2 quy tắc 5, 6 mô tả luồng refresh theo app, khớp `04` §5.1 và `03` TC-USR-01
- [x] Guard factory trong `packages/shared/router` mô tả theo store auth (không theo token key)

**Kiểm tra:**
- [x] `grep -rnE "localStorage|tokenKey|evn_(admin|user)_token" docs` chỉ còn câu phủ định ("không lưu localStorage")
- [x] Đọc lại `00` §5.3.2 cạnh `04` §5.1, `01` §6.1: không mâu thuẫn

**Phụ thuộc:** Không (cần trả lời Open Question 1)
**File:** `docs/00_overview_and_architecture.md` (có thể chạm `docs/modules/03_auth_user.md`, `04_auth_admin.md` nếu cần thêm câu tham chiếu)
**Quy mô:** S

### Task 2: Đặc tả màn hình Danh bạ nhóm + API thành viên nhóm (F2, D2)

**Mô tả:** Thêm endpoint User-only `GET /api/v1/user-groups/me/members` (`user_group:view`, chỉ nhóm của người gọi, phân trang + tìm theo tên/máy lẻ/email, trả trường danh bạ) vào `02_api` §3.2 cột Portal `USER`. Thêm mục "Kiến trúc Frontend" cho `GroupAdminView.vue` (dùng `/users*`, `PUT /users/:id/role`) và `GroupMembersView.vue` (dùng endpoint mới) trong `02_user_group`, ánh xạ `templates/member/group-admin.html`, `group-members.html`. Kiểm tra route `/group-members` ở `00` §5.3.4 vẫn đúng `user_group:view`.

**Tiêu chí nghiệm thu:**
- [x] Endpoint mới có trong `02_api` với Portal, quyền, response fields; không trả trạng thái khóa/phiên
- [x] `02_user_group` có đặc tả cả 2 view Member, ghi rõ vai trò nào thấy màn nào (GROUP_ADMIN thấy cả 2; thành viên chỉ Danh bạ)
- [x] Quyền mỗi route Member trong `00` §5.3.4 đều được cấp cho ít nhất các vai trò dự định theo ma trận `10` §2

**Kiểm tra:**
- [x] Đối chiếu từng dòng §5.3.4 với ma trận `10`: vai trò `REGULAR_USER` vào được `/group-members` và gọi được API của nó
- [x] `grep -n "group-members\|GroupMembersView" docs -r` có kết quả ở `00`, `02_api`, `02_user_group`

**Phụ thuộc:** Không (cần trả lời Open Question 2)
**File:** `docs/02_api_contracts.md`, `docs/modules/02_user_group.md`, `docs/00_overview_and_architecture.md`
**Quy mô:** M

### Task 3: Hoàn thiện bảng route Admin App (F3, D3)

**Mô tả:** Với mỗi endpoint `ADMIN` trong `02_api` chưa có màn hình (`/admin/admins*`, `/admin/audit-logs`, `POST /admin/notifications`, `/phone-numbers/pool*`, `/admin/qos/thresholds`, `/admin/stats/recalculate`), xác định nơi hiển thị (route hoặc tab của route nào, điều kiện quyền). Cập nhật `00` §5.3.3 (thêm cột/ghi chú tab), cây view §5.2 (thay `AdminManagementView.vue` bằng component tab nếu chọn phương án tab), và mục Frontend của `04`, `06`, `07`.

**Tiêu chí nghiệm thu:**
- [x] Mọi endpoint Portal `ADMIN` hoặc `USER + ADMIN` trong `02_api` đều truy được về ít nhất một route/tab ở §5.3.3
- [x] `04` §5 và `07` §5 dùng cùng tên view/tab; không còn tên view không có trong cây §5.2
- [x] Tab yêu cầu quyền khác route cha được ghi rõ (ẩn tab khi thiếu quyền)

**Kiểm tra:**
- [x] Liệt kê endpoint ADMIN: `grep -n "| ADMIN |\|/api/v1/admin/" docs/02_api_contracts.md` và đánh dấu từng cái → route/tab
- [x] `grep -rn "AdminManagementView" docs` khớp cây §5.2 hoặc không còn

**Phụ thuộc:** Không (cần trả lời Open Question 3)
**File:** `docs/00_overview_and_architecture.md`, `docs/modules/04_auth_admin.md`, `docs/modules/06_notifications.md`, `docs/modules/07_system_settings.md`
**Quy mô:** M

## Checkpoint 1: Sau Task 1–3
- [ ] Không còn mâu thuẫn token / API danh bạ / route Admin giữa `00`, `02_api`, `10`, `03`, `04`
- [ ] Bảng route §5.3.3, §5.3.4 là bản chốt; người duyệt xác nhận trước khi sửa module docs
- [ ] Commit: `docs: chốt token, route Admin và API danh bạ cho 2 app`

---

## Phase 2 – Chuẩn hóa module docs theo 2 app

Quy ước chung (D4) cho mỗi module: dòng "Ánh xạ giao diện mẫu" ghi theo cổng; mục "Kiến trúc Frontend" ghi đường dẫn Vue đầy đủ, route name (`admin.*` / `member.*`), base API; màn hình một cổng ghi "Chỉ Admin App" / "Chỉ Member App".

### Task 4: Module chỉ-Admin & kho số – `01`, `04`, `09`, `11`

**Mô tả:** Đổi tham chiếu template sang `templates/admin/...` (`01` organization, `04` login → `templates/admin/login.html` – hiện đang trỏ nhầm `templates/login.html` của Member, `09` profile/change-password/user-settings); `11` bổ sung phần Member: `OrgPrefixView.vue` ánh xạ `templates/member/org-prefix.html`, gọi `/api/v1/prefixes`, `/phone-numbers/pool` (bản User, chỉ nhóm mình). `09` bổ sung `ChangePasswordView`, `AccountSettingsView` Admin.

**Tiêu chí nghiệm thu:**
- [ ] 4 file không còn `templates/<file>` phẳng
- [ ] `11` đặc tả cả view Admin (`PrefixManagementView`, `PrefixHistoryView`) và Member (`OrgPrefixView`)
- [ ] Đường dẫn Vue khớp cây `00` §5.2

**Kiểm tra:**
- [ ] `grep -nE "templates/[a-z_-]+\.(html|css|js)" docs/modules/0{1,4,9}_*.md docs/modules/11_*.md` rỗng
- [ ] So từng đường dẫn Vue với `00` §5.2

**Phụ thuộc:** Checkpoint 1
**File:** `docs/modules/01_organization.md`, `04_auth_admin.md`, `09_admin_profile.md`, `11_core_business_phone_numbers.md`
**Quy mô:** M

### Task 5: Module User & dashboard – `03`, `05`, `08`

**Mô tả:** `03`: login → `templates/member/login.html`; `users.html` → `templates/admin/users.html` cho `UserListView`, `templates/member/group-admin.html` cho `GroupAdminView`. `05`: thay `templates/dashboard.html` / `member-dashboard.html` bằng `templates/admin/dashboard.html` / `templates/member/dashboard.html`, thêm đường dẫn Vue 2 `DashboardView` và API (`/api/v1/admin/dashboard/*` vs `/api/v1/dashboard/*`). `08`: template `templates/member/profile|user-settings|change-password.html`, thêm `AccountSettingsView`, `ChangePasswordView` Member.

**Tiêu chí nghiệm thu:**
- [ ] 3 file không còn template phẳng hay `member-dashboard`
- [ ] `05` nêu rõ 2 view, 2 base API, widget nào chỉ có ở Admin (`/admin/dashboard/groups`, kho số)
- [ ] `08` liệt kê đủ 3 view Member như bảng §5.3.4

**Kiểm tra:**
- [ ] `grep -nE "templates/[a-z_-]+\.(html|css|js)|member-dashboard" docs/modules/0{3,5,8}_*.md` rỗng

**Phụ thuộc:** Checkpoint 1 (T2 cho phần `GroupAdminView` của `03`)
**File:** `docs/modules/03_auth_user.md`, `05_dashboard_analytics.md`, `08_user_profile.md`
**Quy mô:** M

### Task 6: Module dùng cả 2 cổng – `06`, `12`, `13`, `15`

**Mô tả:** Đổi ánh xạ template sang cặp `templates/admin/x.html` + `templates/member/x.html`; mục Frontend ghi khác biệt giữa 2 view (bộ lọc nhóm/badge chỉ Admin; ẩn cột ghi âm theo Tầng 1 chỉ Member; namespace WebSocket `/admin/notifications` vs `/notifications`). `15` thêm đường dẫn Vue `ReportsView` cho cả 2 app (hiện chỉ có `templates/reports.html`).

**Tiêu chí nghiệm thu:**
- [ ] 4 file không còn template phẳng
- [ ] Mỗi file có bảng/đoạn "Khác biệt Admin vs Member" ngắn gọn
- [ ] Phần UI giống nhau trỏ component `packages/shared/components/...` (vd. `CdrTable`, `CdrDetailModal`, `AudioPlayerModal`)

**Kiểm tra:**
- [ ] `grep -nE "templates/[a-z_-]+\.(html|css|js)" docs/modules/{06,12,13,15}_*.md` rỗng (trừ `06` thư mục `templates/` email Handlebars của backend)

**Phụ thuộc:** Checkpoint 1
**File:** `docs/modules/06_notifications.md`, `12_core_business_cdr_and_audio.md`, `13_core_business_qos_analysis.md`, `15_core_business_reports_export.md`
**Quy mô:** M

## Checkpoint 2: Sau Task 4–6
- [ ] `grep -rnE "templates/[a-z_-]+\.(html|css|js)" docs/modules` chỉ còn template email backend
- [ ] Mọi view trong `00` §5.3.3 + §5.3.4 có ít nhất một module doc đặc tả
- [ ] Commit: `docs: chuẩn hóa module docs theo Admin App / Member App`

---

## Phase 3 – Tài liệu tổng & backlog

### Task 7: Danh mục màn hình `03_ui_design.md` §8 theo 2 cổng (F6)

**Mô tả:** Thay cây `templates/` phẳng bằng 2 cây `templates/admin/`, `templates/member/` đúng file thực tế; bảng 8.1 thêm cột "Cổng" và "View Vue / Route", bỏ `login_admin.html`, `users4group.html`, `member-dashboard`; giữ dòng `permissions.html`, `data-permissions.html` đánh dấu không triển khai.

**Tiêu chí nghiệm thu:**
- [ ] Mọi file `.html` trong `templates/admin` và `templates/member` có đúng một dòng trong bảng 8.1
- [ ] Không còn tên file không tồn tại

**Kiểm tra:**
- [ ] `ls templates/admin/*.html templates/member/*.html` đối chiếu với bảng
- [ ] `grep -n "login_admin\|users4group\|member-dashboard" docs/03_ui_design.md` rỗng

**Phụ thuộc:** Checkpoint 2
**File:** `docs/03_ui_design.md`
**Quy mô:** S

### Task 8: Cây thư mục `README.md`, `require_for_writing_docs.md` (F7)

**Mô tả:** Cập nhật cây dự án: `frontend/apps/admin`, `frontend/apps/member`, `frontend/packages/shared`, `templates/admin`, `templates/member`; README thêm một đoạn ngắn "2 ứng dụng frontend" trỏ `00` §5.3. Đổi link `file:///d:/...` tuyệt đối trong README sang link tương đối (nếu người duyệt đồng ý – lệch nhỏ cùng chỗ đang sửa).

**Tiêu chí nghiệm thu:**
- [ ] Cả 2 file thể hiện 2 app và 2 bộ template
- [ ] Không mâu thuẫn với `00` §5.2

**Kiểm tra:**
- [ ] Đọc lại cây thư mục so với `00` §5.2

**Phụ thuộc:** Checkpoint 2
**File:** `README.md`, `require_for_writing_docs.md`
**Quy mô:** XS

### Task 9: Backlog sửa templates (T-a…T-e)

**Mô tả:** Thêm các dòng vào mục "Việc cần sửa `templates/` (đợt sau)" của `docs/intent/docs-readiness-for-codegen.md`: link sidebar `permissions.html`/`data-permissions.html`; nút demo chuyển dashboard chéo cổng; `currentRole` trong `reports.js`; CSS mồ côi; ánh xạ link chuyển cổng sang `/login`, `/admin/login`; trường mock `extension` trong `group-members.js` (T-f).

**Tiêu chí nghiệm thu:**
- [ ] 5 mục có file cụ thể và hành động cần làm
- [ ] Không sửa file nào trong `templates/`

**Kiểm tra:**
- [ ] `git status templates` không có thay đổi

**Phụ thuộc:** Không (có thể làm bất kỳ lúc nào)
**File:** `docs/intent/docs-readiness-for-codegen.md`
**Quy mô:** XS

### Task 10: Rà soát cuối

**Mô tả:** Chạy toàn bộ lệnh kiểm tra, đối chiếu bảng route ↔ module docs ↔ `02_api` ↔ ma trận quyền `10`.

**Tiêu chí nghiệm thu:**
- [ ] `grep -rnE "templates/[a-z_-]+\.(html|css|js)" docs README.md` chỉ còn template email backend
- [ ] `grep -rnE "localStorage|tokenKey|evn_(admin|user)_token" docs` chỉ còn câu phủ định
- [ ] Mỗi route §5.3.3/5.3.4: view có trong cây §5.2, template tồn tại, quyền có trong `10`, API gọi tới có Portal phù hợp trong `02_api`

**Kiểm tra:**
- [ ] Ghi kết quả đối chiếu vào mô tả commit/PR

**Phụ thuộc:** Task 1–9
**File:** (chỉ đọc; sửa lặt vặt nếu phát hiện)
**Quy mô:** S

## Checkpoint 3: Hoàn tất
- [ ] Mọi tiêu chí T1–T10 đạt
- [ ] Người duyệt đồng ý; commit `docs: hoàn tất rà soát 2 app Admin/Member`
