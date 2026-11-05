// Run this script as early as possible in the <head> to prevent FOUC (Flash of Unstyled Content)
// Chỉ đọc giá trị `theme` (LIGHT | DARK | SYSTEM) đã cache ở localStorage khóa `memberTheme` sau lần nạp
// GET /api/v1/profile/preferences trước (docs/modules/08_user_profile.md mục 3.5.1). Nguồn chuẩn là CSDL;
// SYSTEM hoặc chưa có cache thì theo prefers-color-scheme. Không dùng sessionStorage. Vue: script inline trong index.html.
(function() {
    let cached = null;
    try { cached = localStorage.getItem('memberTheme'); } catch (e) { /* storage bị chặn */ }
    if (cached === 'LIGHT') document.documentElement.setAttribute('data-theme', 'light');
    else if (cached === 'DARK') document.documentElement.setAttribute('data-theme', 'dark');
    else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
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

        // Nút ở header đổi nhanh Sáng ↔ Tối và lưu ngay: PUT /api/v1/profile/preferences { theme } (U12, M08 mục 3.5.2).
        // Áp ngay, đang gửi thì khóa nút, lỗi thì savePreferences đã hoàn tác → chỉ báo toast
        // (503 bảo trì: toast cảnh báo, biểu ngữ do request() hiện).
        themeToggleBtn.addEventListener('click', () => {
            if (themeToggleBtn.disabled) return;
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            themeToggleBtn.disabled = true;
            window.memberSession.savePreferences({ theme: isDark ? 'LIGHT' : 'DARK' })
                .catch(err => {
                    if (err && err.statusCode === 401) return; // đã chuyển về trang đăng nhập
                    if (typeof window.showToast === 'function') {
                        window.showToast((err && err.message) || 'Không lưu được chế độ giao diện.',
                            err && err.statusCode === 503 ? 'warning' : 'error');
                    }
                })
                .finally(() => { themeToggleBtn.disabled = false; });
        });
        window.addEventListener('theme-changed', updateIcon);
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
        // Trạng thái ban đầu theo isSidebarCollapsed của store thiết lập (memberSession.applyPreferences);
        // bấm nút chỉ thu gọn/mở tạm trong lần dùng này, không ghi storage, không đổi thiết lập đã lưu.
        sidebarToggleBtn.addEventListener('click', () => {
            sidebar.classList.toggle('collapsed');
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
    // 7. Biểu ngữ bảo trì: không đọc cờ từ localStorage/sessionStorage; window.memberSession hiện/ẩn
    //    #maintenanceAlertBanner theo sự kiện `member-maintenance` (U04, M03 mục 3.2).
    // ----------------------------------------

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
// Mock phiên Member – POST /api/v1/auth/refresh (U02; docs/modules/03_auth_user.md mục 3.2.1,
// docs/00_overview_and_architecture.md mục 5.3.2). Cùng khung với window.adminSession (templates/admin/main.js).
// Vue: store Pinia `authUser` + API client của cổng Member (src/apps/member/api/).
// - Access Token chỉ giữ trong bộ nhớ (biến/store), KHÔNG ghi localStorage/sessionStorage.
// - Refresh Token là cookie HttpOnly `Path=/api/v1/auth`: JS không đọc/ghi được, trình duyệt tự gửi kèm
//   request refresh (mock giả lập bằng biến `mockHasRefreshCookie`; thêm ?session=none vào URL = chưa đăng nhập).
// - Chế độ bảo trì KHÔNG chặn refresh, logout (và GET /auth/me); API nghiệp vụ khác trả 503 MAINTENANCE
//   (mock: thêm ?maintenance=1 vào URL). 503 không phải hết phiên: không refresh, không xóa store.
// - Template tĩnh không tự chạy guard (để mở từng trang HTML được); Vue gọi ensureSession()
//   trong router.beforeEach của cổng Member. Nạp tài khoản: GET /api/v1/auth/me (U04, M03 mục 3.2) →
//   loadMe(); mock: ?role=REGULAR_USER|USER_RECORDING (mặc định GROUP_ADMIN), ?recording=0 (nhóm chưa
//   được cấp ghi âm), ?account=locked (tài khoản bị khóa: /auth/me 401, refresh 401 → về login).
// ----------------------------------------
window.memberSession = (function () {
    const params = new URLSearchParams(window.location.search);
    let accessToken = null;          // Vue: authUser.accessToken (chỉ trong bộ nhớ)
    let currentUser = null;          // Vue: authUser.user (data của GET /auth/me hoặc data.user của login)
    let refreshPromise = null;       // dùng chung cho các request đồng thời (single-flight)
    const MOCK_ACCOUNT_LOCKED = params.get('account') === 'locked';
    let mockHasRefreshCookie = params.get('session') !== 'none' && !MOCK_ACCOUNT_LOCKED;
    const MOCK_MAINTENANCE = params.get('maintenance') === '1';

    const now = () => new Date().toISOString();
    const fail = (statusCode, errorCode, message) => Promise.reject({
        success: false, statusCode, errorCode, message, errors: null, timestamp: now()
    });

    // Giả lập backend POST /api/v1/auth/refresh: không có body; không bị bảo trì chặn.
    // 200 { accessToken, expiresIn } (cookie mới qua Set-Cookie, không nằm trong body);
    // mọi lỗi phiên/tài khoản/nhóm 401 UNAUTHORIZED (backend đồng thời xóa cookie). Không có 403/503.
    function mockUserRefresh() {
        return new Promise(resolve => setTimeout(resolve, 300)).then(() => {
            if (!mockHasRefreshCookie) {
                return fail(401, 'UNAUTHORIZED', 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
            }
            return {
                success: true, statusCode: 200, message: 'Làm mới phiên thành công',
                // Token thật mang sub, userGroupId, roleCode, sid (id phiên mới sau xoay vòng).
                data: { accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-user-refreshed', expiresIn: 900 },
                timestamp: now()
            };
        });
    }

    // Gọi refresh đúng một lần cho mọi request đang chờ; lỗi thì xóa token (cookie đã bị backend xóa).
    function refreshOnce() {
        if (!refreshPromise) {
            refreshPromise = mockUserRefresh()
                .then(res => { accessToken = res.data.accessToken; return accessToken; })
                .catch(err => { accessToken = null; mockHasRefreshCookie = false; throw err; })
                .finally(() => { refreshPromise = null; });
        }
        return refreshPromise;
    }

    function goLogin() {
        // Vue: authUser.clear(); router.replace({ name: 'member.login' })
        window.location.href = 'login.html';
    }

    // Bọc mọi lời gọi API cổng Member (trừ /auth/login và /auth/refresh):
    // 401 → refresh một lần rồi gửi lại một lần; refresh lỗi → về trang đăng nhập.
    // 503 MAINTENANCE → ném lại cho màn hình, phát sự kiện `member-maintenance` { active: true }; không refresh.
    // API nghiệp vụ trả thành công → phát `member-maintenance` { active: false } (hết bảo trì, ẩn biểu ngữ).
    // options.maintenanceExempt = true cho /auth/me, /auth/logout: vẫn 200 khi bảo trì nên không được ẩn biểu ngữ.
    function request(callApi, options) {
        const exempt = !!(options && options.maintenanceExempt);
        const done = res => {
            if (!exempt) window.dispatchEvent(new CustomEvent('member-maintenance', { detail: { active: false } }));
            return res;
        };
        // 503 có thể tới ở lần gửi lại sau refresh (refresh miễn bảo trì), nên kiểm tra ở cả hai lần.
        const maintenance = err => {
            if (err && err.statusCode === 503 && err.errorCode === 'MAINTENANCE') {
                window.dispatchEvent(new CustomEvent('member-maintenance', { detail: { active: true, message: err.message } }));
                return true;
            }
            return false;
        };
        return callApi(accessToken).then(done, err => {
            if (maintenance(err)) throw err;
            if (!err || err.statusCode !== 401) throw err;
            return refreshOnce()
                .then(token => callApi(token))
                .then(done, e => { maintenance(e); throw e; })
                .catch(e => { if (e && e.statusCode === 401) goLogin(); throw e; });
        });
    }

    // ---------- GET /api/v1/auth/me (U04, docs/modules/03_auth_user.md mục 3.2) ----------
    // Vai trò theo claim roleCode của Access Token (không đọc user_roles); permissions = quyền vai trò,
    // bỏ quyền ghi âm khi nhóm chưa được cấp, sắp theo code (M10 mục 2.2, 2.3).
    const ROLE_PERMISSIONS = {
        GROUP_ADMIN: ['cdr:download_audio', 'cdr:export', 'cdr:filter_advanced', 'cdr:listen_audio', 'cdr:view',
            'group:manage_admin', 'group:toggle_recording', 'org:view', 'prefix:view', 'qos:view',
            'report:export', 'report:view', 'user:create', 'user:delete', 'user:edit', 'user:view', 'user_group:view'],
        USER_RECORDING: ['cdr:download_audio', 'cdr:export', 'cdr:filter_advanced', 'cdr:listen_audio', 'cdr:view',
            'org:view', 'prefix:view', 'qos:view', 'report:export', 'report:view', 'user_group:view'],
        REGULAR_USER: ['cdr:export', 'cdr:filter_advanced', 'cdr:view', 'org:view', 'prefix:view', 'qos:view',
            'report:export', 'report:view', 'user_group:view']
    };
    const ROLE_NAMES = { GROUP_ADMIN: 'Quản trị viên nhóm', USER_RECORDING: 'Thành viên nghe ghi âm', REGULAR_USER: 'Thành viên' };
    const GROUP_GATED_PERMISSIONS = ['cdr:listen_audio', 'cdr:download_audio'];
    const MOCK_ROLE = ROLE_PERMISSIONS[params.get('role')] ? params.get('role') : 'GROUP_ADMIN'; // = claim roleCode
    const MOCK_ALLOW_RECORDING = params.get('recording') !== '0';

    // Dữ liệu mẫu đúng cấu trúc `user` (M03 mục 3.1, 3.2).
    function buildMockUser() {
        return {
            id: 10,
            username: 'cdr.evnit',
            fullName: 'Trần Thị B',
            email: 'cdr.evnit@evn.com.vn',
            avatarUrl: null,
            userGroup: {
                id: 1,
                name: 'Nhóm QLND Khối CNTT',
                organizationId: 2,          // null cùng organizationName khi nhóm độc lập
                organizationName: 'Khối CNTT',
                allowRecordingAccess: MOCK_ALLOW_RECORDING
            },
            roleCode: MOCK_ROLE,
            roleName: ROLE_NAMES[MOCK_ROLE],
            permissions: ROLE_PERMISSIONS[MOCK_ROLE]
                .filter(p => MOCK_ALLOW_RECORDING || !GROUP_GATED_PERMISSIONS.includes(p))
        };
    }

    // Giả lập backend GET /api/v1/auth/me: không query, chỉ đọc (không audit, không last_login_at);
    // KHÔNG bị bảo trì chặn. 200 data = user; token thiếu/hết hạn hoặc kiểm tra tài khoản không qua
    // (không còn ACTIVE, nhóm INACTIVE, token đầy đủ mà must_change_password = 1) → 401 UNAUTHORIZED, không xóa cookie.
    function mockUserMe(token) {
        return new Promise(resolve => setTimeout(resolve, 200)).then(() => {
            if (!token || MOCK_ACCOUNT_LOCKED) return fail(401, 'UNAUTHORIZED', 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
            return { success: true, statusCode: 200, message: 'Lấy thông tin tài khoản thành công', data: buildMockUser(), timestamp: now() };
        });
    }

    // Nạp `user` vào store (chỉ khi chưa có: sau đăng nhập đã có data.user của login).
    function loadMe() {
        if (currentUser) return Promise.resolve(currentUser);
        return request(token => mockUserMe(token), { maintenanceExempt: true }).then(res => {
            currentUser = res.data;
            renderAccount(currentUser);
            return currentUser;
        });
    }

    // meta.permissions của route cổng Member (docs/00_overview_and_architecture.md mục 5.3.4), theo file template.
    const PAGE_PERMISSIONS = {
        'cdr-history.html': 'cdr:view', 'qos-debug.html': 'qos:view', 'reports.html': 'report:view',
        'org-prefix.html': 'prefix:view', 'group-admin.html': 'user:view', 'group-members.html': 'user_group:view'
    };

    // Header MemberLayout: fullName, roleName · tên nhóm; avatarUrl null → ảnh chữ cái đầu từ fullName.
    // Sidebar: ẩn mục thiếu quyền; nhóm menu không còn mục nào thì ẩn cả nhóm.
    // Vue: đọc authUser.user; ảnh chữ cái đầu dùng component nội bộ, không gọi dịch vụ ngoài.
    function renderAccount(user) {
        if (!user) return;
        const box = document.getElementById('userProfileBtn');
        if (box) {
            const nameEl = box.querySelector('.user-name');
            const roleEl = box.querySelector('.user-role');
            const img = box.querySelector('.avatar');
            if (nameEl) nameEl.textContent = user.fullName;
            if (roleEl) {
                roleEl.textContent = user.roleName + ' · ' + user.userGroup.name;
                roleEl.title = user.userGroup.name;
            }
            if (img) {
                img.src = user.avatarUrl ||
                    'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.fullName) + '&background=0033A0&color=fff';
                img.alt = user.fullName;
            }
        }
        document.querySelectorAll('.sidebar-menu a[href]').forEach(a => {
            const code = PAGE_PERMISSIONS[a.getAttribute('href')];
            const li = a.closest('li');
            if (code && li) li.style.display = user.permissions.includes(code) ? '' : 'none';
        });
        document.querySelectorAll('.sidebar-menu .menu-group').forEach(group => {
            const items = Array.from(group.querySelectorAll('li')).filter(li => li.querySelector('a[href$=".html"]'));
            if (items.length) group.style.display = items.some(li => li.style.display !== 'none') ? '' : 'none';
        });
    }

    // Tài khoản trong store (các màn hình đọc userGroup, permissions từ đây). Trang tĩnh: dữ liệu mẫu.
    let mockStaticUser = null;       // trang tĩnh chưa nạp /auth/me: giữ một bản mẫu để updateAccount sửa được
    function getAccount() {
        if (currentUser) return currentUser;
        if (!mockStaticUser) mockStaticUser = buildMockUser();
        return mockStaticUser;
    }

    // Sau khi tự sửa hồ sơ (PUT /api/v1/profile, U06) hoặc đổi ảnh (POST /profile/avatar, U08):
    // gộp các trường hiển thị vào store rồi vẽ lại header, không gọi lại /auth/me.
    // Vue: Object.assign(authUser.user, patch) (chỉ fullName, avatarUrl).
    function updateAccount(patch) {
        const target = getAccount();
        ['fullName', 'avatarUrl'].forEach(k => { if (patch && k in patch) target[k] = patch[k]; });
        renderAccount(target);
        return target;
    }

    // Biểu ngữ bảo trì (.maintenance-alert-banner, 03 mục 6.7) ở đầu .main-wrapper; Vue: nằm trong MemberLayout,
    // trạng thái ở store. Bản cổng Member không có liên kết tới cài đặt hệ thống.
    function setMaintenanceBanner(active, message) {
        let banner = document.getElementById('maintenanceAlertBanner');
        if (!banner && active) {
            const host = document.querySelector('.main-wrapper');
            if (!host) return;
            banner = document.createElement('div');
            banner.id = 'maintenanceAlertBanner';
            banner.className = 'maintenance-alert-banner';
            banner.setAttribute('role', 'status');
            banner.innerHTML = '<div class="banner-content">' +
                '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18" aria-hidden="true"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>' +
                '<span><strong>Hệ thống đang bảo trì:</strong> <span class="banner-message"></span></span></div>';
            host.insertBefore(banner, host.firstChild);
        }
        if (!banner) return;
        if (active) {
            banner.querySelector('.banner-message').textContent =
                message || 'Các chức năng tra cứu tạm thời không khả dụng, vui lòng quay lại sau.';
        }
        banner.style.display = active ? 'flex' : 'none';
    }
    window.addEventListener('member-maintenance', e => setMaintenanceBanner(e.detail.active, e.detail.message));

    // ---------- Thiết lập giao diện: GET /api/v1/profile/preferences (U11, M08 mục 3.5.1) ----------
    // Vue: store Pinia `preferencesUser` (src/apps/member/stores/preferencesUser.store.ts). Cùng khung với
    // adminSession (templates/admin/main.js) nhưng đúng 5 trường, không có dashboardWidgets, cache `memberTheme`.
    const THEMES = ['LIGHT', 'DARK', 'SYSTEM'];
    const DEFAULT_PREFERENCES = {   // giá trị mặc định DDL user_settings; dùng khi chưa nạp hoặc nạp lỗi (kể cả 503)
        theme: 'SYSTEM', isSidebarCollapsed: false, itemsPerPage: 10,
        emailNotificationEnabled: true, soundAlertEnabled: true
    };
    let currentPreferences = null;  // Vue: preferencesUser.data (null = chưa nạp được)

    function readThemeCache() {
        try { const t = localStorage.getItem('memberTheme'); return THEMES.includes(t) ? t : null; } catch (e) { return null; }
    }
    function writeThemeCache(theme) {
        try { localStorage.setItem('memberTheme', theme); } catch (e) { /* storage bị chặn: chỉ mất chống nháy */ }
    }
    const clonePreferences = p => Object.assign({}, p);

    // Dữ liệu mẫu đúng cấu trúc data của response (đúng 5 trường).
    // Template tĩnh: lấy theme từ cache để giả lập "CSDL đã lưu" giữa các trang.
    const MOCK_PREFERENCES = Object.assign(clonePreferences(DEFAULT_PREFERENCES), {
        theme: readThemeCache() || 'SYSTEM',
        itemsPerPage: 20,
        soundAlertEnabled: false
    });
    let mockPrefsNetworkError = params.get('prefsError') === '1'; // lỗi mạng ở lần gọi đầu (thử "Thử lại")

    // Giả lập backend GET /api/v1/profile/preferences: thứ tự guard (401/403) → bảo trì (503) → query (400)
    // → đọc users + user_groups (kiểm tra tài khoản) → user_settings; chỉ đọc (không chèn dòng, không audit).
    // 200 data = 5 trường; 401 UNAUTHORIZED (token thiếu/hết hạn, không còn ACTIVE, nhóm INACTIVE,
    // must_change_password = 1); 403 PASSWORD_CHANGE_REQUIRED (token giới hạn, guard router đã chặn trước);
    // 503 MAINTENANCE (không thuộc danh sách miễn). Mock: ?maintenance=1, ?account=locked, ?prefsError=1.
    function mockGetUserPreferences(token, query) {
        return new Promise(resolve => setTimeout(resolve, 250)).then(() => {
            if (mockPrefsNetworkError) { mockPrefsNetworkError = false; return Promise.reject(new Error('Network Error')); }
            if (!token || MOCK_ACCOUNT_LOCKED) return fail(401, 'UNAUTHORIZED', 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
            if (MOCK_MAINTENANCE) return fail(503, 'MAINTENANCE', 'Hệ thống đang bảo trì, vui lòng quay lại sau');
            if (query && Object.keys(query).length) {
                return Promise.reject({
                    success: false, statusCode: 400, errorCode: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ',
                    errors: { query: ['API không nhận tham số truy vấn'] }, timestamp: now()
                });
            }
            return {
                success: true, statusCode: 200, message: 'Lấy thiết lập thành công',
                data: clonePreferences(MOCK_PREFERENCES), timestamp: now()
            };
        });
    }

    // Áp thiết lập lên giao diện toàn cổng: data-theme, sidebar ban đầu; itemsPerPage/soundAlertEnabled do từng
    // màn hình đọc qua getPreferences(). Ghi cache `memberTheme` (chỉ theme) để chống nháy ở lần tải sau.
    function applyPreferences(prefs, options) {
        const root = document.documentElement;
        if (prefs.theme === 'LIGHT') root.setAttribute('data-theme', 'light');
        else if (prefs.theme === 'DARK') root.setAttribute('data-theme', 'dark');
        else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) root.setAttribute('data-theme', 'dark');
        else root.removeAttribute('data-theme');
        if (!(options && options.skipCache)) writeThemeCache(prefs.theme);
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) sidebar.classList.toggle('collapsed', !!prefs.isSidebarCollapsed);
        window.dispatchEvent(new CustomEvent('theme-changed', { detail: { isDark: root.getAttribute('data-theme') === 'dark' } }));
        window.dispatchEvent(new CustomEvent('preferences-changed', { detail: clonePreferences(prefs) }));
    }

    // Nạp một lần khi vào cổng (store trống); store đã có thì không gọi lại. Lỗi khác 401 (kể cả 503) không chặn
    // vào cổng: store giữ trống, giao diện dùng mặc định + theme đã cache. `force` cho nút "Thử lại" ở màn hình cài đặt.
    function loadPreferences(force) {
        if (currentPreferences && !force) return Promise.resolve(clonePreferences(currentPreferences));
        return request(token => mockGetUserPreferences(token)).then(res => {
            currentPreferences = res.data;
            applyPreferences(currentPreferences);
            return clonePreferences(currentPreferences);
        });
    }

    // Bản sao thiết lập hiện tại (chưa nạp → mặc định DDL, theme theo cache).
    function getPreferences() {
        return clonePreferences(currentPreferences ||
            Object.assign({}, DEFAULT_PREFERENCES, { theme: readThemeCache() || DEFAULT_PREFERENCES.theme }));
    }

    // Store đã nạp được từ API chưa (màn hình cài đặt: chưa thì tự gọi loadPreferences).
    function hasPreferences() {
        return !!currentPreferences;
    }

    // ---------- Lưu thiết lập: PUT /api/v1/profile/preferences (U12, M08 mục 3.5.2) ----------
    const PREF_FIELDS = ['theme', 'isSidebarCollapsed', 'itemsPerPage', 'emailNotificationEnabled', 'soundAlertEnabled'];

    // Kiểm tra body như backend: cập nhật một phần, ít nhất một trường, không null, không ép kiểu;
    // trường khác (kể cả dashboardWidgets của bản Admin) → 400. Trả errors hoặc null.
    function validatePreferencesBody(body) {
        const errors = {};
        const add = (field, msg) => { (errors[field] = errors[field] || []).push(msg); };
        const keys = Object.keys(body || {});
        if (keys.length === 0) {
            PREF_FIELDS.forEach(f => add(f, 'Cần gửi ít nhất một trường'));
            return errors;
        }
        keys.forEach(k => { if (!PREF_FIELDS.includes(k)) add(k, 'Trường không được phép cập nhật'); });
        if ('theme' in body && !THEMES.includes(body.theme)) add('theme', 'Chế độ giao diện chỉ nhận LIGHT, DARK hoặc SYSTEM');
        if ('itemsPerPage' in body && ![10, 20, 50].includes(body.itemsPerPage)) add('itemsPerPage', 'Số dòng mỗi trang chỉ nhận 10, 20 hoặc 50');
        ['isSidebarCollapsed', 'emailNotificationEnabled', 'soundAlertEnabled'].forEach(f => {
            if (f in body && typeof body[f] !== 'boolean') add(f, 'Giá trị phải là true hoặc false');
        });
        return Object.keys(errors).length ? errors : null;
    }

    // Mock lỗi lưu: ?prefsSave=fail → lỗi mạng ở lần PUT đầu; ?prefsSave=503 → bảo trì bật sau khi đã nạp (PUT luôn 503).
    let mockPrefsSaveFail = params.get('prefsSave') === 'fail';
    const MOCK_PREFS_SAVE_MAINTENANCE = params.get('prefsSave') === '503';

    // Giả lập backend PUT /api/v1/profile/preferences: thứ tự guard (401/403) → bảo trì (503, trước kiểm tra body)
    // → query/body (400) → đọc users + user_groups (kiểm tra tài khoản, 401) → upsert theo uniq_user_settings chỉ cột
    // đã gửi (user_type = 'USER', không đụng custom_preferences); không ghi audit. 200 data = đúng 5 trường như GET.
    // MOCK_PREFERENCES đóng vai dòng user_settings đã lưu.
    function mockPutUserPreferences(token, body, query) {
        return new Promise(resolve => setTimeout(resolve, 300)).then(() => {
            if (mockPrefsSaveFail) { mockPrefsSaveFail = false; return Promise.reject(new Error('Network Error')); }
            if (!token) return fail(401, 'UNAUTHORIZED', 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
            if (MOCK_MAINTENANCE || MOCK_PREFS_SAVE_MAINTENANCE) return fail(503, 'MAINTENANCE', 'Hệ thống đang bảo trì, vui lòng quay lại sau');
            const errors = (query && Object.keys(query).length)
                ? { query: ['API không nhận tham số truy vấn'] }
                : validatePreferencesBody(body);
            if (errors) {
                return Promise.reject({
                    success: false, statusCode: 400, errorCode: 'VALIDATION_ERROR',
                    message: 'Dữ liệu không hợp lệ', errors, timestamp: now()
                });
            }
            if (MOCK_ACCOUNT_LOCKED) return fail(401, 'UNAUTHORIZED', 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
            Object.assign(MOCK_PREFERENCES, body);
            return {
                success: true, statusCode: 200, message: 'Cập nhật thiết lập thành công',
                data: clonePreferences(MOCK_PREFERENCES), timestamp: now()
            };
        });
    }

    // Lưu một thay đổi theo kiểu "áp ngay, lỗi thì hoàn tác" (M08 mục 3.5.2, khung A10 của adminSession):
    // 1) chụp giá trị cũ các trường của patch, đổi store + áp giao diện ngay (chưa ghi cache memberTheme);
    // 2) PUT chỉ các trường đó qua request() (401 → refresh một lần rồi gửi lại; 503 → biểu ngữ bảo trì);
    // 3) thành công: store = data của response, áp lại + ghi cache; lỗi: trả các trường đó về giá trị cũ rồi ném lỗi
    //    để nơi gọi báo toast. Store trống lúc gọi (nạp ở guard lỗi): lỗi thì store trở lại trống (màn hình cài đặt
    //    vẫn gọi lại GET), giao diện về mặc định + theme đã cache.
    // Vue: action `save(patch)` của store preferencesUser.
    function savePreferences(patch) {
        const wasEmpty = !currentPreferences;
        const before = getPreferences();
        currentPreferences = Object.assign(getPreferences(), patch);
        applyPreferences(currentPreferences, { skipCache: true });
        return request(token => mockPutUserPreferences(token, patch)).then(res => {
            currentPreferences = res.data;
            applyPreferences(currentPreferences);
            return getPreferences();
        }).catch(err => {
            if (wasEmpty) {
                currentPreferences = null;
            } else {
                // Chỉ trả các trường của lần gửi này (lần lưu khác đang chạy không bị ghi đè); khóa lạ thì bỏ.
                const next = getPreferences();
                Object.keys(patch).forEach(k => { if (k in before) next[k] = before[k]; else delete next[k]; });
                currentPreferences = next;
            }
            applyPreferences(getPreferences(), { skipCache: true });
            throw err;
        });
    }

    // Giả lập một API nghiệp vụ bất kỳ của cổng Member (vd. GET /api/v1/profile) để minh họa request():
    // không token/hết hạn → 401; đang bảo trì → 503 MAINTENANCE (errors = null).
    function mockUserApi(token) {
        return new Promise(resolve => setTimeout(resolve, 200)).then(() => {
            if (!token) return fail(401, 'UNAUTHORIZED', 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
            if (MOCK_MAINTENANCE) return fail(503, 'MAINTENANCE', 'Hệ thống đang bảo trì');
            return { success: true, statusCode: 200, message: 'OK', data: null, timestamp: now() };
        });
    }

    // Guard lần đầu vào cổng (kể cả tải lại trang): chưa có token → refresh (chạy cả khi đang bảo trì).
    // Thành công thì gọi GET /api/v1/auth/me (U04) nạp `user` vào store, rồi GET /api/v1/profile/preferences (U11)
    // nạp store thiết lập (lỗi khác 401, kể cả 503, không chặn: dùng mặc định); 401 → về login.
    // Vue: router.beforeEach → ensureSession(), rồi kiểm tra meta.permissions với authUser.user.permissions.
    function ensureSession() {
        const ready = accessToken ? Promise.resolve(accessToken) : refreshOnce();
        return ready
            .then(() => loadMe())
            .then(user => loadPreferences().catch(() => null).then(() => user))
            .catch(err => { if (!err || err.statusCode === 401) goLogin(); return null; });
    }

    // Giả lập backend POST /api/v1/auth/logout (U03, M03 mục 3.2.1): không có body; KHÔNG bị bảo trì chặn.
    // Luôn 200 data = null kèm Set-Cookie xóa cookie (idempotent: không có cookie/phiên đã thu hồi vẫn 200);
    // Access Token thiếu/hết hạn → 401 UNAUTHORIZED (request() sẽ refresh một lần rồi gửi lại).
    function mockUserLogout(token) {
        return new Promise(resolve => setTimeout(resolve, 300)).then(() => {
            if (!token) return fail(401, 'UNAUTHORIZED', 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
            mockHasRefreshCookie = false; // backend đã thu hồi phiên (LOGOUT) và xóa cookie
            return { success: true, statusCode: 200, message: 'Đăng xuất thành công', data: null, timestamp: now() };
        });
    }

    // Đăng xuất: gọi API qua request() (401 → refresh một lần rồi gửi lại), rồi DÙ thành công hay lỗi
    // vẫn xóa phiên phía client và về trang đăng nhập.
    // Vue: authUser.clear(); preferencesUser.clear(); userSocket.disconnect() (namespace /notifications);
    //      router.replace({ name: 'member.login' }). Cache `memberTheme` ở localStorage giữ lại.
    function logout() {
        return request(token => mockUserLogout(token), { maintenanceExempt: true })
            .catch(() => null)
            .then(() => { accessToken = null; currentUser = null; currentPreferences = null; goLogin(); });
    }

    // Sau đăng nhập (token đầy đủ, mustChangePassword = false; token PASSWORD_CHANGE_ONLY không có cookie)
    // hoặc tự đổi mật khẩu: đặt token mới, backend đã đặt cookie Refresh Token qua Set-Cookie.
    // Vue: authUser.setAccessToken(token); sau đăng nhập authUser.user = data.user (không gọi /auth/me).
    function setAccessToken(token) {
        accessToken = token;
        mockHasRefreshCookie = true;
    }

    // Trang tĩnh: không chạy guard (để mở từng trang HTML được), chỉ đổ dữ liệu mẫu vào header/sidebar
    // như sau khi guard nạp /auth/me. Vue: guard gọi ensureSession().
    // Thiết lập: như sau khi guard nạp preferences — thành công thì store có dữ liệu mẫu; ?maintenance=1 (503),
    // ?prefsError=1 (lỗi mạng) thì store trống, áp mặc định + theme đã cache (không ghi đè cache).
    document.addEventListener('DOMContentLoaded', () => {
        renderAccount(getAccount());
        if (MOCK_MAINTENANCE) setMaintenanceBanner(true);
        if (MOCK_MAINTENANCE || mockPrefsNetworkError) {
            applyPreferences(getPreferences(), { skipCache: true });
        } else {
            currentPreferences = clonePreferences(MOCK_PREFERENCES);
            applyPreferences(currentPreferences);
        }
    });

    return { ensureSession, request, refreshOnce, loadMe, logout, renderAccount, getAccount, updateAccount, setAccessToken, mockUserApi,
        loadPreferences, getPreferences, hasPreferences, savePreferences, applyPreferences };
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
    // Đang gửi POST /auth/logout (nút đã khóa) thì không đóng hộp.
    const busy = document.querySelector('#logoutModal .confirm-modal-btn--danger');
    if (busy && busy.disabled) return;
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
    window.memberSession.logout();
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
