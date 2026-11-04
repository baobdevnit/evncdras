# MODULE 10: VAI TRÒ & QUYỀN HẠN (ROLES & PERMISSIONS)

## Đường dẫn tài liệu: `docs/modules/10_permissions_and_roles.md`

## Ánh xạ giao diện mẫu: `templates/admin/roles.html`, `templates/admin/roles.css`

---

## 1. Mục tiêu & Nghiệp vụ (Business Overview)

### 1.1. Nguyên tắc

1. **Vai trò và quyền là dữ liệu seed cố định**. Bảng `roles` (5 vai trò), `permissions` (catalog mã quyền) và `permission_roles` (quyền của từng vai trò) chỉ thay đổi bằng migration/seed. Không có API hay giao diện tạo, sửa, xóa vai trò hoặc chỉnh quyền của vai trò.
2. **Mỗi tài khoản mang đúng 1 vai trò**, lưu ở bảng gán riêng theo loại tài khoản:
   - Quản trị viên (cổng chứng thực Admin): `admin_roles`, chỉ nhận vai trò `scope = 'ADMIN'`.
   - Người dùng (cổng chứng thực User): `user_roles`, chỉ nhận vai trò `scope = 'USER'`.
3. **Không lưu quyền trên từng tài khoản**. Các cờ cũ `admins.is_root`, `users.is_group_admin`, `users.can_access_recording` **đã bị loại bỏ**; thay vào đó là đổi vai trò của tài khoản.
4. **Quyền cấp nhóm vẫn lưu trực tiếp trên nhóm**: `user_groups.allow_recording_access` (Chốt chặn Tầng 1 ghi âm) là quyền duy nhất lưu ngoài mô hình vai trò.
5. **Chỉ có một màn hình**: danh sách 5 vai trò, mỗi vai trò kèm danh sách quyền rút gọn (chỉ xem).

### 1.2. Năm vai trò cố định

| id | `code` | Tên | Cổng chứng thực | Tóm tắt |
|---|---|---|---|---|
| 1 | `ROOT_ADMIN` | Quản trị viên tối cao | Admin | Toàn quyền hệ thống. Là vai trò duy nhất có `admin:manage` (quản lý tài khoản quản trị viên khác) |
| 2 | `SYSTEM_ADMIN` | Quản trị viên hệ thống | Admin | Như `ROOT_ADMIN`, trừ `admin:manage` |
| 3 | `GROUP_ADMIN` | Quản trị viên nhóm | User | Quản lý thành viên nội bộ nhóm, đổi vai trò thành viên trong nhóm, nghe/tải ghi âm của nhóm; xem dữ liệu CDR, QoS, báo cáo của nhóm |
| 4 | `USER_RECORDING` | Thành viên nghe ghi âm | User | Xem dữ liệu CDR, QoS, báo cáo của nhóm; nghe/tải ghi âm của nhóm; không quản lý thành viên |
| 5 | `REGULAR_USER` | Thành viên | User | Như `USER_RECORDING`, trừ nghe/tải ghi âm |

- Hai vai trò Admin có thẩm quyền vận hành giống hệt nhau (CDR toàn hệ thống, ghi âm, QoS, dải số, cây tổ chức, nhóm người dùng, cài đặt hệ thống, nhật ký kiểm toán). Khác biệt duy nhất là `admin:manage`.
- Ba vai trò User đều bị giới hạn bởi **Group-Based Data Isolation**: chỉ thấy dữ liệu có `caller_group_id` hoặc `called_group_id` là nhóm của mình.
- Tài khoản `ROOT_ADMIN` đầu tiên chỉ tạo bằng seed (`docs/01_database_schema.md` mục 3). Admin tạo qua API luôn mang `SYSTEM_ADMIN`. Không có API đổi vai trò của Admin.

### 1.3. Đổi vai trò người dùng

Vai trò người dùng thay đổi qua `PUT /api/v1/users/:id/role` (mục 3.2). Quyền cần có phụ thuộc vào vai trò cũ và vai trò mới:

