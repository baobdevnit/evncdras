# MODULE 04: XÁC THỰC & QUẢN LÝ QUẢN TRỊ VIÊN HỆ THỐNG (ADMIN AUTH & ADMIN MANAGEMENT)
## Đường dẫn tài liệu: `docs/modules/04_auth_admin.md`
## Ánh xạ giao diện mẫu: `templates/login.html` (Admin Login Mode), `templates/system-settings.html` (Admin Accounts Tab)

---

## 1. Mục tiêu & Nghiệp vụ (Business Overview)

### 1.1. Bối cảnh & Nguyên tắc an toàn EVN
Hạ tầng viễn thông IP PABX của EVN đòi hỏi tính bảo mật tối thượng:
1. **Không chung bảng dữ liệu với người dùng**: Toàn bộ dữ liệu Quản trị viên hệ thống được lưu trữ trong bảng `admins`, tách biệt 100% với bảng `users` của các đơn vị. Điều này loại trừ hoàn toàn nguy cơ leo thang đặc quyền (Privilege Escalation) từ người dùng đơn vị lên quản trị hệ thống.
2. **Chứng thực độc lập (Independent Authentication)**:
   - Cơ chế ký JWT riêng biệt sử dụng `JWT_ADMIN_SECRET` (khác với `JWT_USER_SECRET`).
   - Token của User không thể dùng để gọi bất kỳ API nào trong tuyến `/api/v1/admin/*` và ngược lại.
3. **Phân cấp Root Admin (Super Admin Privilege)**:
   - Trong bảng `admins`, trường `is_root = 1` đại diện cho Quản trị viên tối cao (do EVNICT chỉ định khi cài đặt hệ thống).
   - **Chỉ duy nhất Root Admin mới có quyền tạo mới, chỉnh sửa quyền hạn, khóa hoặc xóa tài khoản của các Admin khác**.
   - Admin thông thường (`is_root = 0`) dù có vai trò quản trị nhưng không có quyền can thiệp vào danh sách tài khoản Admin.
   - Không ai có thể xóa hoặc khóa tài khoản Root Admin.

---

## 2. Thiết kế Dữ liệu (Database Schema)

Bảng MariaDB: `admins`, `roles`, `role_permissions`, `permissions` (vai trò suy ra từ `admins.is_root`, xem `docs/01_database_schema.md` mục 7).

> DDL chuẩn của `admins` (mục 3) chỉ định nghĩa tại `docs/01_database_schema.md`. Module này không chép lại DDL để tránh lệch; khi sinh code, entity và migration lấy từ `01`.

---

## 3. Đặc tả API Contracts

### 3.1. Đăng nhập Admin (`POST /api/v1/admin/auth/login`)
- **Request Body**:
```json
{
  "username": "root.admin@evnict.vn",
  "password": "RootSecurePassword2026!@",
  "rememberMe": true
}
```
- **Xử lý Backend**:
  1. Truy vấn `admins` theo `username_active` hoặc `email_active` (chỉ tài khoản chưa `INACTIVE`; không thấy thì ghi `LOGIN_FAILED` với `reason = UNKNOWN_USER`).
  2. Kiểm tra `status == 'ACTIVE'` (ngược lại `403`) và `locked_until` (còn hiệu lực thì `423` với body `{ "success": false, "statusCode": 423, "errorCode": "ACCOUNT_TEMPORARILY_LOCKED", "lockedUntil": "2026-10-26T09:45:00+07:00" }`).
  3. Xác thực `bcrypt.compare(password, admin.password_hash)`. Sai: tăng `failed_login_count`; đạt `security_login_max_failed` thì đặt `locked_until`. Đúng: đặt `failed_login_count = 0`.
  4. Tạo Access Token (`security_access_token_minutes`, mặc định 15 phút) ký bằng `JWT_ADMIN_SECRET`, và Refresh Token (`security_refresh_token_days`, mặc định 7 ngày) lưu dạng băm vào `auth_sessions`. Chính sách đầy đủ tại `docs/01_database_schema.md` mục 6.1.
  5. Nếu `must_change_password = 1` hoặc mật khẩu quá hạn: chỉ cấp Access Token `scope: "PASSWORD_CHANGE_ONLY"` (không có Refresh Token, xem `docs/01_database_schema.md` mục 6.1), response có `"mustChangePassword": true`.
  6. Cập nhật `last_login_at = NOW()`.
  7. Ghi Audit Log: `resource_name = AUTH`, `action = LOGIN` khi thành công; `LOGIN_FAILED` khi thất bại (kèm `action_details.reason`, `actor_id` NULL nếu username không tồn tại).
- **Refresh Token** gửi qua cookie `HttpOnly; Secure; SameSite=Strict; Path=/api/v1/admin/auth`, không nằm trong body response. `rememberMe = false` thì cookie không đặt `Max-Age` (mất khi đóng trình duyệt).
- **Response**:
```json
{
  "success": true,
  "statusCode": 200,
  "message": "Đăng nhập quản trị viên thành công",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900,
    "mustChangePassword": false,
    "admin": {
      "id": 1,
      "username": "root.admin@evnict.vn",
      "fullName": "Quản trị viên Tối cao EVNICT",
      "email": "root.admin@evnict.vn",
      "isRoot": true,
      "roleCode": "ROOT_ADMIN",
      "permissions": ["cdr:view", "cdr:listen_audio", "cdr:download_audio", "admin:manage", "system:manage", "role:manage"]
    }
  }
}
```

