/**
 * ORG-PREFIX.JS - Xử lý dữ liệu Đầu số cấp phát cho Nhóm người dùng thành viên EVN CDR AS
 * Giao diện tinh gọn: chỉ tập trung vào Dải đầu số thuộc đơn vị, loại bỏ Người / Vị trí đặt máy / Phòng ban
 */

const STORAGE_PREFIX_GROUPS = 'evn_cdr_prefix_groups';
const STORAGE_USER_GROUPS = 'evn_cdr_user_groups';

let prefixGroups = [];
let userGroups = [];
let currentSelectedUgId = 'ug-evnict'; // Mặc định Tổ NOC EVNICT
let currentModalNumbersList = [];

document.addEventListener('DOMContentLoaded', () => {
    loadData();
    initUserGroupSwitcher();
    renderMemberView(currentSelectedUgId);

    window.switchUserGroup = switchUserGroup;
    window.openSimpleNumbersModal = openSimpleNumbersModal;
    window.filterSimpleNumbers = filterSimpleNumbers;
    window.closeModal = closeModal;
});

function loadData() {
    try {
        const storedGroups = localStorage.getItem(STORAGE_PREFIX_GROUPS);
        if (storedGroups) prefixGroups = JSON.parse(storedGroups);

        const storedUgs = localStorage.getItem(STORAGE_USER_GROUPS);
        if (storedUgs) userGroups = JSON.parse(storedUgs);
    } catch (e) {
        console.error('Lỗi tải dữ liệu LocalStorage:', e);
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

    // Đọc tham số từ URL nếu có (?ugId=... hoặc ?groupId=...)
    try {
        const urlParams = new URLSearchParams(window.location.search);
        const paramUg = urlParams.get('ugId');
        const paramPg = urlParams.get('groupId');
        if (paramUg && userGroups.some(u => u.id === paramUg)) {
            currentSelectedUgId = paramUg;
        } else if (paramPg) {
            const foundPg = prefixGroups.find(g => g.id === paramPg);
            if (foundPg && foundPg.userGroupId) {
                currentSelectedUgId = foundPg.userGroupId;
            }
        }
    } catch (e) {
        // Bỏ qua lỗi URLSearchParams nếu có
    }
}

function initUserGroupSwitcher() {
    const switcher = document.getElementById('userGroupSwitcher');
    if (!switcher) return;
    switcher.innerHTML = '';

    userGroups.forEach(ug => {
        const opt = document.createElement('option');
        opt.value = ug.id;
        opt.textContent = `${ug.name} (${ug.orgName})`;
        if (ug.id === currentSelectedUgId) opt.selected = true;
        switcher.appendChild(opt);
    });
}

function switchUserGroup(ugId) {
    currentSelectedUgId = ugId;
    renderMemberView(ugId);
}

function renderMemberView(ugId) {
    const userGroup = userGroups.find(u => u.id === ugId);
    if (!userGroup) return;

    // Tìm Nhóm đầu số được gán cho nhóm người dùng này (Quan hệ 1-1)
    const assignedGroup = prefixGroups.find(g => g.userGroupId === ugId);

    // Update Header
    document.getElementById('memberGroupName').innerText = userGroup.name;
    document.getElementById('memberBridgeOrgName').innerText = userGroup.orgName;
    const noticeEl = document.getElementById('cdrOwnerNotice');
    if (noticeEl) noticeEl.innerText = userGroup.name;

    const groupNameEl = document.getElementById('memberPrefixGroupName');
    const statusPill = document.getElementById('memberGroupStatusPill');

    const ranges = (assignedGroup && assignedGroup.ranges) ? assignedGroup.ranges : [];

    if (assignedGroup) {
        groupNameEl.innerText = assignedGroup.name;
        statusPill.style.display = 'inline-flex';
        statusPill.className = `status-pill ${assignedGroup.status === 'Đang dùng' ? 'active' : 'suspended'}`;
        statusPill.innerHTML = `<span class="status-dot"></span> ${assignedGroup.status}`;
    } else {
        groupNameEl.innerText = 'Chưa được cấp Nhóm đầu số';
        statusPill.style.display = 'inline-flex';
        statusPill.className = 'status-pill inactive';
        statusPill.innerHTML = `<span class="status-dot"></span> Chưa dùng (Chưa cấp phát)`;
    }

    // 3 Thống kê
    const totalNumbers = ranges.reduce((s, r) => s + r.count, 0);

    document.getElementById('statRangeCount').innerText = `${ranges.length} dải`;
    document.getElementById('statTotalNumbers').innerText = `${totalNumbers.toLocaleString('vi-VN')} số`;

    // Render Bảng Dải số tinh gọn
    renderRangesTable(ranges, assignedGroup ? assignedGroup.name : '');
}

function renderRangesTable(ranges, groupName = '') {
    const tbody = document.getElementById('memberRangesTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    if (!ranges || ranges.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="6" class="text-center text-muted" style="padding: 30px;">
                    Nhóm người dùng này hiện chưa được cấp phát dải đầu số nào.
                </td>
            </tr>
        `;
        return;
    }

    ranges.forEach(r => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <span class="range-chip" style="font-size: 0.95rem; padding: 6px 12px;">
                    ${r.from} ➔ ${r.to}
                </span>
            </td>
            <td style="text-align: center;">
                <span class="badge-count" style="font-size: 0.95rem; font-weight: 700;">
                    ${r.count.toLocaleString('vi-VN')} số
                </span>
            </td>
            <td>
                <span class="status-pill active">
                    <span class="status-dot"></span> Đang sử dụng
                </span>
            </td>
            <td>
                <span style="font-size: 0.85rem; color: var(--text-main); font-weight: 500;">
                    Từ ngày bàn giao đến nay
                </span>
            </td>
            <td>
                <span class="text-muted" style="font-size: 0.85rem;">
                    ${r.note || 'Đầu số nội bộ EVN'}
                </span>
            </td>
            <td class="col-actions" style="text-align: right; white-space: nowrap;">
                <div class="table-action-group" style="display: inline-flex; justify-content: flex-end; align-items: center; gap: 8px; flex-wrap: nowrap; white-space: nowrap;">
                    <button class="btn btn-sm btn-outline" style="padding: 4px 10px; font-size: 0.775rem; white-space: nowrap; flex-shrink: 0;" onclick="openSimpleNumbersModal('${r.from}', '${r.to}', ${r.count}, '${groupName.replace(/'/g, "\\'")}')" title="Xem các số trong dải">
                        Xem dải số
                    </button>
                    <a href="cdr-history.html" class="btn btn-sm btn-primary" style="padding: 4px 10px; font-size: 0.775rem; white-space: nowrap; flex-shrink: 0;" title="Tra cứu CDR của dải số này">
                        Tra cứu CDR
                    </a>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Modal xem danh sách số 5 số dạng Chip gọn gàng
function openSimpleNumbersModal(fromStr, toStr, count, groupName = '') {
    document.getElementById('simpleRangeTitle').innerText = `${fromStr} ➔ ${toStr}`;
    const groupNameEl = document.getElementById('simpleGroupNameTitle');
    if (groupNameEl) {
        groupNameEl.innerText = groupName || 'Nhóm đầu số EVN';
    }
    document.getElementById('simpleRangeTotalCount').innerText = count.toLocaleString('vi-VN');
    document.getElementById('simpleNumberSearch').value = '';

    const from = parseInt(fromStr, 10);
    const to = parseInt(toStr, 10);
    currentModalNumbersList = [];

    for (let i = from; i <= to; i++) {
        currentModalNumbersList.push(i.toString().padStart(5, '0'));
    }

    renderSimpleNumbersGrid(currentModalNumbersList);
    openModal('simpleNumbersModal');
}

function renderSimpleNumbersGrid(list) {
    const grid = document.getElementById('simpleNumbersGrid');
    grid.innerHTML = '';

    const displayList = list.slice(0, 300); // Hiển thị 300 số đầu để mượt DOM

    displayList.forEach(num => {
        const chip = document.createElement('span');
        chip.className = 'range-chip';
        chip.style.fontSize = '0.85rem';
        chip.style.padding = '4px 8px';
        chip.innerText = num;
        grid.appendChild(chip);
    });

    if (list.length > 300) {
        const moreNotice = document.createElement('div');
        moreNotice.style.width = '100%';
        moreNotice.style.textAlign = 'center';
        moreNotice.style.padding = '8px';
        moreNotice.style.fontSize = '0.8rem';
        moreNotice.style.color = 'var(--text-muted)';
        moreNotice.innerText = `Đang hiển thị 300 / ${list.length} số. Sử dụng ô tìm kiếm để tra cứu nhanh số cụ thể.`;
        grid.appendChild(moreNotice);
    }
}

function filterSimpleNumbers() {
    const term = (document.getElementById('simpleNumberSearch').value || '').trim();
    const filtered = currentModalNumbersList.filter(n => n.includes(term));
    renderSimpleNumbersGrid(filtered);
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
