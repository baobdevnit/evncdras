# MODULE 11: NGHIỆP VỤ QUẢN LÝ ĐẦU SỐ, DẢI SỐ & KHO SỐ TỔNG THỂ PABX EVN (MASTER PHONE INVENTORY & PREFIX MANAGEMENT)

## Đường dẫn tài liệu: `docs/modules/11_core_business_phone_numbers.md`

## Ánh xạ giao diện mẫu
- **Khu vực Admin**: `templates/admin/prefix-management.html` (+ `.css`, `.js`) → `PrefixManagementView.vue` (route `admin.prefixes`); `templates/admin/prefix-history.html` (+ `.css`, `.js`) → `PrefixHistoryView.vue` (route `admin.prefix-history`).
- **Khu vực Member**: `templates/member/org-prefix.html` (+ `.css`, `.js`) → `OrgPrefixView.vue` (route `member.org-prefix`), chỉ xem dải số của nhóm mình.

---

## 1. Mục tiêu & Bối cảnh Nghiệp vụ (Business Overview)

### 1.1. Quy hoạch mạng đánh số điện thoại nội bộ EVN & Kho số tổng thể (Master Pool)

Mạng viễn thông PABX dùng riêng của Tập đoàn Điện lực Việt Nam (EVN) là mạng liên lạc điều độ và quản trị diện rộng toàn quốc kết nối hàng trăm tổng đài chi nhánh:

- **Quy hoạch độ dài số**: Chuẩn hóa cố định **5 chữ số** theo định dạng `[H][C][XXX]` (từ `10000` đến `99999`).
- **Kho số tổng thể (Master Phone Inventory)**:
  - Hệ thống duy trì một **kho số tổng thể cố định 90.000 số** (`10000` - `99999`) trong bảng `phone_numbers`.
  - Toàn bộ 90.000 số được khởi tạo sẵn (pre-seeded) với trạng thái mặc định ban đầu là `FREE` (chưa cấp phát vào dải số của đơn vị nào).
  - **Khối 0 (`0xxxx`)** là đầu số dịch vụ đặc biệt (PTT, liên tỉnh, di động, quốc tế), không phải máy lẻ, nên không seed vào kho. Số máy lẻ 4 chữ số của trạm cũ (đi qua bảng dịch số tổng đài) cũng nằm ngoài kho. Các số này khi xuất hiện trong CDR là **số ngoài kho**, nhóm sở hữu = NULL.
- **Không có khái niệm cấp phát máy lẻ cho cá nhân (`user_id`)**:
  - Trong mạng PABX EVN, số máy 5 số gắn liền với **vị trí thiết bị đầu cuối cố định**, bàn trực vận hành điều độ (A0, A1, A2, A3), trạm biến áp (500kV, 220kV, 110kV), nhà máy thủy điện/nhiệt điện, phòng điều hành hoặc văn phòng làm việc.
  - Người dùng phần mềm (`users`) là các tài khoản đăng nhập để tra cứu báo cáo và giám sát CDR, **hoàn toàn không sở hữu số máy lẻ cá nhân**. Bảng `users` không có trường `extension`.
  - Mọi biến động của số điện thoại được quản lý qua **Lịch sử gán số vào dải đầu số** (`phone_number_range_history`) và **Lịch sử cấp phát dải số cho Nhóm** (`prefix_allocation_history`).
- **Mối quan hệ cốt lõi với Phân quyền & Giám sát CDR (Group-Based Data Isolation)**:
  - Mỗi Nhóm người dùng (`user_groups`) liên kết 1 - 1 độc quyền với một Nhóm đầu số (`phone_prefix_groups`), được tạo tự động cùng nhóm người dùng (`docs/01_database_schema.md` mục 4.1).
  - Mỗi Nhóm đầu số sở hữu $0..n$ dải số cụ thể (`phone_prefix_ranges`); nhóm đầu số rỗng là hợp lệ.
  - Tiến trình Near-Realtime Batch Scheduler khi xử lý CDR thô sẽ tra cứu số gọi đi (`CallerId`) và số nhận (`CalledId`) vào kho số `phone_numbers` (chỉ qua `range_id → phone_prefix_ranges → user_groups`, quy tắc `docs/01_database_schema.md` mục 8) để xác định chính xác `caller_group_id` và `called_group_id` trên bảng `cdr_enriched`, đảm bảo tính cô lập dữ liệu tuyệt đối giữa các đơn vị thành viên EVN.

