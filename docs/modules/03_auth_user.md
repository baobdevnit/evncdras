# MODULE 03: XÁC THỰC & QUẢN LÝ NGƯỜI DÙNG ĐƠN VỊ (USER AUTH & USER MANAGEMENT)

## Đường dẫn tài liệu: `docs/modules/03_auth_user.md`

## Ánh xạ giao diện mẫu: `templates/login.html` (Đăng nhập), `templates/users.html` (Quản lý User)

---

## 1. Mục tiêu & Nghiệp vụ (Business Overview)

### 1.1. Bối cảnh nghiệp vụ

Hệ thống EVN CDR AS phân tách người dùng thành hai tầng dữ liệu độc lập:

1. **Admin Portal**: Quản trị viên hệ thống (Lưu tại bảng `admins`, mô tả tại Module 04).
2. **User Portal**: Cán bộ, kỹ sư, nhân viên các đơn vị trực thuộc EVN (Lưu tại bảng `users`).

### 1.2. Quy tắc nghiệp vụ cốt lõi

1. **Người dùng luôn thuộc một nhóm người dùng cố định ngay từ lúc tạo (Không chuyển nhóm)**:
   - Mọi tài khoản `users` bắt buộc phải được gán vào đúng một nhóm người dùng (`user_group_id NOT NULL`) ngay thời điểm khởi tạo (bản chất là người dùng thuộc về đơn vị tổ chức sở hữu nhóm đó).
   - **Tính bất biến (Immutability)**: Thuộc tính `user_group_id` là bất biến. Hệ thống **tuyệt đối không có khái niệm chuyển người dùng giữa các nhóm** (No Group Transfer).
   - Khi cập nhật thông tin người dùng (`PUT /api/v1/users/:id`), trường `user_group_id` không được phép chỉnh sửa. Nếu nhân sự chuyển đơn vị công tác: đặt tài khoản cũ `status = INACTIVE`, rồi tạo tài khoản mới ở nhóm mới, **được dùng lại cùng `username`/`email`** (ràng buộc UNIQUE chỉ áp cho tài khoản chưa `INACTIVE`, qua cột ảo `username_active`/`email_active`, `docs/01_database_schema.md` mục 6). Lịch sử của tài khoản cũ giữ nguyên. Kích hoạt lại tài khoản `INACTIVE` mà username/email đã có tài khoản khác đang dùng thì trả `409`.
2. **Thẩm quyền tạo người dùng (Quản trị hệ thống & Quản trị nhóm)**:
   - Tài khoản người dùng có thể được tạo ra bởi 2 chủ thể:
     - **Quản trị viên hệ thống (System Admin / Root Admin)**: Thuộc tầng Quản trị (`admins`), có toàn quyền tạo tài khoản người dùng cho bất kỳ Nhóm người dùng nào trong toàn hệ thống (tùy ý chỉ định `userGroupId`).
     - **Quản trị viên nhóm (Group Admin)**: Bản chất **cũng là một thành viên trong nhóm nhưng được phân quyền quản trị** (mang vai trò `GROUP_ADMIN` trong `user_roles`). Group Admin có thẩm quyền tạo tài khoản người dùng mới nhưng **chỉ được phép tạo trong phạm vi nhóm người dùng của chính mình** (`userGroupId` tự động gán cố định theo nhóm của Group Admin, không thể chọn nhóm khác).
3. **Quy tắc Quản trị viên nhóm (Group Admin Rule & Safeguard)**:
   - Mỗi nhóm người dùng phải có **ít nhất một người dùng `ACTIVE` mang vai trò `GROUP_ADMIN`**.
   - Mỗi người dùng mang đúng 1 vai trò trong `user_roles`: `GROUP_ADMIN` (Quản trị viên nhóm), `USER_RECORDING` (Thành viên nghe ghi âm) hoặc `REGULAR_USER` (Thành viên). Bảng `users` không có cột vai trò hay quyền.
   - Group Admin có thẩm quyền: Tạo mới thành viên trong nhóm của mình, sửa thông tin, đặt lại mật khẩu, và đổi vai trò thành viên trong nhóm (bổ nhiệm/hạ quyền `GROUP_ADMIN`; chuyển `REGULAR_USER` ↔ `USER_RECORDING`) qua `PUT /users/:id/role` (`docs/modules/10_permissions_and_roles.md` mục 1.3).
   - Kiểm tra quyền người dùng: quyền nhóm trước (`user_groups.status`, `allow_recording_access`), sau đó quyền của vai trò (`docs/modules/10_permissions_and_roles.md` mục 2.3).
   - Group Admin không được phép quản lý hoặc xem dữ liệu của nhóm khác.
   - **Bảo toàn Group Admin**: Khi một user là Group Admin duy nhất của một nhóm, hệ thống không cho phép thu hồi quyền Group Admin hoặc xóa/khóa tài khoản đó cho đến khi đã chỉ định một Group Admin khác thay thế (do không có thao tác chuyển nhóm).
