// templates/admin/user_group.js – màn hình Nhóm người dùng (admin.user-groups, M02 mục 5.1)
//
// Danh sách nhóm dùng GET /api/v1/admin/user-groups (G01, mock mockGetUserGroups bên dưới mảng này).
// Hộp chi tiết dùng GET /api/v1/admin/user-groups/:id (G03, mock mockGetUserGroupDetail trên MOCK_UG_ROWS).
// Mảng userGroupsData là dữ liệu CŨ chỉ còn phục vụ các hộp sửa / quản trị viên / ngừng hoạt động
// (chưa rà: G05–G07); không phải dạng response của API.
// Màn hình chỉ có danh sách phẳng: không có tab/chế độ xem cây nhóm (API GET /user-groups/tree đã bỏ ở G02).

let userGroupsData = [
    {
        id: 1,
        code: "UMO-IT-01",
        name: "Khối Công nghệ Thông tin - Nhóm Vận hành",
        description: "Quản trị hệ thống máy chủ, hạ tầng mạng và giám sát tổng đài",
        organizationId: 2,
        organizationName: "Khối Công nghệ Thông tin",
        hierarchyPath: ["Tập đoàn Điện lực Việt Nam", "Tổng công ty 71", "Khối CNTT"],
        phonePrefixGroup: {
            id: 101,
            code: "PG-IT-01",
            name: "Nhóm dải số Khối CNTT (Trụ sở chính)",
            prefixes: ["42xxx", "46xxx"],
            totalNumbers: 2000
        },
        userCount: 45,
        representativeUserId: 10,
        representative: {
            id: 10,
            fullName: "Trần Thị B",
            email: "tran.b@71portal.vn",
            avatarUrl: "https://ui-avatars.com/api/?name=Tran+B&background=0033A0&color=fff"
        },
        admins: [
            { id: 10, fullName: "Trần Thị B", email: "tran.b@71portal.vn", isRep: true, avatarUrl: "https://ui-avatars.com/api/?name=Tran+B&background=0033A0&color=fff" },
            { id: 15, fullName: "Lê Văn C", email: "le.c@71portal.vn", isRep: false, avatarUrl: "https://ui-avatars.com/api/?name=Le+C&background=10b981&color=fff" }
        ],
        allowRecordingAccess: true,
        status: "ACTIVE",
        createdAt: "2026-03-15"
    },
    {
        id: 2,
        code: "UMO-IT-02",
        name: "Khối Công nghệ Thông tin - Nhóm Phần mềm",
        description: "Phát triển và bảo trì phần mềm lõi EVN CDR AS",
        organizationId: 2,
        organizationName: "Khối Công nghệ Thông tin",
        hierarchyPath: ["Tập đoàn Điện lực Việt Nam", "Tổng công ty 71", "Khối CNTT"],
        phonePrefixGroup: {
            id: 102,
            code: "PG-IT-02",
            name: "Nhóm dải số TT Phần mềm EVNICT",
            prefixes: ["43xxx"],
            totalNumbers: 1000
        },
        userCount: 32,
        representativeUserId: 18,
        representative: {
            id: 18,
            fullName: "Hoàng Văn Tuấn",
            email: "tuan.hv@71portal.vn",
            avatarUrl: "https://ui-avatars.com/api/?name=Hoang+Tuan&background=0284c7&color=fff"
        },
        admins: [
            { id: 18, fullName: "Hoàng Văn Tuấn", email: "tuan.hv@71portal.vn", isRep: true, avatarUrl: "https://ui-avatars.com/api/?name=Hoang+Tuan&background=0284c7&color=fff" }
        ],
        allowRecordingAccess: false,
        status: "ACTIVE",
        createdAt: "2026-04-02"
    },
    {
        id: 3,
        code: "UMO-KD-01",
        name: "Khối Kinh doanh & Dịch vụ Khách hàng",
        description: "Tiếp nhận cuộc gọi phản ánh điện lực và chăm sóc khách hàng",
        organizationId: 3,
        organizationName: "Khối Kinh doanh",
        hierarchyPath: ["Tập đoàn Điện lực Việt Nam", "Tổng công ty 71", "Khối Kinh doanh"],
        phonePrefixGroup: {
            id: 103,
            code: "PG-KD-01",
            name: "Nhóm dải số Call Center CSKH",
            prefixes: ["48xxx", "49xxx"],
            totalNumbers: 2000
        },
        userCount: 68,
        representativeUserId: 22,
        representative: {
            id: 22,
            fullName: "Phạm Thu Hương",
            email: "huong.pt@71portal.vn",
            avatarUrl: "https://ui-avatars.com/api/?name=Pham+Huong&background=f59e0b&color=fff"
        },
        admins: [
            { id: 22, fullName: "Phạm Thu Hương", email: "huong.pt@71portal.vn", isRep: true, avatarUrl: "https://ui-avatars.com/api/?name=Pham+Huong&background=f59e0b&color=fff" },
            { id: 25, fullName: "Đặng Quốc Huy", email: "huy.dq@71portal.vn", isRep: false, avatarUrl: "https://ui-avatars.com/api/?name=Dang+Huy&background=6366f1&color=fff" }
        ],
        allowRecordingAccess: true,
        status: "ACTIVE",
        createdAt: "2026-04-18"
    },
    {
        id: 4,
        code: "UMO-AUDIT-GLOBAL",
        name: "Tổ Giám sát Kiểm toán Độc lập",
        description: "Nhóm thanh tra kỹ thuật và kiểm toán độc lập cấp Tập đoàn",
        organizationId: null, // Nhóm độc lập không tham chiếu đơn vị
        organizationName: null,
        hierarchyPath: [],
        phonePrefixGroup: {
            id: 104,
            code: "PG-AUDIT-01",
            name: "Nhóm dải số Ban Kiểm toán",
            prefixes: ["20xxx"],
            totalNumbers: 1000
        },
        userCount: 12,
        representativeUserId: 31,
        representative: {
            id: 31,
            fullName: "Nguyễn Hải Nam",
            email: "nam.nh@evn.com.vn",
            avatarUrl: "https://ui-avatars.com/api/?name=Nguyen+Nam&background=64748b&color=fff"
        },
        admins: [
            { id: 31, fullName: "Nguyễn Hải Nam", email: "nam.nh@evn.com.vn", isRep: true, avatarUrl: "https://ui-avatars.com/api/?name=Nguyen+Nam&background=64748b&color=fff" }
        ],
        allowRecordingAccess: false,
        status: "ACTIVE",
        createdAt: "2026-05-10"
    },
    {
        id: 5,
        code: "UMO-EXPERT-SEC",
        name: "Tổ Chuyên gia SOC An toàn Thông tin",
        description: "Đội ngũ chuyên trách bảo mật trực ca 24/7 toàn hệ thống",
        organizationId: null, // Nhóm độc lập không tham chiếu đơn vị
        organizationName: null,
        hierarchyPath: [],
        phonePrefixGroup: {
            id: 105,
            code: "PG-SEC-01",
            name: "Nhóm dải số SOC Security Desk",
            prefixes: ["21xxx"],
            totalNumbers: 1000
        },
        userCount: 8,
        representativeUserId: 40,
        representative: {
            id: 40,
            fullName: "Vũ Minh Trí",
            email: "tri.vm@soc.evn.vn",
            avatarUrl: "https://ui-avatars.com/api/?name=Vu+Tri&background=dc2626&color=fff"
        },
        admins: [
            { id: 40, fullName: "Vũ Minh Trí", email: "tri.vm@soc.evn.vn", isRep: true, avatarUrl: "https://ui-avatars.com/api/?name=Vu+Tri&background=dc2626&color=fff" }
        ],
        status: "ACTIVE",
        createdAt: "2026-06-01"
    },
    {
        id: 6,
        code: "UMO-DRAFT-TEST",
        name: "Nhóm Thử nghiệm Trạm Biến áp 500kV",
        description: "Nhóm dự án kỹ thuật trạm TBA đang chuẩn bị vận hành (chưa có thành viên)",
        organizationId: 2,
        organizationName: "Khối Công nghệ Thông tin",
        hierarchyPath: ["Tập đoàn Điện lực Việt Nam", "Tổng công ty 71", "Khối CNTT"],
        phonePrefixGroup: {
            id: 106,
            code: "PG-TBA-500",
            name: "Nhóm dải số TBA 500kV Thường Tín",
            prefixes: ["41xxx"],
            totalNumbers: 1000
        },
        userCount: 0, // Nhóm rỗng để kiểm tra kịch bản cho phép xóa
        representativeUserId: 50,
        representative: {
            id: 50,
            fullName: "Bùi Quang Huy",
            email: "huy.bq@71portal.vn",
            avatarUrl: "https://ui-avatars.com/api/?name=Bui+Huy&background=0033A0&color=fff"
        },
        admins: [
            { id: 50, fullName: "Bùi Quang Huy", email: "huy.bq@71portal.vn", isRep: true, avatarUrl: "https://ui-avatars.com/api/?name=Bui+Huy&background=0033A0&color=fff" }
        ],
        status: "INACTIVE",
        createdAt: "2026-07-20"
    }
];

