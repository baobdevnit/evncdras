// templates/admin/users.js – EVN CDR AS, Quản lý người dùng (admin.users → UserListView.vue)
//
// Bảng người dùng: GET /api/v1/admin/users (N01, docs/modules/03_auth_user.md mục 3.3, 5.1).
// Danh mục nhóm bên trái: GET /api/v1/admin/user-groups?limit=100 (G01, docs/modules/02_user_group.md mục 3.1).
// Vue: store useUserStore (users, pagination, query { page, search, status, roleCode, userGroupId }), action fetchUsers.
// Kiểm tay mock: ?usersError=1 (lỗi mạng một lần ở bảng), ?groupsError=1 (lỗi mạng một lần ở danh mục nhóm),
// ?noEdit=1 / ?noDelete=1 (store thiếu user:edit / user:delete).
// Các hộp Thêm/Sửa/Ngừng hoạt động bên dưới vẫn là mock cũ, rà ở N03 (POST), N04 (PUT), N09 (DELETE).

const US_QS = new URLSearchParams(window.location.search);
let usMockUsersError = US_QS.get('usersError') === '1';
let usMockGroupsError = US_QS.get('groupsError') === '1';

// ==========================================================================
// 1. Giả lập backend
// ==========================================================================

function usNow() { return new Date().toISOString().replace('Z', '+07:00'); }
const usCallApi = fn => (window.adminSession ? window.adminSession.request(fn) : fn('mock-token'));
const usFail = (statusCode, errorCode, message, errors) =>
    Promise.reject({ success: false, statusCode, errorCode, message, errors: errors || null, timestamp: usNow() });
