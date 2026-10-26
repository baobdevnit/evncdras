# Statement of Intent: Phân Tách Giao Diện Thành 2 Bộ Template (Dual Portal)

## 1. Bối cảnh & Mục tiêu (Context & Objective)
- **Outcome:** Phân tách hoàn chỉnh thư mục `templates/` thành 2 bộ giao diện độc lập:
  - `templates/admin/`: Cổng Quản trị viên hệ thống (Root Admin Portal).
  - `templates/member/`: Cổng Đơn vị thành viên (Tenant / User Portal).
  - Thư mục gốc `templates/` được dọn dẹp sạch sẽ, chỉ còn chứa 2 thư mục con này.
- **User:** Đội ngũ phát triển Frontend/Backend, QA và các bên liên quan khi xây dựng, kiểm thử và chuyển đổi giao diện sang Vue 3.
- **Why now:** Chuẩn hóa theo kiến trúc Hai Cổng (Dual Portal Architecture) đã đặc tả trong `docs/00_overview_and_architecture.md`, loại bỏ hoàn toàn các thanh Role Simulator giả lập và chấm dứt tình trạng chồng chéo menu/tính năng giữa 2 vai trò.
- **Success Criteria:**
  1. `templates/admin/` và `templates/member/` hoạt động độc lập 100% (mỗi bên tự chứa `style.css`, `main.js`, `logo_evn.svg`, `login.html`, `dashboard.html`).
  2. Bóc tách triệt để các trang lẫn lộn (`cdr-history`, `reports`, `qos-debug`): loại bỏ Role Simulator; bản `admin/` có phạm vi toàn hệ thống và bộ lọc nhóm; bản `member/` cố định phạm vi đơn vị (dải số 51xxx) với vai trò Trưởng nhóm.
  3. Cây menu điều hướng được tổ chức chính xác theo vai trò (Admin không chứa trang con đơn vị; Member không chứa trang cấu hình hệ thống).
  4. Toàn bộ liên kết nội bộ `href`, `src` trỏ chính xác trong từng thư mục. Dọn dẹp sạch thư mục gốc `templates/`.
- **Constraint:** Bảo toàn nhận diện thương hiệu chuẩn EVN (xanh dương `#0033A0`, cam `#EA580C`, hỗ trợ Dark Mode & Light Mode), giữ nguyên vẹn tính thẩm mỹ và responsive.
- **Out of scope:** Chưa can thiệp vào mã nguồn trong `frontend/` (Vue 3) hay `backend/` (NestJS).

---

## 2. Các quyết định thiết kế đã thống nhất (Design Decisions)
1. **Quy chuẩn đặt tên đối xứng:**
   - Trong `templates/admin/`: `login.html` (chuyển đổi từ `login_admin.html`), `dashboard.html` (chuyển đổi từ `dashboard.html`).
   - Trong `templates/member/`: `login.html` (chuyển đổi từ `login.html`), `dashboard.html` (chuyển đổi từ `member-dashboard.html`).
2. **Loại bỏ Role Simulator:**
   - Cố định vai trò thật sự: `admin` là Toàn quyền hệ thống; `member` là Quản trị viên nhóm / Đơn vị thành viên EVNICT Đà Nẵng.
3. **Cấu trúc cây menu sidebar:**
   - **Admin Portal:**
     - Tổng quan (`dashboard.html`)
     - Thông báo (`notifications.html`)
     - Nhật ký cuộc gọi: Tra cứu CDR (`cdr-history.html`), Phân tích QoS (`qos-debug.html`), Báo cáo (`reports.html`)
     - Tổ chức: Danh mục tổ chức (`organization.html`), Quản lý đầu số (`prefix-management.html`), Lịch sử cấp phát (`prefix-history.html`)
     - Người dùng & Phân quyền: Nhóm người dùng (`user_group.html`), Người dùng (`users.html`), Vai trò (`roles.html`), Quyền hạn (`permissions.html`), Quyền theo dữ liệu (`data-permissions.html`)
     - Hệ thống: Cài đặt hệ thống (`system-settings.html`)
     - Tài khoản: Hồ sơ của tôi (`profile.html`), Đổi mật khẩu (`change-password.html`), Cài đặt tài khoản (`user-settings.html`)
   - **Member Portal:**
     - Tổng quan đơn vị (`dashboard.html`)
     - Thông báo (`notifications.html`)
     - Nhật ký cuộc gọi: Tra cứu CDR (`cdr-history.html`), Phân tích QoS (`qos-debug.html`), Báo cáo (`reports.html`)
     - Đầu số & Đơn vị: Đầu số nội bộ đơn vị (`org-prefix.html`)
     - Thành viên đơn vị: Quản trị nhóm (`group-admin.html`), Danh bạ nhóm (`group-members.html`)
     - Tài khoản: Hồ sơ của tôi (`profile.html`), Đổi mật khẩu (`change-password.html`), Cài đặt tài khoản (`user-settings.html`)
4. **Dọn dẹp thư mục gốc:**
   - Sau khi phân tách và kiểm tra hoàn tất, di chuyển/dọn dẹp các file lẻ tại thư mục cha `templates/` để chỉ giữ lại 2 thư mục con `templates/admin/` và `templates/member/`.
