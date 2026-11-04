# MODULE 05: BẢNG ĐIỀU KHIỂN & BÁO CÁO THỐNG KÊ (DASHBOARD & ANALYTICS)

## Đường dẫn tài liệu: `docs/modules/05_dashboard_analytics.md`

## Ánh xạ giao diện mẫu:
- **Khu vực Admin – Dashboard Quản trị viên hệ thống**: `templates/admin/dashboard.html` (+ `.css`, `.js`) → `src/apps/admin/views/dashboard/DashboardView.vue`, route `admin.dashboard` (`/admin/`), API base `/api/v1/admin/dashboard/*`.
- **Khu vực Member – Dashboard Thành viên đơn vị**: `templates/member/dashboard.html` (+ `.css`, `.js`) → `src/apps/member/views/dashboard/DashboardView.vue`, route `member.dashboard` (`/`), API base `/api/v1/dashboard/*`.

Hai view là 2 file riêng trong 2 khu vực; phần giống nhau (thẻ KPI, `LineChart`/`BarChart`, bảng cuộc gọi gần đây) dùng component trong `src/shared/components`.

---

## 1. Mục tiêu & Nghiệp vụ (Business Overview)

### 1.1. Bối cảnh nghiệp vụ phân quyền 2 Phân hệ Dashboard
Hệ thống EVN CDRAS phân tách rõ ràng giao diện Bảng điều khiển (Dashboard) thành 2 phân hệ chuyên biệt theo nguyên tắc **Group-Based Data Isolation (Cô lập dữ liệu theo nhóm người dùng)**:

> [!NOTE]
> **Phạm vi số liệu Dashboard trong phiên bản này**:
> Toàn bộ số liệu KPI, biểu đồ lưu lượng và chất lượng trên Dashboard được tính toán và bóc tách **100% theo Nhóm người dùng (`user_groups`, bảng `stats_hourly` và `stats_daily` với `group_id`)**. Cây tổ chức chỉ đóng vai trò phân cấp tham chiếu trực quan và không tham gia tính toán thống kê.

1. **Dashboard Quản trị viên hệ thống (`ROOT_ADMIN` & `SYSTEM_ADMIN`)**:
   - Cung cấp bức tranh toàn cảnh về toàn bộ hạ tầng mạng thoại IP PABX nội bộ EVN toàn quốc (máy cố định 5 số: `10000 ➔ 99999`).
   - Giám sát toàn bộ kho số 90.000 số của Tập đoàn theo trạng thái thật: Đang dùng (`ALLOCATED`), Dự phòng (`RESERVED`), Khóa (`LOCKED`), Rảnh (`FREE`), lấy từ `GET /api/v1/admin/phone-numbers/pool/summary`.
   - Đánh giá tổng lưu lượng, tỷ lệ kết nối ASR và chất lượng thoại MOS G.107 trên toàn hệ thống và theo từng đơn vị thành viên.
   - Theo dõi lưu lượng và chất lượng của từng nhóm người dùng (bảng giám sát và biểu đồ Top 10 nhóm).

2. **Dashboard Thành viên đơn vị (`GROUP_ADMIN`, `USER_RECORDING`, `REGULAR_USER`)**:
   - Dữ liệu bị cô lập hoàn toàn theo nhóm người dùng của phiên đăng nhập (Ví dụ: `EVNICT Đà Nẵng` sở hữu dải `51xxx`).
   - Tập trung vào **3 hướng cuộc gọi của đơn vị**: Gọi nội bộ đơn vị (`calls_intra_group`), Gọi đi ngoại đơn vị (`calls_outbound`), và Gọi đến từ ngoại đơn vị (`calls_inbound`).
   - Giám sát dải số cấp phát của đơn vị: số dải, tổng số trong dải, và số lượng theo trạng thái (`ALLOCATED`, `RESERVED`, `LOCKED`) lấy từ `counts` của từng dải trong `GET /api/v1/prefixes`.
   - Theo dõi 5 cuộc gọi gần nhất của đơn vị qua `GET /api/v1/dashboard/recent-calls` (danh sách từng cuộc gọi, được phép đọc `cdr_enriched` theo nguyên tắc tại `docs/01_database_schema.md` mục 15).

