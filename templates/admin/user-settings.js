/**
 * ============================================================
 * PAGE: User Settings (Cài đặt tài khoản)
 * File: templates/user-settings.js
 * Đồng bộ tương tác và quản lý thiết lập tài khoản cá nhân
 * ============================================================
 */

document.addEventListener('DOMContentLoaded', () => {
    // Helper notification toast
    function notify(message, type = 'success') {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        } else if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
        } else {
            alert(message);
        }
    }

    // ============================================================
    // 1. Navigation & Smooth Scroll to Section
    // ============================================================
    const navButtons = document.querySelectorAll('.profile-nav-btn');
    const sections = ['appearance', 'notifications', 'security', 'advanced'];

    function setActiveNav(sectionId) {
        navButtons.forEach(btn => {
            if (btn.getAttribute('data-section') === sectionId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    function scrollToSection(sectionId) {
        setActiveNav(sectionId);
        const el = document.getElementById(`section-${sectionId}`);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = btn.getAttribute('data-section');
            if (sectionId) {
                scrollToSection(sectionId);
                history.replaceState(null, '', `#${sectionId}`);
            }
        });
    });

    // IntersectionObserver to sync active nav on scroll
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const id = entry.target.id.replace('section-', '');
                    setActiveNav(id);
                }
            });
        }, {
            rootMargin: '-20% 0px -60% 0px',
            threshold: 0
        });

        sections.forEach(id => {
            const el = document.getElementById(`section-${id}`);
            if (el) observer.observe(el);
        });
    }

    // Check hash on page load
    const currentHash = window.location.hash.replace('#', '');
    if (currentHash && sections.includes(currentHash)) {
        setTimeout(() => {
            scrollToSection(currentHash);
        }, 100);
    }

    // ============================================================
    // 2. Giao diện & Hiển thị (Theme & Display Preferences)
    // ============================================================
    const settingThemeToggle = document.getElementById('settingThemeToggle');
    const themeBtn = document.getElementById('themeToggle');

    if (settingThemeToggle) {
        const isCurrentDark = document.documentElement.getAttribute('data-theme') === 'dark' ||
                              localStorage.getItem('theme') === 'dark';
        settingThemeToggle.checked = isCurrentDark;

        settingThemeToggle.addEventListener('change', (e) => {
            const isDark = e.target.checked;
            if (themeBtn) {
                const docDark = document.documentElement.getAttribute('data-theme') === 'dark';
                if (docDark !== isDark) {
                    themeBtn.click();
                }
            } else {
                if (isDark) {
                    document.documentElement.setAttribute('data-theme', 'dark');
                    localStorage.setItem('theme', 'dark');
                } else {
                    document.documentElement.removeAttribute('data-theme');
                    localStorage.setItem('theme', 'light');
                }
            }
            notify(`Đã chuyển sang giao diện ${isDark ? 'tối' : 'sáng'}.`, 'success');
        });

        if (themeBtn) {
            themeBtn.addEventListener('click', () => {
                setTimeout(() => {
                    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
                    settingThemeToggle.checked = isDark;
                }, 50);
            });
        }
    }

    const settingSidebarToggle = document.getElementById('settingSidebarToggle');
    const sidebarToggleBtn = document.getElementById('sidebarToggle');

    if (settingSidebarToggle) {
        const isCollapsed = document.body.classList.contains('sidebar-collapsed') ||
                            localStorage.getItem('sidebar_collapsed') === 'true';
        settingSidebarToggle.checked = isCollapsed;

        settingSidebarToggle.addEventListener('change', (e) => {
            const collapsed = e.target.checked;
            if (sidebarToggleBtn) {
                const currentCollapsed = document.body.classList.contains('sidebar-collapsed');
                if (currentCollapsed !== collapsed) {
                    sidebarToggleBtn.click();
                }
            } else {
                document.body.classList.toggle('sidebar-collapsed', collapsed);
                localStorage.setItem('sidebar_collapsed', collapsed ? 'true' : 'false');
            }
            notify('Đã cập nhật trạng thái menu bên trái.', 'success');
        });

        if (sidebarToggleBtn) {
            sidebarToggleBtn.addEventListener('click', () => {
                setTimeout(() => {
                    settingSidebarToggle.checked = document.body.classList.contains('sidebar-collapsed');
                }, 50);
            });
        }
    }

    // Tùy chọn số lượng bản ghi hiển thị
    const prefItemsPerPage = document.getElementById('prefItemsPerPage');
    if (prefItemsPerPage) {
        const savedItems = localStorage.getItem('items_per_page');
        if (savedItems) prefItemsPerPage.value = savedItems;

        prefItemsPerPage.addEventListener('change', (e) => {
            localStorage.setItem('items_per_page', e.target.value);
            notify(`Đã cập nhật: hiển thị ${e.target.value} bản ghi mỗi trang.`, 'success');
        });
    }

    // Tùy chọn định dạng thời gian
    const prefDateFormat = document.getElementById('prefDateFormat');
    if (prefDateFormat) {
        const savedDateFormat = localStorage.getItem('date_format');
        if (savedDateFormat) prefDateFormat.value = savedDateFormat;

        prefDateFormat.addEventListener('change', (e) => {
            localStorage.setItem('date_format', e.target.value);
            notify('Đã cập nhật định dạng hiển thị ngày giờ.', 'success');
        });
    }

    // Tùy chọn ngôn ngữ
    const prefLanguage = document.getElementById('prefLanguage');
    if (prefLanguage) {
        const savedLanguage = localStorage.getItem('language');
        if (savedLanguage) prefLanguage.value = savedLanguage;

        prefLanguage.addEventListener('change', (e) => {
            localStorage.setItem('language', e.target.value);
            notify('Đã cập nhật ngôn ngữ giao diện.', 'success');
        });
    }

    const appearanceForm = document.getElementById('appearanceForm');
    if (appearanceForm) {
        appearanceForm.addEventListener('submit', (e) => e.preventDefault());
    }

    // ============================================================
    // 3. Custom Confirm Modal
    // ============================================================
    const confirmModal = document.getElementById('confirmModal');
    const confirmModalTitle = document.getElementById('confirmModalTitle');
    const confirmModalMessage = document.getElementById('confirmModalMessage');
    const confirmModalIconWrapper = document.getElementById('confirmModalIconWrapper');
    const confirmModalIconDanger = document.getElementById('confirmModalIconDanger');
    const confirmModalIconWarning = document.getElementById('confirmModalIconWarning');
    const confirmModalIconPrimary = document.getElementById('confirmModalIconPrimary');
    const confirmModalCancelBtn = document.getElementById('confirmModalCancelBtn');
    const confirmModalActionBtn = document.getElementById('confirmModalActionBtn');
    const confirmModalBtnText = document.getElementById('confirmModalBtnText');

    let currentConfirmAction = null;

    function showConfirmModal({ title, message, confirmText = 'Xác nhận', cancelText = 'Hủy bỏ', type = 'danger', action }) {
        if (!confirmModal) return;

        confirmModalTitle.textContent = title;
        confirmModalMessage.textContent = message;
        confirmModalBtnText.textContent = confirmText;
        confirmModalCancelBtn.textContent = cancelText;

        // Reset classes
        confirmModalIconWrapper.className = `confirm-modal-icon-wrapper confirm-modal-icon--${type}`;
        confirmModalActionBtn.className = `confirm-modal-btn confirm-modal-btn--${type}`;

        // Icons
        confirmModalIconDanger.style.display = type === 'danger' ? 'block' : 'none';
        confirmModalIconWarning.style.display = type === 'warning' ? 'block' : 'none';
        confirmModalIconPrimary.style.display = type === 'primary' ? 'block' : 'none';

        currentConfirmAction = action;
        confirmModal.style.display = 'flex';
    }

    function closeConfirmModal() {
        if (!confirmModal) return;
        confirmModal.style.display = 'none';
        currentConfirmAction = null;
        confirmModalActionBtn.disabled = false;
        confirmModalCancelBtn.disabled = false;
        const spinner = confirmModalActionBtn.querySelector('.spinner-small');
        if (spinner) spinner.remove();
    }

    if (confirmModal) {
        confirmModalCancelBtn.addEventListener('click', closeConfirmModal);
        confirmModal.addEventListener('click', (e) => {
            if (e.target === confirmModal) closeConfirmModal();
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && confirmModal.style.display !== 'none') {
                closeConfirmModal();
            }
        });

        confirmModalActionBtn.addEventListener('click', () => {
            if (currentConfirmAction) {
                confirmModalActionBtn.disabled = true;
                confirmModalCancelBtn.disabled = true;
                const spinner = document.createElement('span');
                spinner.className = 'spinner-small';
                confirmModalActionBtn.prepend(spinner);

                currentConfirmAction(() => {
                    closeConfirmModal();
                });
            } else {
                closeConfirmModal();
            }
        });
    }

    // ============================================================
    // 4. Session & Device Management
    // ============================================================
    const deviceList = document.getElementById('deviceList');
    const btnLogoutAllDevices = document.getElementById('btnLogoutAllDevices');

    function updateLogoutAllBtnState() {
        const otherDevices = deviceList ? deviceList.querySelectorAll('.btn-logout-device') : [];
        if (btnLogoutAllDevices) {
            btnLogoutAllDevices.disabled = otherDevices.length === 0;
        }
        if (otherDevices.length === 0 && deviceList) {
            const existingEmpty = deviceList.querySelector('.text-empty-devices');
            if (!existingEmpty) {
                const emptyMsg = document.createElement('div');
                emptyMsg.className = 'text-muted text-empty-devices';
                emptyMsg.style.padding = '12px 0';
                emptyMsg.textContent = 'Chưa ghi nhận phiên đăng nhập khác.';
                deviceList.appendChild(emptyMsg);
            }
        }
    }

    if (deviceList) {
        deviceList.addEventListener('click', (e) => {
            const btn = e.target.closest('.btn-logout-device');
            if (!btn) return;

            const item = btn.closest('.device-item');
            const browser = item.getAttribute('data-browser') || 'Trình duyệt';
            const platform = item.getAttribute('data-platform') || 'Thiết bị';
            const ip = item.getAttribute('data-ip') || 'N/A';

            showConfirmModal({
                title: 'Đăng xuất thiết bị',
                message: `Đăng xuất khỏi thiết bị ${browser} trên ${platform} (IP: ${ip})?`,
                confirmText: 'Đăng xuất',
                type: 'danger',
                action: (done) => {
                    setTimeout(() => {
                        item.remove();
                        updateLogoutAllBtnState();
                        done();
                        notify('Đã đăng xuất thiết bị thành công.', 'success');
                    }, 500);
                }
            });
        });
    }

    if (btnLogoutAllDevices) {
        btnLogoutAllDevices.addEventListener('click', () => {
            showConfirmModal({
                title: 'Đăng xuất tất cả thiết bị khác',
                message: 'Bạn có chắc chắn muốn đăng xuất khỏi tất cả các thiết bị khác ngoại trừ thiết bị hiện tại?',
                confirmText: 'Đăng xuất tất cả',
                type: 'danger',
                action: (done) => {
                    setTimeout(() => {
                        if (deviceList) {
                            const otherDevices = deviceList.querySelectorAll('.device-item[data-session-id]:not([data-session-id="1"])');
                            otherDevices.forEach(el => el.remove());
                            updateLogoutAllBtnState();
                        }
                        done();
                        notify('Đã đăng xuất khỏi tất cả các thiết bị khác.', 'success');
                    }, 500);
                }
            });
        });
    }

    // ============================================================
    // 5. Xác thực 2 bước (2FA) Toggle
    // ============================================================
    const setting2FAToggle = document.getElementById('setting2FAToggle');
    if (setting2FAToggle) {
        setting2FAToggle.addEventListener('change', (e) => {
            const isEnabling = e.target.checked;
            if (isEnabling) {
                showConfirmModal({
                    title: 'Bật xác thực 2 bước (2FA)',
                    message: 'Kích hoạt xác thực 2 bước sẽ yêu cầu mã OTP gửi qua Email/EVN Authenticator mỗi khi đăng nhập trên trình duyệt mới.',
                    confirmText: 'Kích hoạt',
                    type: 'primary',
                    action: (done) => {
                        setTimeout(() => {
                            done();
                            notify('Đã kích hoạt xác thực 2 bước thành công.', 'success');
                        }, 500);
                    }
                });
            } else {
                showConfirmModal({
                    title: 'Tắt xác thực 2 bước (2FA)',
                    message: 'Bạn có chắc muốn tắt xác thực 2 bước? Tài khoản của bạn sẽ giảm bớt một lớp bảo vệ quan trọng.',
                    confirmText: 'Tắt 2FA',
                    type: 'warning',
                    action: (done) => {
                        setTimeout(() => {
                            done();
                            notify('Đã tắt xác thực 2 bước.', 'warning');
                        }, 500);
                    }
                });
            }
        });
    }

    // ============================================================
    // 6. Data Export & Account Management Actions
    // ============================================================
    const btnRequestExport = document.getElementById('btnRequestExport');
    const exportHistoryList = document.getElementById('exportHistoryList');

    if (btnRequestExport) {
        btnRequestExport.addEventListener('click', () => {
            showConfirmModal({
                title: 'Tạo yêu cầu trích xuất dữ liệu tài khoản',
                message: 'Bạn có chắc chắn muốn yêu cầu bản sao dữ liệu hoạt động cá nhân? Hệ thống sẽ tạo gói dữ liệu nén và gửi liên kết tải xuống qua email admin@evn.com.vn.',
                confirmText: 'Gửi yêu cầu',
                type: 'primary',
                action: (done) => {
                    setTimeout(() => {
                        btnRequestExport.disabled = true;
                        btnRequestExport.textContent = 'Đang chờ Admin xử lý';

                        if (exportHistoryList) {
                            const now = new Date();
                            const dateStr = `${now.getDate().toString().padStart(2, '0')}/${(now.getMonth() + 1).toString().padStart(2, '0')}/${now.getFullYear()} ${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
                            const newId = Math.floor(1000 + Math.random() * 9000);
                            const item = document.createElement('div');
                            item.className = 'device-item';
                            item.style.padding = '10px 14px';
                            item.innerHTML = `
                                <div class="device-details">
                                    <h5 style="font-size: 0.9rem; margin: 0 0 2px;">Yêu cầu #${newId} &bull; ${dateStr}</h5>
                                    <p style="font-size: 0.8rem; margin: 0;">Email nhận: admin@evn.com.vn</p>
                                </div>
                                <span class="device-badge" style="background: rgba(245, 158, 11, 0.15); color: #f59e0b; border-color: rgba(245, 158, 11, 0.3);">Chờ Admin xử lý</span>
                            `;
                            exportHistoryList.prepend(item);
                        }

                        done();
                        notify('Đã gửi yêu cầu trích xuất dữ liệu tài khoản thành công.', 'success');
                    }, 600);
                }
            });
        });
    }

    const btnDisableAccount = document.getElementById('btnDisableAccount');
    if (btnDisableAccount) {
        btnDisableAccount.addEventListener('click', () => {
            showConfirmModal({
                title: 'Vô hiệu hóa tài khoản',
                message: 'Bạn có chắc chắn muốn gửi yêu cầu tạm khóa tài khoản của mình? Quản trị viên hệ thống sẽ phê duyệt yêu cầu này.',
                confirmText: 'Gửi yêu cầu khóa',
                type: 'warning',
                action: (done) => {
                    setTimeout(() => {
                        btnDisableAccount.disabled = true;
                        btnDisableAccount.textContent = 'Đang chờ Admin xử lý';
                        done();
                        notify('Đã gửi yêu cầu vô hiệu hóa tài khoản đến Quản trị viên.', 'warning');
                    }, 600);
                }
            });
        });
    }

    const btnDeleteAccount = document.getElementById('btnDeleteAccount');
    if (btnDeleteAccount) {
        btnDeleteAccount.addEventListener('click', () => {
            showConfirmModal({
                title: 'Yêu cầu đóng / Xóa tài khoản vĩnh viễn',
                message: 'Bạn có chắc chắn muốn gửi yêu cầu XÓA VĨNH VIỄN tài khoản và các dữ liệu liên quan? Hành động này sẽ được chuyển đến Root Admin phê duyệt.',
                confirmText: 'Gửi yêu cầu xóa',
                type: 'danger',
                action: (done) => {
                    setTimeout(() => {
                        btnDeleteAccount.disabled = true;
                        btnDeleteAccount.textContent = 'Đang chờ Admin xử lý';
                        done();
                        notify('Đã gửi yêu cầu xóa tài khoản vĩnh viễn.', 'error');
                    }, 600);
                }
            });
        });
    }

    // ============================================================
    // 7. Notification Preferences Toggles
    // ============================================================
    const notifCheckboxes = [
        document.getElementById('prefNotificationEmail'),
        document.getElementById('prefNotificationPush'),
        document.getElementById('prefNotificationSound'),
        document.getElementById('prefNotificationWeeklyReport'),
        document.getElementById('prefAlertCriticalOnly'),
        document.getElementById('prefAlertQosLow')
    ];

    notifCheckboxes.forEach(cb => {
        if (cb) {
            cb.addEventListener('change', () => {
                notify('Đã lưu cấu hình thông báo tài khoản.', 'success');
            });
        }
    });
});
