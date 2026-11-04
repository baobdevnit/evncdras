/**
 * ==========================================================================
 * PERMISSIONS MANAGEMENT SCRIPT - EVN CDR AS
 * Quản trị quyền hạn toàn hệ thống (System Administrator Only)
 * ==========================================================================
 */

// Initial Seed Data (Định nghĩa chuẩn theo Database Schema & Backend NestJS)
const DEFAULT_PERMISSIONS = [
    // 1. Quản lý Dữ liệu CDR (DATA)
    {
        id: 1,
        code: "cdr:view",
        name: "Xem dữ liệu & Log CDR",
        category: "DATA",
        categoryName: "Quản lý Dữ liệu CDR",
        description: "Cho phép tra cứu danh sách cuộc gọi, chi tiết lịch sử cuộc gọi và nhật ký CDR viễn thông toàn mạng.",
        scope: "BOTH",
        isSensitive: false,
        appliedRolesCount: 4,
        backendRoute: "GET /api/v1/cdr, GET /api/v1/cdr/:id"
    },
    {
        id: 2,
        code: "cdr:filter_advanced",
        name: "Bộ lọc CDR nâng cao",
        category: "DATA",
        categoryName: "Quản lý Dữ liệu CDR",
        description: "Sử dụng các bộ lọc chuyên sâu như IP PABX, nguyên nhân ngắt kết nối (Disconnection code), dải đầu số viễn thông.",
        scope: "BOTH",
        isSensitive: false,
        appliedRolesCount: 3,
        backendRoute: "POST /api/v1/cdr/query-advanced"
    },
    {
        id: 3,
        code: "qos:view",
        name: "Phân tích chất lượng QoS",
        category: "DATA",
        categoryName: "Quản lý Dữ liệu CDR",
        description: "Xem biểu đồ phân tích độ trễ (delay), jitter, tỷ lệ mất gói tin (packet loss) và chỉ số chất lượng MOS.",
        scope: "BOTH",
        isSensitive: false,
        appliedRolesCount: 3,
        backendRoute: "GET /api/v1/qos/metrics, GET /api/v1/qos/stream"
    },
    {
        id: 4,
        code: "report:view",
        name: "Xem báo cáo thống kê",
        category: "DATA",
        categoryName: "Quản lý Dữ liệu CDR",
        description: "Truy cập và xem các báo cáo tổng hợp lưu lượng, thời lượng thoại và hiệu suất cuộc gọi định kỳ theo đơn vị.",
        scope: "BOTH",
        isSensitive: false,
        appliedRolesCount: 4,
        backendRoute: "GET /api/v1/reports/summary"
    },
    {
        id: 5,
        code: "report:export",
        name: "Xuất dữ liệu & Báo cáo",
        category: "DATA",
        categoryName: "Quản lý Dữ liệu CDR",
        description: "Xuất dữ liệu cuộc gọi và báo cáo ra các định dạng Excel, CSV, PDF phục vụ đối soát và lưu trữ hồ sơ.",
        scope: "BOTH",
        isSensitive: false,
        appliedRolesCount: 2,
        backendRoute: "POST /api/v1/reports/export"
    },

    // 2. Quyền Đặc biệt & Giám sát (SPECIAL)
    {
        id: 6,
        code: "cdr:listen_audio",
        name: "Nghe ghi âm cuộc gọi",
        category: "SPECIAL",
        categoryName: "Quyền Đặc biệt & Giám sát",
        description: "Nghe trực tuyến các file ghi âm cuộc gọi trên giao diện. Cần kiểm soát nghiêm ngặt theo quy định ATTT EVN.",
        scope: "BOTH",
        isSensitive: true,
        appliedRolesCount: 1,
        backendRoute: "GET /api/v1/cdr/audio/:id/stream"
    },
    {
        id: 7,
        code: "cdr:download_audio",
        name: "Tải file ghi âm cuộc gọi",
        category: "SPECIAL",
        categoryName: "Quyền Đặc biệt & Giám sát",
        description: "Tải các tập tin âm thanh ghi âm cuộc gọi (MP3/WAV) về thiết bị người dùng. Lưu vết audit log bắt buộc.",
        scope: "BOTH",
        isSensitive: true,
        appliedRolesCount: 1,
        backendRoute: "GET /api/v1/cdr/audio/:id/download"
    },
    {
        id: 9,
        code: "prefix:manage",
        name: "Quản lý & Cấp phát đầu số",
        category: "SPECIAL",
        categoryName: "Quyền Đặc biệt & Giám sát",
        description: "Cấu hình, phân bổ và thu hồi các dải số điện thoại cố định và nội bộ giữa các công ty điện lực thành viên.",
        scope: "ADMIN",
        isSensitive: true,
        appliedRolesCount: 2,
        backendRoute: "ALL /api/v1/prefixes/*"
    },

    // 3. Quản lý Người dùng & Phân quyền (USER_MGMT)
    {
        id: 11,
        code: "user:view",
        name: "Xem danh sách người dùng",
        category: "USER_MGMT",
        categoryName: "Quản lý Người dùng & Đơn vị",
        description: "Xem danh sách tài khoản người dùng, đơn vị công tác và trạng thái hoạt động trong hệ thống.",
        scope: "BOTH",
        isSensitive: false,
        appliedRolesCount: 4,
        backendRoute: "GET /api/v1/users"
    },
    {
        id: 12,
        code: "user:create",
        name: "Tạo mới tài khoản người dùng",
        category: "USER_MGMT",
        categoryName: "Quản lý Người dùng & Đơn vị",
        description: "Khởi tạo tài khoản người dùng mới (System Admin tạo toàn hệ thống; Group Admin chỉ tạo trong nhóm).",
        scope: "BOTH",
        isSensitive: false,
        appliedRolesCount: 2,
        backendRoute: "POST /api/v1/users"
    },
    {
        id: 13,
        code: "user:edit",
        name: "Chỉnh sửa người dùng",
        category: "USER_MGMT",
        categoryName: "Quản lý Người dùng & Đơn vị",
        description: "Cập nhật thông tin tài khoản, chức danh, vai trò người dùng (không được đổi nhóm cố định).",
        scope: "BOTH",
        isSensitive: false,
        appliedRolesCount: 2,
        backendRoute: "PUT /api/v1/users/:id"
    },
    {
        id: 14,
        code: "user:delete",
        name: "Khóa / Đình chỉ người dùng",
        category: "USER_MGMT",
        categoryName: "Quản lý Người dùng & Đơn vị",
        description: "Đình chỉ hoặc khóa tài khoản vi phạm chính sách an toàn thông tin hoặc đã chuyển công tác.",
        scope: "BOTH",
        isSensitive: false,
        appliedRolesCount: 2,
        backendRoute: "DELETE /api/v1/users/:id"
    },
    {
        id: 15,
        code: "org:manage",
        name: "Quản lý cơ cấu tổ chức",
        category: "USER_MGMT",
        categoryName: "Quản lý Người dùng & Đơn vị",
        description: "Thêm mới, cập nhật hoặc cơ cấu lại cây danh mục đơn vị tổ chức Điện lực từ cấp Tổng công ty đến Chi nhánh.",
        scope: "ADMIN",
        isSensitive: false,
        appliedRolesCount: 2,
        backendRoute: "ALL /api/v1/organizations/*"
    },
    {
        id: 16,
        code: "role:manage",
        name: "Quản lý vai trò & Phân quyền",
        category: "USER_MGMT",
        categoryName: "Quản lý Người dùng & Đơn vị",
        description: "Tạo lập vai trò mới, cấu hình ma trận gán quyền hạn chức năng cho từng vai trò người dùng.",
        scope: "ADMIN",
        isSensitive: false,
        appliedRolesCount: 1,
        backendRoute: "ALL /api/v1/roles/*, PUT /api/v1/permissions/matrix"
    },

    // 4. Quản trị Hệ thống (SYSTEM)
    {
        id: 17,
        code: "system:manage",
        name: "Cài đặt & Cấu hình hệ thống",
        category: "SYSTEM",
        categoryName: "Quản trị Hệ thống",
        description: "Cấu hình kết nối PABX, tham số máy chủ CDR, thời hạn lưu trữ dữ liệu (Retention policy) và cổng kết nối.",
        scope: "ADMIN",
        isSensitive: true,
        appliedRolesCount: 1,
        backendRoute: "ALL /api/v1/settings/*"
    },
    {
        id: 18,
        code: "audit:view",
        name: "Tra cứu nhật ký kiểm toán (Audit Log)",
        category: "SYSTEM",
        categoryName: "Quản trị Hệ thống",
        description: "Tra cứu và phân tích lịch sử thao tác của các quản trị viên và người dùng, bảo đảm truy vết an toàn thông tin.",
        scope: "ADMIN",
        isSensitive: false,
        appliedRolesCount: 2,
        backendRoute: "GET /api/v1/audit-logs"
    }
];

