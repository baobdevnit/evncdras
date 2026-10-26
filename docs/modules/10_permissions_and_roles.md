# MODULE 10: QUẢN LÝ VAI TRÒ & PHÂN QUYỀN MA TRẬN (ROLES & FINE-GRAINED PERMISSION SYSTEM)

## Đường dẫn tài liệu: `docs/modules/10_permissions_and_roles.md`

## Ánh xạ giao diện mẫu: `templates/roles.html`, `templates/permissions.html`, `templates/data-permissions.html`, `templates/roles.css`, `templates/permissions.css`, `templates/data-permissions.css`

---

## 1. Mục tiêu & Nghiệp vụ (Business Overview)

### 1.1. Bối cảnh nghiệp vụ

Hệ thống EVN CDR AS phục vụ hàng nghìn người dùng từ cấp Tập đoàn đến các Điện lực địa phương với các yêu cầu bảo mật nghiêm ngặt:

1. **Phân quyền ma trận hạt mịn (Fine-grained Matrix RBAC)**: Phân tách rõ ràng giữa Vai trò (Role) và Quyền hạn cụ thể (Permission). Không gán cứng quyền hạn vào code mà cho phép cấu hình linh hoạt trên giao diện Ma trận quyền.
2. **Phân tách Scope (Admin Scope vs User Scope)**:
   - **Nhóm Quản trị (Admin Scope)**: Đúng 2 vai trò thuộc hạ tầng quản trị gồm `ROOT_ADMIN` (Quản trị viên hệ thống cấp cao) và `SYSTEM_ADMIN` (Quản trị viên hệ thống).
     + **Đồng nhất thẩm quyền vận hành & kỹ thuật**: Cả hai đối tượng đều có toàn quyền tương đương nhau 100% về dữ liệu CDR toàn hệ thống, nghe và tải ghi âm thoại, chẩn đoán QoS, cấu hình dải số, quản trị cơ cấu tổ chức, cấu hình hệ thống PABX & Database, chính sách lưu trữ CDR (Retention Policy) và kích hoạt chế độ bảo trì.
     + **Điểm khác biệt DUY NHẤT**: Chỉ duy nhất Quản trị viên hệ thống cấp cao (`ROOT_ADMIN` / `is_root = 1`) mới có quyền tạo mới, chỉnh sửa, khóa hoặc xóa tài khoản của các Quản trị viên hệ thống khác (`admin:manage`). Quản trị viên hệ thống thông thường (`SYSTEM_ADMIN` / `is_root = 0`) hoàn toàn không có quyền can thiệp vào danh sách tài khoản Quản trị viên.
     + *(Hệ thống không còn đối tượng Network Operator)*.
   - **Nhóm Người dùng (User Scope)**: Gồm 3 đối tượng chuẩn hóa:
     + `GROUP_ADMIN` (Quản trị nhóm): Có toàn quyền CRUD đối với thành viên nội bộ nhóm, cấp/chuyển quyền Quản trị nhóm (`group:manage_admin`), cấp quyền nghe ghi âm cho thành viên (`group:toggle_recording`); mặc định có quyền nghe ghi âm khi Tầng 1 mở; toàn quyền xem dữ liệu CDR, phân tích QoS và xem/xuất báo cáo thống kê trong phạm vi nhóm.
     + `USER_RECORDING` (Thành viên có quyền nghe ghi âm): Có toàn bộ các quyền đối với dữ liệu CDR, phân tích QoS và xem/xuất báo cáo thống kê trong phạm vi nhóm tương tự Quản trị nhóm; được cấp quyền nghe trực tuyến và tải file ghi âm cuộc gọi của nhóm mình; không có quyền quản lý thành viên.
     + `REGULAR_USER` (Thành viên không có quyền nghe ghi âm): Có toàn bộ các quyền tương tự `USER_RECORDING` (xem dữ liệu CDR, phân tích QoS, xem/xuất báo cáo thống kê theo nhóm), chỉ khác biệt DUY NHẤT là bị khóa hoàn toàn quyền nghe và tải file ghi âm cuộc gọi.