4. **Phạm vi truy cập dữ liệu (Data Scope)**:
   - Thành viên thường chỉ xem được dữ liệu CDR của các máy nhánh/đầu số thuộc nhóm người dùng của mình.
   - Không thể can thiệp vào cấu hình hệ thống hay dữ liệu ngoài phạm vi nhóm.

---

## 2. Thiết kế Dữ liệu (Database Schema)

Bảng MariaDB: `users`, `user_roles`, `user_groups`, `roles`, `permission_roles`, `permissions` (xem `docs/01_database_schema.md` mục 6 và 7).

> DDL chuẩn của `users` (mục 6) chỉ định nghĩa tại `docs/01_database_schema.md`. Module này không chép lại DDL để tránh lệch; khi sinh code, entity và migration lấy từ `01`.

---

## 3. Đặc tả API Contracts

### 3.1. Đăng nhập User (`POST /api/v1/auth/login`)

- **Request Body**:

```json
{
  "username": "cdr.evnit@evn.com.vn",
  "password": "Password123@",
  "rememberMe": true
}
```

- **Validation**:
  - Trường `username` nhận **username hoặc email**: tìm theo `username_active`, nếu không thấy thì theo `email_active` (chỉ tài khoản chưa `INACTIVE`). Không thấy thì trả `401` và ghi `LOGIN_FAILED` (`reason = UNKNOWN_USER`).
  - Kiểm tra `status == 'ACTIVE'`. Nếu `LOCKED`, trả về `403 FORBIDDEN: Tài khoản đã bị khóa` (tài khoản `INACTIVE` không tìm thấy qua `username_active` nên trả `401`). Nhóm của user có `status = 'INACTIVE'` cũng trả `403`.
  - Nếu `locked_until > NOW()` (khóa tạm do sai mật khẩu), trả về `423` với body `{ "success": false, "statusCode": 423, "errorCode": "ACCOUNT_TEMPORARILY_LOCKED", "lockedUntil": "2026-10-26T09:45:00+07:00" }`.
  - Sai mật khẩu: tăng `failed_login_count`; đạt `security_login_max_failed` (mặc định 5) thì `locked_until = NOW() + security_lockout_minutes` (mặc định 15 phút). Đúng: đặt `failed_login_count = 0`.