| Chuyển đổi | Quyền cần | Điều kiện |
|---|---|---|
| Sang hoặc khỏi `GROUP_ADMIN` | `group:manage_admin` | Hạ quyền bị chặn `409` nếu đó là Quản trị viên nhóm `ACTIVE` cuối cùng của nhóm |
| `REGULAR_USER` → `USER_RECORDING` | `group:toggle_recording` | |
| `USER_RECORDING` → `REGULAR_USER` | `group:toggle_recording` | Luôn được phép |

- Mọi chuyển đổi có vai trò đích `USER_RECORDING` (kể cả hạ quyền từ `GROUP_ADMIN`) cần nhóm có `allow_recording_access = 1`, ngược lại `409 GROUP_RECORDING_DISABLED`.
- Đích trùng vai trò hiện tại: trả `200`, không ghi gì.

- Quản trị viên nhóm chỉ đổi vai trò của thành viên trong nhóm mình (ngược lại `403`). Admin đổi được ở mọi nhóm.
- Khi Tầng 1 của nhóm bị tắt, vai trò `USER_RECORDING` được giữ nguyên nhưng mất quyền nghe/tải ngay (bước 1 của mục 2.3). Bật lại Tầng 1 thì quyền trở lại, không cần cấp lại.
- Mỗi lần đổi vai trò ghi `audit_logs` (`resource_name = 'USER'`, `action = 'CHANGE_ROLE'`, `action_details = { "from": "<code>", "to": "<code>" }`).

---

## 2. Thiết kế Dữ liệu & Kiểm tra quyền

Bảng MariaDB: `roles`, `permissions`, `permission_roles`, `admin_roles`, `user_roles` (định nghĩa tại `docs/01_database_schema.md` mục 7). Quyền cấp nhóm: `user_groups.allow_recording_access` (mục 5).

### 2.1. Danh mục Quyền hạn (Permission Catalog Seed)

> [!IMPORTANT]
> **Đây là catalog duy nhất** của hệ thống (25 mã). `docs/02_api_contracts.md`, mọi module và mọi Guard chỉ được dùng mã có trong bảng này. Quy ước: `<tài nguyên>:view` để xem, `<tài nguyên>:manage` để thêm/sửa/xóa.
> - **Không phải mã quyền**: các thao tác mọi tài khoản đã đăng nhập đều được làm (xem dashboard, xem thông báo của mình, sửa hồ sơ cá nhân, đổi mật khẩu của mình). Chỉ cần `UserAuthGuard`/`AdminAuthGuard`.
> - **`scope`** chỉ nhận `ADMIN` / `USER` / `BOTH` (cột `permissions.scope`), mang tính mô tả. Vai trò nào có quyền nào do seed `permission_roles` quyết định.
> - **Phạm vi dữ liệu** của mã scope `BOTH`: Admin thấy toàn hệ thống; người dùng chỉ thấy dữ liệu nhóm của mình.
> - **Quyền chịu cổng nhóm** (`group_gated`): người dùng chỉ được dùng khi cờ tương ứng của nhóm đang bật (mục 2.3). Admin không qua cổng nhóm.

