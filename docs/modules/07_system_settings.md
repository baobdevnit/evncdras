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
  - `system_maintenance_mode`: 'false' (Chế độ bảo trì. Khi `true`: mọi API của User Portal trả `503` mã `MAINTENANCE`, trừ `GET /api/v1/auth/me` và `POST /api/v1/auth/refresh` (phiên đang có giữ nguyên); User không đăng nhập mới được (`POST /api/v1/auth/login` trả `503` trước khi kiểm tra body/tài khoản, không ghi audit, `docs/modules/03_auth_user.md` mục 3.1); Admin Portal, tiến trình làm giàu và job tổng hợp vẫn chạy bình thường; frontend User hiển thị `.maintenance-alert-banner`)
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

- **Key bí mật** (`is_secret = 1`, hiện chỉ `smtp_password`): key không có trong `settings` hoặc có giá trị đúng bằng mặt nạ `********` thì **giữ nguyên** giá trị đang lưu (frontend được gửi lại nguyên form đã đọc từ mục 3.1); muốn xóa thì gửi chuỗi rỗng `""`; giá trị khác thì ghi đè.
- **Giảm `retention_archive_months`**: nếu giá trị mới nhỏ hơn giá trị đang lưu, body bắt buộc có `"confirmPurge": true` (cùng cấp với `settings`). Thiếu thì trả `409` mã `RETENTION_PURGE_CONFIRM_REQUIRED`, `errors = { "currentMonths": 60, "newMonths": 12, "monthsToPurge": 48 }`, không lưu setting nào trong request. Giao diện hiện hộp xác nhận nêu số tháng CDR sẽ bị xóa vĩnh viễn ở lần chạy job partition kế tiếp, người dùng đồng ý thì gửi lại kèm `confirmPurge: true` (`docs/01_database_schema.md` mục 2.1). Tăng giá trị hoặc giữ nguyên thì bỏ qua `confirmPurge`.

### 3.3. Nạp lại bộ nhớ đệm (`POST /api/v1/admin/settings/reload-cache`)

- **Guard**: `AdminAuthGuard`, `Permission: system:manage`
- Nạp lại cache sở hữu số (`phone_numbers.range_id → user_groups`) và cache `system_settings` trên mọi tiến trình backend (mọi instance `backend-api` và `backend-worker`) bằng cách tăng `cdr_enrichment_state.cache_version`; mỗi tiến trình phát hiện giá trị mới trong vòng vài giây và tự nạp lại (`docs/00_overview_and_architecture.md` mục 2.1). Ghi `audit_logs` (`SYSTEM / UPDATE_SETTINGS`, `action_details.op = "RELOAD_CACHE"`). Dùng sau khi sửa dữ liệu trực tiếp trong DB.

### 3.4. Tra cứu nhật ký kiểm toán (`GET /api/v1/admin/audit-logs`)

- **Guard**: `AdminAuthGuard`, `Permission: audit:view` (seed: `ROOT_ADMIN`, `SYSTEM_ADMIN`). Token `PASSWORD_CHANGE_ONLY` → `403`; tài khoản không còn `ACTIVE` hoặc `must_change_password = 1` → `401 UNAUTHORIZED` (`docs/modules/04_auth_admin.md` mục 3.1.1). Thiếu `audit:view` → `403 FORBIDDEN`.
- Chỉ đọc; không có API sửa, xóa hay xuất file `audit_logs` (`docs/01_database_schema.md` mục 13). Bản thân việc tra cứu **không** ghi `audit_logs`. Xem được mọi dòng của mọi tác nhân (Admin, User mọi nhóm, `SYSTEM`); không có bản User.
- **Query** (mọi tham số theo quy ước `docs/02_api_contracts.md` mục 2.2: mỗi tham số một lần, tham số lạ hoặc `sort`/`order` → `400`; lỗi trả `400 VALIDATION_ERROR` với `errors.<tên tham số>`):

