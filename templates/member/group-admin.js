// templates/member/group-admin.js - EVN CDR AS (Quản trị nhóm: member.group-admin → GroupAdminView.vue, chỉ GROUP_ADMIN)
//
// Bảng thành viên: GET /api/v1/users (N01, docs/modules/03_auth_user.md mục 3.3; màn hình M02 mục 5.3).
// Bản User: nhóm = users.user_group_id của người gọi (backend), không có tham số/ô chọn nhóm (gửi userGroupId → 400).
// Thẻ tóm tắt nhóm (tên, đơn vị, dải số, Quản trị viên, số thành viên) do group-summary.js vẽ từ GET /user-groups/:id (G03);
// trang này dùng data.admins (Quản trị viên nhóm ACTIVE) từ sự kiện `member-group-summary` cho cảnh báo hạ quyền/khóa.
// Vue: store useGroupAdminStore (members, pagination, query { page, search, roleCode, status }, viewMode cục bộ), action fetchMembers.
// Kiểm tay mock: ?maintenance=1 (503), ?account=locked (401), ?role=REGULAR_USER (403), ?usersError=1 (lỗi mạng một lần).
// Hộp "Xem chi tiết" gọi GET /api/v1/users/:id mỗi lần mở (N02, M03 mục 3.3.1): ?detailError=1 (lỗi mạng một lần),
// ?detailMissing=<id> (dòng đó trả 404), ?detailOtherGroup=<id> (dòng đó trả 403 FORBIDDEN_SCOPE_ACCESS).
// Hộp Thêm gọi POST /api/v1/users (N03, M03 mục 3.4, mock mục 1b); kiểm tay: ?createError=1, ?maintenance=1, ?recording=0.
// Hộp Sửa gọi PUT /api/v1/users/:id (N04, M03 mục 3.5); kiểm tay: ?updateError=1, ?updateInactive=<id>, ?maintenance=1.
// Các hộp Đổi vai trò/Đặt lại mật khẩu/Khóa ở mục 6 vẫn là mock CŨ (N05–N09): sửa dòng "CSDL" rồi tải lại danh sách.
// Hộp Đặt lại mật khẩu còn sinh mật khẩu ở frontend (generateRandomPassword): N06 thay bằng hộp mật khẩu tạm như #memberTempPasswordModal.

// ==========================================================================
// 1. Giả lập backend GET /api/v1/users (bản User)
// ==========================================================================

// Dòng "CSDL" của mock (users + user_roles), KHÔNG phải cấu trúc response: response là 14 trường của toUserListItem.
const MOCK_USER_ROWS = [
    { id: 10, userGroupId: 1, username: 'tran.b', email: 'tran.b@71portal.vn', fullName: 'Trần Thị B', jobTitle: 'Trưởng nhóm Kỹ thuật Vận hành', phoneNumber: '0912.345.678', avatarUrl: null, status: 'ACTIVE', roleCode: 'GROUP_ADMIN', lastLoginAt: '2026-11-05T08:12:40+07:00', createdAt: '2026-03-15T08:30:00+07:00' },
    { id: 15, userGroupId: 1, username: 'le.c', email: 'le.c@71portal.vn', fullName: 'Lê Văn C', jobTitle: 'Kỹ sư Quản trị Hệ thống Chính', phoneNumber: '0983.456.789', avatarUrl: null, status: 'ACTIVE', roleCode: 'GROUP_ADMIN', lastLoginAt: '2026-11-04T16:40:00+07:00', createdAt: '2026-03-16T09:00:00+07:00' },
    { id: 101, userGroupId: 1, username: 'pham.d', email: 'pham.d@71portal.vn', fullName: 'Phạm Văn D', jobTitle: 'Kỹ sư Vận hành Máy chủ & Storage', phoneNumber: '0977 112 233', avatarUrl: null, status: 'ACTIVE', roleCode: 'USER_RECORDING', lastLoginAt: '2026-11-01T07:55:00+07:00', createdAt: '2026-03-20T10:00:00+07:00' },
    { id: 102, userGroupId: 1, username: 'tri.hm', email: 'tri.hm@71portal.vn', fullName: 'Hoàng Minh Trí', jobTitle: 'Chuyên viên Giám sát Mạng & Tổng đài', phoneNumber: '0904556677', avatarUrl: null, status: 'ACTIVE', roleCode: 'REGULAR_USER', lastLoginAt: null, createdAt: '2026-04-01T08:00:00+07:00', mustChangePassword: true, lockedUntil: '2099-01-01T08:15:00+07:00' },
    { id: 103, userGroupId: 1, username: 'mai.dt', email: 'mai.dt@71portal.vn', fullName: 'Đỗ Thị Mai', jobTitle: 'Kỹ sư Trực ca Vận hành 24/7', phoneNumber: '0936.889.900', avatarUrl: null, status: 'ACTIVE', roleCode: 'REGULAR_USER', lastLoginAt: '2026-10-30T22:10:00+07:00', createdAt: '2026-04-01T08:10:00+07:00' },
    { id: 104, userGroupId: 1, username: 'anh.nt', email: 'anh.nt@71portal.vn', fullName: 'Nguyễn Tuấn Anh', jobTitle: null, phoneNumber: null, avatarUrl: null, status: 'LOCKED', roleCode: 'REGULAR_USER', lastLoginAt: null, createdAt: '2026-04-02T10:00:00+07:00', mustChangePassword: true, updatedAt: '2026-10-20T14:00:00+07:00' },
    { id: 105, userGroupId: 1, username: 'dang.vh', email: 'dang.vh@71portal.vn', fullName: 'Vũ Hải Đăng', jobTitle: null, phoneNumber: null, avatarUrl: null, status: 'ACTIVE', roleCode: 'REGULAR_USER', lastLoginAt: '2026-11-02T08:00:00+07:00', createdAt: '2026-05-05T08:00:00+07:00' },
    { id: 106, userGroupId: 1, username: 'ha.bt', email: 'ha.bt@71portal.vn', fullName: 'Bùi Thanh Hà', jobTitle: 'Kỹ sư An toàn Thông tin', phoneNumber: '0983 556 778', avatarUrl: null, status: 'ACTIVE', roleCode: 'USER_RECORDING', lastLoginAt: '2026-11-05T09:30:00+07:00', createdAt: '2026-05-06T08:00:00+07:00' },
    { id: 107, userGroupId: 1, username: 'vinh.nq', email: 'vinh.nq@71portal.vn', fullName: 'Ngô Quang Vinh', jobTitle: 'Kỹ sư Mạng Truyền dẫn', phoneNumber: '0915.223.344', avatarUrl: null, status: 'ACTIVE', roleCode: 'REGULAR_USER', lastLoginAt: '2026-10-20T08:00:00+07:00', createdAt: '2026-06-01T08:00:00+07:00' },
    { id: 110, userGroupId: 1, username: 'hong.ct', email: 'hong.ct@71portal.vn', fullName: 'Cao Thị Hồng', jobTitle: 'Kỹ sư Giám sát Chất lượng', phoneNumber: null, avatarUrl: null, status: 'INACTIVE', roleCode: 'REGULAR_USER', lastLoginAt: '2026-06-30T17:00:00+07:00', createdAt: '2026-03-18T09:00:00+07:00' },
    { id: 201, userGroupId: 2, username: 'long.nh', email: 'long.nh@71portal.vn', fullName: 'Nguyễn Hải Long', jobTitle: 'Lập trình viên Backend', phoneNumber: '0972.123.456', avatarUrl: null, status: 'ACTIVE', roleCode: 'GROUP_ADMIN', lastLoginAt: null, createdAt: '2026-03-15T09:10:00+07:00' }
];
// user_groups giả lập: code, name, representative_user_id (nhóm 1 khớp tài khoản mock của main.js).
const MOCK_GROUPS = {
    1: { code: 'UMO-IT-01', name: 'Nhóm QLND Khối CNTT', representativeUserId: 10 },
    2: { code: 'UMO-IT-02', name: 'Nhóm Kỹ thuật Phần mềm', representativeUserId: 201 }
};
const MOCK_ROLE_NAMES = { GROUP_ADMIN: 'Quản trị viên nhóm', USER_RECORDING: 'Thành viên nghe ghi âm', REGULAR_USER: 'Thành viên' };

const gaParams = new URLSearchParams(window.location.search);
const GA_MOCK_MAINTENANCE = gaParams.get('maintenance') === '1';
const GA_MOCK_ACCOUNT_LOCKED = gaParams.get('account') === 'locked';
let gaMockNetworkError = gaParams.get('usersError') === '1';
let gaMockDetailError = gaParams.get('detailError') === '1';

const gaNow = () => new Date().toISOString().replace('Z', '+07:00');
const gaFail = (statusCode, errorCode, message, errors) =>
    Promise.reject({ success: false, statusCode, errorCode, message, errors: errors || null, timestamp: gaNow() });
// utf8mb4_unicode_ci: không phân biệt hoa thường, không phân biệt dấu (mock xấp xỉ bằng NFD bỏ dấu).
const gaFold = v => String(v == null ? '' : v).normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// DTO phần tử: đúng 14 trường (M03 mục 3.3), cùng DTO với bản Admin.
function toUserListItem(row) {
    const g = MOCK_GROUPS[row.userGroupId];
    return {
        id: row.id,
        username: row.username,
        email: row.email,
        fullName: row.fullName,
        jobTitle: row.jobTitle,
        phoneNumber: row.phoneNumber,
        avatarUrl: row.avatarUrl,
        status: row.status,
        roleCode: row.roleCode,
        roleName: MOCK_ROLE_NAMES[row.roleCode],
        isRepresentative: g.representativeUserId === row.id,
        userGroup: { id: row.userGroupId, code: g.code, name: g.name },
        lastLoginAt: row.lastLoginAt,
        createdAt: row.createdAt
    };
}