3. **Bảo vệ quyền hạn nhạy cảm (Special Permissions)**:
   - Các quyền: `admin:manage` (Quản lý Quản trị viên hệ thống - Chỉ Root Admin), `cdr:listen_audio` (Nghe ghi âm), `cdr:download_audio` (Tải ghi âm) được xếp vào nhóm **Quyền Đặc biệt** và yêu cầu kiểm soát gắt gao.

---

## 2. Thiết kế Dữ liệu (Database Schema)

Bảng MariaDB: `roles` (5 vai trò cố định), `permissions`, `role_permissions` (Đã định nghĩa tại `docs/01_database_schema.md` mục 7). Không có bảng gán vai trò: vai trò của tài khoản được suy ra từ cờ.

### Danh mục Quyền hạn hạt mịn (Permission Catalog Seed)

> [!IMPORTANT]
> **Đây là catalog duy nhất** của hệ thống (26 mã). `docs/02_api_contracts.md`, mọi module và mọi Guard chỉ được dùng mã có trong bảng này. Quy ước: `<tài nguyên>:view` để xem, `<tài nguyên>:manage` để thêm/sửa/xóa.
> - **Không phải mã quyền**: các thao tác mọi tài khoản đã đăng nhập đều được làm (xem dashboard, xem thông báo của mình, sửa hồ sơ cá nhân, đổi mật khẩu của mình). Chỉ cần `UserAuthGuard`/`AdminAuthGuard`.
> - **`scope`** chỉ nhận `ADMIN` / `USER` / `BOTH` (cột `permissions.scope`). Các ràng buộc "chỉ Root Admin" hay "chỉ Quản trị viên nhóm" **không** ghi vào `scope`, mà thể hiện qua seed `role_permissions` bên dưới. Riêng `admin:manage` còn có thêm `RootAdminOnlyGuard` kiểm tra `is_root = 1`.
> - **Phạm vi dữ liệu** của mã scope `BOTH`: Admin thấy toàn hệ thống; người dùng chỉ thấy dữ liệu nhóm của mình (Group-Based Data Isolation).

| Category | Mã quyền (Code) | Tên quyền | Scope |
| :--- | :--- | :--- | :--- |
| `DATA` | `cdr:view` | Xem danh sách & chi tiết log CDR | BOTH |
| | `cdr:filter_advanced` | Sử dụng bộ lọc nâng cao (IP, Disconnection code, Codec) | BOTH |
| | `cdr:export` | Xuất danh sách cuộc gọi CDR (Excel / CSV) | BOTH |
| | `report:view` | Xem các báo cáo tổng hợp | BOTH |
| | `report:export` | Xuất báo cáo Excel / PDF | BOTH |
| `SPECIAL` | `cdr:listen_audio` | Nghe trực tuyến bản ghi âm cuộc gọi (còn phải qua cổng Tầng 1 `allow_recording_access` với người dùng) | BOTH |
| | `cdr:download_audio` | Tải về file ghi âm (còn phải qua cổng Tầng 1 với người dùng) | BOTH |
| | `admin:manage` | Tạo mới, khóa hoặc xóa tài khoản Quản trị viên hệ thống | ADMIN |
| `QOS` | `qos:view` | Xem phân tích QoS (MOS, Jitter, Loss, SIP delay, bảng QoS debug từng cuộc gọi) | BOTH |
| | `qos:manage` | Cấu hình ngưỡng cảnh báo QoS (`qos_threshold_configs`) | ADMIN |
| `USER_MGMT` | `user:view` | Xem danh sách người dùng | BOTH |
| | `user:create` | Tạo mới người dùng | BOTH |
| | `user:edit` | Chỉnh sửa người dùng, khóa/mở khóa, đặt lại mật khẩu (không được đổi `user_group_id`) | BOTH |
| | `user:delete` | Xóa tài khoản người dùng | BOTH |
| | `group:toggle_recording` | Bật/tắt `can_access_recording` cho thành viên (Quản trị viên nhóm: nội bộ nhóm mình; Admin: mọi nhóm) | BOTH |
| | `group:manage_admin` | Bổ nhiệm / hạ quyền Quản trị viên nhóm (`is_group_admin`) (Quản trị viên nhóm: nội bộ nhóm mình; Admin: mọi nhóm) | BOTH |
| `ORG` | `org:view` | Xem cây tổ chức | BOTH |
| | `org:manage` | Thêm / Sửa / Xóa đơn vị trên cây tổ chức | ADMIN |
| | `user_group:view` | Xem nhóm người dùng (người dùng: chỉ nhóm của mình) | BOTH |
| | `user_group:manage` | Thêm / Sửa / Xóa nhóm người dùng, cấp phép Tầng 1 ghi âm | ADMIN |
| | `prefix:view` | Xem nhóm đầu số, dải số, kho số và lịch sử cấp phát (người dùng: chỉ của nhóm mình) | BOTH |
| | `prefix:manage` | Cấp phát / Thu hồi dải số, gán nhóm đầu số, khóa/mở khóa số | ADMIN |
| `SYSTEM` | `role:view` | Xem 5 vai trò, danh mục quyền và ma trận quyền | ADMIN |
| | `role:manage` | Cấu hình ma trận quyền của 5 vai trò cố định (không tạo/xóa vai trò) | ADMIN |
| | `system:manage` | Cài đặt hệ thống (phân tích, báo cáo & lưu trữ, nâng cao) | ADMIN |
| | `audit:view` | Tra cứu nhật ký kiểm toán an toàn thông tin | ADMIN |