// Danh mục tất cả nhóm đầu số để mô phỏng kiểm tra tính khả dụng 1 - 1
const allPhonePrefixGroups = [
    { id: 101, code: "PG-IT-01", name: "Nhóm dải số Khối CNTT (Trụ sở chính)", prefixes: ["42xxx", "46xxx"], count: 2000 },
    { id: 102, code: "PG-IT-02", name: "Nhóm dải số TT Phần mềm EVNICT", prefixes: ["43xxx"], count: 1000 },
    { id: 103, code: "PG-KD-01", name: "Nhóm dải số Call Center CSKH", prefixes: ["48xxx", "49xxx"], count: 2000 },
    { id: 104, code: "PG-AUDIT-01", name: "Nhóm dải số Ban Kiểm toán", prefixes: ["20xxx"], count: 1000 },
    { id: 105, code: "PG-SEC-01", name: "Nhóm dải số SOC Security Desk", prefixes: ["21xxx"], count: 1000 },
    { id: 106, code: "PG-TBA-500", name: "Nhóm dải số TBA 500kV Thường Tín", prefixes: ["41xxx"], count: 1000 },
    // Các nhóm đầu số còn trống chưa ai liên kết:
    { id: 107, code: "PG-GENCO-01", name: "Nhóm dải số Nhà máy điện Phả Lại", prefixes: ["15xxx"], count: 1000 },
    { id: 108, code: "PG-NPC-01", name: "Nhóm dải số Tổng công ty Điện lực miền Bắc", prefixes: ["91xxx"], count: 2000 },
    { id: 109, code: "PG-CPC-01", name: "Nhóm dải số Tổng công ty Điện lực miền Trung", prefixes: ["93xxx"], count: 1000 }
];

let currentManagingGroupId = null;

/* ==========================================================================
 * Danh sách nhóm: GET /api/v1/admin/user-groups (G01, M02 mục 3.1)
 * Vue: UserGroupView.vue + useUserGroupStore (fetchUserGroups, query, pagination).
 * Kiểm tay mock: ?listError=1 (lỗi tải một lần, "Thử lại" thành công), ?listEmpty=1 (chưa có nhóm),
 * ?orgTreeError=1 (ô lọc đơn vị chỉ còn "Tất cả"/"Nhóm độc lập"), ?noManage=1 (thiếu user_group:manage).
 * Hộp chi tiết: mục "Chi tiết nhóm" bên dưới (G03). Các hộp sửa/quản trị viên/ngừng hoạt động vẫn dùng
 * mảng cũ userGroupsData cho tới khi rà G05–G07.
 * ========================================================================== */
const UG_QS = new URLSearchParams(window.location.search);
function ugNow() { return new Date().toISOString().replace('Z', '+07:00'); }
const ugCallApi = fn => (window.adminSession ? window.adminSession.request(fn) : fn('mock-token'));

// Bảng organizations giả lập (id, parent_id, code, name, level, sort_order, status) – cây 1 → 2 → 4, 1 → 3, 1 → 5
const MOCK_UG_ORGS = [
    { id: 1, parentId: null, code: 'TC-71', name: 'Tổng công ty 71', level: 0, sortOrder: 1, status: 'ACTIVE' },
    { id: 2, parentId: 1, code: 'IT-01', name: 'Khối Công nghệ Thông tin', level: 1, sortOrder: 1, status: 'ACTIVE' },
    { id: 3, parentId: 1, code: 'KD-01', name: 'Khối Kinh doanh', level: 1, sortOrder: 2, status: 'ACTIVE' },
    { id: 4, parentId: 2, code: 'DEV-01', name: 'Phòng Phát triển Phần mềm', level: 2, sortOrder: 1, status: 'ACTIVE' },
    { id: 5, parentId: 1, code: 'DL-TX', name: 'Điện lực Thanh Xuân', level: 1, sortOrder: 3, status: 'INACTIVE' }
];

// Dòng user_groups đã JOIN như câu SQL M02 mục 3.1 bước 3 / mục 3.1.2 bước 2 (số đếm, người đại diện, nhóm đầu số),
// kèm dải số (phone_prefix_ranges, bước 4) và Quản trị viên nhóm ACTIVE (mục 3.1.2 bước 5, người đại diện đứng đầu).
// adminCount của danh sách = admins.length. Nhóm INACTIVE: userCount = 0, representative = null, admins = [] (M02 mục 3.4).
const MOCK_UG_ROWS = [
    { id: 1, code: 'UMO-IT-01', name: 'Khối Công nghệ Thông tin - Nhóm Vận hành', status: 'ACTIVE', allowRecordingAccess: true,
      description: 'Quản trị vận hành hạ tầng máy chủ, hệ thống mạng và giám sát tổng đài',
      organizationId: 2, ppg: { id: 10, code: 'PG-UMO-IT-01', name: 'Nhóm đầu số Khối Công nghệ Thông tin - Nhóm Vận hành' },
      ranges: [
          { id: 23, prefix: '46', rangeFrom: '46000', rangeTo: '46999', totalNumbers: 1000, note: 'Cơ quan EVN Tháp A' },
          { id: 21, prefix: '42', rangeFrom: '42000', rangeTo: '42499', totalNumbers: 500, note: 'Hạ tầng máy chủ & NOC' },
          { id: 22, prefix: '42', rangeFrom: '42500', rangeTo: '42999', totalNumbers: 500, note: null }
      ],
      userCount: 45, representative: { id: 10, fullName: 'Trần Thị B', email: 'tran.b@71portal.vn', avatarUrl: null },
      admins: [
          { id: 10, fullName: 'Trần Thị B', email: 'tran.b@71portal.vn', phoneNumber: '0905123456', avatarUrl: null },
          { id: 11, fullName: 'Lê Văn C', email: 'le.c@71portal.vn', phoneNumber: null, avatarUrl: null }
      ],
      createdAt: '2026-03-15T08:30:00+07:00', updatedAt: '2026-10-02T16:20:00+07:00' },
    { id: 2, code: 'UMO-IT-02', name: 'Khối Công nghệ Thông tin - Nhóm Phần mềm', status: 'ACTIVE', allowRecordingAccess: false,
      description: null,
      organizationId: 4, ppg: { id: 11, code: 'PG-UMO-IT-02', name: 'Nhóm đầu số Khối Công nghệ Thông tin - Nhóm Phần mềm' },
      ranges: [
          { id: 31, prefix: '43', rangeFrom: '43000', rangeTo: '43499', totalNumbers: 500, note: 'Phát triển phần mềm' },
          { id: 32, prefix: '43', rangeFrom: '43500', rangeTo: '43799', totalNumbers: 300, note: 'Triển khai & kiểm thử' }
      ],
      userCount: 32, representative: { id: 18, fullName: 'Hoàng Văn Tuấn', email: 'tuan.hv@71portal.vn', avatarUrl: null },
      admins: [{ id: 18, fullName: 'Hoàng Văn Tuấn', email: 'tuan.hv@71portal.vn', phoneNumber: '0912 345 678', avatarUrl: null }],
      createdAt: '2026-04-02T10:00:00+07:00', updatedAt: '2026-04-02T10:00:00+07:00' },
    { id: 3, code: 'UMO-KD-01', name: 'Khối Kinh doanh & Dịch vụ Khách hàng', status: 'ACTIVE', allowRecordingAccess: true,
      description: 'Tiếp nhận cuộc gọi phản ánh điện lực, quản lý chất lượng chăm sóc khách hàng',
      organizationId: 3, ppg: { id: 12, code: 'PG-UMO-KD-01', name: 'Nhóm đầu số Call Center CSKH' },
      ranges: [
          { id: 41, prefix: '48', rangeFrom: '48000', rangeTo: '48999', totalNumbers: 1000, note: 'Tổng đài viên CSKH' },
          { id: 42, prefix: '49', rangeFrom: '49000', rangeTo: '49999', totalNumbers: 1000, note: 'Dịch vụ điện & hợp đồng' }
      ],
      userCount: 68, representative: { id: 22, fullName: 'Phạm Thu Hương', email: 'huong.pt@71portal.vn', avatarUrl: null },
      admins: [
          { id: 22, fullName: 'Phạm Thu Hương', email: 'huong.pt@71portal.vn', phoneNumber: '0983 111 222', avatarUrl: null },
          { id: 25, fullName: 'Đỗ Minh Khang', email: 'khang.dm@71portal.vn', phoneNumber: null, avatarUrl: null }
      ],
      createdAt: '2026-04-18T09:15:00+07:00', updatedAt: '2026-09-11T11:05:00+07:00' },
    { id: 4, code: 'UMO-AUDIT-GLOBAL', name: 'Tổ Giám sát Kiểm toán Độc lập', status: 'ACTIVE', allowRecordingAccess: false,
      description: 'Nhóm thanh tra kỹ thuật và kiểm toán độc lập cấp Tập đoàn',
      organizationId: null, ppg: { id: 13, code: 'PG-UMO-AUDIT-GLOBAL', name: 'Nhóm đầu số Tổ Giám sát Kiểm toán Độc lập' },
      ranges: [{ id: 51, prefix: '20', rangeFrom: '20000', rangeTo: '20999', totalNumbers: 1000, note: 'Ban Kiểm toán nội bộ' }],
      userCount: 12, representative: { id: 31, fullName: 'Nguyễn Hải Nam', email: 'nam.nh@evn.com.vn', avatarUrl: null },
      admins: [{ id: 31, fullName: 'Nguyễn Hải Nam', email: 'nam.nh@evn.com.vn', phoneNumber: '0904 555 666', avatarUrl: null }],
      createdAt: '2026-05-10T14:00:00+07:00', updatedAt: '2026-05-10T14:00:00+07:00' },
    { id: 5, code: 'UMO-EXPERT-SEC', name: 'Tổ Chuyên gia SOC An toàn Thông tin', status: 'ACTIVE', allowRecordingAccess: false,
      description: null,
      organizationId: null, ppg: { id: 14, code: 'PG-UMO-EXPERT-SEC', name: 'Nhóm đầu số Tổ Chuyên gia SOC An toàn Thông tin' },
      ranges: [],
      userCount: 1, representative: null,
      admins: [{ id: 40, fullName: 'Vũ Quốc Bảo', email: 'bao.vq@71portal.vn', phoneNumber: null, avatarUrl: null }],
      createdAt: '2026-06-01T08:00:00+07:00', updatedAt: '2026-06-01T08:00:00+07:00' },
    { id: 6, code: 'UMO-TBA-500', name: 'Nhóm Thử nghiệm Trạm Biến áp 500kV', status: 'INACTIVE', allowRecordingAccess: false,
      description: 'Nhóm thử nghiệm đã kết thúc',
      organizationId: 4, ppg: { id: 15, code: 'PG-UMO-TBA-500', name: 'Nhóm đầu số Nhóm Thử nghiệm Trạm Biến áp 500kV' },
      ranges: [],
      userCount: 0, representative: null, admins: [],
      createdAt: '2026-07-20T14:05:00+07:00', updatedAt: '2026-10-30T09:40:00+07:00' }
];

