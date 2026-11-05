/**
 * EVN CDR AS - Danh mục tổ chức (templates/admin/organization.html → OrganizationView.vue)
 *
 * Cây: GET /api/v1/admin/organizations/tree (O01, docs/modules/01_organization.md mục 3.1).
 *  - Không query, không phân trang; data = mảng nút gốc, mỗi nút
 *    { id, parentId, code, name, level, sortOrder, status, userGroupCount, children } (userGroupCount chỉ bản Admin).
 *  - Gọi qua adminSession.request (401 → refresh một lần rồi gửi lại); tải lại cả cây sau mỗi thao tác ghi.
 * Chi tiết: GET /api/v1/admin/organizations/:id (O03, M01 mục 3.1.2), gọi mỗi lần mở #orgDetailModal.
 *  - data = { id, parentId, parentName, code, name, level, sortOrder, status, description, representativeName,
 *    representativePhone, representativeEmail, createdAt, updatedAt, children, userGroups } (userGroups chỉ bản Admin);
 *    không có childCount/userGroupCount. 404 → đóng hộp, toast cảnh báo, tải lại cây.
 * Tạo: POST /api/v1/admin/organizations (O04, M01 mục 3.2) từ #orgModal chế độ tạo.
 *  - Body { code, name, parentId?, sortOrder?, description?, representativeName?, representativePhone?, representativeEmail? };
 *    không có status/level (đơn vị mới luôn ACTIVE, level = cha + 1). code chữ hoa ^[A-Z0-9]+(-[A-Z0-9]+)*$ 2–50 ký tự
 *    (ô nhập tự viết hoa, backend không tự đổi).
 *  - 201 data 16 trường như GET .../:id (children = [], userGroups = []). 400/409 CODE_DUPLICATE → lỗi dưới ô;
 *    409 ORGANIZATION_INACTIVE → lỗi dưới "Trực thuộc" + tải lại cây. Thành công: đóng hộp, mở sẵn nút cha, tải lại cây.
 * Sửa: PUT /api/v1/admin/organizations/:id (O05, M01 mục 3.3) từ #orgModal chế độ sửa.
 *  - Mỗi lần mở tải GET .../:id (tải/lỗi + "Thử lại" trong hộp, 404 → đóng hộp + tải lại cây); mã đơn vị chỉ đọc, có ô trạng thái.
 *  - Body cập nhật một phần { name?, parentId?, sortOrder?, status?, description?, representative*? }, chỉ gửi trường đã đổi;
 *    không đổi gì thì không gọi API. code/level → 400. Đổi cha: chính nó/nhánh con/vượt cấp 3/không tồn tại → 400 errors.parentId,
 *    cha mới INACTIVE → 409 ORGANIZATION_INACTIVE; level cả nhánh tính lại. Kích hoạt lại được kể cả khi cha INACTIVE.
 *  - 200 data 16 trường như GET .../:id. Thành công: đóng hộp, mở sẵn nút cha mới, tải lại cây.
 * Xóa: DELETE /api/v1/admin/organizations/:id (O06, M01 mục 3.4) từ #deleteOrgModal (ConfirmModal danger).
 *  - Không query/body; xóa cứng mọi trạng thái. Còn đơn vị con hoặc nhóm (kể cả INACTIVE) → 409 ORGANIZATION_IN_USE
 *    (errors = null, message nêu lý do); không có dòng → 404 NOT_FOUND. 200 data = { id }.
 *  - Nút "Xóa" chỉ ở nút không con + userGroupCount = 0; khi gửi khóa nút, nền/Esc không đóng;
 *    200/404/409 đóng hộp + toast + tải lại cây; lỗi khác toast lỗi, đóng hộp, không tải lại.
 *
 * Kiểm tay mock: ?treeError=1 (lỗi tải, "Thử lại" thành công), ?treeEmpty=1 (cây rỗng), ?noManage=1 (thiếu org:manage),
 * ?detailError=1 (lần mở chi tiết đầu lỗi mạng, "Thử lại" thành công), ?detailMissing=<id> (đơn vị đã bị xóa → 404),
 * ?createError=1 (lần tạo đầu lỗi mạng), ?parentInactive=<id> (đơn vị <id> bị ngừng hoạt động ngay trước khi tạo/chuyển cha → 409),
 * ?updateError=1 (lần lưu sửa đầu lỗi mạng), ?updateMissing=<id> (đơn vị <id> bị xóa trước khi lưu → 404),
 * ?deleteError=1 (lần xóa đầu lỗi mạng), ?deleteMissing=<id> (đơn vị <id> đã bị xóa ở nơi khác → 404),
 * ?deleteInUse=<id> (vừa có nhóm gắn vào đơn vị <id> sau khi tải cây → 409).
 */

const ORG_QS = new URLSearchParams(window.location.search);

// ---------- Mock backend ----------
// MOCK_ORG_ROWS đóng vai bảng organizations (các cột cây đọc); MOCK_ORG_EXTRA là các cột còn lại của cùng dòng
// (chỉ chi tiết O03 đọc; dòng không có trong map thì các cột đó NULL, thời gian mặc định).
// MOCK_USER_GROUPS đóng vai bảng user_groups (chỉ các cột O01/O03 đọc), kể cả nhóm INACTIVE.
const MOCK_ORG_ROWS = [
    { id: 1, parentId: null, code: 'TC-71', name: 'Tổng công ty 71', level: 0, sortOrder: 1, status: 'ACTIVE' },
    { id: 14, parentId: null, code: 'EVNNPC', name: 'Tổng công ty Điện lực miền Bắc', level: 0, sortOrder: 2, status: 'ACTIVE' },
    { id: 2, parentId: 1, code: 'IT-01', name: 'Khối Công nghệ Thông tin', level: 1, sortOrder: 1, status: 'ACTIVE' },
    { id: 5, parentId: 1, code: 'KD-01', name: 'Khối Kinh doanh', level: 1, sortOrder: 2, status: 'ACTIVE' },
    { id: 6, parentId: 1, code: 'KT-01', name: 'Phòng Kế toán - Tài chính', level: 1, sortOrder: 3, status: 'ACTIVE' },
    { id: 7, parentId: 1, code: 'NS-01', name: 'Phòng Nhân sự', level: 1, sortOrder: 4, status: 'ACTIVE' },
    { id: 9, parentId: 1, code: 'CS-01', name: 'Phòng Chăm sóc Khách hàng', level: 1, sortOrder: 5, status: 'ACTIVE' },
    { id: 8, parentId: 1, code: 'MK-01', name: 'Phòng Marketing', level: 1, sortOrder: 5, status: 'ACTIVE' },
    { id: 10, parentId: 1, code: 'PC-01', name: 'Phòng Pháp chế', level: 1, sortOrder: 7, status: 'ACTIVE' },
    { id: 11, parentId: 1, code: 'DT-01', name: 'Phòng Đầu tư', level: 1, sortOrder: 8, status: 'ACTIVE' },
    { id: 12, parentId: 1, code: 'DA-01', name: 'Ban Quản lý dự án (cũ)', level: 1, sortOrder: 9, status: 'INACTIVE' },
    { id: 3, parentId: 2, code: 'DEV-01', name: 'Phòng Phát triển Phần mềm', level: 2, sortOrder: 1, status: 'ACTIVE' },
    { id: 4, parentId: 2, code: 'OPS-01', name: 'Phòng Vận hành (Ops)', level: 2, sortOrder: 2, status: 'ACTIVE' },
    { id: 15, parentId: 12, code: 'DA-01-HT', name: 'Tổ Hạ tầng dự án', level: 2, sortOrder: 1, status: 'ACTIVE' },
    { id: 13, parentId: 3, code: 'DEV-01-CDR', name: 'Tổ Ứng dụng CDR', level: 3, sortOrder: 1, status: 'ACTIVE' }
];
const MOCK_ORG_EXTRA = {
    1: { description: 'Đơn vị quản lý cấp cao điều hành mạng lưới viễn thông, hạ tầng kỹ thuật và dịch vụ tổng đài nội bộ toàn hệ thống.',
        representativeName: 'Trần Quốc Bảo', representativePhone: '024 3974 0001', representativeEmail: 'vanphong@tc71.evn.com.vn',
        createdAt: '2026-09-15T08:00:00+07:00', updatedAt: '2026-10-20T10:15:00+07:00' },
    2: { description: 'Quản trị hạ tầng công nghệ thông tin, máy chủ tổng đài PABX và hệ thống phân tích CDR.\nĐảm bảo an toàn thông tin cho toàn khối.',
        representativeName: 'Nguyễn Văn A', representativePhone: '024 3974 1234', representativeEmail: 'it@evn.com.vn',
        createdAt: '2026-10-01T08:00:00+07:00', updatedAt: '2026-11-02T14:30:00+07:00' },
    3: { description: 'Nghiên cứu, thiết kế và phát triển các giải pháp phần mềm nghiệp vụ, ứng dụng phân tích CDR.',
        representativeName: 'Lê Thị B', representativePhone: null, representativeEmail: 'dev@evn.com.vn',
        createdAt: '2026-10-01T08:05:00+07:00', updatedAt: '2026-10-01T08:05:00+07:00' },
    6: { description: null, representativeName: 'Phạm Thị D', representativePhone: null, representativeEmail: 'ketoan@evn.com.vn',
        createdAt: '2026-09-15T08:10:00+07:00', updatedAt: '2026-10-05T09:00:00+07:00' },
    12: { description: 'Đơn vị đã giải thể, giữ lại để tra cứu.', representativeName: null, representativePhone: null, representativeEmail: null,
        createdAt: '2026-09-15T08:30:00+07:00', updatedAt: '2026-10-30T16:45:00+07:00' }
};
const MOCK_USER_GROUPS = [
    { id: 7, organizationId: 2, code: 'UMO-IT-01', name: 'Nhóm QLND Khối CNTT', status: 'ACTIVE' },
    { id: 9, organizationId: 2, code: 'UMO-IT-OLD', name: 'Nhóm QLND Khối CNTT (cũ)', status: 'INACTIVE' },
    { id: 11, organizationId: 5, code: 'UMO-KD-01', name: 'Nhóm QLND Khối Kinh doanh', status: 'ACTIVE' },
    { id: 15, organizationId: 14, code: 'UMO-NPC-01', name: 'Nhóm QLND EVNNPC', status: 'ACTIVE' }
];
// Kết quả COUNT(*) user_groups GROUP BY organization_id (O01 bước 3, kể cả nhóm INACTIVE)
// (tính lại mỗi lần dựng cây vì mock ?deleteInUse=<id> có thể thêm nhóm)
const mockUgCounts = () => MOCK_USER_GROUPS.reduce((acc, g) => { acc[g.organizationId] = (acc[g.organizationId] || 0) + 1; return acc; }, {});
let mockTreeFailOnce = ORG_QS.get('treeError') === '1';
let mockDetailFailOnce = ORG_QS.get('detailError') === '1';