#### Seed SQL catalog & ma trận mặc định

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
  ('role:view',              'Xem vai trò & ma trận quyền',      'SYSTEM',    'ADMIN'),
  ('role:manage',            'Cấu hình ma trận quyền',           'SYSTEM',    'ADMIN'),
  ('system:manage',          'Cài đặt hệ thống',                 'SYSTEM',    'ADMIN'),
  ('audit:view',             'Xem nhật ký kiểm toán',            'SYSTEM',    'ADMIN')
ON DUPLICATE KEY UPDATE `name` = VALUES(`name`), `category` = VALUES(`category`), `scope` = VALUES(`scope`);

-- Ma trận mặc định (role id theo seed tại docs/01_database_schema.md mục 7)
-- ROOT_ADMIN (1): mọi quyền scope ADMIN và BOTH
INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
  SELECT 1, `id` FROM `permissions` WHERE `scope` IN ('ADMIN','BOTH');
-- SYSTEM_ADMIN (2): như ROOT_ADMIN, trừ admin:manage
INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
  SELECT 2, `id` FROM `permissions` WHERE `scope` IN ('ADMIN','BOTH') AND `code` <> 'admin:manage';
-- GROUP_ADMIN (3): mọi quyền scope USER và BOTH
INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
  SELECT 3, `id` FROM `permissions` WHERE `scope` IN ('USER','BOTH');
-- USER_RECORDING (4): dữ liệu, báo cáo, QoS, ghi âm, xem danh mục của nhóm
INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
  SELECT 4, `id` FROM `permissions` WHERE `code` IN ('cdr:view','cdr:filter_advanced','cdr:export','report:view','report:export','cdr:listen_audio','cdr:download_audio','qos:view','org:view','user_group:view','prefix:view');
-- REGULAR_USER (5): như USER_RECORDING, trừ nghe/tải ghi âm
INSERT IGNORE INTO `role_permissions` (`role_id`, `permission_id`)
  SELECT 5, `id` FROM `permissions` WHERE `code` IN ('cdr:view','cdr:filter_advanced','cdr:export','report:view','report:export','qos:view','org:view','user_group:view','prefix:view');
