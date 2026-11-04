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
    "avatarUrl": "https://ui-avatars.com/api/?name=Tran+B",
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

- **Content-Type**: `multipart/form-data` (File ảnh `.png`, `.jpg`, dung lượng $\le 2\text{ MB}$).
- Lưu file rồi ghi luôn `users.avatar_url` của chính người gọi; response trả `avatarUrl` mới. Đây là cách duy nhất đổi ảnh đại diện. Ghi `audit_logs` `USER / UPDATE` (`action_details = { "changedFields": ["avatarUrl"] }`).

### 3.4. `PUT /api/v1/profile/change-password`

- **Response thành công** `200`: `{ "accessToken": "...", "expiresIn": 900 }` (token đầy đủ, kể cả khi gọi bằng token `PASSWORD_CHANGE_ONLY`), đặt cookie Refresh Token mới (phiên mới, hạn tuyệt đối 7 ngày), thu hồi mọi phiên cũ, kể cả phiên đang dùng (`PASSWORD_CHANGED`), cập nhật `password_changed_at = NOW()`, `must_change_password = 0`, ghi `audit_logs` `AUTH / PASSWORD_CHANGED`. Mật khẩu mới phải đạt chính sách và khác mật khẩu hiện tại (sai thì `400`).
- **Phiên**: mọi phiên cũ của tài khoản, **kể cả phiên đang dùng** để gọi API, bị thu hồi với `revoked_reason = 'PASSWORD_CHANGED'`; sau đó tạo đúng một phiên mới và trả cookie của phiên đó (`docs/01_database_schema.md` mục 6.1). Gọi bằng token `PASSWORD_CHANGE_ONLY` (chưa có phiên) thì chỉ tạo phiên mới.

- **Body**:

```json
{
  "currentPassword": "OldPassword123@",
  "newPassword": "NewSecurePassword2026!@",
  "confirmPassword": "NewSecurePassword2026!@"
}
```

- **Validation**: Kiểm tra `currentPassword` khớp với hash trong DB; `newPassword` phải khác mật khẩu cũ; hash mật khẩu mới trước khi lưu.

### 3.5. `GET /api/v1/profile/preferences` & `PUT /api/v1/profile/preferences`

- Lấy và lưu thiết lập: `theme`, `isSidebarCollapsed`, `itemsPerPage`, `emailNotificationEnabled`, `soundAlertEnabled`.
- `itemsPerPage` chỉ nhận `10`, `20`, `50` (mục 1.1, khớp `limit` của `GET /cdr`); `theme` chỉ nhận `LIGHT`, `DARK`, `SYSTEM`; giá trị khác trả `400`. `PUT` không ghi `audit_logs`.

### 3.6. Phiên đăng nhập của chính mình (`GET /api/v1/auth/sessions`, `DELETE /api/v1/auth/sessions/:id`)

- **Guard**: `UserAuthGuard` (không nhận token `PASSWORD_CHANGE_ONLY`). Chỉ thao tác trên phiên của chính người gọi (`actor_type = 'USER'`, `actor_id` = người gọi).
- **Phiên hiện tại**: cookie Refresh Token có `Path=/api/v1/auth` nên được gửi kèm hai API này; backend băm cookie (SHA-256) và so với `refresh_token_hash` để biết phiên hiện tại.
- **`GET`**: trả mảng (không phân trang) các phiên `revoked_at IS NULL AND expires_at > NOW()`, sắp `COALESCE(last_used_at, created_at)` giảm dần. Mỗi phần tử: `id`, `ipAddress`, `userAgent`, `createdAt` (lúc tạo dòng phiên; sau mỗi lần xoay vòng là lúc refresh gần nhất), `lastUsedAt`, `expiresAt` (hạn tuyệt đối, bằng lúc đăng nhập + `security_refresh_token_days`), `isCurrent`. API không trả tên thiết bị/trình duyệt ghép sẵn: frontend tự đọc từ `userAgent` (`docs/02_api_contracts.md` mục 2).
- **`DELETE /:id`**: không có body. `:id` đi theo chuỗi `replaced_by_session_id` như `docs/01_database_schema.md` mục 6.1.
  - `:id` không tồn tại hoặc không phải phiên của người gọi: `404`.
  - Phiên đích (sau khi đi theo chuỗi) là phiên hiện tại: `400`; kết thúc phiên hiện tại dùng `POST /auth/logout`. Frontend ẩn nút thu hồi ở dòng `isCurrent = true`.
  - Tới được phiên hiệu lực khác: thu hồi (`REVOKED_BY_SELF`), ghi `audit_logs` `AUTH / SESSION_REVOKED` (`resource_id` = id phiên bị thu hồi), trả `200` với `data = { "revoked": true }`.
  - Không tới được phiên hiệu lực (phiên đã hết hạn hoặc bị thu hồi vì lý do khác): không ghi gì, trả `200` với `data = { "revoked": false }`.

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
2. **TC-UP-02**: Nhập sai mật khẩu hiện tại khi đổi mật khẩu, xác nhận hệ thống báo lỗi 400 "Mật khẩu hiện tại không chính xác".
3. **TC-UP-03**: Bật Chế độ Tối (Dark Mode), đăng xuất rồi đăng nhập lại trên thiết bị khác, kiểm tra hệ thống vẫn giữ nguyên theme Dark Mode từ CSDL.
