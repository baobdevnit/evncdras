// Run this script as early as possible in the <head> to prevent FOUC (Flash of Unstyled Content)
(function() {
    const savedTheme = sessionStorage.getItem('theme');
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
        document.documentElement.setAttribute('data-theme', 'dark');
    }
})();

// Initialize Global Notification Mock Data if it doesn't exist
(function() {
    if (!localStorage.getItem('notifications')) {
        const MOCK_NOTIFICATIONS = [
            { id: 1, title: 'Đăng ký tài khoản mới', content: 'Nguyễn Văn A vừa đăng ký tài khoản mới.', date: new Date(Date.now() - 5 * 60000).toISOString(), read: false, type: 'GENERAL', severity: 'INFO', icon: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle>', color: 'blue' },
            { id: 2, title: 'Hệ thống cập nhật', content: 'Hệ thống hoàn tất cập nhật phiên bản v2.4.', date: new Date(Date.now() - 2 * 3600000).toISOString(), read: false, type: 'SYSTEM_MAINTENANCE', severity: 'INFO', icon: '<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline>', color: 'red' },
            { id: 3, title: 'Cảnh báo chất lượng thoại QoS', content: 'Cuộc gọi từ máy 45678 có điểm MOS rớt xuống 2.1.', date: new Date(Date.now() - 24 * 3600000).toISOString(), read: false, type: 'QOS_ALERT', severity: 'WARNING', icon: '<path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line>', color: 'yellow' },
            { id: 4, title: 'Báo cáo lưu lượng nhóm', content: 'Báo cáo CDR tuần 45 của nhóm đã sẵn sàng tải xuống.', date: new Date(Date.now() - 48 * 3600000).toISOString(), read: true, type: 'GENERAL', severity: 'INFO', icon: '<line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line>', color: 'green' },
            { id: 5, title: 'Cảnh báo mất kết nối PABX', content: 'Mất tín hiệu đồng bộ file CDR từ tổng đài PABX trạm Ialy.', date: new Date(Date.now() - 72 * 3600000).toISOString(), read: true, type: 'PABX_OFFLINE', severity: 'CRITICAL', icon: '<path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline>', color: 'blue' }
        ];
        localStorage.setItem('notifications', JSON.stringify(MOCK_NOTIFICATIONS));
    }
})();

// Function to update global notification badges across all pages
window.updateNotificationBadge = function() {
    const notifications = JSON.parse(localStorage.getItem('notifications') || '[]');
    const unreadCount = notifications.filter(n => !n.read).length;

    const badges = document.querySelectorAll('.notification-badge-global');
    badges.forEach(badge => {
        if (unreadCount > 0) {
            badge.textContent = unreadCount;
            badge.style.display = 'inline-flex';
        } else {
            badge.style.display = 'none';
        }
    });
};

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------
    // 1. Theme Switcher Logic
    // ----------------------------------------
    const themeToggleBtn = document.getElementById('themeToggle');

    if (themeToggleBtn) {
        updateIcon();

        themeToggleBtn.addEventListener('click', () => {
            const currentTheme = document.documentElement.getAttribute('data-theme');
            const newTheme = currentTheme === 'dark' ? 'light' : 'dark';

            if (newTheme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'dark');
                sessionStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.removeAttribute('data-theme');
                sessionStorage.setItem('theme', 'light');
            }

            updateIcon();
            window.dispatchEvent(new CustomEvent('theme-changed', { detail: { isDark: newTheme === 'dark' } }));
        });
    }

    function updateIcon() {
        if (!themeToggleBtn) return;
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (isDark) {
            themeToggleBtn.setAttribute('title', 'Giao diện Sáng');
            themeToggleBtn.innerHTML = '<svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg><span class="menu-text theme-text" style="font-weight: 500; margin-left: 8px;">Giao diện Sáng</span>';
        } else {
            themeToggleBtn.setAttribute('title', 'Giao diện Tối');
            themeToggleBtn.innerHTML = '<svg class="theme-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg><span class="menu-text theme-text" style="font-weight: 500; margin-left: 8px;">Giao diện Tối</span>';
        }
    }

    // ----------------------------------------
    // 2. Mobile Menu Toggle
    // ----------------------------------------
    const mobileMenuBtn = document.getElementById('mobileMenuToggle');
    const sidebar = document.querySelector('.sidebar');
    const mobileOverlay = document.getElementById('mobileOverlay');
    const dashboardContainer = document.querySelector('.dashboard-container');

    if (mobileMenuBtn && sidebar && mobileOverlay) {
        function toggleMobileMenu() {
            sidebar.classList.toggle('mobile-open');
            mobileOverlay.classList.toggle('show');
            if (dashboardContainer) {
                dashboardContainer.classList.toggle('mobile-open');
            }
        }

        mobileMenuBtn.addEventListener('click', toggleMobileMenu);
        mobileOverlay.addEventListener('click', toggleMobileMenu);
    }

    // ----------------------------------------
    // 3. User Profile Dropdown
    // ----------------------------------------
    const userProfileBtn = document.getElementById('userProfileBtn');
    const profileDropdown = document.getElementById('profileDropdown');

    if (userProfileBtn && profileDropdown) {
        userProfileBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            profileDropdown.classList.toggle('show');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!userProfileBtn.contains(e.target)) {
                profileDropdown.classList.remove('show');
            }
        });
    }

    // ----------------------------------------
    // 4. Sidebar Active States Mock
    // ----------------------------------------
    const sidebarLinks = document.querySelectorAll('.sidebar-menu li');
    sidebarLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            // Only prevent default if it's not a real link (e.g. settings or current page)
            const anchor = this.querySelector('a');
            if (anchor && anchor.getAttribute('href') === '#') {
                e.preventDefault();

                // Remove active class from all
                sidebarLinks.forEach(l => l.classList.remove('active'));

                // Add active class to clicked
                this.classList.add('active');
            }
        });
    });

    // Auto-sync active state with current location pathname if available
    const currentFile = window.location.pathname.split('/').pop();
    if (currentFile && currentFile.endsWith('.html')) {
        document.querySelectorAll('.sidebar-menu a').forEach(a => {
            if (a.getAttribute('href') === currentFile) {
                const li = a.closest('li');
                if (li && !li.classList.contains('menu-group')) {
                    li.classList.add('active');
                }
                const group = a.closest('.menu-group');
                if (group) {
                    group.classList.add('expanded');
                }
            }
        });
    }

    // ----------------------------------------
    // 5. Sidebar Collapse Handling
    // ----------------------------------------
    const sidebarToggleBtn = document.getElementById('sidebarToggle');

    if (sidebarToggleBtn && sidebar) {
        // Check saved state
        const isCollapsed = localStorage.getItem('sidebarCollapsed') === 'true' || sessionStorage.getItem('sidebar_collapsed') === 'true';
        if (isCollapsed) {
            sidebar.classList.add('collapsed');
        }

        sidebarToggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
            const isNowCollapsed = sidebar.classList.contains('collapsed');
            localStorage.setItem('sidebarCollapsed', isNowCollapsed);
            sessionStorage.setItem('sidebar_collapsed', isNowCollapsed);
            window.dispatchEvent(new Event('resize'));
        });
    }

    // ----------------------------------------
    // 6. Global Notifications Badge Render
    // ----------------------------------------
    window.updateNotificationBadge();

    // Listen for storage changes from other tabs
    window.addEventListener('storage', (e) => {
        if (e.key === 'notifications') {
            window.updateNotificationBadge();
        }
    });

    // ----------------------------------------
    // 7. Maintenance Mode Banner Check
    // ----------------------------------------
    const isMaintenanceActive = localStorage.getItem('system_maintenance_mode') === 'true' || sessionStorage.getItem('maintenance_mode') === 'true';
    const maintenanceBanner = document.getElementById('maintenanceAlertBanner');
    if (maintenanceBanner && isMaintenanceActive) {
        maintenanceBanner.style.display = 'flex';
    }

    // ----------------------------------------
    // 8. Logout Modal Handling
    // ----------------------------------------
    const logoutModal = document.getElementById('logoutModal');
    if (logoutModal) {
        logoutModal.addEventListener('click', (e) => {
            if (e.target === logoutModal) {
                window.closeLogoutModal();
            }
        });
    }

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            window.closeLogoutModal();
        }
    });
});

