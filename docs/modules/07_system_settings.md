# MODULE 07: CÀI ĐẶT HỆ THỐNG CỦA QUẢN TRỊ VIÊN (ADMIN SYSTEM SETTINGS)

## Đường dẫn tài liệu: `docs/modules/07_system_settings.md`

## Ánh xạ giao diện mẫu: `templates/admin/system-settings.html`, `templates/admin/system-settings.css`, `templates/admin/system-settings.js`

---

## 1. Mục tiêu & Nghiệp vụ (Business Overview)

### 1.1. Bối cảnh nghiệp vụ

Quản trị viên hệ thống (Admin Portal) của EVNICT quản lý một trung tâm điều khiển để cấu hình các tham số vận hành cốt lõi:

> [!NOTE]
> **Cơ chế tiếp nhận dữ liệu CDR (Real-time Ingestion)**:
> Bảng `cdr` trong CSDL MariaDB được hệ thống PABX hoặc bộ thu thập chuyên dụng (PABX Collector / ETL Agent) bên ngoài ghi nhận và **đẩy trực tiếp theo thời gian thực cuộc gọi**. Hệ thống EVN CDR AS **hoàn toàn không làm nhiệm vụ kết nối FTP/SFTP để tải file log**. Mọi cài đặt hệ thống tập trung vào các quy tắc phân tích, chính sách lưu trữ và vận hành an toàn.

1. **Quy tắc phân tích (Analysis Rules)**: Biểu thức chính quy (Regex) nhận dạng số máy lẻ 5 số nội bộ EVN và danh sách IP lõi PABX dùng để gộp leg.
2. **Chính sách lưu trữ & dọn dẹp (Retention Policies)**: Quy định thời gian lưu trữ dữ liệu CDR trực tuyến trong MariaDB trước khi chuyển sang vùng lưu trữ (chỉ Admin xem được) và trước khi xóa vĩnh viễn bằng `DROP PARTITION`, nhằm kiểm soát dung lượng ổ đĩa.
3. **Nâng cao & Bảo trì (Advanced)**: Chế độ bảo trì, ánh xạ đường dẫn ghi âm, cảnh báo QoS và SMTP, chính sách xác thực. Báo cáo định kỳ qua email và API token cho hệ thống bên thứ 3 nằm ngoài phạm vi phiên bản này.
4. **Chế độ bảo trì (Maintenance Mode)**: Tạm dừng quyền truy cập của người dùng đơn vị khi tiến hành nâng cấp hệ thống nhưng vẫn duy trì tiến trình phân tích làm giàu nền.

---

## 2. Thiết kế Dữ liệu (Database Schema)

Bảng MariaDB: `system_settings` (Định nghĩa tại `docs/01_database_schema.md`).

Danh mục các Key cấu hình chuẩn (3 phân nhóm: `ANALYSIS`, `REPORTING`, `ADVANCED`):

- **Nhóm Quy tắc phân tích (`category = 'ANALYSIS'`)**:
  - `analysis_internal_extension_pattern`: '^[1-9]\\d{4}$' (Biểu thức chính quy nhận dạng máy lẻ 5 số EVN thuộc kho số 10000–99999, khối 1–9; khối 0 `0xxxx` là đầu số dịch vụ đặc biệt, không phải máy lẻ. Số không khớp là **số ngoài kho**: nhóm sở hữu = NULL, xem `docs/01_database_schema.md` mục 2.1)
  - `pabx_core_ip_list`: '10.128.16.252,10.128.16.253' (Danh sách IP lõi PABX, phân tách bằng dấu phẩy; dùng để xác định leg A/B và leg chính khi gộp leg, xem `docs/01_database_schema.md` mục 2.1)
- **Nhóm Báo cáo & Lưu trữ (`category = 'REPORTING'`)**:
  - `retention_online_months`: '6' (Số tháng CDR tra cứu trực tuyến; ngoài cửa sổ này chỉ Admin xem được qua `includeArchive=true`, xem `docs/01_database_schema.md` mục 2.1)
  - `retention_archive_months`: '60' (Số tháng giữ CDR trong `cdr_enriched` trước khi DROP PARTITION; phải >= retention_online_months; stats và audit log không bị dọn)