```

> **Lưu ý nghiệp vụ về Phân cấp Quản trị viên hệ thống (Root Admin vs System Admin)**:
> - **Chỉ tồn tại 2 đối tượng Quản trị viên thuộc Admin Scope**: Quản trị viên hệ thống cấp cao (`ROOT_ADMIN` / `is_root = 1`) và Quản trị viên hệ thống (`SYSTEM_ADMIN` / `is_root = 0`). Đối tượng Network Operator đã bị loại bỏ hoàn toàn khỏi hệ thống.
> - **Đồng nhất 100% thẩm quyền vận hành và kỹ thuật**: Cả Root Admin và System Admin đều có toàn quyền trên toàn bộ dữ liệu CDR toàn hệ thống, nghe và tải file ghi âm cuộc gọi, xem thông số QoS, cấp phép ghi âm Tầng 1 (`allow_recording_access`), quản lý dải số PABX, cấu hình cây tổ chức, cấu hình hệ thống PABX & Database, thiết lập chính sách lưu trữ CDR (Retention Policy) và kích hoạt chế độ bảo trì.
> - **Điểm khác biệt duy nhất**: Chỉ duy nhất Quản trị viên hệ thống cấp cao (`ROOT_ADMIN` / `is_root = 1`) mới có quyền tạo mới, chỉnh sửa, khóa hoặc xóa tài khoản Quản trị viên hệ thống khác (`admin:manage` / `RootAdminOnlyGuard`). Quản trị viên hệ thống thông thường (`SYSTEM_ADMIN` / `is_root = 0`) hoàn toàn không có quyền can thiệp vào danh sách tài khoản Quản trị viên.

> **Lưu ý nghiệp vụ về Phân quyền 3 Đối tượng Thành viên thuộc User Scope (Group Admin vs Thành viên)**:
> 1. **Quản trị viên nhóm (`GROUP_ADMIN` / `is_group_admin = 1`)**:
>    - **Toàn quyền CRUD thành viên nội bộ nhóm**: Tạo mới (`user:create`), xem danh sách (`user:view`), sửa thông tin, khóa/mở khóa, đặt lại mật khẩu (`user:edit`), ngừng hoạt động tài khoản (`user:delete`) thành viên trong phạm vi nhóm của chính mình (không được chuyển nhóm thành viên).
>    - **Quyền cấp/chuyển quyền Quản trị nhóm (`group:manage_admin`)**: Bổ nhiệm thành viên trong nhóm thành Quản trị viên nhóm (`is_group_admin = 1`) hoặc hạ quyền về thành viên thường (bảo toàn tối thiểu 1 Group Admin đang hoạt động).
>    - **Quyền cấp phép nghe ghi âm cho thành viên (`group:toggle_recording`)**: Bật/tắt cờ `users.can_access_recording` cho từng thành viên trong nhóm khi nhóm đã được System Admin cấp phép Tầng 1 (`allow_recording_access = 1`).
>    - **Mặc định có quyền nghe ghi âm**: Tự động có toàn quyền nghe trực tuyến & tải ghi âm cuộc gọi của nhóm mình khi Tầng 1 mở.
> 2. **Hai đối tượng Thành viên (`USER_RECORDING` và `REGULAR_USER`)**:
>    - **Điểm khác biệt DUY NHẤT là quyền nghe ghi âm**:
>      + `USER_RECORDING` (Thành viên có quyền nghe ghi âm): Được Group Admin bật cờ `can_access_recording = 1` (khi nhóm có `allow_recording_access = 1`), có quyền nghe trực tuyến (`cdr:listen_audio`) và tải file ghi âm (`cdr:download_audio`) của nhóm mình.
>      + `REGULAR_USER` (Thành viên không có quyền nghe ghi âm): `can_access_recording = 0` (hoặc nhóm chưa mở Tầng 1), bị ẩn hoàn toàn tính năng nghe/tải ghi âm trên giao diện và chặn 403 Forbidden tại API.
>    - **Còn lại GIỐNG NHAU 100% và CÓ QUYỀN TƯƠNG TỰ QUẢN TRỊ NHÓM đối với**:
>      + **Dữ liệu CDR**: Tra cứu danh sách cuộc gọi, xem chi tiết 87 trường thông số cuộc gọi, sử dụng bộ lọc nâng cao (IP, Disconnection Code...), xuất danh sách cuộc gọi (Excel/CSV) trong phạm vi nhóm (`Group-Based Data Isolation`).
>      + **Phân tích chất lượng (QoS)**: Truy cập xem chỉ số chất lượng cuộc gọi (MOS, Jitter, Packet Loss, SIP Delays) và chẩn đoán sự cố mạng của các cuộc gọi thuộc nhóm mình (`qos-debug.html`).
>      + **Thống kê & Báo cáo**: Xem biểu đồ, phân tích lưu lượng thoại theo thời gian, tỷ lệ ASR, NER, mã ngắt kết nối SIP và xuất báo cáo thống kê (Excel/PDF) số liệu của nhóm mình (`reports.html`).
>    - **Cả hai loại thành viên KHÔNG CÓ quyền quản trị**: Hoàn toàn bị khóa các chức năng CRUD người dùng, không được cấp quyền quản trị nhóm và không được phân quyền nghe ghi âm cho người khác.

> **Lưu ý nghiệp vụ về Quyền Tạo Người Dùng (`user:create`) & Tính Bất Biến Nhóm**:
> - **Người dùng luôn thuộc cố định vào 1 nhóm người dùng ngay từ lúc tạo ra** (không có khái niệm chuyển người dùng giữa các nhóm).
> - **Quản trị viên hệ thống (System Admin)**: Có quyền tạo người dùng cho bất kỳ Nhóm người dùng nào.
> - **Quản trị viên nhóm (Group Admin)**: Bản chất là một thành viên của nhóm có quyền quản trị, có quyền tạo người dùng mới nhưng **chỉ được tạo trong phạm vi nhóm của chính mình**.

> **Lưu ý nghiệp vụ về Phân quyền Ghi âm Kiểm soát 2 Tầng (`allow_recording_access` & `can_access_recording`)**:
> - **Chốt chặn Tầng 1 (Cấp nhóm do System Admin cấp)**: Quản trị viên hệ thống có toàn quyền quyết định một Nhóm người dùng có được phép tiếp cận dữ liệu ghi âm hay không thông qua cờ `user_groups.allow_recording_access`. Nếu nhóm chưa được cấp phép (`0`), mọi tính năng ghi âm bị triệt tiêu khỏi giao diện bảng cuộc gọi chính của toàn bộ người dùng nhóm đó, Modal chi tiết hiển thị thông báo chưa kích hoạt, và Quản trị viên nhóm không có quyền nghe/tải cũng như không có quyền cấp cho ai.
> - **Chốt chặn Tầng 2 (Cấp người dùng do Group Admin phân quyền khi Tầng 1 mở)**: Khi nhóm đã được Quản trị viên hệ thống cấp quyền (`allow_recording_access = 1`):
>   + **Quản trị viên nhóm (`is_group_admin = 1`)**: Mặc định tự động có toàn quyền nghe trực tuyến & tải ghi âm thoại của nhóm.
>   + **Quyền ủy quyền `group:toggle_recording`**: Quản trị viên nhóm được trao quyền trực tiếp bật/tắt quyền nghe và tải ghi âm (.wav) cho từng thành viên trong nhóm mình qua trường `users.can_access_recording`.
> - Cả người dùng thành viên và Quản trị viên nhóm đều bị giới hạn nghiêm ngặt bởi **Group-Based Data Isolation**: chỉ được nghe và tải bản ghi của các cuộc gọi có `caller_group_id` hoặc `called_group_id` thuộc nhóm mình trên bảng `cdr_enriched`.

---

## 3. Đặc tả API Contracts

### 3.1. Danh sách Vai trò (`GET /api/v1/admin/roles`)

- **Query params**: `scope=USER` hoặc `scope=ADMIN`
- **Response**: Trả về 5 vai trò cố định của `scope`, số tài khoản hiện mang vai trò (đếm theo cờ `is_root` / `is_group_admin` / `can_access_recording`), cờ `isSystem` (luôn `true`).

### 3.2. Lấy Ma trận phân quyền (`GET /api/v1/admin/permissions/matrix`)

- Ma trận thay thế hoàn toàn các endpoint cũ `GET /permissions` và `PUT /roles/:id/permissions` (đã bỏ khỏi `docs/02_api_contracts.md`).

- **Query params**: `scope=ADMIN` hoặc `scope=USER`
- **Response**:

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "roles": [
      { "id": 1, "code": "ROOT_ADMIN", "name": "Quản trị cao cấp", "isSystem": true },
      { "id": 2, "code": "SYSTEM_ADMIN", "name": "Quản trị viên", "isSystem": true }
    ],
    "categories": [
      {
        "categoryKey": "DATA",
        "categoryName": "Quản lý Dữ liệu",
        "permissions": [
          {
            "id": 1,
            "code": "cdr:view",
            "name": "Xem dữ liệu",
            "roleAssignments": { "1": true, "2": true }
          }
        ]
      },
      {
        "categoryKey": "SPECIAL",
        "categoryName": "Quyền Đặc biệt",
        "permissions": [
          {
            "id": 10,
            "code": "cdr:download_audio",
            "name": "Tải file ghi âm cuộc gọi",
            "roleAssignments": { "1": true, "2": false }
          }
        ]
      }
    ]
  }
}
```