- **`rememberMe`**: `false` thì cookie Refresh Token không đặt `Max-Age` (mất khi đóng trình duyệt); hạn phiên phía server vẫn là 7 ngày.
- **Token**: Access Token 15 phút (ký `JWT_USER_SECRET`, mang `sub`, `userGroupId`, `roleCode` đọc từ `user_roles` lúc cấp), Refresh Token 7 ngày lưu dạng băm trong `auth_sessions` và gửi qua cookie `HttpOnly; Secure; SameSite=Strict; Path=/api/v1/auth`, không nằm trong body. Nếu `must_change_password = 1` hoặc mật khẩu quá 90 ngày: chỉ cấp Access Token `scope: "PASSWORD_CHANGE_ONLY"` (không có Refresh Token), `mustChangePassword: true`. Chính sách đầy đủ tại `docs/01_database_schema.md` mục 6.1.
- **Response**:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Đăng nhập thành công",
  "data": {
    "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 900,
    "mustChangePassword": false,
    "user": {
      "id": 10,
      "username": "cdr.evnit@evn.com.vn",
      "fullName": "Trần Thị B",
      "email": "tran.b@71portal.vn",
      "avatarUrl": "https://ui-avatars.com/api/?name=Tran+B",
      "userGroup": {
        "id": 1,
        "name": "Khối Công nghệ Thông tin",
        "organizationId": 2,
        "organizationName": "Khối CNTT",
        "allowRecordingAccess": true
      },
      "roleCode": "GROUP_ADMIN",
      "roleName": "Quản trị viên nhóm",
      "permissions": ["cdr:view", "cdr:listen_audio", "cdr:download_audio", "user:view", "user:create", "user:edit", "group:manage_admin", "group:toggle_recording"]
    }
  }
}
```

### 3.2. Lấy thông tin cá nhân hiện tại (`GET /api/v1/auth/me`)

- **Headers**: `Authorization: Bearer <accessToken>`
- Trả về payload tương tự đối tượng `user` khi login để Vue Frontend khôi phục Auth State khi reload trang.
- `permissions` là quyền hiệu lực: quyền của vai trò, bỏ `cdr:listen_audio`/`cdr:download_audio` khi nhóm có `allowRecordingAccess = false` (`docs/modules/10_permissions_and_roles.md` mục 2.3).

### 3.3. Danh sách người dùng (`GET /api/v1/users`)

- **Scoped Query**:
  - Nếu là System Admin: Xem được user của mọi đơn vị.
  - Nếu là Group Admin: Chỉ xem được user có `user_group_id` bằng nhóm của mình.
- **Query Params**: `page=1`, `limit=10`, `userGroupId=1`, `search=nguyen`, `status=ACTIVE`

### 3.4. Tạo người dùng mới (`POST /api/v1/users`)

- **Thẩm quyền thực hiện (Authorization)**:
  - **Quản trị viên hệ thống (System Admin)**: Được phép chỉ định `userGroupId` tùy ý hợp lệ trong danh mục nhóm người dùng.
  - **Quản trị viên nhóm (Group Admin)**: Hệ thống tự động gán `userGroupId = req.user.userGroupId`. Nếu Group Admin cố tình truyền `userGroupId` khác nhóm của mình, hệ thống trả về mã lỗi `403 FORBIDDEN: Quản trị viên nhóm chỉ có quyền tạo người dùng cho nhóm của mình`.
- **Ràng buộc tạo tài khoản**:
  - `userGroupId`: Bắt buộc (`NOT NULL`). Người dùng luôn gắn cố định với nhóm người dùng ngay từ lúc khởi tạo.
  - Không có tùy chọn khởi tạo người dùng mà không thuộc nhóm nào.
- **Request Body**:

```json
{
  "userGroupId": 1,
  "username": "nguyen.vanc",
  "email": "vanc@evn.com.vn",
  "fullName": "Nguyễn Văn C",
  "phoneNumber": "0987654321",
  "roleCode": "REGULAR_USER"
}
```

- **Mật khẩu ban đầu do hệ thống sinh**: body không có `password`. Hệ thống sinh mật khẩu tạm 16 ký tự đạt chính sách (`docs/01_database_schema.md` mục 6.1), đặt `must_change_password = 1`, và trả **một lần** trong response (`temporaryPassword`); hệ thống chỉ lưu bản băm, không có API xem lại.
- `roleCode` tùy chọn, mặc định `REGULAR_USER`; chỉ nhận `GROUP_ADMIN`, `USER_RECORDING`, `REGULAR_USER`. Gán `GROUP_ADMIN` cần thêm `group:manage_admin`; gán `USER_RECORDING` cần thêm `group:toggle_recording` và nhóm có `allow_recording_access = 1` (ngược lại `409 GROUP_RECORDING_DISABLED`).
- Cùng transaction tạo dòng `users` và dòng `user_roles`. Response trả về `roleCode`, `roleName`.

- Mật khẩu được mã hóa `bcrypt.hash(password, 10)` trước khi lưu vào CSDL.

### 3.5. Cập nhật thông tin người dùng (`PUT /api/v1/users/:id`)

- **Mục đích**: Chỉnh sửa họ tên, số điện thoại, ảnh đại diện, trạng thái tài khoản (`status`). Không nhận `roleCode`: vai trò chỉ thay đổi qua API 3.6.
- **Quy tắc bất biến nhóm (Group Immutability Rule)**:
  - **Nghiêm cấm thay đổi `user_group_id`**: Người dùng gắn liền với đơn vị tổ chức/nhóm người dùng suốt vòng đời tài khoản. Tuyệt đối không có khái niệm chuyển người dùng giữa các nhóm.
  - Nếu request body có truyền `userGroupId` khác với nhóm hiện tại của người dùng, hệ thống chặn với mã lỗi `400 BAD REQUEST: Thuộc tính nhóm người dùng là cố định từ lúc tạo, không thể thay đổi hoặc chuyển nhóm`.

### 3.6. Đổi vai trò người dùng (`PUT /api/v1/users/:id/role`)

- **Body**: `{ "roleCode": "GROUP_ADMIN" | "USER_RECORDING" | "REGULAR_USER" }`.
- Quyền cần, điều kiện và xử lý: đặc tả tại `docs/modules/10_permissions_and_roles.md` mục 1.3 và 3.2.
- Hạ quyền Quản trị viên nhóm `ACTIVE` cuối cùng của nhóm bị từ chối `409` với thông báo: "Nhóm người dùng bắt buộc phải có ít nhất 1 quản trị viên".
- Không còn các endpoint `PUT /users/:id/group-admin` và `PATCH /user-groups/:id/members/:userId/recording-access`.

---

## 4. Kiến trúc Backend NestJS (`backend/src/modules/user-auth/` & `users/`)

```
user-auth/
├── user-auth.module.ts
├── user-auth.controller.ts
├── user-auth.service.ts
├── strategies/
│   └── user-jwt.strategy.ts
└── guards/
    └── user-auth.guard.ts

