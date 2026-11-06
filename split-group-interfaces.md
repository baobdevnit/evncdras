# Plan: Tách giao diện users4group.html thành group-admin.html và group-members.html

## Mục tiêu
Tách màn hình hiện tại `users4group.html` thành 2 giao diện chuyên biệt, độc lập hoàn toàn về HTML, CSS, và JS:
1. `group-admin.html` (+ `group-admin.css`, `group-admin.js`): Dành riêng cho Quản trị viên nhóm (Group Admin) - Đầy đủ tính năng quản trị nhân sự, thêm thành viên, đổi quyền Admin, reset mật khẩu, khóa/mở khóa tài khoản, ràng buộc BR-UG-01 & BR-UG-02.
2. `group-members.html` (+ `group-members.css`, `group-members.js`): Dành riêng cho Thành viên nhóm (User of Group) - Thiết kế dạng Thẻ danh bạ (Contact Cards/Grid) kết hợp bộ lọc tìm kiếm nhanh máy lẻ, email, chức danh, gọi/sao chép máy lẻ trực tiếp và xem chi tiết hồ sơ.

---

## Danh sách công việc (Task Breakdown)

- [x] **Task 1: Xây dựng Giao diện Quản trị viên nhóm (`group-admin.html`, `group-admin.css`, `group-admin.js`)**
  - Loại bỏ hoàn toàn thanh Role Simulator giả lập.
  - Tối ưu hóa Hero Card & Bảng danh sách thành viên với đầy đủ cột Hành động quản trị (Thêm, Sửa, Đổi Admin, Đổi Mật khẩu, Khóa tài khoản).
  - Giữ nguyên toàn bộ 7 modal quản trị và ràng buộc nghiệp vụ (BR-UG-01: không đổi nhóm; BR-UG-02: safeguard nhóm phải có tối thiểu 1 admin).
  - Tách CSS riêng (`group-admin.css`) và JS riêng (`group-admin.js`).

- [x] **Task 2: Xây dựng Giao diện Thành viên nhóm (`group-members.html`, `group-members.css`, `group-members.js`)**
  - Thiết kế trải nghiệm Thẻ danh bạ trực quan (Contact Cards Grid) hiện đại, thân thiện cho nhân viên tra cứu nội bộ.
  - Cung cấp thanh chuyển đổi chế độ xem: Dạng Thẻ danh bạ (Card View) và Dạng Bảng rút gọn (Table View).
  - Bổ sung các tính năng tiện ích tra cứu: Gọi máy lẻ (click-to-call/copy extension), gửi email nhanh (mailto:), sao chép thông tin liên hệ.
  - Tối ưu thẻ tóm tắt nhóm cho thành viên: Thông tin người đại diện nhóm, danh sách Quản trị viên hỗ trợ, nhóm đầu số PABX liên kết.
  - Tách CSS riêng (`group-members.css`) và JS riêng (`group-members.js`). Không chứa bất kỳ mã hay modal thêm/sửa/xóa của admin.

- [x] **Task 3: Cập nhật Sidebar Navigation & Chuyển hướng tương thích ngược**
  - Cập nhật menu "Người dùng" trên Sidebar: Bổ sung 2 mục rõ ràng: "Quản trị nhóm" (`group-admin.html`) và "Danh bạ nhóm" (`group-members.html`).
  - Cập nhật sidebar tại `group-admin.html`, `group-members.html`, `users.html`, `user_group.html`.
  - Cập nhật `users4group.html` làm trang điều hướng chuyển hướng nhanh (Redirect/Landing) tới `group-admin.html` để đảm bảo tương thích ngược cho các liên kết cũ.

- [x] **Task 4: Kiểm tra và Đánh giá tổng thể (Verification & Review)**
  - Kiểm tra tương thích giao diện trên Desktop và Mobile (Responsive).
  - Kiểm tra chức năng tìm kiếm, lọc, phân trang trên cả 2 giao diện.
  - Kiểm tra các modal quản trị và safeguard trên `group-admin.html`.
  - Kiểm tra tính năng thẻ danh bạ, sao chép máy lẻ và xem chi tiết trên `group-members.html`.
