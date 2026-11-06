// templates/member/group-members.js – EVN CDR AS, Danh bạ nhóm (member.group-members → GroupMembersView.vue)
//
// Danh bạ: GET /api/v1/user-groups/me/members (G04, docs/modules/02_user_group.md mục 3.6). Chỉ đọc, mọi vai trò User.
// Nhóm luôn là nhóm của người gọi (backend đọc users.user_group_id), không có tham số/ô chọn nhóm.
// Thẻ tóm tắt nhóm (tên, đơn vị, dải số, Quản trị viên, số thành viên) do group-summary.js vẽ từ GET /user-groups/:id (G03);
// trang này chỉ lấy representative.id từ sự kiện `member-group-summary` để gắn nhãn "Đại diện".
// Vue: store useGroupDirectoryStore (members, pagination, query, viewMode cục bộ), action fetchMembers.
// Kiểm tay mock: ?maintenance=1 (503), ?account=locked (401), ?membersError=1 (lỗi mạng một lần, "Thử lại" thành công).

// ==========================================================================
// 1. Giả lập backend GET /api/v1/user-groups/me/members
// ==========================================================================

// Dòng "CSDL" của mock (users + user_roles), KHÔNG phải cấu trúc response: response chỉ có 7 trường của toMemberDto.
// Có cả thành viên LOCKED/INACTIVE và nhóm khác để thấy backend lọc; vai trò USER_RECORDING không lộ ra response.
const MOCK_USER_ROWS = [
    { id: 10, userGroupId: 1, fullName: 'Trần Thị B', jobTitle: 'Trưởng nhóm Kỹ thuật Vận hành', email: 'tran.b@71portal.vn', phoneNumber: '0912.345.678', avatarUrl: null, status: 'ACTIVE', roleCode: 'GROUP_ADMIN' },
    { id: 15, userGroupId: 1, fullName: 'Lê Văn C', jobTitle: 'Kỹ sư Quản trị Hệ thống Chính', email: 'le.c@71portal.vn', phoneNumber: null, avatarUrl: null, status: 'ACTIVE', roleCode: 'GROUP_ADMIN' },
    { id: 101, userGroupId: 1, fullName: 'Phạm Văn D', jobTitle: 'Kỹ sư Vận hành Máy chủ & Storage', email: 'pham.d@71portal.vn', phoneNumber: '0977 112 233', avatarUrl: null, status: 'ACTIVE', roleCode: 'USER_RECORDING' },
    { id: 102, userGroupId: 1, fullName: 'Hoàng Minh Trí', jobTitle: 'Chuyên viên Giám sát Mạng & Tổng đài', email: 'tri.hm@71portal.vn', phoneNumber: '0904556677', avatarUrl: null, status: 'ACTIVE', roleCode: 'REGULAR_USER' },
    { id: 103, userGroupId: 1, fullName: 'Đỗ Thị Mai', jobTitle: 'Kỹ sư Trực ca Vận hành 24/7', email: 'mai.dt@71portal.vn', phoneNumber: '0936.889.900', avatarUrl: null, status: 'ACTIVE', roleCode: 'REGULAR_USER' },
    { id: 104, userGroupId: 1, fullName: 'Nguyễn Tuấn Anh', jobTitle: 'Kỹ sư Cơ sở Dữ liệu & Backup', email: 'anh.nt@71portal.vn', phoneNumber: '0968.334.455', avatarUrl: null, status: 'LOCKED', roleCode: 'REGULAR_USER' },
    { id: 105, userGroupId: 1, fullName: 'Vũ Hải Đăng', jobTitle: null, email: 'dang.vh@71portal.vn', phoneNumber: null, avatarUrl: null, status: 'ACTIVE', roleCode: 'REGULAR_USER' },
    { id: 106, userGroupId: 1, fullName: 'Bùi Thanh Hà', jobTitle: 'Kỹ sư An toàn Thông tin', email: 'ha.bt@71portal.vn', phoneNumber: '0983 556 778', avatarUrl: null, status: 'ACTIVE', roleCode: 'USER_RECORDING' },
    { id: 107, userGroupId: 1, fullName: 'Ngô Quang Vinh', jobTitle: 'Kỹ sư Mạng Truyền dẫn', email: 'vinh.nq@71portal.vn', phoneNumber: '0915.223.344', avatarUrl: null, status: 'ACTIVE', roleCode: 'REGULAR_USER' },
    { id: 108, userGroupId: 1, fullName: 'Trịnh Thu Trang', jobTitle: 'Chuyên viên Tổng hợp', email: 'trang.tt@71portal.vn', phoneNumber: '0988.990.011', avatarUrl: null, status: 'ACTIVE', roleCode: 'REGULAR_USER' },
    { id: 109, userGroupId: 1, fullName: 'Lý Minh Khôi', jobTitle: 'Kỹ sư Vận hành Tổng đài', email: 'khoi.lm@71portal.vn', phoneNumber: '0903.667.788', avatarUrl: null, status: 'ACTIVE', roleCode: 'REGULAR_USER' },
    { id: 110, userGroupId: 1, fullName: 'Cao Thị Hồng', jobTitle: 'Kỹ sư Giám sát Chất lượng', email: 'hong.ct@71portal.vn', phoneNumber: null, avatarUrl: null, status: 'INACTIVE', roleCode: 'REGULAR_USER' },
    { id: 201, userGroupId: 2, fullName: 'Nguyễn Hải Long', jobTitle: 'Lập trình viên Backend', email: 'long.nh@71portal.vn', phoneNumber: '0972.123.456', avatarUrl: null, status: 'ACTIVE', roleCode: 'GROUP_ADMIN' }
];
const MOCK_REPRESENTATIVE_USER_ID = { 1: 10, 2: 201 }; // user_groups.representative_user_id

