/**
 * DATA PERMISSIONS MATRIX - EVN CDR AS
 * Ma trận Phân quyền theo Màn hình & Chức năng (Page-to-Feature Access Matrix)
 * Hỗ trợ song song: Dạng Thẻ (Card View - Mặc định) & Dạng Bảng (Table View)
 * Cấu trúc: [Mỗi Trang / Màn hình] -> [Mỗi Chức năng] -> [Từng Đối tượng có quyền gì]
 */

// Bộ dữ liệu ma trận phân quyền phân cấp theo: Màn hình -> Chức năng -> 5 Đối tượng người dùng
const PAGE_PERMISSIONS_DATA = [
    // =========================================================================
    // PHÂN HỆ 1: NHẬT KÝ CUỘC GỌI & KỸ THUẬT (CALLS & TELECOM TECH)
    // =========================================================================
    {
        pageId: "cdr-history",
        pageFile: "cdr-history.html",
        pageName: "Tra cứu CDR & Ghi âm",
        pageModule: "CALLS_TECH",
        moduleName: "Nhật ký cuộc gọi & Kỹ thuật",
        pageIcon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>`,
        description: "Giám sát, tra cứu danh sách cuộc gọi, nghe/tải file ghi âm và xuất dữ liệu CDR",
        features: [
            {
                id: "cdr_view_list",
                name: "Xem danh sách nhật ký cuộc gọi",
                desc: "Tra cứu danh sách cuộc gọi đã làm giàu thông tin nhóm (caller/called) theo thời gian",
                permCode: "cdr:view",
                securityLevel: "standard",
                roles: {
                    ROOT_ADMIN: { status: "full", text: "Toàn bộ", desc: "Xem 100% cuộc gọi toàn hệ thống (kể cả bản ghi NULL nhóm)" },
                    SYSTEM_ADMIN: { status: "full", text: "Toàn bộ", desc: "Xem 100% cuộc gọi kèm bộ lọc theo đơn vị và nhóm" },
                    GROUP_ADMIN: { status: "group", text: "Nội bộ nhóm", desc: "Chỉ xem cuộc gọi mà caller_group_id hoặc called_group_id thuộc nhóm mình" },
                    USER_RECORDING: { status: "group", text: "Nội bộ nhóm", desc: "Chỉ xem cuộc gọi liên quan đến nhóm của mình" },
                    REGULAR_USER: { status: "group", text: "Nội bộ nhóm", desc: "Chỉ xem cuộc gọi liên quan đến nhóm của mình" }
                },
                ruleNote: "Bảo đảm quy tắc Cô lập Dữ liệu theo Nhóm (Group-Based Data Isolation)",
                techGuard: "@RequirePermissions('cdr:view') + GroupDataFilter"
            },
            {
                id: "cdr_view_detail",
                name: "Xem chi tiết 85 trường thông số cuộc gọi",
                desc: "Xem đầy đủ thông tin SIP headers, codec âm thanh, thời lượng đàm thoại, mã ngắt kết nối",
                permCode: "cdr:view",
                securityLevel: "standard",
                roles: {
                    ROOT_ADMIN: { status: "full", text: "Toàn bộ", desc: "Xem 100% thông số kỹ thuật cuộc gọi toàn hệ thống" },
                    SYSTEM_ADMIN: { status: "full", text: "Toàn bộ", desc: "Xem chi tiết mọi cuộc gọi toàn hệ thống" },
                    GROUP_ADMIN: { status: "group", text: "Nội bộ nhóm", desc: "Xem chi tiết các cuộc gọi thuộc nhóm mình" },
                    USER_RECORDING: { status: "group", text: "Nội bộ nhóm", desc: "Xem chi tiết các cuộc gọi thuộc nhóm mình" },
                    REGULAR_USER: { status: "group", text: "Nội bộ nhóm", desc: "Xem chi tiết các cuộc gọi thuộc nhóm mình" }
                },
                ruleNote: "Hiển thị đầy đủ 85 trường trong Modal chi tiết cuộc gọi",
                techGuard: "@RequirePermissions('cdr:view') + ModalDetailGuard"
            },
            {
                id: "cdr_filter_advanced",
                name: "Bộ lọc nâng cao (IP, Disconnection Code)",
                desc: "Tìm kiếm chuyên sâu theo địa chỉ IP tổng đài, mã lý do ngắt cuộc gọi (SIP 486, 487, 503)",
                permCode: "cdr:filter_advanced",
                securityLevel: "standard",
                roles: {
                    ROOT_ADMIN: { status: "full", text: "Toàn bộ", desc: "Lọc theo mọi dải IP và tổng đài PABX thành viên" },
                    SYSTEM_ADMIN: { status: "full", text: "Toàn bộ", desc: "Lọc nâng cao toàn hệ thống" },
                    GROUP_ADMIN: { status: "group", text: "Nội bộ nhóm", desc: "Lọc nâng cao trong phạm vi nhóm của mình" },
                    USER_RECORDING: { status: "group", text: "Nội bộ nhóm", desc: "Lọc nâng cao trong phạm vi nhóm của mình tương tự Group Admin" },
                    REGULAR_USER: { status: "group", text: "Nội bộ nhóm", desc: "Lọc nâng cao trong phạm vi nhóm của mình tương tự Group Admin" }
                },
                ruleNote: "Bảo vệ tài nguyên xử lý dữ liệu của Database MariaDB",
                techGuard: "@RequirePermissions('cdr:filter_advanced')"
            },
            {
                id: "cdr_audio_stream",
                name: "Nghe trực tuyến file ghi âm cuộc gọi",
                desc: "Phát trực tiếp bản ghi âm thoại MP3/WAV qua trình phát âm thanh tích hợp",
                permCode: "cdr:listen_audio",
                securityLevel: "critical",
                roles: {
                    ROOT_ADMIN: { status: "full", text: "Toàn bộ", desc: "Nghe ghi âm 100% cuộc gọi toàn hệ thống" },
                    SYSTEM_ADMIN: { status: "full", text: "Toàn bộ", desc: "Nghe ghi âm cuộc gọi của mọi đơn vị thành viên" },
                    GROUP_ADMIN: { status: "conditional", text: "Tầng 1 cấp", desc: "Nghe cuộc gọi nhóm mình NẾU nhóm có allow_recording_access = 1" },
                    USER_RECORDING: { status: "conditional", text: "Tầng 1 + 2", desc: "Nghe cuộc gọi nhóm mình KHI có cả allow_recording_access VÀ can_access_recording = 1" },
                    REGULAR_USER: { status: "denied", text: "Khóa", desc: "Thành viên cơ bản bị chặn 403 Forbidden nghe ghi âm" }
                },
                ruleNote: "Áp dụng cơ chế Chốt chặn Phân quyền Ghi âm 2 Tầng (2-Tier Gate) + Group Data Scope",
                techGuard: "@RequirePermissions('cdr:listen_audio') + TwoTierAudioGuard"
            },
            {
                id: "cdr_audio_download",
                name: "Tải file ghi âm cuộc gọi về máy",
                desc: "Tải bản ghi âm cuộc gọi dạng file âm thanh nén .mp3 / .wav",
                permCode: "cdr:download_audio",
                securityLevel: "critical",
                roles: {
                    ROOT_ADMIN: { status: "full", text: "Toàn bộ", desc: "Tải bản ghi âm bất kỳ cuộc gọi nào trên hệ thống" },
                    SYSTEM_ADMIN: { status: "full", text: "Toàn bộ", desc: "Tải bản ghi âm các đơn vị phục vụ kiểm tra" },
                    GROUP_ADMIN: { status: "conditional", text: "Tầng 1 cấp", desc: "Tải ghi âm nhóm mình khi nhóm được System Admin bật allow_recording_access" },
                    USER_RECORDING: { status: "conditional", text: "Tầng 1 + 2", desc: "Tải ghi âm nhóm mình khi được Group Admin cấp quyền can_access_recording" },
                    REGULAR_USER: { status: "denied", text: "Khóa", desc: "Bị ẩn nút tải và chặn API tải file" }
                },
                ruleNote: "Kiểm tra quyền kép (Two-Tier Gate) và ghi vết tải file vào audit_logs",
                techGuard: "@RequirePermissions('cdr:download_audio') + AuditLogging"
            },
            {
                id: "cdr_export_excel",
                name: "Xuất dữ liệu cuộc gọi (Excel / CSV)",
                desc: "Kết xuất danh sách CDR theo kết quả tìm kiếm ra tệp bảng tính",
                permCode: "cdr:export",
                securityLevel: "standard",
                roles: {
                    ROOT_ADMIN: { status: "full", text: "Toàn bộ", desc: "Xuất danh sách toàn bộ hoặc lọc theo bất kỳ đơn vị nào" },
                    SYSTEM_ADMIN: { status: "full", text: "Toàn bộ", desc: "Xuất danh sách CDR toàn hệ thống" },
                    GROUP_ADMIN: { status: "group", text: "Nội bộ nhóm", desc: "Chỉ được xuất danh sách cuộc gọi thuộc nhóm mình" },
                    USER_RECORDING: { status: "group", text: "Nội bộ nhóm", desc: "Chỉ được xuất danh sách cuộc gọi thuộc nhóm mình" },
                    REGULAR_USER: { status: "group", text: "Nội bộ nhóm", desc: "Chỉ được xuất danh sách cuộc gọi thuộc nhóm mình" }
                },
                ruleNote: "Dữ liệu xuất ra tuân thủ Group-Based Data Isolation",
                techGuard: "@RequirePermissions('cdr:export') + CdrExportInterceptor"
            }
        ]
    },
    {
        pageId: "qos-debug",
        pageFile: "qos-debug.html",
        pageName: "Phân tích QoS & Gỡ lỗi SIP",
        pageModule: "CALLS_TECH",
        moduleName: "Nhật ký cuộc gọi & Kỹ thuật",
        pageIcon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg>`,
        description: "Đánh giá chất lượng thoại (MOS, Jitter, Packet Loss, Delay), sơ đồ luồng SIP Ladder",
        features: [
            {
                id: "qos_view_metrics",
                name: "Xem chỉ số chất lượng cuộc gọi (MOS, Jitter, Loss)",
                desc: "Theo dõi thang điểm MOS, biểu đồ dao động trễ và tỷ lệ mất gói tin",
                permCode: "qos:view",
                securityLevel: "standard",
                roles: {
                    ROOT_ADMIN: { status: "full", text: "Toàn bộ", desc: "Xem toàn bộ biểu đồ và chỉ số QoS toàn mạng EVN" },
                    SYSTEM_ADMIN: { status: "full", text: "Toàn bộ", desc: "Xem chỉ số chất lượng dịch vụ toàn mạng" },
                    GROUP_ADMIN: { status: "group", text: "Nội bộ nhóm", desc: "Xem điểm chất lượng cuộc gọi các số máy thuộc nhóm mình" },
                    USER_RECORDING: { status: "group", text: "Nội bộ nhóm", desc: "Xem điểm chất lượng cuộc gọi các số máy thuộc nhóm mình" },
                    REGULAR_USER: { status: "group", text: "Nội bộ nhóm", desc: "Xem điểm chất lượng cuộc gọi các số máy thuộc nhóm mình" }
                },
                ruleNote: "Bảo đảm thông số thoại của các đơn vị khác không bị lộ",
                techGuard: "@RequirePermissions('qos:view')"
            },
            {
                id: "qos_sip_ladder",
                name: "Xem sơ đồ luồng SIP (Call Flow Ladder)",
                desc: "Trực quan hóa chuỗi bản tin SIP INVITE, 100 TRYING, 180 RINGING, 200 OK, BYE",
                permCode: "qos:sip_trace",
                securityLevel: "sensitive",
                roles: {
                    ROOT_ADMIN: { status: "full", text: "Toàn bộ", desc: "Xem luồng SIP mọi cuộc gọi" },
                    SYSTEM_ADMIN: { status: "full", text: "Toàn bộ", desc: "Xem luồng SIP mọi cuộc gọi" },
                    GROUP_ADMIN: { status: "denied", text: "Khóa", desc: "Không áp dụng cho người dùng đơn vị" },
                    USER_RECORDING: { status: "denied", text: "Khóa", desc: "Không áp dụng" },
                    REGULAR_USER: { status: "denied", text: "Khóa", desc: "Không áp dụng" }
                },
                ruleNote: "Dữ liệu báo hiệu mạng viễn thông PABX chuyên sâu",
                techGuard: "@RequirePermissions('qos:sip_trace')"
            },
        ]
    },
    {
        pageId: "reports",
        pageFile: "reports.html",
        pageName: "Báo cáo Thống kê",
        pageModule: "CALLS_TECH",
        moduleName: "Nhật ký cuộc gọi & Kỹ thuật",
        pageIcon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg>`,
        description: "Thống kê lưu lượng thoại theo giờ/ngày/tháng, tỷ lệ thành công và thời lượng cuộc gọi",
        features: [
            {
                id: "report_view_summary",
                name: "Xem biểu đồ & số liệu báo cáo lưu lượng",
                desc: "Thống kê số lượng cuộc gọi thành công, bận, lỗi theo chu kỳ thời gian",
                permCode: "report:view",
                securityLevel: "standard",
                roles: {
                    ROOT_ADMIN: { status: "full", text: "Toàn bộ", desc: "Xem báo cáo tổng hợp toàn EVN và từng đơn vị" },
                    SYSTEM_ADMIN: { status: "full", text: "Toàn bộ", desc: "Xem báo cáo tổng thể toàn hệ thống" },
                    GROUP_ADMIN: { status: "group", text: "Nội bộ nhóm", desc: "Chỉ xem báo cáo lưu lượng của đơn vị/nhóm mình" },
                    USER_RECORDING: { status: "group", text: "Nội bộ nhóm", desc: "Xem báo cáo thống kê lưu lượng của nhóm mình" },
                    REGULAR_USER: { status: "group", text: "Nội bộ nhóm", desc: "Xem báo cáo thống kê lưu lượng của nhóm mình" }
                },
                ruleNote: "Dữ liệu được tổng hợp động từ view báo cáo hoặc bảng tổng hợp định kỳ",
                techGuard: "@RequirePermissions('report:view')"
            },
            {
                id: "report_export_file",
                name: "Xuất báo cáo thống kê (Excel / PDF)",
                desc: "Kết xuất biểu mẫu báo cáo chính thức phục vụ nghiệm thu và thanh quyết toán",
                permCode: "report:export",
                securityLevel: "standard",
                roles: {
                    ROOT_ADMIN: { status: "full", text: "Toàn bộ", desc: "Xuất báo cáo toàn hệ thống hoặc theo đơn vị" },
                    SYSTEM_ADMIN: { status: "full", text: "Toàn bộ", desc: "Xuất báo cáo toàn bộ các đơn vị" },
                    GROUP_ADMIN: { status: "group", text: "Nội bộ nhóm", desc: "Chỉ được xuất báo cáo thống kê số liệu của nhóm mình" },
                    USER_RECORDING: { status: "group", text: "Nội bộ nhóm", desc: "Xuất báo cáo thống kê số liệu của nhóm mình" },
                    REGULAR_USER: { status: "group", text: "Nội bộ nhóm", desc: "Xuất báo cáo thống kê số liệu của nhóm mình" }
                },
                ruleNote: "Đóng dấu watermark thời gian và người xuất báo cáo",
                techGuard: "@RequirePermissions('report:export')"
            }
        ]
    },

    // =========================================================================
    // PHÂN HỆ 2: TỔ CHỨC & DẢI SỐ PABX (ORGANIZATION & PREFIX)
    // =========================================================================
    {
        pageId: "organization",
        pageFile: "organization.html",
        pageName: "Danh mục Tổ chức EVN",
        pageModule: "ORG_PREFIX",
        moduleName: "Tổ chức & Dải số PABX",
        pageIcon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>`,
        description: "Quản lý cây sơ đồ cơ cấu tổ chức phân cấp từ Tập đoàn tới các Tổng công ty, Điện lực",
        features: [
            {
                id: "org_view_tree",
                name: "Xem cây sơ đồ cơ cấu tổ chức EVN",
                desc: "Tra cứu danh mục cây phân cấp đơn vị, mã tổ chức, địa chỉ và thông tin liên hệ",
                permCode: "org:view",
                securityLevel: "standard",
                roles: {
                    ROOT_ADMIN: { status: "full", text: "Toàn bộ", desc: "Xem toàn bộ cây tổ chức mọi cấp" },
                    SYSTEM_ADMIN: { status: "full", text: "Toàn bộ", desc: "Xem toàn bộ cây tổ chức mọi cấp" },
                    GROUP_ADMIN: { status: "full", text: "Toàn bộ", desc: "Xem cấu trúc cây tổ chức phục vụ điều hướng" },
                    USER_RECORDING: { status: "full", text: "Toàn bộ", desc: "Xem cây tổ chức phục vụ tra cứu danh bạ" },
                    REGULAR_USER: { status: "full", text: "Toàn bộ", desc: "Xem cây tổ chức phục vụ tra cứu danh bạ" }
                },
                ruleNote: "Cây tổ chức là dữ liệu dùng chung (Public Master Data) cho mọi người dùng",
                techGuard: "@RequirePermissions('org:view')"
            },
            {
                id: "org_create_node",
                name: "Thêm mới đơn vị / chi nhánh tổ chức",
                desc: "Tạo nút đơn vị con mới trên cây cơ cấu tổ chức",
                permCode: "org:manage",
                securityLevel: "sensitive",
                roles: {
                    ROOT_ADMIN: { status: "full", text: "Toàn quyền", desc: "Thêm đơn vị ở bất kỳ cấp nào trong cây" },
                    SYSTEM_ADMIN: { status: "full", text: "Toàn quyền", desc: "Thêm đơn vị thành viên mới" },
                    GROUP_ADMIN: { status: "denied", text: "Khóa", desc: "Group Admin không được thêm đơn vị vào cây hệ thống" },
                    USER_RECORDING: { status: "denied", text: "Khóa", desc: "Không áp dụng" },
                    REGULAR_USER: { status: "denied", text: "Khóa", desc: "Không áp dụng" }
                },
                ruleNote: "Tự động sinh mã path cây phân cấp (Tree Hierarchy Path)",
                techGuard: "@RequirePermissions('org:manage')"
            },
            {
                id: "org_edit_node",
                name: "Chỉnh sửa thông tin đơn vị tổ chức",
                desc: "Cập nhật tên đơn vị, địa chỉ, số điện thoại tổng đài chính, ghi chú",
                permCode: "org:manage",
                securityLevel: "sensitive",
                roles: {
                    ROOT_ADMIN: { status: "full", text: "Toàn quyền", desc: "Chỉnh sửa mọi đơn vị" },
                    SYSTEM_ADMIN: { status: "full", text: "Toàn quyền", desc: "Chỉnh sửa thông tin các đơn vị thành viên" },
                    GROUP_ADMIN: { status: "denied", text: "Khóa", desc: "Không áp dụng" },
                    USER_RECORDING: { status: "denied", text: "Khóa", desc: "Không áp dụng" },
                    REGULAR_USER: { status: "denied", text: "Khóa", desc: "Không áp dụng" }
                },
                ruleNote: "Không cho phép đổi mã code tổ chức nếu đã phát sinh dữ liệu CDR",
                techGuard: "@RequirePermissions('org:manage')"
            },
            {
                id: "org_delete_node",
                name: "Xóa đơn vị khỏi cây tổ chức",
                desc: "Xóa nút đơn vị khi sáp nhập hoặc ngừng hoạt động",
                permCode: "org:manage",
                securityLevel: "critical",
                roles: {
                    ROOT_ADMIN: { status: "conditional", text: "Có điều kiện", desc: "Chỉ được xóa khi đơn vị không có đơn vị con, không có dải số và không có CDR" },
                    SYSTEM_ADMIN: { status: "conditional", text: "Có điều kiện", desc: "Chỉ được xóa đơn vị rỗng không có dữ liệu ràng buộc" },
                    GROUP_ADMIN: { status: "denied", text: "Khóa", desc: "Không áp dụng" },
                    USER_RECORDING: { status: "denied", text: "Khóa", desc: "Không áp dụng" },
                    REGULAR_USER: { status: "denied", text: "Khóa", desc: "Không áp dụng" }
                },
                ruleNote: "Bảo toàn toàn vẹn dữ liệu khóa ngoại (Foreign Key Integrity)",
                techGuard: "@RequirePermissions('org:manage') + SafeDeleteCheck"
            }
        ]
    },
    {
        pageId: "prefix-management",
        pageFile: "prefix-management.html",
        pageName: "Quản lý Đầu số PABX",
        pageModule: "ORG_PREFIX",
        moduleName: "Tổ chức & Dải số PABX",
        pageIcon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>`,
        description: "Quản lý kho dải số nội bộ, số PABX trung kế và cấp phát dải số cho các Đơn vị thành viên",
        features: [
            {
                id: "prefix_view_all",
                name: "Xem danh sách dải số toàn mạng",
                desc: "Tra cứu bảng tổng hợp dải số, đơn vị đang sở hữu, trạng thái kích hoạt",
                permCode: "prefix:manage",
                securityLevel: "standard",
                roles: {
                    ROOT_ADMIN: { status: "full", text: "Toàn bộ", desc: "Xem 100% dải số toàn mạng EVN" },
                    SYSTEM_ADMIN: { status: "full", text: "Toàn bộ", desc: "Xem toàn bộ dải số và tình trạng cấp phát" },
                    GROUP_ADMIN: { status: "denied", text: "Khóa", desc: "Group Admin dùng trang org-prefix.html để xem đầu số của mình" },
                    USER_RECORDING: { status: "denied", text: "Khóa", desc: "Không áp dụng" },
                    REGULAR_USER: { status: "denied", text: "Khóa", desc: "Không áp dụng" }
                },
                ruleNote: "Trang dành riêng cho Quản trị viên cấp cao (Admin Scope)",
                techGuard: "@RequirePermissions('prefix:manage')"
            },
            {
                id: "prefix_assign",
                name: "Cấp phát / Điều chuyển dải số cho đơn vị",
                desc: "Gán dải số PABX mới (ví dụ 8424..., dải máy lẻ) cho một đơn vị trong cây tổ chức",
                permCode: "prefix:manage",
                securityLevel: "critical",
                roles: {
                    ROOT_ADMIN: { status: "full", text: "Toàn quyền", desc: "Cấp phát và thay đổi dải số của mọi đơn vị" },
                    SYSTEM_ADMIN: { status: "full", text: "Toàn quyền", desc: "Cấp phát dải số cho các đơn vị thành viên" },
                    GROUP_ADMIN: { status: "denied", text: "Khóa", desc: "Không có quyền quản lý dải số cấp hệ thống" },
                    USER_RECORDING: { status: "denied", text: "Khóa", desc: "Không áp dụng" },
                    REGULAR_USER: { status: "denied", text: "Khóa", desc: "Không áp dụng" }
                },
                ruleNote: "Bắt buộc ghi vết vào bảng prefix_history phục vụ kiểm toán viễn thông",
                techGuard: "@RequirePermissions('prefix:manage') + PrefixAuditHook"
            },
            {
                id: "prefix_revoke",
                name: "Thu hồi / Vô hiệu hóa dải số",
                desc: "Thu hồi dải số về kho chưa gán hoặc chuyển đổi trạng thái ngừng sử dụng",
                permCode: "prefix:manage",
                securityLevel: "critical",
                roles: {
                    ROOT_ADMIN: { status: "full", text: "Toàn quyền", desc: "Thu hồi dải số bất kỳ" },
                    SYSTEM_ADMIN: { status: "full", text: "Toàn quyền", desc: "Thu hồi dải số bất kỳ (tương đương Root Admin)" },
                    GROUP_ADMIN: { status: "denied", text: "Khóa", desc: "Không áp dụng" },
                    USER_RECORDING: { status: "denied", text: "Khóa", desc: "Không áp dụng" },
                    REGULAR_USER: { status: "denied", text: "Khóa", desc: "Không áp dụng" }
                },
                ruleNote: "Cảnh báo ảnh hưởng định tuyến cuộc gọi trước khi thực thi",
                techGuard: "@RequirePermissions('prefix:manage')"
            }
        ]
    },
    {
        pageId: "prefix-history",
        pageFile: "prefix-history.html",
        pageName: "Lịch sử Cấp phát Dải số",
        pageModule: "ORG_PREFIX",
        moduleName: "Tổ chức & Dải số PABX",
        pageIcon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>`,
        description: "Nhật ký kiểm toán lịch sử thay đổi, cấp phát, điều chuyển và thu hồi dải số viễn thông",
        features: [
            {
                id: "prefix_history_view",
                name: "Xem nhật ký kiểm toán cấp phát dải số",
                desc: "Tra cứu thời điểm, người thực hiện, dải số và đơn vị liên quan",
                permCode: "prefix:audit_view",
                securityLevel: "standard",
                roles: {
                    ROOT_ADMIN: { status: "full", text: "Toàn bộ", desc: "Xem 100% lịch sử cấp phát từ khi khởi tạo hệ thống" },
                    SYSTEM_ADMIN: { status: "full", text: "Toàn bộ", desc: "Xem lịch sử thay đổi dải số toàn mạng" },
                    GROUP_ADMIN: { status: "denied", text: "Khóa", desc: "Không truy cập trang kiểm toán dải số cấp mạng" },
                    USER_RECORDING: { status: "denied", text: "Khóa", desc: "Không áp dụng" },
                    REGULAR_USER: { status: "denied", text: "Khóa", desc: "Không áp dụng" }
                },
                ruleNote: "Bản ghi kiểm toán là bất biến (Read-only Immutable Audit Log)",
                techGuard: "@RequirePermissions('prefix:audit_view')"
            }
        ]
    },
    {
        pageId: "org-prefix",
        pageFile: "org-prefix.html",
        pageName: "Đầu số Đơn vị Thành viên",
        pageModule: "ORG_PREFIX",
        moduleName: "Tổ chức & Dải số PABX",
        pageIcon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"></rect><path d="M7 15h0M2 9.5h20"></path></svg>`,
        description: "Trang tra cứu dải số và đầu số nội bộ dành cho người dùng tại các Đơn vị thành viên",
        features: [
            {
                id: "org_prefix_view_self",
                name: "Tra cứu dải số của đơn vị mình",
                desc: "Xem danh sách các đầu số PABX, máy lẻ được cấp cho đơn vị của người dùng",
                permCode: "org_prefix:view",
                securityLevel: "standard",
                roles: {
                    ROOT_ADMIN: { status: "full", text: "Toàn bộ", desc: "Tra cứu dải số của bất kỳ đơn vị nào" },
                    SYSTEM_ADMIN: { status: "full", text: "Toàn bộ", desc: "Tra cứu dải số của bất kỳ đơn vị nào" },
                    GROUP_ADMIN: { status: "group", text: "Nội bộ nhóm", desc: "Xem dải số và danh bạ đầu số của đơn vị mình" },
                    USER_RECORDING: { status: "group", text: "Nội bộ nhóm", desc: "Xem dải số của đơn vị mình phục vụ gọi nội bộ" },
                    REGULAR_USER: { status: "group", text: "Nội bộ nhóm", desc: "Xem dải số của đơn vị mình phục vụ gọi nội bộ" }
                },
                ruleNote: "Người dùng thành viên chỉ thấy dải số thuộc phạm vi đơn vị mình",
                techGuard: "@RequirePermissions('org_prefix:view') + TenantScope"
            }
        ]
    },

    // =========================================================================
    // PHÂN HỆ 3: QUẢN TRỊ NHÓM & NGƯỜI DÙNG (USERS & GROUPS)
    // =========================================================================
    {
        pageId: "user_group",
        pageFile: "user_group.html",
        pageName: "Nhóm Người dùng (User Groups)",
        pageModule: "USER_ROLE",
        moduleName: "Quản trị Nhóm & Người dùng",
        pageIcon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>`,
        description: "Quản lý danh mục nhóm nghiệp vụ toàn hệ thống, cấu hình chốt chặn ghi âm Tầng 1 (allow_recording_access)",
        features: [
            {
                id: "group_view_all",
                name: "Xem danh mục nhóm người dùng",
                desc: "Tra cứu danh sách các nhóm người dùng, đơn vị trực thuộc, số thành viên",
                permCode: "group:view",
                securityLevel: "standard",
                roles: {
                    ROOT_ADMIN: { status: "full", text: "Toàn bộ", desc: "Xem danh sách 100% các nhóm toàn hệ thống" },
                    SYSTEM_ADMIN: { status: "full", text: "Toàn bộ", desc: "Xem danh sách toàn bộ các nhóm" },
                    GROUP_ADMIN: { status: "denied", text: "Khóa", desc: "Group Admin sử dụng trang group-admin.html cho nhóm mình" },
                    USER_RECORDING: { status: "denied", text: "Khóa", desc: "Không áp dụng" },
                    REGULAR_USER: { status: "denied", text: "Khóa", desc: "Không áp dụng" }
                },
                ruleNote: "Trang trung tâm quản trị nhóm của System Admin",
                techGuard: "@RequirePermissions('group:view')"
            },
            {
                id: "group_create",
                name: "Tạo mới nhóm người dùng",
                desc: "Khởi tạo nhóm người dùng mới gán vào một Đơn vị trong cây tổ chức",
                permCode: "group:create",
                securityLevel: "sensitive",
                roles: {
                    ROOT_ADMIN: { status: "full", text: "Toàn quyền", desc: "Tạo nhóm cho bất kỳ đơn vị nào" },
                    SYSTEM_ADMIN: { status: "full", text: "Toàn quyền", desc: "Tạo nhóm cho các đơn vị thành viên" },
                    GROUP_ADMIN: { status: "denied", text: "Khóa", desc: "Group Admin không tự tạo thêm nhóm mới" },
                    USER_RECORDING: { status: "denied", text: "Khóa", desc: "Không áp dụng" },
                    REGULAR_USER: { status: "denied", text: "Khóa", desc: "Không áp dụng" }
                },
                ruleNote: "Bắt buộc gắn với 1 đơn vị tổ chức hợp lệ",
                techGuard: "@RequirePermissions('group:create')"
            },
            {
                id: "group_toggle_tier1_recording",
                name: "Cấp quyền Ghi âm Tầng 1 (user_groups.allow_recording_access)",
                desc: "Bật/Tắt chốt chặn quyền tiếp cận ghi âm cho toàn bộ một Nhóm người dùng",
                permCode: "group:edit",
                securityLevel: "critical",
                roles: {
                    ROOT_ADMIN: { status: "full", text: "Toàn quyền", desc: "Bật/Tắt quyền ghi âm Tầng 1 cho bất kỳ nhóm nào" },
                    SYSTEM_ADMIN: { status: "full", text: "Toàn quyền", desc: "Thẩm quyền độc quyền cấu hình cờ allow_recording_access" },
                    GROUP_ADMIN: { status: "denied", text: "Khóa", desc: "Group Admin KHÔNG THỂ tự cấp Tầng 1 cho nhóm mình" },
                    USER_RECORDING: { status: "denied", text: "Khóa", desc: "Không áp dụng" },
                    REGULAR_USER: { status: "denied", text: "Khóa", desc: "Không áp dụng" }
                },
                ruleNote: "Nếu nhóm có cờ = 0, toàn bộ thành viên và cả Group Admin đều bị chặn tính năng ghi âm",
                techGuard: "@RequirePermissions('group:edit') + Tier1GateControl"
            },
            {
                id: "group_delete",
                name: "Xóa nhóm người dùng",
                desc: "Xóa nhóm người dùng khỏi hệ thống",
                permCode: "group:delete",
                securityLevel: "critical",
                roles: {
                    ROOT_ADMIN: { status: "conditional", text: "Có điều kiện", desc: "Chỉ được xóa nhóm RỖNG (không có tài khoản người dùng gắn kết)" },
                    SYSTEM_ADMIN: { status: "conditional", text: "Có điều kiện", desc: "Chỉ được xóa nhóm RỖNG chưa có thành viên" },
                    GROUP_ADMIN: { status: "denied", text: "Khóa", desc: "Không áp dụng" },
                    USER_RECORDING: { status: "denied", text: "Khóa", desc: "Không áp dụng" },
                    REGULAR_USER: { status: "denied", text: "Khóa", desc: "Không áp dụng" }
                },
                ruleNote: "Bảo đảm toàn vẹn tham chiếu người dùng và nhóm",
                techGuard: "@RequirePermissions('group:delete') + EmptyGroupCheck"
            }
        ]
    },
    {
        pageId: "group-admin",
        pageFile: "group-admin.html",
        pageName: "Quản trị Nhóm (Đơn vị Thành viên)",
        pageModule: "USER_ROLE",
        moduleName: "Quản trị Nhóm & Người dùng",
        pageIcon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>`,
        description: "Giao diện quản trị nội bộ nhóm: thêm/sửa thành viên, phân quyền ghi âm Tầng 2 (can_access_recording)",
        features: [
            {
                id: "ga_view_members",
                name: "Xem danh sách thành viên trong nhóm",
                desc: "Tra cứu danh sách tài khoản, trạng thái hoạt động và quyền hạn của thành viên nhóm",
                permCode: "user:view",
                securityLevel: "standard",
                roles: {
                    ROOT_ADMIN: { status: "full", text: "Toàn bộ", desc: "Xem thành viên mọi nhóm trên hệ thống" },
                    SYSTEM_ADMIN: { status: "full", text: "Toàn bộ", desc: "Xem thành viên mọi nhóm trên hệ thống" },
                    GROUP_ADMIN: { status: "group", text: "Nội bộ nhóm", desc: "Toàn quyền xem 100% thành viên thuộc nhóm của mình" },
                    USER_RECORDING: { status: "denied", text: "Khóa", desc: "Thành viên dùng trang group-members.html" },
                    REGULAR_USER: { status: "denied", text: "Khóa", desc: "Thành viên dùng trang group-members.html" }
                },
                ruleNote: "Group Admin chỉ nhìn thấy thành viên nhóm mình (WHERE user_group_id = :gid)",
                techGuard: "@RequirePermissions('user:view') + TenantIsolation"
            },
            {
                id: "ga_create_user",
                name: "Thêm mới tài khoản thành viên vào nhóm",
                desc: "Tạo tài khoản mới cho nhân viên trong đơn vị (cố định vào nhóm hiện tại)",
                permCode: "user:create",
                securityLevel: "sensitive",
                roles: {
                    ROOT_ADMIN: { status: "full", text: "Toàn quyền", desc: "Tạo tài khoản cho bất kỳ nhóm nào" },
                    SYSTEM_ADMIN: { status: "full", text: "Toàn quyền", desc: "Tạo tài khoản cho bất kỳ nhóm nào" },
                    GROUP_ADMIN: { status: "conditional", text: "Nội bộ nhóm", desc: "CHỈ được tạo thành viên trong nhóm của mình; KHÔNG được chọn nhóm khác" },
                    USER_RECORDING: { status: "denied", text: "Khóa", desc: "Không áp dụng" },
                    REGULAR_USER: { status: "denied", text: "Khóa", desc: "Không áp dụng" }
                },
                ruleNote: "Quy tắc Bất biến Người dùng & Nhóm: Người dùng thuộc cố định 1 nhóm, không chuyển nhóm",
                techGuard: "@RequirePermissions('user:create') + LockGroupOnCreate"
            },
            {
                id: "ga_edit_user",
                name: "Chỉnh sửa thông tin thành viên nhóm",
                desc: "Cập nhật họ tên, email, số điện thoại, chức vụ của thành viên trong nhóm",
                permCode: "user:edit",
                securityLevel: "standard",
                roles: {
                    ROOT_ADMIN: { status: "full", text: "Toàn quyền", desc: "Sửa thông tin mọi tài khoản" },
                    SYSTEM_ADMIN: { status: "full", text: "Toàn quyền", desc: "Sửa thông tin mọi tài khoản (không đổi nhóm)" },
                    GROUP_ADMIN: { status: "conditional", text: "Nội bộ nhóm", desc: "Chỉ sửa thông tin thành viên nhóm mình; KHÔNG được chuyển nhóm" },
                    USER_RECORDING: { status: "denied", text: "Khóa", desc: "Không áp dụng" },
                    REGULAR_USER: { status: "denied", text: "Khóa", desc: "Không áp dụng" }
                },
                ruleNote: "Trường user_group_id bị khóa hoàn toàn (disabled / read-only)",
                techGuard: "@RequirePermissions('user:edit') + ImmutableGroupGuard"
            },
            {
                id: "ga_lock_user",
                name: "Khóa / Mở khóa tài khoản thành viên",
                desc: "Tạm dừng quyền đăng nhập hoặc kích hoạt lại tài khoản thành viên nhóm",
                permCode: "user:delete",
                securityLevel: "critical",
                roles: {
                    ROOT_ADMIN: { status: "full", text: "Toàn quyền", desc: "Khóa/Mở khóa bất kỳ tài khoản nào" },
                    SYSTEM_ADMIN: { status: "full", text: "Toàn quyền", desc: "Khóa/Mở khóa tài khoản thành viên" },
                    GROUP_ADMIN: { status: "conditional", text: "Có điều kiện", desc: "Khóa thành viên nhóm mình; CẤM tự khóa chính mình; BẢO TOÀN tối thiểu 1 Group Admin đang hoạt động" },
                    USER_RECORDING: { status: "denied", text: "Khóa", desc: "Không áp dụng" },
                    REGULAR_USER: { status: "denied", text: "Khóa", desc: "Không áp dụng" }
                },
                ruleNote: "Bảo toàn quy tắc hệ thống: Luôn có tối thiểu 1 Quản trị viên nhóm trong nhóm",
                techGuard: "@RequirePermissions('user:delete') + MinOneAdminRule"
            },
            {
                id: "ga_assign_admin",
                name: "Cấp / Thu hồi quyền Quản trị nhóm cho thành viên",
                desc: "Chỉ định thành viên trong nhóm thành Quản trị viên nhóm (Group Admin) hoặc gỡ quyền về thành viên thường",
                permCode: "group:manage_admin",
                securityLevel: "critical",
                roles: {
                    ROOT_ADMIN: { status: "full", text: "Toàn quyền", desc: "Chỉ định Group Admin cho bất kỳ nhóm nào" },
                    SYSTEM_ADMIN: { status: "full", text: "Toàn quyền", desc: "Chỉ định Group Admin cho bất kỳ nhóm nào" },
                    GROUP_ADMIN: { status: "conditional", text: "Nội bộ nhóm", desc: "Cấp/thu hồi quyền Group Admin cho thành viên nhóm mình; BẢO TOÀN tối thiểu 1 Group Admin đang hoạt động" },
                    USER_RECORDING: { status: "denied", text: "Khóa", desc: "Không áp dụng" },
                    REGULAR_USER: { status: "denied", text: "Khóa", desc: "Không áp dụng" }
                },
                ruleNote: "Bảo đảm quy tắc nghiệp vụ: Mỗi nhóm luôn có ít nhất một Quản trị viên nhóm",
                techGuard: "@RequirePermissions('group:manage_admin') + MinOneAdminRule"
            },
            {
                id: "ga_toggle_tier2_recording",
                name: "Phân quyền Ghi âm Tầng 2 (users.can_access_recording)",
                desc: "Bật/Tắt quyền nghe và tải ghi âm cuộc gọi cho từng thành viên nội bộ nhóm",
                permCode: "group:toggle_recording",
                securityLevel: "critical",
                roles: {
                    ROOT_ADMIN: { status: "full", text: "Toàn quyền", desc: "Ủy quyền ghi âm cho bất kỳ tài khoản nào" },
                    SYSTEM_ADMIN: { status: "full", text: "Toàn quyền", desc: "Ủy quyền ghi âm cho người dùng" },
                    GROUP_ADMIN: { status: "conditional", text: "Tầng 1 mở", desc: "Được quyền bật/tắt can_access_recording cho thành viên KHI VÀ CHỈ KHI nhóm đã được cấp Tầng 1 (allow_recording_access = 1)" },
                    USER_RECORDING: { status: "denied", text: "Khóa", desc: "Không áp dụng" },
                    REGULAR_USER: { status: "denied", text: "Khóa", desc: "Không áp dụng" }
                },
                ruleNote: "Chốt chặn Tầng 2: Nếu Tầng 1 đóng, switch phân quyền bị khóa disabled kèm tooltip giải thích",
                techGuard: "@RequirePermissions('group:toggle_recording') + Tier2GateCheck"
            }
        ]
    },
    {
        pageId: "group-members",
        pageFile: "group-members.html",
        pageName: "Danh bạ Nhóm",
        pageModule: "USER_ROLE",
        moduleName: "Quản trị Nhóm & Người dùng",
        pageIcon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>`,
        description: "Danh bạ liên lạc nội bộ hiển thị số máy lẻ, email và chức vụ của đồng nghiệp trong cùng nhóm",
        features: [
            {
                id: "gm_view_directory",
                name: "Tra cứu danh bạ thành viên trong nhóm",
                desc: "Xem số máy nội bộ, email, họ tên của đồng nghiệp cùng nhóm phục vụ công việc",
                permCode: "group_member:view",
                securityLevel: "standard",
                roles: {
                    ROOT_ADMIN: { status: "full", text: "Toàn bộ", desc: "Tra cứu danh bạ mọi nhóm" },
                    SYSTEM_ADMIN: { status: "full", text: "Toàn bộ", desc: "Tra cứu danh bạ mọi nhóm" },
                    GROUP_ADMIN: { status: "group", text: "Nội bộ nhóm", desc: "Tra cứu danh bạ nội bộ nhóm mình" },
                    USER_RECORDING: { status: "group", text: "Nội bộ nhóm", desc: "Tra cứu danh bạ nội bộ nhóm mình" },
                    REGULAR_USER: { status: "group", text: "Nội bộ nhóm", desc: "Tra cứu danh bạ nội bộ nhóm mình" }
                },
                ruleNote: "Bảo đảm quyền riêng tư, không xem được danh bạ của nhóm đơn vị thành viên khác",
                techGuard: "@RequirePermissions('group_member:view') + TenantIsolation"
            }
        ]
    },
    {
        pageId: "users",
        pageFile: "users.html",
        pageName: "Người dùng Toàn hệ thống",
        pageModule: "USER_ROLE",
        moduleName: "Quản trị Nhóm & Người dùng",
        pageIcon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
        description: "Quản trị tập trung danh mục toàn bộ tài khoản người dùng, phân vai trò và cấp phát nhóm ban đầu",
        features: [
            {
                id: "users_view_global",
                name: "Xem danh sách toàn bộ người dùng hệ thống",
                desc: "Tra cứu toàn bộ tài khoản thuộc mọi đơn vị, lọc theo trạng thái hoạt động",
                permCode: "user:view",
                securityLevel: "standard",
                roles: {
                    ROOT_ADMIN: { status: "full", text: "Toàn bộ", desc: "Xem 100% tài khoản trên toàn hệ thống" },
                    SYSTEM_ADMIN: { status: "full", text: "Toàn bộ", desc: "Xem toàn bộ tài khoản và nhóm tương ứng" },
                    GROUP_ADMIN: { status: "denied", text: "Khóa", desc: "Group Admin bị chuyển hướng sang group-admin.html" },
                    USER_RECORDING: { status: "denied", text: "Khóa", desc: "Không áp dụng" },
                    REGULAR_USER: { status: "denied", text: "Khóa", desc: "Không áp dụng" }
                },
                ruleNote: "Dành riêng cho Quản trị viên cấp cao (Admin Scope Only)",
                techGuard: "@RequirePermissions('user:view') + AdminScopeGuard"
            },
            {
                id: "users_create_global",
                name: "Tạo mới tài khoản toàn cục (gán nhóm ban đầu)",
                desc: "Khởi tạo tài khoản và chỉ định Nhóm người dùng cố định ngay từ bước tạo",
                permCode: "user:create",
                securityLevel: "sensitive",
                roles: {
                    ROOT_ADMIN: { status: "full", text: "Toàn quyền", desc: "Tạo tài khoản cho bất kỳ đơn vị nào" },
                    SYSTEM_ADMIN: { status: "full", text: "Toàn quyền", desc: "Tạo tài khoản và gán vào nhóm được chỉ định" },
                    GROUP_ADMIN: { status: "denied", text: "Khóa", desc: "Group Admin chỉ tạo người dùng tại trang group-admin.html" },
                    USER_RECORDING: { status: "denied", text: "Khóa", desc: "Không áp dụng" },
                    REGULAR_USER: { status: "denied", text: "Khóa", desc: "Không áp dụng" }
                },
                ruleNote: "Người dùng luôn thuộc cố định 1 nhóm ngay từ lúc tạo, cấm tạo tài khoản không có nhóm",
                techGuard: "@RequirePermissions('user:create') + RequireGroupAssignment"
            },
            {
                id: "users_change_group_action",
                name: "Chuyển nhóm cho tài khoản người dùng",
                desc: "Thay đổi giá trị user_group_id của một tài khoản sang nhóm đơn vị khác",
                permCode: "IMMUTABLE_RULE",
                securityLevel: "critical",
                roles: {
                    ROOT_ADMIN: { status: "denied", text: "Cấm tuyệt đối", desc: "Quy tắc nghiệp vụ bất biến: Hệ thống không cho phép chuyển nhóm" },
                    SYSTEM_ADMIN: { status: "denied", text: "Cấm tuyệt đối", desc: "Bị chặn ở cấp Database và Backend Guard (Cấm chuyển nhóm)" },
                    GROUP_ADMIN: { status: "denied", text: "Cấm tuyệt đối", desc: "Không áp dụng" },
                    USER_RECORDING: { status: "denied", text: "Cấm tuyệt đối", desc: "Không áp dụng" },
                    REGULAR_USER: { status: "denied", text: "Cấm tuyệt đối", desc: "Không áp dụng" }
                },
                ruleNote: "BẢO TOÀN TÍNH BẤT BIẾN: Nếu nhân sự chuyển công tác, cần khóa tài khoản cũ và tạo tài khoản mới ở nhóm mới",
                techGuard: "DatabaseTrigger: BEFORE UPDATE ON users SIGNAL SQLSTATE '45000' IF OLD.user_group_id != NEW.user_group_id"
            }
        ]
    },

    // =========================================================================
    // PHÂN HỆ 4: VAI TRÒ & PHÂN QUYỀN HỆ THỐNG (ROLES & PERMISSIONS)
    // =========================================================================
    {
        pageId: "roles",
        pageFile: "roles.html",
        pageName: "Quản lý Vai trò (Roles)",
        pageModule: "SYSTEM_CONFIG",
        moduleName: "Vai trò, Quyền hạn & Cài đặt",
        pageIcon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="8.5" cy="7" r="4"></circle><polyline points="17 11 19 13 23 9"></polyline></svg>`,
        description: "Quản trị danh mục vai trò hệ thống và ma trận tích chọn quyền hạn (RBAC)",
        features: [
            {
                id: "roles_view_matrix",
                name: "Xem ma trận phân quyền vai trò",
                desc: "Tra cứu danh sách các vai trò (Root Admin, System Admin, v.v.) và các quyền hạn được gán",
                permCode: "role:manage",
                securityLevel: "standard",
                roles: {
                    ROOT_ADMIN: { status: "full", text: "Toàn bộ", desc: "Xem ma trận phân quyền toàn bộ các vai trò" },
                    SYSTEM_ADMIN: { status: "full", text: "Toàn bộ", desc: "Xem ma trận phân quyền của hệ thống" },
                    GROUP_ADMIN: { status: "denied", text: "Khóa", desc: "Không áp dụng" },
                    USER_RECORDING: { status: "denied", text: "Khóa", desc: "Không áp dụng" },
                    REGULAR_USER: { status: "denied", text: "Khóa", desc: "Không áp dụng" }
                },
                ruleNote: "Giao diện cấu hình phân quyền tập trung dành cho Quản trị viên hệ thống",
                techGuard: "@RequirePermissions('role:manage')"
            },
            {
                id: "roles_update_assignments",
                name: "Cấu hình gán/bỏ quyền cho vai trò (Role-Permission)",
                desc: "Tích chọn hoặc bỏ tích các quyền trong ma trận phân quyền vai trò",
                permCode: "role:manage",
                securityLevel: "critical",
                roles: {
                    ROOT_ADMIN: { status: "full", text: "Toàn quyền", desc: "Cấu hình gán quyền cho các vai trò khác; Quyền của Root Admin bất biến full" },
                    SYSTEM_ADMIN: { status: "full", text: "Toàn quyền", desc: "Cấu hình gán quyền cho các vai trò khác (Quyền của Root Admin bất biến full)" },
                    GROUP_ADMIN: { status: "denied", text: "Khóa", desc: "Không áp dụng" },
                    USER_RECORDING: { status: "denied", text: "Khóa", desc: "Không áp dụng" },
                    REGULAR_USER: { status: "denied", text: "Khóa", desc: "Không áp dụng" }
                },
                ruleNote: "Khóa cứng vai trò ROOT_ADMIN (isSystem = true), không cho phép thu hồi bất kỳ quyền nào",
                techGuard: "@RequirePermissions('role:manage') + ProtectRootAdminGuard"
            }
        ]
    },
    {
        pageId: "permissions",
        pageFile: "permissions.html",
        pageName: "Danh mục Quyền hạn",
        pageModule: "SYSTEM_CONFIG",
        moduleName: "Vai trò, Quyền hạn & Cài đặt",
        pageIcon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`,
        description: "Tra cứu danh mục mã quyền hạn hạt mịn của hệ thống, chỉnh sửa tên hiển thị và mô tả",
        features: [
            {
                id: "perm_view_catalog",
                name: "Xem danh mục quyền hạn hạt mịn",
                desc: "Tra cứu danh sách các mã quyền (cdr:*, user:*, org:*), phân nhóm và mức độ an toàn",
                permCode: "role:manage",
                securityLevel: "standard",
                roles: {
                    ROOT_ADMIN: { status: "full", text: "Toàn bộ", desc: "Xem đầy đủ danh mục quyền toàn hệ thống" },
                    SYSTEM_ADMIN: { status: "full", text: "Toàn bộ", desc: "Xem danh mục quyền toàn hệ thống" },
                    GROUP_ADMIN: { status: "denied", text: "Khóa", desc: "Không áp dụng" },
                    USER_RECORDING: { status: "denied", text: "Khóa", desc: "Không áp dụng" },
                    REGULAR_USER: { status: "denied", text: "Khóa", desc: "Không áp dụng" }
                },
                ruleNote: "Chỉ System Administrator mới có quyền truy cập trang này",
                techGuard: "@RequirePermissions('role:manage')"
            },
            {
                id: "perm_edit_attributes",
                name: "Chỉnh sửa tên, phân nhóm và mô tả quyền",
                desc: "Cập nhật nhãn hiển thị và chú giải giải thích nghiệp vụ của quyền hạn",
                permCode: "role:manage",
                securityLevel: "sensitive",
                roles: {
                    ROOT_ADMIN: { status: "full", text: "Toàn quyền", desc: "Chỉnh sửa tên và mô tả quyền" },
                    SYSTEM_ADMIN: { status: "full", text: "Toàn quyền", desc: "Chỉnh sửa tên và mô tả quyền (Mã quyền code bị khóa bất biến)" },
                    GROUP_ADMIN: { status: "denied", text: "Khóa", desc: "Không áp dụng" },
                    USER_RECORDING: { status: "denied", text: "Khóa", desc: "Không áp dụng" },
                    REGULAR_USER: { status: "denied", text: "Khóa", desc: "Không áp dụng" }
                },
                ruleNote: "MÃ QUYỀN (code) là bất biến vì được hardcode trong Backend Decorators & Frontend Guards",
                techGuard: "@RequirePermissions('role:manage') + LockPermissionCodeGuard"
            },
            {
                id: "perm_create_delete_code",
                name: "Thêm mới / Xóa mã quyền hệ thống",
                desc: "Thao tác chèn hoặc xóa trực tiếp mã quyền trong permissions catalog",
                permCode: "IMMUTABLE_RULE",
                securityLevel: "critical",
                roles: {
                    ROOT_ADMIN: { status: "denied", text: "Khóa mã nguồn", desc: "Mã quyền do lập trình viên định nghĩa trong source code, không tạo/xóa tự do trên UI" },
                    SYSTEM_ADMIN: { status: "denied", text: "Khóa mã nguồn", desc: "Bị khóa tính năng (Không hỗ trợ tạo/xóa mã quyền trên UI)" },
                    GROUP_ADMIN: { status: "denied", text: "Khóa mã nguồn", desc: "Không áp dụng" },
                    USER_RECORDING: { status: "denied", text: "Khóa mã nguồn", desc: "Không áp dụng" },
                    REGULAR_USER: { status: "denied", text: "Khóa mã nguồn", desc: "Không áp dụng" }
                },
                ruleNote: "Bảo vệ tính toàn vẹn hệ thống: Mã quyền chỉ được cập nhật qua Database Migration",
                techGuard: "SystemDesign: Permissions are seed-data managed via Migrations"
            }
        ]
    },
    {
        pageId: "system-settings",
        pageFile: "system-settings.html",
        pageName: "Cài đặt Hệ thống & Lưu trữ",
        pageModule: "SYSTEM_CONFIG",
        moduleName: "Vai trò, Quyền hạn & Cài đặt",
        pageIcon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>`,
        description: "Cấu hình kết nối PABX, tham số MariaDB, chế độ bảo trì và chính sách lưu trữ CDR",
        features: [
            {
                id: "sys_view_config",
                name: "Xem cấu hình hạ tầng PABX & Database",
                desc: "Tra cứu địa chỉ IP tổng đài, cổng kết nối, dung lượng ổ đĩa lưu trữ ghi âm",
                permCode: "system:manage",
                securityLevel: "standard",
                roles: {
                    ROOT_ADMIN: { status: "full", text: "Toàn bộ", desc: "Xem 100% cấu hình và thông số bí mật" },
                    SYSTEM_ADMIN: { status: "full", text: "Toàn bộ", desc: "Xem cấu hình hoạt động hệ thống" },
                    GROUP_ADMIN: { status: "denied", text: "Khóa", desc: "Không áp dụng" },
                    USER_RECORDING: { status: "denied", text: "Khóa", desc: "Không áp dụng" },
                    REGULAR_USER: { status: "denied", text: "Khóa", desc: "Không áp dụng" }
                },
                ruleNote: "Ẩn các chuỗi nhạy cảm (Password, Secret Key) đối với tài khoản thường",
                techGuard: "@RequirePermissions('system:manage')"
            },
            {
                id: "sys_retention_purge",
                name: "Cấu hình chính sách lưu trữ CDR (Data Retention Policy)",
                desc: "Thiết lập thời gian lưu trữ (1 năm, 3 năm) và lịch tự động dọn dẹp (Purge Cronjob)",
                permCode: "system:manage",
                securityLevel: "critical",
                roles: {
                    ROOT_ADMIN: { status: "full", text: "Toàn quyền", desc: "Thẩm quyền độc quyền thiết lập vòng đời dữ liệu và purge" },
                    SYSTEM_ADMIN: { status: "full", text: "Toàn quyền", desc: "Thiết lập thời gian lưu trữ và lịch tự động dọn dẹp CDR" },
                    GROUP_ADMIN: { status: "denied", text: "Khóa", desc: "Không áp dụng" },
                    USER_RECORDING: { status: "denied", text: "Khóa", desc: "Không áp dụng" },
                    REGULAR_USER: { status: "denied", text: "Khóa", desc: "Không áp dụng" }
                },
                ruleNote: "Tránh nguy cơ mất dữ liệu đối soát pháp lý của ngành Điện lực",
                techGuard: "@RequirePermissions('system:manage') + RootAdminOnlyGuard"
            },            {
                id: "sys_admin_mgmt",
                name: "Quản lý & Tạo mới Quản trị viên hệ thống (Admin Accounts)",
                desc: "Tạo mới, phân vai trò, khóa hoặc xóa tài khoản Quản trị viên hệ thống (admins)",
                permCode: "admin:manage",
                securityLevel: "critical",
                roles: {
                    ROOT_ADMIN: { status: "full", text: "Toàn quyền", desc: "Duy nhất Root Admin (is_root = 1) có quyền tạo, sửa, khóa hoặc xóa tài khoản Quản trị viên" },
                    SYSTEM_ADMIN: { status: "denied", text: "Khóa", desc: "Không có quyền can thiệp vào danh sách tài khoản Quản trị viên (chỉ Root Admin có quyền)" },
                    GROUP_ADMIN: { status: "denied", text: "Khóa", desc: "Không áp dụng" },
                    USER_RECORDING: { status: "denied", text: "Khóa", desc: "Không áp dụng" },
                    REGULAR_USER: { status: "denied", text: "Khóa", desc: "Không áp dụng" }
                },
                ruleNote: "Nguyên tắc bảo vệ tối cao phân cấp Quản trị viên EVN (Chỉ Root Admin được tạo Quản trị viên)",
                techGuard: "@RequirePermissions('admin:manage') + RootAdminOnlyGuard"
            },

            {
                id: "sys_maintenance_toggle",
                name: "Kích hoạt chế độ bảo trì hệ thống (Maintenance Mode)",
                desc: "Tạm dừng cho người dùng đơn vị đăng nhập để nâng cấp phần mềm",
                permCode: "system:manage",
                securityLevel: "critical",
                roles: {
                    ROOT_ADMIN: { status: "full", text: "Toàn quyền", desc: "Bật/Tắt chế độ bảo trì bất kỳ lúc nào" },
                    SYSTEM_ADMIN: { status: "full", text: "Toàn quyền", desc: "Bật/Tắt chế độ bảo trì hệ thống PABX bất kỳ lúc nào" },
                    GROUP_ADMIN: { status: "denied", text: "Khóa", desc: "Không áp dụng" },
                    USER_RECORDING: { status: "denied", text: "Khóa", desc: "Không áp dụng" },
                    REGULAR_USER: { status: "denied", text: "Khóa", desc: "Không áp dụng" }
                },
                ruleNote: "Khi bật bảo trì, chỉ tài khoản Root Admin và System Admin mới có thể đăng nhập",
                techGuard: "@RequirePermissions('system:manage') + MaintenanceGuard"
            }
        ]
    },

    // =========================================================================
    // PHÂN HỆ 5: BẢNG ĐIỀU KHIỂN & TÀI KHOẢN (DASHBOARD & ACCOUNT)
    // =========================================================================
    {
        pageId: "dashboard",
        pageFile: "dashboard.html",
        pageName: "Bảng Điều khiển Tổng quan",
        pageModule: "DASHBOARD_ACCOUNT",
        moduleName: "Tổng quan & Tài khoản Cá nhân",
        pageIcon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>`,
        description: "Trang chủ hiển thị các chỉ số KPI, biểu đồ cuộc gọi theo giờ và trạng thái tổng đài",
        features: [
            {
                id: "dash_view_kpi",
                name: "Xem chỉ số KPI & Biểu đồ lưu lượng cuộc gọi",
                desc: "Thống kê tổng cuộc gọi trong ngày, tỷ lệ cuộc gọi thành công, thời lượng trung bình",
                permCode: "dashboard:view",
                securityLevel: "standard",
                roles: {
                    ROOT_ADMIN: { status: "full", text: "Toàn bộ", desc: "Xem số liệu KPI tổng thể của 100% các đơn vị EVN" },
                    SYSTEM_ADMIN: { status: "full", text: "Toàn bộ", desc: "Xem số liệu KPI toàn hệ thống kèm bộ lọc đơn vị" },
                    GROUP_ADMIN: { status: "group", text: "Nội bộ nhóm", desc: "Chỉ hiển thị chỉ số KPI và biểu đồ cuộc gọi của nhóm mình" },
                    USER_RECORDING: { status: "group", text: "Nội bộ nhóm", desc: "Chỉ hiển thị chỉ số KPI cuộc gọi của nhóm mình" },
                    REGULAR_USER: { status: "group", text: "Nội bộ nhóm", desc: "Chỉ hiển thị chỉ số KPI cuộc gọi của nhóm mình" }
                },
                ruleNote: "Áp dụng tự động Group-Based Data Isolation cho toàn bộ truy vấn KPI",
                techGuard: "@RequirePermissions('dashboard:view') + TenantDataFilter"
            }
        ]
    },
    {
        pageId: "notifications",
        pageFile: "notifications.html",
        pageName: "Trung tâm Thông báo",
        pageModule: "DASHBOARD_ACCOUNT",
        moduleName: "Tổng quan & Tài khoản Cá nhân",
        pageIcon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>`,
        description: "Xem và quản lý các thông báo biến động hệ thống, sự cố PABX hoặc cảnh báo an ninh",
        features: [
            {
                id: "notif_view",
                name: "Xem thông báo hệ thống được gửi đến tài khoản",
                desc: "Tra cứu thông báo sự kiện, cập nhật chính sách hoặc thông báo từ quản trị viên",
                permCode: "notification:view",
                securityLevel: "standard",
                roles: {
                    ROOT_ADMIN: { status: "full", text: "Toàn bộ", desc: "Nhận toàn bộ cảnh báo hệ thống, bảo mật và sự cố mạng" },
                    SYSTEM_ADMIN: { status: "full", text: "Toàn bộ", desc: "Nhận thông báo vận hành hệ thống và báo cáo lỗi" },
                    GROUP_ADMIN: { status: "group", text: "Nội bộ nhóm", desc: "Nhận thông báo liên quan đến đơn vị và thành viên nhóm" },
                    USER_RECORDING: { status: "group", text: "Cá nhân", desc: "Nhận thông báo cá nhân và thông báo chung của nhóm" },
                    REGULAR_USER: { status: "group", text: "Cá nhân", desc: "Nhận thông báo cá nhân và thông báo chung của nhóm" }
                },
                ruleNote: "Bắn thông báo theo target: Role, User Group hoặc User Id cụ thể",
                techGuard: "NotificationService.getForUser()"
            }
        ]
    },
    {
        pageId: "account-settings",
        pageFile: "profile.html / change-password.html",
        pageName: "Tài khoản Cá nhân & Bảo mật",
        pageModule: "DASHBOARD_ACCOUNT",
        moduleName: "Tổng quan & Tài khoản Cá nhân",
        pageIcon: `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`,
        description: "Cập nhật hồ sơ cá nhân, đổi mật khẩu và tùy biến giao diện Sáng/Tối cá nhân",
        features: [
            {
                id: "acc_view_edit_self",
                name: "Xem và cập nhật hồ sơ cá nhân của mình",
                desc: "Chỉnh sửa họ tên, số điện thoại liên lạc cá nhân, ảnh đại diện",
                permCode: "profile:edit_self",
                securityLevel: "standard",
                roles: {
                    ROOT_ADMIN: { status: "self", text: "Chỉ bản thân", desc: "Chỉ sửa hồ sơ của chính tài khoản mình" },
                    SYSTEM_ADMIN: { status: "self", text: "Chỉ bản thân", desc: "Chỉ sửa hồ sơ của chính tài khoản mình" },
                    GROUP_ADMIN: { status: "self", text: "Chỉ bản thân", desc: "Chỉ sửa hồ sơ của chính tài khoản mình" },
                    USER_RECORDING: { status: "self", text: "Chỉ bản thân", desc: "Chỉ sửa hồ sơ của chính tài khoản mình" },
                    REGULAR_USER: { status: "self", text: "Chỉ bản thân", desc: "Chỉ sửa hồ sơ của chính tài khoản mình" }
                },
                ruleNote: "Mỗi tài khoản chỉ được phép sửa thông tin của chính mình",
                techGuard: "@CurrentUser() user.id === targetId"
            },
            {
                id: "acc_change_password",
                name: "Đổi mật khẩu tài khoản cá nhân",
                desc: "Thực hiện đổi mật khẩu định kỳ với thước đo độ mạnh an toàn thông tin",
                permCode: "auth:change_password",
                securityLevel: "standard",
                roles: {
                    ROOT_ADMIN: { status: "self", text: "Chỉ bản thân", desc: "Đổi mật khẩu tài khoản Root Admin" },
                    SYSTEM_ADMIN: { status: "self", text: "Chỉ bản thân", desc: "Đổi mật khẩu tài khoản System Admin" },
                    GROUP_ADMIN: { status: "self", text: "Chỉ bản thân", desc: "Đổi mật khẩu tài khoản Group Admin" },
                    USER_RECORDING: { status: "self", text: "Chỉ bản thân", desc: "Đổi mật khẩu tài khoản của mình" },
                    REGULAR_USER: { status: "self", text: "Chỉ bản thân", desc: "Đổi mật khẩu tài khoản của mình" }
                },
                ruleNote: "Bắt buộc xác thực mật khẩu cũ và đáp ứng tiêu chuẩn mật khẩu mạnh EVN",
                techGuard: "AuthService.changePassword()"
            }
        ]
    }
];