- **Nhóm Nâng cao & Bảo trì (`category = 'ADVANCED'`)**:
  - `system_maintenance_mode`: 'false' (Chế độ bảo trì. Khi `true`: mọi API của User Portal trả `503` mã `MAINTENANCE`, trừ `GET /api/v1/auth/me`; User không đăng nhập mới được; Admin Portal, tiến trình làm giàu và job tổng hợp vẫn chạy bình thường; frontend User hiển thị `.maintenance-alert-banner`)
  - `recording_path_map`: '[{"from": "D:\\StarTrinity\\recordings\\", "to": "/mnt/pabx_recordings/"}]' (JSON ánh xạ tiền tố đường dẫn file ghi âm của PABX sang thư mục gắn chỉ đọc trên server backend; thuật toán tại `docs/modules/12_core_business_cdr_and_audio.md` mục 2.3)
  - Nhóm cảnh báo & email (quy tắc tại `docs/01_database_schema.md` mục 10):
    - `qos_alert_min_calls`: '20' (Số cuộc gọi tối thiểu trong khung giờ để xét cảnh báo QoS)
    - `pabx_offline_minutes`: '60' (Số phút không có CDR mới thì cảnh báo PABX_OFFLINE)
    - `smtp_host`, `smtp_port` ('587'), `smtp_user`, `smtp_password` (`is_secret = 1`), `smtp_from`
  - Nhóm chính sách xác thực (ý nghĩa chi tiết tại `docs/01_database_schema.md` mục 6.1):
    - `security_access_token_minutes`: '15' (Thời hạn Access Token, phút)
    - `security_refresh_token_days`: '7' (Thời hạn Refresh Token / phiên đăng nhập, ngày)
    - `security_password_min_length`: '10' (Độ dài mật khẩu tối thiểu)
    - `security_password_max_age_days`: '90' (Số ngày trước khi bắt đổi mật khẩu)
    - `security_login_max_failed`: '5' (Số lần đăng nhập sai liên tiếp trước khi khóa tạm)
    - `security_lockout_minutes`: '15' (Thời gian khóa tạm, phút)
- **Ngoài phạm vi phiên bản này** (đã bỏ khỏi danh mục): ngưỡng thời lượng tối thiểu (`analysis_min_duration_seconds`), token tích hợp cho hệ thống bên ngoài (`external_api_token`), báo cáo tự động gửi email (`auto_report_*`).
- Seed đầy đủ các key kèm giá trị mặc định và `category`: `docs/01_database_schema.md` mục 12.

---

## 3. Đặc tả API Contracts

### 3.1. Lấy cấu hình hệ thống (`GET /api/v1/admin/settings/system`)

