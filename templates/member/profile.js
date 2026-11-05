// Hồ sơ của tôi (UserProfileView) – docs/modules/08_user_profile.md mục 3.1, 5.1.
// Vue: UserProfileView gọi API client cổng Member (401 → refresh một lần; 503 → biểu ngữ bảo trì),
// mẫu window.memberSession.request (templates/member/main.js).
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
    const params = new URLSearchParams(window.location.search);
    const fail = (statusCode, errorCode, message) => Promise.reject({
        success: false, statusCode, errorCode, message, errors: null, timestamp: now()
    });

    // ------------------------------------------------------------
    // Giả lập backend GET /api/v1/profile (U05, M08 mục 3.1).
    // Thứ tự: guard (401/403) → bảo trì (503) → query (400) → đọc users + user_groups + organizations.
    // 200: data đúng 15 trường (không có permissions, allowRecordingAccess); roleCode = claim của Access Token
    //      (cùng giá trị /auth/me, mock lấy từ memberSession.getAccount()); không ghi audit.
    // 401 UNAUTHORIZED: token thiếu/hết hạn, tài khoản không còn ACTIVE, nhóm INACTIVE, must_change_password = 1.
    // 403 PASSWORD_CHANGE_REQUIRED: token PASSWORD_CHANGE_ONLY (router guard đã chặn trước).
    // 503 MAINTENANCE: đang bảo trì (không thuộc danh sách miễn /auth/me, /auth/refresh, /auth/logout).
    // Mock: ?maintenance=1 (503), ?account=locked (401 → về login), ?org=none (nhóm độc lập),
    //       ?role=REGULAR_USER|USER_RECORDING (claim roleCode, mặc định GROUP_ADMIN), ?profileError=1 (lỗi mạng).
    // ------------------------------------------------------------
    const MOCK_MAINTENANCE = params.get('maintenance') === '1';
    const MOCK_ACCOUNT_LOCKED = params.get('account') === 'locked';
    const MOCK_INDEPENDENT = params.get('org') === 'none';
    let mockNetworkError = params.get('profileError') === '1';

    function buildMockProfile() {
        const account = window.memberSession ? window.memberSession.getAccount() : null;
        return {
            id: 10,
            username: 'cdr.evnit',
            email: 'cdr.evnit@evn.com.vn',
            fullName: 'Trần Thị B',
            jobTitle: 'Trưởng nhóm Kỹ thuật Vận hành',  // null khi chưa có
            phoneNumber: '0912345678',                   // null khi chưa nhập
            avatarUrl: null,                             // hoặc '/media/avatars/<uuid>.jpg'
            status: 'ACTIVE',
            userGroup: { id: 1, code: 'UMO-IT', name: 'Nhóm QLND Khối CNTT' },
            organization: MOCK_INDEPENDENT ? null : { id: 2, code: 'IT-01', name: 'Khối CNTT' },
            roleCode: account ? account.roleCode : 'GROUP_ADMIN',
            roleName: account ? account.roleName : 'Quản trị viên nhóm',
            lastLoginAt: '2026-10-26T08:05:00+07:00',
            passwordChangedAt: '2026-10-01T14:30:00+07:00', // null khi chưa từng đổi
            createdAt: '2026-09-15T09:00:00+07:00'
        };
    }

    function mockGetUserProfile(token, query) {
        return new Promise(resolve => setTimeout(resolve, 300)).then(() => {
            if (mockNetworkError) { mockNetworkError = false; return Promise.reject(new Error('Network Error')); }
            if (!token || MOCK_ACCOUNT_LOCKED) return fail(401, 'UNAUTHORIZED', 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
            if (MOCK_MAINTENANCE) return fail(503, 'MAINTENANCE', 'Hệ thống đang bảo trì, vui lòng quay lại sau');
            if (query && Object.keys(query).length) {
                return Promise.reject({
                    success: false, statusCode: 400, errorCode: 'VALIDATION_ERROR',
                    message: 'Dữ liệu không hợp lệ', errors: { query: ['API không nhận tham số truy vấn'] }, timestamp: now()
                });
            }
            return { success: true, statusCode: 200, message: 'Lấy hồ sơ thành công', data: buildMockProfile(), timestamp: now() };
        });
    }

    function callApi(fn) {
        return window.memberSession ? window.memberSession.request(fn) : fn('mock-token');
    }

    // ------------------------------------------------------------
    // Định dạng ở frontend (API chỉ trả ISO 8601 / đối tượng, R16-07)
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
        if (format === 'codeName') return value.name + ' (' + value.code + ')'; // userGroup, organization
        return String(value);
    }

    // Ảnh chữ cái đầu khi avatarUrl = null (Vue: component nội bộ, không gọi dịch vụ ngoài)
    function avatarSrc(p) {
        return p.avatarUrl ||
            'https://ui-avatars.com/api/?name=' + encodeURIComponent(p.fullName) + '&background=0033A0&color=fff&size=120';
    }

    // ------------------------------------------------------------
    // Đổ dữ liệu
    // ------------------------------------------------------------
    const loadState = document.getElementById('profileLoadState');
    const loadMessage = document.getElementById('profileLoadMessage');
    const btnRetry = document.getElementById('btnRetryProfile');
    const layout = document.getElementById('profileLayout');
    const profileAvatarImg = document.getElementById('profileAvatarImg');
    const fullNameInput = document.getElementById('fullName');
    const phoneInput = document.getElementById('phoneNumber');
    const computedFullNameDisplay = document.getElementById('computedFullNameDisplay');
    const profileDisplayName = document.getElementById('profileDisplayName');

    let profile = null; // Vue: ref trong UserProfileView (không ghi localStorage)

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
        fillForm(data);
    }

    // Giá trị ban đầu của form PUT /api/v1/profile: chỉ fullName, phoneNumber
    function fillForm(data) {
        if (fullNameInput) fullNameInput.value = data.fullName;
        if (phoneInput) phoneInput.value = data.phoneNumber || '';
        updateFullNamePreview();
    }

    function updateFullNamePreview() {
        const display = (fullNameInput ? fullNameInput.value.trim() : '') || (profile ? profile.fullName : '');
        if (computedFullNameDisplay) computedFullNameDisplay.textContent = display;
        if (profileDisplayName) profileDisplayName.textContent = display;
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
        return callApi(token => mockGetUserProfile(token))
            .then(res => {
                profile = res.data;
                renderProfile(profile);
                setLoadState('ready');
            })
            .catch(err => {
                // 401 sau khi refresh thất bại: request() đã chuyển về login.
                if (err && err.statusCode === 401) return;
                // 503: request() đã hiện biểu ngữ bảo trì; màn hình vẫn hiện lỗi + nút thử lại.
                const message = err && err.statusCode ? err.message : 'Không tải được hồ sơ. Vui lòng thử lại.';
                setLoadState('error', message);
            });
    }

    if (btnRetry) btnRetry.addEventListener('click', loadProfile);
    if (fullNameInput) fullNameInput.addEventListener('input', updateFullNamePreview);

    // Khôi phục: điền lại giá trị đã tải từ API (không gọi lại API)
    const btnResetInfo = document.getElementById('btnResetInfo');
    if (btnResetInfo) {
        btnResetInfo.addEventListener('click', function() {
            if (!profile) return;
            fillForm(profile);
            notify('Đã khôi phục thông tin ban đầu.', 'success');
        });
    }

    // ------------------------------------------------------------
    // Ảnh đại diện – POST /api/v1/profile/avatar (M08 mục 3.3; còn rà ở U08: gửi FormData, kiểm PNG/JPEG ≤ 2 MB).
    // Hiện chỉ xem trước tại chỗ, chưa gọi API.
    // ------------------------------------------------------------
    const btnChangeAvatar = document.getElementById('btnChangeAvatar');
    const avatarInput = document.getElementById('avatar-input');
    if (btnChangeAvatar && avatarInput) btnChangeAvatar.addEventListener('click', () => avatarInput.click());
    if (avatarInput) {
        avatarInput.addEventListener('change', function(e) {
            const file = e.target.files && e.target.files[0];
            if (!file) return;
            if (!['image/png', 'image/jpeg'].includes(file.type)) {
                notify('Vui lòng chọn ảnh PNG hoặc JPEG.', 'error');
                return;
            }
            if (profileAvatarImg) profileAvatarImg.src = URL.createObjectURL(file);
        });
    }

    // ------------------------------------------------------------
    // Lưu – PUT /api/v1/profile (M08 mục 3.2; còn rà ở U06: cập nhật một phần, lỗi 400 dưới ô,
    // response = hồ sơ đủ 15 trường như GET, cập nhật header qua store). Hiện chưa gọi API.
    // ------------------------------------------------------------
    const formGeneralInfo = document.getElementById('formGeneralInfo');
    if (formGeneralInfo) {
        formGeneralInfo.addEventListener('submit', function(e) {
            e.preventDefault();
            notify('Chức năng lưu hồ sơ chưa được nối API trong bản mẫu.', 'info');
        });
    }

    loadProfile();
});