// Danh mục định nghĩa các phân nhóm chuẩn
const CATEGORY_DEFINITIONS = {
    "DATA": {
        name: "Quản lý Dữ liệu CDR",
        badgeClass: "data",
        icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>'
    },
    "SPECIAL": {
        name: "Quyền Đặc biệt & Giám sát",
        badgeClass: "special",
        icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>'
    },
    "USER_MGMT": {
        name: "Quản lý Người dùng & Đơn vị",
        badgeClass: "user-mgmt",
        icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>'
    },
    "SYSTEM": {
        name: "Quản trị Hệ thống",
        badgeClass: "system",
        icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>'
    }
};

// Global State
let permissionsState = [];
let currentFilter = {
    keyword: "",
    category: "ALL",
    securityTier: "ALL"
};
let currentViewMode = "grouped"; // 'grouped' or 'table'
let editingPermissionCode = null;

// Initialize on DOM load
document.addEventListener("DOMContentLoaded", () => {
    initPermissionsData();
    setupEventListeners();
    renderPermissions();
    updateMetrics();
});

/**
 * Khởi tạo dữ liệu từ LocalStorage hoặc dữ liệu mặc định
 */
function initPermissionsData() {
    const saved = localStorage.getItem("evn_system_permissions");
    if (saved) {
        try {
            permissionsState = JSON.parse(saved);
        } catch (e) {
            console.error("Lỗi parse quyền hạn:", e);
            permissionsState = JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS));
        }
    } else {
        permissionsState = JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS));
        savePermissionsToStorage();
    }
}