users/
├── users.module.ts
├── users.controller.ts
├── users.service.ts
├── dto/
│   ├── create-user.dto.ts
│   ├── update-user.dto.ts
│   └── user-query.dto.ts
└── entities/
    └── user.entity.ts
```

### 4.1. Implementation `UserJwtStrategy`

```typescript
@Injectable()
export class UserJwtStrategy extends PassportStrategy(Strategy, 'user-jwt') {
  constructor(private readonly configService: ConfigService, private readonly userRepo: UserRepository) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_USER_SECRET'),
    });
  }

  async validate(payload: { sub: number; username: string; userGroupId: number; roleCode: string }) {
    const user = await this.userRepo.findUserWithGroup(payload.sub);
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Tài khoản không hợp lệ hoặc đã bị khóa');
    }
    return { ...user, roleCode: payload.roleCode }; // Gắn vào req.user; PermissionsGuard dùng roleCode
  }
}
```

---

## 5. Kiến trúc Frontend Vue 3 (`frontend/src/views/users/UserListView.vue`)

### 5.1. Bố cục Split-View (Theo `templates/users.html`)

- **Bên trái (`.group-sidebar`)**:
  - Danh sách nhóm người dùng (`.group-list`, `.group-item`).
  - Hỗ trợ tìm kiếm nhóm nhanh (`#groupSearchInput`).
  - Chọn nhóm người dùng để lọc tức thời danh sách user bên phải, hiển thị badge đếm số lượng người dùng trực thuộc và thông tin Quản trị viên nhóm.
- **Bên phải (`.user-content`)**:
  - Thanh tìm kiếm người dùng theo từ khóa (họ tên, email, tên đăng nhập), bộ lọc theo vai trò (Quản trị viên nhóm / Thành viên nghe ghi âm / Thành viên).
  - Bảng người dùng:
    - Cột Người dùng: Avatar tròn, Họ tên, Username, Email.
    - Cột Nhóm người dùng: Tên nhóm, Mã nhóm (`UMO-IT-01`,...).
    - Cột Vai trò trong nhóm: Huy hiệu theo `roleCode` (`<span class="badge-role admin">★ Quản trị viên nhóm</span>`, Thành viên nghe ghi âm, Thành viên), kèm chức danh chuyên môn.
    - Cột Ngày tham gia.
    - Cột Trạng thái (`<span class="badge-status active">Hoạt động</span>` / `<span class="badge-status inactive">Khóa</span>`).
    - Cột Hành động: Sửa thông tin, Xóa tài khoản.
- Modal tạo mới / sửa người dùng (`#userModal`): Form nhập thông tin người dùng và chọn Nhóm người dùng (`user_group_id`), chọn vai trò (`roleCode`: Quản trị viên nhóm / Thành viên nghe ghi âm / Thành viên) khi tạo mới; khi sửa, đổi vai trò gọi `PUT /users/:id/role`. Không phụ thuộc hay tham chiếu trực tiếp đến tổ chức.

### 5.2. Quản lý trạng thái Pinia Store (`useUserStore`)

- State: `users: UserItem[]`, `total: number`, `selectedGroupId: number | null` (null = mọi nhóm, chỉ Admin), `loading: boolean`.
- Actions: `fetchUsers()`, `createUser()`, `updateUser()`, `changeRole()`, `toggleStatus()`, `resetPassword()`.

---

## 6. Kịch bản kiểm thử (Test Plan for Agent)

1. **TC-USR-01**: Đăng nhập bằng tài khoản user hợp lệ, kiểm tra nhận về Access Token (chỉ giữ trong Pinia, không có trong `localStorage`) và cookie Refresh Token `HttpOnly`; có 1 dòng mới trong `auth_sessions`.
2. **TC-USR-02**: Đăng nhập sai mật khẩu 5 lần liên tiếp, kiểm tra lần thứ 6 (kể cả đúng mật khẩu) trả về `423 LOCKED`; sau 15 phút đăng nhập đúng được và `failed_login_count` về 0.
   - **TC-USR-02b**: Dùng lại một Refresh Token đã được xoay vòng, kiểm tra mọi phiên của tài khoản bị thu hồi (`revoked_reason = 'REUSE_DETECTED'`).
3. **TC-USR-03**: Gọi `PUT /users/:id/role` đổi Quản trị viên nhóm duy nhất trong nhóm sang `REGULAR_USER`, kiểm tra hệ thống chặn `409` với cảnh báo thích hợp và `user_roles` không đổi.
4. **TC-USR-04**: Group Admin tạo người dùng mới trong nhóm của mình, xác nhận có dòng `user_roles` với vai trò `REGULAR_USER` và người dùng mới tạo có thể đăng nhập bình thường.
