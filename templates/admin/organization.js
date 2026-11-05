/**
 * EVN CDR AS - Danh mục tổ chức (templates/admin/organization.html → OrganizationView.vue)
 *
 * Cây: GET /api/v1/admin/organizations/tree (O01, docs/modules/01_organization.md mục 3.1).
 *  - Không query, không phân trang; data = mảng nút gốc, mỗi nút
 *    { id, parentId, code, name, level, sortOrder, status, userGroupCount, children } (userGroupCount chỉ bản Admin).
 *  - Gọi qua adminSession.request (401 → refresh một lần rồi gửi lại); tải lại cả cây sau mỗi thao tác ghi.
 * Chi tiết đơn vị (O03), tạo/sửa/xóa (O04–O06) còn là demo, nối API ở các endpoint đó.
 *
 * Kiểm tay mock: ?treeError=1 (lỗi tải, "Thử lại" thành công), ?treeEmpty=1 (cây rỗng), ?noManage=1 (thiếu org:manage).
 */

const ORG_QS = new URLSearchParams(window.location.search);

// ---------- Mock backend ----------
// MOCK_ORG_ROWS đóng vai bảng organizations (chỉ các cột câu SELECT ở bước 2 đọc);
// MOCK_UG_COUNTS đóng vai kết quả COUNT(*) user_groups GROUP BY organization_id (kể cả nhóm INACTIVE).
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
const MOCK_UG_COUNTS = { 2: 2, 5: 1, 14: 1 };
let mockTreeFailOnce = ORG_QS.get('treeError') === '1';

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
    document.querySelectorAll('#orgDetailModal [data-manage]').forEach(el => { el.hidden = !manage; });
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

// Chi tiết: dữ liệu đầy đủ lấy từ GET /api/v1/admin/organizations/:id (O03); tạm dùng mô tả mẫu dưới đây.
let currentDetailOrgId = null;
let currentDeleteOrgId = null;

const orgDescriptions = {
    1: 'Đơn vị quản lý cấp cao điều hành mạng lưới viễn thông, hạ tầng kỹ thuật và dịch vụ tổng đài nội bộ toàn hệ thống.',
    2: 'Quản trị hạ tầng công nghệ thông tin, máy chủ tổng đài PABX, hệ thống phân tích nhật ký cuộc gọi CDR và đảm bảo an toàn thông tin.',
    3: 'Nghiên cứu, thiết kế và phát triển các giải pháp phần mềm nghiệp vụ, ứng dụng phân tích CDR và cổng dịch vụ nội bộ EVN.',
    4: 'Theo dõi, vận hành 24/7 hạ tầng mạng thoại VoIP, tổng đài nội bộ PABX, giám sát các chỉ số chất lượng dịch vụ QoS.',
    5: 'Điều phối hoạt động kinh doanh dịch vụ viễn thông, chăm sóc đối tác, quản lý doanh thu và phát triển khách hàng.'
};

function showOrgDetail(id) {
    const entry = orgIndex.get(id);
    if (!entry) return;
    const org = entry.node;
    currentDetailOrgId = id;
    const set = (elId, text) => { const el = document.getElementById(elId); if (el) el.textContent = text; };
    set('detailOrgTitle', org.name);
    set('detailOrgName', org.name);
    set('detailOrgCode', org.code);
    set('detailParentOrg', entry.parent ? entry.parent.name : 'Không có (Đơn vị gốc - Root)');
    set('detailSortOrder', String(org.sortOrder));
    set('detailOrgDesc', orgDescriptions[id] || '(Chưa có mô tả)');
    const addBtn = document.querySelector('#orgDetailModal [data-manage="add"]');
    if (addBtn) addBtn.hidden = !canAddChild(org);
    openModal('orgDetailModal');
}

function editOrgFromDetail() {
    closeModal('orgDetailModal');
    if (currentDetailOrgId) openEditOrgModal(currentDetailOrgId);
}

function addOrgFromDetail() {
    const parentId = currentDetailOrgId;
    closeModal('orgDetailModal');
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
    val('orgDesc', orgDescriptions[id] || '');
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
