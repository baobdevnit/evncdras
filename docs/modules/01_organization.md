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
  - Ô chọn "Trực thuộc (Đơn vị cha)" của `#orgModal` dựng từ cây đã tải (duyệt theo thứ tự cây, thụt theo `level`), chỉ liệt kê nút `ACTIVE` có `level < 3`; khi sửa thì bỏ chính đơn vị và nhánh con của nó, chỉ giữ nút mà nhánh chuyển sang không vượt cấp 3 và luôn giữ cha hiện tại kể cả `INACTIVE` (mục 3.3 Frontend).
- Index phục vụ: khóa chính `admins`/`users`/`user_groups` (kiểm tra tài khoản); `organizations` đọc toàn bảng (vài chục tới vài trăm dòng, sắp trong bộ nhớ, không cần index riêng); `idx_ug_org` (`organization_id`) cho phép đếm ở bước 3 chỉ đọc index.

### 3.1.1. `GET /api/v1/organizations`

- **Mục đích**: danh sách **phẳng** có lọc, tìm kiếm và phân trang, dành cho ô chọn đơn vị có tìm kiếm và tra cứu nhanh theo mã/tên; màn hình cây và ô chọn đơn vị cha hiện tại dùng mục 3.1, chi tiết đầy đủ một đơn vị (mô tả, người đại diện, thời gian) lấy ở mục 3.1.2. **Chưa màn hình nào (cả hai cổng) gọi API này**; giữ theo R23-01 (chủ dự án chốt cùng nguyên tắc ở O01, O02), khi thêm màn hình dùng nó phải ghi vào `docs/00_overview_and_architecture.md` mục 5.3.3/5.3.4.
- **Hai route**, chung service `OrganizationsService.list(filter, withUserGroupCount)` và DTO phần tử; bản Admin thêm đúng một trường `userGroupCount`:
  - Bản Admin `GET /api/v1/admin/organizations`: `AdminAuthGuard` → `PermissionsGuard` `org:view` (seed: `ROOT_ADMIN`, `SYSTEM_ADMIN`). Guard, `403`, `401` như mục 3.1; không bị chế độ bảo trì chặn.
  - Bản User `GET /api/v1/organizations`: `UserAuthGuard` → bảo trì (`503 MAINTENANCE`) → `PermissionsGuard` `org:view` theo claim `roleCode` (seed: cả 3 vai trò User), kiểm tra tài khoản ở mỗi request như mục 3.1. **Không** cô lập theo nhóm (cây tổ chức không phải dữ liệu của nhóm): trả cùng danh sách như bản Admin, chỉ thiếu `userGroupCount`.
  - Thứ tự kiểm tra như mục 3.1: guard xác thực (`401`/`403 PASSWORD_CHANGE_REQUIRED`) → bảo trì (`503`, chỉ bản User) → quyền (`403 FORBIDDEN_PERMISSION`) → query (`400`) → kiểm tra tài khoản (`401`).
- **Query** (quy tắc chung `docs/02_api_contracts.md` mục 2.2; không có body):

| Tham số | Kiểu | Mặc định | Ràng buộc | Điều kiện SQL |
|---|---|---|---|---|
| `page` | số nguyên | 1 | ≥ 1 | |
| `limit` | số nguyên | 20 | 1–100 | |
| `search` | chuỗi | — | Cắt khoảng trắng hai đầu, rỗng = không lọc, ≤ 100 ký tự; khớp **chứa** trên `code`, `name` (`OR`) | `o.code LIKE :pattern OR o.name LIKE :pattern` |
| `status` | enum | — (cả hai) | `ACTIVE` \| `INACTIVE` | `o.status = :status` |
| `parentId` | số nguyên | — | Rỗng = không lọc; `^[1-9][0-9]{0,9}$` và ≤ 4294967295. Chỉ các con **trực tiếp** của đơn vị đó. Id không tồn tại không phải lỗi: `200`, `data = []` (chủ dự án chốt ở O02). Không nhận chuỗi `null` (`400`) | `o.parent_id = :parentId` |
| `level` | số nguyên | — | Rỗng = không lọc; `0`–`3`. Lấy đơn vị gốc: `level=0` (đơn vị gốc luôn có `level = 0`, `docs/01_database_schema.md` mục 4; chủ dự án chốt ở O02 thay cho `parentId=null`) | `o.level = :level` |

  Các bộ lọc kết hợp bằng `AND`. Sai định dạng, ngoài khoảng, giá trị enum lạ, tham số lặp lại hoặc tham số khác (`sort`, `order`, `organizationId`…) trả `400 VALIDATION_ERROR` với `errors` theo tên tham số.
- **Xử lý** (chỉ đọc, không transaction, không ghi `audit_logs`):
  1. Kiểm tra tài khoản theo khóa chính như mục 3.1 bước 1.
  2. Đếm và lấy trang trong cùng một điều kiện:

```sql
SELECT o.id, o.parent_id, p.name AS parent_name, o.code, o.name, o.level, o.sort_order, o.status,
       (SELECT COUNT(*) FROM organizations c WHERE c.parent_id = o.id) AS child_count
       -- chỉ bản Admin:
       , (SELECT COUNT(*) FROM user_groups ug WHERE ug.organization_id = o.id) AS user_group_count
FROM organizations o
LEFT JOIN organizations p ON p.id = o.parent_id
WHERE (:status IS NULL OR o.status = :status)
  AND (:parentId IS NULL OR o.parent_id = :parentId)
  AND (:level IS NULL OR o.level = :level)
  AND (:search IS NULL OR o.code LIKE :pattern ESCAPE '\' OR o.name LIKE :pattern ESCAPE '\')
ORDER BY o.level, o.sort_order, o.name, o.id
LIMIT :limit OFFSET (:page - 1) * :limit;
-- :pattern = CONCAT('%', <search đã thoát \ % _>, '%'); total: SELECT COUNT(*) FROM organizations o cùng WHERE (không cần JOIN)
```

  Thứ tự cố định (không có tham số sắp xếp): `level`, `sortOrder`, `name` (collation `utf8mb4_unicode_ci`), `id` tăng dần, cùng tiêu chí với thứ tự anh em của mục 3.1. `childCount` đếm mọi con trực tiếp (kể cả `INACTIVE`); `userGroupCount` đếm mọi nhóm gắn trực tiếp (kể cả `INACTIVE`), cùng nghĩa với mục 3.1 và điều kiện chặn xóa mục 3.4. `page` vượt `totalPages` trả `200`, `data = []`.
- **Response** `200` (khung `docs/02_api_contracts.md` mục 2.2, không có khóa cấp cao khác). Mỗi phần tử đúng các trường sau (chủ dự án chốt ở O02: thu gọn, không trả `description`, `representativeName`, `representativePhone`, `representativeEmail`, `createdAt`, `updatedAt` — lấy ở mục 3.1.2):