// Danh mục định nghĩa 5 Đối tượng người dùng trong hệ thống
const ACTOR_DEFINITIONS = {
    ROOT_ADMIN: {
        code: "ROOT_ADMIN",
        name: "Root Admin",
        shortName: "Root Admin",
        title: "Quản trị viên Tối cao",
        icon: "👑",
        scope: "admin",
        badgeClass: "badge-root",
        desc: "Toàn quyền tối cao trên toàn hệ thống. Duy nhất Root Admin có đặc quyền tạo mới, chỉnh sửa, khóa hoặc xóa tài khoản Quản trị viên hệ thống khác (is_root = 1)"
    },
    SYSTEM_ADMIN: {
        code: "SYSTEM_ADMIN",
        name: "System Admin",
        shortName: "System Admin",
        title: "Quản trị viên Hệ thống",
        icon: "🛡️",
        scope: "admin",
        badgeClass: "badge-sysadmin",
        desc: "Toàn bộ quyền hạn kỹ thuật, dữ liệu CDR, nghe/tải ghi âm, QoS, cấp phép ghi âm Tầng 1, dải số và cài đặt hệ thống tương đương Root Admin. Điểm khác biệt duy nhất: Không có quyền tạo/quản lý tài khoản Quản trị viên khác"
    },
    GROUP_ADMIN: {
        code: "GROUP_ADMIN",
        name: "Group Admin",
        shortName: "Group Admin",
        title: "Quản trị viên Nhóm",
        icon: "🏢",
        scope: "user",
        badgeClass: "badge-groupadmin",
        desc: "Quản trị nội bộ nhóm (CRUD thành viên, cấp quyền Group Admin, bật quyền ghi âm Tầng 2); toàn quyền dữ liệu CDR, QoS, báo cáo thống kê trong nhóm"
    },
    USER_RECORDING: {
        code: "USER_RECORDING",
        name: "Thành viên (Ghi âm)",
        shortName: "Member (Audio)",
        title: "Thành viên có quyền Ghi âm",
        icon: "🎧",
        scope: "user",
        badgeClass: "badge-user-rec",
        desc: "Toàn quyền tra cứu dữ liệu CDR, phân tích QoS, báo cáo thống kê trong nhóm; được nghe và tải file ghi âm cuộc gọi khi thỏa mãn cả 2 Tầng quyền"
    },
    REGULAR_USER: {
        code: "REGULAR_USER",
        name: "Thành viên (Cơ bản)",
        shortName: "Member (Basic)",
        title: "Thành viên Thông thường",
        icon: "👤",
        scope: "user",
        badgeClass: "badge-user-basic",
        desc: "Toàn quyền tra cứu dữ liệu CDR, phân tích QoS, báo cáo thống kê trong nhóm (giống hệt Thành viên Ghi âm); Bị chặn hoàn toàn quyền nghe và tải ghi âm"
    }
};