| Category | Mã quyền (Code) | Tên quyền | Scope | Cổng nhóm |
| :--- | :--- | :--- | :--- | :--- |
| `DATA` | `cdr:view` | Xem danh sách & chi tiết log CDR | BOTH | |
| | `cdr:filter_advanced` | Sử dụng bộ lọc nâng cao (IP, Disconnection code, Codec) | BOTH | |
| | `cdr:export` | Xuất danh sách cuộc gọi CDR (Excel / CSV) | BOTH | |
| | `report:view` | Xem các báo cáo tổng hợp | BOTH | |
| | `report:export` | Xuất báo cáo Excel / PDF | BOTH | |
| `SPECIAL` | `cdr:listen_audio` | Nghe trực tuyến bản ghi âm cuộc gọi | BOTH | `allow_recording_access` |
| | `cdr:download_audio` | Tải về file ghi âm | BOTH | `allow_recording_access` |
| | `admin:manage` | Tạo mới, sửa, khóa, xóa tài khoản Quản trị viên hệ thống | ADMIN | |
| `QOS` | `qos:view` | Xem phân tích QoS (MOS, Jitter, Loss, SIP delay, bảng QoS debug từng cuộc gọi) | BOTH | |
| | `qos:manage` | Cấu hình ngưỡng cảnh báo QoS (`qos_threshold_configs`) | ADMIN | |
| `USER_MGMT` | `user:view` | Xem danh sách người dùng | BOTH | |
| | `user:create` | Tạo mới người dùng | BOTH | |
| | `user:edit` | Chỉnh sửa người dùng, khóa/mở khóa, đặt lại mật khẩu (không được đổi `user_group_id`) | BOTH | |
| | `user:delete` | Xóa tài khoản người dùng | BOTH | |
| | `group:toggle_recording` | Đổi vai trò thành viên giữa `REGULAR_USER` và `USER_RECORDING` (Quản trị viên nhóm: nội bộ nhóm mình; Admin: mọi nhóm) | BOTH | |
| | `group:manage_admin` | Bổ nhiệm / hạ quyền Quản trị viên nhóm (`GROUP_ADMIN`) (Quản trị viên nhóm: nội bộ nhóm mình; Admin: mọi nhóm) | BOTH | |
| `ORG` | `org:view` | Xem cây tổ chức | BOTH | |
| | `org:manage` | Thêm / Sửa / Xóa đơn vị trên cây tổ chức | ADMIN | |
| | `user_group:view` | Xem nhóm người dùng (người dùng: chỉ nhóm của mình, kèm danh bạ thành viên `GET /user-groups/me/members`) | BOTH | |
| | `user_group:manage` | Thêm / Sửa / Xóa nhóm người dùng, cấp phép Tầng 1 ghi âm | ADMIN | |
| | `prefix:view` | Xem nhóm đầu số, dải số, kho số và lịch sử cấp phát (người dùng: chỉ của nhóm mình) | BOTH | |
| | `prefix:manage` | Cấp phát / Thu hồi dải số, gán nhóm đầu số, khóa/mở khóa số | ADMIN | |
| `SYSTEM` | `role:view` | Xem danh sách vai trò và quyền của từng vai trò | ADMIN | |
| | `system:manage` | Cài đặt hệ thống (phân tích, báo cáo & lưu trữ, nâng cao) | ADMIN | |
| | `audit:view` | Tra cứu nhật ký kiểm toán an toàn thông tin | ADMIN | |

Mã `role:manage` của thiết kế cũ **đã bị loại bỏ** (không còn chức năng chỉnh quyền vai trò).

#### Seed SQL catalog & quyền của vai trò

