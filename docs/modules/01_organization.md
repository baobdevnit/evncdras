# MODULE 01: QUẢN LÝ DANH MỤC CÂY TỔ CHỨC (ORGANIZATION MANAGEMENT)

## Đường dẫn tài liệu: `docs/modules/01_organization.md`

## Ánh xạ giao diện mẫu (chỉ khu vực Admin): `templates/admin/organization.html`, `templates/admin/organization.css`, `templates/admin/organization.js` → `OrganizationView.vue` (route `admin.organizations`, `/admin/organizations`)

---

## 1. Mục tiêu & Nghiệp vụ (Business Overview)

### 1.1. Bối cảnh nghiệp vụ

Hệ thống mạng điện thoại PABX của EVN phục vụ cơ cấu tổ chức phân cấp nhiều tầng:

- **Cấp 0 (Tập đoàn)**: Tập đoàn Điện lực Việt Nam (EVN).
- **Cấp 1 (Tổng công ty)**: EVNNPC (Miền Bắc), EVNCPC (Miền Trung), EVNSPC (Miền Nam), EVNHANOI, EVNHCMC, EVNNPT (Truyền tải), EVNGENCO 1-3 (Phát điện), EVNICT.
- **Cấp 2 (Công ty / Khối / Ban)**: Công ty Điện lực tỉnh/thành phố, Khối CNTT, Khối Kinh doanh, Ban Kỹ thuật...
- **Cấp 3 (Phòng ban / Điện lực quận/huyện / Đội vận hành)**: Điện lực Thanh Xuân, Phòng Điều độ, Trạm biến áp...

### 1.2. Chức năng chính của Module

1. Hiển thị danh mục tổ chức theo dạng bảng cây (Tree Table View): Bảng dữ liệu có nút thu gọn/mở rộng từng cấp cha-con, hiển thị Tên tổ chức, Mã đơn vị, Hành động (Sửa, Thêm đơn vị con, Xóa).
2. Thêm mới đơn vị trực thuộc (Root node hoặc Child node có `parent_id`).
3. Chỉnh sửa thông tin đơn vị tổ chức (Tên, Người đại diện, Điện thoại, Email, Thứ tự sắp xếp, đơn vị cha, trạng thái). Mã đơn vị bất biến sau khi tạo (mục 3.3).
4. Xóa đơn vị tổ chức: Ràng buộc an toàn - chỉ được phép xóa khi không còn đơn vị con và không có nhóm người dùng (`user_groups`) nào đang tham chiếu trực thuộc.
5. Cung cấp API Tree Structure để: chọn đơn vị khi tạo/sửa nhóm người dùng; hiển thị đường dẫn phân cấp (`hierarchyPath`) của nhóm; và trên màn hình Admin, **lọc danh sách nhóm** theo một nhánh cây (để chọn nhóm nhanh hơn). Cây tổ chức **không** dùng để phân quyền dữ liệu, không làm tham số lọc CDR/báo cáo và không dùng để cộng số liệu; mọi số liệu luôn theo `user_groups.id`.

---

## 2. Thiết kế Dữ liệu (Database Schema)

> [!NOTE]
> **Vai trò của Cây tổ chức trong phiên bản hiện tại**:
> Cây tổ chức (`organizations`) đóng vai trò là **danh mục cây phân cấp tham chiếu trực quan** giúp người dùng và quản trị viên dễ dàng định vị các Nhóm người dùng (`user_groups`) thuộc nhánh đơn vị nào. Cây tổ chức **không tham gia vào tính toán hay tổng hợp số liệu thống kê báo cáo lưu lượng** (toàn bộ lưu lượng và CDR được cô lập và tính toán trực tiếp theo `user_groups`).

Bảng dữ liệu MariaDB chính: `organizations` (Đã định nghĩa trong `docs/01_database_schema.md`).

> DDL chuẩn của `organizations` (mục 4) chỉ định nghĩa tại `docs/01_database_schema.md`. Module này không chép lại DDL để tránh lệch; khi sinh code, entity và migration lấy từ `01`.