// State quản lý bộ lọc, chế độ hiển thị và tương tác
const MatrixState = {
    viewMode: "card",       // "card" (Mặc định) hoặc "table"
    searchQuery: "",
    selectedModule: "ALL",
    selectedPage: "ALL",
    highlightActor: "ALL",  // "ALL" hoặc mã role: "ROOT_ADMIN", "SYSTEM_ADMIN", ...
    selectedLevel: "ALL",   // "ALL", "full", "group", "conditional", "self", "denied"
    collapsedPages: new Set() // Set lưu trữ ID các trang đang thu gọn
};

// Khởi chạy khi DOM sẵn sàng
document.addEventListener("DOMContentLoaded", () => {
    initMatrixUI();
    renderMatrix();
    setupEventHandlers();
});

/**
 * Khởi tạo giao diện, gắn dữ liệu dropdown bộ lọc và thống kê KPI
 */
function initMatrixUI() {
    // 1. Tính toán KPI
    const totalPages = PAGE_PERMISSIONS_DATA.length;
    let totalFeatures = 0;
    PAGE_PERMISSIONS_DATA.forEach(p => totalFeatures += p.features.length);

    const kpiTotalPagesEl = document.getElementById("kpiTotalPages");
    if (kpiTotalPagesEl) kpiTotalPagesEl.textContent = totalPages;

    const kpiTotalFeaturesEl = document.getElementById("kpiTotalFeatures");
    if (kpiTotalFeaturesEl) kpiTotalFeaturesEl.textContent = `${totalFeatures} Chức năng`;

    // 2. Điền dữ liệu vào Dropdown chọn Trang cụ thể
    const pageSelect = document.getElementById("matrixPageFilter");
    if (pageSelect) {
        pageSelect.innerHTML = `<option value="ALL">Tất cả màn hình (${totalPages} trang)</option>`;
        PAGE_PERMISSIONS_DATA.forEach(p => {
            const opt = document.createElement("option");
            opt.value = p.pageId;
            opt.textContent = `${p.pageName} (${p.pageFile})`;
            pageSelect.appendChild(opt);
        });
    }

    // 3. Khởi tạo trạng thái View Toggle
    updateViewToggleUI();
}

