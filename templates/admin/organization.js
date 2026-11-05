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
 * Tạo/sửa/xóa (O04–O06) còn là demo, nối API ở các endpoint đó.
 *
 * Kiểm tay mock: ?treeError=1 (lỗi tải, "Thử lại" thành công), ?treeEmpty=1 (cây rỗng), ?noManage=1 (thiếu org:manage),
 * ?detailError=1 (lần mở chi tiết đầu lỗi mạng, "Thử lại" thành công), ?detailMissing=<id> (đơn vị đã bị xóa → 404).
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
const MOCK_UG_COUNTS = MOCK_USER_GROUPS.reduce((acc, g) => { acc[g.organizationId] = (acc[g.organizationId] || 0) + 1; return acc; }, {});
let mockTreeFailOnce = ORG_QS.get('treeError') === '1';
let mockDetailFailOnce = ORG_QS.get('detailError') === '1';

function orgNow() { return new Date().toISOString().replace('Z', '+07:00'); }

// Dựng cây như OrganizationsService.getTree (M01 mục 4.1): sắp level, sortOrder, name, id rồi gắn con vào cha.
function buildOrgTree(rows, withUserGroupCount) {
    const sorted = rows.slice().sort((a, b) =>
        a.level - b.level || a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'vi') || a.id - b.id);
    const map = new Map();
    sorted.forEach(o => {
        const node = { id: o.id, parentId: o.parentId, code: o.code, name: o.name, level: o.level, sortOrder: o.sortOrder, status: o.status };
        if (withUserGroupCount) node.userGroupCount = MOCK_UG_COUNTS[o.id] || 0;
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
        const row = MOCK_ORG_ROWS.find(o => o.id === id);
        if (!row || ORG_QS.get('detailMissing') === idStr) {
            return Promise.reject({ success: false, statusCode: 404, errorCode: 'NOT_FOUND',
                message: 'Không tìm thấy đơn vị tổ chức', errors: null, timestamp: orgNow() });
        }
        const parent = row.parentId == null ? null : MOCK_ORG_ROWS.find(o => o.id === row.parentId);
        const extra = MOCK_ORG_EXTRA[id] || {};
        const children = MOCK_ORG_ROWS.filter(o => o.parentId === id)
            .sort((a, b) => a.sortOrder - b.sortOrder || orgByName(a, b))
            .map(o => ({ id: o.id, code: o.code, name: o.name, level: o.level, status: o.status }));
        const userGroups = MOCK_USER_GROUPS.filter(g => g.organizationId === id).sort(orgByName)
            .map(g => ({ id: g.id, code: g.code, name: g.name, status: g.status }));
        return { success: true, statusCode: 200, message: 'Lấy thông tin đơn vị tổ chức thành công',
            data: {
                id: row.id, parentId: row.parentId, parentName: parent ? parent.name : null,
                code: row.code, name: row.name, level: row.level, sortOrder: row.sortOrder, status: row.status,
                description: extra.description ?? null,
                representativeName: extra.representativeName ?? null,
                representativePhone: extra.representativePhone ?? null,
                representativeEmail: extra.representativeEmail ?? null,
                createdAt: extra.createdAt || '2026-09-15T08:00:00+07:00',
                updatedAt: extra.updatedAt || '2026-09-15T08:00:00+07:00',
                children, userGroups
            },
            timestamp: orgNow() };
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

// Ô chọn đơn vị cha: duyệt theo thứ tự cây, chỉ nút ACTIVE có level < 3; khi sửa bỏ chính nó và nhánh con.
function fillParentOptions(excludeId) {
    const select = document.getElementById('parentOrg');
    if (!select) return;
    while (select.options.length > 1) select.remove(1);
    (function walk(nodes) {
        nodes.forEach(n => {
            if (n.id === excludeId) return; // bỏ cả nhánh
            if (n.status === 'ACTIVE' && n.level < 3) {
                const opt = document.createElement('option');
                opt.value = String(n.id);
                opt.textContent = '  '.repeat(n.level) + (n.level ? '↳ ' : '') + n.name;
                select.appendChild(opt);
            }
            walk(n.children);
        });
    })(orgTree);
}

document.addEventListener('DOMContentLoaded', () => {
    const manage = canManageOrg();
    document.querySelectorAll('[data-permission]').forEach(el => {
        el.hidden = el.dataset.permission === 'org:manage' ? !manage : false;
    });
    setDetailManageButtons(null);
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

// Demo O04/O05: sau khi API trả 200 thì tải lại cả cây (không sửa dòng tại chỗ).
function saveOrg() {
    const btn = document.querySelector('#orgModal .btn-primary');
    const originalText = btn.innerText;
    btn.innerText = 'Đang lưu...';
    btn.disabled = true;
    setTimeout(() => {
        btn.innerText = originalText;
        btn.disabled = false;
        closeModal('orgModal');
        if (window.showToast) window.showToast('Đã lưu thông tin tổ chức (demo)', 'success');
        loadTree();
    }, 800);
}

// ---------- Chi tiết đơn vị (O03, M01 mục 3.1.2 Frontend; Vue: store selectedOrg / fetchDetail) ----------
let currentDetailOrgId = null;
let currentDeleteOrgId = null;
let orgDetail = null;       // data của lần tải chi tiết thành công gần nhất (form sửa O05 dùng lại khi cùng id)
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
            orgDetail = res.data;
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
    orgDetail = null;
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

function openEditOrgModal(id) {
    const modalTitle = document.querySelector('#orgModal .modal-header h2');
    if (modalTitle) modalTitle.innerText = 'Chỉnh sửa thông tin tổ chức';
    fillParentOptions(id);
    populateOrgForm(id);
    openModal('orgModal');
}

function openCreateOrgModal(parentId = '') {
    const form = document.getElementById('orgForm');
    if (form) form.reset();
    fillParentOptions(null);

    const parent = parentId ? orgIndex.get(parentId) : null;
    const modalTitle = document.querySelector('#orgModal .modal-header h2');
    if (modalTitle) {
        modalTitle.innerText = parent ? 'Thêm mới tổ chức con - Trực thuộc ' + parent.node.name : 'Thêm mới tổ chức';
    }
    const parentSelect = document.getElementById('parentOrg');
    if (parentSelect) parentSelect.value = parent ? String(parentId) : '';
    openModal('orgModal');
}

function populateOrgForm(id) {
    const entry = orgIndex.get(id);
    if (!entry) return;
    const org = entry.node;
    const val = (elId, v) => { const el = document.getElementById(elId); if (el) el.value = v; };
    val('orgName', org.name);
    val('orgCode', org.code);
    val('parentOrg', org.parentId == null ? '' : String(org.parentId));
    val('sortOrder', String(org.sortOrder));
    // O05: form sửa tải GET .../:id trước khi mở; tạm dùng chi tiết vừa xem nếu cùng id
    val('orgDesc', orgDetail && orgDetail.id === id ? (orgDetail.description || '') : '');
}

function openDeleteOrgModal(id) {
    currentDeleteOrgId = id;
    openModal('deleteModal');
}

// Demo O06: sau khi API trả 200 (hoặc 409 ORGANIZATION_IN_USE) thì tải lại cây.
function confirmDelete() {
    const btn = document.querySelector('#deleteModal .btn-danger');
    const originalText = btn.innerText;
    btn.innerText = 'Đang xóa...';
    btn.disabled = true;
    setTimeout(() => {
        btn.innerText = originalText;
        btn.disabled = false;
        closeModal('deleteModal');
        currentDeleteOrgId = null;
        if (window.showToast) window.showToast('Đã xóa tổ chức (demo)', 'success');
        loadTree();
    }, 800);
}