---

## 3. Đặc tả API Contracts

### 3.1. `GET /api/v1/organizations/tree`

- **Mục đích**: trả **toàn bộ** cây tổ chức (mọi đơn vị, cả `ACTIVE` lẫn `INACTIVE`) trong một lần, không phân trang. Dùng cho: bảng cây của màn hình Danh mục tổ chức (`admin.organizations`, mục 5), ô chọn đơn vị cha trong `#orgModal`, và ô chọn/lọc đơn vị của màn hình Nhóm người dùng (`admin.user-groups`, `docs/modules/02_user_group.md` mục 5.1). Chi tiết một đơn vị (mô tả, người đại diện, thời gian) lấy qua mục 3.1.2.
- **Hai route** (`docs/02_api_contracts.md` mục 1.1), chung service `OrganizationsService.getTree()` và DTO nút; bản Admin thêm đúng một trường `userGroupCount` (chủ dự án chốt ở O01):
  - Bản Admin `GET /api/v1/admin/organizations/tree`: `AdminAuthGuard` → `PermissionsGuard` `org:view` (seed: `ROOT_ADMIN`, `SYSTEM_ADMIN`). Token `PASSWORD_CHANGE_ONLY` `403 PASSWORD_CHANGE_REQUIRED`; tài khoản không còn `ACTIVE` hoặc token đầy đủ mà `must_change_password = 1` `401 UNAUTHORIZED` (`docs/modules/04_auth_admin.md` mục 3.1.1). Chế độ bảo trì không áp dụng cho cổng Admin.
  - Bản User `GET /api/v1/organizations/tree`: `UserAuthGuard` → kiểm tra bảo trì (`503 MAINTENANCE`, không thuộc danh sách miễn `docs/02_api_contracts.md` mục 1.2) → `PermissionsGuard` `org:view` theo claim `roleCode` (seed: cả 3 vai trò User). Token `PASSWORD_CHANGE_ONLY` `403 PASSWORD_CHANGE_REQUIRED`; kiểm tra tài khoản ở mỗi request (`users` không còn `ACTIVE`, nhóm `INACTIVE` hoặc token đầy đủ mà `must_change_password = 1` → `401 UNAUTHORIZED`, `docs/modules/03_auth_user.md` mục 3.2). Cây tổ chức không phải dữ liệu của nhóm nên **không** cô lập theo nhóm: bản User trả cùng cây như bản Admin, chỉ thiếu `userGroupCount`. **Chưa màn hình nào của cổng Member gọi route này** (chủ dự án chốt giữ ở O01, như mục 3.1.1–3.1.2); khi thêm màn hình dùng nó phải ghi vào `docs/00_overview_and_architecture.md` mục 5.3.4.
  - Thứ tự kiểm tra: guard xác thực (`401`/`403 PASSWORD_CHANGE_REQUIRED`) → bảo trì (`503`, chỉ bản User) → quyền (`403 FORBIDDEN_PERMISSION`) → query (`400`) → kiểm tra tài khoản (`401`).
- **Request**: không có query, không có body. Gửi query param bất kỳ (kể cả `status`, `page`) trả `400 VALIDATION_ERROR` với `errors.<tên tham số>` (chủ dự án chốt ở O01: không lọc; lọc/tìm kiếm dùng mục 3.1.1).
- **Xử lý** (chỉ đọc, không transaction, không ghi `audit_logs`):
  1. Kiểm tra tài khoản theo khóa chính (`admins`, hoặc `users` + `user_groups` ở bản User).
  2. Một câu đọc toàn bảng: `SELECT id, parent_id, code, name, level, sort_order, status FROM organizations ORDER BY level, sort_order, name, id`. Không đọc `description`, `representative_*`, `created_at`, `updated_at`.
  3. Chỉ bản Admin: `SELECT organization_id, COUNT(*) FROM user_groups WHERE organization_id IS NOT NULL GROUP BY organization_id` (đếm **mọi** nhóm, kể cả `INACTIVE`, vì đều chặn xóa ở mục 3.4); đơn vị không có dòng thì `userGroupCount = 0`.
  4. Dựng cây theo mục 4.1: nút có `parent_id IS NULL` là gốc; con nằm trong `children` của cha. Thứ tự anh em (cả các gốc) giữ theo câu `ORDER BY` ở bước 2, tức `sortOrder`, `name` (collation `utf8mb4_unicode_ci`), `id` tăng dần. `level` trả nguyên giá trị cột (backend luôn giữ `level = cha.level + 1`, mục 3.2–3.3), không tính lại khi đọc.
  5. Không có đơn vị nào: `data = []`.