```sql
INSERT INTO `permissions` (`code`, `name`, `category`, `scope`) VALUES
  ('cdr:view',               'Xem log CDR',                      'DATA',      'BOTH'),
  ('cdr:filter_advanced',    'Bộ lọc CDR nâng cao',              'DATA',      'BOTH'),
  ('cdr:export',             'Xuất danh sách CDR',               'DATA',      'BOTH'),
  ('report:view',            'Xem báo cáo',                      'DATA',      'BOTH'),
  ('report:export',          'Xuất báo cáo',                     'DATA',      'BOTH'),
  ('cdr:listen_audio',       'Nghe ghi âm',                      'SPECIAL',   'BOTH'),
  ('cdr:download_audio',     'Tải ghi âm',                       'SPECIAL',   'BOTH'),
  ('admin:manage',           'Quản lý tài khoản quản trị viên',  'SPECIAL',   'ADMIN'),
  ('qos:view',               'Xem phân tích QoS',                'QOS',       'BOTH'),
  ('qos:manage',             'Cấu hình ngưỡng QoS',              'QOS',       'ADMIN'),
  ('user:view',              'Xem người dùng',                   'USER_MGMT', 'BOTH'),
  ('user:create',            'Tạo người dùng',                   'USER_MGMT', 'BOTH'),
  ('user:edit',              'Sửa người dùng',                   'USER_MGMT', 'BOTH'),
  ('user:delete',            'Xóa người dùng',                   'USER_MGMT', 'BOTH'),
  ('group:toggle_recording', 'Cấp quyền ghi âm cho thành viên',  'USER_MGMT', 'BOTH'),
  ('group:manage_admin',     'Bổ nhiệm quản trị viên nhóm',      'USER_MGMT', 'BOTH'),
  ('org:view',               'Xem cây tổ chức',                  'ORG',       'BOTH'),
  ('org:manage',             'Quản lý cây tổ chức',              'ORG',       'ADMIN'),
  ('user_group:view',        'Xem nhóm người dùng',              'ORG',       'BOTH'),
  ('user_group:manage',      'Quản lý nhóm người dùng',          'ORG',       'ADMIN'),
  ('prefix:view',            'Xem đầu số & kho số',              'ORG',       'BOTH'),
  ('prefix:manage',          'Quản lý đầu số & kho số',          'ORG',       'ADMIN'),
  ('role:view',              'Xem vai trò & quyền',              'SYSTEM',    'ADMIN'),
  ('system:manage',          'Cài đặt hệ thống',                 'SYSTEM',    'ADMIN'),
  ('audit:view',             'Xem nhật ký kiểm toán',            'SYSTEM',    'ADMIN')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `category` = VALUES(`category`), `scope` = VALUES(`scope`);

-- Quyền của vai trò (role id theo seed tại docs/01_database_schema.md mục 7)
-- ROOT_ADMIN (1): mọi quyền scope ADMIN và BOTH
INSERT IGNORE INTO `permission_roles` (`permission_id`, `role_id`)
  SELECT `id`, 1 FROM `permissions` WHERE `scope` IN ('ADMIN','BOTH');
-- SYSTEM_ADMIN (2): như ROOT_ADMIN, trừ admin:manage
INSERT IGNORE INTO `permission_roles` (`permission_id`, `role_id`)
  SELECT `id`, 2 FROM `permissions` WHERE `scope` IN ('ADMIN','BOTH') AND `code` <> 'admin:manage';
-- GROUP_ADMIN (3): mọi quyền scope USER và BOTH
INSERT IGNORE INTO `permission_roles` (`permission_id`, `role_id`)
  SELECT `id`, 3 FROM `permissions` WHERE `scope` IN ('USER','BOTH');
-- USER_RECORDING (4): dữ liệu, báo cáo, QoS, ghi âm, xem danh mục của nhóm
INSERT IGNORE INTO `permission_roles` (`permission_id`, `role_id`)
  SELECT `id`, 4 FROM `permissions` WHERE `code` IN ('cdr:view','cdr:filter_advanced','cdr:export','report:view','report:export','cdr:listen_audio','cdr:download_audio','qos:view','org:view','user_group:view','prefix:view');
-- REGULAR_USER (5): như USER_RECORDING, trừ nghe/tải ghi âm
INSERT IGNORE INTO `permission_roles` (`permission_id`, `role_id`)
  SELECT `id`, 5 FROM `permissions` WHERE `code` IN ('cdr:view','cdr:filter_advanced','cdr:export','report:view','report:export','qos:view','org:view','user_group:view','prefix:view');
```

Seed trên là nguồn sự thật. Khi cần đổi quyền của vai trò, viết migration mới sửa `permission_roles`; không sửa tay trên CSDL.

### 2.2. Ma trận quyền mặc định (kết quả của seed)

