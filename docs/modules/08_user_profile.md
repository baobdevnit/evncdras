# MODULE 08: HỒ SƠ & THIẾT LẬP CỦA NGƯỜI DÙNG THÀNH VIÊN (USER PROFILE & PREFERENCES)

## Đường dẫn tài liệu: `docs/modules/08_user_profile.md`

## Ánh xạ giao diện mẫu (chỉ khu vực Member): `templates/member/profile.html`, `templates/member/change-password.html`, `templates/member/user-settings.html` (+ `.css`, `.js`) (bản tương ứng cho khu vực Admin thuộc `docs/modules/09_admin_profile.md`)

---

## 1. Mục tiêu & Nghiệp vụ (Business Overview)

### 1.1. Bối cảnh nghiệp vụ

Người dùng thành viên thuộc các đơn vị EVN có nhu cầu cá nhân hóa trải nghiệm làm việc và bảo vệ an toàn thông tin tài khoản:

1. **Quản lý thông tin cá nhân**: Cập nhật họ tên hiển thị, số điện thoại liên lạc, ảnh đại diện (avatar). Các thông tin hành chính như Tên đăng nhập, Email EVN, Đơn vị tổ chức và Nhóm QLND do Quản trị viên chỉ định nên hiển thị ở chế độ Chỉ đọc (Read-only).
2. **Bảo mật & Đổi mật khẩu**: Tự thay đổi mật khẩu định kỳ, tuân thủ chính sách mật khẩu mạnh của EVN (tối thiểu 10 ký tự, có ít nhất 3 trong 4 loại: chữ hoa, chữ thường, chữ số, ký tự đặc biệt; hết hạn sau 90 ngày, theo `docs/01_database_schema.md` mục 6.1).
3. **Tùy chỉnh giao diện & Thiết lập cá nhân (Preferences)**:
   - Giao diện Sáng / Tối / Theo hệ thống (`theme`: `LIGHT`, `DARK`, `SYSTEM`; mặc định `SYSTEM`, theo `user_settings.theme`).
   - Trạng thái thanh Sidebar thu gọn hoặc mở rộng mặc định.
   - Số lượng bản ghi hiển thị trên mỗi trang (`itemsPerPage`: 10, 20, 50).
   - Bật/tắt nhận thông báo qua email và âm thanh chuông khi có sự cố mới.

---

## 2. Thiết kế Dữ liệu (Database Schema)

Bảng MariaDB: `users` và `user_settings`.

> DDL chuẩn của `user_settings` (mục 12) chỉ định nghĩa tại `docs/01_database_schema.md`. Module này không chép lại DDL để tránh lệch; khi sinh code, entity và migration lấy từ `01`.

---

## 3. Đặc tả API Contracts

### 3.1. `GET /api/v1/profile`