### 3.3. Lưu Ma trận phân quyền (`PUT /api/v1/admin/permissions/matrix`)

- **Guard**: `AdminAuthGuard`, `Permission: role:manage`
- **Body**:

```json
{
  "assignments": [
    { "roleId": 2, "permissionIds": [1, 2, 3, 5, 8] }
  ]
}
```

- **Xử lý Backend**: Transaction cập nhật bảng `role_permissions` (xóa cũ và chèn mới). Khóa không cho phép sửa quyền của `ROOT_ADMIN` (luôn full quyền).

---

## 4. Kiến trúc Backend NestJS (`backend/src/modules/permissions/`)

```
permissions/
├── permissions.module.ts
├── roles.controller.ts
├── permissions.controller.ts
├── roles.service.ts
├── permissions.service.ts
├── guards/
│   └── permissions.guard.ts
├── decorators/
│   └── require-permissions.decorator.ts
└── entities/
    ├── role.entity.ts
    └── permission.entity.ts
```

### 4.1. Implementation `PermissionsGuard` & Decorator

```typescript
export const RequirePermissions = (...permissions: string[]) =>
  SetMetadata('permissions', permissions);

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>('permissions', [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredPermissions) return true;

    const request = context.switchToHttp().getRequest();
    const actor = request.admin || request.user;
    if (!actor) return false;

    // Không có ngoại lệ cho Root Admin: mọi tài khoản đi qua ma trận role_permissions.
    // Quyền riêng của Root (admin:manage) do seed ma trận và RootAdminOnlyGuard kiểm soát.
    const actorPermissions = actor.permissions || [];
    return requiredPermissions.every(perm => actorPermissions.includes(perm));
  }
}
```