| Mã quyền | ROOT_ADMIN | SYSTEM_ADMIN | GROUP_ADMIN | USER_RECORDING | REGULAR_USER |
|---|:-:|:-:|:-:|:-:|:-:|
| `cdr:view`, `cdr:filter_advanced`, `cdr:export` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `report:view`, `report:export` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `qos:view`, `org:view`, `user_group:view`, `prefix:view` | ✓ | ✓ | ✓ | ✓ | ✓ |
| `cdr:listen_audio`, `cdr:download_audio` | ✓ | ✓ | ✓ ¹ | ✓ ¹ | |
| `user:view`, `user:create`, `user:edit`, `user:delete` | ✓ | ✓ | ✓ | | |
| `group:toggle_recording`, `group:manage_admin` | ✓ | ✓ | ✓ | | |
| `admin:manage` | ✓ | | | | |
| `qos:manage`, `org:manage`, `user_group:manage`, `prefix:manage` | ✓ | ✓ | | | |
| `role:view`, `system:manage`, `audit:view` | ✓ | ✓ | | | |

¹ Chỉ khi nhóm có `allow_recording_access = 1` (cổng nhóm).

### 2.3. Thuật toán kiểm tra quyền

`PermissionsGuard` chạy sau `AdminAuthGuard` / `UserAuthGuard`. Mỗi route khai báo mã quyền bằng `@RequirePermissions(...)`; route không khai báo thì chỉ cần đăng nhập.

**Admin (cổng chứng thực Admin)**: chỉ kiểm tra vai trò.
1. Lấy `roleCode` từ Access Token (đọc từ `admin_roles` lúc cấp token).
2. Mọi mã quyền yêu cầu phải thuộc `ROLE_PERMISSIONS[roleCode]`, ngược lại `403 FORBIDDEN_PERMISSION`.

**User (cổng chứng thực User)**: kiểm tra quyền nhóm trước, rồi tới vai trò.
1. **Quyền nhóm**: đọc nhóm của người dùng (`user_groups.status`, `allow_recording_access`) từ CSDL ở mỗi request.
   - Nhóm `INACTIVE` → `403 GROUP_INACTIVE`.
   - Với mỗi mã quyền yêu cầu có trong `GROUP_GATED_PERMISSIONS` mà cờ nhóm tương ứng đang `0` → `403 GROUP_RECORDING_DISABLED`.
2. **Quyền vai trò**: lấy `roleCode` từ Access Token (đọc từ `user_roles` lúc cấp token); mọi mã quyền yêu cầu phải thuộc `ROLE_PERMISSIONS[roleCode]`, ngược lại `403 FORBIDDEN_PERMISSION`.
3. **Phạm vi dữ liệu** (trong service, không phải guard): lọc theo nhóm của người dùng; Quản trị viên nhóm chỉ thao tác trên thành viên cùng nhóm.

```typescript
// Hằng số trong code: quyền chịu cổng nhóm -> cột cờ trên user_groups
export const GROUP_GATED_PERMISSIONS: Record<string, keyof UserGroup> = {
  'cdr:listen_audio': 'allowRecordingAccess',
  'cdr:download_audio': 'allowRecordingAccess',
};
```

- **`ROLE_PERMISSIONS`**: bản đồ `roleCode → Set<permissionCode>` nạp từ `permission_roles` khi khởi động ứng dụng. Bảng này chỉ đổi bằng migration nên không cần làm mới lúc chạy.
- **Thời điểm có hiệu lực**: đổi vai trò của tài khoản có hiệu lực từ lần cấp token kế tiếp (refresh hoặc đăng nhập lại, tối đa 15 phút). Cờ nhóm `allow_recording_access` có hiệu lực ngay ở request kế tiếp vì đọc từ CSDL.
- **Quyền hiệu lực trả cho frontend** (`GET /auth/me`, response đăng nhập User): `permissions` = quyền của vai trò, **bỏ** các quyền chịu cổng nhóm khi cờ nhóm đang tắt. Frontend dùng danh sách này để ẩn/hiện chức năng; backend vẫn luôn kiểm tra lại theo thuật toán trên.

---

## 3. Đặc tả API Contracts

### 3.1. Danh sách vai trò (`GET /api/v1/admin/roles`)

- **Guard**: `AdminAuthGuard`, `Permission: role:view`
- **Query params**: `scope=ADMIN|USER` (tùy chọn, mặc định trả cả 5 vai trò)
- **Response**: vai trò kèm danh sách quyền (sắp theo category) và số tài khoản đang mang vai trò (đếm `admin_roles` / `user_roles`, chỉ tính tài khoản chưa `INACTIVE`).