---

### 1.2. Các chỉ số KPI cốt lõi trên 2 Dashboard

#### A. Dashboard Quản trị viên hệ thống (Khu vực Admin, `templates/admin/dashboard.html`)
| Thẻ KPI | Ý nghĩa nghiệp vụ | Nguồn tính toán (Zero CDR Scan) |
| :--- | :--- | :--- |
| **Tổng Cuộc Gọi Toàn Mạng** | Tổng số cuộc gọi phát sinh toàn EVN | `SUM(total_calls) FROM stats_daily` |
| **Tổng Thời Lượng (Phút)** | Tổng thời gian đàm thoại thực tế | `ROUND(SUM(total_duration_sec) / 60) FROM stats_daily` |
| **Tỉ Lệ Thành Công (ASR)** | Tỉ lệ cuộc gọi `call_status = ANSWERED` (SIP 200 OK) trên tổng cuộc gọi | `SUM(answered_calls) / NULLIF(SUM(total_calls), 0) * 100%` (cộng bộ đếm rồi mới chia, không lấy trung bình `asr_percentage`) |
| **Điểm MOS Trung Bình** | Chất lượng âm thanh chuẩn ITU-T G.107 (thang thập phân tính từ R, xem `docs/01_database_schema.md` mục 2.1) | `SUM(avg_mos * qos_sample_count) / NULLIF(SUM(qos_sample_count), 0) / 100` từ `stats_*`; hiển thị 2 chữ số thập phân, `--` khi không có mẫu |

#### B. Dashboard Thành viên đơn vị (Khu vực Member, `templates/member/dashboard.html`)
| Thẻ KPI | Ý nghĩa nghiệp vụ | Nguồn tính toán (Group Isolation) |
| :--- | :--- | :--- |
| **Tổng Cuộc Gọi Đơn Vị** | Cuộc gọi phát sinh liên quan đến dải số của nhóm | `SUM(total_calls) WHERE group_id = :userGroupId` |
| **Thời Lượng Đàm Thoại** | Tổng phút đàm thoại của nhóm | `ROUND(SUM(total_duration_sec) / 60) WHERE group_id = :userGroupId` |
| **Tỉ Lệ Trả Lời (ASR) Đơn Vị**| Tỷ lệ bắt máy của đơn vị (không so với toàn EVN: bản User không đọc dòng toàn hệ thống) | `SUM(answered_calls) / NULLIF(SUM(total_calls), 0) * 100%` (nhóm) |
| **Tỷ Trọng Gọi Nội Bộ (%)** | % cuộc gọi nội bộ nhóm / Tổng cuộc gọi phát sinh | `SUM(calls_intra_group) / SUM(total_calls) * 100%` |

---

## 2. Thiết kế Dữ liệu & Cơ chế Thống kê Sẵn (Zero CDR Scan Architecture)

> [!IMPORTANT]
> **Quy chuẩn hiệu năng cao**: mọi thẻ KPI và biểu đồ của Dashboard **chỉ đọc `stats_hourly` / `stats_daily`**, không tính toán trên `cdr` hay `cdr_enriched`. Ngoại lệ duy nhất là bảng "Cuộc gọi gần đây" (danh sách từng cuộc gọi, có giới hạn 24 giờ và tối đa 20 dòng).
> Thay vào đó, Backend NestJS sử dụng tiến trình nền `@nestjs/schedule` định thời tính toán sẵn vào 2 bảng `stats_hourly` và `stats_daily`. Khi người dùng mở Dashboard, API chỉ thực hiện các câu lệnh `SELECT` siêu tốc trên các bảng thống kê này (thời gian phản hồi $< 30\text{ms}$).

