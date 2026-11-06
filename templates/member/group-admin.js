// templates/group-admin.js - EVN CDR AS (Giao diện Quản trị viên nhóm)

// ==========================================================================
// 1. Dữ liệu Mô phỏng (Mock Data theo chuẩn Module 02 & Module 03)
// ==========================================================================

// Thông tin nhóm (thẻ tóm tắt, người đại diện) không còn mock ở đây: lấy từ GET /api/v1/user-groups/:id
// (G03) trong group-summary.js (window.memberGroupSummary). MEMBERS_DATA bên dưới là dữ liệu CŨ của danh sách
// thành viên, chưa rà (N01 GET /users).

let MEMBERS_DATA = [
    // Group 1: UMO-IT-01 (Nhóm Vận hành - 2 Admin: 10 & 15)
    {
        id: 10,
        userGroupId: 1,
        fullName: "Trần Thị B",
        username: "tran.b",
        email: "tran.b@71portal.vn",
        phoneNumber: "0912.345.678",
        extension: "42101",
        title: "Trưởng nhóm Kỹ thuật Vận hành",
        isGroupAdmin: true,
        canAccessRecording: true,
        status: "ACTIVE",
        createdAt: "2026-03-15",
        avatarUrl: "https://ui-avatars.com/api/?name=Tran+B&background=0033A0&color=fff"
    },
    {
        id: 15,
        userGroupId: 1,
        fullName: "Lê Văn C",
        username: "le.c",
        email: "le.c@71portal.vn",
        phoneNumber: "0983.456.789",
        extension: "42102",
        title: "Kỹ sư Quản trị Hệ thống Chính",
        isGroupAdmin: true,
        canAccessRecording: true,
        status: "ACTIVE",
        createdAt: "2026-03-16",
        avatarUrl: "https://ui-avatars.com/api/?name=Le+C&background=10b981&color=fff"
    },
    {
        id: 101,
        userGroupId: 1,
        fullName: "Phạm Văn D",
        username: "pham.d",
        email: "pham.d@71portal.vn",
        phoneNumber: "0977.112.233",
        extension: "42105",
        title: "Kỹ sư Vận hành Máy chủ & Storage",
        isGroupAdmin: false,
        canAccessRecording: true,
        status: "ACTIVE",
        createdAt: "2026-03-20",
        avatarUrl: "https://ui-avatars.com/api/?name=Pham+D&background=FFD100&color=000"
    },
    {
        id: 102,
        userGroupId: 1,
        fullName: "Hoàng Minh Trí",
        username: "tri.hm",
        email: "tri.hm@71portal.vn",
        phoneNumber: "0904.556.677",
        extension: "42108",
        title: "Chuyên viên Giám sát Mạng & Tổng đài",
        isGroupAdmin: false,
        canAccessRecording: false,
        status: "ACTIVE",
        createdAt: "2026-03-22",
        avatarUrl: "https://ui-avatars.com/api/?name=Minh+Tri&background=0284c7&color=fff"
    },
    {
        id: 103,
        userGroupId: 1,
        fullName: "Đỗ Thị Mai",
        username: "mai.dt",
        email: "mai.dt@71portal.vn",
        phoneNumber: "0936.889.900",
        extension: "42110",
        title: "Kỹ sư Trực ca Vận hành 24/7",
        isGroupAdmin: false,
        canAccessRecording: false,
        status: "ACTIVE",
        createdAt: "2026-03-25",
        avatarUrl: "https://ui-avatars.com/api/?name=Do+Mai&background=ec4899&color=fff"
    },
    {
        id: 104,
        userGroupId: 1,
        fullName: "Nguyễn Tuấn Anh",
        username: "anh.nt",
        email: "anh.nt@71portal.vn",
        phoneNumber: "0968.334.455",
        extension: "42115",
        title: "Kỹ sư Cơ sở Dữ liệu & Backup",
        isGroupAdmin: false,
        canAccessRecording: false,
        status: "LOCKED",
        createdAt: "2026-04-01",
        avatarUrl: "https://ui-avatars.com/api/?name=Tuan+Anh&background=64748b&color=fff"
    },

    // Group 2: UMO-IT-02 (Nhóm Phần mềm - DUY NHẤT 1 ADMIN: 18)
    {
        id: 18,
        userGroupId: 2,
        fullName: "Hoàng Văn Tuấn",
        username: "tuan.hv",
        email: "tuan.hv@71portal.vn",
        phoneNumber: "0918.234.567",
        extension: "43101",
        title: "Trưởng phòng Phát triển Phần mềm",
        isGroupAdmin: true,
        status: "ACTIVE",
        createdAt: "2026-04-02",
        avatarUrl: "https://ui-avatars.com/api/?name=Hoang+Tuan&background=0284c7&color=fff"
    },
    {
        id: 201,
        userGroupId: 2,
        fullName: "Nguyễn Hải Long",
        username: "long.nh",
        email: "long.nh@71portal.vn",
        phoneNumber: "0972.123.456",
        extension: "43105",
        title: "Lập trình viên Backend NestJS",
        isGroupAdmin: false,
        status: "ACTIVE",
        createdAt: "2026-04-05",
        avatarUrl: "https://ui-avatars.com/api/?name=Hai+Long&background=10b981&color=fff"
    },
    {
        id: 202,
        userGroupId: 2,
        fullName: "Vũ Phương Linh",
        username: "linh.vp",
        email: "linh.vp@71portal.vn",
        phoneNumber: "0981.654.321",
        extension: "43108",
        title: "Kỹ sư Frontend Vue/UX",
        isGroupAdmin: false,
        status: "ACTIVE",
        createdAt: "2026-04-08",
        avatarUrl: "https://ui-avatars.com/api/?name=Phuong+Linh&background=8b5cf6&color=fff"
    },

    // Group 3: UMO-KD-01 (Call Center CSKH - 2 Admin: 22 & 25)
    {
        id: 22,
        userGroupId: 3,
        fullName: "Phạm Thu Hương",
        username: "huong.pt",
        email: "huong.pt@71portal.vn",
        phoneNumber: "0903.112.233",
        extension: "48100",
        title: "Trưởng ban Chăm sóc Khách hàng",
        isGroupAdmin: true,
        status: "ACTIVE",
        createdAt: "2026-04-18",
        avatarUrl: "https://ui-avatars.com/api/?name=Pham+Huong&background=f59e0b&color=fff"
    },
    {
        id: 25,
        userGroupId: 3,
        fullName: "Đặng Quốc Huy",
        username: "huy.dq",
        email: "huy.dq@71portal.vn",
        phoneNumber: "0934.567.890",
        extension: "48102",
        title: "Phó ban CSKH Call Center",
        isGroupAdmin: true,
        status: "ACTIVE",
        createdAt: "2026-04-20",
        avatarUrl: "https://ui-avatars.com/api/?name=Quoc+Huy&background=0033A0&color=fff"
    },
    {
        id: 301,
        userGroupId: 3,
        fullName: "Bùi Tuyết Mai",
        username: "mai.bt",
        email: "mai.bt@71portal.vn",
        phoneNumber: "0988.776.655",
        extension: "48110",
        title: "Điện thoại viên CSKH",
        isGroupAdmin: false,
        status: "ACTIVE",
        createdAt: "2026-04-22",
        avatarUrl: "https://ui-avatars.com/api/?name=Tuyet+Mai&background=ec4899&color=fff"
    },

    // Group 4: UMO-AUDIT-GLOBAL
    {
        id: 31,
        userGroupId: 4,
        fullName: "Nguyễn Hải Nam",
        username: "nam.nh",
        email: "nam.nh@evn.com.vn",
        phoneNumber: "0915.667.788",
        extension: "20101",
        title: "Trưởng ban Kiểm toán Nội bộ",
        isGroupAdmin: true,
        status: "ACTIVE",
        createdAt: "2026-05-10",
        avatarUrl: "https://ui-avatars.com/api/?name=Nguyen+Nam&background=64748b&color=fff"
    },
    {
        id: 401,
        userGroupId: 4,
        fullName: "Trần Bảo Quân",
        username: "quan.tb",
        email: "quan.tb@evn.com.vn",
        phoneNumber: "0982.334.455",
        extension: "20105",
        title: "Chuyên viên Quản trị Lưu lượng Thoại",
        isGroupAdmin: false,
        status: "ACTIVE",
        createdAt: "2026-05-12",
        avatarUrl: "https://ui-avatars.com/api/?name=Bao+Quan&background=0284c7&color=fff"
    }
];