const usUnauthorized = () => usFail(401, 'UNAUTHORIZED', 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
// utf8mb4_unicode_ci: không phân biệt hoa thường, không phân biệt dấu (mock xấp xỉ bằng NFD bỏ dấu).
const usFold = v => String(v == null ? '' : v).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Bảng user_groups giả lập (id, code, name, status, representative_user_id).
const MOCK_US_GROUPS = [
    { id: 1, code: 'UMO-IT-01', name: 'Nhóm Quản trị Vận hành HT', status: 'ACTIVE', representativeUserId: 10 },
    { id: 2, code: 'UMO-IT-02', name: 'Nhóm Kỹ thuật Phần mềm', status: 'ACTIVE', representativeUserId: 201 },
    { id: 3, code: 'UMO-KD-01', name: 'Nhóm Call Center CSKH', status: 'ACTIVE', representativeUserId: null },
    { id: 4, code: 'UMO-AUDIT', name: 'Tổ Giám sát Kiểm toán Độc lập', status: 'ACTIVE', representativeUserId: 401 },
    { id: 6, code: 'UMO-TBA-500', name: 'Nhóm Thử nghiệm Trạm Biến áp 500kV', status: 'INACTIVE', representativeUserId: null }
];
const MOCK_US_ROLE_NAMES = { GROUP_ADMIN: 'Quản trị viên nhóm', USER_RECORDING: 'Thành viên nghe ghi âm', REGULAR_USER: 'Thành viên' };

// Dòng "CSDL" của mock (users + user_roles), KHÔNG phải cấu trúc response: response là 14 trường của toUserListItem.
const MOCK_US_USERS = [
    { id: 10, userGroupId: 1, username: 'tran.b', email: 'tran.b@71portal.vn', fullName: 'Trần Thị B', jobTitle: 'Trưởng nhóm Kỹ thuật Vận hành', phoneNumber: '0912.345.678', avatarUrl: null, status: 'ACTIVE', roleCode: 'GROUP_ADMIN', lastLoginAt: '2026-11-05T08:12:40+07:00', createdAt: '2026-03-15T08:30:00+07:00' },
    { id: 15, userGroupId: 1, username: 'le.c', email: 'le.c@71portal.vn', fullName: 'Lê Văn C', jobTitle: 'Kỹ sư Quản trị Hệ thống', phoneNumber: null, avatarUrl: null, status: 'ACTIVE', roleCode: 'GROUP_ADMIN', lastLoginAt: '2026-11-04T16:40:00+07:00', createdAt: '2026-03-16T09:00:00+07:00' },
    { id: 101, userGroupId: 1, username: 'pham.d', email: 'pham.d@71portal.vn', fullName: 'Phạm Văn D', jobTitle: 'Kỹ sư Vận hành Máy chủ', phoneNumber: '0977 112 233', avatarUrl: null, status: 'ACTIVE', roleCode: 'USER_RECORDING', lastLoginAt: '2026-11-01T07:55:00+07:00', createdAt: '2026-03-20T10:00:00+07:00' },
    { id: 102, userGroupId: 1, username: 'tri.hm', email: 'tri.hm@71portal.vn', fullName: 'Hoàng Minh Trí', jobTitle: 'Chuyên viên Giám sát Mạng', phoneNumber: '0904556677', avatarUrl: null, status: 'ACTIVE', roleCode: 'REGULAR_USER', lastLoginAt: null, createdAt: '2026-04-01T08:00:00+07:00' },
    { id: 104, userGroupId: 1, username: 'anh.nt', email: 'anh.nt@71portal.vn', fullName: 'Nguyễn Tuấn Anh', jobTitle: null, phoneNumber: null, avatarUrl: null, status: 'LOCKED', roleCode: 'REGULAR_USER', lastLoginAt: null, createdAt: '2026-04-02T10:00:00+07:00' },
    { id: 110, userGroupId: 1, username: 'hong.ct', email: 'hong.ct@71portal.vn', fullName: 'Cao Thị Hồng', jobTitle: 'Kỹ sư Giám sát Chất lượng', phoneNumber: null, avatarUrl: null, status: 'INACTIVE', roleCode: 'REGULAR_USER', lastLoginAt: '2026-06-30T17:00:00+07:00', createdAt: '2026-03-18T09:00:00+07:00' },
    { id: 201, userGroupId: 2, username: 'long.nh', email: 'long.nh@71portal.vn', fullName: 'Nguyễn Hải Long', jobTitle: 'Lập trình viên Backend', phoneNumber: '0972.123.456', avatarUrl: null, status: 'ACTIVE', roleCode: 'GROUP_ADMIN', lastLoginAt: '2026-11-05T13:20:00+07:00', createdAt: '2026-03-15T09:10:00+07:00' },
    { id: 202, userGroupId: 2, username: 'thu.pt', email: 'thu.pt@71portal.vn', fullName: 'Phan Thị Thu', jobTitle: 'Kỹ sư Kiểm thử', phoneNumber: null, avatarUrl: null, status: 'ACTIVE', roleCode: 'REGULAR_USER', lastLoginAt: '2026-10-28T08:00:00+07:00', createdAt: '2026-05-10T08:00:00+07:00' },
    { id: 301, userGroupId: 3, username: 'huong.pt', email: 'huong.pt@71portal.vn', fullName: 'Phạm Thu Hương', jobTitle: 'Trưởng ca Tổng đài', phoneNumber: '0915 000 111', avatarUrl: null, status: 'ACTIVE', roleCode: 'GROUP_ADMIN', lastLoginAt: '2026-11-05T07:00:00+07:00', createdAt: '2026-04-12T08:00:00+07:00' },
    { id: 302, userGroupId: 3, username: 'dung.nv', email: 'dung.nv@71portal.vn', fullName: 'Nguyễn Văn Dũng', jobTitle: 'Điện thoại viên', phoneNumber: null, avatarUrl: null, status: 'ACTIVE', roleCode: 'USER_RECORDING', lastLoginAt: '2026-11-03T07:00:00+07:00', createdAt: '2026-04-12T08:05:00+07:00' },
    { id: 401, userGroupId: 4, username: 'nam.nh', email: 'nam.nh@71portal.vn', fullName: 'Nguyễn Hải Nam', jobTitle: 'Kiểm toán viên chính', phoneNumber: null, avatarUrl: null, status: 'ACTIVE', roleCode: 'GROUP_ADMIN', lastLoginAt: null, createdAt: '2026-05-01T08:00:00+07:00' },
    { id: 601, userGroupId: 6, username: 'tuan.lv', email: 'tuan.lv@71portal.vn', fullName: 'Lê Văn Tuấn', jobTitle: 'Kỹ sư Trạm', phoneNumber: null, avatarUrl: null, status: 'INACTIVE', roleCode: 'GROUP_ADMIN', lastLoginAt: '2026-08-01T09:00:00+07:00', createdAt: '2026-07-20T14:10:00+07:00' }
];

// DTO phần tử GET /admin/users: đúng 14 trường (M03 mục 3.3).
function toUserListItem(row) {
    const g = MOCK_US_GROUPS.find(x => x.id === row.userGroupId);
    return {
        id: row.id,
        username: row.username,
        email: row.email,
        fullName: row.fullName,
        jobTitle: row.jobTitle,
        phoneNumber: row.phoneNumber,
        avatarUrl: row.avatarUrl,
        status: row.status,
        roleCode: row.roleCode,
        roleName: MOCK_US_ROLE_NAMES[row.roleCode],
        isRepresentative: g.representativeUserId === row.id,
        userGroup: { id: g.id, code: g.code, name: g.name },
        lastLoginAt: row.lastLoginAt,
        createdAt: row.createdAt
    };
}

// Kiểm tra query chung của danh sách (02 mục 2.2): tham số lạ/lặp lại, page, limit, search.
function usCheckListQuery(q, allowed, errors, defaultLimit) {
    Object.keys(q).forEach(k => {
        if (!allowed.includes(k)) errors[k] = ['Tham số không được nhận'];
        else if (Array.isArray(q[k])) errors[k] = ['Tham số bị lặp lại'];
    });
    const page = q.page === undefined ? 1 : (/^[1-9][0-9]{0,8}$/.test(String(q.page)) ? Number(q.page) : NaN);
    const limit = q.limit === undefined ? defaultLimit : (/^[1-9][0-9]{0,2}$/.test(String(q.limit)) ? Number(q.limit) : NaN);
    if (!errors.page && !(page >= 1)) errors.page = ['page phải là số nguyên ≥ 1'];
    if (!errors.limit && !(limit >= 1 && limit <= 100)) errors.limit = ['limit phải trong khoảng 1–100'];
    const search = q.search === undefined ? '' : String(q.search).trim();
    if (!errors.search && search.length > 100) errors.search = ['Tối đa 100 ký tự'];
    return { page, limit, search };
}
function usPage(rows, page, limit) {
    const total = rows.length;
    const totalPages = Math.ceil(total / limit);
    return { slice: rows.slice((page - 1) * limit, page * limit), // page vượt totalPages → []
        pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 } };
}

