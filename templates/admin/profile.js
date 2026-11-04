// Hồ sơ của tôi (AdminProfileView) – docs/modules/09_admin_profile.md mục 3.1, 3.2, 5.1.
// Vue: AdminProfileView gọi API client của cổng Admin (401 → refresh một lần, mẫu window.adminSession.request).
document.addEventListener('DOMContentLoaded', function() {
    // Redirect legacy #security hash to standalone change-password.html page
    if (window.location.hash === '#security') {
        window.location.replace('change-password.html');
        return;
    }

    // Helper toast function
    function notify(message, type = 'success') {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        } else {
            alert(message);
        }
    }

    const now = () => new Date().toISOString();

    // ------------------------------------------------------------
    // Giả lập backend GET /api/v1/admin/profile (A05).
    // 200: data đúng 12 trường của M09 mục 3.1 (không có permissions);
    // token thiếu/hết hạn hoặc tài khoản không còn ACTIVE → 401 UNAUTHORIZED;
    // token PASSWORD_CHANGE_ONLY → 403 PASSWORD_CHANGE_REQUIRED (router guard đã chặn trước).
    // ------------------------------------------------------------
    const MOCK_PROFILE = {
        id: 1,
        username: 'root.admin@evnict.vn',
        email: 'root.admin@evnict.vn',
        fullName: 'Quản trị viên Tối cao EVNICT',
        phoneNumber: '02422222222',
        avatarUrl: null,
        status: 'ACTIVE',
        roleCode: 'ROOT_ADMIN',
        roleName: 'Quản trị viên tối cao',
        lastLoginAt: '2026-10-12T08:15:00+07:00',
        passwordChangedAt: '2026-09-01T10:20:00+07:00',
        createdAt: '2026-08-15T09:00:00+07:00'
    };

    function mockGetAdminProfile(token) {
        return new Promise(resolve => setTimeout(resolve, 300)).then(() => {
            if (!token) {
                return Promise.reject({
                    success: false, statusCode: 401, errorCode: 'UNAUTHORIZED',
                    message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', errors: null, timestamp: now()
                });
            }
            return {
                success: true, statusCode: 200, message: 'Lấy hồ sơ thành công',
                data: Object.assign({}, MOCK_PROFILE), timestamp: now()
            };
        });
    }

    function callApi(fn) {
        return window.adminSession ? window.adminSession.request(fn) : fn('mock-token');
    }

    // ------------------------------------------------------------
    // Định dạng ở frontend (API chỉ trả ISO 8601, R16-07)
    // ------------------------------------------------------------
    const dateTimeFmt = new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });
    const dateFmt = new Intl.DateTimeFormat('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh', day: '2-digit', month: '2-digit', year: 'numeric'
    });

    function formatValue(value, format) {
        if (value === null || value === undefined || value === '') return null;
        if (format === 'datetime') return dateTimeFmt.format(new Date(value));
        if (format === 'date') return dateFmt.format(new Date(value));
        return String(value);
    }

    // Ảnh chữ cái đầu khi avatarUrl = null (Vue: component nội bộ, không gọi dịch vụ ngoài)
    function avatarSrc(profile) {
        return profile.avatarUrl ||
            'https://ui-avatars.com/api/?name=' + encodeURIComponent(profile.fullName) +
            '&background=0033A0&color=fff&size=120';
    }

    // ------------------------------------------------------------
    // Đổ dữ liệu
    // ------------------------------------------------------------
    const loadState = document.getElementById('profileLoadState');
    const loadMessage = document.getElementById('profileLoadMessage');
    const btnRetry = document.getElementById('btnRetryProfile');
    const layout = document.getElementById('profileLayout');
    const profileAvatarImg = document.getElementById('profileAvatarImg');
    const roleBadge = document.getElementById('profileRoleBadge');
    const fullNameInput = document.getElementById('fullName');
    const phoneInput = document.getElementById('phoneNumber');
    const computedFullNameDisplay = document.getElementById('computedFullNameDisplay');
    const profileDisplayName = document.getElementById('profileDisplayName');

    let profile = null; // Vue: ref trong AdminProfileView (không ghi localStorage)

    function renderProfile(data) {
        document.querySelectorAll('[data-field]').forEach(el => {
            const text = formatValue(data[el.dataset.field], el.dataset.format);
            const shown = text === null ? (el.dataset.empty || '—') : text;
            if (el.tagName === 'INPUT') el.value = shown; else el.textContent = shown;
        });
        if (profileAvatarImg) {
            profileAvatarImg.src = avatarSrc(data);
            profileAvatarImg.alt = data.fullName;
        }
        if (roleBadge) roleBadge.classList.toggle('role-badge--root', data.roleCode === 'ROOT_ADMIN');
        fillForm(data);
    }

    // Giá trị ban đầu của form PUT /admin/profile: chỉ fullName, phoneNumber
    function fillForm(data) {
        if (fullNameInput) fullNameInput.value = data.fullName;
        if (phoneInput) phoneInput.value = data.phoneNumber || '';
        updateFullNamePreview();
    }

    function setLoadState(state, message) {
        if (loadState) {
            loadState.hidden = state === 'ready';
            loadState.classList.toggle('is-error', state === 'error');
        }
        if (loadMessage && message) loadMessage.textContent = message;
        if (btnRetry) btnRetry.hidden = state !== 'error';
        if (layout) layout.hidden = state !== 'ready';
    }

    function loadProfile() {
        setLoadState('loading', 'Đang tải hồ sơ...');
        return callApi(token => mockGetAdminProfile(token))
            .then(res => {
                profile = res.data;
                renderProfile(profile);
                setLoadState('ready');
            })
            .catch(err => {
                // 401 sau khi refresh thất bại: request() đã chuyển về login.
                if (err && err.statusCode === 401) return;
                setLoadState('error', (err && err.message) || 'Không tải được hồ sơ. Vui lòng thử lại.');
            });
    }

    if (btnRetry) btnRetry.addEventListener('click', loadProfile);

    // ------------------------------------------------------------
    // Ảnh đại diện – POST /api/v1/admin/profile/avatar (A08, chưa rà): xem trước cục bộ
    // ------------------------------------------------------------
    const btnChangeAvatar = document.getElementById('btnChangeAvatar');
    const avatarInput = document.getElementById('avatar-input');

    if (btnChangeAvatar && avatarInput) {
        btnChangeAvatar.addEventListener('click', function() {
            avatarInput.click();
        });
    }

    if (avatarInput) {
        avatarInput.addEventListener('change', function(e) {
            const file = e.target.files && e.target.files[0];
            if (file) {
                if (!file.type.startsWith('image/')) {
                    notify('Vui lòng chọn tệp hình ảnh hợp lệ.', 'error');
                    return;
                }
                const reader = new FileReader();
                reader.onload = function(evt) {
                    if (profileAvatarImg) {
                        profileAvatarImg.src = evt.target.result;
                    }
                    const sidebarFooterAvatar = document.querySelector('.sidebar-footer .user-profile .avatar');
                    if (sidebarFooterAvatar) {
                        sidebarFooterAvatar.src = evt.target.result;
                    }
                    notify('Ảnh đại diện đã được cập nhật thành công.', 'success');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // ------------------------------------------------------------
    // Form thông tin – PUT /api/v1/admin/profile (A06, chưa rà)
    // ------------------------------------------------------------
    const btnResetInfo = document.getElementById('btnResetInfo');

    function updateFullNamePreview() {
        const display = (fullNameInput ? fullNameInput.value.trim() : '') || (profile && profile.fullName) || '';
        if (computedFullNameDisplay) computedFullNameDisplay.textContent = display;
        if (profileDisplayName) profileDisplayName.textContent = display;
    }

    if (fullNameInput) fullNameInput.addEventListener('input', updateFullNamePreview);

    if (btnResetInfo) {
        btnResetInfo.addEventListener('click', function() {
            if (!profile) return;
            fillForm(profile);
            notify('Đã khôi phục thông tin ban đầu.', 'success');
        });
    }

    const formGeneralInfo = document.getElementById('formGeneralInfo');

    if (formGeneralInfo) {
        formGeneralInfo.addEventListener('submit', function(e) {
            e.preventDefault();
            if (!profile) return;
            const btn = document.getElementById('btnSubmitInfo') || this.querySelector('button[type="submit"]');
            const originalHtml = btn.innerHTML;
            // Body chỉ gồm fullName, phoneNumber (ô trống → null)
            const body = {
                fullName: fullNameInput.value.trim(),
                phoneNumber: phoneInput.value.trim() || null
            };

            btn.disabled = true;
            btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> Đang lưu...`;

            setTimeout(() => {
                profile = Object.assign({}, profile, body);
                notify('Thông tin hồ sơ đã được lưu thành công.', 'success');
                btn.disabled = false;
                btn.innerHTML = originalHtml;
            }, 600);
        });
    }

    loadProfile();
});
