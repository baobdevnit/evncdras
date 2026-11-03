# MODULE 09: HỒ SƠ & THIẾT LẬP CỦA QUẢN TRỊ VIÊN HỆ THỐNG (ADMIN PROFILE & SECURITY)
## Đường dẫn tài liệu: `docs/modules/09_admin_profile.md`
## Ánh xạ giao diện mẫu: `templates/profile.html` (Admin Mode), `templates/user-settings.html`

---

## 1. Mục tiêu & Nghiệp vụ (Business Overview)

### 1.1. Bối cảnh nghiệp vụ
Quản trị viên hạ tầng viễn thông (Admin Portal) của EVNICT nắm quyền quản lý toàn bộ hệ thống log và file ghi âm nhạy cảm:
1. **Quản lý hồ sơ cá nhân Quản trị viên**: Xem và cập nhật họ tên, số điện thoại trực ban, email công vụ, ảnh đại diện. Nhận diện cấp bậc rõ ràng giữa **Root Admin** và **System Admin**.
2. **Tiêu chuẩn An toàn thông tin cấp cao**:
   - Mật khẩu tối thiểu 10 ký tự (3 trong 4 loại ký tự), bắt đổi sau 90 ngày (`password_changed_at`). Chính sách áp dụng chung cho cả hai portal, ngưỡng cấu hình qua `system_settings` (`security_*`), chi tiết tại `docs/01_database_schema.md` mục 6.1.
   - Quản lý phiên đăng nhập đang hoạt động (Active Sessions): đọc từ bảng `auth_sessions` (`GET /api/v1/admin/auth/sessions`), cho phép thu hồi từng phiên từ xa (`DELETE /api/v1/admin/auth/sessions/:id`) khi nghi ngờ lộ lọt thông tin. Root Admin thu hồi được mọi phiên của admin khác.
   - Truy vết nhật ký hành động (Personal Audit Log): Xem lại lịch sử các tác vụ quản trị do chính tài khoản này thực hiện gần đây.
3. **Thiết lập Dashboard Quản trị**: ẩn/hiện và sắp thứ tự các widget của Dashboard Admin. Lưu ở `user_settings.custom_preferences.dashboardWidgets` (`user_type = ADMIN`) dạng mảng `[{ "key": "kpiCards", "visible": true, "order": 1 }, ...]`, qua `GET`/`PUT /api/v1/admin/profile/preferences`. Bộ `key` cố định: `kpiCards`, `poolWidget`, `quantityChart`, `qualityChart`, `topGroupsChart`, `groupMonitorTable`. Thiếu cấu hình thì dùng thứ tự mặc định như liệt kê.

---

## 2. Thiết kế Dữ liệu (Database Schema)

Dữ liệu lưu tại bảng `admins`, `user_settings` (`user_type = 'ADMIN'`) và truy vấn bảng `audit_logs`.

---

## 3. Đặc tả API Contracts

### 3.1. `GET /api/v1/admin/profile`
- **Guard**: `AdminAuthGuard`
- **Response**:
```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": 1,
    "username": "root.admin@evnict.vn",
    "email": "root.admin@evnict.vn",
    "fullName": "Quản trị viên Tối cao EVNICT",
    "phoneNumber": "02422222222",
    "avatarUrl": "https://ui-avatars.com/api/?name=Root+Admin",
    "status": "ACTIVE",
    "lastLoginAt": "2026-10-12T08:15:00+07:00",
    "roleCode": "ROOT_ADMIN",
    "roleName": "Quản trị viên tối cao",
    "permissions": ["cdr:view", "cdr:listen_audio", "cdr:download_audio", "admin:manage", "system:manage", "role:view"]
  }
}
```

### 3.2. `PUT /api/v1/admin/profile`
- Cập nhật `fullName`, `phoneNumber`, `avatarUrl`.

### 3.3. `PUT /api/v1/admin/profile/change-password`
- Đổi mật khẩu Quản trị viên. Body và quy tắc giống `PUT /api/v1/profile/change-password` (`docs/modules/08_user_profile.md` mục 3.4).
- **Response thành công** `200`: `{ "accessToken": "...", "expiresIn": 900 }` (token đầy đủ, kể cả khi gọi bằng token `PASSWORD_CHANGE_ONLY`), đặt cookie Refresh Token mới (phiên mới, hạn tuyệt đối 7 ngày), thu hồi mọi phiên khác (`PASSWORD_CHANGED`), cập nhật `password_changed_at = NOW()`, `must_change_password = 0`, ghi `audit_logs` `AUTH / PASSWORD_CHANGED`. Mật khẩu mới phải đạt chính sách và khác mật khẩu hiện tại (sai thì `400`).

### 3.4. `GET /api/v1/admin/profile/recent-activity`
- **Mục đích**: Lấy 20 hành động gần nhất của Admin từ bảng `audit_logs`.
- **Response**: Trả về thời gian, địa chỉ IP, hành động (`LISTEN_AUDIO`, `EXPORT_REPORT`, `UPDATE_SETTINGS`...).

---

## 4. Kiến trúc Backend NestJS (`backend/src/modules/admin-profile/`)

```
admin-profile/
├── admin-profile.module.ts
├── admin-profile.controller.ts
├── admin-profile.service.ts
└── dto/
    ├── update-admin-profile.dto.ts
    └── change-admin-password.dto.ts
```

---

## 5. Kiến trúc Frontend Vue 3 (`frontend/apps/admin/src/views/profile/AdminProfileView.vue`)

### 5.1. Bố cục Giao diện
- Kế thừa bố cục thẻ từ `templates/profile.html` nhưng áp dụng theme Quản trị:
  - Header: Huy hiệu vàng nổi bật `[Quản trị viên Tối cao]` hoặc xanh dương `[Kỹ thuật viên Quản trị]`.
  - Tab 1: Thông tin liên lạc trực ban.
  - Tab 2: Bảo mật tài khoản & Đổi mật khẩu.
  - Tab 3: Nhật ký kiểm toán cá nhân (Bảng hiển thị IP đăng nhập, thiết bị và các thao tác gần đây).

---

## 6. Kịch bản kiểm thử (Test Plan for Agent)
1. **TC-AP-01**: Admin đổi mật khẩu thành chuỗi dưới 10 ký tự, xác nhận hệ thống báo lỗi validation `Mật khẩu quản trị phải từ 10 ký tự trở lên`.
2. **TC-AP-02**: Xem tab "Nhật ký kiểm toán cá nhân", xác nhận hiển thị đúng lịch sử đăng nhập vừa thực hiện kèm IP client.