// Giả lập GET /api/v1/admin/users. Thứ tự: guard (401) → quyền user:view → query (400) → kiểm tra tài khoản → đọc.
// Không bị bảo trì chặn; không ghi audit; không có 404 (userGroupId lạ → 200 rỗng).
function mockGetUsers(token, query) {
    return new Promise(resolve => setTimeout(resolve, 300)).then(() => {
        if (usMockUsersError) { usMockUsersError = false; return Promise.reject(new Error('Network Error')); }
        if (!token) return usUnauthorized();
        const q = query || {};
        const errors = {};
        const { page, limit, search } = usCheckListQuery(q, ['page', 'limit', 'search', 'status', 'roleCode', 'userGroupId'], errors, 20);
        if (!errors.status && q.status !== undefined && !['ACTIVE', 'LOCKED', 'INACTIVE'].includes(q.status)) errors.status = ['Trạng thái không hợp lệ'];
        if (!errors.roleCode && q.roleCode !== undefined && !['GROUP_ADMIN', 'USER_RECORDING', 'REGULAR_USER'].includes(q.roleCode)) errors.roleCode = ['Vai trò không hợp lệ'];
        if (!errors.userGroupId && q.userGroupId !== undefined
            && !(/^[1-9][0-9]{0,9}$/.test(String(q.userGroupId)) && Number(q.userGroupId) <= 4294967295)) errors.userGroupId = ['Mã nhóm phải là số nguyên dương'];
        if (Object.keys(errors).length) return usFail(400, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ', errors);

        const kw = usFold(search);
        const groupOf = r => MOCK_US_GROUPS.find(g => g.id === r.userGroupId);
        const rows = MOCK_US_USERS
            .filter(r => q.userGroupId === undefined || r.userGroupId === Number(q.userGroupId))
            .filter(r => (q.status === undefined ? r.status !== 'INACTIVE' : r.status === q.status))
            .filter(r => q.roleCode === undefined || r.roleCode === q.roleCode)
            .filter(r => !kw || [r.fullName, r.username, r.email, r.jobTitle, r.phoneNumber].some(v => usFold(v).includes(kw)))
            // Mã nhóm → người đại diện → Quản trị viên nhóm → còn lại; mỗi khối full_name, id.
            .sort((a, b) => groupOf(a).code.localeCompare(groupOf(b).code)
                || ((groupOf(b).representativeUserId === b.id) - (groupOf(a).representativeUserId === a.id))
                || ((b.roleCode === 'GROUP_ADMIN') - (a.roleCode === 'GROUP_ADMIN'))
                || a.fullName.localeCompare(b.fullName, 'vi')
                || a.id - b.id);
        const { slice, pagination } = usPage(rows, page, limit);
        return { success: true, statusCode: 200, message: 'Lấy danh sách người dùng thành công',
            data: slice.map(toUserListItem), pagination, timestamp: usNow() };
    });
}

// Giả lập GET /api/v1/admin/user-groups (G01) – chỉ phần danh mục cần: search trên code/name, sắp code, id.
// Phần tử đúng cấu trúc G01 nhưng mock chỉ điền các trường màn hình này đọc (name, code, status, userCount, representative).
function mockGetGroupOptions(token, query) {
    return new Promise(resolve => setTimeout(resolve, 250)).then(() => {
        if (usMockGroupsError) { usMockGroupsError = false; return Promise.reject(new Error('Network Error')); }
        if (!token) return usUnauthorized();
        const errors = {};
        const { page, limit, search } = usCheckListQuery(query || {}, ['page', 'limit', 'search'], errors, 20);
        if (Object.keys(errors).length) return usFail(400, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ', errors);
        const kw = usFold(search);
        const rows = MOCK_US_GROUPS
            .filter(g => !kw || usFold(g.code).includes(kw) || usFold(g.name).includes(kw))
            .sort((a, b) => a.code.localeCompare(b.code) || a.id - b.id);
        const { slice, pagination } = usPage(rows, page, limit);
        return { success: true, statusCode: 200, message: 'Lấy danh sách nhóm người dùng thành công',
            data: slice.map(g => {
                const rep = MOCK_US_USERS.find(u => u.id === g.representativeUserId);
                return {
                    id: g.id, code: g.code, name: g.name, status: g.status,
                    userCount: MOCK_US_USERS.filter(u => u.userGroupId === g.id && u.status !== 'INACTIVE').length,
                    representative: rep ? { id: rep.id, fullName: rep.fullName, email: rep.email, avatarUrl: rep.avatarUrl } : null
                };
            }), pagination, timestamp: usNow() };
    });
}

// ==========================================================================
// 2. Trạng thái màn hình (Vue: useUserStore.query)
// ==========================================================================

const usQuery = { page: 1, search: '', status: '', roleCode: '', userGroupId: '' }; // '' = không lọc
let usSeq = 0;           // chỉ hiển thị response của request gửi sau cùng (bảng)
let usGroupSeq = 0;      // như trên, cho danh mục nhóm
let usRows = [];         // data của trang đang hiển thị (hộp sửa đọc từ đây cho tới khi rà N02/N04)
let usGroupOptions = []; // data của danh mục nhóm (tiêu đề bảng)
const US_ROLE_LABELS = { GROUP_ADMIN: '★ Quản trị viên nhóm', USER_RECORDING: 'Thành viên nghe ghi âm', REGULAR_USER: 'Thành viên' };
const US_ROLE_CLASS = { GROUP_ADMIN: 'admin', USER_RECORDING: 'recording', REGULAR_USER: 'member' };
const US_STATUS_LABELS = { ACTIVE: 'Hoạt động', LOCKED: 'Đã khóa', INACTIVE: 'Ngừng hoạt động' };

function usEsc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function usInitials(name) {
    const parts = String(name || '').trim().split(/\s+/);
    return ((parts.length > 1 ? parts[0][0] : '') + (parts[parts.length - 1][0] || '')).toUpperCase();
}
// Chuỗi ISO +07:00 → dd/MM/yyyy (và HH:mm) theo giờ Việt Nam; frontend tự định dạng (R16-07).
function usFormatDate(iso, withTime) {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso || '');
    if (!m) return '';
    return m[3] + '/' + m[2] + '/' + m[1] + (withTime ? ' ' + m[4] + ':' + m[5] : '');
}
function usHasPermission(code) {
    if ((code === 'user:edit' && US_QS.get('noEdit') === '1') || (code === 'user:delete' && US_QS.get('noDelete') === '1')) return false;
    const account = window.adminSession ? window.adminSession.getAccount() : null;
    return !!(account && (account.permissions || []).includes(code));
}
// Phần tử data-permission (nút "Thêm mới người dùng") ẩn khi store thiếu mã; gọi lại sau khi có tài khoản.
function applyUsersPermissions() {
    document.querySelectorAll('[data-permission]').forEach(el => { el.hidden = !usHasPermission(el.dataset.permission); });
}
function usItemsPerPage() {
    const prefs = window.adminSession && window.adminSession.getPreferences ? window.adminSession.getPreferences() : null;
    const n = prefs && prefs.itemsPerPage;
    return [10, 20, 50].includes(n) ? n : 10;
}
function usBuildQuery() {
    const q = { page: String(usQuery.page), limit: String(usItemsPerPage()) }; // chỉ gửi tham số có giá trị
    ['search', 'status', 'roleCode', 'userGroupId'].forEach(k => { if (usQuery[k]) q[k] = usQuery[k]; });
    return q;
}

// ==========================================================================
// 3. Khởi tạo
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    setupUsersEvents();
    applyUsersPermissions();
    loadGroupSidebar();
    loadUsers();
});