function orgNow() { return new Date().toISOString().replace('Z', '+07:00'); }

// Dựng cây như OrganizationsService.getTree (M01 mục 4.1): sắp level, sortOrder, name, id rồi gắn con vào cha.
function buildOrgTree(rows, withUserGroupCount) {
    const sorted = rows.slice().sort((a, b) =>
        a.level - b.level || a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'vi') || a.id - b.id);
    const map = new Map();
    const counts = mockUgCounts();
    sorted.forEach(o => {
        const node = { id: o.id, parentId: o.parentId, code: o.code, name: o.name, level: o.level, sortOrder: o.sortOrder, status: o.status };
        if (withUserGroupCount) node.userGroupCount = counts[o.id] || 0;
        node.children = [];
        map.set(o.id, node);
    });
    const roots = [];
    sorted.forEach(o => {
        const node = map.get(o.id);
        if (o.parentId == null) roots.push(node);
        else if (map.has(o.parentId)) map.get(o.parentId).children.push(node);
    });
    return roots;
}

// Giả lập GET /api/v1/admin/organizations/tree: query bất kỳ → 400; token thiếu → 401; 200 data = mảng gốc.
function mockGetOrgTree(token, query) {
    return new Promise(resolve => setTimeout(resolve, 300)).then(() => {
        if (!token) {
            return Promise.reject({ success: false, statusCode: 401, errorCode: 'UNAUTHORIZED',
                message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', errors: null, timestamp: orgNow() });
        }
        const keys = Object.keys(query || {});
        if (keys.length) {
            const errors = {};
            keys.forEach(k => { errors[k] = ['Tham số không được hỗ trợ']; });
            return Promise.reject({ success: false, statusCode: 400, errorCode: 'VALIDATION_ERROR',
                message: 'Dữ liệu không hợp lệ', errors, timestamp: orgNow() });
        }
        if (mockTreeFailOnce) {
            mockTreeFailOnce = false;
            return Promise.reject({ statusCode: 0, message: 'Không kết nối được máy chủ. Vui lòng thử lại.' });
        }
        const rows = ORG_QS.get('treeEmpty') === '1' ? [] : MOCK_ORG_ROWS;
        return { success: true, statusCode: 200, message: 'Lấy cây tổ chức thành công',
            data: buildOrgTree(rows, true), timestamp: orgNow() };
    });
}

const orgByName = (a, b) => a.name.localeCompare(b.name, 'vi') || a.id - b.id;

// Giả lập GET /api/v1/admin/organizations/:id (M01 mục 3.1.2): token thiếu → 401; :id sai định dạng hoặc
// có query → 400; không có dòng → 404; 200 data 16 trường (children sắp sortOrder, name, id; userGroups sắp name, id).
function mockGetOrgDetail(token, idParam, query) {
    return new Promise(resolve => setTimeout(resolve, 300)).then(() => {
        if (!token) {
            return Promise.reject({ success: false, statusCode: 401, errorCode: 'UNAUTHORIZED',
                message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', errors: null, timestamp: orgNow() });
        }
        const errors = {};
        const idStr = String(idParam);
        if (!/^[1-9][0-9]{0,9}$/.test(idStr) || Number(idStr) > 4294967295) errors.id = ['Mã đơn vị không hợp lệ'];
        Object.keys(query || {}).forEach(k => { errors[k] = ['Tham số không được hỗ trợ']; });
        if (Object.keys(errors).length) {
            return Promise.reject({ success: false, statusCode: 400, errorCode: 'VALIDATION_ERROR',
                message: 'Dữ liệu không hợp lệ', errors, timestamp: orgNow() });
        }
        if (mockDetailFailOnce) {
            mockDetailFailOnce = false;
            return Promise.reject({ statusCode: 0, message: 'Không kết nối được máy chủ. Vui lòng thử lại.' });
        }
        const id = Number(idStr);
        if (!MOCK_ORG_ROWS.some(o => o.id === id) || ORG_QS.get('detailMissing') === idStr) {
            return Promise.reject({ success: false, statusCode: 404, errorCode: 'NOT_FOUND',
                message: 'Không tìm thấy đơn vị tổ chức', errors: null, timestamp: orgNow() });
        }
        return { success: true, statusCode: 200, message: 'Lấy thông tin đơn vị tổ chức thành công',
            data: buildOrgDetailData(id), timestamp: orgNow() };
    });
}

// Dựng data 16 trường của GET /admin/organizations/:id (M01 mục 3.1.2 bước 2–4); PUT (mục 3.3 bước 6) đọc lại bằng hàm này.
function buildOrgDetailData(id) {
    const row = MOCK_ORG_ROWS.find(o => o.id === id);
    const parent = row.parentId == null ? null : MOCK_ORG_ROWS.find(o => o.id === row.parentId);
    const extra = MOCK_ORG_EXTRA[id] || {};
    const children = MOCK_ORG_ROWS.filter(o => o.parentId === id)
        .sort((a, b) => a.sortOrder - b.sortOrder || orgByName(a, b))
        .map(o => ({ id: o.id, code: o.code, name: o.name, level: o.level, status: o.status }));
    const userGroups = MOCK_USER_GROUPS.filter(g => g.organizationId === id).sort(orgByName)
        .map(g => ({ id: g.id, code: g.code, name: g.name, status: g.status }));
    return {
        id: row.id, parentId: row.parentId, parentName: parent ? parent.name : null,
        code: row.code, name: row.name, level: row.level, sortOrder: row.sortOrder, status: row.status,
        description: extra.description ?? null,
        representativeName: extra.representativeName ?? null,
        representativePhone: extra.representativePhone ?? null,
        representativeEmail: extra.representativeEmail ?? null,
        createdAt: extra.createdAt || '2026-09-15T08:00:00+07:00',
        updatedAt: extra.updatedAt || '2026-09-15T08:00:00+07:00',
        children, userGroups
    };
}

// ---------- Mock POST /api/v1/admin/organizations (M01 mục 3.2) ----------
const ORG_CODE_RE = /^[A-Z0-9]+(-[A-Z0-9]+)*$/;
const ORG_PHONE_RE = /^(?=.*[0-9])[0-9+\-.() ]{1,30}$/;     // quy tắc số điện thoại liên hệ chung (02 mục 2)
const ORG_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const ORG_CREATE_FIELDS = ['code', 'name', 'parentId', 'sortOrder', 'description',
    'representativeName', 'representativePhone', 'representativeEmail'];
const MOCK_AUDIT_LOGS = [];   // đóng vai audit_logs (chỉ dòng ORGANIZATION / CREATE, UPDATE, DELETE do mock này ghi)
let mockOrgNextId = 16;
let mockCreateFailOnce = ORG_QS.get('createError') === '1';

const orgLen = v => [...v].length;
const orgBytes = v => new TextEncoder().encode(v).length;
function isOrgUint(v, min, max) { return typeof v === 'number' && Number.isInteger(v) && v >= min && v <= max; }

// Chuỗi tùy chọn: null/rỗng sau khi cắt → null; sai kiểu → lỗi. Trả { value } hoặc { error }.
function optionalOrgText(v) {
    if (v === null || v === undefined) return { value: null };
    if (typeof v !== 'string') return { error: 'Phải là chuỗi' };
    const t = v.trim();
    return { value: t === '' ? null : t };
}

// Kiểm tra body theo bảng M01 mục 3.2 (backend: DTO + class-validator). Trả { errors, value }.
function validateOrgCreateBody(body) {
    const errors = {};
    const add = (k, m) => { (errors[k] = errors[k] || []).push(m); };
    const value = {};
    if (!body || typeof body !== 'object' || Array.isArray(body)) return { errors: { body: ['Body phải là đối tượng JSON'] }, value };
    Object.keys(body).forEach(k => { if (!ORG_CREATE_FIELDS.includes(k)) add(k, 'Trường không được hỗ trợ'); });

    if (typeof body.code !== 'string' || body.code.trim() === '') add('code', 'Mã đơn vị là bắt buộc');
    else {
        value.code = body.code.trim();
        if (orgLen(value.code) < 2 || orgLen(value.code) > 50) add('code', 'Mã đơn vị dài 2–50 ký tự');
        else if (!ORG_CODE_RE.test(value.code)) add('code', 'Mã đơn vị chỉ gồm chữ hoa không dấu, chữ số, nối bằng một dấu "-"');
    }
    if (typeof body.name !== 'string' || body.name.trim() === '') add('name', 'Tên đơn vị là bắt buộc');
    else {
        value.name = body.name.trim();
        if (orgLen(value.name) < 3 || orgLen(value.name) > 255) add('name', 'Tên đơn vị dài 3–255 ký tự');
    }
    if (body.parentId === undefined || body.parentId === null) value.parentId = null;
    else if (!isOrgUint(body.parentId, 1, 4294967295)) add('parentId', 'Đơn vị cha không hợp lệ');
    else value.parentId = body.parentId;
    if (body.sortOrder === undefined) value.sortOrder = 0;
    else if (!isOrgUint(body.sortOrder, 0, 2147483647)) add('sortOrder', 'Thứ tự là số nguyên từ 0');
    else value.sortOrder = body.sortOrder;

    Object.keys(ORG_TEXT_RULES).forEach(k => applyOrgText(body, k, add, value));
    return { errors, value };
}

// Bốn trường chuỗi tùy chọn, dùng chung cho POST (mục 3.2) và PUT (mục 3.3)
const ORG_TEXT_RULES = {
    description: v => (orgBytes(v) > 65535 ? 'Mô tả quá dài' : null),
    representativeName: v => (orgLen(v) > 150 ? 'Tối đa 150 ký tự' : null),
    representativePhone: v => (ORG_PHONE_RE.test(v) ? null : 'Số điện thoại không hợp lệ'),
    representativeEmail: v => (orgLen(v) > 150 ? 'Tối đa 150 ký tự' : (ORG_EMAIL_RE.test(v) ? null : 'Email không hợp lệ'))
};
function applyOrgText(body, k, add, value) {
    const r = optionalOrgText(body[k]);
    if (r.error) { add(k, r.error); return; }
    value[k] = r.value;
    if (r.value !== null) { const m = ORG_TEXT_RULES[k](r.value); if (m) add(k, m); }
}

// ---------- Mock PUT /api/v1/admin/organizations/:id (M01 mục 3.3) ----------
const ORG_UPDATE_FIELDS = ['name', 'parentId', 'sortOrder', 'status', 'description',
    'representativeName', 'representativePhone', 'representativeEmail'];   // cũng là thứ tự changedFields
const ORG_ROW_FIELDS = ['name', 'parentId', 'sortOrder', 'status'];       // cột MOCK_ORG_ROWS; còn lại ở MOCK_ORG_EXTRA
let mockUpdateFailOnce = ORG_QS.get('updateError') === '1';

// Kiểm tra body cập nhật một phần: chỉ trường có mặt; code/level/trường lạ → 400. Trả { errors, value } (value chỉ khóa đã gửi).
function validateOrgUpdateBody(body) {
    const errors = {};
    const add = (k, m) => { (errors[k] = errors[k] || []).push(m); };
    const value = {};
    if (!body || typeof body !== 'object' || Array.isArray(body)) return { errors: { body: ['Body phải là đối tượng JSON'] }, value };
    const keys = Object.keys(body);
    if (!keys.length) add('body', 'Cần gửi ít nhất một trường');
    keys.forEach(k => {
        if (k === 'code') add(k, 'Mã đơn vị không đổi được sau khi tạo');
        else if (!ORG_UPDATE_FIELDS.includes(k)) add(k, 'Trường không được hỗ trợ');
    });
    const has = k => Object.prototype.hasOwnProperty.call(body, k);
    if (has('name')) {
        if (typeof body.name !== 'string' || body.name.trim() === '') add('name', 'Tên đơn vị là bắt buộc');
        else if (orgLen(body.name.trim()) < 3 || orgLen(body.name.trim()) > 255) add('name', 'Tên đơn vị dài 3–255 ký tự');
        else value.name = body.name.trim();
    }
    if (has('parentId')) {
        if (body.parentId === null) value.parentId = null;
        else if (!isOrgUint(body.parentId, 1, 4294967295)) add('parentId', 'Đơn vị cha không hợp lệ');
        else value.parentId = body.parentId;
    }
    if (has('sortOrder')) {
        if (!isOrgUint(body.sortOrder, 0, 2147483647)) add('sortOrder', 'Thứ tự là số nguyên từ 0');
        else value.sortOrder = body.sortOrder;
    }
    if (has('status')) {
        if (body.status !== 'ACTIVE' && body.status !== 'INACTIVE') add('status', 'Trạng thái là ACTIVE hoặc INACTIVE');
        else value.status = body.status;
    }
    Object.keys(ORG_TEXT_RULES).forEach(k => { if (has(k)) applyOrgText(body, k, add, value); });
    return { errors, value };
}

// Các đơn vị con cháu của id (kiểm chu trình, chiều cao nhánh, tính lại level)
function orgDescendants(id) {
    const out = [];
    (function walk(pid) { MOCK_ORG_ROWS.filter(o => o.parentId === pid).forEach(o => { out.push(o); walk(o.id); }); })(id);
    return out;
}

// Giả lập PUT: 401 → 400 (:id/query/body) → 404 → so trường → cha mới (400/409) → UPDATE + level nhánh + audit → 200.
function mockUpdateOrg(token, idParam, query, body) {
    return new Promise(resolve => setTimeout(resolve, 400)).then(() => {
        const fail = (statusCode, errorCode, message, errors) =>
            Promise.reject({ success: false, statusCode, errorCode, message, errors: errors || null, timestamp: orgNow() });
        if (!token) return fail(401, 'UNAUTHORIZED', 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
        const idStr = String(idParam);
        const { errors, value } = validateOrgUpdateBody(body);
        const idOk = /^[1-9][0-9]{0,9}$/.test(idStr) && Number(idStr) <= 4294967295;
        if (!idOk) errors.id = ['Mã đơn vị không hợp lệ'];
        Object.keys(query || {}).forEach(k => { errors[k] = ['Tham số không được hỗ trợ']; });
        if (idOk && value.parentId === Number(idStr)) (errors.parentId = errors.parentId || []).push('Không chọn chính đơn vị làm đơn vị cha');
        if (Object.keys(errors).length) return fail(400, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ', errors);
        if (mockUpdateFailOnce) {
            mockUpdateFailOnce = false;
            return Promise.reject({ statusCode: 0, message: 'Không kết nối được máy chủ. Vui lòng thử lại.' });
        }
        // Bước 2: khóa (giả lập) – không có dòng → 404
        const id = Number(idStr);
        const row = MOCK_ORG_ROWS.find(o => o.id === id);
        if (!row || ORG_QS.get('updateMissing') === idStr) return fail(404, 'NOT_FOUND', 'Không tìm thấy đơn vị tổ chức');
        const extra = MOCK_ORG_EXTRA[id] || (MOCK_ORG_EXTRA[id] = { description: null, representativeName: null,
            representativePhone: null, representativeEmail: null, createdAt: '2026-09-15T08:00:00+07:00', updatedAt: '2026-09-15T08:00:00+07:00' });
        // Bước 3: so chính xác từng trường đã gửi
        const current = { name: row.name, parentId: row.parentId, sortOrder: row.sortOrder, status: row.status,
            description: extra.description ?? null, representativeName: extra.representativeName ?? null,
            representativePhone: extra.representativePhone ?? null, representativeEmail: extra.representativeEmail ?? null };
        const changedFields = ORG_UPDATE_FIELDS.filter(k => k in value && value[k] !== current[k]);
        if (!changedFields.length) {
            return { success: true, statusCode: 200, message: 'Không có thay đổi nào', data: buildOrgDetailData(id), timestamp: orgNow() };
        }
        // Bước 4: cha mới (chỉ khi parentId đổi)
        let newLevel = row.level;
        const descendants = orgDescendants(id);
        if (changedFields.includes('parentId')) {
            if (value.parentId === null) newLevel = 0;
            else {
                const parent = MOCK_ORG_ROWS.find(o => o.id === value.parentId);
                if (parent && ORG_QS.get('parentInactive') === String(parent.id)) parent.status = 'INACTIVE';
                if (!parent) return fail(400, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ', { parentId: ['Đơn vị cha không tồn tại'] });
                if (descendants.some(o => o.id === parent.id)) {
                    return fail(400, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ', { parentId: ['Không chuyển được vào đơn vị con của chính nó'] });
                }
                if (parent.status !== 'ACTIVE') {
                    return fail(409, 'ORGANIZATION_INACTIVE', 'Đơn vị cha đã ngừng hoạt động',
                        { parentId: ['Đơn vị cha đã ngừng hoạt động, không chuyển vào được'] });
                }
                newLevel = parent.level + 1;
            }
            const height = descendants.reduce((m, o) => Math.max(m, o.level - row.level), 0);
            if (newLevel + height > 3) {
                return fail(400, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ', { parentId: ['Vượt cấp tối đa 3 (tính cả các đơn vị con)'] });
            }
        }
        // Bước 5: UPDATE đơn vị + level nhánh (updated_at đổi theo) + audit cùng transaction; status không lan sang con/nhóm
        const now = orgNow();
        const d = newLevel - row.level;
        changedFields.forEach(k => { if (ORG_ROW_FIELDS.includes(k)) row[k] = value[k]; else extra[k] = value[k]; });
        row.level = newLevel;
        extra.updatedAt = now;
        if (d !== 0) {
            descendants.forEach(o => {
                o.level += d;
                const ex = MOCK_ORG_EXTRA[o.id] || (MOCK_ORG_EXTRA[o.id] = { createdAt: '2026-09-15T08:00:00+07:00' });
                ex.updatedAt = now;
            });
        }
        MOCK_AUDIT_LOGS.push({ resourceName: 'ORGANIZATION', action: 'UPDATE', resourceId: String(id), actionDetails: { changedFields } });
        // Bước 6: đọc lại như GET .../:id
        return { success: true, statusCode: 200, message: 'Cập nhật đơn vị tổ chức thành công', data: buildOrgDetailData(id), timestamp: now };
    });
}

// Giả lập POST /api/v1/admin/organizations: 401 → 400 (query/body) → cha (400/409) → trùng code (409) → 201.
function mockCreateOrg(token, query, body) {
    return new Promise(resolve => setTimeout(resolve, 400)).then(() => {
        const fail = (statusCode, errorCode, message, errors) =>
            Promise.reject({ success: false, statusCode, errorCode, message, errors: errors || null, timestamp: orgNow() });
        if (!token) return fail(401, 'UNAUTHORIZED', 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
        const { errors, value } = validateOrgCreateBody(body);
        Object.keys(query || {}).forEach(k => { errors[k] = ['Tham số không được hỗ trợ']; });
        if (Object.keys(errors).length) return fail(400, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ', errors);
        if (mockCreateFailOnce) {
            mockCreateFailOnce = false;
            return Promise.reject({ statusCode: 0, message: 'Không kết nối được máy chủ. Vui lòng thử lại.' });
        }
        // Bước 2: đọc khóa chia sẻ dòng cha (giả lập: cha có thể vừa bị ngừng hoạt động bởi ?parentInactive=<id>)
        let level = 0;
        let parent = null;
        if (value.parentId !== null) {
            parent = MOCK_ORG_ROWS.find(o => o.id === value.parentId);
            if (parent && ORG_QS.get('parentInactive') === String(parent.id)) parent.status = 'INACTIVE';
            if (!parent) return fail(400, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ', { parentId: ['Đơn vị cha không tồn tại'] });
            if (parent.status !== 'ACTIVE') {
                return fail(409, 'ORGANIZATION_INACTIVE', 'Đơn vị cha đã ngừng hoạt động',
                    { parentId: ['Đơn vị cha đã ngừng hoạt động, không thêm được đơn vị con'] });
            }
            if (parent.level >= 3) {
                return fail(400, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ', { parentId: ['Đơn vị cha đã ở cấp 3, không thêm được cấp sâu hơn'] });
            }
            level = parent.level + 1;
        }
        // Bước 3: uniq_org_code (collation không phân biệt hoa thường; kể cả đơn vị INACTIVE)
        if (MOCK_ORG_ROWS.some(o => o.code.toUpperCase() === value.code.toUpperCase())) {
            return fail(409, 'CODE_DUPLICATE', 'Mã đơn vị đã tồn tại', { code: ['Mã đơn vị đã được dùng cho đơn vị khác'] });
        }
        const id = mockOrgNextId++;
        const now = orgNow();
        MOCK_ORG_ROWS.push({ id, parentId: value.parentId, code: value.code, name: value.name, level, sortOrder: value.sortOrder, status: 'ACTIVE' });
        MOCK_ORG_EXTRA[id] = { description: value.description, representativeName: value.representativeName,
            representativePhone: value.representativePhone, representativeEmail: value.representativeEmail, createdAt: now, updatedAt: now };
        // Bước 4: audit trong cùng transaction
        MOCK_AUDIT_LOGS.push({ resourceName: 'ORGANIZATION', action: 'CREATE', resourceId: String(id),
            actionDetails: { code: value.code, name: value.name, parentId: value.parentId } });
        return { success: true, statusCode: 201, message: 'Tạo đơn vị tổ chức thành công',
            data: {
                id, parentId: value.parentId, parentName: parent ? parent.name : null,
                code: value.code, name: value.name, level, sortOrder: value.sortOrder, status: 'ACTIVE',
                description: value.description, representativeName: value.representativeName,
                representativePhone: value.representativePhone, representativeEmail: value.representativeEmail,
                createdAt: now, updatedAt: now, children: [], userGroups: []
            },
            timestamp: now };
    });
}

// ---------- Mock DELETE /api/v1/admin/organizations/:id (M01 mục 3.4) ----------
let mockDeleteFailOnce = ORG_QS.get('deleteError') === '1';

// Giả lập DELETE: 401 → 400 (:id/query/body) → khóa dòng (404) → đọc khóa tham chiếu (409) → DELETE + audit → 200 { id }.
function mockDeleteOrg(token, idParam, query, body) {
    return new Promise(resolve => setTimeout(resolve, 400)).then(() => {
        const fail = (statusCode, errorCode, message, errors) =>
            Promise.reject({ success: false, statusCode, errorCode, message, errors: errors || null, timestamp: orgNow() });
        if (!token) return fail(401, 'UNAUTHORIZED', 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
        const errors = {};
        const idStr = String(idParam);
        if (!/^[1-9][0-9]{0,9}$/.test(idStr) || Number(idStr) > 4294967295) errors.id = ['Mã đơn vị không hợp lệ'];
        Object.keys(query || {}).forEach(k => { errors[k] = ['Tham số không được hỗ trợ']; });
        if (body != null && (typeof body !== 'object' || Array.isArray(body) || Object.keys(body).length)) {
            errors.body = ['API không nhận body'];
        }
        if (Object.keys(errors).length) return fail(400, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ', errors);
        if (mockDeleteFailOnce) {
            mockDeleteFailOnce = false;
            return Promise.reject({ statusCode: 0, message: 'Không kết nối được máy chủ. Vui lòng thử lại.' });
        }
        // Bước 2: SELECT ... FOR UPDATE theo khóa chính
        const id = Number(idStr);
        const idx = MOCK_ORG_ROWS.findIndex(o => o.id === id);
        if (idx < 0 || ORG_QS.get('deleteMissing') === idStr) return fail(404, 'NOT_FOUND', 'Không tìm thấy đơn vị tổ chức');
        // Bước 3: đọc khóa cả hai tham chiếu (đơn vị con mọi trạng thái; nhóm kể cả INACTIVE)
        if (ORG_QS.get('deleteInUse') === idStr && !MOCK_USER_GROUPS.some(g => g.organizationId === id)) {
            MOCK_USER_GROUPS.push({ id: 99, organizationId: id, code: 'UMO-NEW', name: 'Nhóm vừa tạo', status: 'ACTIVE' });
        }
        const hasChild = MOCK_ORG_ROWS.some(o => o.parentId === id);
        const hasGroup = MOCK_USER_GROUPS.some(g => g.organizationId === id);
        if (hasChild || hasGroup) {
            const why = hasChild && hasGroup ? 'đơn vị con và nhóm người dùng tham chiếu'
                : hasChild ? 'đơn vị con' : 'nhóm người dùng tham chiếu';
            return fail(409, 'ORGANIZATION_IN_USE', 'Không xóa được: đơn vị còn ' + why);
        }
        // Bước 4–5: DELETE (code giải phóng) + audit cùng transaction, action_details từ dòng đã khóa
        const row = MOCK_ORG_ROWS[idx];
        MOCK_ORG_ROWS.splice(idx, 1);
        delete MOCK_ORG_EXTRA[id];
        MOCK_AUDIT_LOGS.push({ resourceName: 'ORGANIZATION', action: 'DELETE', resourceId: String(id),
            actionDetails: { code: row.code, name: row.name, parentId: row.parentId } });
        return { success: true, statusCode: 200, message: 'Xóa đơn vị tổ chức thành công', data: { id }, timestamp: orgNow() };
    });
}

// ---------- Trạng thái màn hình (Vue: store useOrganizationStore.tree) ----------
let orgTree = [];                 // data của response gần nhất
const orgIndex = new Map();       // id → nút (tra nhanh cho modal)
const expandedOrgIds = new Set(); // giữ trạng thái mở/đóng theo id khi tải lại
let orgTreeLoadedOnce = false;
let orgTreeSeq = 0;

function canManageOrg() {
    if (ORG_QS.get('noManage') === '1') return false;
    const account = window.adminSession ? window.adminSession.getAccount() : null;
    return !!(account && (account.permissions || []).includes('org:manage'));
}

function orgCallApi(fn) {
    return window.adminSession ? window.adminSession.request(fn) : fn('mock-token');
}

function orgSvg(paths) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">' + paths + '</svg>';
}
const ORG_ICONS = {
    toggle: orgSvg('<polyline points="9 18 15 12 9 6"></polyline>'),
    view: orgSvg('<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>'),
    add: orgSvg('<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>'),
    edit: orgSvg('<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>'),
    del: orgSvg('<polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>')
};

// Điều kiện hiện nút (M01 mục 3.1 Frontend; backend vẫn kiểm tra ở O04–O06)
function canAddChild(node) { return canManageOrg() && node.status === 'ACTIVE' && node.level < 3; }
function canDeleteOrg(node) { return canManageOrg() && node.children.length === 0 && node.userGroupCount === 0; }

function setTreeState(message, withRetry) {
    const body = document.getElementById('orgTreeBody');
    if (!body) return;
    body.innerHTML = '';
    const tr = document.createElement('tr');
    tr.className = 'tree-state';
    const td = document.createElement('td');
    td.colSpan = 4;
    const text = document.createElement('span');
    text.textContent = message;
    td.appendChild(text);
    if (withRetry) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-outline';
        btn.textContent = 'Thử lại';
        btn.addEventListener('click', loadTree);
        td.appendChild(btn);
    }
    tr.appendChild(td);
    body.appendChild(tr);
}

function actionButton(cls, title, icon, onClick) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'action-btn ' + cls;
    btn.title = title;
    btn.innerHTML = icon;
    btn.addEventListener('click', onClick);
    return btn;
}

function renderOrgRow(body, node) {
    const tr = document.createElement('tr');
    tr.className = 'level-' + node.level + (expandedOrgIds.has(node.id) ? ' expanded' : '');
    tr.dataset.id = String(node.id);

    const nameTd = document.createElement('td');
    for (let i = 0; i < node.level; i++) {
        const indent = document.createElement('span');
        indent.className = 'indent';
        nameTd.appendChild(indent);
    }
    const toggle = document.createElement('span');
    if (node.children.length) {
        toggle.className = 'toggle-icon';
        toggle.innerHTML = ORG_ICONS.toggle;
        toggle.setAttribute('role', 'button');
        toggle.setAttribute('aria-label', expandedOrgIds.has(node.id) ? 'Thu gọn' : 'Mở rộng');
        toggle.addEventListener('click', () => {
            if (expandedOrgIds.has(node.id)) expandedOrgIds.delete(node.id); else expandedOrgIds.add(node.id);
            renderTree();
        });
    } else {
        toggle.className = 'toggle-icon empty';
    }
    nameTd.appendChild(toggle);
    const name = document.createElement('span');
    name.className = 'org-name' + (node.level === 0 ? ' fw-600' : '');
    name.textContent = node.name;
    nameTd.appendChild(name);

    const codeTd = document.createElement('td');
    codeTd.textContent = node.code;

    const statusTd = document.createElement('td');
    const badge = document.createElement('span');
    badge.className = 'badge-status ' + (node.status === 'ACTIVE' ? 'active' : 'inactive');
    badge.textContent = node.status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng hoạt động';
    statusTd.appendChild(badge);

    const actTd = document.createElement('td');
    actTd.className = 'text-right';
    actTd.appendChild(actionButton('view-btn', 'Xem chi tiết', ORG_ICONS.view, () => showOrgDetail(node.id)));
    if (canAddChild(node)) actTd.appendChild(actionButton('add-btn', 'Thêm tổ chức con', ORG_ICONS.add, () => openCreateOrgModal(node.id)));
    if (canManageOrg()) actTd.appendChild(actionButton('edit-btn', 'Sửa', ORG_ICONS.edit, () => openEditOrgModal(node.id)));
    if (canDeleteOrg(node)) actTd.appendChild(actionButton('delete-btn', 'Xóa', ORG_ICONS.del, () => openDeleteOrgModal(node.id)));

    tr.append(nameTd, codeTd, statusTd, actTd);
    body.appendChild(tr);
    // Con chỉ vẽ khi nút đang mở
    if (expandedOrgIds.has(node.id)) node.children.forEach(child => renderOrgRow(body, child));
}

function renderTree() {
    const body = document.getElementById('orgTreeBody');
    if (!body) return;
    if (!orgTree.length) { setTreeState('Chưa có đơn vị tổ chức nào', false); return; }
    body.innerHTML = '';
    orgTree.forEach(root => renderOrgRow(body, root));
}

function indexTree(nodes, parent) {
    nodes.forEach(n => { orgIndex.set(n.id, { node: n, parent }); indexTree(n.children, n); });
}

// Tải cây – lần đầu mở sẵn cấp 0 và cấp 1; các lần sau giữ trạng thái mở/đóng theo id.
function loadTree() {
    const seq = ++orgTreeSeq;
    setTreeState('Đang tải cây tổ chức...', false);
    return orgCallApi(token => mockGetOrgTree(token, {}))
        .then(res => {
            if (seq !== orgTreeSeq) return;
            orgTree = res.data;
            orgIndex.clear();
            indexTree(orgTree, null);
            if (!orgTreeLoadedOnce) {
                orgIndex.forEach(({ node }) => { if (node.level <= 1 && node.children.length) expandedOrgIds.add(node.id); });
                orgTreeLoadedOnce = true;
            }
            renderTree();
        })
        .catch(err => {
            if (seq !== orgTreeSeq) return;
            if (err && err.statusCode === 401) return; // request() đã chuyển về login
            setTreeState((err && err.message) || 'Không tải được cây tổ chức. Vui lòng thử lại.', true);
        });
}

// Chiều cao nhánh của một nút trên cây đã tải (0 = lá)
function orgSubtreeHeight(node) {
    return node && node.children.length ? 1 + Math.max(...node.children.map(orgSubtreeHeight)) : 0;
}

// Ô chọn đơn vị cha: duyệt theo thứ tự cây, chỉ nút ACTIVE có level + 1 + height ≤ 3.
// Khi sửa (M01 mục 3.3 Frontend): bỏ chính nó và nhánh con, height = chiều cao nhánh đang sửa,
// luôn giữ cha hiện tại (kể cả INACTIVE, hoặc không còn trên cây đã tải) để ô chọn đúng giá trị.
function fillParentOptions(excludeId, edit) {
    const select = document.getElementById('parentOrg');
    if (!select) return;
    while (select.options.length > 1) select.remove(1);
    const height = edit ? edit.height : 0;
    const keepId = edit ? edit.currentParentId : null;
    let keptShown = false;
    (function walk(nodes) {
        nodes.forEach(n => {
            if (n.id === excludeId) return; // bỏ cả nhánh
            const isCurrent = keepId != null && n.id === keepId;
            if (isCurrent || (n.status === 'ACTIVE' && n.level + 1 + height <= 3)) {
                const opt = document.createElement('option');
                opt.value = String(n.id);
                opt.textContent = '  '.repeat(n.level) + (n.level ? '↳ ' : '') + n.name
                    + (n.status === 'ACTIVE' ? '' : ' (ngừng hoạt động)');
                select.appendChild(opt);
                if (isCurrent) keptShown = true;
            }
            walk(n.children);
        });
    })(orgTree);
    if (keepId != null && !keptShown) {
        const opt = document.createElement('option');
        opt.value = String(keepId);
        opt.textContent = edit.currentParentName || ('Đơn vị #' + keepId);
        select.appendChild(opt);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const manage = canManageOrg();
    document.querySelectorAll('[data-permission]').forEach(el => {
        el.hidden = el.dataset.permission === 'org:manage' ? !manage : false;
    });
    setDetailManageButtons(null);
    // Mã đơn vị: tự viết hoa khi gõ (backend không tự đổi, M01 mục 3.2)
    const codeInput = document.getElementById('orgCode');
    if (codeInput) codeInput.addEventListener('input', () => {
        const pos = codeInput.selectionStart;
        codeInput.value = codeInput.value.toUpperCase();
        try { codeInput.setSelectionRange(pos, pos); } catch (e) { /* bỏ qua */ }
    });
    loadTree();
});

// ---------- Modal ----------
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.add('show');
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) modal.classList.remove('show');
}

// ---------- Form tạo/sửa (#orgModal). Tạo: O04 (M01 mục 3.2 Frontend); sửa: O05 (mục 3.3 Frontend) ----------
let orgFormMode = 'create';
let orgFormBusy = false;
let orgEditId = null;       // đơn vị đang sửa
let orgEditSource = null;   // data GET .../:id của lần mở sau cùng (null khi đang tải/lỗi)
let orgEditSeq = 0;

function orgFormEl() { return document.getElementById('orgForm'); }

function clearOrgFormErrors() {
    const form = orgFormEl();
    if (!form) return;
    form.querySelectorAll('[data-error-for]').forEach(slot => { slot.textContent = ''; slot.hidden = true; });
    form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
}

// Hiện errors[field] dưới ô; trả về thông điệp của khóa không có ô (hiện ở toast)
function showOrgFormErrors(errors) {
    const form = orgFormEl();
    const rest = [];
    Object.keys(errors || {}).forEach(field => {
        const msg = [].concat(errors[field]).join(' ');
        const slot = form.querySelector('[data-error-for="' + field + '"]');
        if (!slot) { rest.push(msg); return; }
        slot.textContent = msg;
        slot.hidden = false;
        if (form.elements[field]) form.elements[field].classList.add('is-invalid');
    });
    const first = form.querySelector('.is-invalid');
    if (first) first.focus();
    return rest;
}

function setOrgFormBusy(busy) {
    orgFormBusy = busy;
    const form = orgFormEl();
    form.querySelectorAll('input, select, textarea').forEach(el => { el.disabled = busy; });
    document.querySelectorAll('#orgModal [data-close-org]').forEach(el => { el.disabled = busy; });
    const btn = document.getElementById('btnSaveOrg');
    // chế độ sửa: chỉ lưu được khi đã tải xong dữ liệu
    btn.disabled = busy || (orgFormMode === 'edit' && !orgEditSource);
    btn.textContent = busy ? 'Đang lưu...' : (orgFormMode === 'create' ? 'Thêm đơn vị' : 'Lưu thay đổi');
}

function closeOrgForm() {
    if (orgFormBusy) return; // đang gửi: không đóng
    closeModal('orgModal');
    orgEditId = null;
    orgEditSeq++; // bỏ response tải form đang chờ
}

// Chế độ form: tạo (ô mã nhập được, không có ô trạng thái) / sửa (mã chỉ đọc, có ô trạng thái)
function setOrgFormMode(mode) {
    orgFormMode = mode;
    const edit = mode === 'edit';
    const code = document.getElementById('orgCode');
    if (code) code.readOnly = edit;
    const hint = document.getElementById('orgCodeHint');
    if (hint) hint.textContent = edit ? 'Mã đơn vị không đổi được sau khi tạo.'
        : 'Chữ hoa không dấu, chữ số, nối bằng dấu "-". Không đổi được sau khi tạo.';
    const statusGroup = document.getElementById('orgStatusGroup');
    if (statusGroup) statusGroup.hidden = !edit;
}

// Trạng thái tải/lỗi của form sửa: ẩn form, hiện thông điệp (+ "Thử lại")
function setOrgFormState(message, withRetry) {
    const state = document.getElementById('orgFormState');
    const form = orgFormEl();
    if (!state || !form) return;
    if (message == null) { state.hidden = true; state.innerHTML = ''; form.hidden = false; return; }
    form.hidden = true;
    state.innerHTML = '';
    state.hidden = false;
    const text = document.createElement('span');
    text.textContent = message;
    state.appendChild(text);
    if (withRetry) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-outline';
        btn.textContent = 'Thử lại';
        btn.addEventListener('click', () => loadOrgEdit(orgEditId));
        state.appendChild(btn);
    }
}

// Đọc form thành body POST: số cho parentId/sortOrder, ô trống của trường tùy chọn → null (sortOrder trống → bỏ).
function readOrgCreateBody() {
    const f = orgFormEl().elements;
    const opt = el => (el.value.trim() === '' ? null : el.value);
    const body = {
        code: f.code.value,
        name: f.name.value,
        parentId: f.parentId.value === '' ? null : Number(f.parentId.value),
        description: opt(f.description),
        representativeName: opt(f.representativeName),
        representativePhone: opt(f.representativePhone),
        representativeEmail: opt(f.representativeEmail)
    };
    const sort = f.sortOrder.value.trim();
    if (sort !== '') body.sortOrder = /^[0-9]+$/.test(sort) ? Number(sort) : NaN;
    return body;
}

// Kiểm tra trước khi gửi: cùng quy tắc với backend (validateOrgCreateBody), lỗi hiện dưới ô, không gọi API.
function validateOrgForm(body) {
    const errors = validateOrgCreateBody(body).errors;
    if (Number.isNaN(body.sortOrder)) errors.sortOrder = ['Thứ tự là số nguyên từ 0'];
    return errors;
}

function submitCreateOrg() {
    clearOrgFormErrors();
    const body = readOrgCreateBody();
    const clientErrors = validateOrgForm(body);
    if (Object.keys(clientErrors).length) { showOrgFormErrors(clientErrors); return; }
    setOrgFormBusy(true);
    orgCallApi(token => mockCreateOrg(token, {}, body))
        .then(res => {
            setOrgFormBusy(false);
            closeModal('orgModal');
            if (res.data.parentId != null) expandedOrgIds.add(res.data.parentId); // để đơn vị mới hiện ngay trên cây
            if (window.showToast) window.showToast('Đã thêm đơn vị ' + res.data.name, 'success');
            loadTree();
        })
        .catch(err => {
            setOrgFormBusy(false);
            if (err && err.statusCode === 401) return; // request() đã chuyển về login
            if (err && (err.statusCode === 400 || err.statusCode === 409) && err.errors) {
                const rest = showOrgFormErrors(err.errors);
                if (err.errorCode === 'ORGANIZATION_INACTIVE') {
                    // cha vừa bị ngừng hoạt động: tải lại cây rồi dựng lại ô chọn (giữ lỗi dưới ô)
                    const keepParent = orgFormEl().elements.parentId.value;
                    loadTree().then(() => {
                        fillParentOptions(null);
                        const sel = orgFormEl().elements.parentId;
                        sel.value = [...sel.options].some(o => o.value === keepParent) ? keepParent : '';
                    });
                }
                if (rest.length && window.showToast) window.showToast(rest.join(' '), 'error');
                return;
            }
            if (window.showToast) window.showToast((err && err.message) || 'Không thêm được đơn vị. Vui lòng thử lại.', 'error');
        });
}

function saveOrg() {
    if (orgFormBusy) return;
    if (orgFormMode === 'create') submitCreateOrg();
    else submitUpdateOrg();
}

// Body PUT: chỉ trường khác dữ liệu đã tải (sau chuẩn hóa: cắt khoảng trắng, ô trống của trường tùy chọn → null).
// sortOrder trống/sai → NaN (lỗi dưới ô). code không đọc (chỉ đọc, không gửi).
function buildOrgUpdateBody(source) {
    const f = orgFormEl().elements;
    const opt = el => (el.value.trim() === '' ? null : el.value.trim());
    const sort = f.sortOrder.value.trim();
    const next = {
        name: f.name.value.trim(),
        parentId: f.parentId.value === '' ? null : Number(f.parentId.value),
        sortOrder: /^[0-9]+$/.test(sort) ? Number(sort) : NaN,
        status: f.status.value,
        description: opt(f.description),
        representativeName: opt(f.representativeName),
        representativePhone: opt(f.representativePhone),
        representativeEmail: opt(f.representativeEmail)
    };
    const body = {};
    ORG_UPDATE_FIELDS.forEach(k => { if (!Object.is(next[k], source[k])) body[k] = next[k]; });
    return body;
}

function submitUpdateOrg() {
    const source = orgEditSource;
    const id = orgEditId;
    if (!source || id == null) return;
    clearOrgFormErrors();
    const body = buildOrgUpdateBody(source);
    if (!Object.keys(body).length) { // quy ước A18: không đổi gì thì không gọi API
        closeOrgForm();
        if (window.showToast) window.showToast('Không có thay đổi nào', 'info');
        return;
    }
    const clientErrors = validateOrgUpdateBody(body).errors;
    if (Number.isNaN(body.sortOrder)) clientErrors.sortOrder = ['Thứ tự là số nguyên từ 0'];
    if (body.parentId === id) clientErrors.parentId = ['Không chọn chính đơn vị làm đơn vị cha'];
    if (Object.keys(clientErrors).length) { showOrgFormErrors(clientErrors); return; }
    setOrgFormBusy(true);
    orgCallApi(token => mockUpdateOrg(token, String(id), {}, body))
        .then(res => {
            setOrgFormBusy(false);
            closeOrgForm();
            if (res.data.parentId != null) expandedOrgIds.add(res.data.parentId); // để đơn vị hiện ngay dưới cha mới
            if (window.showToast) window.showToast('Đã lưu đơn vị ' + res.data.name, 'success');
            loadTree();
        })
        .catch(err => {
            setOrgFormBusy(false);
            if (err && err.statusCode === 401) return; // request() đã chuyển về login
            if (err && err.statusCode === 404) {
                closeOrgForm();
                if (window.showToast) window.showToast('Đơn vị tổ chức không còn tồn tại', 'warning');
                loadTree();
                return;
            }
            if (err && (err.statusCode === 400 || err.statusCode === 409) && err.errors) {
                const rest = showOrgFormErrors(err.errors);
                if (err.errorCode === 'ORGANIZATION_INACTIVE') {
                    // cha mới vừa bị ngừng hoạt động: tải lại cây rồi dựng lại ô chọn (giữ lỗi dưới ô)
                    const keepParent = orgFormEl().elements.parentId.value;
                    loadTree().then(() => {
                        if (orgEditId !== id || !orgEditSource) return;
                        fillParentOptions(id, orgEditContext(orgEditSource));
                        const sel = orgFormEl().elements.parentId;
                        sel.value = [...sel.options].some(o => o.value === keepParent) ? keepParent
                            : (orgEditSource.parentId == null ? '' : String(orgEditSource.parentId));
                    });
                }
                if (rest.length && window.showToast) window.showToast(rest.join(' '), 'error');
                return;
            }
            if (window.showToast) window.showToast((err && err.message) || 'Không lưu được đơn vị. Vui lòng thử lại.', 'error');
        });
}

// ---------- Chi tiết đơn vị (O03, M01 mục 3.1.2 Frontend; Vue: store selectedOrg / fetchDetail) ----------
let currentDetailOrgId = null;
let currentDeleteOrgId = null;
let orgDetailSeq = 0;

const ORG_LEVEL_LABELS = ['Cấp 0 – Tập đoàn', 'Cấp 1 – Tổng công ty', 'Cấp 2 – Khối/Công ty', 'Cấp 3 – Phòng ban/Điện lực'];

// Định dạng ngày giờ ở frontend (R16-07): API trả ISO 8601 +07:00
function formatOrgDateTime(iso) {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh', hour12: false,
        year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}

function orgStatusBadge(status) {
    const badge = document.createElement('span');
    badge.className = 'badge-status ' + (status === 'ACTIVE' ? 'active' : 'inactive');
    badge.textContent = status === 'ACTIVE' ? 'Hoạt động' : 'Ngừng hoạt động';
    return badge;
}

// "Thêm tổ chức con": org:manage + ACTIVE + level < 3; "Chỉnh sửa": org:manage. Ẩn khi đang tải/lỗi.
function setDetailManageButtons(data) {
    const manage = canManageOrg();
    const addBtn = document.querySelector('#orgDetailModal [data-manage="add"]');
    const editBtn = document.querySelector('#orgDetailModal [data-manage="edit"]');
    if (addBtn) addBtn.hidden = !(manage && data && data.status === 'ACTIVE' && data.level < 3);
    if (editBtn) editBtn.hidden = !(manage && data);
}

function setDetailState(message, withRetry) {
    const state = document.getElementById('orgDetailState');
    const content = document.getElementById('orgDetailContent');
    if (content) content.hidden = true;
    setDetailManageButtons(null);
    if (!state) return;
    state.innerHTML = '';
    state.hidden = false;
    const text = document.createElement('span');
    text.textContent = message;
    state.appendChild(text);
    if (withRetry) {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'btn btn-outline';
        btn.textContent = 'Thử lại';
        btn.addEventListener('click', () => loadOrgDetail(currentDetailOrgId));
        state.appendChild(btn);
    }
}

function fillDetailList(listId, items, emptyText) {
    const list = document.getElementById(listId);
    if (!list) return;
    list.innerHTML = '';
    if (!items.length) {
        const li = document.createElement('li');
        li.className = 'detail-list-empty';
        li.textContent = emptyText;
        list.appendChild(li);
        return;
    }
    items.forEach(item => {
        const li = document.createElement('li');
        const code = document.createElement('span');
        code.className = 'badge-code';
        code.textContent = item.code;
        const name = document.createElement('span');
        name.className = 'detail-list-name';
        name.textContent = item.name;
        li.append(code, name, orgStatusBadge(item.status));
        list.appendChild(li);
    });
}

function renderOrgDetail(data) {
    const content = document.getElementById('orgDetailContent');
    const state = document.getElementById('orgDetailState');
    if (!content) return;
    const dash = v => (v == null || v === '' ? '—' : String(v));
    const text = {
        name: data.name,
        code: data.code,
        level: ORG_LEVEL_LABELS[data.level] || ('Cấp ' + data.level),
        parentName: data.parentName == null ? 'Không có (đơn vị gốc)' : data.parentName,
        sortOrder: String(data.sortOrder),
        representativeName: dash(data.representativeName),
        representativePhone: dash(data.representativePhone),
        representativeEmail: dash(data.representativeEmail),
        timestamps: formatOrgDateTime(data.createdAt) + ' / ' + formatOrgDateTime(data.updatedAt),
        description: data.description == null || data.description === '' ? '(Chưa có mô tả)' : data.description
    };
    content.querySelectorAll('[data-detail]').forEach(el => {
        const key = el.dataset.detail;
        if (key === 'status') { el.innerHTML = ''; el.appendChild(orgStatusBadge(data.status)); }
        else el.textContent = text[key] ?? '';
    });
    const title = document.getElementById('detailOrgTitle');
    if (title) title.textContent = data.name;
    fillDetailList('detailChildren', data.children, 'Không có đơn vị con');
    // userGroups chỉ có ở bản Admin; route User không trả trường này
    fillDetailList('detailUserGroups', data.userGroups || [], 'Chưa có nhóm người dùng nào');
    if (state) state.hidden = true;
    content.hidden = false;
    setDetailManageButtons(data);
}

// Gọi GET .../:id mỗi lần mở hộp; chỉ hiển thị response của lần gọi sau cùng.
function loadOrgDetail(id) {
    const seq = ++orgDetailSeq;
    setDetailState('Đang tải thông tin đơn vị...', false);
    return orgCallApi(token => mockGetOrgDetail(token, String(id), {}))
        .then(res => {
            if (seq !== orgDetailSeq || currentDetailOrgId !== id) return;
            renderOrgDetail(res.data);
        })
        .catch(err => {
            if (seq !== orgDetailSeq || currentDetailOrgId !== id) return;
            if (err && err.statusCode === 401) return; // request() đã chuyển về login
            if (err && err.statusCode === 404) {
                closeOrgDetail();
                if (window.showToast) window.showToast('Đơn vị tổ chức không còn tồn tại', 'warning');
                loadTree();
                return;
            }
            setDetailState((err && err.message) || 'Không tải được thông tin đơn vị. Vui lòng thử lại.', true);
        });
}

function showOrgDetail(id) {
    const entry = orgIndex.get(id);
    currentDetailOrgId = id;
    const title = document.getElementById('detailOrgTitle');
    if (title) title.textContent = entry ? entry.node.name : '';
    openModal('orgDetailModal');
    loadOrgDetail(id);
}

function closeOrgDetail() {
    closeModal('orgDetailModal');
    currentDetailOrgId = null;
    orgDetailSeq++; // bỏ response đang chờ
}

function editOrgFromDetail() {
    const id = currentDetailOrgId;
    closeOrgDetail();
    if (id) openEditOrgModal(id);
}

function addOrgFromDetail() {
    const parentId = currentDetailOrgId;
    closeOrgDetail();
    openCreateOrgModal(parentId);
}

// Ngữ cảnh ô chọn cha khi sửa: chiều cao nhánh (từ cây đã tải) + cha hiện tại (từ GET .../:id)
function orgEditContext(data) {
    const entry = orgIndex.get(data.id);
    return { height: orgSubtreeHeight(entry ? entry.node : null), currentParentId: data.parentId, currentParentName: data.parentName };
}

// Mở form sửa: tiêu đề từ nút cây, tải GET .../:id mỗi lần mở (không dùng dữ liệu cây/chi tiết cũ).
function openEditOrgModal(id) {
    setOrgFormMode('edit');
    const form = orgFormEl();
    if (form) form.reset();
    clearOrgFormErrors();
    orgEditId = id;
    orgEditSource = null;
    setOrgFormBusy(false);
    const entry = orgIndex.get(id);
    const modalTitle = document.querySelector('#orgModal .modal-header h2');
    if (modalTitle) modalTitle.innerText = 'Chỉnh sửa – ' + (entry ? entry.node.name : 'đơn vị tổ chức');
    openModal('orgModal');
    loadOrgEdit(id);
}

// Chỉ nhận response của lần mở sau cùng; 404 → đóng hộp + toast cảnh báo + tải lại cây; lỗi khác → "Thử lại".
function loadOrgEdit(id) {
    const seq = ++orgEditSeq;
    orgEditSource = null;
    setOrgFormBusy(false);
    setOrgFormState('Đang tải thông tin đơn vị...', false);
    return orgCallApi(token => mockGetOrgDetail(token, String(id), {}))
        .then(res => {
            if (seq !== orgEditSeq || orgEditId !== id) return;
            orgEditSource = res.data;
            populateOrgForm(res.data);
            setOrgFormState(null);
            setOrgFormBusy(false);
            const nameInput = document.getElementById('orgName');
            if (nameInput) nameInput.focus();
        })
        .catch(err => {
            if (seq !== orgEditSeq || orgEditId !== id) return;
            if (err && err.statusCode === 401) return; // request() đã chuyển về login
            if (err && err.statusCode === 404) {
                closeOrgForm();
                if (window.showToast) window.showToast('Đơn vị tổ chức không còn tồn tại', 'warning');
                loadTree();
                return;
            }
            setOrgFormState((err && err.message) || 'Không tải được thông tin đơn vị. Vui lòng thử lại.', true);
        });
}

function openCreateOrgModal(parentId = '') {
    setOrgFormMode('create');
    orgEditId = null;
    orgEditSource = null;
    orgEditSeq++;
    setOrgFormState(null);
    const form = orgFormEl();
    if (form) form.reset();
    clearOrgFormErrors();
    setOrgFormBusy(false);
    fillParentOptions(null);

    const parent = parentId ? orgIndex.get(parentId) : null;
    const modalTitle = document.querySelector('#orgModal .modal-header h2');
    if (modalTitle) {
        modalTitle.innerText = parent ? 'Thêm mới tổ chức con - Trực thuộc ' + parent.node.name : 'Thêm mới tổ chức';
    }
    const parentSelect = document.getElementById('parentOrg');
    if (parentSelect) parentSelect.value = parent ? String(parentId) : '';
    openModal('orgModal');
    const nameInput = document.getElementById('orgName');
    if (nameInput) nameInput.focus();
}

// Điền form sửa từ data GET .../:id (16 trường); null → ô trống
function populateOrgForm(data) {
    fillParentOptions(data.id, orgEditContext(data));
    const val = (elId, v) => { const el = document.getElementById(elId); if (el) el.value = v == null ? '' : String(v); };
    val('orgName', data.name);
    val('orgCode', data.code);
    val('parentOrg', data.parentId);
    val('sortOrder', data.sortOrder);
    val('orgStatus', data.status);
    val('orgDesc', data.description);
    val('orgRepName', data.representativeName);
    val('orgRepPhone', data.representativePhone);
    val('orgRepEmail', data.representativeEmail);
}

// ---------- Xóa đơn vị (O06, M01 mục 3.4 Frontend; Vue: ConfirmModal + store deleteOrg) ----------
let deleteOrgBusy = false;

function setDeleteOrgBusy(busy) {
    deleteOrgBusy = busy;
    const ok = document.getElementById('deleteOrgConfirmBtn');
    const cancel = document.getElementById('deleteOrgCancelBtn');
    if (ok) { ok.disabled = busy; ok.textContent = busy ? 'Đang xóa...' : 'Xóa'; }
    if (cancel) cancel.disabled = busy;
}

// Hộp nêu đối tượng (tên, mã từ nút cây); không có ô gõ xác nhận
function openDeleteOrgModal(id) {
    const entry = orgIndex.get(id);
    if (!entry) return;
    currentDeleteOrgId = id;
    const msg = document.getElementById('deleteOrgMessage');
    if (msg) msg.textContent = 'Xóa vĩnh viễn đơn vị ' + entry.node.name + ' (' + entry.node.code + ')? Thao tác không hoàn tác được.';
    setDeleteOrgBusy(false);
    const modal = document.getElementById('deleteOrgModal');
    if (modal) modal.style.display = 'flex';
}

function closeDeleteOrgModal() {
    if (deleteOrgBusy) return;   // đang gửi: không đóng (Hủy, nền, Esc)
    const modal = document.getElementById('deleteOrgModal');
    if (modal) modal.style.display = 'none';
    currentDeleteOrgId = null;
}

// 200/404/409 → đóng hộp + toast + tải lại cây (quy ước A13); lỗi khác → toast lỗi, đóng hộp, không tải lại.
function confirmDeleteOrg() {
    if (deleteOrgBusy || currentDeleteOrgId == null) return;
    const id = currentDeleteOrgId;
    const entry = orgIndex.get(id);
    const name = entry ? entry.node.name : ('#' + id);
    setDeleteOrgBusy(true);
    return orgCallApi(token => mockDeleteOrg(token, String(id), {}, null))
        .then(() => {
            setDeleteOrgBusy(false);
            closeDeleteOrgModal();
            if (window.showToast) window.showToast('Đã xóa đơn vị ' + name, 'success');
            loadTree();
        })
        .catch(err => {
            setDeleteOrgBusy(false);
            closeDeleteOrgModal();
            if (err && err.statusCode === 401) return; // request() đã chuyển về login
            if (err && (err.statusCode === 404 || err.statusCode === 409)) {
                const text = err.statusCode === 404 ? 'Đơn vị tổ chức không còn tồn tại' : err.message;
                if (window.showToast) window.showToast(text, 'warning');
                loadTree();
                return;
            }
            if (window.showToast) window.showToast((err && err.message) || 'Không xóa được đơn vị. Vui lòng thử lại.', 'error');
        });
}

document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('deleteOrgModal');
    if (modal) modal.addEventListener('click', e => { if (e.target === modal) closeDeleteOrgModal(); });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && modal && modal.style.display === 'flex') closeDeleteOrgModal();
    });
});