```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "id": 1,
      "code": "ROOT_ADMIN",
      "name": "Quản trị viên tối cao",
      "description": "Toàn quyền hệ thống, quản lý tài khoản quản trị viên",
      "scope": "ADMIN",
      "accountCount": 1,
      "permissions": [
        { "code": "cdr:view", "name": "Xem log CDR", "category": "DATA" },
        { "code": "admin:manage", "name": "Quản lý tài khoản quản trị viên", "category": "SPECIAL" }
      ]
    },
    {
      "id": 4,
      "code": "USER_RECORDING",
      "name": "Thành viên nghe ghi âm",
      "description": "Xem dữ liệu của nhóm, nghe/tải ghi âm khi nhóm được cấp phép",
      "scope": "USER",
      "accountCount": 37,
      "permissions": [
        { "code": "cdr:view", "name": "Xem log CDR", "category": "DATA" },
        { "code": "cdr:listen_audio", "name": "Nghe ghi âm", "category": "SPECIAL", "groupGated": true }
      ]
    }
  ]
}
```

Không có API tạo/sửa/xóa vai trò, không có API sửa quyền của vai trò. Các endpoint cũ `PUT /admin/roles/:id`, `GET|PUT /admin/permissions/matrix` **đã bị loại bỏ**.

### 3.2. Đổi vai trò người dùng (`PUT /api/v1/users/:id/role`)

- **Portal**: `USER + ADMIN` (bản Admin: `PUT /api/v1/admin/users/:id/role`)
- **Guard**: `UserAuthGuard`/`AdminAuthGuard` + `PermissionsGuard` yêu cầu **một trong hai** `group:manage_admin`, `group:toggle_recording`; service kiểm tra đúng quyền theo bảng mục 1.3.
- **Body**:

```json
{ "roleCode": "USER_RECORDING" }
```

- `roleCode` chỉ nhận `GROUP_ADMIN`, `USER_RECORDING`, `REGULAR_USER` (`400` nếu khác).
- **Xử lý Backend** (một transaction):
  0. Khóa dòng nhóm của người dùng đích (`SELECT id, status FROM user_groups WHERE id = :groupId FOR UPDATE`) trước mọi câu khác, để hai request cùng nhóm (vd. hạ quyền 2 Quản trị viên nhóm cuối cùng cùng lúc) chạy tuần tự; thiếu bước này thì mỗi request đếm ở bước 3 vẫn thấy người kia là Quản trị viên và nhóm mất hết Quản trị viên (`docs/01_database_schema.md` mục 14).
  1. Khóa dòng `user_roles` của người dùng đích (`SELECT ... FOR UPDATE`); người dùng đích phải chưa `INACTIVE`.
  2. Bản User: người dùng đích phải cùng nhóm với người gọi (`403`).
  3. Kiểm tra quyền và điều kiện theo bảng mục 1.3 (`403` / `409`). Đếm Quản trị viên nhóm còn lại khi hạ quyền:

     ```sql
     SELECT COUNT(*) FROM users u
       JOIN user_roles ur ON ur.user_id = u.id
       JOIN roles r ON r.id = ur.role_id
     WHERE u.user_group_id = :groupId AND r.code = 'GROUP_ADMIN'
       AND u.status = 'ACTIVE' AND u.id <> :id;
     ```

  4. Cập nhật `user_roles.role_id`; nếu hạ quyền người đang là `representative_user_id` của nhóm thì đặt `representative_user_id = NULL`.
  5. Ghi `audit_logs` `CHANGE_ROLE`.
- **Response**: thông tin người dùng sau khi đổi, có `roleCode`, `roleName`.

---

## 4. Kiến trúc Backend NestJS (`backend/src/core`, `apps/*`)

Theo quy tắc `docs/00_overview_and_architecture.md` mục 5.1: nghiệp vụ và entity ở `core`, controller ở `apps/admin` / `apps/member`, job nền ở `apps/worker`; các phần `apps/*` không import lẫn nhau.

