/**
 * EVN CDR AS - System Settings Script
 * Đồng bộ logic tương tác cho templates/system-settings.html
 */

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------
    // 1. Toast Notification Helper
    // ----------------------------------------------------
    function notify(message, type = 'success') {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        } else if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
        } else {
            alert(message);
        }
    }

    // ----------------------------------------------------
    // 2. Navigation & Smooth Scroll to Section (Lướt 1 page - Kiểu user-settings.html)
    // ----------------------------------------------------
    // Mục cần quyền (data-permission): hiện khi store có mã quyền, ngược lại giữ ẩn (00 mục 5.3.3).
    // Vue: v-if="authAdmin.permissions.includes('admin:manage')"; backend vẫn kiểm tra quyền ở từng API.
    const account = window.adminSession ? window.adminSession.getAccount() : null;
    const permissions = (account && account.permissions) || [];
    document.querySelectorAll('[data-permission]').forEach(el => {
        el.hidden = !permissions.includes(el.dataset.permission);
    });

    const navButtons = document.querySelectorAll('.profile-nav-btn:not([hidden]), .settings-nav-btn:not([hidden])');
    const sections = ['analysis', 'reporting', 'advanced', 'admins', 'audit-logs']
        .filter(id => { const el = document.getElementById(`section-${id}`); return el && !el.hidden; });

    function setActiveNav(sectionId) {
        navButtons.forEach(btn => {
            const target = btn.getAttribute('data-section') || btn.getAttribute('data-tab');
            if (target === sectionId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    function scrollToSection(sectionId) {
        setActiveNav(sectionId);
        const el = document.getElementById(`section-${sectionId}`) || document.getElementById(sectionId);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = btn.getAttribute('data-section') || btn.getAttribute('data-tab');
            if (sectionId) {
                scrollToSection(sectionId);
                history.replaceState(null, '', `#${sectionId}`);
            }
        });
    });

    // IntersectionObserver to sync active nav on scroll
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id.replace('section-', '');
                    setActiveNav(id);
                }
            });
        }, {
            rootMargin: '-20% 0px -60% 0px',
            threshold: 0
        });

        sections.forEach(id => {
            const el = document.getElementById(`section-${id}`) || document.getElementById(id);
            if (el) observer.observe(el);
        });
    }

    // Mở trực tiếp mục: Vue dùng /admin/settings?section=<key> (thiếu quyền → mục đầu tiên được phép);
    // trang tĩnh nhận cả ?section= và #<key>.
    const currentHash = new URLSearchParams(window.location.search).get('section')
        || window.location.hash.replace('#', '').replace('section-', '');
    if (currentHash && sections.includes(currentHash)) {
        setTimeout(() => {
            scrollToSection(currentHash);
        }, 100);
    }

    // ----------------------------------------------------
    // 3. Form Submissions (Analysis & Reporting)
    // ----------------------------------------------------
    const formAnalysis = document.getElementById('formAnalysis');
    if (formAnalysis) {
        formAnalysis.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = formAnalysis.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                const originalText = submitBtn.textContent;
                submitBtn.textContent = 'Đang lưu...';
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                    notify('Lưu quy tắc phân tích thành công!', 'success');
                }, 600);
            } else {
                notify('Lưu quy tắc phân tích thành công!', 'success');
            }
        });
    }

    const formReporting = document.getElementById('formReporting');
    if (formReporting) {
        formReporting.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = formReporting.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                const originalText = submitBtn.textContent;
                submitBtn.textContent = 'Đang lưu...';
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                    notify('Lưu chính sách báo cáo & lưu trữ thành công!', 'success');
                }, 600);
            } else {
                notify('Lưu chính sách báo cáo & lưu trữ thành công!', 'success');
            }
        });
    }

    // ----------------------------------------------------
    // 4. Custom Confirm Modal
    // ----------------------------------------------------
    const confirmModal = document.getElementById('confirmModal');
    const confirmModalTitle = document.getElementById('confirmModalTitle');
    const confirmModalMessage = document.getElementById('confirmModalMessage');
    const confirmModalIconWrapper = document.getElementById('confirmModalIconWrapper');
    const confirmModalIconDanger = document.getElementById('confirmModalIconDanger');
    const confirmModalIconWarning = document.getElementById('confirmModalIconWarning');
    const confirmModalIconPrimary = document.getElementById('confirmModalIconPrimary');
    const confirmModalCancelBtn = document.getElementById('confirmModalCancelBtn');
    const confirmModalActionBtn = document.getElementById('confirmModalActionBtn');
    const confirmModalBtnText = document.getElementById('confirmModalBtnText');

    let currentConfirmAction = null;

    function showConfirmModal({ title, message, confirmText = 'Xác nhận', cancelText = 'Hủy bỏ', type = 'danger', action }) {
        if (!confirmModal) return;

        confirmModalTitle.textContent = title;
        confirmModalMessage.textContent = message;
        confirmModalBtnText.textContent = confirmText;
        confirmModalCancelBtn.textContent = cancelText;

        // Reset icon wrapper and action button classes
        confirmModalIconWrapper.className = `confirm-modal-icon-wrapper confirm-modal-icon--${type}`;
        confirmModalActionBtn.className = `confirm-modal-btn confirm-modal-btn--${type}`;

        // Switch icon by type
        if (confirmModalIconDanger) confirmModalIconDanger.style.display = type === 'danger' ? 'block' : 'none';
        if (confirmModalIconWarning) confirmModalIconWarning.style.display = type === 'warning' ? 'block' : 'none';
        if (confirmModalIconPrimary) confirmModalIconPrimary.style.display = type === 'primary' ? 'block' : 'none';

        currentConfirmAction = action;
        confirmModal.style.display = 'flex';
    }

    function closeConfirmModal() {
        if (!confirmModal) return;
        confirmModal.style.display = 'none';
        currentConfirmAction = null;
        if (confirmModalActionBtn) confirmModalActionBtn.disabled = false;
        if (confirmModalCancelBtn) confirmModalCancelBtn.disabled = false;
        const spinner = confirmModalActionBtn?.querySelector('.spinner-small');
        if (spinner) spinner.remove();
    }

    if (confirmModal) {
        // Đang gửi (nút xác nhận bị khóa) thì không đóng hộp bằng Hủy/nền/Escape
        const isConfirmBusy = () => confirmModalActionBtn && confirmModalActionBtn.disabled;
        if (confirmModalCancelBtn) {
            confirmModalCancelBtn.addEventListener('click', () => { if (!isConfirmBusy()) closeConfirmModal(); });
        }
        confirmModal.addEventListener('click', (e) => {
            if (e.target === confirmModal && !isConfirmBusy()) closeConfirmModal();
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && confirmModal.style.display !== 'none' && !isConfirmBusy()) {
                closeConfirmModal();
            }
        });

        if (confirmModalActionBtn) {
            confirmModalActionBtn.addEventListener('click', () => {
                if (currentConfirmAction) {
                    confirmModalActionBtn.disabled = true;
                    if (confirmModalCancelBtn) confirmModalCancelBtn.disabled = true;
                    const spinner = document.createElement('span');
                    spinner.className = 'spinner-small';
                    confirmModalActionBtn.prepend(spinner);

                    currentConfirmAction(() => {
                        closeConfirmModal();
                    });
                } else {
                    closeConfirmModal();
                }
            });
        }
    }

    // ----------------------------------------------------
    // 5. Maintenance Mode Toggle Logic
    // ----------------------------------------------------
    let isMaintenanceActive = false;
    const btnToggleMaintenance = document.getElementById('btnToggleMaintenance');

    function updateMaintenanceButton() {
        if (!btnToggleMaintenance) return;
        if (isMaintenanceActive) {
            btnToggleMaintenance.textContent = 'Tắt bảo trì';
            btnToggleMaintenance.className = 'btn btn-primary';
        } else {
            btnToggleMaintenance.textContent = 'Bật bảo trì';
            btnToggleMaintenance.className = 'btn btn-outline-danger';
        }
    }

    if (btnToggleMaintenance) {
        btnToggleMaintenance.addEventListener('click', () => {
            if (!isMaintenanceActive) {
                showConfirmModal({
                    title: 'Xác nhận thay đổi chế độ bảo trì',
                    message: 'Bạn có chắc chắn muốn bật chế độ bảo trì? Người dùng thường sẽ không thể truy cập giao diện trong thời gian này.',
                    confirmText: 'Bật bảo trì',
                    cancelText: 'Hủy bỏ',
                    type: 'danger',
                    action: (done) => {
                        setTimeout(() => {
                            isMaintenanceActive = true;
                            updateMaintenanceButton();
                            notify('Đã bật chế độ bảo trì hệ thống!', 'warning');
                            done();
                        }, 500);
                    }
                });
            } else {
                showConfirmModal({
                    title: 'Xác nhận thay đổi chế độ bảo trì',
                    message: 'Bạn có chắc chắn muốn tắt chế độ bảo trì và mở lại quyền truy cập cho người dùng?',
                    confirmText: 'Tắt bảo trì',
                    cancelText: 'Hủy bỏ',
                    type: 'primary',
                    action: (done) => {
                        setTimeout(() => {
                            isMaintenanceActive = false;
                            updateMaintenanceButton();
                            notify('Đã tắt chế độ bảo trì hệ thống!', 'success');
                            done();
                        }, 500);
                    }
                });
            }
        });
    }

    // ----------------------------------------------------
    // 6. Clear Cache Logic
    // ----------------------------------------------------
    const btnClearCache = document.getElementById('btnClearCache');
    if (btnClearCache) {
        btnClearCache.addEventListener('click', (e) => {
            e.preventDefault();
            const originalText = btnClearCache.textContent;
            btnClearCache.textContent = 'Đang xóa...';
            btnClearCache.disabled = true;

            setTimeout(() => {
                notify('Đã xóa toàn bộ bộ nhớ đệm (Cache) hệ thống!', 'success');
                btnClearCache.textContent = originalText;
                btnClearCache.disabled = false;
            }, 800);
        });
    }

    // ----------------------------------------------------
    // 7. Mục "Quản trị viên" (AdminAccountsSection.vue) – docs/modules/04_auth_admin.md mục 3.2, 3.3, 3.4, 3.6, 3.7, 3.8, 5.2
    // Khung dựng ở A14. Vue: gọi qua API client của cổng Admin (401 → refresh một lần, mẫu window.adminSession.request).
    // ----------------------------------------------------
    // Helper mock dùng chung cho các mục 7, 8 (envelope 02 mục 2.1, 2.3)
    const now = () => new Date().toISOString();
    const unauthorized = () => ({
        success: false, statusCode: 401, errorCode: 'UNAUTHORIZED',
        message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', errors: null, timestamp: now()
    });
    const validationError = errors => ({
        success: false, statusCode: 400, errorCode: 'VALIDATION_ERROR',
        message: 'Dữ liệu không hợp lệ', errors, timestamp: now()
    });
    const callApi = fn => (window.adminSession ? window.adminSession.request(fn) : fn('mock-token'));

    initAuditLogs(); // mục 8, độc lập với mục "Quản trị viên" (quyền khác: audit:view)

    const adminsSection = document.getElementById('section-admins');
    if (!adminsSection || adminsSection.hidden) return; // thiếu admin:manage: không tải, không gọi API

    const currentAdminId = account ? account.id : 1; // Vue: authAdmin.admin.id

    // Dữ liệu mẫu (thứ tự tùy ý; mock tự sắp như backend): phần tử đúng 12 trường của GET /api/v1/admin/admins
    // (M04 mục 3.2), không có trường phiên/mật khẩu. 12 dòng để thấy 2 trang với limit = 10.
    const MOCK_ADMINS = [
        { id: 1, username: 'root.admin@evnict.vn', email: 'root.admin@evnict.vn', fullName: 'Quản trị viên Tối cao EVNICT', phoneNumber: '02422222222', avatarUrl: null, status: 'ACTIVE', roleCode: 'ROOT_ADMIN', roleName: 'Quản trị viên tối cao', lastLoginAt: '2026-10-12T08:15:00+07:00', createdAt: '2026-08-15T09:00:00+07:00', updatedAt: '2026-10-12T08:15:00+07:00' },
        { id: 2, username: 'root.backup', email: 'root.backup@evnict.vn', fullName: 'Quản trị viên Tối cao dự phòng', phoneNumber: null, avatarUrl: null, status: 'ACTIVE', roleCode: 'ROOT_ADMIN', roleName: 'Quản trị viên tối cao', lastLoginAt: '2026-10-11T17:18:00+07:00', createdAt: '2026-08-15T09:00:00+07:00', updatedAt: '2026-10-11T17:18:00+07:00' },
        { id: 5, username: 'admin.hanoi', email: 'admin.hanoi@evnhanoi.vn', fullName: 'Kỹ thuật viên Trực ban EVNHANOI', phoneNumber: '0912345678', avatarUrl: null, status: 'ACTIVE', roleCode: 'SYSTEM_ADMIN', roleName: 'Quản trị viên hệ thống', lastLoginAt: '2026-10-12T07:40:00+07:00', createdAt: '2026-09-02T10:00:00+07:00', updatedAt: '2026-10-12T07:40:00+07:00' },
        { id: 7, username: 'admin.npc', email: 'admin.npc@npc.com.vn', fullName: 'Nguyễn Văn Trực', phoneNumber: null, avatarUrl: null, status: 'ACTIVE', roleCode: 'SYSTEM_ADMIN', roleName: 'Quản trị viên hệ thống', lastLoginAt: null, createdAt: '2026-09-20T14:00:00+07:00', updatedAt: '2026-09-20T14:00:00+07:00' },
        { id: 9, username: 'admin.cpc', email: 'admin.cpc@cpc.vn', fullName: 'Trần Thị Giám Sát', phoneNumber: null, avatarUrl: null, status: 'LOCKED', roleCode: 'SYSTEM_ADMIN', roleName: 'Quản trị viên hệ thống', lastLoginAt: '2026-10-01T09:00:00+07:00', createdAt: '2026-09-05T08:00:00+07:00', updatedAt: '2026-10-03T11:00:00+07:00' },
        { id: 12, username: 'admin.old', email: 'admin.old@evnict.vn', fullName: 'Lê Văn Chuyển Công Tác', phoneNumber: null, avatarUrl: null, status: 'INACTIVE', roleCode: 'SYSTEM_ADMIN', roleName: 'Quản trị viên hệ thống', lastLoginAt: '2026-09-10T16:00:00+07:00', createdAt: '2026-08-20T08:00:00+07:00', updatedAt: '2026-09-15T08:00:00+07:00' },
        { id: 13, username: 'admin.spc', email: 'admin.spc@evnspc.vn', fullName: 'Phạm Minh Giám Định', phoneNumber: '0283456789', avatarUrl: null, status: 'ACTIVE', roleCode: 'SYSTEM_ADMIN', roleName: 'Quản trị viên hệ thống', lastLoginAt: '2026-11-04T15:20:00+07:00', createdAt: '2026-10-01T08:00:00+07:00', updatedAt: '2026-11-04T15:20:00+07:00' },
        { id: 14, username: 'admin.hcmc', email: 'admin.hcmc@evnhcmc.vn', fullName: 'Võ Thị Hồng Nhung', phoneNumber: null, avatarUrl: null, status: 'ACTIVE', roleCode: 'SYSTEM_ADMIN', roleName: 'Quản trị viên hệ thống', lastLoginAt: '2026-11-03T09:05:00+07:00', createdAt: '2026-10-02T08:00:00+07:00', updatedAt: '2026-11-03T09:05:00+07:00' },
        { id: 15, username: 'admin.npt', email: 'admin.npt@evnnpt.vn', fullName: 'Đỗ Quang Huy', phoneNumber: null, avatarUrl: null, status: 'ACTIVE', roleCode: 'SYSTEM_ADMIN', roleName: 'Quản trị viên hệ thống', lastLoginAt: null, createdAt: '2026-10-10T08:00:00+07:00', updatedAt: '2026-10-10T08:00:00+07:00' },
        { id: 16, username: 'admin.genco', email: 'admin.genco@genco.vn', fullName: 'Bùi Thanh Sơn', phoneNumber: null, avatarUrl: null, status: 'ACTIVE', roleCode: 'SYSTEM_ADMIN', roleName: 'Quản trị viên hệ thống', lastLoginAt: '2026-10-30T10:00:00+07:00', createdAt: '2026-10-12T08:00:00+07:00', updatedAt: '2026-10-30T10:00:00+07:00' },
        { id: 17, username: 'admin.noc1', email: 'noc1@evnict.vn', fullName: 'Hoàng Văn An', phoneNumber: null, avatarUrl: null, status: 'ACTIVE', roleCode: 'SYSTEM_ADMIN', roleName: 'Quản trị viên hệ thống', lastLoginAt: '2026-11-05T07:00:00+07:00', createdAt: '2026-10-15T08:00:00+07:00', updatedAt: '2026-11-05T07:00:00+07:00' },
        { id: 18, username: 'admin.test', email: 'test.pct@evnict.vn', fullName: 'Tài khoản thử 50% quyền', phoneNumber: null, avatarUrl: null, status: 'LOCKED', roleCode: 'SYSTEM_ADMIN', roleName: 'Quản trị viên hệ thống', lastLoginAt: null, createdAt: '2026-10-20T08:00:00+07:00', updatedAt: '2026-10-21T08:00:00+07:00' }
    ];

    // Dòng auth_sessions (actor_type = ADMIN) để giả lập bước 5 của M04 mục 3.7. Phiên 5103 đã hết hạn mà chưa thu hồi.
    const MOCK_SESSIONS = [
        { id: 5101, actorId: 5, revokedAt: null, revokedReason: null, expiresAt: '2026-12-31T08:00:00+07:00' },
        { id: 5102, actorId: 5, revokedAt: null, revokedReason: null, expiresAt: '2026-12-31T08:00:00+07:00' },
        { id: 5103, actorId: 5, revokedAt: null, revokedReason: null, expiresAt: '2026-10-01T08:00:00+07:00' },
        { id: 5104, actorId: 9, revokedAt: '2026-10-03T11:00:00+07:00', revokedReason: 'ACCOUNT_LOCKED', expiresAt: '2026-12-31T08:00:00+07:00' },
        { id: 5105, actorId: 13, revokedAt: null, revokedReason: null, expiresAt: '2026-12-31T08:00:00+07:00' }
    ];
    const MOCK_AUDIT = []; // dòng audit_logs mà mock ghi (để kiểm tra khi chạy thử)

    // Giả lập GET /api/v1/admin/admins (A15, M04 mục 3.2; quy tắc query chung 02 mục 2.2).
    // query: object tham số như backend nhận (giá trị string, lặp lại → mảng). Mọi lỗi query trả 400 theo tên tham số.
    const ADMIN_STATUSES = ['ACTIVE', 'LOCKED', 'INACTIVE'];
    const ADMIN_QUERY_KEYS = ['page', 'limit', 'search', 'status'];
    const nameCollator = new Intl.Collator('vi', { sensitivity: 'base' }); // gần với ORDER BY full_name (utf8mb4_unicode_ci)

    function mockGetAdmins(token, query) {
        return new Promise(resolve => setTimeout(resolve, 300)).then(() => {
            if (!token) return Promise.reject(unauthorized());
            const q = query || {};
            const errors = {};
            Object.keys(q).forEach(k => {
                if (!ADMIN_QUERY_KEYS.includes(k)) errors[k] = ['Tham số không được nhận'];
                else if (Array.isArray(q[k])) errors[k] = ['Chỉ gửi tham số một lần'];
            });
            const pick = k => (typeof q[k] === 'string' ? q[k] : undefined);
            const intParam = (k, def, max) => {
                const v = pick(k);
                if (v === undefined) return def;
                if (!/^[1-9][0-9]{0,8}$/.test(v) || (max && Number(v) > max)) {
                    errors[k] = [max ? 'Phải là số nguyên từ 1 đến ' + max : 'Phải là số nguyên ≥ 1'];
                    return def;
                }
                return Number(v);
            };
            const page = intParam('page', 1);
            const limit = intParam('limit', 10, 100);
            let search = pick('search');
            search = search === undefined ? '' : search.trim();
            if (search.length > 100) errors.search = ['Tối đa 100 ký tự'];
            const status = pick('status') || '';
            if (status && !ADMIN_STATUSES.includes(status)) errors.status = ['Trạng thái không hợp lệ'];
            if (Object.keys(errors).length) return Promise.reject(validationError(errors));

            // WHERE: status; search khớp chứa trên username/email/full_name, % và _ là ký tự thường (đã thoát)
            const needle = search.toLocaleLowerCase('vi');
            const rows = MOCK_ADMINS.filter(a => (!status || a.status === status)
                && (!needle || [a.username, a.email, a.fullName].some(v => v.toLocaleLowerCase('vi').includes(needle))));
            // ORDER BY ROOT_ADMIN trước, ACTIVE → LOCKED → INACTIVE, full_name, id
            rows.sort((a, b) => (b.roleCode === 'ROOT_ADMIN') - (a.roleCode === 'ROOT_ADMIN')
                || ADMIN_STATUSES.indexOf(a.status) - ADMIN_STATUSES.indexOf(b.status)
                || nameCollator.compare(a.fullName, b.fullName)
                || a.id - b.id);
            const total = rows.length;
            const totalPages = Math.ceil(total / limit);
            const data = rows.slice((page - 1) * limit, page * limit).map(a => Object.assign({}, a));
            return {
                success: true, statusCode: 200, message: 'Lấy danh sách quản trị viên thành công', data,
                pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
                timestamp: now()
            };
        });
    }

    // Giả lập DELETE /api/v1/admin/admins/:id/sessions (A14, M04 mục 3.7).
    // :id sai định dạng/có query/body → 400; :id là chính mình → 403 SELF_ACTION_FORBIDDEN; không có → 404 NOT_FOUND;
    // ROOT_ADMIN → 403 ROOT_ADMIN_PROTECTED (không ghi audit); thu hồi phiên revoked_at IS NULL AND expires_at > NOW()
    // (REVOKED_BY_ADMIN); n > 0 mới ghi AUTH / SESSION_REVOKED (resource_id = id admin đích) → 200 { revokedCount: n }.
    function mockRevokeAdminSessions(token, rawId, query, body) {
        return new Promise(resolve => setTimeout(resolve, 400)).then(() => {
            if (!token) return Promise.reject(unauthorized());
            const errors = {};
            Object.keys(query || {}).forEach(k => { errors[k] = ['Tham số không được nhận']; });
            Object.keys(body || {}).forEach(k => { errors[k] = ['Trường không được nhận']; });
            const idText = String(rawId);
            if (!/^[1-9][0-9]{0,9}$/.test(idText) || Number(idText) > 4294967295) errors.id = ['Mã quản trị viên không hợp lệ'];
            if (Object.keys(errors).length) return Promise.reject(validationError(errors));

            const id = Number(idText);
            if (id === currentAdminId) {
                return Promise.reject({
                    success: false, statusCode: 403, errorCode: 'SELF_ACTION_FORBIDDEN',
                    message: 'Không thể thu hồi mọi phiên của chính mình', errors: null, timestamp: now()
                });
            }
            const target = MOCK_ADMINS.find(a => a.id === id);
            if (!target) {
                return Promise.reject({
                    success: false, statusCode: 404, errorCode: 'NOT_FOUND',
                    message: 'Không tìm thấy quản trị viên', errors: null, timestamp: now()
                });
            }
            if (target.roleCode === 'ROOT_ADMIN') {
                return Promise.reject({
                    success: false, statusCode: 403, errorCode: 'ROOT_ADMIN_PROTECTED',
                    message: 'Không thể thao tác trên tài khoản Quản trị viên tối cao', errors: null, timestamp: now()
                });
            }
            const nowMs = Date.now();
            const live = MOCK_SESSIONS.filter(s => s.actorId === id && !s.revokedAt && Date.parse(s.expiresAt) > nowMs);
            live.forEach(s => { s.revokedAt = now(); s.revokedReason = 'REVOKED_BY_ADMIN'; });
            const n = live.length;
            if (n > 0) {
                MOCK_AUDIT.push({
                    actorType: 'ADMIN', actorId: currentAdminId, action: 'SESSION_REVOKED', resourceName: 'AUTH',
                    resourceId: String(id), actionDetails: { targetActorType: 'ADMIN', revokedCount: n }, createdAt: now()
                });
            }
            return {
                success: true, statusCode: 200,
                message: n > 0 ? 'Đã thu hồi phiên đăng nhập của quản trị viên' : 'Tài khoản không có phiên đăng nhập nào đang hoạt động',
                data: { revokedCount: n }, timestamp: now()
            };
        });
    }

    // Giả lập PUT /api/v1/admin/admins/:id/status (A17, M04 mục 3.4). Thứ tự kiểm tra như backend:
    // 400 (:id, body đúng một trường status ACTIVE|LOCKED, query) → chính mình 403 SELF_ACTION_FORBIDDEN → không có 404
    // → ROOT_ADMIN 403 ROOT_ADMIN_PROTECTED (không ghi audit) → INACTIVE 409 ACCOUNT_INACTIVE → trùng trạng thái 200 không ghi
    // → LOCKED: thu hồi phiên còn hiệu lực (ACCOUNT_LOCKED) + ADMIN / LOCK { revokedCount }; ACTIVE: ADMIN / UNLOCK.
    const ADMIN_SET_STATUSES = ['ACTIVE', 'LOCKED'];
    function mockSetAdminStatus(token, rawId, body, query) {
        return new Promise(resolve => setTimeout(resolve, 400)).then(() => {
            if (!token) return Promise.reject(unauthorized());
            const errors = {};
            Object.keys(query || {}).forEach(k => { errors[k] = ['Tham số không được nhận']; });
            const idText = String(rawId);
            if (!/^[1-9][0-9]{0,9}$/.test(idText) || Number(idText) > 4294967295) errors.id = ['Mã quản trị viên không hợp lệ'];
            const b = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
            Object.keys(b).forEach(k => { if (k !== 'status') errors[k] = ['Trường không được nhận']; });
            if (b.status === undefined || b.status === null) errors.status = ['Bắt buộc nhập'];
            else if (!ADMIN_SET_STATUSES.includes(b.status)) errors.status = ['Chỉ nhận ACTIVE hoặc LOCKED'];
            if (Object.keys(errors).length) return Promise.reject(validationError(errors));

            const id = Number(idText);
            const status = b.status;
            const fail = (statusCode, errorCode, message) => Promise.reject({
                success: false, statusCode, errorCode, message, errors: null, timestamp: now()
            });
            if (id === currentAdminId) return fail(403, 'SELF_ACTION_FORBIDDEN', 'Không thể tự khóa hoặc mở khóa tài khoản của chính mình');
            const target = MOCK_ADMINS.find(a => a.id === id); // backend: SELECT ... FOR UPDATE
            if (!target) return fail(404, 'NOT_FOUND', 'Không tìm thấy quản trị viên');
            if (target.roleCode === 'ROOT_ADMIN') return fail(403, 'ROOT_ADMIN_PROTECTED', 'Không thể thao tác trên tài khoản Quản trị viên tối cao');
            if (target.status === 'INACTIVE') return fail(409, 'ACCOUNT_INACTIVE', 'Tài khoản đã ngừng hoạt động, không thể khóa hoặc mở khóa');

            const ok = message => ({ success: true, statusCode: 200, message, data: { id, status: target.status }, timestamp: now() });
            if (target.status === status) return ok('Tài khoản đã ở trạng thái này'); // không UPDATE, không audit

            const ts = now();
            target.status = status;
            target.updatedAt = ts;
            const audit = { actorType: 'ADMIN', actorId: currentAdminId, resourceName: 'ADMIN', resourceId: String(id), createdAt: ts };
            if (status === 'LOCKED') {
                const nowMs = Date.now();
                const live = MOCK_SESSIONS.filter(x => x.actorId === id && !x.revokedAt && Date.parse(x.expiresAt) > nowMs);
                live.forEach(x => { x.revokedAt = ts; x.revokedReason = 'ACCOUNT_LOCKED'; });
                MOCK_AUDIT.push(Object.assign(audit, { action: 'LOCK', actionDetails: { revokedCount: live.length } }));
                return ok('Đã khóa tài khoản quản trị viên');
            }
            // Mở khóa: không đổi failed_login_count, locked_until; phiên cũ không được khôi phục
            MOCK_AUDIT.push(Object.assign(audit, { action: 'UNLOCK', actionDetails: null }));
            return ok('Đã mở khóa tài khoản quản trị viên');
        });
    }

    // Giả lập POST /api/v1/admin/admins (A16, M04 mục 3.3; quy tắc username/email/phoneNumber 02 mục 2).
    // 400 theo tên trường (thiếu, sai định dạng, quá độ dài, trường khác, có query); 409 ACCOUNT_DUPLICATE khi trùng
    // username/email kể cả trùng chéo với Admin chưa INACTIVE (so không phân biệt hoa thường như collation);
    // 201: data = phần tử GET (12 trường) + temporaryPassword. Backend thêm header Cache-Control: no-store.
    const MOCK_USER_SETTINGS = []; // dòng user_settings (ADMIN) mà mock tạo cùng "transaction"
    const CREATE_ADMIN_FIELDS = ['username', 'email', 'fullName', 'phoneNumber'];
    const USERNAME_RE = /^[A-Za-z0-9._@-]{3,100}$/;
    const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const PHONE_RE = /^(?=.*[0-9])[0-9+\-.() ]{1,30}$/;

    // Mật khẩu tạm 16 ký tự, bỏ ký tự dễ nhầm, đủ 4 nhóm (M04 mục 3.3). Backend: crypto.randomInt + bcrypt cost 10.
    const PW_GROUPS = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghjkmnpqrstuvwxyz', '23456789', '!@#$%^&*-_=+?'];
    function randomInt(max) {
        const buf = new Uint32Array(1);
        const limit = Math.floor(0x100000000 / max) * max; // bỏ phần dư để không lệch phân bố
        do { crypto.getRandomValues(buf); } while (buf[0] >= limit);
        return buf[0] % max;
    }
    function generateTempPassword() {
        const all = PW_GROUPS.join('');
        const chars = PW_GROUPS.map(g => g[randomInt(g.length)]);
        while (chars.length < 16) chars.push(all[randomInt(all.length)]);
        for (let i = chars.length - 1; i > 0; i--) { const j = randomInt(i + 1); [chars[i], chars[j]] = [chars[j], chars[i]]; }
        return chars.join('');
    }

    function mockCreateAdmin(token, body, query) {
        return new Promise(resolve => setTimeout(resolve, 500)).then(() => {
            if (!token) return Promise.reject(unauthorized());
            const errors = {};
            Object.keys(query || {}).forEach(k => { errors[k] = ['Tham số không được nhận']; });
            const b = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
            Object.keys(b).forEach(k => { if (!CREATE_ADMIN_FIELDS.includes(k)) errors[k] = ['Trường không được nhận']; });
            const str = (k, required) => {
                const v = b[k];
                if (v === undefined || v === null) { if (required) errors[k] = ['Bắt buộc nhập']; return null; }
                if (typeof v !== 'string') { errors[k] = ['Phải là chuỗi']; return null; }
                return v.trim();
            };
            const username = str('username', true);
            if (username !== null && !USERNAME_RE.test(username)) {
                errors.username = ['3–100 ký tự: chữ không dấu, chữ số, dấu . _ @ -'];
            }
            const email = str('email', true);
            if (email !== null && (email.length > 150 || !EMAIL_RE.test(email))) errors.email = ['Email không hợp lệ (tối đa 150 ký tự)'];
            const fullName = str('fullName', true);
            if (fullName !== null && (!fullName || fullName.length > 150)) errors.fullName = ['Họ tên 1–150 ký tự'];
            let phoneNumber = str('phoneNumber', false);
            if (phoneNumber === '') phoneNumber = null;
            if (phoneNumber !== null && !PHONE_RE.test(phoneNumber)) errors.phoneNumber = ['Số điện thoại không hợp lệ'];
            if (Object.keys(errors).length) return Promise.reject(validationError(errors));

            // Bước 2: trùng (kể cả chéo) trong các Admin chưa INACTIVE
            const lc = v => v.toLocaleLowerCase('vi');
            const live = MOCK_ADMINS.filter(a => a.status !== 'INACTIVE');
            const taken = new Set();
            live.forEach(a => { taken.add(lc(a.username)); taken.add(lc(a.email)); });
            const dup = {};
            if (taken.has(lc(username))) dup.username = ['Tên đăng nhập đã được dùng (làm tên đăng nhập hoặc email) bởi quản trị viên khác'];
            if (taken.has(lc(email))) dup.email = ['Email đã được dùng (làm email hoặc tên đăng nhập) bởi quản trị viên khác'];
            if (Object.keys(dup).length) {
                return Promise.reject({
                    success: false, statusCode: 409, errorCode: 'ACCOUNT_DUPLICATE',
                    message: 'Tên đăng nhập hoặc email đã tồn tại', errors: dup, timestamp: now()
                });
            }

            // Bước 3–7: admins, admin_roles (SYSTEM_ADMIN), user_settings, audit_logs, đọc lại phần tử GET
            const temporaryPassword = generateTempPassword();
            const id = Math.max(0, ...MOCK_ADMINS.map(a => a.id)) + 1;
            const ts = now();
            const row = {
                id, username, email, fullName, phoneNumber, avatarUrl: null, status: 'ACTIVE',
                roleCode: 'SYSTEM_ADMIN', roleName: 'Quản trị viên hệ thống', lastLoginAt: null, createdAt: ts, updatedAt: ts
            };
            MOCK_ADMINS.push(row);
            MOCK_USER_SETTINGS.push({ userType: 'ADMIN', userId: id });
            MOCK_AUDIT.push({
                actorType: 'ADMIN', actorId: currentAdminId, action: 'CREATE', resourceName: 'ADMIN',
                resourceId: String(id), actionDetails: { username, email, roleCode: 'SYSTEM_ADMIN' }, createdAt: ts
            });
            return {
                success: true, statusCode: 201, message: 'Tạo quản trị viên thành công',
                data: Object.assign({}, row, { temporaryPassword }), timestamp: ts
            };
        });
    }

    // Giả lập PUT /api/v1/admin/admins/:id (A18, M04 mục 3.8). Thứ tự kiểm tra như backend:
    // 400 (:id, query, body cập nhật một phần ≥ 1 trường fullName|email|phoneNumber) → chính mình 403 SELF_ACTION_FORBIDDEN
    // → không có 404 → ROOT_ADMIN 403 ROOT_ADMIN_PROTECTED (không audit) → INACTIVE 409 ACCOUNT_INACTIVE (LOCKED vẫn sửa)
    // → changedFields (so chính xác, phân biệt hoa thường) rỗng: 200 không ghi → email đổi: trùng (kể cả chéo) với Admin
    // chưa INACTIVE khác → 409 ACCOUNT_DUPLICATE (errors.email) → UPDATE + ADMIN / UPDATE { changedFields } → 200 phần tử GET.
    const UPDATE_ADMIN_FIELDS = ['fullName', 'email', 'phoneNumber']; // cũng là thứ tự của changedFields
    function mockUpdateAdmin(token, rawId, body, query) {
        return new Promise(resolve => setTimeout(resolve, 400)).then(() => {
            if (!token) return Promise.reject(unauthorized());
            const errors = {};
            Object.keys(query || {}).forEach(k => { errors[k] = ['Tham số không được nhận']; });
            const idText = String(rawId);
            if (!/^[1-9][0-9]{0,9}$/.test(idText) || Number(idText) > 4294967295) errors.id = ['Mã quản trị viên không hợp lệ'];
            const b = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
            Object.keys(b).forEach(k => { if (!UPDATE_ADMIN_FIELDS.includes(k)) errors[k] = ['Trường không được nhận']; });
            const sent = UPDATE_ADMIN_FIELDS.filter(k => b[k] !== undefined);
            if (!Object.keys(b).length) {
                UPDATE_ADMIN_FIELDS.forEach(k => { errors[k] = ['Cần gửi ít nhất một trường']; });
            }
            const values = {};
            sent.forEach(k => {
                const v = b[k];
                if (k === 'phoneNumber' && v === null) { values[k] = null; return; }
                if (typeof v !== 'string') { errors[k] = [v === null ? 'Không được để trống' : 'Phải là chuỗi']; return; }
                values[k] = v.trim();
            });
            if (values.fullName !== undefined && !errors.fullName && (!values.fullName || values.fullName.length > 150)) {
                errors.fullName = ['Họ tên 1–150 ký tự'];
            }
            if (values.email !== undefined && !errors.email && (values.email.length > 150 || !EMAIL_RE.test(values.email))) {
                errors.email = ['Email không hợp lệ (tối đa 150 ký tự)'];
            }
            if (values.phoneNumber === '') values.phoneNumber = null;
            if (values.phoneNumber && !errors.phoneNumber && !PHONE_RE.test(values.phoneNumber)) {
                errors.phoneNumber = ['Số điện thoại không hợp lệ'];
            }
            if (Object.keys(errors).length) return Promise.reject(validationError(errors));

            const id = Number(idText);
            const fail = (statusCode, errorCode, message, errs = null) => Promise.reject({
                success: false, statusCode, errorCode, message, errors: errs, timestamp: now()
            });
            if (id === currentAdminId) return fail(403, 'SELF_ACTION_FORBIDDEN', 'Không thể sửa tài khoản của chính mình tại đây; dùng trang Hồ sơ cá nhân');
            const target = MOCK_ADMINS.find(a => a.id === id); // backend: SELECT ... FOR UPDATE
            if (!target) return fail(404, 'NOT_FOUND', 'Không tìm thấy quản trị viên');
            if (target.roleCode === 'ROOT_ADMIN') return fail(403, 'ROOT_ADMIN_PROTECTED', 'Không thể thao tác trên tài khoản Quản trị viên tối cao');
            if (target.status === 'INACTIVE') return fail(409, 'ACCOUNT_INACTIVE', 'Tài khoản đã ngừng hoạt động, không thể sửa');

            const changedFields = UPDATE_ADMIN_FIELDS.filter(k => k in values && values[k] !== target[k]);
            const ok = message => ({ success: true, statusCode: 200, message, data: Object.assign({}, target), timestamp: now() });
            if (!changedFields.length) return ok('Không có thay đổi nào'); // không UPDATE, không audit

            if (changedFields.includes('email')) {
                const lc = v => v.toLocaleLowerCase('vi');
                const e = lc(values.email);
                const clash = MOCK_ADMINS.some(a => a.id !== id && a.status !== 'INACTIVE'
                    && (lc(a.username) === e || lc(a.email) === e));
                if (clash) {
                    return fail(409, 'ACCOUNT_DUPLICATE', 'Email đã tồn tại',
                        { email: ['Email đã được dùng (làm email hoặc tên đăng nhập) bởi quản trị viên khác'] });
                }
            }
            const ts = now();
            changedFields.forEach(k => { target[k] = values[k]; });
            target.updatedAt = ts;
            MOCK_AUDIT.push({
                actorType: 'ADMIN', actorId: currentAdminId, action: 'UPDATE', resourceName: 'ADMIN',
                resourceId: String(id), actionDetails: { changedFields }, createdAt: ts
            });
            return ok('Cập nhật quản trị viên thành công');
        });
    }

    // Cột bí mật của admins (không có trong phần tử GET, chỉ để mock giả lập bước 6 của M04 mục 3.6).
    // Admin 13 đang khóa tạm do sai mật khẩu.
    const MOCK_ADMIN_SECRETS = {
        13: { passwordHash: 'bcrypt:old', mustChangePassword: 0, failedLoginCount: 3, lockedUntil: '2026-12-31T08:00:00+07:00', passwordChangedAt: '2026-10-01T08:00:00+07:00' }
    };

    // Giả lập PUT /api/v1/admin/admins/:id/reset-password (A19, M04 mục 3.6). Thứ tự kiểm tra như backend:
    // 400 (:id, query, body có trường) → chính mình 403 SELF_ACTION_FORBIDDEN → không có 404 → ROOT_ADMIN 403
    // ROOT_ADMIN_PROTECTED (không audit) → INACTIVE 409 ACCOUNT_INACTIVE (LOCKED vẫn đặt lại, giữ LOCKED)
    // → mật khẩu mới + must_change_password = 1 + xóa khóa tạm → thu hồi phiên còn hiệu lực (PASSWORD_CHANGED)
    // → AUTH / PASSWORD_RESET { targetActorType: 'ADMIN', revokedCount } (kể cả 0) → 200 { id, temporaryPassword }.
    // Backend: sinh + băm trước transaction, header Cache-Control: no-store, không ghi mật khẩu vào log.
    function mockResetAdminPassword(token, rawId, query, body) {
        return new Promise(resolve => setTimeout(resolve, 500)).then(() => {
            if (!token) return Promise.reject(unauthorized());
            const errors = {};
            Object.keys(query || {}).forEach(k => { errors[k] = ['Tham số không được nhận']; });
            Object.keys(body || {}).forEach(k => { errors[k] = ['Trường không được nhận']; });
            const idText = String(rawId);
            if (!/^[1-9][0-9]{0,9}$/.test(idText) || Number(idText) > 4294967295) errors.id = ['Mã quản trị viên không hợp lệ'];
            if (Object.keys(errors).length) return Promise.reject(validationError(errors));

            const id = Number(idText);
            const fail = (statusCode, errorCode, message) => Promise.reject({
                success: false, statusCode, errorCode, message, errors: null, timestamp: now()
            });
            if (id === currentAdminId) return fail(403, 'SELF_ACTION_FORBIDDEN', 'Không thể tự đặt lại mật khẩu của chính mình; dùng chức năng Đổi mật khẩu');
            const target = MOCK_ADMINS.find(a => a.id === id); // backend: SELECT ... FOR UPDATE
            if (!target) return fail(404, 'NOT_FOUND', 'Không tìm thấy quản trị viên');
            if (target.roleCode === 'ROOT_ADMIN') return fail(403, 'ROOT_ADMIN_PROTECTED', 'Không thể thao tác trên tài khoản Quản trị viên tối cao');
            if (target.status === 'INACTIVE') return fail(409, 'ACCOUNT_INACTIVE', 'Tài khoản đã ngừng hoạt động, không thể đặt lại mật khẩu');

            const temporaryPassword = generateTempPassword();
            const ts = now();
            const secret = MOCK_ADMIN_SECRETS[id] || (MOCK_ADMIN_SECRETS[id] = { passwordChangedAt: null });
            Object.assign(secret, {
                passwordHash: 'bcrypt:<bản băm mới>', mustChangePassword: 1, failedLoginCount: 0, lockedUntil: null
            }); // passwordChangedAt giữ nguyên
            target.updatedAt = ts; // status giữ nguyên (LOCKED vẫn LOCKED)
            const nowMs = Date.now();
            const live = MOCK_SESSIONS.filter(x => x.actorId === id && !x.revokedAt && Date.parse(x.expiresAt) > nowMs);
            live.forEach(x => { x.revokedAt = ts; x.revokedReason = 'PASSWORD_CHANGED'; });
            MOCK_AUDIT.push({
                actorType: 'ADMIN', actorId: currentAdminId, action: 'PASSWORD_RESET', resourceName: 'AUTH',
                resourceId: String(id), actionDetails: { targetActorType: 'ADMIN', revokedCount: live.length }, createdAt: ts
            });
            return {
                success: true, statusCode: 200, message: 'Đã đặt lại mật khẩu quản trị viên',
                data: { id, temporaryPassword }, timestamp: ts
            };
        });
    }

    // Giả lập DELETE /api/v1/admin/admins/:id (A21, M04 mục 3.9). Thứ tự kiểm tra như backend:
    // 400 (:id, query, body có trường) → chính mình 403 SELF_ACTION_FORBIDDEN (không audit) → không có 404
    // → ROOT_ADMIN 403 ROOT_ADMIN_PROTECTED: rollback rồi ghi riêng ADMIN / ACCESS_DENIED → INACTIVE 409 ACCOUNT_INACTIVE
    // (LOCKED vẫn ngừng hoạt động được) → status = INACTIVE, thu hồi phiên còn hiệu lực (ACCOUNT_LOCKED)
    // → ADMIN / DEACTIVATE { revokedCount } (kể cả 0) → 200 { id, status: 'INACTIVE' }. Không xóa cứng.
    function mockDeactivateAdmin(token, rawId, query, body) {
        return new Promise(resolve => setTimeout(resolve, 400)).then(() => {
            if (!token) return Promise.reject(unauthorized());
            const errors = {};
            Object.keys(query || {}).forEach(k => { errors[k] = ['Tham số không được nhận']; });
            Object.keys(body || {}).forEach(k => { errors[k] = ['Trường không được nhận']; });
            const idText = String(rawId);
            if (!/^[1-9][0-9]{0,9}$/.test(idText) || Number(idText) > 4294967295) errors.id = ['Mã quản trị viên không hợp lệ'];
            if (Object.keys(errors).length) return Promise.reject(validationError(errors));

            const id = Number(idText);
            const fail = (statusCode, errorCode, message) => Promise.reject({
                success: false, statusCode, errorCode, message, errors: null, timestamp: now()
            });
            if (id === currentAdminId) return fail(403, 'SELF_ACTION_FORBIDDEN', 'Không thể tự ngừng hoạt động tài khoản của chính mình');
            const target = MOCK_ADMINS.find(a => a.id === id); // backend: SELECT ... FOR UPDATE
            if (!target) return fail(404, 'NOT_FOUND', 'Không tìm thấy quản trị viên');
            if (target.roleCode === 'ROOT_ADMIN') {
                // Backend: ROLLBACK transaction chính rồi INSERT riêng (cảnh báo an ninh không mất theo rollback)
                MOCK_AUDIT.push({
                    actorType: 'ADMIN', actorId: currentAdminId, action: 'ACCESS_DENIED', resourceName: 'ADMIN',
                    resourceId: String(id), actionDetails: { attemptedAction: 'DEACTIVATE', errorCode: 'ROOT_ADMIN_PROTECTED' }, createdAt: now()
                });
                return fail(403, 'ROOT_ADMIN_PROTECTED', 'Không thể thao tác trên tài khoản Quản trị viên tối cao');
            }
            if (target.status === 'INACTIVE') return fail(409, 'ACCOUNT_INACTIVE', 'Tài khoản đã ngừng hoạt động');

            const ts = now();
            target.status = 'INACTIVE'; // username/email được giải phóng (username_active/email_active = NULL)
            target.updatedAt = ts;
            const nowMs = Date.now();
            const live = MOCK_SESSIONS.filter(x => x.actorId === id && !x.revokedAt && Date.parse(x.expiresAt) > nowMs);
            live.forEach(x => { x.revokedAt = ts; x.revokedReason = 'ACCOUNT_LOCKED'; });
            MOCK_AUDIT.push({
                actorType: 'ADMIN', actorId: currentAdminId, action: 'DEACTIVATE', resourceName: 'ADMIN',
                resourceId: String(id), actionDetails: { revokedCount: live.length }, createdAt: ts
            });
            return {
                success: true, statusCode: 200, message: 'Đã ngừng hoạt động tài khoản quản trị viên',
                data: { id, status: 'INACTIVE' }, timestamp: ts
            };
        });
    }

    // Định dạng ở frontend (API chỉ trả ISO 8601 và mã enum, R16-07)
    const dateTimeFmt = new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
    const STATUS_LABELS = { ACTIVE: 'Hoạt động', LOCKED: 'Đã khóa', INACTIVE: 'Ngừng hoạt động' };

    const adminsState = document.getElementById('adminsState');
    const adminsMessage = document.getElementById('adminsMessage');
    const btnRetryAdmins = document.getElementById('btnRetryAdmins');
    const adminsTableWrap = document.getElementById('adminsTableWrap');
    const adminsTableBody = document.getElementById('adminsTableBody');
    const adminsSearch = document.getElementById('adminsSearch');
    const adminsStatusFilter = document.getElementById('adminsStatusFilter');
    const adminsPagination = document.getElementById('adminsPagination');
    const adminsPageInfo = document.getElementById('adminsPageInfo');
    const adminsPageList = document.getElementById('adminsPageList');
    // Trạng thái bộ lọc của mục (Vue: ref trong AdminAccountsSection.vue). limit cố định 10.
    const adminsQuery = { page: 1, limit: 10, search: '', status: '' };
    let adminsRequestSeq = 0; // chỉ hiển thị kết quả của request gửi sau cùng
    let adminRows = new Map(); // id → phần tử của GET, để hộp xác nhận nêu họ tên/tên đăng nhập

    function setAdminsState(state, message) {
        adminsState.hidden = state === 'ready';
        adminsState.classList.toggle('is-error', state === 'error');
        if (message) adminsMessage.textContent = message;
        btnRetryAdmins.hidden = state !== 'error';
        adminsTableWrap.hidden = state !== 'ready';
        if (state !== 'ready') adminsPagination.hidden = true;
    }

    // Thanh phân trang theo khung pagination (02 mục 2.2): "Hiển thị x–y / tổng", nút trước/sau và các trang gần trang hiện tại
    function renderAdminsPagination(p, count) {
        const from = (p.page - 1) * p.limit + 1;
        adminsPageInfo.textContent = 'Hiển thị ' + from + '–' + (from + count - 1) + ' / ' + p.total + ' quản trị viên';
        adminsPageList.replaceChildren();
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
            adminsPageList.appendChild(li);
        };
        addItem('«', p.page - 1, { disabled: !p.hasPrev, aria: 'Trang trước' });
        const first = Math.max(1, Math.min(p.page - 2, p.totalPages - 4));
        const last = Math.min(p.totalPages, first + 4);
        for (let i = first; i <= last; i++) addItem(String(i), i, { active: i === p.page });
        addItem('»', p.page + 1, { disabled: !p.hasNext, aria: 'Trang sau' });
        adminsPagination.hidden = false;
    }

    // Nút "Thu hồi phiên": chỉ dòng ACTIVE, không ROOT_ADMIN, không phải chính mình (M04 mục 3.7 Frontend)
    const canRevokeSessions = row => row.status === 'ACTIVE' && row.roleCode !== 'ROOT_ADMIN' && row.id !== currentAdminId;
    // Nút "Khóa" (dòng ACTIVE) / "Mở khóa" (dòng LOCKED): không ROOT_ADMIN, không phải chính mình (M04 mục 3.4 Frontend)
    const canSetStatus = row => (row.status === 'ACTIVE' || row.status === 'LOCKED')
        && row.roleCode !== 'ROOT_ADMIN' && row.id !== currentAdminId;
    // Nút "Sửa": cùng điều kiện với Khóa/Mở khóa (dòng ACTIVE/LOCKED, không ROOT_ADMIN, không phải mình; M04 mục 3.8 Frontend)
    const canEdit = canSetStatus;
    const canResetPassword = canSetStatus; // A19: ACTIVE hoặc LOCKED, không ROOT_ADMIN, không phải mình
    const canDeactivate = canSetStatus; // A21: ACTIVE hoặc LOCKED, không ROOT_ADMIN, không phải mình

    // Dựng bằng textContent (không innerHTML): họ tên, email do người dùng nhập
    function renderAdmins(rows) {
        adminsTableBody.replaceChildren();
        adminRows = new Map(rows.map(r => [String(r.id), r]));
        rows.forEach(row => {
            const tr = document.createElement('tr');
            tr.dataset.adminId = String(row.id);

            const who = document.createElement('td');
            const name = document.createElement('div');
            name.className = 'fw-600';
            name.textContent = row.fullName;
            if (row.id === currentAdminId) {
                const me = document.createElement('span');
                me.className = 'admins-self-tag';
                me.textContent = 'Bạn';
                name.appendChild(me);
            }
            const uname = document.createElement('div');
            uname.className = 'text-muted admins-sub';
            uname.textContent = row.username;
            who.append(name, uname);

            const email = document.createElement('td');
            email.textContent = row.email;

            const role = document.createElement('td');
            const roleBadge = document.createElement('span');
            roleBadge.className = 'admins-role' + (row.roleCode === 'ROOT_ADMIN' ? ' admins-role--root' : '');
            roleBadge.textContent = row.roleName;
            role.appendChild(roleBadge);

            const status = document.createElement('td');
            const statusBadge = document.createElement('span');
            statusBadge.className = 'badge-status admins-status--' + row.status.toLowerCase();
            statusBadge.textContent = STATUS_LABELS[row.status] || row.status;
            status.appendChild(statusBadge);

            const lastLogin = document.createElement('td');
            lastLogin.textContent = row.lastLoginAt ? dateTimeFmt.format(new Date(row.lastLoginAt)) : 'Chưa đăng nhập';

            const actions = document.createElement('td');
            actions.className = 'admins-actions-col';
            if (canEdit(row)) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'btn btn-outline btn-edit-admin';
                btn.dataset.adminId = String(row.id);
                btn.textContent = 'Sửa';
                actions.appendChild(btn);
            }
            if (canSetStatus(row)) {
                const lock = row.status === 'ACTIVE';
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'btn ' + (lock ? 'btn-outline-danger' : 'btn-outline') + ' btn-admin-status';
                btn.dataset.adminId = String(row.id);
                btn.dataset.status = lock ? 'LOCKED' : 'ACTIVE'; // trạng thái sẽ gửi
                btn.textContent = lock ? 'Khóa' : 'Mở khóa';
                actions.appendChild(btn);
            }
            if (canResetPassword(row)) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'btn btn-outline btn-reset-admin-password';
                btn.dataset.adminId = String(row.id);
                btn.textContent = 'Đặt lại mật khẩu';
                actions.appendChild(btn);
            }
            if (canRevokeSessions(row)) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'btn btn-outline-danger btn-revoke-sessions';
                btn.dataset.adminId = String(row.id);
                btn.textContent = 'Thu hồi phiên';
                actions.appendChild(btn);
            }
            if (canDeactivate(row)) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'btn btn-outline-danger btn-deactivate-admin';
                btn.dataset.adminId = String(row.id);
                btn.textContent = 'Ngừng hoạt động';
                actions.appendChild(btn);
            }

            tr.append(who, email, role, status, lastLogin, actions);
            adminsTableBody.appendChild(tr);
        });
    }

    // Tải danh sách – GET /api/v1/admin/admins (A15, M04 mục 3.2 Frontend). Chỉ gửi tham số có giá trị:
    // search rỗng sau khi cắt và "Tất cả trạng thái" thì bỏ tham số; page/limit luôn gửi.
    function loadAdmins() {
        const seq = ++adminsRequestSeq;
        const query = { page: String(adminsQuery.page), limit: String(adminsQuery.limit) };
        if (adminsQuery.search) query.search = adminsQuery.search;
        if (adminsQuery.status) query.status = adminsQuery.status;
        setAdminsState('loading', 'Đang tải danh sách quản trị viên...');
        return callApi(token => mockGetAdmins(token, query))
            .then(res => {
                if (seq !== adminsRequestSeq) return; // đã có request mới hơn
                const p = res.pagination;
                if (!res.data.length && p.page > 1 && p.totalPages > 0) {
                    adminsQuery.page = p.totalPages; // danh sách ngắn lại (vd. sau thao tác): lùi về trang cuối
                    return loadAdmins();
                }
                if (!res.data.length) {
                    const filtered = adminsQuery.search || adminsQuery.status;
                    setAdminsState('empty', filtered ? 'Không có quản trị viên phù hợp với bộ lọc' : 'Chưa có quản trị viên nào');
                    return;
                }
                renderAdmins(res.data);
                setAdminsState('ready');
                renderAdminsPagination(p, res.data.length);
            })
            .catch(err => {
                if (seq !== adminsRequestSeq) return;
                if (err && err.statusCode === 401) return; // request() đã chuyển về login
                setAdminsState('error', (err && err.message) || 'Không tải được danh sách quản trị viên. Vui lòng thử lại.');
            });
    }

    // Đổi bộ lọc thì về trang 1. Tìm kiếm gửi sau 300 ms ngừng gõ hoặc khi nhấn Enter.
    let searchTimer = null;
    function applySearch() {
        clearTimeout(searchTimer);
        const value = adminsSearch.value.trim();
        if (value === adminsQuery.search) return;
        adminsQuery.search = value;
        adminsQuery.page = 1;
        loadAdmins();
    }
    adminsSearch.addEventListener('input', () => {
        clearTimeout(searchTimer);
        searchTimer = setTimeout(applySearch, 300);
    });
    adminsSearch.addEventListener('keydown', e => {
        if (e.key === 'Enter') { e.preventDefault(); applySearch(); }
    });
    adminsStatusFilter.addEventListener('change', () => {
        adminsQuery.status = adminsStatusFilter.value;
        adminsQuery.page = 1;
        loadAdmins();
    });
    adminsPageList.addEventListener('click', e => {
        const link = e.target.closest('.page-link');
        if (!link) return;
        e.preventDefault();
        if (!link.dataset.page) return;
        adminsQuery.page = Number(link.dataset.page);
        loadAdmins();
    });

    // Thu hồi mọi phiên – DELETE /api/v1/admin/admins/:id/sessions (A14). Hộp xác nhận dùng chung (03 mục 6.6, danger).
    // 200 không tải lại (danh sách không hiện số phiên); 403/404 tải lại vì dữ liệu trên màn hình đã cũ.
    // Thiết bị bị thu hồi còn dùng Access Token tới khi hết hạn (≤ 15 phút mặc định).
    function confirmRevokeAdminSessions(id) {
        const row = adminRows.get(id);
        if (!row) return;
        showConfirmModal({
            title: 'Thu hồi mọi phiên đăng nhập',
            message: 'Mọi thiết bị đang đăng nhập bằng tài khoản "' + row.fullName + '" (' + row.username + ')'
                + ' sẽ không làm mới được phiên và bị đăng xuất khi Access Token hiện tại hết hạn'
                + ' (tối đa 15 phút theo cấu hình mặc định). Tài khoản vẫn đăng nhập lại được.',
            confirmText: 'Thu hồi phiên',
            type: 'danger',
            action: done => {
                let reload = false;
                callApi(token => mockRevokeAdminSessions(token, id))
                    .then(res => {
                        const n = res.data.revokedCount;
                        if (n > 0) notify('Đã thu hồi ' + n + ' phiên đăng nhập của ' + row.fullName, 'success');
                        else notify('Tài khoản không có phiên nào đang hoạt động', 'info');
                    })
                    .catch(err => {
                        const status = err && err.statusCode;
                        if (status === 401) return; // request() đã chuyển về login
                        if (status === 403 || status === 404) {
                            reload = true;
                            notify(err.message || 'Không thể thu hồi phiên của tài khoản này', 'warning');
                            return;
                        }
                        notify((err && err.message) || 'Không thu hồi được phiên. Vui lòng thử lại.', 'error');
                    })
                    .finally(() => {
                        done();
                        if (reload) loadAdmins();
                    });
            }
        });
    }

    // Khóa / Mở khóa – PUT /api/v1/admin/admins/:id/status (A17, M04 mục 3.4 Frontend). Cả hai đều qua hộp xác nhận
    // (Khóa: danger, Mở khóa: primary). 200/403/404/409 đều tải lại danh sách: trạng thái đổi làm đổi thứ tự sắp xếp,
    // và với bộ lọc trạng thái thì dòng có thể biến khỏi trang.
    function confirmSetAdminStatus(id, status) {
        const row = adminRows.get(id);
        if (!row) return;
        const lock = status === 'LOCKED';
        const who = '"' + row.fullName + '" (' + row.username + ')';
        showConfirmModal({
            title: lock ? 'Khóa tài khoản quản trị viên' : 'Mở khóa tài khoản quản trị viên',
            message: lock
                ? 'Tài khoản ' + who + ' sẽ bị đăng xuất khỏi mọi thiết bị ngay và không đăng nhập được cho tới khi được mở khóa.'
                : 'Tài khoản ' + who + ' sẽ đăng nhập lại được bằng mật khẩu hiện tại. Các phiên đăng nhập cũ không được khôi phục.',
            confirmText: lock ? 'Khóa tài khoản' : 'Mở khóa',
            type: lock ? 'danger' : 'primary',
            action: done => {
                let reload = false;
                callApi(token => mockSetAdminStatus(token, id, { status }))
                    .then(res => {
                        reload = true;
                        notify(res.message, 'success');
                    })
                    .catch(err => {
                        const code = err && err.statusCode;
                        if (code === 401) return; // request() đã chuyển về login
                        if (code === 403 || code === 404 || code === 409) {
                            reload = true;
                            notify(err.message || 'Không thể đổi trạng thái tài khoản này', 'warning');
                            return;
                        }
                        notify((err && err.message) || 'Không đổi được trạng thái. Vui lòng thử lại.', 'error');
                    })
                    .finally(() => {
                        done();
                        if (reload) loadAdmins(); // giữ bộ lọc và trang hiện tại
                    });
            }
        });
    }

    // Đặt lại mật khẩu – PUT /api/v1/admin/admins/:id/reset-password (A19, M04 mục 3.6 Frontend). Hộp xác nhận danger;
    // 200 mở hộp mật khẩu tạm dùng chung (họ tên/tên đăng nhập từ dòng danh sách), không tải lại danh sách;
    // 403/404/409 toast cảnh báo + tải lại. Hàm showTempPassword khai báo ở phần "Thêm quản trị viên" bên dưới.
    function confirmResetAdminPassword(id) {
        const row = adminRows.get(id);
        if (!row) return;
        const lockedNote = row.status === 'LOCKED' ? ' Tài khoản vẫn bị khóa; cần mở khóa để đăng nhập.' : '';
        showConfirmModal({
            title: 'Đặt lại mật khẩu quản trị viên',
            message: 'Mật khẩu hiện tại của "' + row.fullName + '" (' + row.username + ') hết hiệu lực ngay và tài khoản bị đăng xuất'
                + ' khỏi mọi thiết bị. Hệ thống sinh mật khẩu tạm, chỉ hiển thị một lần; người được cấp phải đổi mật khẩu khi đăng nhập.'
                + lockedNote,
            confirmText: 'Đặt lại mật khẩu',
            type: 'danger',
            action: done => {
                let reload = false;
                let result = null;
                callApi(token => mockResetAdminPassword(token, id))
                    .then(res => { result = res.data; })
                    .catch(err => {
                        const code = err && err.statusCode;
                        if (code === 401) return; // request() đã chuyển về login
                        if (code === 403 || code === 404 || code === 409) {
                            reload = true;
                            notify(err.message || 'Không thể đặt lại mật khẩu tài khoản này', 'warning');
                            return;
                        }
                        notify((err && err.message) || 'Không đặt lại được mật khẩu. Vui lòng thử lại.', 'error');
                    })
                    .finally(() => {
                        done(); // đóng hộp xác nhận trước khi mở hộp mật khẩu
                        if (result) {
                            showTempPassword({ fullName: row.fullName, username: row.username, temporaryPassword: result.temporaryPassword },
                                'Đã đặt lại mật khẩu');
                        }
                        if (reload) loadAdmins();
                    });
            }
        });
    }

    // Ngừng hoạt động – DELETE /api/v1/admin/admins/:id (A21, M04 mục 3.9 Frontend). Hộp xác nhận danger nêu rõ
    // không hoàn tác được. 200/403/404/409 đều tải lại danh sách (dòng xuống nhóm INACTIVE hoặc biến khỏi trang
    // khi đang lọc trạng thái; trang rỗng thì loadAdmins tự lùi về trang cuối).
    function confirmDeactivateAdmin(id) {
        const row = adminRows.get(id);
        if (!row) return;
        showConfirmModal({
            title: 'Ngừng hoạt động quản trị viên',
            message: 'Tài khoản "' + row.fullName + '" (' + row.username + ') sẽ bị đăng xuất khỏi mọi thiết bị ngay và không'
                + ' đăng nhập được nữa. Thao tác không hoàn tác được: không thể kích hoạt lại. Tên đăng nhập và email được'
                + ' giải phóng để tạo tài khoản mới; nhật ký cũ vẫn được giữ.',
            confirmText: 'Ngừng hoạt động',
            type: 'danger',
            action: done => {
                let reload = false;
                callApi(token => mockDeactivateAdmin(token, id))
                    .then(res => {
                        reload = true;
                        notify(res.message, 'success');
                    })
                    .catch(err => {
                        const code = err && err.statusCode;
                        if (code === 401) return; // request() đã chuyển về login
                        if (code === 403 || code === 404 || code === 409) {
                            reload = true;
                            notify(err.message || 'Không thể ngừng hoạt động tài khoản này', 'warning');
                            return;
                        }
                        notify((err && err.message) || 'Không ngừng hoạt động được tài khoản. Vui lòng thử lại.', 'error');
                    })
                    .finally(() => {
                        done();
                        if (reload) loadAdmins(); // giữ bộ lọc và trang hiện tại
                    });
            }
        });
    }

    // Thêm quản trị viên – POST /api/v1/admin/admins (A16, M04 mục 3.3 Frontend).
    // Vue: AdminCreateModal.vue + AdminTempPasswordModal.vue trong AdminAccountsSection.vue.
    const btnCreateAdmin = document.getElementById('btnCreateAdmin');
    const createModal = document.getElementById('adminCreateModal');
    const createForm = document.getElementById('adminCreateForm');
    const btnSubmitCreate = document.getElementById('btnSubmitCreateAdmin');
    const tempModal = document.getElementById('adminTempPasswordModal');
    const tempValue = document.getElementById('tempPasswordValue');
    let createBusy = false;

    // Dùng chung cho hộp Thêm và hộp Sửa
    function clearFormErrors(form) {
        form.querySelectorAll('[data-error-for]').forEach(slot => { slot.textContent = ''; slot.hidden = true; });
        form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
    }
    // Hiện errors[field] dưới ô; trả về thông điệp của khóa không có ô (hiện ở toast)
    function showFormErrors(form, errors) {
        const rest = [];
        Object.keys(errors || {}).forEach(field => {
            const msg = [].concat(errors[field]).join(' ');
            const slot = form.querySelector('[data-error-for="' + field + '"]');
            if (!slot) { rest.push(msg); return; }
            slot.textContent = msg;
            slot.hidden = false;
            const input = form.elements[field];
            if (input) input.classList.add('is-invalid');
        });
        const first = form.querySelector('.is-invalid');
        if (first) first.focus();
        return rest;
    }
    const clearCreateErrors = () => clearFormErrors(createForm);
    const showCreateErrors = errors => showFormErrors(createForm, errors);
    function setCreateBusy(busy) {
        createBusy = busy;
        createForm.querySelectorAll('button, input').forEach(el => { el.disabled = busy; });
        createModal.querySelectorAll('[data-close-create]').forEach(el => { el.disabled = busy; });
        btnSubmitCreate.textContent = busy ? 'Đang tạo...' : 'Tạo tài khoản';
    }
    function openCreateAdmin() {
        createForm.reset();
        clearCreateErrors();
        createModal.classList.add('show');
        createForm.elements.username.focus();
    }
    function closeCreateAdmin() {
        if (createBusy) return; // đang gửi: không đóng
        createModal.classList.remove('show');
    }

    // Hộp mật khẩu tạm: chỉ giữ trong DOM khi đang mở, đóng thì xóa (không lưu store/localStorage/URL).
    // Dùng chung: Thêm (A16, data = response 201) và Đặt lại mật khẩu (A19, họ tên/tên đăng nhập lấy từ dòng danh sách).
    function showTempPassword(data, title = 'Đã tạo quản trị viên') {
        document.getElementById('adminTempPasswordTitle').textContent = title;
        document.getElementById('tempPasswordFullName').textContent = data.fullName;
        document.getElementById('tempPasswordUsername').textContent = data.username;
        tempValue.textContent = data.temporaryPassword;
        tempModal.classList.add('show');
    }
    function closeTempPassword() {
        tempValue.textContent = '';
        document.getElementById('tempPasswordFullName').textContent = '';
        document.getElementById('tempPasswordUsername').textContent = '';
        tempModal.classList.remove('show');
    }

    function submitCreateAdmin(e) {
        e.preventDefault();
        if (createBusy) return;
        clearCreateErrors();
        const f = createForm.elements;
        const phone = f.phoneNumber.value.trim();
        // Gửi đúng 4 trường; backend tự cắt khoảng trắng và kiểm tra lại (02 mục 2)
        const body = {
            username: f.username.value.trim(),
            email: f.email.value.trim(),
            fullName: f.fullName.value.trim(),
            phoneNumber: phone === '' ? null : phone
        };
        setCreateBusy(true);
        callApi(token => mockCreateAdmin(token, body))
            .then(res => {
                setCreateBusy(false);
                closeCreateAdmin();
                createForm.reset();
                showTempPassword(res.data);
                loadAdmins(); // giữ bộ lọc và trang hiện tại
            })
            .catch(err => {
                setCreateBusy(false);
                const status = err && err.statusCode;
                if (status === 401) return; // request() đã chuyển về login
                if (status === 400 || status === 409) {
                    const rest = showCreateErrors(err.errors);
                    if (rest.length) notify(rest.join(' '), 'error');
                    return;
                }
                if (status === 403) { notify(err.message || 'Bạn không có quyền tạo quản trị viên', 'warning'); return; }
                notify((err && err.message) || 'Không tạo được quản trị viên. Vui lòng thử lại.', 'error');
            });
    }

    btnCreateAdmin.addEventListener('click', openCreateAdmin);
    createForm.addEventListener('submit', submitCreateAdmin);
    createModal.querySelectorAll('[data-close-create]').forEach(el => el.addEventListener('click', closeCreateAdmin));
    createModal.addEventListener('click', e => { if (e.target === createModal) closeCreateAdmin(); });
    tempModal.querySelectorAll('[data-close-temp]').forEach(el => el.addEventListener('click', closeTempPassword));
    // Không đóng hộp mật khẩu khi bấm nền (tránh mất mật khẩu do bấm nhầm); Escape đóng hộp Thêm khi không bận
    window.addEventListener('keydown', e => {
        if (e.key === 'Escape' && createModal.classList.contains('show')) closeCreateAdmin();
    });
    document.getElementById('btnCopyTempPassword').addEventListener('click', () => {
        const text = tempValue.textContent;
        if (!text) return;
        const done = () => notify('Đã sao chép mật khẩu tạm', 'success');
        if (navigator.clipboard && window.isSecureContext) {
            navigator.clipboard.writeText(text).then(done, () => notify('Không sao chép được, hãy chọn và sao chép thủ công', 'warning'));
        } else {
            // file:// hoặc http không bảo mật: chọn sẵn nội dung để người dùng tự sao chép
            const range = document.createRange();
            range.selectNodeContents(tempValue);
            const sel = window.getSelection();
            sel.removeAllRanges();
            sel.addRange(range);
            notify('Đã chọn mật khẩu, nhấn Ctrl+C để sao chép', 'info');
        }
    });

    // Sửa quản trị viên – PUT /api/v1/admin/admins/:id (A18, M04 mục 3.8 Frontend). Vue: AdminEditModal.vue.
    // Điền sẵn từ phần tử của danh sách; chỉ gửi trường khác giá trị ban đầu, không đổi gì thì không gọi API.
    const editModal = document.getElementById('adminEditModal');
    const editForm = document.getElementById('adminEditForm');
    const btnSubmitEdit = document.getElementById('btnSubmitEditAdmin');
    let editBusy = false;
    let editTarget = null; // phần tử GET đang sửa (giá trị ban đầu để so)

    function setEditBusy(busy) {
        editBusy = busy;
        editForm.querySelectorAll('button, input').forEach(el => { el.disabled = busy; });
        editModal.querySelectorAll('[data-close-edit]').forEach(el => { el.disabled = busy; });
        btnSubmitEdit.textContent = busy ? 'Đang lưu...' : 'Lưu thay đổi';
    }
    function openEditAdmin(id) {
        const row = adminRows.get(id);
        if (!row) return;
        editTarget = row;
        clearFormErrors(editForm);
        document.getElementById('editAdminUsername').textContent = row.username;
        editForm.elements.fullName.value = row.fullName;
        editForm.elements.email.value = row.email;
        editForm.elements.phoneNumber.value = row.phoneNumber || '';
        editModal.classList.add('show');
        editForm.elements.fullName.focus();
    }
    function closeEditAdmin() {
        if (editBusy) return; // đang gửi: không đóng
        editModal.classList.remove('show');
        editTarget = null;
    }

    function submitEditAdmin(e) {
        e.preventDefault();
        if (editBusy || !editTarget) return;
        clearFormErrors(editForm);
        const f = editForm.elements;
        const phone = f.phoneNumber.value.trim();
        const next = { fullName: f.fullName.value.trim(), email: f.email.value.trim(), phoneNumber: phone === '' ? null : phone };
        // Chỉ gửi trường đã đổi (so chính xác như backend); backend tự cắt khoảng trắng và kiểm tra lại (02 mục 2)
        const body = {};
        UPDATE_ADMIN_FIELDS.forEach(k => { if (next[k] !== editTarget[k]) body[k] = next[k]; });
        if (!Object.keys(body).length) {
            notify('Không có thay đổi nào', 'info');
            closeEditAdmin();
            return;
        }
        const id = String(editTarget.id);
        setEditBusy(true);
        callApi(token => mockUpdateAdmin(token, id, body))
            .then(res => {
                setEditBusy(false);
                closeEditAdmin();
                notify(res.message, 'success');
                loadAdmins(); // giữ bộ lọc và trang; fullName đổi làm đổi thứ tự
            })
            .catch(err => {
                setEditBusy(false);
                const status = err && err.statusCode;
                if (status === 401) return; // request() đã chuyển về login
                if (status === 400 || (status === 409 && err.errorCode === 'ACCOUNT_DUPLICATE')) {
                    const rest = showFormErrors(editForm, err.errors);
                    if (rest.length) notify(rest.join(' '), 'error');
                    return;
                }
                if (status === 403 || status === 404 || status === 409) {
                    closeEditAdmin(); // dữ liệu trên màn hình đã cũ
                    notify(err.message || 'Không thể sửa tài khoản này', 'warning');
                    loadAdmins();
                    return;
                }
                notify((err && err.message) || 'Không lưu được thay đổi. Vui lòng thử lại.', 'error');
            });
    }

    editForm.addEventListener('submit', submitEditAdmin);
    editModal.querySelectorAll('[data-close-edit]').forEach(el => el.addEventListener('click', closeEditAdmin));
    editModal.addEventListener('click', e => { if (e.target === editModal) closeEditAdmin(); });
    window.addEventListener('keydown', e => {
        if (e.key === 'Escape' && editModal.classList.contains('show')) closeEditAdmin();
    });

    adminsTableBody.addEventListener('click', e => {
        const editBtn = e.target.closest('.btn-edit-admin');
        if (editBtn) { openEditAdmin(editBtn.dataset.adminId); return; }
        const btn = e.target.closest('.btn-revoke-sessions');
        if (btn) { confirmRevokeAdminSessions(btn.dataset.adminId); return; }
        const resetBtn = e.target.closest('.btn-reset-admin-password');
        if (resetBtn) { confirmResetAdminPassword(resetBtn.dataset.adminId); return; }
        const deactivateBtn = e.target.closest('.btn-deactivate-admin');
        if (deactivateBtn) { confirmDeactivateAdmin(deactivateBtn.dataset.adminId); return; }
        const statusBtn = e.target.closest('.btn-admin-status');
        if (statusBtn) confirmSetAdminStatus(statusBtn.dataset.adminId, statusBtn.dataset.status);
    });
    btnRetryAdmins.addEventListener('click', loadAdmins);

    // Kiểm thử thủ công trên trang tĩnh (không có trong Vue)
    window.__adminsMock = {
        MOCK_ADMINS, MOCK_SESSIONS, MOCK_AUDIT, MOCK_USER_SETTINGS, mockGetAdmins, mockRevokeAdminSessions, mockCreateAdmin,
        mockSetAdminStatus, mockUpdateAdmin, mockResetAdminPassword, mockDeactivateAdmin, MOCK_ADMIN_SECRETS,
        generateTempPassword, adminsQuery, loadAdmins
    };

    loadAdmins();

    // ----------------------------------------------------
    // 8. Mục "Nhật ký kiểm toán" (AuditLogSection.vue) – docs/modules/07_system_settings.md mục 3.4, 5.2 (A20)
    // Khai báo hàm (hoisting) để gọi được trước lệnh return sớm của mục 7. Chỉ đọc.
    // ----------------------------------------------------
    function initAuditLogs() {
        const section = document.getElementById('section-audit-logs');
        if (!section || section.hidden) return; // thiếu audit:view: không tải, không gọi API

        // Danh mục 01 mục 13 (Vue: hằng số chung với nhãn M09 mục 5.1)
        const RESOURCE_NAMES = ['AUTH', 'CDR', 'AUDIO', 'REPORT', 'USER', 'ADMIN', 'USER_GROUP', 'PREFIX', 'ORGANIZATION', 'SYSTEM'];
        const RESOURCE_NAME_LABELS = {
            AUTH: 'Xác thực', CDR: 'CDR', AUDIO: 'Ghi âm', REPORT: 'Báo cáo', USER: 'Người dùng', ADMIN: 'Quản trị viên',
            USER_GROUP: 'Nhóm người dùng', PREFIX: 'Đầu số', ORGANIZATION: 'Đơn vị', SYSTEM: 'Hệ thống'
        };
        const ACTION_GROUPS = [
            ['Xác thực', ['LOGIN', 'LOGIN_FAILED', 'LOGOUT', 'SESSION_REVOKED', 'TOKEN_REUSE_DETECTED', 'PASSWORD_CHANGED', 'PASSWORD_RESET']],
            ['Ghi âm, CDR & báo cáo', ['LISTEN_AUDIO', 'DOWNLOAD_AUDIO', 'EXPORT_CDR', 'PURGE_CDR_PARTITION', 'EXPORT_REPORT']],
            ['Tài khoản, nhóm & đơn vị', ['CREATE', 'UPDATE', 'LOCK', 'UNLOCK', 'DEACTIVATE', 'DELETE', 'CHANGE_ROLE', 'TOGGLE_GROUP_RECORDING']],
            ['Đầu số', ['UPDATE_PREFIX_GROUP', 'ALLOCATE_RANGE', 'UPDATE_RANGE', 'REVOKE_RANGE', 'UPDATE_NUMBER']],
            ['Hệ thống', ['UPDATE_SETTINGS', 'RECALCULATE_STATS', 'CREATE_NOTIFICATION', 'RETRY_ENRICHMENT', 'ACCESS_DENIED']]
        ];
        const ACTIONS = ACTION_GROUPS.flatMap(g => g[1]); // 30 mã
        const ACTOR_TYPES = ['ADMIN', 'USER', 'SYSTEM'];
        const ACTOR_TYPE_LABELS = { ADMIN: 'Quản trị viên', USER: 'Người dùng', SYSTEM: 'Hệ thống' };

        // Nhãn hành động: cùng bảng M09 mục 5.1 (templates/admin/profile.js activityLabel)
        const ACTION_LABELS = {
            LOGIN: 'Đăng nhập', LOGIN_FAILED: 'Đăng nhập thất bại', LOGOUT: 'Đăng xuất',
            SESSION_REVOKED: 'Thu hồi phiên đăng nhập', TOKEN_REUSE_DETECTED: 'Phát hiện dùng lại phiên',
            PASSWORD_CHANGED: 'Đổi mật khẩu', PASSWORD_RESET: 'Đặt lại mật khẩu',
            LISTEN_AUDIO: 'Nghe ghi âm', DOWNLOAD_AUDIO: 'Tải ghi âm',
            EXPORT_CDR: 'Xuất CDR', PURGE_CDR_PARTITION: 'Xóa dữ liệu CDR hết hạn lưu trữ', EXPORT_REPORT: 'Xuất báo cáo',
            TOGGLE_GROUP_RECORDING: 'Đổi quyền nghe ghi âm của nhóm',
            UPDATE_PREFIX_GROUP: 'Sửa nhóm đầu số', ALLOCATE_RANGE: 'Cấp dải số', UPDATE_RANGE: 'Sửa dải số',
            REVOKE_RANGE: 'Thu hồi dải số', UPDATE_NUMBER: 'Sửa thông tin số',
            UPDATE_SETTINGS: 'Cập nhật cài đặt hệ thống', RECALCULATE_STATS: 'Tính lại thống kê',
            CREATE_NOTIFICATION: 'Gửi thông báo', RETRY_ENRICHMENT: 'Xử lý lại CDR lỗi',
            ACCESS_DENIED: 'Thao tác bị từ chối'
        };
        const CRUD_LABELS = {
            CREATE: 'Tạo', UPDATE: 'Cập nhật', LOCK: 'Khóa', UNLOCK: 'Mở khóa',
            DEACTIVATE: 'Ngừng hoạt động', DELETE: 'Xóa', CHANGE_ROLE: 'Đổi vai trò'
        };
        const CRUD_RESOURCE_LABELS = {
            ADMIN: 'quản trị viên', USER: 'người dùng', USER_GROUP: 'nhóm người dùng', ORGANIZATION: 'đơn vị'
        };
        const LOGIN_FAILED_REASONS = {
            BAD_PASSWORD: 'sai mật khẩu', UNKNOWN_USER: 'không có tài khoản', ACCOUNT_LOCKED: 'tài khoản bị khóa',
            TEMPORARILY_LOCKED: 'đang khóa tạm', GROUP_INACTIVE: 'nhóm ngừng hoạt động'
        };
        const WARNING_ACTIONS = ['LOGIN_FAILED', 'ACCESS_DENIED', 'TOKEN_REUSE_DETECTED'];

        function auditActionLabel(row) {
            // "Cập nhật hồ sơ của tôi" (M09 mục 5.1) đọc theo dòng: tác nhân sửa chính tài khoản mình
            if (row.action === 'UPDATE' && (row.resourceName === 'ADMIN' || row.resourceName === 'USER')
                && row.actorType === row.resourceName && row.actorId !== null && String(row.actorId) === row.resourceId) {
                return 'Tự cập nhật hồ sơ';
            }
            if (row.action === 'SESSION_REVOKED' && row.actionDetails && row.actionDetails.targetActorType) {
                return row.actionDetails.targetActorType === 'ADMIN'
                    ? 'Thu hồi mọi phiên của quản trị viên' : 'Thu hồi mọi phiên của người dùng';
            }
            if (CRUD_LABELS[row.action] && CRUD_RESOURCE_LABELS[row.resourceName]) {
                return CRUD_LABELS[row.action] + ' ' + CRUD_RESOURCE_LABELS[row.resourceName];
            }
            let label = ACTION_LABELS[row.action] || row.action; // mã chưa có nhãn: hiện nguyên mã
            if (row.action === 'LOGIN_FAILED' && row.actionDetails && row.actionDetails.reason) {
                label += ' (' + (LOGIN_FAILED_REASONS[row.actionDetails.reason] || row.actionDetails.reason) + ')';
            }
            return label;
        }

        // Ngày theo giờ Việt Nam (01 "Múi giờ"): YYYY-MM-DD
        const vnDateFmt = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh', year: 'numeric', month: '2-digit', day: '2-digit' });
        const vnDate = d => vnDateFmt.format(d);
        const DAY_MS = 86400000;
        const addDays = (ymd, n) => new Date(Date.parse(ymd + 'T00:00:00Z') + n * DAY_MS).toISOString().slice(0, 10);
        const isValidYmd = s => /^\d{4}-\d{2}-\d{2}$/.test(s) && new Date(s + 'T00:00:00Z').toISOString().slice(0, 10) === s;
        const daysBetween = (a, b) => Math.round((Date.parse(b + 'T00:00:00Z') - Date.parse(a + 'T00:00:00Z')) / DAY_MS);
        const auditTimeFmt = new Intl.DateTimeFormat('vi-VN', {
            timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric',
            hour: '2-digit', minute: '2-digit', second: '2-digit'
        });

        // Dữ liệu mẫu: phần tử đúng 11 trường của GET /admin/audit-logs (M07 mục 3.4), resourceId là chuỗi,
        // actionDetails là đối tượng JSON. Thời điểm tính lùi từ hôm nay để luôn nằm trong 7 ngày mặc định
        // (trừ vài dòng cũ 10–40 ngày để thử bộ lọc ngày).
        const today = vnDate(new Date());
        const at = (daysAgo, hms) => addDays(today, -daysAgo) + 'T' + hms + '+07:00';
        const UA_CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';
        const UA_FIREFOX = 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0';
        const row = (id, actorType, actorId, actorName, action, resourceName, resourceId, ip, ua, details, createdAt) => ({
            id, actorType, actorId, actorName, action, resourceName, resourceId, ipAddress: ip, userAgent: ua,
            actionDetails: details, createdAt
        });
        const MOCK_AUDIT_LOGS = [
            row(90412, 'ADMIN', 1, 'Quản trị viên Tối cao EVNICT', 'PASSWORD_RESET', 'AUTH', '7', '10.10.1.15', UA_CHROME, { targetActorType: 'ADMIN', revokedCount: 2 }, at(0, '09:12:44')),
            row(90411, 'ADMIN', 1, 'Quản trị viên Tối cao EVNICT', 'LOCK', 'ADMIN', '7', '10.10.1.15', UA_CHROME, { revokedCount: 0 }, at(0, '09:12:44')),
            row(90410, 'USER', 231, 'Phạm Thu Hà', 'LISTEN_AUDIO', 'AUDIO', '18803321', '10.20.5.41', UA_FIREFOX, null, at(0, '08:55:10')),
            row(90409, 'USER', null, 'hanoi.ktv01', 'LOGIN_FAILED', 'AUTH', null, '10.20.5.77', UA_CHROME, { reason: 'UNKNOWN_USER' }, at(0, '08:40:02')),
            row(90408, 'ADMIN', 5, 'Kỹ thuật viên Trực ban EVNHANOI', 'UPDATE', 'ADMIN', '5', '10.10.2.8', UA_CHROME, { changedFields: ['phoneNumber'] }, at(0, '08:21:37')),
            row(90407, 'ADMIN', 5, 'Kỹ thuật viên Trực ban EVNHANOI', 'LOGIN', 'AUTH', null, '10.10.2.8', UA_CHROME, null, at(0, '08:20:01')),
            row(90406, 'ADMIN', 7, 'admin.npc', 'LOGIN_FAILED', 'AUTH', null, '10.30.1.9', UA_CHROME, { reason: 'BAD_PASSWORD' }, at(1, '17:02:11')),
            row(90405, 'ADMIN', 2, 'Quản trị viên Tối cao dự phòng', 'ACCESS_DENIED', 'ADMIN', '1', '10.10.1.16', UA_CHROME, null, at(1, '15:30:00')),
            row(90404, 'USER', 231, 'Phạm Thu Hà', 'DOWNLOAD_AUDIO', 'AUDIO', '18803102', '10.20.5.41', UA_FIREFOX, null, at(1, '14:11:45')),
            row(90403, 'USER', 118, 'Ngô Đức Long', 'EXPORT_CDR', 'CDR', null, '10.20.7.3', UA_CHROME, null, at(1, '10:05:12')),
            row(90402, 'ADMIN', 1, 'Quản trị viên Tối cao EVNICT', 'CREATE', 'ADMIN', '18', '10.10.1.15', UA_CHROME, null, at(2, '16:44:09')),
            row(90401, 'ADMIN', 5, 'Kỹ thuật viên Trực ban EVNHANOI', 'ALLOCATE_RANGE', 'PREFIX', '41', '10.10.2.8', UA_CHROME, null, at(2, '11:20:30')),
            row(90400, 'ADMIN', 5, 'Kỹ thuật viên Trực ban EVNHANOI', 'CHANGE_ROLE', 'USER', '118', '10.10.2.8', UA_CHROME, { from: 'REGULAR_USER', to: 'USER_RECORDING' }, at(2, '09:01:00')),
            row(90399, 'ADMIN', 1, 'Quản trị viên Tối cao EVNICT', 'SESSION_REVOKED', 'AUTH', '9', '10.10.1.15', UA_CHROME, { targetActorType: 'ADMIN', revokedCount: 1 }, at(3, '13:13:13')),
            row(90398, 'SYSTEM', null, 'partition-maintenance', 'PURGE_CDR_PARTITION', 'CDR', null, null, null, null, at(4, '02:00:05')),
            row(90397, 'ADMIN', 13, 'Phạm Minh Giám Định', 'UPDATE_SETTINGS', 'SYSTEM', null, '10.10.3.4', UA_CHROME, { op: 'RELOAD_CACHE' }, at(4, '10:30:00')),
            row(90396, 'ADMIN', 13, 'Phạm Minh Giám Định', 'RETRY_ENRICHMENT', 'SYSTEM', '18790011', '10.10.3.4', UA_CHROME, { success: true }, at(5, '09:45:00')),
            row(90395, 'USER', 231, 'Phạm Thu Hà', 'PASSWORD_CHANGED', 'AUTH', null, '10.20.5.41', UA_FIREFOX, null, at(6, '08:00:00')),
            row(90300, 'ADMIN', 1, 'Quản trị viên Tối cao EVNICT', 'UNLOCK', 'ADMIN', '9', '10.10.1.15', UA_CHROME, null, at(12, '15:00:00')),
            row(90100, 'ADMIN', 5, 'Kỹ thuật viên Trực ban EVNHANOI', 'TOGGLE_GROUP_RECORDING', 'USER_GROUP', '3', '10.10.2.8', UA_CHROME, null, at(40, '10:00:00'))
        ];
        // Thêm đăng nhập/đăng xuất thường ngày để có nhiều trang với limit = 20
        for (let i = 0; i < 24; i++) {
            const d = i % 7;
            const hh = String(7 + (i % 10)).padStart(2, '0');
            MOCK_AUDIT_LOGS.push(row(90000 + i, 'USER', 200 + (i % 5), 'Nhân viên trực ' + (i % 5 + 1),
                i % 3 === 2 ? 'LOGOUT' : 'LOGIN', 'AUTH', null, '10.20.6.' + (10 + i), UA_CHROME, null, at(d, hh + ':0' + (i % 10) + ':00')));
        }

        // Giả lập GET /api/v1/admin/audit-logs (A20, M07 mục 3.4; quy tắc chung 02 mục 2.2).
        // query: object như backend nhận (string; lặp lại → mảng). Lỗi trả 400 theo tên tham số.
        const AUDIT_QUERY_KEYS = ['fromDate', 'toDate', 'actorType', 'actorId', 'action', 'resourceName', 'resourceId', 'page', 'limit'];
        function mockGetAuditLogs(token, query) {
            return new Promise(resolve => setTimeout(resolve, 300)).then(() => {
                if (!token) return Promise.reject(unauthorized());
                const q = query || {};
                const errors = {};
                Object.keys(q).forEach(k => {
                    if (!AUDIT_QUERY_KEYS.includes(k)) errors[k] = ['Tham số không được nhận'];
                    else if (Array.isArray(q[k])) errors[k] = ['Chỉ gửi tham số một lần'];
                });
                const pick = k => (typeof q[k] === 'string' ? q[k] : undefined);
                const intParam = (k, def, max) => {
                    const v = pick(k);
                    if (v === undefined) return def;
                    if (!/^[1-9][0-9]{0,8}$/.test(v) || (max && Number(v) > max)) {
                        errors[k] = [max ? 'Phải là số nguyên từ 1 đến ' + max : 'Phải là số nguyên ≥ 1'];
                        return def;
                    }
                    return Number(v);
                };
                const page = intParam('page', 1);
                const limit = intParam('limit', 20, 100);

                const fromDate = pick('fromDate');
                const toDate = pick('toDate');
                if (fromDate === undefined || fromDate === '') errors.fromDate = ['Bắt buộc'];
                else if (!isValidYmd(fromDate)) errors.fromDate = ['Định dạng YYYY-MM-DD'];
                if (toDate === undefined || toDate === '') errors.toDate = ['Bắt buộc'];
                else if (!isValidYmd(toDate)) errors.toDate = ['Định dạng YYYY-MM-DD'];
                if (!errors.fromDate && !errors.toDate) {
                    const span = daysBetween(fromDate, toDate);
                    if (span < 0) errors.toDate = ['Phải từ "Từ ngày" trở đi'];
                    else if (span > 30) errors.toDate = ['Tối đa 31 ngày'];
                }

                const actorType = pick('actorType') || '';
                if (actorType && !ACTOR_TYPES.includes(actorType)) errors.actorType = ['Loại tác nhân không hợp lệ'];
                const actorIdRaw = pick('actorId') || '';
                if (actorIdRaw) {
                    if (!/^[1-9][0-9]{0,9}$/.test(actorIdRaw) || Number(actorIdRaw) > 4294967295) errors.actorId = ['Phải là số nguyên ≥ 1'];
                    else if (actorType !== 'ADMIN' && actorType !== 'USER') errors.actorId = ['Cần actorType ADMIN hoặc USER'];
                }
                const action = pick('action') || '';
                if (action && !ACTIONS.includes(action)) errors.action = ['Mã hành động không hợp lệ'];
                const resourceName = pick('resourceName') || '';
                if (resourceName && !RESOURCE_NAMES.includes(resourceName)) errors.resourceName = ['Đối tượng không hợp lệ'];
                const resourceId = (pick('resourceId') || '').trim();
                if (resourceId.length > 255) errors.resourceId = ['Tối đa 255 ký tự'];
                else if (resourceId && !resourceName) errors.resourceId = ['Cần resourceName'];
                if (Object.keys(errors).length) return Promise.reject(validationError(errors));

                // WHERE created_at >= fromDate 00:00 AND < toDate + 1 ngày (createdAt ISO +07:00: 10 ký tự đầu là ngày VN)
                const rows = MOCK_AUDIT_LOGS.filter(r => {
                    const d = r.createdAt.slice(0, 10);
                    return d >= fromDate && d <= toDate
                        && (!actorType || r.actorType === actorType)
                        && (!actorIdRaw || r.actorId === Number(actorIdRaw))
                        && (!action || r.action === action)
                        && (!resourceName || r.resourceName === resourceName)
                        && (!resourceId || r.resourceId === resourceId);
                });
                // ORDER BY created_at DESC, id DESC (cùng offset nên so chuỗi được)
                rows.sort((a, b) => (a.createdAt < b.createdAt ? 1 : a.createdAt > b.createdAt ? -1 : b.id - a.id));
                const total = rows.length;
                const totalPages = Math.ceil(total / limit);
                const data = rows.slice((page - 1) * limit, page * limit)
                    .map(r => Object.assign({}, r, { actionDetails: r.actionDetails ? JSON.parse(JSON.stringify(r.actionDetails)) : null }));
                return {
                    success: true, statusCode: 200, message: 'Lấy nhật ký kiểm toán thành công', data,
                    pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
                    timestamp: now()
                };
            });
        }

        // ---- Giao diện ----
        const form = document.getElementById('auditFilterForm');
        const fromInput = document.getElementById('auditFromDate');
        const toInput = document.getElementById('auditToDate');
        const actorTypeSelect = document.getElementById('auditActorType');
        const resourceSelect = document.getElementById('auditResourceName');
        const actionSelect = document.getElementById('auditAction');
        const chips = document.getElementById('auditChips');
        const stateBox = document.getElementById('auditState');
        const stateMessage = document.getElementById('auditMessage');
        const btnRetry = document.getElementById('btnRetryAudit');
        const tableWrap = document.getElementById('auditTableWrap');
        const tbody = document.getElementById('auditTableBody');
        const pagination = document.getElementById('auditPagination');
        const pageInfo = document.getElementById('auditPageInfo');
        const pageList = document.getElementById('auditPageList');
        const detailModal = document.getElementById('auditDetailModal');
        const btnFilterResource = document.getElementById('btnAuditFilterResource');

        RESOURCE_NAMES.forEach(code => resourceSelect.add(new Option(RESOURCE_NAME_LABELS[code], code)));
        ACTION_GROUPS.forEach(([groupLabel, codes]) => {
            const og = document.createElement('optgroup');
            og.label = groupLabel;
            codes.forEach(code => og.appendChild(new Option(ACTION_LABELS[code] || CRUD_LABELS[code] || code, code)));
            actionSelect.appendChild(og);
        });

        // Trạng thái bộ lọc (Vue: ref trong AuditLogSection.vue). Mặc định 7 ngày gần nhất tính cả hôm nay; limit cố định 20.
        const auditQuery = {
            page: 1, limit: 20, fromDate: addDays(today, -6), toDate: today,
            actorType: '', actorId: '', actorName: '', action: '', resourceName: '', resourceId: ''
        };
        fromInput.value = auditQuery.fromDate;
        toInput.value = auditQuery.toDate;
        let requestSeq = 0;
        let rowsById = new Map();
        let detailRow = null;

        function clearErrors() {
            section.querySelectorAll('.field-error').forEach(el => { el.hidden = true; el.textContent = ''; });
        }
        function showErrors(errors) {
            Object.keys(errors || {}).forEach(field => {
                const el = section.querySelector('.field-error[data-error-for="' + field + '"]');
                if (!el) return;
                const msg = [].concat(errors[field]).join(' ');
                el.textContent = (field === 'actorId' ? 'Tác nhân: ' : field === 'resourceId' ? 'Đối tượng: ' : '') + msg;
                el.hidden = false;
            });
        }

        function setState(state, message) {
            stateBox.hidden = state === 'ready';
            stateBox.classList.toggle('is-error', state === 'error');
            if (message) stateMessage.textContent = message;
            btnRetry.hidden = state !== 'error';
            tableWrap.hidden = state !== 'ready';
            if (state !== 'ready') pagination.hidden = true;
        }

        function renderChips() {
            chips.replaceChildren();
            const addChip = (text, onRemove) => {
                const chip = document.createElement('span');
                chip.className = 'audit-chip';
                chip.append(document.createTextNode(text));
                const x = document.createElement('button');
                x.type = 'button';
                x.setAttribute('aria-label', 'Bỏ lọc ' + text);
                x.textContent = '×';
                x.addEventListener('click', onRemove);
                chip.appendChild(x);
                chips.appendChild(chip);
            };
            if (auditQuery.actorId) {
                addChip('Tác nhân: ' + auditQuery.actorName + ' (' + ACTOR_TYPE_LABELS[auditQuery.actorType] + ' #' + auditQuery.actorId + ')', () => {
                    auditQuery.actorId = ''; auditQuery.actorName = ''; applyFilters();
                });
            }
            if (auditQuery.resourceId) {
                addChip('Đối tượng: ' + RESOURCE_NAME_LABELS[auditQuery.resourceName] + ' #' + auditQuery.resourceId, () => {
                    auditQuery.resourceId = ''; applyFilters();
                });
            }
            chips.hidden = !chips.childElementCount;
        }

        function renderPagination(p, count) {
            const from = (p.page - 1) * p.limit + 1;
            pageInfo.textContent = 'Hiển thị ' + from + '–' + (from + count - 1) + ' / ' + p.total + ' dòng';
            pageList.replaceChildren();
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
                pageList.appendChild(li);
            };
            addItem('«', p.page - 1, { disabled: !p.hasPrev, aria: 'Trang trước' });
            const first = Math.max(1, Math.min(p.page - 2, p.totalPages - 4));
            const last = Math.min(p.totalPages, first + 4);
            for (let i = first; i <= last; i++) addItem(String(i), i, { active: i === p.page });
            addItem('»', p.page + 1, { disabled: !p.hasNext, aria: 'Trang sau' });
            pagination.hidden = false;
        }

        const resourceText = r => RESOURCE_NAME_LABELS[r.resourceName] + (r.resourceId !== null ? ' #' + r.resourceId : '');

        // Dựng bằng textContent (không innerHTML): actorName của LOGIN_FAILED là chuỗi người lạ gõ vào
        function renderRows(rows) {
            tbody.replaceChildren();
            rowsById = new Map(rows.map(r => [String(r.id), r]));
            rows.forEach(r => {
                const tr = document.createElement('tr');
                tr.dataset.auditId = String(r.id);
                if (WARNING_ACTIONS.includes(r.action)) tr.className = 'audit-row--warning';

                const time = document.createElement('td');
                time.textContent = auditTimeFmt.format(new Date(r.createdAt));

                const actor = document.createElement('td');
                if (r.actorId !== null) {
                    const link = document.createElement('button');
                    link.type = 'button';
                    link.className = 'audit-actor-link';
                    link.dataset.auditId = String(r.id);
                    link.title = 'Lọc theo tác nhân này';
                    link.textContent = r.actorName;
                    actor.appendChild(link);
                } else {
                    const name = document.createElement('span');
                    name.className = 'fw-600';
                    name.textContent = r.actorName;
                    actor.appendChild(name);
                }
                const type = document.createElement('span');
                type.className = 'audit-actor-type';
                type.textContent = ACTOR_TYPE_LABELS[r.actorType] + (r.actorId !== null ? ' #' + r.actorId : '');
                actor.appendChild(type);

                const act = document.createElement('td');
                act.textContent = auditActionLabel(r);

                const res = document.createElement('td');
                res.textContent = resourceText(r);

                const ip = document.createElement('td');
                ip.textContent = r.ipAddress || '—';

                tr.append(time, actor, act, res, ip);
                tbody.appendChild(tr);
            });
        }

        const hasExtraFilter = () => !!(auditQuery.actorType || auditQuery.actorId || auditQuery.action
            || auditQuery.resourceName || auditQuery.resourceId);

        // Tải – GET /api/v1/admin/audit-logs. Chỉ gửi tham số có giá trị; fromDate/toDate/page/limit luôn gửi.
        function loadAuditLogs() {
            const seq = ++requestSeq;
            const query = {
                fromDate: auditQuery.fromDate, toDate: auditQuery.toDate,
                page: String(auditQuery.page), limit: String(auditQuery.limit)
            };
            ['actorType', 'actorId', 'action', 'resourceName', 'resourceId'].forEach(k => { if (auditQuery[k]) query[k] = auditQuery[k]; });
            renderChips();
            setState('loading', 'Đang tải nhật ký kiểm toán...');
            return callApi(token => mockGetAuditLogs(token, query))
                .then(res => {
                    if (seq !== requestSeq) return; // đã có request mới hơn
                    const p = res.pagination;
                    if (!res.data.length && p.page > 1 && p.totalPages > 0) {
                        auditQuery.page = p.totalPages;
                        return loadAuditLogs();
                    }
                    if (!res.data.length) {
                        setState('empty', hasExtraFilter()
                            ? 'Không có dòng nhật ký phù hợp với bộ lọc'
                            : 'Không có hoạt động nào trong khoảng ngày đã chọn');
                        return;
                    }
                    renderRows(res.data);
                    setState('ready');
                    renderPagination(p, res.data.length);
                })
                .catch(err => {
                    if (seq !== requestSeq) return;
                    if (err && err.statusCode === 401) return; // request() đã chuyển về login
                    if (err && err.statusCode === 400) {
                        showErrors(err.errors);
                        setState('error', 'Bộ lọc không hợp lệ, vui lòng kiểm tra lại.');
                        return;
                    }
                    setState('error', (err && err.message) || 'Không tải được nhật ký kiểm toán. Vui lòng thử lại.');
                });
        }

        // Đọc form → auditQuery; chặn ngày sai trước khi gọi API (không gọi khi lỗi). Đổi lọc thì về trang 1.
        function applyFilters() {
            clearErrors();
            const fromDate = fromInput.value;
            const toDate = toInput.value;
            const errors = {};
            if (!fromDate) errors.fromDate = ['Chọn ngày bắt đầu'];
            if (!toDate) errors.toDate = ['Chọn ngày kết thúc'];
            if (fromDate && toDate) {
                const span = daysBetween(fromDate, toDate);
                if (span < 0) errors.toDate = ['Phải từ "Từ ngày" trở đi'];
                else if (span > 30) errors.toDate = ['Tối đa 31 ngày'];
            }
            if (Object.keys(errors).length) { showErrors(errors); return; }
            auditQuery.fromDate = fromDate;
            auditQuery.toDate = toDate;
            // actorId chỉ hợp lệ cùng actorType của tác nhân đã chọn; resourceId cùng resourceName
            if (actorTypeSelect.value !== auditQuery.actorType) { auditQuery.actorId = ''; auditQuery.actorName = ''; }
            if (resourceSelect.value !== auditQuery.resourceName) auditQuery.resourceId = '';
            auditQuery.actorType = actorTypeSelect.value;
            auditQuery.resourceName = resourceSelect.value;
            auditQuery.action = actionSelect.value;
            auditQuery.page = 1;
            loadAuditLogs();
        }

        form.addEventListener('submit', e => { e.preventDefault(); applyFilters(); });
        [actorTypeSelect, resourceSelect, actionSelect, fromInput, toInput].forEach(el => el.addEventListener('change', applyFilters));

        pageList.addEventListener('click', e => {
            const link = e.target.closest('.page-link');
            if (!link) return;
            e.preventDefault();
            if (!link.dataset.page) return;
            auditQuery.page = Number(link.dataset.page);
            loadAuditLogs();
        });
        btnRetry.addEventListener('click', loadAuditLogs);

        // Hộp chi tiết (chỉ đọc)
        function openDetail(r) {
            detailRow = r;
            const set = (field, text) => { detailModal.querySelector('[data-audit-field="' + field + '"]').textContent = text; };
            set('id', String(r.id));
            set('createdAt', auditTimeFmt.format(new Date(r.createdAt)));
            set('actor', r.actorName + ' — ' + ACTOR_TYPE_LABELS[r.actorType] + (r.actorId !== null ? ' #' + r.actorId : ''));
            set('action', auditActionLabel(r) + ' (' + r.action + ')');
            set('resource', resourceText(r) + ' (' + r.resourceName + ')');
            set('ipAddress', r.ipAddress || '—');
            set('userAgent', r.userAgent || '—');
            set('actionDetails', r.actionDetails === null ? 'Không có' : JSON.stringify(r.actionDetails, null, 2));
            btnFilterResource.hidden = r.resourceId === null;
            detailModal.classList.add('show');
        }
        function closeDetail() {
            detailModal.classList.remove('show');
            detailRow = null;
        }
        detailModal.querySelectorAll('[data-close-audit]').forEach(el => el.addEventListener('click', closeDetail));
        detailModal.addEventListener('click', e => { if (e.target === detailModal) closeDetail(); });
        window.addEventListener('keydown', e => {
            if (e.key === 'Escape' && detailModal.classList.contains('show')) closeDetail();
        });
        btnFilterResource.addEventListener('click', () => {
            if (!detailRow || detailRow.resourceId === null) return;
            resourceSelect.value = detailRow.resourceName;
            auditQuery.resourceName = detailRow.resourceName;
            auditQuery.resourceId = detailRow.resourceId;
            closeDetail();
            applyFilters();
        });

        tbody.addEventListener('click', e => {
            const link = e.target.closest('.audit-actor-link');
            if (link) {
                // Bấm tên tác nhân: lọc actorType + actorId của dòng (không mở chi tiết)
                const r = rowsById.get(link.dataset.auditId);
                if (!r) return;
                actorTypeSelect.value = r.actorType;
                auditQuery.actorType = r.actorType;
                auditQuery.actorId = String(r.actorId);
                auditQuery.actorName = r.actorName;
                applyFilters();
                return;
            }
            const tr = e.target.closest('tr[data-audit-id]');
            if (tr) openDetail(rowsById.get(tr.dataset.auditId));
        });

        // Kiểm thử thủ công trên trang tĩnh (không có trong Vue)
        window.__auditMock = { MOCK_AUDIT_LOGS, mockGetAuditLogs, auditQuery, loadAuditLogs, auditActionLabel, ACTIONS, RESOURCE_NAMES };

        loadAuditLogs();
    }
});