const dirParams = new URLSearchParams(window.location.search);
const DIR_MOCK_MAINTENANCE = dirParams.get('maintenance') === '1';
const DIR_MOCK_ACCOUNT_LOCKED = dirParams.get('account') === 'locked';
let dirMockNetworkError = dirParams.get('membersError') === '1';

const dirNow = () => new Date().toISOString().replace('Z', '+07:00');
const dirFail = (statusCode, errorCode, message, errors) =>
    Promise.reject({ success: false, statusCode, errorCode, message, errors: errors || null, timestamp: dirNow() });
// utf8mb4_unicode_ci: không phân biệt hoa thường, không phân biệt dấu thanh/mũ (mock xấp xỉ bằng NFD bỏ dấu).
const dirFold = v => String(v || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// DTO phần tử: đúng 7 trường; không trả username, status, roleCode, lastLoginAt, phiên.
function toMemberDto(row) {
    return {
        id: row.id,
        fullName: row.fullName,
        jobTitle: row.jobTitle,
        email: row.email,
        phoneNumber: row.phoneNumber,
        avatarUrl: row.avatarUrl,
        isGroupAdmin: row.roleCode === 'GROUP_ADMIN'
    };
}

// Thứ tự: guard (401) → bảo trì (503) → quyền user_group:view (mọi vai trò User có) → query (400)
// → kiểm tra tài khoản (401, đọc users + user_groups: lấy user_group_id, representative_user_id). Không có 403 phạm vi, 404.
function mockGetGroupMembers(token, query) {
    return new Promise(resolve => setTimeout(resolve, 300)).then(() => {
        if (dirMockNetworkError) { dirMockNetworkError = false; return Promise.reject(new Error('Network Error')); }
        if (!token) return dirFail(401, 'UNAUTHORIZED', 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
        if (DIR_MOCK_MAINTENANCE) return dirFail(503, 'MAINTENANCE', 'Hệ thống đang bảo trì, vui lòng quay lại sau');

        const errors = {};
        const allowed = ['page', 'limit', 'search', 'isGroupAdmin'];
        Object.keys(query).forEach(k => {
            if (!allowed.includes(k)) errors[k] = ['Tham số không được nhận'];      // vd. roleCode, groupId, sort
            else if (Array.isArray(query[k])) errors[k] = ['Tham số bị lặp lại'];
        });
        const page = query.page === undefined ? 1 : (/^[1-9][0-9]{0,8}$/.test(String(query.page)) ? Number(query.page) : NaN);
        const limit = query.limit === undefined ? 20 : (/^[1-9][0-9]{0,2}$/.test(String(query.limit)) ? Number(query.limit) : NaN);
        if (!errors.page && !(page >= 1)) errors.page = ['page phải là số nguyên ≥ 1'];
        if (!errors.limit && !(limit >= 1 && limit <= 100)) errors.limit = ['limit phải trong khoảng 1–100'];
        const search = query.search === undefined ? '' : String(query.search).trim();
        if (!errors.search && search.length > 100) errors.search = ['Tối đa 100 ký tự'];
        if (!errors.isGroupAdmin && query.isGroupAdmin !== undefined && !['true', 'false'].includes(query.isGroupAdmin)) {
            errors.isGroupAdmin = ['Chỉ nhận true hoặc false'];
        }
        if (Object.keys(errors).length) return dirFail(400, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ', errors);
        if (DIR_MOCK_ACCOUNT_LOCKED) return dirFail(401, 'UNAUTHORIZED', 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');

        const groupId = window.memberSession ? window.memberSession.getAccount().userGroup.id : 1;
        const repId = MOCK_REPRESENTATIVE_USER_ID[groupId] || null;
        const kw = dirFold(search);
        const rows = MOCK_USER_ROWS
            .filter(r => r.userGroupId === groupId && r.status === 'ACTIVE')
            .filter(r => query.isGroupAdmin === undefined || (r.roleCode === 'GROUP_ADMIN') === (query.isGroupAdmin === 'true'))
            .filter(r => !kw || [r.fullName, r.email, r.jobTitle, r.phoneNumber].some(v => dirFold(v).includes(kw)))
            // Người đại diện → Quản trị viên nhóm → còn lại; trong mỗi khối full_name, id.
            .sort((a, b) => ((b.id === repId) - (a.id === repId))
                || ((b.roleCode === 'GROUP_ADMIN') - (a.roleCode === 'GROUP_ADMIN'))
                || a.fullName.localeCompare(b.fullName, 'vi')
                || a.id - b.id);
        const total = rows.length;
        const totalPages = Math.ceil(total / limit);
        return {
            success: true, statusCode: 200, message: 'Lấy danh bạ nhóm thành công',
            data: rows.slice((page - 1) * limit, page * limit).map(toMemberDto), // page vượt totalPages → []
            pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
            timestamp: dirNow()
        };
    });
}

// ==========================================================================
// 2. Trạng thái màn hình
// ==========================================================================

const dirQuery = { page: 1, search: '', isGroupAdmin: '' }; // '' = không lọc
let dirSeq = 0;
let dirSearchTimer = null;
let dirViewMode = 'grid';      // 'grid' | 'table' – trạng thái giao diện cục bộ, không lưu
let dirRows = [];              // data của trang đang hiển thị (hộp chi tiết đọc từ đây, không gọi API)
let dirRepId = null;           // representative.id từ GET /user-groups/:id (sự kiện member-group-summary)

const dirCallApi = fn => (window.memberSession ? window.memberSession.request(fn) : fn('mock-token'));
const dirEsc = v => String(v == null ? '' : v)
    .replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const dirTel = phone => String(phone).replace(/[^0-9+]/g, '');
function dirInitials(name) {
    const parts = String(name || '').trim().split(/\s+/);
    return ((parts.length > 1 ? parts[0][0] : '') + (parts[parts.length - 1][0] || '')).toUpperCase();
}
// limit = itemsPerPage của store preferencesUser (10/20/50), đọc lại mỗi lần gửi.
function dirLimit() {
    const prefs = window.memberSession ? window.memberSession.getPreferences() : null;
    return prefs && prefs.itemsPerPage ? prefs.itemsPerPage : 10;
}
function dirBuildQuery() {
    const q = { page: String(dirQuery.page), limit: String(dirLimit()) };
    if (dirQuery.search) q.search = dirQuery.search;
    if (dirQuery.isGroupAdmin) q.isGroupAdmin = dirQuery.isGroupAdmin;
    return q;
}

// ==========================================================================
// 3. Khởi tạo
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    initDirectoryEvents();
    loadMembers();
    window.addEventListener('member-group-summary', e => {
        const data = e.detail && e.detail.data;
        dirRepId = data && data.representative ? data.representative.id : null;
        if (dirRows.length) renderMembers(dirRows); // chỉ vẽ lại nhãn "Đại diện", không gọi lại API
    });
});

function initDirectoryEvents() {
    document.getElementById('btnViewGrid')?.addEventListener('click', () => setViewMode('grid'));
    document.getElementById('btnViewTable')?.addEventListener('click', () => setViewMode('table'));
    document.getElementById('btnRetryDirectory')?.addEventListener('click', loadMembers);

    // Tìm kiếm: 300 ms sau lần gõ cuối hoặc Enter; đổi điều kiện thì về trang 1.
    const searchInput = document.getElementById('memberSearchInput');
    if (searchInput) {
        const apply = () => {
            clearTimeout(dirSearchTimer);
            const value = searchInput.value.trim();
            if (value === dirQuery.search) return;
            dirQuery.search = value;
            dirQuery.page = 1;
            loadMembers();
        };
        searchInput.addEventListener('input', () => { clearTimeout(dirSearchTimer); dirSearchTimer = setTimeout(apply, 300); });
        searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); apply(); } });
    }

    document.getElementById('filterRoleSelect')?.addEventListener('change', e => {
        dirQuery.isGroupAdmin = e.target.value; // '' | 'true' | 'false'
        dirQuery.page = 1;
        loadMembers();
    });

    document.getElementById('paginationPages')?.addEventListener('click', e => {
        const btn = e.target.closest('button[data-page]');
        if (!btn) return;
        dirQuery.page = Number(btn.dataset.page);
        loadMembers();
    });

    window.addEventListener('click', e => {
        if (e.target.classList && e.target.classList.contains('modal')) closeAllModals();
    });
    window.addEventListener('keydown', e => { if (e.key === 'Escape') closeAllModals(); });
}