### 1.2. Các chức năng chính của Module

1. **Quản lý danh sách cấp phát dải số theo Nhóm người dùng**:
   - Hiển thị bảng tổng hợp theo Nhóm người dùng (User Group): Tên nhóm, Cây tổ chức tham chiếu, Các dải số được cấp (dưới dạng badge tag: `42 xxx (1.000 số)`), Tổng số điện thoại thuộc nhóm, Ngày cập nhật.
2. **Cấp phát / Thu hồi dải số (Prefix Management)**:
   - Thêm mới dải số cho Nhóm: Chọn Đầu số (Prefix), Độ dài số (5 số), Từ số (`000`), Đến số (`999`), Ghi chú địa bàn/vị trí.
   - Tự động kích hoạt trạng thái số trong Kho số tổng: Khi dải `42000 - 42499` được cấp cho Nhóm, 500 số tương ứng trong `phone_numbers` tự động chuyển từ `FREE` sang `ALLOCATED`, cập nhật `range_id`. Thông qua chuỗi quan hệ `range_id -> phone_prefix_ranges -> phone_prefix_groups -> user_groups`, nhóm sở hữu được xác định theo chuẩn 3NF.
   - Thu hồi dải số: mọi số thuộc dải về `range_id = NULL`; số `ALLOCATED` về `FREE`, số `RESERVED`/`LOCKED` giữ nguyên trạng thái (quy tắc tại `docs/01_database_schema.md` mục 8).
   - Kiểm tra giao thoa dải số (Overlap Detection): Dải mới hoặc dải sau khi sửa không được giao với **bất kỳ** dải nào khác, kể cả dải của cùng nhóm đầu số.
   - Kiểm tra biên dải số: `range_from`/`range_to` đều là 5 chữ số trong khoảng `10000`–`99999`, `range_from <= range_to`, và mọi số trong dải bắt đầu bằng đúng `prefix` của dải (một dải không được trải qua nhiều đầu số). Vi phạm trả về `400 BAD REQUEST`.
3. **Tra cứu & Khai báo danh bạ Kho số tổng thể 90.000 số**:
   - Tra cứu trạng thái từng số máy lẻ 5 số (`FREE`, `ALLOCATED`, `RESERVED`, `LOCKED`).
   - Cập nhật thông tin định danh bàn trực / vị trí lắp đặt (`display_name`, `description`).
4. **Kiểm toán & Lịch sử biến động (Audit & History)**:
   - Tra cứu Lịch sử cấp dải số (`prefix_allocation_history`): Quyết định phê duyệt, người thực hiện, thời điểm, quy định chốt quyền CDR.
   - Tra cứu Lịch sử điều chuyển từng số máy lẻ (`phone_number_range_history`): Theo dõi lịch sử gán vào dải, thu hồi về kho, khóa số cách ly.

---

## 2. Thiết kế Cơ sở Dữ liệu (Database Schema)

Hệ thống sử dụng 5 bảng MariaDB chuẩn hóa:

> DDL chuẩn của `phone_prefix_groups` (mục 4.1), `phone_prefix_ranges` (mục 8), `phone_numbers` (mục 8), `v_phone_numbers_detail` (mục 8), `prefix_allocation_history` (mục 8), `phone_number_range_history` (mục 8) chỉ định nghĩa tại `docs/01_database_schema.md`. Module này không chép lại DDL để tránh lệch; khi sinh code, entity và migration lấy từ `01`.

---

## 3. Thuật toán kiểm tra xung đột dải số & Đồng bộ Kho số tổng (Overlap & Sync Logic)

### 3.1. Thuật toán kiểm tra xung đột dải số (Overlap Detection)

Khi tạo hoặc sửa một dải số mới $(StartNew, EndNew)$ cho Nhóm:
1. Chuẩn hóa dải số về số nguyên 5 chữ số:
   $$StartNew = \text{int}(RangeFrom)$$
   $$EndNew = \text{int}(RangeTo)$$