| Trường | Kiểu | Nguồn | Ghi chú |
|---|---|---|---|
| `id` | số | `organizations.id` | |
| `parentId` | số \| `null` | `parent_id` | `null` ở đơn vị gốc |
| `parentName` | chuỗi ≤ 255 \| `null` | `name` của đơn vị cha | `null` ở đơn vị gốc |
| `code` | chuỗi ≤ 50 | `code` | |
| `name` | chuỗi ≤ 255 | `name` | |
| `level` | `0`–`3` | `level` | |
| `sortOrder` | số | `sort_order` | |
| `status` | `ACTIVE` \| `INACTIVE` | `status` | |
| `childCount` | số | đếm `organizations.parent_id = id` | Số đơn vị con trực tiếp |
| `userGroupCount` | số | đếm `user_groups.organization_id = id` | **Chỉ bản Admin** |

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy danh sách đơn vị tổ chức thành công",
  "data": [
    { "id": 2, "parentId": 1, "parentName": "Tổng công ty 71", "code": "IT-01", "name": "Khối Công nghệ Thông tin", "level": 1, "sortOrder": 1, "status": "ACTIVE", "childCount": 1, "userGroupCount": 2 },
    { "id": 12, "parentId": 1, "parentName": "Tổng công ty 71", "code": "DA-01", "name": "Ban Quản lý dự án (cũ)", "level": 1, "sortOrder": 9, "status": "INACTIVE", "childCount": 0, "userGroupCount": 0 }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 2, "totalPages": 1, "hasNext": false, "hasPrev": false },
  "timestamp": "2026-11-05T09:00:00+07:00"
}
```

Ví dụ trên là bản Admin với `?parentId=1&level=1`; bản User giống hệt nhưng không có `userGroupCount`.

- **Lỗi**:

| HTTP | `errorCode` | Khi nào |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Query sai định dạng/ngoài khoảng, enum lạ, tham số lặp lại hoặc không có trong bảng trên (`errors.<tên tham số>`) |
| `401` | `UNAUTHORIZED` | Như mục 3.1 |
| `403` | `PASSWORD_CHANGE_REQUIRED` | Gọi bằng token `PASSWORD_CHANGE_ONLY` |
| `403` | `FORBIDDEN_PERMISSION` | Vai trò thiếu `org:view` (chốt phòng vệ) |
| `503` | `MAINTENANCE` | Chỉ bản User, chế độ bảo trì đang bật |

Không có `404` (kể cả `parentId` không tồn tại), `409`.

- **Frontend**: chưa có màn hình gọi, không có template. Khi dùng cho ô chọn có tìm kiếm thì theo quy ước danh sách `docs/modules/04_auth_admin.md` mục 5.2 (tìm kiếm 300 ms/Enter, chỉ hiển thị request sau cùng), gọi qua API client của cổng (`adminSession.request`/`memberSession.request`).
- **Index phục vụ**: khóa chính `admins`/`users`/`user_groups` (kiểm tra tài khoản); `organizations` vài chục tới vài trăm dòng nên lọc `status`/`level`/`search` và sắp xếp quét bảng, không thêm index; `idx_org_parent` cho lọc `parentId` và đếm `childCount`; `idx_ug_org` cho đếm `userGroupCount` chỉ đọc index.

### 3.1.2. `GET /api/v1/organizations/:id`

- **Mục đích**: thông tin **đầy đủ** của một đơn vị (mô tả, người đại diện, thời gian), danh sách đơn vị con trực tiếp và (bản Admin) các nhóm người dùng gắn trực tiếp. Dùng cho hộp "Xem chi tiết" `#orgDetailModal` của màn hình Danh mục tổ chức (mục 5.1), gọi mỗi lần mở hộp; form sửa (mục 3.3) lấy giá trị hiện tại từ đây. **Chưa màn hình nào của cổng Member gọi bản User** (giữ theo R23-01, chủ dự án chốt cùng nguyên tắc ở O01–O03); khi thêm màn hình dùng nó phải ghi vào `docs/00_overview_and_architecture.md` mục 5.3.4.
- **Hai route**, chung service `OrganizationsService.getDetail(id, withUserGroups)` và DTO; bản Admin thêm đúng một trường `userGroups`:
  - Bản Admin `GET /api/v1/admin/organizations/:id`: `AdminAuthGuard` → `PermissionsGuard` `org:view` (seed: `ROOT_ADMIN`, `SYSTEM_ADMIN`). Guard, `403`, `401` như mục 3.1; không bị chế độ bảo trì chặn.
  - Bản User `GET /api/v1/organizations/:id`: `UserAuthGuard` → bảo trì (`503 MAINTENANCE`) → `PermissionsGuard` `org:view` theo claim `roleCode` (seed: cả 3 vai trò User), kiểm tra tài khoản ở mỗi request như mục 3.1. **Không** cô lập theo nhóm (cây tổ chức không phải dữ liệu của nhóm): mọi đơn vị đều xem được, không có `403 FORBIDDEN_SCOPE_ACCESS`; chỉ thiếu `userGroups`.
  - Thứ tự kiểm tra: guard xác thực (`401`/`403 PASSWORD_CHANGE_REQUIRED`) → bảo trì (`503`, chỉ bản User) → quyền (`403 FORBIDDEN_PERMISSION`) → `:id` và query (`400`) → kiểm tra tài khoản (`401`) → tìm đơn vị (`404`).
- **Request**: `:id` là `organizations.id` (`^[1-9][0-9]{0,9}$` và ≤ 4294967295, sai thì `400` với `errors.id`). Không có query, không có body; gửi query param trả `400 VALIDATION_ERROR` với `errors.<tên tham số>`.
- **Xử lý** (chỉ đọc, không transaction, không ghi `audit_logs`):
  1. Kiểm tra tài khoản theo khóa chính như mục 3.1 bước 1.
  2. Đọc đơn vị và tên cha; không có dòng → `404 NOT_FOUND`. Đơn vị `INACTIVE` vẫn trả `200`.

```sql
SELECT o.id, o.parent_id, p.name AS parent_name, o.code, o.name, o.level, o.sort_order, o.status,
       o.description, o.representative_name, o.representative_phone, o.representative_email,
       o.created_at, o.updated_at
FROM organizations o
LEFT JOIN organizations p ON p.id = o.parent_id
WHERE o.id = :id;
```

  3. Đơn vị con trực tiếp (mọi trạng thái), cùng thứ tự anh em của mục 3.1 (các con cùng `level` nên chỉ còn `sort_order`, `name`, `id`):

```sql
SELECT id, code, name, level, status FROM organizations
WHERE parent_id = :id
ORDER BY sort_order, name, id;
```

  4. Chỉ bản Admin: nhóm người dùng gắn trực tiếp, **mọi** trạng thái (kể cả `INACTIVE`, vì đều chặn xóa ở mục 3.4; chủ dự án chốt ở O03), không giới hạn số dòng (vài nhóm mỗi đơn vị):

```sql
SELECT id, code, name, status FROM user_groups
WHERE organization_id = :id
ORDER BY name, id;
```

  Ba câu đọc không cần transaction: dữ liệu chỉ để hiển thị, thao tác ghi (mục 3.3–3.4) tự kiểm tra lại khi chạy.
- **Response** `200`: `data` là một đối tượng đúng các trường sau (chủ dự án chốt ở O03: không có `childCount`, `userGroupCount` — dùng `children.length`, `userGroups.length`):

