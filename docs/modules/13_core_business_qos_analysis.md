# MODULE 13: NGHIỆP VỤ PHÂN TÍCH CHẤT LƯỢNG THOẠI IP QOS & GỠ LỖI MẠNG (VOIP QOS & NETWORK DEBUGGING)

## Đường dẫn tài liệu: `docs/modules/13_core_business_qos_analysis.md`

## Ánh xạ giao diện mẫu: `templates/qos-debug.html`, `templates/qos-debug.css`, `templates/qos-debug.js`

---

## 1. Mục tiêu & Bối cảnh Nghiệp vụ (Business Overview)

### 1.1. Bối cảnh kỹ thuật viễn thông EVN

Chất lượng cuộc gọi trên hạ tầng VoIP PABX phụ thuộc chặt chẽ vào tình trạng mạng IP (băng thông, độ trễ, mất gói, jitter). Tổng đài EVN đo lường và ghi nhận chi tiết hơn 30 tham số chất lượng mạng vào từng bản ghi CDR:

- **Chuẩn đo lường MOS ITU-T G.107 (E-Model)**: Điểm chất lượng âm thanh ước lượng từ 1.0 (Không thể nghe được) đến tối đa 4.5 (Tuyệt vời) theo E-model (`docs/01_database_schema.md` mục 2.1). Chỉ cột thô `RTP_*_G107MOS` của PABX có thang tới 5.0.
- **Jitter RFC 3550**: Sự biến thiên độ trễ giữa các gói tin RTP liên tiếp. Jitter cao gây ra tiếng méo, giật cục (ngưỡng theo `qos_threshold_configs.JITTER_MS`, mặc định warning 30 ms, critical 50 ms).
- **Packet Loss (Mất gói RTP)**: Tỷ lệ phần trăm gói tin thoại bị thất lạc trên đường truyền mạng IP. Mất gói cao gây gián đoạn âm tiết (ngưỡng theo `PACKET_LOSS_PERCENT`, mặc định warning 1 %, critical 2 %).
- **RTT (Round-Trip Time) Delay**: Độ trễ khứ hồi đo qua RTCP. **Không có trong phiên bản này**: các cột `RTCP_RTT_*` của PABX luôn NULL trên dữ liệu thật, nên hệ thống không tính, không hiển thị và không cảnh báo theo RTT (ngưỡng `RTT_DELAY_MS` để `is_enabled = 0`).
- **SIP Signalling Delays**: Thời gian phản hồi tín hiệu từ lúc bấm số đến lúc nhận các bản tin SIP 100 Trying, 180 Ringing, 183 Session Progress.
- **Phân tích Mã ngắt kết nối (Disconnection Codes)**: Phân biệt cuộc gọi kết thúc bình thường (SIP 200 OK, 486 Busy, 487 Cancelled) hay do lỗi hạ tầng (SIP 500, 503 Service Unavailable, 408 Request Timeout).

### 1.2. Chức năng chính dành cho Kỹ thuật viên viễn thông

1. **Bảng phân tích QoS & Gỡ lỗi mạng (`qos-debug.html`)**:
   - Hiển thị song song các chỉ số cả hai chiều: Phía gọi (Caller) và Phía nhận (Called).
   - Màu sắc cảnh báo trực quan:
     - MOS: 4 dải theo bảng tại `docs/01_database_schema.md` mục 2.1, xét trên `mos_x100`: `.mos-excellent` ($\ge 4.0$), `.mos-good` ($3.5 - <4.0$), `.mos-fair` ($3.0 - <3.5$), `.mos-poor` ($< 3.0$), `.mos-na` (không có dữ liệu).
     - Packet Loss: `.loss-good` (≤ warning), `.loss-warning` (> warning, ≤ critical), `.loss-bad` (> critical) theo ngưỡng `PACKET_LOSS_PERCENT` trong `qos_threshold_configs`.
     - Jitter: `.jitter-good` (≤ warning), `.jitter-warning` (> warning, ≤ critical), `.jitter-bad` (> critical) theo ngưỡng `JITTER_MS`. Frontend lấy ngưỡng từ `GET /api/v1/admin/qos/thresholds` (Admin) hoặc kèm trong response của `debug-table` (`meta.thresholds`) cho User.
   - Thông tin Transport: Codec (`PCMA`, `G.729`, `Opus`), Sample Rate (`8000 Hz`, `16000 Hz`), IP nguồn/đích và Port RTP.