2. Điều kiện giao thoa xung đột với bất kỳ dải số đã tồn tại $(StartExist, EndExist)$ (của mọi nhóm đầu số, kể cả cùng nhóm; khi sửa dải thì loại trừ chính dải đang sửa):
   $$\max(StartNew, StartExist) \le \min(EndNew, EndExist)$$
3. Nếu phát hiện giao thoa, transaction bị rollback lập tức và trả về `409 RANGE_OVERLAP` ("Dải số [StartNew - EndNew] bị trùng lặp với dải số đã cấp") (dải đã cấp có thể thuộc cùng nhóm hoặc nhóm khác).

### 3.2. Cơ chế đồng bộ Kho số tổng theo chuẩn 3NF (Master Pool State Transitions)

Trong cùng transaction tạo/cập nhật dải số:
- **Khi cấp phát dải số mới**:
  ```sql
  UPDATE phone_numbers 
  SET range_id = :rangeId,
      status = IF(status = 'FREE', 'ALLOCATED', status),  -- RESERVED/LOCKED giữ nguyên trạng thái
      allocated_at = CURRENT_TIMESTAMP
  WHERE phone_number >= :rangeFrom AND phone_number <= :rangeTo
    AND range_id IS NULL;  -- chốt chặn giao nhau ở mức CSDL khi hai request chạy đồng thời
  -- affectedRows phải bằng rangeTo - rangeFrom + 1; khác thì rollback và trả 409 (cùng thông báo với mục 3.1)
  ```
  Mọi số trong khoảng đều nhận `range_id` (kể cả `RESERVED`/`LOCKED`), nên quyền sở hữu CDR của các số này cũng thuộc nhóm (quy tắc tại `docs/01_database_schema.md` mục 8). Phần mở rộng khi sửa dải dùng cùng câu lệnh và cùng phép so `affectedRows` trên khoảng mở rộng. Kiểm tra mục 3.1 chạy trước để trả thông báo rõ ràng; điều kiện `range_id IS NULL` bắt trường hợp hai request chồng lấn cùng qua được mục 3.1.
  Đồng thời ghi nhận lịch sử vào `phone_number_range_history` với `action_type = 'ASSIGN_TO_RANGE'`.
- **Khi thu hồi dải số về kho**:
  ```sql
  UPDATE phone_numbers 
  SET range_id = NULL,
      status = IF(status = 'ALLOCATED', 'FREE', status),  -- RESERVED/LOCKED giữ nguyên trạng thái
      allocated_at = NULL
  WHERE range_id = :rangeId;
  DELETE FROM phone_prefix_ranges WHERE id = :rangeId;  -- chỉ chạy được sau khi đã dọn số (fk_pn_range RESTRICT)
  ```
  Đồng thời ghi nhận lịch sử vào `phone_number_range_history` với `action_type = 'REVOKE_FROM_RANGE'` và `prefix_allocation_history` với `action_type = 'REVOKE'`, cùng một transaction.
- Giá trị các cột `previous_range_from`/`previous_range_to`, `range_from`/`range_to`, `range_text`, `numbers_count`, `status_before`/`status_after` của dòng `prefix_allocation_history` theo từng `action_type` (`ALLOCATE`, `REVOKE`, `UPDATE`): bảng tại `docs/01_database_schema.md` mục 8, điểm 5.

---

## 4. Đặc tả API Contracts

### 4.1. Lấy danh sách dải số theo nhóm người dùng (`GET /api/v1/prefixes`)

- **Guard**: `UserAuthGuard` trên route User (chỉ dữ liệu nhóm mình); bản sao `/api/v1/admin/...` dùng `AdminAuthGuard` (quy tắc tách portal tại `docs/02_api_contracts.md` mục 1.1).
- Mỗi phần tử dải số trong response có thêm `counts`: `{ "total": 500, "allocated": 480, "reserved": 15, "locked": 5 }` (đếm `phone_numbers` theo `range_id` và `status`); bản User dùng cho widget dải số trên Dashboard thành viên. API không trả chuỗi hiển thị (`docs/02_api_contracts.md` mục 2): nhãn dải (vd. "42000 - 42499", "42 xxx (500 số)") do frontend ghép từ `prefix`, `rangeFrom`, `rangeTo`, `counts.total`.
- **Response**:

```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "userGroupId": 1,
      "userGroupName": "Khối Công nghệ Thông tin",
      "prefixGroupId": 1,
      "prefixGroupName": "Đầu số Khối CNTT",
      "prefixes": [
        {
          "id": 1,
          "prefix": "42",
          "numberLength": 5,
          "rangeFrom": "42000",
          "rangeTo": "42499",
          "counts": { "total": 500, "allocated": 480, "reserved": 15, "locked": 5 },
          "note": "Trụ sở chính Cửa Bắc"
        },
        {
          "id": 2,
          "prefix": "46",
          "numberLength": 5,
          "rangeFrom": "46500",
          "rangeTo": "46999",
          "counts": { "total": 500, "allocated": 500, "reserved": 0, "locked": 0 },
          "note": "Chi nhánh Cầu Giấy"
        }
      ],
      "totalRanges": 2,
      "totalNumbers": 1000,
      "updatedAt": "2026-05-24T09:30:00+07:00"
    }
  ]
}
```

### 4.2. Cấp phát dải số cho Nhóm (`POST /api/v1/admin/prefixes`)

- **Guard**: `AdminAuthGuard`, `Permission: prefix:manage`
- Mỗi request cấp **một** dải (thao tác theo từng dải để mỗi lần ghi một dòng lịch sử riêng). Sửa dải dùng `PUT /api/v1/admin/prefixes/:id`, thu hồi dùng `DELETE /api/v1/admin/prefixes/:id`. Nhóm đầu số được tạo tự động cùng nhóm người dùng; `/api/v1/admin/prefix-groups` chỉ có xem danh sách và sửa tên/mô tả (`docs/02_api_contracts.md` mục 3.6).
- **Nhóm người dùng phải `ACTIVE`**: khóa dòng `user_groups` gắn với `prefixGroupId` (`SELECT ... FOR UPDATE`), nhóm `INACTIVE` thì trả `409 GROUP_INACTIVE`. Áp dụng cho cả `PUT /api/v1/admin/prefixes/:id`. Thu hồi (`DELETE /api/v1/admin/prefixes/:id`) không đòi nhóm `ACTIVE` (`docs/01_database_schema.md` mục 8, 14).
- **Request Body**:

```json
{
  "prefixGroupId": 3,
  "prefix": "42",
  "rangeFrom": "42000",
  "rangeTo": "42499",
  "note": "Trụ sở chính Cửa Bắc",
  "decisionNumber": "QĐ 1444/EVN-VT&CNTT",
  "historyNote": "Cấp phát dải số phục vụ vận hành",
  "cdrOwnershipNote": "CDR của dải thuộc quyền nhóm từ thời điểm cấp phát"
}
```

- `note` → `phone_prefix_ranges.note`; `decisionNumber` (bắt buộc) → `prefix_allocation_history.decision_number`; `historyNote` → `prefix_allocation_history.note`; `cdrOwnershipNote` (bắt buộc) → `prefix_allocation_history.cdr_ownership_note`.
- **Sửa dải** (`PUT /api/v1/admin/prefixes/:id`): body `{ rangeFrom, rangeTo, note, decisionNumber, historyNote }`, `decisionNumber` bắt buộc như khi cấp phát; dòng `UPDATE` ghi `cdr_ownership_note = NULL` (`docs/01_database_schema.md` mục 8 điểm 5).
- **Thu hồi** (`DELETE /api/v1/admin/prefixes/:id`): body tùy chọn `{ "decisionNumber"?: string, "historyNote"?: string }` → `decision_number` / `note` của dòng `REVOKE`, thiếu thì NULL; `cdr_ownership_note` luôn NULL. Thu hồi do ngừng hoạt động nhóm (`revokeRanges=true`) ghi `decision_number = NULL` (`docs/01_database_schema.md` mục 8 điểm 5).

### 4.3. Tra cứu Kho số tổng thể 90.000 số (`GET /api/v1/phone-numbers/pool`)

- **Guard**: `UserAuthGuard` trên route User (chỉ dữ liệu nhóm mình); bản sao `/api/v1/admin/...` dùng `AdminAuthGuard` (quy tắc tách portal tại `docs/02_api_contracts.md` mục 1.1).
- **Query Params**: `rangeId`, `groupId` (chỉ bản Admin, lọc theo nhóm người dùng sở hữu dải; bản User gửi thì `400` theo `docs/02_api_contracts.md` mục 1.1), `status` (`FREE`, `ALLOCATED`, `RESERVED`, `LOCKED`), `search` (tìm số `10000` - `99999`, tên bàn trực), `page`, `limit`.
- **Response**:

```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "id": 32101,
      "phoneNumber": "42100",
      "rangeId": 1,
      "userGroupId": 1,
      "userGroupName": "Khối Công nghệ Thông tin",
      "status": "ALLOCATED",
      "displayName": "Bàn trực Điều độ A0",
      "description": "Vị trí bàn trực ca 24/7",
      "allocatedAt": "2026-01-15T08:00:00+07:00"
    },
    {
      "id": 90000,
      "phoneNumber": "99999",
      "rangeId": null,
      "userGroupId": null,
      "userGroupName": null,
      "status": "FREE",
      "displayName": null,
      "description": null,
      "allocatedAt": null
    }
  ],
  "pagination": { "page": 1, "limit": 50, "total": 90000, "totalPages": 1800, "hasNext": true, "hasPrev": false }
}
```

### 4.4. Tra cứu Lịch sử điều chuyển số vào dải (`GET /api/v1/phone-numbers/history`)

- **Guard**: `UserAuthGuard` trên route User (chỉ dữ liệu nhóm mình); bản sao `/api/v1/admin/...` dùng `AdminAuthGuard` (quy tắc tách portal tại `docs/02_api_contracts.md` mục 1.1).
- **Query Params**: `phoneNumber`, `groupId` (chỉ bản Admin, lọc `phone_number_range_history.user_group_id`; bản User gửi thì `400`), `actionType`, `page`, `limit`. Bản User lọc theo `phone_number_range_history.user_group_id` = nhóm của người gọi.
- **Đổi trạng thái từng số** (`PUT /api/v1/admin/phone-numbers/:number`): mỗi lần đổi ghi 1 dòng `LOCK`/`UNLOCK`/`RESERVE`/`UNRESERVE`; chuyển thẳng giữa `RESERVED` và `LOCKED` ghi 2 dòng trong cùng transaction (vd. `RESERVED` → `LOCKED`: `UNRESERVE` rồi `LOCK`) (`docs/01_database_schema.md` mục 8). Các dòng này ghi `decision_number = NULL`, `note = NULL`; dòng `ASSIGN_TO_RANGE`/`REVOKE_FROM_RANGE` chép `decision_number`/`note` của thao tác dải (`docs/01_database_schema.md` mục 8 điểm 4).

### 4.5. Tra cứu Lịch sử cấp phát dải số (`GET /api/v1/prefixes/history`)

- **Guard**: `UserAuthGuard` trên route User (chỉ dữ liệu nhóm mình); bản sao `/api/v1/admin/...` dùng `AdminAuthGuard` (quy tắc tách portal tại `docs/02_api_contracts.md` mục 1.1).
- **Query Params**: `groupId` (chỉ bản Admin, lọc `prefix_allocation_history.user_group_id`; bản User gửi thì `400`), `actionType` (`ALLOCATE` | `REVOKE` | `UPDATE`), `page`, `limit`. Bản User lọc theo `prefix_allocation_history.user_group_id` = nhóm của người gọi, nên dòng thu hồi vẫn hiện cho nhóm bị thu hồi.
- **Response**: khung phân trang chung (`docs/02_api_contracts.md` mục 2.2); giá trị từng cột theo `action_type` tại `docs/01_database_schema.md` mục 8 điểm 5. Không trả `range_text` (chuỗi hiển thị, `docs/02_api_contracts.md` mục 2): khoảng số trả qua `previousRangeFrom`/`previousRangeTo`, `rangeFrom`/`rangeTo`, frontend tự ghép nhãn.

### 4.6. Nhóm đầu số (`GET /api/v1/admin/prefix-groups`, `PUT /api/v1/admin/prefix-groups/:id`)

