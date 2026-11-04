/**
 * PREFIX-HISTORY.JS - Xử lý Nhật ký Kiểm toán Dải số & Quyền sở hữu Dữ liệu CDR EVN CDR AS
 * Truy vết chi tiết: Thời điểm -> Tình trạng trước -> Loại tác động -> Tình trạng sau -> Dải số -> Nhóm đầu số -> Nhóm người dùng -> Căn cứ & Chi tiết
 */

const STORAGE_HISTORY_LOGS = 'evn_cdr_prefix_history';
const STORAGE_HISTORY_VERSION = 'evn_cdr_history_version';
const CURRENT_HISTORY_VERSION = 'v2026.04_evn_history_v2';
const STORAGE_USER_GROUPS = 'evn_cdr_user_groups';

let historyLogs = [];
let userGroups = [];

// Dữ liệu mẫu chuẩn nghiệp vụ EVN thể hiện rõ biến động dải số, tình trạng trước/sau, nhóm người dùng và căn cứ pháp lý
const initialAuditLogs = [
    {
        id: 'log-001',
        timestamp: '15/03/2026 10:30',
        performedBy: 'Nguyễn Văn Quản trị (Admin)',
        statusBefore: 'Đang dùng',
        actionType: 'Thu hồi về kho',
        statusAfter: 'Kho tự do',
        rangeText: '15100 ➔ 15499',
        count: 400,
        prefixGroupName: 'Đầu số Nhà máy Nhiệt điện Ninh Bình',
        userGroupName: 'Tổ Vận hành Lò máy Nhiệt điện Ninh Bình',
        orgName: 'Công ty Cổ phần Nhiệt điện Ninh Bình',
        decisionNumber: 'QĐ 214/QĐ-EVN',
        note: 'Thu hồi dải số do chuyển đổi công nghệ tổ máy nhiệt điện than. Rã 400 số về kho số chung EVN.',
        cdrOwnership: 'Chốt quyền CDR của NM Nhiệt điện Ninh Bình đến 15/03/2026'
    },
    {
        id: 'log-002',
        timestamp: '01/03/2026 09:15',
        performedBy: 'Nguyễn Văn Quản trị (Admin)',
        statusBefore: 'Kho tự do',
        actionType: 'Cấp phát dải mới',
        statusAfter: 'Đang dùng',
        rangeText: '46500 ➔ 46999',
        count: 500,
        prefixGroupName: 'Đầu số Hạ tầng Viễn thông & Điều hành NOC EVNICT',
        userGroupName: 'Tổ Quản trị & Vận hành Hạ tầng Viễn thông NOC',
        orgName: 'Công ty Viễn thông Điện lực và CNTT (EVNICT)',
        decisionNumber: 'QĐ 1444/EVN-VT&CNTT',
        note: 'Tổ hợp 500 số rảnh từ kho số chung cấp mở rộng cho hạ tầng viễn thông và giám sát NOC EVNICT.',
        cdrOwnership: 'Từ 01/03/2026 đến nay (Dữ liệu CDR thuộc EVNICT NOC)'
    },
    {
        id: 'log-003',
        timestamp: '20/02/2026 15:40',
        performedBy: 'Lê Hoàng Kiểm toán (Auditor)',
        statusBefore: 'Đang dùng',
        actionType: 'Tạm ngưng',
        statusAfter: 'Tạm ngưng',
        rangeText: '98000 ➔ 98499',
        count: 500,
        prefixGroupName: 'Đầu số Dự phòng Chuyển giao Điều độ Quốc gia NSMO',
        userGroupName: 'Ban Chuẩn bị Chuyển giao Điều độ Quốc gia',
        orgName: 'Tập đoàn Điện lực Việt Nam',
        decisionNumber: 'TB 58/TB-EVN',
        note: 'Tạm ngưng dải số trong giai đoạn hoàn tất bàn giao kỹ thuật NSMO về Bộ Công Thương.',
        cdrOwnership: 'Tạm dừng định tuyến & ghi nhận lưu lượng CDR mới'
    },
    {
        id: 'log-004',
        timestamp: '10/02/2026 11:20',
        performedBy: 'Nguyễn Văn Quản trị (Admin)',
        statusBefore: 'Tạm ngưng',
        actionType: 'Kích hoạt lại',
        statusAfter: 'Đang dùng',
        rangeText: '31000 ➔ 31999',
        count: 1000,
        prefixGroupName: 'Đầu số Trung tâm Điều độ HTĐ Miền Nam (A2)',
        userGroupName: 'Phòng Điều độ Vận hành Hệ thống điện Miền Nam',
        orgName: 'Trung tâm Điều độ Hệ thống điện Quốc gia (NSMO)',
        decisionNumber: 'VB 889/NSMO-ĐĐ',
        note: 'Hoàn tất bảo dưỡng tổng đài VoIP nội bộ, kích hoạt lại toàn bộ thông tuyến thoại điều hành A2.',
        cdrOwnership: 'Tiếp tục ghi nhận lưu lượng CDR'
    },
    {
        id: 'log-005',
        timestamp: '01/02/2026 08:30',
        performedBy: 'Hệ thống Khởi tạo (System)',
        statusBefore: 'Chưa dùng',
        actionType: 'Gán nhóm (1-1)',
        statusAfter: 'Đang dùng',
        rangeText: '40000 ➔ 40999',
        count: 1000,
        prefixGroupName: 'Đầu số Cơ quan EVN - Cửa Bắc (Tháp B)',
        userGroupName: 'Văn phòng Cơ quan Tập đoàn EVN (Tháp B)',
        orgName: 'Tập đoàn Điện lực Việt Nam',
        decisionNumber: 'QĐ 01/QĐ-EVN',
        note: 'Gán nhóm đầu số độc lập cho Văn phòng Tập đoàn EVN, kích hoạt ghi nhận dữ liệu lưu lượng thoại CDR.',
        cdrOwnership: 'Từ 01/02/2026 đến nay (Dữ liệu CDR thuộc Văn phòng Cơ quan EVN)'
    },
    {
        id: 'log-006',
        timestamp: '25/01/2026 14:15',
        performedBy: 'Nguyễn Văn Quản trị (Admin)',
        statusBefore: 'Đang dùng',
        actionType: 'Hủy gán nhóm',
        statusAfter: 'Chưa dùng',
        rangeText: '49800 ➔ 49999',
        count: 200,
        prefixGroupName: 'Đầu số Giao dịch Thị trường Điện (EPTC)',
        userGroupName: 'Khối Quản lý Hợp đồng & Thị trường Điện EPTC',
        orgName: 'Công ty Mua bán điện (EVNEPTC)',
        decisionNumber: 'QĐ 78/EVNEPTC',
        note: 'Hủy gán nhóm người dùng để tái cơ cấu phòng ban giao dịch điện tử thoại.',
        cdrOwnership: 'Chốt quyền CDR của EPTC đến ngày 25/01/2026'
    },
    {
        id: 'log-007',
        timestamp: '15/01/2026 09:00',
        performedBy: 'Nguyễn Văn Quản trị (Admin)',
        statusBefore: 'Chưa dùng',
        actionType: 'Xóa nhóm đầu số',
        statusAfter: 'Đã xóa',
        rangeText: '79000 ➔ 79199',
        count: 200,
        prefixGroupName: 'Đầu số Dự phòng Thí nghiệm Điện EVNCPC',
        userGroupName: 'Chưa gán',
        orgName: 'Tổng công ty Điện lực Miền Trung (EVNCPC)',
        decisionNumber: 'QĐ 45/QĐ-CPC',
        note: 'Bãi bỏ nhóm đầu số không còn quy hoạch sử dụng, 200 số tự động thu hồi về kho số chung EVN.',
        cdrOwnership: 'Giải phóng dải số về kho tự do'
    },
    {
        id: 'log-008',
        timestamp: '05/01/2026 16:20',
        performedBy: 'Nguyễn Văn Quản trị (Admin)',
        statusBefore: 'Kho tự do',
        actionType: 'Cấp phát dải mới',
        statusAfter: 'Đang dùng',
        rangeText: '11000 ➔ 11999',
        count: 1000,
        prefixGroupName: 'Đầu số Nhà máy Thủy điện Hòa Bình',
        userGroupName: 'Tổ Trực ban Vận hành Nhà máy Thủy điện Hòa Bình',
        orgName: 'Công ty Thủy điện Hòa Bình',
        decisionNumber: 'QĐ 12/EVN-KT',
        note: 'Phân bổ dải 1000 số phục vụ nâng cấp hệ thống tổng đài PABX kỹ thuật số Thủy điện Hòa Bình.',
        cdrOwnership: 'Từ 05/01/2026 đến nay (Dữ liệu CDR thuộc Thủy điện Hòa Bình)'
    }
];

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initFilters();
    renderHistoryTable();

    window.filterHistory = filterHistory;
    window.openTimelineModal = openTimelineModal;
    window.exportHistoryCSV = exportHistoryCSV;
    window.closeModal = closeModal;
});