- **Response** `200`: `data` là **mảng** các nút gốc (danh sách cố định không phân trang, không có khung `docs/02_api_contracts.md` mục 2.2). Mỗi nút đúng các trường sau (chủ dự án chốt ở O01):

| Trường | Kiểu | Nguồn | Ghi chú |
|---|---|---|---|
| `id` | số | `organizations.id` | |
| `parentId` | số \| `null` | `parent_id` | `null` ở nút gốc |
| `code` | chuỗi ≤ 50 | `code` | |
| `name` | chuỗi ≤ 255 | `name` | |
| `level` | `0`–`3` | `level` | |
| `sortOrder` | số | `sort_order` | |
| `status` | `ACTIVE` \| `INACTIVE` | `status` | Đơn vị `INACTIVE` vẫn có trên cây, con của nó vẫn nằm dưới nó |
| `userGroupCount` | số | bước 3 | **Chỉ bản Admin**; số nhóm gắn trực tiếp vào đơn vị (không cộng nhánh con) |
| `children` | mảng nút | | Luôn có, `[]` ở nút lá |

Không trả `description`, `representativeName`, `representativePhone`, `representativeEmail`, `createdAt`, `updatedAt` (lấy ở mục 3.1.2), không trả `childCount` (= `children.length`).

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy cây tổ chức thành công",
  "data": [
    {
      "id": 1,
      "parentId": null,
      "code": "TC-71",
      "name": "Tổng công ty 71",
      "level": 0,
      "sortOrder": 1,
      "status": "ACTIVE",
      "userGroupCount": 0,
      "children": [
        {
          "id": 2,
          "parentId": 1,
          "code": "IT-01",
          "name": "Khối Công nghệ Thông tin",
          "level": 1,
          "sortOrder": 1,
          "status": "ACTIVE",
          "userGroupCount": 2,
          "children": [
            { "id": 3, "parentId": 2, "code": "DEV-01", "name": "Phòng Phát triển Phần mềm", "level": 2, "sortOrder": 1, "status": "ACTIVE", "userGroupCount": 0, "children": [] }
          ]
        },
        { "id": 12, "parentId": 1, "code": "DA-01", "name": "Ban Quản lý dự án (cũ)", "level": 1, "sortOrder": 9, "status": "INACTIVE", "userGroupCount": 0, "children": [] }
      ]
    }
  ],
  "timestamp": "2026-11-05T09:00:00+07:00"
}
```

Ví dụ trên là bản Admin; bản User giống hệt nhưng không có `userGroupCount` ở mọi nút.

- **Lỗi**:

| HTTP | `errorCode` | Khi nào |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Có query param |
| `401` | `UNAUTHORIZED` | Access Token thiếu, sai, hết hạn hoặc của cổng kia (guard); tài khoản không còn `ACTIVE`, nhóm `INACTIVE` (bản User) hoặc token đầy đủ mà `must_change_password = 1` |
| `403` | `PASSWORD_CHANGE_REQUIRED` | Gọi bằng token `PASSWORD_CHANGE_ONLY` |
| `403` | `FORBIDDEN_PERMISSION` | Vai trò thiếu `org:view` (seed hiện tại mọi vai trò đều có; chốt phòng vệ khi đổi `permission_roles`) |
| `503` | `MAINTENANCE` | Chỉ bản User, chế độ bảo trì đang bật |

Không có `404` (không có tham số đường dẫn), `409`.

- **Frontend** (`OrganizationView`, mẫu `templates/admin/organization.js`: `mockGetOrgTree`, `loadTree`, `renderTree`):
  - Gọi qua API client của cổng (`adminSession.request`, `401` → refresh một lần rồi gửi lại) khi vào màn hình và sau mỗi thao tác tạo/sửa/xóa thành công (tải lại cả cây, không sửa dòng tại chỗ). Trạng thái tải, lỗi (thông điệp + nút "Thử lại") và rỗng ("Chưa có đơn vị tổ chức nào") hiện trong thân bảng.
  - Bảng cây hiện **mọi** nút, không phân trang (không có thanh phân trang, không có ô chọn số dòng). Mặc định mở cấp 0 và cấp 1, cấp sâu hơn thu gọn; nút có `children` mới có biểu tượng mở/đóng; thụt dòng theo `level`. Trạng thái mở/đóng giữ theo `id` khi tải lại cây.
  - Cột: "Tên tổ chức", "Mã đơn vị", "Trạng thái" (`ACTIVE` → badge "Hoạt động", `INACTIVE` → badge "Ngừng hoạt động"), "Hành động". Nút "Xem chi tiết" luôn hiện; nút "Thêm mới" ở đầu trang, "Thêm tổ chức con", "Chỉnh sửa", "Xóa" chỉ hiện khi store có `org:manage` (`data-permission="org:manage"`). "Thêm tổ chức con" chỉ ở nút `ACTIVE` có `level < 3` (mục 3.2); "Xóa" chỉ ở nút có `children.length = 0` và `userGroupCount = 0` (mục 3.4; quy ước A14, backend vẫn kiểm tra và trả `409` nếu dữ liệu đã đổi).
  - Ô chọn "Trực thuộc (Đơn vị cha)" của `#orgModal` dựng từ cây đã tải (duyệt theo thứ tự cây, thụt theo `level`), chỉ liệt kê nút `ACTIVE` có `level < 3`; khi sửa thì bỏ chính đơn vị và nhánh con của nó (mục 3.3).