function setupUsersEvents() {
    // Tìm kiếm người dùng: 300 ms sau lần gõ cuối hoặc Enter; đổi điều kiện thì về trang 1.
    const bindSearch = (input, apply) => {
        if (!input) return;
        let timer = null;
        input.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(apply, 300); });
        input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); clearTimeout(timer); apply(); } });
    };
    const userSearch = document.getElementById('searchUserInput');
    bindSearch(userSearch, () => {
        const value = userSearch.value.trim();
        if (value === usQuery.search) return;
        usQuery.search = value;
        usQuery.page = 1;
        loadUsers();
    });
    let groupSearchValue = '';
    const groupSearch = document.getElementById('groupSearchInput');
    bindSearch(groupSearch, () => {
        const value = groupSearch.value.trim();
        if (value === groupSearchValue) return;
        groupSearchValue = value;
        loadGroupSidebar(value);
    });

    document.getElementById('filterRoleSelect')?.addEventListener('change', e => { usQuery.roleCode = e.target.value; usQuery.page = 1; loadUsers(); });
    document.getElementById('filterStatusSelect')?.addEventListener('change', e => { usQuery.status = e.target.value; usQuery.page = 1; loadUsers(); });
    document.getElementById('btnRetryUsers')?.addEventListener('click', () => loadUsers());
    document.getElementById('btnRetryGroups')?.addEventListener('click', () => loadGroupSidebar(groupSearchValue));

    // Chọn nhóm: gửi userGroupId ('' = Tất cả nhóm), về trang 1.
    document.getElementById('groupList')?.addEventListener('click', e => {
        const item = e.target.closest('.group-item');
        if (!item) return;
        usQuery.userGroupId = item.dataset.group || '';
        usQuery.page = 1;
        markActiveGroup();
        renderUsersHeader();
        loadUsers();
    });

    document.getElementById('usersPageList')?.addEventListener('click', e => {
        const link = e.target.closest('a[data-page]');
        e.preventDefault();
        if (!link) return;
        usQuery.page = Number(link.dataset.page);
        loadUsers();
    });
}