| Tham số | Bắt buộc | Quy tắc | Điều kiện SQL |
|---|---|---|---|
| `fromDate`, `toDate` | ✓ | `YYYY-MM-DD`, ngày lịch hợp lệ (không nhận giờ/offset), giờ Việt Nam; `fromDate ≤ toDate`; tối đa **31 ngày tính cả hai đầu** (`toDate − fromDate ≤ 30`). Được chọn ngày tương lai. Không giới hạn độ cũ (`audit_logs` không bị dọn) | `created_at >= :fromDate 00:00:00 AND created_at < :toDate + 1 ngày` |
| `actorType` | | `ADMIN` \| `USER` \| `SYSTEM` (chữ hoa; rỗng = không lọc) | `actor_type = :actorType` |
| `actorId` | | Rỗng = không lọc; `^[1-9][0-9]{0,9}$` và ≤ 4294967295; bắt buộc đi cùng `actorType` `ADMIN`/`USER` (thiếu `actorType` hoặc `actorType = SYSTEM` → `400`, `errors.actorId`) | `actor_id = :actorId` |
| `action` | | Một mã trong danh mục `docs/01_database_schema.md` mục 13 (30 mã, chữ hoa; mã lạ → `400`) | `action = :action` |
| `resourceName` | | Một trong `AUTH`, `CDR`, `AUDIO`, `REPORT`, `USER`, `ADMIN`, `USER_GROUP`, `PREFIX`, `ORGANIZATION`, `SYSTEM` | `resource_name = :resourceName` |
| `resourceId` | | Cắt khoảng trắng, rỗng = không lọc, ≤ 255 ký tự; bắt buộc đi cùng `resourceName` (thiếu → `400`, `errors.resourceId`). Khớp **chính xác** (vd. `resourceName=ADMIN&resourceId=7`: mọi việc đã làm lên Admin id 7) | `resource_id = :resourceId` |
| `page`, `limit` | | `page` mặc định 1; `limit` mặc định 20, tối đa 100 | |

  - Không kiểm tra chéo `action` với `resourceName` (vd. `action=LOGIN&resourceName=CDR` hợp lệ, trả rỗng).

- **Truy vấn** (hai câu, cùng `WHERE`, không transaction):

```sql
SELECT id, actor_type, actor_id, actor_name, action, resource_name, resource_id,
       ip_address, user_agent, action_details, created_at
FROM audit_logs
WHERE created_at >= :fromStart AND created_at < :toEndExclusive
  /* thêm các điều kiện của tham số đã gửi */
ORDER BY created_at DESC, id DESC
LIMIT :limit OFFSET (:page - 1) * :limit;

SELECT COUNT(*) FROM audit_logs WHERE /* như trên */;
```

  - Index (`docs/01_database_schema.md` mục 13; để optimizer tự chọn, không `FORCE INDEX`): lọc tác nhân → `idx_audit_actor`; lọc `action` → `idx_audit_action` (`action`, `created_at`, `id`); lọc `resourceName` (± `resourceId`) → `idx_audit_resource` (`resource_name`, `created_at`, `id`); chỉ khoảng ngày → `idx_audit_created` (InnoDB tự kèm `id`). Mọi trường hợp đọc theo thứ tự index, không filesort.
- **Sắp xếp**: `created_at` giảm dần, rồi `id` giảm dần (cố định).
- **Response** `200`: khung phân trang `docs/02_api_contracts.md` mục 2.2. Mỗi phần tử:

| Trường | Cột | Ghi chú |
|---|---|---|
| `id` | `id` | số |
| `actorType` | `actor_type` | `ADMIN` \| `USER` \| `SYSTEM` |
| `actorId` | `actor_id` | số hoặc `null` (`SYSTEM`; đăng nhập thất bại với username không tồn tại) |
| `actorName` | `actor_name` | tên tại thời điểm ghi (không join `admins`/`users`); `LOGIN_FAILED` là username đã nhập; `SYSTEM` là tên job |
| `action`, `resourceName` | `action`, `resource_name` | mã gốc, frontend tự ánh xạ nhãn |
| `resourceId` | `resource_id` | **chuỗi** hoặc `null` (vd. `"7"`, số điện thoại, `cdrId`) |
| `ipAddress`, `userAgent` | `ip_address`, `user_agent` | chuỗi hoặc `null` (`SYSTEM` luôn `null`) |
| `actionDetails` | `action_details` | đối tượng JSON gốc (đã parse, không phải chuỗi) hoặc `null`; cấu trúc theo danh mục mục 13, không chứa mật khẩu |
| `createdAt` | `created_at` | ISO 8601 `+07:00` |

