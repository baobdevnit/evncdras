# MODULE 14: NGHIỆP VỤ THỐNG KÊ LƯU LƯỢNG & THỜI LƯỢNG CUỘC GỌI THOẠI IP EVN (CALL TRAFFIC & DURATION MONITORING)

## Đường dẫn tài liệu: `docs/modules/14_core_business_call_traffic.md`

## Ánh xạ cơ sở dữ liệu: `cdr_enriched` (cột `call_type`, `answered_duration_sec`, `is_primary_leg`), `stats_hourly`, `stats_daily`, `phone_prefix_ranges`, `phone_numbers`

---

## 1. Mục tiêu & Bối cảnh Nghiệp vụ (Business Overview)

### 1.1. Bối cảnh nghiệp vụ ghi nhận thời lượng & lưu lượng thoại tại EVN

Mạng tổng đài PABX do EVNICT quản lý phục vụ toàn bộ các Tổng công ty, Công ty và Đơn vị trực thuộc Tập đoàn Điện lực Việt Nam. Nhằm mục đích quản lý hạ tầng, giám sát năng lực mạng viễn thông dùng riêng và đối soát sản lượng thoại giữa các đơn vị thành viên:

> [!IMPORTANT]
> **Quy chuẩn Không tính cước (Zero Billing Principle)**:
> Hệ thống **hoàn toàn không tính cước tiền tệ (không áp đơn giá VNĐ, không tính block cước phí tài chính)** và **không khống chế hạn mức chi phí**. Hệ thống tập trung ghi nhận chính xác **thời gian đàm thoại thực tế (`answered_duration_sec`)** và **bóc tách lưu lượng theo 3 chiều cuộc gọi theo Nhóm người dùng (`user_groups`) trên toàn quốc**.
>
> Phần lớn cuộc gọi là mạng thoại nội bộ dùng riêng EVN giữa các máy lẻ 5 số `[H][C][XXX]` (kho 10000–99999). Dữ liệu thật vẫn có số ngoài kho (`Anonymous`, `0xxxx` dịch vụ đặc biệt, số di động, số không đủ 5 chữ số); phía đó có nhóm sở hữu = NULL. Hệ thống không phân tích cước hay hướng gọi công cộng thương mại.

1. **Bóc tách 3 chiều cuộc gọi theo Nhóm người dùng (3-Way Traffic Attribution)**:
   - **Cuộc gọi đi ngoại nhóm (`calls_outbound`)**: Máy của nhóm gọi tới máy thuộc nhóm khác (`INTER_GROUP`) hoặc tới số không thuộc nhóm nào (`UNASSIGNED`).
   - **Cuộc gọi đến từ ngoại nhóm (`calls_inbound`)**: Máy thuộc nhóm khác (`INTER_GROUP`) hoặc số không thuộc nhóm nào (`UNASSIGNED`) gọi tới máy của nhóm.
   - **Cuộc gọi nội bộ nhóm (`calls_intra_group` / `INTRA_GROUP`)**: Cuộc đàm thoại giữa hai máy cố định 5 số cùng thuộc quyền quản lý của một nhóm người dùng.
   - **Tổng cuộc gọi liên quan đến nhóm**: `total_calls = calls_outbound + calls_inbound + calls_intra_group`. Cuộc gọi tới/từ số chưa quy hoạch hoặc số ngoài kho (`call_type = UNASSIGNED`) vẫn tính là cuộc đi/đến của nhóm.
   - **Phạm vi toàn hệ thống** (`group_id IS NULL`): không có khái niệm đi/đến. Lưu lượng chia theo `call_type`: `calls_intra_group` + `calls_inter_group` + `calls_unassigned` = `total_calls`.
   - **Không cộng các nhóm để ra tổng hệ thống**: một cuộc `INTER_GROUP` là cuộc đi của nhóm gọi và cuộc đến của nhóm nhận. Bảng so sánh nhiều nhóm không có dòng "Tổng cộng"; số tổng lấy từ dòng toàn hệ thống. Quy tắc đầy đủ tại `docs/01_database_schema.md` mục 15.
   - **Đơn vị đếm là cuộc gọi**: chỉ tính các bản ghi `cdr_enriched` có `is_primary_leg = 1`. Leg phụ của cuộc gọi 2 leg không được đếm và không xuất hiện trong `/traffic/records` (quy tắc gộp leg tại `docs/01_database_schema.md` mục 2.1).
2. **Quy tắc ghi nhận thời lượng đàm thoại thực tế**:
   - Chỉ ghi nhận thời lượng đối với các cuộc gọi có trạng thái nhấc máy thành công (`cdr_enriched.call_status = 'ANSWERED'`, tức SIP 200 OK; trùng với `Answered IS NOT NULL` trên dữ liệu thật).
   - Thời lượng đàm thoại lấy từ cột `cdr_enriched.answered_duration_sec` (giây) = `ROUND(Answered_Duration / 1000)`. Cột thô `Answered_Duration` của PABX tính bằng **mili-giây**, không dùng trực tiếp.
   - Các cuộc gọi không thành công (bận máy, không trả lời, hủy cuộc, lỗi mạng) có thời lượng bằng $0\text{ giây}$.