// Thứ tự: guard (401) → bảo trì (503) → quyền user:view theo claim roleCode (chỉ GROUP_ADMIN) → query (400)
// → kiểm tra tài khoản (401, đọc users + user_groups: lấy user_group_id để cô lập). Không có 403 phạm vi, 404.
function mockGetUsers(token, query) {
    return new Promise(resolve => setTimeout(resolve, 300)).then(() => {
        if (gaMockNetworkError) { gaMockNetworkError = false; return Promise.reject(new Error('Network Error')); }
        if (!token) return gaFail(401, 'UNAUTHORIZED', 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
        if (GA_MOCK_MAINTENANCE) return gaFail(503, 'MAINTENANCE', 'Hệ thống đang bảo trì, vui lòng quay lại sau');
        const account = window.memberSession ? window.memberSession.getAccount() : null;
        if (account && !(account.permissions || []).includes('user:view')) {
            return gaFail(403, 'FORBIDDEN_PERMISSION', 'Bạn không có quyền thực hiện thao tác này');
        }

        const q = query || {};
        const errors = {};
        const allowed = ['page', 'limit', 'search', 'status', 'roleCode']; // không có userGroupId ở route User
        Object.keys(q).forEach(k => {
            if (!allowed.includes(k)) errors[k] = ['Tham số không được nhận'];
            else if (Array.isArray(q[k])) errors[k] = ['Tham số bị lặp lại'];
        });
        const page = q.page === undefined ? 1 : (/^[1-9][0-9]{0,8}$/.test(String(q.page)) ? Number(q.page) : NaN);
        const limit = q.limit === undefined ? 20 : (/^[1-9][0-9]{0,2}$/.test(String(q.limit)) ? Number(q.limit) : NaN);
        if (!errors.page && !(page >= 1)) errors.page = ['page phải là số nguyên ≥ 1'];
        if (!errors.limit && !(limit >= 1 && limit <= 100)) errors.limit = ['limit phải trong khoảng 1–100'];
        const search = q.search === undefined ? '' : String(q.search).trim();
        if (!errors.search && search.length > 100) errors.search = ['Tối đa 100 ký tự'];
        if (!errors.status && q.status !== undefined && !['ACTIVE', 'LOCKED', 'INACTIVE'].includes(q.status)) errors.status = ['Trạng thái không hợp lệ'];
        if (!errors.roleCode && q.roleCode !== undefined && !['GROUP_ADMIN', 'USER_RECORDING', 'REGULAR_USER'].includes(q.roleCode)) errors.roleCode = ['Vai trò không hợp lệ'];
        if (Object.keys(errors).length) return gaFail(400, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ', errors);
        if (GA_MOCK_ACCOUNT_LOCKED) return gaFail(401, 'UNAUTHORIZED', 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');

        const groupId = account ? account.userGroup.id : 1; // = users.user_group_id đọc ở bước kiểm tra tài khoản
        const repId = MOCK_GROUPS[groupId] ? MOCK_GROUPS[groupId].representativeUserId : null;
        const kw = gaFold(search);
        const rows = MOCK_USER_ROWS
            .filter(r => r.userGroupId === groupId)
            .filter(r => (q.status === undefined ? r.status !== 'INACTIVE' : r.status === q.status))
            .filter(r => q.roleCode === undefined || r.roleCode === q.roleCode)
            .filter(r => !kw || [r.fullName, r.username, r.email, r.jobTitle, r.phoneNumber].some(v => gaFold(v).includes(kw)))
            // Một nhóm: người đại diện → Quản trị viên nhóm → còn lại; mỗi khối full_name, id.
            .sort((a, b) => ((b.id === repId) - (a.id === repId))
                || ((b.roleCode === 'GROUP_ADMIN') - (a.roleCode === 'GROUP_ADMIN'))
                || a.fullName.localeCompare(b.fullName, 'vi')
                || a.id - b.id);
        const total = rows.length;
        const totalPages = Math.ceil(total / limit);
        return {
            success: true, statusCode: 200, message: 'Lấy danh sách người dùng thành công',
            data: rows.slice((page - 1) * limit, page * limit).map(toUserListItem), // page vượt totalPages → []
            pagination: { page, limit, total, totalPages, hasNext: page < totalPages, hasPrev: page > 1 },
            timestamp: gaNow()
        };
    });
}

// DTO GET /api/v1/users/:id: 14 trường của phần tử + mustChangePassword, lockedUntil, updatedAt = 17 trường (M03 mục 3.3.1).
// Cột mock không ghi thì lấy mặc định: must_change_password = 0, locked_until = NULL, updated_at = created_at.
function toUserDetail(row) {
    const lockedUntil = row.lockedUntil && Date.parse(row.lockedUntil) > Date.now() ? row.lockedUntil : null; // locked_until > NOW()
    return Object.assign(toUserListItem(row), {
        mustChangePassword: !!row.mustChangePassword,
        lockedUntil,
        updatedAt: row.updatedAt || row.createdAt
    });
}

// Giả lập GET /api/v1/users/:id (bản User). Thứ tự: guard (401) → bảo trì (503) → quyền user:view (403) → :id/query (400)
// → kiểm tra tài khoản (401) → tìm người dùng (404) → phạm vi nhóm (403 FORBIDDEN_SCOPE_ACCESS). Không ghi audit; INACTIVE vẫn 200.
function mockGetUserDetail(token, id, query) {
    return new Promise(resolve => setTimeout(resolve, 300)).then(() => {
        if (gaMockDetailError) { gaMockDetailError = false; return Promise.reject(new Error('Network Error')); }
        if (!token) return gaFail(401, 'UNAUTHORIZED', 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
        if (GA_MOCK_MAINTENANCE) return gaFail(503, 'MAINTENANCE', 'Hệ thống đang bảo trì, vui lòng quay lại sau');
        const account = window.memberSession ? window.memberSession.getAccount() : null;
        if (account && !(account.permissions || []).includes('user:view')) {
            return gaFail(403, 'FORBIDDEN_PERMISSION', 'Bạn không có quyền thực hiện thao tác này');
        }
        const errors = {};
        if (!(/^[1-9][0-9]{0,9}$/.test(String(id)) && Number(id) <= 4294967295)) errors.id = ['Mã người dùng phải là số nguyên dương'];
        Object.keys(query || {}).forEach(k => { errors[k] = ['Tham số không được nhận']; });
        if (Object.keys(errors).length) return gaFail(400, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ', errors);
        if (GA_MOCK_ACCOUNT_LOCKED) return gaFail(401, 'UNAUTHORIZED', 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');

        const scopeGroupId = account ? account.userGroup.id : 1; // = users.user_group_id đọc ở bước kiểm tra tài khoản
        const row = MOCK_USER_ROWS.find(r => r.id === Number(id));
        if (!row || gaParams.get('detailMissing') === String(id)) return gaFail(404, 'NOT_FOUND', 'Không tìm thấy tài nguyên');
        if (row.userGroupId !== scopeGroupId || gaParams.get('detailOtherGroup') === String(id)) {
            return gaFail(403, 'FORBIDDEN_SCOPE_ACCESS', 'Bạn không có quyền truy cập dữ liệu của nhóm khác');
        }
        return { success: true, statusCode: 200, message: 'Lấy chi tiết người dùng thành công', data: toUserDetail(row), timestamp: gaNow() };
    });
}

// ==========================================================================
// 1b. Giả lập backend POST /api/v1/users (bản User, N03, M03 mục 3.4)
// ==========================================================================

const GA_CREATE_KEYS = ['username', 'email', 'fullName', 'jobTitle', 'phoneNumber', 'roleCode']; // không có userGroupId
const GA_ROLE_CODES = ['GROUP_ADMIN', 'USER_RECORDING', 'REGULAR_USER'];
const GA_ROLE_PERMISSION = { GROUP_ADMIN: 'group:manage_admin', USER_RECORDING: 'group:toggle_recording' };
const GA_USERNAME_RE = /^[A-Za-z0-9._@-]{3,100}$/;
const GA_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const GA_PHONE_RE = /^(?=.*[0-9])[0-9+\-.() ]{1,30}$/;
let gaMockCreateError = gaParams.get('createError') === '1';
let gaAddBusy = false;

// Kiểm tra body theo bảng M03 mục 3.4 bản User (dùng chung cho mock backend và kiểm tra trước khi gửi ở frontend).
// Trả { errors, body } với body đã cắt khoảng trắng / chuẩn hóa rỗng → null, roleCode mặc định REGULAR_USER.
function validateUserCreateBody(raw) {
    const errors = {};
    const add = (k, m) => { (errors[k] = errors[k] || []).push(m); };
    const b = raw && typeof raw === 'object' && !Array.isArray(raw) ? raw : {};
    Object.keys(b).forEach(k => { if (!GA_CREATE_KEYS.includes(k)) add(k, 'Trường không được nhận'); });
    const str = (v, key, { required, min = 1, max, re, reMsg }) => {
        if (v === undefined || v === null) { if (required) add(key, 'Bắt buộc'); return null; }
        if (typeof v !== 'string') { add(key, 'Phải là chuỗi'); return null; }
        const t = v.trim();
        if (t === '') { if (required) add(key, 'Bắt buộc'); return null; }
        if (t.length < min || t.length > max) add(key, min > 1 ? `Từ ${min} đến ${max} ký tự` : `Tối đa ${max} ký tự`);
        else if (re && !re.test(t)) add(key, reMsg);
        return t;
    };
    const body = {};
    body.username = str(b.username, 'username', { required: true, min: 3, max: 100, re: GA_USERNAME_RE,
        reMsg: 'Chỉ chữ Latin không dấu, chữ số và . _ @ -' });
    body.email = str(b.email, 'email', { required: true, max: 150, re: GA_EMAIL_RE, reMsg: 'Email không hợp lệ' });
    body.fullName = str(b.fullName, 'fullName', { required: true, max: 150 });
    body.jobTitle = str(b.jobTitle, 'jobTitle', { max: 150 });
    body.phoneNumber = str(b.phoneNumber, 'phoneNumber', { max: 30, re: GA_PHONE_RE,
        reMsg: 'Chỉ chữ số, dấu cách và + - . ( ), có ít nhất một chữ số' });
    if (b.roleCode === undefined) body.roleCode = 'REGULAR_USER';
    else if (!GA_ROLE_CODES.includes(b.roleCode)) add('roleCode', 'Vai trò không hợp lệ');
    else body.roleCode = b.roleCode;
    return { errors, body };
}

// Mật khẩu tạm 16 ký tự, 4 nhóm ký tự đã bỏ ký tự dễ nhầm (cùng cách sinh M04 mục 3.3; backend dùng crypto.randomInt)
function gaTempPassword() {
    const sets = ['ABCDEFGHJKLMNPQRSTUVWXYZ', 'abcdefghjkmnpqrstuvwxyz', '23456789', '!@#$%^&*-_=+?'];
    const rnd = n => crypto.getRandomValues(new Uint32Array(1))[0] % n;
    const chars = sets.map(set => set[rnd(set.length)]);
    const all = sets.join('');
    while (chars.length < 16) chars.push(all[rnd(all.length)]);
    for (let i = chars.length - 1; i > 0; i--) { const j = rnd(i + 1); [chars[i], chars[j]] = [chars[j], chars[i]]; }
    return chars.join('');
}

// Thứ tự: guard (401) → bảo trì (503) → quyền user:create theo claim roleCode → query/body (400) → quyền gán vai trò (403)
// → kiểm tra tài khoản (401; nhóm = users.user_group_id) → khóa dòng nhóm → Tầng 1 (409) → trùng mọi nhóm (409).
// 201: data = 17 trường của GET /users/:id + temporaryPassword; backend gửi kèm Cache-Control: no-store.
// Kiểm tay: ?createError=1 (lỗi mạng một lần); tran.b, LE.C@71portal.vn, long.nh (nhóm 2) → 409; hong.ct (INACTIVE) dùng lại được.
function mockCreateUser(token, body, query) {
    return new Promise(resolve => setTimeout(resolve, 400)).then(() => {
        if (gaMockCreateError) { gaMockCreateError = false; return Promise.reject(new Error('Network Error')); }
        if (!token) return gaFail(401, 'UNAUTHORIZED', 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
        if (GA_MOCK_MAINTENANCE) return gaFail(503, 'MAINTENANCE', 'Hệ thống đang bảo trì, vui lòng quay lại sau');
        const account = window.memberSession ? window.memberSession.getAccount() : null;
        const can = code => !account || (account.permissions || []).includes(code);
        if (!can('user:create')) return gaFail(403, 'FORBIDDEN_PERMISSION', 'Bạn không có quyền thực hiện thao tác này');
        const { errors, body: b } = validateUserCreateBody(body);
        Object.keys(query || {}).forEach(k => { errors[k] = ['Tham số không được nhận']; });
        if (Object.keys(errors).length) return gaFail(400, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ', errors);
        const needed = GA_ROLE_PERMISSION[b.roleCode];
        if (needed && !can(needed)) return gaFail(403, 'FORBIDDEN_PERMISSION', 'Bạn không có quyền gán vai trò này');
        if (GA_MOCK_ACCOUNT_LOCKED) return gaFail(401, 'UNAUTHORIZED', 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');

        const groupId = account ? account.userGroup.id : 1; // = users.user_group_id đọc ở bước kiểm tra tài khoản
        const allowRecording = account ? account.userGroup.allowRecordingAccess : true; // user_groups ... FOR UPDATE
        if (b.roleCode === 'USER_RECORDING' && !allowRecording) {
            return gaFail(409, 'GROUP_RECORDING_DISABLED', 'Nhóm chưa được cấp quyền nghe/tải ghi âm',
                { roleCode: ['Nhóm chưa được cấp quyền nghe/tải ghi âm, không gán được vai trò này'] });
        }
        // username_active / email_active: người dùng chưa INACTIVE của MỌI nhóm, gồm trùng chéo; không phân biệt hoa thường
        const live = MOCK_USER_ROWS.filter(u => u.status !== 'INACTIVE');
        const taken = v => live.some(u => [u.username, u.email].some(x => x.toLowerCase() === v.toLowerCase()));
        const dup = {};
        if (taken(b.username)) dup.username = ['Tên đăng nhập đã được dùng'];
        if (taken(b.email)) dup.email = ['Email đã được dùng'];
        if (Object.keys(dup).length) return gaFail(409, 'ACCOUNT_DUPLICATE', 'Tên đăng nhập hoặc email đã được dùng', dup);

        const now = gaNow();
        const row = {
            id: Math.max(...MOCK_USER_ROWS.map(u => u.id)) + 1, userGroupId: groupId,
            username: b.username, email: b.email, fullName: b.fullName, jobTitle: b.jobTitle, phoneNumber: b.phoneNumber,
            avatarUrl: null, status: 'ACTIVE', roleCode: b.roleCode, lastLoginAt: null,
            createdAt: now, updatedAt: now, mustChangePassword: true
        };
        MOCK_USER_ROWS.push(row); // users + user_roles + user_settings + audit USER / CREATE trong một transaction
        const data = Object.assign(toUserDetail(row), { temporaryPassword: gaTempPassword() });
        return { success: true, statusCode: 201, message: 'Tạo người dùng thành công', data, timestamp: now };
    });
}

// ==========================================================================
// 2. Trạng thái màn hình
// ==========================================================================

let appState = {
    viewMode: 'grid',       // 'grid' | 'table' – trạng thái giao diện cục bộ, không lưu
    query: { page: 1, search: '', roleCode: '', status: '' }, // '' = không lọc (status '' = "Đang sử dụng")
    seq: 0,                 // chỉ hiển thị response của request gửi sau cùng
    items: [],              // data của trang đang hiển thị (tiêu đề hộp chi tiết, các hộp mock cũ mục 6)
    detailSeq: 0,           // chỉ hiển thị response của lần mở hộp chi tiết sau cùng
    detailId: null,         // id đang mở trong hộp chi tiết
    summary: null,          // data của GET /user-groups/:id (sự kiện member-group-summary)
    pendingActionUserId: null
};

const gaCallApi = fn => (window.memberSession ? window.memberSession.request(fn) : fn('mock-token'));
const gaEsc = v => String(v == null ? '' : v)
    .replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
function gaInitials(name) {
    const parts = String(name || '').trim().split(/\s+/);
    return ((parts.length > 1 ? parts[0][0] : '') + (parts[parts.length - 1][0] || '')).toUpperCase();
}
function gaFormatDate(iso, withTime) {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso || '');
    return m ? m[3] + '/' + m[2] + '/' + m[1] + (withTime ? ' ' + m[4] + ':' + m[5] : '') : '';
}
function gaAccount() { return window.memberSession ? window.memberSession.getAccount() : null; }
function gaCan(code) { const a = gaAccount(); return !!(a && (a.permissions || []).includes(code)); }
// limit = itemsPerPage của store preferencesUser (10/20/50), đọc lại mỗi lần gửi.
function gaLimit() {
    const prefs = window.memberSession ? window.memberSession.getPreferences() : null;
    return prefs && [10, 20, 50].includes(prefs.itemsPerPage) ? prefs.itemsPerPage : 10;
}
function gaBuildQuery() {
    const q = { page: String(appState.query.page), limit: String(gaLimit()) };
    ['search', 'roleCode', 'status'].forEach(k => { if (appState.query[k]) q[k] = appState.query[k]; });
    return q;
}
const GA_ROLE_BADGE = {
    GROUP_ADMIN: '<span class="badge-group-role admin">★ Quản trị viên nhóm</span>',
    USER_RECORDING: '<span class="badge-group-role recording">Thành viên nghe ghi âm</span>',
    REGULAR_USER: '<span class="badge-group-role member">Thành viên</span>'
};
const GA_STATUS_LABELS = { ACTIVE: 'Hoạt động', LOCKED: 'Đã khóa', INACTIVE: 'Ngừng hoạt động' };

// ==========================================================================
// 3. Khởi tạo
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    initEventListeners();
    applyRecordingVisibility();
    document.querySelectorAll('[data-permission]').forEach(el => { el.hidden = !gaCan(el.dataset.permission); });
    loadMembers();
    window.addEventListener('member-group-summary', e => {
        appState.summary = e.detail && e.detail.data;
        if (appState.items.length) renderMembers(appState.items); // chỉ vẽ lại, không gọi lại API
    });
});

// Nhóm chưa được cấp phép ghi âm (Tầng 1): ẩn lựa chọn vai trò USER_RECORDING ở bộ lọc (M02 mục 5.3).
function applyRecordingVisibility() {
    const ug = gaAccount() ? gaAccount().userGroup : null;
    const allowed = !ug || ug.allowRecordingAccess;
    document.querySelectorAll('[data-recording-only]').forEach(el => { el.hidden = !allowed; el.disabled = !allowed; });
}

function initEventListeners() {
    document.getElementById('btnViewGrid')?.addEventListener('click', () => setViewMode('grid'));
    document.getElementById('btnViewTable')?.addEventListener('click', () => setViewMode('table'));
    document.getElementById('btnRetryMembers')?.addEventListener('click', () => loadMembers());
    document.getElementById('btnRetryViewMember')?.addEventListener('click', () => { if (appState.detailId) loadMemberDetail(appState.detailId); });

    // Tìm kiếm: 300 ms sau lần gõ cuối hoặc Enter; đổi điều kiện thì về trang 1.
    const searchInput = document.getElementById('memberSearchInput');
    if (searchInput) {
        let timer = null;
        const apply = () => {
            clearTimeout(timer);
            const value = searchInput.value.trim();
            if (value === appState.query.search) return;
            appState.query.search = value;
            appState.query.page = 1;
            loadMembers();
        };
        searchInput.addEventListener('input', () => { clearTimeout(timer); timer = setTimeout(apply, 300); });
        searchInput.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); apply(); } });
    }
    document.getElementById('filterRoleSelect')?.addEventListener('change', e => {
        appState.query.roleCode = e.target.value; appState.query.page = 1; loadMembers();
    });
    document.getElementById('filterStatusSelect')?.addEventListener('change', e => {
        appState.query.status = e.target.value; appState.query.page = 1; loadMembers();
    });
    document.getElementById('paginationPages')?.addEventListener('click', e => {
        const btn = e.target.closest('button[data-page]');
        if (!btn) return;
        appState.query.page = Number(btn.dataset.page);
        loadMembers();
    });

    window.addEventListener('click', (e) => {
        if (e.target.classList && e.target.classList.contains('modal')) closeAllModals();
    });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeAllModals(); });
}