```json
{
  "success": true,
  "statusCode": 200,
  "message": "OK",
  "data": [
    {
      "id": 90412,
      "actorType": "ADMIN",
      "actorId": 1,
      "actorName": "Nguyễn Văn Root",
      "action": "PASSWORD_RESET",
      "resourceName": "AUTH",
      "resourceId": "7",
      "ipAddress": "10.10.1.15",
      "userAgent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36",
      "actionDetails": { "targetActorType": "ADMIN", "revokedCount": 2 },
      "createdAt": "2026-11-05T09:12:44+07:00"
    },
    {
      "id": 90398,
      "actorType": "SYSTEM",
      "actorId": null,
      "actorName": "partition-maintenance",
      "action": "PURGE_CDR_PARTITION",
      "resourceName": "CDR",
      "resourceId": null,
      "ipAddress": null,
      "userAgent": null,
      "actionDetails": null,
      "createdAt": "2026-11-01T02:00:05+07:00"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 2, "totalPages": 1, "hasNext": false, "hasPrev": false },
  "timestamp": "2026-11-05T09:15:00+07:00"
}
```

- **Lỗi**: `400 VALIDATION_ERROR` (tham số theo bảng trên), `401 UNAUTHORIZED`, `403 FORBIDDEN` (thiếu `audit:view`, token `PASSWORD_CHANGE_ONLY`). Không có `404`/`409`.
- `PASSWORD_RESET` ghi `resource_name = 'AUTH'`; muốn xem mọi việc làm lên một Admin thì lọc `resourceName=ADMIN&resourceId=<id>` (khóa, mở khóa, sửa, ngừng hoạt động) và `resourceName=AUTH&resourceId=<id>` (đặt lại mật khẩu, thu hồi phiên).

### 3.5. Tình trạng tiến trình nền (`GET /api/v1/admin/system/jobs`)

- **Guard**: `AdminAuthGuard`, `Permission: system:manage`. Chỉ đọc, không ghi `audit_logs`.
- **Response** `200`, `data`:
  - `jobs[]`: mỗi dòng `worker_job_status` (`docs/01_database_schema.md` mục 2.3), thứ tự cố định như bảng lịch chạy: `jobName`, `status` (`IDLE` | `RUNNING` | `ERROR`), `lastStartedAt`, `lastFinishedAt`, `lastSuccessAt`, `lastDurationMs`, `consecutiveFailures`, `lastError`, `lastErrorAt`, `lastResult` (JSON gốc, có thể `null`), và `isStale` (boolean do API tính: `cdr-enrichment` khi `lastSuccessAt` cũ hơn 10 phút; job theo lịch khi `lastSuccessAt` cũ hơn 2 lần chu kỳ của nó, vd. `stats-aggregation` 20 phút, `session-cleanup` 48 giờ, `partition-maintenance` 32 ngày; `lastSuccessAt` NULL thì `true`).
  - `enrichment`: `lastProcessedCdrId`, `recordsEnrichedTotal`, `lastNewCdrSeenAt`, `qosAlertEvaluatedUntil`, `cdrPurgedBefore` (từ `cdr_enrichment_state`), `quarantinedCount` (`COUNT(*)` của `cdr_enrichment_errors`), `statsQueueSize` (`COUNT(*)` của `stats_recompute_queue`), `emailPendingCount` (số dòng `notification_recipients.email_status = 'PENDING'`, qua `idx_nr_email_status`).
- Không trả `lag` theo số bản ghi `cdr` chưa làm giàu, vì API không đọc bảng `cdr` (`docs/01_database_schema.md` mục 15).