```
backend/src/
├── core/permissions/
│   ├── permissions.module.ts
│   ├── roles.service.ts                    # danh sách vai trò, đếm tài khoản
│   ├── role-assignment.service.ts          # RoleAssignmentService: ghi user_roles/admin_roles, kiểm tra scope, ghi audit CHANGE_ROLE khi đổi vai trò user
│   ├── role-permission.cache.ts            # ROLE_PERMISSIONS nạp từ permission_roles khi khởi động
│   ├── group-gated-permissions.ts          # GROUP_GATED_PERMISSIONS
│   ├── guards/
│   │   └── permissions.guard.ts            # dùng ở cả apps/admin và apps/member
│   ├── decorators/
│   │   ├── require-permissions.decorator.ts
│   │   └── require-any-permission.decorator.ts
│   └── entities/
│       ├── role.entity.ts
│       ├── permission.entity.ts
│       ├── permission-role.entity.ts
│       ├── admin-role.entity.ts
│       └── user-role.entity.ts
└── apps/admin/roles/
    ├── admin-roles.module.ts
    └── roles.controller.ts                 # GET /admin/roles
```

API đổi vai trò người dùng (`PUT /users/:id/role`) nằm ở module người dùng (`docs/modules/03_auth_user.md`), dùng chung `RoleAssignmentService` của module này.

### 4.1. `PermissionsGuard` & Decorator

```typescript
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata('permissions', { mode: 'all', permissions });
export const RequireAnyPermission = (...permissions: string[]) =>
  SetMetadata('permissions', { mode: 'any', permissions });

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private rolePermissions: RolePermissionCache,
    private userGroups: UserGroupsRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const meta = this.reflector.getAllAndOverride<{ mode: 'all' | 'any'; permissions: string[] }>(
      'permissions', [context.getHandler(), context.getClass()],
    );
    if (!meta) return true;

    const request = context.switchToHttp().getRequest();
    const actor = request.admin ?? request.user;
    if (!actor) return false;

    // Bước 1 (chỉ User): quyền nhóm
    let candidates = meta.permissions;
    if (request.user) {
      const group = await this.userGroups.findStatusAndFlags(request.user.userGroupId);
      if (!group || group.status !== 'ACTIVE') throw new ForbiddenException('GROUP_INACTIVE');
      candidates = meta.permissions.filter(p => {
        const flag = GROUP_GATED_PERMISSIONS[p];
        return !flag || group[flag] === true;
      });
      if (meta.mode === 'all' && candidates.length < meta.permissions.length) {
        throw new ForbiddenException('GROUP_RECORDING_DISABLED');
      }
    }

    // Bước 2: quyền vai trò (Admin chỉ có bước này)
    const owned = this.rolePermissions.get(actor.roleCode);
    const ok = meta.mode === 'all'
      ? candidates.every(p => owned.has(p))
      : candidates.some(p => owned.has(p));
    if (!ok) throw new ForbiddenException('FORBIDDEN_PERMISSION');
    return true;
  }
}
```

- Không còn `RootAdminOnlyGuard`: các API quản lý tài khoản Admin dùng `@RequirePermissions('admin:manage')`, chỉ vai trò `ROOT_ADMIN` có quyền này.
- Không có ngoại lệ theo tên vai trò trong guard; mọi khác biệt giữa các vai trò nằm ở seed `permission_roles`.

---

## 5. Kiến trúc Frontend Vue 3

### 5.1. Danh sách vai trò (Ánh xạ `templates/admin/roles.html` - `RolesView.vue`)