const UG_QUERY_KEYS = ['page', 'limit', 'search', 'status', 'organizationId', 'standalone'];
const UG_STATUSES = ['ACTIVE', 'INACTIVE'];
const ugCollator = new Intl.Collator('vi', { sensitivity: 'base' });
let ugListFailOnce = UG_QS.get('listError') === '1';

function ugUnauthorized() {
    return { success: false, statusCode: 401, errorCode: 'UNAUTHORIZED',
        message: 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại', errors: null, timestamp: ugNow() };
}
function ugValidationError(errors) {
    return { success: false, statusCode: 400, errorCode: 'VALIDATION_ERROR', message: 'Dữ liệu không hợp lệ', errors, timestamp: ugNow() };
}

// Giả lập GET /api/v1/admin/organizations/tree (M01 mục 3.1): data là mảng nút gốc, anh em sortOrder, name, id.
function mockGetOrgTreeForFilter(token) {
    return new Promise(resolve => setTimeout(resolve, 200)).then(() => {
        if (!token) return Promise.reject(ugUnauthorized());
        if (UG_QS.get('orgTreeError') === '1') {
            return Promise.reject({ statusCode: 0, message: 'Không kết nối được máy chủ. Vui lòng thử lại.' });
        }
        const build = parentId => MOCK_UG_ORGS.filter(o => o.parentId === parentId)
            .sort((a, b) => a.sortOrder - b.sortOrder || ugCollator.compare(a.name, b.name) || a.id - b.id)
            .map(o => Object.assign({}, o, { userGroupCount: MOCK_UG_ROWS.filter(g => g.organizationId === o.id).length, children: build(o.id) }));
        return { success: true, statusCode: 200, message: 'Lấy cây tổ chức thành công', data: build(null), timestamp: ugNow() };
    });
}

// Đường đi từ gốc tới chính đơn vị (M02 mục 4.1 getHierarchyPath), và đơn vị + mọi con cháu (getSubtreeIds)
function ugHierarchyPath(orgId) {
    const path = [];
    let cur = orgId;
    for (let step = 0; cur && step < 4; step++) {
        const org = MOCK_UG_ORGS.find(o => o.id === cur);
        if (!org) break;
        path.unshift(org.name);
        cur = org.parentId;
    }
    return path;
}
function ugSubtreeIds(rootId) {
    if (!MOCK_UG_ORGS.some(o => o.id === rootId)) return [];
    const ids = [rootId];
    for (let i = 0; i < ids.length; i++) MOCK_UG_ORGS.forEach(o => { if (o.parentId === ids[i]) ids.push(o.id); });
    return ids;
}

// Giả lập GET /api/v1/admin/user-groups (M02 mục 3.1). Token thiếu → 401; tham số lạ/lặp lại, page/limit sai,
// search > 100, status lạ, organizationId sai định dạng (kể cả "null"), standalone khác "true" hoặc đi cùng
// organizationId → 400; organizationId không tồn tại → 200 rỗng. Sắp code, id; phần tử đúng 13 trường.
function mockGetUserGroups(token, query) {
    return new Promise(resolve => setTimeout(resolve, 300)).then(() => {
        if (!token) return Promise.reject(ugUnauthorized());
        const q = query || {};
        const errors = {};
        Object.keys(q).forEach(k => {
            if (!UG_QUERY_KEYS.includes(k)) errors[k] = ['Tham số không được nhận'];
            else if (Array.isArray(q[k])) errors[k] = ['Chỉ gửi tham số một lần'];
        });
        const pick = k => (typeof q[k] === 'string' ? q[k] : undefined);
        const intParam = (k, def, max) => {
            const v = pick(k);
            if (v === undefined) return def;
            if (!/^[1-9][0-9]{0,8}$/.test(v) || (max && Number(v) > max)) {
                errors[k] = [max ? 'Phải là số nguyên từ 1 đến ' + max : 'Phải là số nguyên ≥ 1'];
                return def;
            }
            return Number(v);
        };
        const page = intParam('page', 1);
        const limit = intParam('limit', 20, 100);
        let search = pick('search');
        search = search === undefined ? '' : search.trim();
        if (search.length > 100) errors.search = ['Tối đa 100 ký tự'];
        const status = pick('status') || '';
        if (status && !UG_STATUSES.includes(status)) errors.status = ['Trạng thái không hợp lệ'];
        const orgParam = pick('organizationId');
        let orgId = null;
        if (orgParam !== undefined && orgParam !== '') {
            if (!/^[1-9][0-9]{0,9}$/.test(orgParam) || Number(orgParam) > 4294967295) errors.organizationId = ['Mã đơn vị không hợp lệ'];
            else orgId = Number(orgParam);
        }
        const standaloneParam = pick('standalone');
        const standalone = standaloneParam === 'true';
        if (standaloneParam !== undefined && !standalone) errors.standalone = ['Chỉ nhận giá trị true'];
        else if (standalone && orgParam !== undefined && orgParam !== '') errors.standalone = ['Không dùng cùng organizationId'];
        if (Object.keys(errors).length) return Promise.reject(ugValidationError(errors));

        if (ugListFailOnce) {
            ugListFailOnce = false;
            return Promise.reject({ statusCode: 0, message: 'Không kết nối được máy chủ. Vui lòng thử lại.' });
        }
        const orgIds = orgId === null ? null : ugSubtreeIds(orgId);
        const needle = search.toLocaleLowerCase('vi');
        const source = UG_QS.get('listEmpty') === '1' ? [] : MOCK_UG_ROWS;
        const rows = source.filter(g => (!status || g.status === status)
            && (!orgIds || orgIds.includes(g.organizationId))
            && (!standalone || g.organizationId === null)
            && (!needle || [g.code, g.name].some(v => v.toLocaleLowerCase('vi').includes(needle))));
        rows.sort((a, b) => ugCollator.compare(a.code, b.code) || a.id - b.id);
        const total = rows.length;
        const totalPages = Math.ceil(total / limit);
        const data = rows.slice((page - 1) * limit, page * limit).map(g => {
            const path = ugHierarchyPath(g.organizationId);
            const prefixes = [...new Set(g.ranges.map(r => r.prefix))].sort();
            return {
                id: g.id, code: g.code, name: g.name, status: g.status, allowRecordingAccess: g.allowRecordingAccess,
                organizationId: g.organizationId,
                organizationName: g.organizationId === null ? null : path[path.length - 1],
                hierarchyPath: path,
                phonePrefixGroup: { id: g.ppg.id, code: g.ppg.code, prefixes, totalNumbers: g.ranges.reduce((s, r) => s + r.totalNumbers, 0) },
                userCount: g.userCount, adminCount: g.admins.length,
                representative: g.representative ? Object.assign({}, g.representative) : null,
                createdAt: g.createdAt
            };
        });
        return {
            success: true, statusCode: 200, message: 'Lấy danh sách nhóm người dùng thành công', data,
            pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
            timestamp: ugNow()
        };
    });
}

// Trạng thái bộ lọc (Vue: useUserGroupStore.query). limit = itemsPerPage của preferencesAdmin (10/20/50, mặc định 10).
const ugQuery = { page: 1, search: '', status: '', org: '' }; // org: '' | 'standalone' | '<id>'
let ugRequestSeq = 0; // chỉ hiển thị response của request gửi sau cùng

function canManageUserGroups() {
    if (UG_QS.get('noManage') === '1') return false;
    const account = window.adminSession ? window.adminSession.getAccount() : null;
    return !!(account && (account.permissions || []).includes('user_group:manage'));
}

// Phần tử data-permission="user_group:manage" (nút "Thêm nhóm mới") ẩn khi store thiếu mã; gọi sau khi có tài khoản.
function applyUgPermissions() {
    const manage = canManageUserGroups();
    document.querySelectorAll('[data-permission="user_group:manage"]').forEach(el => { el.hidden = !manage; });
}

function ugItemsPerPage() {
    const prefs = window.adminSession && window.adminSession.getPreferences ? window.adminSession.getPreferences() : null;
    const n = prefs && prefs.itemsPerPage;
    return [10, 20, 50].includes(n) ? n : 10;
}

document.addEventListener('DOMContentLoaded', function () {
    setupEventListeners();
    applyUgPermissions();
    loadOrgFilterOptions();
    loadUserGroups();
});

function setupEventListeners() {
    const searchInput = document.getElementById('searchGroupInput');
    const orgFilter = document.getElementById('filterOrgSelect');
    const statusFilter = document.getElementById('filterStatusSelect');

    // Tìm kiếm gửi sau 300 ms ngừng gõ hoặc khi nhấn Enter; đổi bộ lọc thì về trang 1.
    let searchTimer = null;
    const applySearch = () => {
        clearTimeout(searchTimer);
        const value = searchInput.value.trim();
        if (value === ugQuery.search) return;
        ugQuery.search = value;
        ugQuery.page = 1;
        loadUserGroups();
    };
    if (searchInput) {
        searchInput.addEventListener('input', () => { clearTimeout(searchTimer); searchTimer = setTimeout(applySearch, 300); });
        searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); applySearch(); } });
    }
    if (orgFilter) orgFilter.addEventListener('change', () => { ugQuery.org = orgFilter.value; ugQuery.page = 1; loadUserGroups(); });
    if (statusFilter) statusFilter.addEventListener('change', () => { ugQuery.status = statusFilter.value; ugQuery.page = 1; loadUserGroups(); });

    const pageList = document.getElementById('ugPageList');
    if (pageList) pageList.addEventListener('click', e => {
        const link = e.target.closest('.page-link');
        if (!link) return;
        e.preventDefault();
        if (!link.dataset.page) return;
        ugQuery.page = Number(link.dataset.page);
        loadUserGroups();
    });

    // Close modal on click outside backdrop or ESC key
    window.addEventListener('click', function (e) {
        if (e.target.classList && e.target.classList.contains('modal')) {
            if (e.target.id === 'groupDetailModal') { closeGroupDetail(); return; }
            e.target.classList.remove('show');
            document.body.style.overflow = '';
        }
    });

    window.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            if (ugDetailId) closeGroupDetail();
            document.querySelectorAll('.modal.show').forEach(m => {
                m.classList.remove('show');
            });
            document.body.style.overflow = '';
        }
    });
}