function loadData() {
    try {
        const version = localStorage.getItem(STORAGE_HISTORY_VERSION);
        const storedLogs = localStorage.getItem(STORAGE_HISTORY_LOGS);

        if (version === CURRENT_HISTORY_VERSION && storedLogs) {
            historyLogs = JSON.parse(storedLogs);
        } else {
            // Nâng cấp dữ liệu mẫu phiên bản mới (hỗ trợ Tình trạng trước / sau)
            historyLogs = [...initialAuditLogs];
            localStorage.setItem(STORAGE_HISTORY_LOGS, JSON.stringify(historyLogs));
            localStorage.setItem(STORAGE_HISTORY_VERSION, CURRENT_HISTORY_VERSION);
        }

        const storedUgs = localStorage.getItem(STORAGE_USER_GROUPS);
        if (storedUgs) userGroups = JSON.parse(storedUgs);
    } catch (e) {
        historyLogs = [...initialAuditLogs];
    }

    if (!userGroups || userGroups.length === 0) {
        userGroups = [
            { id: 'ug-evn-b', name: 'Văn phòng Cơ quan Tập đoàn EVN (Tháp B)', orgName: 'Tập đoàn Điện lực Việt Nam' },
            { id: 'ug-evnict', name: 'Tổ Quản trị & Vận hành Hạ tầng Viễn thông NOC', orgName: 'Công ty Viễn thông Điện lực và CNTT (EVNICT)' },
            { id: 'ug-a2', name: 'Phòng Điều độ Vận hành Hệ thống điện Miền Nam', orgName: 'Trung tâm Điều độ Hệ thống điện Quốc gia (NSMO)' },
            { id: 'ug-a3', name: 'Phòng Điều độ Vận hành Hệ thống điện Miền Trung', orgName: 'Trung tâm Điều độ Hệ thống điện Quốc gia (NSMO)' },
            { id: 'ug-eptc', name: 'Khối Quản lý Hợp đồng & Thị trường Điện EPTC', orgName: 'Công ty Mua bán điện (EVNEPTC)' },
            { id: 'ug-ialy', name: 'Phân xưởng Vận hành Trạm & Thủy công Ialy', orgName: 'Công ty Thủy điện Ialy' },
            { id: 'ug-hoabinh', name: 'Tổ Trực ban Vận hành Nhà máy Thủy điện Hòa Bình', orgName: 'Công ty Thủy điện Hòa Bình' },
            { id: 'ug-uongbi', name: 'Phòng Kỹ thuật & Điều hành Sản xuất Uông Bí', orgName: 'Công ty Nhiệt điện Uông Bí' },
            { id: 'ug-phalai', name: 'Khối Kỹ thuật & Công nghệ Nhiệt điện Phả Lại', orgName: 'Công ty Cổ phần Nhiệt điện Phả Lại' },
            { id: 'ug-trian', name: 'Tổ Trực ban Vận hành NM Thủy điện Trị An', orgName: 'Công ty Thủy điện Trị An' },
            { id: 'ug-t500-hb', name: 'Tổ Vận hành Trạm 500kV Hòa Bình', orgName: 'Công ty Truyền tải điện 1 (PTC1)' },
            { id: 'ug-t500-pl', name: 'Tổ Trực ban Trạm 500kV Phú Lâm', orgName: 'Công ty Truyền tải điện 4 (PTC4)' },
            { id: 'ug-t500-dng', name: 'Đội Vận hành Trạm 500kV Đà Nẵng', orgName: 'Công ty Truyền tải điện 2 (PTC2)' },
            { id: 'ug-t500-pleiku', name: 'Đội Vận hành Trạm 500kV Pleiku', orgName: 'Công ty Truyền tải điện 3 (PTC3)' },
            { id: 'ug-cpc', name: 'Khối Điều hành Lưới điện Phân phối EVNCPC', orgName: 'Tổng công ty Điện lực Miền Trung (EVNCPC)' },
            { id: 'ug-evnhanoi', name: 'Trung tâm Điều khiển Hệ thống điện Hà Nội', orgName: 'Tổng công ty Điện lực TP. Hà Nội (EVNHANOI)' },
            { id: 'ug-evnspc', name: 'Trung tâm Chăm sóc Khách hàng EVNSPC', orgName: 'Tổng công ty Điện lực Miền Nam (EVNSPC)' },
            { id: 'ug-ptc4', name: 'Phòng Viễn thông & CNTT TTĐ4', orgName: 'Công ty Truyền tải điện 4 (PTC4)' },
            { id: 'ug-ninhbinh', name: 'Tổ Vận hành Lò máy Nhiệt điện Ninh Bình', orgName: 'Công ty Cổ phần Nhiệt điện Ninh Bình' },
            { id: 'ug-nsmo-trans', name: 'Ban Chuẩn bị Chuyển giao Điều độ Quốc gia', orgName: 'Tập đoàn Điện lực Việt Nam' }
        ];
    }
}

