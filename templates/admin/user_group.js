// templates/admin/user_group.js – màn hình Nhóm người dùng (admin.user-groups, M02 mục 5.1)
//
// Danh sách nhóm dùng GET /api/v1/admin/user-groups (G01, mock mockGetUserGroups bên dưới mảng này).
// Mảng userGroupsData là dữ liệu CŨ chỉ còn phục vụ các hộp chi tiết / sửa / quản trị viên / ngừng hoạt động
// (chưa rà: G03, G05–G07); không phải dạng response của API danh sách.
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
 * Các hộp chi tiết/sửa/quản trị viên/ngừng hoạt động bên dưới vẫn dùng mảng cũ userGroupsData
 * cho tới khi rà G03, G05–G07.
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

// Dòng user_groups đã JOIN như câu SQL bước 3 (số đếm, người đại diện) + dải số (bước 4: prefix, total_numbers).
// Nhóm INACTIVE: userCount = adminCount = 0, representative = null (M02 mục 3.4).
const MOCK_UG_ROWS = [
    { id: 1, code: 'UMO-IT-01', name: 'Khối Công nghệ Thông tin - Nhóm Vận hành', status: 'ACTIVE', allowRecordingAccess: true,
      organizationId: 2, ppg: { id: 10, code: 'PG-UMO-IT-01' }, ranges: [{ prefix: '46', total: 1000 }, { prefix: '42', total: 1000 }],
      userCount: 45, adminCount: 2, representative: { id: 10, fullName: 'Trần Thị B', email: 'tran.b@71portal.vn', avatarUrl: null },
      createdAt: '2026-03-15T08:30:00+07:00' },
    { id: 2, code: 'UMO-IT-02', name: 'Khối Công nghệ Thông tin - Nhóm Phần mềm', status: 'ACTIVE', allowRecordingAccess: false,
      organizationId: 4, ppg: { id: 11, code: 'PG-UMO-IT-02' }, ranges: [{ prefix: '43', total: 500 }, { prefix: '43', total: 300 }],
      userCount: 32, adminCount: 1, representative: { id: 18, fullName: 'Hoàng Văn Tuấn', email: 'tuan.hv@71portal.vn', avatarUrl: null },
      createdAt: '2026-04-02T10:00:00+07:00' },
    { id: 3, code: 'UMO-KD-01', name: 'Khối Kinh doanh & Dịch vụ Khách hàng', status: 'ACTIVE', allowRecordingAccess: true,
      organizationId: 3, ppg: { id: 12, code: 'PG-UMO-KD-01' }, ranges: [{ prefix: '48', total: 1000 }, { prefix: '49', total: 1000 }],
      userCount: 68, adminCount: 2, representative: { id: 22, fullName: 'Phạm Thu Hương', email: 'huong.pt@71portal.vn', avatarUrl: null },
      createdAt: '2026-04-18T09:15:00+07:00' },
    { id: 4, code: 'UMO-AUDIT-GLOBAL', name: 'Tổ Giám sát Kiểm toán Độc lập', status: 'ACTIVE', allowRecordingAccess: false,
      organizationId: null, ppg: { id: 13, code: 'PG-UMO-AUDIT-GLOBAL' }, ranges: [{ prefix: '20', total: 1000 }],
      userCount: 12, adminCount: 1, representative: { id: 31, fullName: 'Nguyễn Hải Nam', email: 'nam.nh@evn.com.vn', avatarUrl: null },
      createdAt: '2026-05-10T14:00:00+07:00' },
    { id: 5, code: 'UMO-EXPERT-SEC', name: 'Tổ Chuyên gia SOC An toàn Thông tin', status: 'ACTIVE', allowRecordingAccess: false,
      organizationId: null, ppg: { id: 14, code: 'PG-UMO-EXPERT-SEC' }, ranges: [],
      userCount: 1, adminCount: 1, representative: null,
      createdAt: '2026-06-01T08:00:00+07:00' },
    { id: 6, code: 'UMO-TBA-500', name: 'Nhóm Thử nghiệm Trạm Biến áp 500kV', status: 'INACTIVE', allowRecordingAccess: false,
      organizationId: 4, ppg: { id: 15, code: 'PG-UMO-TBA-500' }, ranges: [],
      userCount: 0, adminCount: 0, representative: null,
      createdAt: '2026-07-20T14:05:00+07:00' }
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
                phonePrefixGroup: { id: g.ppg.id, code: g.ppg.code, prefixes, totalNumbers: g.ranges.reduce((s, r) => s + r.total, 0) },
                userCount: g.userCount, adminCount: g.adminCount,
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
            e.target.classList.remove('show');
            document.body.style.overflow = '';
        }
    });

    window.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
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
                        <a href="#" class="group-name" onclick="event.preventDefault(); openGroupDetailModal(${group.id})" title="Xem chi tiết nhóm">${ugEsc(group.name)}</a>
                    </div>
                </td>
                <td>${orgContent}</td>
                <td><div class="ug-ppg"><span class="group-code">${ugEsc(ppg.code)}</span><span class="ug-ppg-prefixes">${prefixText}</span></div></td>
                <td>${repContent}<span class="ug-admin-count">${group.adminCount} quản trị viên</span></td>
                <td><span class="member-count-badge ug-member-count" title="Thành viên chưa ngừng hoạt động">${UG_ICONS.users} ${group.userCount}</span></td>
                <td class="ug-date">${ugFormatDate(group.createdAt)}</td>
                <td class="text-right" style="white-space: nowrap;">
                    <div class="action-btn-group">
                        <button class="action-btn view-btn" onclick="openGroupDetailModal(${group.id})" title="Xem chi tiết nhóm">${UG_ICONS.view}</button>${writeButtons}
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

