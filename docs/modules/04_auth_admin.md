# MODULE 04: XÁC THỰC & QUẢN LÝ QUẢN TRỊ VIÊN HỆ THỐNG (ADMIN AUTH & ADMIN MANAGEMENT)
## Đường dẫn tài liệu: `docs/modules/04_auth_admin.md`
## Ánh xạ giao diện mẫu (chỉ khu vực Admin): `templates/admin/login.html` → `AdminLoginView.vue` (route `admin.login`); bố cục `templates/admin/system-settings.html` → mục `admins` của `SystemSettingsView.vue` (`/admin/settings?section=admins`)

---

## 1. Mục tiêu & Nghiệp vụ (Business Overview)

### 1.1. Bối cảnh & Nguyên tắc an toàn EVN
Hạ tầng viễn thông IP PABX của EVN đòi hỏi tính bảo mật tối thượng:
1. **Không chung bảng dữ liệu với người dùng**: Toàn bộ dữ liệu Quản trị viên hệ thống được lưu trữ trong bảng `admins`, tách biệt 100% với bảng `users` của các đơn vị. Điều này loại trừ hoàn toàn nguy cơ leo thang đặc quyền (Privilege Escalation) từ người dùng đơn vị lên quản trị hệ thống.
2. **Chứng thực độc lập (Independent Authentication)**:
   - Cơ chế ký JWT riêng biệt sử dụng `JWT_ADMIN_SECRET` (khác với `JWT_USER_SECRET`).
   - Token của User không thể dùng để gọi bất kỳ API nào trong tuyến `/api/v1/admin/*` và ngược lại.
3. **Phân cấp Root Admin (Super Admin Privilege)**:
   - Mỗi Admin mang đúng 1 vai trò, lưu ở bảng `admin_roles`: `ROOT_ADMIN` (Quản trị viên tối cao, do EVNICT chỉ định khi cài đặt hệ thống qua seed) hoặc `SYSTEM_ADMIN` (Quản trị viên hệ thống). Bảng `admins` không có cột vai trò hay quyền.
   - **Chỉ vai trò `ROOT_ADMIN` có quyền `admin:manage`**: tạo mới, chỉnh sửa, khóa hoặc xóa tài khoản của các Admin khác.
   - `SYSTEM_ADMIN` không có `admin:manage` nên không can thiệp được vào danh sách tài khoản Admin.
   - Kiểm tra quyền Admin chỉ xét vai trò trong `admin_roles` và quyền của vai trò trong `permission_roles` (`docs/modules/10_permissions_and_roles.md` mục 2.3).
   - Không ai có thể xóa hoặc khóa tài khoản Root Admin.

---

## 2. Thiết kế Dữ liệu (Database Schema)

