// Hồ sơ của tôi (AdminProfileView) – docs/modules/09_admin_profile.md mục 3.1, 3.2, 3.2.1, 3.4, 5.1.
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
                    renderProfile(profile);
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
    // Hoạt động gần đây – GET /api/v1/admin/profile/recent-activity (A11, M09 mục 3.4, 5.1)
    // Không query (có → 400). data = mảng ≤ 20 dòng audit_logs có actor_type = 'ADMIN', actor_id = mình,
    // sắp created_at rồi id giảm dần; mỗi phần tử đúng 8 trường, không có actorType/actorId/actorName.
    // ------------------------------------------------------------
    const ACTIVITY_LIMIT = 20;
    const UA_CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';

    // MOCK_AUDIT_LOGS đóng vai các dòng audit_logs (đủ cột tác nhân để minh họa câu WHERE của backend).
    // Gồm cả LOGIN_FAILED do người khác gõ sai mật khẩu (actor_id vẫn là tài khoản bị thử).
    // Dòng id 10360 do Admin khác (actorId 2) đặt lại mật khẩu tài khoản này: KHÔNG được trả.
    const MOCK_AUDIT_LOGS = [
        { id: 10398, actorType: 'ADMIN', actorId: 1, action: 'LISTEN_AUDIO', resourceName: 'AUDIO', resourceId: '5370', ipAddress: '10.0.12.34', userAgent: UA_CHROME, actionDetails: null, createdAt: '2026-10-12T08:31:05+07:00' },
        { id: 10390, actorType: 'ADMIN', actorId: 1, action: 'EXPORT_REPORT', resourceName: 'REPORT', resourceId: null, ipAddress: '10.0.12.34', userAgent: UA_CHROME, actionDetails: { format: 'EXCEL' }, createdAt: '2026-10-12T08:25:40+07:00' },
        { id: 10377, actorType: 'ADMIN', actorId: 1, action: 'LOGIN', resourceName: 'AUTH', resourceId: null, ipAddress: '10.0.12.34', userAgent: UA_CHROME, actionDetails: null, createdAt: '2026-10-12T08:15:00+07:00' },
        { id: 10371, actorType: 'ADMIN', actorId: 1, action: 'LOGIN_FAILED', resourceName: 'AUTH', resourceId: null, ipAddress: '10.0.40.7', userAgent: 'Mozilla/5.0 (X11; Linux x86_64; rv:131.0) Gecko/20100101 Firefox/131.0', actionDetails: { reason: 'BAD_PASSWORD' }, createdAt: '2026-10-12T07:58:44+07:00' },
        { id: 10360, actorType: 'ADMIN', actorId: 2, action: 'PASSWORD_RESET', resourceName: 'AUTH', resourceId: '1', ipAddress: '10.0.12.9', userAgent: UA_CHROME, actionDetails: null, createdAt: '2026-10-11T17:20:00+07:00' },
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
        EXPORT_CDR: 'Xuất CDR', EXPORT_REPORT: 'Xuất báo cáo',
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
        BAD_PASSWORD: 'sai mật khẩu', ACCOUNT_LOCKED: 'tài khoản bị khóa', TEMPORARILY_LOCKED: 'đang khóa tạm'
    };
    const WARNING_ACTIONS = ['LOGIN_FAILED', 'ACCESS_DENIED'];

    function activityLabel(row) {
        // Vue: so resourceId với authAdmin.admin.id
        if (row.resourceName === 'ADMIN' && row.action === 'UPDATE' && row.resourceId === String(MOCK_PROFILE.id)) {
            return 'Cập nhật hồ sơ của tôi';
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
    loadActivity();
});
