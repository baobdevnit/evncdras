# EVN CDR Analysis System (EVN CDR AS)
### Hệ thống Giám sát, Phân tích Log Cuộc gọi, Đánh giá Chất lượng QoS, Ghi Cước và Ghi Âm Thoại IP Mạng Tổng Đài PABX EVN

---

## 1. Giới thiệu dự án

Hệ thống **EVN CDR AS** là giải pháp phần mềm chuyên dụng được xây dựng cho Tập đoàn Điện lực Việt Nam (EVN) và Công ty Viễn thông Điện lực & Công nghệ Thông tin (EVNICT) nhằm:
1. **Thu thập và Quản lý CDR**: Tự động nhận và đồng bộ các bản chi tiết cuộc gọi (Call Detail Record - CDR) từ mạng lưới tổng đài IP PABX nội bộ EVN vào cơ sở dữ liệu MariaDB.
2. **Đánh giá Chất lượng Thoại IP (QoS Analysis)**: Phân tích các chỉ số kỹ thuật viễn thông chuẩn ITU-T (MOS G.107, Packet Loss, Jitter RFC 3550, Delay RTT, Delta, ASR, NER, Disconnection Codes) giúp phát hiện sự cố suy giảm chất lượng âm thanh hoặc rớt cuộc gọi.
3. **Quản lý & Cung cấp Ghi âm**: Trình phát nghe lại âm thanh trực tuyến (Inline Audio Player) và tải về các file ghi âm cuộc gọi (Mix, RX, TX) cùng tệp tin bắt gói tin mạng SIP/RTP PCAP có kiểm soát phân quyền chặt chẽ.
4. **Tính cước & Ghi cước (Billing Engine)**: Phân loại cuộc gọi nội bộ EVN miễn phí, cuộc gọi ngoại mạng (PSTN, Di động) tính cước theo block $6\text{s} + 1\text{s}$, quản lý hạn mức chi phí cước của từng đơn vị.
5. **Chứng thực & Phân quyền Hai Cổng (Dual Portal Architecture)**: Tách biệt hoàn toàn Cổng Quản trị viên hệ thống (Admin Portal) và Cổng Người dùng đơn vị (Tenant / User Portal). Dữ liệu được bảo vệ và phân tách theo Cây tổ chức EVN và Dải đầu số điện thoại được cấp phát.

---

## 2. Công nghệ sử dụng

- **Backend**: NestJS (Node.js, TypeScript), Fastify/Express, TypeORM / Knex, Passport JWT, Socket.IO, Nodemailer, ExcelJS, PDFMake.
- **Frontend**: Vue.js 3 (Composition API, `<script setup lang="ts">`), Vite, TypeScript, Pinia, Vue Router 4, Chart.js.
- **Cơ sở dữ liệu**: MariaDB 10.6+ (InnoDB Engine, Partitioning theo tháng, Compound Indexes tối ưu truy vấn).
- **Thiết kế Giao diện**: Xây dựng theo bộ mẫu HTML/CSS trong thư mục `templates/`, nhận diện thương hiệu chuẩn EVN (Xanh dương `#0033A0`, Cam `#EA580C`, hỗ trợ Dark Mode & Light Mode).

---

## 3. Cấu trúc thư mục dự án

```
evn-cdr-as/
├── docs/                                          <-- TÀI LIỆU ĐẶC TẢ CHI TIẾT (PRD & SPECIFICATIONS)
│   ├── 00_overview_and_architecture.md            <-- Tổng quan & Kiến trúc hệ thống chung
│   ├── 01_database_schema.md                      <-- Thiết kế CSDL toàn cục (Bảng CDR 85 cột & quan hệ)
│   ├── 02_api_contracts.md                        <-- Quy chuẩn API & Danh sách Endpoint chung
│   └── modules/                                   <-- Đặc tả chi tiết từng nhóm tính năng
│       ├── 01_organization.md                     <-- Quản lý danh mục cây tổ chức EVN
│       ├── 02_user_group.md                       <-- Quản lý nhóm người dùng (Tổ chức QLND)
│       ├── 03_auth_user.md                        <-- Xác thực & Quản lý người dùng đơn vị
│       ├── 04_auth_admin.md                       <-- Xác thực & Quản trị viên hệ thống (Root Admin)
│       ├── 05_dashboard_analytics.md              <-- Bảng điều khiển KPI & Biểu đồ thống kê
│       ├── 06_notifications.md                    <-- Quản lý thông báo In-App (WebSocket) & Email Alert
│       ├── 07_system_settings.md                  <-- Cài đặt hệ thống PABX, FTP/SFTP, Retention
│       ├── 08_user_profile.md                     <-- Hồ sơ cá nhân & Thiết lập của User thành viên
│       ├── 09_admin_profile.md                    <-- Hồ sơ cá nhân & Bảo mật của Admin
│       ├── 10_permissions_and_roles.md            <-- Quản lý vai trò & Phân quyền ma trận hạt mịn
│       ├── 11_core_business_phone_numbers.md      <-- Quản lý đầu số & dải số điện thoại theo tổ chức
│       ├── 12_core_business_cdr_and_audio.md      <-- Tra cứu log CDR, nghe trực tuyến & tải file ghi âm
│       ├── 13_core_business_qos_analysis.md       <-- Phân tích chất lượng thoại VoIP QoS (MOS, Jitter, SIP)
│       ├── 14_core_business_call_billing.md       <-- Tính cước, biểu cước & định mức chi phí thoại IP
│       └── 15_core_business_reports_export.md     <-- Báo cáo chuyên sâu & Xuất dữ liệu Excel/PDF
├── backend/                                       <-- 1 ứng dụng NestJS, chạy 2 tiến trình (backend-api, backend-worker)
│   └── src/
│       ├── apps/admin/                            <-- Phần Quản trị: API /api/v1/admin/*
│       ├── apps/member/                           <-- Phần Thành viên: API /api/v1/*
│       ├── apps/worker/                           <-- Phần Chạy ngầm: làm giàu CDR, tổng hợp thống kê, cảnh báo
│       ├── realtime/                              <-- Socket.IO thông báo in-app
│       └── core/                                  <-- Entity, service nghiệp vụ, guard dùng chung
├── frontend/                                      <-- 1 ứng dụng Vue 3 (1 build, 1 router)
│   └── src/
│       ├── apps/admin/                            <-- Khu vực Quản trị, URL /admin/*
│       ├── apps/member/                           <-- Khu vực Thành viên, URL /*
│       └── shared/                                <-- API client, component, CSS dùng chung
├── templates/                                     <-- Giao diện HTML/CSS/JS mẫu chuẩn EVN (admin/, member/)
└── README.md                                      <-- Hướng dẫn tổng quan dự án (File hiện tại)
```