- **Guard**: chỉ khu vực Admin, `AdminAuthGuard`; `GET` cần `prefix:view`, `PUT` cần `prefix:manage`. Không có API tạo/xóa: nhóm đầu số tạo tự động cùng nhóm người dùng (`docs/01_database_schema.md` mục 4.1).
- **`GET`**: khung phân trang chung (`docs/02_api_contracts.md` mục 2.2). Mỗi phần tử gồm các cột của `phone_prefix_groups` (`id`, `code`, `name`, `description`, `createdAt`, `updatedAt`), nhóm người dùng liên kết qua `user_groups.phone_prefix_group_id` (`userGroupId`, `userGroupCode`, `userGroupName`) và số dải hiện có (`totalRanges`, đếm `phone_prefix_ranges` theo `prefix_group_id`).
- **`PUT`**: body chỉ `{ name, description }` → `phone_prefix_groups.name` / `description`. Có `code` (bất biến, `PG-` + `user_groups.code`) hoặc trường khác thì trả `400`. Response là phần tử như `GET`. Ghi `audit_logs` `PREFIX / UPDATE_PREFIX_GROUP` (`docs/01_database_schema.md` mục 13).

---

## 5. Kiến trúc Backend NestJS (`backend/src/core`, `apps/*`)

Theo quy tắc `docs/00_overview_and_architecture.md` mục 5.1: nghiệp vụ và entity ở `core`, controller ở `apps/admin` / `apps/member`, job nền ở `apps/worker`; các phần `apps/*` không import lẫn nhau.

```
backend/src/
├── core/phone-numbers/
│   ├── phone-numbers.module.ts
│   ├── prefixes.service.ts               <-- cấp phát/thu hồi dải, lịch sử; tăng cache_version trong cùng transaction
│   ├── prefix-groups.service.ts
│   ├── phone-numbers.service.ts          <-- kho số, khóa/dự phòng/sửa thông tin số; nhận scope SYSTEM | GROUP
│   ├── prefix-validator.service.ts       <-- Thuật toán kiểm tra trùng dải số
│   ├── master-pool-seeder.service.ts     <-- Khởi tạo và kiểm tra đủ 90.000 số (chạy từ seed)
│   ├── dto/
│   │   ├── allocate-prefix.dto.ts
│   │   ├── query-pool.dto.ts
│   │   └── query-history.dto.ts
│   └── entities/
│       ├── phone-prefix-group.entity.ts
│       ├── phone-prefix-range.entity.ts
│       ├── phone-number.entity.ts
│       ├── prefix-allocation-history.entity.ts
│       └── phone-number-range-history.entity.ts
├── apps/admin/phone-numbers/
│   ├── admin-phone-numbers.module.ts
│   ├── prefixes.controller.ts            <-- /api/v1/admin/prefixes* (đọc + POST, PUT, DELETE, history)
│   ├── prefix-groups.controller.ts       <-- /api/v1/admin/prefix-groups*
│   └── phone-numbers.controller.ts       <-- /api/v1/admin/phone-numbers/pool, pool/summary, history, PUT :number
└── apps/member/phone-numbers/
    ├── member-phone-numbers.module.ts
    ├── prefixes.controller.ts            <-- /api/v1/prefixes, /prefixes/:id, /prefixes/history (chỉ đọc, scope GROUP)
    └── phone-numbers.controller.ts       <-- /api/v1/phone-numbers/pool, /phone-numbers/history (chỉ đọc, scope GROUP)
```

---

## 6. Kiến trúc Frontend Vue 3

### 6.1. Bố cục Giao diện Quản lý Đầu số (Ánh xạ `templates/admin/prefix-management.html`)

- **Bảng danh sách dải số (`.data-table`)**:
  - Cột 1: Tên Nhóm người dùng & Cây đơn vị tham chiếu.
  - Cột 2: Dải số điện thoại - hiển thị các tag nổi bật (`.prefix-tags > .range-chip`).
  - Cột 3: Tổng số lượng ĐT trong nhóm.
  - Cột 4: Ngày cập nhật.
  - Cột 5: Hành động:
    - Nút Xem chi tiết (`.view-btn`): Mở `#detailsModal` hiển thị danh sách dải số của nhóm.
    - Nút Cấp phát / Thu hồi (`.edit-btn`): Mở `#prefixModal` để thêm/bớt hàng dải số.
    - Nút Xem kho số (`.numbers-btn`): Mở `#numbersListModal` liệt kê danh sách số 5 số trong dải, liên kết trực tiếp sang tra cứu CDR.
