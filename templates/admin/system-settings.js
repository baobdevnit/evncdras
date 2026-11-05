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
    const sections = ['analysis', 'reporting', 'advanced', 'admins']
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
    // 7. Mục "Quản trị viên" (AdminAccountsSection.vue) – docs/modules/04_auth_admin.md mục 3.2, 3.7, 5.2
    // Khung dựng ở A14. Vue: gọi qua API client của cổng Admin (401 → refresh một lần, mẫu window.adminSession.request).
    // ----------------------------------------------------
    const adminsSection = document.getElementById('section-admins');
    if (!adminsSection || adminsSection.hidden) return; // thiếu admin:manage: không tải, không gọi API

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
        { id: 5104, actorId: 9, revokedAt: '2026-10-03T11:00:00+07:00', revokedReason: 'ACCOUNT_LOCKED', expiresAt: '2026-12-31T08:00:00+07:00' }
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
            if (canRevokeSessions(row)) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'btn btn-outline-danger btn-revoke-sessions';
                btn.dataset.adminId = String(row.id);
                btn.textContent = 'Thu hồi phiên';
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

    adminsTableBody.addEventListener('click', e => {
        const btn = e.target.closest('.btn-revoke-sessions');
        if (btn) confirmRevokeAdminSessions(btn.dataset.adminId);
    });
    btnRetryAdmins.addEventListener('click', loadAdmins);

    // Kiểm thử thủ công trên trang tĩnh (không có trong Vue)
    window.__adminsMock = { MOCK_ADMINS, MOCK_SESSIONS, MOCK_AUDIT, mockGetAdmins, mockRevokeAdminSessions, adminsQuery, loadAdmins };

    loadAdmins();
});
