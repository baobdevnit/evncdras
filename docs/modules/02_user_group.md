# MODULE 02: QUẢN LÝ NHÓM NGƯỜI DÙNG (USER GROUP / TỔ CHỨC QLND)

## Đường dẫn tài liệu: `docs/modules/02_user_group.md`

## Ánh xạ giao diện mẫu
- **Khu vực Admin**: `templates/admin/user_group.html` → `UserGroupView.vue` (route `admin.user-groups`, mục 5.1–5.2).
- **Khu vực Member**: `templates/member/group-admin.html` → `GroupAdminView.vue` (route `member.group-admin`), `templates/member/group-members.html` → `GroupMembersView.vue` (route `member.group-members`) (mục 5.3–5.4).

---

## 1. Mục tiêu & Nghiệp vụ (Business Overview)

### 1.1. Bối cảnh nghiệp vụ

Trong kiến trúc quản trị người dùng phân tán và phân định phạm vi dữ liệu (Data Scoping / Multi-tenancy) của hệ thống EVN CDR AS:

- **Cây tổ chức (`organizations`)**: Phản ánh cơ cấu hành chính - điều hành chung của EVN (Tập đoàn -> Tổng công ty -> Khối/Ban/Công ty -> Điện lực/Phòng ban).
- **Nhóm người dùng (User Group / Tổ chức Quản lý Người dùng - QLND)**: Là thực thể trung tâm quản lý tài khoản người dùng và là đơn vị sở hữu không gian dữ liệu cuộc gọi (Tenant Unit).
- **3 vai trò người dùng trong Nhóm (User Scope)**: mỗi người dùng mang đúng 1 vai trò, lưu ở `user_roles`; quyền của vai trò lấy từ `permission_roles` (`docs/modules/10_permissions_and_roles.md`). Quyền cấp nhóm duy nhất là `user_groups.allow_recording_access`, lưu trực tiếp trên nhóm.
  1. `GROUP_ADMIN` (Quản trị viên nhóm):
     - Bản chất là thành viên của nhóm được trao quyền quản trị nội bộ đơn vị.
     - Toàn quyền CRUD đối với thành viên nội bộ nhóm (`user:create`, `user:view`, `user:edit`, `user:delete`), không được chuyển nhóm thành viên.
     - Bổ nhiệm / hạ quyền Quản trị nhóm cho thành viên khác trong nhóm (đổi vai trò sang/khỏi `GROUP_ADMIN`, cần `group:manage_admin`), bảo toàn tối thiểu 1 Group Admin đang hoạt động.
     - Phân quyền nghe ghi âm Tầng 2: đổi vai trò thành viên giữa `REGULAR_USER` và `USER_RECORDING` (cần `group:toggle_recording`) khi Tầng 1 mở.
     - Mặc định tự động có quyền nghe trực tuyến & tải ghi âm thoại của nhóm khi nhóm được mở Tầng 1 (`allow_recording_access = 1`).
     - Toàn quyền xem log CDR (chi tiết 87 trường, bộ lọc nâng cao, xuất Excel), phân tích QoS và xem/xuất báo cáo thống kê trong phạm vi nhóm (`Group-Based Data Isolation`).
  2. `USER_RECORDING` (Thành viên nghe ghi âm):
     - Thành viên được Quản trị viên nhóm gán vai trò `USER_RECORDING` khi nhóm đã được cấp phép Tầng 1.
     - Được quyền nghe trực tuyến (`cdr:listen_audio`) và tải file ghi âm (`cdr:download_audio`) của nhóm mình.
     - Có toàn bộ các quyền đối với dữ liệu CDR, phân tích QoS và xem/xuất báo cáo thống kê theo nhóm tương tự Quản trị viên nhóm.
     - Không có thẩm quyền quản trị thành viên (không CRUD người dùng, không đổi vai trò người khác).
     - Nếu nhóm bị tắt Tầng 1, vai trò được giữ nguyên nhưng mất quyền nghe/tải cho tới khi Tầng 1 bật lại.
  3. `REGULAR_USER` (Thành viên):
     - Vai trò mặc định khi tạo thành viên.
     - **Điểm khác biệt DUY NHẤT so với `USER_RECORDING`**: Bị khóa hoàn toàn quyền nghe và tải file ghi âm cuộc gọi (ẩn trên giao diện, chặn `403 FORBIDDEN_PERMISSION` tại API).
     - **Còn lại GIỐNG HỆT 100% `USER_RECORDING` và CÓ QUYỀN TƯƠNG TỰ Quản trị viên nhóm** đối với việc xem nhật ký CDR, xem chi tiết 87 trường, lọc nâng cao, xuất Excel, xem phân tích QoS và xem/xuất báo cáo thống kê trong phạm vi nhóm.
     - Không có thẩm quyền quản trị thành viên.
- **4 Ràng buộc nghiệp vụ cốt lõi của Nhóm người dùng**:
  1. **Chứa nhiều người dùng thành viên (Quan hệ 1 - N) & Tính cố định nhóm**: Mỗi nhóm người dùng quản lý một tập hợp nhiều tài khoản người dùng thành viên (`users`). **Người dùng luôn luôn thuộc về một nhóm người dùng cố định ngay từ lúc tạo ra** (bản chất là người dùng thuộc đơn vị tổ chức), do đó **hoàn toàn không có khái niệm chuyển người dùng giữa các nhóm**. Thuộc tính `user_group_id` là bất biến (immutable) sau khi khởi tạo.
  2. **Có ít nhất một người dùng Quản trị viên nhóm & Thẩm quyền tạo người dùng (Group Admin Rule)**: Mỗi nhóm người dùng bắt buộc phải có **tối thiểu một người dùng đóng vai trò Quản trị viên nhóm** (vai trò `GROUP_ADMIN` trong `user_roles`). Quản trị viên nhóm **cũng là một thành viên trong nhóm nhưng được trao quyền quản trị**. Tài khoản người dùng có thể được tạo ra bởi:
     - **Quản trị viên hệ thống (System Admin)**: Có toàn quyền tạo người dùng cho bất kỳ Nhóm người dùng nào trong toàn hệ thống.
     - **Quản trị viên nhóm (Group Admin)**: Có quyền tạo mới tài khoản thành viên nhưng **chỉ được phép tạo trong phạm vi nhóm của chính mình**.
  3. **Liên kết với một Nhóm đầu số điện thoại theo ràng buộc 1 - 1 (1-to-1 Phone Prefix Group Binding)**: Mỗi nhóm người dùng liên kết độc quyền với **duy nhất một nhóm đầu số điện thoại** (`phone_prefix_groups`). Toàn bộ dữ liệu cuộc gọi CDR, file ghi âm và lưu lượng cuộc gọi phát sinh từ các đầu số này thuộc quyền quản lý của nhóm. Ngược lại, một nhóm đầu số chỉ thuộc duy nhất một nhóm người dùng (không chia sẻ giữa các nhóm). Nhóm đầu số **được tạo tự động** khi tạo nhóm người dùng (`code = 'PG-' + code nhóm`, `name = 'Nhóm đầu số ' + tên nhóm`), không chọn và không đổi được (`docs/01_database_schema.md` mục 4.1).
  4. **Tham chiếu Cây tổ chức linh hoạt (0..1 - N Organization Reference)**:
     - **Một đơn vị có nhiều nhóm người dùng**: Một đơn vị trên cây tổ chức có thể có nhiều nhóm người dùng trực thuộc (ví dụ: Khối CNTT có thể có nhóm "Vận hành Hệ thống", nhóm "An toàn thông tin"...).
     - **Có thể không tham chiếu đến đơn vị nào**: Nhóm người dùng có thể độc lập, không tham chiếu đến bất kỳ đơn vị tổ chức nào (`organization_id = NULL`), phục vụ cho các tổ công tác kiểm toán liên đơn vị, nhóm chuyên gia ngoài hoặc các tổ dự án đặc thù toàn hệ thống.

