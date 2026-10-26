# MODULE 01: QUẢN LÝ DANH MỤC CÂY TỔ CHỨC (ORGANIZATION MANAGEMENT)

## Đường dẫn tài liệu: `docs/modules/01_organization.md`

## Ánh xạ giao diện mẫu: `templates/organization.html`, `templates/organization.css`, `templates/organization.js`

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
3. Chỉnh sửa thông tin đơn vị tổ chức (Tên, Mã đơn vị, Người đại diện, Điện thoại, Email, Thứ tự sắp xếp).
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

- **Mục đích**: Lấy danh sách cây tổ chức đầy đủ để render Tree Table hoặc Tree View.
- **Header**: `Authorization: Bearer <token>`
- **Response**:

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
      "representativeName": "Nguyễn Văn A",
      "level": 0,
      "status": "ACTIVE",
      "children": [
        {
          "id": 2,
          "parentId": 1,
          "code": "IT-01",
          "name": "Khối Công nghệ Thông tin",
          "representativeName": "Trần Thị B",
          "level": 1,
          "status": "ACTIVE",
          "children": []
        }
      ]
    }
  ]
}
```

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
  - `parentId`: Tùy chọn. Nếu có, phải tồn tại trong CSDL. `level` tự động tính bằng `parent.level + 1`.

### 3.3. `PUT /api/v1/admin/organizations/:id`

- Cập nhật thông tin đơn vị theo `id`. Không cho phép chỉnh sửa `parentId` thành chính nó hoặc con cháu của nó (tránh circular loop).

### 3.4. `DELETE /api/v1/admin/organizations/:id`

- Kiểm tra điều kiện xóa: Trả về lỗi `409 CONFLICT` nếu đơn vị có `children.length > 0` hoặc đang được tham chiếu bởi `user_groups` (kể cả nhóm `INACTIVE`). DB cũng chặn bằng `fk_org_parent` và `fk_ug_org` (`ON DELETE RESTRICT`), xem chính sách xóa tại `docs/01_database_schema.md` mục 14.

---

## 4. Kiến trúc Backend NestJS (`backend/src/modules/organizations/`)

```
organizations/
├── organizations.module.ts
├── organizations.controller.ts
├── organizations.service.ts
├── dto/
│   ├── create-organization.dto.ts
│   ├── update-organization.dto.ts
│   └── organization-filter.dto.ts
├── entities/
│   └── organization.entity.ts
└── organizations.service.spec.ts
```

### 4.1. Thuật toán dựng cây (Recursive Tree Builder) trong `organizations.service.ts`

```typescript
async getOrganizationTree(): Promise<OrganizationTreeDto[]> {
  const allOrgs = await this.orgRepo.find({
    order: { level: 'ASC', sortOrder: 'ASC' }
  });
  
  const map = new Map<number, OrganizationTreeDto>();
  const roots: OrganizationTreeDto[] = [];

  for (const org of allOrgs) {
    const node: OrganizationTreeDto = { ...org, children: [] };
    map.set(org.id, node);
  }

  for (const org of allOrgs) {
    const node = map.get(org.id)!;
    if (org.parentId && map.has(org.parentId)) {
      map.get(org.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }

  return roots;
}
```

---

## 5. Kiến trúc Frontend Vue 3 (`frontend/src/views/organization/OrganizationView.vue`)

### 5.1. Cấu trúc Component

- Tích hợp chính xác cấu trúc HTML từ `templates/organization.html`:
  - Header trang: Tiêu đề "Danh mục tổ chức", nút "Thêm mới" mở modal `#orgModal`.
  - Bảng `.tree-table`: Cột "Tên tổ chức", "Mã đơn vị", "Hành động" có nút đóng/mở từng cấp tổ chức.
  - Cột Hành động trên mỗi dòng bao gồm 4 nút:
    - **Xem chi tiết** (`.view-btn`): Mở `#orgDetailModal` hiển thị thông tin đầy đủ gồm Tên, Mã, Đơn vị cha, Thứ tự, Mô tả chi tiết.
    - **Thêm tổ chức con** (`.add-btn`): Mở `#orgModal` với tiêu đề động và tự động chọn trước đơn vị cha tương ứng với dòng hiện tại.
    - **Chỉnh sửa** (`.edit-btn`): Mở `#orgModal` để cập nhật thông tin đơn vị.
    - **Xóa** (`.delete-btn`): Mở `#deleteModal` xác nhận xóa (áp dụng cho các đơn vị nhánh con).
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
2. **TC-ORG-02**: Tạo mới đơn vị con trực thuộc "Tổng công ty 71", xác nhận node mới xuất hiện trong Tree Table.
3. **TC-ORG-03**: Thử xóa một đơn vị đang có đơn vị con, kiểm tra hệ thống chặn và trả thông báo lỗi hợp lý.
4. **TC-ORG-04**: Đổi trạng thái từ `ACTIVE` sang `INACTIVE`, kiểm tra badge trạng thái cập nhật màu sắc tương ứng.
