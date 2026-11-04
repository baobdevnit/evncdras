/**
 * ============================================================
 * PAGE: Cài đặt tài khoản Admin (AccountSettingsView, /admin/account-settings)
 * File: templates/admin/user-settings.js
 * API: GET /api/v1/admin/profile/preferences (docs/modules/09_admin_profile.md mục 3.6, mục 5.2)
 * Lưu thay đổi: PUT /api/v1/admin/profile/preferences (A10, chưa nối: hiện chỉ đổi store và áp giao diện)
 * ============================================================
 *
 * Dữ liệu: store preferencesAdmin (window.adminSession.getPreferences). Guard của cổng đã nạp một lần khi vào cổng;
 * nếu lần nạp đó lỗi thì màn hình tự gọi loadPreferences(true) và hiện trạng thái tải/lỗi + nút "Thử lại".
 * Màn hình chỉ có điều khiển cho đúng 6 trường của response: theme, isSidebarCollapsed, itemsPerPage,
 * emailNotificationEnabled, soundAlertEnabled, dashboardWidgets.
 */

document.addEventListener('DOMContentLoaded', () => {
    const session = window.adminSession;

    // Nhãn tiếng Việt của 6 widget (M09 mục 5.2); key cố định theo M09 mục 1.1
    const WIDGET_LABELS = {
        kpiCards: 'Thẻ KPI toàn hệ thống',
        poolWidget: 'Kho số chung',
        quantityChart: 'Biểu đồ số lượng cuộc gọi',
        qualityChart: 'Biểu đồ chất lượng cuộc gọi',
        topGroupsChart: 'Top nhóm theo lưu lượng',
        groupMonitorTable: 'Bảng giám sát nhóm'
    };

    const loadState = document.getElementById('prefsLoadState');
    const loadMessage = document.getElementById('prefsLoadMessage');
    const btnRetry = document.getElementById('btnRetryPrefs');
    const layout = document.getElementById('settingsLayout');

    const themeInputs = document.querySelectorAll('input[name="theme"]');
    const sidebarInput = document.getElementById('prefSidebarCollapsed');
    const itemsPerPageSelect = document.getElementById('prefItemsPerPage');
    const emailInput = document.getElementById('prefEmailNotification');
    const soundInput = document.getElementById('prefSoundAlert');
    const widgetList = document.getElementById('dashboardWidgetList');

    function notify(message, type = 'success') {
        if (typeof window.showToast === 'function') window.showToast(message, type);
    }

    // ---------- Thẻ tài khoản (store authAdmin) ----------
    function renderAccountCard() {
        const admin = session.getAccount();
        document.querySelectorAll('[data-account]').forEach(el => {
            el.textContent = admin[el.getAttribute('data-account')] || '';
        });
        const img = document.getElementById('settingsAvatarImg');
        if (img) {
            // Vue: component ảnh chữ cái đầu nội bộ khi avatarUrl = null (không gọi dịch vụ ngoài)
            img.src = admin.avatarUrl ||
                'https://ui-avatars.com/api/?name=' + encodeURIComponent(admin.fullName) + '&background=0033A0&color=fff&size=120';
            img.alt = admin.fullName;
        }
    }

    // ---------- Đổ thiết lập vào điều khiển ----------
    function render(prefs) {
        themeInputs.forEach(input => { input.checked = input.value === prefs.theme; });
        sidebarInput.checked = prefs.isSidebarCollapsed;
        itemsPerPageSelect.value = String(prefs.itemsPerPage);
        emailInput.checked = prefs.emailNotificationEnabled;
        soundInput.checked = prefs.soundAlertEnabled;
        renderWidgets(prefs.dashboardWidgets);
    }

    // dashboardWidgets: backend đã chuẩn hóa đủ 6 phần tử, order 1…6; chỉ cần sắp theo order
    function renderWidgets(widgets) {
        const sorted = widgets.slice().sort((a, b) => a.order - b.order);
        widgetList.innerHTML = '';
        sorted.forEach((w, i) => {
            const li = document.createElement('li');
            li.className = 'widget-item' + (w.visible ? '' : ' is-hidden');
            li.dataset.key = w.key;
            li.innerHTML = `
                <span class="widget-order">${w.order}</span>
                <span class="widget-name"></span>
                <span class="widget-actions">
                    <button type="button" class="btn-icon" data-move="-1" title="Lên trên" aria-label="Đưa lên trên" ${i === 0 ? 'disabled' : ''}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="18 15 12 9 6 15"></polyline></svg>
                    </button>
                    <button type="button" class="btn-icon" data-move="1" title="Xuống dưới" aria-label="Đưa xuống dưới" ${i === sorted.length - 1 ? 'disabled' : ''}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                    </button>
                    <label class="toggle-switch">
                        <input type="checkbox" data-visible ${w.visible ? 'checked' : ''}>
                        <span class="toggle-slider"></span>
                    </label>
                </span>`;
            const label = WIDGET_LABELS[w.key] || w.key;
            li.querySelector('.widget-name').textContent = label;
            li.querySelector('input[data-visible]').setAttribute('aria-label', 'Hiện ' + label);
            widgetList.appendChild(li);
        });
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

    function load(force) {
        showState('Đang tải thiết lập...', false);
        // Vue: store đã có → đọc thẳng; trống → GET (request() tự refresh khi 401, refresh 401 thì về đăng nhập)
        session.loadPreferences(force)
            .then(showData)
            .catch(err => {
                if (err && err.statusCode === 401) return; // đã chuyển về trang đăng nhập
                showState((err && err.message) || 'Không tải được thiết lập. Vui lòng thử lại.', true);
            });
    }

    btnRetry.addEventListener('click', () => load(true));

    // ---------- Thay đổi (A10 sẽ gọi PUT trước rồi mới cập nhật store; lỗi thì trả điều khiển về giá trị cũ) ----------
    function change(patch, message) {
        const prefs = session.setPreferences(patch);
        render(prefs);
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

    // Ẩn/hiện, lên/xuống: luôn gửi đủ 6 phần tử, order đánh lại 1…6
    widgetList.addEventListener('click', e => {
        const btn = e.target.closest('button[data-move]');
        if (!btn) return;
        const widgets = session.getPreferences().dashboardWidgets.sort((a, b) => a.order - b.order);
        const from = widgets.findIndex(w => w.key === btn.closest('.widget-item').dataset.key);
        const to = from + Number(btn.dataset.move);
        if (from < 0 || to < 0 || to >= widgets.length) return;
        const [moved] = widgets.splice(from, 1);
        widgets.splice(to, 0, moved);
        widgets.forEach((w, i) => { w.order = i + 1; });
        change({ dashboardWidgets: widgets }, 'Đã đổi thứ tự khối Dashboard.');
    });
    widgetList.addEventListener('change', e => {
        if (!e.target.matches('input[data-visible]')) return;
        const key = e.target.closest('.widget-item').dataset.key;
        const widgets = session.getPreferences().dashboardWidgets
            .map(w => w.key === key ? Object.assign(w, { visible: e.target.checked }) : w);
        change({ dashboardWidgets: widgets }, e.target.checked ? 'Đã hiện khối trên Dashboard.' : 'Đã ẩn khối trên Dashboard.');
    });

    // Nút đổi Sáng/Tối ở header cũng đổi store → đồng bộ lại các điều khiển
    window.addEventListener('preferences-changed', e => { if (!layout.hidden) render(e.detail); });

    // ---------- Điều hướng giữa các nhóm ----------
    const navButtons = document.querySelectorAll('.profile-nav-btn[data-section]');
    navButtons.forEach(btn => btn.addEventListener('click', () => {
        navButtons.forEach(b => b.classList.toggle('active', b === btn));
        const el = document.getElementById('section-' + btn.dataset.section);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));

    // Template tĩnh: main.js đã đặt store từ dữ liệu mẫu ở DOMContentLoaded (listener đăng ký trước) → không gọi API.
    load(false);
});