- Index phục vụ: khóa chính `admins`/`users`/`user_groups` (kiểm tra tài khoản); `organizations` đọc toàn bảng (vài chục tới vài trăm dòng, sắp trong bộ nhớ, không cần index riêng); `idx_ug_org` (`organization_id`) cho phép đếm ở bước 3 chỉ đọc index.

### 3.1.1. `GET /api/v1/organizations`

- **Mục đích**: danh sách phẳng có lọc và phân trang, dùng cho ô chọn đơn vị có tìm kiếm và tra cứu; màn hình cây dùng mục 3.1. Cây tổ chức không phải dữ liệu của nhóm nên bản User không cô lập theo nhóm, giống mục 3.1.
- **Query**: `page` (mặc định 1), `limit` (mặc định 20, tối đa 100), `search` (khớp một phần `code`, `name`), `status` (`ACTIVE` | `INACTIVE`, bỏ trống = cả hai), `parentId` (số; `null` = chỉ đơn vị gốc), `level` (`0`–`3`). Sắp `level`, `sort_order`, `name` tăng dần.
- **Phần tử**: `id`, `parentId`, `parentName`, `code`, `name`, `description`, `representativeName`, `representativePhone`, `representativeEmail`, `level`, `sortOrder`, `status`, `childCount` (số đơn vị con trực tiếp), `createdAt`, `updatedAt`. Bản Admin có thêm `userGroupCount` (số nhóm người dùng tham chiếu, kể cả nhóm `INACTIVE`, là điều kiện chặn xóa ở mục 3.4); bản User không có trường này.
- Khung phân trang theo `docs/02_api_contracts.md` mục 2.2.

### 3.1.2. `GET /api/v1/organizations/:id`