function setViewMode(mode) {
    appState.viewMode = mode;
    document.getElementById('btnViewGrid')?.classList.toggle('active', mode === 'grid');
    document.getElementById('btnViewTable')?.classList.toggle('active', mode === 'table');
    if (appState.items.length) renderMembers(appState.items);
}

// Nhóm của người gọi: tên + cờ Tầng 1 từ store (authUser.user.userGroup, /auth/me),
// mã + người đại diện từ data của GET /user-groups/:id (rỗng/null khi thẻ tóm tắt chưa tải xong).
function getCurrentGroup() {
    const data = appState.summary;
    const ug = gaAccount() ? gaAccount().userGroup : null;
    return {
        id: ug ? ug.id : 1,
        code: data ? data.code : '',
        name: data ? data.name : (ug ? ug.name : ''),
        allowRecordingAccess: ug ? ug.allowRecordingAccess : true
    };
}
// Số Quản trị viên nhóm ACTIVE: admins của GET /user-groups/:id (null khi chưa tải được → backend vẫn chặn 409).
function getActiveAdminCount() {
    return appState.summary && Array.isArray(appState.summary.admins) ? appState.summary.admins.length : null;
}
function findMember(userId) { return appState.items.find(m => m.id === userId) || null; }

// ==========================================================================
// 4. Tải & vẽ danh sách thành viên
// ==========================================================================

