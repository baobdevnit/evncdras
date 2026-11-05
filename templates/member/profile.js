// Hồ sơ của tôi (UserProfileView) – docs/modules/08_user_profile.md mục 3.1, 3.2, 5.1.
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

    let mockProfileRow = null; // giả lập dòng users (+ nhóm, đơn vị) giữa các lần GET/PUT
    function currentMockProfile() {
        if (!mockProfileRow) mockProfileRow = buildMockProfile();
        return Object.assign({}, mockProfileRow);
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
            return { success: true, statusCode: 200, message: 'Lấy hồ sơ thành công', data: currentMockProfile(), timestamp: now() };
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
        if (options && options.keepForm) updateFullNamePreview();
        else fillForm(data);
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

    // ------------------------------------------------------------
    // Ảnh đại diện – POST /api/v1/profile/avatar (U08, M08 mục 3.3; đặc tả chung M09 mục 3.2.1)
    // multipart/form-data đúng một phần "file" (≤ 2 MB, PNG/JPEG). Backend cắt 256×256, bỏ metadata,
    // lưu /media/avatars/<uuid>.<png|jpg> (Nginx phục vụ), trả data = hồ sơ đủ 15 trường như GET.
    // Thứ tự: guard (401/403) → bảo trì (503, trước khi phân tích multipart, không ghi file)
    // → query, multipart (400) → xử lý ảnh, ghi file → khóa dòng users, kiểm tra tài khoản (401, xóa file vừa ghi)
    // → UPDATE avatar_url + audit USER / UPDATE { changedFields: ["avatarUrl"] } (luôn ghi) → xóa file cũ.
    // Mock: ?maintenance=1 (503), ?account=locked (401 → về login), ?avatarError=1 (lỗi mạng ở lần tải đầu).
    // ------------------------------------------------------------
    const AVATAR_MAX_BYTES = 2 * 1024 * 1024;
    const AVATAR_TYPES = ['image/png', 'image/jpeg'];
    const btnChangeAvatar = document.getElementById('btnChangeAvatar');
    const avatarInput = document.getElementById('avatar-input');
    const avatarWrapper = document.querySelector('.profile-avatar-wrapper');
    let mockAvatarNetworkError = params.get('avatarError') === '1';

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

    // Giả lập backend POST /api/v1/profile/avatar. Bản mock dùng object URL thay cho /media/avatars/
    // vì trang tĩnh không có Nginx; backend thật trả đường dẫn tương đối.
    function mockPostUserAvatar(token, formData, query) {
        return new Promise(resolve => setTimeout(resolve, 700)).then(() => {
            if (mockAvatarNetworkError) { mockAvatarNetworkError = false; return Promise.reject(new Error('Network Error')); }
            if (!token || MOCK_ACCOUNT_LOCKED) return fail(401, 'UNAUTHORIZED', 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
            if (MOCK_MAINTENANCE) return fail(503, 'MAINTENANCE', 'Hệ thống đang bảo trì, vui lòng quay lại sau');
            if (query && Object.keys(query).length) {
                return Promise.reject(validationError({ query: ['API không nhận tham số truy vấn'] }));
            }
            if (!(formData instanceof FormData)) {
                return Promise.reject(validationError({ file: ['Cần gửi multipart/form-data có phần "file"'] }));
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
            const row = currentMockProfile();
            row.avatarUrl = URL.createObjectURL(files[0]); // backend thật: storedPath
            mockProfileRow = row;
            console.info('[mock] lưu ảnh', storedPath, '| audit_logs USER / UPDATE', {
                resourceId: String(row.id), actorName: row.fullName, actionDetails: { changedFields: ['avatarUrl'] }
            });
            return {
                success: true, statusCode: 200, message: 'Cập nhật ảnh đại diện thành công',
                data: currentMockProfile(), timestamp: now()
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
            if (!file || !profile || (btnChangeAvatar && btnChangeAvatar.disabled)) return;
            const clientErrors = checkAvatarFile(file);
            if (clientErrors) { notify(clientErrors.file.join(' '), 'error'); return; }

            // Không tự đặt Content-Type: trình duyệt thêm boundary. FormData dùng lại được khi request() gửi lại sau refresh.
            // Không hiện ảnh xem trước cục bộ như đã lưu: ảnh chỉ đổi khi API trả 200.
            const formData = new FormData();
            formData.append('file', file);
            setAvatarUploading(true);
            callApi(token => mockPostUserAvatar(token, formData))
                .then(res => {
                    profile = res.data;
                    // Chỉ vẽ lại phần hiển thị, không điền lại form "Thông tin cá nhân" đang sửa dở
                    renderProfile(profile, { keepForm: true });
                    // Header MemberLayout đổi ảnh ngay (Vue: cập nhật authUser.user.avatarUrl, không gọi /auth/me)
                    if (window.memberSession && window.memberSession.updateAccount) {
                        window.memberSession.updateAccount({ avatarUrl: profile.avatarUrl });
                    }
                    notify(res.message || 'Cập nhật ảnh đại diện thành công', 'success');
                })
                .catch(err => {
                    // 401 sau khi refresh thất bại: request() đã chuyển về login.
                    if (err && err.statusCode === 401) return;
                    if (err && err.errorCode === 'VALIDATION_ERROR' && err.errors) {
                        const msgs = Object.keys(err.errors).map(k => [].concat(err.errors[k]).join(' '));
                        notify(msgs.join(' '), 'error');
                        return;
                    }
                    // 503: request() đã hiện biểu ngữ bảo trì; ảnh cũ giữ nguyên.
                    const type = err && err.statusCode === 503 ? 'warning' : 'error';
                    notify((err && err.statusCode && err.message) || 'Không tải được ảnh lên. Vui lòng thử lại.', type);
                })
                .finally(() => setAvatarUploading(false));
        });
    }

    // ------------------------------------------------------------
    // Lưu – PUT /api/v1/profile (U06, M08 mục 3.2)
    // Thứ tự: guard (401/403) → bảo trì (503) → query, body (400) → khóa dòng users, kiểm tra tài khoản (401)
    // → so trường → UPDATE + audit (chỉ khi có trường đổi). 200 data = đúng 15 trường như GET.
    // Mock: ?maintenance=1 (503), ?account=locked (401 → về login), ?saveError=1 (lỗi mạng ở lần lưu đầu).
    // ------------------------------------------------------------
    const PHONE_PATTERN = /^(?=.*[0-9])[0-9+\-.() ]{1,30}$/; // 02 mục 2 "Số điện thoại liên hệ"
    const ALLOWED_FIELDS = ['fullName', 'phoneNumber'];
    let mockSaveNetworkError = params.get('saveError') === '1';

    function validationError(errors) {
        return {
            success: false, statusCode: 400, errorCode: 'VALIDATION_ERROR',
            message: 'Dữ liệu không hợp lệ', errors: errors, timestamp: now()
        };
    }

    // Quy tắc body dùng chung cho kiểm tra ở client và mock backend (giống bản Admin M09 mục 3.2).
    // Trả { body: giá trị đã chuẩn hóa, errors: null | { field: [..] } }.
    function normalizeProfileBody(raw) {
        const errors = {};
        const body = {};
        const keys = Object.keys(raw || {});
        if (keys.length === 0) {
            const msg = ['Cần gửi ít nhất một trường'];
            return { body, errors: { fullName: msg, phoneNumber: msg } };
        }
        // username, email, jobTitle, roleCode, userGroupId, avatarUrl, status… → 400 theo tên trường
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

    // Giả lập backend PUT /api/v1/profile. changedFields rỗng → không UPDATE, không ghi audit_logs;
    // ngược lại ghi USER / UPDATE { changedFields } (resource_id = id người gọi, actor_name = tên mới; in ra console).
    function mockPutUserProfile(token, rawBody, query) {
        return new Promise(resolve => setTimeout(resolve, 500)).then(() => {
            if (mockSaveNetworkError) { mockSaveNetworkError = false; return Promise.reject(new Error('Network Error')); }
            if (!token || MOCK_ACCOUNT_LOCKED) return fail(401, 'UNAUTHORIZED', 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
            if (MOCK_MAINTENANCE) return fail(503, 'MAINTENANCE', 'Hệ thống đang bảo trì, vui lòng quay lại sau');
            if (query && Object.keys(query).length) {
                return Promise.reject(validationError({ query: ['API không nhận tham số truy vấn'] }));
            }
            const checked = normalizeProfileBody(rawBody);
            if (checked.errors) return Promise.reject(validationError(checked.errors));
            const row = currentMockProfile();
            const changedFields = ALLOWED_FIELDS.filter(k => k in checked.body && checked.body[k] !== row[k]);
            if (changedFields.length) {
                changedFields.forEach(k => { row[k] = checked.body[k]; });
                mockProfileRow = row;
                console.info('[mock] audit_logs USER / UPDATE', {
                    resourceId: String(row.id), actorName: row.fullName, actionDetails: { changedFields: changedFields }
                });
            }
            return {
                success: true, statusCode: 200, message: 'Cập nhật hồ sơ thành công',
                data: currentMockProfile(), timestamp: now()
            };
        });
    }

    const btnResetInfo = document.getElementById('btnResetInfo');
    const formGeneralInfo = document.getElementById('formGeneralInfo');
    const btnSubmitInfo = document.getElementById('btnSubmitInfo');

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

    const SAVING_HTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> Đang lưu...';

    if (formGeneralInfo && btnSubmitInfo) {
        formGeneralInfo.addEventListener('submit', function(e) {
            e.preventDefault();
            if (!profile || btnSubmitInfo.disabled) return;
            // Body chỉ gồm fullName, phoneNumber (ô trống → null); kiểm tra trước cùng quy tắc với backend
            const checked = normalizeProfileBody({
                fullName: fullNameInput.value,
                phoneNumber: phoneInput.value.trim() || null
            });
            if (checked.errors) { showFieldErrors(checked.errors); return; }

            const originalHtml = btnSubmitInfo.innerHTML;
            btnSubmitInfo.disabled = true;
            btnSubmitInfo.innerHTML = SAVING_HTML;

            callApi(token => mockPutUserProfile(token, checked.body))
                .then(res => {
                    profile = res.data;
                    clearFieldErrors();
                    renderProfile(profile);
                    // Header MemberLayout đổi tên ngay (Vue: cập nhật authUser.user, không gọi /auth/me)
                    if (window.memberSession && window.memberSession.updateAccount) {
                        window.memberSession.updateAccount({ fullName: profile.fullName });
                    }
                    notify(res.message || 'Cập nhật hồ sơ thành công', 'success');
                })
                .catch(err => {
                    // 401 sau khi refresh thất bại: request() đã chuyển về login.
                    if (err && err.statusCode === 401) return;
                    if (err && err.errorCode === 'VALIDATION_ERROR') {
                        const rest = showFieldErrors(err.errors);
                        if (rest.length) notify(rest.join(' '), 'error');
                        return;
                    }
                    // 503: request() đã hiện biểu ngữ bảo trì; giữ nguyên giá trị đang nhập.
                    const type = err && err.statusCode === 503 ? 'warning' : 'error';
                    notify((err && err.statusCode && err.message) || 'Không lưu được hồ sơ. Vui lòng thử lại.', type);
                })
                .finally(() => {
                    btnSubmitInfo.disabled = false;
                    btnSubmitInfo.innerHTML = originalHtml;
                });
        });
    }

    // ------------------------------------------------------------
    // Phiên đăng nhập của tôi – GET /api/v1/auth/sessions (U09, M08 mục 3.6.1; đặc tả chung M09 mục 3.5.1)
    // Thứ tự: guard (401/403) → bảo trì (503) → query (400) → đọc users + user_groups, kiểm tra tài khoản (401)
    // → phiên hiện tại theo claim sid (đi chuỗi ROTATED, không theo cookie) → các phiên còn hiệu lực của chính mình.
    // 200: data = mảng, mỗi phần tử đúng 7 trường, phiên hiện tại đứng đầu; chỉ đọc, không audit, không đổi last_used_at.
    // Mock: ?maintenance=1 (503), ?account=locked (401 → về login), ?sessionsError=1 (lỗi mạng ở lần tải đầu).
    // ------------------------------------------------------------
    const UA_CHROME = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Safari/537.36';
    const UA_ANDROID = 'Mozilla/5.0 (Linux; Android 14; SM-A546E) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0 Mobile Safari/537.36';
    const UA_FIREFOX_WIN = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0';
    const MOCK_USER_ID = 10; // sub của Access Token (cùng id hồ sơ mẫu)

    // MOCK_AUTH_SESSIONS đóng vai các dòng auth_sessions (đủ cột để minh họa WHERE và chuỗi xoay vòng).
    // 5101 → 5120: phiên của trình duyệt này đã xoay vòng lúc 09:42 (logged_in_at chép nguyên).
    const MOCK_AUTH_SESSIONS = [
        { id: 5101, actorType: 'USER', actorId: 10, ipAddress: '10.0.21.15', userAgent: UA_CHROME, loggedInAt: '2026-11-05T08:15:00+07:00', createdAt: '2026-11-05T08:15:00+07:00', lastUsedAt: null, expiresAt: '2026-11-12T08:15:00+07:00', revokedAt: '2026-11-05T09:42:10+07:00', revokedReason: 'ROTATED', replacedBySessionId: 5120 },
        { id: 5120, actorType: 'USER', actorId: 10, ipAddress: '10.0.21.15', userAgent: UA_CHROME, loggedInAt: '2026-11-05T08:15:00+07:00', createdAt: '2026-11-05T09:42:10+07:00', lastUsedAt: '2026-11-05T09:42:10+07:00', expiresAt: '2026-11-12T08:15:00+07:00', revokedAt: null, revokedReason: null, replacedBySessionId: null },
        { id: 5088, actorType: 'USER', actorId: 10, ipAddress: '10.0.88.4', userAgent: UA_ANDROID, loggedInAt: '2026-11-04T07:50:00+07:00', createdAt: '2026-11-04T16:05:30+07:00', lastUsedAt: '2026-11-04T16:05:30+07:00', expiresAt: '2026-11-11T07:50:00+07:00', revokedAt: null, revokedReason: null, replacedBySessionId: null },
        { id: 5040, actorType: 'USER', actorId: 10, ipAddress: null, userAgent: null, loggedInAt: '2026-11-05T07:20:00+07:00', createdAt: '2026-11-05T07:20:00+07:00', lastUsedAt: null, expiresAt: '2026-11-06T07:20:00+07:00', revokedAt: null, revokedReason: null, replacedBySessionId: null },
        // Không được trả: đã thu hồi, đã hết hạn, của user khác, của Admin trùng id số (khác actor_type)
        { id: 5002, actorType: 'USER', actorId: 10, ipAddress: '10.0.21.15', userAgent: UA_FIREFOX_WIN, loggedInAt: '2026-11-02T09:00:00+07:00', createdAt: '2026-11-02T09:00:00+07:00', lastUsedAt: null, expiresAt: '2026-11-09T09:00:00+07:00', revokedAt: '2026-11-02T17:30:00+07:00', revokedReason: 'LOGOUT', replacedBySessionId: null },
        { id: 4600, actorType: 'USER', actorId: 10, ipAddress: '10.0.21.15', userAgent: UA_CHROME, loggedInAt: '2026-10-20T08:00:00+07:00', createdAt: '2026-10-20T08:00:00+07:00', lastUsedAt: null, expiresAt: '2026-10-27T08:00:00+07:00', revokedAt: null, revokedReason: null, replacedBySessionId: null },
        { id: 5110, actorType: 'USER', actorId: 11, ipAddress: '10.0.21.40', userAgent: UA_CHROME, loggedInAt: '2026-11-05T09:10:00+07:00', createdAt: '2026-11-05T09:10:00+07:00', lastUsedAt: null, expiresAt: '2026-11-12T09:10:00+07:00', revokedAt: null, revokedReason: null, replacedBySessionId: null },
        { id: 5115, actorType: 'ADMIN', actorId: 10, ipAddress: '10.0.12.34', userAgent: UA_CHROME, loggedInAt: '2026-11-05T09:20:00+07:00', createdAt: '2026-11-05T09:20:00+07:00', lastUsedAt: null, expiresAt: '2026-11-12T09:20:00+07:00', revokedAt: null, revokedReason: null, replacedBySessionId: null }
    ];
    // Claim sid của Access Token tab này: còn trỏ 5101 vì tab khác vừa refresh (minh họa đi theo chuỗi).
    const MOCK_TOKEN_SID = 5101;
    const MOCK_NOW = Date.parse('2026-11-05T09:45:00+07:00'); // thay cho NOW() để dữ liệu mẫu ổn định
    let mockSessionsNetworkError = params.get('sessionsError') === '1';

    function isLiveSession(row) {
        return row.revokedAt === null && Date.parse(row.expiresAt) > MOCK_NOW;
    }

    // WHERE id = ? AND actor_type = 'USER' AND actor_id = :sub (khóa chính)
    function findOwnSession(id, actorId) {
        return MOCK_AUTH_SESSIONS.find(r => r.id === id && r.actorType === 'USER' && r.actorId === actorId) || null;
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

    // Phiên hiện tại: id = sid của chính mình, đi theo chuỗi xoay vòng (M08 mục 3.6, M09 mục 3.5)
    function resolveCurrentSessionId(sid, actorId) {
        const row = followSessionChain(findOwnSession(sid, actorId), actorId);
        return row ? row.id : null;
    }

    function mockGetMySessions(token, query) {
        return new Promise(resolve => setTimeout(resolve, 350)).then(() => {
            if (mockSessionsNetworkError) { mockSessionsNetworkError = false; return Promise.reject(new Error('Network Error')); }
            if (!token || MOCK_ACCOUNT_LOCKED) return fail(401, 'UNAUTHORIZED', 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
            if (MOCK_MAINTENANCE) return fail(503, 'MAINTENANCE', 'Hệ thống đang bảo trì, vui lòng quay lại sau');
            if (query && Object.keys(query).length) {
                return Promise.reject(validationError({ query: ['API không nhận tham số truy vấn'] }));
            }
            const currentId = resolveCurrentSessionId(MOCK_TOKEN_SID, MOCK_USER_ID);
            const lastActive = r => r.lastUsedAt || r.createdAt; // COALESCE(last_used_at, created_at)
            const rows = MOCK_AUTH_SESSIONS
                .filter(r => r.actorType === 'USER' && r.actorId === MOCK_USER_ID && isLiveSession(r))
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

    // Rút tên trình duyệt + hệ điều hành từ userAgent (hàm nội bộ, giống admin/profile.js; API không trả tên ghép sẵn).
    // Thứ tự kiểm tra quan trọng: Edge/Opera chứa "Chrome", Chrome chứa "Safari", Android chứa "Linux".
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

    // Dựng bằng textContent: userAgent, ipAddress do client gửi lên
    function renderSessions(rows) {
        if (!sessionList) return;
        sessionList.replaceChildren();
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
            li.appendChild(body);
            li.appendChild(side);
            sessionList.appendChild(li);
        });
    }

    // Tải độc lập với hồ sơ: lỗi khối này không ẩn #profileLayout và ngược lại.
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
                // 503: request() đã hiện biểu ngữ bảo trì; khối vẫn hiện thông điệp + nút thử lại.
                setSessionsState('error', (err && err.statusCode && err.message) || 'Không tải được phiên đăng nhập. Vui lòng thử lại.');
            });
    }

    if (btnRetrySessions) btnRetrySessions.addEventListener('click', loadSessions);

    loadProfile();
    loadSessions();
});