### 3.6. Danh sách CDR bị cách ly (`GET /api/v1/admin/system/enrichment-errors`)

- **Guard**: `AdminAuthGuard`, `Permission: system:manage`.
- **Query**: `page` (mặc định 1), `limit` (mặc định 20, tối đa 100). Sắp xếp `last_failed_at` giảm dần.
- **Phần tử**: `cdrId`, `cdrCreated`, `errorMessage`, `attempts`, `firstFailedAt`, `lastFailedAt` (`docs/01_database_schema.md` mục 2.4). Khung phân trang theo `docs/02_api_contracts.md` mục 2.2.

### 3.7. Làm giàu lại một CDR bị cách ly (`POST /api/v1/admin/system/enrichment-errors/:cdrId/retry`)

- **Guard**: `AdminAuthGuard`, `Permission: system:manage`. Không có body.
- Chạy `CdrEnrichmentService.enrichOne(cdrId)` theo `docs/01_database_schema.md` mục 2.4 (thường sau khi đã sửa dữ liệu nguồn hoặc phát hành bản sửa lỗi code).
- `200` với `data = { cdrId, enriched: true }`: đã ghi `cdr_enriched`, xóa dòng cách ly. `404 NOT_FOUND`: `cdrId` không có trong `cdr_enrichment_errors`. `422 ENRICHMENT_FAILED`: vẫn lỗi, `errors = { message }`, `attempts` tăng 1.
- Ghi `audit_logs` `SYSTEM / RETRY_ENRICHMENT` (`resource_id` = `cdrId`, `action_details = { "success": true|false }`).

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
| `audit-logs` | `AuditLogSection.vue` | `audit:view` | "Nhật ký kiểm toán", ánh xạ `#section-audit-logs` của `templates/admin/system-settings.html` (mục 3.4), chỉ đọc. **Bộ lọc**: "Từ ngày"/"Đến ngày" (mặc định 7 ngày gần nhất tính cả hôm nay; frontend chặn trước khi gọi: thiếu ngày, `fromDate > toDate`, quá 31 ngày → báo dưới ô, không gọi API), "Loại tác nhân" (`actorType`: Quản trị viên/Người dùng/Hệ thống), "Đối tượng" (`resourceName`, 10 giá trị), "Hành động" (`action`, 30 mã, nhãn theo `docs/modules/09_admin_profile.md` mục 5.1). **Không** có ô nhập `actorId`/`resourceId`: bấm tên tác nhân ở một dòng (có `actorId`) lọc theo `actorType` + `actorId` của dòng đó; bấm "Lọc theo đối tượng" trong hộp chi tiết (dòng có `resourceId`) lọc `resourceName` + `resourceId`; bộ lọc đang áp hiện thành chip có nút bỏ. Đổi lọc về trang 1, chỉ hiển thị request sau cùng (như `docs/modules/04_auth_admin.md` mục 5.2). **Bảng** `limit = 20`: Thời gian, Tác nhân (tên + nhãn loại; `actorId = null` không bấm được), Hành động (nhãn), Đối tượng (`resourceName` + `resourceId`), IP; bấm dòng mở hộp chi tiết chỉ đọc: đủ 11 trường, `userAgent` nguyên văn, `actionDetails` dạng JSON thụt lề (`null` → "Không có"). Nhãn `resourceName`: `AUTH` "Xác thực", `CDR` "CDR", `AUDIO` "Ghi âm", `REPORT` "Báo cáo", `USER` "Người dùng", `ADMIN` "Quản trị viên", `USER_GROUP` "Nhóm người dùng", `PREFIX` "Đầu số", `ORGANIZATION` "Đơn vị", `SYSTEM` "Hệ thống"; ô "Hành động" nhóm 30 mã theo `optgroup` (Xác thực; Ghi âm, CDR & báo cáo; Tài khoản, nhóm & đơn vị; Đầu số; Hệ thống). Dòng `LOGIN_FAILED`, `ACCESS_DENIED`, `TOKEN_REUSE_DETECTED` có vạch cảnh báo. Nhãn hành động dùng chung bảng `docs/modules/09_admin_profile.md` mục 5.1; quy tắc "Cập nhật hồ sơ của tôi" ở đây đọc là "Tự cập nhật hồ sơ" khi `actorType = resourceName = ADMIN` (hoặc `USER`) và `actorId = resourceId`. Trạng thái tải/lỗi (nút thử lại)/rỗng (khác thông điệp khi có lọc); `400` từ API hiện dưới ô theo `errors[field]`. Mẫu `mockGetAuditLogs`, `loadAuditLogs`, `openAuditDetail` |
| `jobs` | `WorkerJobsSection.vue` | `system:manage` | "Tình trạng tiến trình nền": bảng `GET /api/v1/admin/system/jobs` (mục 3.5), mỗi job một dòng với badge trạng thái (`IDLE` xanh, `RUNNING` xanh dương, `ERROR` đỏ, `isStale` cam "Không hoạt động"), thời điểm thành công gần nhất, số lần lỗi liên tiếp, lỗi gần nhất (mở rộng xem đủ); thẻ số liệu `enrichment`; tự làm mới mỗi 30 giây. Bên dưới là bảng CDR bị cách ly (mục 3.6) với nút "Làm giàu lại" từng dòng (mục 3.7) |