- **Response**: `data` gồm các trường của một phần tử mục 3.1.1 và `children` (đơn vị con trực tiếp: `id`, `code`, `name`, `level`, `status`, sắp như mục 3.1.1). Bản Admin có thêm `userGroups` (nhóm người dùng gắn trực tiếp vào đơn vị: `id`, `code`, `name`, `status`); bản User không có `userGroups`, `userGroupCount`.
- `:id` không tồn tại trả `404`. Đơn vị `INACTIVE` vẫn xem được.

### 3.2. `POST /api/v1/admin/organizations`

- **Body**:

```json
{
  "parentId": 1,
  "code": "KD-01",
  "name": "Khối Kinh doanh",
  "description": "Quản lý kinh doanh và dịch vụ khách hàng",
  "representativeName": "Lê Văn C",
  "representativePhone": "0912345678",
  "representativeEmail": "c.le@evn.com.vn",
  "sortOrder": 2,
  "status": "ACTIVE"
}
```

- **Validation Rules**:
  - `code`: Bắt buộc, chuỗi không dấu/gạch nối, viết hoa, không trùng lặp.
  - `name`: Bắt buộc, từ 3-255 ký tự.
  - `parentId`: Tùy chọn. Nếu có, phải tồn tại trong CSDL và đang `ACTIVE` (cha `INACTIVE` trả `409 ORGANIZATION_INACTIVE`).
  - `level`: không nhận từ body. Backend tính: không có cha = `0`, có cha = `parent.level + 1`; kết quả lớn hơn `3` trả `400` (`docs/01_database_schema.md` mục 4).

### 3.3. `PUT /api/v1/admin/organizations/:id`

- Cập nhật thông tin đơn vị theo `id`. Không cho phép chỉnh sửa `parentId` thành chính nó hoặc con cháu của nó (tránh circular loop).
- **Không nhận `code`**: mã đơn vị bất biến sau khi tạo; body có trường này thì trả `400` (`docs/01_database_schema.md` mục 4).
- Đổi `parentId`: cha mới phải `ACTIVE` (`409 ORGANIZATION_INACTIVE`); trong một transaction tính lại `level` của đơn vị và toàn bộ nhánh con theo quy tắc mục 3.2. Nếu có đơn vị trong nhánh vượt `level` 3 thì trả `400`, không đổi gì.
- Chuyển `status` sang `INACTIVE` không ảnh hưởng nhóm người dùng đã gắn hay đơn vị con hiện có; chỉ chặn gắn mới vào đơn vị này (đơn vị con mới, nhóm người dùng mới hoặc đổi sang đơn vị này), xem `docs/01_database_schema.md` mục 4.

### 3.4. `DELETE /api/v1/admin/organizations/:id`

- Kiểm tra điều kiện xóa: Trả về lỗi `409 ORGANIZATION_IN_USE` nếu đơn vị có `children.length > 0` hoặc đang được tham chiếu bởi `user_groups` (kể cả nhóm `INACTIVE`). DB cũng chặn bằng `fk_org_parent` và `fk_ug_org` (`ON DELETE RESTRICT`), xem chính sách xóa tại `docs/01_database_schema.md` mục 14.

---

## 4. Kiến trúc Backend NestJS (`backend/src/core`, `apps/*`)

Theo quy tắc `docs/00_overview_and_architecture.md` mục 5.1: nghiệp vụ và entity ở `core`, controller ở `apps/admin` / `apps/member`, job nền ở `apps/worker`; các phần `apps/*` không import lẫn nhau.

```
backend/src/
├── core/organizations/
│   ├── organizations.module.ts
│   ├── organizations.service.ts        <-- cây tổ chức, CRUD, kiểm tra ràng buộc khi xóa
│   ├── organizations.service.spec.ts
│   ├── dto/
│   │   ├── create-organization.dto.ts
│   │   ├── update-organization.dto.ts
│   │   └── organization-filter.dto.ts
│   └── entities/
│       └── organization.entity.ts
├── apps/admin/organizations/
│   ├── admin-organizations.module.ts
│   └── organizations.controller.ts     <-- /api/v1/admin/organizations* (GET tree/list/:id, POST, PUT, DELETE)
└── apps/member/organizations/
    ├── member-organizations.module.ts
    └── organizations.controller.ts     <-- /api/v1/organizations* (chỉ GET tree/list/:id)
```

