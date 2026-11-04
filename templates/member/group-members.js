// templates/group-members.js - EVN CDR AS (Giao diện Danh bạ Thành viên nhóm)

// ==========================================================================
// 1. Dữ liệu Mô phỏng (Mock Data theo chuẩn Module 02 & Module 03)
// ==========================================================================

const GROUPS_DATA = [
    {
        id: 1,
        code: "UMO-IT-01",
        name: "Khối Công nghệ Thông tin - Nhóm Vận hành",
        description: "Quản trị vận hành hạ tầng máy chủ, hệ thống mạng và giám sát tổng đài CDR toàn hệ thống EVN",
        organizationId: 2,
        organizationName: "Khối Công nghệ Thông tin",
        hierarchyPath: ["Tập đoàn Điện lực Việt Nam", "Tổng công ty 71", "Khối CNTT"],
        phonePrefixGroup: {
            id: 101,
            code: "PG-IT-01",
            name: "Nhóm dải số Khối CNTT (Trụ sở chính)",
            prefixes: ["42xxx", "46xxx"],
            ranges: [
                { from: "42000", to: "42499", count: 500, note: "Hạ tầng máy chủ & NOC" },
                { from: "42500", to: "42999", count: 500, note: "Vận hành mạng Viễn thông" },
                { from: "46000", to: "46999", count: 1000, note: "Cơ quan EVN Tháp A" }
            ],
            totalNumbers: 2000
        },
        representativeUserId: 10,
        representative: {
            id: 10,
            fullName: "Trần Thị B",
            email: "tran.b@71portal.vn",
            avatarUrl: "https://ui-avatars.com/api/?name=Tran+B&background=0033A0&color=fff"
        },
        status: "ACTIVE",
        createdAt: "2026-03-15"
    },
    {
        id: 2,
        code: "UMO-IT-02",
        name: "Khối Công nghệ Thông tin - Nhóm Phần mềm",
        description: "Phát triển và bảo trì phần mềm EVN CDR AS, tích hợp PABX và quản trị lưu lượng cuộc gọi",
        organizationId: 2,
        organizationName: "Khối Công nghệ Thông tin",
        hierarchyPath: ["Tập đoàn Điện lực Việt Nam", "Tổng công ty 71", "Khối CNTT"],
        phonePrefixGroup: {
            id: 102,
            code: "PG-IT-02",
            name: "Nhóm dải số TT Phần mềm EVNICT",
            prefixes: ["43xxx"],
            ranges: [
                { from: "43000", to: "43499", count: 500, note: "Khối Phát triển Phần mềm" },
                { from: "43500", to: "43999", count: 500, note: "Khối Triển khai & Kiểm thử" }
            ],
            totalNumbers: 1000
        },
        representativeUserId: 18,
        representative: {
            id: 18,
            fullName: "Hoàng Văn Tuấn",
            email: "tuan.hv@71portal.vn",
            avatarUrl: "https://ui-avatars.com/api/?name=Hoang+Tuan&background=0284c7&color=fff"
        },
        status: "ACTIVE",
        createdAt: "2026-04-02"
    },
    {
        id: 3,
        code: "UMO-KD-01",
        name: "Khối Kinh doanh & Dịch vụ Khách hàng",
        description: "Tiếp nhận cuộc gọi phản ánh điện lực, quản lý chất lượng CSKH Call Center",
        organizationId: 3,
        organizationName: "Khối Kinh doanh",
        hierarchyPath: ["Tập đoàn Điện lực Việt Nam", "Tổng công ty 71", "Khối Kinh doanh"],
        phonePrefixGroup: {
            id: 103,
            code: "PG-KD-01",
            name: "Nhóm dải số Call Center CSKH",
            prefixes: ["48xxx", "49xxx"],
            ranges: [
                { from: "48000", to: "48999", count: 1000, note: "Tổng đài viên CSKH 1900" },
                { from: "49000", to: "49999", count: 1000, note: "Dịch vụ Điện & Hợp đồng" }
            ],
            totalNumbers: 2000
        },
        representativeUserId: 22,
        representative: {
            id: 22,
            fullName: "Phạm Thu Hương",
            email: "huong.pt@71portal.vn",
            avatarUrl: "https://ui-avatars.com/api/?name=Pham+Huong&background=f59e0b&color=fff"
        },
        status: "ACTIVE",
        createdAt: "2026-04-18"
    },
    {
        id: 4,
        code: "UMO-AUDIT-GLOBAL",
        name: "Tổ Giám sát Kiểm toán Độc lập",
        description: "Nhóm thanh tra kỹ thuật và kiểm toán độc lập cấp Tập đoàn (Nhóm độc lập)",
        organizationId: null,
        organizationName: null,
        hierarchyPath: [],
        phonePrefixGroup: {
            id: 104,
            code: "PG-AUDIT-01",
            name: "Nhóm dải số Ban Kiểm toán",
            prefixes: ["20xxx"],
            ranges: [
                { from: "20000", to: "20499", count: 500, note: "Ban Kiểm toán nội bộ" },
                { from: "20500", to: "20999", count: 500, note: "Thanh tra Giám sát Kỹ thuật" }
            ],
            totalNumbers: 1000
        },
        representativeUserId: 31,
        representative: {
            id: 31,
            fullName: "Nguyễn Hải Nam",
            email: "nam.nh@evn.com.vn",
            avatarUrl: "https://ui-avatars.com/api/?name=Nguyen+Nam&background=64748b&color=fff"
        },
        status: "ACTIVE",
        createdAt: "2026-05-10"
    }
];