/**
 * Hàm điều phối render theo chế độ hiển thị hiện tại (Card hoặc Table)
 */
function renderMatrix() {
    const cardContainer = document.getElementById("matrixCardsContainer");
    const tableContainer = document.querySelector(".matrix-card");

    if (MatrixState.viewMode === "card") {
        if (cardContainer) cardContainer.style.display = "flex";
        if (tableContainer) tableContainer.style.display = "none";
        renderMatrixCards();
    } else {
        if (cardContainer) cardContainer.style.display = "none";
        if (tableContainer) tableContainer.style.display = "block";
        renderMatrixTable();
    }
}

/**
 * Lọc dữ liệu theo state hiện tại
 */
function getFilteredPages() {
    const query = MatrixState.searchQuery.toLowerCase().trim();
    const filterMod = MatrixState.selectedModule;
    const filterPage = MatrixState.selectedPage;
    const filterLevel = MatrixState.selectedLevel;
    const activeActor = MatrixState.highlightActor;

    const result = [];

    PAGE_PERMISSIONS_DATA.forEach(page => {
        // Lọc theo Phân hệ
        if (filterMod !== "ALL" && page.pageModule !== filterMod) return;

        // Lọc theo Trang
        if (filterPage !== "ALL" && page.pageId !== filterPage) return;

        // Lọc các chức năng trong trang theo tìm kiếm và mức độ quyền
        const matchedFeatures = page.features.filter(feat => {
            const matchSearch = !query || 
                feat.name.toLowerCase().includes(query) ||
                feat.desc.toLowerCase().includes(query) ||
                feat.permCode.toLowerCase().includes(query) ||
                feat.ruleNote.toLowerCase().includes(query) ||
                page.pageName.toLowerCase().includes(query) ||
                page.pageFile.toLowerCase().includes(query);

            if (!matchSearch) return false;

            if (filterLevel !== "ALL") {
                if (activeActor !== "ALL") {
                    return feat.roles[activeActor]?.status === filterLevel;
                } else {
                    return Object.values(feat.roles).some(r => r.status === filterLevel);
                }
            }

            return true;
        });

        if (matchedFeatures.length > 0) {
            result.push({
                ...page,
                features: matchedFeatures
            });
        }
    });

    return result;
}