---

### 1.2. Sơ đồ Thực thể Quan hệ Nghiệp vụ (Business ERD)

```mermaid
erDiagram
    ORGANIZATIONS ||--o{ USER_GROUPS : "tham chiếu cây đơn vị (organization_id nullable)"
    USER_GROUPS ||--|| PHONE_PREFIX_GROUPS : "liên kết 1 - 1 độc quyền (unique fk); nhóm đầu số tạo tự động cùng nhóm người dùng"
    USER_GROUPS ||--o{ USERS : "1 nhóm chứa 0..n thành viên (cố định từ lúc tạo, không chuyển nhóm); quy tắc ít nhất 1 GROUP_ADMIN hoạt động do service bảo đảm"
    USERS ||--|| USER_ROLES : "mang đúng 1 vai trò"
    PHONE_PREFIX_GROUPS ||--o{ PHONE_PREFIX_RANGES : "tập hợp 0..n dải số prefix"
    PHONE_PREFIX_RANGES |o--o{ PHONE_NUMBERS : "phân bổ từ kho số tổng 90.000 số (range_id NULL: kho tự do)"
    USER_GROUPS ||..o{ PREFIX_ALLOCATION_HISTORY : "lưu vết cấp phát dải số (snapshot, không FK)"
    PHONE_NUMBERS ||..o{ PHONE_NUMBER_RANGE_HISTORY : "lưu vết gán số vào dải (snapshot theo phone_number, không FK)"

    USER_GROUPS {
        int id PK
        int organization_id FK "Nullable: Có thể không gắn đơn vị tổ chức"
        int phone_prefix_group_id FK "Unique: Ràng buộc 1 - 1 bắt buộc"
        string code "Mã nhóm QLND (Unique)"
        string name "Tên nhóm người dùng"
        int representative_user_id FK "Người đại diện (phải là 1 trong các group admin)"
        string status "ACTIVE/INACTIVE"
        datetime created_at
        datetime updated_at
    }

    USERS {
        int id PK
        int user_group_id FK "Khóa ngoại bắt buộc thuộc 1 nhóm (Bất biến - Immutable, không chuyển nhóm)"
        string username "Unique"
        string email "Unique"
        string full_name
        string status "ACTIVE/LOCKED/INACTIVE"
    }

    USER_ROLES {
        int user_id PK "Mỗi user đúng 1 vai trò"
        int role_id FK "GROUP_ADMIN / USER_RECORDING / REGULAR_USER (tối thiểu 1 GROUP_ADMIN ACTIVE mỗi nhóm)"
    }

    PHONE_PREFIX_GROUPS {
        int id PK
        string code "Mã nhóm đầu số (Unique, sinh tự động = PG- + mã nhóm, vd: PG-UMO-IT)"
        string name "Tên nhóm đầu số"
        string description "Không có cột trạng thái: trạng thái là của nhóm người dùng gắn với nó"
    }

    ORGANIZATIONS {
        int id PK
        int parent_id FK "Cây phân cấp"
        string code "Mã đơn vị (Unique)"
        string name "Tên đơn vị"
        int level
    }
```

---

### 1.3. Bốn Quy tắc Nghiệp vụ Chi tiết (Core Business Rules)