// state: 'loading' | 'error' | 'empty' | 'ready'
function setMembersState(state, message, hint) {
    const box = document.getElementById('memberListState');
    const msg = document.getElementById('memberListMessage');
    const retry = document.getElementById('btnRetryMembers');
    const empty = document.getElementById('memberEmptyState');
    const grid = document.getElementById('adminCardsGrid');
    const table = document.getElementById('adminTableView');
    const pager = document.getElementById('memberPagination');
    const badge = document.getElementById('memberTableCountBadge');
    if (box) { box.hidden = !(state === 'loading' || state === 'error'); box.classList.toggle('is-error', state === 'error'); }
    if (msg) msg.textContent = state === 'loading' || state === 'error' ? message : '';
    if (retry) retry.hidden = state !== 'error';
    if (empty) {
        empty.hidden = state !== 'empty';
        if (state === 'empty') {
            document.getElementById('memberEmptyTitle').textContent = message;
            document.getElementById('memberEmptyHint').textContent = hint || '';
        }
    }
    if (grid) grid.hidden = !(state === 'ready' && appState.viewMode === 'grid');
    if (table) table.hidden = !(state === 'ready' && appState.viewMode === 'table');
    if (pager) pager.hidden = state !== 'ready';
    if (badge && state === 'error') badge.hidden = true;
}

function loadMembers() {
    const seq = ++appState.seq;
    setMembersState('loading', 'Đang tải danh sách thành viên...');
    return gaCallApi(token => mockGetUsers(token, gaBuildQuery()))
        .then(res => {
            if (seq !== appState.seq) return; // đã có request mới hơn
            const p = res.pagination;
            const badge = document.getElementById('memberTableCountBadge');
            if (badge) { badge.textContent = p.total + ' thành viên'; badge.hidden = false; }
            if (!res.data.length && p.page > 1 && p.totalPages > 0) {
                appState.query.page = p.totalPages; // danh sách ngắn lại: lùi về trang cuối
                return loadMembers();
            }
            appState.items = res.data;
            if (!res.data.length) {
                const q = appState.query;
                if (q.search || q.roleCode || q.status) setMembersState('empty', 'Không có thành viên phù hợp với bộ lọc', 'Thử từ khóa khác hoặc bỏ bớt bộ lọc');
                else setMembersState('empty', 'Nhóm chưa có thành viên đang sử dụng', 'Tài khoản ngừng hoạt động xem bằng bộ lọc "Ngừng hoạt động"');
                return;
            }
            renderMembers(res.data);
            renderPagination(p, res.data.length);
        })
        .catch(err => {
            if (seq !== appState.seq) return;
            if (err && err.statusCode === 401) return; // request() đã chuyển về login
            // 503: request() hiện biểu ngữ bảo trì; khối danh sách vẫn hiện thông điệp + "Thử lại" riêng (U09).
            setMembersState('error', (err && err.statusCode && err.message) || 'Không tải được danh sách thành viên. Vui lòng thử lại.');
        });
}
// Tên cũ dùng ở các hộp mục 6: mọi thao tác xong thì tải lại danh sách (A13).
const renderCurrentGroup = loadMembers;

function avatarHtml(m, cls) {
    return m.avatarUrl
        ? `<img src="${gaEsc(m.avatarUrl)}" alt="" class="${cls}">`
        : `<span class="${cls} avatar-initials" aria-hidden="true">${gaEsc(gaInitials(m.fullName))}</span>`;
}
function recordingBadgeHtml(m) {
    // Nghe/tải ghi âm = Tầng 1 của nhóm + vai trò GROUP_ADMIN/USER_RECORDING (M10 mục 2.3)
    return getCurrentGroup().allowRecordingAccess && (m.roleCode === 'GROUP_ADMIN' || m.roleCode === 'USER_RECORDING')
        ? `<span class="badge-recording" title="Được nghe & tải ghi âm của nhóm"><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg> Ghi âm</span>`
        : '';
}
function repMarkHtml(m) {
    return m.isRepresentative ? '<span class="member-rep-mark" title="Người đại diện nhóm">★ Đại diện</span>' : '';
}
function statusBadgeHtml(m) {
    return `<span class="badge-status ${m.status.toLowerCase()}">${GA_STATUS_LABELS[m.status] || gaEsc(m.status)}</span>`;
}

const GA_ICONS = {
    view: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>',
    edit: '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>',
    role: '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>',
    password: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path>',
    status: '<circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>'
};
// Nút trên một dòng: xem luôn có; dòng INACTIVE chỉ xem; dòng của chính mình không khóa/đặt lại mật khẩu
// (403 SELF_ACTION_FORBIDDEN); mỗi nút theo mã quyền của store.
function rowActionsHtml(m, btnClass, size) {
    const icon = (key, cls, onclick, title) =>
        `<button type="button" class="${btnClass}${cls ? ' ' + cls : ''}" onclick="${onclick}(${m.id})" title="${title}"><svg viewBox="0 0 24 24" width="${size}" height="${size}" fill="none" stroke="currentColor" stroke-width="2">${GA_ICONS[key]}</svg></button>`;
    const self = gaAccount() && gaAccount().id === m.id;
    let html = icon('view', '', 'openViewMemberModal', 'Xem chi tiết');
    if (m.status === 'INACTIVE') return html;
    if (gaCan('user:edit')) html += icon('edit', 'edit', 'openEditMemberModal', 'Sửa thông tin thành viên');
    if (gaCan('group:manage_admin')) html += icon('role', 'role', 'openToggleAdminModal', m.roleCode === 'GROUP_ADMIN' ? 'Hạ quyền Quản trị viên nhóm' : 'Bổ nhiệm làm Quản trị viên nhóm');
    if (!self && gaCan('user:edit')) {
        html += icon('password', 'password', 'openResetPasswordModal', 'Đặt lại mật khẩu');
        html += icon('status', 'status', 'openToggleStatusModal', m.status === 'ACTIVE' ? 'Khóa tài khoản' : 'Mở khóa tài khoản');
    }
    return html;
}

function renderMembers(members) {
    if (appState.viewMode === 'grid') renderCardGrid(members);
    else renderTableView(members);
    setMembersState('ready');
}

function renderCardGrid(members) {
    const grid = document.getElementById('adminCardsGrid');
    if (!grid) return;
    grid.innerHTML = members.map(m => `
        <div class="admin-card${m.status === 'INACTIVE' ? ' is-inactive' : ''}" data-user-id="${m.id}">
            <div>
                <div class="admin-card-top">
                    ${avatarHtml(m, 'admin-card-avatar')}
                    <div class="admin-card-info">
                        <div class="admin-card-name-row">
                            <h4 class="admin-card-name" title="${gaEsc(m.fullName)}">${gaEsc(m.fullName)} ${repMarkHtml(m)}</h4>
                            ${statusBadgeHtml(m)}
                        </div>
                        <p class="admin-card-title">${m.jobTitle ? gaEsc(m.jobTitle) : '<span class="text-muted">Chưa cập nhật chức danh</span>'}</p>
                        <div class="admin-card-badges">${GA_ROLE_BADGE[m.roleCode] || gaEsc(m.roleName)} ${recordingBadgeHtml(m)}</div>
                    </div>
                </div>
                <div class="admin-card-meta">
                    <div class="admin-card-email-row" title="Tên đăng nhập"><span>@${gaEsc(m.username)}</span></div>
                    <div class="admin-card-email-row" title="Điện thoại">
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><rect x="5" y="2" width="14" height="20" rx="2" ry="2"></rect><line x1="12" y1="18" x2="12.01" y2="18"></line></svg>
                        <span>${m.phoneNumber ? gaEsc(m.phoneNumber) : '—'}</span>
                    </div>
                    <div class="admin-card-email-row" title="${gaEsc(m.email)}">
                        <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                        <span>${gaEsc(m.email)}</span>
                    </div>
                </div>
            </div>
            <div class="admin-card-footer">
                <div class="admin-card-actions">${rowActionsHtml(m, 'btn-card-icon', 14)}</div>
            </div>
        </div>`).join('');
}

function renderTableView(members) {
    const tbody = document.getElementById('membersTableBody');
    if (!tbody) return;
    tbody.innerHTML = members.map(m => `
        <tr data-user-id="${m.id}">
            <td>
                <div class="member-user-cell">
                    ${avatarHtml(m, 'avatar')}
                    <div class="member-user-meta">
                        <span class="member-name">${gaEsc(m.fullName)} ${repMarkHtml(m)}</span>
                        <span class="member-email">@${gaEsc(m.username)} • ${gaEsc(m.email)}</span>
                    </div>
                </div>
            </td>
            <td><span class="member-phone">${m.phoneNumber ? gaEsc(m.phoneNumber) : '—'}</span></td>
            <td>
                <div class="member-role-cell">${GA_ROLE_BADGE[m.roleCode] || gaEsc(m.roleName)} ${recordingBadgeHtml(m)}</div>
            </td>
            <td>
                <span>${gaFormatDate(m.createdAt)}</span>
                <span class="member-sub">${m.lastLoginAt ? 'Đăng nhập: ' + gaFormatDate(m.lastLoginAt, true) : 'Chưa đăng nhập'}</span>
            </td>
            <td>${statusBadgeHtml(m)}</td>
            <td class="text-right"><div class="row-actions-group">${rowActionsHtml(m, 'btn-icon-action', 15)}</div></td>
        </tr>`).join('');
}

