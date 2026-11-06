// templates/admin/users.js – EVN CDR AS, Quản lý người dùng (admin.users → UserListView.vue)
//
// Bảng người dùng: GET /api/v1/admin/users (N01, docs/modules/03_auth_user.md mục 3.3, 5.1).
// Danh mục nhóm bên trái: GET /api/v1/admin/user-groups?limit=100 (G01, docs/modules/02_user_group.md mục 3.1).
// Vue: store useUserStore (users, pagination, query { page, search, status, roleCode, userGroupId }), action fetchUsers.
// Kiểm tay mock: ?usersError=1 (lỗi mạng một lần ở bảng), ?groupsError=1 (lỗi mạng một lần ở danh mục nhóm),
// ?noEdit=1 / ?noDelete=1 (store thiếu user:edit / user:delete).
// Hộp sửa tải GET /api/v1/admin/users/:id mỗi lần mở (N02, M03 mục 3.3.1); kiểm tay: ?editLoadError=1 (lỗi mạng một lần),
// ?editMissing=<id> (dòng đó trả 404), ?editInactive=<id> (dòng đó vừa bị ngừng hoạt động).
// Hộp Thêm gọi POST /api/v1/admin/users (N03, M03 mục 3.4); kiểm tay: ?createError=1 (lỗi mạng một lần),
// ?groupInactive=<id> (nhóm đó vừa ngừng hoạt động → 409 GROUP_INACTIVE), ?noRoleAdmin=1 / ?noRoleRecording=1
// (store thiếu group:manage_admin / group:toggle_recording); tran.b, LE.C@71portal.vn → 409 ACCOUNT_DUPLICATE,
// hong.ct (tài khoản INACTIVE) dùng lại được; nhóm UMO-IT-02 chưa cấp Tầng 1 (không chọn được USER_RECORDING).
// Nút "Lưu thay đổi" của hộp sửa gọi PUT /api/v1/admin/users/:id (N04, M03 mục 3.5); kiểm tay: ?updateError=1 (lỗi mạng
// một lần), ?updateInactive=<id> (dòng đó vừa ngừng hoạt động → 409 ACCOUNT_INACTIVE), ?updateMissing=<id> (→ 404).
// Ngừng hoạt động vẫn là mock cũ, rà ở N09 (DELETE).

const US_QS = new URLSearchParams(window.location.search);
let usMockUsersError = US_QS.get('usersError') === '1';
let usMockGroupsError = US_QS.get('groupsError') === '1';
let usMockEditLoadError = US_QS.get('editLoadError') === '1';
let usMockCreateError = US_QS.get('createError') === '1';
let usMockUpdateError = US_QS.get('updateError') === '1';

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

// Bảng user_groups giả lập (id, code, name, status, representative_user_id, allow_recording_access).
const MOCK_US_GROUPS = [
    { id: 1, code: 'UMO-IT-01', name: 'Nhóm Quản trị Vận hành HT', status: 'ACTIVE', representativeUserId: 10, allowRecordingAccess: true },
    { id: 2, code: 'UMO-IT-02', name: 'Nhóm Kỹ thuật Phần mềm', status: 'ACTIVE', representativeUserId: 201, allowRecordingAccess: false },
    { id: 3, code: 'UMO-KD-01', name: 'Nhóm Call Center CSKH', status: 'ACTIVE', representativeUserId: null, allowRecordingAccess: true },
    { id: 4, code: 'UMO-AUDIT', name: 'Tổ Giám sát Kiểm toán Độc lập', status: 'ACTIVE', representativeUserId: 401, allowRecordingAccess: false },
    { id: 6, code: 'UMO-TBA-500', name: 'Nhóm Thử nghiệm Trạm Biến áp 500kV', status: 'INACTIVE', representativeUserId: null, allowRecordingAccess: false }
];
const MOCK_US_ROLE_NAMES = { GROUP_ADMIN: 'Quản trị viên nhóm', USER_RECORDING: 'Thành viên nghe ghi âm', REGULAR_USER: 'Thành viên' };

