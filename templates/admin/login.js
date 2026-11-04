document.addEventListener('DOMContentLoaded', () => {
    const toggleAdminPasswordBtn = document.getElementById('toggleAdminPassword');
    const adminPasswordInput = document.getElementById('adminPassword');
    const adminEmailInput = document.getElementById('adminEmail');
    const adminLoginForm = document.getElementById('adminLoginForm');
    const fillAdminDemoBtn = document.getElementById('fillAdminDemoBtn');
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

    // Demo account fill button for Admin
    if (fillAdminDemoBtn && adminEmailInput && adminPasswordInput) {
        fillAdminDemoBtn.addEventListener('click', () => {
            adminEmailInput.value = 'root.admin@evnict.vn';
            adminPasswordInput.value = 'RootSecurePassword2026!@';
            if (errorBox) {
                errorBox.style.display = 'none';
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

    // Form submission
    if (adminLoginForm) {
        adminLoginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const usernameOrEmail = adminEmailInput ? adminEmailInput.value.trim() : '';
            const password = adminPasswordInput ? adminPasswordInput.value : '';

            if (!usernameOrEmail || !password) {
                if (errorBox && errorMessage) {
                    errorMessage.textContent = 'Vui lòng nhập đầy đủ tài khoản và mật khẩu quản trị.';
                    errorBox.style.display = 'inline-flex';
                }
                return;
            }

            if (errorBox) {
                errorBox.style.display = 'none';
            }

            const btn = adminLoginForm.querySelector('.admin-submit-btn');
            const originalText = btn.querySelector('span').innerText;
            const icon = btn.querySelector('svg');

            // Add loading state
            btn.querySelector('span').innerText = 'Đang xác thực quyền Quản trị...';
            btn.style.opacity = '0.85';
            btn.style.pointerEvents = 'none';
            if (icon) icon.style.display = 'none';

            // Simulate Admin Authentication API call (POST /api/v1/admin/auth/login)
            setTimeout(() => {
                // In demo mode: accept root.admin@evnict.vn or any non-empty input
                const isRoot = usernameOrEmail.toLowerCase().includes('root');
                
                // Save independent admin tokens (evn_admin_token)
                sessionStorage.setItem('evn_admin_token', 'mock_jwt_admin_token_' + Date.now());
                localStorage.setItem('admin_user', JSON.stringify({
                    id: 1,
                    username: usernameOrEmail,
                    fullName: isRoot ? 'Quản trị viên Tối cao EVNICT' : 'Quản trị viên Kỹ thuật EVN',
                    email: usernameOrEmail,
                    isRoot: isRoot,
                    roles: isRoot ? ['ROOT_ADMIN'] : ['ADMIN'],
                    permissions: ['*']
                }));

                btn.querySelector('span').innerText = 'Xác thực thành công!';
                btn.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';

                setTimeout(() => {
                    // Redirect to dashboard with admin privileges
                    window.location.href = 'dashboard.html';
                }, 600);
            }, 1200);
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