| Mã quy tắc | Tên quy tắc | Mô tả chi tiết & Ràng buộc xử lý |
| :--- | :--- | :--- |
| **BR-UG-01** | **Nhóm chứa nhiều thành viên (1 - N) & Không chuyển nhóm** | - Một nhóm người dùng (`user_groups`) chứa một danh sách từ $1$ đến $N$ tài khoản người dùng (`users`).<br>- **Người dùng luôn thuộc cố định 1 nhóm người dùng ngay từ lúc tạo ra** (`users.user_group_id NOT NULL`, bản chất là thuộc đơn vị tổ chức). Hệ thống **không có khái niệm chuyển người dùng giữa các nhóm**; thuộc tính `user_group_id` là bất biến (immutable).<br>- **Thẩm quyền tạo người dùng**: Tài khoản có thể được tạo ra bởi **Quản trị viên hệ thống** (toàn quyền chọn nhóm bất kỳ) hoặc **Quản trị viên nhóm** (cũng là một thành viên trong nhóm có quyền quản trị, chỉ được tạo trong nhóm của mình).<br>- **Phân quyền thành viên thường**: Cả hai loại thành viên thường (`USER_RECORDING` và `REGULAR_USER`) đều không có quyền quản trị (không thể thêm/sửa/xóa thành viên hoặc chuyển quyền admin).<br>- **Ngừng hoạt động nhóm kéo theo thành viên**: Ngừng hoạt động (xóa mềm) nhóm chuyển mọi thành viên chưa `INACTIVE` (kể cả Quản trị viên nhóm cuối cùng) sang `INACTIVE` trong cùng transaction, sau khi Quản trị viên hệ thống xác nhận. Nhóm không bao giờ bị xóa cứng (`docs/01_database_schema.md` mục 14). |
| **BR-UG-02** | **Tối thiểu 1 Quản trị viên nhóm (Group Admin Rule) & Thẩm quyền quản trị** | - Trong danh sách thành viên của nhóm, bắt buộc phải có **ít nhất 1 người dùng `ACTIVE` mang vai trò `GROUP_ADMIN`**.<br>- Nhóm được phép có nhiều quản trị viên nhóm (Multi-admin).<br>- Người đại diện chính (`representative_user_id`) phải là một trong các Quản trị viên nhóm.<br>- **Thẩm quyền của Quản trị viên nhóm**: Toàn quyền CRUD thành viên nội bộ nhóm (`user:create`, `user:view`, `user:edit`, `user:delete`), quyền bổ nhiệm hoặc hạ quyền Quản trị nhóm cho thành viên khác trong nhóm (`group:manage_admin`), và quyền đổi vai trò thành viên giữa `REGULAR_USER` và `USER_RECORDING` (`group:toggle_recording`). Mọi thay đổi vai trò qua `PUT /api/v1/users/:id/role`.<br>- **Bảo toàn Quản trị viên (Safeguard)**: Khi một nhóm chỉ còn đúng 1 Quản trị viên nhóm, hệ thống chặn tuyệt đối (`409`) các thao tác: hạ quyền admin về user thường, khóa (`LOCKED`) hoặc xóa tài khoản user đó (do người dùng cố định vào nhóm, không chuyển nhóm; `docs/01_database_schema.md` mục 14). Phải bổ nhiệm một thành viên khác lên làm Quản trị viên nhóm trước khi chuyển giao. |
| **BR-UG-03** | **Liên kết 1 - 1 với Nhóm đầu số điện thoại & Cô lập dữ liệu CDR** | - Mỗi nhóm người dùng liên kết với duy nhất một nhóm đầu số điện thoại (`phone_prefix_groups`) theo quan hệ **1 - 1** (`phone_prefix_group_id` có ràng buộc `UNIQUE`).<br>- Một nhóm đầu số điện thoại không được phép gán cho nhiều hơn 1 nhóm người dùng.<br>- **Phạm vi phân quyền dữ liệu (Group-Based Data Isolation)**: Bảng `cdr_enriched` được tiến trình Batch Scheduler tự động làm giàu thông tin `caller_group_id` và `called_group_id` dựa trên dải số và máy lẻ của nhóm này.<br>- **Quyền bình đẳng về dữ liệu trong nhóm**: Quản trị viên nhóm (`GROUP_ADMIN`), Thành viên nghe ghi âm (`USER_RECORDING`) và Thành viên (`REGULAR_USER`) đều có **quyền hạn tương tự và bình đẳng** đối với việc xem nhật ký cuộc gọi CDR (danh sách, chi tiết 87 trường, lọc nâng cao theo IP/mã ngắt kết nối, xuất file Excel), phân tích chỉ số QoS cuộc gọi và xem/xuất báo cáo thống kê trong phạm vi nhóm mình (`caller_group_id = user_group_id OR called_group_id = user_group_id`).<br>- Nhóm đầu số được tạo tự động lúc tạo nhóm, **không đổi được** sau đó (body có `phonePrefixGroupId` thì `400`, mục 3.2, 3.3). |
| **BR-UG-04** | **Tham chiếu Cây tổ chức tùy chọn (0..1 - N)** | - **1 đơn vị có nhiều nhóm (1 - N)**: Một đơn vị trong cây tổ chức (`organizations`) có thể quản lý 0, 1 hoặc nhiều nhóm người dùng trực thuộc.<br>- **Cho phép không thuộc đơn vị nào (Nullable)**: Thuộc tính `organization_id` trong `user_groups` cho phép nhận giá trị `NULL`. Các nhóm này hoạt động như các nhóm độc lập (Standalone Groups) cấp toàn hệ thống hoặc nhóm dự án đặc thù.<br>- **Hierarchy Path**: Nếu `organization_id` có giá trị, hệ thống tính toán chuỗi cấp bậc từ gốc tới đơn vị (ví dụ: `["Tổng công ty 71", "Khối CNTT"]`). Nếu `organization_id = NULL`, `hierarchyPath` trả về mảng rỗng `[]` và hiển thị trên giao diện là "Nhóm độc lập". |
| **BR-UG-05** | **Mô hình Phân quyền Ghi âm Kiểm soát 2 Tầng (2-Tier Recording Access Gate)** | - **Tầng 1 (Cấp nhóm - System Admin kiểm soát)**: Quản trị viên hệ thống (Admin Portal) có thẩm quyền tối cao cấp hoặc thu hồi quyền truy cập ghi âm cho từng Nhóm người dùng thông qua cờ `allow_recording_access` (cấu hình trong form Thêm/Sửa nhóm `PUT /api/v1/admin/user-groups/:id`).<br>  + **Nếu nhóm chưa được cấp phép (`allow_recording_access = 0`)**: Mọi tính năng liên quan đến ghi âm bị triệt tiêu khỏi giao diện người dùng của nhóm đó: Cột "File ghi âm" bị loại bỏ hoàn toàn khỏi bảng lịch sử cuộc gọi (bảng co về 6 cột); trong Modal chi tiết cuộc gọi, khối Audio Player được thay thế bằng thông báo *"Tính năng ghi âm chưa được kích hoạt cho đơn vị của bạn"*; trên giao diện Quản trị nhóm (`group-admin.html`), các cột và nút bấm/switch phân quyền ghi âm cho thành viên bị ẩn triệt để; Backend chặn toàn bộ API stream và download ghi âm với mã lỗi `403 GROUP_RECORDING_DISABLED`.<br>  + **Nếu nhóm được cấp phép (`allow_recording_access = 1`)**: Kích hoạt Tầng 2.<br>- **Tầng 2 (Vai trò - Group Admin kiểm soát khi Tầng 1 đã mở)**: quyền nghe/tải là quyền của vai trò (`permission_roles`), không lưu cờ trên người dùng.<br>  + **Quản trị viên nhóm (`GROUP_ADMIN`)**: Vai trò có sẵn `cdr:listen_audio`, `cdr:download_audio`, nên mặc định nghe/tải được ghi âm của nhóm.<br>  + **Người dùng thành viên**: Quản trị viên nhóm bật/tắt quyền nghe/tải bằng cách đổi vai trò thành viên (`PUT /api/v1/users/:id/role`).<br>    * **Thành viên nghe ghi âm (`USER_RECORDING`)**: được nghe trực tuyến (`cdr:listen_audio`) và tải file ghi âm (.wav) (`cdr:download_audio`) của nhóm mình.<br>    * **Thành viên (`REGULAR_USER`)**: bị khóa hoàn toàn tính năng nghe/tải (hiển thị trạng thái khóa và bị chặn API). Đây là điểm khác biệt duy nhất giữa hai vai trò thành viên.<br>- **Thứ tự kiểm tra**: quyền nhóm (Tầng 1) trước, quyền vai trò (Tầng 2) sau (`docs/modules/10_permissions_and_roles.md` mục 2.3). |

---

### 1.4. Chức năng chính của Module

1. **Hiển thị danh sách nhóm người dùng**:
   - Mã nhóm (`code`), Tên nhóm (`name`).
   - Người đại diện nhóm (Avatar, Họ tên, Email).
   - Số lượng Quản trị viên nhóm (`adminCount`, bảo đảm $\ge 1$).
   - Số lượng người dùng trực thuộc (`userCount` / `badge-count`).
   - Nhóm đầu số điện thoại liên kết 1-1 (Mã nhóm, Tên nhóm đầu số, các dải số: `42xxx, 46xxx`).
   - Đơn vị tổ chức tham chiếu & Chuỗi cấp bậc (`hierarchyPath`), hoặc nhãn "Nhóm độc lập" nếu `organization_id = NULL`.
   - Ngày thiết lập, trạng thái hoạt động (`ACTIVE`/`INACTIVE`).
   - Thao tác: Xem chi tiết thành viên & admin, Chỉnh sửa, Quản lý phân quyền, Xóa nhóm.
2. **Thiết lập mới & Chỉnh sửa Nhóm người dùng (`#userGroupModal`)**:
   - Chọn vị trí đơn vị trên Cây tổ chức (Tùy chọn: có thể chọn một đơn vị hoặc để trống "Không gắn đơn vị / Nhóm độc lập").
   - Nhập Mã nhóm và Tên nhóm.
   - Không chọn Nhóm đầu số: hệ thống tự tạo nhóm đầu số 1-1 cho nhóm mới (mã `PG-<mã nhóm>`). Dải số cấp sau qua màn hình Quản lý đầu số.
   - Khai báo **Quản trị viên nhóm đầu tiên** (tên đăng nhập, email, họ tên, số điện thoại, chức danh). Tài khoản này được tạo cùng lúc với nhóm, trong một transaction, vì người dùng không thể tồn tại ngoài nhóm.
   - **Cấu hình Quyền Ghi âm Nhóm (`allowRecordingAccess`)**: Trường chuyển đổi Switch/Checkbox "Cho phép nhóm nghe và tải ghi âm thoại IP" do Quản trị viên hệ thống thiết lập (Chốt chặn Tầng 1 - BR-UG-05).
   - Ghi chú / Mô tả.
3. **Quản lý danh sách thành viên & Quản trị viên**:
   - Thêm thành viên vào nhóm.
   - Bổ nhiệm Quản trị viên nhóm (`Promote to Admin`).
   - Hạ quyền Quản trị viên (Chặn nếu chỉ còn 1 Quản trị viên duy nhất).