function savePermissionsToStorage() {
    localStorage.setItem("evn_system_permissions", JSON.stringify(permissionsState));
}

/**
 * Thiết lập các sự kiện giao diện
 */
function setupEventListeners() {
    // 1. Tìm kiếm từ khóa
    const searchInput = document.getElementById("permissionSearchInput");
    const clearBtn = document.getElementById("searchClearBtn");

    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            currentFilter.keyword = e.target.value.trim().toLowerCase();
            if (clearBtn) {
                clearBtn.style.display = currentFilter.keyword ? "block" : "none";
            }
            renderPermissions();
        });
    }

    if (clearBtn && searchInput) {
        clearBtn.addEventListener("click", () => {
            searchInput.value = "";
            currentFilter.keyword = "";
            clearBtn.style.display = "none";
            searchInput.focus();
            renderPermissions();
        });
    }

    // 2. Lọc theo Phân nhóm dropdown
    const categorySelect = document.getElementById("categoryFilterSelect");
    if (categorySelect) {
        categorySelect.addEventListener("change", (e) => {
            currentFilter.category = e.target.value;
            syncQuickFilterChips(e.target.value);
            renderPermissions();
        });
    }

    // 3. Lọc theo Mức độ bảo mật
    const securitySelect = document.getElementById("securityFilterSelect");
    if (securitySelect) {
        securitySelect.addEventListener("change", (e) => {
            currentFilter.securityTier = e.target.value;
            renderPermissions();
        });
    }

    // 4. Quick filter chips
    const filterChips = document.querySelectorAll(".quick-filter-chip");
    filterChips.forEach(chip => {
        chip.addEventListener("click", () => {
            const cat = chip.getAttribute("data-category");
            currentFilter.category = cat;
            if (categorySelect) categorySelect.value = cat;
            syncQuickFilterChips(cat);
            renderPermissions();
        });
    });

    // 5. Chuyển đổi View Mode (Gom nhóm vs Bảng tổng hợp)
    const btnGrouped = document.getElementById("viewModeGrouped");
    const btnTable = document.getElementById("viewModeTable");

    if (btnGrouped && btnTable) {
        btnGrouped.addEventListener("click", () => {
            currentViewMode = "grouped";
            btnGrouped.classList.add("active");
            btnTable.classList.remove("active");
            renderPermissions();
        });

        btnTable.addEventListener("click", () => {
            currentViewMode = "table";
            btnTable.classList.add("active");
            btnGrouped.classList.remove("active");
            renderPermissions();
        });
    }

    // 6. Form Submit chỉnh sửa quyền
    const editForm = document.getElementById("editPermissionForm");
    if (editForm) {
        editForm.addEventListener("submit", handleSavePermissionForm);
    }
}