// Phân trang theo pagination của response (cửa sổ 5 trang).
function renderPagination(p, count) {
    const info = document.getElementById('paginationInfo');
    const pages = document.getElementById('paginationPages');
    const from = (p.page - 1) * p.limit + 1;
    if (info) info.textContent = `Hiển thị ${from}–${from + count - 1} / ${p.total} thành viên`;
    if (!pages) return;
    const btn = (label, page, { disabled = false, active = false, aria } = {}) =>
        `<button type="button" class="btn ${active ? 'btn-primary' : 'btn-outline'} btn-page"
            ${disabled || active ? 'disabled' : `data-page="${page}"`} ${aria ? `aria-label="${aria}"` : ''}
            ${active ? 'aria-current="page"' : ''}>${label}</button>`;
    const first = Math.max(1, Math.min(p.page - 2, p.totalPages - 4));
    const last = Math.min(p.totalPages, first + 4);
    let html = btn('«', p.page - 1, { disabled: !p.hasPrev, aria: 'Trang trước' });
    for (let i = first; i <= last; i++) html += btn(String(i), i, { active: i === p.page });
    html += btn('»', p.page + 1, { disabled: !p.hasNext, aria: 'Trang sau' });
    pages.innerHTML = html;
}

// ==========================================================================
// 6. Hộp thao tác – Thêm (N03 POST), Sửa (N04 PUT) đã theo API; còn mock CŨ (N05 status, N06 reset-password, N07 role):
//    mở hộp đọc dòng đã tải (findMember, DTO 14 trường); xác nhận sửa dòng "CSDL" (mockRow) rồi tải lại.
// ==========================================================================

// Dòng "CSDL" của mock theo id (chỉ dùng trong các hộp mock cũ ở mục này).
function mockRow(userId) { return MOCK_USER_ROWS.find(r => r.id === userId) || null; }

function openModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) el.classList.add('show');
}

function closeModal(modalId) {
    if ((modalId === 'addMemberModal' && gaAddBusy) || (modalId === 'editMemberModal' && gaEditBusy)) return; // đang gửi: không đóng
    if (modalId === 'editMemberModal') { gaEditId = null; gaEditData = null; gaEditSeq++; } // bỏ response GET /:id đang chờ
    if (modalId === 'viewMemberModal') { appState.detailId = null; appState.detailSeq++; } // bỏ response GET /:id đang chờ
    const el = document.getElementById(modalId);
    if (el) el.classList.remove('show');
}

// Bấm nền / Esc: đóng mọi hộp, trừ hộp mật khẩu tạm (chỉ đóng bằng nút) và hộp Thêm/Sửa đang gửi.
function closeAllModals() {
    document.querySelectorAll('.modal.show').forEach(m => {
        if (m.id === 'memberTempPasswordModal' || (m.id === 'addMemberModal' && gaAddBusy) || (m.id === 'editMemberModal' && gaEditBusy)) return;
        closeModal(m.id);
    });
}

// Modal 1: Thêm thành viên mới – POST /api/v1/users (N03, M03 mục 3.4). Nhóm = nhóm của người gọi (backend), không gửi userGroupId.
function addMemberForm() { return document.getElementById('addMemberForm'); }

function clearAddMemberErrors() {
    const form = addMemberForm();
    form.querySelectorAll('[data-error-for]').forEach(el => { el.textContent = ''; el.hidden = true; });
    form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
}

// errors[field] → dưới ô có data-error-for = field; khóa không có ô (vd. userGroupId, trường lạ) gom vào toast.
function showAddMemberErrors(errors) {
    const form = addMemberForm();
    const orphan = [];
    Object.keys(errors || {}).forEach(key => {
        const slot = form.querySelector(`[data-error-for="${CSS.escape(key)}"]`);
        if (!slot) { orphan.push(errors[key].join(', ')); return; }
        slot.textContent = errors[key].join(', ');
        slot.hidden = false;
        const input = form.elements[key];
        if (input && input.classList) input.classList.add('is-invalid');
    });
    if (orphan.length) showToast(gaEsc(orphan.join('; ')), 'error');
    const first = form.querySelector('.is-invalid');
    if (first) first.focus();
}

// Lựa chọn vai trò: ẩn khi store thiếu mã quyền gán; USER_RECORDING ẩn hẳn khi nhóm chưa cấp Tầng 1 (store).
function applyAddRoleOptions() {
    const role = document.getElementById('addRole');
    if (!role) return;
    const recordingAllowed = getCurrentGroup().allowRecordingAccess;
    [...role.options].forEach(o => {
        const allowed = (!o.dataset.rolePermission || gaCan(o.dataset.rolePermission))
            && (o.dataset.recordingOnly === undefined || recordingAllowed);
        o.hidden = !allowed;
        o.disabled = !allowed;
    });
    if (role.selectedOptions[0] && role.selectedOptions[0].disabled) role.value = 'REGULAR_USER';
}

function setAddMemberBusy(busy) {
    gaAddBusy = busy;
    [...addMemberForm().elements].forEach(el => { el.disabled = busy; });
    document.querySelectorAll('#addMemberModal [data-add-close]').forEach(b => { b.disabled = busy; });
    const btn = document.getElementById('addMemberSubmitBtn');
    if (btn) btn.textContent = busy ? 'Đang lưu...' : 'Thêm thành viên';
    if (!busy) applyAddRoleOptions();
}

function openAddMemberModal() {
    const group = getCurrentGroup();
    const groupNameEl = document.getElementById('addMemberGroupNameDisplay');
    if (groupNameEl) groupNameEl.textContent = (group.code ? group.code + ' – ' : '') + group.name; // chỉ đọc
    addMemberForm().reset();
    clearAddMemberErrors();
    applyAddRoleOptions();
    openModal('addMemberModal');
    document.getElementById('addFullName').focus();
}

function closeAddMemberModal() { closeModal('addMemberModal'); } // closeModal tự chặn khi đang gửi

// Đọc form thành body đúng các trường API của bản User: ô trống tùy chọn → null, roleCode luôn gửi, không có userGroupId.
function readAddMemberForm() {
    const f = addMemberForm().elements;
    const opt = name => (f[name].value.trim() === '' ? null : f[name].value);
    return {
        username: f.username.value,
        email: f.email.value,
        fullName: f.fullName.value,
        jobTitle: opt('jobTitle'),
        phoneNumber: opt('phoneNumber'),
        roleCode: f.roleCode.value
    };
}

function submitAddMember(e) {
    if (e) e.preventDefault();
    if (gaAddBusy) return;
    clearAddMemberErrors();
    const { errors, body } = validateUserCreateBody(readAddMemberForm());
    if (Object.keys(errors).length) { showAddMemberErrors(errors); return; } // không gọi API
    setAddMemberBusy(true);
    gaCallApi(token => mockCreateUser(token, body))
        .then(res => {
            setAddMemberBusy(false);
            closeModal('addMemberModal');
            addMemberForm().reset();
            showMemberTempPassword(res.data);
            showToast('Đã tạo người dùng ' + gaEsc(res.data.fullName), 'success');
            loadMembers(); // giữ bộ lọc và trang hiện tại
        })
        .catch(err => {
            setAddMemberBusy(false);
            const status = err && err.statusCode;
            if (status === 401) return; // request() đã chuyển về login
            if (status === 503) { showToast(gaEsc(err.message || 'Hệ thống đang bảo trì'), 'warning'); return; } // + biểu ngữ của request()
            if ((status === 400 || status === 409) && err.errors) { showAddMemberErrors(err.errors); return; }
            if (status === 403) { showToast(gaEsc(err.message || 'Bạn không có quyền thực hiện thao tác này'), 'warning'); return; }
            showToast(gaEsc((err && err.statusCode && err.message) || 'Không tạo được thành viên. Vui lòng thử lại.'), 'error');
        });
}

// Hộp mật khẩu tạm: chỉ giữ trong DOM khi đang mở; đóng thì xóa. Không lưu store/localStorage/URL.
function showMemberTempPassword(data) {
    document.getElementById('memberTempFullName').textContent = data.fullName;
    document.getElementById('memberTempUsername').textContent = '@' + data.username;
    document.getElementById('memberTempValue').textContent = data.temporaryPassword;
    openModal('memberTempPasswordModal');
}
function closeMemberTempPassword() {
    ['memberTempFullName', 'memberTempUsername', 'memberTempValue'].forEach(id => { document.getElementById(id).textContent = ''; });
    document.getElementById('memberTempPasswordModal').classList.remove('show');
}
function copyMemberTempPassword() {
    const value = document.getElementById('memberTempValue').textContent;
    if (!navigator.clipboard) { showToast('Trình duyệt không hỗ trợ sao chép, hãy chép thủ công', 'warning'); return; }
    navigator.clipboard.writeText(value)
        .then(() => showToast('Đã sao chép mật khẩu tạm', 'success'))
        .catch(() => showToast('Không sao chép được, hãy chép thủ công', 'warning'));
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('#addMemberModal [data-add-close]').forEach(b => b.addEventListener('click', closeAddMemberModal));
    document.querySelectorAll('[data-close-member-temp]').forEach(b => b.addEventListener('click', closeMemberTempPassword));
    document.getElementById('btnCopyMemberTemp')?.addEventListener('click', copyMemberTempPassword);
    const form = addMemberForm();
    if (form) form.addEventListener('input', ev => { // gõ lại vào ô thì bỏ lỗi của ô đó
        const slot = ev.target.name && form.querySelector(`[data-error-for="${CSS.escape(ev.target.name)}"]`);
        if (slot) { slot.hidden = true; slot.textContent = ''; }
        ev.target.classList && ev.target.classList.remove('is-invalid');
    });
});