// ==========================================================================
// 4. Danh mục nhóm bên trái (G01)
// ==========================================================================

function setGroupListState(state, message) {
    const box = document.getElementById('groupListState');
    const msg = document.getElementById('groupListMessage');
    const retry = document.getElementById('btnRetryGroups');
    if (box) { box.hidden = state === 'ready'; box.classList.toggle('is-error', state === 'error'); }
    if (msg && message) msg.textContent = message;
    if (retry) retry.hidden = state !== 'error';
}

function loadGroupSidebar(search) {
    const seq = ++usGroupSeq;
    setGroupListState('loading', 'Đang tải danh mục nhóm...');
    const q = { limit: '100' };
    if (search) q.search = search;
    return usCallApi(token => mockGetGroupOptions(token, q))
        .then(res => {
            if (seq !== usGroupSeq) return;
            usGroupOptions = res.data;
            renderGroupSidebar(res.data, res.pagination, search);
        })
        .catch(err => {
            if (seq !== usGroupSeq) return;
            if (err && err.statusCode === 401) return; // request() đã chuyển về login
            renderGroupSidebar([], null, search); // chỉ còn "Tất cả nhóm"; bảng người dùng vẫn dùng được
            setGroupListState('error', (err && err.statusCode && err.message) || 'Không tải được danh mục nhóm.');
        });
}

function renderGroupSidebar(groups, pagination, search) {
    const list = document.getElementById('groupList');
    if (!list) return;
    list.querySelectorAll('.group-item:not([data-group=""])').forEach(li => li.remove());
    groups.forEach(g => {
        const li = document.createElement('li');
        li.className = 'group-item' + (g.status === 'INACTIVE' ? ' is-inactive' : '');
        li.dataset.group = String(g.id);
        li.innerHTML = `
            <div class="group-item-header">
                <span class="group-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg></span>
                <div class="group-info">
                    <span class="group-name">${usEsc(g.name)}</span>
                    <div class="group-meta">
                        <span class="badge-code">${usEsc(g.code)}</span>
                        ${g.status === 'INACTIVE' ? '<span class="badge-status inactive">Ngừng hoạt động</span>'
                            : `• <span class="group-admin-hint">${g.representative ? 'Đại diện: ' + usEsc(g.representative.fullName) : 'Chưa có người đại diện'}</span>`}
                    </div>
                </div>
                <span class="badge-count" title="Thành viên chưa ngừng hoạt động">${g.userCount}</span>
            </div>`;
        list.appendChild(li);
    });
    const total = document.getElementById('groupTotalBadge');
    if (total) { total.hidden = !pagination; if (pagination) total.textContent = pagination.total + ' nhóm'; }
    const note = document.getElementById('groupListNote');
    if (note) {
        const more = pagination && pagination.total > groups.length;
        note.hidden = !(more || (pagination && !groups.length));
        note.textContent = more ? `Hiển thị ${groups.length} nhóm đầu, gõ để tìm nhóm khác`
            : (search ? 'Không có nhóm phù hợp' : 'Chưa có nhóm người dùng');
    }
    setGroupListState('ready');
    markActiveGroup();
    renderUsersHeader();
}