function syncQuickFilterChips(selectedCategory) {
    const filterChips = document.querySelectorAll(".quick-filter-chip");
    filterChips.forEach(chip => {
        if (chip.getAttribute("data-category") === selectedCategory) {
            chip.classList.add("active");
        } else {
            chip.classList.remove("active");
        }
    });
}

/**
 * Lọc danh sách quyền theo tiêu chí tìm kiếm hiện tại
 */
function getFilteredPermissions() {
    return permissionsState.filter(item => {
        // Keyword
        if (currentFilter.keyword) {
            const kw = currentFilter.keyword;
            const matchCode = item.code.toLowerCase().includes(kw);
            const matchName = item.name.toLowerCase().includes(kw);
            const matchDesc = item.description.toLowerCase().includes(kw);
            if (!matchCode && !matchName && !matchDesc) return false;
        }

        // Category
        if (currentFilter.category !== "ALL") {
            if (item.category !== currentFilter.category) return false;
        }

        // Security Tier
        if (currentFilter.securityTier === "SPECIAL" && !item.isSensitive) return false;
        if (currentFilter.securityTier === "STANDARD" && item.isSensitive) return false;

        return true;
    });
}

/**
 * Cập nhật số liệu KPI thống kê
 */
function updateMetrics() {
    const totalCount = permissionsState.length;
    const specialCount = permissionsState.filter(p => p.isSensitive).length;
    const categoriesCount = Object.keys(CATEGORY_DEFINITIONS).length;

    const elTotal = document.getElementById("metricTotalPermissions");
    const elSpecial = document.getElementById("metricSpecialPermissions");
    const elCategories = document.getElementById("metricTotalCategories");

    if (elTotal) elTotal.textContent = totalCount;
    if (elSpecial) elSpecial.textContent = specialCount;
    if (elCategories) elCategories.textContent = categoriesCount;

    // Cập nhật số lượng trên các chip lọc
    Object.keys(CATEGORY_DEFINITIONS).forEach(catKey => {
        const chipCount = permissionsState.filter(p => p.category === catKey).length;
        const chipEl = document.querySelector(`.quick-filter-chip[data-category="${catKey}"] .chip-count`);
        if (chipEl) chipEl.textContent = chipCount;
    });

    const chipAll = document.querySelector('.quick-filter-chip[data-category="ALL"] .chip-count');
    if (chipAll) chipAll.textContent = totalCount;
}

/**
 * Render toàn bộ danh sách quyền ra màn hình
 */