| Trường | Kiểu | Nguồn | Ghi chú |
|---|---|---|---|
| `id` | số | `organizations.id` | |
| `parentId` | số \| `null` | `parent_id` | `null` ở đơn vị gốc |
| `parentName` | chuỗi ≤ 255 \| `null` | `name` của đơn vị cha | `null` ở đơn vị gốc |
| `code` | chuỗi ≤ 50 | `code` | |
| `name` | chuỗi ≤ 255 | `name` | |
| `level` | `0`–`3` | `level` | |
| `sortOrder` | số | `sort_order` | |
| `status` | `ACTIVE` \| `INACTIVE` | `status` | |
| `description` | chuỗi \| `null` | `description` (`text`) | `NULL` → `null`, trả nguyên văn (không cắt) |
| `representativeName` | chuỗi ≤ 150 \| `null` | `representative_name` | |
| `representativePhone` | chuỗi ≤ 30 \| `null` | `representative_phone` | |
| `representativeEmail` | chuỗi ≤ 150 \| `null` | `representative_email` | |
| `createdAt` | chuỗi ISO 8601 `+07:00` | `created_at` | |
| `updatedAt` | chuỗi ISO 8601 `+07:00` | `updated_at` | |
| `children` | mảng `{ id, code, name, level, status }` | bước 3 | Luôn có, `[]` khi không có con |
| `userGroups` | mảng `{ id, code, name, status }` | bước 4 | **Chỉ bản Admin**; luôn có, `[]` khi không có nhóm |

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy thông tin đơn vị tổ chức thành công",
  "data": {
    "id": 2,
    "parentId": 1,
    "parentName": "Tổng công ty 71",
    "code": "IT-01",
    "name": "Khối Công nghệ Thông tin",
    "level": 1,
    "sortOrder": 1,
    "status": "ACTIVE",
    "description": "Quản trị hạ tầng công nghệ thông tin, máy chủ tổng đài PABX và hệ thống phân tích CDR.",
    "representativeName": "Nguyễn Văn A",
    "representativePhone": "024 3974 1234",
    "representativeEmail": "it@evn.com.vn",
    "createdAt": "2026-10-01T08:00:00+07:00",
    "updatedAt": "2026-11-02T14:30:00+07:00",
    "children": [
      { "id": 3, "code": "DEV-01", "name": "Phòng Phát triển Phần mềm", "level": 2, "status": "ACTIVE" },
      { "id": 4, "code": "OPS-01", "name": "Phòng Vận hành (Ops)", "level": 2, "status": "ACTIVE" }
    ],
    "userGroups": [
      { "id": 7, "code": "UMO-IT-01", "name": "Nhóm QLND Khối CNTT", "status": "ACTIVE" },
      { "id": 9, "code": "UMO-IT-OLD", "name": "Nhóm QLND Khối CNTT (cũ)", "status": "INACTIVE" }
    ]
  },
  "timestamp": "2026-11-05T09:00:00+07:00"
}
```

Ví dụ trên là bản Admin; bản User giống hệt nhưng không có `userGroups`.

- **Lỗi**:

| HTTP | `errorCode` | Khi nào |
|---|---|---|
| `400` | `VALIDATION_ERROR` | `:id` sai định dạng (`errors.id`); có query param |
| `401` | `UNAUTHORIZED` | Như mục 3.1 |
| `403` | `PASSWORD_CHANGE_REQUIRED` | Gọi bằng token `PASSWORD_CHANGE_ONLY` |
| `403` | `FORBIDDEN_PERMISSION` | Vai trò thiếu `org:view` (chốt phòng vệ) |
| `404` | `NOT_FOUND` | Không có đơn vị `:id` (`docs/02_api_contracts.md` mục 2.3) |
| `503` | `MAINTENANCE` | Chỉ bản User, chế độ bảo trì đang bật (trước kiểm tra `:id`: `/organizations/abc` vẫn `503`) |

Không có `409`.

- **Frontend** (`#orgDetailModal`, mẫu `templates/admin/organization.js`: `mockGetOrgDetail`, `showOrgDetail`, `renderOrgDetail`):
  - Bấm "Xem chi tiết" ở một dòng: mở hộp ngay với tiêu đề lấy từ nút cây, thân hộp ở trạng thái tải, gọi `GET /api/v1/admin/organizations/:id` qua `adminSession.request` **mỗi lần mở** (không dùng lại dữ liệu cũ); chỉ hiển thị response của lần mở sau cùng.
  - Hiển thị đủ trường API trả: Tên, Mã, Trạng thái (badge như cột cây), Cấp (`level`), Trực thuộc (`parentName`, `null` → "Không có (đơn vị gốc)"), Thứ tự, Người đại diện, Điện thoại, Email (`null` → "—"), Mô tả (`null` → "(Chưa có mô tả)", giữ xuống dòng), Ngày tạo, Cập nhật lần cuối (định dạng ngày giờ ở frontend, R16-07), danh sách "Đơn vị con trực thuộc" (`children`, mã + tên + badge, rỗng → "Không có đơn vị con") và "Nhóm người dùng trực thuộc" (`userGroups`, như trên, rỗng → "Chưa có nhóm người dùng nào").
  - Lỗi khác `404`/`401`: thân hộp hiện thông điệp + nút "Thử lại" (gọi lại cùng `id`). `404`: đóng hộp, toast cảnh báo "Đơn vị tổ chức không còn tồn tại", tải lại cây (quy ước A14).
  - Nút "Thêm tổ chức con" chỉ hiện khi store có `org:manage` và dữ liệu đã tải có `status = ACTIVE`, `level < 3`; "Chỉnh sửa" khi có `org:manage` và đã tải xong. Hai nút ẩn khi đang tải/lỗi.
- **Index phục vụ**: khóa chính `admins`/`users`/`user_groups` (kiểm tra tài khoản); khóa chính `organizations` (bước 2, cả `JOIN` cha); `idx_org_parent` (bước 3); `idx_ug_org` (bước 4). Không thêm index.

### 3.2. `POST /api/v1/admin/organizations`

- **Mục đích**: thêm một đơn vị gốc (`parentId` bỏ trống/`null`) hoặc một đơn vị con trực thuộc đơn vị đang `ACTIVE`. Gọi từ `#orgModal` của màn hình Danh mục tổ chức (nút "Thêm mới" ở đầu trang, "Thêm tổ chức con" ở dòng cây hoặc trong `#orgDetailModal`, mục 5.1). Chỉ có bản Admin (cổng Member không có thao tác ghi trên cây tổ chức).
- **Guard**: `AdminAuthGuard` → `PermissionsGuard` `org:manage` (seed: `ROOT_ADMIN`, `SYSTEM_ADMIN`). Token `PASSWORD_CHANGE_ONLY` `403 PASSWORD_CHANGE_REQUIRED`; tài khoản không còn `ACTIVE` hoặc token đầy đủ mà `must_change_password = 1` `401 UNAUTHORIZED` (`docs/modules/04_auth_admin.md` mục 3.1.1). Không bị chế độ bảo trì chặn (cổng Admin).
- **Thứ tự kiểm tra**: guard xác thực (`401`/`403 PASSWORD_CHANGE_REQUIRED`) → quyền (`403 FORBIDDEN_PERMISSION`) → query và body (`400`) → kiểm tra tài khoản (`401`) → đơn vị cha (`400`/`409`) → trùng `code` (`409`).
- **Request**: không có query (gửi thì `400` với `errors.<tên tham số>`). Body JSON chỉ nhận đúng các trường dưới đây; trường khác (kể cả `id`, `level`, `status`, `createdAt`) trả `400 VALIDATION_ERROR` với `errors.<tên trường>`. Không ép kiểu (chuỗi `"2"` cho trường số là sai kiểu). Chủ dự án chốt ở O04: không nhận `status`, đơn vị mới luôn `ACTIVE` (ngừng hoạt động qua mục 3.3); `code` kiểm tra chặt, backend không tự viết hoa.

