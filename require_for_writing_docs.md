# Xây dựng ứng dụng giám sát log cuộc gọi nhằm đánh giá chất lượng, ghi cước và ghi âm cuộc gọi thoại IP mạng PABX EVN

## Tóm tắt công việc phải làm

- Ttổng đài PABX của EVN ghi CDR vào database.
- Xây dựng phần mềm phân tích log, đánh giá chất lượng các cuộc gọi của tổng đài thông qua phân tích log, ghi cước và ghi âm cuộc gọi thoại IP.
- Xây dựng ứng dụng web có chứng thực và phân quyền người dùng để truy cập vào xem log cuộc gọi đã ghi và xem các thông số đã phân tích nhằm đánh giá chất lượng thoại IP cũng như cung cấp bản ghi âm cuộc gọi theo yêu cầu cho các đơn vị đang sử dụng thuê bao IP do tổng đài EVNICT cung cấp.

## Lựa chọn công nghệ

- Backend: NestJS (NodeJS)

- Frontend: VueJS
- Database: MariaDB

## Bảng chính CDR từ PABX có cấu trúc như sau

CREATE TABLE IF NOT EXISTS `cdr` (
  `id` bigint(20) unsigned zerofill NOT NULL AUTO_INCREMENT,
  `Created` datetime DEFAULT NULL,
  `Answered` datetime DEFAULT NULL,
  `Destroyed` datetime DEFAULT NULL,
  `Direction` varchar(255) DEFAULT NULL,
  `CallerId` varchar(255) DEFAULT NULL,
  `CallerDisplayName` varchar(255) DEFAULT NULL,
  `CalledId` varchar(255) DEFAULT NULL,
  `CalledDisplayName` varchar(255) DEFAULT NULL,
  `SipCallId` varchar(255) DEFAULT NULL,
  `CallerIp` varchar(255) DEFAULT NULL,
  `CalledIp` varchar(255) DEFAULT NULL,
  `DisconnectionCode` varchar(255) DEFAULT NULL,
  `DisconnectionStatus` varchar(255) DEFAULT NULL,
  `ReleasedBy` varchar(255) DEFAULT NULL,
  `Answer_Delay` int(11) DEFAULT NULL,
  `_100_Delay` int(11) DEFAULT NULL,
  `_180_Delay` int(11) DEFAULT NULL,
  `_183_Delay` int(11) DEFAULT NULL,
  `_180_183_Delay` int(11) DEFAULT NULL,
  `Audio_Signal_Delay` int(11) DEFAULT NULL,
  `Latest_RBT_Delay` int(11) DEFAULT NULL,
  `Early_Media_Peak_Signal_Level` int(11) DEFAULT NULL,
  `Active_Media_Peak_Signal_Level` int(11) DEFAULT NULL,
  `Recorded_RX_FileName` varchar(255) DEFAULT NULL,
  `Recorded_TX_FileName` varchar(255) DEFAULT NULL,
  `Recorded_Mix_FileName` varchar(255) DEFAULT NULL,
  `Answered_Duration` int(11) DEFAULT NULL,
  `Current_Calls_Count` double DEFAULT NULL,
  `Calls_Per_Second` double DEFAULT NULL,
  `Sip_Pcap_FileName` varchar(255) DEFAULT NULL,
  `Sip_And_Rtp_Pcap_FileName` varchar(255) DEFAULT NULL,
  `RTP_Codec` varchar(255) DEFAULT NULL,
  `RTP_Caller_Address` varchar(255) DEFAULT NULL,
  `RTP_Caller_Port` int(11) DEFAULT NULL,
  `RTP_Caller_SSRC` varchar(255) DEFAULT NULL,
  `RTP_Caller_G107R` bigint(20) DEFAULT NULL,
  `RTP_Caller_G107MOS` bigint(20) DEFAULT NULL,
  `RTP_Caller_PacketsCount` int(11) DEFAULT NULL,
  `RTP_Caller_LostPackets` int(11) DEFAULT NULL,
  `RTP_Caller_MaxRfc3550Jitter` bigint(20) DEFAULT NULL,
  `RTP_Caller_MeanRfc3550Jitter` bigint(20) DEFAULT NULL,
  `RTP_Caller_MaxDelta` bigint(20) DEFAULT NULL,
  `RTP_Caller_MinDelta` bigint(20) DEFAULT NULL,
  `RTP_Caller_PacketTime` int(11) DEFAULT NULL,
  `RTP_Caller_NonSilentPercentage` bigint(20) DEFAULT NULL,
  `RTP_Caller_Delay` int(11) DEFAULT NULL,
  `RTP_Caller_DSCP` int(11) DEFAULT NULL,
  `SDP_RTP_Caller_Delay` int(11) DEFAULT NULL,
  `RTP_Called_Address` varchar(255) DEFAULT NULL,
  `RTP_Called_Port` int(11) DEFAULT NULL,
  `RTP_Called_SSRC` varchar(255) DEFAULT NULL,
  `RTP_Called_G107R` bigint(20) DEFAULT NULL,
  `RTP_Called_G107MOS` bigint(20) DEFAULT NULL,
  `RTP_Called_PacketsCount` int(11) DEFAULT NULL,
  `RTP_Called_LostPackets` int(11) DEFAULT NULL,
  `RTP_Called_MaxRfc3550Jitter` double DEFAULT NULL,
  `RTP_Called_MeanRfc3550Jitter` double DEFAULT NULL,
  `RTP_Called_MaxDelta` bigint(20) DEFAULT NULL,
  `RTP_Called_MinDelta` bigint(20) DEFAULT NULL,
  `RTP_Called_PacketTime` int(11) DEFAULT NULL,
  `RTP_Called_NonSilentPercentage` bigint(20) DEFAULT NULL,
  `RTP_Called_Delay` int(11) DEFAULT NULL,
  `RTP_Called_DSCP` int(11) DEFAULT NULL,
  `SDP_RTP_Called_Delay` int(11) DEFAULT NULL,
  `RTCP_RTT_Max` int(11) DEFAULT NULL,
  `RTCP_RTT_Mean` int(11) DEFAULT NULL,
  `RTCP_Caller_Jitter_Max` int(11) DEFAULT NULL,
  `RTCP_Caller_Jitter_Mean` int(11) DEFAULT NULL,
  `RTCP_Caller_LostPackets` int(11) DEFAULT NULL,
  `RTCP_Called_Jitter_Max` int(11) DEFAULT NULL,
  `RTCP_Called_Jitter_Mean` int(11) DEFAULT NULL,
  `RTCP_Called_LostPackets` int(11) DEFAULT NULL,
  `Test_ID` int(11) DEFAULT NULL,
  `RTP_Rx_PacketsTotal` int(11) DEFAULT NULL,
  `RTP_Rx_PacketsDiscarded` int(11) DEFAULT NULL,
  `RTP_Rx_PacketsDiscarded_Duplicated` int(11) DEFAULT NULL,
  `RTP_Rx_PacketsDiscarded_Early` int(11) DEFAULT NULL,
  `RTP_Rx_PacketsDiscarded_Late` int(11) DEFAULT NULL,
  `RTP_Rx_PacketsDiscarded_Error` int(11) DEFAULT NULL,
  `RTP_CodecSampleRate` int(11) DEFAULT NULL,
  `from_no` varchar(255) DEFAULT NULL,
  `to_no` varchar(255) DEFAULT NULL,
  `duration` int(11) DEFAULT NULL,
  `time_end` datetime DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT NULL,
  `updated_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5370 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

## Cấu trúc thư mục như sau

evn-cdr-as/                  <-- THƯ MỤC GỐC (Root Directory)
├── docs/                    <-- Tài liệu PRD/Module viết xong đặt vào đây
 ├── 00_overview_and_architecture.md   <-- Tổng quan & Kiến trúc hệ thống chung
    ├── 01_database_schema.md             <-- Thiết kế CSDL toàn cục (cho Backend & DB Agent)
    ├── 02_api_contracts.md               <-- Quy chuẩn API & Danh sách Endpoint chung
    └── modules/                          <-- Thư mục chứa tài liệu chi tiết từng nhóm tính năng
  ├── 01_organization.md            <-- Module quản lý danh mục cây tổ chức
  ├── 02_user_group.md              <-- Module quản lý nhóm người dùng, mỗi nhóm người dùng tham chiếu vào một vị trí trên cây tổ chức
        ├── 03_auth_user.md               <-- Module: Xác thực & quản lý Người dùng của nhóm người dùng (mỗi nhóm người dùng có ít nhất một người dùng là quản trị viên của nhóm)
        ├── 04_auth_admin.md              <-- Module: Xác thực & Người dùng quản trị viên (không chung bảng dữ liệu với user, chứng thực riêng, chỉ root admin có quyền tạo admin khác)
        ├── 05_dashboard_analytics.md     <-- Module: Báo cáo & Thống kê
        ├── 06_notifications.md           <-- Module: quản lý thông báo
        ├── 07_system_settings.md         <-- Module: Cài đặt hệ thống của quản trị viên
        ├── 08_user_profile.md            <-- Module: Cài đặt thiết lập của người dùng thành viên
        ├── 09_admin_profile.md           <-- Module: Cài đặt thiết lập của người dùng quản trị viên
  ├── 10_permissions_and_roles.md   <-- Module: quản lý quyền hạn và vai trò (fine-grained permission systems)
        ├── 11_core_business_A.md         <-- Module: Nghiệp vụ chính phần A (5-6 trang)
        ├── 12_core_business_B.md         <-- Module: Nghiệp vụ chính phần B (5-6 trang)
        ├── ...
        ├── xx_core_business_x.md         <-- Module: Nghiệp vụ chính phần x (5-6 trang)
├── backend/                 <-- Thư mục con chứa toàn bộ code Backend (1 ứng dụng, 2 tiến trình api/worker)
│   ├── src/
│   │   ├── apps/admin/      <-- phần Quản trị
│   │   ├── apps/member/     <-- phần Thành viên
│   │   ├── apps/worker/     <-- phần Chạy ngầm
│   │   └── core/            <-- dùng chung
│   ├── package.json (hoặc requirements.txt/pyproject.toml)
│   └── .env
├── frontend/                <-- Thư mục con chứa toàn bộ code Frontend (1 ứng dụng)
│   ├── src/
│   │   ├── apps/admin/      <-- khu vực Quản trị
│   │   ├── apps/member/     <-- khu vực Thành viên
│   │   └── shared/          <-- dùng chung
│   ├── package.json
│   └── .env
├── templates/               <-- Thư mục con chứa thiết kế giao diện
├── .gitignore               <-- Gitignore chung ở root
└── README.md                <-- Hướng dẫn tổng quan dự án

## Hãy viết tài liệu cho AI coding agent (lưu thư mục docs) để thực hiện các công việc sau

- Thiết kế cơ sở dữ liệu
- Thiết kế layout giao diện
- Tính năng đăng nhập / đăng xuất / kiểm tra tình trạng đăng nhập / kiểm tra phân quyền
- Tính năng admin tạo và quản lý user
- Tính năng admin tạo và quản lý nhóm user
- Tính năng danh mục tổ chức
- Tính năng user quản lý profile
- Tính năng thiết lập của user
- Tính năng thiết lập hệ thống của admin
- Tính năng quản lý vai trò và quyền hạn (roles & permissions)
- Tính năng quản lý đầu số điện thoại ngành điện theo tổ chức
- Tính năng xem danh sách log CDR theo vai trò (kèm theo chức năng lọc, tìm kiếm, nghe ghi âm)
- Tính năng xem các phân tích log CDR như các thống kê về số lượng, phân tích các chỉ số QOS, ASR, MOS...
- Tính năng xuất báo cáo
- Tính năng thông báo (notifications: in app, over email)
- Trang dashboard và các biểu đồ thống kê cơ bản

1. Thống kê chất lượng âm thanh (Voice Quality - MOS & R-Value)

- Phân khúc điểm MOS: Thống kê tỷ lệ phần trăm các cuộc gọi theo các mức chất lượng âm thanh dựa trên RTP_Caller_G107MOS và RTP_Called_G107MOS (Xuất sắc: MOS $\ge 4.0$, Tốt: $3.5 - 4.0$, Trung bình: $3.0 - 3.5$, Kém: $< 3.0$).
- Đánh giá chất lượng hai chiều: So sánh chất lượng giữa chiều gọi đi (Caller) và gọi đến (Called) để phát hiện xem vấn đề chất lượng xuất phát từ phía hạ tầng của tổng đài hay từ thiết bị của khách hàng.
- Điểm R-Value trung bình: Theo dõi giá trị G.107 R-Value theo thời gian thực để đánh giá tổng thể độ mượt mà của âm thanh.

1. Thống kê hiệu suất mạng và truyền dẫn (Network Metrics)

- Tỷ lệ mất gói tin (Packet Loss Rate): Tổng hợp số lượng và tỷ lệ gói tin bị mất (RTP_Caller_LostPackets, RTP_Called_LostPackets) kết hợp với tổng số gói (PacketsCount) để cảnh báo nghẽn mạng.  
- Độ trễ Jitter và RTT: Đo lường độ ổn định của mạng dựa trên độ trễ jitter trung bình/tối đa (RTP_Caller_MeanRfc3550Jitter) và thời gian khứ hồi RTCP (RTCP_RTT_Mean, RTCP_RTT_Max).
- Thống kê gói tin RTP bị loại bỏ: Phân tích các nguyên nhân gói tin bị hủy (RTP_Rx_PacketsDiscarded_Early, Late, Duplicated) để tối ưu hóa bộ đệm jitter buffer.

1. Thống kê độ trễ thiết lập cuộc gọi (Call Setup Latency)

- Độ trễ phản hồi tín hiệu SIP: Đo thời gian phản hồi ở các mốc _100_Delay, _180_Delay, _183_Delay để đánh giá tốc độ xử lý của Server SIP/Proxy.
- Thời gian chờ nhấc máy (Answer Delay): Thống kê khoảng thời gian từ lúc bấm gọi đến khi có người nghe (Answer_Delay) và thời gian truyền tín hiệu âm thanh thực tế (Audio_Signal_Delay).

1. Thống kê nguyên nhân ngắt kết nối và tỷ lệ thành công (Disconnection & Success Analysis)

- Chỉ số ASR (Answer Seizure Ratio): Tính tỷ lệ phần trăm cuộc gọi thành công được trả lời (dựa trên số lượng bản ghi có trường Answered so với tổng số bản ghi khởi tạo Created/SipCallId) nhằm đánh giá chất lượng tuyến đường truyền hoặc hiệu quả kết nối tổng đài.
- Tỷ lệ cuộc gọi thành công/thất bại: Nhóm các cuộc gọi theo DisconnectionStatus (như "Normal", "Busy", "No Answer") và mã lỗi SIP (DisconnectionCode).
- Bên chủ động ngắt cuộc gọi (ReleasedBy): Thống kê tỷ lệ cuộc gọi do Caller (khách hàng cúp máy), Called (nhân viên cúp máy) hay do System (lỗi hệ thống, rớt mạng) để đánh giá hành vi người dùng và độ ổn định phiên.