---

## 5. Kiến trúc Frontend Vue 3

### 5.1. Quản lý Danh mục Quyền hạn Hệ thống (Ánh xạ `templates/permissions.html` - `PermissionsManagementView.vue`)

- **Đối tượng truy cập**: **Dành riêng cho Quản trị viên hệ thống (System Administrator)**.
- **Quy tắc bất biến dữ liệu**:
  - **Mã quyền (`code`)**: Được định nghĩa cố định trong cơ sở dữ liệu (`permissions.code`) và mã nguồn backend/frontend (bất biến, không thể chỉnh sửa hay tùy tiện xóa).
  - **Catalog quyền là cố định**: Quản trị viên hệ thống **không sửa** mã, tên, phân nhóm hay mô tả của quyền qua giao diện; các trường này chỉ đổi bằng migration/seed. Quản trị viên chỉ chỉnh **ma trận** vai trò × quyền (mục 5.2).
- **Tính năng giao diện**:
  - Thống kê KPI: Tổng quyền, số phân nhóm, quyền nhạy cảm đặc biệt, trạng thái mã nguồn.
  - Bộ lọc thông minh: Tìm kiếm theo mã quyền (`cdr:*`, `user:*`), lọc theo phân nhóm và mức độ an toàn.
  - Chế độ xem: Gom nhóm nghiệp vụ (Grouped View) hoặc Bảng tổng hợp (Table View).
  - Không có modal chỉnh sửa quyền (màn hình chỉ đọc).
  - Modal chi tiết kỹ thuật: Tra cứu route API bảo vệ và mã decorator `@RequirePermissions()`.