3. **Phân bổ Nhóm người dùng phát sinh lưu lượng**:
   - Nhóm sở hữu `CallerId`/`CalledId` được xác định duy nhất qua `phone_numbers.range_id → phone_prefix_ranges.prefix_group_id → user_groups` (quy tắc tại `docs/01_database_schema.md` mục 8) và ghi vào `caller_group_id`/`called_group_id` trên `cdr_enriched`.

---

## 2. Thiết kế Cơ sở Dữ liệu

### 2.1. Nguồn dữ liệu lưu lượng

Module này **không có bảng riêng**. Bảng `call_duration_records` của thiết kế cũ đã bị loại bỏ. Mọi dữ liệu lưu lượng nằm trên `cdr_enriched` (định nghĩa tại `docs/01_database_schema.md` mục 2.1 và quy tắc phân loại tại mục 9), luôn lọc `is_primary_leg = 1`:

| Cột `cdr_enriched` | Ý nghĩa trong module |
|---|---|
| `caller_group_id`, `called_group_id` | Nhóm sở hữu số gọi / số nhận |
| `call_type` | `INTRA_GROUP` / `INTER_GROUP` / `UNASSIGNED` |
| `answered_duration_sec` | Thời lượng đàm thoại (giây), 0 nếu không nhấc máy |
| `call_status` | Kết cục cuộc gọi (`ANSWERED`, `BUSY`, `NO_ANSWER`, `FAILED`) |
| `Created` | Thời điểm khởi tạo cuộc gọi, dùng cho bộ lọc `fromDate`/`toDate` |

Số liệu tổng hợp (`/traffic/summary`) đọc từ `stats_daily` theo nguyên tắc Zero CDR Scan. Danh sách chi tiết (`/traffic/records`) là truy vấn từng cuộc gọi, đọc `cdr_enriched` qua chỉ mục (`caller_group_id`, `Created`) / (`called_group_id`, `Created`) / (`call_type`, `Created`).

---

## 3. Đặc tả API Contracts

### 3.1. Báo cáo tổng hợp lưu lượng theo Nhóm người dùng (`GET /api/v1/traffic/summary`)

- **Guard**: `UserAuthGuard` trên route User; bản sao `/api/v1/admin/...` dùng `AdminAuthGuard` (quy tắc tách portal tại `docs/02_api_contracts.md` mục 1.1). `Permission: cdr:view`
- **Query params**: tham số `period` theo bộ giá trị chung tại `docs/02_api_contracts.md` mục 1.1 (mặc định `this_month`), `groupId` (tùy chọn với Admin Portal; tự động gán theo token với Member Portal)
- **Response**:

```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "groupId": 1,
      "groupCode": "UMO-IT-01",
      "groupName": "Khối Công nghệ Thông tin - Nhóm Vận hành",
      "totalCalls": 4520,
      "totalDurationSeconds": 747000,
      "totalDurationMinutes": 12450,
      "callsOutbound": 1820,
      "callsInbound": 1450,
      "callsIntraGroup": 1250,
      "averageDurationPerCallSec": 165
    }
  ],
  "systemTotal": {
    "totalCalls": 31840,
    "callsIntraGroup": 9120,
    "callsInterGroup": 18650,
    "callsUnassigned": 4070
  }
}
```

- `data[]`: một phần tử cho mỗi nhóm (dòng `group_id = g`), dùng `callsOutbound`/`callsInbound`/`callsIntraGroup`.
- `systemTotal`: chỉ trả về cho Admin Portal khi không truyền `groupId`, đọc từ dòng `group_id IS NULL`. **Không** tính bằng cách cộng `data[]`.
- Thời lượng trung bình mỗi cuộc: `averageDurationPerCallSec = total_duration_sec / NULLIF(answered_calls, 0)`.

### 3.2. Tra cứu chi tiết bản ghi phân loại thời lượng cuộc gọi (`GET /api/v1/traffic/records`)

- **Guard**: `UserAuthGuard` trên route User; bản sao `/api/v1/admin/...` dùng `AdminAuthGuard` (quy tắc tách portal tại `docs/02_api_contracts.md` mục 1.1). `Permission: cdr:view`
- **Query params**: `fromDate`, `toDate` (bắt buộc, tối đa 31 ngày), `groupId` (chỉ bản Admin), `callerId`, `calledId`, `callType`, `page`, `limit` (≤ 100)
- **Nguồn**: `cdr_enriched WHERE is_primary_leg = 1 AND Created BETWEEN :fromDate AND :toDate` (cô lập nhóm: `caller_group_id = :g OR called_group_id = :g`).
- **Response**: Danh sách cuộc gọi kèm `cdrId` (`cdr_enriched.id` của leg chính), số gọi, số nhận, nhóm bên gọi, nhóm bên nhận, `callType` (`INTRA_GROUP`, `INTER_GROUP`, `UNASSIGNED`), `callStatus` và `durationSec` (= `answered_duration_sec`).