function renderPermissions() {
    const filtered = getFilteredPermissions();
    const container = document.getElementById("permissionsDisplayContainer");
    const countDisplay = document.getElementById("filteredCountDisplay");

    if (countDisplay) {
        countDisplay.textContent = `Hiển thị ${filtered.length} trên tổng số ${permissionsState.length} quyền hạn`;
    }

    if (!container) return;

    if (filtered.length === 0) {
        container.innerHTML = `
            <div class="empty-permissions-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <h4>Không tìm thấy quyền hạn phù hợp</h4>
                <p>Thử điều chỉnh lại từ khóa tìm kiếm hoặc bộ lọc phân nhóm hiện tại.</p>
                <button class="btn btn-outline btn-sm" onclick="resetFilters()">Đặt lại bộ lọc</button>
            </div>
        `;
        return;
    }

    if (currentViewMode === "grouped") {
        renderGroupedView(filtered, container);
    } else {
        renderTableView(filtered, container);
    }
}

/**
 * Hiển thị dạng nhóm chức năng (Grouped View)
 */
function renderGroupedView(items, container) {
    // Gom nhóm theo category
    const grouped = {};
    Object.keys(CATEGORY_DEFINITIONS).forEach(catKey => {
        grouped[catKey] = [];
    });

    items.forEach(item => {
        if (!grouped[item.category]) {
            grouped[item.category] = [];
        }
        grouped[item.category].push(item);
    });

    let html = `<div class="permissions-groups-container">`;

    Object.keys(CATEGORY_DEFINITIONS).forEach(catKey => {
        const catItems = grouped[catKey] || [];
        if (catItems.length === 0 && currentFilter.category !== "ALL") return;

        const catDef = CATEGORY_DEFINITIONS[catKey] || {
            name: catKey,
            badgeClass: "system",
            icon: ""
        };

        html += `
            <div class="permission-group-card" id="groupCard-${catKey}">
                <div class="permission-group-header" onclick="toggleGroupCollapse('${catKey}')">
                    <div class="group-header-title">
                        <span class="badge-category ${catDef.badgeClass}">
                            ${catDef.icon}
                            ${catDef.name}
                        </span>
                        <span class="group-count">${catItems.length} quyền hạn</span>
                    </div>
                    <div class="group-header-actions">
                        <svg class="group-toggle-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </div>
                </div>
                <div class="permission-group-body">
                    ${catItems.length === 0 ? `
                        <div style="padding: 24px; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
                            Không có quyền nào trong nhóm này khớp với bộ lọc.
                        </div>
                    ` : `
                        <table class="permissions-table">
                            <thead>
                                <tr>
                                    <th style="width: 22%;">Mã quyền (Code)</th>
                                    <th style="width: 26%;">Tên quyền</th>
                                    <th style="width: 34%;">Mô tả chức năng</th>
                                    <th style="width: 10%; text-align: center;">Phạm vi</th>
                                    <th style="width: 8%; text-align: right;">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                ${catItems.map(p => renderPermissionRow(p)).join("")}
                            </tbody>
                        </table>
                    `}
                </div>
            </div>
        `;
    });

    html += `</div>`;
    container.innerHTML = html;
}

/**
 * Hiển thị dạng bảng phẳng tổng hợp (Flat Table View)
 */
function renderTableView(items, container) {
    let html = `
        <div class="card permissions-table-card">
            <div class="card-body no-padding" style="overflow-x: auto;">
                <table class="permissions-table">
                    <thead>
                        <tr>
                            <th style="width: 20%;">Mã quyền (Code)</th>
                            <th style="width: 22%;">Tên quyền</th>
                            <th style="width: 16%;">Phân nhóm</th>
                            <th style="width: 26%;">Mô tả chức năng</th>
                            <th style="width: 8%; text-align: center;">Phạm vi</th>
                            <th style="width: 8%; text-align: right;">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${items.map(p => renderPermissionRow(p, true)).join("")}
                    </tbody>
                </table>
            </div>
        </div>
    `;
    container.innerHTML = html;
}