- **Modal Cấp phát dải số (`#prefixModal`)**:
  - Tên nhóm đang thao tác.
  - Nhập dải số động: Đầu số (Prefix), Từ số, Đến số, Ghi chú.
  - Tự động tính toán số lượng số: $(\text{range\_to} - \text{range\_from} + 1)$.
  - Bắt buộc nhập Căn cứ pháp lý / Quyết định cấp phát và Ghi chú quy định chốt quyền CDR.

### 6.2. Bố cục Giao diện Lịch sử Cấp phát (Ánh xạ `templates/admin/prefix-history.html`)

- Bảng tra cứu lịch sử kiểm toán: Thời điểm, Quản trị viên, Hành động (`Cấp mới`, `Thu hồi`, `Điều chỉnh`), Khoảng số tác động, Số lượng số biến động, Tên nhóm người dùng, Căn cứ pháp lý, Ghi chú chốt quyền CDR.
- Tab "Lịch sử số" đọc `GET /api/v1/admin/phone-numbers/history` (biến động gán số vào dải, khóa/dự phòng, sửa thông tin số).

### 6.3. Khu vực Member – `OrgPrefixView.vue` (Ánh xạ `templates/member/org-prefix.html`)

- **Route**: `/org-prefix` (`member.org-prefix`), quyền `prefix:view` (mọi vai trò User). File `src/apps/member/views/phone/OrgPrefixView.vue`. **Chỉ đọc**: không có nút cấp phát, thu hồi, khóa hay sửa số.
- **Phạm vi**: luôn là nhóm của người đăng nhập; các API bản User tự lọc theo `req.user.userGroupId`, frontend không gửi tham số nhóm.
- **Thẻ thông tin nhóm**: tên nhóm, đơn vị tổ chức, nhóm đầu số (từ `GET /api/v1/auth/me` và `GET /api/v1/user-groups/:id`).
- **Bảng dải số** (`GET /api/v1/prefixes`): cột Dải số, Số lượng (`counts`), Tình trạng, Hiệu lực CDR, Mục đích / Căn cứ; hành động "Xem danh sách số" và "Tra cứu CDR" (điều hướng trong khu vực Member sang `member.cdr`; `GET /api/v1/cdr` không có bộ lọc theo dải, nên không truyền tham số dải).
- **Modal danh sách số trong dải**: `GET /api/v1/phone-numbers/pool` lọc theo `rangeId`, hiển thị số, trạng thái, tên hiển thị; không có thao tác sửa.
- **Khác khu vực Admin**: không có `/admin/prefix-groups*`, `/admin/phone-numbers/pool/summary`, `PUT /admin/phone-numbers/:number`, không có cột hay bộ lọc nhóm người dùng khác.

---

## 7. Kịch bản kiểm thử (Test Plan for Agent)

1. **TC-PREF-01**: Kiểm tra kho số tổng thể khởi tạo đủ 90.000 số từ `10000` đến `99999` với trạng thái ban đầu là `FREE`.
2. **TC-PREF-02**: Cấp dải số `48000 - 48999` cho Khối Kinh doanh, xác nhận 1.000 số từ `48000` đến `48999` trong bảng `phone_numbers` tự động chuyển sang `ALLOCATED` và lưu log vào `phone_number_range_history`.
3. **TC-PREF-03**: Thử cấp dải số `48500 - 48600` cho đơn vị khác, xác nhận hệ thống báo lỗi xung đột dải số (Overlap Conflict) và từ chối lưu.
4. **TC-PREF-04**: Thu hồi dải số `48000 - 48999`, xác nhận 1.000 số tương ứng trong `phone_numbers` quay trở lại trạng thái `FREE` và `range_id = NULL`.
5. **TC-PREF-05**: Mở rộng dải `48000 - 48499` thành `48000 - 48999` khi `48500 - 48999` chưa thuộc dải nào, xác nhận 500 số mới nhận `range_id` và có 1 dòng `prefix_allocation_history` (`UPDATE`); thử mở rộng chồng lên dải của cùng nhóm hoặc nhóm khác thì trả `409`.
6. **TC-PREF-06**: Gửi `PUT /api/v1/admin/user-groups/:id` có trường `phonePrefixGroupId`, xác nhận trả `400`. Gửi `POST /api/v1/admin/prefixes` cho nhóm đầu số của nhóm `INACTIVE`, xác nhận trả `409 GROUP_INACTIVE`.