// Modal 2: Sửa thông tin thành viên – PUT /api/v1/users/:id (N04, M03 mục 3.5). Tải GET /users/:id mỗi lần mở;
// chỉ gửi trường đã đổi trong fullName, jobTitle, phoneNumber. Kiểm tay: ?updateError=1 (lỗi mạng một lần),
// ?updateInactive=<id> (→ 409 ACCOUNT_INACTIVE), ?maintenance=1 (503), ?detailOtherGroup=<id> (mở hộp → 403).
const GA_UPDATE_KEYS = ['fullName', 'jobTitle', 'phoneNumber'];
let gaMockUpdateError = gaParams.get('updateError') === '1';
let gaEditBusy = false;
let gaEditSeq = 0;      // chỉ hiển thị response của lần mở sau cùng
let gaEditId = null;    // id đang mở trong hộp sửa
let gaEditData = null;  // data của GET /users/:id đang sửa (so trường đã đổi khi lưu)

// Kiểm tra body cập nhật một phần (dùng chung cho mock backend và kiểm tra trước khi gửi ở frontend).
function validateUserUpdateBody(raw) {
    const errors = {};
    const add = (k, m) => { (errors[k] = errors[k] || []).push(m); };
    if (!raw || typeof raw !== 'object' || Array.isArray(raw) || !Object.keys(raw).length) {
        GA_UPDATE_KEYS.forEach(k => add(k, 'Cần gửi ít nhất một trường'));
        return { errors, body: {} };
    }
    Object.keys(raw).forEach(k => {
        if (k === 'userGroupId') add(k, 'Thuộc tính nhóm người dùng là cố định từ lúc tạo, không thể thay đổi hoặc chuyển nhóm');
        else if (!GA_UPDATE_KEYS.includes(k)) add(k, 'Trường không được nhận');
    });
    const body = {};
    const str = (key, { required, max, re, reMsg }) => {
        if (!(key in raw)) return;
        const v = raw[key];
        if (v === null) { if (required) add(key, 'Bắt buộc'); else body[key] = null; return; }
        if (typeof v !== 'string') { add(key, 'Phải là chuỗi'); return; }
        const t = v.trim();
        if (t === '') { if (required) add(key, 'Bắt buộc'); else body[key] = null; return; }
        if (t.length > max) { add(key, `Tối đa ${max} ký tự`); return; }
        if (re && !re.test(t)) { add(key, reMsg); return; }
        body[key] = t;
    };
    str('fullName', { required: true, max: 150 });
    str('jobTitle', { max: 150 });
    str('phoneNumber', { max: 30, re: GA_PHONE_RE, reMsg: 'Chỉ chữ số, dấu cách và + - . ( ), có ít nhất một chữ số' });
    return { errors, body };
}

// Giả lập PUT /api/v1/users/:id (bản User). Thứ tự: guard (401) → bảo trì (503) → quyền user:edit (403) → :id/query/body (400)
// → kiểm tra tài khoản (401) → khóa dòng users đích (404) → phạm vi nhóm (403 FORBIDDEN_SCOPE_ACCESS) → INACTIVE (409)
// → so trường → UPDATE + USER / UPDATE { changedFields }. 200: data = 17 trường của GET /users/:id. Sửa được chính mình.
function mockUpdateUser(token, id, body, query) {
    return new Promise(resolve => setTimeout(resolve, 400)).then(() => {
        if (gaMockUpdateError) { gaMockUpdateError = false; return Promise.reject(new Error('Network Error')); }
        if (!token) return gaFail(401, 'UNAUTHORIZED', 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');
        if (GA_MOCK_MAINTENANCE) return gaFail(503, 'MAINTENANCE', 'Hệ thống đang bảo trì, vui lòng quay lại sau');
        const account = gaAccount();
        if (account && !(account.permissions || []).includes('user:edit')) {
            return gaFail(403, 'FORBIDDEN_PERMISSION', 'Bạn không có quyền thực hiện thao tác này');
        }
        const { errors, body: b } = validateUserUpdateBody(body);
        if (!(/^[1-9][0-9]{0,9}$/.test(String(id)) && Number(id) <= 4294967295)) errors.id = ['Mã người dùng phải là số nguyên dương'];
        Object.keys(query || {}).forEach(k => { errors[k] = ['Tham số không được nhận']; });
        if (Object.keys(errors).length) return gaFail(400, 'VALIDATION_ERROR', 'Dữ liệu không hợp lệ', errors);
        if (GA_MOCK_ACCOUNT_LOCKED) return gaFail(401, 'UNAUTHORIZED', 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại');

        const scopeGroupId = account ? account.userGroup.id : 1; // = users.user_group_id đọc ở bước kiểm tra tài khoản
        const row = MOCK_USER_ROWS.find(r => r.id === Number(id)); // SELECT ... FROM users WHERE id = :id FOR UPDATE
        if (!row) return gaFail(404, 'NOT_FOUND', 'Không tìm thấy tài nguyên');
        if (row.userGroupId !== scopeGroupId) return gaFail(403, 'FORBIDDEN_SCOPE_ACCESS', 'Bạn không có quyền truy cập dữ liệu của nhóm khác');
        if (gaParams.get('updateInactive') === String(id)) row.status = 'INACTIVE'; // giả lập vừa bị ngừng hoạt động ở nơi khác
        if (row.status === 'INACTIVE') return gaFail(409, 'ACCOUNT_INACTIVE', 'Tài khoản đã ngừng hoạt động, không sửa được');
        const changed = GA_UPDATE_KEYS.filter(k => k in b && b[k] !== (row[k] == null ? null : row[k])); // so chính xác
        if (!changed.length) {
            return { success: true, statusCode: 200, message: 'Không có thay đổi nào', data: toUserDetail(row), timestamp: gaNow() };
        }
        changed.forEach(k => { row[k] = b[k]; });
        row.updatedAt = gaNow(); // + audit USER / UPDATE { changedFields } cùng transaction
        return { success: true, statusCode: 200, message: 'Cập nhật người dùng thành công', data: toUserDetail(row), timestamp: gaNow() };
    });
}

function editMemberForm() { return document.getElementById('editMemberForm'); }

function clearEditMemberErrors() {
    const form = editMemberForm();
    form.querySelectorAll('[data-error-for]').forEach(el => { el.textContent = ''; el.hidden = true; });
    form.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));
}

function showEditMemberErrors(errors) {
    const form = editMemberForm();
    const orphan = [];
    Object.keys(errors || {}).forEach(key => {
        const slot = form.querySelector(`[data-error-for="${CSS.escape(key)}"]`);
        if (!slot) { orphan.push(errors[key].join(', ')); return; }
        slot.textContent = errors[key].join(', ');
        slot.hidden = false;
        const input = form.elements[key];
        if (input && input.classList) input.classList.add('is-invalid');
    });
    if (orphan.length) showToast(gaEsc(orphan.join('; ')), 'error');
    const first = form.querySelector('.is-invalid');
    if (first) first.focus();
}

// state: 'loading' | 'error' | 'ready' – form ẩn khi đang tải/lỗi.
function setEditMemberState(state, message) {
    const box = document.getElementById('editMemberState');
    const msg = document.getElementById('editMemberStateMessage');
    const retry = document.getElementById('btnRetryEditMember');
    if (box) { box.hidden = state === 'ready'; box.classList.toggle('is-error', state === 'error'); }
    if (msg && message) msg.textContent = message;
    if (retry) retry.hidden = state !== 'error';
    editMemberForm().hidden = state !== 'ready';
}

function setEditMemberBusy(busy) {
    gaEditBusy = busy;
    [...editMemberForm().elements].forEach(el => { el.disabled = busy; });
    document.querySelectorAll('#editMemberModal [data-edit-close]').forEach(b => { b.disabled = busy; });
    const btn = document.getElementById('editMemberSubmitBtn');
    if (btn) btn.textContent = busy ? 'Đang lưu...' : 'Lưu thay đổi';
}

// Mở hộp sửa: tiêu đề từ dòng đã bấm, dữ liệu form từ GET /users/:id (mỗi lần mở, không dùng dòng danh sách).
function openEditMemberModal(userId) {
    const row = findMember(userId);
    document.getElementById('editMemberTitle').textContent = 'Chỉnh sửa – ' + (row ? row.fullName : 'thành viên #' + userId);
    gaEditId = userId;
    gaEditData = null;
    clearEditMemberErrors();
    openModal('editMemberModal');
    loadEditMember(userId);
}

function loadEditMember(userId) {
    const seq = ++gaEditSeq;
    setEditMemberState('loading', 'Đang tải thông tin thành viên...');
    return gaCallApi(token => mockGetUserDetail(token, userId))
        .then(res => {
            if (seq !== gaEditSeq || gaEditId !== userId) return; // đã mở dòng khác hoặc đã đóng
            if (res.data.status === 'INACTIVE') { // trạng thái cuối: không sửa được nữa
                closeModal('editMemberModal');
                showToast('Tài khoản "' + gaEsc(res.data.fullName) + '" đã ngừng hoạt động, không sửa được.', 'warning');
                loadMembers();
                return;
            }
            gaEditData = res.data;
            fillEditMemberForm(res.data);
            setEditMemberState('ready');
            document.getElementById('editFullName').focus();
        })
        .catch(err => {
            if (seq !== gaEditSeq || gaEditId !== userId) return;
            if (err && err.statusCode === 401) return; // request() đã chuyển về login
            if (err && (err.statusCode === 404 || (err.statusCode === 403 && err.errorCode === 'FORBIDDEN_SCOPE_ACCESS'))) {
                closeModal('editMemberModal');
                showToast('Thành viên không còn trong nhóm. Danh sách đã được tải lại.', 'warning');
                loadMembers();
                return;
            }
            // 503: request() hiện biểu ngữ bảo trì; hộp hiện thông điệp + "Thử lại" riêng (U09).
            setEditMemberState('error', (err && err.statusCode && err.message) || 'Không tải được thông tin thành viên. Vui lòng thử lại.');
        });
}

function fillEditMemberForm(d) {
    document.getElementById('editUsername').textContent = '@' + d.username;
    document.getElementById('editEmail').textContent = d.email;
    document.getElementById('editGroupName').textContent = d.userGroup.code + ' – ' + d.userGroup.name;
    document.getElementById('editRoleName').textContent = d.roleName + (d.isRepresentative ? ' • Người đại diện nhóm' : '');
    const f = editMemberForm().elements;
    f.fullName.value = d.fullName;
    f.jobTitle.value = d.jobTitle || '';
    f.phoneNumber.value = d.phoneNumber || '';
}