/**
 * Tạo HTML cho từng dòng quyền trong bảng
 */
function renderPermissionRow(perm, includeCategoryCol = false) {
    const catDef = CATEGORY_DEFINITIONS[perm.category] || {
        name: perm.categoryName || perm.category,
        badgeClass: "system",
        icon: ""
    };

    let scopeLabel = "Cả hai";
    if (perm.scope === "ADMIN") scopeLabel = "Quản trị";
    if (perm.scope === "USER") scopeLabel = "Người dùng";

    return `
        <tr id="permRow-${perm.id}">
            <!-- Mã quyền -->
            <td>
                <div class="d-flex align-items-center gap-1">
                    <span class="permission-code-badge" title="Mã quyền hệ thống bất biến (xác thực qua code và CSDL)">
                        <svg class="lock-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                            <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                        <code>${escapeHtml(perm.code)}</code>
                    </span>
                    <button type="button" class="btn-copy-code" onclick="copyPermissionCode('${escapeHtml(perm.code)}')" title="Sao chép mã quyền">
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                    </button>
                </div>
            </td>

            <!-- Tên quyền -->
            <td>
                <div class="perm-name-cell">
                    <div class="perm-title">
                        ${escapeHtml(perm.name)}
                        ${perm.isSensitive ? `
                            <span class="badge-sensitive" title="Quyền nhạy cảm yêu cầu kiểm soát gắt gao theo quy định EVN">
                                <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                                Nhạy cảm
                            </span>
                        ` : ''}
                    </div>
                </div>
            </td>

            ${includeCategoryCol ? `
                <!-- Phân nhóm (chỉ khi ở Table View) -->
                <td>
                    <span class="badge-category ${catDef.badgeClass}">
                        ${catDef.name}
                    </span>
                </td>
            ` : ''}

            <!-- Mô tả -->
            <td>
                <p class="perm-desc-text">${escapeHtml(perm.description)}</p>
            </td>

            <!-- Phạm vi -->
            <td style="text-align: center;">
                <span class="badge-scope">${scopeLabel}</span>
            </td>

            <!-- Thao tác (Chỉ Quản trị viên hệ thống được sửa tên, phân nhóm, mô tả) -->
            <td class="actions-cell" style="text-align: right;">
                <div style="display: flex; align-items: center; justify-content: flex-end; gap: 6px;">
                    <button type="button" class="action-btn edit-btn" onclick="openEditPermissionModal('${escapeHtml(perm.code)}')" title="Chỉnh sửa thông tin quyền">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                    </button>
                    <button type="button" class="action-btn info-btn" onclick="openViewPermissionModal('${escapeHtml(perm.code)}')" title="Xem chi tiết kỹ thuật & API">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="16" x2="12" y2="12"></line>
                            <line x1="12" y1="8" x2="12.01" y2="8"></line>
                        </svg>
                    </button>
                </div>
            </td>
        </tr>
    `;
}

/**
 * Thu gọn / Mở rộng nhóm chức năng
 */
function toggleGroupCollapse(catKey) {
    const card = document.getElementById(`groupCard-${catKey}`);
    if (card) {
        card.classList.toggle("collapsed");
    }
}

/**
 * Mở Modal Chỉnh sửa Quyền
 * CHỈ CHO PHÉP SỬA: Tên quyền, Phân nhóm, Mô tả.
 * Mã quyền bị KHÓA BẤT BIẾN (Readonly / Disabled).
 */