4. **Chế độ xem phân nhóm theo tổ chức (`tree-view` / Org grouping)**:
   - Gom nhóm trực quan danh sách User Groups theo từng Đơn vị trên Cây tổ chức.
   - Bổ sung nhóm mục đặc biệt: "Nhóm độc lập (Không gắn đơn vị)" hiển thị các nhóm có `organization_id = NULL`.
5. **Ràng buộc an toàn khi xóa**:
   - "Xóa" nhóm là **ngừng hoạt động** (`status = INACTIVE`, xóa mềm). Hộp xác nhận hiển thị số thành viên chưa `INACTIVE` sẽ bị ngừng hoạt động cùng nhóm; xem API 3.4 và `docs/01_database_schema.md` mục 14.
   - Hộp xác nhận có ô chọn "Thu hồi toàn bộ dải số" (mặc định **không** chọn). Chọn thì dải số của nhóm được thu hồi về kho; không chọn thì dải vẫn thuộc nhóm `INACTIVE` (thu hồi sau từng dải). Liên kết với Nhóm đầu số **luôn được giữ nguyên** (nhóm đầu số có thể rỗng) để báo cáo lịch sử vẫn đúng.

---

## 2. Thiết kế Dữ liệu (Database Schema)

### 2.1. Bảng Nhóm đầu số điện thoại (`phone_prefix_groups`)

Thực thể gom nhóm các dải đầu số viễn thông PABX, dùng để liên kết 1 - 1 với Nhóm người dùng.

> DDL chuẩn của `phone_prefix_groups` (mục 4.1) chỉ định nghĩa tại `docs/01_database_schema.md`. Module này không chép lại DDL để tránh lệch; khi sinh code, entity và migration lấy từ `01`.

---

### 2.2. Bảng Nhóm người dùng (`user_groups`)

- Cột `organization_id`: Cho phép `NULL` (Quan hệ 0..1 - N với `organizations`).
- Cột `phone_prefix_group_id`: Bắt buộc và có `UNIQUE KEY` (Quan hệ 1 - 1 với `phone_prefix_groups`).
- Khóa ngoại `representative_user_id`: Tham chiếu đến 1 user đại diện (đồng thời là 1 trong các group admin). Ràng buộc `fk_ug_rep_user` được bổ sung bằng `ALTER TABLE` sau khi tạo bảng `users` (mục 2.3) để tránh phụ thuộc vòng.

> DDL chuẩn của `user_groups` (mục 5) chỉ định nghĩa tại `docs/01_database_schema.md`. Module này không chép lại DDL để tránh lệch; khi sinh code, entity và migration lấy từ `01`.

---

### 2.3. Bảng Người dùng (`users`) & Quản trị viên nhóm

- Cột `user_group_id`: Tham chiếu bắt buộc tới nhóm người dùng (Quan hệ 1 - N: 1 nhóm chứa nhiều thành viên).
- Vai trò người dùng lưu ở `user_roles` (`docs/01_database_schema.md` mục 7), không phải cột của `users`. Mỗi nhóm có ít nhất 1 người dùng `ACTIVE` mang vai trò `GROUP_ADMIN`.

> DDL chuẩn của `users` (mục 6) chỉ định nghĩa tại `docs/01_database_schema.md`. Module này không chép lại DDL để tránh lệch; khi sinh code, entity và migration lấy từ `01`.

---

## 3. Đặc tả API Contracts

### 3.1. `GET /api/v1/user-groups`

- **Mục đích**: Lấy danh sách nhóm người dùng, kèm thông tin người đại diện, số thành viên, danh sách/số lượng admin, nhóm đầu số 1-1 và chuỗi cấp bậc tổ chức (nếu có).
- **Query params**:
  - `page=1`, `limit=10`, `search=IT`
  - `organizationId=2`: Lọc theo đơn vị tổ chức cụ thể.
  - `organizationId=null` hoặc `isStandalone=true`: Lọc các nhóm độc lập không thuộc đơn vị nào.
- **Response**:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy danh sách nhóm QLND thành công",
  "data": [
    {
      "id": 1,
      "code": "UMO-IT",
      "name": "Khối Công nghệ Thông tin",
      "organizationId": 2,
      "organizationName": "Khối CNTT",
      "hierarchyPath": ["Tổng công ty 71", "Khối CNTT"],
      "phonePrefixGroup": {
        "id": 10,
        "code": "PG-UMO-IT",
        "name": "Nhóm đầu số Khối CNTT",
        "ranges": [
          { "rangeFrom": "42000", "rangeTo": "42999" },
          { "rangeFrom": "46000", "rangeTo": "46999" }
        ],
        "totalNumbers": 2000
      },
      "userCount": 45,
      "adminCount": 2,
      "representative": {
        "id": 10,
        "fullName": "Trần Thị B",
        "email": "tran.b@71portal.vn",
        "avatarUrl": "https://ui-avatars.com/api/?name=Tran+B",
        "roleCode": "GROUP_ADMIN"
      },
      "admins": [
        {
          "id": 10,
          "fullName": "Trần Thị B",
          "email": "tran.b@71portal.vn"
        },
        {
          "id": 15,
          "fullName": "Lê Văn C",
          "email": "le.c@71portal.vn"
        }
      ],
      "createdAt": "2026-05-24T00:00:00+07:00",
      "status": "ACTIVE"
    },
    {
      "id": 2,
      "code": "UMO-AUDIT",
      "name": "Tổ Giám sát Kiểm toán Độc lập",
      "organizationId": null,
      "organizationName": null,
      "hierarchyPath": [],
      "phonePrefixGroup": {
        "id": 12,
        "code": "PG-UMO-AUDIT",
        "name": "Nhóm đầu số Ban Kiểm toán",
        "ranges": [
          { "rangeFrom": "49000", "rangeTo": "49999" }
        ],
        "totalNumbers": 1000
      },
      "userCount": 8,
      "adminCount": 1,
      "representative": {
        "id": 28,
        "fullName": "Nguyễn Văn D",
        "email": "nguyen.d@audit.evn.vn",
        "avatarUrl": "https://ui-avatars.com/api/?name=Nguyen+D",
        "roleCode": "GROUP_ADMIN"
      },
      "admins": [
        {
          "id": 28,
          "fullName": "Nguyễn Văn D",
          "email": "nguyen.d@audit.evn.vn"
        }
      ],
      "createdAt": "2026-06-10T00:00:00+07:00",
      "status": "ACTIVE"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 2,
    "totalPages": 1,
    "hasNext": false,
    "hasPrev": false
  }
}
```

### 3.1.1. `GET /api/v1/user-groups/tree`

- **Mục đích**: dữ liệu cho tab `tree-view` (mục 1.4 ý 4, mục 5.1): nhóm người dùng gom theo nút trên cây tổ chức, kèm nhánh "Nhóm độc lập".
- **Guard / quyền**: `user_group:view`; có bản Admin `/api/v1/admin/user-groups/tree` (`docs/02_api_contracts.md` mục 1.1).
- **Query params**: `status` (`ACTIVE` | `INACTIVE`, không truyền là cả hai). Không phân trang.
- **Dựng cây**: dùng cùng thuật toán của `GET /organizations/tree` (`docs/modules/01_organization.md` mục 4.1), mỗi nút thêm mảng `userGroups` là các nhóm có `organization_id` = nút đó. Chỉ giữ các nút có nhóm ở chính nút hoặc ở nút con; nút không có nhóm nào trong cả nhánh bị lược khỏi cây. Nhóm có `organization_id = NULL` nằm ở `standaloneGroups`.
- **Phạm vi**: bản Admin trả mọi nhóm. Bản User chỉ trả nhóm của người gọi: cây chỉ còn đường đi từ gốc tới nút của nhóm đó, hoặc `organizations = []` và nhóm nằm trong `standaloneGroups` nếu nhóm không gắn đơn vị.
- **Phần tử nhóm**: `id`, `code`, `name`, `status`, `userCount` (thành viên chưa `INACTIVE`, như `userCount` của mục 3.1). Chi tiết khác (dải số, người đại diện) lấy từ mục 3.1 hoặc `GET /user-groups/:id`.
- **Response**:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy cây nhóm người dùng thành công",
  "data": {
    "organizations": [
      {
        "id": 1, "parentId": null, "code": "TC-71", "name": "Tổng công ty 71", "level": 0,
        "userGroups": [],
        "children": [
          {
            "id": 2, "parentId": 1, "code": "IT-01", "name": "Khối Công nghệ Thông tin", "level": 1,
            "userGroups": [ { "id": 1, "code": "UMO-IT", "name": "Khối Công nghệ Thông tin", "status": "ACTIVE", "userCount": 45 } ],
            "children": []
          }
        ]
      }
    ],
    "standaloneGroups": [
      { "id": 7, "code": "UMO-DVKH", "name": "Trung tâm Dịch vụ khách hàng", "status": "ACTIVE", "userCount": 12 }
    ]
  }
}
```