### 2.1. Quy tắc phân định nguồn dữ liệu theo chu kỳ truy vấn

| Chu kỳ chọn trên giao diện | Bảng dữ liệu đích | Điều kiện truy vấn SQL | Mục đích hiển thị |
| :--- | :--- | :--- | :--- |
| **Hôm nay (`period=today`)** | `stats_hourly` | `WHERE stat_date = :today AND (:groupId IS NULL AND group_id IS NULL OR group_id = :groupId)` | Tính toán 4 thẻ KPI trong ngày và vẽ biểu đồ 24 giờ. Quét tối đa 24 dòng. |
| **7 ngày qua (`period=last_7_days`)** | `stats_daily` | `WHERE stat_date BETWEEN :today - INTERVAL 6 DAY AND :today ...` | Tổng hợp KPI 7 ngày và vẽ biểu đồ biến thiên theo từng ngày. Quét tối đa 7 dòng. |
| **Tháng này (`period=this_month`)** | `stats_daily` | `WHERE stat_date BETWEEN :firstDayOfMonth AND :today ...` | Tổng hợp KPI tháng và vẽ biểu đồ biến thiên theo từng ngày. Quét tối đa 30 dòng. |
| **Khoảng ngày tùy chọn (`custom`)** | `stats_daily` | `WHERE stat_date BETWEEN :fromDate AND :toDate ...` | Tổng hợp KPI và biểu đồ cho bất kỳ dải ngày nào trong quá khứ hoặc hiện tại. |

---

### 2.2. Câu lệnh SQL Query API KPI Thống kê (Read-Only)

> [!IMPORTANT]
> Mỗi truy vấn chỉ đọc **một phạm vi duy nhất**: hoặc dòng toàn hệ thống (`group_id IS NULL`), hoặc dòng của một nhóm. `SUM` chỉ cộng theo thời gian, **không bao giờ cộng nhiều nhóm** với nhau (quy tắc quy chiếu lưu lượng tại `docs/01_database_schema.md` mục 15).
> - **Dashboard Admin (toàn hệ thống)**: hiển thị 3 chiều theo `call_type`: `calls_intra_group`, `calls_inter_group`, `calls_unassigned` ("Chưa xác định nhóm").
> - **Dashboard nhóm**: hiển thị 3 hướng `calls_intra_group`, `calls_outbound`, `calls_inbound`.