- **Đối tượng truy cập**: tài khoản Admin có `role:view` (cả `ROOT_ADMIN` và `SYSTEM_ADMIN`). Cổng User không có màn hình này.
- **Bố cục**:
  - Header: tiêu đề "Vai trò", không có nút thêm/sửa/xóa/lưu.
  - Hai khối: **Nhóm Quản trị** (`ROOT_ADMIN`, `SYSTEM_ADMIN`) và **Nhóm Người dùng** (`GROUP_ADMIN`, `USER_RECORDING`, `REGULAR_USER`).
  - Mỗi vai trò là một thẻ: tên, mã vai trò, mô tả, số tài khoản đang mang vai trò, và danh sách quyền rút gọn dạng chip gom theo category (ví dụ "Dữ liệu: Xem log CDR, Bộ lọc nâng cao, Xuất CDR…"). Quyền chịu cổng nhóm có chú thích "khi nhóm được cấp phép ghi âm".
  - Bấm vào thẻ mở panel chỉ đọc liệt kê đầy đủ mã quyền (`code`) và tên quyền của vai trò.
- **Không có** checkbox, ma trận chỉnh quyền hay form vai trò. Các mẫu `templates/admin/permissions.html` và `templates/admin/data-permissions.html` **không triển khai**.

### 5.2. Hiển thị vai trò ở các màn hình khác

- Danh sách người dùng / thành viên nhóm hiển thị huy hiệu vai trò theo `roleCode`.
- Màn hình Quản trị nhóm (`templates/member/group-admin.html`) đổi vai trò thành viên bằng `PUT /users/:id/role`:
  - Switch "Nghe ghi âm" = chuyển `REGULAR_USER` ↔ `USER_RECORDING` (ẩn khi nhóm có `allowRecordingAccess = false`).
  - Nút "Bổ nhiệm / Hạ quyền Quản trị viên nhóm" = chuyển sang/khỏi `GROUP_ADMIN` (hạ quyền về `REGULAR_USER`).
- Danh sách Admin hiển thị vai trò `ROOT_ADMIN` / `SYSTEM_ADMIN`; các nút quản lý chỉ hiện khi tài khoản đăng nhập có `admin:manage`.

---

## 6. Kịch bản kiểm thử (Test Plan for Agent)

1. **TC-PERM-01**: Đăng nhập Admin `SYSTEM_ADMIN`, gọi `GET /admin/roles`, xác nhận trả 5 vai trò, mỗi vai trò có danh sách quyền khớp mục 2.2 và `accountCount` khớp số dòng `admin_roles`/`user_roles`. Xác nhận không có endpoint sửa vai trò/quyền (`PUT /admin/roles/1`, `PUT /admin/permissions/matrix` trả `404`).
2. **TC-PERM-02**: Đăng nhập `SYSTEM_ADMIN`, gọi `POST /admin/admins`, nhận `403 FORBIDDEN_PERMISSION`. Đăng nhập `ROOT_ADMIN` gọi lại thành công; admin mới có dòng `admin_roles` với vai trò `SYSTEM_ADMIN`.
3. **TC-PERM-03**: Thành viên `USER_RECORDING` trong nhóm có `allow_recording_access = 1` nghe ghi âm thành công. Admin tắt Tầng 1 của nhóm; ngay request kế tiếp API nghe/tải trả `403 GROUP_RECORDING_DISABLED`, `GET /auth/me` không còn `cdr:listen_audio`; `user_roles` vẫn giữ `USER_RECORDING`.
4. **TC-PERM-04**: Thành viên `REGULAR_USER` gọi API nghe ghi âm khi Tầng 1 mở, nhận `403 FORBIDDEN_PERMISSION`.
5. **TC-PERM-05**: Quản trị viên nhóm đổi một thành viên `REGULAR_USER` → `USER_RECORDING` khi nhóm có `allow_recording_access = 0`, nhận `409 GROUP_RECORDING_DISABLED`.
6. **TC-PERM-06**: Nhóm chỉ còn 1 `GROUP_ADMIN` đang hoạt động; đổi người đó sang `REGULAR_USER`, nhận `409`. Quản trị viên nhóm đổi vai trò của người dùng nhóm khác, nhận `403`.
7. **TC-PERM-07**: Thử chèn `admin_roles` với `role_id = 3` hoặc `user_roles` với `role_id = 1` trực tiếp bằng SQL, xác nhận CSDL từ chối (vi phạm khóa ngoại phạm vi vai trò).