---

## 4. Kiến trúc Backend NestJS (`backend/src/modules/traffic/`)

```
traffic/
├── traffic.module.ts
├── traffic.controller.ts
├── traffic.service.ts
├── traffic-classifier.service.ts   <-- Phân loại Call Type, được tiến trình làm giàu CDR gọi khi ghi cdr_enriched.call_type
└── dto/
    ├── traffic-query.dto.ts
    └── traffic-summary.dto.ts
```

Module không có entity riêng; dùng entity `CdrEnriched` của module CDR (`docs/modules/12_core_business_cdr_and_audio.md`).

### 4.1. Implementation `TrafficClassifierService`

```typescript
@Injectable()
export class TrafficClassifierService {
  classifyCallType(callerGroupId: number | null, calledGroupId: number | null): CallTypeEnum {
    // 1. Cùng thuộc một nhóm người dùng
    if (callerGroupId && calledGroupId && callerGroupId === calledGroupId) {
      return CallTypeEnum.INTRA_GROUP;
    }

    // 2. Cuộc gọi giữa 2 nhóm người dùng khác nhau trong EVN
    if (callerGroupId && calledGroupId && callerGroupId !== calledGroupId) {
      return CallTypeEnum.INTER_GROUP;
    }

    // 3. Ít nhất một phía chưa quy hoạch cho nhóm nào hoặc là số ngoài kho (Anonymous, 0xxxx, di động...)
    return CallTypeEnum.UNASSIGNED;
  }
}
```

---

## 5. Kiến trúc Frontend Vue 3 (`frontend/apps/admin/src/views/traffic/TrafficSummaryView.vue` & `frontend/apps/member/src/views/traffic/TrafficSummaryView.vue`)

### 5.1. Bố cục Giao diện

- **Thanh lọc thời gian & Nhóm người dùng**: Chọn tháng/năm, chọn Nhóm người dùng (Admin xem toàn bộ hoặc lọc nhóm; Member khóa cứng theo nhóm của mình).
- **Thẻ tổng quan lưu lượng (KPI Cards)**:
  - Tổng số cuộc gọi phát sinh liên quan đến nhóm.
  - Tổng thời lượng đàm thoại thực tế (quy đổi Giờ : Phút).
  - Tỷ trọng cuộc gọi nội bộ nhóm (`calls_intra_group / total_calls * 100%`).
  - Thời lượng đàm thoại trung bình mỗi cuộc (ALOC - Average Length of Call).
- **Bảng tổng hợp lưu lượng theo nhóm**:
  - Mã nhóm, Tên nhóm người dùng, Gọi đi ngoại nhóm, Gọi đến từ ngoại nhóm, Gọi nội bộ nhóm, Tổng thời lượng (phút), Thời lượng trung bình (giây).
  - Nút "Xuất Excel" gọi `POST /api/v1/reports/export/excel` với `reportType = traffic` và cùng `period`, `groupId` đang chọn (không có endpoint xuất riêng); nút "Xem chi tiết nhật ký CDR".

---

## 6. Kịch bản kiểm thử (Test Plan for Agent)

1. **TC-TRAF-01**: Cuộc gọi nội bộ giữa hai máy 5 số cùng thuộc nhóm `UMO-IT-01` (`caller_group_id = 1` và `called_group_id = 1`), kiểm tra bản ghi `cdr_enriched` của leg chính có `call_type = 'INTRA_GROUP'`.
2. **TC-TRAF-02**: Cuộc gọi từ máy thuộc nhóm `UMO-IT-01` (`caller_group_id = 1`) sang máy thuộc nhóm EVNICT Đà Nẵng (`called_group_id = 2`), kiểm tra bản ghi sinh ra với `call_type = 'INTER_GROUP'`.
3. **TC-TRAF-03**: Cuộc gọi bị nhỡ (`call_status = 'NO_ANSWER'`, ví dụ SIP 487, `Answered_Duration IS NULL`), kiểm tra hệ thống ghi nhận `answered_duration_sec = 0` và không cộng dồn vào tổng thời lượng đàm thoại thực tế.
4. **TC-TRAF-04**: Xác nhận `/traffic/summary` đọc từ `stats_daily`, hoàn toàn không tính toán tiền tệ và không có bất kỳ cấu hình giá cước nào.
5. **TC-TRAF-05**: Cuộc gọi đã nhấc máy có `Answered_Duration = 26102` (ms), kiểm tra `answered_duration_sec = 26` và `/traffic/records` trả về `durationSec = 26`.
6. **TC-TRAF-06**: Cuộc gọi 2 leg (leg A + leg B), kiểm tra `/traffic/records` chỉ trả về 1 dòng (leg A) và `total_calls` tăng 1.