| Trường | Kiểu | Bắt buộc | Quy tắc | Cột |
|---|---|---|---|---|
| `code` | chuỗi | ✓ | Cắt khoảng trắng hai đầu; 2–50 ký tự, khớp `^[A-Z0-9]+(-[A-Z0-9]+)*$` (chữ Latin **hoa** không dấu, chữ số, các nhóm nối bằng một dấu `-`, không có `-` ở đầu/cuối); chữ thường hoặc ký tự khác → `400` (backend không tự đổi). Trùng mã của đơn vị khác → `409 CODE_DUPLICATE` | `code` |
| `name` | chuỗi | ✓ | Cắt khoảng trắng hai đầu; 3–255 ký tự. Không kiểm tra trùng tên (hai đơn vị khác nhánh có thể cùng tên) | `name` |
| `parentId` | số \| `null` | | Bỏ trống hoặc `null` = đơn vị gốc. Có giá trị: số nguyên 1…4294967295; không có đơn vị → `400` (`errors.parentId`); cha `INACTIVE` → `409 ORGANIZATION_INACTIVE`; cha ở cấp 3 → `400` (`errors.parentId`, vượt cấp tối đa) | `parent_id` |
| `sortOrder` | số | | Số nguyên 0…2147483647; bỏ trống = `0`; `null` → `400` | `sort_order` |
| `description` | chuỗi \| `null` | | Cắt khoảng trắng hai đầu; rỗng hoặc `null` → `NULL`; ≤ 65 535 byte UTF-8 (độ dài cột `text`); giữ nguyên xuống dòng | `description` |
| `representativeName` | chuỗi \| `null` | | Cắt khoảng trắng hai đầu; rỗng hoặc `null` → `NULL`; ≤ 150 ký tự | `representative_name` |
| `representativePhone` | chuỗi \| `null` | | Quy tắc số điện thoại liên hệ chung `docs/02_api_contracts.md` mục 2 (cắt khoảng trắng, rỗng/`null` → `NULL`, `^(?=.*[0-9])[0-9+\-.() ]{1,30}$`) | `representative_phone` |
| `representativeEmail` | chuỗi \| `null` | | Cắt khoảng trắng hai đầu; rỗng hoặc `null` → `NULL`; ≤ 150 ký tự, khớp `^[^\s@]+@[^\s@]+\.[^\s@]+$`; không kiểm tra trùng (không phải tài khoản đăng nhập) | `representative_email` |

`level` không nhận từ body: backend tính, không có cha = `0`, có cha = `parent.level + 1`, tối đa `3` (`docs/01_database_schema.md` mục 4).

```json
{
  "parentId": 1,
  "code": "KD-02",
  "name": "Khối Dịch vụ Khách hàng",
  "description": "Quản lý dịch vụ và chăm sóc khách hàng",
  "representativeName": "Lê Văn C",
  "representativePhone": "0912 345 678",
  "representativeEmail": "c.le@evn.com.vn",
  "sortOrder": 6
}
```

- **Xử lý** (một transaction):
  1. Kiểm tra query/body như bảng trên (`400`, gom mọi lỗi trường vào `errors`), rồi kiểm tra tài khoản theo khóa chính `admins` (`401`).
  2. `BEGIN`. Có `parentId`: đọc khóa chia sẻ dòng cha `SELECT id, level, status FROM organizations WHERE id = :parentId LOCK IN SHARE MODE` (chặn `PUT`/`DELETE` đồng thời đổi trạng thái, cấp hoặc xóa đơn vị cha tới khi commit; mục 3.3 khóa dòng đơn vị bằng `FOR UPDATE` nên hai bên chờ nhau). Không có dòng → `ROLLBACK`, `400` (`errors.parentId`); `status = INACTIVE` → `ROLLBACK`, `409 ORGANIZATION_INACTIVE`; `level = 3` → `ROLLBACK`, `400` (`errors.parentId`). `level` mới = `parent.level + 1`; không có `parentId` thì `level = 0`.
  3. `INSERT INTO organizations (parent_id, code, name, description, representative_name, representative_phone, representative_email, level, sort_order, status) VALUES (..., 'ACTIVE')`. `ER_DUP_ENTRY` trên `uniq_org_code` → `ROLLBACK`, `409 CODE_DUPLICATE` (không cần câu kiểm tra trước: `UNIQUE` là chốt duy nhất, kể cả khi hai request tạo cùng mã đồng thời).
  4. Ghi `audit_logs` trong cùng transaction: `resource_name = 'ORGANIZATION'`, `action = 'CREATE'`, `actor_type = 'ADMIN'`, `actor_id = sub`, `actor_name` = `admins.full_name` của người gọi, `resource_id` = id đơn vị mới, `ip_address`, `user_agent` của request, `action_details = { "code": "<code>", "name": "<name>", "parentId": <số> | null }`.
  5. `COMMIT`, rồi đọc lại đơn vị như mục 3.1.2 bước 2 (`created_at`, `updated_at`, `parentName` từ CSDL) để dựng response; `children = []`, `userGroups = []` (đơn vị vừa tạo chưa có con, chưa có nhóm).
- **Response** `201` (chủ dự án chốt ở O04): `data` đúng 16 trường như `GET /api/v1/admin/organizations/:id` (mục 3.1.2), `status = "ACTIVE"`, `children = []`, `userGroups = []`.

```json
{
  "success": true,
  "statusCode": 201,
  "message": "Tạo đơn vị tổ chức thành công",
  "data": {
    "id": 16,
    "parentId": 1,
    "parentName": "Tổng công ty 71",
    "code": "KD-02",
    "name": "Khối Dịch vụ Khách hàng",
    "level": 1,
    "sortOrder": 6,
    "status": "ACTIVE",
    "description": "Quản lý dịch vụ và chăm sóc khách hàng",
    "representativeName": "Lê Văn C",
    "representativePhone": "0912 345 678",
    "representativeEmail": "c.le@evn.com.vn",
    "createdAt": "2026-11-05T10:20:00+07:00",
    "updatedAt": "2026-11-05T10:20:00+07:00",
    "children": [],
    "userGroups": []
  },
  "timestamp": "2026-11-05T10:20:00+07:00"
}
```

- **Lỗi**:

| HTTP | `errorCode` | Khi nào |
|---|---|---|
| `400` | `VALIDATION_ERROR` | Có query param; body sai (thiếu `code`/`name`, sai kiểu, sai định dạng, vượt độ dài, trường không được nhận như `level`, `status`); `parentId` không tồn tại hoặc cha ở cấp 3 (`errors.parentId`) |
| `401` | `UNAUTHORIZED` | Như mục 3.1 (bản Admin) |
| `403` | `PASSWORD_CHANGE_REQUIRED` | Gọi bằng token `PASSWORD_CHANGE_ONLY` |
| `403` | `FORBIDDEN_PERMISSION` | Vai trò thiếu `org:manage` |
| `409` | `ORGANIZATION_INACTIVE` | Đơn vị cha `INACTIVE`; `errors = { "parentId": ["..."] }` |
| `409` | `CODE_DUPLICATE` | `code` đã có ở đơn vị khác (kể cả `INACTIVE`; mã chỉ được giải phóng khi xóa cứng, `docs/01_database_schema.md` mục 14); `errors = { "code": ["..."] }` |