function setViewMode(mode) {
    dirViewMode = mode;
    document.getElementById('btnViewGrid')?.classList.toggle('active', mode === 'grid');
    document.getElementById('btnViewTable')?.classList.toggle('active', mode === 'table');
    if (dirRows.length) renderMembers(dirRows);
}

// ==========================================================================
// 4. Tải & vẽ danh bạ
// ==========================================================================

// state: 'loading' | 'error' | 'empty' | 'ready'
function setDirectoryState(state, message, hint) {
    const box = document.getElementById('directoryState');
    const msg = document.getElementById('directoryStateMessage');
    const retry = document.getElementById('btnRetryDirectory');
    const empty = document.getElementById('directoryEmptyState');
    const grid = document.getElementById('contactCardsGrid');
    const table = document.getElementById('contactTableView');
    const pager = document.getElementById('directoryPagination');
    const badge = document.getElementById('directoryCountBadge');
    if (box) { box.hidden = !(state === 'loading' || state === 'error'); box.classList.toggle('is-error', state === 'error'); }
    if (msg) msg.textContent = state === 'loading' || state === 'error' ? message : '';
    if (retry) retry.hidden = state !== 'error';
    if (empty) {
        empty.hidden = state !== 'empty';
        if (state === 'empty') {
            document.getElementById('directoryEmptyTitle').textContent = message;
            document.getElementById('directoryEmptyHint').textContent = hint || '';
        }
    }
    if (grid) grid.hidden = !(state === 'ready' && dirViewMode === 'grid');
    if (table) table.hidden = !(state === 'ready' && dirViewMode === 'table');
    if (pager) pager.hidden = state !== 'ready';
    if (badge && state === 'error') badge.hidden = true;
}