---

### 3.1.2. `GET /api/v1/user-groups/:id`

- **Response**: `data` gồm mọi trường của một phần tử mục 3.1 (`phonePrefixGroup`, `representative`, `admins`, `userCount`, `adminCount`, `hierarchyPath`…) và thêm `description`, `allowRecordingAccess`, `updatedAt`. Mỗi phần tử `phonePrefixGroup.ranges` có thêm `id`, `prefix`, `totalNumbers` để mở chi tiết dải (`GET /prefixes/:id`, `docs/modules/11_core_business_phone_numbers.md` mục 4.1.1). Không trả danh sách thành viên: bản Admin dùng `GET /admin/users?groupId=`, bản User dùng `GET /users` hoặc mục 3.6.
- **Phạm vi**: bản Admin xem mọi nhóm, kể cả `INACTIVE` (`representative = null`, `admins = []`). Bản User chỉ xem nhóm của người gọi; `:id` là nhóm khác trả `403 FORBIDDEN_SCOPE_ACCESS` (`docs/02_api_contracts.md` mục 2.3).
- `:id` không tồn tại trả `404`.

### 3.2. `POST /api/v1/admin/user-groups`

- **Mục đích**: Thiết lập nhóm người dùng mới.
- **Ràng buộc kiểm tra (Validation Rules)**:
  - Không nhận `phonePrefixGroupId` (gửi thì `400`): nhóm đầu số được tạo tự động ở bước 1.
  - `organizationId`: Không bắt buộc (cho phép `null` hoặc bỏ trống nếu là nhóm độc lập). Nếu có truyền, kiểm tra ID đơn vị phải tồn tại trên Cây tổ chức và đang `ACTIVE` (đơn vị `INACTIVE` trả `409 ORGANIZATION_INACTIVE`, `docs/01_database_schema.md` mục 4).
  - `initialAdmin`: Bắt buộc. Thông tin tài khoản Quản trị viên nhóm đầu tiên; `username`/`email` không được trùng với tài khoản **chưa `INACTIVE`** nào (kiểm tra `username_active`/`email_active`, `docs/01_database_schema.md` mục 6); trùng thì `409 ACCOUNT_DUPLICATE`.
- **Xử lý Backend (một transaction)**:
  1. Tạo dòng `phone_prefix_groups` (`code = 'PG-' + code`, `name = 'Nhóm đầu số ' + name`), rồi tạo dòng `user_groups` với `phone_prefix_group_id` trỏ tới nó.
  2. Tạo dòng `users` thuộc nhóm vừa tạo với `must_change_password = 1`, dòng `user_roles` mang vai trò `GROUP_ADMIN` và dòng `user_settings` (`user_type = USER`, giá trị mặc định, `docs/01_database_schema.md` mục 12), mật khẩu tạm ngẫu nhiên 16 ký tự đạt chính sách mật khẩu (`docs/01_database_schema.md` mục 6.1).
  3. Đặt `user_groups.representative_user_id` = id user vừa tạo.
  4. Ghi `audit_logs`: `USER_GROUP / CREATE` và `USER / CREATE`.
  5. Lỗi ở bất kỳ bước nào thì rollback toàn bộ.
- **Mật khẩu tạm** chỉ trả về **một lần** trong response (`initialAdmin.temporaryPassword`) để Quản trị viên hệ thống chuyển cho người phụ trách. Hệ thống chỉ lưu bản băm, không có API xem lại; quên thì dùng đặt lại mật khẩu.
- **Request Body**:

```json
{
  "code": "UMO-KD",
  "name": "Khối Kinh doanh & Dịch vụ Khách hàng",
  "description": "Nhóm quản lý người dùng khối kinh doanh",
  "organizationId": 2,
  "allowRecordingAccess": false,
  "initialAdmin": {
    "username": "admin.kd",
    "email": "admin.kd@evn.com.vn",
    "fullName": "Nguyễn Văn Quản",
    "phoneNumber": "0912345678",
    "jobTitle": "Trưởng phòng Kinh doanh"
  }
}
```

- **Response** (`201 Created`):

```json
{
  "success": true,
  "statusCode": 201,
  "data": {
    "id": 7,
    "code": "UMO-KD",
    "representativeUserId": 42,
    "initialAdmin": {
      "id": 42,
      "username": "admin.kd",
      "temporaryPassword": "q7Vt#2mPz9Lw!4Rk",
      "mustChangePassword": true
    }
  }
}
```

---

### 3.3. `PUT /api/v1/admin/user-groups/:id`

- **Mục đích**: Cập nhật thông tin nhóm người dùng.
- **Quy tắc**:
  - Nhóm đã `INACTIVE`: `409 GROUP_INACTIVE`; nhóm ngừng hoạt động chỉ còn đọc, không kích hoạt lại được (`docs/01_database_schema.md` mục 14).
  - **Không nhận `status`**: body có `status` thì trả `400`. Ngừng hoạt động chỉ qua `DELETE` (mục 3.4).
  - Cho phép cập nhật `organizationId` (gán sang đơn vị khác hoặc gán về `null` để chuyển thành nhóm độc lập). Đơn vị mới phải `ACTIVE` (`409 ORGANIZATION_INACTIVE`); giữ nguyên `organizationId` đang trỏ tới đơn vị `INACTIVE` thì không bị chặn.
  - **Không nhận `code`**: mã nhóm bất biến sau khi tạo (`phone_prefix_groups.code = 'PG-' + code`, mã không được dùng lại, `docs/01_database_schema.md` mục 5, 14); body có trường này thì trả `400`.
  - **Không nhận `phonePrefixGroupId`**: nhóm đầu số gắn cố định từ lúc tạo nhóm; body có trường này thì trả `400`. Muốn chuyển số sang nhóm khác thì thu hồi dải ở nhóm cũ và cấp dải cho nhóm mới (`docs/01_database_schema.md` mục 8).
  - Cập nhật tên, mô tả, người đại diện. `representativeUserId`: không gửi thì giữ nguyên; `null` thì bỏ người đại diện (`representative_user_id = NULL`); giá trị số thì người đó bắt buộc phải mang vai trò `GROUP_ADMIN` và `ACTIVE` trong nhóm, sai trả `400` (kiểm tra sau khi đã khóa dòng nhóm `SELECT ... FOR UPDATE`, quy tắc khóa tại `docs/01_database_schema.md` mục 14).
  - **Cập nhật quyền ghi âm nhóm (`allowRecordingAccess`)**: Chỉ Quản trị viên hệ thống (Admin Portal) mới có quyền sửa trường này. Tắt cờ không đổi vai trò của thành viên; quyền nghe/tải của cả nhóm bị chặn ngay ở request kế tiếp. Ghi `audit_logs` `TOGGLE_GROUP_RECORDING`.