- **Guard**: `UserAuthGuard`
- **Response**: Trả về chi tiết tài khoản user, thông tin nhóm QLND và đơn vị trực thuộc.

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "id": 10,
    "username": "tran.b",
    "email": "tran.b@71portal.vn",
    "fullName": "Trần Thị B",
    "jobTitle": "Trưởng nhóm Kỹ thuật Vận hành",
    "phoneNumber": "0912345678",
    "avatarUrl": "/media/avatars/8a1d2c3e-5b6f-4a7d-9e0f-1b2c3d4e5f60.jpg",
    "userGroup": {
      "id": 1,
      "name": "Khối Công nghệ Thông tin",
      "code": "UMO-IT"
    },
    "organization": {
      "id": 2,
      "name": "Khối Công nghệ Thông tin",
      "code": "IT-01"
    },
    "roleCode": "GROUP_ADMIN",
    "roleName": "Quản trị viên nhóm"
  }
}
```

### 3.2. `PUT /api/v1/profile`

- **Body**: `{ "fullName": "Trần Thị Bích", "phoneNumber": "0912345679" }`
- **Validation**: Không cho phép client gửi `email`, `username`, `roleCode` lên để can thiệp (vai trò chỉ đổi qua `PUT /users/:id/role`). Không nhận `avatarUrl` (ảnh chỉ đổi qua mục 3.3). Gửi các trường này thì trả `400`.
- Ghi `audit_logs` `USER / UPDATE` (`resource_id` = id người gọi, `action_details = { "changedFields": [...] }`).

### 3.3. `POST /api/v1/profile/avatar`

- Body, lưu trữ (`AVATAR_STORAGE_DIR`, `/media/avatars/<uuid>.<png|jpg>`), xử lý ảnh, lỗi và hành vi frontend theo đặc tả chung `docs/modules/09_admin_profile.md` mục 3.2.1 (một phần `file` ≤ 2 MB, PNG/JPEG theo magic bytes, cắt vuông 256×256, bỏ metadata, xóa file cũ sau commit). Đây là cách duy nhất đổi ảnh đại diện. Khác bản Admin:
  - Guard `UserAuthGuard`; bảng `users`; `audit_logs` `actor_type = 'USER'`, `resource_name = 'USER'`, `action = 'UPDATE'`, `action_details = { "changedFields": ["avatarUrl"] }`.
  - `data` = hồ sơ đủ trường như `GET /api/v1/profile` (mục 3.1).
  - *(Còn rà ở U08: nhóm `INACTIVE`, chế độ bảo trì `503`, mẫu `templates/member/profile.*`.)*

### 3.4. `PUT /api/v1/profile/change-password`

- Body, xử lý, response, lỗi và hành vi frontend theo đặc tả chung `docs/modules/09_admin_profile.md` mục 3.3 (body `currentPassword`, `newPassword`, `confirmPassword`; sai `currentPassword` trả `400` và tăng bộ đếm sai mật khẩu; thu hồi mọi phiên cũ kể cả phiên đang dùng (`PASSWORD_CHANGED`), tạo đúng một phiên mới chép `remember_me` của phiên theo claim `sid`; response `{ accessToken, expiresIn }` kèm cookie mới). Khác bản Admin:
  - Guard `UserAuthGuard` (nhận cả token `PASSWORD_CHANGE_ONLY`, verify bằng `JWT_USER_SECRET`); bảng `users`, `actor_type = 'USER'`; cookie mới `Path=/api/v1/auth`.
  - Access Token mới mang thêm `userGroupId` đọc lại từ CSDL, như đăng nhập (`docs/modules/03_auth_user.md` mục 3.1).
  - *(Còn rà ở U07: kiểm tra nhóm `INACTIVE`, chế độ bảo trì `503`, mẫu `templates/member/change-password.*`.)*

### 3.5. `GET /api/v1/profile/preferences` & `PUT /api/v1/profile/preferences`

- Lấy và lưu thiết lập: `theme`, `isSidebarCollapsed`, `itemsPerPage`, `emailNotificationEnabled`, `soundAlertEnabled`.
- `itemsPerPage` chỉ nhận `10`, `20`, `50` (mục 1.1, khớp `limit` của `GET /cdr`); `theme` chỉ nhận `LIGHT`, `DARK`, `SYSTEM`; giá trị khác trả `400`. `PUT` không ghi `audit_logs`.
- `GET`: xử lý, response, lỗi và cách frontend nạp/áp dụng theo bản Admin `docs/modules/09_admin_profile.md` mục 3.6, khác ở `UserAuthGuard`, `user_type = 'USER'`, store `preferencesUser`, khóa `localStorage` `memberTheme` và **không** có `dashboardWidgets`. *(Còn rà ở U11: nhóm `INACTIVE`, chế độ bảo trì `503`, mẫu `templates/member/user-settings.*`.)*
- `PUT`: body, xử lý (upsert theo `uniq_user_settings`, không ghi `audit_logs`), response, lỗi và cách frontend lưu (áp ngay, lỗi thì hoàn tác) theo bản Admin `docs/modules/09_admin_profile.md` mục 3.7, khác ở `UserAuthGuard`, `user_type = 'USER'`, store `preferencesUser` và **không** nhận `dashboardWidgets` (gửi thì `400` như trường lạ). *(Còn rà ở U12: nhóm `INACTIVE`, chế độ bảo trì `503`, mẫu `templates/member/user-settings.*`, nút theme ở `templates/member/main.js`.)*

### 3.6. Phiên đăng nhập của chính mình (`GET /api/v1/auth/sessions`, `DELETE /api/v1/auth/sessions/:id`)

- **Guard**: `UserAuthGuard` (không nhận token `PASSWORD_CHANGE_ONLY`). Chỉ thao tác trên phiên của chính người gọi (`actor_type = 'USER'`, `actor_id` = người gọi).
- **Phiên hiện tại**: xác định từ claim `sid` của Access Token, đi theo chuỗi `replaced_by_session_id` tới phiên còn hiệu lực, **không** từ cookie (đặc tả chung `docs/modules/09_admin_profile.md` mục 3.5).
- **`GET`**: query, xử lý, response (`data` là mảng các phiên còn hiệu lực, phiên hiện tại đứng đầu; mỗi phần tử `id`, `ipAddress`, `userAgent`, `loggedInAt`, `lastActiveAt`, `expiresAt`, `isCurrent`), lỗi và khối giao diện theo bản Admin `docs/modules/09_admin_profile.md` mục 3.5.1, khác ở `UserAuthGuard`, `actor_type = 'USER'`, bước 1 đọc `users`. *(Còn rà ở U09: nhóm `INACTIVE`, chế độ bảo trì `503`, mẫu `templates/member/profile.*`.)*
- **`DELETE /:id`**: request, xử lý (khóa và đi chuỗi `replaced_by_session_id`, xác định phiên hiện tại bằng đọc khóa sau khi khóa phiên đích), response `{ revoked }`, lỗi và cách frontend thu hồi (hộp xác nhận, tải lại danh sách) theo bản Admin `docs/modules/09_admin_profile.md` mục 3.5.2, khác ở `UserAuthGuard`, `actor_type = 'USER'`, bước 1 đọc `users`. Tóm tắt: `:id` không tồn tại hoặc không phải phiên của người gọi `404 NOT_FOUND`; phiên đích là phiên hiện tại `400 VALIDATION_ERROR` (`errors.id`, dùng `POST /auth/logout`); tới được phiên hiệu lực khác thì thu hồi (`REVOKED_BY_SELF`), ghi `audit_logs` `AUTH / SESSION_REVOKED` (`resource_id` = id phiên bị thu hồi), `200` `{ "revoked": true }`; không tới được thì không ghi gì, `200` `{ "revoked": false }`. *(Còn rà ở U10: nhóm `INACTIVE`, chế độ bảo trì `503`, mẫu `templates/member/profile.*`.)*

---

## 4. Kiến trúc Backend NestJS (`backend/src/core`, `apps/*`)

Theo quy tắc `docs/00_overview_and_architecture.md` mục 5.1: nghiệp vụ và entity ở `core`, controller ở `apps/admin` / `apps/member`, job nền ở `apps/worker`; các phần `apps/*` không import lẫn nhau.

```
backend/src/
├── core/profile/
│   ├── profile.module.ts
│   ├── profile.service.ts              <-- hồ sơ, avatar, preferences, đổi mật khẩu cho cả User và Admin (tham số user_type)
│   └── entities/
│       └── user-setting.entity.ts
└── apps/member/profile/
    ├── member-profile.module.ts
    ├── user-profile.controller.ts      <-- /api/v1/profile*
    └── dto/
        ├── update-profile.dto.ts
        ├── change-password.dto.ts
        └── update-preferences.dto.ts
```

---

## 5. Kiến trúc Frontend Vue 3 (chỉ khu vực Member)

| Route | View | Template nguồn | API |
| :--- | :--- | :--- | :--- |
| `/profile` (`member.profile`) | `src/apps/member/views/profile/UserProfileView.vue` | `templates/member/profile.html` | `GET`/`PUT /api/v1/profile`, `POST /api/v1/profile/avatar`, `/api/v1/auth/sessions*` |
| `/change-password` (`member.change-password`) | `src/apps/member/views/profile/ChangePasswordView.vue` | `templates/member/change-password.html` | `PUT /api/v1/profile/change-password` |
| `/account-settings` (`member.account-settings`) | `src/apps/member/views/settings/AccountSettingsView.vue` | `templates/member/user-settings.html` | `GET`/`PUT /api/v1/profile/preferences` |

Cả 3 route chỉ cần đăng nhập (không mã quyền). `ChangePasswordView` là route duy nhất mở được bằng token `PASSWORD_CHANGE_ONLY`: guard của khu vực Member chuyển mọi route khác về `member.change-password` khi `authUser` đang giữ token giới hạn; đổi mật khẩu thành công thì lưu Access Token mới trả về và vào `member.dashboard`.

### 5.1. Bố cục Giao diện (`UserProfileView.vue`, ánh xạ `templates/member/profile.html`)

- **Panel bên trái (`.profile-sidebar`)**:
  - Avatar cỡ lớn (`.profile-avatar-large`) kèm nút tải ảnh đại diện `.btn-change-avatar`.
  - Họ tên, nhãn vai trò `.role-badge`, email.
  - Các nút chuyển Tab: "Thông tin chung", "Bảo mật & Mật khẩu", "Cài đặt & Giao diện".
- **Panel bên phải (`.profile-content`)**:
  - Tab 1: Form cập nhật họ tên, điện thoại, các trường readonly đơn vị và quyền hạn.
  - Tab 2: Form đổi mật khẩu với nút bật/tắt mắt xem mật khẩu (`.eye-icon`).
  - Tab 3: Nhóm lựa chọn giao diện 3 giá trị Sáng / Tối / Theo hệ thống, thanh menu thu gọn, chọn số dòng hiển thị mỗi bảng.
- **Tích hợp đồng bộ Theme**:
  - Khi người dùng chọn giao diện, cập nhật trực tiếp `document.documentElement.setAttribute('data-theme', theme.toLowerCase())` (với `SYSTEM`: bỏ thuộc tính `data-theme` để theo `prefers-color-scheme` của trình duyệt) và gọi API lưu cấu hình.

---

## 6. Kịch bản kiểm thử (Test Plan for Agent)

1. **TC-UP-01**: Cập nhật họ tên mới, F5 trang kiểm tra họ tên trên Avatar góc phải Sidebar cập nhật tương ứng.
2. **TC-UP-02**: Nhập sai mật khẩu hiện tại khi đổi mật khẩu, xác nhận `400 VALIDATION_ERROR` với `errors.currentPassword = ["Mật khẩu hiện tại không đúng"]` và `users.failed_login_count` tăng 1 (`docs/modules/09_admin_profile.md` mục 3.3).
3. **TC-UP-03**: Bật Chế độ Tối (Dark Mode), đăng xuất rồi đăng nhập lại trên thiết bị khác, kiểm tra hệ thống vẫn giữ nguyên theme Dark Mode từ CSDL.