function openEditPermissionModal(permissionCode) {
    const perm = permissionsState.find(p => p.code === permissionCode);
    if (!perm) {
        showToast("Không tìm thấy thông tin quyền hạn!", "error");
        return;
    }

    editingPermissionCode = permissionCode;

    // Set form fields
    const codeDisplay = document.getElementById("editPermCodeDisplay");
    const codeHidden = document.getElementById("editPermCodeHidden");
    const nameInput = document.getElementById("editPermNameInput");
    const categorySelect = document.getElementById("editPermCategorySelect");
    const descTextarea = document.getElementById("editPermDescTextarea");

    if (codeDisplay) codeDisplay.textContent = perm.code;
    if (codeHidden) codeHidden.value = perm.code;
    if (nameInput) nameInput.value = perm.name;
    if (categorySelect) categorySelect.value = perm.category;
    if (descTextarea) descTextarea.value = perm.description;

    // Hiển thị modal
    const modal = document.getElementById("editPermissionModal");
    if (modal) {
        modal.classList.add("show");
        if (nameInput) nameInput.focus();
    }
}

function closeEditPermissionModal() {
    const modal = document.getElementById("editPermissionModal");
    if (modal) {
        modal.classList.remove("show");
    }
    editingPermissionCode = null;
}

/**
 * Xử lý lưu thông tin chỉnh sửa quyền
 */
function handleSavePermissionForm(e) {
    e.preventDefault();

    if (!editingPermissionCode) return;

    const nameInput = document.getElementById("editPermNameInput");
    const categorySelect = document.getElementById("editPermCategorySelect");
    const descTextarea = document.getElementById("editPermDescTextarea");

    const newName = nameInput ? nameInput.value.trim() : "";
    const newCategory = categorySelect ? categorySelect.value : "";
    const newDesc = descTextarea ? descTextarea.value.trim() : "";

    if (!newName) {
        showToast("Tên quyền không được để trống!", "warning");
        if (nameInput) nameInput.focus();
        return;
    }

    if (!newDesc) {
        showToast("Vui lòng nhập mô tả chức năng của quyền!", "warning");
        if (descTextarea) descTextarea.focus();
        return;
    }

    const permIndex = permissionsState.findIndex(p => p.code === editingPermissionCode);
    if (permIndex === -1) {
        showToast("Lỗi: Không tìm thấy quyền hạn cần cập nhật!", "error");
        return;
    }

    // Cập nhật các trường được phép chỉnh sửa
    permissionsState[permIndex].name = newName;
    permissionsState[permIndex].category = newCategory;
    permissionsState[permIndex].categoryName = CATEGORY_DEFINITIONS[newCategory]?.name || newCategory;
    permissionsState[permIndex].description = newDesc;

    // Lưu trữ
    savePermissionsToStorage();

    // Đóng modal & Render lại
    closeEditPermissionModal();
    renderPermissions();
    updateMetrics();

    showToast(`Đã cập nhật quyền [${editingPermissionCode}] thành công!`, "success");
}

/**
 * Mở modal xem thông tin kỹ thuật của quyền
 */