// Ô lọc đơn vị: "Tất cả", "Nhóm độc lập", rồi các đơn vị của cây (thụt lề theo level). Cây lỗi: giữ hai lựa chọn đầu.
function loadOrgFilterOptions() {
    const select = document.getElementById('filterOrgSelect');
    if (!select) return Promise.resolve();
    return ugCallApi(token => mockGetOrgTreeForFilter(token))
        .then(res => {
            while (select.options.length > 2) select.remove(2);
            (function walk(nodes) {
                nodes.forEach(n => {
                    const opt = document.createElement('option');
                    opt.value = String(n.id);
                    opt.textContent = '  '.repeat(n.level) + (n.level ? '↳ ' : '') + n.name
                        + (n.status === 'ACTIVE' ? '' : ' (ngừng hoạt động)');
                    select.appendChild(opt);
                    walk(n.children);
                });
            })(res.data);
        })
        .catch(() => { /* lỗi tải cây không chặn danh sách; 401 đã được request() xử lý */ });
}

function ugBuildQuery() {
    // limit đọc lại mỗi lần gửi: store preferencesAdmin có thể nạp xong sau khi màn hình mở
    const query = { page: String(ugQuery.page), limit: String(ugItemsPerPage()) };
    if (ugQuery.search) query.search = ugQuery.search;
    if (ugQuery.status) query.status = ugQuery.status;
    if (ugQuery.org === 'standalone') query.standalone = 'true';
    else if (ugQuery.org) query.organizationId = ugQuery.org;
    return query;
}

function setUgState(state, message) {
    const box = document.getElementById('ugListState');
    const msg = document.getElementById('ugListMessage');
    const retry = document.getElementById('btnRetryUserGroups');
    const wrap = document.getElementById('listViewContainer');
    const pagination = document.getElementById('ugPagination');
    if (box) {
        box.hidden = state === 'ready';
        box.classList.toggle('is-error', state === 'error');
    }
    if (msg && message) msg.textContent = message;
    if (retry) retry.hidden = state !== 'error';
    if (wrap) wrap.hidden = state !== 'ready';
    if (pagination && state !== 'ready') pagination.hidden = true;
    const total = document.getElementById('ugTotalBadge');
    if (total && state !== 'ready') total.hidden = true;
}

function loadUserGroups() {
    const seq = ++ugRequestSeq;
    setUgState('loading', 'Đang tải danh sách nhóm người dùng...');
    return ugCallApi(token => mockGetUserGroups(token, ugBuildQuery()))
        .then(res => {
            if (seq !== ugRequestSeq) return; // đã có request mới hơn
            applyUgPermissions();
            const p = res.pagination;
            if (!res.data.length && p.page > 1 && p.totalPages > 0) {
                ugQuery.page = p.totalPages; // danh sách ngắn lại: lùi về trang cuối
                return loadUserGroups();
            }
            if (!res.data.length) {
                const filtered = ugQuery.search || ugQuery.status || ugQuery.org;
                setUgState('empty', filtered ? 'Không có nhóm người dùng phù hợp với bộ lọc' : 'Chưa có nhóm người dùng nào');
                return;
            }
            renderUserGroupsTable(res.data);
            setUgState('ready');
            renderUgPagination(p, res.data.length);
        })
        .catch(err => {
            if (seq !== ugRequestSeq) return;
            if (err && err.statusCode === 401) return; // request() đã chuyển về login
            setUgState('error', (err && err.message) || 'Không tải được danh sách nhóm người dùng. Vui lòng thử lại.');
        });
}