### 3.2. Danh sách Quản trị viên (`GET /api/v1/admin/admins`)
- **Guard**: `AdminAuthGuard`, `RootAdminOnlyGuard`
- Chỉ Root Admin mới có quyền gọi API này.

### 3.3. Tạo mới Quản trị viên (`POST /api/v1/admin/admins`)
- **Guard**: `AdminAuthGuard`, `RootAdminOnlyGuard`
- **Body**:
```json
{
  "username": "admin.hanoi",
  "email": "admin.hanoi@evnhanoi.vn",
  "fullName": "Kỹ thuật viên Trực ban EVNHANOI",
  "phoneNumber": "0912345678"
}
```
- Admin tạo qua API luôn có `is_root = 0`, nên vai trò suy ra là `SYSTEM_ADMIN`. Không có trường `roleIds`.
- **Mật khẩu ban đầu do hệ thống sinh**: body không có `password`. Hệ thống sinh mật khẩu tạm 16 ký tự đạt chính sách (`docs/01_database_schema.md` mục 6.1), đặt `must_change_password = 1`, và trả **một lần** trong response (`temporaryPassword`); hệ thống chỉ lưu bản băm, không có API xem lại.
- **Lưu ý**: Cấm tuyệt đối việc tạo admin mới với `is_root = 1` thông qua API. Trường `is_root` chỉ được set duy nhất qua DB Seed ban đầu.

### 3.4. Khóa / Mở khóa Admin (`PUT /api/v1/admin/admins/:id/status`)
- **Guard**: `AdminAuthGuard`, `RootAdminOnlyGuard`
- Chặn không cho phép khóa tài khoản chính mình hoặc tài khoản có `is_root = 1`.

---

## 4. Kiến trúc Backend NestJS (`backend/src/modules/admin-auth/` & `admin-management/`)

```
admin-auth/
├── admin-auth.module.ts
├── admin-auth.controller.ts
├── admin-auth.service.ts
├── strategies/
│   └── admin-jwt.strategy.ts
└── guards/
    ├── admin-auth.guard.ts
    └── root-admin-only.guard.ts
```

### 4.1. Implementation `RootAdminOnlyGuard`
```typescript
@Injectable()
export class RootAdminOnlyGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const admin = request.admin; // Đã gắn qua AdminAuthGuard
    if (!admin || !admin.isRoot) {
      throw new ForbiddenException('Chỉ Quản trị viên tối cao (Root Admin) mới có quyền thực hiện hành động này');
    }
    return true;
  }
}
```

---

## 5. Kiến trúc Frontend Vue 3 (`frontend/src/views/auth/AdminLoginView.vue` & `AdminManagementView.vue`)

### 5.1. Màn hình Đăng nhập Quản trị (`AdminLoginView.vue`)
- Giao diện thiết kế theo phong cách trang nghiêm của EVN (`templates/login.css`, `templates/login.html`):
  - Panel bên trái hiển thị Logo EVN (`logo_evn.svg`), tiêu đề "EVN CDR Analysis System - Quản trị hệ thống".
  - Panel bên phải: Form đăng nhập tài khoản Quản trị với nhãn cảnh báo đỏ nhỏ: "Khu vực dành riêng cho Quản trị viên hạ tầng viễn thông EVNICT".
  - Access Token Admin chỉ giữ trong bộ nhớ (Pinia store riêng của Admin Portal), không lưu `localStorage`; Refresh Token nằm trong cookie `HttpOnly` có `Path=/api/v1/admin/auth`, nên không xung đột với phiên của User Portal (chính sách tại `docs/01_database_schema.md` mục 6.1).

### 5.2. Quản lý Quản trị viên trong Cài đặt hệ thống
- Tích hợp vào Tab "Quản lý Quản trị viên" trong `SystemSettingsView.vue`.
- Hiển thị danh sách các Admin, nhãn `[Root Admin]` nổi bật màu vàng gold.
- Ẩn toàn bộ nút "Thêm Quản trị viên", "Khóa", "Xóa" nếu người đang đăng nhập không phải là Root Admin (`authAdminStore.isRoot !== true`).

---

## 6. Kịch bản kiểm thử (Test Plan for Agent)
1. **TC-ADM-01**: Đăng nhập bằng tài khoản Root Admin, xác nhận nhận được `isRoot: true` và quyền truy cập vào danh sách Quản trị viên.
2. **TC-ADM-02**: Đăng nhập bằng Admin thường (`isRoot: false`), thử gọi API `POST /api/v1/admin/admins`, xác nhận hệ thống trả về lỗi `403 FORBIDDEN`.
3. **TC-ADM-03**: Dùng Token của User để gọi API `GET /api/v1/admin/auth/me`, xác nhận hệ thống từ chối với lỗi `401 UNAUTHORIZED`.
4. **TC-ADM-04**: Thử xóa tài khoản Root Admin, xác nhận hệ thống từ chối và ghi nhận cảnh báo an ninh vào `audit_logs` (`action = ACCESS_DENIED`, `resource_name = ADMIN`).