---

## 6. Kịch bản kiểm thử (Test Plan for Agent)

1. **TC-SET-01**: Giá trị mặc định là `^[1-9]\d{4}$`. Thay đổi thành `^[4-9]\d{4}$`, lưu thành công và kiểm tra các CDR mới làm giàu sau thời điểm lưu coi số `1xxxx` là số ngoài kho (`caller_group_id`/`called_group_id = NULL`). Bản ghi đã làm giàu trước đó không bị tính lại.
2. **TC-SET-02**: Thay đổi chu kỳ lưu trữ online từ 6 tháng thành 12 tháng, xác nhận giá trị cập nhật thành công trong bảng `system_settings`.
3. **TC-SET-03**: Gọi `POST /api/v1/admin/settings/reload-cache` sau khi sửa trực tiếp `phone_numbers.range_id` trong DB, xác nhận CDR làm giàu sau đó dùng nhóm sở hữu mới.
4. **TC-SET-04**: Bật Chế độ bảo trì: đăng nhập User trả `503 MAINTENANCE`, `GET /api/v1/auth/me` và `POST /api/v1/auth/refresh` vẫn trả `200`; Admin Portal và job tổng hợp vẫn hoạt động.
5. **TC-SET-05**: Dừng `backend-worker` 11 phút: `GET /admin/system/jobs` trả `cdr-enrichment.isStale = true`; có đúng 1 thông báo `SYSTEM_JOB` `CRITICAL` dù chạy 2 instance API. Chạy lại worker: các dòng đang `RUNNING` chuyển `ERROR` ("Tiến trình dừng khi job đang chạy"), có thông báo `SYSTEM_JOB` `INFO`, email `CRITICAL` được gửi sau khi worker chạy. Ban đêm không có CDR mới: `last_success_at` vẫn cập nhật, không báo `SYSTEM_JOB`.
6. **TC-SET-06**: Chèn vào `cdr` một bản ghi làm hàm làm giàu ném lỗi dữ liệu, giữa 2 bản ghi lành cùng batch: 2 bản ghi lành có trong `cdr_enriched`, bản ghi lỗi có trong `cdr_enrichment_errors`, watermark vượt qua nó, có 1 thông báo `SYSTEM_JOB` `WARNING` trong ngày. Ngắt DB giữa batch: không có dòng cách ly nào, watermark giữ nguyên. Sửa dữ liệu rồi gọi `POST /admin/system/enrichment-errors/:cdrId/retry`: `200`, dòng cách ly bị xóa, khung giờ vào `stats_recompute_queue`, `audit_logs` có `RETRY_ENRICHMENT`; gọi khi vẫn lỗi: `422 ENRICHMENT_FAILED`, `attempts` tăng.