const MEMBERS_DATA = [
    // Group 1: UMO-IT-01
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
        status: "LOCKED",
        createdAt: "2026-04-01",
        avatarUrl: "https://ui-avatars.com/api/?name=Tuan+Anh&background=64748b&color=fff"
    },

    // Group 2: UMO-IT-02
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

    // Group 3: UMO-KD-01
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
    currentGroupId: 1,
    viewMode: 'grid',       // 'grid' hoặc 'table'
    searchKeyword: '',
    filterRole: 'all',      // 'all', 'admin', 'member'
    currentPage: 1,
    pageSize: 8
};

// ==========================================================================
// 3. Khởi tạo Giao diện khi tải trang (DOMContentLoaded)
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    initGroupSelector();
    initEventListeners();
    renderCurrentGroup();
});

function initGroupSelector() {
    const groupSelect = document.getElementById('switchGroupSelect');
    if (!groupSelect) return;

    groupSelect.innerHTML = GROUPS_DATA.map(g => `
        <option value="${g.id}" ${g.id === appState.currentGroupId ? 'selected' : ''}>
            ${g.code} - ${g.name}
        </option>
    `).join('');

    groupSelect.addEventListener('change', (e) => {
        appState.currentGroupId = parseInt(e.target.value, 10);
        appState.currentPage = 1;
        renderCurrentGroup();
        showToast(`Đã chuyển sang xem danh bạ nhóm: ${getCurrentGroup().code}`, 'info');
    });
}

function initEventListeners() {
    // 1. Chuyển đổi chế độ xem (Grid vs Table)
    const btnGridView = document.getElementById('btnViewGrid');
    const btnTableView = document.getElementById('btnViewTable');

    if (btnGridView && btnTableView) {
        btnGridView.addEventListener('click', () => setViewMode('grid'));
        btnTableView.addEventListener('click', () => setViewMode('table'));
    }

    // 2. Tìm kiếm danh bạ
    const searchInput = document.getElementById('memberSearchInput');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            appState.searchKeyword = e.target.value.trim().toLowerCase();
            appState.currentPage = 1;
            renderDirectoryContent();
        });
    }

    // 3. Lọc theo vai trò
    const roleFilter = document.getElementById('filterRoleSelect');
    if (roleFilter) {
        roleFilter.addEventListener('change', (e) => {
            appState.filterRole = e.target.value;
            appState.currentPage = 1;
            renderDirectoryContent();
        });
    }

    // 4. Đóng modal khi click ra ngoài backdrop hoặc ấn ESC
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
    const gridContainer = document.getElementById('contactCardsGrid');
    const tableContainer = document.getElementById('contactTableView');

    if (mode === 'grid') {
        btnGridView?.classList.add('active');
        btnTableView?.classList.remove('active');
        if (gridContainer) gridContainer.style.display = 'grid';
        if (tableContainer) tableContainer.classList.remove('active');
    } else {
        btnGridView?.classList.remove('active');
        btnTableView?.classList.add('active');
        if (gridContainer) gridContainer.style.display = 'none';
        if (tableContainer) tableContainer.classList.add('active');
    }

    renderDirectoryContent();
}