### 5.2. Quản lý Ma trận Phân quyền Vai trò (Ánh xạ `templates/roles.html` - `PermissionMatrixView.vue`)

- **Bố cục Giao diện**:
  - Header: Tiêu đề "Phân quyền Vai trò", nút "Khôi phục" và nút "Lưu thay đổi".
  - Bộ Tabs: Nhóm Quản trị (`admin-roles` / `admin-permissions`), Nhóm Người dùng (`user-roles` / `user-permissions`).
  - Checkbox ma trận: Khóa vai trò Root Admin (luôn full quyền), cho phép cấu hình gán/bỏ quyền cho các vai trò khác.

---


### 5.3. Ma trận Phân quyền theo Màn hình & Chức năng (Ánh xạ `templates/data-permissions.html` - `PageFeaturePermissionMatrixView.vue`)

- **Mục tiêu & Bản chất**: Trang tra cứu & tham chiếu ma trận phân quyền chính sách hệ thống (Policy / Matrix Viewer) đối chiếu phân cấp theo cấu trúc trực quan: **[Từng Màn hình / Trang] ➔ [Từng Chức năng cụ thể] ➔ [Quyền hạn của 5 Đối tượng người dùng chuẩn hóa]**.
- **Cấu trúc 5 Đối tượng Người dùng chuẩn hóa**:
  1. `ROOT_ADMIN` (Root Admin - Quản trị viên Tối cao): Toàn quyền trên toàn bộ dữ liệu, hạ tầng PABX, Data Retention và bảo trì. **Đặc quyền duy nhất**: Tạo mới, chỉnh sửa, khóa và quản lý tài khoản Quản trị viên hệ thống khác (`is_root = 1`).
  2. `SYSTEM_ADMIN` (System Admin - Quản trị viên Hệ thống): Toàn bộ thẩm quyền tương đương Root Admin về dữ liệu CDR toàn hệ thống, nghe và tải ghi âm thoại, chẩn đoán QoS, cấp phép ghi âm Tầng 1 (`allow_recording_access`), quản lý dải số, cơ cấu tổ chức và cấu hình hệ thống. **Điểm khác biệt duy nhất so với Root Admin**: Không có quyền tạo hoặc can thiệp vào danh sách tài khoản Quản trị viên hệ thống.
  3. `GROUP_ADMIN` (Group Admin - Quản trị viên Nhóm): Quản trị thành viên nội bộ đơn vị (toàn quyền CRUD thành viên, cấp/chuyển quyền Quản trị nhóm, cấp quyền nghe ghi âm Tầng 2); mặc định có quyền nghe ghi âm nhóm khi Tầng 1 mở; toàn quyền xem dữ liệu CDR, phân tích QoS và xem/xuất báo cáo thống kê trong phạm vi nhóm (`Group-Based Data Isolation`).
  4. `USER_RECORDING` (Thành viên có quyền nghe ghi âm): Có quyền tương tự Quản trị nhóm đối với dữ liệu CDR, phân tích QoS, xem/xuất báo cáo thống kê theo nhóm; được cấp quyền nghe trực tuyến & tải file ghi âm cuộc gọi thuộc nhóm mình; không có quyền quản lý thành viên.
  5. `REGULAR_USER` (Thành viên không có quyền nghe ghi âm): Có quyền tương tự Thành viên có quyền ghi âm về dữ liệu CDR, phân tích QoS, xem/xuất báo cáo thống kê theo nhóm; điểm khác biệt DUY NHẤT: Bị chặn hoàn toàn quyền nghe và tải file ghi âm; không có quyền quản lý thành viên.