### 4.1. Thuật toán dựng cây (Recursive Tree Builder) trong `organizations.service.ts`

Dùng cho mục 3.1 (`withUserGroupCount = true` ở controller Admin, `false` ở controller Member) và làm khung cho `GET /user-groups/tree` (`docs/modules/02_user_group.md` mục 3.1.1).

```typescript
async getTree(withUserGroupCount: boolean): Promise<OrganizationTreeNodeDto[]> {
  // Mục 3.1 bước 2: chỉ các cột của nút, thứ tự anh em = level, sort_order, name, id
  const rows = await this.orgRepo.find({
    select: ['id', 'parentId', 'code', 'name', 'level', 'sortOrder', 'status'],
    order: { level: 'ASC', sortOrder: 'ASC', name: 'ASC', id: 'ASC' },
  });

  // Mục 3.1 bước 3 (chỉ bản Admin): đếm mọi nhóm, kể cả INACTIVE, qua idx_ug_org
  const counts = new Map<number, number>();
  if (withUserGroupCount) {
    const raw = await this.userGroupRepo
      .createQueryBuilder('ug')
      .select('ug.organization_id', 'orgId')
      .addSelect('COUNT(*)', 'cnt')
      .where('ug.organization_id IS NOT NULL')
      .groupBy('ug.organization_id')
      .getRawMany<{ orgId: number; cnt: string }>();
    for (const r of raw) counts.set(Number(r.orgId), Number(r.cnt));
  }

  const map = new Map<number, OrganizationTreeNodeDto>();
  for (const o of rows) {
    map.set(o.id, {
      id: o.id, parentId: o.parentId ?? null, code: o.code, name: o.name,
      level: o.level, sortOrder: o.sortOrder, status: o.status,
      ...(withUserGroupCount ? { userGroupCount: counts.get(o.id) ?? 0 } : {}),
      children: [],
    });
  }

  const roots: OrganizationTreeNodeDto[] = [];
  for (const o of rows) {               // giữ thứ tự đã sắp nên anh em đúng thứ tự
    const node = map.get(o.id)!;
    if (o.parentId == null) roots.push(node);
    else map.get(o.parentId)?.children.push(node); // fk_org_parent bảo đảm cha tồn tại
  }
  return roots;
}
```

- `parentId == null` (không dùng `!o.parentId`) để không phụ thuộc giá trị `0`. Cha luôn tồn tại nhờ `fk_org_parent` và không có chu trình nhờ kiểm tra ở mục 3.3; service không tự sửa dữ liệu lệch khi đọc.
- Không cache: bảng nhỏ, đọc trực tiếp mỗi request để thao tác tạo/sửa/xóa hiện ngay.

---

## 5. Kiến trúc Frontend Vue 3 (`frontend/src/apps/admin/views/organization/OrganizationView.vue`)

Màn hình Danh mục tổ chức **chỉ có ở khu vực Admin** (route yêu cầu `org:view`, gọi `/api/v1/admin/organizations*`). Khu vực Member không có màn hình này; tên đơn vị tổ chức chỉ hiển thị dạng thông tin đi kèm nhóm (vd. `organizationName` trong `GET /api/v1/auth/me`).

### 5.1. Cấu trúc Component