```json
{
  "name": "Khối Kinh doanh - Chi nhánh 1",
  "description": "Cập nhật tên nhóm",
  "organizationId": null,
  "representativeUserId": 15,
  "allowRecordingAccess": true
}
```

---

### 3.4. `DELETE /api/v1/admin/user-groups/:id`

- **Mục đích**: Ngừng hoạt động nhóm người dùng (**xóa mềm**, chính sách tại `docs/01_database_schema.md` mục 14).
- **Quy tắc kiểm tra**:
  - Nhóm đã `INACTIVE`: `409 GROUP_INACTIVE`.
  - Không chặn theo số thành viên. Giao diện lấy số thành viên chưa `INACTIVE` (`SELECT COUNT(*) FROM users WHERE user_group_id = :id AND status <> 'INACTIVE'`) để hiển thị trong hộp xác nhận.
- **Khi thành công** (một transaction):
  - Mọi `users` của nhóm có `status <> 'INACTIVE'` chuyển sang `INACTIVE`, kể cả Quản trị viên nhóm cuối cùng (ngoại lệ duy nhất của quy tắc "tối thiểu 1 Quản trị viên nhóm", vì nhóm cũng ngừng hoạt động). Thu hồi mọi phiên còn hiệu lực của họ (`auth_sessions.revoked_reason = 'ACCOUNT_LOCKED'`). Ghi `audit_logs` `DEACTIVATE` (`resource_name = USER`) cho từng tài khoản, `action_details.reason = "GROUP_DEACTIVATED"`.
  - `user_groups.representative_user_id = NULL`, `user_groups.status = 'INACTIVE'`.
  - Chỉ khi `revokeRanges=true` (query, mặc định `false`): thu hồi toàn bộ dải số của nhóm đầu số liên kết theo quy tắc thu hồi (`docs/01_database_schema.md` mục 8), ghi `prefix_allocation_history` (`action_type = 'REVOKE'`, `decision_number = NULL`, `note` nêu lý do ngừng hoạt động nhóm, `docs/01_database_schema.md` mục 8 điểm 5), `phone_number_range_history` và tăng `cache_version`. Không thu hồi thì các số vẫn thuộc nhóm, CDR mới của chúng vẫn gán cho nhóm `INACTIVE`; Admin thu hồi sau bằng `DELETE /api/v1/admin/prefixes/:id`.
  - **Giữ nguyên** `phone_prefix_group_id`, CDR và stats của nhóm để báo cáo lịch sử vẫn đúng. Muốn dùng dải số cho nhóm khác thì thu hồi dải rồi cấp phát cho nhóm đó.
  - Ghi `audit_logs`.

---

### 3.5. Đổi vai trò thành viên (Bổ nhiệm Quản trị viên nhóm & Ủy quyền Nghe/Tải ghi âm)

- Dùng **một endpoint duy nhất** `PUT /api/v1/users/:id/role` với body `{ "roleCode": "GROUP_ADMIN" | "USER_RECORDING" | "REGULAR_USER" }` (có bản `/api/v1/admin/...`), đặc tả tại `docs/modules/10_permissions_and_roles.md` mục 1.3 và 3.2. Không có endpoint `/user-groups/:id/admins`, `/users/:id/group-admin` hay `/user-groups/:id/members/:userId/recording-access`.
- **Bổ nhiệm / Hạ quyền Quản trị viên nhóm** (sang/khỏi `GROUP_ADMIN`, cần `group:manage_admin`): hạ quyền bị chặn `409` nếu người đó là Quản trị viên nhóm đang hoạt động cuối cùng.
- **Ủy quyền nghe & tải ghi âm** (`REGULAR_USER` ↔ `USER_RECORDING`, cần `group:toggle_recording`, BR-UG-05): chuyển sang `USER_RECORDING` khi nhóm có `allow_recording_access = 0` bị từ chối `409 GROUP_RECORDING_DISABLED` ("Nhóm người dùng chưa được Quản trị viên hệ thống kích hoạt tính năng ghi âm").
- **Phạm vi**: Quản trị viên nhóm chỉ đổi vai trò thành viên cùng nhóm; Quản trị viên hệ thống đổi ở mọi nhóm. Thành viên thường (`USER_RECORDING`, `REGULAR_USER`) không có hai quyền trên nên bị `403 FORBIDDEN_PERMISSION`.
- **Audit Log**: ghi `CHANGE_ROLE` (`resource_name = USER`) kèm người thực hiện, thành viên mục tiêu, vai trò cũ và mới.

### 3.6. `GET /api/v1/user-groups/me/members` (Danh bạ nhóm – chỉ khu vực Member)

