/**
 * EVN CDR AS - System Settings Script
 * Đồng bộ logic tương tác cho templates/system-settings.html
 */

document.addEventListener('DOMContentLoaded', () => {
    // ----------------------------------------------------
    // 1. Toast Notification Helper
    // ----------------------------------------------------
    function notify(message, type = 'success') {
        if (typeof window.showToast === 'function') {
            window.showToast(message, type);
        } else if (typeof window.showNotification === 'function') {
            window.showNotification(message, type);
        } else {
            alert(message);
        }
    }

    // ----------------------------------------------------
    // 2. Navigation & Smooth Scroll to Section (Lướt 1 page - Kiểu user-settings.html)
    // ----------------------------------------------------
    const navButtons = document.querySelectorAll('.profile-nav-btn, .settings-nav-btn');
    const sections = ['analysis', 'reporting', 'advanced'];

    function setActiveNav(sectionId) {
        navButtons.forEach(btn => {
            const target = btn.getAttribute('data-section') || btn.getAttribute('data-tab');
            if (target === sectionId) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
    }

    function scrollToSection(sectionId) {
        setActiveNav(sectionId);
        const el = document.getElementById(`section-${sectionId}`) || document.getElementById(sectionId);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    navButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const sectionId = btn.getAttribute('data-section') || btn.getAttribute('data-tab');
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
            const el = document.getElementById(`section-${id}`) || document.getElementById(id);
            if (el) observer.observe(el);
        });
    }

    // Check hash on page load
    const currentHash = window.location.hash.replace('#', '').replace('section-', '');
    if (currentHash && sections.includes(currentHash)) {
        setTimeout(() => {
            scrollToSection(currentHash);
        }, 100);
    }

    // ----------------------------------------------------
    // 3. Form Submissions (Analysis & Reporting)
    // ----------------------------------------------------
    const formAnalysis = document.getElementById('formAnalysis');
    if (formAnalysis) {
        formAnalysis.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = formAnalysis.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                const originalText = submitBtn.textContent;
                submitBtn.textContent = 'Đang lưu...';
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                    notify('Lưu quy tắc phân tích thành công!', 'success');
                }, 600);
            } else {
                notify('Lưu quy tắc phân tích thành công!', 'success');
            }
        });
    }

    const formReporting = document.getElementById('formReporting');
    if (formReporting) {
        formReporting.addEventListener('submit', (e) => {
            e.preventDefault();
            const submitBtn = formReporting.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                const originalText = submitBtn.textContent;
                submitBtn.textContent = 'Đang lưu...';
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                    notify('Lưu chính sách báo cáo & lưu trữ thành công!', 'success');
                }, 600);
            } else {
                notify('Lưu chính sách báo cáo & lưu trữ thành công!', 'success');
            }
        });
    }

    // ----------------------------------------------------
    // 4. Custom Confirm Modal
    // ----------------------------------------------------
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

        // Reset icon wrapper and action button classes
        confirmModalIconWrapper.className = `confirm-modal-icon-wrapper confirm-modal-icon--${type}`;
        confirmModalActionBtn.className = `confirm-modal-btn confirm-modal-btn--${type}`;

        // Switch icon by type
        if (confirmModalIconDanger) confirmModalIconDanger.style.display = type === 'danger' ? 'block' : 'none';
        if (confirmModalIconWarning) confirmModalIconWarning.style.display = type === 'warning' ? 'block' : 'none';
        if (confirmModalIconPrimary) confirmModalIconPrimary.style.display = type === 'primary' ? 'block' : 'none';

        currentConfirmAction = action;
        confirmModal.style.display = 'flex';
    }

    function closeConfirmModal() {
        if (!confirmModal) return;
        confirmModal.style.display = 'none';
        currentConfirmAction = null;
        if (confirmModalActionBtn) confirmModalActionBtn.disabled = false;
        if (confirmModalCancelBtn) confirmModalCancelBtn.disabled = false;
        const spinner = confirmModalActionBtn?.querySelector('.spinner-small');
        if (spinner) spinner.remove();
    }

    if (confirmModal) {
        if (confirmModalCancelBtn) {
            confirmModalCancelBtn.addEventListener('click', closeConfirmModal);
        }
        confirmModal.addEventListener('click', (e) => {
            if (e.target === confirmModal) closeConfirmModal();
        });

        window.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && confirmModal.style.display !== 'none') {
                closeConfirmModal();
            }
        });

        if (confirmModalActionBtn) {
            confirmModalActionBtn.addEventListener('click', () => {
                if (currentConfirmAction) {
                    confirmModalActionBtn.disabled = true;
                    if (confirmModalCancelBtn) confirmModalCancelBtn.disabled = true;
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
    }

    // ----------------------------------------------------
    // 5. Maintenance Mode Toggle Logic
    // ----------------------------------------------------
    let isMaintenanceActive = false;
    const btnToggleMaintenance = document.getElementById('btnToggleMaintenance');

    function updateMaintenanceButton() {
        if (!btnToggleMaintenance) return;
        if (isMaintenanceActive) {
            btnToggleMaintenance.textContent = 'Tắt bảo trì';
            btnToggleMaintenance.className = 'btn btn-primary';
        } else {
            btnToggleMaintenance.textContent = 'Bật bảo trì';
            btnToggleMaintenance.className = 'btn btn-outline-danger';
        }
    }

    if (btnToggleMaintenance) {
        btnToggleMaintenance.addEventListener('click', () => {
            if (!isMaintenanceActive) {
                showConfirmModal({
                    title: 'Xác nhận thay đổi chế độ bảo trì',
                    message: 'Bạn có chắc chắn muốn bật chế độ bảo trì? Người dùng thường sẽ không thể truy cập giao diện trong thời gian này.',
                    confirmText: 'Bật bảo trì',
                    cancelText: 'Hủy bỏ',
                    type: 'danger',
                    action: (done) => {
                        setTimeout(() => {
                            isMaintenanceActive = true;
                            updateMaintenanceButton();
                            notify('Đã bật chế độ bảo trì hệ thống!', 'warning');
                            done();
                        }, 500);
                    }
                });
            } else {
                showConfirmModal({
                    title: 'Xác nhận thay đổi chế độ bảo trì',
                    message: 'Bạn có chắc chắn muốn tắt chế độ bảo trì và mở lại quyền truy cập cho người dùng?',
                    confirmText: 'Tắt bảo trì',
                    cancelText: 'Hủy bỏ',
                    type: 'primary',
                    action: (done) => {
                        setTimeout(() => {
                            isMaintenanceActive = false;
                            updateMaintenanceButton();
                            notify('Đã tắt chế độ bảo trì hệ thống!', 'success');
                            done();
                        }, 500);
                    }
                });
            }
        });
    }

    // ----------------------------------------------------
    // 6. Clear Cache Logic
    // ----------------------------------------------------
    const btnClearCache = document.getElementById('btnClearCache');
    if (btnClearCache) {
        btnClearCache.addEventListener('click', (e) => {
            e.preventDefault();
            const originalText = btnClearCache.textContent;
            btnClearCache.textContent = 'Đang xóa...';
            btnClearCache.disabled = true;

            setTimeout(() => {
                notify('Đã xóa toàn bộ bộ nhớ đệm (Cache) hệ thống!', 'success');
                btnClearCache.textContent = originalText;
                btnClearCache.disabled = false;
            }, 800);
        });
    }
});
