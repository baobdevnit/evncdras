document.addEventListener('DOMContentLoaded', function() {
    // Helper toast function
    function notify(message, type = 'success') {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        } else {
            alert(message);
        }
    }

    // 1. Toggle Password Visibility
    const togglePasswordBtns = document.querySelectorAll('.btn-toggle-password');
    togglePasswordBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const input = this.previousElementSibling;
            if (!input) return;

            if (input.type === 'password') {
                input.type = 'text';
                this.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`;
            } else {
                input.type = 'password';
                this.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
            }
        });
    });

    // 3. Password Strength Meter & Requirements Checklist
    const newPasswordInput = document.getElementById('newPassword');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordStrengthContainer = document.getElementById('passwordStrengthContainer');
    const passwordStrengthLabel = document.getElementById('passwordStrengthLabel');
    const strengthSegs = [
        document.getElementById('strengthSeg1'),
        document.getElementById('strengthSeg2'),
        document.getElementById('strengthSeg3'),
        document.getElementById('strengthSeg4'),
    ];

    const reqMinLength = document.getElementById('reqMinLength');
    const reqMixedCase = document.getElementById('reqMixedCase');
    const reqNumber = document.getElementById('reqNumber');
    const reqSymbol = document.getElementById('reqSymbol');

    const confirmMatchHint = document.getElementById('confirmMatchHint');
    const confirmMatchText = document.getElementById('confirmMatchText');

    function checkPasswordStrength() {
        if (!newPasswordInput) return;
        const pwd = newPasswordInput.value;

        if (!pwd) {
            if (passwordStrengthContainer) passwordStrengthContainer.style.display = 'none';
            if (reqMinLength) reqMinLength.classList.remove('met');
            if (reqMixedCase) reqMixedCase.classList.remove('met');
            if (reqNumber) reqNumber.classList.remove('met');
            if (reqSymbol) reqSymbol.classList.remove('met');
            checkConfirmPasswordMatch();
            return;
        }

        if (passwordStrengthContainer) passwordStrengthContainer.style.display = 'block';

        const isMinLength = pwd.length >= 8;
        const isMixedCase = /[a-z]/.test(pwd) && /[A-Z]/.test(pwd);
        const isNumber = /[0-9]/.test(pwd);
        const isSymbol = /[^A-Za-z0-9]/.test(pwd);

        if (reqMinLength) reqMinLength.classList.toggle('met', isMinLength);
        if (reqMixedCase) reqMixedCase.classList.toggle('met', isMixedCase);
        if (reqNumber) reqNumber.classList.toggle('met', isNumber);
        if (reqSymbol) reqSymbol.classList.toggle('met', isSymbol);

        let score = 0;
        if (isMinLength) score++;
        if (isMixedCase) score++;
        if (isNumber) score++;
        if (isSymbol) score++;

        let label = 'Chưa nhập';
        let strengthClass = '';
        switch (score) {
            case 1:
                label = 'Yếu';
                strengthClass = 'strength-weak';
                break;
            case 2:
                label = 'Trung bình';
                strengthClass = 'strength-medium';
                break;
            case 3:
                label = 'Mạnh';
                strengthClass = 'strength-strong';
                break;
            case 4:
                label = 'Rất mạnh';
                strengthClass = 'strength-very-strong';
                break;
        }

        if (passwordStrengthLabel) {
            passwordStrengthLabel.textContent = label;
        }

        strengthSegs.forEach((seg, index) => {
            if (!seg) return;
            seg.className = 'strength-segment';
            if (score >= index + 1 && strengthClass) {
                seg.classList.add(strengthClass);
            }
        });

        checkConfirmPasswordMatch();
    }

    function checkConfirmPasswordMatch() {
        if (!confirmPasswordInput || !newPasswordInput || !confirmMatchHint || !confirmMatchText) return;
        const confirmVal = confirmPasswordInput.value;
        const newPwdVal = newPasswordInput.value;

        if (!confirmVal) {
            confirmMatchHint.style.display = 'none';
            return;
        }

        confirmMatchHint.style.display = 'flex';
        if (confirmVal === newPwdVal) {
            confirmMatchHint.className = 'confirm-match-hint match';
            confirmMatchText.textContent = '✓ Mật khẩu xác nhận trùng khớp';
        } else {
            confirmMatchHint.className = 'confirm-match-hint mismatch';
            confirmMatchText.textContent = '✗ Mật khẩu xác nhận chưa trùng khớp';
        }
    }

    if (newPasswordInput) newPasswordInput.addEventListener('input', checkPasswordStrength);
    if (confirmPasswordInput) confirmPasswordInput.addEventListener('input', checkConfirmPasswordMatch);

    // 4. Form Submission
    const formSecurity = document.getElementById('formSecurity');

    if (formSecurity) {
        formSecurity.addEventListener('submit', function(e) {
            e.preventDefault();

            const newPassword = newPasswordInput ? newPasswordInput.value : '';
            const confirmPassword = confirmPasswordInput ? confirmPasswordInput.value : '';

            if (newPassword.length < 8) {
                notify('Mật khẩu mới phải có ít nhất 8 ký tự.', 'error');
                return;
            }

            if (newPassword !== confirmPassword) {
                notify('Mật khẩu xác nhận không khớp.', 'error');
                return;
            }

            const btn = document.getElementById('btnSubmitPassword') || this.querySelector('button[type="submit"]');
            const originalHtml = btn.innerHTML;

            btn.disabled = true;
            btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> Đang cập nhật...`;

            setTimeout(() => {
                notify('Mật khẩu đã được thay đổi thành công.', 'success');
                btn.disabled = false;
                btn.innerHTML = originalHtml;
                this.reset();
                checkPasswordStrength();
                checkConfirmPasswordMatch();
            }, 800);
        });
    }
});