2. **Thống kê chỉ số hiệu năng tổng hợp**:
   - **ASR (Answer Seizure Ratio)**: `answered_calls / total_calls × 100` – tỷ lệ cuộc gọi `call_status = ANSWERED` trên tổng số cuộc gọi (chỉ leg chính).
   - **NER (Network Efficiency Ratio)**: `(answered_calls + busy_calls + no_answer_calls) / total_calls × 100` – tính cả các kết cục do người dùng (`BUSY`, `NO_ANSWER`), loại trừ `FAILED` (lỗi mạng/tổng đài). Bảng ánh xạ mã SIP → `call_status` tại `docs/01_database_schema.md` mục 2.1.
   - **ACD (Average Call Duration / ALOC)**: Thời lượng trung bình của các cuộc gọi thành công.

### 1.3. Phân quyền Truy cập Module QoS (Permissions & Data Scoping)

- **Quản trị viên hệ thống (`ROOT_ADMIN` & `SYSTEM_ADMIN`)**:
  + Có toàn quyền xem chỉ số QoS toàn bộ mạng viễn thông EVN (`qos:view`).
- **Phân hệ Người dùng đơn vị (User Scope - `GROUP_ADMIN`, `USER_RECORDING`, `REGULAR_USER`)**:
  + **Quyền hạn đồng nhất và bình đẳng**: Cả 3 đối tượng người dùng đơn vị gồm Quản trị viên nhóm (`GROUP_ADMIN`), Thành viên nghe ghi âm (`USER_RECORDING`) và Thành viên (`REGULAR_USER`) đều được cấp quyền xem dữ liệu phân tích QoS (`qos:view`).
  + **Cô lập dữ liệu theo nhóm (Group-Based Data Isolation)**: Dữ liệu phân tích QoS hiển thị cho 3 đối tượng này được tự động cô lập trong phạm vi các cuộc gọi có số gọi đi hoặc số nhận thuộc nhóm của mình (`caller_group_id = :ug_id OR called_group_id = :ug_id`).
- **Ngoài phạm vi phiên bản này**: sơ đồ SIP Call Flow Ladder và mọi tính năng dựa trên file PCAP (dữ liệu PCAP có trong CDR nhưng chưa được khai thác).

---

## 2. Thiết kế Dữ liệu & Trường Kỹ thuật (CDR Columns Mapping chuẩn hóa từ voip_cdr_20250817.sql)