function renderUgPagination(p, count) {
    const box = document.getElementById('ugPagination');
    const info = document.getElementById('ugPageInfo');
    const list = document.getElementById('ugPageList');
    const totalBadge = document.getElementById('ugTotalBadge');
    if (totalBadge) { totalBadge.textContent = p.total + ' nhóm'; totalBadge.hidden = false; }
    if (!box || !info || !list) return;
    const from = (p.page - 1) * p.limit + 1;
    info.textContent = 'Hiển thị ' + from + '–' + (from + count - 1) + ' / ' + p.total + ' nhóm';
    list.replaceChildren();
    const addItem = (label, page, { disabled = false, active = false, aria } = {}) => {
        const li = document.createElement('li');
        li.className = 'page-item' + (disabled ? ' disabled' : '') + (active ? ' active' : '');
        const a = document.createElement('a');
        a.href = '#';
        a.className = 'page-link';
        a.textContent = label;
        if (aria) a.setAttribute('aria-label', aria);
        if (active) a.setAttribute('aria-current', 'page');
        if (!disabled && !active) a.dataset.page = String(page);
        li.appendChild(a);
        list.appendChild(li);
    };
    addItem('«', p.page - 1, { disabled: !p.hasPrev, aria: 'Trang trước' });
    const first = Math.max(1, Math.min(p.page - 2, p.totalPages - 4));
    const last = Math.min(p.totalPages, first + 4);
    for (let i = first; i <= last; i++) addItem(String(i), i, { active: i === p.page });
    addItem('»', p.page + 1, { disabled: !p.hasNext, aria: 'Trang sau' });
    box.hidden = false;
}

function ugEsc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function ugFormatDate(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || '');
    return m ? m[3] + '/' + m[2] + '/' + m[1] : '';
}
function ugInitials(name) {
    const parts = String(name || '').trim().split(/\s+/);
    return ((parts.length > 1 ? parts[0][0] : '') + (parts[parts.length - 1][0] || '')).toUpperCase();
}

const UG_ICONS = {
    view: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>',
    admins: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>',
    edit: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>',
    remove: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>',
    org: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>',
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
    rec: '<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>'
};

// Một dòng = một phần tử của GET /admin/user-groups (13 trường, M02 mục 3.1). Không dùng trường không có trong response.
function renderUserGroupsTable(data) {
    const tbody = document.getElementById('userGroupsTableBody');
    if (!tbody) return;
    const manage = canManageUserGroups();
    tbody.innerHTML = data.map(group => {
        const active = group.status === 'ACTIVE';
        const orgContent = group.hierarchyPath.length
            ? `<div class="ug-org-cell">${UG_ICONS.org}<div>
                   <span class="ug-org-name">${ugEsc(group.organizationName)}</span>
                   ${group.hierarchyPath.length > 1 ? `<span class="ug-org-path">${group.hierarchyPath.slice(0, -1).map(ugEsc).join(' › ')}</span>` : ''}
               </div></div>`
            : `<span class="badge-standalone">Nhóm độc lập</span>`;
        const ppg = group.phonePrefixGroup;
        const prefixText = ppg.prefixes.length
            ? ppg.prefixes.map(p => ugEsc(p) + 'xxx').join(', ') + ' · ' + ppg.totalNumbers.toLocaleString('vi-VN') + ' số'
            : 'Chưa cấp dải số';
        const rep = group.representative;
        const repContent = rep
            ? `<div class="ug-rep">
                   ${rep.avatarUrl ? `<img class="ug-rep-avatar" src="${ugEsc(rep.avatarUrl)}" alt="">` : `<span class="ug-rep-avatar">${ugEsc(ugInitials(rep.fullName))}</span>`}
                   <div><span class="ug-rep-name">${ugEsc(rep.fullName)}</span><span class="ug-rep-email">${ugEsc(rep.email)}</span></div>
               </div>`
            : `<span class="text-muted">Chưa có người đại diện</span>`;
        const writeButtons = manage && active ? `
                <button class="action-btn" onclick="openManageAdminsModal(${group.id})" title="Quản trị viên nhóm">${UG_ICONS.admins}</button>
                <button class="action-btn edit-btn" onclick="openEditGroupModal(${group.id})" title="Sửa nhóm">${UG_ICONS.edit}</button>
                <button class="action-btn delete-btn" onclick="openDeleteGroupModal(${group.id})" title="Ngừng hoạt động nhóm">${UG_ICONS.remove}</button>` : '';
        return `
            <tr>
                <td>
                    <div class="group-title-cell">
                        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                            <span class="group-code">${ugEsc(group.code)}</span>
                            <span class="badge-status ${active ? 'active' : 'inactive'}">${active ? 'Hoạt động' : 'Ngừng hoạt động'}</span>
                            ${group.allowRecordingAccess ? `<span class="badge-recording" title="Đã cấp quyền ghi âm cho nhóm (Tầng 1)">${UG_ICONS.rec} Ghi âm</span>` : ''}
                        </div>
                        <a href="#" class="group-name" onclick="event.preventDefault(); openGroupDetailModal(${group.id}, '${ugEsc(group.code)}')" title="Xem chi tiết nhóm">${ugEsc(group.name)}</a>
                    </div>
                </td>
                <td>${orgContent}</td>
                <td><div class="ug-ppg"><span class="group-code">${ugEsc(ppg.code)}</span><span class="ug-ppg-prefixes">${prefixText}</span></div></td>
                <td>${repContent}<span class="ug-admin-count">${group.adminCount} quản trị viên</span></td>
                <td><span class="member-count-badge ug-member-count" title="Thành viên chưa ngừng hoạt động">${UG_ICONS.users} ${group.userCount}</span></td>
                <td class="ug-date">${ugFormatDate(group.createdAt)}</td>
                <td class="text-right" style="white-space: nowrap;">
                    <div class="action-btn-group">
                        <button class="action-btn view-btn" onclick="openGroupDetailModal(${group.id}, '${ugEsc(group.code)}')" title="Xem chi tiết nhóm">${UG_ICONS.view}</button>${writeButtons}
                    </div>
                </td>
            </tr>`;
    }).join('');
}

// Modal Handlers
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('show');
        document.body.style.overflow = 'hidden';
    }
}

function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('show');
        document.body.style.overflow = '';
    }
}

/* ==========================================================================
 * Chi tiết nhóm: GET /api/v1/admin/user-groups/:id (G03, M02 mục 3.1.2)
 * Vue: hộp chi tiết của UserGroupView.vue. Gọi API mỗi lần mở hộp (không dùng dữ liệu dòng danh sách),
 * chỉ hiển thị response của lần mở sau cùng; 404 → đóng hộp + toast cảnh báo + tải lại danh sách.
 * Kiểm tay mock: ?detailError=1 (lỗi tải một lần, "Thử lại" thành công), ?detailMissing=<id> (nhóm vừa mất → 404).
 * ========================================================================== */
let ugDetailFailOnce = UG_QS.get('detailError') === '1';
let ugDetailSeq = 0;
let ugDetailId = null;   // nhóm đang mở trong hộp
let ugDetailData = null; // data của response sau cùng (nút thao tác tính theo đây)