Không có `404` (không có tham số đường dẫn; cha không tồn tại là lỗi trường của body, quy ước A13). Lỗi không ghi `audit_logs`.

- **Frontend** (`#orgModal` ở chế độ tạo, mẫu `templates/admin/organization.js`: `mockCreateOrg`, `openCreateOrgModal`, `submitCreateOrg`, `validateOrgForm`, `showOrgFormErrors`):
  - Form tạo có đúng các ô của body: Tên (bắt buộc), Mã đơn vị (bắt buộc, tự viết hoa khi gõ, `maxlength` 50), Trực thuộc (ô chọn dựng từ cây đã tải, mục 3.1 Frontend; "Thêm tổ chức con" chọn sẵn cha), Thứ tự sắp xếp, Người đại diện, Điện thoại, Email, Mô tả. Không có ô trạng thái, cấp.
  - Kiểm tra trước khi gửi (bắt buộc, định dạng `code`, độ dài, `sortOrder` nguyên ≥ 0, định dạng điện thoại/email), lỗi hiện dưới ô và không gọi API. Gửi số cho `parentId`/`sortOrder`; ô trống của trường tùy chọn gửi `null` (`sortOrder` trống thì bỏ khỏi body).
  - Khi gửi: khóa form và nút ("Đang lưu..."), nút đóng/Hủy và bấm nền không đóng hộp. `400`/`409 CODE_DUPLICATE`: hiện `errors[field]` dưới ô (khóa không có ô hiện ở toast). `409 ORGANIZATION_INACTIVE`: lỗi dưới ô "Trực thuộc", tải lại cây và dựng lại ô chọn (cha vừa bị ngừng hoạt động không còn trong danh sách). Lỗi khác: toast lỗi, giữ giá trị đang nhập.
  - `201`: đóng hộp, toast "Đã thêm đơn vị <name>", mở sẵn nút cha trên cây rồi tải lại cả cây (không chèn dòng tại chỗ) để đơn vị mới hiện ngay.
- **Index phục vụ**: khóa chính `admins` (kiểm tra tài khoản), khóa chính `organizations` (đọc khóa dòng cha), `uniq_org_code` (chốt trùng mã), `fk_org_parent`. Không thêm index.

### 3.3. `PUT /api/v1/admin/organizations/:id`

- **Mục đích**: sửa thông tin một đơn vị (tên, thứ tự, người đại diện, mô tả), chuyển đơn vị sang cha khác (kéo theo cả nhánh con) và đổi trạng thái (ngừng hoạt động / kích hoạt lại). Gọi từ `#orgModal` ở chế độ sửa (nút "Sửa" ở dòng cây hoặc "Chỉnh sửa" trong `#orgDetailModal`, mục 5.1). Chỉ có bản Admin.
- **Guard**: `AdminAuthGuard` → `PermissionsGuard` `org:manage` (seed: `ROOT_ADMIN`, `SYSTEM_ADMIN`). Token `PASSWORD_CHANGE_ONLY` `403 PASSWORD_CHANGE_REQUIRED`; tài khoản không còn `ACTIVE` hoặc token đầy đủ mà `must_change_password = 1` `401 UNAUTHORIZED` (`docs/modules/04_auth_admin.md` mục 3.1.1). Không bị chế độ bảo trì chặn.
- **Thứ tự kiểm tra**: guard xác thực (`401`/`403 PASSWORD_CHANGE_REQUIRED`) → quyền (`403 FORBIDDEN_PERMISSION`) → `:id`, query, body (`400`) → kiểm tra tài khoản (`401`) → khóa và tìm đơn vị (`404`) → cha mới (`400`/`409`, chỉ khi `parentId` đổi).
- **Request**: `:id` là `organizations.id` (`^[1-9][0-9]{0,9}$` và ≤ 4294967295, sai thì `400` với `errors.id`). Không có query (gửi thì `400` với `errors.<tên tham số>`). Body JSON, **cập nhật một phần** (quy ước A18), ít nhất một trường; body `{}` trả `400` (`errors.body`: "Cần gửi ít nhất một trường"). Trường khác trả `400 VALIDATION_ERROR` với `errors.<tên trường>`: **`code`** (mã bất biến sau khi tạo, `docs/01_database_schema.md` mục 4, R15-05), `level` (backend tự tính), `id`, `createdAt`, `children`… Không ép kiểu.

| Trường | Kiểu | Quy tắc | Cột |
|---|---|---|---|
| `name` | chuỗi | Cắt khoảng trắng hai đầu; 3–255 ký tự; `null`/rỗng → `400` (trường bắt buộc khi tạo) | `name` |
| `parentId` | số \| `null` | `null` = chuyển thành đơn vị gốc; số nguyên 1…4294967295; bằng `:id` → `400` (`errors.parentId`). Chỉ khi **khác** cha hiện tại mới kiểm tra cha mới (bước 4); gửi đúng cha hiện tại (kể cả cha đang `INACTIVE`) không bị chặn | `parent_id` |
| `sortOrder` | số | Số nguyên 0…2147483647; `null` → `400` | `sort_order` |
| `status` | chuỗi | `ACTIVE` hoặc `INACTIVE` (chữ hoa); giá trị khác → `400`. Chủ dự án chốt ở O05: kích hoạt lại (`INACTIVE` → `ACTIVE`) được, kể cả khi cha đang `INACTIVE` (không phải gắn mới) | `status` |
| `description` | chuỗi \| `null` | Như mục 3.2: cắt khoảng trắng, rỗng/`null` → `NULL`, ≤ 65 535 byte UTF-8 | `description` |
| `representativeName` | chuỗi \| `null` | Như mục 3.2: rỗng/`null` → `NULL`, ≤ 150 ký tự | `representative_name` |
| `representativePhone` | chuỗi \| `null` | Như mục 3.2 (quy tắc số điện thoại chung `docs/02_api_contracts.md` mục 2) | `representative_phone` |
| `representativeEmail` | chuỗi \| `null` | Như mục 3.2: rỗng/`null` → `NULL`, ≤ 150 ký tự, `^[^\s@]+@[^\s@]+\.[^\s@]+$` | `representative_email` |

```json
{ "parentId": 5, "sortOrder": 1, "status": "INACTIVE", "representativePhone": "" }
```

- **Xử lý** (một transaction; theo thứ tự, dừng ở lỗi đầu tiên, lỗi thì `ROLLBACK`):
  1. Kiểm tra `:id`, query, body như bảng trên (`400`, gom mọi lỗi trường), rồi kiểm tra tài khoản theo khóa chính `admins` (`401`).
  2. `BEGIN`, khóa (chủ dự án chốt ở O05):
     - Body **có** khóa `parentId` (kể cả bằng cha hiện tại): khóa mọi dòng theo khóa chính, dữ liệu dùng luôn cho bước 4 (bảng nhỏ, vài trăm dòng):