function markActiveGroup() {
    document.querySelectorAll('#groupList .group-item').forEach(li => {
        li.classList.toggle('active', (li.dataset.group || '') === usQuery.userGroupId);
    });
}

function renderUsersHeader() {
    const title = document.getElementById('currentGroupTitle');
    const subtitle = document.getElementById('currentGroupSubtitle');
    const g = usGroupOptions.find(x => String(x.id) === usQuery.userGroupId);
    if (title) title.textContent = usQuery.userGroupId ? (g ? g.name : 'Nhóm #' + usQuery.userGroupId) : 'Tất cả nhóm người dùng';
    if (subtitle) subtitle.textContent = usQuery.userGroupId
        ? (g ? 'Mã nhóm: ' + g.code + (g.status === 'INACTIVE' ? ' • Nhóm đã ngừng hoạt động' : '') : '')
        : 'Tài khoản người dùng thuộc mọi nhóm trong hệ thống';
}

// ==========================================================================
// 5. Bảng người dùng (N01)
// ==========================================================================

// state: 'loading' | 'error' | 'empty' | 'ready'
function setUsersState(state, message, hint) {
    const box = document.getElementById('usersState');
    const msg = document.getElementById('usersStateMessage');
    const hintEl = document.getElementById('usersStateHint');
    const retry = document.getElementById('btnRetryUsers');
    const wrap = document.getElementById('usersTableWrap');
    const pager = document.getElementById('usersPagination');
    const count = document.getElementById('currentGroupCount');
    if (box) { box.hidden = state === 'ready'; box.classList.toggle('is-error', state === 'error'); }
    if (msg && message) msg.textContent = message;
    if (hintEl) hintEl.textContent = state === 'empty' ? (hint || '') : '';
    if (retry) retry.hidden = state !== 'error';
    if (wrap) wrap.hidden = state !== 'ready';
    if (pager && state !== 'ready') pager.hidden = true;
    if (count && (state === 'loading' || state === 'error')) count.hidden = true;
}

function loadUsers() {
    const seq = ++usSeq;
    setUsersState('loading', 'Đang tải danh sách người dùng...');
    return usCallApi(token => mockGetUsers(token, usBuildQuery()))
        .then(res => {
            if (seq !== usSeq) return; // đã có request mới hơn
            applyUsersPermissions();
            const p = res.pagination;
            const count = document.getElementById('currentGroupCount');
            if (count) { count.textContent = String(p.total); count.hidden = false; }
            if (!res.data.length && p.page > 1 && p.totalPages > 0) {
                usQuery.page = p.totalPages; // danh sách ngắn lại: lùi về trang cuối
                return loadUsers();
            }
            usRows = res.data;
            if (!res.data.length) {
                const filtered = usQuery.search || usQuery.status || usQuery.roleCode;
                if (filtered) setUsersState('empty', 'Không có người dùng phù hợp với bộ lọc', 'Thử từ khóa khác hoặc bỏ bớt bộ lọc');
                else setUsersState('empty', usQuery.userGroupId ? 'Nhóm chưa có người dùng đang sử dụng' : 'Chưa có người dùng nào',
                    'Tài khoản ngừng hoạt động xem bằng bộ lọc "Ngừng hoạt động"');
                return;
            }
            renderUsersTable(res.data);
            setUsersState('ready');
            renderUsersPagination(p, res.data.length);
        })
        .catch(err => {
            if (seq !== usSeq) return;
            if (err && err.statusCode === 401) return; // request() đã chuyển về login
            setUsersState('error', (err && err.statusCode && err.message) || 'Không tải được danh sách người dùng. Vui lòng thử lại.');
        });
}

const US_ICONS = {
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
    remove: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>'
};