```sql
-- 1. Truy vấn KPI cho ngày hôm nay (từ bảng stats_hourly):
SELECT 
    COALESCE(SUM(total_calls), 0) AS total_calls,
    COALESCE(SUM(calls_outbound), 0) AS calls_outbound,
    COALESCE(SUM(calls_inbound), 0) AS calls_inbound,
    COALESCE(SUM(calls_intra_group), 0) AS calls_intra_group,
    COALESCE(SUM(calls_inter_group), 0) AS calls_inter_group,   -- chỉ có giá trị ở dòng toàn hệ thống
    COALESCE(SUM(calls_unassigned), 0) AS calls_unassigned,     -- chỉ có giá trị ở dòng toàn hệ thống
    COALESCE(SUM(answered_calls), 0) AS answered_calls,
    COALESCE(ROUND(SUM(total_duration_sec) / 60), 0) AS total_duration_minutes,
    ROUND(COALESCE(SUM(answered_calls), 0) / NULLIF(SUM(total_calls), 0) * 100, 2) AS asr_percentage,
    ROUND(SUM(avg_mos * qos_sample_count) / NULLIF(SUM(qos_sample_count), 0) / 100, 2) AS avg_mos -- NULL khi không có mẫu QoS
FROM stats_hourly
WHERE stat_date = :today  -- :today do backend tính theo giờ Việt Nam
  AND (
    (:isSystemAdmin = 1 AND :filterGroupId IS NULL AND group_id IS NULL) OR
    (:isSystemAdmin = 1 AND :filterGroupId IS NOT NULL AND group_id = :filterGroupId) OR
    (:isSystemAdmin = 0 AND group_id = :currentUserGroupId)
  );

-- 2. Truy vấn KPI cho chu kỳ ngày/tháng/tùy chọn (từ bảng stats_daily):
SELECT 
    COALESCE(SUM(total_calls), 0) AS total_calls,
    COALESCE(SUM(calls_outbound), 0) AS calls_outbound,
    COALESCE(SUM(calls_inbound), 0) AS calls_inbound,
    COALESCE(SUM(calls_intra_group), 0) AS calls_intra_group,
    COALESCE(SUM(calls_inter_group), 0) AS calls_inter_group,   -- chỉ có giá trị ở dòng toàn hệ thống
    COALESCE(SUM(calls_unassigned), 0) AS calls_unassigned,     -- chỉ có giá trị ở dòng toàn hệ thống
    COALESCE(SUM(answered_calls), 0) AS answered_calls,
    COALESCE(ROUND(SUM(total_duration_sec) / 60), 0) AS total_duration_minutes,
    ROUND(COALESCE(SUM(answered_calls), 0) / NULLIF(SUM(total_calls), 0) * 100, 2) AS asr_percentage,
    ROUND(SUM(avg_mos * qos_sample_count) / NULLIF(SUM(qos_sample_count), 0) / 100, 2) AS avg_mos -- NULL khi không có mẫu QoS
FROM stats_daily
WHERE stat_date BETWEEN :fromDate AND :toDate
  AND (
    (:isSystemAdmin = 1 AND :filterGroupId IS NULL AND group_id IS NULL) OR
    (:isSystemAdmin = 1 AND :filterGroupId IS NOT NULL AND group_id = :filterGroupId) OR
    (:isSystemAdmin = 0 AND group_id = :currentUserGroupId)
  );
```

---

## 3. Đặc tả API Contracts

### 3.1. `GET /api/v1/dashboard/stats`

- **Query params**: tham số `period` theo bộ giá trị chung tại `docs/02_api_contracts.md` mục 1.1 (mặc định `today`), `fromDate`, `toDate`, `groupId` (tùy chọn, chỉ bản Admin; bản User luôn dùng `token.userGroupId`, gửi `groupId` lên trả `400` theo `docs/02_api_contracts.md` mục 1.1)
- **Response**:

```json
{
  "success": true,
  "statusCode": 200,
  "message": "Lấy số liệu KPI thành công",
  "data": {
    "scope": "SYSTEM", // "SYSTEM" | "GROUP"
    "groupId": null,
    "groupName": "Toàn Tập đoàn EVN",
    "totalCalls": {
      "value": 1245600,
      "formatted": "1,245,600",
      "trend": 12.0,
      "trendLabel": "+12% so với kỳ trước",
      "trendType": "positive"
    },
    "durationMinutes": {
      "value": 3845200,
      "formatted": "3,845,200",
      "trend": 5.4,
      "trendLabel": "+5.4% so với kỳ trước",
      "trendType": "positive"
    },
    "asr": {
      "value": 82.5,
      "formatted": "82.5%",
      "trend": 1.2,
      "trendLabel": "+1.2% so với kỳ trước",
      "trendType": "positive"
    },
    "avgMos": {
      "value": 4.18,
      "formatted": "4.18/5.0",
      "qualityLabel": "Xuất sắc",
      "trendType": "positive"
    },
    "intraRatio": {
      "value": 68.5,
      "formatted": "68.5%",
      "label": "Tỷ trọng gọi nội bộ nhóm"
    }
  }
}
```

- **`trend`** = % thay đổi so với **kỳ liền trước cùng số ngày**, cùng phạm vi (toàn hệ thống hoặc cùng nhóm), đọc `stats_*` như kỳ đang xem: `today` so với hôm qua đến cùng giờ; `yesterday` so với hôm kia; `last_7_days` so với 7 ngày trước đó; `this_week`/`this_month` so với cùng số ngày đầu tuần/tháng trước; `last_month` so với tháng liền trước nữa; `custom` so với khoảng cùng số ngày ngay trước `fromDate`. `trend = null` (và không có `trendLabel`/`trendType`) khi kỳ trước không có dữ liệu (mẫu số bằng 0). `trendType` theo dấu của `trend`.