// ==========================================================================
// 2. Trạng thái Ứng dụng (App State)
// ==========================================================================

let appState = {
    currentGroupId: window.memberSession ? window.memberSession.getAccount().userGroup.id : 1, // nhóm của người gọi, không đổi
    viewMode: 'grid',       // 'grid' hoặc 'table'
    searchKeyword: '',
    filterRole: 'all',      // 'all', 'admin', 'member'
    filterStatus: 'all',    // 'all', 'ACTIVE', 'LOCKED'
    currentPage: 1,
    pageSize: 6,
    pendingActionUserId: null
};

// ==========================================================================
// 3. Khởi tạo Giao diện khi tải trang (DOMContentLoaded)
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    renderCurrentGroup();
    window.addEventListener('member-group-summary', () => renderMembersContent());
});

function initEventListeners() {
    // 1. Chuyển đổi chế độ xem (Grid Card vs Table)
    const btnGridView = document.getElementById('btnViewGrid');
    const btnTableView = document.getElementById('btnViewTable');

    if (btnGridView && btnTableView) {
        btnGridView.addEventListener('click', () => setViewMode('grid'));
        btnTableView.addEventListener('click', () => setViewMode('table'));
    }

    // 2. Tìm kiếm thành viên
    const searchInput = document.getElementById('memberSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            appState.searchKeyword = e.target.value.trim().toLowerCase();
            appState.currentPage = 1;
            renderMembersContent();
        });
    }

    // 3. Lọc theo vai trò
    const roleFilter = document.getElementById('filterRoleSelect');
    if (roleFilter) {
        roleFilter.addEventListener('change', (e) => {
            appState.filterRole = e.target.value;
            appState.currentPage = 1;
            renderMembersContent();
        });
    }

    // 4. Lọc theo trạng thái
    const statusFilter = document.getElementById('filterStatusSelect');
    if (statusFilter) {
        statusFilter.addEventListener('change', (e) => {
            appState.filterStatus = e.target.value;
            appState.currentPage = 1;
            renderMembersContent();
        });
    }

    // 5. Đóng modal khi click ra ngoài backdrop hoặc ấn ESC
    window.addEventListener('click', (e) => {
        if (e.target.classList && e.target.classList.contains('modal')) {
            closeAllModals();
        }
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

function setViewMode(mode) {
    appState.viewMode = mode;

    const btnGridView = document.getElementById('btnViewGrid');
    const btnTableView = document.getElementById('btnViewTable');
    const gridContainer = document.getElementById('adminCardsGrid');
    const tableContainer = document.getElementById('adminTableView');

    if (mode === 'grid') {
        btnGridView?.classList.add('active');
        btnTableView?.classList.remove('active');
        if (gridContainer) gridContainer.style.display = 'grid';
        if (tableContainer) tableContainer.style.display = 'none';
    } else {
        btnGridView?.classList.remove('active');
        btnTableView?.classList.add('active');
        if (gridContainer) gridContainer.style.display = 'none';
        if (tableContainer) tableContainer.style.display = 'block';
    }

    renderMembersContent();
}

// Nhóm của người gọi cho phần danh sách thành viên: tên + cờ Tầng 1 từ store (authUser.user.userGroup, /auth/me),
// mã + người đại diện từ data của GET /user-groups/:id (rỗng/null khi thẻ tóm tắt chưa tải xong).
function getCurrentGroup() {
    const data = window.memberGroupSummary ? window.memberGroupSummary.getData() : null;
    const ug = window.memberSession ? window.memberSession.getAccount().userGroup : null;
    return {
        id: appState.currentGroupId,
        code: data ? data.code : '',
        name: data ? data.name : (ug ? ug.name : ''),
        allowRecordingAccess: ug ? ug.allowRecordingAccess : true,
        representativeUserId: data && data.representative ? data.representative.id : null
    };
}

function getGroupMembers() {
    return MEMBERS_DATA.filter(m => m.userGroupId === appState.currentGroupId);
}

// ==========================================================================
// 4. Render Thẻ Tóm tắt Thông tin Nhóm (Group Hero Summary)
// ==========================================================================

function renderCurrentGroup() {
    // Thẻ tóm tắt nhóm (tiêu đề, đơn vị, dải số, Quản trị viên, số thành viên) do group-summary.js vẽ từ G03.
    const members = getGroupMembers();
    const activeMembers = members.filter(m => m.status === 'ACTIVE');
    const lockedMembers = members.filter(m => m.status === 'LOCKED');

    // KPI Badges in Summary Grid
    const countActive = document.getElementById('kpiActiveMembers');
    const countLocked = document.getElementById('kpiLockedMembers');

    if (countActive) countActive.innerText = activeMembers.length;
    if (countLocked) countLocked.innerText = lockedMembers.length;

    // Header badge inside table card
    const tableBadge = document.getElementById('memberTableCountBadge');
    if (tableBadge) tableBadge.innerText = `${members.length} thành viên`;

    // Render Content (Cards or Table)
    renderMembersContent();
}

// ==========================================================================
// 5. Render Nội dung Thành viên (Thẻ Cards hoặc Bảng Table) & Phân trang
// ==========================================================================

function renderMembersContent() {
    const emptyState = document.getElementById('memberEmptyState');
    const gridContainer = document.getElementById('adminCardsGrid');
    const tableContainer = document.getElementById('adminTableView');

    let members = getGroupMembers();

    // 1. Filter Search Keyword
    if (appState.searchKeyword) {
        const kw = appState.searchKeyword;
        members = members.filter(m =>
            m.fullName.toLowerCase().includes(kw) ||
            m.email.toLowerCase().includes(kw) ||
            m.username.toLowerCase().includes(kw) ||
            (m.phoneNumber && m.phoneNumber.toLowerCase().includes(kw)) ||
            (m.title && m.title.toLowerCase().includes(kw))
        );
    }

    // 2. Filter Role
    if (appState.filterRole === 'admin') {
        members = members.filter(m => m.isGroupAdmin);
    } else if (appState.filterRole === 'member') {
        members = members.filter(m => !m.isGroupAdmin);
    }

    // 3. Filter Status
    if (appState.filterStatus !== 'all') {
        members = members.filter(m => m.status === appState.filterStatus);
    }

    // Check Empty State
    if (members.length === 0) {
        if (gridContainer) gridContainer.innerHTML = '';
        const tbody = document.getElementById('membersTableBody');
        if (tbody) tbody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        if (gridContainer) gridContainer.style.display = 'none';
        if (tableContainer) tableContainer.style.display = 'none';
        renderPagination(0, 1);
        return;
    }

    if (emptyState) emptyState.style.display = 'none';

    // Pagination
    const total = members.length;
    const totalPages = Math.ceil(total / appState.pageSize) || 1;
    if (appState.currentPage > totalPages) appState.currentPage = totalPages;

    const startIdx = (appState.currentPage - 1) * appState.pageSize;
    const pageMembers = members.slice(startIdx, startIdx + appState.pageSize);

    if (appState.viewMode === 'grid') {
        if (gridContainer) gridContainer.style.display = 'grid';
        if (tableContainer) tableContainer.style.display = 'none';
        renderCardGrid(pageMembers);
    } else {
        if (gridContainer) gridContainer.style.display = 'none';
        if (tableContainer) tableContainer.style.display = 'block';
        renderTableView(pageMembers);
    }

    renderPagination(total, totalPages);
}

// Alias for backwards compatibility
const renderMembersTable = renderMembersContent;

// Render Card Grid View
function renderCardGrid(members) {
    const gridContainer = document.getElementById('adminCardsGrid');
    if (!gridContainer) return;

    gridContainer.innerHTML = members.map(m => {
        const isGroupRep = getCurrentGroup().representativeUserId === m.id;

        return `
            <div class="admin-card" data-user-id="${m.id}">
                <div>
                    <!-- Card Top: Avatar, Name, Title, Badges -->
                    <div class="admin-card-top">
                        <img src="${m.avatarUrl}" alt="${m.fullName}" class="admin-card-avatar">
                        <div class="admin-card-info">
                            <div class="admin-card-name-row">
                                <h4 class="admin-card-name" title="${m.fullName}">
                                    ${m.fullName}
                                    ${isGroupRep ? '<span title="Người đại diện nhóm" style="color: #f59e0b; font-size: 0.85rem;">★</span>' : ''}
                                </h4>
                                <span class="badge-status ${m.status.toLowerCase()}">
                                    ${m.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                                </span>
                            </div>
                            <p class="admin-card-title">${m.title || 'Chưa cập nhật'}</p>
                            <div class="admin-card-badges">
                                ${m.isGroupAdmin
                ? `<span class="badge-group-role admin">★ Quản trị viên</span>`
                : `<span class="badge-group-role member">Thành viên</span>`
            }
                                ${getCurrentGroup().allowRecordingAccess && (m.isGroupAdmin || m.canAccessRecording)
                ? `<span class="badge-recording" title="Được cấp quyền nghe & tải ghi âm thoại (BR-UG-05)"><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg> Ghi âm</span>`
                : ''
            }
                            </div>
                        </div>
                    </div>

                    <!-- Contact info: Hiển thị đồng nhất giống email -->
                    <div class="admin-card-meta">
                        <div class="admin-card-email-row" title="Điện thoại">
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                                <line x1="12" y1="18" x2="12.01" y2="18"></line>
                            </svg>
                            <span>${m.phoneNumber || '—'}</span>
                        </div>
                        <div class="admin-card-email-row" title="${m.email}">
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                <polyline points="22,6 12,13 2,6"></polyline>
                            </svg>
                            <span>${m.email}</span>
                        </div>
                    </div>
                </div>

                <!-- Card Footer: All 5 Admin Actions -->
                <div class="admin-card-footer">
                    <div class="admin-card-actions">
                        <button type="button" class="btn-card-icon" onclick="openViewMemberModal(${m.id})" title="Xem chi tiết">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                        <button type="button" class="btn-card-icon edit" onclick="openEditMemberModal(${m.id})" title="Sửa thông tin thành viên">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button type="button" class="btn-card-icon role" onclick="openToggleAdminModal(${m.id})" title="${m.isGroupAdmin ? 'Hạ quyền Quản trị viên nhóm' : 'Bổ nhiệm làm Quản trị viên nhóm'}">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                        </button>
                        <button type="button" class="btn-card-icon password" onclick="openResetPasswordModal(${m.id})" title="Đặt lại mật khẩu">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        </button>
                        <button type="button" class="btn-card-icon status" onclick="openToggleStatusModal(${m.id})" title="${m.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Render Table View
function renderTableView(members) {
    const tbody = document.getElementById('membersTableBody');
    if (!tbody) return;

    tbody.innerHTML = members.map(m => {
        const isGroupRep = getCurrentGroup().representativeUserId === m.id;

        return `
            <tr data-user-id="${m.id}">
                <td>
                    <div class="member-user-cell">
                        <img src="${m.avatarUrl}" alt="${m.fullName}" class="avatar">
                        <div class="member-user-meta">
                            <span class="member-name">
                                ${m.fullName}
                                ${isGroupRep ? '<span title="Người đại diện nhóm" style="color: #f59e0b; font-size: 0.8rem;">★</span>' : ''}
                            </span>
                            <span class="member-email">@${m.username}</span>
                        </div>
                    </div>
                </td>
                <td>
                    <span style="color: var(--text-main); font-size: 0.8125rem;">${m.phoneNumber || '—'}</span>
                </td>
                <td>
                    <div style="display: flex; flex-direction: column; gap: 4px; align-items: flex-start;">
                        ${m.isGroupAdmin
                ? `<span class="badge-group-role admin">★ Quản trị nhóm</span>`
                : `<span class="badge-group-role member">Thành viên</span>`
            }
                        ${getCurrentGroup().allowRecordingAccess && (m.isGroupAdmin || m.canAccessRecording)
                ? `<span class="badge-recording" title="Được cấp quyền nghe & tải ghi âm thoại (BR-UG-05)"><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg> Ghi âm</span>`
                : ''
            }
                    </div>
                </td>
                <td>
                    <span class="badge-status ${m.status.toLowerCase()}">
                        ${m.status === 'ACTIVE' ? 'Hoạt động' : 'Đã khóa'}
                    </span>
                </td>
                <td class="text-right">
                    <div class="row-actions-group">
                        <button type="button" class="btn-icon-action" onclick="openViewMemberModal(${m.id})" title="Xem chi tiết">
                            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                        <button type="button" class="btn-icon-action edit" onclick="openEditMemberModal(${m.id})" title="Sửa thông tin thành viên">
                            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button type="button" class="btn-icon-action role" onclick="openToggleAdminModal(${m.id})" title="${m.isGroupAdmin ? 'Hạ quyền Quản trị viên nhóm' : 'Bổ nhiệm làm Quản trị viên nhóm'}">
                            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                        </button>
                        <button type="button" class="btn-icon-action password" onclick="openResetPasswordModal(${m.id})" title="Cấp lại mật khẩu">
                            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                        </button>
                        <button type="button" class="btn-icon-action status" onclick="openToggleStatusModal(${m.id})" title="${m.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}">
                            <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderPagination(total, totalPages) {
    const infoEl = document.getElementById('paginationInfo');
    const pagesContainer = document.getElementById('paginationPages');
    const prevBtn = document.getElementById('paginationPrevBtn');
    const nextBtn = document.getElementById('paginationNextBtn');

    if (infoEl) {
        const start = total === 0 ? 0 : (appState.currentPage - 1) * appState.pageSize + 1;
        const end = Math.min(appState.currentPage * appState.pageSize, total);
        infoEl.innerText = `Hiển thị ${start} - ${end} trên tổng số ${total} thành viên`;
    }

    if (prevBtn) {
        prevBtn.disabled = appState.currentPage <= 1;
        prevBtn.onclick = () => {
            if (appState.currentPage > 1) {
                appState.currentPage--;
                renderMembersTable();
            }
        };
    }

    if (nextBtn) {
        nextBtn.disabled = appState.currentPage >= totalPages;
        nextBtn.onclick = () => {
            if (appState.currentPage < totalPages) {
                appState.currentPage++;
                renderMembersTable();
            }
        };
    }

    if (pagesContainer) {
        let pagesHtml = '';
        for (let i = 1; i <= totalPages; i++) {
            pagesHtml += `
                <button type="button" class="btn ${i === appState.currentPage ? 'btn-primary' : 'btn-outline'}" 
                    style="padding: 4px 10px; font-size: 0.8125rem;" onclick="goToPage(${i})">
                    ${i}
                </button>
            `;
        }
        pagesContainer.innerHTML = pagesHtml;
    }
}

function goToPage(page) {
    appState.currentPage = page;
    renderMembersTable();
}

// ==========================================================================
// 6. Quản lý Modal & Hành động Quản trị
// ==========================================================================

function openModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.add('show');
}

function closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.remove('show');
}

function closeAllModals() {
    document.querySelectorAll('.modal').forEach(m => m.classList.remove('show'));
}

// Modal 1: Thêm thành viên mới (Cố định nhóm BR-UG-01)
function openAddMemberModal() {
    const group = getCurrentGroup();
    const groupNameEl = document.getElementById('addMemberGroupNameDisplay');
    if (groupNameEl) groupNameEl.innerText = `${group.code} - ${group.name}`;

    const form = document.getElementById('addMemberForm');
    if (form) form.reset();

    // Ẩn/hiện trường phân quyền ghi âm theo trạng thái cấp phép của Nhóm
    const hasRecording = group.allowRecordingAccess ?? group.recordingAccessEnabled;
    const recGroup = document.getElementById('addRecordingAccessGroup');
    const recCheck = document.getElementById('addCanAccessRecording');
    if (recGroup) {
        recGroup.style.display = hasRecording ? 'block' : 'none';
    }
    if (recCheck) {
        recCheck.checked = false;
    }

    openModal('addMemberModal');
}

function submitAddMember(e) {
    e.preventDefault();
    const group = getCurrentGroup();
    const hasRecording = group.allowRecordingAccess ?? group.recordingAccessEnabled;

    const fullName = document.getElementById('addFullName').value.trim();
    const username = document.getElementById('addUsername').value.trim().toLowerCase();
    const email = document.getElementById('addEmail').value.trim().toLowerCase();
    const phoneNumber = document.getElementById('addPhone').value.trim();
    const title = document.getElementById('addTitle').value.trim();
    const canAccessRecording = hasRecording ? !!document.getElementById('addCanAccessRecording')?.checked : false;

    // Validate duplicate username or email
    const exists = MEMBERS_DATA.some(m => m.username === username || m.email === email);
    if (exists) {
        showToast('Tên đăng nhập hoặc email đã tồn tại trong hệ thống!', 'error');
        return;
    }

    const newMember = {
        id: Date.now(),
        userGroupId: group.id,
        fullName,
        username,
        email,
        phoneNumber,
        title,
        isGroupAdmin: false,
        canAccessRecording,
        status: "ACTIVE",
        createdAt: new Date().toISOString().split('T')[0],
        avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(fullName)}&background=0033A0&color=fff`
    };

    MEMBERS_DATA.unshift(newMember);
    closeModal('addMemberModal');
    renderCurrentGroup();
    showToast(`Đã thêm thành viên "${fullName}" vào nhóm ${group.code} thành công!`, 'success');
}

// Modal 2: Chỉnh sửa thông tin thành viên
function openEditMemberModal(userId) {
    const member = MEMBERS_DATA.find(m => m.id === userId);
    if (!member) return;

    appState.pendingActionUserId = userId;
    const group = getCurrentGroup();

    document.getElementById('editGroupNameDisplay').value = `${group.code} - ${group.name}`;
    document.getElementById('editFullName').value = member.fullName;
    document.getElementById('editUsername').value = member.username;
    document.getElementById('editEmail').value = member.email;
    document.getElementById('editPhone').value = member.phoneNumber || '';
    document.getElementById('editTitle').value = member.title || '';
    document.getElementById('editStatus').value = member.status;

    // Quản lý quyền ghi âm thoại (BR-UG-05): Ẩn nếu nhóm chưa được cấp phép
    const recGroup = document.getElementById('editRecordingAccessGroup');
    const recCheck = document.getElementById('editCanAccessRecording');
    const recNote = document.getElementById('editRecordingAccessNote');

    const hasRecording = group.allowRecordingAccess ?? group.recordingAccessEnabled;
    if (recGroup) {
        if (hasRecording) {
            recGroup.style.display = 'block';
            if (member.isGroupAdmin) {
                if (recCheck) {
                    recCheck.checked = true;
                    recCheck.disabled = true;
                }
                if (recNote) recNote.innerText = 'Quản trị viên nhóm mặc định có toàn quyền nghe & tải ghi âm thoại.';
            } else {
                if (recCheck) {
                    recCheck.checked = !!member.canAccessRecording;
                    recCheck.disabled = false;
                }
                if (recNote) recNote.innerText = 'Ủy quyền cho thành viên được nghe trực tuyến và tải file ghi âm cuộc gọi của nhóm.';
            }
        } else {
            recGroup.style.display = 'none';
        }
    }

    openModal('editMemberModal');
}

function submitEditMember(e) {
    e.preventDefault();
    const member = MEMBERS_DATA.find(m => m.id === appState.pendingActionUserId);
    if (!member) return;

    const group = getCurrentGroup();
    const hasRecording = group.allowRecordingAccess ?? group.recordingAccessEnabled;

    member.fullName = document.getElementById('editFullName').value.trim();
    member.phoneNumber = document.getElementById('editPhone').value.trim();
    member.title = document.getElementById('editTitle').value.trim();
    member.status = document.getElementById('editStatus').value;

    // Cập nhật quyền ghi âm nếu nhóm được cấp phép và tài khoản không phải Admin
    if (hasRecording && !member.isGroupAdmin) {
        const recCheck = document.getElementById('editCanAccessRecording');
        if (recCheck) {
            member.canAccessRecording = recCheck.checked;
        }
    }

    closeModal('editMemberModal');
    renderCurrentGroup();
    showToast(`Đã cập nhật thông tin thành viên "${member.fullName}"`, 'success');
}

// Modal 3: Bổ nhiệm / Hạ quyền Admin kèm Safeguard BR-UG-02
function openToggleAdminModal(userId) {
    const member = MEMBERS_DATA.find(m => m.id === userId);
    if (!member) return;

    appState.pendingActionUserId = userId;
    const group = getCurrentGroup();
    const groupAdmins = getGroupMembers().filter(m => m.isGroupAdmin);

    const titleEl = document.getElementById('toggleAdminModalTitle');
    const descEl = document.getElementById('toggleAdminModalDesc');
    const safeguardBox = document.getElementById('toggleAdminSafeguardBox');
    const confirmBtn = document.getElementById('confirmToggleAdminBtn');

    if (member.isGroupAdmin) {
        titleEl.innerText = "Hạ quyền Quản trị viên nhóm";
        descEl.innerHTML = `Bạn có chắc muốn thu hồi quyền Quản trị viên nhóm của <strong>${member.fullName}</strong> (@${member.username}) trong nhóm <strong>${group.name}</strong>?`;

        // Check Safeguard BR-UG-02: Nhóm phải có ít nhất 1 Group Admin
        if (groupAdmins.length <= 1) {
            safeguardBox.style.display = "flex";
            safeguardBox.className = "safeguard-alert-box danger";
            safeguardBox.innerHTML = `
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                <div>
                    <strong>RÀNG BUỘC SAFEGUARD (BR-UG-02):</strong><br>
                    ${member.fullName} hiện là <strong>Quản trị viên nhóm duy nhất</strong> của nhóm này. Bạn không thể thu hồi quyền này cho đến khi bổ nhiệm một thành viên khác làm Quản trị viên nhóm thay thế.
                </div>
            `;
            confirmBtn.disabled = true;
            confirmBtn.style.opacity = '0.5';
            confirmBtn.style.cursor = 'not-allowed';
        } else {
            safeguardBox.style.display = "flex";
            safeguardBox.className = "safeguard-alert-box warning";
            safeguardBox.innerHTML = `
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                <div>
                    Sau khi hạ quyền, người này sẽ chuyển thành <strong>Thành viên thường</strong> và không còn quyền tạo, chỉnh sửa, phân bổ thành viên khác trong nhóm. Nhóm vẫn còn <strong>${groupAdmins.length - 1}</strong> Quản trị viên nhóm khác.
                </div>
            `;
            confirmBtn.disabled = false;
            confirmBtn.style.opacity = '1';
            confirmBtn.style.cursor = 'pointer';
        }
    } else {
        titleEl.innerText = "Bổ nhiệm Quản trị viên nhóm";
        descEl.innerHTML = `Bổ nhiệm thành viên <strong>${member.fullName}</strong> (@${member.username}) làm <strong>Quản trị viên nhóm (Group Admin)</strong>?`;
        safeguardBox.style.display = "flex";
        safeguardBox.className = "safeguard-alert-box info";
        safeguardBox.innerHTML = `
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            <div>
                Người dùng này sẽ có đầy đủ thẩm quyền thêm mới, cập nhật hồ sơ, đặt lại mật khẩu và quản lý thành viên nội bộ trong nhóm <strong>${group.code}</strong>.
            </div>
        `;
        confirmBtn.disabled = false;
        confirmBtn.style.opacity = '1';
        confirmBtn.style.cursor = 'pointer';
    }

    openModal('toggleAdminModal');
}

function confirmToggleAdmin() {
    const member = MEMBERS_DATA.find(m => m.id === appState.pendingActionUserId);
    if (!member) return;

    member.isGroupAdmin = !member.isGroupAdmin;
    closeModal('toggleAdminModal');
    renderCurrentGroup();

    showToast(
        member.isGroupAdmin
            ? `Đã bổ nhiệm "${member.fullName}" làm Quản trị viên nhóm thành công!`
            : `Đã thu hồi quyền Quản trị viên nhóm của "${member.fullName}".`,
        'success'
    );
}

// Modal 4: Đặt lại Mật khẩu
function openResetPasswordModal(userId) {
    const member = MEMBERS_DATA.find(m => m.id === userId);
    if (!member) return;

    const group = getCurrentGroup();
    appState.pendingActionUserId = userId;

    // Hiển thị thông tin thành viên trên card
    const avatarEl = document.getElementById('resetPassUserAvatar');
    const nameEl = document.getElementById('resetPassUserName');
    const emailEl = document.getElementById('resetPassUserEmail');
    const groupEl = document.getElementById('resetPassUserGroup');

    if (avatarEl) avatarEl.src = member.avatarUrl || `https://ui-avatars.com/api/?name=${encodeURIComponent(member.fullName)}&background=0033A0&color=fff`;
    if (nameEl) nameEl.innerHTML = `${member.fullName} <span style="font-size: 0.8rem; font-weight: 400; color: var(--text-muted);">(@${member.username})</span>`;
    if (emailEl) emailEl.innerText = member.email || 'Chưa cập nhật email';
    if (groupEl) groupEl.innerText = group ? `${group.code} - ${group.name}` : '';

    // Khởi tạo trạng thái mặc định
    switchResetPassMode('auto');

    const manualInput = document.getElementById('manualNewPassword');
    const confirmInput = document.getElementById('manualConfirmPassword');
    if (manualInput) {
        manualInput.value = '';
        manualInput.type = 'password';
    }
    if (confirmInput) {
        confirmInput.value = '';
        confirmInput.type = 'password';
    }

    generateRandomPassword();
    openModal('resetPasswordModal');
}

function switchResetPassMode(mode) {
    const autoTab = document.getElementById('resetPassTabAuto');
    const manualTab = document.getElementById('resetPassTabManual');
    const autoSec = document.getElementById('resetPassAutoSection');
    const manualSec = document.getElementById('resetPassManualSection');

    if (mode === 'auto') {
        if (autoTab) autoTab.classList.add('active');
        if (manualTab) manualTab.classList.remove('active');
        if (autoSec) autoSec.style.display = 'block';
        if (manualSec) manualSec.style.display = 'none';
    } else {
        if (autoTab) autoTab.classList.remove('active');
        if (manualTab) manualTab.classList.add('active');
        if (autoSec) autoSec.style.display = 'none';
        if (manualSec) manualSec.style.display = 'flex';
    }
}

function togglePasswordVisibility(inputId, btnEl) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';
    if (btnEl) {
        btnEl.innerHTML = isPass
            ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
            : `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    }
}

function generateRandomPassword() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#%';
    let pass = 'Evn@';
    for (let i = 0; i < 6; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const input = document.getElementById('newGeneratedPassword');
    if (input) input.value = pass;
}

function copyResetPassword() {
    const passInput = document.getElementById('newGeneratedPassword');
    if (passInput) {
        passInput.select();
        navigator.clipboard.writeText(passInput.value).then(() => {
            showToast('Đã sao chép mật khẩu mới vào bộ nhớ tạm!', 'info');
        }).catch(() => {
            showToast('Sao chép thất bại, vui lòng bôi đen và nhấn Ctrl+C', 'warning');
        });
    }
}

function confirmResetPassword(event) {
    if (event) event.preventDefault();

    const member = MEMBERS_DATA.find(m => m.id === appState.pendingActionUserId);
    if (!member) return;

    const autoTab = document.getElementById('resetPassTabAuto');
    const isAuto = autoTab && autoTab.classList.contains('active');

    if (!isAuto) {
        const manualInput = document.getElementById('manualNewPassword');
        const confirmInput = document.getElementById('manualConfirmPassword');
        const val = manualInput ? manualInput.value.trim() : '';
        const confirmVal = confirmInput ? confirmInput.value.trim() : '';

        if (!val || val.length < 8) {
            showToast('Mật khẩu mới phải có tối thiểu 8 ký tự!', 'error');
            if (manualInput) manualInput.focus();
            return;
        }

        if (val !== confirmVal) {
            showToast('Mật khẩu xác nhận không khớp với mật khẩu mới!', 'error');
            if (confirmInput) confirmInput.focus();
            return;
        }
    }

    closeModal('resetPasswordModal');
    showToast(`Đã lưu mật khẩu mới cho thành viên "${member.fullName}". Hãy bàn giao mật khẩu này cho người dùng.`, 'success');
}

// Modal 5: Khóa / Mở khóa Tài khoản
function openToggleStatusModal(userId) {
    const member = MEMBERS_DATA.find(m => m.id === userId);
    if (!member) return;

    appState.pendingActionUserId = userId;
    const titleEl = document.getElementById('toggleStatusTitle');
    const descEl = document.getElementById('toggleStatusDesc');
    const alertBox = document.getElementById('toggleStatusAlertBox');
    const confirmBtn = document.getElementById('confirmToggleStatusBtn');

    if (member.status === 'ACTIVE') {
        titleEl.innerText = "Khóa tài khoản thành viên";
        descEl.innerHTML = `Bạn có chắc muốn <strong>khóa tài khoản</strong> của <strong>${member.fullName}</strong> (@${member.username})?`;

        // Check if admin & only 1 active admin
        const groupAdmins = getGroupMembers().filter(m => m.isGroupAdmin && m.status === 'ACTIVE');
        if (member.isGroupAdmin && groupAdmins.length <= 1) {
            alertBox.style.display = "flex";
            alertBox.className = "safeguard-alert-box danger";
            alertBox.innerHTML = `
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                <div>
                    <strong>CẢNH BÁO:</strong> Đây là Quản trị viên nhóm đang hoạt động duy nhất của nhóm. Nếu khóa, nhóm này sẽ không còn quản trị viên nào có thể đăng nhập để thao tác.
                </div>
            `;
        } else {
            alertBox.style.display = "none";
        }

        confirmBtn.className = "btn btn-danger";
        confirmBtn.innerText = "Khóa tài khoản";
    } else {
        titleEl.innerText = "Mở khóa tài khoản thành viên";
        descEl.innerHTML = `Mở khóa và cho phép <strong>${member.fullName}</strong> (@${member.username}) đăng nhập lại vào hệ thống?`;
        alertBox.style.display = "none";
        confirmBtn.className = "btn btn-primary";
        confirmBtn.innerText = "Mở khóa";
    }

    openModal('toggleStatusModal');
}

function confirmToggleStatus() {
    const member = MEMBERS_DATA.find(m => m.id === appState.pendingActionUserId);
    if (!member) return;

    member.status = member.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    closeModal('toggleStatusModal');
    renderCurrentGroup();

    showToast(
        member.status === 'ACTIVE'
            ? `Đã mở khóa tài khoản cho "${member.fullName}".`
            : `Đã khóa tài khoản của "${member.fullName}".`,
        'success'
    );
}

// Modal 6: Xem Chi Tiết Thành Viên
function openViewMemberModal(userId) {
    const member = MEMBERS_DATA.find(m => m.id === userId);
    if (!member) return;

    const group = getCurrentGroup();

    document.getElementById('viewMemberAvatar').src = member.avatarUrl;
    document.getElementById('viewMemberFullName').innerText = member.fullName;
    document.getElementById('viewMemberUsername').innerText = `@${member.username}`;

    document.getElementById('viewMemberRoleBadge').innerHTML = member.isGroupAdmin
        ? `<span class="badge-group-role admin">★ Quản trị nhóm</span>`
        : `<span class="badge-group-role member">Thành viên</span>`;

    document.getElementById('viewMemberStatusBadge').innerHTML = member.status === 'ACTIVE'
        ? `<span class="badge-status active">Đang hoạt động</span>`
        : `<span class="badge-status locked">Đã khóa</span>`;

    document.getElementById('viewMemberGroupName').innerText = `${group.code} - ${group.name}`;
    document.getElementById('viewMemberTitle').innerText = member.title || 'Chưa cập nhật';
    document.getElementById('viewMemberPhone').innerText = member.phoneNumber || 'Chưa cập nhật';
    document.getElementById('viewMemberEmail').innerText = member.email;

    // Hiển thị quyền nghe & tải ghi âm thoại (BR-UG-05): Ẩn nếu nhóm chưa được cấp phép
    const hasRecording = group.allowRecordingAccess ?? group.recordingAccessEnabled;
    const recItem = document.getElementById('viewMemberRecordingAccessItem');
    const recBadge = document.getElementById('viewMemberRecordingBadge');
    if (recItem) {
        if (hasRecording) {
            recItem.style.display = 'block';
            const hasAccess = member.isGroupAdmin || !!member.canAccessRecording;
            if (recBadge) {
                recBadge.innerHTML = hasAccess
                    ? `<span class="badge-recording" style="font-size: 0.8125rem; padding: 4px 10px;">
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>
                        Được cấp quyền (${member.isGroupAdmin ? 'Mặc định theo vai trò Quản trị viên' : 'Được Quản trị viên nhóm ủy quyền'})
                       </span>`
                    : `<span style="font-size: 0.8125rem; color: var(--text-muted);">Chưa được cấp quyền</span>`;
            }
        } else {
            recItem.style.display = 'none';
        }
    }

    openModal('viewMemberModal');
}

// Xuất danh sách thành viên ra CSV
function exportMembersList() {
    const group = getCurrentGroup();
    const members = getGroupMembers();

    let csv = "ID,HoTen,Username,Email,DienThoai,ChucVu,VaiTroNhom,TrangThai\n";
    members.forEach(m => {
        csv += `"${m.id}","${m.fullName}","${m.username}","${m.email}","${m.phoneNumber || ''}","${m.title || ''}","${m.isGroupAdmin ? 'Admin' : 'Member'}","${m.status}"\n`;
    });

    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Danh_sach_thanh_vien_${group.code}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`Đã xuất danh sách thành viên nhóm ${group.code} thành công!`, 'success');
}

// Toast Notification
function showToast(message, type = 'info') {
    const existing = document.querySelector('.admin-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `admin-toast ${type}`;
    toast.innerHTML = `
        <span style="font-weight: 500;">${message}</span>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3500);
}