- **Mục đích**: cho **mọi** thành viên nhóm tra cứu liên hệ của đồng nghiệp cùng nhóm. Tách khỏi `GET /api/v1/users` (cần `user:view`, chỉ Quản trị viên nhóm có) để thành viên thường không nhận được dữ liệu quản trị tài khoản.
- **Guard / Quyền**: `UserAuthGuard` + `user_group:view` (cả 3 vai trò User đều có, `docs/modules/10_permissions_and_roles.md` mục 2.2). Không có bản `/api/v1/admin/...`: Admin xem thành viên nhóm qua `GET /api/v1/admin/users?groupId=`.
- **Phạm vi**: luôn là `req.user.userGroupId`; endpoint không nhận tham số nhóm. Chỉ trả tài khoản `status = 'ACTIVE'`.
- **Query params**: `page=1`, `limit=20` (tối đa 100), `search` (khớp `full_name`, `email`, `job_title`, `phone_number`), `roleCode` (`GROUP_ADMIN` \| `USER_RECORDING` \| `REGULAR_USER`). Sắp xếp: Quản trị viên nhóm trước, sau đó `full_name` tăng dần.
- **Response** `200`:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy danh bạ nhóm thành công",
  "data": [
    {
      "id": 10,
      "fullName": "Trần Thị B",
      "jobTitle": "Trưởng nhóm Kỹ thuật",
      "email": "tran.b@71portal.vn",
      "phoneNumber": "0905123456",
      "avatarUrl": "https://ui-avatars.com/api/?name=Tran+B",
      "roleCode": "GROUP_ADMIN"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 45, "totalPages": 3, "hasNext": true, "hasPrev": false }
}
```

- **Không trả**: `username`, `status`, `lastLoginAt`, `mustChangePassword`, `failedLoginCount`, `lockedUntil`, phiên đăng nhập.
- **Thông tin tóm tắt nhóm** (người đại diện, danh sách Quản trị viên nhóm, nhóm đầu số và dải số) lấy từ `GET /api/v1/user-groups/:id` với `id` là nhóm của người gọi.
- **Khai báo route NestJS**: đặt `@Get('me/members')` **trước** `@Get(':id')` trong `UserGroupsController` và dùng `ParseIntPipe` cho `:id`, để `me` không bị bắt nhầm là id.

---

## 4. Kiến trúc Backend NestJS (`backend/src/core`, `apps/*`)

Theo quy tắc `docs/00_overview_and_architecture.md` mục 5.1: nghiệp vụ và entity ở `core`, controller ở `apps/admin` / `apps/member`, job nền ở `apps/worker`; các phần `apps/*` không import lẫn nhau.

```
backend/src/
├── core/user-groups/
│   ├── user-groups.module.ts
│   ├── user-groups.service.ts          <-- CRUD nhóm, cây nhóm, danh bạ thành viên; nhận scope SYSTEM | GROUP
│   ├── dto/
│   │   ├── create-user-group.dto.ts
│   │   ├── update-user-group.dto.ts
│   │   ├── user-group-query.dto.ts
│   │   └── group-member-query.dto.ts
│   └── entities/
│       └── user-group.entity.ts
├── apps/admin/user-groups/
│   ├── admin-user-groups.module.ts
│   └── user-groups.controller.ts       <-- /api/v1/admin/user-groups* (đọc + POST, PUT, DELETE)
└── apps/member/user-groups/
    ├── member-user-groups.module.ts
    └── user-groups.controller.ts       <-- /api/v1/user-groups (GET list/tree/:id trong phạm vi nhóm), GET /user-groups/me/members
```

### 4.1. Hàm tính toán Hierarchy Path xử lý `organizationId` Nullable trong `user-groups.service.ts`

```typescript
async getHierarchyPath(organizationId: number | null): Promise<string[]> {
  // Nếu nhóm độc lập không gắn đơn vị tổ chức, trả về mảng rỗng
  if (!organizationId) {
    return [];
  }

  const path: string[] = [];
  let currentId: number | null = organizationId;
  
  while (currentId) {
    const org = await this.orgRepo.findOne({ where: { id: currentId } });
    if (!org) break;
    path.unshift(org.name);
    currentId = org.parentId;
  }
  
  return path;
}
```

### 4.2. Logic kiểm tra Tối thiểu 1 Quản trị viên

Ràng buộc 1 - 1 với nhóm đầu số không cần kiểm tra ở service: nhóm đầu số được tạo mới trong cùng transaction tạo nhóm (mục 3.2) và `uniq_ug_prefix_group` bảo đảm ở mức CSDL.

```typescript
async validateGroupAdminSafeguard(groupId: number, targetAdminUserId: number): Promise<void> {
  // Đếm Quản trị viên nhóm đang hoạt động, KHÔNG tính người sắp bị hạ quyền / ngừng hoạt động
  const remaining = await this.userRepo
    .createQueryBuilder('u')
    .innerJoin('u.userRole', 'ur')
    .innerJoin('ur.role', 'r')
    .where('u.userGroupId = :groupId', { groupId })
    .andWhere("r.code = 'GROUP_ADMIN'")
    .andWhere("u.status = 'ACTIVE'")
    .andWhere('u.id <> :id', { id: targetAdminUserId })
    .getCount();

  if (remaining < 1) {
    throw new ConflictException(
      'Nhóm người dùng bắt buộc phải có ít nhất một Quản trị viên nhóm. Không thể xóa hoặc hạ quyền quản trị viên duy nhất.',
    );
  }
}
```

---

## 5. Kiến trúc Frontend Vue 3

Module có màn hình ở cả 2 khu vực frontend (`docs/00_overview_and_architecture.md` mục 5.3):

| App | Route | View | Template nguồn | Quyền route | API chính |
| :--- | :--- | :--- | :--- | :--- | :--- |
| Admin | `/admin/user-groups` (`admin.user-groups`) | `src/apps/admin/views/organization/UserGroupView.vue` | `templates/admin/user_group.html` | `user_group:view` | `/api/v1/admin/user-groups*` |
| Member | `/group-admin` (`member.group-admin`) | `src/apps/member/views/group/GroupAdminView.vue` | `templates/member/group-admin.html` | `user:view` (chỉ `GROUP_ADMIN`) | `/api/v1/users*`, `PUT /api/v1/users/:id/role` |
| Member | `/group-members` (`member.group-members`) | `src/apps/member/views/group/GroupMembersView.vue` | `templates/member/group-members.html` | `user_group:view` (mọi vai trò User) | `GET /api/v1/user-groups/me/members`, `GET /api/v1/user-groups/:id` |

### 5.1. Khu vực Admin – `UserGroupView.vue`: Cấu trúc Component & Giao diện người dùng

- **Page Header**: Tiêu đề "Quản lý Nhóm người dùng (User Groups)", nút "Thiết lập mới" mở modal `#userGroupModal`.
- **Bộ Tabs**:
  - `list-view`: Hiển thị bảng dữ liệu phẳng hỗ trợ tìm kiếm, lọc theo đơn vị tổ chức hoặc xem riêng nhóm độc lập.
  - `tree-view`: Hiển thị cây phân cấp phân nhánh theo Đơn vị tổ chức. Bổ sung nhánh chuyên biệt: **"Nhóm độc lập (Không gắn đơn vị)"** để hiển thị các User Groups có `organization_id = NULL`.
- **Table Data Grid**:
  - Cột "Tổ chức QLND": Tên nhóm, Mã nhóm.
  - Cột "Đơn vị trên cây tổ chức": Hiển thị chuỗi cấp bậc `.hierarchy-path` (nếu có) hoặc thẻ badge màu trung tính `.badge-standalone: "Nhóm độc lập"`.
  - Cột "Nhóm đầu số điện thoại (1-1)": Badge hiển thị mã nhóm đầu số và danh sách prefix (`PG-UMO-IT: 42xxx, 46xxx`).
  - Cột "Quản trị viên nhóm": Hiển thị danh sách avatar/tên các admin kèm badge số lượng (`badge-admin-count`), đánh dấu người đại diện chính.
  - Cột "Số thành viên": Badge đếm tổng số users trực thuộc nhóm (`.badge-count`).
- **Modal Thiết lập mới / Chỉnh sửa (`#userGroupModal`)**:
  - Dropdown chọn đơn vị trên Cây tổ chức: Tùy chọn (Optional), cho phép chọn nút tổ chức hoặc chọn tùy chọn "Không gắn đơn vị (Nhóm độc lập)".
  - Khối "Quản trị viên nhóm đầu tiên" (chỉ khi tạo mới): nhập tên đăng nhập, email, họ tên, số điện thoại, chức danh. Sau khi lưu, hiển thị mật khẩu tạm **một lần** trong hộp thoại có nút sao chép và cảnh báo "Mật khẩu chỉ hiển thị một lần".

### 5.2. Khu vực Admin – Pinia Store (`useUserGroupStore`)

- State: `userGroups: UserGroupItem[]`, `loading: boolean`, `pagination: PaginationInfo` (không có danh sách nhóm đầu số để chọn: nhóm đầu số tạo tự động, mục 3.2).
- Actions:
  - `fetchUserGroups(query)`: Lấy danh sách nhóm (hỗ trợ filter orgId hoặc standalone).
  - `createUserGroup(payload)`: Kiểm tra ràng buộc 1-1 và admin tối thiểu $\ge 1$.
  - `updateUserGroup(id, payload)`: Cập nhật thông tin nhóm.
  - `changeMemberRole(userId, roleCode)`: Gọi `PUT /users/:id/role`; bắt lỗi `409` khi vi phạm tối thiểu 1 admin hoặc nhóm chưa mở Tầng 1.
  - `deleteUserGroup(id)`: Ngừng hoạt động nhóm (xóa mềm) kèm toàn bộ thành viên chưa `INACTIVE`; gọi sau khi người dùng xác nhận số thành viên bị ảnh hưởng.

### 5.3. Khu vực Member – `GroupAdminView.vue` (Quản trị nhóm)

- **Đối tượng**: chỉ vai trò `GROUP_ADMIN` (route yêu cầu `user:view`; menu ẩn mục này với thành viên thường).
- **Phạm vi**: chỉ thành viên nhóm mình; backend tự gán `userGroupId = req.user.userGroupId` (`docs/modules/03_auth_user.md`). Không có bộ chọn nhóm, không đổi được nhóm của thành viên (BR-UG-01).
- **Bảng thành viên**: `GET /api/v1/users` (lọc `search`, `status`, phân trang); thao tác Thêm (`POST /users`, hiển thị `temporaryPassword` một lần), Sửa (`PUT /users/:id`), Khóa/Mở khóa (`PUT /users/:id/status`), Đặt lại mật khẩu (`PUT /users/:id/reset-password`), Ngừng hoạt động (`DELETE /users/:id`).
- **Đổi vai trò**: `PUT /api/v1/users/:id/role` (mục 3.5); bắt `409` khi hạ Quản trị viên nhóm cuối cùng (BR-UG-02) hoặc nhóm chưa mở Tầng 1.
- **Ghi âm Tầng 1**: khi `GET /api/v1/auth/me` trả `userGroup.allowRecordingAccess = false`, ẩn hẳn cột, nút và lựa chọn vai trò `USER_RECORDING` (`docs/00_overview_and_architecture.md` mục 2.4).
- **Store**: `useGroupAdminStore` – state `members`, `pagination`, `loading`; actions `fetchMembers`, `createMember`, `updateMember`, `setMemberStatus`, `resetMemberPassword`, `changeMemberRole`, `deactivateMember`.

### 5.4. Khu vực Member – `GroupMembersView.vue` (Danh bạ nhóm)

- **Đối tượng**: mọi vai trò User (`GROUP_ADMIN`, `USER_RECORDING`, `REGULAR_USER`). **Chỉ đọc**: không có nút hay modal thêm/sửa/khóa/xóa.
- **Thẻ tóm tắt nhóm**: `GET /api/v1/user-groups/:id` với `id = userGroup.id` từ `GET /api/v1/auth/me` – tên nhóm, người đại diện, danh sách Quản trị viên nhóm, nhóm đầu số và dải số.
- **Danh bạ**: `GET /api/v1/user-groups/me/members` (mục 3.6); 2 chế độ xem Thẻ / Bảng; tìm kiếm theo họ tên, email, chức danh, số điện thoại; lọc theo vai trò; thao tác sao chép số điện thoại/email và `mailto:`.
- **Không hiển thị**: trạng thái tài khoản, lần đăng nhập cuối, nhãn quyền ghi âm của từng người. Trường `extension` (máy lẻ) trong mock của template không có trong bảng `users` nên không triển khai.
- **Store**: `useGroupDirectoryStore` – state `group`, `members`, `pagination`, `viewMode` (`card` \| `table`, trạng thái giao diện cục bộ); actions `fetchGroupSummary`, `fetchMembers`.

---

## 6. Kịch bản kiểm thử (Test Plan for Agent)

1. **TC-UG-01 (Nhiều thành viên)**: Tạo nhóm và gán 10 người dùng thành viên. Xác nhận API trả về `userCount = 10` và danh sách thành viên thuộc đúng nhóm.
2. **TC-UG-02 (Tối thiểu 1 Quản trị viên nhóm)**:
   - Thử tạo nhóm không có `initialAdmin` -> `400 Bad Request`. Tạo nhóm với `initialAdmin.email` đã tồn tại -> `409 ACCOUNT_DUPLICATE` và **không** có dòng `user_groups` nào được tạo (rollback). Tạo nhóm hợp lệ -> nhóm có đúng 1 Quản trị viên, `representative_user_id` trỏ tới người đó, response có `temporaryPassword`, đăng nhập lần đầu bị yêu cầu đổi mật khẩu.
   - Một nhóm có 1 Quản trị viên duy nhất, gọi API hạ quyền hoặc xóa user đó -> Xác nhận hệ thống chặn với thông báo lỗi yêu cầu duy trì ít nhất 1 Quản trị viên.
   - Thêm Quản trị viên thứ 2 vào nhóm -> Xác nhận hạ quyền 1 trong 2 người thành công.
3. **TC-UG-03 (Nhóm đầu số tạo tự động 1 - 1)**:
   - Tạo Nhóm người dùng `UMO-IT` -> có đúng 1 dòng `phone_prefix_groups` mới với `code = 'PG-UMO-IT'`, `user_groups.phone_prefix_group_id` trỏ tới nó, chưa có dải số.
   - Gửi `phonePrefixGroupId` trong body `POST` hoặc `PUT` -> `400`.
   - `POST /api/v1/admin/prefixes` cho nhóm đầu số của một nhóm `INACTIVE` -> `409 GROUP_INACTIVE`.
4. **TC-UG-04 (Tham chiếu Đơn vị Cây tổ chức tùy chọn & Nhóm độc lập)**:
   - Tạo Nhóm người dùng với `organizationId = null` -> Xác nhận tạo thành công, `hierarchyPath` trả về `[]`, giao diện hiển thị nhãn "Nhóm độc lập".
5. **TC-UG-05 (Một đơn vị tổ chức có nhiều nhóm người dùng)**:
   - Tạo 2 nhóm người dùng khác nhau (`UMO-IT-01` và `UMO-IT-02`) cùng trỏ về đơn vị `organizationId = 2` -> Xác nhận cả 2 nhóm đều lưu thành công, cùng hiển thị đúng `hierarchyPath` của đơn vị đó trên cây tổ chức.
6. **TC-UG-06 (Ràng buộc toàn vẹn khi ngừng hoạt động nhóm)**:
   - Nhóm có 1 Quản trị viên nhóm và 2 thành viên `ACTIVE`, gọi API DELETE không có `revokeRanges` -> Xác nhận nhóm có `status = 'INACTIVE'`, `representative_user_id = NULL`, cả 3 tài khoản có `status = 'INACTIVE'` và mọi phiên của họ bị thu hồi (`ACCOUNT_LOCKED`), dải số của nhóm vẫn còn (`range_id` không đổi), CDR và `stats_*` của nhóm vẫn còn nguyên. Sau đó `DELETE /api/v1/admin/prefixes/:id` trên dải của nhóm `INACTIVE` -> thành công.
   - Lặp lại với nhóm khác, gọi `DELETE ...?revokeRanges=true` -> mọi số trong dải của nhóm có `range_id = NULL` (số `ALLOCATED` về `FREE`, số `LOCKED` giữ nguyên), nhóm đầu số còn liên kết nhưng rỗng.
   - Gọi lại API DELETE trên nhóm đã `INACTIVE` -> `409 GROUP_INACTIVE`.
   - Trước khi ngừng hoạt động nhóm, gọi `DELETE /api/v1/users/:id` với Quản trị viên nhóm duy nhất -> `409` (quy tắc tối thiểu 1 Quản trị viên nhóm vẫn áp dụng khi nhóm còn `ACTIVE`).
7. **TC-UG-07 (Danh bạ nhóm cho thành viên thường)**:
   - Đăng nhập khu vực Member bằng `REGULAR_USER` -> mở `/group-members` thành công; `GET /api/v1/user-groups/me/members` trả `200`, chỉ thành viên `ACTIVE` cùng nhóm, không có trường `username`, `status`, `lastLoginAt`.
   - Cùng tài khoản gọi `GET /api/v1/users` -> `403 FORBIDDEN_PERMISSION`; menu không có mục "Quản trị nhóm", truy cập thẳng `/group-admin` -> trang 403 của khu vực Member.
