# Kế hoạch thực thi: Phân tách template giao diện thành 2 bộ độc lập (templates/admin & templates/member)

## 1. Mục tiêu (Objective)
Tổ chức lại toàn bộ thư mục `templates/` thành 2 bộ giao diện hoàn chỉnh, độc lập 100% trong `templates/admin` và `templates/member`, loại bỏ các thanh Role Simulator và code lẫn lộn, chuẩn hóa menu sidebar theo đúng vai trò, và dọn dẹp sạch thư mục gốc `templates/`.

---

## 2. Bảng phân loại và ánh xạ tập tin (File Mapping Matrix)

| STT | Tập tin ban đầu | templates/admin | templates/member | Ghi chú xử lý |
|---|---|---|---|---|
| **A. TÀI NGUYÊN CHUNG (SHARED)** | | | | |
| 1 | `style.css` | `style.css` | `style.css` | Copy sang cả 2 thư mục |
| 2 | `logo_evn.svg` | `logo_evn.svg` | `logo_evn.svg` | Copy sang cả 2 thư mục |
| 3 | `main.js` | `main.js` | `main.js` | Copy sang cả 2 thư mục |
| 4 | `profile.*` | `profile.*` | `profile.*` | Chuẩn hóa menu theo từng cổng |
| 5 | `change-password.*` | `change-password.*` | `change-password.*` | Chuẩn hóa menu theo từng cổng |
| 6 | `user-settings.*` | `user-settings.*` | `user-settings.*` | Chuẩn hóa menu theo từng cổng |
| 7 | `notifications.*` | `notifications.*` | `notifications.*` | Chuẩn hóa menu theo từng cổng |
| **B. CỔNG ADMIN RIÊNG (ADMIN ONLY)** | | | | |
| 8 | `login_admin.*` | `login.*` | *(Không)* | Đổi tên thành login.* trong admin |
| 9 | `dashboard.*` | `dashboard.*` | *(Không)* | Dashboard quản trị viên toàn hệ thống |
| 10 | `organization.*` | `organization.*` | *(Không)* | Cây danh mục tổ chức EVN |
| 11 | `prefix-management.*` | `prefix-management.*` | *(Không)* | Quản lý dải số viễn thông |
| 12 | `prefix-history.*` | `prefix-history.*` | *(Không)* | Lịch sử cấp phát dải số |
| 13 | `users.*` | `users.*` | *(Không)* | Quản lý người dùng toàn hệ thống |
| 14 | `user_group.*` | `user_group.*` | *(Không)* | Quản lý nhóm người dùng |
| 15 | `roles.*` | `roles.*` | *(Không)* | Quản lý vai trò |
| 16 | `permissions.*` | `permissions.*` | *(Không)* | Quản lý quyền hạn |
| 17 | `data-permissions.*` | `data-permissions.*` | *(Không)* | Quản lý quyền dữ liệu & hành vi |
| 18 | `system-settings.*` | `system-settings.*` | *(Không)* | Cài đặt hệ thống PABX, FTP, QoS |
| **C. CỔNG MEMBER RIÊNG (MEMBER ONLY)** | | | | |
| 19 | `login.*` | *(Không)* | `login.*` | Trang đăng nhập cổng đơn vị |
| 20 | `member-dashboard.*` | *(Không)* | `dashboard.*` | Đổi tên thành dashboard.* trong member |
| 21 | `org-prefix.*` | *(Không)* | `org-prefix.*` | Danh mục đầu số nội bộ đơn vị |
| 22 | `group-admin.*` | *(Không)* | `group-admin.*` | Màn hình Quản trị nhóm (Trưởng nhóm) |
| 23 | `group-members.*` | *(Không)* | `group-members.*` | Màn hình Danh bạ nhóm (Thành viên) |
| **D. FILE LẪN LỘN VAI TRÒ (MIXED - REFACTOR & SPLIT)** | | | | |
| 24 | `cdr-history.*` | `cdr-history.*` (Toàn quyền, bộ lọc nhóm) | `cdr-history.*` (Nhóm 51xxx, quyền Trưởng nhóm) | Bỏ hoàn toàn thanh Role Simulator |
| 25 | `reports.*` | `reports.*` (Báo cáo toàn tập đoàn EVN) | `reports.*` (Báo cáo nội bộ nhóm 51xxx) | Cố định vai trò, loại bỏ chuyển vai trò |
| 26 | `qos-debug.*` | `qos-debug.*` (Phân tích toàn mạng) | `qos-debug.*` (Phân tích trong phạm vi nhóm) | Tách logic phân tích theo phạm vi |

*(Lưu ý: File cũ `users4group.*` đã được thay thế bởi `group-admin.*` và `group-members.*`, sẽ được lưu trữ hoặc loại bỏ trong bộ template mới).*

---