- Các nút Thêm / Thêm tổ chức con / Chỉnh sửa / Xóa chỉ hiện khi tài khoản có `org:manage`.
- Bảng cây dựng từ `GET /api/v1/admin/organizations/tree` (mục 3.1, phần Frontend: tải/lỗi/rỗng, không phân trang, điều kiện hiện từng nút).
- Tích hợp chính xác cấu trúc HTML từ `templates/admin/organization.html`:
  - Header trang: Tiêu đề "Danh mục tổ chức", nút "Thêm mới" mở modal `#orgModal`.
  - Bảng `.tree-table`: Cột "Tên tổ chức", "Mã đơn vị", "Trạng thái", "Hành động" có nút đóng/mở từng cấp tổ chức; thân bảng `#orgTreeBody` do JS vẽ.
  - Cột Hành động trên mỗi dòng có tối đa 4 nút:
    - **Xem chi tiết** (`.view-btn`): Mở `#orgDetailModal` hiển thị thông tin đầy đủ gồm Tên, Mã, Đơn vị cha, Thứ tự, Mô tả chi tiết (dữ liệu từ mục 3.1.2).
    - **Thêm tổ chức con** (`.add-btn`): Mở `#orgModal` với tiêu đề động và tự động chọn trước đơn vị cha tương ứng với dòng hiện tại; chỉ ở nút `ACTIVE` có `level < 3`.
    - **Chỉnh sửa** (`.edit-btn`): Mở `#orgModal` để cập nhật thông tin đơn vị.
    - **Xóa** (`.delete-btn`): Mở `#deleteModal` xác nhận xóa; chỉ ở nút không có đơn vị con và `userGroupCount = 0`.
  - Hiển thị độ thụt dòng theo cấp bằng `<span class="indent"></span>` và icon đóng mở `<span class="toggle-icon">`.
  - Modal tạo/sửa tổ chức (`#orgModal`): Nhập tên tổ chức, mã đơn vị, đơn vị cha (Dropdown Select), thứ tự sắp xếp và mô tả tổ chức theo bố cục 2 cột cân đối.
  - Modal xem chi tiết (`#orgDetailModal`): Xem toàn bộ thông tin đơn vị, kèm nút hành động "Thêm tổ chức con" và "Chỉnh sửa".
  - Modal xác nhận xóa (`#deleteModal`).

### 5.2. Quản lý trạng thái (Pinia Store: `useOrganizationStore`)

- State: `tree: OrganizationNode[]`, `flatList: Organization[]`, `loading: boolean`, `selectedOrg: Organization | null`.
- Actions: `fetchTree()`, `createOrg(payload)`, `updateOrg(id, payload)`, `deleteOrg(id)`.

---

## 6. Kịch bản kiểm thử (Test Plan for Agent)

1. **TC-ORG-01**: Lấy danh sách cây tổ chức, kiểm tra các node con hiển thị đúng cấp cha (`parent_id`).
   - **TC-ORG-01a** (`GET /api/v1/admin/organizations/tree`): dữ liệu có 2 gốc, một đơn vị `INACTIVE` cấp 1 có con, hai anh em cùng `sort_order` khác tên, một đơn vị có 2 nhóm (1 nhóm `INACTIVE`): `200`, `data` là mảng 2 gốc theo `sortOrder`, `name`, `id`; mỗi nút đúng 9 trường của mục 3.1 (không có `description`, `representativeName`); nút `INACTIVE` vẫn có, con nằm dưới nó; `userGroupCount = 2`; nút lá `children = []`; không thêm dòng `audit_logs`. Gửi `?status=ACTIVE` → `400 VALIDATION_ERROR` (`errors.status`). Bảng rỗng → `data = []`.
   - **TC-ORG-01b** (`GET /api/v1/organizations/tree`, token User `REGULAR_USER`): cùng cây như TC-ORG-01a nhưng không nút nào có `userGroupCount`, không cô lập theo nhóm; bật `system_maintenance_mode` → `503 MAINTENANCE`; token `PASSWORD_CHANGE_ONLY` → `403 PASSWORD_CHANGE_REQUIRED`; nhóm của người gọi `INACTIVE` → `401 UNAUTHORIZED`; token Admin → `401`.
2. **TC-ORG-02**: Tạo mới đơn vị con trực thuộc "Tổng công ty 71", xác nhận node mới xuất hiện trong Tree Table.
3. **TC-ORG-03**: Thử xóa một đơn vị đang có đơn vị con, kiểm tra hệ thống chặn và trả thông báo lỗi hợp lý.
4. **TC-ORG-04**: Đổi trạng thái từ `ACTIVE` sang `INACTIVE`, kiểm tra badge trạng thái cập nhật màu sắc tương ứng.
