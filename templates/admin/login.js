document.addEventListener('DOMContentLoaded', () => {
    const toggleAdminPasswordBtn = document.getElementById('toggleAdminPassword');
    const adminPasswordInput = document.getElementById('adminPassword');
    const adminEmailInput = document.getElementById('adminEmail');
    const adminLoginForm = document.getElementById('adminLoginForm');
    const rememberInput = document.getElementById('adminRemember');
    const errorBox = document.getElementById('adminLoginError');
    const errorMessage = document.getElementById('adminErrorMessage');

    // Toggle password visibility
    if (toggleAdminPasswordBtn && adminPasswordInput) {
        toggleAdminPasswordBtn.addEventListener('click', () => {
            const isPassword = adminPasswordInput.getAttribute('type') === 'password';
            const newType = isPassword ? 'text' : 'password';
            adminPasswordInput.setAttribute('type', newType);

            // Toggle SVG icon
            const svg = toggleAdminPasswordBtn.querySelector('svg');
            if (svg) {
                if (newType === 'text') {
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
    [adminEmailInput, adminPasswordInput].forEach(input => {
        if (input) {
            input.addEventListener('input', () => {
                if (errorBox) {
                    errorBox.style.display = 'none';
                }
            });
        }
    });

    // ------------------------------------------------------------------
    // Mock POST /api/v1/admin/auth/login (docs/modules/04_auth_admin.md mục 3.1)
    // Body: { username, password, rememberMe }. Response/lỗi đúng khung docs/02_api_contracts.md mục 2.1, 2.3.
    // Kịch bản demo theo username: locked.admin → 403, temp.locked → 423,
    // new.admin → mustChangePassword, mật khẩu "sai" → 401; còn lại thành công.
    // ------------------------------------------------------------------
    const MOCK_PERMISSIONS_ROOT = [
        'admin:manage', 'audit:view', 'cdr:download_audio', 'cdr:listen_audio', 'cdr:view',
        'qos:view', 'report:view', 'role:view', 'system:manage'
    ]; // rút gọn để minh họa; ROOT_ADMIN thật có 25 mã, lấy nguyên từ response

    function mockAdminLogin(body) {
        const now = new Date().toISOString();
        const fail = (statusCode, errorCode, message, errors = null) =>
            Promise.reject({ success: false, statusCode, errorCode, message, errors, timestamp: now });

        return new Promise(resolve => setTimeout(resolve, 900)).then(() => {
            const u = body.username.toLowerCase();
            if (u === 'locked.admin') {
                return fail(403, 'ACCOUNT_LOCKED', 'Tài khoản đã bị khóa');
            }
            if (u === 'temp.locked') {
                const lockedUntil = new Date(Date.now() + 15 * 60000).toISOString();
                return fail(423, 'ACCOUNT_TEMPORARILY_LOCKED', 'Tài khoản tạm khóa do đăng nhập sai nhiều lần', { lockedUntil });
            }
            if (body.password === 'sai') {
                return fail(401, 'INVALID_CREDENTIALS', 'Tên đăng nhập hoặc mật khẩu không đúng');
            }
            const isRoot = u.includes('root');
            return {
                success: true,
                statusCode: 200,
                message: 'Đăng nhập quản trị viên thành công',
                data: {
                    accessToken: 'mock.jwt.admin.' + Date.now(),
                    expiresIn: 900,
                    mustChangePassword: u === 'new.admin',
                    admin: {
                        id: isRoot ? 1 : 5,
                        username: body.username,
                        fullName: isRoot ? 'Quản trị viên Tối cao EVNICT' : 'Kỹ thuật viên Trực ban EVNHANOI',
                        email: body.username.includes('@') ? body.username : body.username + '@evnict.vn',
                        avatarUrl: null,
                        roleCode: isRoot ? 'ROOT_ADMIN' : 'SYSTEM_ADMIN',
                        roleName: isRoot ? 'Quản trị viên tối cao' : 'Quản trị viên hệ thống',
                        permissions: isRoot ? MOCK_PERMISSIONS_ROOT : MOCK_PERMISSIONS_ROOT.filter(p => p !== 'admin:manage')
                    }
                },
                timestamp: now
            };
        });
    }

    // Thông điệp theo errorCode (M04 mục 5.1). Frontend tự định dạng giờ mở khóa.
    function errorText(err) {
        switch (err && err.errorCode) {
            case 'INVALID_CREDENTIALS':
                return 'Tên đăng nhập hoặc mật khẩu không đúng.';
            case 'ACCOUNT_LOCKED':
                return 'Tài khoản quản trị đã bị khóa. Liên hệ Quản trị viên tối cao.';
            case 'ACCOUNT_TEMPORARILY_LOCKED': {
                const t = err.errors && err.errors.lockedUntil ? new Date(err.errors.lockedUntil) : null;
                const hhmm = t ? t.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : '';
                return 'Đăng nhập sai quá nhiều lần. Thử lại sau ' + hhmm + '.';
            }
            case 'VALIDATION_ERROR': {
                const first = err.errors ? Object.values(err.errors)[0] : null;
                return (first && first[0]) || 'Dữ liệu đăng nhập không hợp lệ.';
            }
            default:
                return 'Không kết nối được máy chủ. Vui lòng thử lại.';
        }
    }

    function showError(text) {
        if (errorBox && errorMessage) {
            errorMessage.textContent = text;
            errorBox.style.display = 'inline-flex';
        }
    }

    // Form submission
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const body = {
                username: adminEmailInput ? adminEmailInput.value.trim() : '',
                password: adminPasswordInput ? adminPasswordInput.value : '',
                rememberMe: rememberInput ? rememberInput.checked : false
            };

            if (!body.username || !body.password) {
                showError('Vui lòng nhập đầy đủ tài khoản và mật khẩu quản trị.');
                return;
            }

            if (errorBox) {
                errorBox.style.display = 'none';
            }

            const btn = adminLoginForm.querySelector('.admin-submit-btn');
            const label = btn.querySelector('span');
            const originalText = label.innerText;
            const icon = btn.querySelector('svg');

            const setLoading = (on) => {
                label.innerText = on ? 'Đang xác thực quyền Quản trị...' : originalText;
                btn.style.opacity = on ? '0.85' : '';
                btn.style.pointerEvents = on ? 'none' : '';
                if (icon) icon.style.display = on ? 'none' : '';
            };
            setLoading(true);

            mockAdminLogin(body)
                .then(res => {
                    // Vue: authAdminStore.setSession(res.data.accessToken, res.data.admin) – chỉ giữ trong bộ nhớ,
                    // không ghi localStorage/sessionStorage (docs/01_database_schema.md mục 6.1).
                    label.innerText = 'Xác thực thành công!';
                    btn.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
                    const target = res.data.mustChangePassword ? 'change-password.html' : 'dashboard.html';
                    setTimeout(() => { window.location.href = target; }, 600);
                })
                .catch(err => {
                    setLoading(false);
                    showError(errorText(err));
                    if (adminPasswordInput) adminPasswordInput.value = '';
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

