document.addEventListener('DOMContentLoaded', () => {
    const togglePasswordBtn = document.getElementById('togglePassword');
    const passwordInput = document.getElementById('password');
    const emailInput = document.getElementById('email');
    const loginForm = document.getElementById('loginForm');
    const fillDemoBtn = document.getElementById('fillDemoBtn');
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

    // Demo account fill button
    if (fillDemoBtn && emailInput && passwordInput) {
        fillDemoBtn.addEventListener('click', () => {
            emailInput.value = 'cdr.evnit@evn.com.vn';
            passwordInput.value = '1234567890';
            if (errorBox) {
                errorBox.style.display = 'none';
            }
        });
    }

    // Clear error message on user input
    [emailInput, passwordInput].forEach(input => {
        if (input) {
            input.addEventListener('input', () => {
                if (errorBox) {
                    errorBox.style.display = 'none';
                }
            });
        }
    });

    // Form submission
    if (loginForm) {
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();

            const email = emailInput ? emailInput.value.trim() : '';
            const password = passwordInput ? passwordInput.value : '';

            if (!email || !password) {
                if (errorBox && errorMessage) {
                    errorMessage.textContent = 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.';
                    errorBox.style.display = 'inline-flex';
                }
                return;
            }

            if (errorBox) {
                errorBox.style.display = 'none';
            }

            const btn = loginForm.querySelector('.submit-btn');
            const originalText = btn.querySelector('span').innerText;
            const icon = btn.querySelector('svg');

            // Add loading state
            btn.querySelector('span').innerText = 'Đang xử lý...';
            btn.style.opacity = '0.8';
            btn.style.pointerEvents = 'none';
            if (icon) icon.style.display = 'none';

            // Simulate API call
            setTimeout(() => {
                btn.querySelector('span').innerText = originalText;
                btn.style.opacity = '1';
                btn.style.pointerEvents = 'auto';
                if (icon) icon.style.display = 'block';

                // Redirect to dashboard
                window.location.href = 'dashboard.html';
            }, 1500);
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