// Giả lập GET /api/v1/admin/user-groups/:id. Token thiếu → 401; :id sai định dạng hoặc có query → 400;
// không có nhóm → 404 NOT_FOUND. data đúng 15 trường (không có adminCount), ranges sắp rangeFrom, id.
function mockGetUserGroupDetail(token, idParam, query) {
    return new Promise(resolve => setTimeout(resolve, 300)).then(() => {
        if (!token) return Promise.reject(ugUnauthorized());
        const errors = {};
        const idStr = String(idParam);
        if (!/^[1-9][0-9]{0,9}$/.test(idStr) || Number(idStr) > 4294967295) errors.id = ['Mã nhóm không hợp lệ'];
        Object.keys(query || {}).forEach(k => { errors[k] = ['Tham số không được nhận']; });
        if (Object.keys(errors).length) return Promise.reject(ugValidationError(errors));
        if (ugDetailFailOnce) {
            ugDetailFailOnce = false;
            return Promise.reject({ statusCode: 0, message: 'Không kết nối được máy chủ. Vui lòng thử lại.' });
        }
        const g = MOCK_UG_ROWS.find(row => row.id === Number(idStr));
        if (!g || UG_QS.get('detailMissing') === idStr) {
            return Promise.reject({ success: false, statusCode: 404, errorCode: 'NOT_FOUND',
                message: 'Không tìm thấy nhóm người dùng', errors: null, timestamp: ugNow() });
        }
        const path = ugHierarchyPath(g.organizationId);
        const ranges = g.ranges.slice()
            .sort((a, b) => (a.rangeFrom < b.rangeFrom ? -1 : a.rangeFrom > b.rangeFrom ? 1 : a.id - b.id))
            .map(r => Object.assign({}, r));
        return {
            success: true, statusCode: 200, message: 'Lấy chi tiết nhóm người dùng thành công',
            data: {
                id: g.id, code: g.code, name: g.name, description: g.description, status: g.status,
                allowRecordingAccess: g.allowRecordingAccess,
                organizationId: g.organizationId,
                organizationName: g.organizationId === null ? null : path[path.length - 1],
                hierarchyPath: path,
                phonePrefixGroup: {
                    id: g.ppg.id, code: g.ppg.code, name: g.ppg.name,
                    prefixes: [...new Set(ranges.map(r => r.prefix))].sort(),
                    totalNumbers: ranges.reduce((s, r) => s + r.totalNumbers, 0),
                    ranges
                },
                userCount: g.userCount,
                representative: g.representative ? Object.assign({}, g.representative) : null,
                admins: g.admins.map(a => Object.assign({}, a)),
                createdAt: g.createdAt, updatedAt: g.updatedAt
            },
            timestamp: ugNow()
        };
    });
}

function ugFormatDateTime(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso || '');
    return m ? m[3] + '/' + m[2] + '/' + m[1] + ' ' + m[4] + ':' + m[5] : '';
}

// Bấm tên nhóm / nút "Xem chi tiết" trên dòng: tiêu đề lấy mã từ dòng đã bấm, thân hộp tải từ API.
function openGroupDetailModal(groupId, code) {
    ugDetailId = groupId;
    ugDetailData = null;
    const codeEl = document.getElementById('detailGroupCode');
    if (codeEl) codeEl.textContent = code || '';
    openModal('groupDetailModal');
    loadGroupDetail(groupId);
}

function closeGroupDetail() {
    closeModal('groupDetailModal');
    ugDetailId = null;
    ugDetailData = null;
    ugDetailSeq++; // bỏ response đang chờ
}

function setGroupDetailState(message, isError) {
    const box = document.getElementById('groupDetailState');
    const content = document.getElementById('groupDetailContent');
    const msg = document.getElementById('groupDetailMessage');
    const retry = document.getElementById('btnRetryGroupDetail');
    if (box) { box.hidden = !message; box.classList.toggle('is-error', !!isError); }
    if (msg) msg.textContent = message || '';
    if (retry) {
        retry.hidden = !isError;
        retry.onclick = () => { if (ugDetailId) loadGroupDetail(ugDetailId); };
    }
    if (content && message) content.hidden = true;
    if (message) updateGroupDetailActions(null);
}

function loadGroupDetail(id) {
    const seq = ++ugDetailSeq;
    setGroupDetailState('Đang tải chi tiết nhóm người dùng...', false);
    return ugCallApi(token => mockGetUserGroupDetail(token, String(id), {}))
        .then(res => {
            if (seq !== ugDetailSeq || ugDetailId !== id) return;
            ugDetailData = res.data;
            renderGroupDetail(res.data);
            setGroupDetailState(null);
        })
        .catch(err => {
            if (seq !== ugDetailSeq || ugDetailId !== id) return;
            if (err && err.statusCode === 401) return; // request() đã chuyển về login
            if (err && err.statusCode === 404) {
                closeGroupDetail();
                showToast('Nhóm người dùng không còn tồn tại', 'warning');
                loadUserGroups();
                return;
            }
            setGroupDetailState((err && err.message) || 'Không tải được chi tiết nhóm. Vui lòng thử lại.', true);
        });
}

// Nút ghi chỉ khi có user_group:manage và nhóm ACTIVE (nhóm INACTIVE là trạng thái cuối); ẩn khi đang tải/lỗi.
function updateGroupDetailActions(data) {
    const show = !!(data && data.status === 'ACTIVE' && canManageUserGroups());
    ['detailEditGroupBtn', 'detailManageAdminsBtn', 'detailDeleteGroupBtn'].forEach(id => {
        const btn = document.getElementById(id);
        if (btn) btn.hidden = !show;
    });
}

function groupActionFromDetail(action) {
    const id = ugDetailId;
    closeGroupDetail();
    if (!id) return;
    if (action === 'edit') openEditGroupModal(id);
    else if (action === 'admins') openManageAdminsModal(id);
    else if (action === 'delete') openDeleteGroupModal(id);
}

// Vẽ thân hộp từ data của GET .../:id (15 trường). Không dùng trường không có trong response.
function renderGroupDetail(data) {
    const content = document.getElementById('groupDetailContent');
    if (!content) return;
    const set = (key, html) => { const el = content.querySelector('[data-detail="' + key + '"]'); if (el) el.innerHTML = html; };
    const codeEl = document.getElementById('detailGroupCode');
    if (codeEl) codeEl.textContent = data.code;
    const active = data.status === 'ACTIVE';
    set('name', ugEsc(data.name));
    set('status', `<span class="badge-status ${active ? 'active' : 'inactive'}">${active ? 'Hoạt động' : 'Ngừng hoạt động'}</span>`);
    set('organization', data.hierarchyPath.length
        ? `<div class="ug-org-cell">${UG_ICONS.org}<div>
               <span class="ug-org-name">${ugEsc(data.organizationName)}</span>
               ${data.hierarchyPath.length > 1 ? `<span class="ug-org-path">${data.hierarchyPath.slice(0, -1).map(ugEsc).join(' › ')}</span>` : ''}
           </div></div>`
        : `<span class="badge-standalone">Nhóm độc lập</span>`);
    set('description', data.description === null ? '<span class="text-muted">Chưa có mô tả</span>' : ugEsc(data.description));
    set('recording', data.allowRecordingAccess
        ? `<span class="badge-recording">${UG_ICONS.rec} Đã cấp quyền nghe/tải ghi âm</span>`
        : `<span class="text-muted">Chưa cấp quyền</span>`);
    set('userCount', String(data.userCount));
    set('createdAt', ugEsc(ugFormatDateTime(data.createdAt)));
    set('updatedAt', ugEsc(ugFormatDateTime(data.updatedAt)));

    const ppg = data.phonePrefixGroup;
    set('ppgCode', ugEsc(ppg.code));
    set('ppgName', ugEsc(ppg.name));
    set('totalNumbers', ppg.totalNumbers.toLocaleString('vi-VN') + ' số');
    const rangesEl = document.getElementById('detailGroupRanges');
    if (rangesEl) {
        rangesEl.innerHTML = ppg.ranges.length
            ? `<table class="ug-detail-ranges">
                   <thead><tr><th>Dải số</th><th class="text-right">Số lượng</th><th>Ghi chú</th></tr></thead>
                   <tbody>${ppg.ranges.map(r => `
                       <tr>
                           <td class="ug-range-text">${ugEsc(r.rangeFrom)} – ${ugEsc(r.rangeTo)}</td>
                           <td class="text-right">${r.totalNumbers.toLocaleString('vi-VN')}</td>
                           <td>${r.note === null ? '<span class="text-muted">—</span>' : ugEsc(r.note)}</td>
                       </tr>`).join('')}</tbody>
               </table>`
            : `<p class="text-muted ug-detail-empty">Chưa cấp dải số</p>`;
    }

    set('adminTotal', data.admins.length + ' đang hoạt động');
    const repId = data.representative ? data.representative.id : null;
    const adminsEl = document.getElementById('detailGroupAdminsList');
    if (adminsEl) {
        adminsEl.innerHTML = data.admins.length
            ? data.admins.map(a => `
                <div class="ug-detail-admin">
                    ${a.avatarUrl ? `<img class="ug-rep-avatar" src="${ugEsc(a.avatarUrl)}" alt="">` : `<span class="ug-rep-avatar">${ugEsc(ugInitials(a.fullName))}</span>`}
                    <div class="ug-detail-admin-info">
                        <span class="ug-rep-name">${ugEsc(a.fullName)}</span>
                        <span class="ug-rep-email">${ugEsc(a.email)}${a.phoneNumber ? ' · ' + ugEsc(a.phoneNumber) : ''}</span>
                    </div>
                    ${a.id === repId ? '<span class="ug-detail-rep-badge">Đại diện</span>' : ''}
                </div>`).join('')
            : `<p class="text-muted ug-detail-empty">Không có Quản trị viên đang hoạt động</p>`;
    }
    content.hidden = false;
    updateGroupDetailActions(data);
}