/**
 * Render Giao diện Dạng Thẻ (Card View - Mới)
 */
function renderMatrixCards() {
    const container = document.getElementById("matrixCardsContainer");
    if (!container) return;

    container.innerHTML = "";
    const filteredPages = getFilteredPages();

    if (filteredPages.length === 0) {
        container.innerHTML = `
            <div class="matrix-empty-card">
                <div class="empty-state-box">
                    <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5">
                        <circle cx="11" cy="11" r="8"></circle>
                        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    </svg>
                    <h4>Không tìm thấy chức năng phù hợp</h4>
                    <p>Thử tìm kiếm với từ khóa khác hoặc thay đổi bộ lọc phân hệ / mức độ quyền.</p>
                    <button class="matrix-btn matrix-btn-outline" onclick="resetAllFilters()">Khôi phục bộ lọc ban đầu</button>
                </div>
            </div>
        `;
        return;
    }

    const rolesOrder = ["ROOT_ADMIN", "SYSTEM_ADMIN", "GROUP_ADMIN", "USER_RECORDING", "REGULAR_USER"];
    const activeActor = MatrixState.highlightActor;

    filteredPages.forEach(page => {
        const isCollapsed = MatrixState.collapsedPages.has(page.pageId);

        const pageCard = document.createElement("div");
        pageCard.className = `page-master-card ${isCollapsed ? 'is-collapsed' : ''}`;
        pageCard.id = `page-card-${page.pageId}`;

        // Header thẻ Trang
        pageCard.innerHTML = `
            <div class="page-master-header" data-page="${page.pageId}">
                <div class="page-master-title-group">
                    <button class="page-collapse-btn ${isCollapsed ? 'collapsed' : ''}" 
                            data-page="${page.pageId}" 
                            title="${isCollapsed ? 'Mở rộng các chức năng' : 'Thu gọn trang'}">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </button>
                    <div class="page-icon-badge">${page.pageIcon}</div>
                    <div>
                        <div class="page-master-heading">
                            <h3 class="page-master-name">${page.pageName}</h3>
                            <code class="page-file-badge">${page.pageFile}</code>
                        </div>
                        <div class="page-master-meta">
                            <span class="page-module-tag">${page.moduleName}</span>
                            <span class="page-desc-inline">${page.description}</span>
                        </div>
                    </div>
                </div>
                <div class="page-master-actions">
                    <span class="page-func-count">${page.features.length} chức năng</span>
                </div>
            </div>
        `;

        // Body thẻ Trang chứa lưới các Feature Cards
        if (!isCollapsed) {
            const pageBody = document.createElement("div");
            pageBody.className = "page-master-body";

            const grid = document.createElement("div");
            grid.className = "feature-cards-grid";

            page.features.forEach(feat => {
                const featCard = document.createElement("div");
                featCard.className = "feature-card";

                const secBadge = feat.securityLevel === "critical"
                    ? `<span class="sec-badge critical"><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> Critical Gate</span>`
                    : (feat.securityLevel === "sensitive"
                        ? `<span class="sec-badge sensitive"><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path></svg> Sensitive</span>`
                        : `<span class="sec-badge standard">Standard</span>`);

                // 6 ô vai trò trong thẻ
                let rolesGridHtml = "";
                rolesOrder.forEach(rKey => {
                    const actor = ACTOR_DEFINITIONS[rKey];
                    const perm = feat.roles[rKey] || { status: "na", text: "—", desc: "Không áp dụng" };
                    const isHighlighted = (activeActor === rKey);
                    const isFaded = (activeActor !== "ALL" && !isHighlighted);

                    rolesGridHtml += `
                        <div class="feature-role-item ${isHighlighted ? 'is-highlighted' : ''} ${isFaded ? 'is-faded' : ''}"
                             onclick="openDetailModal('${page.pageId}', '${feat.id}', '${rKey}')"
                             title="Bấm để xem chi tiết căn cứ của ${actor.name}">
                            <div class="role-item-label">
                                <span class="role-mini-icon">${actor.icon}</span>
                                <span class="role-mini-name">${actor.shortName}</span>
                            </div>
                            <div class="role-item-badge">
                                ${renderAuthBadge(perm.status, perm.text, perm.desc)}
                            </div>
                        </div>
                    `;
                });

                featCard.innerHTML = `
                    <div class="feature-card-header">
                        <div class="feature-card-title-row">
                            <h4 class="feature-card-name">${feat.name}</h4>
                            ${secBadge}
                        </div>
                        <p class="feature-card-desc">${feat.desc}</p>
                        <div class="feature-meta-bar">
                            <code class="perm-code" title="Mã quyền Backend Guard">${feat.permCode}</code>
                        </div>
                    </div>

                    <div class="feature-card-roles-section">
                        <div class="roles-section-header">
                            <span>Phân quyền 5 đối tượng:</span>
                            <span class="click-hint">Bấm vào ô để xem luật</span>
                        </div>
                        <div class="feature-roles-grid">
                            ${rolesGridHtml}
                        </div>
                    </div>

                    <div class="feature-card-footer">
                        <div class="feature-card-rules">
                            <div class="feature-rule-text">${feat.ruleNote}</div>
                            <div class="tech-guard-tag">
                                <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                <span>${feat.techGuard}</span>
                            </div>
                        </div>
                        <button class="feature-detail-btn" onclick="openDetailModal('${page.pageId}', '${feat.id}', 'ALL')" title="Xem chi tiết toàn bộ chính sách">
                            Chi tiết
                            <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="9 18 15 12 9 6"></polyline></svg>
                        </button>
                    </div>
                `;

                grid.appendChild(featCard);
            });

            pageBody.appendChild(grid);
            pageCard.appendChild(pageBody);
        }

        container.appendChild(pageCard);
    });
}