---

## 4. Hướng dẫn cài đặt & Khởi chạy môi trường phát triển

### 4.1. Cơ sở dữ liệu MariaDB
1. Cài đặt MariaDB phiên bản 10.6 trở lên.
2. Tạo cơ sở dữ liệu:
   ```sql
   CREATE DATABASE evn_cdr_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```
3. Chạy script tạo bảng và nạp dữ liệu mẫu từ `docs/01_database_schema.md`.

### 4.2. Khởi chạy Backend (NestJS)
```bash
cd backend
npm install
cp .env.example .env   # Cấu hình DB_HOST, DB_NAME, JWT_ADMIN_SECRET, JWT_USER_SECRET
npm run start:dev          # backend-api: phần Quản trị + Thành viên (HTTP, Socket.IO)
npm run start:worker:dev   # backend-worker: phần Chạy ngầm (chạy song song ở terminal thứ hai)
```
- API Swagger Documentation: `http://localhost:3000/api/docs`
- Kiến trúc chi tiết (1 ứng dụng frontend, 1 ứng dụng backend chia 3 phần): `docs/00_overview_and_architecture.md` mục 2.1, 2.2, 5.

### 4.3. Khởi chạy Frontend (Vue 3 + Vite)
```bash
cd frontend
npm install
npm run dev
```
- Ứng dụng Web (1 ứng dụng, 2 cổng): Cổng Thành viên `http://localhost:5173/`, Cổng Quản trị `http://localhost:5173/admin/`

---

## 5. Danh mục tài liệu tham khảo cho AI Coding Agent

Khi thực hiện sinh mã nguồn hoặc chỉnh sửa tính năng, AI Agent cần đọc kỹ các tài liệu trong `docs/`:
- **Kiến trúc & Chuẩn API**: [00_overview_and_architecture.md](file:///d:/EVN/evn-cdr-as/docs/00_overview_and_architecture.md), [02_api_contracts.md](file:///d:/EVN/evn-cdr-as/docs/02_api_contracts.md).
- **Mô hình Dữ liệu MariaDB**: [01_database_schema.md](file:///d:/EVN/evn-cdr-as/docs/01_database_schema.md).
- **Phân hệ Tổ chức & Người dùng**:
  - Cây tổ chức: [01_organization.md](file:///d:/EVN/evn-cdr-as/docs/modules/01_organization.md).
  - Nhóm người dùng (QLND): [02_user_group.md](file:///d:/EVN/evn-cdr-as/docs/modules/02_user_group.md).
  - Xác thực User: [03_auth_user.md](file:///d:/EVN/evn-cdr-as/docs/modules/03_auth_user.md).
  - Xác thực Admin (Root Admin): [04_auth_admin.md](file:///d:/EVN/evn-cdr-as/docs/modules/04_auth_admin.md).
  - Phân quyền ma trận: [10_permissions_and_roles.md](file:///d:/EVN/evn-cdr-as/docs/modules/10_permissions_and_roles.md).
- **Phân hệ Nghiệp vụ Cuộc gọi & QoS**:
  - Quản lý đầu số: [11_core_business_phone_numbers.md](file:///d:/EVN/evn-cdr-as/docs/modules/11_core_business_phone_numbers.md).
  - Tra cứu CDR & Ghi âm: [12_core_business_cdr_and_audio.md](file:///d:/EVN/evn-cdr-as/docs/modules/12_core_business_cdr_and_audio.md).
  - Phân tích QoS & Gỡ lỗi SIP: [13_core_business_qos_analysis.md](file:///d:/EVN/evn-cdr-as/docs/modules/13_core_business_qos_analysis.md).
  - Tính cước & Định mức: [14_core_business_call_billing.md](file:///d:/EVN/evn-cdr-as/docs/modules/14_core_business_call_billing.md).
  - Xuất báo cáo Excel/PDF: [15_core_business_reports_export.md](file:///d:/EVN/evn-cdr-as/docs/modules/15_core_business_reports_export.md).
- **Bảng điều khiển & Tiện ích**:
  - Dashboard: [05_dashboard_analytics.md](file:///d:/EVN/evn-cdr-as/docs/modules/05_dashboard_analytics.md).
  - Thông báo (In-app, Email): [06_notifications.md](file:///d:/EVN/evn-cdr-as/docs/modules/06_notifications.md).
  - Cài đặt hệ thống: [07_system_settings.md](file:///d:/EVN/evn-cdr-as/docs/modules/07_system_settings.md).
  - Hồ sơ cá nhân User & Admin: [08_user_profile.md](file:///d:/EVN/evn-cdr-as/docs/modules/08_user_profile.md), [09_admin_profile.md](file:///d:/EVN/evn-cdr-as/docs/modules/09_admin_profile.md).