function getCurrentGroup() {
    return GROUPS_DATA.find(g => g.id === appState.currentGroupId) || GROUPS_DATA[0];
}

function getGroupMembers() {
    return MEMBERS_DATA.filter(m => m.userGroupId === appState.currentGroupId);
}

// ==========================================================================
// 4. Render Thẻ Tóm tắt Thông tin Nhóm
// ==========================================================================

function renderCurrentGroup() {
    const group = getCurrentGroup();
    const members = getGroupMembers();
    const admins = members.filter(m => m.isGroupAdmin);

    // Title & Codes
    const titleEl = document.getElementById('heroGroupTitle');
    const codeBadge = document.getElementById('heroGroupCode');
    const descEl = document.getElementById('heroGroupDesc');

    if (titleEl) titleEl.innerText = group.name;
    if (codeBadge) codeBadge.innerText = group.code;
    if (descEl) descEl.innerText = group.description;

    // Breadcrumb / Hierarchy
    const breadcrumbEl = document.getElementById('groupHierarchyBreadcrumb');
    if (breadcrumbEl) {
        if (group.organizationId && group.hierarchyPath && group.hierarchyPath.length > 0) {
            breadcrumbEl.innerHTML = group.hierarchyPath.map((p, idx) => `
                <span class="hierarchy-step">${p}</span>
                ${idx < group.hierarchyPath.length - 1 ? '<span class="hierarchy-sep">›</span>' : ''}
            `).join('');
        } else {
            breadcrumbEl.innerHTML = `<span class="standalone-group-pill">Nhóm độc lập (Không gắn đơn vị tổ chức)</span>`;
        }
    }

    // Dải số điện thoại EVN liên kết (Gồm nhiều dải from - to)
    const prefixEl = document.getElementById('heroPrefixBinding');
    if (prefixEl) {
        const pGroup = group.phonePrefixGroup;
        const ranges = pGroup.ranges || [];

        if (ranges.length > 0) {
            prefixEl.innerHTML = `
                <div class="prefix-ranges-box">
                    <div class="prefix-ranges-header">
                        <span class="prefix-group-badge">${pGroup.code}</span>
                        <span class="prefix-total-nums">Tổng ${pGroup.totalNumbers.toLocaleString()} số</span>
                    </div>
                    <div class="prefix-ranges-list">
                        ${ranges.map(r => `
                            <div class="prefix-range-item" title="Dải số: ${r.from} - ${r.to} (${r.count ? r.count.toLocaleString() : (parseInt(r.to, 10) - parseInt(r.from, 10) + 1).toLocaleString()} số)${r.note ? ` • ${r.note}` : ''}">
                                <span class="range-text">
                                    <span class="range-val">${r.from}</span>
                                    <span class="range-sep">-</span>
                                    <span class="range-val">${r.to}</span>
                                </span>
                                <span class="range-pill">${r.count ? r.count.toLocaleString() : (parseInt(r.to, 10) - parseInt(r.from, 10) + 1).toLocaleString()} số</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        } else {
            prefixEl.innerHTML = `
                <span class="fw-600">${pGroup.code}</span>
                <span class="text-muted" style="font-size: 0.775rem;">(${pGroup.prefixes.join(', ')} • ${pGroup.totalNumbers.toLocaleString()} số)</span>
            `;
        }
    }

    // Quản trị viên nhóm (Định dạng đủ danh sách nhưng chỉ trình thông tin vắn tắt: tên, có hoặc không có số điện thoại tùy theo người dùng có nhập không)
    const adminListEl = document.getElementById('heroAdminList') || document.getElementById('heroAdminChips');
    if (adminListEl) {
        if (admins.length > 0) {
            // Sắp xếp: Người đại diện lên đầu tiên, sau đó theo thứ tự tên
            const sortedAdmins = [...admins].sort((a, b) => {
                if (a.id === group.representativeUserId) return -1;
                if (b.id === group.representativeUserId) return 1;
                return a.fullName.localeCompare(b.fullName);
            });

            adminListEl.innerHTML = `
                <div class="group-admin-cards-list">
                    ${sortedAdmins.map(a => {
                const isRep = a.id === group.representativeUserId;
                const phoneParts = [];
                if (a.phoneNumber && a.phoneNumber.trim()) {
                    const rawPhone = a.phoneNumber.replace(/[^0-9]/g, '');
                    phoneParts.push(`<a href="tel:${rawPhone}" onclick="event.stopPropagation()" class="admin-brief-phone-link" title="Điện thoại">${a.phoneNumber}</a>`);
                }
                const hasPhone = phoneParts.length > 0;

                return `
                            <div class="group-admin-card-item ${isRep ? 'representative' : ''}" onclick="openViewMemberModal(${a.id})" title="Nhấp để xem chi tiết ${a.fullName}">
                                <div class="admin-brief-header">
                                    <div class="admin-brief-name-box">
                                        <strong class="admin-brief-name">${a.fullName}</strong>
                                        ${isRep ? `<span class="badge-admin-rep-mini" title="Người đại diện nhóm">★ Đại diện</span>` : ''}
                                    </div>
                                </div>
                                ${hasPhone ? `
                                    <div class="admin-brief-phone-row">
                                        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2">
                                            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
                                        </svg>
                                        <span class="admin-brief-phones">
                                            ${phoneParts.join('<span class="phone-sep">•</span>')}
                                        </span>
                                    </div>
                                ` : ''}
                            </div>
                        `;
            }).join('')}
                </div>
            `;
        } else {
            adminListEl.innerHTML = `<span class="text-muted" style="font-size: 0.8125rem;">Chưa có quản trị viên</span>`;
        }
    }

    // Representative (Fallback nếu còn element heroRepresentative)
    const repEl = document.getElementById('heroRepresentative');
    if (repEl) {
        const rep = group.representative || (admins[0] || null);
        if (rep) {
            repEl.innerHTML = `
                <img src="${rep.avatarUrl || 'https://ui-avatars.com/api/?name=Admin'}" style="width: 22px; height: 22px; border-radius: 50%;">
                <span>${rep.fullName}</span>
                <span class="text-muted" style="font-size: 0.75rem;">(${rep.email})</span>
            `;
        } else {
            repEl.innerText = 'Chưa chỉ định';
        }
    }

    // KPI Badges in Summary Grid
    const countTotal = document.getElementById('kpiTotalMembers');
    const countAdmins = document.getElementById('kpiTotalAdmins');

    if (countTotal) countTotal.innerText = members.length;
    if (countAdmins) countAdmins.innerText = admins.length;

    // Table / Card count badge
    const countBadge = document.getElementById('directoryCountBadge');
    if (countBadge) countBadge.innerText = `${members.length} thành viên`;

    renderDirectoryContent();
}

