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

    // 1. Avatar Upload Trigger & Live Preview
    const btnChangeAvatar = document.getElementById('btnChangeAvatar');
    const avatarInput = document.getElementById('avatar-input');
    const profileAvatarImg = document.getElementById('profileAvatarImg');

    if (btnChangeAvatar && avatarInput) {
        btnChangeAvatar.addEventListener('click', function() {
            avatarInput.click();
        });
    }

    if (avatarInput) {
        avatarInput.addEventListener('change', function(e) {
            const file = e.target.files && e.target.files[0];
            if (file) {
                if (!file.type.startsWith('image/')) {
                    notify('Vui lòng chọn tệp hình ảnh hợp lệ.', 'error');
                    return;
                }
                const reader = new FileReader();
                reader.onload = function(evt) {
                    if (profileAvatarImg) {
                        profileAvatarImg.src = evt.target.result;
                    }
                    const sidebarFooterAvatar = document.querySelector('.sidebar-footer .user-profile .avatar');
                    if (sidebarFooterAvatar) {
                        sidebarFooterAvatar.src = evt.target.result;
                    }
                    notify('Ảnh đại diện đã được cập nhật thành công.', 'success');
                };
                reader.readAsDataURL(file);
            }
        });
    }

    // 2. Name Preview & Initial State for Info Form
    const fullNameInput = document.getElementById('fullName');
    const phoneInput = document.getElementById('phone');
    const departmentInput = document.getElementById('department');
    const bioInput = document.getElementById('bio');
    const computedFullNameDisplay = document.getElementById('computedFullNameDisplay');
    const profileDisplayName = document.getElementById('profileDisplayName');
    const btnResetInfo = document.getElementById('btnResetInfo');

    const initialInfoValues = {
        fullName: fullNameInput ? fullNameInput.value : '',
        phone: phoneInput ? phoneInput.value : '',
        department: departmentInput ? departmentInput.value : '',
        bio: bioInput ? bioInput.value : ''
    };

    function updateFullNamePreview() {
        const display = (fullNameInput ? fullNameInput.value.trim() : '') || 'Quản trị viên';
        if (computedFullNameDisplay) {
            computedFullNameDisplay.textContent = display;
        }
        if (profileDisplayName) {
            profileDisplayName.textContent = display;
        }
    }

    if (fullNameInput) fullNameInput.addEventListener('input', updateFullNamePreview);

    if (btnResetInfo) {
        btnResetInfo.addEventListener('click', function() {
            if (firstNameInput) firstNameInput.value = initialInfoValues.firstName;
            if (lastNameInput) lastNameInput.value = initialInfoValues.lastName;
            if (phoneInput) phoneInput.value = initialInfoValues.phone;
            if (departmentInput) departmentInput.value = initialInfoValues.department;
            if (bioInput) bioInput.value = initialInfoValues.bio;
            updateFullNamePreview();
            notify('Đã khôi phục thông tin ban đầu.', 'success');
        });
    }

    // 3. Form Submission
    const formGeneralInfo = document.getElementById('formGeneralInfo');

    if (formGeneralInfo) {
        formGeneralInfo.addEventListener('submit', function(e) {
            e.preventDefault();
            const btn = document.getElementById('btnSubmitInfo') || this.querySelector('button[type="submit"]');
            const originalHtml = btn.innerHTML;

            btn.disabled = true;
            btn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="18" height="18"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg> Đang lưu...`;

            setTimeout(() => {
                notify('Thông tin hồ sơ đã được lưu thành công.', 'success');
                btn.disabled = false;
                btn.innerHTML = originalHtml;

                // Cập nhật lại initial values
                if (firstNameInput) initialInfoValues.firstName = firstNameInput.value;
                if (lastNameInput) initialInfoValues.lastName = lastNameInput.value;
                if (phoneInput) initialInfoValues.phone = phoneInput.value;
                if (departmentInput) initialInfoValues.department = departmentInput.value;
                if (bioInput) initialInfoValues.bio = bioInput.value;
            }, 600);
        });
    }
});