function initFilters() {
    const userGroupSelect = document.getElementById('histUserGroupFilter');
    if (!userGroupSelect) return;
    userGroupSelect.innerHTML = '<option value="all">Tất cả nhóm người dùng</option>';

    userGroups.forEach(ug => {
        const opt = document.createElement('option');
        opt.value = ug.name;
        opt.textContent = `${ug.name} (${ug.orgName})`;
        userGroupSelect.appendChild(opt);
    });

    const totalLogsEl = document.getElementById('auditTotalLogs');
    if (totalLogsEl) totalLogsEl.innerText = historyLogs.length;
}

function getStatusPillHtml(status) {
    if (!status || status === '-') return '<span class="text-muted">-</span>';
    let pillClass = 'inactive';
    if (status === 'Đang dùng' || status === 'Đang sử dụng') pillClass = 'active';
    else if (status === 'Tạm ngưng') pillClass = 'suspended';
    else if (status === 'Kho tự do' || status === 'Tự do') pillClass = 'free';
    else if (status === 'Chưa dùng') pillClass = 'inactive';
    else if (status === 'Đã xóa' || status === 'Đã thu hồi') pillClass = 'deleted';

    return `<span class="status-pill ${pillClass}"><span class="status-dot"></span> ${status}</span>`;
}

