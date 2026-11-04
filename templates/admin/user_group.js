// templates/user_group.js

// Mock data initialized with the 4 core business rules:
// 1. Nhóm chứa nhiều thành viên (1 - N)
// 2. Nhóm có ít nhất một Quản trị viên nhóm (Group Admin Safeguard)
// 3. Nhóm liên kết với một nhóm đầu số điện thoại theo ràng buộc 1 - 1
// 4. Tham chiếu Cây tổ chức: 1 đơn vị có nhiều nhóm, hoặc nhóm độc lập (organization_id = null)

let userGroupsData = [
    {
        id: 1,
        code: "UMO-IT-01",
        name: "Khối Công nghệ Thông tin - Nhóm Vận hành",
        description: "Quản trị hệ thống máy chủ, hạ tầng mạng và giám sát tổng đài",
        organizationId: 2,
        organizationName: "Khối Công nghệ Thông tin",
        hierarchyPath: ["Tập đoàn Điện lực Việt Nam", "Tổng công ty 71", "Khối CNTT"],
        phonePrefixGroup: {
            id: 101,
            code: "PG-IT-01",
            name: "Nhóm dải số Khối CNTT (Trụ sở chính)",
            prefixes: ["42xxx", "46xxx"],
            totalNumbers: 2000
        },
        userCount: 45,
        representativeUserId: 10,
        representative: {
            id: 10,
            fullName: "Trần Thị B",
            email: "tran.b@71portal.vn",
            avatarUrl: "https://ui-avatars.com/api/?name=Tran+B&background=0033A0&color=fff"
        },
        admins: [
            { id: 10, fullName: "Trần Thị B", email: "tran.b@71portal.vn", isRep: true, avatarUrl: "https://ui-avatars.com/api/?name=Tran+B&background=0033A0&color=fff" },
            { id: 15, fullName: "Lê Văn C", email: "le.c@71portal.vn", isRep: false, avatarUrl: "https://ui-avatars.com/api/?name=Le+C&background=10b981&color=fff" }
        ],
        allowRecordingAccess: true,
        status: "ACTIVE",
        createdAt: "2026-03-15"
    },
    {
        id: 2,
        code: "UMO-IT-02",
        name: "Khối Công nghệ Thông tin - Nhóm Phần mềm",
        description: "Phát triển và bảo trì phần mềm lõi EVN CDR AS",
        organizationId: 2,
        organizationName: "Khối Công nghệ Thông tin",
        hierarchyPath: ["Tập đoàn Điện lực Việt Nam", "Tổng công ty 71", "Khối CNTT"],
        phonePrefixGroup: {
            id: 102,
            code: "PG-IT-02",
            name: "Nhóm dải số TT Phần mềm EVNICT",
            prefixes: ["43xxx"],
            totalNumbers: 1000
        },
        userCount: 32,
        representativeUserId: 18,
        representative: {
            id: 18,
            fullName: "Hoàng Văn Tuấn",
            email: "tuan.hv@71portal.vn",
            avatarUrl: "https://ui-avatars.com/api/?name=Hoang+Tuan&background=0284c7&color=fff"
        },
        admins: [
            { id: 18, fullName: "Hoàng Văn Tuấn", email: "tuan.hv@71portal.vn", isRep: true, avatarUrl: "https://ui-avatars.com/api/?name=Hoang+Tuan&background=0284c7&color=fff" }
        ],
        allowRecordingAccess: false,
        status: "ACTIVE",
        createdAt: "2026-04-02"
    },
    {
        id: 3,
        code: "UMO-KD-01",
        name: "Khối Kinh doanh & Dịch vụ Khách hàng",
        description: "Tiếp nhận cuộc gọi phản ánh điện lực và chăm sóc khách hàng",
        organizationId: 3,
        organizationName: "Khối Kinh doanh",
        hierarchyPath: ["Tập đoàn Điện lực Việt Nam", "Tổng công ty 71", "Khối Kinh doanh"],
        phonePrefixGroup: {
            id: 103,
            code: "PG-KD-01",
            name: "Nhóm dải số Call Center CSKH",
            prefixes: ["48xxx", "49xxx"],
            totalNumbers: 2000
        },
        userCount: 68,
        representativeUserId: 22,
        representative: {
            id: 22,
            fullName: "Phạm Thu Hương",
            email: "huong.pt@71portal.vn",
            avatarUrl: "https://ui-avatars.com/api/?name=Pham+Huong&background=f59e0b&color=fff"
        },
        admins: [
            { id: 22, fullName: "Phạm Thu Hương", email: "huong.pt@71portal.vn", isRep: true, avatarUrl: "https://ui-avatars.com/api/?name=Pham+Huong&background=f59e0b&color=fff" },
            { id: 25, fullName: "Đặng Quốc Huy", email: "huy.dq@71portal.vn", isRep: false, avatarUrl: "https://ui-avatars.com/api/?name=Dang+Huy&background=6366f1&color=fff" }
        ],
        allowRecordingAccess: true,
        status: "ACTIVE",
        createdAt: "2026-04-18"
    },
    {
        id: 4,
        code: "UMO-AUDIT-GLOBAL",
        name: "Tổ Giám sát Kiểm toán Độc lập",
        description: "Nhóm thanh tra kỹ thuật và kiểm toán độc lập cấp Tập đoàn",
        organizationId: null, // Nhóm độc lập không tham chiếu đơn vị
        organizationName: null,
        hierarchyPath: [],
        phonePrefixGroup: {
            id: 104,
            code: "PG-AUDIT-01",
            name: "Nhóm dải số Ban Kiểm toán",
            prefixes: ["20xxx"],
            totalNumbers: 1000
        },
        userCount: 12,
        representativeUserId: 31,
        representative: {
            id: 31,
            fullName: "Nguyễn Hải Nam",
            email: "nam.nh@evn.com.vn",
            avatarUrl: "https://ui-avatars.com/api/?name=Nguyen+Nam&background=64748b&color=fff"
        },
        admins: [
            { id: 31, fullName: "Nguyễn Hải Nam", email: "nam.nh@evn.com.vn", isRep: true, avatarUrl: "https://ui-avatars.com/api/?name=Nguyen+Nam&background=64748b&color=fff" }
        ],
        allowRecordingAccess: false,
        status: "ACTIVE",
        createdAt: "2026-05-10"
    },
    {
        id: 5,
        code: "UMO-EXPERT-SEC",
        name: "Tổ Chuyên gia SOC An toàn Thông tin",
        description: "Đội ngũ chuyên trách bảo mật trực ca 24/7 toàn hệ thống",
        organizationId: null, // Nhóm độc lập không tham chiếu đơn vị
        organizationName: null,
        hierarchyPath: [],
        phonePrefixGroup: {
            id: 105,
            code: "PG-SEC-01",
            name: "Nhóm dải số SOC Security Desk",
            prefixes: ["21xxx"],
            totalNumbers: 1000
        },
        userCount: 8,
        representativeUserId: 40,
        representative: {
            id: 40,
            fullName: "Vũ Minh Trí",
            email: "tri.vm@soc.evn.vn",
            avatarUrl: "https://ui-avatars.com/api/?name=Vu+Tri&background=dc2626&color=fff"
        },
        admins: [
            { id: 40, fullName: "Vũ Minh Trí", email: "tri.vm@soc.evn.vn", isRep: true, avatarUrl: "https://ui-avatars.com/api/?name=Vu+Tri&background=dc2626&color=fff" }
        ],
        status: "ACTIVE",
        createdAt: "2026-06-01"
    },
    {
        id: 6,
        code: "UMO-DRAFT-TEST",
        name: "Nhóm Thử nghiệm Trạm Biến áp 500kV",
        description: "Nhóm dự án kỹ thuật trạm TBA đang chuẩn bị vận hành (chưa có thành viên)",
        organizationId: 2,
        organizationName: "Khối Công nghệ Thông tin",
        hierarchyPath: ["Tập đoàn Điện lực Việt Nam", "Tổng công ty 71", "Khối CNTT"],
        phonePrefixGroup: {
            id: 106,
            code: "PG-TBA-500",
            name: "Nhóm dải số TBA 500kV Thường Tín",
            prefixes: ["41xxx"],
            totalNumbers: 1000
        },
        userCount: 0, // Nhóm rỗng để kiểm tra kịch bản cho phép xóa
        representativeUserId: 50,
        representative: {
            id: 50,
            fullName: "Bùi Quang Huy",
            email: "huy.bq@71portal.vn",
            avatarUrl: "https://ui-avatars.com/api/?name=Bui+Huy&background=0033A0&color=fff"
        },
        admins: [
            { id: 50, fullName: "Bùi Quang Huy", email: "huy.bq@71portal.vn", isRep: true, avatarUrl: "https://ui-avatars.com/api/?name=Bui+Huy&background=0033A0&color=fff" }
        ],
        status: "INACTIVE",
        createdAt: "2026-07-20"
    }
];