function openCreateGroupModal() {
    document.getElementById('modalTitle').innerText = 'Thiết lập Nhóm người dùng mới';
    document.getElementById('groupForm').reset();
    document.getElementById('groupIdInput').value = '';
    const recInput = document.getElementById('groupAllowRecordingInput');
    if (recInput) recInput.checked = false;

    populatePrefixGroupSelect(null);
    openModal('userGroupModal');
}

function openEditGroupModal(groupId) {
    const group = userGroupsData.find(g => g.id === groupId);
    if (!group) return;

    document.getElementById('modalTitle').innerText = 'Chỉnh sửa Nhóm người dùng';
    document.getElementById('groupIdInput').value = group.id;
    document.getElementById('groupCodeInput').value = group.code;
    document.getElementById('groupNameInput').value = group.name;
    document.getElementById('groupDescInput').value = group.description || '';
    document.getElementById('groupStatusSelect').value = group.status;
    const recInput = document.getElementById('groupAllowRecordingInput');
    if (recInput) recInput.checked = !!group.allowRecordingAccess;

    // Set organization: null hoặc ID
    const orgSelect = document.getElementById('groupOrgSelect');
    if (orgSelect) {
        orgSelect.value = group.organizationId !== null ? String(group.organizationId) : 'null';
    }

    populatePrefixGroupSelect(group.phonePrefixGroup.id);
    openModal('userGroupModal');
}

function populatePrefixGroupSelect(selectedId) {
    const select = document.getElementById('groupPrefixSelect');
    if (!select) return;

    // Tìm các prefix group đã bị nhóm khác sử dụng
    const occupiedIds = userGroupsData
        .filter(g => g.phonePrefixGroup && g.phonePrefixGroup.id !== selectedId)
        .map(g => g.phonePrefixGroup.id);

    select.innerHTML = '<option value="">-- Chọn Nhóm đầu số điện thoại (Liên kết 1-1) --</option>';

    allPhonePrefixGroups.forEach(ppg => {
        const isOccupied = occupiedIds.includes(ppg.id);
        const isCurrent = selectedId === ppg.id;

        const opt = document.createElement('option');
        opt.value = ppg.id;
        opt.disabled = isOccupied;
        opt.selected = isCurrent;
        opt.textContent = `${ppg.code} - ${ppg.name} (${ppg.prefixes.join(', ')}) ${isOccupied ? ' [ĐÃ ĐƯỢC GÁN]' : ' [KHẢ DỤNG]'}`;
        select.appendChild(opt);
    });
}

function saveUserGroup() {
    const groupId = document.getElementById('groupIdInput').value;
    const code = document.getElementById('groupCodeInput').value.trim();
    const name = document.getElementById('groupNameInput').value.trim();
    const desc = document.getElementById('groupDescInput').value.trim();
    const orgVal = document.getElementById('groupOrgSelect').value;
    const prefixId = parseInt(document.getElementById('groupPrefixSelect').value, 10);
    const status = document.getElementById('groupStatusSelect').value;
    const allowRecordingAccess = !!document.getElementById('groupAllowRecordingInput')?.checked;

    if (!code || !name) {
        showToast('Vui lòng điền mã nhóm và tên nhóm', 'error');
        return;
    }

    if (!prefixId) {
        showToast('Vui lòng chọn nhóm đầu số điện thoại liên kết 1-1', 'error');
        return;
    }

    // Kiểm tra ràng buộc 1 - 1
    const conflictGroup = userGroupsData.find(g =>
        g.phonePrefixGroup &&
        g.phonePrefixGroup.id === prefixId &&
        (!groupId || g.id !== parseInt(groupId, 10))
    );

    if (conflictGroup) {
        showToast(`Nhóm đầu số này đã liên kết với "${conflictGroup.name}" theo ràng buộc 1-1!`, 'error');
        return;
    }

    const selectedPPG = allPhonePrefixGroups.find(p => p.id === prefixId);
    const orgId = orgVal === 'null' ? null : parseInt(orgVal, 10);

    let orgName = null;
    let hierarchyPath = [];
    if (orgId === 2) {
        orgName = 'Khối Công nghệ Thông tin';
        hierarchyPath = ['Tập đoàn Điện lực Việt Nam', 'Tổng công ty 71', 'Khối CNTT'];
    } else if (orgId === 3) {
        orgName = 'Khối Kinh doanh';
        hierarchyPath = ['Tập đoàn Điện lực Việt Nam', 'Tổng công ty 71', 'Khối Kinh doanh'];
    } else if (orgId === 4) {
        orgName = 'Điện lực Thanh Xuân';
        hierarchyPath = ['Tập đoàn Điện lực Việt Nam', 'EVNHANOI', 'Điện lực Thanh Xuân'];
    }

    if (groupId) {
        // Cập nhật
        const idx = userGroupsData.findIndex(g => g.id === parseInt(groupId, 10));
        if (idx !== -1) {
            userGroupsData[idx].code = code;
            userGroupsData[idx].name = name;
            userGroupsData[idx].description = desc;
            userGroupsData[idx].organizationId = orgId;
            userGroupsData[idx].organizationName = orgName;
            userGroupsData[idx].hierarchyPath = hierarchyPath;
            userGroupsData[idx].phonePrefixGroup = {
                id: selectedPPG.id,
                code: selectedPPG.code,
                name: selectedPPG.name,
                prefixes: selectedPPG.prefixes,
                totalNumbers: selectedPPG.count
            };
            userGroupsData[idx].allowRecordingAccess = allowRecordingAccess;
            userGroupsData[idx].status = status;
            showToast('Cập nhật nhóm người dùng thành công', 'success');
        }
    } else {
        // Thêm mới
        const newGroup = {
            id: Date.now(),
            code: code,
            name: name,
            description: desc,
            organizationId: orgId,
            organizationName: orgName,
            hierarchyPath: hierarchyPath,
            phonePrefixGroup: {
                id: selectedPPG.id,
                code: selectedPPG.code,
                name: selectedPPG.name,
                prefixes: selectedPPG.prefixes,
                totalNumbers: selectedPPG.count
            },
            allowRecordingAccess: allowRecordingAccess,
            userCount: 1, // Ban đầu có 1 user admin
            representativeUserId: 99,
            representative: {
                id: 99,
                fullName: "Quản trị viên Khởi tạo",
                email: "admin.init@evn.com.vn",
                avatarUrl: "https://ui-avatars.com/api/?name=Admin+Init&background=0033A0&color=fff"
            },
            admins: [
                {
                    id: 99,
                    fullName: "Quản trị viên Khởi tạo",
                    email: "admin.init@evn.com.vn",
                    isRep: true,
                    avatarUrl: "https://ui-avatars.com/api/?name=Admin+Init&background=0033A0&color=fff"
                }
            ],
            status: status,
            createdAt: new Date().toISOString().split('T')[0]
        };
        userGroupsData.unshift(newGroup);
        showToast('Thiết lập nhóm người dùng mới thành công', 'success');
    }

    closeModal('userGroupModal');
    loadUserGroups();
}

// Manage Group Admins Modal
function openManageAdminsModal(groupId) {
    currentManagingGroupId = groupId;
    const group = userGroupsData.find(g => g.id === groupId);
    if (!group) return;

    document.getElementById('adminModalGroupName').innerText = `${group.name} (${group.code})`;
    renderAdminsListInModal(group);
    openModal('groupAdminsModal');
}