// Dòng "CSDL" của mock (users + user_roles), KHÔNG phải cấu trúc response: response là 14 trường của toUserListItem.
const MOCK_US_USERS = [
    { id: 10, userGroupId: 1, username: 'tran.b', email: 'tran.b@71portal.vn', fullName: 'Trần Thị B', jobTitle: 'Trưởng nhóm Kỹ thuật Vận hành', phoneNumber: '0912.345.678', avatarUrl: null, status: 'ACTIVE', roleCode: 'GROUP_ADMIN', lastLoginAt: '2026-11-05T08:12:40+07:00', createdAt: '2026-03-15T08:30:00+07:00' },
    { id: 15, userGroupId: 1, username: 'le.c', email: 'le.c@71portal.vn', fullName: 'Lê Văn C', jobTitle: 'Kỹ sư Quản trị Hệ thống', phoneNumber: null, avatarUrl: null, status: 'ACTIVE', roleCode: 'GROUP_ADMIN', lastLoginAt: '2026-11-04T16:40:00+07:00', createdAt: '2026-03-16T09:00:00+07:00' },
    { id: 101, userGroupId: 1, username: 'pham.d', email: 'pham.d@71portal.vn', fullName: 'Phạm Văn D', jobTitle: 'Kỹ sư Vận hành Máy chủ', phoneNumber: '0977 112 233', avatarUrl: null, status: 'ACTIVE', roleCode: 'USER_RECORDING', lastLoginAt: '2026-11-01T07:55:00+07:00', createdAt: '2026-03-20T10:00:00+07:00' },
    { id: 102, userGroupId: 1, username: 'tri.hm', email: 'tri.hm@71portal.vn', fullName: 'Hoàng Minh Trí', jobTitle: 'Chuyên viên Giám sát Mạng', phoneNumber: '0904556677', avatarUrl: null, status: 'ACTIVE', roleCode: 'REGULAR_USER', lastLoginAt: null, createdAt: '2026-04-01T08:00:00+07:00', mustChangePassword: true, lockedUntil: '2099-01-01T08:15:00+07:00' },
    { id: 104, userGroupId: 1, username: 'anh.nt', email: 'anh.nt@71portal.vn', fullName: 'Nguyễn Tuấn Anh', jobTitle: null, phoneNumber: null, avatarUrl: null, status: 'LOCKED', roleCode: 'REGULAR_USER', lastLoginAt: null, createdAt: '2026-04-02T10:00:00+07:00', mustChangePassword: true, updatedAt: '2026-10-20T14:00:00+07:00' },
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

// DTO GET /admin/users/:id: 14 trường của phần tử + mustChangePassword, lockedUntil, updatedAt = 17 trường (M03 mục 3.3.1).
// Cột mock không ghi thì lấy mặc định: must_change_password = 0, locked_until = NULL, updated_at = created_at.
function toUserDetail(row) {
    const lockedUntil = row.lockedUntil && Date.parse(row.lockedUntil) > Date.now() ? row.lockedUntil : null; // locked_until > NOW()
    return Object.assign(toUserListItem(row), {
        mustChangePassword: !!row.mustChangePassword,
        lockedUntil,
        updatedAt: row.updatedAt || row.createdAt
    });
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

// Giả lập GET /api/v1/admin/users/:id. Thứ tự: guard (401) → quyền user:view → :id/query (400) → kiểm tra tài khoản
// → tìm người dùng (404). Không bị bảo trì chặn; không ghi audit; tài khoản INACTIVE vẫn 200.
function mockGetUserDetail(token, id, query) {
    return new Promise(resolve => setTimeout(resolve, 300)).then(() => {
        if (usMockEditLoadError) { usMockEditLoadError = false; return Promise.reject(new Error('Network Error')); }
        if (!token) return usUnauthorized();
        const errors = {};
        if (!(/^[1-9][0-9]{0,9}$/.test(String(id)) && Number(id) <= 4294967295)) errors.id = ['Mã người dùng phải là số nguyên dương'];
        Object.keys(query || {}).forEach(k => { errors[k] = ['Tham số không được nhận']; });
        if (Object.keys(errors).length) return usFail(400, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ', errors);
        const row = MOCK_US_USERS.find(u => u.id === Number(id));
        if (!row || US_QS.get('editMissing') === String(id)) return usFail(404, 'NOT_FOUND', 'Không tìm thấy tài nguyên');
        if (US_QS.get('editInactive') === String(id)) row.status = 'INACTIVE'; // giả lập vừa bị ngừng hoạt động ở nơi khác
        return { success: true, statusCode: 200, message: 'Lấy chi tiết người dùng thành công', data: toUserDetail(row), timestamp: usNow() };
    });
}

// Giả lập GET /api/v1/admin/user-groups (G01) – chỉ phần danh mục cần: search trên code/name, sắp code, id.
// Phần tử đúng cấu trúc G01 nhưng mock chỉ điền các trường màn hình này đọc (name, code, status, allowRecordingAccess,
// userCount, representative; ô Nhóm của hộp Thêm dùng status, allowRecordingAccess).
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
                    id: g.id, code: g.code, name: g.name, status: g.status, allowRecordingAccess: g.allowRecordingAccess,
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
let usRows = [];         // data của trang đang hiển thị (tiêu đề hộp sửa, hộp Ngừng hoạt động)
let usEditSeq = 0;       // chỉ hiển thị response của lần mở hộp sửa sau cùng
let usEditId = null;     // id đang mở trong hộp sửa (null = chế độ tạo)
let usEditData = null;   // data của GET /admin/users/:id đang sửa (so trường đã đổi khi lưu)
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
    if ((code === 'group:manage_admin' && US_QS.get('noRoleAdmin') === '1')
        || (code === 'group:toggle_recording' && US_QS.get('noRoleRecording') === '1')) return false;
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
    document.getElementById('btnRetryUserEdit')?.addEventListener('click', () => { if (usEditId) loadUserEdit(usEditId); });

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
// 6. Hộp Thêm (N03 POST /admin/users) / Sửa (tải N02, lưu N04 PUT /admin/users/:id) / Ngừng hoạt động (mock CŨ, N09)
// ==========================================================================

function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    if (modalId === 'userModal' && usFormBusy) return; // đang gửi: nút đóng/Hủy, nền, Esc không đóng
    if (modalId === 'userModal') { usEditId = null; usEditData = null; usEditSeq++; } // bỏ response GET /:id đang chờ
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

// Đổi hộp #userModal giữa chế độ tạo và sửa: sửa thì username, email chỉ đọc; nhóm, vai trò hiện ô chữ chỉ đọc.
function setUserModalMode(mode) {
    const edit = mode === 'edit';
    const byId = id => document.getElementById(id);
    ['userUsernameInput', 'userEmailInput'].forEach(id => { const el = byId(id); if (el) el.readOnly = edit; });
    ['userGroupSelect', 'userRoleSelect'].forEach(id => { const el = byId(id); if (el) { el.hidden = edit; el.disabled = edit; } });
    ['userGroupText', 'userRoleText'].forEach(id => { const el = byId(id); if (el) el.hidden = !edit; });
    const info = byId('userEditInfo');
    if (info && !edit) info.hidden = true;
    document.querySelectorAll('#userModal [data-create-only]').forEach(el => { el.hidden = edit; });
    const hint = byId('userRoleHint');
    if (hint) hint.hidden = edit;
    const save = byId('userSaveBtn');
    if (save) save.textContent = edit ? 'Lưu thay đổi' : 'Tạo người dùng';
    clearUserFormErrors();
}

// state: 'loading' | 'error' | 'ready' – form ẩn khi đang tải/lỗi; nút Lưu chỉ bật khi đã có dữ liệu.
function setUserEditState(state, message) {
    const box = document.getElementById('userEditState');
    const msg = document.getElementById('userEditStateMessage');
    const retry = document.getElementById('btnRetryUserEdit');
    const form = document.getElementById('userForm');
    const save = document.querySelector('#userModal .btn-primary');
    if (box) { box.hidden = state === 'ready'; box.classList.toggle('is-error', state === 'error'); }
    if (msg && message) msg.textContent = message;
    if (retry) retry.hidden = state !== 'error';
    if (form) form.hidden = state !== 'ready';
    if (save) save.disabled = state !== 'ready';
}

// Mở hộp sửa: tiêu đề từ dòng đã bấm, dữ liệu form từ GET /admin/users/:id (mỗi lần mở, không dùng dòng danh sách).
function editUser(userId) {
    const modal = document.getElementById('userModal');
    if (!modal) return;
    const row = usRows.find(u => u.id === userId);
    const modalTitle = modal.querySelector('.modal-header h2');
    if (modalTitle) modalTitle.innerText = 'Chỉnh sửa – ' + (row ? row.fullName : 'người dùng #' + userId);

    const scopeBanner = document.getElementById('creatorScopeBanner');
    const scopeText = document.getElementById('creatorScopeText');
    const lockNotice = document.getElementById('userGroupLockNotice');
    const creationNotice = document.getElementById('userGroupCreationNotice');
    if (scopeBanner) {
        scopeBanner.style.display = 'flex';
        scopeBanner.className = 'creator-scope-banner system-admin';
    }
    if (scopeText) {
        scopeText.innerHTML = 'Chế độ chỉnh sửa: tên đăng nhập, email, nhóm người dùng là <strong>bất biến</strong>; vai trò, khóa/mở khóa và ngừng hoạt động có thao tác riêng.';
    }
    if (lockNotice) lockNotice.style.display = 'flex';
    if (creationNotice) creationNotice.style.display = 'none';

    usEditId = userId;
    setUserModalMode('edit');
    openModal('userModal');
    loadUserEdit(userId);
}

function loadUserEdit(userId) {
    const seq = ++usEditSeq;
    setUserEditState('loading', 'Đang tải thông tin người dùng...');
    return usCallApi(token => mockGetUserDetail(token, userId))
        .then(res => {
            if (seq !== usEditSeq || usEditId !== userId) return; // đã mở dòng khác hoặc đã đóng
            if (res.data.status === 'INACTIVE') { // trạng thái cuối: không sửa được nữa
                closeUserEdit();
                if (window.showToast) window.showToast('Tài khoản "' + res.data.fullName + '" đã ngừng hoạt động, không sửa được.', 'warning');
                loadUsers();
                return;
            }
            usEditData = res.data;
            fillUserEditForm(res.data);
            setUserEditState('ready');
        })
        .catch(err => {
            if (seq !== usEditSeq || usEditId !== userId) return;
            if (err && err.statusCode === 401) return; // request() đã chuyển về login
            if (err && err.statusCode === 404) {
                closeUserEdit();
                if (window.showToast) window.showToast('Người dùng không còn tồn tại. Danh sách đã được tải lại.', 'warning');
                loadUsers();
                return;
            }
            setUserEditState('error', (err && err.statusCode && err.message) || 'Không tải được thông tin người dùng. Vui lòng thử lại.');
        });
}

// Điền form sửa từ data (17 trường). Dải thông tin: trạng thái, đăng nhập cuối, cập nhật, mật khẩu tạm, khóa tạm.
function fillUserEditForm(d) {
    const set = (id, value) => { const el = document.getElementById(id); if (el) el.value = value; };
    set('userNameInput', d.fullName);
    set('userUsernameInput', d.username);
    set('userEmailInput', d.email);
    set('userPhoneInput', d.phoneNumber || '');
    set('userJobTitle', d.jobTitle || '');
    set('userGroupText', d.userGroup.code + ' – ' + d.userGroup.name);
    set('userRoleText', (US_ROLE_LABELS[d.roleCode] || d.roleName).replace(/^★ /, '') + (d.isRepresentative ? ' • Người đại diện nhóm' : ''));
    const info = document.getElementById('userEditInfo');
    if (!info) return;
    const items = [
        'Trạng thái: ' + (US_STATUS_LABELS[d.status] || d.status),
        'Đăng nhập cuối: ' + (d.lastLoginAt ? usFormatDate(d.lastLoginAt, true) : 'Chưa đăng nhập'),
        'Cập nhật: ' + usFormatDate(d.updatedAt, true)
    ];
    const warn = [];
    if (d.mustChangePassword) warn.push('Chưa đổi mật khẩu tạm');
    if (d.lockedUntil) warn.push('Đang khóa tạm do sai mật khẩu đến ' + usFormatTime(d.lockedUntil));
    info.innerHTML = items.map(t => '<li>' + usEsc(t) + '</li>').join('')
        + warn.map(t => '<li class="is-warning">' + usEsc(t) + '</li>').join('');
    info.hidden = false;
}

// HH:mm dd/MM/yyyy (khóa tạm thường chỉ vài phút nên giờ đứng trước).
function usFormatTime(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso || '');
    return m ? m[4] + ':' + m[5] + ' ' + m[3] + '/' + m[2] + '/' + m[1] : '';
}

function closeUserEdit() { closeModal('userModal'); }

// ---------- Hộp Thêm: POST /api/v1/admin/users (N03, M03 mục 3.4) ----------

const US_CREATE_KEYS = ['userGroupId', 'username', 'email', 'fullName', 'jobTitle', 'phoneNumber', 'roleCode'];
const US_ROLE_CODES = ['GROUP_ADMIN', 'USER_RECORDING', 'REGULAR_USER'];
const US_ROLE_OPTION_LABELS = { GROUP_ADMIN: 'Quản trị viên nhóm', USER_RECORDING: 'Thành viên nghe ghi âm', REGULAR_USER: 'Thành viên' };
const US_ROLE_PERMISSION = { GROUP_ADMIN: 'group:manage_admin', USER_RECORDING: 'group:toggle_recording' };
const US_USERNAME_RE = /^[A-Za-z0-9._@-]{3,100}$/;
const US_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const US_PHONE_RE = /^(?=.*[0-9])[0-9+\-.() ]{1,30}$/;
let usFormBusy = false;

// Kiểm tra body theo bảng M03 mục 3.4 (dùng chung cho mock backend và kiểm tra trước khi gửi ở frontend).
// Trả { errors, body } với body đã cắt khoảng trắng / chuẩn hóa rỗng → null, roleCode mặc định REGULAR_USER.
// admin = true: bản Admin (userGroupId bắt buộc); false: bản User (gửi userGroupId → 400).
function validateUserCreateBody(raw, admin) {
    const errors = {};
    const add = (k, m) => { (errors[k] = errors[k] || []).push(m); };
    const b = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    Object.keys(b).forEach(k => {
        if (!US_CREATE_KEYS.includes(k) || (k === 'userGroupId' && !admin)) add(k, 'Trường không được nhận');
    });
    const str = (v, key, { required, min = 1, max, re, reMsg }) => {
        if (v === undefined || v === null) { if (required) add(key, 'Bắt buộc'); return null; }
        if (typeof v !== 'string') { add(key, 'Phải là chuỗi'); return null; }
        const t = v.trim();
        if (t === '') { if (required) add(key, 'Bắt buộc'); return null; }
        if (t.length < min || t.length > max) add(key, min > 1 ? `Từ ${min} đến ${max} ký tự` : `Tối đa ${max} ký tự`);
        else if (re && !re.test(t)) add(key, reMsg);
        return t;
    };
    const body = {};
    if (admin) {
        const g = b.userGroupId;
        if (g === undefined || g === null) add('userGroupId', 'Bắt buộc chọn nhóm người dùng');
        else if (!Number.isInteger(g) || g < 1 || g > 4294967295) add('userGroupId', 'Nhóm người dùng không hợp lệ');
        else body.userGroupId = g;
    }
    body.username = str(b.username, 'username', { required: true, min: 3, max: 100, re: US_USERNAME_RE,
        reMsg: 'Chỉ chữ Latin không dấu, chữ số và . _ @ -' });
    body.email = str(b.email, 'email', { required: true, max: 150, re: US_EMAIL_RE, reMsg: 'Email không hợp lệ' });
    body.fullName = str(b.fullName, 'fullName', { required: true, max: 150 });
    body.jobTitle = str(b.jobTitle, 'jobTitle', { max: 150 });
    body.phoneNumber = str(b.phoneNumber, 'phoneNumber', { max: 30, re: US_PHONE_RE,
        reMsg: 'Chỉ chữ số, dấu cách và + - . ( ), có ít nhất một chữ số' });
    if (b.roleCode === undefined) body.roleCode = 'REGULAR_USER';
    else if (!US_ROLE_CODES.includes(b.roleCode)) add('roleCode', 'Vai trò không hợp lệ');
    else body.roleCode = b.roleCode;
    return { errors, body };
}

// Mật khẩu tạm 16 ký tự, 4 nhóm ký tự đã bỏ ký tự dễ nhầm (cùng cách sinh M04 mục 3.3; backend dùng crypto.randomInt)
function usTempPassword() {
    const sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghjkmnpqrstuvwxyz', '23456789', '!@#$%^&*-_=+?'];
    const rnd = n => crypto.getRandomValues(new Uint32Array(1))[0] % n;
    const chars = sets.map(set => set[rnd(set.length)]);
    const all = sets.join('');
    while (chars.length < 16) chars.push(all[rnd(all.length)]);
    for (let i = chars.length - 1; i > 0; i--) { const j = rnd(i + 1); [chars[i], chars[j]] = [chars[j], chars[i]]; }
    return chars.join('');
}

// Giả lập POST /api/v1/admin/users. Thứ tự: guard (401) → quyền user:create → query/body (400) → quyền gán vai trò (403)
// → kiểm tra tài khoản → khóa dòng nhóm: không có 400 / INACTIVE 409 GROUP_INACTIVE → Tầng 1 409 → trùng 409.
// 201: data = 17 trường của GET /admin/users/:id + temporaryPassword; backend gửi kèm Cache-Control: no-store.
// Lỗi: không thay đổi gì (rollback). Không tự gán người đại diện nhóm.
function mockCreateUser(token, body, query) {
    return new Promise(resolve => setTimeout(resolve, 400)).then(() => {
        if (usMockCreateError) { usMockCreateError = false; return Promise.reject(new Error('Network Error')); }
        if (!token) return usUnauthorized();
        if (!usHasPermission('user:create')) return usFail(403, 'FORBIDDEN_PERMISSION', 'Bạn không có quyền thực hiện thao tác này');
        const { errors, body: b } = validateUserCreateBody(body, true);
        Object.keys(query || {}).forEach(k => { errors[k] = ['Tham số không được nhận']; });
        if (Object.keys(errors).length) return usFail(400, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ', errors);
        const needed = US_ROLE_PERMISSION[b.roleCode];
        if (needed && !usHasPermission(needed)) return usFail(403, 'FORBIDDEN_PERMISSION', 'Bạn không có quyền gán vai trò này');

        const group = MOCK_US_GROUPS.find(g => g.id === b.userGroupId); // SELECT ... FROM user_groups ... FOR UPDATE
        if (!group) return usFail(400, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ', { userGroupId: ['Nhóm người dùng không tồn tại'] });
        if (US_QS.get('groupInactive') === String(group.id)) group.status = 'INACTIVE'; // giả lập vừa ngừng hoạt động
        if (group.status === 'INACTIVE') {
            return usFail(409, 'GROUP_INACTIVE', 'Nhóm người dùng đã ngừng hoạt động',
                { userGroupId: ['Nhóm đã ngừng hoạt động, hãy chọn nhóm khác'] });
        }
        if (b.roleCode === 'USER_RECORDING' && !group.allowRecordingAccess) {
            return usFail(409, 'GROUP_RECORDING_DISABLED', 'Nhóm chưa được cấp quyền nghe/tải ghi âm',
                { roleCode: ['Nhóm chưa được cấp quyền nghe/tải ghi âm, không gán được vai trò này'] });
        }
        // username_active / email_active: mọi người dùng chưa INACTIVE của mọi nhóm, gồm trùng chéo; so không phân biệt hoa thường
        const live = MOCK_US_USERS.filter(u => u.status !== 'INACTIVE');
        const taken = v => live.some(u => [u.username, u.email].some(x => x.toLowerCase() === v.toLowerCase()));
        const dup = {};
        if (taken(b.username)) dup.username = ['Tên đăng nhập đã được dùng'];
        if (taken(b.email)) dup.email = ['Email đã được dùng'];
        if (Object.keys(dup).length) return usFail(409, 'ACCOUNT_DUPLICATE', 'Tên đăng nhập hoặc email đã được dùng', dup);

        const now = usNow();
        const row = {
            id: Math.max(...MOCK_US_USERS.map(u => u.id)) + 1, userGroupId: group.id,
            username: b.username, email: b.email, fullName: b.fullName, jobTitle: b.jobTitle, phoneNumber: b.phoneNumber,
            avatarUrl: null, status: 'ACTIVE', roleCode: b.roleCode, lastLoginAt: null,
            createdAt: now, updatedAt: now, mustChangePassword: true
        };
        MOCK_US_USERS.push(row); // users + user_roles + user_settings + audit USER / CREATE trong một transaction
        const data = Object.assign(toUserDetail(row), { temporaryPassword: usTempPassword() });
        return { success: true, statusCode: 201, message: 'Tạo người dùng thành công', data, timestamp: now };
    });
}

function usForm() { return document.getElementById('userForm'); }

function clearUserFormErrors() {
    const form = usForm();
    if (!form) return;
    form.querySelectorAll('[data-error-for]').forEach(el => { el.textContent = ''; el.hidden = true; });
    form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
}

// errors[field] → dưới ô có data-error-for = field; khóa không có ô (vd. trường lạ, tham số) gom vào toast.
function showUserFormErrors(errors) {
    const form = usForm();
    const orphan = [];
    Object.keys(errors || {}).forEach(key => {
        const slot = form.querySelector(`[data-error-for="${CSS.escape(key)}"]`);
        if (!slot) { orphan.push(errors[key].join(', ')); return; }
        slot.textContent = errors[key].join(', ');
        slot.hidden = false;
        const input = form.elements[key];
        if (input && input.classList) input.classList.add('is-invalid');
    });
    if (orphan.length && window.showToast) window.showToast(usEsc(orphan.join('; ')), 'error');
    const first = form.querySelector('.is-invalid');
    if (first) first.focus();
}

// Ô Nhóm của hộp Thêm: nhóm ACTIVE của danh mục bên trái (usGroupOptions = data của GET /admin/user-groups?limit=100).
function fillUserGroupOptions(selectedId) {
    const select = document.getElementById('userGroupSelect');
    if (!select) return;
    select.replaceChildren(new Option('-- Chọn nhóm người dùng --', ''));
    usGroupOptions.filter(g => g.status === 'ACTIVE').forEach(g => {
        const opt = new Option(g.name + ' (' + g.code + ')', String(g.id));
        opt.dataset.recording = g.allowRecordingAccess ? '1' : '0';
        select.appendChild(opt);
    });
    select.value = [...select.options].some(o => o.value === String(selectedId || '')) ? String(selectedId) : '';
    applyUserRoleOptions();
}

// Lựa chọn vai trò: ẩn khi store thiếu mã quyền gán; USER_RECORDING tắt khi nhóm đang chọn chưa cấp Tầng 1.
function applyUserRoleOptions() {
    const role = document.getElementById('userRoleSelect');
    const group = document.getElementById('userGroupSelect');
    if (!role) return;
    const groupOpt = group && group.selectedOptions[0];
    const recordingAllowed = !groupOpt || !groupOpt.value || groupOpt.dataset.recording === '1';
    [...role.options].forEach(o => {
        const allowed = !o.dataset.rolePermission || usHasPermission(o.dataset.rolePermission);
        o.hidden = !allowed;
        o.disabled = !allowed || (o.value === 'USER_RECORDING' && !recordingAllowed);
        o.textContent = o.value === 'USER_RECORDING' && !recordingAllowed
            ? 'Thành viên nghe ghi âm (nhóm chưa được cấp ghi âm)' : US_ROLE_OPTION_LABELS[o.value];
    });
    if (role.selectedOptions[0] && role.selectedOptions[0].disabled) role.value = 'REGULAR_USER';
}

function setUserFormBusy(busy) {
    usFormBusy = busy;
    const editOnlyText = ['userGroupSelect', 'userRoleSelect']; // chế độ sửa: hai ô chọn này ẩn + tắt (setUserModalMode)
    [...usForm().elements].forEach(el => { el.disabled = busy || (usEditId !== null && editOnlyText.includes(el.id)); });
    document.querySelectorAll('#userModal [data-user-close]').forEach(b => { b.disabled = busy; });
    const btn = document.getElementById('userSaveBtn');
    if (btn) { btn.disabled = busy; btn.textContent = busy ? 'Đang lưu...' : (usEditId === null ? 'Tạo người dùng' : 'Lưu thay đổi'); }
    if (!busy) applyUserRoleOptions();
}

function closeUserForm() { closeModal('userModal'); } // closeModal tự chặn khi đang gửi

function openAddUserModal() {
    const modal = document.getElementById('userModal');
    if (!modal) return;
    const modalTitle = modal.querySelector('.modal-header h2');
    if (modalTitle) modalTitle.innerText = 'Thêm mới Người dùng';
    usForm().reset();
    usEditId = null;
    usEditSeq++;
    setUserModalMode('create');
    setUserEditState('ready');

    const lockNotice = document.getElementById('userGroupLockNotice');
    const creationNotice = document.getElementById('userGroupCreationNotice');
    const scopeBanner = document.getElementById('creatorScopeBanner');
    const scopeText = document.getElementById('creatorScopeText');
    if (scopeBanner) {
        scopeBanner.style.display = 'flex';
        scopeBanner.className = 'creator-scope-banner system-admin';
    }
    if (scopeText) {
        scopeText.innerHTML = 'Đang thao tác với tư cách <strong>Quản trị viên hệ thống</strong>: chọn nhóm người dùng đang hoạt động bất kỳ cho tài khoản mới.';
    }
    if (lockNotice) lockNotice.style.display = 'none';
    if (creationNotice) creationNotice.style.display = 'block';
    fillUserGroupOptions(usQuery.userGroupId); // chọn sẵn nhóm đang chọn ở danh mục nếu nhóm đó ACTIVE
    if (!usGroupOptions.some(g => g.status === 'ACTIVE') && window.showToast) {
        window.showToast('Danh mục nhóm chưa tải được hoặc không có nhóm đang hoạt động; hãy tải lại danh mục nhóm.', 'warning');
    }
    openModal('userModal');
    document.getElementById('userNameInput').focus();
}

// Đọc form thành body đúng các trường API: ô trống tùy chọn → null, roleCode luôn gửi, userGroupId là số.
function readUserCreateForm() {
    const f = usForm().elements;
    const opt = name => (f[name].value.trim() === '' ? null : f[name].value);
    return {
        userGroupId: f.userGroupId.value === '' ? null : Number(f.userGroupId.value),
        username: f.username.value,
        email: f.email.value,
        fullName: f.fullName.value,
        jobTitle: opt('jobTitle'),
        phoneNumber: opt('phoneNumber'),
        roleCode: f.roleCode.value
    };
}

function submitCreateUser() {
    clearUserFormErrors();
    const { errors, body } = validateUserCreateBody(readUserCreateForm(), true);
    if (Object.keys(errors).length) { showUserFormErrors(errors); return; } // không gọi API
    setUserFormBusy(true);
    usCallApi(token => mockCreateUser(token, body))
        .then(res => {
            setUserFormBusy(false);
            closeModal('userModal');
            usForm().reset();
            showUserTempPassword(res.data);
            if (window.showToast) window.showToast('Đã tạo người dùng ' + usEsc(res.data.fullName), 'success');
            loadUsers(); // giữ bộ lọc và trang hiện tại
            loadGroupSidebar(document.getElementById('groupSearchInput')?.value.trim() || ''); // userCount đổi
        })
        .catch(err => {
            setUserFormBusy(false);
            const status = err && err.statusCode;
            if (status === 401) return; // request() đã chuyển về login
            if (status === 409 && err.errorCode === 'GROUP_INACTIVE') {
                showUserFormErrors(err.errors);
                // nhóm vừa ngừng hoạt động: tải lại danh mục rồi dựng lại ô chọn (nhóm đó không còn trong ô)
                loadGroupSidebar(document.getElementById('groupSearchInput')?.value.trim() || '')
                    .then(() => { if (usEditId === null) fillUserGroupOptions(''); });
                return;
            }
            if ((status === 400 || status === 409) && err.errors) { showUserFormErrors(err.errors); return; }
            if (status === 403) { if (window.showToast) window.showToast(usEsc(err.message || 'Bạn không có quyền thực hiện thao tác này'), 'warning'); return; }
            if (window.showToast) window.showToast(usEsc((err && err.statusCode && err.message) || 'Không tạo được người dùng. Vui lòng thử lại.'), 'error');
        });
}

// Hộp mật khẩu tạm: chỉ giữ trong DOM khi đang mở; đóng thì xóa. Không lưu store/localStorage/URL.
function showUserTempPassword(data) {
    document.getElementById('userTempFullName').textContent = data.fullName;
    document.getElementById('userTempUsername').textContent = data.username;
    document.getElementById('userTempGroup').textContent = data.userGroup.code + ' – ' + data.userGroup.name;
    document.getElementById('userTempValue').textContent = data.temporaryPassword;
    document.getElementById('userTempPasswordModal').classList.add('show');
    document.body.style.overflow = 'hidden';
}
function closeUserTempPassword() {
    ['userTempFullName', 'userTempUsername', 'userTempGroup', 'userTempValue']
        .forEach(id => { document.getElementById(id).textContent = ''; });
    document.getElementById('userTempPasswordModal').classList.remove('show');
    document.body.style.overflow = '';
}
function copyUserTempPassword() {
    const value = document.getElementById('userTempValue').textContent;
    if (!navigator.clipboard) { window.showToast && window.showToast('Trình duyệt không hỗ trợ sao chép, hãy chép thủ công', 'warning'); return; }
    navigator.clipboard.writeText(value)
        .then(() => window.showToast && window.showToast('Đã sao chép mật khẩu tạm', 'success'))
        .catch(() => window.showToast && window.showToast('Không sao chép được, hãy chép thủ công', 'warning'));
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('#userModal [data-user-close]').forEach(b => b.addEventListener('click', closeUserForm));
    document.querySelectorAll('[data-close-user-temp]').forEach(b => b.addEventListener('click', closeUserTempPassword));
    document.getElementById('btnCopyUserTemp')?.addEventListener('click', copyUserTempPassword);
    document.getElementById('userGroupSelect')?.addEventListener('change', applyUserRoleOptions);
    const form = usForm();
    if (form) form.addEventListener('input', e => { // gõ lại vào ô thì bỏ lỗi của ô đó
        const slot = e.target.name && form.querySelector(`[data-error-for="${CSS.escape(e.target.name)}"]`);
        if (slot) { slot.hidden = true; slot.textContent = ''; }
        e.target.classList && e.target.classList.remove('is-invalid');
    });
});

// ---------- Hộp sửa: PUT /api/v1/admin/users/:id (N04, M03 mục 3.5) ----------

const US_UPDATE_KEYS = ['fullName', 'jobTitle', 'phoneNumber'];

// Kiểm tra body cập nhật một phần (dùng chung cho mock backend và kiểm tra trước khi gửi ở frontend).
// Trả { errors, body } với body chỉ gồm trường đã gửi, đã cắt khoảng trắng; jobTitle/phoneNumber rỗng → null.
function validateUserUpdateBody(raw) {
    const errors = {};
    const add = (k, m) => { (errors[k] = errors[k] || []).push(m); };
    if (!raw || typeof raw !== 'object' || Array.isArray(raw) || !Object.keys(raw).length) {
        US_UPDATE_KEYS.forEach(k => add(k, 'Cần gửi ít nhất một trường'));
        return { errors, body: {} };
    }
    Object.keys(raw).forEach(k => {
        if (k === 'userGroupId') add(k, 'Thuộc tính nhóm người dùng là cố định từ lúc tạo, không thể thay đổi hoặc chuyển nhóm');
        else if (!US_UPDATE_KEYS.includes(k)) add(k, 'Trường không được nhận');
    });
    const body = {};
    const str = (key, { required, max, re, reMsg }) => {
        if (!(key in raw)) return;
        const v = raw[key];
        if (v === null) { if (required) add(key, 'Bắt buộc'); else body[key] = null; return; }
        if (typeof v !== 'string') { add(key, 'Phải là chuỗi'); return; }
        const t = v.trim();
        if (t === '') { if (required) add(key, 'Bắt buộc'); else body[key] = null; return; }
        if (t.length > max) { add(key, `Tối đa ${max} ký tự`); return; }
        if (re && !re.test(t)) { add(key, reMsg); return; }
        body[key] = t;
    };
    str('fullName', { required: true, max: 150 });
    str('jobTitle', { max: 150 });
    str('phoneNumber', { max: 30, re: US_PHONE_RE, reMsg: 'Chỉ chữ số, dấu cách và + - . ( ), có ít nhất một chữ số' });
    return { errors, body };
}

// Giả lập PUT /api/v1/admin/users/:id. Thứ tự: guard (401) → quyền user:edit → :id/query/body (400) → kiểm tra tài khoản
// → SELECT ... FROM users WHERE id = :id FOR UPDATE (404) → INACTIVE (409) → so trường → UPDATE + USER / UPDATE.
// 200: data = 17 trường của GET /admin/users/:id; không đổi gì thì không ghi, message "Không có thay đổi nào".
function mockUpdateUser(token, id, body, query) {
    return new Promise(resolve => setTimeout(resolve, 400)).then(() => {
        if (usMockUpdateError) { usMockUpdateError = false; return Promise.reject(new Error('Network Error')); }
        if (!token) return usUnauthorized();
        if (!usHasPermission('user:edit')) return usFail(403, 'FORBIDDEN_PERMISSION', 'Bạn không có quyền thực hiện thao tác này');
        const { errors, body: b } = validateUserUpdateBody(body);
        if (!(/^[1-9][0-9]{0,9}$/.test(String(id)) && Number(id) <= 4294967295)) errors.id = ['Mã người dùng phải là số nguyên dương'];
        Object.keys(query || {}).forEach(k => { errors[k] = ['Tham số không được nhận']; });
        if (Object.keys(errors).length) return usFail(400, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ', errors);
        const row = MOCK_US_USERS.find(u => u.id === Number(id));
        if (!row || US_QS.get('updateMissing') === String(id)) return usFail(404, 'NOT_FOUND', 'Không tìm thấy tài nguyên');
        if (US_QS.get('updateInactive') === String(id)) row.status = 'INACTIVE'; // giả lập vừa bị ngừng hoạt động ở nơi khác
        if (row.status === 'INACTIVE') return usFail(409, 'ACCOUNT_INACTIVE', 'Tài khoản đã ngừng hoạt động, không sửa được');
        const changed = US_UPDATE_KEYS.filter(k => k in b && b[k] !== (row[k] == null ? null : row[k])); // so chính xác
        if (!changed.length) {
            return { success: true, statusCode: 200, message: 'Không có thay đổi nào', data: toUserDetail(row), timestamp: usNow() };
        }
        changed.forEach(k => { row[k] = b[k]; });
        row.updatedAt = usNow(); // + audit USER / UPDATE { changedFields } cùng transaction
        return { success: true, statusCode: 200, message: 'Cập nhật người dùng thành công', data: toUserDetail(row), timestamp: usNow() };
    });
}

// So form (đã cắt khoảng trắng) với data đã tải, chỉ giữ trường khác; ô tùy chọn rỗng → null, họ tên rỗng → null (báo "Bắt buộc").
function buildUserUpdateBody() {
    const f = usForm().elements;
    const current = {
        fullName: f.fullName.value.trim() || null,
        jobTitle: f.jobTitle.value.trim() || null,
        phoneNumber: f.phoneNumber.value.trim() || null
    };
    const body = {};
    US_UPDATE_KEYS.forEach(k => { if (current[k] !== (usEditData[k] == null ? null : usEditData[k])) body[k] = current[k]; });
    return body;
}

function submitUpdateUser() {
    clearUserFormErrors();
    if (!usEditData) return;
    const body = buildUserUpdateBody();
    if (!Object.keys(body).length) { // không có trường nào đổi: không gọi API
        closeModal('userModal');
        if (window.showToast) window.showToast('Không có thay đổi nào', 'info');
        return;
    }
    const { errors } = validateUserUpdateBody(body);
    if (Object.keys(errors).length) { showUserFormErrors(errors); return; } // không gọi API
    const id = usEditId;
    setUserFormBusy(true);
    usCallApi(token => mockUpdateUser(token, id, body))
        .then(res => {
            setUserFormBusy(false);
            closeModal('userModal');
            if (window.showToast) window.showToast(usEsc(res.message), 'success');
            loadUsers(); // giữ bộ lọc và trang; fullName đổi làm đổi thứ tự
        })
        .catch(err => {
            setUserFormBusy(false);
            const status = err && err.statusCode;
            if (status === 401) return; // request() đã chuyển về login
            if (status === 400 && err.errors) { showUserFormErrors(err.errors); return; }
            if (status === 403 || status === 404 || status === 409) { // 409 ACCOUNT_INACTIVE
                closeModal('userModal');
                if (window.showToast) window.showToast(usEsc(err.message), 'warning');
                loadUsers();
                return;
            }
            if (window.showToast) window.showToast(usEsc((err && err.statusCode && err.message) || 'Không lưu được thay đổi. Vui lòng thử lại.'), 'error');
        });
}

// Nút Lưu: chế độ tạo gửi POST (N03), chế độ sửa gửi PUT chỉ các trường đã đổi (N04).
function saveUser() {
    if (usFormBusy) return;
    if (usEditId === null) submitCreateUser();
    else submitUpdateUser();
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

// Bấm nền / Esc: đóng hộp đang mở, trừ hộp mật khẩu tạm (chỉ đóng bằng nút) và hộp Thêm đang gửi (closeModal tự chặn).
window.addEventListener('click', (e) => {
    if (e.target.classList && e.target.classList.contains('modal') && e.target.id !== 'userTempPasswordModal') {
        closeModal(e.target.id);
    }
});

window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        document.querySelectorAll('.modal.show').forEach(m => { if (m.id !== 'userTempPasswordModal') closeModal(m.id); });
    }
});