### 3.2. `GET /api/v1/dashboard/charts`

- **Guard**: `UserAuthGuard` (bản Admin: `/api/v1/admin/dashboard/charts`, `AdminAuthGuard`, nhận thêm `groupId`). Không cần mã quyền.
- **Query params**: tham số `period` theo bộ giá trị chung tại `docs/02_api_contracts.md` mục 1.1 (mặc định `today`).
- **Nguồn**: `today` đọc `stats_hourly` (24 điểm theo giờ); các kỳ khác đọc `stats_daily` (mỗi ngày một điểm). Chỉ đọc đúng một phạm vi (toàn hệ thống hoặc một nhóm).
- **Response**:

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "granularity": "hour",
    "labels": ["00", "01", "02"],
    "series": {
      "totalCalls": [12, 4, 0],
      "answeredCalls": [10, 3, 0],
      "totalDurationSec": [1840, 512, 0],
      "asrPercentage": [83.33, 75.0, null],
      "avgMos": [4.38, 4.41, null],
      "callsIntraGroup": [3, 1, 0],
      "callsOutbound": [5, 2, 0],
      "callsInbound": [4, 1, 0]
    }
  }
}
```

- Khung không có cuộc gọi: bộ đếm = `0`, tỷ lệ và MOS = `null`. Ở phạm vi toàn hệ thống, ba chuỗi hướng gọi thay bằng `callsIntraGroup`, `callsInterGroup`, `callsUnassigned` (quy tắc quy chiếu lưu lượng `docs/01_database_schema.md` mục 15).

---

## 4. Kiến trúc Backend NestJS (`backend/src/core`, `apps/*`)

Theo quy tắc `docs/00_overview_and_architecture.md` mục 5.1: nghiệp vụ và entity ở `core`, controller ở `apps/admin` / `apps/member`, job nền ở `apps/worker`; các phần `apps/*` không import lẫn nhau.

```
backend/src/
├── core/dashboard/
│   ├── dashboard.module.ts
│   ├── dashboard.service.ts            <-- KPI, biểu đồ, cuộc gọi gần đây, xếp hạng nhóm; nhận scope SYSTEM | GROUP
│   └── dto/
│       ├── dashboard-stats-query.dto.ts
│       └── dashboard-chart-query.dto.ts
├── apps/admin/dashboard/
│   ├── admin-dashboard.module.ts
│   └── dashboard.controller.ts         <-- /api/v1/admin/dashboard/stats, charts, recent-calls, groups
├── apps/admin/stats/
│   ├── admin-stats.module.ts
│   └── stats.controller.ts             <-- POST /api/v1/admin/stats/recalculate (ghi stats_recompute_queue qua core/stats)
└── apps/member/dashboard/
    ├── member-dashboard.module.ts
    └── dashboard.controller.ts         <-- /api/v1/dashboard/stats, charts, recent-calls (scope GROUP)
```

### 4.1. Tự động Scoped Data theo vai trò người dùng trong `dashboard.service.ts`

```typescript
async getDashboardData(user: CurrentUserPayload, query: DashboardStatsQueryDto) {
  // Claim token: roleCode (cả hai cổng); userGroupId chỉ có ở token User (docs/modules/03_auth_user.md)
  const isSystemAdmin = [Role.ROOT_ADMIN, Role.SYSTEM_ADMIN].includes(user.roleCode);
  // DTO bản User không có groupId (gửi lên bị ValidationPipe trả 400), nên query.groupId chỉ có ở bản Admin
  const targetGroupId = isSystemAdmin ? (query.groupId || null) : user.userGroupId;

  return this.statsService.getAggregatedKPI({
    period: query.period,
    fromDate: query.fromDate,
    toDate: query.toDate,
    isSystemAdmin,
    groupId: targetGroupId,
  });
}
```

---

## 5. Kiến trúc Frontend & Giao diện Chuẩn hóa

| | Khu vực Admin | Khu vực Member |
| :--- | :--- | :--- |
| View | `src/apps/admin/views/dashboard/DashboardView.vue` | `src/apps/member/views/dashboard/DashboardView.vue` |
| Route | `admin.dashboard` (`/admin/`), chỉ cần đăng nhập (widget kho số cần `prefix:view`) | `member.dashboard` (`/`), chỉ cần đăng nhập |
| KPI, biểu đồ, cuộc gọi gần đây | `/api/v1/admin/dashboard/stats`, `/charts`, `/recent-calls` (toàn hệ thống) | `/api/v1/dashboard/stats`, `/charts`, `/recent-calls` (tự cô lập theo nhóm) |
| Chỉ có ở app này | `/api/v1/admin/dashboard/groups`, `/api/v1/admin/phone-numbers/pool/summary` | Widget dải số từ `GET /api/v1/prefixes` |

Các liên kết trong template (`*.html`) chuyển thành `router-link` tới route **trong cùng app**; không có liên kết hay nút chuyển sang dashboard của app kia (nút demo `.btn-demo-switch` trong template bị bỏ).

### 5.1. Dashboard Quản trị viên hệ thống (Khu vực Admin)
1. **Tiêu đề trang**:
   - Tiêu đề: "Tổng quan Hệ thống EVN CDRAS" - Toàn Tập đoàn Điện lực Việt Nam. Không có nút chuyển sang Dashboard thành viên (hai app tách riêng).
2. **4 Thẻ KPI toàn hệ thống**:
   - Tổng Cuộc Gọi Toàn Mạng (`1,245,600`).
   - Tổng Thời Lượng Đàm Thoại (`3,845,200` phút).
   - Tỉ Lệ Thành Công ASR (`82.5%`).
   - Điểm MOS Trung Bình (`4.18/5.0`).
3. **Widget Kho số PABX EVN (90.000 số: 10000 ➔ 99999)**:
   - Tổng kho 90.000 số và 4 ô theo trạng thái từ `pool/summary`: Đang dùng (`ALLOCATED`), Dự phòng (`RESERVED`), Khóa (`LOCKED`), Rảnh (`FREE`).
   - Thanh phân bổ màu 4 phần tương ứng 4 trạng thái.
   - Nút liên kết sang route `admin.prefixes` (template: `prefix-management.html`).
4. **2 Biểu đồ toàn mạng**:
   - `quantityChart`: Số cuộc gọi & thời lượng theo thời gian (giờ/ngày, từ `GET /api/v1/admin/dashboard/charts`).
   - `qualityChart`: ASR % & MOS G.107 toàn hệ thống theo thời gian.
   - `topGroupsChart`: **Top 10 nhóm người dùng theo lưu lượng** trong kỳ, từ `GET /api/v1/admin/dashboard/groups?limit=10&sort=totalCalls` (đọc từng dòng nhóm của `stats_daily` (không cộng các nhóm thành tổng).
5. **Bảng Giám sát các Nhóm người dùng** (`GET /api/v1/admin/dashboard/groups`, có phân trang và sắp xếp):
   - Cột: Nhóm người dùng, Dải số quy hoạch, Lưu lượng hôm nay, Thời lượng, ASR %, MOS G.107 (đọc các dòng nhóm của `stats_hourly` hôm nay). Không có cột trạng thái Trunk SIP (không có nguồn dữ liệu).

### 5.2. Dashboard Thành viên đơn vị (Khu vực Member)
1. **Tiêu đề trang & Huy hiệu Nhóm**:
   - Tiêu đề: "Tổng quan Đơn vị - EVNICT Đà Nẵng".
   - Huy hiệu nhận diện nhóm: `Group Isolation: 51xxx`.
2. **4 Thẻ KPI chuyên biệt cho Đơn vị**:
   - Tổng Cuộc Gọi Đơn Vị (`42,350` cuộc).
   - Thời Lượng Đàm Thoại (`148,200` phút).
   - Tỉ Lệ Trả Lời ASR Đơn Vị (`84.2%`).
   - Tỷ Trọng Gọi Nội Bộ (`68.5%`).
3. **Widget Dải số Cấp phát cho Đơn vị** (từ `GET /api/v1/prefixes`, mỗi dải có `counts { total, allocated, reserved, locked }`):
   - Dải số EVN cấp riêng cho nhóm: `51000 ➔ 51999` (Tổng 1.000 số).
   - 4 ô thống kê: Số dải được cấp, Tổng số trong dải, Dự phòng (`RESERVED`), Khóa (`LOCKED`); số còn lại là `ALLOCATED` (đang dùng).
   - Thanh phân bổ theo trạng thái trong các dải của nhóm.
   - Nút liên kết sang route `member.org-prefix` (template: `org-prefix.html`).
4. **2 Biểu đồ chuyên biệt cho Đơn vị**:
   - `unitTrafficChart`: Biểu đồ Cột xếp chồng 3 màu Lưu lượng 3 hướng gọi (Nội bộ đơn vị `calls_intra_group`, Gọi đi ngoại đơn vị `calls_outbound`, Gọi đến từ ngoại đơn vị `calls_inbound`).
   - `unitQualityChart`: Biểu đồ Đường kép Chất lượng cuộc gọi QoS & Tỷ lệ trả lời ASR của đơn vị (ASR % và Điểm MOS G.107).
5. **Bảng 5 Cuộc gọi Gần nhất của Đơn vị**:
   - Hiển thị 5 cuộc gọi gần nhất của nhóm từ `GET /api/v1/dashboard/recent-calls?limit=5` (Thời gian, Hướng gọi, Caller, Called, Thời lượng, Mã SIP, Điểm MOS).
   - Nút liên kết sang route `member.cdr` (template: `cdr-history.html`).
6. **Sidebar Menu**: lấy từ `src/apps/member/menu.ts` (nhóm "Đầu số & Đơn vị", "Thành viên đơn vị"). Khu vực Member không có route "Cài đặt hệ thống" hay kho số chung 90.000 số, nên menu không có các mục này.

---

## 6. Kịch bản kiểm thử (Test Plan for Agent)

1. **TC-DASH-01**: Đăng nhập khu vực Admin, mở `/admin/`, xác nhận hiển thị số liệu toàn mạng EVN (Kho số 90.000 số, ASR 82.5%, MOS 4.18) và bảng giám sát 5 đơn vị EVN.
2. **TC-DASH-02**: Đăng nhập khu vực Member, mở `/`, xác nhận Dashboard chỉ hiển thị số liệu của nhóm mình và không có nút chuyển sang Dashboard Admin.
3. **TC-DASH-03**: Trên Dashboard khu vực Member (`member.dashboard`), xác nhận hiển thị huy hiệu `Group Isolation: 51xxx`, 4 KPI chuyên biệt của đơn vị và Widget dải số 1.000 số (`51000 ➔ 51999`).
4. **TC-DASH-04**: Thử nghiệm lọc biểu đồ 3 hướng gọi (`unitTrafficFilter`) và chất lượng QoS (`unitQualityFilter`) trên Dashboard Thành viên, xác nhận dữ liệu cập nhật mượt mà.
5. **TC-DASH-05**: Kiểm tra tính cô lập dữ liệu (Group-Based Data Isolation): Đảm bảo Dashboard khu vực Member không gọi API `/api/v1/admin/*` nào và không hiển thị kho số 90.000 số hay số liệu của các đơn vị khác ngoài `EVNICT Đà Nẵng`.