function renderUsersTable(users) {
    const tbody = document.getElementById('usersTableBody');
    if (!tbody) return;
    const canEdit = usHasPermission('user:edit');
    const canDelete = usHasPermission('user:delete');
    tbody.innerHTML = users.map(u => {
        const writable = u.status !== 'INACTIVE'; // INACTIVE là trạng thái cuối: không có nút ghi
        const actions = writable ? `
                ${canEdit ? `<button class="action-btn edit-btn" onclick="editUser(${u.id})" title="Sửa thông tin">${US_ICONS.edit}</button>` : ''}
                ${canDelete ? `<button class="action-btn delete-btn" onclick="deleteUser(${u.id})" title="Ngừng hoạt động">${US_ICONS.remove}</button>` : ''}` : '';
        return `
        <tr data-user-id="${u.id}">
            <td>
                <div class="user-card-small">
                    <div class="avatar-wrapper">
                        ${u.avatarUrl ? `<img src="${usEsc(u.avatarUrl)}" class="avatar-sm" alt="">`
                            : `<span class="avatar-sm avatar-initials" aria-hidden="true">${usEsc(usInitials(u.fullName))}</span>`}
                        <span class="mobile-status-dot ${u.status.toLowerCase()}"></span>
                    </div>
                    <div>
                        <span class="fw-600">${usEsc(u.fullName)}</span>
                        ${u.isRepresentative ? '<span class="rep-mark" title="Người đại diện nhóm">★ Đại diện</span>' : ''}
                        <span class="text-muted d-block user-sub">${usEsc(u.email)} • @${usEsc(u.username)}</span>
                    </div>
                </div>
            </td>
            <td>
                <span class="badge-code">${usEsc(u.userGroup.code)}</span>
                <span class="text-muted d-block user-sub">${usEsc(u.userGroup.name)}</span>
            </td>
            <td>
                <span class="badge-role ${US_ROLE_CLASS[u.roleCode] || 'member'}">${usEsc(US_ROLE_LABELS[u.roleCode] || u.roleName)}</span>
                ${u.jobTitle ? `<span class="text-muted d-block user-sub">${usEsc(u.jobTitle)}</span>` : ''}
            </td>
            <td>
                <span>${usFormatDate(u.createdAt)}</span>
                <span class="text-muted d-block user-sub">${u.lastLoginAt ? 'Đăng nhập: ' + usFormatDate(u.lastLoginAt, true) : 'Chưa đăng nhập'}</span>
            </td>
            <td><span class="badge-status ${u.status.toLowerCase()}">${US_STATUS_LABELS[u.status] || usEsc(u.status)}</span></td>
            <td class="text-right">${actions}</td>
        </tr>`;
    }).join('');
}

function renderUsersPagination(p, count) {
    const box = document.getElementById('usersPagination');
    const info = document.getElementById('usersPageInfo');
    const list = document.getElementById('usersPageList');
    if (!box || !info || !list) return;
    const from = (p.page - 1) * p.limit + 1;
    info.textContent = 'Hiển thị ' + from + '–' + (from + count - 1) + ' / ' + p.total + ' người dùng';
    list.replaceChildren();
    const addItem = (label, page, { disabled = false, active = false, aria } = {}) => {
        const li = document.createElement('li');
        li.className = 'page-item' + (disabled ? ' disabled' : '') + (active ? ' active' : '');
        const a = document.createElement('a');
        a.href = '#';
        a.className = 'page-link';
        a.textContent = label;
        if (aria) a.setAttribute('aria-label', aria);
        if (active) a.setAttribute('aria-current', 'page');
        if (!disabled && !active) a.dataset.page = String(page);
        li.appendChild(a);
        list.appendChild(li);
    };
    addItem('«', p.page - 1, { disabled: !p.hasPrev, aria: 'Trang trước' });
    const first = Math.max(1, Math.min(p.page - 2, p.totalPages - 4));
    const last = Math.min(p.totalPages, first + 4);
    for (let i = first; i <= last; i++) addItem(String(i), i, { active: i === p.page });
    addItem('»', p.page + 1, { disabled: !p.hasNext, aria: 'Trang sau' });
    box.hidden = false;
}

// ==========================================================================
// 6. Hộp Thêm/Sửa/Ngừng hoạt động – mock CŨ, chưa rà (N03 POST /users, N04 PUT /users/:id, N09 DELETE /users/:id)
// ==========================================================================

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// Hộp sửa điền từ dòng đã tải (usRows); N04 sẽ đổi sang tải GET /admin/users/:id mỗi lần mở.
function editUser(userId) {
    const user = usRows.find(u => u.id === userId);
    const modal = document.getElementById('userModal');
    if (!user || !modal) return;

    const modalTitle = modal.querySelector('.modal-header h2');
    if (modalTitle) modalTitle.innerText = 'Chỉnh sửa Người dùng';

    const set = (id, value) => { const el = document.getElementById(id); if (el) el.value = value; };
    set('userNameInput', user.fullName);
    set('userEmailInput', user.email);
    set('userUsernameInput', user.username);
    set('userPhoneInput', user.phoneNumber || '');
    set('userJobTitle', user.jobTitle || '');
    set('userRoleSelect', user.roleCode === 'GROUP_ADMIN' ? 'admin' : 'member');
    set('userStatusSelect', user.status);
    const selectGroup = document.getElementById('userGroupSelect');
    if (selectGroup) {
        selectGroup.value = String(user.userGroup.id);
        selectGroup.disabled = true; // BR-UG-01: nhóm bất biến, không chuyển nhóm
    }

    const scopeBanner = document.getElementById('creatorScopeBanner');
    const scopeText = document.getElementById('creatorScopeText');
    const lockNotice = document.getElementById('userGroupLockNotice');
    const creationNotice = document.getElementById('userGroupCreationNotice');
    if (scopeBanner) {
        scopeBanner.style.display = 'flex';
        scopeBanner.className = 'creator-scope-banner system-admin';
    }
    if (scopeText) {
        scopeText.innerHTML = `Chế độ chỉnh sửa thông tin người dùng: Thuộc tính nhóm người dùng là <strong>bất biến</strong> (không thể thay đổi hoặc chuyển nhóm).`;
    }
    if (lockNotice) {
        lockNotice.style.display = 'flex';
        lockNotice.innerHTML = `
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
            <span><strong>Không thể chuyển nhóm:</strong> Người dùng thuộc cố định vào nhóm này ngay từ lúc tạo tài khoản theo quy định kiến trúc hệ thống.</span>
        `;
    }
    if (creationNotice) creationNotice.style.display = 'none';

    openModal('userModal');
}

