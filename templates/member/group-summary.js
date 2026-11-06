// templates/member/group-summary.js – Thẻ tóm tắt nhóm của cổng Member (member.group-members, member.group-admin)
//
// GET /api/v1/user-groups/:id (G03, docs/modules/02_user_group.md mục 3.1.2), id = userGroup.id của
// memberSession.getAccount() (store authUser.user). Route User chỉ xem nhóm của người gọi: không có ô chọn/chuyển nhóm.
// Thẻ tải độc lập với danh bạ / bảng thành viên (trạng thái tải/lỗi + "Thử lại" riêng); 503 hiện thông điệp bảo trì
// trong thẻ (biểu ngữ do memberSession.request() hiện).
// Vue: component GroupSummaryCard dùng chung cho GroupMembersView, GroupAdminView; data giữ ở store của trang
// (useGroupDirectoryStore.group / useGroupAdminStore.group).
// Sau khi tải xong phát sự kiện `member-group-summary` { data } để trang dùng representative.id (nhãn "Đại diện").
// Kiểm tay mock: ?maintenance=1 (503), ?summaryError=1 (lỗi mạng một lần, "Thử lại" thành công),
// ?summaryGroup=<id> (gọi id khác nhóm mình → 403 FORBIDDEN_SCOPE_ACCESS), ?org=none (nhóm độc lập),
// ?ranges=none (chưa cấp dải), ?account=locked (401).
window.memberGroupSummary = (function () {
    const params = new URLSearchParams(window.location.search);
    const MOCK_MAINTENANCE = params.get('maintenance') === '1';
    const MOCK_ACCOUNT_LOCKED = params.get('account') === 'locked';
    const MOCK_STANDALONE = params.get('org') === 'none';
    const MOCK_NO_RANGES = params.get('ranges') === 'none';
    let mockNetworkError = params.get('summaryError') === '1';
    let seq = 0;
    let current = null;

    const now = () => new Date().toISOString().replace('Z', '+07:00');
    const fail = (statusCode, errorCode, message, errors) =>
        Promise.reject({ success: false, statusCode, errorCode, message, errors: errors || null, timestamp: now() });
    const esc = v => String(v == null ? '' : v)
        .replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const account = () => (window.memberSession ? window.memberSession.getAccount() : null);

    // Giả lập backend bản User. Thứ tự: token (401) → bảo trì (503) → :id/query (400) → kiểm tra tài khoản (401)
    // → phạm vi (:id khác nhóm của người gọi, kể cả id không tồn tại → 403 FORBIDDEN_SCOPE_ACCESS). Không có 404.
    // data đúng 15 trường: không có adminCount; admins = Quản trị viên nhóm ACTIVE, người đại diện đứng đầu.
    function mockGetMyGroupDetail(token, idParam, query) {
        return new Promise(resolve => setTimeout(resolve, 300)).then(() => {
            if (mockNetworkError) { mockNetworkError = false; return Promise.reject(new Error('Network Error')); }
            if (!token) return fail(401, 'UNAUTHORIZED', 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
            if (MOCK_MAINTENANCE) return fail(503, 'MAINTENANCE', 'Hệ thống đang bảo trì, vui lòng quay lại sau');
            const errors = {};
            const idStr = String(idParam);
            if (!/^[1-9][0-9]{0,9}$/.test(idStr) || Number(idStr) > 4294967295) errors.id = ['Mã nhóm không hợp lệ'];
            Object.keys(query || {}).forEach(k => { errors[k] = ['Tham số không được nhận']; });
            if (Object.keys(errors).length) return fail(400, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ', errors);
            if (MOCK_ACCOUNT_LOCKED) return fail(401, 'UNAUTHORIZED', 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
            const ug = account().userGroup; // backend: users.user_group_id đọc ở bước kiểm tra tài khoản
            if (Number(idStr) !== ug.id) {
                return fail(403, 'FORBIDDEN_SCOPE_ACCESS', 'Bạn không có quyền truy cập dữ liệu của nhóm người dùng khác');
            }
            const standalone = MOCK_STANDALONE || ug.organizationId === null;
            const ranges = MOCK_NO_RANGES ? [] : [
                { id: 21, prefix: '42', rangeFrom: '42000', rangeTo: '42499', totalNumbers: 500, note: 'Hạ tầng máy chủ & NOC' },
                { id: 22, prefix: '42', rangeFrom: '42500', rangeTo: '42999', totalNumbers: 500, note: null },
                { id: 23, prefix: '46', rangeFrom: '46000', rangeTo: '46999', totalNumbers: 1000, note: 'Cơ quan EVN Tháp A' }
            ];
            return {
                success: true, statusCode: 200, message: 'Lấy chi tiết nhóm người dùng thành công',
                data: {
                    id: ug.id,
                    code: 'UMO-IT',
                    name: ug.name,
                    description: 'Quản trị vận hành hạ tầng máy chủ, hệ thống mạng và giám sát tổng đài', // null khi chưa có
                    status: 'ACTIVE', // route User: nhóm INACTIVE đã bị chặn 401 ở kiểm tra tài khoản
                    allowRecordingAccess: ug.allowRecordingAccess,
                    organizationId: standalone ? null : ug.organizationId,
                    organizationName: standalone ? null : ug.organizationName,
                    hierarchyPath: standalone ? [] : ['Tổng công ty 71', ug.organizationName],
                    phonePrefixGroup: {
                        id: 10, code: 'PG-UMO-IT', name: 'Nhóm đầu số ' + ug.name,
                        prefixes: [...new Set(ranges.map(r => r.prefix))].sort(),
                        totalNumbers: ranges.reduce((s, r) => s + r.totalNumbers, 0),
                        ranges
                    },
                    userCount: 9,
                    representative: { id: 10, fullName: 'Trần Thị B', email: 'tran.b@71portal.vn', avatarUrl: null },
                    admins: [
                        { id: 10, fullName: 'Trần Thị B', email: 'tran.b@71portal.vn', phoneNumber: '0912.345.678', avatarUrl: null },
                        { id: 15, fullName: 'Lê Văn C', email: 'le.c@71portal.vn', phoneNumber: null, avatarUrl: null }
                    ],
                    createdAt: '2026-03-15T08:30:00+07:00',
                    updatedAt: '2026-10-02T16:20:00+07:00'
                },
                timestamp: now()
            };
        });
    }

    const callApi = fn => (window.memberSession ? window.memberSession.request(fn) : fn('mock-token'));

    function setState(state, message) {
        const box = document.getElementById('groupSummaryState');
        const msg = document.getElementById('groupSummaryMessage');
        const retry = document.getElementById('btnRetryGroupSummary');
        const content = document.getElementById('groupSummaryContent');
        if (box) { box.hidden = state === 'ready'; box.classList.toggle('is-error', state === 'error'); }
        if (msg) msg.textContent = message || '';
        if (retry) retry.hidden = state !== 'error';
        if (content) content.hidden = state !== 'ready';
    }

    function load() {
        const mySeq = ++seq;
        const acc = account();
        const groupId = params.get('summaryGroup') || (acc && acc.userGroup ? acc.userGroup.id : '');
        setState('loading', 'Đang tải thông tin nhóm...');
        return callApi(token => mockGetMyGroupDetail(token, String(groupId), {}))
            .then(res => {
                if (mySeq !== seq) return;
                current = res.data;
                render(res.data);
                setState('ready');
                window.dispatchEvent(new CustomEvent('member-group-summary', { detail: { data: res.data } }));
            })
            .catch(err => {
                if (mySeq !== seq) return;
                if (err && err.statusCode === 401) return; // request() đã chuyển về login
                // 503: request() đã hiện biểu ngữ bảo trì; thẻ vẫn hiện thông điệp + "Thử lại".
                setState('error', (err && err.statusCode && err.message) || 'Không tải được thông tin nhóm. Vui lòng thử lại.');
            });
    }

    // Vẽ từ data của GET /user-groups/:id; không dùng trường không có trong response.
    function render(data) {
        const setText = (id, text) => { const el = document.getElementById(id); if (el) el.textContent = text; };
        setText('heroGroupTitle', data.name);
        setText('heroGroupCode', data.code);
        setText('heroGroupDesc', data.description === null ? 'Chưa có mô tả' : data.description);
        const descEl = document.getElementById('heroGroupDesc');
        if (descEl) descEl.classList.toggle('text-muted', data.description === null);

        const breadcrumb = document.getElementById('groupHierarchyBreadcrumb');
        if (breadcrumb) {
            breadcrumb.innerHTML = data.hierarchyPath.length
                ? data.hierarchyPath.map((p, i) => `<span class="hierarchy-step">${esc(p)}</span>`
                    + (i < data.hierarchyPath.length - 1 ? '<span class="hierarchy-sep">›</span>' : '')).join('')
                : '<span class="standalone-group-pill">Nhóm độc lập (không gắn đơn vị tổ chức)</span>';
        }

        const ppg = data.phonePrefixGroup;
        const prefixEl = document.getElementById('heroPrefixBinding');
        if (prefixEl) {
            prefixEl.innerHTML = `
                <div class="prefix-ranges-box">
                    <div class="prefix-ranges-header">
                        <span class="prefix-group-badge" title="${esc(ppg.name)}">${esc(ppg.code)}</span>
                        <span class="prefix-total-nums">Tổng ${ppg.totalNumbers.toLocaleString('vi-VN')} số</span>
                    </div>
                    ${ppg.ranges.length ? `<div class="prefix-ranges-list">${ppg.ranges.map(r => `
                        <div class="prefix-range-item" title="${esc(r.rangeFrom)} – ${esc(r.rangeTo)}${r.note ? ' • ' + esc(r.note) : ''}">
                            <span class="range-text">
                                <span class="range-val">${esc(r.rangeFrom)}</span><span class="range-sep">-</span><span class="range-val">${esc(r.rangeTo)}</span>
                            </span>
                            <span class="range-pill">${r.totalNumbers.toLocaleString('vi-VN')} số</span>
                        </div>`).join('')}</div>`
                        : '<span class="text-muted" style="font-size: 0.8125rem;">Chưa cấp dải số</span>'}
                </div>`;
        }

        const repId = data.representative ? data.representative.id : null;
        const adminList = document.getElementById('heroAdminList');
        if (adminList) {
            adminList.innerHTML = data.admins.length
                ? `<div class="group-admin-cards-list">${data.admins.map(a => {
                    const isRep = a.id === repId;
                    const tel = a.phoneNumber ? a.phoneNumber.replace(/[^0-9+]/g, '') : '';
                    return `
                        <div class="group-admin-card-item ${isRep ? 'representative' : ''}">
                            <div class="admin-brief-header">
                                <div class="admin-brief-name-box">
                                    <strong class="admin-brief-name">${esc(a.fullName)}</strong>
                                    ${isRep ? '<span class="badge-admin-rep-mini" title="Người đại diện nhóm">★ Đại diện</span>' : ''}
                                </div>
                            </div>
                            <div class="admin-brief-phone-row">
                                <span class="admin-brief-phones">
                                    <a href="mailto:${esc(a.email)}" class="admin-brief-phone-link">${esc(a.email)}</a>
                                    ${a.phoneNumber ? `<span class="phone-sep">•</span><a href="tel:${esc(tel)}" class="admin-brief-phone-link">${esc(a.phoneNumber)}</a>` : ''}
                                </span>
                            </div>
                        </div>`;
                }).join('')}</div>`
                : '<span class="text-muted" style="font-size: 0.8125rem;">Chưa có Quản trị viên đang hoạt động</span>';
        }

        // Ô số liệu của thẻ: thành viên chưa ngừng hoạt động (userCount), Quản trị viên nhóm đang hoạt động (admins.length)
        setText('kpiTotalMembers', String(data.userCount));
        setText('kpiTotalAdmins', String(data.admins.length));
    }

    document.addEventListener('DOMContentLoaded', () => {
        const retry = document.getElementById('btnRetryGroupSummary');
        if (retry) retry.addEventListener('click', load);
        load();
    });

    return { load, getData: () => current, mockGetMyGroupDetail };
})();