// So form (đã cắt khoảng trắng) với data đã tải, chỉ giữ trường khác; ô rỗng → null (họ tên rỗng → null, báo "Bắt buộc").
function buildMemberUpdateBody() {
    const f = editMemberForm().elements;
    const current = {
        fullName: f.fullName.value.trim() || null,
        jobTitle: f.jobTitle.value.trim() || null,
        phoneNumber: f.phoneNumber.value.trim() || null
    };
    const body = {};
    GA_UPDATE_KEYS.forEach(k => { if (current[k] !== (gaEditData[k] == null ? null : gaEditData[k])) body[k] = current[k]; });
    return body;
}

function submitEditMember(e) {
    if (e) e.preventDefault();
    if (gaEditBusy || !gaEditData) return;
    clearEditMemberErrors();
    const body = buildMemberUpdateBody();
    if (!Object.keys(body).length) { // không có trường nào đổi: không gọi API
        closeModal('editMemberModal');
        showToast('Không có thay đổi nào', 'info');
        return;
    }
    const { errors } = validateUserUpdateBody(body);
    if (Object.keys(errors).length) { showEditMemberErrors(errors); return; } // không gọi API
    const id = gaEditId;
    setEditMemberBusy(true);
    gaCallApi(token => mockUpdateUser(token, id, body))
        .then(res => {
            setEditMemberBusy(false);
            closeModal('editMemberModal');
            const self = gaAccount();
            if (self && self.id === res.data.id && window.memberSession) {
                window.memberSession.updateAccount({ fullName: res.data.fullName }); // header đổi ngay (U06)
            }
            showToast(gaEsc(res.message), 'success');
            loadMembers(); // giữ bộ lọc và trang; fullName đổi làm đổi thứ tự
        })
        .catch(err => {
            setEditMemberBusy(false);
            const status = err && err.statusCode;
            if (status === 401) return; // request() đã chuyển về login
            if (status === 503) { showToast(gaEsc(err.message || 'Hệ thống đang bảo trì'), 'warning'); return; } // + biểu ngữ, giữ hộp
            if (status === 400 && err.errors) { showEditMemberErrors(err.errors); return; }
            if (status === 403 || status === 404 || status === 409) { // 409 ACCOUNT_INACTIVE
                closeModal('editMemberModal');
                showToast(gaEsc(err.message), 'warning');
                loadMembers();
                return;
            }
            showToast(gaEsc((err && err.statusCode && err.message) || 'Không lưu được thay đổi. Vui lòng thử lại.'), 'error');
        });
}

document.addEventListener('DOMContentLoaded', () => {
    document.querySelectorAll('#editMemberModal [data-edit-close]').forEach(b => b.addEventListener('click', () => closeModal('editMemberModal')));
    document.getElementById('btnRetryEditMember')?.addEventListener('click', () => { if (gaEditId) loadEditMember(gaEditId); });
    const form = editMemberForm();
    if (form) form.addEventListener('input', ev => { // gõ lại vào ô thì bỏ lỗi của ô đó
        const slot = ev.target.name && form.querySelector(`[data-error-for="${CSS.escape(ev.target.name)}"]`);
        if (slot) { slot.hidden = true; slot.textContent = ''; }
        ev.target.classList && ev.target.classList.remove('is-invalid');
    });
});

// Modal 3: Bổ nhiệm / Hạ quyền Admin kèm Safeguard BR-UG-02
function openToggleAdminModal(userId) {
    const member = findMember(userId);
    if (!member) return;

    appState.pendingActionUserId = userId;
    const group = getCurrentGroup();
    const adminCount = getActiveAdminCount(); // null: thẻ tóm tắt chưa tải, backend vẫn chặn 409

    const titleEl = document.getElementById('toggleAdminModalTitle');
    const descEl = document.getElementById('toggleAdminModalDesc');
    const safeguardBox = document.getElementById('toggleAdminSafeguardBox');
    const confirmBtn = document.getElementById('confirmToggleAdminBtn');

    if (member.roleCode === 'GROUP_ADMIN') {
        titleEl.innerText = "Hạ quyền Quản trị viên nhóm";
        descEl.innerHTML = `Bạn có chắc muốn thu hồi quyền Quản trị viên nhóm của <strong>${member.fullName}</strong> (@${member.username}) trong nhóm <strong>${group.name}</strong>?`;

        // Check Safeguard BR-UG-02: Nhóm phải có ít nhất 1 Group Admin
        if (adminCount !== null && adminCount <= 1) {
            safeguardBox.style.display = "flex";
            safeguardBox.className = "safeguard-alert-box danger";
            safeguardBox.innerHTML = `
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                <div>
                    <strong>RÀNG BUỘC SAFEGUARD (BR-UG-02):</strong><br>
                    ${member.fullName} hiện là <strong>Quản trị viên nhóm duy nhất</strong> của nhóm này. Bạn không thể thu hồi quyền này cho đến khi bổ nhiệm một thành viên khác làm Quản trị viên nhóm thay thế.
                </div>
            `;
            confirmBtn.disabled = true;
            confirmBtn.style.opacity = '0.5';
            confirmBtn.style.cursor = 'not-allowed';
        } else {
            safeguardBox.style.display = "flex";
            safeguardBox.className = "safeguard-alert-box warning";
            safeguardBox.innerHTML = `
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                <div>
                    Sau khi hạ quyền, người này sẽ chuyển thành <strong>Thành viên thường</strong> và không còn quyền tạo, chỉnh sửa, phân bổ thành viên khác trong nhóm. ${adminCount === null ? '' : `Nhóm vẫn còn <strong>${adminCount - 1}</strong> Quản trị viên nhóm khác.`}
                </div>
            `;
            confirmBtn.disabled = false;
            confirmBtn.style.opacity = '1';
            confirmBtn.style.cursor = 'pointer';
        }
    } else {
        titleEl.innerText = "Bổ nhiệm Quản trị viên nhóm";
        descEl.innerHTML = `Bổ nhiệm thành viên <strong>${member.fullName}</strong> (@${member.username}) làm <strong>Quản trị viên nhóm (Group Admin)</strong>?`;
        safeguardBox.style.display = "flex";
        safeguardBox.className = "safeguard-alert-box info";
        safeguardBox.innerHTML = `
            <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
            <div>
                Người dùng này sẽ có đầy đủ thẩm quyền thêm mới, cập nhật hồ sơ, đặt lại mật khẩu và quản lý thành viên nội bộ trong nhóm <strong>${group.code}</strong>.
            </div>
        `;
        confirmBtn.disabled = false;
        confirmBtn.style.opacity = '1';
        confirmBtn.style.cursor = 'pointer';
    }

    openModal('toggleAdminModal');
}

function confirmToggleAdmin() {
    const member = mockRow(appState.pendingActionUserId);
    if (!member) return;

    member.roleCode = member.roleCode === 'GROUP_ADMIN' ? 'REGULAR_USER' : 'GROUP_ADMIN';
    closeModal('toggleAdminModal');
    renderCurrentGroup();

    showToast(
        member.roleCode === 'GROUP_ADMIN'
            ? `Đã bổ nhiệm "${member.fullName}" làm Quản trị viên nhóm thành công!`
            : `Đã thu hồi quyền Quản trị viên nhóm của "${member.fullName}".`,
        'success'
    );
}

// Modal 4: Đặt lại Mật khẩu
function openResetPasswordModal(userId) {
    const member = findMember(userId);
    if (!member) return;

    const group = getCurrentGroup();
    appState.pendingActionUserId = userId;

    // Hiển thị thông tin thành viên trên card
    const avatarEl = document.getElementById('resetPassUserAvatar');
    const nameEl = document.getElementById('resetPassUserName');
    const emailEl = document.getElementById('resetPassUserEmail');
    const groupEl = document.getElementById('resetPassUserGroup');

    if (avatarEl) { avatarEl.src = member.avatarUrl || ''; avatarEl.hidden = !member.avatarUrl; }
    if (nameEl) nameEl.innerHTML = `${member.fullName} <span style="font-size: 0.8rem; font-weight: 400; color: var(--text-muted);">(@${member.username})</span>`;
    if (emailEl) emailEl.innerText = member.email || 'Chưa cập nhật email';
    if (groupEl) groupEl.innerText = group ? `${group.code} - ${group.name}` : '';

    // Khởi tạo trạng thái mặc định
    switchResetPassMode('auto');

    const manualInput = document.getElementById('manualNewPassword');
    const confirmInput = document.getElementById('manualConfirmPassword');
    if (manualInput) {
        manualInput.value = '';
        manualInput.type = 'password';
    }
    if (confirmInput) {
        confirmInput.value = '';
        confirmInput.type = 'password';
    }

    generateRandomPassword();
    openModal('resetPasswordModal');
}

function switchResetPassMode(mode) {
    const autoTab = document.getElementById('resetPassTabAuto');
    const manualTab = document.getElementById('resetPassTabManual');
    const autoSec = document.getElementById('resetPassAutoSection');
    const manualSec = document.getElementById('resetPassManualSection');

    if (mode === 'auto') {
        if (autoTab) autoTab.classList.add('active');
        if (manualTab) manualTab.classList.remove('active');
        if (autoSec) autoSec.style.display = 'block';
        if (manualSec) manualSec.style.display = 'none';
    } else {
        if (autoTab) autoTab.classList.remove('active');
        if (manualTab) manualTab.classList.add('active');
        if (autoSec) autoSec.style.display = 'none';
        if (manualSec) manualSec.style.display = 'flex';
    }
}

function togglePasswordVisibility(inputId, btnEl) {
    const input = document.getElementById(inputId);
    if (!input) return;
    const isPass = input.type === 'password';
    input.type = isPass ? 'text' : 'password';
    if (btnEl) {
        btnEl.innerHTML = isPass
            ? `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>`
            : `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>`;
    }
}

function generateRandomPassword() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789@#%';
    let pass = 'Evn@';
    for (let i = 0; i < 6; i++) {
        pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    const input = document.getElementById('newGeneratedPassword');
    if (input) input.value = pass;
}

function copyResetPassword() {
    const passInput = document.getElementById('newGeneratedPassword');
    if (passInput) {
        passInput.select();
        navigator.clipboard.writeText(passInput.value).then(() => {
            showToast('Đã sao chép mật khẩu mới vào bộ nhớ tạm!', 'info');
        }).catch(() => {
            showToast('Sao chép thất bại, vui lòng bôi đen và nhấn Ctrl+C', 'warning');
        });
    }
}

