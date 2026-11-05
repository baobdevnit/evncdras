document.addEventListener('DOMContentLoaded', () => {
    const togglePasswordBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const usernameInput = document.getElementById('username');
    const rememberInput = document.getElementById('remember');
    const loginForm = document.getElementById('loginForm');
    const errorBox = document.getElementById('loginError');
    const errorMessage = document.getElementById('errorMessage');

    // Toggle password visibility
    if (togglePasswordBtn && passwordInput) {
        togglePasswordBtn.addEventListener('click', () => {
            const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
            passwordInput.setAttribute('type', type);

            // Toggle icon
            const svg = togglePasswordBtn.querySelector('svg');
            if (svg) {
                if (type === 'text') {
                    svg.innerHTML = `
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                    `;
                } else {
                    svg.innerHTML = `
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                    `;
                }
            }
        });
    }

    // Clear error message on user input
    [usernameInput, passwordInput].forEach(input => {
        if (input) {
            input.addEventListener('input', hideError);
        }
    });

    // ------------------------------------------------------------------
    // Mock POST /api/v1/auth/login (docs/modules/03_auth_user.md mục 3.1)
    // Body: { username, password, rememberMe }. Response/lỗi đúng khung docs/02_api_contracts.md mục 2.1, 2.3.
    // Kịch bản demo theo username: locked.user → 403 ACCOUNT_LOCKED, group.off → 403 GROUP_INACTIVE,
    // temp.locked → 423, new.user → mustChangePassword, no.recording → nhóm chưa được cấp ghi âm,
    // thanhvien → REGULAR_USER; mật khẩu "sai" → 401; thêm ?maintenance=1 vào URL → 503 MAINTENANCE.
    // ------------------------------------------------------------------
    const ROLE_PERMISSIONS = {
        GROUP_ADMIN: [
            'cdr:download_audio', 'cdr:export', 'cdr:filter_advanced', 'cdr:listen_audio', 'cdr:view',
            'group:manage_admin', 'group:toggle_recording', 'org:view', 'prefix:view', 'qos:view',
            'report:export', 'report:view', 'user:create', 'user:delete', 'user:edit', 'user:view', 'user_group:view'
        ],
        REGULAR_USER: [
            'cdr:export', 'cdr:filter_advanced', 'cdr:view', 'org:view', 'prefix:view', 'qos:view',
            'report:export', 'report:view', 'user_group:view'
        ]
    };
    const ROLE_NAMES = { GROUP_ADMIN: 'Quản trị viên nhóm', REGULAR_USER: 'Thành viên' };
    const GROUP_GATED = ['cdr:listen_audio', 'cdr:download_audio'];
    const MOCK_MAINTENANCE = new URLSearchParams(window.location.search).get('maintenance') === '1';

    function mockUserLogin(body) {
        const now = new Date().toISOString();
        const fail = (statusCode, errorCode, message, errors = null) =>
            Promise.reject({ success: false, statusCode, errorCode, message, errors, timestamp: now });

        return new Promise(resolve => setTimeout(resolve, 900)).then(() => {
            // Bước 0: bảo trì trả 503 trước mọi bước (cả kiểm tra body), không ghi audit.
            if (MOCK_MAINTENANCE) {
                return fail(503, 'MAINTENANCE', 'Hệ thống đang bảo trì');
            }
            // Bước 1: kiểm tra body như backend.
            const errors = {};
            Object.keys(body).forEach(k => {
                if (!['username', 'password', 'rememberMe'].includes(k)) errors[k] = ['Trường không được nhận'];
            });
            const username = typeof body.username === 'string' ? body.username.trim() : '';
            if (!username || username.length > 150) errors.username = ['Tên đăng nhập là bắt buộc, tối đa 150 ký tự'];
            if (typeof body.password !== 'string' || body.password.length < 1 || body.password.length > 255) {
                errors.password = ['Mật khẩu là bắt buộc, tối đa 255 ký tự'];
            }
            if (body.rememberMe !== undefined && typeof body.rememberMe !== 'boolean') {
                errors.rememberMe = ['Phải là true hoặc false'];
            }
            if (Object.keys(errors).length) {
                return fail(400, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ', errors);
            }
            // Kịch bản theo phần tên tài khoản: đăng nhập bằng username hay email cho cùng kết quả.
            const u = username.toLowerCase().split('@')[0];
            // Bước 2: chặn trước khi kiểm tra mật khẩu, không tăng bộ đếm sai.
            if (u === 'locked.user') {
                return fail(403, 'ACCOUNT_LOCKED', 'Tài khoản đã bị khóa');
            }
            if (u === 'group.off') {
                return fail(403, 'GROUP_INACTIVE', 'Nhóm người dùng đã ngừng hoạt động');
            }
            if (u === 'temp.locked') {
                const lockedUntil = new Date(Date.now() + 15 * 60000).toISOString();
                return fail(423, 'ACCOUNT_TEMPORARILY_LOCKED', 'Tài khoản tạm khóa do đăng nhập sai nhiều lần', { lockedUntil });
            }
            // Bước 3: sai mật khẩu – cùng mã, cùng thông điệp với không tìm thấy tài khoản.
            if (body.password === 'sai') {
                return fail(401, 'INVALID_CREDENTIALS', 'Tên đăng nhập hoặc mật khẩu không đúng');
            }
            // Bước 4–6: quyền hiệu lực = quyền vai trò, bỏ quyền ghi âm khi nhóm chưa được cấp.
            const roleCode = u === 'thanhvien' ? 'REGULAR_USER' : 'GROUP_ADMIN';
            const allowRecordingAccess = u !== 'no.recording';
            const permissions = ROLE_PERMISSIONS[roleCode]
                .filter(p => allowRecordingAccess || !GROUP_GATED.includes(p));
            return {
                success: true,
                statusCode: 200,
                message: 'Đăng nhập thành công',
                data: {
                    accessToken: 'mock.jwt.user.' + Date.now(),
                    expiresIn: 900,
                    mustChangePassword: u === 'new.user',
                    user: {
                        id: 10,
                        username: u,
                        fullName: 'Trần Thị B',
                        email: u + '@evn.com.vn',
                        avatarUrl: null,
                        userGroup: {
                            id: 1,
                            name: 'Nhóm QLND Khối CNTT',
                            organizationId: 2,
                            organizationName: 'Khối CNTT',
                            allowRecordingAccess
                        },
                        roleCode,
                        roleName: ROLE_NAMES[roleCode],
                        permissions
                    }
                },
                timestamp: now
            };
        });
    }

    // Thông điệp theo errorCode (M03 mục 5.0). Frontend tự định dạng giờ mở khóa.
    function errorText(err) {
        switch (err && err.errorCode) {
            case 'INVALID_CREDENTIALS':
                return 'Tên đăng nhập hoặc mật khẩu không đúng.';
            case 'ACCOUNT_LOCKED':
                return 'Tài khoản đã bị khóa. Liên hệ Quản trị viên nhóm.';
            case 'GROUP_INACTIVE':
                return 'Nhóm người dùng của tài khoản đã ngừng hoạt động.';
            case 'ACCOUNT_TEMPORARILY_LOCKED': {
                const t = err.errors && err.errors.lockedUntil ? new Date(err.errors.lockedUntil) : null;
                const hhmm = t ? t.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
                return 'Đăng nhập sai quá nhiều lần. Thử lại sau ' + hhmm + '.';
            }
            case 'MAINTENANCE':
                return 'Hệ thống đang bảo trì, vui lòng quay lại sau.';
            case 'VALIDATION_ERROR': {
                const first = err.errors ? Object.values(err.errors)[0] : null;
                return (first && first[0]) || 'Dữ liệu đăng nhập không hợp lệ.';
            }
            default:
                return 'Không kết nối được máy chủ. Vui lòng thử lại.';
        }
    }

    function hideError() {
        if (errorBox) {
            errorBox.style.display = 'none';
            errorBox.classList.remove('is-warning');
        }
    }

    function showError(text, isWarning = false) {
        if (errorBox && errorMessage) {
            errorMessage.textContent = text;
            errorBox.classList.toggle('is-warning', isWarning);
            errorBox.style.display = 'inline-flex';
        }
    }

    // Form submission
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const body = {
                username: usernameInput ? usernameInput.value.trim() : '',
                password: passwordInput ? passwordInput.value : '',
                rememberMe: rememberInput ? rememberInput.checked : false
            };

            if (!body.username || !body.password) {
                showError('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
                return;
            }

            hideError();

            const btn = loginForm.querySelector('.submit-btn');
            const label = btn.querySelector('span');
            const originalText = label.innerText;
            const icon = btn.querySelector('svg');

            const setLoading = (on) => {
                label.innerText = on ? 'Đang xử lý...' : originalText;
                btn.style.opacity = on ? '0.8' : '';
                btn.style.pointerEvents = on ? 'none' : '';
                if (icon) icon.style.display = on ? 'none' : '';
            };
            setLoading(true);

            // Vue: gọi thẳng, không qua cơ chế refresh-khi-401 (docs/00_overview_and_architecture.md mục 5.3.2).
            mockUserLogin(body)
                .then(res => {
                    // Vue: authUserStore.setSession(res.data.accessToken, res.data.user) – chỉ giữ trong bộ nhớ,
                    // không ghi localStorage/sessionStorage (docs/01_database_schema.md mục 6.1).
                    label.innerText = 'Đăng nhập thành công!';
                    // Token giới hạn: trang đổi mật khẩu ở chế độ bị buộc đổi (bố cục riêng, như bản Admin).
                    const target = res.data.mustChangePassword ? 'change-password.html?forced=1' : 'dashboard.html';
                    setTimeout(() => { window.location.href = target; }, 600);
                })
                .catch(err => {
                    setLoading(false);
                    showError(errorText(err), !!err && err.errorCode === 'MAINTENANCE');
                    if (passwordInput) passwordInput.value = '';
                });
        });
    }

    // Add input focus effects
    const inputs = document.querySelectorAll('.input-container input');
    inputs.forEach(input => {
        input.addEventListener('focus', () => {
            const icon = input.parentElement.querySelector('.input-icon');
            if (icon) icon.style.color = 'var(--primary)';
        });

        input.addEventListener('blur', () => {
            if (!input.value) {
                const icon = input.parentElement.querySelector('.input-icon');
                if (icon) icon.style.color = 'var(--text-muted)';
            }
        });
    });
});