function loadMembers() {
    const seq = ++dirSeq;
    setDirectoryState('loading', 'Đang tải danh bạ nhóm...');
    return dirCallApi(token => mockGetGroupMembers(token, dirBuildQuery()))
        .then(res => {
            if (seq !== dirSeq) return; // đã có request mới hơn
            const p = res.pagination;
            const badge = document.getElementById('directoryCountBadge');
            if (badge) { badge.textContent = p.total + ' thành viên'; badge.hidden = false; }
            if (!res.data.length && p.page > 1 && p.totalPages > 0) {
                dirQuery.page = p.totalPages; // danh sách ngắn lại: lùi về trang cuối
                return loadMembers();
            }
            dirRows = res.data;
            if (!res.data.length) {
                const filtered = dirQuery.search || dirQuery.isGroupAdmin;
                if (filtered) setDirectoryState('empty', 'Không có thành viên phù hợp với bộ lọc', 'Thử từ khóa khác hoặc chọn "Tất cả vai trò"');
                else setDirectoryState('empty', 'Nhóm chưa có thành viên đang hoạt động', '');
                return;
            }
            renderMembers(res.data);
            renderPagination(p, res.data.length);
        })
        .catch(err => {
            if (seq !== dirSeq) return;
            if (err && err.statusCode === 401) return; // request() đã chuyển về login
            // 503: request() hiện biểu ngữ bảo trì; khối danh bạ vẫn hiện thông điệp + "Thử lại" riêng (U09).
            setDirectoryState('error', (err && err.statusCode && err.message) || 'Không tải được danh bạ nhóm. Vui lòng thử lại.');
        });
}