function renderAdminsListInModal(group) {
    const listEl = document.getElementById('modalAdminsList');
    if (!listEl) return;

    const adminCount = group.admins.length;

    listEl.innerHTML = group.admins.map(admin => {
        const isOnlyAdmin = adminCount <= 1;

        return `
            <div class="modal-admin-item">
                <div class="modal-admin-info">
                    <img src="${admin.avatarUrl}" alt="${admin.fullName}">
                    <div>
                        <div class="d-flex align-items-center gap-2">
                            <span class="fw-600">${admin.fullName}</span>
                            ${admin.isRep ? '<span class="badge" style="background: var(--primary-light); color: var(--primary); font-size: 0.7rem; padding: 2px 6px;">Đại diện chính</span>' : ''}
                        </div>
                        <span class="text-muted" style="font-size: 0.78rem;">${admin.email}</span>
                    </div>
                </div>
                <div>
                    <button class="btn btn-sm btn-outline text-danger" 
                            onclick="demoteAdmin(${group.id}, ${admin.id})"
                            ${isOnlyAdmin ? 'disabled title="Không thể hạ quyền Quản trị viên duy nhất của nhóm (Ràng buộc tối thiểu 1 Admin)" style="opacity: 0.5; cursor: not-allowed;"' : 'title="Hạ quyền về người dùng thành viên thường"'}>
                        Hạ quyền
                    </button>
                </div>
            </div>
        `;
    }).join('');
}

function demoteAdmin(groupId, adminId) {
    const group = userGroupsData.find(g => g.id === groupId);
    if (!group) return;

    // Kiểm tra quy tắc bảo toàn Quản trị viên nhóm: BR-UG-02
    if (group.admins.length <= 1) {
        showToast('Nhóm người dùng bắt buộc phải có ít nhất 1 Quản trị viên nhóm. Không thể hạ quyền người cuối cùng!', 'error');
        return;
    }

    group.admins = group.admins.filter(a => a.id !== adminId);
    // Nếu người bị hạ quyền là đại diện chính, chuyển quyền đại diện cho admin đầu tiên còn lại
    if (group.representativeUserId === adminId && group.admins.length > 0) {
        group.representativeUserId = group.admins[0].id;
        group.representative = {
            id: group.admins[0].id,
            fullName: group.admins[0].fullName,
            email: group.admins[0].email,
            avatarUrl: group.admins[0].avatarUrl
        };
        group.admins[0].isRep = true;
    }

    showToast('Đã hạ quyền Quản trị viên thành công', 'success');
    renderAdminsListInModal(group);
    loadUserGroups();
}

function promoteNewAdmin() {
    if (!currentManagingGroupId) return;
    const group = userGroupsData.find(g => g.id === currentManagingGroupId);
    if (!group) return;

    const emailInput = document.getElementById('newAdminEmailInput');
    const email = (emailInput?.value || '').trim();

    if (!email) {
        showToast('Vui lòng nhập email tài khoản thành viên để bổ nhiệm', 'error');
        return;
    }

    // Giả lập bổ nhiệm user
    const newAdmin = {
        id: Date.now(),
        fullName: email.split('@')[0].toUpperCase(),
        email: email,
        isRep: false,
        avatarUrl: `https://ui-avatars.com/api/?name=${email.substring(0, 2)}&background=10b981&color=fff`
    };

    group.admins.push(newAdmin);
    emailInput.value = '';

    showToast(`Đã bổ nhiệm ${newAdmin.fullName} làm Quản trị viên nhóm`, 'success');
    renderAdminsListInModal(group);
    loadUserGroups();
}

// View Members Modal
function openViewMembersModal(groupId) {
    const group = userGroupsData.find(g => g.id === groupId);
    if (!group) return;

    document.getElementById('memberModalGroupName').innerText = `${group.name} (${group.code})`;
    document.getElementById('memberModalCount').innerText = `${group.userCount} thành viên`;

    const listEl = document.getElementById('modalMembersList');
    if (!listEl) return;

    if (group.userCount === 0) {
        listEl.innerHTML = `
            <div class="text-center py-4 text-muted">
                <p>Nhóm này hiện chưa có thành viên nào.</p>
            </div>
        `;
    } else {
        // Render danh sách thành viên giả lập
        let html = '';
        for (let i = 1; i <= Math.min(group.userCount, 6); i++) {
            const isAdmin = i <= group.admins.length;
            html += `
                <div class="modal-admin-item">
                    <div class="modal-admin-info">
                        <img src="https://ui-avatars.com/api/?name=Member+${i}&background=0033A0&color=fff">
                        <div>
                            <span class="fw-600">Thành viên ${group.code}-${i}</span>
                            <span class="text-muted d-block" style="font-size: 0.75rem;">user.${i}@${group.code.toLowerCase()}.evn.vn</span>
                        </div>
                    </div>
                    <div>
                        ${isAdmin ? '<span class="badge" style="background: rgba(16, 185, 129, 0.15); color: #059669; font-size: 0.72rem;">Quản trị viên</span>' : '<span class="badge" style="background: var(--bg-hover); color: var(--text-muted); font-size: 0.72rem;">Thành viên</span>'}
                    </div>
                </div>
            `;
        }
        if (group.userCount > 6) {
            html += `<p class="text-center text-muted" style="font-size: 0.8rem; margin-top: 8px; grid-column: 1 / -1;">... và ${group.userCount - 6} thành viên khác.</p>`;
        }
        listEl.innerHTML = html;
    }

    openModal('groupMembersModal');
}

// Delete Group Modal with Safeguard
let deletingGroupId = null;

function openDeleteGroupModal(groupId) {
    deletingGroupId = groupId;
    const group = userGroupsData.find(g => g.id === groupId);
    if (!group) return;

    document.getElementById('deleteGroupName').innerText = `${group.name} (${group.code})`;
    const warningBox = document.getElementById('deleteSafeguardWarning');
    const confirmBtn = document.getElementById('confirmDeleteBtn');

    // Kiểm tra quy tắc xóa: nếu còn thành viên (userCount > 0), chặn xóa!
    if (group.userCount > 0) {
        warningBox.style.display = 'flex';
        warningBox.innerHTML = `
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
            <div>
                <strong>Không thể xóa nhóm này!</strong>
                <p style="margin: 2px 0 0 0; font-size: 0.78rem;">Nhóm đang có ${group.userCount} người dùng thành viên trực thuộc (Vi phạm BR-UG-01). Do người dùng gắn cố định và không thể chuyển nhóm, vui lòng xóa hết tài khoản thành viên hoặc chuyển trạng thái nhóm sang Tạm ngưng.</p>
            </div>
        `;
        confirmBtn.disabled = true;
        confirmBtn.style.opacity = '0.4';
        confirmBtn.style.cursor = 'not-allowed';
    } else {
        warningBox.style.display = 'none';
        confirmBtn.disabled = false;
        confirmBtn.style.opacity = '1';
        confirmBtn.style.cursor = 'pointer';
    }

    openModal('deleteGroupModal');
}

function confirmDeleteGroup() {
    if (!deletingGroupId) return;

    const group = userGroupsData.find(g => g.id === deletingGroupId);
    if (!group || group.userCount > 0) {
        showToast('Không thể xóa nhóm khi còn thành viên!', 'error');
        return;
    }

    // Xóa nhóm và giải phóng liên kết 1-1 nhóm đầu số
    const ppgCode = group.phonePrefixGroup.code;
    userGroupsData = userGroupsData.filter(g => g.id !== deletingGroupId);

    closeModal('deleteGroupModal');
    showToast(`Đã xóa nhóm thành công. Nhóm đầu số ${ppgCode} đã được giải phóng về trạng thái sẵn sàng.`, 'success');

    loadUserGroups();
}

// Toast notification
function showToast(message, type = 'success') {
    const container = document.getElementById('toastContainer');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;

    let icon = '';
    if (type === 'success') {
        icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>`;
    } else {
        icon = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>`;
    }

    toast.innerHTML = `
        <div class="toast-icon">${icon}</div>
        <div class="toast-message">${message}</div>
        <button class="toast-close" onclick="this.parentElement.remove()">&times;</button>
    `;

    container.appendChild(toast);

    setTimeout(() => {
        toast.style.animation = 'slideOutRight 0.3s forwards';
        setTimeout(() => toast.remove(), 300);
    }, 3500);
}