// Danh mục tất cả nhóm đầu số để mô phỏng kiểm tra tính khả dụng 1 - 1
const allPhonePrefixGroups = [
    { id: 101, code: "PG-IT-01", name: "Nhóm dải số Khối CNTT (Trụ sở chính)", prefixes: ["42xxx", "46xxx"], count: 2000 },
    { id: 102, code: "PG-IT-02", name: "Nhóm dải số TT Phần mềm EVNICT", prefixes: ["43xxx"], count: 1000 },
    { id: 103, code: "PG-KD-01", name: "Nhóm dải số Call Center CSKH", prefixes: ["48xxx", "49xxx"], count: 2000 },
    { id: 104, code: "PG-AUDIT-01", name: "Nhóm dải số Ban Kiểm toán", prefixes: ["20xxx"], count: 1000 },
    { id: 105, code: "PG-SEC-01", name: "Nhóm dải số SOC Security Desk", prefixes: ["21xxx"], count: 1000 },
    { id: 106, code: "PG-TBA-500", name: "Nhóm dải số TBA 500kV Thường Tín", prefixes: ["41xxx"], count: 1000 },
    // Các nhóm đầu số còn trống chưa ai liên kết:
    { id: 107, code: "PG-GENCO-01", name: "Nhóm dải số Nhà máy điện Phả Lại", prefixes: ["15xxx"], count: 1000 },
    { id: 108, code: "PG-NPC-01", name: "Nhóm dải số Tổng công ty Điện lực miền Bắc", prefixes: ["91xxx"], count: 2000 },
    { id: 109, code: "PG-CPC-01", name: "Nhóm dải số Tổng công ty Điện lực miền Trung", prefixes: ["93xxx"], count: 1000 }
];

let activeTab = 'list';
let currentManagingGroupId = null;

document.addEventListener('DOMContentLoaded', function () {
    renderStats();
    renderUserGroupsTable();
    setupEventListeners();
});

function setupEventListeners() {
    // Search & Filters
    const searchInput = document.getElementById('searchGroupInput');
    const orgFilter = document.getElementById('filterOrgSelect');
    const statusFilter = document.getElementById('filterStatusSelect');

    if (searchInput) searchInput.addEventListener('input', applyFilters);
    if (orgFilter) orgFilter.addEventListener('change', applyFilters);
    if (statusFilter) statusFilter.addEventListener('change', applyFilters);

    // Close modal on click outside backdrop or ESC key
    window.addEventListener('click', function (e) {
        if (e.target.classList && e.target.classList.contains('modal')) {
            e.target.classList.remove('show');
            document.body.style.overflow = '';
        }
    });

    window.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal.show').forEach(m => {
                m.classList.remove('show');
            });
            document.body.style.overflow = '';
        }
    });
}

function renderStats() {
    const totalGroups = userGroupsData.length;
    const activeGroups = userGroupsData.filter(g => g.status === 'ACTIVE').length;
    const inactiveGroups = userGroupsData.filter(g => g.status === 'INACTIVE').length;
    const totalMembers = userGroupsData.reduce((sum, g) => sum + g.userCount, 0);

    const elTotal = document.getElementById('statTotalGroups');
    const elActive = document.getElementById('statActiveGroups');
    const elInactive = document.getElementById('statInactiveGroups');
    const elMembers = document.getElementById('statTotalMembers');

    if (elTotal) elTotal.innerText = totalGroups;
    if (elActive) elActive.innerText = activeGroups;
    if (elInactive) elInactive.innerText = inactiveGroups;
    if (elMembers) elMembers.innerText = totalMembers;
}