/**
 * Render Giao diện Dạng Bảng (Table View)
 */
function renderMatrixTable() {
    const tbody = document.getElementById("matrixTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";
    const filteredPages = getFilteredPages();

    if (filteredPages.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="7" class="matrix-empty-row">
                    <div class="empty-state-box">
                        <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5">
                            <circle cx="11" cy="11" r="8"></circle>
                            <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                        </svg>
                        <h4>Không tìm thấy chức năng phù hợp</h4>
                        <p>Thử tìm kiếm với từ khóa khác hoặc thay đổi bộ lọc phân hệ / mức độ quyền.</p>
                        <button class="matrix-btn matrix-btn-outline" onclick="resetAllFilters()">Khôi phục bộ lọc ban đầu</button>
                    </div>
                </td>
            </tr>
        `;
        return;
    }

    const rolesList = ["ROOT_ADMIN", "SYSTEM_ADMIN", "GROUP_ADMIN", "USER_RECORDING", "REGULAR_USER"];
    const activeActor = MatrixState.highlightActor;

    filteredPages.forEach(page => {
        const isCollapsed = MatrixState.collapsedPages.has(page.pageId);

        // 1. Tạo hàng tiêu đề Màn hình (Page Group Header Row)
        const trPageHeader = document.createElement("tr");
        trPageHeader.className = "page-group-header";
        trPageHeader.id = `header-${page.pageId}`;
        trPageHeader.innerHTML = `
            <td colspan="7">
                <div class="page-header-row">
                    <button class="page-collapse-btn ${isCollapsed ? 'collapsed' : ''}" 
                            data-page="${page.pageId}" 
                            title="${isCollapsed ? 'Mở rộng các chức năng' : 'Thu gọn trang'}">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.5">
                            <polyline points="6 9 12 15 18 9"></polyline>
                        </svg>
                    </button>
                    <div class="page-icon-badge">${page.pageIcon}</div>
                    <div class="page-title-group">
                        <span class="page-title">${page.pageName}</span>
                        <code class="page-file-badge">${page.pageFile}</code>
                        <span class="page-module-tag">${page.moduleName}</span>
                    </div>
                    <div class="page-header-meta">
                        <span class="page-func-count">${page.features.length} chức năng</span>
                    </div>
                </div>
            </td>
        `;
        tbody.appendChild(trPageHeader);

        // 2. Tạo các hàng chức năng nếu trang không bị thu gọn
        if (!isCollapsed) {
            page.features.forEach((feat, idx) => {
                const tr = document.createElement("tr");
                tr.className = `feature-row page-${page.pageId} ${idx % 2 === 0 ? 'even' : 'odd'}`;

                const securityBadge = feat.securityLevel === "critical"
                    ? `<span class="sec-badge critical"><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> Critical Gate</span>`
                    : (feat.securityLevel === "sensitive"
                        ? `<span class="sec-badge sensitive"><svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path></svg> Sensitive</span>`
                        : `<span class="sec-badge standard">Standard</span>`);

                let tdFeature = `
                    <td class="feature-info-cell">
                        <div class="feature-info-wrapper">
                            <div class="feature-name-row">
                                <span class="feature-name">${feat.name}</span>
                                ${securityBadge}
                            </div>
                            <div class="feature-desc">${feat.desc}</div>
                            <div class="feature-meta-bar">
                                <code class="perm-code" title="Mã quyền kiểm tra API Backend">${feat.permCode}</code>
                            </div>
                        </div>
                    </td>
                `;

                let actorCells = "";
                rolesList.forEach(roleKey => {
                    const rolePerm = feat.roles[roleKey] || { status: "na", text: "—", desc: "Không áp dụng" };
                    const isColHighlighted = (activeActor === roleKey);
                    const isFaded = (activeActor !== "ALL" && !isColHighlighted);

                    const badgeHtml = renderAuthBadge(rolePerm.status, rolePerm.text, rolePerm.desc);

                    actorCells += `
                        <td class="auth-cell role-col-${roleKey} ${isColHighlighted ? 'col-highlight' : ''} ${isFaded ? 'col-faded' : ''}"
                            onclick="openDetailModal('${page.pageId}', '${feat.id}', '${roleKey}')"
                            title="Bấm để xem chi tiết căn cứ kỹ thuật của ${ACTOR_DEFINITIONS[roleKey].name}">
                            ${badgeHtml}
                        </td>
                    `;
                });

                let tdRule = `
                    <td class="rule-cell">
                        <div class="rule-note-box">
                            <div class="rule-note-text">${feat.ruleNote}</div>
                            <div class="tech-guard-tag">
                                <svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                                <span>${feat.techGuard}</span>
                            </div>
                        </div>
                    </td>
                `;

                tr.innerHTML = tdFeature + actorCells + tdRule;
                tbody.appendChild(tr);
            });
        }
    });

    updateTableHeadersHighlight();
}

/**
 * Cập nhật giao diện nút chuyển đổi chế độ xem (Card vs Table)
 */
function updateViewToggleUI() {
    const btnCard = document.getElementById("btnViewCard");
    const btnTable = document.getElementById("btnViewTable");

    if (btnCard) btnCard.classList.toggle("active", MatrixState.viewMode === "card");
    if (btnTable) btnTable.classList.toggle("active", MatrixState.viewMode === "table");
}

/**
 * Tạo thẻ Badge thẩm quyền hiển thị
 */
function renderAuthBadge(status, text, desc) {
    let iconSvg = "";
    if (status === "full") {
        iconSvg = `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="3"><polyline points="20 6 9 17 4 12"></polyline></svg>`;
    } else if (status === "group") {
        iconSvg = `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle></svg>`;
    } else if (status === "conditional") {
        iconSvg = `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>`;
    } else if (status === "self") {
        iconSvg = `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>`;
    } else if (status === "denied") {
        iconSvg = `<svg viewBox="0 0 24 24" width="11" height="11" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"></circle><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line></svg>`;
    }

    return `
        <span class="auth-badge ${status}" title="${desc}">
            ${iconSvg}
            <span>${text}</span>
        </span>
    `;
}

/**
 * Cập nhật trạng thái highlight trên tiêu đề các cột của bảng
 */
function updateTableHeadersHighlight() {
    const roles = ["ROOT_ADMIN", "SYSTEM_ADMIN", "GROUP_ADMIN", "USER_RECORDING", "REGULAR_USER"];
    const activeActor = MatrixState.highlightActor;

    roles.forEach(roleKey => {
        const th = document.getElementById(`th-role-${roleKey}`);
        if (!th) return;

        if (activeActor === "ALL") {
            th.classList.remove("col-header-highlight", "col-header-faded");
        } else if (activeActor === roleKey) {
            th.classList.add("col-header-highlight");
            th.classList.remove("col-header-faded");
        } else {
            th.classList.add("col-header-faded");
            th.classList.remove("col-header-highlight");
        }
    });
}

/**
 * Đăng ký các sự kiện tương tác
 */
function setupEventHandlers() {
    // 1. Chuyển đổi Chế độ Xem (Card vs Table)
    const btnCard = document.getElementById("btnViewCard");
    const btnTable = document.getElementById("btnViewTable");

    if (btnCard) {
        btnCard.addEventListener("click", () => {
            MatrixState.viewMode = "card";
            updateViewToggleUI();
            renderMatrix();
        });
    }

    if (btnTable) {
        btnTable.addEventListener("click", () => {
            MatrixState.viewMode = "table";
            updateViewToggleUI();
            renderMatrix();
        });
    }

    // 2. Ô tìm kiếm với Debounce
    const searchInput = document.getElementById("matrixSearchInput");
    if (searchInput) {
        let debounceTimer;
        searchInput.addEventListener("input", (e) => {
            clearTimeout(debounceTimer);
            debounceTimer = setTimeout(() => {
                MatrixState.searchQuery = e.target.value;
                renderMatrix();
            }, 200);
        });
    }

    // 3. Lọc theo Phân hệ
    const moduleFilter = document.getElementById("matrixModuleFilter");
    if (moduleFilter) {
        moduleFilter.addEventListener("change", (e) => {
            MatrixState.selectedModule = e.target.value;
            renderMatrix();
        });
    }

    // 4. Lọc theo Trang cụ thể
    const pageFilter = document.getElementById("matrixPageFilter");
    if (pageFilter) {
        pageFilter.addEventListener("change", (e) => {
            MatrixState.selectedPage = e.target.value;
            renderMatrix();
        });
    }

    // 5. Lọc theo Mức độ quyền
    const levelFilter = document.getElementById("matrixLevelFilter");
    if (levelFilter) {
        levelFilter.addEventListener("change", (e) => {
            MatrixState.selectedLevel = e.target.value;
            renderMatrix();
        });
    }

    // 6. Thanh Pills chọn Đối tượng người dùng
    const pillsContainer = document.getElementById("actorPillsContainer");
    if (pillsContainer) {
        pillsContainer.addEventListener("click", (e) => {
            const btn = e.target.closest(".actor-pill");
            if (!btn) return;

            document.querySelectorAll(".actor-pill").forEach(p => p.classList.remove("active"));
            btn.classList.add("active");

            MatrixState.highlightActor = btn.getAttribute("data-actor") || "ALL";
            renderMatrix();
        });
    }

    // 7. Nút Mở rộng / Thu gọn toàn bộ các trang
    const expandAllBtn = document.getElementById("btnExpandAll");
    if (expandAllBtn) {
        expandAllBtn.addEventListener("click", () => {
            MatrixState.collapsedPages.clear();
            renderMatrix();
        });
    }

    const collapseAllBtn = document.getElementById("btnCollapseAll");
    if (collapseAllBtn) {
        collapseAllBtn.addEventListener("click", () => {
            PAGE_PERMISSIONS_DATA.forEach(p => MatrixState.collapsedPages.add(p.pageId));
            renderMatrix();
        });
    }

    // 8. Toggle thu gọn từng trang trong Table View
    const tbody = document.getElementById("matrixTableBody");
    if (tbody) {
        tbody.addEventListener("click", (e) => {
            const btn = e.target.closest(".page-collapse-btn");
            if (btn) {
                const pageId = btn.getAttribute("data-page");
                togglePageCollapse(pageId);
                return;
            }

            const headerRow = e.target.closest(".page-header-row");
            if (headerRow && !e.target.closest("button")) {
                const pageId = headerRow.querySelector(".page-collapse-btn")?.getAttribute("data-page");
                if (pageId) togglePageCollapse(pageId);
            }
        });
    }

    // 9. Toggle thu gọn từng trang trong Card View
    const cardsContainer = document.getElementById("matrixCardsContainer");
    if (cardsContainer) {
        cardsContainer.addEventListener("click", (e) => {
            const btn = e.target.closest(".page-collapse-btn");
            if (btn) {
                const pageId = btn.getAttribute("data-page");
                togglePageCollapse(pageId);
                return;
            }

            const header = e.target.closest(".page-master-header");
            if (header && !e.target.closest("button")) {
                const pageId = header.getAttribute("data-page");
                if (pageId) togglePageCollapse(pageId);
            }
        });
    }

    // 10. Đóng Modal
    const modalCloseBtn = document.getElementById("ruleModalClose");
    const modalOverlay = document.getElementById("ruleDetailModal");
    if (modalCloseBtn) modalCloseBtn.addEventListener("click", closeModal);
    if (modalOverlay) {
        modalOverlay.addEventListener("click", (e) => {
            if (e.target === modalOverlay) closeModal();
        });
    }

    document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeModal();
    });

    // 11. Nút In / Xuất
    const printBtn = document.getElementById("matrixPrintBtn");
    if (printBtn) {
        printBtn.addEventListener("click", () => {
            MatrixState.collapsedPages.clear();
            renderMatrix();
            setTimeout(() => window.print(), 300);
        });
    }
}