```sql
SELECT id, parent_id, level, status FROM organizations ORDER BY id FOR UPDATE;
```

     - Body **không có** `parentId`: `SELECT id, parent_id, level, status FROM organizations WHERE id = :id FOR UPDATE`.

     Không có dòng `:id` → `404 NOT_FOUND`. Đơn vị `INACTIVE` vẫn sửa được. Hai cách khóa cùng đi theo thứ tự khóa chính và chỉ cần khóa dòng đích là một dòng, nên hai `PUT` đổi cha chéo nhau chạy tuần tự (không deadlock, không tạo chu trình qua tổ tiên); `POST` (mục 3.2, khóa chia sẻ dòng cha) và `DELETE` (mục 3.4) cùng dòng phải chờ. Đọc thêm các cột còn lại của dòng đích (`name`, `sort_order`, `description`, `representative_*`) theo khóa chính sau khi đã khóa.
  3. So từng trường đã gửi (sau chuẩn hóa) với giá trị hiện tại bằng so sánh **chính xác** (phân biệt hoa thường; `parentId` so cả `null`); `changedFields` = các trường khác giá trị, theo thứ tự `name`, `parentId`, `sortOrder`, `status`, `description`, `representativeName`, `representativePhone`, `representativeEmail`. Rỗng: không `UPDATE`, không ghi `audit_logs`, sang bước 6 (thông điệp "Không có thay đổi nào").
  4. `parentId` thuộc `changedFields` (dùng dữ liệu đã khóa ở bước 2):
     - `null`: `level` mới = 0.
     - Không có dòng cha mới → `400` (`errors.parentId`: "Đơn vị cha không tồn tại").
     - Cha mới nằm trong nhánh của `:id` (đi theo `parent_id` từ cha mới lên gốc gặp `:id`) → `400` (`errors.parentId`: "Không chuyển được vào đơn vị con của chính nó").
     - Cha mới `INACTIVE` → `409 ORGANIZATION_INACTIVE` (`errors.parentId`).
     - `level` mới = `cha.level + 1`; chiều cao nhánh `h` = `level` lớn nhất trong nhánh (gồm `:id`) − `level` cũ; `level` mới + `h` > 3 → `400` (`errors.parentId`: "Vượt cấp tối đa 3"), không đổi gì.
  5. `UPDATE organizations SET <cột trong changedFields>[, level = :newLevel] WHERE id = :id`; nếu `level` đổi một lượng `d ≠ 0` thì `UPDATE organizations SET level = level + :d WHERE id IN (<các đơn vị con cháu đã tính ở bước 4>)` (`updated_at` của các dòng này cũng đổi). Đổi `status` **không** lan sang đơn vị con hay nhóm người dùng đã gắn; `INACTIVE` chỉ chặn gắn mới (`docs/01_database_schema.md` mục 4). Ghi `audit_logs` cùng transaction: `resource_name = 'ORGANIZATION'`, `action = 'UPDATE'`, `actor_type = 'ADMIN'`, `actor_id = sub`, `actor_name` = `admins.full_name` của người gọi, `resource_id` = `:id`, `ip_address`, `user_agent`, `action_details = { "changedFields": [...] }` (chủ dự án chốt ở O05, như A18: không ghi giá trị cũ/mới; `level` không nằm trong `changedFields`).
  6. Đọc lại như mục 3.1.2 bước 2–4 (bản Admin, có `children`, `userGroups`) rồi `COMMIT`.
- **Response** `200`: `data` đúng 16 trường như `GET /api/v1/admin/organizations/:id` (mục 3.1.2), kể cả khi không có thay đổi.

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Cập nhật đơn vị tổ chức thành công",
  "data": {
    "id": 6,
    "parentId": 5,
    "parentName": "Khối Kinh doanh",
    "code": "KT-01",
    "name": "Phòng Kế toán - Tài chính",
    "level": 2,
    "sortOrder": 1,
    "status": "INACTIVE",
    "description": null,
    "representativeName": "Phạm Thị D",
    "representativePhone": null,
    "representativeEmail": "ketoan@evn.com.vn",
    "createdAt": "2026-09-15T08:10:00+07:00",
    "updatedAt": "2026-11-05T11:00:00+07:00",
    "children": [],
    "userGroups": []
  },
  "timestamp": "2026-11-05T11:00:00+07:00"
}
```

- **Lỗi**:

| HTTP | `errorCode` | Khi nào |
|---|---|---|
| `400` | `VALIDATION_ERROR` | `:id` sai định dạng (`errors.id`); có query; body `{}`, sai kiểu/định dạng/độ dài, `name`/`sortOrder` `null`, trường không nhận (`code`, `level`…); `parentId` bằng `:id`, không tồn tại, nằm trong nhánh của chính nó hoặc làm nhánh vượt cấp 3 (`errors.parentId`) |
| `401` | `UNAUTHORIZED` | Như mục 3.1 (bản Admin) |
| `403` | `PASSWORD_CHANGE_REQUIRED` | Gọi bằng token `PASSWORD_CHANGE_ONLY` |
| `403` | `FORBIDDEN_PERMISSION` | Vai trò thiếu `org:manage` |
| `404` | `NOT_FOUND` | Không có đơn vị `:id` |
| `409` | `ORGANIZATION_INACTIVE` | Chuyển sang cha mới đang `INACTIVE`; `errors = { "parentId": ["..."] }` |

Không có `CODE_DUPLICATE` (không nhận `code`). Lỗi không ghi `audit_logs`.

- **Frontend** (`#orgModal` ở chế độ sửa, mẫu `templates/admin/organization.js`: `mockUpdateOrg`, `openEditOrgModal`, `loadOrgEdit`, `buildOrgUpdateBody`, `submitUpdateOrg`, `fillParentOptions`):
  - Mở hộp với tiêu đề "Chỉnh sửa – <tên từ nút cây>", form khóa và hiện "Đang tải...", gọi `GET /api/v1/admin/organizations/:id` **mỗi lần mở** (không dùng dữ liệu cây hay chi tiết cũ; chỉ nhận response của lần mở sau cùng). Lỗi tải: thông điệp + "Thử lại" trong hộp, nút Lưu khóa. `404`: đóng hộp, toast cảnh báo "Đơn vị tổ chức không còn tồn tại", tải lại cây.
  - Ô: Tên, Mã đơn vị (**chỉ đọc**, không gửi), Trực thuộc, Thứ tự, **Trạng thái** (chỉ ở chế độ sửa: "Hoạt động"/"Ngừng hoạt động", gợi ý "Ngừng hoạt động không ảnh hưởng đơn vị con và nhóm đã gắn, chỉ chặn gắn mới"; chủ dự án chốt ở O05), Người đại diện, Điện thoại, Email, Mô tả.
  - Ô chọn Trực thuộc: dựng từ cây đã tải, bỏ chính đơn vị và nhánh con, chỉ nút `ACTIVE` có `level + 1 + h ≤ 3` (`h` = chiều cao nhánh của đơn vị đang sửa, tính từ `children` của nút cây); **luôn** có cha hiện tại (kể cả `INACTIVE`, nhãn thêm "(ngừng hoạt động)") để giữ đúng giá trị.
  - Kiểm tra trước khi gửi bằng cùng quy tắc với backend; chỉ gửi trường **khác** dữ liệu đã tải (chuẩn hóa: cắt khoảng trắng, ô trống của trường tùy chọn → `null`); không đổi gì thì không gọi API, đóng hộp + toast "Không có thay đổi nào" (quy ước A18).
  - Khi gửi: khóa form và nút đóng ("Đang lưu..."). `400`: lỗi dưới ô. `409 ORGANIZATION_INACTIVE`: lỗi dưới "Trực thuộc", tải lại cây và dựng lại ô chọn. `404`: như khi tải. Lỗi khác: toast lỗi, giữ giá trị.
  - `200`: đóng hộp, toast "Đã lưu đơn vị <name>", mở sẵn nút cha mới, tải lại cả cây (không sửa dòng tại chỗ).