function avatarHtml(m, size) {
    return m.avatarUrl
        ? `<img src="${dirEsc(m.avatarUrl)}" alt="" class="contact-avatar" style="width:${size}px;height:${size}px;">`
        : `<span class="contact-avatar contact-avatar-initials" style="width:${size}px;height:${size}px;" aria-hidden="true">${dirEsc(dirInitials(m.fullName))}</span>`;
}
function roleBadgeHtml(m) {
    return m.isGroupAdmin
        ? '<span class="badge-group-role admin">★ Quản trị viên nhóm</span>'
        : '<span class="badge-group-role member">Thành viên</span>';
}
function repMarkHtml(m) {
    return m.id === dirRepId ? '<span class="contact-rep-mark" title="Người đại diện nhóm">★ Đại diện</span>' : '';
}
function phoneHtml(m) {
    return m.phoneNumber ? `<a href="tel:${dirEsc(dirTel(m.phoneNumber))}">${dirEsc(m.phoneNumber)}</a>` : '<span class="text-muted">—</span>';
}

function renderMembers(members) {
    if (dirViewMode === 'grid') renderCardGrid(members);
    else renderTableView(members);
    setDirectoryState('ready');
}

function renderCardGrid(members) {
    const grid = document.getElementById('contactCardsGrid');
    if (!grid) return;
    grid.innerHTML = members.map(m => `
        <div class="contact-card" data-user-id="${m.id}">
            <div>
                <div class="contact-card-top">
                    ${avatarHtml(m, 52)}
                    <div class="contact-info">
                        <h4 class="contact-name" title="${dirEsc(m.fullName)}">${dirEsc(m.fullName)} ${repMarkHtml(m)}</h4>
                        <p class="contact-title ${m.jobTitle ? '' : 'text-muted'}" title="${dirEsc(m.jobTitle || '')}">
                            ${m.jobTitle ? dirEsc(m.jobTitle) : 'Chưa cập nhật chức danh'}
                        </p>
                        <div class="contact-badges">${roleBadgeHtml(m)}</div>
                    </div>
                </div>
                <div class="contact-meta-list">
                    <div class="contact-meta-row" title="Điện thoại">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                            <line x1="12" y1="18" x2="12.01" y2="18"></line>
                        </svg>
                        <span>${phoneHtml(m)}</span>
                    </div>
                    <div class="contact-meta-row" title="Email">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                            <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                        <a href="mailto:${dirEsc(m.email)}">${dirEsc(m.email)}</a>
                    </div>
                </div>
            </div>
            <div class="contact-card-footer">
                <a href="mailto:${dirEsc(m.email)}" class="btn-card-action" title="Gửi email">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                        <polyline points="22,6 12,13 2,6"></polyline>
                    </svg>
                    Gửi email
                </a>
                <button type="button" class="btn-card-action" onclick="openViewMemberModal(${m.id})" title="Xem chi tiết">
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                    Chi tiết
                </button>
            </div>
        </div>`).join('');
}

function renderTableView(members) {
    const tbody = document.getElementById('contactTableBody');
    if (!tbody) return;
    tbody.innerHTML = members.map(m => `
        <tr>
            <td>
                <div class="contact-table-person">
                    ${avatarHtml(m, 32)}
                    <div>
                        <strong>${dirEsc(m.fullName)} ${repMarkHtml(m)}</strong>
                        <span class="contact-table-sub">${m.jobTitle ? dirEsc(m.jobTitle) : 'Chưa cập nhật chức danh'}</span>
                    </div>
                </div>
            </td>
            <td>${phoneHtml(m)}</td>
            <td><a href="mailto:${dirEsc(m.email)}">${dirEsc(m.email)}</a></td>
            <td>${roleBadgeHtml(m)}</td>
            <td style="text-align: right;">
                <button type="button" class="btn-icon-detail" onclick="openViewMemberModal(${m.id})" title="Xem chi tiết">
                    <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    </svg>
                </button>
            </td>
        </tr>`).join('');
}