| Tham số kỹ thuật | Cột trong bảng `cdr` / `cdr_enriched` | Ý nghĩa & Thang đo chuẩn thực tế |
| :--- | :--- | :--- |
| **MOS Caller / Called** | `mos_caller_x100`, `mos_called_x100`, `mos_x100` (tính từ `RTP_*_G107R`) | Điểm chất lượng ITU-T G.107 thang thập phân ×100, tính theo E-model từ hệ số R (công thức tại `docs/01_database_schema.md` mục 2.1). Cột thô `RTP_*_G107MOS` là số nguyên 1–5 đã làm tròn, chỉ hiển thị tham khảo |
| **R-Factor** | `RTP_Caller_G107R`, `RTP_Called_G107R` | Hệ số R-Value theo chuẩn ITU-T G.107 (0 - 100, ví dụ 93, 85) |
| **Packet Loss** | `RTP_Caller_LostPackets`, `RTP_Caller_PacketsCount`<br>`RTP_Called_LostPackets`, `RTP_Called_PacketsCount` | Tỷ lệ mất gói: $\frac{\text{LostPackets}}{\text{PacketsCount}} \times 100\%$ |
| **Jitter RFC 3550** | `RTP_Caller_MeanRfc3550Jitter`, `RTP_Caller_MaxRfc3550Jitter`<br>`RTP_Called_MeanRfc3550Jitter`, `RTP_Called_MaxRfc3550Jitter` | Độ trễ biến thiên (ms): Jitter trung bình (Mean) và cực đại (Max) |
| **RTP Delta** | `RTP_Caller_MaxDelta`, `MinDelta`, `RTP_Called_MaxDelta`, `MinDelta` | Chênh lệch thời gian giữa 2 gói tin RTP liên tiếp (ms) |
| **Thời gian gói tin** | `RTP_Caller_PacketTime`, `RTP_Called_PacketTime` | Chu kỳ đóng gói khung âm thanh (ms, chuẩn 20ms) |
| **Báo hiệu & Mã kết thúc SIP** | `DisconnectionCode`, `DisconnectionStatus`, `ReleasedBy` | Mã ngắt kết nối (200 OK, 486 Busy, 487 Cancel, 503 Unavailable, 408 Timeout) và bên cúp máy (caller, called) |
| **Độ trễ tín hiệu SIP** | `_100_Delay`, `_180_Delay`, `_183_Delay`, `_180_183_Delay` | Thời gian nhận phản hồi SIP 100 Trying, 180 Ringing, 183 Session Progress (ms) |
| **Độ trễ nhấc máy** | `Answer_Delay` | Thời gian từ lúc chuông reo đến khi bên nhận bắt máy (ms) |
| **Thời lượng đàm thoại** | `answered_duration_sec` (từ `Answered_Duration`) | Thời gian đàm thoại thực tế (giây). Cột thô `Answered_Duration` tính bằng mili-giây; `answered_duration_sec = ROUND(Answered_Duration / 1000)` |
| **Hạ tầng Mạng IP & Port** | `CallerIp`, `CalledIp`<br>`RTP_Caller_Address`, `RTP_Caller_Port`<br>`RTP_Called_Address`, `RTP_Called_Port` | Địa chỉ IP báo hiệu SIP và địa chỉ/cổng Endpoint truyền tải luồng âm thanh RTP 2 chiều |
| **Phân lớp Dịch vụ DSCP** | `RTP_Caller_DSCP`, `RTP_Called_DSCP` | Giá trị DiffServ QoS Layer 3 (ví dụ: 46 = EF Expedited Forwarding, 48 = CS6, 1 = CS1) |
| **Nguồn đồng bộ RTP (SSRC)** | `RTP_Caller_SSRC`, `RTP_Called_SSRC` | Mã định danh nguồn phát RTP Synchronization Source (Hexadecimal, ví dụ 0x5EBD1FD1) |
| **Codec & Âm thanh** | `RTP_Codec`, `RTP_CodecSampleRate` | Định dạng nén âm thanh thực tế (`G711U`, `G711A`, `98`) và tần số lấy mẫu (8000 Hz) |
| **Độ trễ tín hiệu âm thanh** | `Audio_Signal_Delay` | Luôn NULL trên dữ liệu thật; giữ cột thô, không hiển thị (như RTCP RTT) |
| **RTCP RTT** | `RTCP_RTT_Max`, `RTCP_RTT_Mean` | Luôn NULL trên dữ liệu thật; giữ cột thô, không tính thống kê, không hiển thị |
| **PCAP Files** | `Sip_Pcap_FileName`, `Sip_And_Rtp_Pcap_FileName` | Tên file bắt gói tin (Dự phòng trong CSDL, phiên bản này không triển khai tính năng tải file) |

---

## 3. Đặc tả API Contracts

### 3.1. Bảng phân tích QoS chi tiết (`GET /api/v1/qos/debug-table`)