function getActionBadgeHtml(actionType) {
    let badgeClass = 'allocate';
    if (actionType.includes('Thu hồi')) {
        badgeClass = 'revoke-full';
    } else if (actionType.includes('Gán')) {
        badgeClass = 'assign';
    } else if (actionType.includes('Hủy gán')) {
        badgeClass = 'unassign';
    } else if (actionType.includes('Tạm ngưng')) {
        badgeClass = 'suspend';
    } else if (actionType.includes('Kích hoạt')) {
        badgeClass = 'allocate';
    } else if (actionType.includes('Xóa')) {
        badgeClass = 'delete';
    }
    return `<span class="action-badge ${badgeClass}">${actionType}</span>`;
}

function renderHistoryTable(data = null) {
    const logs = data || historyLogs;
    const tbody = document.getElementById('historyTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const elShown = document.getElementById('histShownCount');
    const elTotal = document.getElementById('histTotalRecords');
    if (elShown) elShown.innerText = logs.length;
    if (elTotal) elTotal.innerText = historyLogs.length;

    if (logs.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding: 30px;">Không tìm thấy dữ liệu kiểm toán nào phù hợp với bộ lọc.</td></tr>`;
        return;
    }

    logs.forEach(log => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <!-- 1. Thời điểm - Thực hiện (20%) -->
            <td style="width: 20%;">
                <div class="fw-600 text-main" style="font-size: 0.85rem;">${log.timestamp}</div>
                <div class="text-xs text-muted" style="margin-top: 2px;">${log.performedBy || 'Admin'}</div>
            </td>

            <!-- 2. Loại tác động (16%) -->
            <td style="width: 16%;">
                ${getActionBadgeHtml(log.actionType)}
            </td>

            <!-- 3. Dải số (20%) -->
            <td style="width: 20%;">
                <div class="range-chip" style="font-size: 0.85rem;">
                    ${log.rangeText || '-'}
                </div>
                <div class="text-xs text-muted mt-1">Số lượng: <strong>${(log.count || 0).toLocaleString('vi-VN')} số</strong></div>
            </td>

            <!-- 4. Nhóm đầu số (26%) -->
            <td style="width: 26%;">
                <div class="fw-600 text-main" style="font-size: 0.9rem;">${log.prefixGroupName}</div>
            </td>

            <!-- 5. Căn cứ & Chi tiết (18%, text-align: right) -->
            <td style="width: 18%; text-align: right;">
                <div style="display: flex; justify-content: flex-end; align-items: center; gap: 8px;">
                    ${log.decisionNumber ? `<span class="badge-decision" style="font-size: 0.75rem; background: var(--bg-color); border: 1px solid var(--border); padding: 2px 7px; border-radius: 4px; font-weight: 500; color: var(--text-muted);" title="${log.note || ''}">${log.decisionNumber}</span>` : ''}
                    <button class="btn btn-sm btn-outline" style="padding: 4px 10px; font-size: 0.775rem; white-space: nowrap;" onclick="openTimelineModal('${log.id}')" title="Xem chi tiết biến động trạng thái & nhóm người dùng">
                        Chi tiết
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

function filterHistory() {
    const term = (document.getElementById('histNumberSearch').value || '').trim().toLowerCase();
    const ugVal = document.getElementById('histUserGroupFilter').value;
    const actionVal = document.getElementById('histActionFilter').value;
    const dateFromVal = document.getElementById('histDateFrom').value;

    const filtered = historyLogs.filter(log => {
        // Tìm theo số hoặc tên
        const matchTerm = !term ||
            (log.rangeText && log.rangeText.toLowerCase().includes(term)) ||
            (log.prefixGroupName && log.prefixGroupName.toLowerCase().includes(term)) ||
            (log.userGroupName && log.userGroupName.toLowerCase().includes(term)) ||
            (log.decisionNumber && log.decisionNumber.toLowerCase().includes(term)) ||
            (log.note && log.note.toLowerCase().includes(term));

        // Nhóm người dùng
        const matchUg = (ugVal === 'all') || (log.userGroupName === ugVal);

        // Loại hành động
        const matchAction = (actionVal === 'all') || (log.actionType === actionVal);

        // Ngày bắt đầu
        let matchDate = true;
        if (dateFromVal) {
            // Giả định định dạng log là DD/MM/YYYY HH:mm
            const parts = log.timestamp.split(' ')[0].split('/');
            if (parts.length === 3) {
                const logDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
                matchDate = (logDate >= dateFromVal);
            }
        }

        return matchTerm && matchUg && matchAction && matchDate;
    });

    renderHistoryTable(filtered);
}

function openTimelineModal(logId) {
    const log = historyLogs.find(l => l.id === logId);
    if (!log) return;

    const body = document.getElementById('timelineModalBody');
    body.innerHTML = `
        <!-- Thẻ tóm tắt thông tin đầu số & giao dịch -->
        <div style="background: var(--bg-color); border: 1px solid var(--border); border-radius: 8px; padding: 16px; margin-bottom: 16px;">
            <div class="d-flex-between mb-2">
                <span class="text-xs text-muted">Mã giao dịch kiểm toán: <strong style="color:var(--text-main);">${log.id}</strong></span>
                <div>${getActionBadgeHtml(log.actionType)}</div>
            </div>
            <h3 style="margin: 0 0 6px 0; font-size: 1.2rem; color: var(--text-main); font-weight: 700;">${log.prefixGroupName}</h3>
            <div style="display: flex; gap: 16px; font-size: 0.85rem; color: var(--text-muted); flex-wrap: wrap;">
                <span>Dải số: <strong style="color:var(--primary); font-family: monospace;">${log.rangeText || '-'}</strong></span>
                <span>Dung lượng: <strong>${(log.count || 0).toLocaleString('vi-VN')} số</strong></span>
            </div>
        </div>

        <!-- Khối 1: BIẾN ĐỘNG TÌNH TRẠNG (Tình trạng trước ➔ Tình trạng sau) -->
        <div style="background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 14px 16px; margin-bottom: 16px;">
            <div class="text-xs fw-700 text-muted mb-2" style="letter-spacing: 0.5px; text-transform: uppercase;">
                Biến động tình trạng nhóm đầu số
            </div>
            <div style="display: flex; align-items: center; gap: 16px; flex-wrap: wrap;">
                <div style="flex: 1; min-width: 160px; background: var(--bg-color); border: 1px dashed var(--border); border-radius: 6px; padding: 10px 14px;">
                    <div class="text-xs text-muted mb-1" style="font-weight: 500;">Tình trạng trước tác động:</div>
                    <div>${getStatusPillHtml(log.statusBefore || 'Chưa dùng')}</div>
                </div>
                <div style="color: var(--primary); font-size: 1.25rem; font-weight: 700; display: flex; align-items: center;">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                </div>
                <div style="flex: 1; min-width: 160px; background: var(--bg-color); border: 1px solid var(--border); border-radius: 6px; padding: 10px 14px;">
                    <div class="text-xs text-muted mb-1" style="font-weight: 500;">Tình trạng sau tác động:</div>
                    <div>${getStatusPillHtml(log.statusAfter || 'Đang dùng')}</div>
                </div>
            </div>
        </div>

        <!-- Khối 2: NHÓM NGƯỜI DÙNG THÀNH VIÊN LIÊN KẾT & PHÂN ĐỊNH CDR -->
        <div style="background: var(--surface); border: 1px solid var(--border); border-radius: 8px; padding: 14px 16px; margin-bottom: 16px;">
            <div class="text-xs fw-700 text-muted mb-2" style="letter-spacing: 0.5px; text-transform: uppercase;">
                Nhóm người dùng thành viên tiếp nhận & Quyền CDR
            </div>
            <div style="display: flex; align-items: flex-start; gap: 12px;">
                <div style="padding: 8px; background: rgba(0,51,160,0.08); border-radius: 8px; color: var(--primary); margin-top: 2px;">
                    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                </div>
                <div style="flex: 1;">
                    <div class="fw-700 text-main" style="font-size: 0.95rem;">${log.userGroupName || 'Chưa gán nhóm người dùng'}</div>
                    <div class="text-xs text-muted mt-1" style="display: flex; align-items: center; gap: 6px;">
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
                        Đơn vị trực thuộc (bắc cầu): <strong style="color: var(--text-main);">${log.orgName || 'Tập đoàn Điện lực Việt Nam'}</strong>
                    </div>
                    <div style="margin-top: 10px; padding: 8px 12px; background: rgba(0,51,160,0.05); border-left: 3px solid var(--primary); border-radius: 4px; font-size: 0.825rem;">
                        <span class="text-muted">Mốc phân định quyền sở hữu dữ liệu CDR:</span><br>
                        <strong style="color: var(--primary); font-size: 0.875rem;">${log.cdrOwnership || 'Không có ghi nhận mốc CDR'}</strong>
                    </div>
                </div>
            </div>
        </div>

        <!-- Khối 3: CĂN CỨ PHÁP LÝ & GHI CHÚ QUẢN TRỊ -->
        <div class="form-group mb-3">
            <label class="text-xs fw-700 text-muted d-block mb-1" style="letter-spacing: 0.5px; text-transform: uppercase;">Căn cứ pháp lý & Ghi chú kiểm toán</label>
            <div style="font-size: 0.875rem; color: var(--text-main); background: var(--surface); padding: 12px 14px; border: 1px solid var(--border); border-radius: 6px; line-height: 1.6;">
                ${log.decisionNumber ? `<span style="background: rgba(0,51,160,0.1); color: var(--primary); font-weight: 700; padding: 2px 8px; border-radius: 4px; margin-right: 6px;">${log.decisionNumber}</span>` : ''}
                ${log.note || 'Không có ghi chú thêm'}
            </div>
        </div>

        <!-- Khối 4: THỜI GIAN & NGƯỜI THỰC HIỆN -->
        <div style="display: flex; justify-content: space-between; align-items: center; font-size: 0.825rem; color: var(--text-muted); padding-top: 12px; border-top: 1px solid var(--border);">
            <span>Thời gian ghi nhận: <strong style="color: var(--text-main);">${log.timestamp}</strong></span>
            <span>Thực hiện bởi: <strong style="color: var(--text-main);">${log.performedBy}</strong></span>
        </div>
    `;

    openModal('timelineModal');
}

function exportHistoryCSV() {
    if (!historyLogs || historyLogs.length === 0) {
        showGlobalNotification('Không có dữ liệu lịch sử để xuất.', 'warning');
        return;
    }

    let csv = '\uFEFFMã GD,Thời điểm,Người thực hiện,Tình trạng trước,Loại tác động,Tình trạng sau,Dải số,Số lượng,Nhóm đầu số,Nhóm người dùng,Đơn vị bắc cầu,Căn cứ,Ghi chú,Quyền sở hữu CDR\n';
    historyLogs.forEach(l => {
        csv += `"${l.id}","${l.timestamp}","${l.performedBy}","${l.statusBefore || ''}","${l.actionType}","${l.statusAfter || ''}","${l.rangeText}","${l.count}","${l.prefixGroupName}","${l.userGroupName}","${l.orgName}","${l.decisionNumber || ''}","${l.note || ''}","${l.cdrOwnership || ''}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `lich_su_cap_phat_dai_so_evn_${Date.now()}.csv`;
    link.click();

    showGlobalNotification('Xuất báo cáo kiểm toán CSV thành công!', 'success');
}

// Modal Utility
function openModal(id) {
    const modal = document.getElementById(id);
    const overlay = document.getElementById('mobileOverlay');
    if (modal) modal.classList.add('show');
    if (overlay) overlay.classList.add('show');
}

function closeModal(id) {
    const modal = document.getElementById(id);
    const overlay = document.getElementById('mobileOverlay');
    if (modal) modal.classList.remove('show');
    if (overlay) overlay.classList.remove('show');
}