- **Index phục vụ**: khóa chính `admins` (kiểm tra tài khoản), khóa chính `organizations` (khóa dòng đích, khóa cả bảng theo khóa chính khi có `parentId`, `UPDATE` nhánh theo `id`), `idx_org_parent`, `idx_ug_org` (đọc lại bước 6). Không thêm index.

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
    - **Xem chi tiết** (`.view-btn`): Mở `#orgDetailModal`, tải `GET /api/v1/admin/organizations/:id` mỗi lần mở và hiển thị đủ trường của mục 3.1.2 (thông tin chung, người đại diện, thời gian, đơn vị con, nhóm người dùng trực thuộc; trạng thái tải/lỗi, `404` theo mục 3.1.2 Frontend).
    - **Thêm tổ chức con** (`.add-btn`): Mở `#orgModal` với tiêu đề động và tự động chọn trước đơn vị cha tương ứng với dòng hiện tại; chỉ ở nút `ACTIVE` có `level < 3`.
    - **Chỉnh sửa** (`.edit-btn`): Mở `#orgModal` để cập nhật thông tin đơn vị.
    - **Xóa** (`.delete-btn`): Mở `#deleteModal` xác nhận xóa; chỉ ở nút không có đơn vị con và `userGroupCount = 0`.
  - Hiển thị độ thụt dòng theo cấp bằng `<span class="indent"></span>` và icon đóng mở `<span class="toggle-icon">`.
  - Modal tạo/sửa tổ chức (`#orgModal`): bố cục 2 cột; chế độ tạo có đúng các ô của body mục 3.2 (tên, mã đơn vị, đơn vị cha, thứ tự sắp xếp, người đại diện, điện thoại, email, mô tả), không có ô trạng thái/cấp; chế độ sửa tải `GET .../:id` mỗi lần mở, mã đơn vị chỉ đọc, thêm ô trạng thái, chỉ gửi trường đã đổi (mục 3.3 Frontend); lỗi `400`/`409` hiện dưới ô.
  - Modal xem chi tiết (`#orgDetailModal`): Xem toàn bộ thông tin đơn vị (mục 3.1.2), kèm nút hành động "Thêm tổ chức con" (chỉ đơn vị `ACTIVE`, `level < 3`) và "Chỉnh sửa", chỉ hiện khi có `org:manage` và đã tải xong.
  - Modal xác nhận xóa (`#deleteModal`).

### 5.2. Quản lý trạng thái (Pinia Store: `useOrganizationStore`)

- State: `tree: OrganizationNode[]`, `loading: boolean`, `selectedOrg: OrganizationDetail | null` (chi tiết mục 3.1.2, tải lại mỗi lần mở hộp chi tiết, xóa khi đóng hộp). Màn hình không dùng danh sách phẳng mục 3.1.1 nên store không có `flatList`.
- Actions: `fetchTree()`, `fetchDetail(id)`, `createOrg(payload)`, `updateOrg(id, payload)`, `deleteOrg(id)`.

---

## 6. Kịch bản kiểm thử (Test Plan for Agent)

1. **TC-ORG-01**: Lấy danh sách cây tổ chức, kiểm tra các node con hiển thị đúng cấp cha (`parent_id`).
   - **TC-ORG-01a** (`GET /api/v1/admin/organizations/tree`): dữ liệu có 2 gốc, một đơn vị `INACTIVE` cấp 1 có con, hai anh em cùng `sort_order` khác tên, một đơn vị có 2 nhóm (1 nhóm `INACTIVE`): `200`, `data` là mảng 2 gốc theo `sortOrder`, `name`, `id`; mỗi nút đúng 9 trường của mục 3.1 (không có `description`, `representativeName`); nút `INACTIVE` vẫn có, con nằm dưới nó; `userGroupCount = 2`; nút lá `children = []`; không thêm dòng `audit_logs`. Gửi `?status=ACTIVE` → `400 VALIDATION_ERROR` (`errors.status`). Bảng rỗng → `data = []`.
   - **TC-ORG-01b** (`GET /api/v1/organizations/tree`, token User `REGULAR_USER`): cùng cây như TC-ORG-01a nhưng không nút nào có `userGroupCount`, không cô lập theo nhóm; bật `system_maintenance_mode` → `503 MAINTENANCE`; token `PASSWORD_CHANGE_ONLY` → `403 PASSWORD_CHANGE_REQUIRED`; nhóm của người gọi `INACTIVE` → `401 UNAUTHORIZED`; token Admin → `401`.
   - **TC-ORG-01c** (`GET /api/v1/admin/organizations`, dữ liệu như TC-ORG-01a): không query → `200`, khung phân trang `limit = 20`, thứ tự `level`, `sortOrder`, `name`, `id`, mỗi phần tử đúng 10 trường (không có `description`, `representativeName`, `createdAt`), gốc có `parentId = null`, `parentName = null`; đơn vị có một con `INACTIVE` → `childCount = 1`, đơn vị có 2 nhóm (1 `INACTIVE`) → `userGroupCount = 2`. `?level=0` chỉ đơn vị gốc; `?parentId=1` chỉ con trực tiếp của 1; `?parentId=999999` → `200`, `data = []`, `total = 0`; `?search=it` khớp `IT-01` và tên chứa "it" không phân biệt hoa thường, `?search=%` không khớp tất cả; `?status=INACTIVE&level=1` kết hợp `AND`. `400`: `parentId=null`, `parentId=0`, `level=4`, `status=active`, `limit=101`, `page=0`, `search` 101 ký tự, `sort=name`, `level=1&level=2`. Không thêm dòng `audit_logs`.
   - **TC-ORG-01d** (`GET /api/v1/organizations`, token User): cùng dữ liệu như TC-ORG-01c nhưng không phần tử nào có `userGroupCount`, không cô lập theo nhóm; bật bảo trì → `503 MAINTENANCE` (trước kiểm tra query: `?level=9` vẫn `503`); token `PASSWORD_CHANGE_ONLY` → `403 PASSWORD_CHANGE_REQUIRED`; nhóm của người gọi `INACTIVE` → `401`.
   - **TC-ORG-01e** (`GET /api/v1/admin/organizations/2`, dữ liệu như TC-ORG-01a, đơn vị 2 có 2 con cùng `sort_order` khác tên và 2 nhóm (1 `INACTIVE`)): `200`, `data` đúng 16 trường của mục 3.1.2 (không có `childCount`, `userGroupCount`), `parentName` = tên đơn vị 1, `children` 2 phần tử 5 trường sắp `sortOrder`, `name`, `id`, `userGroups` 2 phần tử 4 trường sắp `name`, `id` (có nhóm `INACTIVE`); `createdAt`/`updatedAt` dạng `+07:00`. Đơn vị gốc → `parentId = null`, `parentName = null`; đơn vị lá không nhóm → `children = []`, `userGroups = []`; cột `description`/`representative_*` `NULL` → `null`; đơn vị `INACTIVE` → `200`. `/organizations/999999` → `404 NOT_FOUND`; `400` (`errors.id`): `abc`, `0`, `01`, `4294967296`; `?x=1` → `400` (`errors.x`). Không thêm dòng `audit_logs`.
   - **TC-ORG-01f** (`GET /api/v1/organizations/2`, token User `REGULAR_USER` của nhóm không gắn đơn vị 2): `200`, cùng dữ liệu như TC-ORG-01e nhưng không có `userGroups` (không cô lập theo nhóm, không `403`); bật bảo trì → `503 MAINTENANCE` (kể cả `/organizations/abc`); token `PASSWORD_CHANGE_ONLY` → `403 PASSWORD_CHANGE_REQUIRED`; nhóm của người gọi `INACTIVE` → `401`.