/**
 * Thu gọn hoặc mở rộng 1 trang
 */
function togglePageCollapse(pageId) {
    if (MatrixState.collapsedPages.has(pageId)) {
        MatrixState.collapsedPages.delete(pageId);
    } else {
        MatrixState.collapsedPages.add(pageId);
    }
    renderMatrix();
}

/**
 * Khôi phục toàn bộ bộ lọc
 */
function resetAllFilters() {
    MatrixState.searchQuery = "";
    MatrixState.selectedModule = "ALL";
    MatrixState.selectedPage = "ALL";
    MatrixState.selectedLevel = "ALL";
    MatrixState.highlightActor = "ALL";
    MatrixState.collapsedPages.clear();

    const searchInput = document.getElementById("matrixSearchInput");
    if (searchInput) searchInput.value = "";

    const modFilter = document.getElementById("matrixModuleFilter");
    if (modFilter) modFilter.value = "ALL";

    const pageFilter = document.getElementById("matrixPageFilter");
    if (pageFilter) pageFilter.value = "ALL";

    const lvlFilter = document.getElementById("matrixLevelFilter");
    if (lvlFilter) lvlFilter.value = "ALL";

    document.querySelectorAll(".actor-pill").forEach(p => {
        p.classList.toggle("active", p.getAttribute("data-actor") === "ALL");
    });

    renderMatrix();
}