function openAddUserModal() {
    const modal = document.getElementById('userModal');
    if (!modal) return;

    const modalTitle = modal.querySelector('.modal-header h2');
    if (modalTitle) modalTitle.innerText = 'Thêm mới Người dùng';

    const form = document.getElementById('userForm');
    if (form) form.reset();

    const selectGroup = document.getElementById('userGroupSelect');
    const lockNotice = document.getElementById('userGroupLockNotice');
    const creationNotice = document.getElementById('userGroupCreationNotice');
    const scopeBanner = document.getElementById('creatorScopeBanner');
    const scopeText = document.getElementById('creatorScopeText');

    if (scopeBanner) {
        scopeBanner.style.display = 'flex';
        scopeBanner.className = 'creator-scope-banner system-admin';
    }
    if (scopeText) {
        scopeText.innerHTML = `Đang thao tác với tư cách <strong>Quản trị viên hệ thống</strong>: Có quyền chỉ định tài khoản vào bất kỳ nhóm người dùng nào trong toàn hệ thống.`;
    }
    if (selectGroup) {
        selectGroup.disabled = false;
        selectGroup.value = usQuery.userGroupId || ''; // giữ nhóm đang chọn ở danh mục bên trái
    }
    if (lockNotice) lockNotice.style.display = 'none';
    if (creationNotice) {
        creationNotice.style.display = 'block';
        creationNotice.innerHTML = `<span>ℹ️ Người dùng luôn luôn thuộc cố định vào một nhóm người dùng ngay từ lúc khởi tạo; hệ thống không có khái niệm chuyển người dùng giữa các nhóm.</span>`;
    }

    openModal('userModal');
}

function saveUser() {
    const form = document.getElementById('userForm');
    if (form && !form.checkValidity()) {
        form.reportValidity();
        return;
    }

    const btn = document.querySelector('#userModal .btn-primary');
    const originalText = btn.innerText;
    btn.innerText = 'Đang lưu...';
    btn.disabled = true;

    setTimeout(() => {
        btn.innerText = originalText;
        btn.disabled = false;
        closeModal('userModal');
        loadUsers();
    }, 600);
}

let userIdToDelete = null;

function deleteUser(userId) {
    const user = usRows.find(u => u.id === userId);
    if (!user) return;
    userIdToDelete = userId;
    const msg = document.getElementById('deleteUserMessage');
    if (msg) msg.textContent = `Ngừng hoạt động tài khoản "${user.fullName}" (@${user.username})? Tài khoản không đăng nhập được nữa và không kích hoạt lại được.`;
    openModal('deleteModal');
}

function confirmDeleteUser() {
    const btn = document.querySelector('#deleteModal .btn-danger');
    const originalText = btn.innerText;
    btn.innerText = 'Đang xử lý...';
    btn.disabled = true;

    setTimeout(() => {
        const row = MOCK_US_USERS.find(u => u.id === userIdToDelete);
        if (row) row.status = 'INACTIVE';
        userIdToDelete = null;
        btn.innerText = originalText;
        btn.disabled = false;
        closeModal('deleteModal');
        loadUsers(); // tải lại danh sách, không xóa dòng tại chỗ (A13)
        loadGroupSidebar(document.getElementById('groupSearchInput')?.value.trim() || '');
    }, 500);
}

// Global modal backdrop close & escape key listener
window.addEventListener('click', (e) => {
    if (e.target.classList && e.target.classList.contains('modal')) {
        closeModal(e.target.id);
    }
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.show').forEach(m => closeModal(m.id));
    }
});