// Phân trang theo pagination của response (cửa sổ 5 trang).
function renderPagination(p, count) {
    const info = document.getElementById('paginationInfo');
    const pages = document.getElementById('paginationPages');
    const from = (p.page - 1) * p.limit + 1;
    if (info) info.textContent = `Hiển thị ${from}–${from + count - 1} / ${p.total} thành viên`;
    if (!pages) return;
    const btn = (label, page, { disabled = false, active = false, aria } = {}) =>
        `<button type="button" class="btn ${active ? 'btn-primary' : 'btn-outline'} btn-page"
            ${disabled || active ? 'disabled' : `data-page="${page}"`} ${aria ? `aria-label="${aria}"` : ''}
            ${active ? 'aria-current="page"' : ''}>${label}</button>`;
    const first = Math.max(1, Math.min(p.page - 2, p.totalPages - 4));
    const last = Math.min(p.totalPages, first + 4);
    let html = btn('«', p.page - 1, { disabled: !p.hasPrev, aria: 'Trang trước' });
    for (let i = first; i <= last; i++) html += btn(String(i), i, { active: i === p.page });
    html += btn('»', p.page + 1, { disabled: !p.hasNext, aria: 'Trang sau' });
    pages.innerHTML = html;
}

// ==========================================================================
// 5. Hộp chi tiết liên hệ (dữ liệu của dòng đã tải, không gọi API) & tiện ích
// ==========================================================================

function openModal(modalId) { document.getElementById(modalId)?.classList.add('show'); }
function closeModal(modalId) { document.getElementById(modalId)?.classList.remove('show'); }
function closeAllModals() { document.querySelectorAll('.modal').forEach(m => m.classList.remove('show')); }

function openViewMemberModal(userId) {
    const m = dirRows.find(r => r.id === userId);
    if (!m) return;
    const ug = window.memberSession ? window.memberSession.getAccount().userGroup : null;
    document.getElementById('viewMemberAvatar').innerHTML = avatarHtml(m, 56);
    document.getElementById('viewMemberFullName').innerHTML = `${dirEsc(m.fullName)} ${repMarkHtml(m)}`;
    document.getElementById('viewMemberRoleBadge').innerHTML = roleBadgeHtml(m);
    document.getElementById('viewMemberGroupName').textContent = ug ? ug.name : '';
    const title = document.getElementById('viewMemberTitle');
    title.textContent = m.jobTitle || 'Chưa cập nhật';
    title.classList.toggle('text-muted', !m.jobTitle);
    document.getElementById('viewMemberPhone').innerHTML = phoneHtml(m);
    document.getElementById('viewMemberEmail').innerHTML = `<a href="mailto:${dirEsc(m.email)}">${dirEsc(m.email)}</a>`;
    const copyPhone = document.getElementById('btnCopyMemberPhone');
    copyPhone.hidden = !m.phoneNumber;
    copyPhone.onclick = () => copyText(m.phoneNumber, 'số điện thoại');
    document.getElementById('btnCopyMemberEmail').onclick = () => copyText(m.email, 'email');
    document.getElementById('btnMailMember').href = 'mailto:' + m.email;
    openModal('viewMemberModal');
}

function copyText(value, label) {
    if (!navigator.clipboard) { showToast('Trình duyệt không hỗ trợ sao chép', 'error'); return; }
    navigator.clipboard.writeText(value)
        .then(() => showToast(`Đã sao chép ${label}`, 'success'))
        .catch(() => showToast(`Không sao chép được ${label}`, 'error'));
}

function showToast(message, type = 'info') {
    document.querySelector('.member-toast')?.remove();
    const toast = document.createElement('div');
    toast.className = `member-toast ${type}`;
    toast.setAttribute('role', 'status');
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3200);
}