// ==========================================================================
// 5. Render Nội dung Danh bạ (Thẻ Cards hoặc Bảng Table)
// ==========================================================================

function renderDirectoryContent() {
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

    const emptyState = document.getElementById('directoryEmptyState');
    const gridContainer = document.getElementById('contactCardsGrid');
    const tableContainer = document.getElementById('contactTableView');

    // Empty state
    if (members.length === 0) {
        if (gridContainer) gridContainer.innerHTML = '';
        const tbody = document.getElementById('contactTableBody');
        if (tbody) tbody.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
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
        renderCardGrid(pageMembers);
    } else {
        renderTableView(pageMembers);
    }

    renderPagination(total, totalPages);
}

// Render Card Grid View
function renderCardGrid(members) {
    const gridContainer = document.getElementById('contactCardsGrid');
    if (!gridContainer) return;

    gridContainer.innerHTML = members.map(m => {
        const isGroupRep = getCurrentGroup().representativeUserId === m.id;

        return `
            <div class="contact-card" data-user-id="${m.id}">
                <div>
                    <!-- Top: Avatar & Basic Info -->
                    <div class="contact-card-top">
                        <img src="${m.avatarUrl}" alt="${m.fullName}" class="contact-avatar">
                        <div class="contact-info">
                            <h4 class="contact-name" title="${m.fullName}">
                                ${m.fullName}
                                ${isGroupRep ? '<span title="Người đại diện nhóm" style="color: #f59e0b; font-size: 0.85rem;">★</span>' : ''}
                            </h4>
                            <p class="contact-title" title="${m.title || 'Chưa cập nhật'}">
                                ${m.title || 'Thành viên'}
                            </p>
                            <div class="contact-badges">
                                ${m.isGroupAdmin
                ? `<span class="badge-group-role admin">★ Quản trị nhóm</span>`
                : `<span class="badge-group-role member">Thành viên</span>`
            }
                            </div>
                        </div>
                    </div>

                    <!-- Meta Details: SĐT EVN, Điện thoại & Email (Trình bày đồng nhất giống email) -->
                    <div class="contact-meta-list">
                        <div class="contact-meta-row" title="Điện thoại">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                                <rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect>
                                <line x1="12" y1="18" x2="12.01" y2="18"></line>
                            </svg>
                            <span>${m.phoneNumber ? `<a href="tel:${m.phoneNumber.replace(/[^0-9]/g, '')}">${m.phoneNumber}</a>` : '—'}</span>
                        </div>
                        <div class="contact-meta-row" title="Email">
                            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                                <polyline points="22,6 12,13 2,6"></polyline>
                            </svg>
                            <a href="mailto:${m.email}">${m.email}</a>
                        </div>
                    </div>
                </div>

                <!-- Footer Quick Actions -->
                <div class="contact-card-footer">
                    <a href="mailto:${m.email}" class="btn-card-action" title="Gửi Email">
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                            <polyline points="22,6 12,13 2,6"></polyline>
                        </svg>
                        Gửi Email
                    </a>
                    <button type="button" class="btn-card-action" onclick="openViewMemberModal(${m.id})" title="Xem chi tiết">
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                        Chi tiết
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

// Render Table View
function renderTableView(members) {
    const tbody = document.getElementById('contactTableBody');
    if (!tbody) return;

    tbody.innerHTML = members.map(m => {
        const isGroupRep = getCurrentGroup().representativeUserId === m.id;

        return `
            <tr>
                <td>
                    <div style="display: flex; align-items: center; gap: 10px;">
                        <img src="${m.avatarUrl}" style="width: 32px; height: 32px; border-radius: 50%;" alt="${m.fullName}">
                        <div>
                            <strong style="color: var(--text-main); font-size: 0.875rem;">
                                ${m.fullName}
                                ${isGroupRep ? '<span title="Người đại diện nhóm" style="color: #f59e0b; font-size: 0.8rem;">★</span>' : ''}
                            </strong>
                            <span style="font-size: 0.75rem; color: var(--text-muted); display: block;">@${m.username}</span>
                        </div>
                    </div>
                </td>
                <td>
                    ${m.phoneNumber ? `<a href="tel:${m.phoneNumber.replace(/[^0-9]/g, '')}" style="color: var(--text-main); text-decoration: none;">${m.phoneNumber}</a>` : '—'}
                </td>
                <td>
                    ${m.isGroupAdmin
                ? `<span class="badge-group-role admin">★ Quản trị nhóm</span>`
                : `<span class="badge-group-role member">Thành viên</span>`
            }
                </td>
                <td style="text-align: right;">
                    <button type="button" class="btn-icon-detail" onclick="openViewMemberModal(${m.id})" title="Xem chi tiết">
                        <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                            <circle cx="12" cy="12" r="3"></circle>
                        </svg>
                    </button>
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
                renderDirectoryContent();
            }
        };
    }

    if (nextBtn) {
        nextBtn.disabled = appState.currentPage >= totalPages;
        nextBtn.onclick = () => {
            if (appState.currentPage < totalPages) {
                appState.currentPage++;
                renderDirectoryContent();
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
    renderDirectoryContent();
}

// ==========================================================================
// 6. Tiện ích & Modal Chi tiết
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

    document.getElementById('viewMemberGroupName').innerText = `${group.code} - ${group.name}`;
    document.getElementById('viewMemberTitle').innerText = member.title || 'Chưa cập nhật';
    document.getElementById('viewMemberPhone').innerText = member.phoneNumber || 'Chưa cập nhật';
    document.getElementById('viewMemberEmail').innerText = member.email;

    openModal('viewMemberModal');
}

function exportDirectoryCSV() {
    const group = getCurrentGroup();
    const members = getGroupMembers();

    let csv = "HoTen,ChucVu,DienThoai,Email,VaiTroTrongNhom\n";
    members.forEach(m => {
        csv += `"${m.fullName}","${m.title || ''}","${m.phoneNumber || ''}","${m.email}","${m.isGroupAdmin ? 'Admin' : 'Member'}"\n`;
    });

    const blob = new Blob(["\uFEFF" + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Danh_ba_nhom_${group.code}_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`Đã tải xuống danh bạ nhóm ${group.code}`, 'success');
}

function showToast(message, type = 'info') {
    const existing = document.querySelector('.member-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `member-toast ${type}`;
    toast.innerHTML = `<span style="font-weight: 500;">${message}</span>`;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3200);
}