Bảng MariaDB: `admins`, `admin_roles`, `roles`, `permission_roles`, `permissions` (xem `docs/01_database_schema.md` mục 3 và 7).

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
  4. Đọc vai trò từ `admin_roles` (join `roles`). Tạo Access Token (`security_access_token_minutes`, mặc định 15 phút) ký bằng `JWT_ADMIN_SECRET`, mang `sub`, `roleCode`; và Refresh Token (`security_refresh_token_days`, mặc định 7 ngày) lưu dạng băm vào `auth_sessions`. Chính sách đầy đủ tại `docs/01_database_schema.md` mục 6.1.
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
      "roleCode": "ROOT_ADMIN",
      "roleName": "Quản trị viên tối cao",
      "permissions": ["cdr:view", "cdr:listen_audio", "cdr:download_audio", "admin:manage", "system:manage", "role:view"]
    }
  }
}
```

### 3.2. Danh sách Quản trị viên (`GET /api/v1/admin/admins`)
- **Guard**: `AdminAuthGuard`, `Permission: admin:manage`
- Chỉ vai trò `ROOT_ADMIN` có quyền này. Mỗi dòng trả kèm `roleCode`, `roleName`.

### 3.3. Tạo mới Quản trị viên (`POST /api/v1/admin/admins`)
- **Guard**: `AdminAuthGuard`, `Permission: admin:manage`
- **Body**:
```json
{
  "username": "admin.hanoi",
  "email": "admin.hanoi@evnhanoi.vn",
  "fullName": "Kỹ thuật viên Trực ban EVNHANOI",
  "phoneNumber": "0912345678"
}
```
- Admin tạo qua API luôn mang vai trò `SYSTEM_ADMIN`: cùng transaction tạo dòng `admins` và dòng `admin_roles` (`role_id` của `SYSTEM_ADMIN`). Body không có trường vai trò.
- **Mật khẩu ban đầu do hệ thống sinh**: body không có `password`. Hệ thống sinh mật khẩu tạm 16 ký tự đạt chính sách (`docs/01_database_schema.md` mục 6.1), đặt `must_change_password = 1`, và trả **một lần** trong response (`temporaryPassword`); hệ thống chỉ lưu bản băm, không có API xem lại.
- **Lưu ý**: Không có API gán hoặc đổi vai trò Admin. Vai trò `ROOT_ADMIN` chỉ được gán qua seed ban đầu (`npm run seed:root`, `docs/01_database_schema.md` mục 3).

### 3.4. Khóa / Mở khóa Admin (`PUT /api/v1/admin/admins/:id/status`)
- **Guard**: `AdminAuthGuard`, `Permission: admin:manage`
- Chặn không cho phép khóa tài khoản chính mình hoặc tài khoản mang vai trò `ROOT_ADMIN`.

---

## 4. Kiến trúc Backend NestJS (`backend/src/core`, `apps/*`)

Theo quy tắc `docs/00_overview_and_architecture.md` mục 5.1: nghiệp vụ và entity ở `core`, controller ở `apps/admin` / `apps/member`, job nền ở `apps/worker`; các phần `apps/*` không import lẫn nhau.

```
backend/src/
├── core/admins/
│   ├── admins.module.ts
│   ├── admins.service.ts               <-- CRUD Admin, khóa/mở, reset mật khẩu (chặn thao tác lên ROOT_ADMIN)
│   └── entities/
│       └── admin.entity.ts
├── apps/admin/auth/
│   ├── admin-auth.module.ts
│   ├── admin-auth.controller.ts        <-- /api/v1/admin/auth/login, refresh, logout, me, sessions*
│   ├── admin-auth.service.ts           <-- đăng nhập Admin; ký JWT qua core/auth AdminJwtService, phiên qua AuthSessionsService
│   ├── strategies/
│   │   └── admin-jwt.strategy.ts
│   └── guards/
│       └── admin-auth.guard.ts
└── apps/admin/admins/
    ├── admin-admins.module.ts
    ├── admins.controller.ts            <-- /api/v1/admin/admins* (quyền admin:manage)
    └── dto/
        ├── create-admin.dto.ts
        └── update-admin.dto.ts
```

### 4.1. Phân quyền API quản lý Admin

Không có guard riêng cho Root Admin. Controller quản lý Admin dùng `PermissionsGuard` chung (`docs/modules/10_permissions_and_roles.md` mục 4.1):

```typescript
@Controller('admins') // AdminAppModule đăng ký RouterModule tiền tố 'admin' → /api/v1/admin/admins
@UseGuards(AdminAuthGuard, PermissionsGuard)
@RequirePermissions('admin:manage')
export class AdminsController { /* ... */ } // backend/src/apps/admin/admins/admins.controller.ts
```

Service chặn thao tác khóa/xóa trên tài khoản mang vai trò `ROOT_ADMIN` (`403`, ghi `audit_logs` `ACCESS_DENIED`).

---

## 5. Kiến trúc Frontend Vue 3 (chỉ khu vực Admin: `frontend/src/apps/admin/views/auth/AdminLoginView.vue` & `views/settings/sections/AdminAccountsSection.vue`)

### 5.1. Màn hình Đăng nhập Quản trị (`AdminLoginView.vue`, route `admin.login`)
- Giao diện thiết kế theo phong cách trang nghiêm của EVN (`templates/admin/login.html`, `templates/admin/login.css`):
  - Panel bên trái hiển thị Logo EVN (`logo_evn.svg`), tiêu đề "EVN CDR Analysis System - Quản trị hệ thống".
  - Panel bên phải: Form đăng nhập tài khoản Quản trị với nhãn cảnh báo đỏ nhỏ: "Khu vực dành riêng cho Quản trị viên hạ tầng viễn thông EVNICT".
  - Access Token Admin chỉ giữ trong bộ nhớ (Pinia store riêng của Admin Portal), không lưu `localStorage`; Refresh Token nằm trong cookie `HttpOnly` có `Path=/api/v1/admin/auth`, nên không xung đột với phiên của User Portal (chính sách tại `docs/01_database_schema.md` mục 6.1).

### 5.2. Quản lý Quản trị viên trong Cài đặt hệ thống
- Là mục `admins` (component `AdminAccountsSection.vue`) trong `SystemSettingsView.vue`, mở trực tiếp tại `/admin/settings?section=admins` (`docs/00_overview_and_architecture.md` mục 5.3.3, bảng "Chức năng đặt bên trong màn hình"). Không có route hay view riêng.
- Template `system-settings.html` chưa có mục này: dựng theo cùng bố cục `.settings-section` và bảng `.data-table` của template.
- Hiển thị danh sách các Admin, nhãn vai trò theo `roleCode` (`ROOT_ADMIN` nổi bật màu vàng gold); thao tác Thêm (hiển thị `temporaryPassword` một lần), Sửa, Khóa/Kích hoạt, Đặt lại mật khẩu, Thu hồi phiên, Ngừng hoạt động – theo các endpoint `/api/v1/admin/admins*`.
- Ẩn toàn bộ mục (cả nút trên menu `.settings-sidebar`) nếu tài khoản đang đăng nhập không có `admin:manage` (`!authAdminStore.permissions.includes('admin:manage')`).

---

## 6. Kịch bản kiểm thử (Test Plan for Agent)
1. **TC-ADM-01**: Đăng nhập bằng tài khoản Root Admin, xác nhận nhận được `roleCode: "ROOT_ADMIN"`, `permissions` có `admin:manage` và truy cập được danh sách Quản trị viên.
2. **TC-ADM-02**: Đăng nhập bằng `SYSTEM_ADMIN`, thử gọi API `POST /api/v1/admin/admins`, xác nhận hệ thống trả về lỗi `403 FORBIDDEN_PERMISSION`.
3. **TC-ADM-03**: Dùng Token của User để gọi API `GET /api/v1/admin/auth/me`, xác nhận hệ thống từ chối với lỗi `401 UNAUTHORIZED`.
4. **TC-ADM-04**: Thử xóa tài khoản Root Admin, xác nhận hệ thống từ chối và ghi nhận cảnh báo an ninh vào `audit_logs` (`action = ACCESS_DENIED`, `resource_name = ADMIN`).