2. **TC-ORG-02**: Tạo mới đơn vị con trực thuộc "Tổng công ty 71", xác nhận node mới xuất hiện trong Tree Table.
   - **TC-ORG-02a** (`POST /api/v1/admin/organizations`, Root Admin, dữ liệu như TC-ORG-01a: đơn vị 1 `TC-71` cấp 0, đơn vị 12 `INACTIVE`, đơn vị 13 cấp 3): body `{ "parentId": 1, "code": " KD-02 ", "name": " Khối Dịch vụ Khách hàng ", "representativePhone": "", "sortOrder": 6 }` → `201`, `data` đúng 16 trường, `code = "KD-02"`, `name` đã cắt khoảng trắng, `level = 1`, `status = "ACTIVE"`, `parentName = "Tổng công ty 71"`, `representativePhone = null`, `children = []`, `userGroups = []`; thêm đúng một dòng `audit_logs` `ORGANIZATION / CREATE`, `resource_id` = id mới, `action_details = { "code": "KD-02", "name": "Khối Dịch vụ Khách hàng", "parentId": 1 }`; `GET .../tree` có nút mới dưới đơn vị 1 theo `sortOrder`. Không `parentId`, không `sortOrder` → `level = 0`, `sortOrder = 0`, `parentId = null`. Gọi lại cùng `code` (kể cả `kd-02` sau khi sửa thành chữ hoa) → `409 CODE_DUPLICATE` (`errors.code`); trùng mã của đơn vị `INACTIVE` cũng `409`. `parentId = 12` → `409 ORGANIZATION_INACTIVE` (`errors.parentId`); `parentId = 13` (cấp 3) → `400` (`errors.parentId`); `parentId = 999999` → `400` (`errors.parentId`). `400`: thiếu `code`/`name`, `code = "kd-02"`, `"KD_02"`, `"-KD"`, `"KD--02"`, `"K"`, 51 ký tự, `name = "AB"`, `parentId = "1"`, `parentId = 0`, `sortOrder = -1`, `sortOrder = 1.5`, `sortOrder = null`, `representativeEmail = "abc"`, `representativePhone = "abc"`, có `level`, có `status`, có query `?x=1`. Lỗi không ghi `audit_logs`. Token `PASSWORD_CHANGE_ONLY` → `403 PASSWORD_CHANGE_REQUIRED`; vai trò thiếu `org:manage` → `403 FORBIDDEN_PERMISSION`.
3. **TC-ORG-03**: Thử xóa một đơn vị đang có đơn vị con, kiểm tra hệ thống chặn và trả thông báo lỗi hợp lý.
4. **TC-ORG-04**: Đổi trạng thái từ `ACTIVE` sang `INACTIVE`, kiểm tra badge trạng thái cập nhật màu sắc tương ứng.
   - **TC-ORG-04a** (`PUT /api/v1/admin/organizations/:id`, Root Admin, dữ liệu như mock `templates/admin/organization.js`: 1 `TC-71` gốc; 2 `IT-01` cấp 1 có nhánh 3 (cấp 2) → 13 (cấp 3); 5 `KD-01` cấp 1; 6 `KT-01` cấp 1 lá; 12 `DA-01` `INACTIVE` cấp 1 có con 15; 14 `EVNNPC` gốc): `PUT .../6` `{ "parentId": 5, "sortOrder": 1, "status": "INACTIVE", "representativePhone": "" }` (6 đang `sortOrder = 3`) → `200`, `data` 16 trường, `level = 2`, `parentName = "Khối Kinh doanh"`, `status = "INACTIVE"`; một dòng `audit_logs` `ORGANIZATION / UPDATE`, `resource_id = "6"`, `action_details = {"changedFields":["parentId","sortOrder","status"]}` (`representativePhone` vốn `NULL` nên không tính); cây có 6 dưới 5 với badge "Ngừng hoạt động". Gửi lại cùng body: `200` "Không có thay đổi nào", không thêm audit, `updatedAt` không đổi. `PUT .../6` `{ "status": "ACTIVE" }` → `200` (kích hoạt lại). `PUT .../15` `{ "status": "INACTIVE" }` rồi `{ "status": "ACTIVE" }` → `200` dù cha 12 `INACTIVE`; `PUT .../15` `{ "parentId": 12, "name": "Tổ Hạ tầng" }` → `200` (giữ cha `INACTIVE` không bị chặn). `PUT .../2` `{ "parentId": 13 }` hoặc `{ "parentId": 3 }` → `400` (`errors.parentId`, vào nhánh của chính nó, kiểm trước cấp); `PUT .../2` `{ "parentId": 14 }` → `200`, 2 cấp 1, 3 cấp 2, 13 cấp 3 (không đổi); `PUT .../2` `{ "parentId": 5 }` → `400` (`errors.parentId`, nhánh 2 → 3 → 13 sẽ lên cấp 4), không đổi dòng nào; `PUT .../2` `{ "parentId": null }` → `200`, 2 cấp 0, 3 cấp 1, 13 cấp 2 (`updatedAt` của 3, 13 đổi), `changedFields = ["parentId"]`. `PUT .../2` `{ "parentId": 2 }` → `400`; `{ "parentId": 12 }` cho đơn vị 6 → `409 ORGANIZATION_INACTIVE` (`errors.parentId`); `{ "parentId": 999999 }` → `400` (`errors.parentId`). `PUT .../999999` → `404 NOT_FOUND`. `400`: `:id` `abc`, `0`, `4294967296` (`errors.id`); body `{}`; `{ "code": "KT-02" }`, `{ "level": 2 }`, `{ "name": "  " }`, `{ "name": null }`, `{ "sortOrder": null }`, `{ "sortOrder": "1" }`, `{ "status": "inactive" }`, `{ "parentId": "5" }`, `{ "representativeEmail": "abc" }`; `?x=1`. Lỗi không ghi audit. Token `PASSWORD_CHANGE_ONLY` → `403 PASSWORD_CHANGE_REQUIRED`; vai trò thiếu `org:manage` → `403 FORBIDDEN_PERMISSION`. Hai request đồng thời `PUT .../5 { "parentId": 6 }` và `PUT .../6 { "parentId": 5 }` (6 lá, 5 cấp 1): một `200`, một `400` (`errors.parentId`), không deadlock, không chu trình.