- **Phản ánh các quy tắc nghiệp vụ cốt lõi**:
  - **Group-Based Data Isolation**: Dữ liệu cuộc gọi `cdr_enriched` được lọc theo `caller_group_id` hoặc `called_group_id`.
  - **Chốt chặn Ghi âm 2 Tầng (2-Tier Recording Access Gate)**: Tầng 1 do System Admin cấp (`allow_recording_access`), Tầng 2 do Group Admin ủy quyền (`can_access_recording`).
  - **Quyền Thành viên Nhóm Đồng nhất**: Cả 2 đối tượng thành viên đều có quyền xem dữ liệu CDR, phân tích chất lượng QoS và xem/xuất báo cáo lưu lượng theo nhóm như Group Admin; chỉ khác nhau ở cờ nghe ghi âm.
  - **Tính bất biến nhóm & tài khoản**: Cố định nhóm, cấm chuyển nhóm, Group Admin chỉ tạo thành viên nội bộ nhóm và bảo toàn tối thiểu 1 Group Admin.
  - **Phân cấp Quản trị viên chặt chẽ**: Chỉ Root Admin được tạo Quản trị viên hệ thống; các quyền vận hành kỹ thuật khác của System Admin tương đương 100% Root Admin.
- **Tính năng giao diện**:
  - **Chế độ xem linh hoạt (Dual View Modes)**: Hỗ trợ chuyển đổi mượt mà giữa **Dạng Thẻ (Card View - Mặc định)** và **Dạng Bảng (Table View)** thông qua bộ nút toggle trên thanh công cụ.
  - **Dạng Thẻ (Card View)**: Mỗi Trang là một Thẻ Chủ (`.page-master-card`), bên trong là lưới các Thẻ Chức năng (`.feature-card`) hiển thị trực quan thông tin mô tả, mã quyền và khối 5 ô thẩm quyền của các đối tượng.
  - 4 Thẻ KPI: 17 Màn hình hệ thống, 46 Chức năng hạt mịn, 5 Đối tượng chuẩn hóa, 4 Chốt chặn an ninh cốt lõi.
  - Bộ lọc thông minh 4 cấp: Lọc theo 5 Phân hệ, Lọc theo Màn hình cụ thể, Lọc theo Mức độ quyền (`Toàn quyền`, `Nội bộ nhóm`, `Có điều kiện`, `Chỉ bản thân`, `Khóa / Cấm`), và Tìm kiếm từ khóa thời gian thực.
  - Thanh chọn đối tượng (Pill Selector): Bấm chọn từng vai trò để tự động làm nổi bật (highlight) cột thẩm quyền (ở dạng Bảng) hoặc ô thẩm quyền (ở dạng Thẻ).
  - Thu gọn / Mở rộng (Expand / Collapse): Hỗ trợ thu gọn/mở rộng từng trang hoặc toàn bộ các trang.
  - Hộp Modal tra cứu chi tiết điều kiện kỹ thuật, decorator `@RequirePermissions` và ràng buộc cơ sở dữ liệu khi click vào bất kỳ ô phân quyền nào.
  - Tối ưu hóa chế độ in ấn (Print View / Export).

---

## 6. Kịch bản kiểm thử (Test Plan for Agent)

1. **TC-PERM-01**: Bỏ quyền `cdr:download_audio` của vai trò `USER_RECORDING` trong ma trận, lưu lại, đăng nhập lại bằng tài khoản thành viên có `can_access_recording = 1` và gọi API tải file ghi âm, kiểm tra nhận về lỗi `403 FORBIDDEN`. Thêm: bật `can_access_recording` cho một thành viên khi nhóm có `allow_recording_access = 0`, kiểm tra API nghe/tải vẫn trả `403`.
2. **TC-PERM-02**: Thử sửa quyền của Root Admin, xác nhận hệ thống vô hiệu hóa checkbox và không thay đổi trong CSDL.
3. **TC-PERM-03**: Nhấn "Khôi phục", kiểm tra toàn bộ checkbox trở lại trạng thái ban đầu trước khi sửa.