## 3. Danh sách công việc triển khai (Task Breakdown)

### Phase 1: Sao chép tài nguyên chung & các file riêng biệt
- [x] **Task 1.1:** Sao chép các tài nguyên dùng chung (`style.css`, `logo_evn.svg`, `main.js`, `profile.*`, `change-password.*`, `user-settings.*`, `notifications.*`) vào cả `templates/admin/` và `templates/member/`.
- [x] **Task 1.2:** Sao chép và chuẩn hóa các file riêng của Admin vào `templates/admin/` (đổi `login_admin.*` thành `login.*`, `dashboard.*`, `organization.*`, `prefix-management.*`, `prefix-history.*`, `users.*`, `user_group.*`, `roles.*`, `permissions.*`, `data-permissions.*`, `system-settings.*`).
- [x] **Task 1.3:** Sao chép và chuẩn hóa các file riêng của Member vào `templates/member/` (giữ `login.*`, đổi `member-dashboard.*` thành `dashboard.*`, `org-prefix.*`, `group-admin.*`, `group-members.*`).

### Phase 2: Bóc tách logic và giao diện các file dùng lẫn lộn 2 vai trò
- [x] **Task 2.1:** Bóc tách `cdr-history`:
  - Trong `templates/admin/cdr-history.*`: Xóa phần tử HTML `<div class="role-simulator-bar">` và `<select id="viewModeSelector">`. Cố định chế độ Admin (hiển thị bộ lọc nhóm, badge tên nhóm, toàn bộ cuộc gọi, có quyền nghe và tải ghi âm).
  - Trong `templates/member/cdr-history.*`: Xóa phần tử Role Simulator. Cố định chế độ Nhóm (ẩn bộ lọc nhóm, chỉ hiển thị cuộc gọi liên quan đến dải số đơn vị 51xxx, hiển thị trạng thái Trưởng nhóm có quyền nghe ghi âm).
- [x] **Task 2.2:** Bóc tách `reports`:
  - Trong `templates/admin/reports.*`: Cố định `state.currentRole = 'admin'`, hiển thị báo cáo toàn mạng EVN và bộ lọc chọn đơn vị.
  - Trong `templates/member/reports.*`: Cố định `state.currentRole = 'group'`, hiển thị số liệu nội bộ EVNICT Đà Nẵng, ẩn bộ chọn đơn vị khác.
- [x] **Task 2.3:** Bóc tách `qos-debug`:
  - Trong `templates/admin/qos-debug.*`: Quản trị viên hệ thống giám sát toàn bộ IP PABX mạng EVN.
  - Trong `templates/member/qos-debug.*`: Đơn vị thành viên giám sát chất lượng các số máy lẻ và dải số nội bộ đơn vị mình.

### Phase 3: Chuẩn hóa toàn bộ cây menu sidebar
- [x] **Task 3.1:** Đồng bộ sidebar chuẩn Admin cho tất cả các file HTML trong `templates/admin/`:
  - Menu gồm: Tổng quan, Thông báo, Nhật ký cuộc gọi (CDR, QoS, Báo cáo), Tổ chức (Danh mục tổ chức, Quản lý đầu số, Lịch sử cấp phát), Người dùng & Phân quyền (Nhóm người dùng, Người dùng, Vai trò, Quyền hạn, Quyền theo dữ liệu), Hệ thống (Cài đặt hệ thống), Tài khoản (Hồ sơ của tôi, Đổi mật khẩu, Cài đặt tài khoản).
  - Avatar & Footer: Quản trị viên - Quản lý cấp cao.
- [x] **Task 3.2:** Đồng bộ sidebar chuẩn Member cho tất cả các file HTML trong `templates/member/`:
  - Menu gồm: Tổng quan đơn vị (`dashboard.html`), Thông báo (`notifications.html`), Nhật ký cuộc gọi (CDR, QoS, Báo cáo), Đầu số & Đơn vị (`org-prefix.html`), Thành viên đơn vị (`group-admin.html`, `group-members.html`), Tài khoản (Hồ sơ của tôi, Đổi mật khẩu, Cài đặt tài khoản).
  - Avatar & Footer: Quản trị viên Nhóm - EVNICT Đà Nẵng (51xxx).

### Phase 4: Kiểm tra liên kết & Dọn dẹp thư mục gốc
- [x] **Task 4.1:** Kiểm tra liên kết nội bộ `href`, `src`, `link` trong từng thư mục đảm bảo không bị gãy hoặc trỏ nhầm ra ngoài.
- [x] **Task 4.2:** Dọn dẹp các file lẻ ở thư mục cha `templates/`, chỉ giữ lại `templates/admin/` và `templates/member/` theo đúng thỏa thuận.
- [x] **Task 4.3:** Kiểm tra tổng kết và nghiệm thu chất lượng.