/**
 * Mở Modal chi tiết chính sách phân quyền khi click vào một ô hoặc nút Chi tiết
 */
function openDetailModal(pageId, featureId, clickedRoleKey) {
    const page = PAGE_PERMISSIONS_DATA.find(p => p.pageId === pageId);
    if (!page) return;

    const feature = page.features.find(f => f.id === featureId);
    if (!feature) return;

    // Cập nhật thông tin tiêu đề modal
    document.getElementById("modalPageName").textContent = `${page.pageName} (${page.pageFile})`;
    document.getElementById("modalFeatureName").textContent = feature.name;
    document.getElementById("modalPermCode").textContent = feature.permCode;
    document.getElementById("modalFeatureDesc").textContent = feature.desc;

    // Render danh sách thẩm quyền của cả 5 đối tượng
    const rolesContainer = document.getElementById("modalRolesBreakdown");
    if (rolesContainer) {
        rolesContainer.innerHTML = "";

        const rolesList = ["ROOT_ADMIN", "SYSTEM_ADMIN", "GROUP_ADMIN", "USER_RECORDING", "REGULAR_USER"];
        rolesList.forEach(rKey => {
            const actor = ACTOR_DEFINITIONS[rKey];
            const perm = feature.roles[rKey] || { status: "na", text: "—", desc: "Không áp dụng" };
            const isTarget = (clickedRoleKey === rKey);

            const itemDiv = document.createElement("div");
            itemDiv.className = `modal-actor-item ${isTarget ? 'is-target' : ''}`;
            itemDiv.innerHTML = `
                <div class="modal-actor-header">
                    <div class="modal-actor-title">
                        <span class="modal-actor-icon">${actor.icon}</span>
                        <strong>${actor.title}</strong>
                        <code>${actor.code}</code>
                        ${isTarget ? '<span class="target-indicator">Đang xem</span>' : ''}
                    </div>
                    <div>
                        ${renderAuthBadge(perm.status, perm.text, perm.desc)}
                    </div>
                </div>
                <div class="modal-actor-desc">
                    ${perm.desc}
                </div>
            `;
            rolesContainer.appendChild(itemDiv);
        });
    }

    // Căn cứ kỹ thuật & Chốt chặn
    document.getElementById("modalTechNote").innerHTML = `
        <strong>Chốt chặn an toàn:</strong> ${feature.ruleNote}<br>
        <strong>Backend Guard & Decorator:</strong> <code>${feature.techGuard}</code><br>
        <strong>Bảng cơ sở dữ liệu liên quan:</strong> <code>MariaDB</code> • Tra soát kiểm toán: <code>audit_logs</code>
    `;

    // Hiển thị modal
    const modal = document.getElementById("ruleDetailModal");
    if (modal) modal.classList.add("active");
}

function closeModal() {
    const modal = document.getElementById("ruleDetailModal");
    if (modal) modal.classList.remove("active");
}