- **Query params**: `fromDate`, `toDate` (bắt buộc), `callerId`, `calledId`, `status` (enum `call_status`), `minMos`/`maxMos` (thang thập phân, so với `mos_x100 / 100`), `disconnectionCode`, `codec`, `packetLoss` (`none` | `warning` | `critical`, so với ngưỡng `PACKET_LOSS_PERCENT`), `page`, `limit`
- **Đơn vị dòng**: mỗi dòng là **một leg** (`cdr_enriched`), kể cả leg phụ; các leg cùng cuộc gọi có cùng `callGroupKey` và được sắp liền nhau (leg chính trước). `duration` = `answered_duration_sec` (giây); `mos` = `mos_*_x100 / 100` (2 chữ số), `mosRaw` = giá trị số nguyên thô của PABX.
- **Response**:

```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "id": 1,
      "callGroupKey": 1,
      "legRole": "A_LEG",
      "isPrimaryLeg": true,
      "callStatus": "ANSWERED",
      "callType": "INTRA_GROUP",
      "created": "2025-06-11T08:02:37+07:00",
      "answered": "2025-06-11T08:02:40+07:00",
      "destroyed": "2025-06-11T08:03:06+07:00",
      "duration": 26,
      "callerId": "42118",
      "callerDisplayName": "LONGNT",
      "callerGroup": "Khối CNTT",
      "calledId": "42200",
      "calledDisplayName": "",
      "calledGroup": "Khối CNTT",
      "sip": {
        "callId": "26183508-5060-3@BA.BGG.A.BFB",
        "disconnectionCode": "200",
        "disconnectionStatus": "OK",
        "releasedBy": "caller",
        "answerDelayMs": 2833,
        "sip100DelayMs": null,
        "sip180DelayMs": 195,
        "sip183DelayMs": null
      },
      "rtp": {
        "codec": "G711U",
        "sampleRate": 8000,
        "caller": {
          "mos": 4.41,
          "mosRaw": 4,
          "rFactor": 93,
          "packetsCount": 1427,
          "lostPackets": 0,
          "lossPercent": 0.0,
          "meanJitterMs": 1,
          "maxJitterMs": 4,
          "packetTimeMs": 20,
          "dscp": 48,
          "ip": "10.166.0.151",
          "port": 10004,
          "ssrc": "0x5EBD1FD1"
        },
        "called": {
          "mos": 4.41,
          "mosRaw": 4,
          "rFactor": 93,
          "packetsCount": 1432,
          "lostPackets": 0,
          "lossPercent": 0.0,
          "meanJitterMs": 0.14,
          "maxJitterMs": 6.43,
          "packetTimeMs": 20,
          "dscp": 46,
          "ip": "10.128.16.253",
          "port": 29186,
          "ssrc": "0x4E430D6C"
        }
      }
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 18,
    "totalPages": 2
  }
}
```

### 3.2. Tổng hợp chất lượng (`GET /api/v1/qos/summary`)