- **Guard**: `AdminAuthGuard`, `Permission: system:manage`
- **Response**: Trả về toàn bộ danh sách cài đặt phân nhóm theo 3 tab (`analysis`, `reporting`, `advanced`).
- **Bảo mật**: Các trường có `is_secret = 1` chỉ trả về dạng mặt nạ (`********`).

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "analysis": {
      "analysis_internal_extension_pattern": "^[1-9]\\d{4}$",
      "pabx_core_ip_list": "10.128.16.252,10.128.16.253"
    },
    "reporting": {
      "retention_online_months": 6,
      "retention_archive_months": 60
    },
    "advanced": {
      "system_maintenance_mode": false,
      "recording_path_map": "[{\"from\": \"D:\\\\StarTrinity\\\\recordings\\\\\", \"to\": \"/mnt/pabx_recordings/\"}]",
      "qos_alert_min_calls": 20,
      "pabx_offline_minutes": 60,
      "smtp_host": "mail.evn.com.vn",
      "smtp_port": 587,
      "smtp_user": "cdr-alert@evn.com.vn",
      "smtp_password": "********",
      "smtp_from": "EVN CDR AS <cdr-alert@evn.com.vn>",
      "security_access_token_minutes": 15,
      "security_refresh_token_days": 7,
      "security_password_min_length": 10,
      "security_password_max_age_days": 90,
      "security_login_max_failed": 5,
      "security_lockout_minutes": 15
    }
  }
}
```

### 3.2. Cập nhật cấu hình hệ thống (`PUT /api/v1/admin/settings/system`)

- **Guard**: `AdminAuthGuard`, `Permission: system:manage`
- **Body**:

```json
{
  "category": "ANALYSIS",
  "settings": {
    "analysis_internal_extension_pattern": "^[4-9]\\d{4}$"
  }
}
```

- **Giảm `retention_archive_months`**: nếu giá trị mới nhỏ hơn giá trị đang lưu, body bắt buộc có `"confirmPurge": true` (cùng cấp với `settings`). Thiếu thì trả `409` mã `RETENTION_PURGE_CONFIRM_REQUIRED`, `errors = { "currentMonths": 60, "newMonths": 12, "monthsToPurge": 48 }`, không lưu setting nào trong request. Giao diện hiện hộp xác nhận nêu số tháng CDR sẽ bị xóa vĩnh viễn ở lần chạy job partition kế tiếp, người dùng đồng ý thì gửi lại kèm `confirmPurge: true` (`docs/01_database_schema.md` mục 2.1). Tăng giá trị hoặc giữ nguyên thì bỏ qua `confirmPurge`.

### 3.3. Nạp lại bộ nhớ đệm (`POST /api/v1/admin/settings/reload-cache`)

- **Guard**: `AdminAuthGuard`, `Permission: system:manage`
- Nạp lại cache sở hữu số (`phone_numbers.range_id → user_groups`) và cache `system_settings` trên mọi tiến trình backend (mọi instance `backend-api` và `backend-worker`) bằng cách tăng `cdr_enrichment_state.cache_version`; mỗi tiến trình phát hiện giá trị mới trong vòng vài giây và tự nạp lại (`docs/00_overview_and_architecture.md` mục 2.1). Ghi `audit_logs` (`SYSTEM / UPDATE_SETTINGS`, `action_details.op = "RELOAD_CACHE"`). Dùng sau khi sửa dữ liệu trực tiếp trong DB.

---

## 4. Kiến trúc Backend NestJS (`backend/src/core`, `apps/*`)

Theo quy tắc `docs/00_overview_and_architecture.md` mục 5.1: nghiệp vụ và entity ở `core`, controller ở `apps/admin` / `apps/member`, job nền ở `apps/worker`; các phần `apps/*` không import lẫn nhau.

```
backend/src/
├── core/system-settings/
│   ├── system-settings.module.ts
│   ├── system-settings.service.ts      <-- đọc/ghi system_settings, cache trong bộ nhớ; ghi xong tăng cache_version
│   ├── dto/
│   │   └── update-settings.dto.ts
│   └── entities/
│       └── system-setting.entity.ts
├── core/cache/
│   ├── cache.module.ts
│   ├── number-ownership-cache.service.ts
│   └── cache-version.watcher.ts        <-- API: setInterval 5 giây; Worker: gọi đầu mỗi chu kỳ làm giàu
└── apps/admin/settings/
    ├── admin-settings.module.ts
    └── system-settings.controller.ts   <-- /api/v1/admin/settings/system, POST /admin/settings/reload-cache
```

---

## 5. Kiến trúc Frontend Vue 3 (`frontend/src/apps/admin/views/settings/SystemSettingsView.vue`)

### 5.1. Bố cục Giao diện (Ánh xạ chuẩn `templates/admin/system-settings.html`)

- **Khung giao diện Split-Settings (`.settings-layout`)**:
  - Menu điều hướng bên trái (`.settings-sidebar`): 3 nút điều hướng cuộn mượt:
    1. "Phân tích & Quy tắc" (`data-section="analysis"`).
    2. "Báo cáo & Lưu trữ" (`data-section="reporting"`).
    3. "Hệ thống & Nâng cao" (`data-section="advanced"`).
  - Khung nội dung bên phải (`.settings-content`):
    - **Vùng Phân tích (`#section-analysis`)**: Biểu thức chính quy nhận dạng máy lẻ 5 số, danh sách IP lõi PABX.
    - **Vùng Báo cáo & Lưu trữ (`#section-reporting`)**: Chu kỳ tra cứu trực tuyến (tháng) và thời hạn giữ CDR trước khi xóa (tháng).
    - **Vùng Nâng cao (`#section-advanced`)**: Công tắc Chế độ bảo trì, ánh xạ đường dẫn ghi âm, cảnh báo & SMTP, chính sách xác thực, và nút "Nạp lại bộ nhớ đệm" (gọi `POST /api/v1/admin/settings/reload-cache`).
- **Nút "Tính lại thống kê"** trong vùng Báo cáo & Lưu trữ: chọn `fromDate`/`toDate` (≤ 366 ngày), gọi `POST /api/v1/admin/stats/recalculate`, hiển thị số khung giờ đã xếp hàng (`queuedHours`). API ghi `audit_logs` `SYSTEM / RECALCULATE_STATS` (`docs/01_database_schema.md` mục 13).

### 5.2. Các mục bổ sung (không có trong template, dựng theo cùng bố cục `.settings-section`)

Mỗi mục là một component trong `src/apps/admin/views/settings/sections/`, có nút riêng trên `.settings-sidebar`, mở trực tiếp bằng `/admin/settings?section=<key>`. Mục bị ẩn (cả nút menu) khi tài khoản thiếu quyền; thiếu quyền khi mở bằng query thì chuyển về mục đầu tiên được phép.

| Key | Component | Quyền | Nội dung |
| :--- | :--- | :--- | :--- |
| `analysis`, `reporting`, `advanced` | `AnalysisSection.vue`, `ReportingSection.vue`, `AdvancedSection.vue` | `system:manage` | Mục 5.1 |
| `qos-thresholds` | `QosThresholdsSection.vue` | xem `qos:view`, nút Lưu cần `qos:manage` | Bảng ngưỡng warning/critical theo `metric_name`, `GET`/`PUT /api/v1/admin/qos/thresholds` (`docs/modules/13_core_business_qos_analysis.md` mục 3.3) |
| `admins` | `AdminAccountsSection.vue` | `admin:manage` | Quản lý Quản trị viên (`docs/modules/04_auth_admin.md` mục 5.2) |
| `audit-logs` | `AuditLogSection.vue` | `audit:view` | Bảng `GET /api/v1/admin/audit-logs`: lọc `fromDate`/`toDate` (bắt buộc), `actorType`, `actorId`, `action`, `resourceName`, phân trang; chỉ đọc |

---

## 6. Kịch bản kiểm thử (Test Plan for Agent)

1. **TC-SET-01**: Giá trị mặc định là `^[1-9]\d{4}$`. Thay đổi thành `^[4-9]\d{4}$`, lưu thành công và kiểm tra các CDR mới làm giàu sau thời điểm lưu coi số `1xxxx` là số ngoài kho (`caller_group_id`/`called_group_id = NULL`). Bản ghi đã làm giàu trước đó không bị tính lại.
2. **TC-SET-02**: Thay đổi chu kỳ lưu trữ online từ 6 tháng thành 12 tháng, xác nhận giá trị cập nhật thành công trong bảng `system_settings`.
3. **TC-SET-03**: Gọi `POST /api/v1/admin/settings/reload-cache` sau khi sửa trực tiếp `phone_numbers.range_id` trong DB, xác nhận CDR làm giàu sau đó dùng nhóm sở hữu mới.
4. **TC-SET-04**: Bật Chế độ bảo trì: đăng nhập User trả `503 MAINTENANCE`, `GET /api/v1/auth/me` vẫn trả `200`; Admin Portal và job tổng hợp vẫn hoạt động.
