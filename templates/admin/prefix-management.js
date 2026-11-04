/**
 * QUẢN LÝ ĐẦU SỐ & DẢI SỐ TỔNG ĐÀI NỘI BỘ (5 CHỮ SỐ) - EVN CDR AS
 * Tuân thủ quy hoạch 5 số, mô hình phân cấp Nhóm đầu số -> Nhóm người dùng thành viên -> Đơn vị bắc cầu (1-1)
 * Hỗ trợ kho số chung rã số lẻ, thu hồi tách dải 1 phần và bảo toàn CDR theo thời gian
 */

// Key lưu trữ LocalStorage để đồng bộ giữa các trang (Quản lý, Thành viên, Lịch sử)
const STORAGE_PREFIX_GROUPS = 'evn_cdr_prefix_groups';
const STORAGE_USER_GROUPS = 'evn_cdr_user_groups';
const STORAGE_HISTORY_LOGS = 'evn_cdr_prefix_history';
const STORAGE_CATALOG_VERSION = 'evn_cdr_catalog_version';
const CURRENT_CATALOG_VERSION = 'v2026.04_evn_pabx_catalog';

// Danh mục 20 Nhóm người dùng thành viên theo Đơn vị tổ chức chuẩn EVN
const initialUserGroups = [
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

// Danh mục 23 Nhóm đầu số đại diện cho 10 Khối dải số EVN PABX
const initialPrefixGroups = [
    {
        id: 'pg-1',
        name: 'Đầu số Cơ quan EVN - Cửa Bắc (Tháp B)',
        description: 'Tổng đài MX1 phục vụ Cơ quan Tập đoàn EVN tại 11 Cửa Bắc, Ba Đình, Hà Nội',
        status: 'Đang dùng',
        userGroupId: 'ug-evn-b',
        ranges: [
            { id: 'r-1', from: '40000', to: '40999', count: 1000, note: 'Cơ quan Tập đoàn EVN - Tháp B' }
        ]
    },
    {
        id: 'pg-2',
        name: 'Đầu số Hạ tầng Viễn thông & Điều hành NOC EVNICT',
        description: 'Tổng đài điều hành mạng viễn thông dùng riêng và CNTT tòa nhà Tháp A EVN',
        status: 'Đang dùng',
        userGroupId: 'ug-evnict',
        ranges: [
            { id: 'r-2a', from: '46000', to: '46499', count: 500, note: 'Cơ quan EVN Tháp A (NOC)' },
            { id: 'r-2b', from: '46500', to: '46999', count: 500, note: 'Dự phòng Hạ tầng EVNICT' }
        ]
    },
    {
        id: 'pg-3',
        name: 'Đầu số Điều độ Hệ thống điện Miền Nam (A2)',
        description: 'Phục vụ trực ca điều độ vận hành hệ thống điện khu vực phía Nam',
        status: 'Đang dùng',
        userGroupId: 'ug-a2',
        ranges: [
            { id: 'r-3', from: '42000', to: '42299', count: 300, note: 'Bàn trực Điều độ viên A2' }
        ]
    },
    {
        id: 'pg-4',
        name: 'Đầu số Điều độ Hệ thống điện Miền Trung (A3)',
        description: 'Phục vụ trực ca điều độ vận hành lưới truyền tải và phân phối miền Trung',
        status: 'Đang dùng',
        userGroupId: 'ug-a3',
        ranges: [
            { id: 'r-4', from: '43100', to: '43399', count: 300, note: 'Phòng Điều hành SCADA/EMS A3' }
        ]
    },
    {
        id: 'pg-5',
        name: 'Đầu số Giao dịch Thị trường Điện (EPTC)',
        description: 'Phục vụ đàm phán hợp đồng mua bán điện và đối soát thanh toán thị trường điện',
        status: 'Đang dùng',
        userGroupId: 'ug-eptc',
        ranges: [
            { id: 'r-5', from: '49800', to: '49999', count: 200, note: 'Bàn giao dịch viên Thị trường EPTC' }
        ]
    },
    {
        id: 'pg-6',
        name: 'Đầu số Nhà máy Thủy điện Ialy',
        description: 'Thông tin vận hành công trình ngầm, gian máy và đập tràn Ialy Gia Lai',
        status: 'Đang dùng',
        userGroupId: 'ug-ialy',
        ranges: [
            { id: 'r-6', from: '13100', to: '13699', count: 600, note: 'Vị trí máy ngầm và trạm điều khiển Ialy' }
        ]
    },
    {
        id: 'pg-7',
        name: 'Đầu số Nhà máy Thủy điện Hòa Bình',
        description: 'Đầu số thông tin vận hành thủy công, 8 tổ máy phát điện và điều tiết lũ Hòa Bình',
        status: 'Đang dùng',
        userGroupId: 'ug-hoabinh',
        ranges: [
            { id: 'r-7a', from: '18300', to: '18799', count: 500, note: 'Hầm nhà máy & buồng điều khiển trung tâm' },
            { id: 'r-7b', from: '18900', to: '18999', count: 100, note: 'Cụm vận hành mặt bằng & đập tràn' }
        ]
    },
    {
        id: 'pg-8',
        name: 'Đầu số Nhà máy Nhiệt điện Uông Bí',
        description: 'Liên lạc vận hành lò hơi, tuabin máy phát Uông Bí 1 và Mở rộng Quảng Ninh',
        status: 'Đang dùng',
        userGroupId: 'ug-uongbi',
        ranges: [
            { id: 'r-8a', from: '14000', to: '14499', count: 500, note: 'Dây chuyền Nhiệt điện Uông Bí 1' },
            { id: 'r-8b', from: '14500', to: '14999', count: 500, note: 'Dây chuyền Nhiệt điện Uông Bí mở rộng' }
        ]
    },
    {
        id: 'pg-9',
        name: 'Đầu số Cụm Nhiệt điện Phả Lại (Dây chuyền 1 & 2)',
        description: 'Điều hành sản xuất điện năng Công ty Cổ phần Nhiệt điện Phả Lại, Hải Dương',
        status: 'Đang dùng',
        userGroupId: 'ug-phalai',
        ranges: [
            { id: 'r-9a', from: '16100', to: '16599', count: 500, note: 'Khu vực Gian máy Phả Lại 1' },
            { id: 'r-9b', from: '16600', to: '16999', count: 400, note: 'Khu vực Điều khiển Phả Lại 2' }
        ]
    },
    {
        id: 'pg-10',
        name: 'Đầu số Nhà máy Thủy điện Trị An',
        description: 'Liên lạc vận hành hồ chứa, đập và điều tần hệ thống điện khu vực Đồng Nai',
        status: 'Đang dùng',
        userGroupId: 'ug-trian',
        ranges: [
            { id: 'r-10', from: '61100', to: '61599', count: 500, note: 'Gian máy phát điện và trạm phân phối Trị An' }
        ]
    },
    {
        id: 'pg-11',
        name: 'Đầu số Trạm biến áp 500kV Hòa Bình',
        description: 'Nút nguồn 500kV phía Bắc truyền tải siêu cao áp liên kết Bắc - Nam',
        status: 'Đang dùng',
        userGroupId: 'ug-t500-hb',
        ranges: [
            { id: 'r-11', from: '45000', to: '45199', count: 200, note: 'Sân phân phối 500kV & Phòng rơle bảo vệ' }
        ]
    },
    {
        id: 'pg-12',
        name: 'Đầu số Trạm biến áp 500kV Phú Lâm (Nút 10010)',
        description: 'Trạm truyền tải 500kV huyết mạch cấp điện cho phụ tải TP. Hồ Chí Minh và Tây Nam Bộ',
        status: 'Đang dùng',
        userGroupId: 'ug-t500-pl',
        ranges: [
            { id: 'r-12a', from: '45800', to: '45999', count: 200, note: 'Trạm 500kV Phú Lâm số 1' },
            { id: 'r-12b', from: '89900', to: '89999', count: 100, note: 'Trạm 500kV Phú Lâm số 2' }
        ]
    },
    {
        id: 'pg-13',
        name: 'Đầu số Trạm biến áp 500kV Đà Nẵng',
        description: 'Nút truyền tải trung chuyển 500kV Bắc - Trung - Nam tại Hòa Vang, Đà Nẵng',
        status: 'Đang dùng',
        userGroupId: 'ug-t500-dng',
        ranges: [
            { id: 'r-13', from: '45400', to: '45599', count: 200, note: 'Phòng thao tác SCADA Trạm 500kV Đà Nẵng' }
        ]
    },
    {
        id: 'pg-14',
        name: 'Đầu số Trạm biến áp 500kV Pleiku (Nút 10001)',
        description: 'Nút truyền tải giải tỏa công suất thủy điện Tây Nguyên và gom nguồn 500kV',
        status: 'Đang dùng',
        userGroupId: 'ug-t500-pleiku',
        ranges: [
            { id: 'r-14', from: '45600', to: '45799', count: 200, note: 'Phòng điều khiển trung tâm TBA 500kV Pleiku' }
        ]
    },
    {
        id: 'pg-15',
        name: 'Đầu số Cơ quan Tổng công ty Điện lực Miền Trung',
        description: 'Điều hành mạng lưới kinh doanh phân phối điện lực 13 tỉnh thành miền Trung',
        status: 'Đang dùng',
        userGroupId: 'ug-cpc',
        ranges: [
            { id: 'r-15a', from: '93000', to: '93499', count: 500, note: 'Cơ quan Tổng công ty EVNCPC (393 Trưng Nữ Vương)' },
            { id: 'r-15b', from: '51700', to: '51899', count: 200, note: 'Trung tâm Điều khiển SCADA RLDC3' }
        ]
    },
    {
        id: 'pg-16',
        name: 'Đầu số Điều độ Hệ thống điện TP. Hà Nội',
        description: 'Tổng đài điều độ vận hành mạng lưới điện Thủ đô trực thuộc EVNHANOI',
        status: 'Đang dùng',
        userGroupId: 'ug-evnhanoi',
        ranges: [
            { id: 'r-16', from: '90000', to: '90499', count: 500, note: 'Trung tâm Điều độ HTĐ TP. Hà Nội' }
        ]
    },
    {
        id: 'pg-17',
        name: 'Đầu số Cơ quan Tổng công ty Điện lực Miền Nam',
        description: 'Mạng thông tin nội bộ điều hành 21 tỉnh thành phía Nam trực thuộc EVNSPC',
        status: 'Đang dùng',
        userGroupId: 'ug-evnspc',
        ranges: [
            { id: 'r-17', from: '92000', to: '92499', count: 500, note: 'Trụ sở EVNSPC - 72 Hai Bà Trưng, Q.1' }
        ]
    },
    {
        id: 'pg-18',
        name: 'Đầu số Cơ quan Công ty Truyền tải điện 4',
        description: 'Quản lý vận hành lưới truyền tải điện 220kV - 500kV khu vực phía Nam',
        status: 'Đang dùng',
        userGroupId: 'ug-ptc4',
        ranges: [
            { id: 'r-18', from: '83100', to: '83399', count: 300, note: 'Văn phòng PTC4 và Đội Viễn thông CNTT' }
        ]
    },
    {
        id: 'pg-19',
        name: 'Đầu số Nhà máy Nhiệt điện Ninh Bình',
        description: 'Dải số tạm ngưng phục vụ công tác đại tu tổ máy và chuyển đổi năng lượng sạch',
        status: 'Tạm ngưng',
        userGroupId: 'ug-ninhbinh',
        ranges: [
            { id: 'r-19', from: '15100', to: '15499', count: 400, note: 'Khu gian máy Lò than - Tạm khóa liên lạc nội bộ' }
        ]
    },
    {
        id: 'pg-20',
        name: 'Đầu số Dự phòng Chuyển giao Điều độ Quốc gia NSMO',
        description: 'Dải số quy hoạch tạm ngưng chờ hoàn tất chuyển giao NSMO về Bộ Công Thương',
        status: 'Tạm ngưng',
        userGroupId: 'ug-nsmo-trans',
        ranges: [
            { id: 'r-20', from: '98000', to: '98499', count: 500, note: 'Dải cách ly kỹ thuật - Chưa kích hoạt lưu lượng' }
        ]
    },
    {
        id: 'pg-21',
        name: 'Đầu số Dự phòng Trung tâm Điện lực Quảng Trạch',
        description: 'Dải số đã cấp quy hoạch cho BQLDA Điện 2 chuẩn bị đóng điện dự án Quảng Trạch',
        status: 'Chưa dùng',
        userGroupId: null,
        ranges: [
            { id: 'r-21', from: '19100', to: '19299', count: 200, note: 'Quy hoạch sẵn sàng cấp phát khi hòa lưới' }
        ]
    },
    {
        id: 'pg-22',
        name: 'Đầu số Dự phòng Trạm biến áp 500kV Tây Hà Nội',
        description: 'Dải số dự phòng cấp cho trạm 500kV Tây Hà Nội giai đoạn mở rộng',
        status: 'Chưa dùng',
        userGroupId: null,
        ranges: [
            { id: 'r-22', from: '34400', to: '34499', count: 100, note: 'Dự phòng kết nối PABX IP' }
        ]
    },
    {
        id: 'pg-23',
        name: 'Hotline Thử nghiệm Mạng Thoại IP PBX Quốc gia',
        description: 'Số đơn lẻ dự phòng kiểm tra chất lượng thoại đường dài qua mạng truyền dẫn EVN',
        status: 'Chưa dùng',
        userGroupId: null,
        ranges: [
            { id: 'r-23', from: '99900', to: '99900', count: 1, note: 'Số hotline loopback kiểm tra kênh thoại' }
        ]
    }
];

// Khởi tạo State
let prefixGroups = [];
let userGroups = [];

// Biến phục vụ thao tác Modal
let currentTargetGroupId = null;
let currentTargetRange = null;

// Lắng nghe sự kiện DOM Ready
document.addEventListener('DOMContentLoaded', () => {
    loadData();
    renderTable();
    updateKPI();

    // Export functions to window
    window.openCreateGroupModal = openCreateGroupModal;
    window.savePrefixGroup = savePrefixGroup;
    window.openAssignModal = openAssignModal;
    window.confirmAssignUserGroup = confirmAssignUserGroup;
    window.openAllocateModal = openAllocateModal;
    window.calculateAllocCount = calculateAllocCount;
    window.confirmAllocateRange = confirmAllocateRange;
    window.openRevokeModal = openRevokeModal;
    window.confirmRevokeRange = confirmRevokeRange;
    window.toggleGroupStatus = toggleGroupStatus;
    window.openChangeStatusModal = openChangeStatusModal;
    window.onStatusRadioChange = onStatusRadioChange;
    window.deleteGroup = deleteGroup;
    window.openDeleteGroupModal = openDeleteGroupModal;
    window.confirmDeleteGroup = confirmDeleteGroup;
    window.onDeleteConfirmCheckboxChange = onDeleteConfirmCheckboxChange;
    window.unassignUserGroup = unassignUserGroup;
    window.openUnassignModal = openUnassignModal;
    window.confirmUnassignUserGroup = confirmUnassignUserGroup;
    window.openNumbersListModal = openNumbersListModal;
    window.filterNumbersList = filterNumbersList;
    window.openPoolModal = openPoolModal;
    window.filterPrefixGroups = filterPrefixGroups;
    window.closeModal = closeModal;
    window.resetToCatalogData = resetToCatalogData;
});

// Load & Save Data
function loadData() {
    const currentVersion = localStorage.getItem(STORAGE_CATALOG_VERSION);
    if (currentVersion !== CURRENT_CATALOG_VERSION) {
        // Tự động nâng cấp dữ liệu mẫu theo danh mục chuẩn PABX EVN
        prefixGroups = JSON.parse(JSON.stringify(initialPrefixGroups));
        userGroups = JSON.parse(JSON.stringify(initialUserGroups));
        saveData();
        localStorage.setItem(STORAGE_USER_GROUPS, JSON.stringify(userGroups));
        localStorage.setItem(STORAGE_CATALOG_VERSION, CURRENT_CATALOG_VERSION);
        return;
    }

    const storedGroups = localStorage.getItem(STORAGE_PREFIX_GROUPS);
    if (storedGroups) {
        prefixGroups = JSON.parse(storedGroups);
    } else {
        prefixGroups = JSON.parse(JSON.stringify(initialPrefixGroups));
        saveData();
    }

    const storedUserGroups = localStorage.getItem(STORAGE_USER_GROUPS);
    if (storedUserGroups) {
        userGroups = JSON.parse(storedUserGroups);
    } else {
        userGroups = JSON.parse(JSON.stringify(initialUserGroups));
        localStorage.setItem(STORAGE_USER_GROUPS, JSON.stringify(userGroups));
    }
}

function resetToCatalogData() {
    if (confirm('Bạn có chắc chắn muốn khôi phục toàn bộ Nhóm đầu số và Nhóm người dùng về Danh mục chuẩn EVN (docs/evn_pabx_prefix_numbers_catalog.md)?\n\nCác thay đổi tùy biến trên trình duyệt sẽ được đặt lại theo dữ liệu gốc.')) {
        prefixGroups = JSON.parse(JSON.stringify(initialPrefixGroups));
        userGroups = JSON.parse(JSON.stringify(initialUserGroups));
        saveData();
        localStorage.setItem(STORAGE_USER_GROUPS, JSON.stringify(userGroups));
        localStorage.setItem(STORAGE_CATALOG_VERSION, CURRENT_CATALOG_VERSION);

        logAuditAction({
            actionType: 'Khôi phục Danh mục gốc EVN',
            prefixGroupName: 'Toàn bộ 23 nhóm đầu số',
            userGroupName: '20 nhóm người dùng thành viên',
            orgName: 'Tập đoàn Điện lực Việt Nam',
            rangeText: 'Khối 1 ➔ Khối 9 (10000 - 99999)',
            count: 10101,
            note: 'Khôi phục dữ liệu mẫu chuẩn theo văn bản số 1444/EVN-VT&CNTT và 1010/EVN-VT&CNTT',
            cdrOwnership: 'Đồng bộ toàn diện hệ thống'
        });

        renderTable();
        updateKPI();
        showGlobalNotification('Đã khôi phục thành công dữ liệu Danh mục PABX EVN!', 'success');
    }
}

function saveData() {
    localStorage.setItem(STORAGE_PREFIX_GROUPS, JSON.stringify(prefixGroups));
}

function logAuditAction(actionData) {
    let logs = [];
    try {
        const stored = localStorage.getItem(STORAGE_HISTORY_LOGS);
        if (stored) logs = JSON.parse(stored);
    } catch (e) {
        logs = [];
    }

    const newLog = {
        id: 'log-' + Date.now(),
        timestamp: new Date().toLocaleString('vi-VN'),
        performedBy: 'Quản trị viên (Admin)',
        ...actionData
    };

    logs.unshift(newLog);
    localStorage.setItem(STORAGE_HISTORY_LOGS, JSON.stringify(logs));
}

// Cập nhật chỉ số KPI & Kho số chung (90,000 số: 10000 - 99999)
function updateKPI() {
    const totalCapacity = 90000;
    let activeNumbers = 0;
    let suspendedNumbers = 0;

    prefixGroups.forEach(g => {
        const groupCount = (g.ranges || []).reduce((sum, r) => sum + r.count, 0);
        if (g.status === 'Đang dùng') {
            activeNumbers += groupCount;
        } else if (g.status === 'Tạm ngưng') {
            suspendedNumbers += groupCount;
        }
    });

    const freeNumbers = totalCapacity - activeNumbers - suspendedNumbers;

    const activePct = ((activeNumbers / totalCapacity) * 100).toFixed(1);
    const suspendedPct = ((suspendedNumbers / totalCapacity) * 100).toFixed(1);
    const freePct = ((freeNumbers / totalCapacity) * 100).toFixed(1);

    // Update Elements
    const elTotal = document.getElementById('kpiTotal');
    const elActive = document.getElementById('kpiActive');
    const elSuspended = document.getElementById('kpiSuspended');
    const elFree = document.getElementById('kpiFree');

    if (elTotal) elTotal.innerText = totalCapacity.toLocaleString('vi-VN');
    if (elActive) elActive.innerText = activeNumbers.toLocaleString('vi-VN');
    if (elSuspended) elSuspended.innerText = suspendedNumbers.toLocaleString('vi-VN');
    if (elFree) elFree.innerText = freeNumbers.toLocaleString('vi-VN');

    const elActPct = document.getElementById('kpiActivePercent');
    const elSuspPct = document.getElementById('kpiSuspendedPercent');
    if (elActPct) elActPct.innerText = `${activePct}% tổng kho`;
    if (elSuspPct) elSuspPct.innerText = `${suspendedPct}% tổng kho`;

    // Update Bar
    const barActive = document.getElementById('poolBarActive');
    const barSuspended = document.getElementById('poolBarSuspended');
    const barFree = document.getElementById('poolBarFree');

    if (barActive) barActive.style.width = `${activePct}%`;
    if (barSuspended) barSuspended.style.width = `${suspendedPct}%`;
    if (barFree) barFree.style.width = `${freePct}%`;

    const txtAct = document.getElementById('barActiveText');
    const txtSusp = document.getElementById('barSuspendedText');
    const txtFree = document.getElementById('barFreeText');
    if (txtAct) txtAct.innerText = `${activePct}%`;
    if (txtSusp) txtSusp.innerText = `${suspendedPct}%`;
    if (txtFree) txtFree.innerText = `${freePct}%`;
}

// Render Bảng Nhóm đầu số
function renderTable(filteredData = null) {
    const data = filteredData || prefixGroups;
    const tbody = document.getElementById('prefixGroupTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const totalCountEl = document.getElementById('totalGroupsCount');
    if (totalCountEl) totalCountEl.innerText = data.length;

    if (data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted" style="padding: 30px;">Không tìm thấy nhóm đầu số nào phù hợp với bộ lọc.</td></tr>`;
        return;
    }

    data.forEach(group => {
        // Tìm Nhóm người dùng thành viên
        const userGroup = userGroups.find(ug => ug.id === group.userGroupId);
        const totalNumbers = (group.ranges || []).reduce((sum, r) => sum + r.count, 0);

        // Status Badge class
        let statusClass = 'inactive';
        if (group.status === 'Đang dùng') statusClass = 'active';
        if (group.status === 'Tạm ngưng') statusClass = 'suspended';

        // Render dải số HTML
        let rangesHtml = '';
        if (!group.ranges || group.ranges.length === 0) {
            rangesHtml = `<span class="text-muted" style="font-size:0.8rem; font-style:italic;">Chưa có dải số nào</span>`;
        } else {
            rangesHtml = `<div style="display: flex; flex-direction: column; gap: 6px;">`;
            group.ranges.forEach(r => {
                rangesHtml += `
                    <div style="display: flex; align-items: center; justify-content: space-between; background: var(--bg-hover); padding: 4px 8px; border-radius: 6px; border: 1px solid var(--border);">
                        <span class="range-chip" title="${r.note || ''}">
                            ${r.from} ➔ ${r.to}
                            <span class="range-count">${r.count} số</span>
                        </span>
                        <div style="display: flex; gap: 4px;">
                            <button class="action-btn view-btn" style="padding: 2px 4px; height: auto;" onclick="openNumbersListModal('${r.from}', '${r.to}', '${group.name.replace(/'/g, "\\'")}')" title="Xem danh sách ${r.count} số">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                            </button>
                            <button class="action-btn delete-btn" style="padding: 2px 4px; height: auto;" onclick="openRevokeModal('${group.id}', '${r.id}')" title="Thu hồi dải số về kho chung">
                                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                            </button>
                        </div>
                    </div>
                `;
            });
            rangesHtml += `</div>`;
        }

        // Thông tin Nhóm người dùng thành viên đặt vào Cột Tên nhóm đầu số
        let userGroupInfoHtml = '';
        if (userGroup) {
            userGroupInfoHtml = `
                <div class="usergroup-assigned-badge" style="margin-top: 8px; padding: 6px 10px; background: rgba(0, 51, 160, 0.05); border: 1px solid rgba(0, 51, 160, 0.15); border-radius: 6px;">
                    <div style="font-size: 0.825rem; font-weight: 600; color: var(--primary); display: flex; align-items: center; gap: 6px;">
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>
                        <span>${userGroup.name}</span>
                    </div>
                    <div class="org-bridge-subtitle" style="margin-top: 3px; font-size: 0.75rem;">
                        <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>
                        <span>Đơn vị: ${userGroup.orgName}</span>
                    </div>
                </div>
            `;
        } else {
            userGroupInfoHtml = `
                <div style="margin-top: 6px;">
                    <span class="unassigned-tag">Chưa gán nhóm người dùng</span>
                </div>
            `;
        }

        // Cột Hành động: Hủy gán nhóm (nếu đã gán) / Gán nhóm (nếu chưa gán) + Sửa + Xóa
        let assignActionHtml = '';
        if (userGroup) {
            assignActionHtml = `
                <button class="action-btn unassign-btn" onclick="openUnassignModal('${group.id}')" title="Hủy gán nhóm người dùng thành viên (Chốt CDR & chuyển về Chưa dùng)" style="color: #dc2626;">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="18" y1="8" x2="23" y2="13"></line><line x1="23" y1="8" x2="18" y2="13"></line></svg>
                </button>
            `;
        } else {
            assignActionHtml = `
                <button class="action-btn assign-btn" onclick="openAssignModal('${group.id}')" title="Gán nhóm người dùng thành viên (1-1)" style="color: var(--primary);">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><line x1="19" y1="8" x2="19" y2="14"></line><line x1="22" y1="11" x2="16" y2="11"></line></svg>
                </button>
            `;
        }

        // Hành động thay đổi tình trạng nhóm đầu số (Mở Modal Thay đổi tình trạng)
        let statusActionHtml = '';
        if (group.status === 'Tạm ngưng') {
            statusActionHtml = `
                <button class="action-btn status-btn activate-btn" onclick="openChangeStatusModal('${group.id}')" title="Thay đổi tình trạng nhóm đầu số (Hiện tại: Tạm ngưng)" style="color: #10b981;">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polygon points="10 8 16 12 10 16 10 8" fill="currentColor"></polygon></svg>
                </button>
            `;
        } else if (group.status === 'Đang dùng') {
            statusActionHtml = `
                <button class="action-btn status-btn suspend-btn" onclick="openChangeStatusModal('${group.id}')" title="Thay đổi tình trạng nhóm đầu số (Hiện tại: Đang dùng)" style="color: #d97706;">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="10" y1="15" x2="10" y2="9"></line><line x1="14" y1="15" x2="14" y2="9"></line></svg>
                </button>
            `;
        } else {
            statusActionHtml = `
                <button class="action-btn status-btn inactive-btn" onclick="openChangeStatusModal('${group.id}')" title="Thay đổi tình trạng nhóm đầu số (Hiện tại: Chưa dùng)" style="color: var(--text-muted);">
                    <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><path d="M12 6v6l4 2"></path></svg>
                </button>
            `;
        }

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>
                <div class="fw-700 text-main" style="font-size: 0.95rem;">${group.name}</div>
                <div class="text-xs text-muted mt-1">${group.description || 'Không có mô tả'}</div>
                ${userGroupInfoHtml}
            </td>
            <td>
                ${rangesHtml}
                <div style="margin-top: 6px;">
                    <button class="btn btn-sm btn-outline" style="padding: 2px 8px; font-size: 0.75rem; width: 100%; justify-content: center;" onclick="openAllocateModal('${group.id}')">
                        <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" stroke-width="2" style="margin-right:4px;"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                        Cấp thêm dải số
                    </button>
                </div>
            </td>
            <td style="text-align: center;">
                <span class="badge-count" style="font-size: 0.9rem; font-weight: 700;">${totalNumbers}</span>
            </td>
            <td>
                <span class="status-pill ${statusClass} clickable-pill" onclick="openChangeStatusModal('${group.id}')" title="Nhấn để thay đổi tình trạng nhóm đầu số">
                    <span class="status-dot"></span>
                    ${group.status}
                </span>
            </td>
            <td style="text-align: right;">
                <div style="display: flex; justify-content: flex-end; align-items: center; gap: 6px;">
                    ${assignActionHtml}
                    ${statusActionHtml}
                    <button class="action-btn edit-btn" onclick="openCreateGroupModal('${group.id}')" title="Sửa tên / mô tả nhóm">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                    </button>
                    <button class="action-btn delete-btn" onclick="openDeleteGroupModal('${group.id}')" title="Xóa nhóm đầu số">
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                    </button>
                </div>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Bộ lọc
function filterPrefixGroups() {
    const term = (document.getElementById('searchInput').value || '').trim().toLowerCase();
    const status = document.getElementById('statusFilter').value;
    const assignment = document.getElementById('assignmentFilter').value;

    const filtered = prefixGroups.filter(g => {
        // Tên nhóm hoặc mô tả
        const matchName = g.name.toLowerCase().includes(term) || (g.description && g.description.toLowerCase().includes(term));
        
        // Nhóm người dùng hoặc đơn vị bắc cầu
        const ug = userGroups.find(u => u.id === g.userGroupId);
        const matchUg = ug && (ug.name.toLowerCase().includes(term) || ug.orgName.toLowerCase().includes(term));

        // Khớp dải số
        const matchRange = (g.ranges || []).some(r => r.from.includes(term) || r.to.includes(term));

        const matchSearch = matchName || matchUg || matchRange;

        // Trạng thái
        const matchStatus = (status === 'all') || (g.status === status);

        // Tình trạng gán
        let matchAssign = true;
        if (assignment === 'assigned') matchAssign = !!g.userGroupId;
        if (assignment === 'unassigned') matchAssign = !g.userGroupId;

        return matchSearch && matchStatus && matchAssign;
    });

    renderTable(filtered);
}

// 1. TẠO / SỬA NHÓM ĐẦU SỐ
function openCreateGroupModal(id = null) {
    const modal = document.getElementById('createGroupModal');
    const title = document.getElementById('groupModalTitle');
    const idInput = document.getElementById('groupIdInput');
    const codeInput = document.getElementById('groupCodeInput');
    const nameInput = document.getElementById('groupNameInput');
    const descInput = document.getElementById('groupDescInput');
    const statusInput = document.getElementById('groupStatusInput');
    const userGroupSec = document.getElementById('groupUserGroupSection');
    const userGroupNameEl = document.getElementById('groupUserGroupName');
    const userGroupOrgEl = document.getElementById('groupUserGroupOrg');
    const userGroupActionsEl = document.getElementById('groupUserGroupActions');

    if (id) {
        const group = prefixGroups.find(g => g.id === id);
        if (!group) return;
        title.innerText = 'Cập nhật Nhóm đầu số';
        idInput.value = group.id;
        if (codeInput) codeInput.value = group.code || '';
        nameInput.value = group.name;
        descInput.value = group.description || '';
        statusInput.value = group.status === 'Đang dùng' ? 'Chưa dùng' : group.status;

        if (userGroupSec) {
            userGroupSec.style.display = 'block';
            if (group.userGroupId) {
                const ug = userGroups.find(u => u.id === group.userGroupId);
                userGroupNameEl.innerText = ug ? ug.name : 'Đã gán (N/A)';
                userGroupOrgEl.innerText = ug ? `Đơn vị bắc cầu: ${ug.orgName}` : '';
                userGroupActionsEl.innerHTML = `
                    <button type="button" class="btn btn-sm btn-outline" style="color: #dc2626; border-color: rgba(220,38,38,0.3); font-size: 0.8rem; padding: 4px 10px;" onclick="closeModal('createGroupModal'); openUnassignModal('${group.id}');">
                        Hủy gán nhóm
                    </button>
                `;
            } else {
                userGroupNameEl.innerText = 'Chưa gán nhóm người dùng';
                userGroupOrgEl.innerText = 'Nhóm đầu số đang tự do, tuân thủ nguyên tắc 1-1';
                userGroupActionsEl.innerHTML = `
                    <button type="button" class="btn btn-sm btn-primary" style="font-size: 0.8rem; padding: 4px 10px;" onclick="closeModal('createGroupModal'); openAssignModal('${group.id}');">
                        Gán nhóm ngay
                    </button>
                `;
            }
        }
    } else {
        title.innerText = 'Thêm Nhóm đầu số mới';
        idInput.value = '';
        if (codeInput) codeInput.value = '';
        nameInput.value = '';
        descInput.value = '';
        statusInput.value = 'Chưa dùng';
        if (userGroupSec) userGroupSec.style.display = 'none';
    }

    openModal('createGroupModal');
}

function savePrefixGroup(e) {
    e.preventDefault();
    const id = document.getElementById('groupIdInput').value;
    const code = document.getElementById('groupCodeInput')?.value.trim();
    const name = document.getElementById('groupNameInput').value.trim();
    const desc = document.getElementById('groupDescInput').value.trim();
    const status = document.getElementById('groupStatusInput').value;

    if (!code) {
        showGlobalNotification('Vui lòng nhập Mã nhóm đầu số (code).', 'error');
        return;
    }
    if (!name) {
        showGlobalNotification('Vui lòng nhập Tên nhóm đầu số.', 'error');
        return;
    }

    if (id) {
        const group = prefixGroups.find(g => g.id === id);
        if (group) {
            group.code = code;
            group.name = name;
            group.description = desc;
            if (group.status !== 'Đang dùng') {
                group.status = status;
            }
            saveData();
            showGlobalNotification('Cập nhật Nhóm đầu số thành công!', 'success');
        }
    } else {
        const newGroup = {
            id: 'pg-' + Date.now(),
            code: code,
            name: name,
            description: desc,
            status: 'Chưa dùng',
            userGroupId: null,
            ranges: []
        };
        prefixGroups.unshift(newGroup);
        saveData();
        showGlobalNotification('Thêm mới Nhóm đầu số thành công!', 'success');
    }

    closeModal('createGroupModal');
    renderTable();
    updateKPI();
}

// 2. GÁN NHÓM NGƯỜI DÙNG THÀNH VIÊN (1 - 1)
function openAssignModal(groupId) {
    if (!groupId) return;
    currentTargetGroupId = groupId;
    const infoBox = document.getElementById('assignTargetGroupInfoBox');
    if (infoBox) infoBox.style.display = 'block';
    populateAssignGroupInfo(groupId);

    // Nạp danh sách nhóm người dùng khả dụng (1-1)
    populateAvailableUserGroups(groupId);

    // Reset ghi chú và đơn vị bắc cầu
    const noteInput = document.getElementById('assignNoteInput');
    if (noteInput) noteInput.value = '';
    const bridgeInfo = document.getElementById('assignedBridgeInfo');
    if (bridgeInfo) bridgeInfo.style.display = 'none';

    openModal('assignGroupModal');
}

function populateAssignGroupInfo(groupId) {
    const group = prefixGroups.find(g => g.id === groupId);
    if (!group) return;

    document.getElementById('assignTargetGroupName').innerText = group.name;
    document.getElementById('assignTargetGroupDesc').innerText = group.description || 'Không có mô tả';

    const rangesText = (group.ranges || []).map(r => `${r.from} ➔ ${r.to}`).join(', ') || 'Chưa có dải';
    const totalCount = (group.ranges || []).reduce((s, r) => s + r.count, 0);
    document.getElementById('assignTargetRanges').innerText = rangesText;
    document.getElementById('assignTargetCount').innerText = `${totalCount.toLocaleString('vi-VN')} số`;

    const statusBadge = document.getElementById('assignGroupCurrentStatus');
    if (statusBadge) {
        statusBadge.innerText = group.status;
        statusBadge.className = `status-pill ${group.status === 'Đang dùng' ? 'active' : (group.status === 'Tạm ngưng' ? 'suspended' : 'inactive')}`;
    }
}

function populateAvailableUserGroups(currentGroupId) {
    const select = document.getElementById('userGroupSelect');
    select.innerHTML = '<option value="">-- Chọn Nhóm người dùng thành viên khả dụng --</option>';

    // Lấy danh sách userGroupId đã dùng ở các nhóm khác
    const assignedUgs = prefixGroups
        .filter(g => g.id !== currentGroupId && g.userGroupId)
        .map(g => g.userGroupId);

    userGroups.forEach(ug => {
        if (!assignedUgs.includes(ug.id)) {
            const opt = document.createElement('option');
            opt.value = ug.id;
            opt.textContent = `${ug.name} (Đơn vị: ${ug.orgName})`;
            select.appendChild(opt);
        }
    });

    select.onchange = function() {
        const val = this.value;
        const bridgeBox = document.getElementById('assignedBridgeInfo');
        const bridgeOrg = document.getElementById('assignedBridgeOrgName');
        if (val) {
            const found = userGroups.find(u => u.id === val);
            if (found) {
                bridgeOrg.innerText = found.orgName;
                bridgeBox.style.display = 'block';
            }
        } else {
            bridgeBox.style.display = 'none';
        }
    };
}

function confirmAssignUserGroup() {
    let groupId = currentTargetGroupId;
    if (!groupId) {
        const prefixSelect = document.getElementById('assignPrefixGroupSelect');
        if (prefixSelect) groupId = prefixSelect.value;
    }

    if (!groupId) {
        showGlobalNotification('Vui lòng chọn Nhóm đầu số.', 'error');
        return;
    }

    const userGroupId = document.getElementById('userGroupSelect').value;
    const note = document.getElementById('assignNoteInput').value.trim();

    if (!userGroupId) {
        showGlobalNotification('Vui lòng chọn Nhóm người dùng thành viên.', 'error');
        return;
    }

    const group = prefixGroups.find(g => g.id === groupId);
    const userGroup = userGroups.find(u => u.id === userGroupId);

    if (group && userGroup) {
        group.userGroupId = userGroupId;
        group.status = 'Đang dùng';
        saveData();

        // Ghi log kiểm toán
        logAuditAction({
            actionType: 'Gán nhóm (1-1)',
            statusBefore: 'Chưa dùng',
            statusAfter: 'Đang dùng',
            prefixGroupName: group.name,
            userGroupName: userGroup.name,
            orgName: userGroup.orgName,
            rangeText: (group.ranges || []).map(r => `${r.from} ➔ ${r.to}`).join(', ') || 'Chưa có dải',
            count: (group.ranges || []).reduce((s, r) => s + r.count, 0),
            decisionNumber: note ? note.slice(0, 30) : 'QĐ Gán nhóm',
            note: note || 'Chuyển sang trạng thái Đang dùng, bắt đầu ghi nhận dữ liệu CDR',
            cdrOwnership: `Từ ${new Date().toLocaleDateString('vi-VN')} đến nay`
        });

        showGlobalNotification(`Đã gán "${group.name}" cho ${userGroup.name}!`, 'success');
        closeModal('assignGroupModal');
        renderTable();
        updateKPI();
    }
}

// 2B. HỦY GÁN NHÓM NGƯỜI DÙNG THÀNH VIÊN (CHỐT CDR THỜI GIAN)
function openUnassignModal(groupId) {
    currentTargetGroupId = groupId;
    const group = prefixGroups.find(g => g.id === groupId);
    if (!group) return;

    const userGroup = userGroups.find(u => u.id === group.userGroupId);

    document.getElementById('unassignTargetGroupName').innerText = group.name;
    const badge = document.getElementById('unassignGroupStatusBadge');
    if (badge) {
        badge.innerText = group.status;
        badge.className = `status-pill ${group.status === 'Đang dùng' ? 'active' : (group.status === 'Tạm ngưng' ? 'suspended' : 'inactive')}`;
    }

    document.getElementById('unassignTargetUserGroupName').innerText = userGroup ? userGroup.name : 'Chưa xác định';
    document.getElementById('unassignTargetOrgName').innerText = userGroup ? userGroup.orgName : 'Chưa xác định';

    const rangesText = (group.ranges || []).map(r => `${r.from} ➔ ${r.to}`).join(', ') || 'Chưa có dải';
    const totalCount = (group.ranges || []).reduce((s, r) => s + r.count, 0);
    document.getElementById('unassignTargetRanges').innerText = rangesText;
    document.getElementById('unassignTargetCount').innerText = `${totalCount.toLocaleString('vi-VN')} số`;

    const dateEl = document.getElementById('unassignCurrentDate');
    if (dateEl) dateEl.innerText = new Date().toLocaleDateString('vi-VN');

    document.getElementById('unassignReasonInput').value = '';

    openModal('unassignGroupModal');
}

function confirmUnassignUserGroup() {
    const group = prefixGroups.find(g => g.id === currentTargetGroupId);
    if (!group) return;

    const reason = document.getElementById('unassignReasonInput').value.trim();
    if (!reason) {
        showGlobalNotification('Vui lòng nhập căn cứ quyết định hoặc lý do hủy gán.', 'error');
        return;
    }

    const userGroup = userGroups.find(u => u.id === group.userGroupId);

    // Ghi log kiểm toán
    logAuditAction({
        actionType: 'Hủy gán nhóm',
        statusBefore: 'Đang dùng',
        statusAfter: 'Chưa dùng',
        prefixGroupName: group.name,
        userGroupName: userGroup ? userGroup.name : 'N/A',
        orgName: userGroup ? userGroup.orgName : 'N/A',
        rangeText: (group.ranges || []).map(r => `${r.from} ➔ ${r.to}`).join(', ') || '-',
        count: (group.ranges || []).reduce((s, r) => s + r.count, 0),
        decisionNumber: reason ? reason.slice(0, 30) : 'QĐ Hủy gán',
        note: reason,
        cdrOwnership: `Chốt quyền CDR đến ${new Date().toLocaleDateString('vi-VN')}`
    });

    group.userGroupId = null;
    group.status = 'Chưa dùng';
    saveData();

    showGlobalNotification(`Đã hủy gán thành công khỏi "${group.name}". Nhóm chuyển về Chưa dùng.`, 'success');
    closeModal('unassignGroupModal');
    renderTable();
    updateKPI();
}

// Giữ lại hàm cũ làm alias cho tương thích
function unassignUserGroup(groupId) {
    openUnassignModal(groupId);
}

// 3. CẤP PHÁT DẢI SỐ MỚI (TỪ KHO RẢNH)
function openAllocateModal(groupId) {
    currentTargetGroupId = groupId;
    const group = prefixGroups.find(g => g.id === groupId);
    if (!group) return;

    document.getElementById('allocTargetGroupName').innerText = group.name;
    const userGroup = userGroups.find(u => u.id === group.userGroupId);
    document.getElementById('allocTargetUserGroup').innerText = userGroup ? `Nhóm người dùng: ${userGroup.name} (${userGroup.orgName})` : 'Chưa gán nhóm người dùng';

    document.getElementById('rangeFromInput').value = '';
    document.getElementById('rangeToInput').value = '';
    document.getElementById('allocNoteInput').value = '';
    document.getElementById('allocCountDisplay').innerText = '0 số';
    document.getElementById('allocConflictWarning').style.display = 'none';

    openModal('allocateRangeModal');
}

function calculateAllocCount() {
    const fromStr = document.getElementById('rangeFromInput').value.trim();
    const toStr = document.getElementById('rangeToInput').value.trim();
    const countDisplay = document.getElementById('allocCountDisplay');
    const warning = document.getElementById('allocConflictWarning');

    warning.style.display = 'none';

    if (fromStr.length === 5 && toStr.length === 5 && /^\d+$/.test(fromStr) && /^\d+$/.test(toStr)) {
        const from = parseInt(fromStr, 10);
        const to = parseInt(toStr, 10);

        if (from > to) {
            countDisplay.innerText = 'Không hợp lệ (Từ số > Đến số)';
            countDisplay.style.color = '#dc2626';
            return;
        }

        const count = (to - from) + 1;
        countDisplay.innerText = `${count.toLocaleString('vi-VN')} số`;
        countDisplay.style.color = '#047857';

        // Kiểm tra xem dải này có bị trùng với dải đang dùng nào không
        let hasConflict = false;
        prefixGroups.forEach(g => {
            (g.ranges || []).forEach(r => {
                const rf = parseInt(r.from, 10);
                const rt = parseInt(r.to, 10);
                if (Math.max(from, rf) <= Math.min(to, rt)) {
                    hasConflict = true;
                }
            });
        });

        if (hasConflict) {
            warning.innerText = '⚠️ Cảnh báo: Dải số này đang bị trùng lặp với dải số đã cấp phát cho nhóm khác!';
            warning.style.display = 'block';
        }
    } else {
        countDisplay.innerText = '0 số';
        countDisplay.style.color = '#047857';
    }
}

function confirmAllocateRange() {
    const fromStr = document.getElementById('rangeFromInput').value.trim();
    const toStr = document.getElementById('rangeToInput').value.trim();
    const note = document.getElementById('allocNoteInput').value.trim();

    if (fromStr.length !== 5 || toStr.length !== 5 || !/^\d+$/.test(fromStr) || !/^\d+$/.test(toStr)) {
        showGlobalNotification('Số điện thoại phải có đúng 5 chữ số (VD: 42000).', 'error');
        return;
    }

    const from = parseInt(fromStr, 10);
    const to = parseInt(toStr, 10);

    if (from > to) {
        showGlobalNotification('Từ số không được lớn hơn Đến số.', 'error');
        return;
    }

    // Kiểm tra trùng
    let conflictInfo = null;
    prefixGroups.forEach(g => {
        (g.ranges || []).forEach(r => {
            const rf = parseInt(r.from, 10);
            const rt = parseInt(r.to, 10);
            if (Math.max(from, rf) <= Math.min(to, rt)) {
                conflictInfo = `${r.from} - ${r.to} (thuộc nhóm: ${g.name})`;
            }
        });
    });

    if (conflictInfo) {
        showGlobalNotification(`Dải số bị xung đột với dải ${conflictInfo}!`, 'error');
        return;
    }

    const group = prefixGroups.find(g => g.id === currentTargetGroupId);
    if (!group) return;

    const count = (to - from) + 1;
    const newRange = {
        id: 'r-' + Date.now(),
        from: fromStr,
        to: toStr,
        count: count,
        note: note || 'Cấp mới từ kho số rảnh'
    };

    if (!group.ranges) group.ranges = [];
    group.ranges.push(newRange);
    saveData();

    const userGroup = userGroups.find(u => u.id === group.userGroupId);

    // Ghi log kiểm toán
    logAuditAction({
        actionType: 'Cấp phát dải mới',
        statusBefore: 'Kho tự do',
        statusAfter: group.status || 'Đang dùng',
        prefixGroupName: group.name,
        userGroupName: userGroup ? userGroup.name : 'Chưa gán',
        orgName: userGroup ? userGroup.orgName : '-',
        rangeText: `${fromStr} ➔ ${toStr}`,
        count: count,
        decisionNumber: note ? note.slice(0, 30) : 'QĐ Cấp phát',
        note: note || 'Tổ hợp từ kho số rảnh tự do',
        cdrOwnership: userGroup ? `Từ ${new Date().toLocaleDateString('vi-VN')} đến nay` : 'Chưa kích hoạt CDR'
    });

    showGlobalNotification(`Cấp phát thành công dải số ${fromStr} - ${toStr} (${count} số)!`, 'success');
    closeModal('allocateRangeModal');
    renderTable();
    updateKPI();
}

// 4. THU HỒI DẢI SỐ VỀ KHO SỐ CHUNG (THU HỒI TOÀN BỘ DẢI)
function openRevokeModal(groupId, rangeId) {
    currentTargetGroupId = groupId;
    const group = prefixGroups.find(g => g.id === groupId);
    if (!group) return;

    const range = (group.ranges || []).find(r => r.id === rangeId);
    if (!range) return;

    currentTargetRange = range;

    document.getElementById('revokeTargetGroupName').innerText = group.name;
    document.getElementById('revokeCurrentRangeChip').innerText = `${range.from} ➔ ${range.to} (${range.count} số)`;
    document.getElementById('revokeReasonInput').value = '';

    openModal('revokeRangeModal');
}

function confirmRevokeRange() {
    const reason = document.getElementById('revokeReasonInput').value.trim();
    if (!reason) {
        showGlobalNotification('Vui lòng nhập Lý do thu hồi & Số Quyết định / Căn cứ.', 'error');
        return;
    }

    const group = prefixGroups.find(g => g.id === currentTargetGroupId);
    if (!group || !currentTargetRange) return;

    const userGroup = userGroups.find(u => u.id === group.userGroupId);
    const rangeText = `${currentTargetRange.from} - ${currentTargetRange.to}`;
    const count = currentTargetRange.count;

    // Xóa dải khỏi nhóm
    group.ranges = group.ranges.filter(r => r.id !== currentTargetRange.id);
    saveData();

    // Ghi log kiểm toán
    logAuditAction({
        actionType: 'Thu hồi về kho',
        statusBefore: group.status || 'Đang dùng',
        statusAfter: 'Kho tự do',
        prefixGroupName: group.name,
        userGroupName: userGroup ? userGroup.name : 'Chưa gán',
        orgName: userGroup ? userGroup.orgName : '-',
        rangeText: rangeText,
        count: count,
        decisionNumber: reason ? reason.slice(0, 30) : 'QĐ Thu hồi',
        note: reason,
        cdrOwnership: userGroup ? `Chốt đến ${new Date().toLocaleDateString('vi-VN')} (kết thúc sở hữu CDR)` : 'N/A'
    });

    showGlobalNotification(`Đã thu hồi dải số ${rangeText} (${count} số) về kho số chung!`, 'success');
    closeModal('revokeRangeModal');
    renderTable();
    updateKPI();
}

// 5. THAY ĐỔI TÌNH TRẠNG & XÓA NHÓM
function openChangeStatusModal(groupId) {
    currentTargetGroupId = groupId;
    const group = prefixGroups.find(g => g.id === groupId);
    if (!group) return;

    // Tên nhóm
    const nameEl = document.getElementById('statusTargetGroupName');
    if (nameEl) nameEl.innerText = group.name;

    // Badge hiện tại
    const badgeContainer = document.getElementById('statusCurrentBadgeContainer');
    if (badgeContainer) {
        let badgeClass = 'inactive';
        if (group.status === 'Đang dùng') badgeClass = 'active';
        if (group.status === 'Tạm ngưng') badgeClass = 'suspended';
        badgeContainer.innerHTML = `
            <span class="status-pill ${badgeClass}">
                <span class="status-dot"></span>
                ${group.status}
            </span>
        `;
    }

    // Thông tin nhóm người dùng thành viên & đơn vị sở hữu
    const userGroup = userGroups.find(ug => ug.id === group.userGroupId);
    const ugInfoEl = document.getElementById('statusTargetUserGroupInfo');
    if (ugInfoEl) {
        if (userGroup) {
            ugInfoEl.innerHTML = `
                <span>Nhóm người dùng: <strong style="color: var(--primary);">${userGroup.name}</strong></span>
                <span style="margin: 0 6px; color: var(--border);">•</span>
                <span>Đơn vị sở hữu: <strong>${userGroup.orgName}</strong></span>
            `;
        } else {
            ugInfoEl.innerHTML = `<span class="unassigned-tag">Chưa gán nhóm người dùng</span>`;
        }
    }

    // Dải số & Tổng số
    const rangeText = (group.ranges && group.ranges.length > 0)
        ? group.ranges.map(r => `${r.from} ➔ ${r.to}`).join(', ')
        : 'Chưa có dải số';
    const totalCount = (group.ranges || []).reduce((sum, r) => sum + r.count, 0);

    const rangeEl = document.getElementById('statusTargetRanges');
    if (rangeEl) rangeEl.innerText = rangeText;

    const countEl = document.getElementById('statusTargetCount');
    if (countEl) countEl.innerText = `${totalCount.toLocaleString('vi-VN')} số`;

    // Chọn radio mặc định theo tình trạng hiện tại
    const radioActive = document.getElementById('radioStatusActive');
    const radioSuspended = document.getElementById('radioStatusSuspended');
    const radioInactive = document.getElementById('radioStatusInactive');

    if (group.status === 'Tạm ngưng') {
        if (radioSuspended) radioSuspended.checked = true;
    } else if (group.status === 'Đang dùng') {
        if (radioActive) radioActive.checked = true;
    } else {
        if (radioInactive) radioInactive.checked = true;
    }

    // Reset lý do
    const reasonInput = document.getElementById('statusReasonInput');
    if (reasonInput) reasonInput.value = '';

    onStatusRadioChange();
    openModal('changeStatusModal');
}

function onStatusRadioChange() {
    const selectedRadio = document.querySelector('input[name="newGroupStatus"]:checked');
    if (!selectedRadio) return;
    const newStatus = selectedRadio.value;

    // Highlight card được chọn
    const cardMap = {
        'Đang dùng': 'cardStatusActive',
        'Tạm ngưng': 'cardStatusSuspended',
        'Chưa dùng': 'cardStatusInactive'
    };

    ['cardStatusActive', 'cardStatusSuspended', 'cardStatusInactive'].forEach(id => {
        const card = document.getElementById(id);
        if (card) card.classList.remove('selected');
    });

    const activeCardId = cardMap[newStatus];
    if (activeCardId) {
        const activeCard = document.getElementById(activeCardId);
        if (activeCard) activeCard.classList.add('selected');
    }

    // Hiển thị tác động nghiệp vụ tương ứng
    const notice = document.getElementById('statusImpactNotice');
    if (!notice) return;

    const group = prefixGroups.find(g => g.id === currentTargetGroupId);
    const currentStatus = group ? group.status : '';

    notice.style.display = 'block';

    if (newStatus === currentStatus) {
        notice.style.background = 'rgba(100, 116, 139, 0.08)';
        notice.style.border = '1px solid rgba(100, 116, 139, 0.2)';
        notice.style.color = 'var(--text-muted)';
        notice.innerHTML = `ℹ️ <strong>Tình trạng không đổi:</strong> Nhóm đầu số đang ở trạng thái <em>${currentStatus}</em>. Vui lòng chọn tình trạng mới muốn áp dụng.`;
    } else if (newStatus === 'Đang dùng') {
        notice.style.background = 'rgba(16, 185, 129, 0.08)';
        notice.style.border = '1px solid rgba(16, 185, 129, 0.3)';
        notice.style.color = '#047857';
        notice.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 3px;">🟢 Kích hoạt khai thác tổng đài EVN:</div>
            <div>Toàn bộ số điện thoại trong dải được kích hoạt thông tuyến trên mạng PABX. Máy chủ CDR tiếp tục ghi nhận, phân tích lưu lượng và đối soát lưu lượng thoại cho đơn vị quản lý.</div>
        `;
    } else if (newStatus === 'Tạm ngưng') {
        notice.style.background = 'rgba(217, 119, 6, 0.08)';
        notice.style.border = '1px solid rgba(217, 119, 6, 0.3)';
        notice.style.color = '#b45309';
        notice.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 3px;">⚠️ Tác động nghiệp vụ Tạm ngưng:</div>
            <div>Tạm dừng định tuyến cuộc gọi và tạm dừng phân tích dữ liệu CDR phát sinh mới. Quan hệ gán đơn vị và các dải số vẫn được bảo lưu trọn vẹn, không bị giải phóng về kho số rảnh.</div>
        `;
    } else if (newStatus === 'Chưa dùng') {
        notice.style.background = 'rgba(100, 116, 139, 0.08)';
        notice.style.border = '1px solid rgba(100, 116, 139, 0.3)';
        notice.style.color = 'var(--text-main)';
        notice.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 3px;">⚪ Chuyển về trạng thái Sẵn sàng / Dự phòng:</div>
            <div>Nhóm đầu số được đặt ở trạng thái chờ bàn giao hoặc dự phòng quy hoạch mạng viễn thông. Lưu lượng thoại và dữ liệu CDR không phát sinh trong thời gian này.</div>
        `;
    }
}

function confirmChangeStatus() {
    const selectedRadio = document.querySelector('input[name="newGroupStatus"]:checked');
    if (!selectedRadio) {
        showGlobalNotification('Vui lòng chọn Tình trạng mới!', 'error');
        return;
    }

    const newStatus = selectedRadio.value;
    const reason = (document.getElementById('statusReasonInput').value || '').trim();

    if (!reason) {
        showGlobalNotification('Vui lòng nhập Căn cứ quyết định / Lý do thay đổi tình trạng.', 'error');
        return;
    }

    const group = prefixGroups.find(g => g.id === currentTargetGroupId);
    if (!group) return;

    const oldStatus = group.status;
    if (newStatus === oldStatus) {
        showGlobalNotification('Tình trạng mới trùng với tình trạng hiện tại!', 'warning');
        return;
    }

    const userGroup = userGroups.find(u => u.id === group.userGroupId);
    const rangeText = (group.ranges || []).map(r => `${r.from}-${r.to}`).join(', ') || '-';
    const totalCount = (group.ranges || []).reduce((s, r) => s + r.count, 0);

    // Cập nhật tình trạng nhóm
    group.status = newStatus;
    saveData();

    // Xác định loại hành động kiểm toán
    let actionType = 'Thay đổi tình trạng nhóm đầu số';
    let cdrNote = 'Cập nhật trạng thái khai thác';
    if (newStatus === 'Tạm ngưng') {
        actionType = 'Tạm ngưng nhóm đầu số';
        cdrNote = 'Tạm dừng lưu lượng thoại CDR';
    } else if (newStatus === 'Đang dùng') {
        actionType = 'Kích hoạt lại nhóm đầu số';
        cdrNote = userGroup ? 'Tiếp tục ghi nhận lưu lượng CDR' : 'Đang dùng (chưa gán nhóm)';
    } else if (newStatus === 'Chưa dùng') {
        actionType = 'Chuyển về Chưa dùng';
        cdrNote = 'Kho số rảnh / dự phòng quy hoạch';
    }

    logAuditAction({
        actionType: newStatus === 'Tạm ngưng' ? 'Tạm ngưng' : (newStatus === 'Đang dùng' ? 'Kích hoạt lại' : 'Đổi trạng thái'),
        statusBefore: oldStatus,
        statusAfter: newStatus,
        prefixGroupName: group.name,
        userGroupName: userGroup ? userGroup.name : 'Chưa gán',
        orgName: userGroup ? userGroup.orgName : '-',
        rangeText: rangeText,
        count: totalCount,
        decisionNumber: reason ? reason.slice(0, 30) : 'QĐ Đổi trạng thái',
        note: `Chuyển trạng thái [${oldStatus} ➔ ${newStatus}]: ${reason}`,
        cdrOwnership: cdrNote
    });

    closeModal('changeStatusModal');
    renderTable();
    updateKPI();
    showGlobalNotification(`Đã chuyển tình trạng Nhóm "${group.name}" sang "${newStatus}"!`, 'success');
}

// Giữ lại hàm cũ làm alias chuyển tiếp
function toggleGroupStatus(groupId) {
    openChangeStatusModal(groupId);
}

// 5B. XÓA NHÓM ĐẦU SỐ
function openDeleteGroupModal(groupId) {
    currentTargetGroupId = groupId;
    const group = prefixGroups.find(g => g.id === groupId);
    if (!group) return;

    // Tên & mô tả nhóm
    const nameEl = document.getElementById('deleteTargetGroupName');
    if (nameEl) nameEl.innerText = group.name;

    const descEl = document.getElementById('deleteTargetGroupDesc');
    if (descEl) descEl.innerText = group.description || 'Không có mô tả chi tiết';

    // Badge trạng thái hiện tại
    const badgeEl = document.getElementById('deleteTargetStatusBadge');
    if (badgeEl) {
        let badgeClass = 'inactive';
        if (group.status === 'Đang dùng') badgeClass = 'active';
        if (group.status === 'Tạm ngưng') badgeClass = 'suspended';
        badgeEl.innerHTML = `
            <span class="status-pill ${badgeClass}">
                <span class="status-dot"></span>
                ${group.status}
            </span>
        `;
    }

    // Nhóm người dùng thành viên & Đơn vị sở hữu
    const userGroup = userGroups.find(ug => ug.id === group.userGroupId);
    const ugInfoEl = document.getElementById('deleteTargetUserGroupInfo');
    if (ugInfoEl) {
        if (userGroup) {
            ugInfoEl.innerHTML = `
                <span>Nhóm người dùng: <strong style="color: var(--primary);">${userGroup.name}</strong></span>
                <span style="margin: 0 6px; color: var(--border);">•</span>
                <span>Đơn vị sở hữu: <strong>${userGroup.orgName}</strong></span>
            `;
        } else {
            ugInfoEl.innerHTML = `<span class="unassigned-tag">Chưa gán nhóm người dùng</span>`;
        }
    }

    // Dải số & Tổng số máy
    const rangeText = (group.ranges && group.ranges.length > 0)
        ? group.ranges.map(r => `${r.from} ➔ ${r.to}`).join(', ')
        : 'Không có';
    const totalCount = (group.ranges || []).reduce((sum, r) => sum + r.count, 0);

    const rangeTextEl = document.getElementById('deleteTargetRangesText');
    if (rangeTextEl) rangeTextEl.innerText = rangeText;

    const totalCountEl = document.getElementById('deleteTargetTotalCount');
    if (totalCountEl) totalCountEl.innerText = `${totalCount.toLocaleString('vi-VN')} số`;

    const hasRanges = group.ranges && group.ranges.length > 0;
    const hasRangesNotice = document.getElementById('deleteHasRangesNotice');
    const emptyNotice = document.getElementById('deleteEmptyNotice');
    const confirmBtn = document.getElementById('confirmDeleteGroupBtn');
    const confirmCheckbox = document.getElementById('deleteConfirmRevokeCheckbox');

    if (hasRanges) {
        if (hasRangesNotice) hasRangesNotice.style.display = 'block';
        if (emptyNotice) emptyNotice.style.display = 'none';

        const rangeCountNumEl = document.getElementById('deleteRangeCountNumber');
        if (rangeCountNumEl) rangeCountNumEl.innerText = group.ranges.length;

        const totalCountNumEl = document.getElementById('deleteTotalCountNumber');
        if (totalCountNumEl) totalCountNumEl.innerText = totalCount.toLocaleString('vi-VN');

        const confirmNumTextEl = document.getElementById('deleteConfirmNumbersText');
        if (confirmNumTextEl) confirmNumTextEl.innerText = totalCount.toLocaleString('vi-VN');

        // Render danh sách chip dải số
        const chipContainer = document.getElementById('deleteRangesListChip');
        if (chipContainer) {
            chipContainer.innerHTML = '';
            group.ranges.forEach(r => {
                const chip = document.createElement('span');
                chip.className = 'range-chip';
                chip.style.fontSize = '0.75rem';
                chip.innerText = `${r.from} ➔ ${r.to} (${r.count} số)`;
                chipContainer.appendChild(chip);
            });
        }

        if (confirmCheckbox) confirmCheckbox.checked = false;
        if (confirmBtn) {
            confirmBtn.disabled = true;
            confirmBtn.style.opacity = '0.5';
            confirmBtn.style.cursor = 'not-allowed';
        }
    } else {
        if (hasRangesNotice) hasRangesNotice.style.display = 'none';
        if (emptyNotice) emptyNotice.style.display = 'block';

        if (confirmBtn) {
            confirmBtn.disabled = false;
            confirmBtn.style.opacity = '1';
            confirmBtn.style.cursor = 'pointer';
        }
    }

    // Reset lý do
    const reasonInput = document.getElementById('deleteReasonInput');
    if (reasonInput) reasonInput.value = '';

    openModal('deleteGroupModal');
}

function onDeleteConfirmCheckboxChange() {
    const cb = document.getElementById('deleteConfirmRevokeCheckbox');
    const btn = document.getElementById('confirmDeleteGroupBtn');
    if (btn && cb) {
        btn.disabled = !cb.checked;
        btn.style.opacity = cb.checked ? '1' : '0.5';
        btn.style.cursor = cb.checked ? 'pointer' : 'not-allowed';
    }
}

function confirmDeleteGroup() {
    const group = prefixGroups.find(g => g.id === currentTargetGroupId);
    if (!group) return;

    const hasRanges = group.ranges && group.ranges.length > 0;
    if (hasRanges) {
        const checkbox = document.getElementById('deleteConfirmRevokeCheckbox');
        if (!checkbox || !checkbox.checked) {
            showGlobalNotification('Vui lòng tích chọn đồng ý thu hồi các dải số trước khi xóa nhóm!', 'error');
            return;
        }
    }

    const reason = (document.getElementById('deleteReasonInput').value || '').trim();
    if (!reason) {
        showGlobalNotification('Vui lòng nhập Căn cứ quyết định / Lý do xóa nhóm.', 'error');
        return;
    }

    const userGroup = userGroups.find(u => u.id === group.userGroupId);
    const rangeListText = (group.ranges || []).map(r => `${r.from}-${r.to}`).join(', ') || 'Không có';
    const totalCount = (group.ranges || []).reduce((sum, r) => sum + r.count, 0);

    // Ghi log kiểm toán
    logAuditAction({
        actionType: 'Xóa nhóm đầu số',
        statusBefore: group.status || 'Chưa dùng',
        statusAfter: 'Đã xóa',
        prefixGroupName: group.name,
        userGroupName: userGroup ? userGroup.name : 'Chưa gán',
        orgName: userGroup ? userGroup.orgName : '-',
        rangeText: rangeListText,
        count: totalCount,
        decisionNumber: reason ? reason.slice(0, 30) : 'QĐ Xóa nhóm',
        note: `Xóa nhóm đầu số: ${reason}. ${hasRanges ? `(Đã tự động thu hồi ${totalCount} số về kho chung)` : ''}`,
        cdrOwnership: userGroup ? `Chốt quyền CDR đến ${new Date().toLocaleDateString('vi-VN')}` : 'Đã giải phóng'
    });

    // Xóa nhóm khỏi mảng prefixGroups
    prefixGroups = prefixGroups.filter(g => g.id !== currentTargetGroupId);
    saveData();

    closeModal('deleteGroupModal');
    renderTable();
    updateKPI();
    showGlobalNotification(`Đã xóa thành công Nhóm đầu số "${group.name}"!`, 'success');
}

// Giữ lại hàm cũ làm alias chuyển tiếp
function deleteGroup(groupId) {
    openDeleteGroupModal(groupId);
}

// 6. XEM DANH SÁCH SỐ ĐIỆN THOẠI TRONG DẢI
let currentModalNumbers = [];

function openNumbersListModal(fromStr, toStr, groupName = '') {
    document.getElementById('listRangeText').innerText = `${fromStr} ➔ ${toStr}`;
    const groupNameEl = document.getElementById('listGroupNameText');
    if (groupNameEl) groupNameEl.innerText = groupName || 'Nhóm đầu số EVN';
    document.getElementById('numberSearchInput').value = '';

    const from = parseInt(fromStr, 10);
    const to = parseInt(toStr, 10);
    currentModalNumbers = [];

    for (let i = from; i <= to; i++) {
        const num = i.toString().padStart(5, '0');
        currentModalNumbers.push({
            number: num,
            rangeStr: `${fromStr} - ${toStr}`
        });
    }

    renderModalNumbers(currentModalNumbers);
    openModal('numbersListModal');
}

function renderModalNumbers(list) {
    const tbody = document.getElementById('numbersListBody');
    tbody.innerHTML = '';

    document.getElementById('numShown').innerText = list.length;
    document.getElementById('numTotal').innerText = currentModalNumbers.length;

    const displayList = list.slice(0, 100); // Tối ưu hiệu năng hiển thị 100 bản ghi đầu

    displayList.forEach(item => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="fw-700" style="font-family: monospace; font-size: 0.95rem; color: var(--primary);">${item.number}</td>
            <td><span class="range-chip" style="font-size: 0.8rem;">${item.rangeStr}</span></td>
            <td style="text-align: right;">
                <a href="cdr-history.html" class="btn btn-sm btn-outline" style="padding: 2px 8px; font-size: 0.75rem;" title="Tra cứu CDR của số này">
                    Xem CDR
                </a>
            </td>
        `;
        tbody.appendChild(tr);
    });

    if (list.length > 100) {
        const trMore = document.createElement('tr');
        trMore.innerHTML = `<td colspan="3" class="text-center text-muted" style="padding: 10px; font-size: 0.8rem;">Đang hiển thị 100 số đầu tiên. Sử dụng ô tìm kiếm để tra cứu số cụ thể.</td>`;
        tbody.appendChild(trMore);
    }
}

function filterNumbersList() {
    const term = (document.getElementById('numberSearchInput').value || '').trim();
    const filtered = currentModalNumbers.filter(item => item.number.includes(term));
    renderModalNumbers(filtered);
}

// 7. MODAL CHI TIẾT KHO SỐ RẢNH TỰ DO
function openPoolModal() {
    const tbody = document.getElementById('poolTableBody');
    tbody.innerHTML = '';

    // Danh mục các block số rảnh liên tiếp từ kho quy hoạch 10000 - 99999
    const freeBlocks = [
        { from: '10000', to: '13099', count: 3100, note: 'Khối 1: Nguồn điện Tây Bắc & Miền Trung rảnh' },
        { from: '20000', to: '29999', count: 10000, note: 'Khối 2: Miền Bắc 1 (Tây Bắc & Đông Bắc) tự do' },
        { from: '30000', to: '34399', count: 4400, note: 'Khối 3: Miền Bắc 2 (Đồng bằng & Duyên hải Bắc Bộ)' },
        { from: '47000', to: '47999', count: 1000, note: 'Khối 4: Cơ quan EVN & Phụ trợ dự phòng' },
        { from: '52200', to: '56999', count: 4800, note: 'Khối 5: Miền Trung & Tây Nguyên mở rộng' },
        { from: '70000', to: '71099', count: 1100, note: 'Khối 7: Miền Nam 2 & Tây Nam Bộ tự do' },
        { from: '84000', to: '86999', count: 3000, note: 'Khối 8: Phân vùng EVNHCMC & Nam Bộ' },
        { from: '98500', to: '99899', count: 1400, note: 'Khối 9: Dự phòng Điều độ & Toàn quốc sẵn sàng cấp' }
    ];

    freeBlocks.forEach(b => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="fw-600">${b.note}</td>
            <td style="font-family:monospace; font-weight:700; color:var(--primary);">${b.from}</td>
            <td style="font-family:monospace; font-weight:700; color:var(--primary);">${b.to}</td>
            <td style="text-align: center;"><span class="badge-count">${b.count.toLocaleString('vi-VN')}</span></td>
            <td><span class="status-pill active">Sẵn sàng cấp</span></td>
            <td style="text-align: right;">
                <button class="btn btn-sm btn-primary" style="padding: 2px 8px; font-size: 0.75rem;" onclick="prefillAllocate('${b.from}', '${b.to}')">
                    Chọn cấp dải này
                </button>
            </td>
        `;
        tbody.appendChild(tr);
    });

    openModal('poolModal');
}

function prefillAllocate(from, to) {
    closeModal('poolModal');
    // Mở modal tạo nhóm hoặc cấp dải
    if (prefixGroups.length > 0) {
        openAllocateModal(prefixGroups[0].id);
        document.getElementById('rangeFromInput').value = from;
        document.getElementById('rangeToInput').value = to;
        calculateAllocCount();
    }
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