function openViewPermissionModal(permissionCode) {
    const perm = permissionsState.find(p => p.code === permissionCode);
    if (!perm) return;

    const modal = document.getElementById("viewPermissionModal");
    const titleEl = document.getElementById("viewPermModalTitle");
    const bodyEl = document.getElementById("viewPermModalBody");

    if (titleEl) {
        titleEl.textContent = `Chi tiết quyền hạn: ${perm.code}`;
    }

    if (bodyEl) {
        const catDef = CATEGORY_DEFINITIONS[perm.category] || { name: perm.categoryName };
        bodyEl.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 16px;">
                <div style="background: var(--bg-hover); padding: 14px; border-radius: 8px; border: 1px solid var(--border-color);">
                    <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Tên quyền hiển thị</div>
                    <div style="font-size: 1.05rem; font-weight: 600; color: var(--text-main);">${escapeHtml(perm.name)}</div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <div style="background: var(--bg-hover); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
                        <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px;">Phân nhóm</div>
                        <div style="font-weight: 600; color: var(--primary);">${escapeHtml(catDef.name)}</div>
                    </div>
                    <div style="background: var(--bg-hover); padding: 12px; border-radius: 8px; border: 1px solid var(--border-color);">
                        <div style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 4px;">Mức độ an toàn</div>
                        <div>
                            ${perm.isSensitive ? '<span class="badge-sensitive">Nhạy cảm / Rủi ro cao</span>' : '<span style="color: #10b981; font-weight: 600; font-size: 0.825rem;">Tiêu chuẩn</span>'}
                        </div>
                    </div>
                </div>

                <div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Mô tả nghiệp vụ</div>
                    <p style="font-size: 0.875rem; color: var(--text-main); line-height: 1.5; margin: 0;">${escapeHtml(perm.description)}</p>
                </div>

                <div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 6px;">Mã kiểm tra bảo mật (NestJS Backend Guard)</div>
                    <pre style="background: var(--bg-color); border: 1px solid var(--border-color); padding: 12px; border-radius: 8px; font-family: monospace; font-size: 0.825rem; overflow-x: auto; color: var(--text-main);">@RequirePermissions('${escapeHtml(perm.code)}')\n@UseGuards(PermissionsGuard)</pre>
                </div>

                <div>
                    <div style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; font-weight: 600; margin-bottom: 4px;">Đường dẫn API bảo vệ</div>
                    <code style="background: var(--bg-hover); border: 1px solid var(--border-color); padding: 6px 10px; border-radius: 6px; font-size: 0.8rem; display: block;">${escapeHtml(perm.backendRoute || 'Chưa định tuyến')}</code>
                </div>
            </div>
        `;
    }

    if (modal) {
        modal.classList.add("show");
    }
}

function closeViewPermissionModal() {
    const modal = document.getElementById("viewPermissionModal");
    if (modal) {
        modal.classList.remove("show");
    }
}

/**
 * Sao chép mã quyền vào Clipboard
 */
function copyPermissionCode(code) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(code).then(() => {
            showToast(`Đã sao chép mã quyền: ${code}`, "success", 2500);
        }).catch(() => {
            fallbackCopy(code);
        });
    } else {
        fallbackCopy(code);
    }
}

function fallbackCopy(text) {
    const input = document.createElement("input");
    input.value = text;
    document.body.appendChild(input);
    input.select();
    try {
        document.execCommand("copy");
        showToast(`Đã sao chép: ${text}`, "success", 2500);
    } catch (e) {
        showToast("Không thể sao chép tự động!", "warning");
    }
    document.body.removeChild(input);
}

/**
 * Đặt lại bộ lọc về mặc định
 */
function resetFilters() {
    currentFilter = {
        keyword: "",
        category: "ALL",
        securityTier: "ALL"
    };

    const searchInput = document.getElementById("permissionSearchInput");
    const clearBtn = document.getElementById("searchClearBtn");
    const categorySelect = document.getElementById("categoryFilterSelect");
    const securitySelect = document.getElementById("securityFilterSelect");

    if (searchInput) searchInput.value = "";
    if (clearBtn) clearBtn.style.display = "none";
    if (categorySelect) categorySelect.value = "ALL";
    if (securitySelect) securitySelect.value = "ALL";

    syncQuickFilterChips("ALL");
    renderPermissions();
}

/**
 * Khôi phục toàn bộ danh mục quyền về cấu hình mặc định của hệ thống
 */
function resetPermissionsToDefault() {
    if (confirm("Bạn có chắc chắn muốn khôi phục danh mục quyền về thiết lập mặc định của hệ thống? Tất cả chỉnh sửa tên và mô tả sẽ được hoàn tác.")) {
        permissionsState = JSON.parse(JSON.stringify(DEFAULT_PERMISSIONS));
        savePermissionsToStorage();
        renderPermissions();
        updateMetrics();
        showToast("Đã khôi phục danh mục quyền hệ thống về mặc định!", "success");
    }
}

/**
 * Xuất danh mục quyền ra file JSON
 */
function exportPermissionsJson() {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(permissionsState, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `evn_permissions_catalog_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast("Đã xuất danh mục quyền hạn thành công!", "success");
}

/**
 * Escape HTML để chống XSS
 */
function escapeHtml(string) {
    if (!string) return "";
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return string.toString().replace(/[&<>"']/g, m => map[m]);
}