function confirmResetPassword(event) {
    if (event) event.preventDefault();

    const member = mockRow(appState.pendingActionUserId);
    if (!member) return;

    const autoTab = document.getElementById('resetPassTabAuto');
    const isAuto = autoTab && autoTab.classList.contains('active');

    if (!isAuto) {
        const manualInput = document.getElementById('manualNewPassword');
        const confirmInput = document.getElementById('manualConfirmPassword');
        const val = manualInput ? manualInput.value.trim() : '';
        const confirmVal = confirmInput ? confirmInput.value.trim() : '';

        if (!val || val.length < 8) {
            showToast('Mật khẩu mới phải có tối thiểu 8 ký tự!', 'error');
            if (manualInput) manualInput.focus();
            return;
        }

        if (val !== confirmVal) {
            showToast('Mật khẩu xác nhận không khớp với mật khẩu mới!', 'error');
            if (confirmInput) confirmInput.focus();
            return;
        }
    }

    closeModal('resetPasswordModal');
    showToast(`Đã lưu mật khẩu mới cho thành viên "${member.fullName}". Hãy bàn giao mật khẩu này cho người dùng.`, 'success');
}

// Modal 5: Khóa / Mở khóa Tài khoản
function openToggleStatusModal(userId) {
    const member = findMember(userId);
    if (!member) return;

    appState.pendingActionUserId = userId;
    const titleEl = document.getElementById('toggleStatusTitle');
    const descEl = document.getElementById('toggleStatusDesc');
    const alertBox = document.getElementById('toggleStatusAlertBox');
    const confirmBtn = document.getElementById('confirmToggleStatusBtn');

    if (member.status === 'ACTIVE') {
        titleEl.innerText = "Khóa tài khoản thành viên";
        descEl.innerHTML = `Bạn có chắc muốn <strong>khóa tài khoản</strong> của <strong>${member.fullName}</strong> (@${member.username})?`;

        // Check if admin & only 1 active admin
        const adminCount = getActiveAdminCount();
        if (member.roleCode === 'GROUP_ADMIN' && adminCount !== null && adminCount <= 1) {
            alertBox.style.display = "flex";
            alertBox.className = "safeguard-alert-box danger";
            alertBox.innerHTML = `
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>
                <div>
                    <strong>CẢNH BÁO:</strong> Đây là Quản trị viên nhóm đang hoạt động duy nhất của nhóm. Nếu khóa, nhóm này sẽ không còn quản trị viên nào có thể đăng nhập để thao tác.
                </div>
            `;
        } else {
            alertBox.style.display = "none";
        }

        confirmBtn.className = "btn btn-danger";
        confirmBtn.innerText = "Khóa tài khoản";
    } else {
        titleEl.innerText = "Mở khóa tài khoản thành viên";
        descEl.innerHTML = `Mở khóa và cho phép <strong>${member.fullName}</strong> (@${member.username}) đăng nhập lại vào hệ thống?`;
        alertBox.style.display = "none";
        confirmBtn.className = "btn btn-primary";
        confirmBtn.innerText = "Mở khóa";
    }

    openModal('toggleStatusModal');
}

function confirmToggleStatus() {
    const member = mockRow(appState.pendingActionUserId);
    if (!member) return;

    member.status = member.status === 'ACTIVE' ? 'LOCKED' : 'ACTIVE';
    closeModal('toggleStatusModal');
    renderCurrentGroup();

    showToast(
        member.status === 'ACTIVE'
            ? `Đã mở khóa tài khoản cho "${member.fullName}".`
            : `Đã khóa tài khoản của "${member.fullName}".`,
        'success'
    );
}

// Modal 6: Xem chi tiết thành viên – GET /api/v1/users/:id mỗi lần mở (N02, M03 mục 3.3.1).
// Tiêu đề từ dòng đã bấm; thân hộp tải/lỗi/503 + "Thử lại" riêng; chỉ hiển thị response của lần mở sau cùng;
// 404/403 FORBIDDEN_SCOPE_ACCESS đóng hộp + toast cảnh báo + tải lại danh sách.
function openViewMemberModal(userId) {
    const row = findMember(userId);
    const title = document.getElementById('viewMemberTitleBar');
    if (title) title.textContent = 'Chi tiết – ' + (row ? row.fullName : 'thành viên #' + userId);
    appState.detailId = userId;
    openModal('viewMemberModal');
    loadMemberDetail(userId);
}

// state: 'loading' | 'error' | 'ready'
function setMemberDetailState(state, message) {
    const box = document.getElementById('viewMemberState');
    const msg = document.getElementById('viewMemberStateMessage');
    const retry = document.getElementById('btnRetryViewMember');
    const content = document.getElementById('viewMemberContent');
    if (box) { box.hidden = state === 'ready'; box.classList.toggle('is-error', state === 'error'); }
    if (msg && message) msg.textContent = message;
    if (retry) retry.hidden = state !== 'error';
    if (content) content.hidden = state !== 'ready';
}

function loadMemberDetail(userId) {
    const seq = ++appState.detailSeq;
    setMemberDetailState('loading', 'Đang tải thông tin thành viên...');
    return gaCallApi(token => mockGetUserDetail(token, userId))
        .then(res => {
            if (seq !== appState.detailSeq || appState.detailId !== userId) return; // đã mở dòng khác hoặc đã đóng
            renderMemberDetail(res.data);
            setMemberDetailState('ready');
        })
        .catch(err => {
            if (seq !== appState.detailSeq || appState.detailId !== userId) return;
            if (err && err.statusCode === 401) return; // request() đã chuyển về login
            if (err && (err.statusCode === 404 || (err.statusCode === 403 && err.errorCode === 'FORBIDDEN_SCOPE_ACCESS'))) {
                closeModal('viewMemberModal');
                showToast('Thành viên không còn trong nhóm. Danh sách đã được tải lại.', 'warning');
                loadMembers();
                return;
            }
            // 503: request() hiện biểu ngữ bảo trì; hộp vẫn hiện thông điệp + "Thử lại" riêng (U09).
            setMemberDetailState('error', (err && err.statusCode && err.message) || 'Không tải được thông tin thành viên. Vui lòng thử lại.');
        });
}

// HH:mm dd/MM/yyyy (khóa tạm thường chỉ vài phút nên giờ đứng trước).
function gaFormatTime(iso) {
    const m = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(iso || '');
    return m ? m[4] + ':' + m[5] + ' ' + m[3] + '/' + m[2] + '/' + m[1] : '';
}

// Vẽ hộp từ data (17 trường). Quyền ghi âm: Tầng 1 của nhóm (store) + vai trò GROUP_ADMIN/USER_RECORDING (M10 mục 2.3).
function renderMemberDetail(d) {
    const text = (id, value) => { const el = document.getElementById(id); if (el) el.textContent = value; };
    const avatar = document.getElementById('viewMemberAvatar');
    const initials = document.getElementById('viewMemberInitials');
    if (avatar) { avatar.hidden = !d.avatarUrl; if (d.avatarUrl) avatar.src = d.avatarUrl; else avatar.removeAttribute('src'); }
    if (initials) { initials.hidden = !!d.avatarUrl; initials.textContent = gaInitials(d.fullName); }
    text('viewMemberFullName', d.fullName);
    text('viewMemberUsername', '@' + d.username);
    document.getElementById('viewMemberRoleBadge').innerHTML = GA_ROLE_BADGE[d.roleCode] || gaEsc(d.roleName);
    document.getElementById('viewMemberStatusBadge').innerHTML = statusBadgeHtml(d);
    const rep = document.getElementById('viewMemberRepMark');
    if (rep) rep.hidden = !d.isRepresentative;
    text('viewMemberGroupName', d.userGroup.code + ' – ' + d.userGroup.name);
    text('viewMemberTitle', d.jobTitle || 'Chưa cập nhật');
    text('viewMemberPhone', d.phoneNumber || 'Chưa cập nhật');
    text('viewMemberEmail', d.email);
    text('viewMemberLastLogin', d.lastLoginAt ? gaFormatDate(d.lastLoginAt, true) : 'Chưa đăng nhập');
    text('viewMemberCreatedAt', gaFormatDate(d.createdAt));
    text('viewMemberUpdatedAt', gaFormatDate(d.updatedAt, true));

    const alerts = [];
    if (d.mustChangePassword) alerts.push('Chưa đổi mật khẩu tạm (lần đăng nhập kế tiếp bị buộc đổi)');
    if (d.lockedUntil) alerts.push('Đang khóa tạm do sai mật khẩu đến ' + gaFormatTime(d.lockedUntil));
    const sec = document.getElementById('viewMemberSecurity');
    if (sec) {
        sec.innerHTML = alerts.map(t => '<li>' + gaEsc(t) + '</li>').join('');
        sec.hidden = !alerts.length;
    }

    const recItem = document.getElementById('viewMemberRecordingAccessItem');
    const recBadge = document.getElementById('viewMemberRecordingBadge');
    const groupAllows = getCurrentGroup().allowRecordingAccess; // Tầng 1, store authUser.user.userGroup
    if (recItem) recItem.hidden = !groupAllows;
    if (groupAllows && recBadge) {
        const hasAccess = d.roleCode === 'GROUP_ADMIN' || d.roleCode === 'USER_RECORDING';
        recBadge.innerHTML = hasAccess
            ? `<span class="badge-recording" style="font-size: 0.8125rem; padding: 4px 10px;">
                <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 18v-6a9 9 0 0 1 18 0v6"></path><path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z"></path></svg>
                Được cấp quyền (${d.roleCode === 'GROUP_ADMIN' ? 'theo vai trò Quản trị viên nhóm' : 'vai trò Thành viên nghe ghi âm'})
               </span>`
            : '<span style="font-size: 0.8125rem; color: var(--text-muted);">Chưa được cấp quyền</span>';
    }
}

// Toast Notification
function showToast(message, type = 'info') {
    const existing = document.querySelector('.admin-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = `admin-toast ${type}`;
    toast.innerHTML = `
        <span style="font-weight: 500;">${message}</span>
    `;
    document.body.appendChild(toast);

    setTimeout(() => {
        toast.remove();
    }, 3500);
}