function applyFilters() {
    const keyword = (document.getElementById('searchGroupInput')?.value || '').toLowerCase().trim();
    const orgFilterVal = document.getElementById('filterOrgSelect')?.value || 'all';
    const statusFilterVal = document.getElementById('filterStatusSelect')?.value || 'all';

    const filtered = userGroupsData.filter(group => {
        // Keyword check
        const matchKeyword = !keyword ||
            group.code.toLowerCase().includes(keyword) ||
            group.name.toLowerCase().includes(keyword) ||
            group.phonePrefixGroup.code.toLowerCase().includes(keyword) ||
            (group.organizationName && group.organizationName.toLowerCase().includes(keyword));

        // Org check
        let matchOrg = true;
        if (orgFilterVal === 'standalone') {
            matchOrg = group.organizationId === null;
        } else if (orgFilterVal !== 'all') {
            matchOrg = group.organizationId === parseInt(orgFilterVal, 10);
        }

        // Status check
        let matchStatus = true;
        if (statusFilterVal !== 'all') {
            matchStatus = group.status === statusFilterVal;
        }

        return matchKeyword && matchOrg && matchStatus;
    });

    renderUserGroupsTable(filtered);
}

function renderUserGroupsTable(data = userGroupsData) {
    const tbody = document.getElementById('userGroupsTableBody');
    if (!tbody) return;

    if (data.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-4 text-muted">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" style="width: 40px; height: 40px; margin-bottom: 8px; opacity: 0.5;"><circle cx="12" cy="12" r="10"></circle><line x1="8" y1="12" x2="16" y2="12"></line></svg>
                    <p>Không tìm thấy nhóm người dùng nào phù hợp với bộ lọc</p>
                </td>
            </tr>
        `;
        return;
    }

    tbody.innerHTML = data.map(group => {
        // Chỉ hiển thị tên tổ chức liên kết, không liệt kê cây phân cấp
        let orgContent = '';
        if (group.organizationId) {
            orgContent = `
                <div style="display: flex; align-items: center; gap: 8px;">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px; color: var(--primary); flex-shrink: 0;"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>
                    <span class="fw-600 text-main" style="font-size: 0.9rem;">${group.organizationName}</span>
                </div>
            `;
        } else {
            orgContent = `
                <span class="badge-standalone">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 13px; height: 13px;"><rect x="4" y="4" width="16" height="16" rx="2"></rect><line x1="9" y1="15" x2="15" y2="15"></line></svg>
                    Nhóm độc lập (Toàn HT)
                </span>
            `;
        }

        // Member Count (1-N)
        const memberContent = `
            <span class="member-count-badge" onclick="openViewMembersModal(${group.id})" title="Bấm để xem danh sách ${group.userCount} thành viên">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 14px; height: 14px;"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                ${group.userCount} thành viên
            </span>
        `;

        return `
            <tr>
                <td>
                    <div class="group-title-cell">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <span class="group-code">${group.code}</span>
                            <span class="badge-status ${group.status === 'ACTIVE' ? 'active' : 'inactive'}">${group.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm dừng'}</span>
                            ${group.allowRecordingAccess
                                ? `<span class="badge-recording" title="Đã kích hoạt quyền Ghi âm thoại (Tầng 1 - BR-UG-05)"><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg> Ghi âm</span>`
                                : ''
                            }
                        </div>
                        <span class="group-name" style="cursor: pointer; color: var(--primary);" onclick="openGroupDetailModal(${group.id})" title="Bấm để xem chi tiết nhóm">${group.name}</span>
                        <span class="group-desc" title="${group.description}">${group.description}</span>
                    </div>
                </td>
                <td>${orgContent}</td>
                <td>${memberContent}</td>
                <td class="text-right" style="white-space: nowrap; width: 230px;">
                    <div class="action-btn-group">
                        <button class="action-btn view-btn" onclick="openGroupDetailModal(${group.id})" title="Xem chi tiết nhóm">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                        </button>
                        <button class="action-btn" onclick="openManageAdminsModal(${group.id})" title="Phân quyền Quản trị viên nhóm">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                        </button>
                        ${group.status === 'ACTIVE' ? `
                        <button class="action-btn status-btn suspend-btn" onclick="openToggleStatusModal(${group.id})" title="Tạm ngưng hoạt động nhóm">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="10" y1="15" x2="10" y2="9"></line><line x1="14" y1="15" x2="14" y2="9"></line></svg>
                        </button>
                        ` : `
                        <button class="action-btn status-btn activate-btn" onclick="openToggleStatusModal(${group.id})" title="Kích hoạt lại nhóm">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                        </button>
                        `}
                        <button class="action-btn edit-btn" onclick="openEditGroupModal(${group.id})" title="Chỉnh sửa thông tin nhóm">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        <button class="action-btn delete-btn" onclick="openDeleteGroupModal(${group.id})" title="Xóa nhóm người dùng">
                            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderOrgGroupedView() {
    const container = document.getElementById('orgGroupedContainer');
    if (!container) return;

    // Phân loại nhóm theo đơn vị tổ chức và nhóm độc lập
    const orgMap = {};
    const standaloneGroups = [];

    userGroupsData.forEach(g => {
        if (!g.organizationId) {
            standaloneGroups.push(g);
        } else {
            if (!orgMap[g.organizationId]) {
                orgMap[g.organizationId] = {
                    orgName: g.organizationName,
                    hierarchyPath: g.hierarchyPath,
                    groups: []
                };
            }
            orgMap[g.organizationId].groups.push(g);
        }
    });

    let html = '';

    // Render các đơn vị có nhiều nhóm
    for (const orgId in orgMap) {
        const item = orgMap[orgId];
        html += `
            <div class="org-group-block">
                <div class="org-group-header">
                    <div class="org-group-title">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>
                        <span>${item.orgName}</span>
                        <span class="badge-count" style="font-size: 0.75rem;">${item.groups.length} nhóm trực thuộc</span>
                    </div>
                    <div class="hierarchy-breadcrumb" style="font-size: 0.75rem;">
                        ${item.hierarchyPath.join(' &gt; ')}
                    </div>
                </div>
                <div class="org-groups-list">
                    ${item.groups.map(g => renderGroupCard(g)).join('')}
                </div>
            </div>
        `;
    }

    // Render nhóm độc lập
    if (standaloneGroups.length > 0) {
        html += `
            <div class="org-group-block" style="border-left: 4px solid #64748b;">
                <div class="org-group-header" style="background: rgba(100, 116, 139, 0.08);">
                    <div class="org-group-title standalone">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"></rect><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                        <span>🏢 Nhóm Độc lập / Chưa phân bổ vào Cây tổ chức</span>
                        <span class="badge-count" style="font-size: 0.75rem;">${standaloneGroups.length} nhóm</span>
                    </div>
                    <span class="text-muted" style="font-size: 0.75rem;">(organization_id = NULL)</span>
                </div>
                <div class="org-groups-list">
                    ${standaloneGroups.map(g => renderGroupCard(g)).join('')}
                </div>
            </div>
        `;
    }

    container.innerHTML = html;
}

function renderGroupCard(group) {
    return `
        <div class="ug-card-item">
            <div class="ug-card-header">
                <div>
                    <span class="group-code">${group.code}</span>
                    <h4 style="margin-top: 4px; font-size: 0.92rem; color: var(--text-main); font-weight: 600;">${group.name}</h4>
                </div>
                <span class="badge-status ${group.status === 'ACTIVE' ? 'active' : 'inactive'}">${group.status === 'ACTIVE' ? 'Hoạt động' : 'Tạm dừng'}</span>
            </div>
            <div class="ug-card-body">
                <div>
                    <span class="prefix-badge-binding">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                        ${group.phonePrefixGroup.code}: ${group.phonePrefixGroup.prefixes.join(', ')} (1-1)
                    </span>
                </div>
                <div class="ug-card-metric-row">
                    <span>Quản trị viên:</span>
                    <span class="fw-600 text-main" onclick="openManageAdminsModal(${group.id})" style="cursor: pointer; color: var(--primary);">
                        ${group.admins.length} QTV (${group.representative.fullName})
                    </span>
                </div>
                <div class="ug-card-metric-row">
                    <span>Thành viên trực thuộc:</span>
                    <span class="fw-600 text-main">${group.userCount} người dùng</span>
                </div>
            </div>
            <div class="ug-card-actions">
                <button class="btn btn-sm btn-outline" onclick="openManageAdminsModal(${group.id})">Quản trị viên</button>
                <button class="btn btn-sm btn-outline" onclick="openEditGroupModal(${group.id})">Sửa</button>
                <button class="btn btn-sm btn-outline text-danger" onclick="openDeleteGroupModal(${group.id})">Xóa</button>
            </div>
        </div>
    `;
}

// Modal Handlers
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

function openGroupDetailModal(groupId) {
    const group = userGroupsData.find(g => g.id === groupId);
    if (!group) return;

    // Set code, name, status, org, desc
    const codeEl = document.getElementById('detailGroupCode');
    const nameEl = document.getElementById('detailGroupName');
    const statusEl = document.getElementById('detailGroupStatus');
    const orgEl = document.getElementById('detailGroupOrg');
    const descEl = document.getElementById('detailGroupDesc');

    if (codeEl) codeEl.innerText = group.code;
    if (nameEl) nameEl.innerText = group.name;
    if (statusEl) {
        statusEl.innerHTML = group.status === 'ACTIVE'
            ? `<span class="badge-status active">Hoạt động</span>`
            : `<span class="badge-status inactive">Tạm dừng</span>`;
    }

    if (orgEl) {
        if (group.organizationId) {
            orgEl.innerHTML = `
                <div class="org-hierarchy-cell">
                    <span class="fw-600">${group.organizationName}</span>
                    <div class="hierarchy-breadcrumb" style="margin-top: 4px;">
                        ${group.hierarchyPath.map((item, index) => {
                            const isLast = index === group.hierarchyPath.length - 1;
                            return `<span class="${isLast ? 'current' : 'root'}">${item}</span>${!isLast ? '<span class="arrow">&gt;</span>' : ''}`;
                        }).join('')}
                    </div>
                </div>
            `;
        } else {
            orgEl.innerHTML = `
                <span class="badge-standalone">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 13px; height: 13px;"><rect x="4" y="4" width="16" height="16" rx="2"></rect><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                    Nhóm độc lập (Toàn hệ thống - Không gắn đơn vị)
                </span>
            `;
        }
    }

    if (descEl) descEl.innerText = group.description || 'Chưa có ghi chú / mô tả phạm vi chức năng.';

    // Quyền ghi âm thoại IP (Chốt chặn Tầng 1 - BR-UG-05)
    const recEl = document.getElementById('detailGroupRecording');
    if (recEl) {
        recEl.innerHTML = group.allowRecordingAccess
            ? `<span class="badge-recording" style="font-size: 0.8125rem; padding: 4px 10px;">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>
                Đã kích hoạt quyền Ghi âm (Chốt chặn Tầng 1 mở)
               </span>`
            : `<span style="font-size: 0.8125rem; color: var(--text-muted); font-style: italic;">Chưa cấp phép</span>`;
    }

    // 1. Nhóm đầu số viễn thông (Ràng buộc 1 - 1)
    const prefixCardEl = document.getElementById('detailGroupPrefixCard');
    if (prefixCardEl) {
        const ppg = group.phonePrefixGroup;
        prefixCardEl.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
                    <div>
                        <span class="fw-600" style="color: var(--primary); font-size: 0.95rem;">${ppg.code}</span>
                        <span style="margin: 0 6px; color: var(--border);">|</span>
                        <strong style="color: var(--text-main); font-size: 0.9rem;">${ppg.name}</strong>
                    </div>
                    <span class="text-muted" style="font-size: 0.8rem; font-weight: 500;">Quy mô: <strong>${ppg.totalNumbers.toLocaleString()}</strong> số máy</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                    <span class="text-muted" style="font-size: 0.8rem;">Các dải số liên kết:</span>
                    ${ppg.prefixes.map(p => `<span class="prefix-sub-tag" style="font-size: 0.78rem; padding: 2px 8px;">${p}</span>`).join('')}
                </div>
                <div class="badge-1to1-note" style="margin-top: 4px; padding: 8px 12px; font-size: 0.78rem; background: var(--surface);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 15px; height: 15px; flex-shrink: 0;"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                    <span>Toàn bộ lưu lượng thoại, luồng dữ liệu CDR và phân bổ thuê bao của nhóm được ràng buộc độc quyền 1-1 với nhóm đầu số này.</span>
                </div>
            </div>
        `;
    }

    // 2. Quản trị viên nhóm (Group Admins)
    const adminCountEl = document.getElementById('detailAdminCountBadge');
    if (adminCountEl) adminCountEl.innerText = `${group.admins.length} Quản trị viên`;

    const adminsListEl = document.getElementById('detailGroupAdminsList');
    if (adminsListEl) {
        adminsListEl.innerHTML = group.admins.map(admin => `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${admin.avatarUrl}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">
                    <div>
                        <div style="font-weight: 600; font-size: 0.85rem; color: var(--text-main);">${admin.fullName}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${admin.email}</div>
                    </div>
                </div>
                ${admin.isRep ? `<span class="rep-badge" style="font-size: 0.72rem; padding: 2px 8px; background: rgba(0, 51, 160, 0.1); color: var(--primary); border-radius: 4px; font-weight: 600;">Đại diện chính</span>` : `<span class="text-muted" style="font-size: 0.75rem;">Đồng quản trị</span>`}
            </div>
        `).join('');
    }

    // Modal action buttons
    const editBtn = document.getElementById('detailEditGroupBtn');
    if (editBtn) {
        editBtn.onclick = function() {
            closeModal('groupDetailModal');
            openEditGroupModal(group.id);
        };
    }

    const manageAdminsBtn = document.getElementById('detailManageAdminsBtn');
    if (manageAdminsBtn) {
        manageAdminsBtn.onclick = function() {
            closeModal('groupDetailModal');
            openManageAdminsModal(group.id);
        };
    }

    const toggleStatusBtn = document.getElementById('detailToggleStatusBtn');
    if (toggleStatusBtn) {
        if (group.status === 'ACTIVE') {
            toggleStatusBtn.className = 'btn btn-outline';
            toggleStatusBtn.style.color = '#d97706';
            toggleStatusBtn.style.borderColor = 'rgba(217, 119, 6, 0.35)';
            toggleStatusBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="10" y1="15" x2="10" y2="9"></line><line x1="14" y1="15" x2="14" y2="9"></line></svg>
                <span>Tạm ngưng nhóm</span>
            `;
        } else {
            toggleStatusBtn.className = 'btn btn-outline';
            toggleStatusBtn.style.color = '#059669';
            toggleStatusBtn.style.borderColor = 'rgba(16, 185, 129, 0.35)';
            toggleStatusBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                <span>Kích hoạt nhóm</span>
            `;
        }
        toggleStatusBtn.onclick = function() {
            closeModal('groupDetailModal');
            openToggleStatusModal(group.id);
        };
    }

    openModal('groupDetailModal');
}

function openCreateGroupModal() {
    document.getElementById('modalTitle').innerText = 'Thiết lập Nhóm người dùng mới';
    document.getElementById('groupForm').reset();
    document.getElementById('groupIdInput').value = '';
    const recInput = document.getElementById('groupAllowRecordingInput');
    if (recInput) recInput.checked = false;

    populatePrefixGroupSelect(null);
    openModal('userGroupModal');
}

function openEditGroupModal(groupId) {
    const group = userGroupsData.find(g => g.id === groupId);
    if (!group) return;

    document.getElementById('modalTitle').innerText = 'Chỉnh sửa Nhóm người dùng';
    document.getElementById('groupIdInput').value = group.id;
    document.getElementById('groupCodeInput').value = group.code;
    document.getElementById('groupNameInput').value = group.name;
    document.getElementById('groupDescInput').value = group.description || '';
    document.getElementById('groupStatusSelect').value = group.status;
    const recInput = document.getElementById('groupAllowRecordingInput');
    if (recInput) recInput.checked = !!group.allowRecordingAccess;

    // Set organization: null hoặc ID
    const orgSelect = document.getElementById('groupOrgSelect');
    if (orgSelect) {
        orgSelect.value = group.organizationId !== null ? String(group.organizationId) : 'null';
    }

    populatePrefixGroupSelect(group.phonePrefixGroup.id);
    openModal('userGroupModal');
}

function populatePrefixGroupSelect(selectedId) {
    const select = document.getElementById('groupPrefixSelect');
    if (!select) return;

    // Tìm các prefix group đã bị nhóm khác sử dụng
    const occupiedIds = userGroupsData
        .filter(g => g.phonePrefixGroup && g.phonePrefixGroup.id !== selectedId)
        .map(g => g.phonePrefixGroup.id);

    select.innerHTML = '<option value="">-- Chọn Nhóm đầu số điện thoại (Liên kết 1-1) --</option>';

    allPhonePrefixGroups.forEach(ppg => {
        const isOccupied = occupiedIds.includes(ppg.id);
        const isCurrent = selectedId === ppg.id;

        const opt = document.createElement('option');
        opt.value = ppg.id;
        opt.disabled = isOccupied;
        opt.selected = isCurrent;
        opt.textContent = `${ppg.code} - ${ppg.name} (${ppg.prefixes.join(', ')}) ${isOccupied ? ' [ĐÃ ĐƯỢC GÁN]' : ' [KHẢ DỤNG]'}`;
        select.appendChild(opt);
    });
}

function saveUserGroup() {
    const groupId = document.getElementById('groupIdInput').value;
    const code = document.getElementById('groupCodeInput').value.trim();
    const name = document.getElementById('groupNameInput').value.trim();
    const desc = document.getElementById('groupDescInput').value.trim();
    const orgVal = document.getElementById('groupOrgSelect').value;
    const prefixId = parseInt(document.getElementById('groupPrefixSelect').value, 10);
    const status = document.getElementById('groupStatusSelect').value;
    const allowRecordingAccess = !!document.getElementById('groupAllowRecordingInput')?.checked;

    if (!code || !name) {
        showToast('Vui lòng điền mã nhóm và tên nhóm', 'error');
        return;
    }

    if (!prefixId) {
        showToast('Vui lòng chọn nhóm đầu số điện thoại liên kết 1-1', 'error');
        return;
    }

    // Kiểm tra ràng buộc 1 - 1
    const conflictGroup = userGroupsData.find(g =>
        g.phonePrefixGroup &&
        g.phonePrefixGroup.id === prefixId &&
        (!groupId || g.id !== parseInt(groupId, 10))
    );

    if (conflictGroup) {
        showToast(`Nhóm đầu số này đã liên kết với "${conflictGroup.name}" theo ràng buộc 1-1!`, 'error');
        return;
    }

    const selectedPPG = allPhonePrefixGroups.find(p => p.id === prefixId);
    const orgId = orgVal === 'null' ? null : parseInt(orgVal, 10);

    let orgName = null;
    let hierarchyPath = [];
    if (orgId === 2) {
        orgName = 'Khối Công nghệ Thông tin';
        hierarchyPath = ['Tập đoàn Điện lực Việt Nam', 'Tổng công ty 71', 'Khối CNTT'];
    } else if (orgId === 3) {
        orgName = 'Khối Kinh doanh';
        hierarchyPath = ['Tập đoàn Điện lực Việt Nam', 'Tổng công ty 71', 'Khối Kinh doanh'];
    } else if (orgId === 4) {
        orgName = 'Điện lực Thanh Xuân';
        hierarchyPath = ['Tập đoàn Điện lực Việt Nam', 'EVNHANOI', 'Điện lực Thanh Xuân'];
    }

    if (groupId) {
        // Cập nhật
        const idx = userGroupsData.findIndex(g => g.id === parseInt(groupId, 10));
        if (idx !== -1) {
            userGroupsData[idx].code = code;
            userGroupsData[idx].name = name;
            userGroupsData[idx].description = desc;
            userGroupsData[idx].organizationId = orgId;
            userGroupsData[idx].organizationName = orgName;
            userGroupsData[idx].hierarchyPath = hierarchyPath;
            userGroupsData[idx].phonePrefixGroup = {
                id: selectedPPG.id,
                code: selectedPPG.code,
                name: selectedPPG.name,
                prefixes: selectedPPG.prefixes,
                totalNumbers: selectedPPG.count
            };
            userGroupsData[idx].allowRecordingAccess = allowRecordingAccess;
            userGroupsData[idx].status = status;
            showToast('Cập nhật nhóm người dùng thành công', 'success');
        }
    } else {
        // Thêm mới
        const newGroup = {
            id: Date.now(),
            code: code,
            name: name,
            description: desc,
            organizationId: orgId,
            organizationName: orgName,
            hierarchyPath: hierarchyPath,
            phonePrefixGroup: {
                id: selectedPPG.id,
                code: selectedPPG.code,
                name: selectedPPG.name,
                prefixes: selectedPPG.prefixes,
                totalNumbers: selectedPPG.count
            },
            allowRecordingAccess: allowRecordingAccess,
            userCount: 1, // Ban đầu có 1 user admin
            representativeUserId: 99,
            representative: {
                id: 99,
                fullName: "Quản trị viên Khởi tạo",
                email: "admin.init@evn.com.vn",
                avatarUrl: "https://ui-avatars.com/api/?name=Admin+Init&background=0033A0&color=fff"
            },
            admins: [
                {
                    id: 99,
                    fullName: "Quản trị viên Khởi tạo",
                    email: "admin.init@evn.com.vn",
                    isRep: true,
                    avatarUrl: "https://ui-avatars.com/api/?name=Admin+Init&background=0033A0&color=fff"
                }
            ],
            status: status,
            createdAt: new Date().toISOString().split('T')[0]
        };
        userGroupsData.unshift(newGroup);
        showToast('Thiết lập nhóm người dùng mới thành công', 'success');
    }

    closeModal('userGroupModal');
    renderStats();
    renderUserGroupsTable();
    if (activeTab === 'tree') renderOrgGroupedView();
}

// Manage Group Admins Modal
function openManageAdminsModal(groupId) {
    currentManagingGroupId = groupId;
    const group = userGroupsData.find(g => g.id === groupId);
    if (!group) return;

    document.getElementById('adminModalGroupName').innerText = `${group.name} (${group.code})`;
    renderAdminsListInModal(group);
    openModal('groupAdminsModal');
}

function renderAdminsListInModal(group) {
    const listEl = document.getElementById('modalAdminsList');
    if (!listEl) return;

    const adminCount = group.admins.length;

    listEl.innerHTML = group.admins.map(admin => {
        const isOnlyAdmin = adminCount <= 1;

        return `
            <div class="modal-admin-item">
                <div class="modal-admin-info">
                    <img src="${admin.avatarUrl}" alt="${admin.fullName}">
                    <div>
                        <div class="d-flex align-items-center gap-2">
                            <span class="fw-600">${admin.fullName}</span>
                            ${admin.isRep ? '<span class="badge" style="background: var(--primary-light); color: var(--primary); font-size: 0.7rem; padding: 2px 6px;">Đại diện chính</span>' : ''}
                        </div>
                        <span class="text-muted" style="font-size: 0.78rem;">${admin.email}</span>
                    </div>
                </div>
                <div>
                    <button class="btn btn-sm btn-outline text-danger" 
                            onclick="demoteAdmin(${group.id}, ${admin.id})"
                            ${isOnlyAdmin ? 'disabled title="Không thể hạ quyền Quản trị viên duy nhất của nhóm (Ràng buộc tối thiểu 1 Admin)" style="opacity: 0.5; cursor: not-allowed;"' : 'title="Hạ quyền về người dùng thành viên thường"'}>
                        Hạ quyền
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function demoteAdmin(groupId, adminId) {
    const group = userGroupsData.find(g => g.id === groupId);
    if (!group) return;

    // Kiểm tra quy tắc bảo toàn Quản trị viên nhóm: BR-UG-02
    if (group.admins.length <= 1) {
        showToast('Nhóm người dùng bắt buộc phải có ít nhất 1 Quản trị viên nhóm. Không thể hạ quyền người cuối cùng!', 'error');
        return;
    }

    group.admins = group.admins.filter(a => a.id !== adminId);
    // Nếu người bị hạ quyền là đại diện chính, chuyển quyền đại diện cho admin đầu tiên còn lại
    if (group.representativeUserId === adminId && group.admins.length > 0) {
        group.representativeUserId = group.admins[0].id;
        group.representative = {
            id: group.admins[0].id,
            fullName: group.admins[0].fullName,
            email: group.admins[0].email,
            avatarUrl: group.admins[0].avatarUrl
        };
        group.admins[0].isRep = true;
    }

    showToast('Đã hạ quyền Quản trị viên thành công', 'success');
    renderAdminsListInModal(group);
    renderStats();
    renderUserGroupsTable();
    if (activeTab === 'tree') renderOrgGroupedView();
}

function promoteNewAdmin() {
    if (!currentManagingGroupId) return;
    const group = userGroupsData.find(g => g.id === currentManagingGroupId);
    if (!group) return;

    const emailInput = document.getElementById('newAdminEmailInput');
    const email = (emailInput?.value || '').trim();

    if (!email) {
        showToast('Vui lòng nhập email tài khoản thành viên để bổ nhiệm', 'error');
        return;
    }

    // Giả lập bổ nhiệm user
    const newAdmin = {
        id: Date.now(),
        fullName: email.split('@')[0].toUpperCase(),
        email: email,
        isRep: false,
        avatarUrl: `https://ui-avatars.com/api/?name=${email.substring(0, 2)}&background=10b981&color=fff`
    };

    group.admins.push(newAdmin);
    emailInput.value = '';

    showToast(`Đã bổ nhiệm ${newAdmin.fullName} làm Quản trị viên nhóm`, 'success');
    renderAdminsListInModal(group);
    renderStats();
    renderUserGroupsTable();
    if (activeTab === 'tree') renderOrgGroupedView();
}

// View Members Modal
function openViewMembersModal(groupId) {
    const group = userGroupsData.find(g => g.id === groupId);
    if (!group) return;

    document.getElementById('memberModalGroupName').innerText = `${group.name} (${group.code})`;
    document.getElementById('memberModalCount').innerText = `${group.userCount} thành viên`;

    const listEl = document.getElementById('modalMembersList');
    if (!listEl) return;

    if (group.userCount === 0) {
        listEl.innerHTML = `
            <div class="text-center py-4 text-muted">
                <p>Nhóm này hiện chưa có thành viên nào.</p>
            </div>
        `;
    } else {
        // Render danh sách thành viên giả lập
        let html = '';
        for (let i = 1; i <= Math.min(group.userCount, 6); i++) {
            const isAdmin = i <= group.admins.length;
            html += `
                <div class="modal-admin-item">
                    <div class="modal-admin-info">
                        <img src="https://ui-avatars.com/api/?name=Member+${i}&background=0033A0&color=fff">
                        <div>
                            <span class="fw-600">Thành viên ${group.code}-${i}</span>
                            <span class="text-muted d-block" style="font-size: 0.75rem;">user.${i}@${group.code.toLowerCase()}.evn.vn</span>
                        </div>
                    </div>
                    <div>
                        ${isAdmin ? '<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #059669; font-size: 0.72rem;">Quản trị viên</span>' : '<span class="badge" style="background: var(--bg-hover); color: var(--text-muted); font-size: 0.72rem;">Thành viên</span>'}
                    </div>
                </div>
            `;
        }
        if (group.userCount > 6) {
            html += `<p class="text-center text-muted" style="font-size: 0.8rem; margin-top: 8px; grid-column: 1 / -1;">... và ${group.userCount - 6} thành viên khác.</p>`;
        }
        listEl.innerHTML = html;
    }

    openModal('groupMembersModal');
}

// Delete Group Modal with Safeguard
let deletingGroupId = null;

function openDeleteGroupModal(groupId) {
    deletingGroupId = groupId;
    const group = userGroupsData.find(g => g.id === groupId);
    if (!group) return;

    document.getElementById('deleteGroupName').innerText = `${group.name} (${group.code})`;
    const warningBox = document.getElementById('deleteSafeguardWarning');
    const confirmBtn = document.getElementById('confirmDeleteBtn');

    // Kiểm tra quy tắc xóa: nếu còn thành viên (userCount > 0), chặn xóa!
    if (group.userCount > 0) {
        warningBox.style.display = 'flex';
        warningBox.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <div>
                <strong>Không thể xóa nhóm này!</strong>
                <p style="margin: 2px 0 0 0; font-size: 0.78rem;">Nhóm đang có ${group.userCount} người dùng thành viên trực thuộc (Vi phạm BR-UG-01). Do người dùng gắn cố định và không thể chuyển nhóm, vui lòng xóa hết tài khoản thành viên hoặc chuyển trạng thái nhóm sang Tạm ngưng.</p>
            </div>
        `;
        confirmBtn.disabled = true;
        confirmBtn.style.opacity = '0.4';
        confirmBtn.style.cursor = 'not-allowed';
    } else {
        warningBox.style.display = 'none';
        confirmBtn.disabled = false;
        confirmBtn.style.opacity = '1';
        confirmBtn.style.cursor = 'pointer';
    }

    openModal('deleteGroupModal');
}

function confirmDeleteGroup() {
    if (!deletingGroupId) return;

    const group = userGroupsData.find(g => g.id === deletingGroupId);
    if (!group || group.userCount > 0) {
        showToast('Không thể xóa nhóm khi còn thành viên!', 'error');
        return;
    }

    // Xóa nhóm và giải phóng liên kết 1-1 nhóm đầu số
    const ppgCode = group.phonePrefixGroup.code;
    userGroupsData = userGroupsData.filter(g => g.id !== deletingGroupId);

    closeModal('deleteGroupModal');
    showToast(`Đã xóa nhóm thành công. Nhóm đầu số ${ppgCode} đã được giải phóng về trạng thái sẵn sàng.`, 'success');

    renderStats();
    renderUserGroupsTable();
    if (activeTab === 'tree') renderOrgGroupedView();
}

// Toggle Status Modal (Tạm ngưng / Kích hoạt Nhóm người dùng)
let targetStatusGroupId = null;

function openToggleStatusModal(groupId) {
    targetStatusGroupId = groupId;
    const group = userGroupsData.find(g => g.id === groupId);
    if (!group) return;

    const isCurrentlyActive = group.status === 'ACTIVE';

    // Populate Column 1: Thông tin nhóm
    const nameEl = document.getElementById('statusModalGroupName');
    const codeEl = document.getElementById('statusModalGroupCode');
    const badgeEl = document.getElementById('statusModalCurrentBadge');
    const orgEl = document.getElementById('statusModalOrgName');
    const memberEl = document.getElementById('statusModalMemberCount');
    const prefixEl = document.getElementById('statusModalPrefixGroup');

    if (nameEl) nameEl.innerText = group.name;
    if (codeEl) codeEl.innerText = group.code;
    if (badgeEl) {
        badgeEl.innerHTML = isCurrentlyActive
            ? `<span class="badge-status active">Đang hoạt động</span>`
            : `<span class="badge-status inactive">Đang tạm dừng</span>`;
    }
    if (orgEl) orgEl.innerText = group.organizationName || 'Nhóm độc lập toàn HT';
    if (memberEl) memberEl.innerText = `${group.userCount} người dùng`;
    if (prefixEl) prefixEl.innerText = `${group.phonePrefixGroup.code} (${group.phonePrefixGroup.prefixes.join(', ')})`;

    // Populate Column 2: Tiêu đề, Cảnh báo & Nút xác nhận
    const titleEl = document.getElementById('toggleStatusModalTitle');
    const impactEl = document.getElementById('statusModalImpactBox');
    const reasonLabelEl = document.getElementById('toggleStatusReasonLabel');
    const reasonInputEl = document.getElementById('toggleStatusReasonInput');
    const confirmBtn = document.getElementById('confirmToggleStatusBtn');

    if (reasonInputEl) reasonInputEl.value = '';

    if (isCurrentlyActive) {
        // TẠM NGƯNG
        if (titleEl) {
            titleEl.innerHTML = `
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#d97706" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="10" y1="15" x2="10" y2="9"></line><line x1="14" y1="15" x2="14" y2="9"></line></svg>
                <span>Tạm ngưng hoạt động Nhóm người dùng</span>
            `;
        }
        if (impactEl) {
            impactEl.innerHTML = `
                <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 8px; padding: 12px 14px;">
                    <strong style="color: #d97706; font-size: 0.85rem; display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                        Tác động khi Tạm ngưng nhóm:
                    </strong>
                    <ul style="margin: 0; padding-left: 18px; font-size: 0.8rem; color: var(--text-muted); line-height: 1.5;">
                        <li>Khóa tạm thời quyền truy cập và thao tác nghiệp vụ của <strong>${group.userCount} thành viên</strong>.</li>
                        <li>Tạm dừng phát sinh cuộc gọi mới trên nhóm đầu số PABX <strong>${group.phonePrefixGroup.code}</strong>.</li>
                        <li>Dữ liệu lịch sử và nhật ký CDR cũ vẫn được bảo lưu nguyên vẹn. Ràng buộc 1-1 không bị hủy.</li>
                    </ul>
                </div>
            `;
        }
        if (reasonLabelEl) {
            reasonLabelEl.innerHTML = `Lý do tạm ngưng hoạt động <span class="text-danger">*</span>`;
        }
        if (reasonInputEl) {
            reasonInputEl.placeholder = 'VD: Quyết định số 48/QĐ-EVN tạm ngưng phục vụ bảo trì nâng cấp hệ thống...';
        }
        if (confirmBtn) {
            confirmBtn.className = 'btn btn-warning';
            confirmBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;"><circle cx="12" cy="12" r="10"></circle><line x1="10" y1="15" x2="10" y2="9"></line><line x1="14" y1="15" x2="14" y2="9"></line></svg>
                Xác nhận Tạm ngưng nhóm
            `;
        }
    } else {
        // KÍCH HOẠT LẠI
        if (titleEl) {
            titleEl.innerHTML = `
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#10b981" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>Kích hoạt lại Nhóm người dùng</span>
            `;
        }
        if (impactEl) {
            impactEl.innerHTML = `
                <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 8px; padding: 12px 14px;">
                    <strong style="color: #059669; font-size: 0.85rem; display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        Tác động khi Kích hoạt lại nhóm:
                    </strong>
                    <ul style="margin: 0; padding-left: 18px; font-size: 0.8rem; color: var(--text-muted); line-height: 1.5;">
                        <li>Khôi phục toàn bộ quyền truy cập và phân quyền của <strong>${group.userCount} thành viên</strong> và Quản trị viên.</li>
                        <li>Mở lại lưu lượng thoại và tiếp tục ghi nhận dữ liệu CDR trên nhóm đầu số <strong>${group.phonePrefixGroup.code}</strong>.</li>
                        <li>Nhóm sẵn sàng tiếp nhận thêm thành viên mới bình thường.</li>
                    </ul>
                </div>
            `;
        }
        if (reasonLabelEl) {
            reasonLabelEl.innerHTML = `Căn cứ / Ghi chú kích hoạt lại <span class="text-danger">*</span>`;
        }
        if (reasonInputEl) {
            reasonInputEl.placeholder = 'VD: Hoàn tất công tác bảo trì kỹ thuật, kích hoạt lại theo thông báo số 18/TB-CNTT...';
        }
        if (confirmBtn) {
            confirmBtn.className = 'btn btn-primary';
            confirmBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;"><polyline points="20 6 9 17 4 12"></polyline></svg>
                Xác nhận Kích hoạt nhóm
            `;
        }
    }

    openModal('toggleStatusModal');
}

function confirmToggleStatus() {
    if (!targetStatusGroupId) return;

    const group = userGroupsData.find(g => g.id === targetStatusGroupId);
    if (!group) return;

    const reason = (document.getElementById('toggleStatusReasonInput')?.value || '').trim();
    if (!reason) {
        showToast('Vui lòng nhập lý do / căn cứ thay đổi trạng thái nhóm', 'error');
        return;
    }

    const wasActive = group.status === 'ACTIVE';
    group.status = wasActive ? 'INACTIVE' : 'ACTIVE';

    closeModal('toggleStatusModal');

    showToast(
        group.status === 'ACTIVE'
            ? `Đã kích hoạt lại nhóm "${group.name}" thành công`
            : `Đã tạm ngưng hoạt động nhóm "${group.name}"`,
        'success'
    );

    applyFilters();
    renderStats();
}

// Toast notification
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = '';
    if (type === 'success') {
        icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    } else {
        icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    }

    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-message">${message}</div>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}