- **Nguồn**: `stats_hourly` (`period=today`) hoặc `stats_daily`, một phạm vi duy nhất (nhóm của người dùng; bản Admin: toàn hệ thống hoặc `groupId`). Roll-up theo quy tắc `docs/01_database_schema.md` mục 15.
- **Query params**: tham số `period` theo bộ giá trị chung tại `docs/02_api_contracts.md` mục 1.1, `groupId` (chỉ bản Admin).
- **Response**: chỉ số nào không có mẫu (mẫu số = 0) thì trả `null`.

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "period": { "from": "2026-10-01", "to": "2026-10-26" },
    "totalCalls": 3506,
    "asr": 59.78,
    "ner": 96.12,
    "avgMos": 4.40,
    "qosSampleCount": 4179,
    "mosDistribution": {
      "excellent": { "count": 4165, "percent": 99.67 },
      "good":      { "count": 1,    "percent": 0.02 },
      "fair":      { "count": 13,   "percent": 0.31 },
      "poor":      { "count": 0,    "percent": 0.00 }
    },
    "lossPercent": 0.01,
    "avgJitterMs": 1.490,
    "maxJitterMs": 147.0,
    "highPacketLossLegs": 6,
    "sipDelays": { "sip100": 118, "sip180": 241, "sip183": null, "answer": 6120 }
  }
}
```

- **Đơn vị**: `totalCalls`, `asr`, `ner`, `sipDelays` tính theo cuộc gọi (leg chính). `qosSampleCount`, `avgMos`, `mosDistribution`, `lossPercent`, `avgJitterMs`, `maxJitterMs`, `highPacketLossLegs` tính theo **leg** (cả leg A và leg B), để phản ánh cả đoạn máy gọi ↔ lõi và đoạn lõi ↔ máy nhận (`docs/01_database_schema.md` mục 15). Số liệu ví dụ lấy từ dữ liệu thật `voip_cdr_20250817.sql`.
- `mosDistribution.*.percent` tính trên `qosSampleCount` (chỉ leg có MOS). `asr`, `ner` tính trên `totalCalls`. `sipDelays` đơn vị ms. `highPacketLossLegs` đếm theo ngưỡng `PACKET_LOSS_PERCENT` tại thời điểm tổng hợp từng khung giờ.

### 3.2.1. Phân bố mã kết thúc SIP (`GET /api/v1/qos/disconnection-codes`)

- **Nguồn, phạm vi, query params**: như `/qos/summary`.
- **Response**: luôn đủ 7 nhóm mã theo cột `sip_*_count` của `stats_*`; `percent` tính trên `total` (= `total_calls`).

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "total": 3506,
    "codes": [
      { "code": "200",   "callStatus": "ANSWERED",  "count": 2096, "percent": 59.78 },
      { "code": "487",   "callStatus": "NO_ANSWER", "count": 1061, "percent": 30.26 },
      { "code": "480",   "callStatus": "NO_ANSWER", "count": 177,  "percent": 5.05 },
      { "code": "503",   "callStatus": "FAILED",    "count": 64,   "percent": 1.83 },
      { "code": "408",   "callStatus": "FAILED",    "count": 58,   "percent": 1.65 },
      { "code": "486",   "callStatus": "BUSY",      "count": 34,   "percent": 0.97 },
      { "code": "OTHER", "callStatus": null,        "count": 16,   "percent": 0.46 }
    ],
    "releasedBy": { "caller": 2489, "called": 1017 }
  }
}
```

- `OTHER` gộp mọi mã còn lại (`sip_other_count`, ví dụ 404, 603); vì có thể thuộc nhiều `callStatus` khác nhau nên `callStatus = null`.

### 3.3. Ngưỡng cảnh báo QoS (`GET` / `PUT /api/v1/admin/qos/thresholds`)

- **Guard**: `AdminAuthGuard`; `GET` cần `qos:view`, `PUT` cần `qos:manage`.
- **Giao diện**: chỉ khu vực Admin, mục `qos-thresholds` trong `/admin/settings` (`docs/modules/07_system_settings.md` mục 5.2). `QosDebugView` của khu vực Admin chỉ đọc ngưỡng để tô màu; khu vực Member nhận ngưỡng qua `meta.thresholds` của `debug-table`.
- **Dữ liệu**: bảng `qos_threshold_configs` (một dòng mỗi `metric_name`). `PUT` nhận toàn bộ danh sách, ghi trong một transaction và ghi `audit_logs` (`SYSTEM / UPDATE_SETTINGS`).
- **Body `PUT`** (cũng là dạng response của `GET`):

```json
{
  "thresholds": [
    { "metricName": "MOS_G107", "operator": "LESS_THAN", "warningThreshold": 3.5, "criticalThreshold": 3.0, "isEnabled": true },
    { "metricName": "PACKET_LOSS_PERCENT", "operator": "GREATER_THAN", "warningThreshold": 1.0, "criticalThreshold": 2.0, "isEnabled": true }
  ]
}
```

- **Kiểm tra**: `metricName` thuộc `MOS_G107`, `PACKET_LOSS_PERCENT`, `JITTER_MS`, `RTT_DELAY_MS`, `ASR_PERCENT`; với `LESS_THAN` phải có `criticalThreshold <= warningThreshold`, với `GREATER_THAN` thì ngược lại; sai trả `400`. Giá trị MOS theo thang thập phân.

