/**
 * ============================================================
 * PAGE: Cài đặt tài khoản Member (AccountSettingsView, /account-settings)
 * File: templates/member/user-settings.js
 * API: GET /api/v1/profile/preferences (docs/modules/08_user_profile.md mục 3.5.1, mục 5.2)
 * Lưu thay đổi: PUT /api/v1/profile/preferences (U12, M08 mục 3.5.2; chưa nối: hiện chỉ đổi store
 *   qua memberSession.setPreferences và áp giao diện). U12: áp ngay, chỉ gửi trường vừa đổi, đang gửi thì
 *   khóa điều khiển, lỗi thì hoàn tác + toast (khung A10, templates/admin/user-settings.js).
 * ============================================================
 *
 * Dữ liệu: store preferencesUser (window.memberSession.getPreferences). Guard của cổng đã nạp một lần khi vào cổng;
 * lần nạp đó lỗi (mạng, 503 bảo trì) thì store trống → màn hình tự gọi loadPreferences và hiện trạng thái
 * tải/lỗi + nút "Thử lại". Màn hình chỉ có điều khiển cho đúng 5 trường của response: theme, isSidebarCollapsed,
 * itemsPerPage, emailNotificationEnabled, soundAlertEnabled (không có dashboardWidgets).
 * Mock: ?maintenance=1 (503), ?prefsError=1 (lỗi mạng lần đầu), ?account=locked (401 → về login).
 */

document.addEventListener('DOMContentLoaded', () => {
    const session = window.memberSession;

    const loadState = document.getElementById('prefsLoadState');
    const loadMessage = document.getElementById('prefsLoadMessage');
    const btnRetry = document.getElementById('btnRetryPrefs');
    const layout = document.getElementById('settingsLayout');

    const themeInputs = document.querySelectorAll('input[name="theme"]');
    const sidebarInput = document.getElementById('prefSidebarCollapsed');
    const itemsPerPageSelect = document.getElementById('prefItemsPerPage');
    const emailInput = document.getElementById('prefEmailNotification');
    const soundInput = document.getElementById('prefSoundAlert');

    function notify(message, type = 'success') {
        if (typeof window.showToast === 'function') window.showToast(message, type);
    }

    // ---------- Thẻ tài khoản (store authUser) ----------
    function renderAccountCard() {
        const user = session.getAccount();
        document.querySelectorAll('[data-account]').forEach(el => {
            // data-account nhận đường dẫn có dấu chấm (vd. userGroup.name)
            const v = el.dataset.account.split('.').reduce((o, k) => (o == null ? o : o[k]), user);
            el.textContent = v == null ? '' : v;
        });
        const img = document.getElementById('settingsAvatarImg');
        if (img) {
            // Vue: component ảnh chữ cái đầu nội bộ khi avatarUrl = null (không gọi dịch vụ ngoài)
            img.src = user.avatarUrl ||
                'https://ui-avatars.com/api/?name=' + encodeURIComponent(user.fullName) + '&background=0033A0&color=fff&size=120';
            img.alt = user.fullName;
        }
    }

    // ---------- Đổ thiết lập vào điều khiển ----------
    function render(prefs) {
        themeInputs.forEach(input => { input.checked = input.value === prefs.theme; });
        sidebarInput.checked = prefs.isSidebarCollapsed;
        itemsPerPageSelect.value = String(prefs.itemsPerPage);
        emailInput.checked = prefs.emailNotificationEnabled;
        soundInput.checked = prefs.soundAlertEnabled;
    }

    // ---------- Tải dữ liệu ----------
    function showState(message, isError) {
        loadMessage.textContent = message;
        loadState.classList.toggle('is-error', !!isError);
        loadState.hidden = false;
        btnRetry.hidden = !isError;
        layout.hidden = true;
    }

    function showData(prefs) {
        loadState.hidden = true;
        layout.hidden = false;
        renderAccountCard();
        render(prefs);
    }

    function load() {
        // Vue: store đã có → đọc thẳng, không gọi API; trống → GET qua request()
        // (401 → refresh một lần rồi gửi lại, refresh 401 thì về đăng nhập; 503 → biểu ngữ bảo trì).
        if (session.hasPreferences()) { showData(session.getPreferences()); return; }
        showState('Đang tải thiết lập...', false);
        session.loadPreferences()
            .then(showData)
            .catch(err => {
                if (err && err.statusCode === 401) return; // đã chuyển về trang đăng nhập
                // 503: request() đã hiện biểu ngữ bảo trì; khối trạng thái hiện thông điệp của API + "Thử lại".
                showState(err && err.statusCode ? err.message : 'Không tải được thiết lập. Vui lòng thử lại.', true);
            });
    }

    btnRetry.addEventListener('click', load);

    // ---------- Thay đổi (U12 sẽ gọi PUT .../preferences chỉ trường vừa đổi; lỗi thì hoàn tác) ----------
    function change(patch, message) {
        render(session.setPreferences(patch));
        notify(message);
    }

    themeInputs.forEach(input => input.addEventListener('change', () => {
        if (input.checked) change({ theme: input.value }, 'Đã đổi chế độ giao diện.');
    }));
    sidebarInput.addEventListener('change', () =>
        change({ isSidebarCollapsed: sidebarInput.checked }, 'Đã cập nhật trạng thái menu mặc định.'));
    itemsPerPageSelect.addEventListener('change', () =>
        change({ itemsPerPage: Number(itemsPerPageSelect.value) }, `Hiển thị ${itemsPerPageSelect.value} bản ghi mỗi trang.`));
    emailInput.addEventListener('change', () =>
        change({ emailNotificationEnabled: emailInput.checked }, 'Đã cập nhật nhận email cảnh báo.'));
    soundInput.addEventListener('change', () =>
        change({ soundAlertEnabled: soundInput.checked }, 'Đã cập nhật âm thanh cảnh báo.'));

    // Nút đổi Sáng/Tối ở header cũng đổi store → đồng bộ lại các điều khiển
    window.addEventListener('preferences-changed', e => { if (!layout.hidden) render(e.detail); });

    // ---------- Điều hướng giữa các nhóm ----------
    const navButtons = document.querySelectorAll('.profile-nav-btn[data-section]');
    navButtons.forEach(btn => btn.addEventListener('click', () => {
        navButtons.forEach(b => b.classList.toggle('active', b === btn));
        const el = document.getElementById('section-' + btn.dataset.section);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));

    // Template tĩnh: main.js đã đặt store từ dữ liệu mẫu ở DOMContentLoaded (listener đăng ký trước) → không gọi API;
    // ?maintenance=1 hoặc ?prefsError=1 thì store trống → gọi API.
    load();
});
