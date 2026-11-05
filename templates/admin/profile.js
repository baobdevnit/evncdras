// Hồ sơ của tôi (AdminProfileView) – docs/modules/09_admin_profile.md mục 3.1, 3.2, 3.2.1, 3.4, 3.5, 5.1.
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

    // options.keepForm: không điền lại form đang sửa dở (sau khi đổi ảnh đại diện).
    function renderProfile(data, options) {
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
        if (!(options && options.keepForm)) fillForm(data);
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
    // Ảnh đại diện – POST /api/v1/admin/profile/avatar (A08, M09 mục 3.2.1)
    // multipart/form-data đúng một phần "file" (≤ 2 MB, PNG/JPEG). Backend cắt 256×256, bỏ metadata,
    // lưu /media/avatars/<uuid>.<png|jpg> (Nginx phục vụ), trả data = hồ sơ đủ 12 trường như GET.
    // ------------------------------------------------------------
    const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
    const AVATAR_TYPES = ['image/png', 'image/jpeg'];
    const btnChangeAvatar = document.getElementById('btnChangeAvatar');
    const avatarInput = document.getElementById('avatar-input');
    const avatarWrapper = document.querySelector('.profile-avatar-wrapper');

    // Kiểm tra trước ở client (backend kiểm tra lại bằng magic bytes và là nơi quyết định).
    // Trả null hoặc errors = { file: [..] } cùng khóa với backend.
    function checkAvatarFile(file) {
        if (!file) return { file: ['Cần chọn một ảnh'] };
        if (!AVATAR_TYPES.includes(file.type)) return { file: ['Chỉ nhận ảnh PNG hoặc JPEG'] };
        if (file.size > AVATAR_MAX_BYTES) return { file: ['Ảnh tối đa 2 MB'] };
        return null;
    }

    function uuidV4() {
        if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }

    // Giả lập backend POST /api/v1/admin/profile/avatar:
    // 400 VALIDATION_ERROR (errors.file hoặc trường lạ); 401 UNAUTHORIZED (token/tài khoản không còn ACTIVE);
    // 200 data = đúng 12 trường như GET, avatarUrl = /media/avatars/<uuid>.<png|jpg>;
    // luôn ghi ADMIN / UPDATE { changedFields: ["avatarUrl"] } (in ra console để minh họa).
    // Bản mock dùng object URL thay cho đường dẫn /media/avatars/ vì trang tĩnh không có Nginx.
    function mockPostAdminAvatar(token, formData) {
        return new Promise(resolve => setTimeout(resolve, 700)).then(() => {
            if (!token) {
                return Promise.reject({
                    success: false, statusCode: 401, errorCode: 'UNAUTHORIZED',
                    message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', errors: null, timestamp: now()
                });
            }
            const errors = {};
            const files = formData.getAll('file');
            for (const key of formData.keys()) {
                if (key !== 'file') errors[key] = ['Trường không được nhận'];
            }
            if (files.length > 1) errors.file = ['Chỉ gửi một ảnh'];
            else {
                const fileErrors = checkAvatarFile(files[0]);
                if (fileErrors) errors.file = fileErrors.file;
            }
            if (Object.keys(errors).length) return Promise.reject(validationError(errors));
            const ext = files[0].type === 'image/png' ? 'png' : 'jpg';
            const storedPath = '/media/avatars/' + uuidV4() + '.' + ext;
            MOCK_PROFILE.avatarUrl = URL.createObjectURL(files[0]); // backend thật: storedPath
            console.info('[mock] lưu ảnh', storedPath, '| audit_logs ADMIN / UPDATE', {
                resourceId: String(MOCK_PROFILE.id), actionDetails: { changedFields: ['avatarUrl'] }
            });
            mockWriteAudit('UPDATE', 'ADMIN', String(MOCK_PROFILE.id), { changedFields: ['avatarUrl'] });
            return {
                success: true, statusCode: 200, message: 'Cập nhật ảnh đại diện thành công',
                data: Object.assign({}, MOCK_PROFILE), timestamp: now()
            };
        });
    }

    function setAvatarUploading(uploading) {
        if (btnChangeAvatar) {
            btnChangeAvatar.disabled = uploading;
            btnChangeAvatar.title = uploading ? 'Đang tải ảnh lên...' : 'Thay đổi ảnh đại diện';
        }
        if (avatarWrapper) {
            avatarWrapper.classList.toggle('is-uploading', uploading);
            avatarWrapper.setAttribute('aria-busy', uploading ? 'true' : 'false');
        }
    }

    if (btnChangeAvatar && avatarInput) {
        btnChangeAvatar.addEventListener('click', function() {
            if (!btnChangeAvatar.disabled) avatarInput.click();
        });
    }

    if (avatarInput) {
        avatarInput.addEventListener('change', function(e) {
            const file = e.target.files && e.target.files[0];
            // Xóa giá trị để chọn lại cùng file vẫn phát sinh "change"
            avatarInput.value = '';
            if (!file || !profile) return;
            const clientErrors = checkAvatarFile(file);
            if (clientErrors) { notify(clientErrors.file.join(' '), 'error'); return; }

            // Không tự đặt Content-Type: trình duyệt thêm boundary. FormData dùng lại được khi request() gửi lại sau refresh.
            const formData = new FormData();
            formData.append('file', file);
            setAvatarUploading(true);
            callApi(token => mockPostAdminAvatar(token, formData))
                .then(res => {
                    profile = res.data;
                    // Chỉ vẽ lại phần hiển thị, không điền lại form "Thông tin cá nhân" đang sửa dở
                    renderProfile(profile, { keepForm: true });
                    // Header AdminLayout đổi ảnh ngay (Vue: cập nhật authAdmin.admin.avatarUrl, không gọi /auth/me)
                    if (window.adminSession && window.adminSession.updateAccount) {
                        window.adminSession.updateAccount({ avatarUrl: profile.avatarUrl });
                    }
                    notify(res.message || 'Cập nhật ảnh đại diện thành công', 'success');
                    loadActivity(); // POST .../avatar vừa ghi ADMIN / UPDATE
                })
                .catch(err => {
                    // 401 sau khi refresh thất bại: request() đã chuyển về login.
                    if (err && err.statusCode === 401) return;
                    if (err && err.errorCode === 'VALIDATION_ERROR' && err.errors) {
                        const msgs = Object.keys(err.errors).map(k => [].concat(err.errors[k]).join(' '));
                        notify(msgs.join(' '), 'error');
                        return;
                    }
                    notify((err && err.message) || 'Không tải được ảnh lên. Vui lòng thử lại.', 'error');
                })
                .finally(() => setAvatarUploading(false));
        });
    }

    // ------------------------------------------------------------
    // Form thông tin – PUT /api/v1/admin/profile (A06, M09 mục 3.2)
    // ------------------------------------------------------------
    const PHONE_PATTERN = /^(?=.*[0-9])[0-9+\-.() ]{1,30}$/; // 02 mục 2 "Số điện thoại liên hệ"
    const ALLOWED_FIELDS = ['fullName', 'phoneNumber'];

    function validationError(errors) {
        return {
            success: false, statusCode: 400, errorCode: 'VALIDATION_ERROR',
            message: 'Dữ liệu không hợp lệ', errors: errors, timestamp: now()
        };
    }

    // Quy tắc body dùng chung cho kiểm tra ở client và mock backend.
    // Trả { body: giá trị đã chuẩn hóa, errors: null | { field: [..] } }.
    function normalizeBody(raw) {
        const errors = {};
        const body = {};
        const keys = Object.keys(raw || {});
        if (keys.length === 0) {
            const msg = ['Cần gửi ít nhất một trường'];
            return { body, errors: { fullName: msg, phoneNumber: msg } };
        }
        keys.filter(k => !ALLOWED_FIELDS.includes(k))
            .forEach(k => { errors[k] = ['Trường không được nhận']; });
        if ('fullName' in raw) {
            const v = typeof raw.fullName === 'string' ? raw.fullName.trim() : '';
            if (!v) errors.fullName = ['Họ và tên không được để trống'];
            else if (v.length > 150) errors.fullName = ['Họ và tên tối đa 150 ký tự'];
            else body.fullName = v;
        }
        if ('phoneNumber' in raw) {
            const r = raw.phoneNumber;
            if (r !== null && typeof r !== 'string') {
                errors.phoneNumber = ['Số điện thoại phải là chuỗi hoặc null'];
            } else {
                const v = r === null ? '' : r.trim();
                if (v === '') body.phoneNumber = null;
                else if (v.length > 30) errors.phoneNumber = ['Số điện thoại tối đa 30 ký tự'];
                else if (!PHONE_PATTERN.test(v)) errors.phoneNumber = ['Số điện thoại chỉ gồm chữ số, khoảng trắng và các ký tự + - . ( )'];
                else body.phoneNumber = v;
            }
        }
        return { body, errors: Object.keys(errors).length ? errors : null };
    }

    // Giả lập backend PUT /api/v1/admin/profile:
    // 400 VALIDATION_ERROR (errors theo trường); 401 UNAUTHORIZED (token/tài khoản không còn ACTIVE);
    // 200 data = đúng 12 trường như GET. changedFields rỗng → không UPDATE, không ghi audit_logs;
    // ngược lại ghi ADMIN / UPDATE { changedFields } (in ra console để minh họa).
    function mockPutAdminProfile(token, rawBody) {
        return new Promise(resolve => setTimeout(resolve, 500)).then(() => {
            if (!token) {
                return Promise.reject({
                    success: false, statusCode: 401, errorCode: 'UNAUTHORIZED',
                    message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', errors: null, timestamp: now()
                });
            }
            const checked = normalizeBody(rawBody);
            if (checked.errors) return Promise.reject(validationError(checked.errors));
            const changedFields = ALLOWED_FIELDS.filter(k => k in checked.body && checked.body[k] !== MOCK_PROFILE[k]);
            if (changedFields.length) {
                changedFields.forEach(k => { MOCK_PROFILE[k] = checked.body[k]; });
                console.info('[mock] audit_logs ADMIN / UPDATE', {
                    resourceId: String(MOCK_PROFILE.id), actionDetails: { changedFields: changedFields }
                });
                mockWriteAudit('UPDATE', 'ADMIN', String(MOCK_PROFILE.id), { changedFields: changedFields });
            }
            return {
                success: true, statusCode: 200, message: 'Cập nhật hồ sơ thành công',
                data: Object.assign({}, MOCK_PROFILE), timestamp: now()
            };
        });
    }

    const btnResetInfo = document.getElementById('btnResetInfo');
    const formGeneralInfo = document.getElementById('formGeneralInfo');
    const btnSubmitInfo = document.getElementById('btnSubmitInfo');

    function updateFullNamePreview() {
        const display = (fullNameInput ? fullNameInput.value.trim() : '') || (profile && profile.fullName) || '';
        if (computedFullNameDisplay) computedFullNameDisplay.textContent = display;
        if (profileDisplayName) profileDisplayName.textContent = display;
    }

    function clearFieldErrors(field) {
        if (!formGeneralInfo) return;
        formGeneralInfo.querySelectorAll('[data-error-for]').forEach(slot => {
            if (field && slot.dataset.errorFor !== field) return;
            slot.hidden = true;
            slot.textContent = '';
            const input = document.getElementById(slot.dataset.errorFor);
            if (input) input.classList.remove('is-invalid');
        });
    }

    // Hiện errors[field] dưới ô tương ứng; trả về các thông điệp không có ô để hiện ở toast.
    function showFieldErrors(errors) {
        const unmatched = [];
        clearFieldErrors();
        Object.keys(errors || {}).forEach(field => {
            const slot = formGeneralInfo && formGeneralInfo.querySelector('[data-error-for="' + field + '"]');
            const msg = [].concat(errors[field]).join(' ');
            if (!slot) { unmatched.push(msg); return; }
            slot.textContent = msg;
            slot.hidden = false;
            const input = document.getElementById(field);
            if (input) input.classList.add('is-invalid');
        });
        return unmatched;
    }

    if (fullNameInput) {
        fullNameInput.addEventListener('input', function() {
            updateFullNamePreview();
            clearFieldErrors('fullName');
        });
    }
    if (phoneInput) phoneInput.addEventListener('input', () => clearFieldErrors('phoneNumber'));

    // Khôi phục: điền lại giá trị của lần tải/lưu gần nhất, không gọi API.
    if (btnResetInfo) {
        btnResetInfo.addEventListener('click', function() {
            if (!profile) return;
            clearFieldErrors();
            fillForm(profile);
            notify('Đã khôi phục thông tin ban đầu.', 'success');
        });
    }

    if (formGeneralInfo && btnSubmitInfo) {
        formGeneralInfo.addEventListener('submit', function(e) {
            e.preventDefault();
            if (!profile || btnSubmitInfo.disabled) return;
            // Body chỉ gồm fullName, phoneNumber (ô trống → null); kiểm tra trước cùng quy tắc với backend
            const checked = normalizeBody({
                fullName: fullNameInput.value,
                phoneNumber: phoneInput.value.trim() || null
            });
            if (checked.errors) { showFieldErrors(checked.errors); return; }

            const originalHtml = btnSubmitInfo.innerHTML;
            btnSubmitInfo.disabled = true;
            btnSubmitInfo.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> Đang lưu...`;

            callApi(token => mockPutAdminProfile(token, checked.body))
                .then(res => {
                    profile = res.data;
                    clearFieldErrors();
                    renderProfile(profile);
                    // Header AdminLayout đổi tên ngay (Vue: cập nhật authAdmin.admin, không gọi /auth/me)
                    if (window.adminSession && window.adminSession.updateAccount) {
                        window.adminSession.updateAccount({ fullName: profile.fullName });
                    }
                    notify(res.message || 'Cập nhật hồ sơ thành công', 'success');
                    loadActivity(); // có trường đổi thì PUT vừa ghi ADMIN / UPDATE
                })
                .catch(err => {
                    // 401 sau khi refresh thất bại: request() đã chuyển về login.
                    if (err && err.statusCode === 401) return;
                    if (err && err.errorCode === 'VALIDATION_ERROR') {
                        const rest = showFieldErrors(err.errors);
                        if (rest.length) notify(rest.join(' '), 'error');
                        return;
                    }
                    notify((err && err.message) || 'Không lưu được hồ sơ. Vui lòng thử lại.', 'error');
                })
                .finally(() => {
                    btnSubmitInfo.disabled = false;
                    btnSubmitInfo.innerHTML = originalHtml;
                });
        });
    }

    // ------------------------------------------------------------
    // Phiên đăng nhập của tôi – GET /api/v1/admin/auth/sessions (A12, M09 mục 3.5.1, 5.1)
    // Không query (có → 400). data = mảng phiên còn hiệu lực (revoked_at IS NULL AND expires_at > NOW())
    // của chính mình; phần tử đúng 7 trường; phiên hiện tại theo claim sid (không theo cookie), đứng đầu.
    // ------------------------------------------------------------
    const UA_CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
    const UA_SAFARI_MAC = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
    const UA_EDGE_WIN = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36 Edg/130.0';

    // MOCK_AUTH_SESSIONS đóng vai các dòng auth_sessions (đủ cột để minh họa WHERE và chuỗi xoay vòng).
    // 4801 → 4821: phiên của trình duyệt này đã xoay vòng lúc 09:42 (logged_in_at chép nguyên).
    const MOCK_AUTH_SESSIONS = [
        { id: 4801, actorType: 'ADMIN', actorId: 1, ipAddress: '10.0.12.34', userAgent: UA_CHROME, loggedInAt: '2026-11-05T08:15:00+07:00', createdAt: '2026-11-05T08:15:00+07:00', lastUsedAt: null, expiresAt: '2026-11-12T08:15:00+07:00', revokedAt: '2026-11-05T09:42:10+07:00', revokedReason: 'ROTATED', replacedBySessionId: 4821 },
        { id: 4821, actorType: 'ADMIN', actorId: 1, ipAddress: '10.0.12.34', userAgent: UA_CHROME, loggedInAt: '2026-11-05T08:15:00+07:00', createdAt: '2026-11-05T09:42:10+07:00', lastUsedAt: '2026-11-05T09:42:10+07:00', expiresAt: '2026-11-12T08:15:00+07:00', revokedAt: null, revokedReason: null, replacedBySessionId: null },
        { id: 4790, actorType: 'ADMIN', actorId: 1, ipAddress: '10.0.40.7', userAgent: UA_SAFARI_MAC, loggedInAt: '2026-11-03T14:02:00+07:00', createdAt: '2026-11-04T17:30:45+07:00', lastUsedAt: '2026-11-04T17:30:45+07:00', expiresAt: '2026-11-10T14:02:00+07:00', revokedAt: null, revokedReason: null, replacedBySessionId: null },
        { id: 4755, actorType: 'ADMIN', actorId: 1, ipAddress: null, userAgent: 'curl/8.4.0', loggedInAt: '2026-11-02T07:30:00+07:00', createdAt: '2026-11-02T07:30:00+07:00', lastUsedAt: null, expiresAt: '2026-11-09T07:30:00+07:00', revokedAt: null, revokedReason: null, replacedBySessionId: null },
        // Không được trả: đã thu hồi, đã hết hạn, của Admin khác
        { id: 4700, actorType: 'ADMIN', actorId: 1, ipAddress: '10.0.12.34', userAgent: UA_EDGE_WIN, loggedInAt: '2026-11-01T09:00:00+07:00', createdAt: '2026-11-01T09:00:00+07:00', lastUsedAt: null, expiresAt: '2026-11-08T09:00:00+07:00', revokedAt: '2026-11-01T18:00:00+07:00', revokedReason: 'LOGOUT', replacedBySessionId: null },
        { id: 4410, actorType: 'ADMIN', actorId: 1, ipAddress: '10.0.12.34', userAgent: UA_CHROME, loggedInAt: '2026-10-20T08:00:00+07:00', createdAt: '2026-10-20T08:00:00+07:00', lastUsedAt: null, expiresAt: '2026-10-27T08:00:00+07:00', revokedAt: null, revokedReason: null, replacedBySessionId: null },
        { id: 4815, actorType: 'ADMIN', actorId: 2, ipAddress: '10.0.12.9', userAgent: UA_CHROME, loggedInAt: '2026-11-05T09:10:00+07:00', createdAt: '2026-11-05T09:10:00+07:00', lastUsedAt: null, expiresAt: '2026-11-12T09:10:00+07:00', revokedAt: null, revokedReason: null, replacedBySessionId: null }
    ];
    // Claim sid của Access Token tab này: còn trỏ 4801 vì tab khác vừa refresh (minh họa đi theo chuỗi).
    const MOCK_TOKEN_SID = 4801;
    const MOCK_NOW = Date.parse('2026-11-05T09:45:00+07:00'); // thay cho NOW() để dữ liệu mẫu ổn định

    function isLiveSession(row) {
        return row.revokedAt === null && Date.parse(row.expiresAt) > MOCK_NOW;
    }

    // WHERE id = ? AND actor_type = 'ADMIN' AND actor_id = :sub (khóa chính; DELETE đọc bằng SELECT ... FOR UPDATE)
    function findOwnSession(id, actorId) {
        return MOCK_AUTH_SESSIONS.find(r => r.id === id && r.actorType === 'ADMIN' && r.actorId === actorId) || null;
    }

    // Đi theo replaced_by_session_id tối đa 5 bước tới phiên còn hiệu lực (01 mục 6.1); không tới được → null
    function followSessionChain(row, actorId) {
        for (let step = 0; row && step <= 5; step++) {
            if (isLiveSession(row)) return row;
            if (row.revokedReason !== 'ROTATED' || !row.replacedBySessionId) return null;
            row = findOwnSession(row.replacedBySessionId, actorId);
        }
        return null;
    }

    // Phiên hiện tại: id = sid của chính mình, đi theo chuỗi xoay vòng (M09 mục 3.5)
    function resolveCurrentSessionId(sid, actorId) {
        const row = followSessionChain(findOwnSession(sid, actorId), actorId);
        return row ? row.id : null;
    }

    function mockGetMySessions(token, query) {
        return new Promise(resolve => setTimeout(resolve, 350)).then(() => {
            if (!token) {
                return Promise.reject({
                    success: false, statusCode: 401, errorCode: 'UNAUTHORIZED',
                    message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', errors: null, timestamp: now()
                });
            }
            const keys = Object.keys(query || {});
            if (keys.length) {
                const errors = {};
                keys.forEach(k => { errors[k] = ['Tham số không được nhận']; });
                return Promise.reject(validationError(errors));
            }
            const currentId = resolveCurrentSessionId(MOCK_TOKEN_SID, MOCK_PROFILE.id);
            const lastActive = r => r.lastUsedAt || r.createdAt; // COALESCE(last_used_at, created_at)
            const rows = MOCK_AUTH_SESSIONS
                .filter(r => r.actorType === 'ADMIN' && r.actorId === MOCK_PROFILE.id && isLiveSession(r))
                .sort((a, b) => ((b.id === currentId) - (a.id === currentId))
                    || (Date.parse(lastActive(b)) - Date.parse(lastActive(a))) || (b.id - a.id))
                .map(r => ({
                    id: r.id, ipAddress: r.ipAddress, userAgent: r.userAgent, loggedInAt: r.loggedInAt,
                    lastActiveAt: lastActive(r), expiresAt: r.expiresAt, isCurrent: r.id === currentId
                }));
            return {
                success: true, statusCode: 200, message: 'Lấy danh sách phiên đăng nhập thành công',
                data: rows, timestamp: now()
            };
        });
    }

    // ------------------------------------------------------------
    // Giả lập backend DELETE /api/v1/admin/auth/sessions/:id (A13, M09 mục 3.5.2).
    // :id không phải số nguyên dương → 400 (errors.id); có query/body → 400; không có hoặc không phải phiên
    // của mình → 404 NOT_FOUND; đi chuỗi ROTATED tới phiên còn hiệu lực, không tới được → 200 { revoked: false };
    // phiên đích là phiên hiện tại (theo claim sid) → 400 VALIDATION_ERROR (errors.id); còn lại thu hồi
    // REVOKED_BY_SELF + audit AUTH / SESSION_REVOKED (resource_id = id phiên bị thu hồi) → 200 { revoked: true }.
    // ------------------------------------------------------------
    function mockDeleteMySession(token, rawId, query, body) {
        return new Promise(resolve => setTimeout(resolve, 400)).then(() => {
            if (!token) {
                return Promise.reject({
                    success: false, statusCode: 401, errorCode: 'UNAUTHORIZED',
                    message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', errors: null, timestamp: now()
                });
            }
            const errors = {};
            Object.keys(query || {}).forEach(k => { errors[k] = ['Tham số không được nhận']; });
            Object.keys(body || {}).forEach(k => { errors[k] = ['Trường không được nhận']; });
            if (!/^[1-9][0-9]{0,18}$/.test(String(rawId))) errors.id = ['Mã phiên không hợp lệ'];
            if (Object.keys(errors).length) return Promise.reject(validationError(errors));

            const actorId = MOCK_PROFILE.id;
            const requested = findOwnSession(Number(rawId), actorId);
            if (!requested) {
                return Promise.reject({
                    success: false, statusCode: 404, errorCode: 'NOT_FOUND',
                    message: 'Không tìm thấy phiên đăng nhập', errors: null, timestamp: now()
                });
            }
            const target = followSessionChain(requested, actorId);
            if (!target) {
                return {
                    success: true, statusCode: 200, message: 'Phiên đăng nhập đã kết thúc trước đó',
                    data: { revoked: false }, timestamp: now()
                };
            }
            // Backend: xác định phiên hiện tại SAU khi đã khóa chuỗi phiên đích, bằng đọc khóa (FOR UPDATE)
            if (target.id === resolveCurrentSessionId(MOCK_TOKEN_SID, actorId)) {
                return Promise.reject(validationError({ id: ['Không thể thu hồi phiên đang dùng, hãy dùng Đăng xuất'] }));
            }
            target.revokedAt = nowVN();
            target.revokedReason = 'REVOKED_BY_SELF';
            mockWriteAudit('SESSION_REVOKED', 'AUTH', String(target.id), null);
            return {
                success: true, statusCode: 200, message: 'Đã thu hồi phiên đăng nhập',
                data: { revoked: true }, timestamp: now()
            };
        });
    }

    // Rút tên trình duyệt + hệ điều hành từ userAgent (hàm nội bộ, không thư viện ngoài; API không trả tên ghép sẵn).
    // Thứ tự kiểm tra quan trọng: Edge/Opera chứa "Chrome", Chrome chứa "Safari".
    function describeUserAgent(ua) {
        if (!ua) return null;
        const browsers = [[/Edg\//, 'Edge'], [/OPR\//, 'Opera'], [/Firefox\//, 'Firefox'], [/Chrome\//, 'Chrome'], [/Version\/[\d.]+.*Safari\//, 'Safari']];
        const systems = [[/Windows NT/, 'Windows'], [/Android/, 'Android'], [/iPhone|iPad/, 'iOS'], [/Mac OS X/, 'macOS'], [/Linux/, 'Linux']];
        const browser = (browsers.find(([re]) => re.test(ua)) || [])[1];
        const os = (systems.find(([re]) => re.test(ua)) || [])[1];
        if (browser && os) return browser + ' trên ' + os;
        return browser || os || null;
    }

    const sessionsState = document.getElementById('sessionsState');
    const sessionsMessage = document.getElementById('sessionsMessage');
    const btnRetrySessions = document.getElementById('btnRetrySessions');
    const sessionList = document.getElementById('sessionList');

    function setSessionsState(state, message) {
        if (sessionsState) {
            sessionsState.hidden = state === 'ready';
            sessionsState.classList.toggle('is-error', state === 'error');
        }
        if (sessionsMessage && message) sessionsMessage.textContent = message;
        if (btnRetrySessions) btnRetrySessions.hidden = state !== 'error';
        if (sessionList) sessionList.hidden = state !== 'ready';
    }

    let sessionRows = new Map(); // id → phần tử của GET, để hộp xác nhận nêu thiết bị/IP

    // Dựng bằng textContent: userAgent, ipAddress do client gửi lên
    function renderSessions(rows) {
        if (!sessionList) return;
        sessionList.replaceChildren();
        sessionRows = new Map(rows.map(r => [String(r.id), r]));
        rows.forEach(row => {
            const li = document.createElement('li');
            li.className = 'session-item' + (row.isCurrent ? ' session-item--current' : '');
            li.dataset.sessionId = String(row.id);
            if (row.userAgent) li.title = row.userAgent;
            const body = document.createElement('div');
            const device = document.createElement('p');
            device.className = 'session-device';
            device.append(describeUserAgent(row.userAgent) || 'Thiết bị không xác định');
            if (row.isCurrent) {
                const tag = document.createElement('span');
                tag.className = 'session-current-tag';
                tag.textContent = 'Phiên này';
                device.appendChild(tag);
            }
            body.appendChild(device);
            const meta = document.createElement('p');
            meta.className = 'session-meta';
            meta.textContent = [
                row.ipAddress ? 'IP: ' + row.ipAddress : null,
                'Đăng nhập: ' + formatValue(row.loggedInAt, 'datetime'),
                'Hoạt động gần nhất: ' + formatValue(row.lastActiveAt, 'datetime')
            ].filter(Boolean).join(' · ');
            body.appendChild(meta);
            const expiry = document.createElement('time');
            expiry.className = 'session-expiry';
            expiry.dateTime = row.expiresAt;
            expiry.textContent = 'Hết hạn ' + formatValue(row.expiresAt, 'datetime');
            const side = document.createElement('div');
            side.className = 'session-side';
            side.appendChild(expiry);
            // Phiên hiện tại không có nút thu hồi (DELETE trả 400; kết thúc phiên này bằng Đăng xuất)
            if (!row.isCurrent) {
                const btn = document.createElement('button');
                btn.type = 'button';
                btn.className = 'btn-outline-danger session-revoke';
                btn.dataset.sessionId = String(row.id);
                btn.textContent = 'Thu hồi';
                side.appendChild(btn);
            }
            li.appendChild(body);
            li.appendChild(side);
            sessionList.appendChild(li);
        });
    }

    function loadSessions() {
        setSessionsState('loading', 'Đang tải phiên đăng nhập...');
        return callApi(token => mockGetMySessions(token))
            .then(res => {
                if (!res.data.length) { setSessionsState('empty', 'Không có phiên nào đang hoạt động'); return; }
                renderSessions(res.data);
                setSessionsState('ready');
            })
            .catch(err => {
                // 401 sau khi refresh thất bại: request() đã chuyển về login.
                if (err && err.statusCode === 401) return;
                setSessionsState('error', (err && err.message) || 'Không tải được phiên đăng nhập. Vui lòng thử lại.');
            });
    }

    if (btnRetrySessions) btnRetrySessions.addEventListener('click', loadSessions);

    // ------------------------------------------------------------
    // Thu hồi một phiên – DELETE /api/v1/admin/auth/sessions/:id (A13, M09 mục 3.5.2)
    // Hộp xác nhận (03 mục 6.6, loại danger) → gọi API. 200 (revoked true/false), 404, 400 đều tải lại danh sách
    // phiên; chỉ revoked = true mới sinh dòng SESSION_REVOKED nên chỉ khi đó tải lại "Hoạt động gần đây".
    // Vue: ConfirmModal dùng chung. Thiết bị bị thu hồi còn dùng Access Token tới khi hết hạn (≤ 15 phút mặc định).
    // ------------------------------------------------------------
    const revokeModal = document.getElementById('revokeSessionModal');
    const revokeModalMessage = document.getElementById('revokeSessionMessage');
    const btnCancelRevoke = document.getElementById('btnCancelRevokeSession');
    const btnConfirmRevoke = document.getElementById('btnConfirmRevokeSession');
    let pendingRevokeId = null;
    let revoking = false;

    function openRevokeModal(id) {
        const row = sessionRows.get(id);
        if (!row || !revokeModal) return;
        pendingRevokeId = id;
        const device = describeUserAgent(row.userAgent) || 'Thiết bị không xác định';
        revokeModalMessage.textContent = 'Thiết bị "' + device + '"' + (row.ipAddress ? ' (IP ' + row.ipAddress + ')' : '')
            + ' sẽ không làm mới được phiên và bị đăng xuất khi Access Token hiện tại của thiết bị đó hết hạn'
            + ' (tối đa 15 phút theo cấu hình mặc định).';
        revokeModal.style.display = 'flex';
        btnConfirmRevoke.focus();
    }

    function closeRevokeModal() {
        if (!revokeModal || revoking) return; // đang gửi thì không đóng
        revokeModal.style.display = 'none';
        pendingRevokeId = null;
    }

    function setRevoking(on) {
        revoking = on;
        btnConfirmRevoke.disabled = on;
        btnCancelRevoke.disabled = on;
        btnConfirmRevoke.textContent = on ? 'Đang thu hồi...' : 'Thu hồi';
    }

    function confirmRevoke() {
        if (!pendingRevokeId || revoking) return;
        const id = pendingRevokeId;
        let reloadSessions = true;
        let reloadActivity = false;
        setRevoking(true);
        callApi(token => mockDeleteMySession(token, id))
            .then(res => {
                if (res.data.revoked) {
                    reloadActivity = true;
                    notify(res.message || 'Đã thu hồi phiên đăng nhập', 'success');
                } else {
                    notify('Phiên này đã kết thúc trước đó', 'info');
                }
            })
            .catch(err => {
                const status = err && err.statusCode;
                if (status === 401) { reloadSessions = false; return; } // request() đã chuyển về login
                if (status === 404) { notify('Phiên đăng nhập không còn tồn tại', 'warning'); return; }
                if (status === 400) {
                    const msg = err.errors && err.errors.id ? err.errors.id[0] : err.message;
                    notify(msg || 'Không thể thu hồi phiên này', 'error');
                    return;
                }
                reloadSessions = false; // lỗi mạng/khác: giữ nguyên danh sách để thử lại
                notify((err && err.message) || 'Không thu hồi được phiên. Vui lòng thử lại.', 'error');
            })
            .finally(() => {
                setRevoking(false);
                closeRevokeModal();
                if (reloadSessions) loadSessions();
                if (reloadActivity) loadActivity();
            });
    }

    if (sessionList) {
        sessionList.addEventListener('click', e => {
            const btn = e.target.closest('.session-revoke');
            if (btn) openRevokeModal(btn.dataset.sessionId);
        });
    }
    if (revokeModal) {
        btnCancelRevoke.addEventListener('click', closeRevokeModal);
        btnConfirmRevoke.addEventListener('click', confirmRevoke);
        revokeModal.addEventListener('click', e => { if (e.target === revokeModal) closeRevokeModal(); });
        document.addEventListener('keydown', e => {
            if (e.key === 'Escape' && revokeModal.style.display !== 'none') closeRevokeModal();
        });
    }

    // ------------------------------------------------------------
    // Hoạt động gần đây – GET /api/v1/admin/profile/recent-activity (A11, M09 mục 3.4, 5.1)
    // Không query (có → 400). data = mảng ≤ 20 dòng audit_logs có actor_type = 'ADMIN', actor_id = mình,
    // sắp created_at rồi id giảm dần; mỗi phần tử đúng 8 trường, không có actorType/actorId/actorName.
    // ------------------------------------------------------------
    const ACTIVITY_LIMIT = 20;

    // MOCK_AUDIT_LOGS đóng vai các dòng audit_logs (đủ cột tác nhân để minh họa câu WHERE của backend).
    // Gồm cả LOGIN_FAILED do người khác gõ sai mật khẩu (actor_id vẫn là tài khoản bị thử).
    // Dòng id 10360 do Admin khác (actorId 2) đặt lại mật khẩu tài khoản này: KHÔNG được trả.
    const MOCK_AUDIT_LOGS = [
        { id: 10398, actorType: 'ADMIN', actorId: 1, action: 'LISTEN_AUDIO', resourceName: 'AUDIO', resourceId: '5370', ipAddress: '10.0.12.34', userAgent: UA_CHROME, actionDetails: null, createdAt: '2026-10-12T08:31:05+07:00' },
        { id: 10390, actorType: 'ADMIN', actorId: 1, action: 'EXPORT_REPORT', resourceName: 'REPORT', resourceId: null, ipAddress: '10.0.12.34', userAgent: UA_CHROME, actionDetails: { format: 'EXCEL' }, createdAt: '2026-10-12T08:25:40+07:00' },
        { id: 10377, actorType: 'ADMIN', actorId: 1, action: 'LOGIN', resourceName: 'AUTH', resourceId: null, ipAddress: '10.0.12.34', userAgent: UA_CHROME, actionDetails: null, createdAt: '2026-10-12T08:15:00+07:00' },
        { id: 10371, actorType: 'ADMIN', actorId: 1, action: 'LOGIN_FAILED', resourceName: 'AUTH', resourceId: null, ipAddress: '10.0.40.7', userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0', actionDetails: { reason: 'BAD_PASSWORD' }, createdAt: '2026-10-12T07:58:44+07:00' },
        { id: 10360, actorType: 'ADMIN', actorId: 2, action: 'PASSWORD_RESET', resourceName: 'AUTH', resourceId: '1', ipAddress: '10.0.12.9', userAgent: UA_CHROME, actionDetails: null, createdAt: '2026-10-11T17:20:00+07:00' },
        { id: 10331, actorType: 'ADMIN', actorId: 1, action: 'SESSION_REVOKED', resourceName: 'AUTH', resourceId: '7', ipAddress: '10.0.12.34', userAgent: UA_CHROME, actionDetails: { targetActorType: 'ADMIN', revokedCount: 2 }, createdAt: '2026-10-11T16:40:00+07:00' },
        { id: 10322, actorType: 'ADMIN', actorId: 1, action: 'UPDATE_SETTINGS', resourceName: 'SYSTEM', resourceId: null, ipAddress: '10.0.12.34', userAgent: UA_CHROME, actionDetails: { op: 'RELOAD_CACHE' }, createdAt: '2026-10-11T16:02:10+07:00' },
        { id: 10301, actorType: 'ADMIN', actorId: 1, action: 'ACCESS_DENIED', resourceName: 'ADMIN', resourceId: '1', ipAddress: '10.0.12.34', userAgent: UA_CHROME, actionDetails: null, createdAt: '2026-10-11T15:47:33+07:00' },
        { id: 10288, actorType: 'ADMIN', actorId: 1, action: 'ALLOCATE_RANGE', resourceName: 'PREFIX', resourceId: '12', ipAddress: '10.0.12.34', userAgent: UA_CHROME, actionDetails: null, createdAt: '2026-10-11T14:30:00+07:00' },
        { id: 10250, actorType: 'ADMIN', actorId: 1, action: 'LOGOUT', resourceName: 'AUTH', resourceId: '88', ipAddress: '10.0.12.34', userAgent: UA_CHROME, actionDetails: null, createdAt: '2026-10-10T18:05:00+07:00' }
    ];

    // ISO 8601 theo giờ Việt Nam (+07:00) như created_at do backend trả
    function nowVN() {
        const d = new Date(Date.now() + 7 * 3600 * 1000);
        return d.toISOString().slice(0, 19) + '+07:00';
    }

    // Thay cho INSERT audit_logs của các mock khác trên trang (PUT /admin/profile, POST .../avatar)
    function mockWriteAudit(action, resourceName, resourceId, actionDetails) {
        const nextId = MOCK_AUDIT_LOGS.reduce((m, r) => Math.max(m, r.id), 0) + 1;
        MOCK_AUDIT_LOGS.push({
            id: nextId, actorType: 'ADMIN', actorId: MOCK_PROFILE.id, action, resourceName, resourceId,
            ipAddress: '10.0.12.34', userAgent: navigator.userAgent, actionDetails, createdAt: nowVN()
        });
    }

    function mockGetRecentActivity(token, query) {
        return new Promise(resolve => setTimeout(resolve, 400)).then(() => {
            if (!token) {
                return Promise.reject({
                    success: false, statusCode: 401, errorCode: 'UNAUTHORIZED',
                    message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', errors: null, timestamp: now()
                });
            }
            const keys = Object.keys(query || {});
            if (keys.length) {
                const errors = {};
                keys.forEach(k => { errors[k] = ['Tham số không được nhận']; });
                return Promise.reject(validationError(errors));
            }
            // WHERE actor_type = 'ADMIN' AND actor_id = :sub ORDER BY created_at DESC, id DESC LIMIT 20
            const rows = MOCK_AUDIT_LOGS
                .filter(r => r.actorType === 'ADMIN' && r.actorId === MOCK_PROFILE.id)
                .sort((a, b) => (Date.parse(b.createdAt) - Date.parse(a.createdAt)) || (b.id - a.id))
                .slice(0, ACTIVITY_LIMIT)
                .map(r => ({
                    id: r.id, action: r.action, resourceName: r.resourceName, resourceId: r.resourceId,
                    ipAddress: r.ipAddress, userAgent: r.userAgent,
                    actionDetails: r.actionDetails ? JSON.parse(JSON.stringify(r.actionDetails)) : null,
                    createdAt: r.createdAt
                }));
            return {
                success: true, statusCode: 200, message: 'Lấy hoạt động gần đây thành công',
                data: rows, timestamp: now()
            };
        });
    }

    // Nhãn tiếng Việt do frontend ánh xạ (M09 mục 5.1); API chỉ trả mã (R16-07)
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
    const RESOURCE_LABELS = {
        ADMIN: 'quản trị viên', USER: 'người dùng', USER_GROUP: 'nhóm người dùng', ORGANIZATION: 'đơn vị'
    };
    const LOGIN_FAILED_REASONS = {
        BAD_PASSWORD: 'sai mật khẩu', UNKNOWN_USER: 'không có tài khoản', ACCOUNT_LOCKED: 'tài khoản bị khóa',
        TEMPORARILY_LOCKED: 'đang khóa tạm', GROUP_INACTIVE: 'nhóm ngừng hoạt động'
    };
    const WARNING_ACTIONS = ['LOGIN_FAILED', 'ACCESS_DENIED'];

    function activityLabel(row) {
        // Vue: so resourceId với authAdmin.admin.id
        if (row.resourceName === 'ADMIN' && row.action === 'UPDATE' && row.resourceId === String(MOCK_PROFILE.id)) {
            return 'Cập nhật hồ sơ của tôi';
        }
        // Thu hồi mọi phiên của tài khoản khác (A14, N08): actionDetails.targetActorType; tự thu hồi một phiên: actionDetails = null
        if (row.action === 'SESSION_REVOKED' && row.actionDetails && row.actionDetails.targetActorType) {
            return row.actionDetails.targetActorType === 'ADMIN'
                ? 'Thu hồi mọi phiên của quản trị viên' : 'Thu hồi mọi phiên của người dùng';
        }
        if (CRUD_LABELS[row.action] && RESOURCE_LABELS[row.resourceName]) {
            return CRUD_LABELS[row.action] + ' ' + RESOURCE_LABELS[row.resourceName];
        }
        let label = ACTION_LABELS[row.action] || row.action; // mã chưa có nhãn: hiện nguyên mã
        if (row.action === 'LOGIN_FAILED' && row.actionDetails && row.actionDetails.reason) {
            label += ' (' + (LOGIN_FAILED_REASONS[row.actionDetails.reason] || row.actionDetails.reason) + ')';
        }
        return label;
    }

    const activityState = document.getElementById('activityState');
    const activityMessage = document.getElementById('activityMessage');
    const btnRetryActivity = document.getElementById('btnRetryActivity');
    const activityList = document.getElementById('activityList');

    function setActivityState(state, message) {
        if (activityState) {
            activityState.hidden = state === 'ready';
            activityState.classList.toggle('is-error', state === 'error');
        }
        if (activityMessage && message) activityMessage.textContent = message;
        if (btnRetryActivity) btnRetryActivity.hidden = state !== 'error';
        if (activityList) activityList.hidden = state !== 'ready';
    }

    // Dựng bằng textContent (không innerHTML): userAgent, resourceId là dữ liệu do client gửi lên
    function renderActivity(rows) {
        if (!activityList) return;
        activityList.replaceChildren();
        rows.forEach(row => {
            const li = document.createElement('li');
            li.className = 'activity-item' + (WARNING_ACTIONS.includes(row.action) ? ' activity-item--warning' : '');
            if (row.userAgent) li.title = row.userAgent;
            const body = document.createElement('div');
            const label = document.createElement('p');
            label.className = 'activity-label';
            label.textContent = activityLabel(row);
            body.appendChild(label);
            const metaText = [
                row.resourceId ? 'Mã đối tượng: ' + row.resourceId : null,
                row.ipAddress ? 'IP: ' + row.ipAddress : null
            ].filter(Boolean).join(' · ');
            if (metaText) {
                const meta = document.createElement('p');
                meta.className = 'activity-meta';
                meta.textContent = metaText;
                body.appendChild(meta);
            }
            const time = document.createElement('time');
            time.className = 'activity-time';
            time.dateTime = row.createdAt;
            time.textContent = formatValue(row.createdAt, 'datetime');
            li.appendChild(body);
            li.appendChild(time);
            activityList.appendChild(li);
        });
    }

    function loadActivity() {
        setActivityState('loading', 'Đang tải hoạt động...');
        return callApi(token => mockGetRecentActivity(token))
            .then(res => {
                if (!res.data.length) { setActivityState('empty', 'Chưa có hoạt động nào'); return; }
                renderActivity(res.data);
                setActivityState('ready');
            })
            .catch(err => {
                // 401 sau khi refresh thất bại: request() đã chuyển về login.
                if (err && err.statusCode === 401) return;
                setActivityState('error', (err && err.message) || 'Không tải được hoạt động gần đây. Vui lòng thử lại.');
            });
    }

    if (btnRetryActivity) btnRetryActivity.addEventListener('click', loadActivity);

    loadProfile();
    loadSessions();
    loadActivity();
});