// ----------------------------------------
// Mock phiên Admin – POST /api/v1/admin/auth/refresh (docs/modules/03_auth_user.md mục 3.2.1,
// docs/modules/04_auth_admin.md mục 3.5, docs/00_overview_and_architecture.md mục 5.3.2).
// Vue: store Pinia `authAdmin` + API client của cổng Admin (src/apps/admin/api/).
// - Access Token chỉ giữ trong bộ nhớ (biến/store), KHÔNG ghi localStorage/sessionStorage.
// - Refresh Token là cookie HttpOnly `Path=/api/v1/admin/auth`: JS không đọc/ghi được,
//   trình duyệt tự gửi kèm request refresh (mock dưới giả lập bằng biến `mockHasRefreshCookie`).
// - Template tĩnh không tự chạy guard (để mở từng trang HTML được); Vue gọi ensureSession()
//   trong router.beforeEach của cổng Admin.
// ----------------------------------------
window.adminSession = (function () {
    let accessToken = null;          // Vue: authAdmin.accessToken (chỉ trong bộ nhớ)
    let refreshPromise = null;       // dùng chung cho các request đồng thời (single-flight)
    let mockHasRefreshCookie = true; // giả lập cookie; false = chưa đăng nhập/phiên đã thu hồi

    const now = () => new Date().toISOString();

    // Giả lập backend: thành công 200 { accessToken, expiresIn } (cookie mới qua Set-Cookie,
    // không nằm trong body); mọi lỗi phiên/tài khoản 401 UNAUTHORIZED (backend đồng thời xóa cookie).
    function mockAdminRefresh() {
        return new Promise(resolve => setTimeout(resolve, 300)).then(() => {
            if (!mockHasRefreshCookie) {
                return Promise.reject({
                    success: false, statusCode: 401, errorCode: 'UNAUTHORIZED',
                    message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', errors: null, timestamp: now()
                });
            }
            return {
                success: true, statusCode: 200, message: 'Làm mới phiên thành công',
                data: { accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-refreshed', expiresIn: 900 },
                timestamp: now()
            };
        });
    }

    // Gọi refresh đúng một lần cho mọi request đang chờ.
    function refreshOnce() {
        if (!refreshPromise) {
            refreshPromise = mockAdminRefresh()
                .then(res => { accessToken = res.data.accessToken; return accessToken; })
                .catch(err => { accessToken = null; mockHasRefreshCookie = false; throw err; })
                .finally(() => { refreshPromise = null; });
        }
        return refreshPromise;
    }

    function goLogin() {
        // Vue: authAdmin.clear(); router.replace({ name: 'admin.login' })
        window.location.href = 'login.html';
    }

    // Guard lần đầu vào cổng (kể cả tải lại trang): chưa có token → refresh;
    // thành công thì gọi GET /api/v1/admin/auth/me (A04) để nạp `admin` vào store.
    function ensureSession() {
        if (accessToken) return Promise.resolve(accessToken);
        return refreshOnce().catch(() => { goLogin(); return null; });
    }

    // Bọc mọi lời gọi API cổng Admin (trừ /auth/login và /auth/refresh):
    // 401 → refresh một lần rồi gửi lại một lần; refresh lỗi → về trang đăng nhập.
    function request(callApi) {
        return callApi(accessToken).catch(err => {
            if (!err || err.statusCode !== 401) throw err;
            return refreshOnce()
                .then(token => callApi(token))
                .catch(e => { if (e && e.statusCode === 401) goLogin(); throw e; });
        });
    }

    // Giả lập backend POST /api/v1/admin/auth/logout (A03): không có body; luôn 200 data = null
    // kèm Set-Cookie xóa cookie (idempotent: không có cookie/phiên đã thu hồi vẫn 200);
    // Access Token thiếu/hết hạn → 401 UNAUTHORIZED (request() sẽ refresh một lần rồi gửi lại).
    function mockAdminLogout(token) {
        return new Promise(resolve => setTimeout(resolve, 300)).then(() => {
            if (!token) {
                return Promise.reject({
                    success: false, statusCode: 401, errorCode: 'UNAUTHORIZED',
                    message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', errors: null, timestamp: now()
                });
            }
            mockHasRefreshCookie = false; // backend đã thu hồi phiên và xóa cookie
            return { success: true, statusCode: 200, message: 'Đăng xuất thành công', data: null, timestamp: now() };
        });
    }

    // Đăng xuất: gọi API qua request() (401 → refresh một lần), rồi DÙ thành công hay lỗi
    // vẫn xóa phiên phía client và về trang đăng nhập.
    // Vue: authAdmin.clear(); adminSocket.disconnect(); router.replace({ name: 'admin.login' })
    function logout() {
        return request(token => mockAdminLogout(token))
            .catch(() => null)
            .then(() => { accessToken = null; goLogin(); });
    }

    return { ensureSession, request, refreshOnce, logout };
})();

// ----------------------------------------
// Global Helpers for DashboardLayout
// ----------------------------------------
window.openLogoutModal = function() {
    const modal = document.getElementById('logoutModal');
    if (modal) {
        modal.style.display = 'flex';
    }
    const dropdown = document.getElementById('profileDropdown');
    if (dropdown) {
        dropdown.classList.remove('show');
    }
};

window.closeLogoutModal = function() {
    const modal = document.getElementById('logoutModal');
    if (modal) {
        modal.style.display = 'none';
    }
};

// Nút "Đăng xuất" trong #logoutModal: khóa nút khi đang gọi API, tránh bấm hai lần.
window.confirmLogout = function() {
    const btn = document.querySelector('#logoutModal .confirm-modal-btn--danger');
    if (btn) {
        if (btn.disabled) return;
        btn.disabled = true;
        btn.textContent = 'Đang đăng xuất...';
    }
    window.adminSession.logout();
};

window.showToast = function(message, type = 'success', duration = 4000) {
    let container = document.getElementById('toastContainer');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toastContainer';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast-card toast-card--${type}`;

    let iconSvg = '';
    if (type === 'success') {
        iconSvg = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    } else if (type === 'danger' || type === 'error') {
        iconSvg = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>';
    } else if (type === 'warning') {
        iconSvg = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>';
    } else {
        iconSvg = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>';
    }

    toast.innerHTML = `
        <div class="toast-icon-wrapper">
            ${iconSvg}
        </div>
        <div class="toast-body">
            <p class="toast-message">${message}</p>
        </div>
        <button type="button" class="toast-close-btn" aria-label="Đóng">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
        </button>
    `;

    toast.querySelector('.toast-close-btn').addEventListener('click', () => {
        toast.remove();
    });

    container.appendChild(toast);

    if (duration > 0) {
        setTimeout(() => {
            if (toast.parentElement) toast.remove();
        }, duration);
    }
};
window.showNotification = window.showToast;


// ----------------------------------------
// 7. Shared Pagination Manager
// ----------------------------------------
class PaginationManager {
    constructor(tableSelector, paginationSelector) {
        this.table = document.querySelector(tableSelector);
        this.paginationContainer = document.querySelector(paginationSelector);
        if (!this.table || !this.paginationContainer) return;

        this.tbody = this.table.querySelector('tbody');
        this.pageSelect = this.paginationContainer.querySelector('select');
        this.ul = this.paginationContainer.querySelector('.pagination');

        // Find spans
        const spans = this.paginationContainer.querySelectorAll('.pagination-info span');
        if (spans.length >= 2) {
            this.infoSpan = spans[0];
            this.infoText = spans[1];
        } else {
            // Fallback for organization.html if it lacks spans
            this.infoTextFallback = this.paginationContainer.querySelector('.pagination-info');
        }

        this.currentPage = 1;
        this.rowsPerPage = this.pageSelect ? parseInt(this.pageSelect.value) : 10;

        this.allRows = Array.from(this.tbody.querySelectorAll('tr'));
        this.filteredRows = this.allRows;

        if (this.pageSelect) {
            this.pageSelect.addEventListener('change', (e) => {
                this.rowsPerPage = parseInt(e.target.value);
                this.currentPage = 1;
                this.render();
            });
        }
    }

    setFilteredRows(rows) {
        this.filteredRows = rows;
        this.currentPage = 1;
        this.render();
    }

    render() {
        const totalRows = this.filteredRows.length;
        const totalPages = Math.ceil(totalRows / this.rowsPerPage) || 1;

        if (this.currentPage > totalPages) this.currentPage = totalPages;

        const startIdx = (this.currentPage - 1) * this.rowsPerPage;
        const endIdx = startIdx + this.rowsPerPage;

        // Hide all rows first
        this.allRows.forEach(row => row.style.display = 'none');

        // Show only rows for current page
        for (let i = startIdx; i < endIdx && i < totalRows; i++) {
            this.filteredRows[i].style.display = '';
        }

        // Update Info Text
        const endDisplay = Math.min(endIdx, totalRows);
        const startDisplay = totalRows === 0 ? 0 : startIdx + 1;

        if (this.infoSpan && this.infoText) {
            this.infoSpan.innerText = `Hiển thị ${startDisplay} đến ${endDisplay}`;
            this.infoText.innerText = `bản ghi mỗi trang (Tổng: ${totalRows})`;
        } else if (this.infoTextFallback) {
             this.infoTextFallback.innerText = `Hiển thị ${startDisplay} đến ${endDisplay} của ${totalRows} bản ghi`;
        }

        // Build Pagination Buttons
        if (this.ul) {
            this.ul.innerHTML = '';

            // Prev Button
            const prevLi = document.createElement('li');
            prevLi.className = `page-item ${this.currentPage === 1 ? 'disabled' : ''}`;
            prevLi.innerHTML = `<a href="#" class="page-link">&laquo;</a>`;
            prevLi.onclick = (e) => { e.preventDefault(); if(this.currentPage > 1) { this.currentPage--; this.render(); } };
            this.ul.appendChild(prevLi);

            let startPage = Math.max(1, this.currentPage - 2);
            let endPage = Math.min(totalPages, startPage + 4);
            if (endPage - startPage < 4) {
                startPage = Math.max(1, endPage - 4);
            }

            for (let p = startPage; p <= endPage; p++) {
                const pLi = document.createElement('li');
                pLi.className = `page-item ${p === this.currentPage ? 'active' : ''}`;
                pLi.innerHTML = `<a href="#" class="page-link">${p}</a>`;
                pLi.onclick = (e) => { e.preventDefault(); this.currentPage = p; this.render(); };
                this.ul.appendChild(pLi);
            }

            // Next Button
            const nextLi = document.createElement('li');
            nextLi.className = `page-item ${this.currentPage === totalPages ? 'disabled' : ''}`;
            nextLi.innerHTML = `<a href="#" class="page-link">&raquo;</a>`;
            nextLi.onclick = (e) => { e.preventDefault(); if(this.currentPage < totalPages) { this.currentPage++; this.render(); } };
            this.ul.appendChild(nextLi);
        }
    }
}
window.PaginationManager = PaginationManager;

// Global Chart Zoom/Fit Screen Toggle Handler
window.toggleChartFit = function(button) {
    const card = button.closest('.card');
    const scrollContainer = card.querySelector('.chart-container-scrollable');
    if (!scrollContainer) return;

    const isFit = scrollContainer.classList.toggle('fit-screen');

    // Update button icon & tooltip
    if (isFit) {
        button.title = "Xem dạng cuộn rộng";
        button.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="15 3 21 3 21 9"></polyline>
                <polyline points="9 21 3 21 3 15"></polyline>
                <line x1="21" y1="3" x2="14" y2="10"></line>
                <line x1="3" y1="21" x2="10" y2="14"></line>
            </svg>
        `; // Expand icon
    } else {
        button.title = "Thu nhỏ vừa màn hình";
        button.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <polyline points="4 14 10 14 10 20"></polyline>
                <polyline points="20 10 14 10 14 4"></polyline>
                <line x1="14" y1="10" x2="21" y2="3"></line>
                <line x1="10" y1="14" x2="3" y2="21"></line>
            </svg>
        `; // Minimize/compress icon
    }

    // Trigger Chart.js dynamic resizing
    const canvas = scrollContainer.querySelector('canvas');
    if (canvas && window.Chart) {
        const chartInstance = window.Chart.getChart(canvas);
        if (chartInstance) {
            setTimeout(() => {
                chartInstance.resize();
            }, 50);
        }
    }
};