function openGroupDetailModal(groupId) {
    const group = userGroupsData.find(g => g.id === groupId);
    if (!group) return;

    // Set code, name, status, org, desc
    const codeEl = document.getElementById('detailGroupCode');
    const nameEl = document.getElementById('detailGroupName');
    const statusEl = document.getElementById('detailGroupStatus');
    const orgEl = document.getElementById('detailGroupOrg');
    const descEl = document.getElementById('detailGroupDesc');

    if (codeEl) codeEl.innerText = group.code;
    if (nameEl) nameEl.innerText = group.name;
    if (statusEl) {
        statusEl.innerHTML = group.status === 'ACTIVE'
            ? `<span class="badge-status active">Hoạt động</span>`
            : `<span class="badge-status inactive">Tạm dừng</span>`;
    }

    if (orgEl) {
        if (group.organizationId) {
            orgEl.innerHTML = `
                <div class="org-hierarchy-cell">
                    <span class="fw-600">${group.organizationName}</span>
                    <div class="hierarchy-breadcrumb" style="margin-top: 4px;">
                        ${group.hierarchyPath.map((item, index) => {
                            const isLast = index === group.hierarchyPath.length - 1;
                            return `<span class="${isLast ? 'current' : 'root'}">${item}</span>${!isLast ? '<span class="arrow">&gt;</span>' : ''}`;
                        }).join('')}
                    </div>
                </div>
            `;
        } else {
            orgEl.innerHTML = `
                <span class="badge-standalone">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 13px; height: 13px;"><rect x="4" y="4" width="16" height="16" rx="2"></rect><line x1="9" y1="9" x2="15" y2="15"></line></svg>
                    Nhóm độc lập (Toàn hệ thống - Không gắn đơn vị)
                </span>
            `;
        }
    }

    if (descEl) descEl.innerText = group.description || 'Chưa có ghi chú / mô tả phạm vi chức năng.';

    // Quyền ghi âm thoại IP (Chốt chặn Tầng 1 - BR-UG-05)
    const recEl = document.getElementById('detailGroupRecording');
    if (recEl) {
        recEl.innerHTML = group.allowRecordingAccess
            ? `<span class="badge-recording" style="font-size: 0.8125rem; padding: 4px 10px;">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>
                Đã kích hoạt quyền Ghi âm (Chốt chặn Tầng 1 mở)
               </span>`
            : `<span style="font-size: 0.8125rem; color: var(--text-muted); font-style: italic;">Chưa cấp phép</span>`;
    }

    // 1. Nhóm đầu số viễn thông (Ràng buộc 1 - 1)
    const prefixCardEl = document.getElementById('detailGroupPrefixCard');
    if (prefixCardEl) {
        const ppg = group.phonePrefixGroup;
        prefixCardEl.innerHTML = `
            <div style="display: flex; flex-direction: column; gap: 8px;">
                <div style="display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
                    <div>
                        <span class="fw-600" style="color: var(--primary); font-size: 0.95rem;">${ppg.code}</span>
                        <span style="margin: 0 6px; color: var(--border);">|</span>
                        <strong style="color: var(--text-main); font-size: 0.9rem;">${ppg.name}</strong>
                    </div>
                    <span class="text-muted" style="font-size: 0.8rem; font-weight: 500;">Quy mô: <strong>${ppg.totalNumbers.toLocaleString()}</strong> số máy</span>
                </div>
                <div style="display: flex; align-items: center; gap: 6px; flex-wrap: wrap;">
                    <span class="text-muted" style="font-size: 0.8rem;">Các dải số liên kết:</span>
                    ${ppg.prefixes.map(p => `<span class="prefix-sub-tag" style="font-size: 0.78rem; padding: 2px 8px;">${p}</span>`).join('')}
                </div>
                <div class="badge-1to1-note" style="margin-top: 4px; padding: 8px 12px; font-size: 0.78rem; background: var(--surface);">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 15px; height: 15px; flex-shrink: 0;"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                    <span>Toàn bộ lưu lượng thoại, luồng dữ liệu CDR và phân bổ thuê bao của nhóm được ràng buộc độc quyền 1-1 với nhóm đầu số này.</span>
                </div>
            </div>
        `;
    }

    // 2. Quản trị viên nhóm (Group Admins)
    const adminCountEl = document.getElementById('detailAdminCountBadge');
    if (adminCountEl) adminCountEl.innerText = `${group.admins.length} Quản trị viên`;

    const adminsListEl = document.getElementById('detailGroupAdminsList');
    if (adminsListEl) {
        adminsListEl.innerHTML = group.admins.map(admin => `
            <div style="display: flex; align-items: center; justify-content: space-between; padding: 8px 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 8px;">
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${admin.avatarUrl}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">
                    <div>
                        <div style="font-weight: 600; font-size: 0.85rem; color: var(--text-main);">${admin.fullName}</div>
                        <div style="font-size: 0.75rem; color: var(--text-muted);">${admin.email}</div>
                    </div>
                </div>
                ${admin.isRep ? `<span class="rep-badge" style="font-size: 0.72rem; padding: 2px 8px; background: rgba(0, 51, 160, 0.1); color: var(--primary); border-radius: 4px; font-weight: 600;">Đại diện chính</span>` : `<span class="text-muted" style="font-size: 0.75rem;">Đồng quản trị</span>`}
            </div>
        `).join('');
    }

    // Modal action buttons
    const editBtn = document.getElementById('detailEditGroupBtn');
    if (editBtn) {
        editBtn.onclick = function() {
            closeModal('groupDetailModal');
            openEditGroupModal(group.id);
        };
    }

    const manageAdminsBtn = document.getElementById('detailManageAdminsBtn');
    if (manageAdminsBtn) {
        manageAdminsBtn.onclick = function() {
            closeModal('groupDetailModal');
            openManageAdminsModal(group.id);
        };
    }

    const toggleStatusBtn = document.getElementById('detailToggleStatusBtn');
    if (toggleStatusBtn) {
        if (group.status === 'ACTIVE') {
            toggleStatusBtn.className = 'btn btn-outline';
            toggleStatusBtn.style.color = '#d97706';
            toggleStatusBtn.style.borderColor = 'rgba(217, 119, 6, 0.35)';
            toggleStatusBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="10" y1="15" x2="10" y2="9"></line><line x1="14" y1="15" x2="14" y2="9"></line></svg>
                <span>Tạm ngưng nhóm</span>
            `;
        } else {
            toggleStatusBtn.className = 'btn btn-outline';
            toggleStatusBtn.style.color = '#059669';
            toggleStatusBtn.style.borderColor = 'rgba(16, 185, 129, 0.35)';
            toggleStatusBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
                <span>Kích hoạt nhóm</span>
            `;
        }
        toggleStatusBtn.onclick = function() {
            closeModal('groupDetailModal');
            openToggleStatusModal(group.id);
        };
    }

    openModal('groupDetailModal');
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

// Toggle Status Modal (Tạm ngưng / Kích hoạt Nhóm người dùng)
let targetStatusGroupId = null;

function openToggleStatusModal(groupId) {
    targetStatusGroupId = groupId;
    const group = userGroupsData.find(g => g.id === groupId);
    if (!group) return;

    const isCurrentlyActive = group.status === 'ACTIVE';

    // Populate Column 1: Thông tin nhóm
    const nameEl = document.getElementById('statusModalGroupName');
    const codeEl = document.getElementById('statusModalGroupCode');
    const badgeEl = document.getElementById('statusModalCurrentBadge');
    const orgEl = document.getElementById('statusModalOrgName');
    const memberEl = document.getElementById('statusModalMemberCount');
    const prefixEl = document.getElementById('statusModalPrefixGroup');

    if (nameEl) nameEl.innerText = group.name;
    if (codeEl) codeEl.innerText = group.code;
    if (badgeEl) {
        badgeEl.innerHTML = isCurrentlyActive
            ? `<span class="badge-status active">Đang hoạt động</span>`
            : `<span class="badge-status inactive">Đang tạm dừng</span>`;
    }
    if (orgEl) orgEl.innerText = group.organizationName || 'Nhóm độc lập toàn HT';
    if (memberEl) memberEl.innerText = `${group.userCount} người dùng`;
    if (prefixEl) prefixEl.innerText = `${group.phonePrefixGroup.code} (${group.phonePrefixGroup.prefixes.join(', ')})`;

    // Populate Column 2: Tiêu đề, Cảnh báo & Nút xác nhận
    const titleEl = document.getElementById('toggleStatusModalTitle');
    const impactEl = document.getElementById('statusModalImpactBox');
    const reasonLabelEl = document.getElementById('toggleStatusReasonLabel');
    const reasonInputEl = document.getElementById('toggleStatusReasonInput');
    const confirmBtn = document.getElementById('confirmToggleStatusBtn');

    if (reasonInputEl) reasonInputEl.value = '';

    if (isCurrentlyActive) {
        // TẠM NGƯNG
        if (titleEl) {
            titleEl.innerHTML = `
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#d97706" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="10" y1="15" x2="10" y2="9"></line><line x1="14" y1="15" x2="14" y2="9"></line></svg>
                <span>Tạm ngưng hoạt động Nhóm người dùng</span>
            `;
        }
        if (impactEl) {
            impactEl.innerHTML = `
                <div style="background: rgba(245, 158, 11, 0.08); border: 1px solid rgba(245, 158, 11, 0.25); border-radius: 8px; padding: 12px 14px;">
                    <strong style="color: #d97706; font-size: 0.85rem; display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                        Tác động khi Tạm ngưng nhóm:
                    </strong>
                    <ul style="margin: 0; padding-left: 18px; font-size: 0.8rem; color: var(--text-muted); line-height: 1.5;">
                        <li>Khóa tạm thời quyền truy cập và thao tác nghiệp vụ của <strong>${group.userCount} thành viên</strong>.</li>
                        <li>Tạm dừng phát sinh cuộc gọi mới trên nhóm đầu số PABX <strong>${group.phonePrefixGroup.code}</strong>.</li>
                        <li>Dữ liệu lịch sử và nhật ký CDR cũ vẫn được bảo lưu nguyên vẹn. Ràng buộc 1-1 không bị hủy.</li>
                    </ul>
                </div>
            `;
        }
        if (reasonLabelEl) {
            reasonLabelEl.innerHTML = `Lý do tạm ngưng hoạt động <span class="text-danger">*</span>`;
        }
        if (reasonInputEl) {
            reasonInputEl.placeholder = 'VD: Quyết định số 48/QĐ-EVN tạm ngưng phục vụ bảo trì nâng cấp hệ thống...';
        }
        if (confirmBtn) {
            confirmBtn.className = 'btn btn-warning';
            confirmBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;"><circle cx="12" cy="12" r="10"></circle><line x1="10" y1="15" x2="10" y2="9"></line><line x1="14" y1="15" x2="14" y2="9"></line></svg>
                Xác nhận Tạm ngưng nhóm
            `;
        }
    } else {
        // KÍCH HOẠT LẠI
        if (titleEl) {
            titleEl.innerHTML = `
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#10b981" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                <span>Kích hoạt lại Nhóm người dùng</span>
            `;
        }
        if (impactEl) {
            impactEl.innerHTML = `
                <div style="background: rgba(16, 185, 129, 0.08); border: 1px solid rgba(16, 185, 129, 0.25); border-radius: 8px; padding: 12px 14px;">
                    <strong style="color: #059669; font-size: 0.85rem; display: flex; align-items: center; gap: 6px; margin-bottom: 6px;">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width: 16px; height: 16px;"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path><polyline points="22 4 12 14.01 9 11.01"></polyline></svg>
                        Tác động khi Kích hoạt lại nhóm:
                    </strong>
                    <ul style="margin: 0; padding-left: 18px; font-size: 0.8rem; color: var(--text-muted); line-height: 1.5;">
                        <li>Khôi phục toàn bộ quyền truy cập và phân quyền của <strong>${group.userCount} thành viên</strong> và Quản trị viên.</li>
                        <li>Mở lại lưu lượng thoại và tiếp tục ghi nhận dữ liệu CDR trên nhóm đầu số <strong>${group.phonePrefixGroup.code}</strong>.</li>
                        <li>Nhóm sẵn sàng tiếp nhận thêm thành viên mới bình thường.</li>
                    </ul>
                </div>
            `;
        }
        if (reasonLabelEl) {
            reasonLabelEl.innerHTML = `Căn cứ / Ghi chú kích hoạt lại <span class="text-danger">*</span>`;
        }
        if (reasonInputEl) {
            reasonInputEl.placeholder = 'VD: Hoàn tất công tác bảo trì kỹ thuật, kích hoạt lại theo thông báo số 18/TB-CNTT...';
        }
        if (confirmBtn) {
            confirmBtn.className = 'btn btn-primary';
            confirmBtn.innerHTML = `
                <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 6px;"><polyline points="20 6 9 17 4 12"></polyline></svg>
                Xác nhận Kích hoạt nhóm
            `;
        }
    }

    openModal('toggleStatusModal');
}

function confirmToggleStatus() {
    if (!targetStatusGroupId) return;

    const group = userGroupsData.find(g => g.id === targetStatusGroupId);
    if (!group) return;

    const reason = (document.getElementById('toggleStatusReasonInput')?.value || '').trim();
    if (!reason) {
        showToast('Vui lòng nhập lý do / căn cứ thay đổi trạng thái nhóm', 'error');
        return;
    }

    const wasActive = group.status === 'ACTIVE';
    group.status = wasActive ? 'INACTIVE' : 'ACTIVE';

    closeModal('toggleStatusModal');

    showToast(
        group.status === 'ACTIVE'
            ? `Đã kích hoạt lại nhóm "${group.name}" thành công`
            : `Đã tạm ngưng hoạt động nhóm "${group.name}"`,
        'success'
    );

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