---

## 4. Kiến trúc Backend NestJS (`backend/src/core`, `apps/*`)

Theo quy tắc `docs/00_overview_and_architecture.md` mục 5.1: nghiệp vụ và entity ở `core`, controller ở `apps/admin` / `apps/member`, job nền ở `apps/worker`; các phần `apps/*` không import lẫn nhau.

```
backend/src/
├── core/qos/
│   ├── qos.module.ts
│   ├── qos.service.ts                  <-- debug-table, summary, disconnection-codes; nhận scope SYSTEM | GROUP
│   ├── qos-thresholds.service.ts
│   ├── qos-evaluator.service.ts        <-- Thuật toán đánh giá MOS G.107 & cảnh báo
│   ├── qos-alert.service.ts            <-- đánh giá khung giờ đã kết thúc ≥ 60 phút, tạo QOS_ALERT qua core/notifications
│   ├── dto/
│   │   ├── qos-debug-query.dto.ts
│   │   └── qos-summary-response.dto.ts
│   └── entities/
│       └── qos-threshold-config.entity.ts
├── apps/admin/qos/
│   ├── admin-qos.module.ts
│   ├── qos.controller.ts               <-- /api/v1/admin/qos/debug-table, summary, disconnection-codes
│   └── qos-thresholds.controller.ts    <-- GET/PUT /api/v1/admin/qos/thresholds
├── apps/member/qos/
│   ├── member-qos.module.ts
│   └── qos.controller.ts               <-- /api/v1/qos/* (scope GROUP)
└── apps/worker/qos-alert/
    ├── qos-alert-worker.module.ts
    └── qos-alert.job.ts                <-- chạy sau mỗi lần stats-aggregation, gọi QosAlertService
```

---

## 5. Kiến trúc Frontend Vue 3 (`frontend/src/apps/admin/views/cdr/QosDebugView.vue` & `frontend/src/apps/member/views/cdr/QosDebugView.vue`)

### 5.1. Bố cục Giao diện (Ánh xạ `templates/qos-debug.html`)

- **Header**: Tiêu đề "Phân tích Chất lượng (QoS) & Gỡ lỗi", phụ đề hướng dẫn kỹ thuật viên, nút "Làm mới" (`#refreshQosBtn`).
- **Bộ lọc tìm kiếm (`.search-filter-wrapper`)**:
  - **Hàng 1 (Cơ bản)**: Khoảng thời gian (From / To Date), Số gọi đi (Caller), Số nhận (Called), Trạng thái (Tất cả, Nghe máy, Máy bận, Hủy gọi, Lỗi mạng), Nút "Tìm kiếm" và Nút "Bộ lọc nâng cao".
  - **Hàng 2 (Nâng cao - Trượt mở rộng / Slide Toggle)**: Ngưỡng chất lượng MOS (Kém &lt;3.0, Trung bình 3.0–&lt;3.5, Tốt 3.5–&lt;4.0, Xuất sắc &ge;4.0; lọc theo `mos_x100`), Mã kết thúc SIP (200, 486, 487, 503, 408), Định dạng Codec (`G711U`, `G711A`), Tỷ lệ mất gói tin (`packetLoss` = `none` | `warning` | `critical`: không mất gói, vượt ngưỡng warning, vượt ngưỡng critical của `PACKET_LOSS_PERCENT`).
