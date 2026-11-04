// ChangePasswordView – PUT /api/v1/admin/profile/change-password (A07, docs/modules/09_admin_profile.md mục 3.3, mục 5).
// - Hai chế độ: thường (trong AdminLayout) và bị buộc đổi (store giữ token PASSWORD_CHANGE_ONLY;
//   mẫu tĩnh dùng ?forced=1, login.js chuyển tới khi mustChangePassword).
// - Body đúng 3 trường currentPassword, newPassword, confirmPassword; không cắt khoảng trắng.
// - Thành công 200 data = { accessToken, expiresIn } (+ Set-Cookie phiên mới): lưu token vào store
//   (adminSession.setAccessToken); bị buộc đổi → dashboard, thường → ở lại trang + toast.
// - 400 VALIDATION_ERROR: errors[field] dưới ô; 423 ACCOUNT_TEMPORARILY_LOCKED: hộp lỗi chung (errors.lockedUntil).
document.addEventListener('DOMContentLoaded', function() {
    const now = () => new Date().toISOString();
    const session = window.adminSession;

    function notify(message, type = 'success') {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        } else {
            alert(message);
        }
    }

    // ------------------------------------------------------------
    // Chế độ hiển thị
    // ------------------------------------------------------------
    const forced = new URLSearchParams(window.location.search).get('forced') === '1';
    document.body.classList.toggle('forced-mode', forced);
    const forcedBanner = document.getElementById('forcedBanner');
    const btnForcedLogout = document.getElementById('btnForcedLogout');
    if (forcedBanner) forcedBanner.hidden = !forced;
    if (btnForcedLogout) {
        btnForcedLogout.hidden = !forced;
        btnForcedLogout.addEventListener('click', function() {
            this.disabled = true;
            if (session) session.logout();
        });
    }

    // Thẻ tài khoản: fullName, roleName, email từ store (Vue: authAdmin.admin).
    const account = session && session.getAccount ? session.getAccount() : null;
    if (account) {
        document.querySelectorAll('[data-account]').forEach(el => {
            const v = account[el.dataset.account];
            el.textContent = v == null ? '' : v;
        });
    }

    // ------------------------------------------------------------
    // Chính sách mật khẩu (docs/01_database_schema.md mục 6.1)
    // ------------------------------------------------------------
    const MIN_LENGTH = 10;   // mặc định security_password_min_length; backend là nơi quyết định
    const MAX_BYTES = 72;    // giới hạn bcrypt, đếm theo byte UTF-8
    const byteLength = s => new TextEncoder().encode(s).length;

    function categories(pwd) {
        return {
            upper: /[A-Z]/.test(pwd),
            lower: /[a-z]/.test(pwd),
            number: /[0-9]/.test(pwd),
            symbol: /[^A-Za-z0-9]/.test(pwd)
        };
    }
    const countCategories = c => [c.upper, c.lower, c.number, c.symbol].filter(Boolean).length;

    // Trả { field: [thông điệp] } hoặc null; cùng quy tắc với bảng body ở M09 mục 3.3.
    function validate(body) {
        const errors = {};
        const allowed = ['currentPassword', 'newPassword', 'confirmPassword'];
        Object.keys(body).filter(k => !allowed.includes(k))
            .forEach(k => { errors[k] = ['Trường không được nhận']; });
        allowed.forEach(k => {
            if (typeof body[k] !== 'string' || body[k] === '') errors[k] = ['Trường bắt buộc'];
        });
        if (!errors.currentPassword && body.currentPassword.length > 255) {
            errors.currentPassword = ['Mật khẩu hiện tại tối đa 255 ký tự'];
        }
        if (!errors.newPassword) {
            const pwd = body.newPassword;
            if (pwd.length < MIN_LENGTH) errors.newPassword = ['Mật khẩu phải từ ' + MIN_LENGTH + ' ký tự trở lên'];
            else if (byteLength(pwd) > MAX_BYTES) errors.newPassword = ['Mật khẩu tối đa ' + MAX_BYTES + ' byte'];
            else if (countCategories(categories(pwd)) < 3) errors.newPassword = ['Mật khẩu phải có ít nhất 3 trong 4 loại: chữ hoa, chữ thường, chữ số, ký tự đặc biệt'];
            else if (pwd === body.currentPassword) errors.newPassword = ['Mật khẩu mới phải khác mật khẩu hiện tại'];
        }
        if (!errors.confirmPassword && !errors.newPassword && body.confirmPassword !== body.newPassword) {
            errors.confirmPassword = ['Mật khẩu xác nhận không khớp'];
        }
        return Object.keys(errors).length ? errors : null;
    }

    // ------------------------------------------------------------
    // Giả lập backend PUT /api/v1/admin/profile/change-password
    // ------------------------------------------------------------
    // Mật khẩu hiện tại mẫu: "OldPassword123@". Sai thì 400 errors.currentPassword và tăng bộ đếm;
    // sai đủ 5 lần thì đặt khóa tạm 15 phút, lần gọi kế tiếp trả 423.
    const MOCK_CURRENT_PASSWORD = 'OldPassword123@';
    const MOCK_MAX_FAILED = 5;
    const MOCK_LOCKOUT_MINUTES = 15;
    let mockFailedCount = 0;
    let mockLockedUntil = null;

    function mockChangePassword(token, body) {
        return new Promise(resolve => setTimeout(resolve, 600)).then(() => {
            // Mẫu tĩnh không có token thật nên không giả lập 401; Vue: guard trả 401 khi token thiếu/hết hạn.
            const errors = validate(body);
            if (errors) {
                return Promise.reject({
                    success: false, statusCode: 400, errorCode: 'VALIDATION_ERROR',
                    message: 'Dữ liệu không hợp lệ', errors: errors, timestamp: now()
                });
            }
            if (mockLockedUntil && mockLockedUntil > new Date()) {
                return Promise.reject({
                    success: false, statusCode: 423, errorCode: 'ACCOUNT_TEMPORARILY_LOCKED',
                    message: 'Tài khoản đang bị khóa tạm do nhập sai mật khẩu nhiều lần',
                    errors: { lockedUntil: mockLockedUntil.toISOString() }, timestamp: now()
                });
            }
            if (body.currentPassword !== MOCK_CURRENT_PASSWORD) {
                mockFailedCount += 1;
                if (mockFailedCount >= MOCK_MAX_FAILED) {
                    mockLockedUntil = new Date(Date.now() + MOCK_LOCKOUT_MINUTES * 60000);
                    mockFailedCount = 0;
                }
                return Promise.reject({
                    success: false, statusCode: 400, errorCode: 'VALIDATION_ERROR',
                    message: 'Dữ liệu không hợp lệ',
                    errors: { currentPassword: ['Mật khẩu hiện tại không đúng'] }, timestamp: now()
                });
            }
            mockFailedCount = 0;
            return {
                success: true, statusCode: 200, message: 'Đổi mật khẩu thành công',
                data: { accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.mock-after-password-change', expiresIn: 900 },
                timestamp: now()
            };
        });
    }

    // Gọi qua API client của cổng (401 → refresh một lần rồi gửi lại).
    function callApi(body) {
        const fn = token => mockChangePassword(token, body);
        return session ? session.request(fn) : fn('mock-token');
    }

    // ------------------------------------------------------------
    // Giao diện
    // ------------------------------------------------------------
    const form = document.getElementById('formSecurity');
    const currentPasswordInput = document.getElementById('currentPassword');
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const formAlert = document.getElementById('formAlert');
    const btnSubmit = document.getElementById('btnSubmitPassword');

    // Ẩn/hiện mật khẩu
    document.querySelectorAll('.btn-toggle-password').forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.previousElementSibling;
            if (!input) return;
            const show = input.type === 'password';
            input.type = show ? 'text' : 'password';
            this.innerHTML = show
                ? '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>'
                : '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>';
        });
    });

    // Danh sách yêu cầu & thước đo độ mạnh
    const req = id => document.getElementById(id);
    const strengthContainer = document.getElementById('passwordStrengthContainer');
    const strengthLabel = document.getElementById('passwordStrengthLabel');
    const strengthSegs = [1, 2, 3, 4].map(i => document.getElementById('strengthSeg' + i));
    const STRENGTH = [
        ['Chưa nhập', ''], ['Yếu', 'strength-weak'], ['Trung bình', 'strength-medium'],
        ['Mạnh', 'strength-strong'], ['Rất mạnh', 'strength-very-strong']
    ];

    function updateRequirements() {
        const pwd = newPasswordInput ? newPasswordInput.value : '';
        const cur = currentPasswordInput ? currentPasswordInput.value : '';
        const c = categories(pwd);
        const lengthOk = pwd.length >= MIN_LENGTH && byteLength(pwd) <= MAX_BYTES;
        const catOk = countCategories(c) >= 3;
        const toggle = (id, on) => { const el = req(id); if (el) el.classList.toggle('met', !!pwd && on); };
        toggle('reqMinLength', lengthOk);
        toggle('reqCategories', catOk);
        toggle('reqUpper', c.upper);
        toggle('reqLower', c.lower);
        toggle('reqNumber', c.number);
        toggle('reqSymbol', c.symbol);
        toggle('reqDifferent', pwd !== cur);

        if (strengthContainer) strengthContainer.style.display = pwd ? 'block' : 'none';
        // Chưa đủ độ dài: luôn "Yếu"; đủ độ dài: theo số loại ký tự (đạt chính sách từ "Mạnh").
        const score = pwd ? (lengthOk ? Math.max(1, countCategories(c)) : 1) : 0;
        const [label, cls] = STRENGTH[score];
        if (strengthLabel) strengthLabel.textContent = label;
        strengthSegs.forEach((seg, i) => {
            if (!seg) return;
            seg.className = 'strength-segment';
            if (cls && score >= i + 1) seg.classList.add(cls);
        });
        updateConfirmHint();
    }

    const confirmMatchHint = document.getElementById('confirmMatchHint');
    const confirmMatchText = document.getElementById('confirmMatchText');
    function updateConfirmHint() {
        if (!confirmPasswordInput || !newPasswordInput || !confirmMatchHint || !confirmMatchText) return;
        const v = confirmPasswordInput.value;
        if (!v) { confirmMatchHint.style.display = 'none'; return; }
        const ok = v === newPasswordInput.value;
        confirmMatchHint.style.display = 'flex';
        confirmMatchHint.className = 'confirm-match-hint ' + (ok ? 'match' : 'mismatch');
        confirmMatchText.textContent = ok ? '✓ Mật khẩu xác nhận trùng khớp' : '✗ Mật khẩu xác nhận chưa trùng khớp';
    }

    // Lỗi theo trường (400) và hộp lỗi chung (423)
    function clearErrors(field) {
        if (!form) return;
        form.querySelectorAll('[data-error-for]').forEach(slot => {
            if (field && slot.dataset.errorFor !== field) return;
            slot.hidden = true;
            slot.textContent = '';
            const input = document.getElementById(slot.dataset.errorFor);
            if (input) input.classList.remove('is-invalid');
        });
        if (!field && formAlert) { formAlert.hidden = true; formAlert.textContent = ''; }
    }

    function showFieldErrors(errors) {
        const unmatched = [];
        clearErrors();
        Object.keys(errors || {}).forEach(field => {
            const slot = form && form.querySelector('[data-error-for="' + field + '"]');
            const msg = [].concat(errors[field]).join(' ');
            if (!slot) { unmatched.push(msg); return; }
            slot.textContent = msg;
            slot.hidden = false;
            const input = document.getElementById(field);
            if (input) input.classList.add('is-invalid');
        });
        return unmatched;
    }

    function showAlert(message) {
        if (!formAlert) { notify(message, 'error'); return; }
        formAlert.textContent = message;
        formAlert.hidden = false;
    }

    [currentPasswordInput, newPasswordInput, confirmPasswordInput].forEach(input => {
        if (!input) return;
        input.addEventListener('input', () => { clearErrors(input.id); updateRequirements(); });
    });

    function setSubmitting(on) {
        if (!btnSubmit) return;
        btnSubmit.disabled = on;
        const label = btnSubmit.querySelector('.btn-label');
        if (label) label.textContent = on ? 'Đang cập nhật...' : 'Cập nhật mật khẩu';
    }

    if (form) {
        form.addEventListener('submit', function(e) {
            e.preventDefault();
            if (btnSubmit && btnSubmit.disabled) return;

            const body = {
                currentPassword: currentPasswordInput ? currentPasswordInput.value : '',
                newPassword: newPasswordInput ? newPasswordInput.value : '',
                confirmPassword: confirmPasswordInput ? confirmPasswordInput.value : ''
            };
            const errors = validate(body);
            if (errors) { showFieldErrors(errors); return; }

            clearErrors();
            setSubmitting(true);
            callApi(body)
                .then(res => {
                    // Vue: authAdmin.setAccessToken(res.data.accessToken); mustChangePassword = false
                    if (session) session.setAccessToken(res.data.accessToken);
                    form.reset();
                    updateRequirements();
                    if (forced) {
                        notify('Đã đổi mật khẩu. Đang chuyển vào trang tổng quan...', 'success');
                        setTimeout(() => { window.location.href = 'dashboard.html'; }, 800);
                        return;
                    }
                    notify('Đã đổi mật khẩu. Các thiết bị khác đã bị đăng xuất.', 'success');
                })
                .catch(err => {
                    // 401 sau khi refresh thất bại: request() đã chuyển về login.
                    if (err && err.statusCode === 401) return;
                    if (err && err.errorCode === 'VALIDATION_ERROR') {
                        if (err.errors && err.errors.currentPassword && currentPasswordInput) {
                            currentPasswordInput.value = '';
                        }
                        const rest = showFieldErrors(err.errors);
                        if (rest.length) notify(rest.join(' '), 'error');
                        return;
                    }
                    if (err && err.errorCode === 'ACCOUNT_TEMPORARILY_LOCKED') {
                        const until = err.errors && err.errors.lockedUntil ? new Date(err.errors.lockedUntil) : null;
                        showAlert('Tài khoản bị khóa tạm do nhập sai mật khẩu nhiều lần' +
                            (until ? ' đến ' + until.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '') +
                            '. Vui lòng thử lại sau.');
                        return;
                    }
                    notify((err && err.message) || 'Không đổi được mật khẩu. Vui lòng thử lại.', 'error');
                })
                .finally(() => setSubmitting(false));
        });
    }

    updateRequirements();
});