- **Bảng dữ liệu QoS cô đọng 7 cột (`.data-table`)**:
  - Cột 1: Thời gian & Thời lượng đàm thoại (`Created`, `answered_duration_sec`; không dùng `Answered_Duration` vì cột thô tính bằng mili-giây).
  - Cột 2: Bên gọi (Caller): Số điện thoại, Tên hiển thị, Badge Đơn vị/Nhóm người dùng.
  - Cột 3: Bên nhận (Called): Số điện thoại, Tên hiển thị, Badge Đơn vị/Nhóm người dùng.
  - Cột 4: Trạng thái & Mã SIP: Render badge chuẩn màu `.badge-sip-200` (xanh), `.badge-sip-486` (cam), `.badge-sip-487` (xám), `.badge-sip-503`/`.badge-sip-408` (đỏ).
  - Cột 5: Tổng hợp QoS 2 chiều: Hiển thị song song hai dòng Bên gọi (TX) và Bên nhận (RX) gồm Điểm MOS G.107, Tỷ lệ mất gói %, Độ trễ Jitter RFC 3550 với màu sắc trực quan (lớp MOS theo 4 dải `.mos-excellent/good/fair/poor` + `.mos-na` tại `docs/01_database_schema.md` mục 2.1; `.loss-good/warning/poor`).
  - Cột 6: RTP Codec (`.codec-badge`: G711U, G711A).
  - Cột 7: Thao tác: Nút "Chi tiết" mở Modal QoS.
- **Phân trang động (`.pagination-container`)**:
  - Chọn số bản ghi hiển thị (10, 20, 50 bản ghi/trang).
  - Thanh phân trang đa trang (Prev, 1, 2, 3..., Next) tương tác tức thì qua JavaScript.
- **Modal chi tiết gỡ lỗi 4 Khối Cards (`#qosDetailModal`)**:
  - **Khối 1: Tổng quan Cuộc gọi**: ID, SIP Call-ID, Thời điểm khởi tạo/bắt máy/kết thúc, Thời lượng, Bên gọi/nhận, Bên cúp máy (`ReleasedBy`).
  - **Khối 2: Báo hiệu SIP & Độ trễ Mạng**: Mã ngắt (`DisconnectionCode`), Trạng thái (`DisconnectionStatus`), Độ trễ nhấc máy (`Answer_Delay`), Độ trễ nhận SIP 100 Trying, SIP 180 Ringing, SIP 183 Session Progress. Không hiển thị `Audio_Signal_Delay` (luôn NULL, như RTT).
  - **Khối 3: Chỉ số Chất lượng Thoại RTP ITU-T G.107 hai chiều**: Bảng so sánh đối chiếu song song giữa Phía gọi (TX) và Phía nhận (RX): Điểm MOS G.107, Hệ số R-Factor, Tổng số gói tin RTP, Gói tin thất lạc (số gói và %), Độ trễ Jitter RFC 3550 (Mean & Max), Biến thiên khoảng cách gói (RTP Delta Max/Min), Chu kỳ đóng gói (`PacketTime`).
  - **Khối 4: Hạ tầng Mạng IP & DSCP (Layer 3 QoS)**: IP báo hiệu SIP 2 chiều, Media Endpoint RTP (IP:Port), Phân lớp Dịch vụ DiffServ DSCP (46 = EF, 48 = CS6, 1 = CS1), RTP SSRC, Codec & Tần số lấy mẫu (8000 Hz).

---

## 6. Kịch bản kiểm thử (Test Plan for Agent)

1. **TC-QOS-01**: Lọc các cuộc gọi có điểm MOS $< 3.0$ hoặc có tỷ lệ mất gói $> 0\%$, xác nhận bảng hiển thị đúng các bản ghi có sự cố suy giảm chất lượng và badge hiển thị màu cảnh báo vàng/đỏ tương ứng.
2. **TC-QOS-02**: Kiểm tra bộ lọc Mã kết thúc SIP (chọn 487 Cancel hoặc 503 Service Unavailable), xác nhận danh sách trả về đúng các cuộc gọi kết thúc bất thường và badge hiển thị đúng mã SIP 487/503.
3. **TC-QOS-03**: Nhấn vào một dòng cuộc gọi bất kỳ hoặc nút "Chi tiết", xác nhận Modal `#qosDetailModal` hiển thị đầy đủ 4 Khối Cards thông tin kỹ thuật được điền chính xác theo dữ liệu của cuộc gọi đó.
4. **TC-QOS-04**: Thử nghiệm phân trang (chuyển trang 1, 2 và thay đổi số lượng bản ghi 10/20/50), xác nhận bảng cập nhật mượt mà không bị tải lại trang.
