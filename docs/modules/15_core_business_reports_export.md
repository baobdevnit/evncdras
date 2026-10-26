# MODULE 15: NGHIỆP VỤ XUẤT BÁO CÁO CHUYÊN SÂU & ĐỐI SOÁT DỮ LIỆU (ADVANCED REPORTS & DATA EXPORT)
## Đường dẫn tài liệu: `docs/modules/15_core_business_reports_export.md`
## Ánh xạ giao diện mẫu: `templates/admin/reports.html`, `templates/member/reports.html`, `templates/admin/reports.css`, `templates/admin/reports.js`

---

## 1. Mục tiêu & Bối cảnh Nghiệp vụ (Business Overview)

### 1.1. Bối cảnh nghiệp vụ báo cáo viễn thông EVN
Báo cáo định kỳ là căn cứ quan trọng để Lãnh đạo Tập đoàn EVN, Ban Viễn thông & CNTT, cùng các Tổng công ty đánh giá hiệu quả vận hành mạng thoại IP dùng riêng:
1. **Các biểu mẫu báo cáo tiêu chuẩn (theo Nhóm người dùng)**:
   - **Báo cáo Tổng hợp Hiệu năng (General Performance Report)**: Thống kê tổng số lượng cuộc gọi, cuộc gọi thành công (SIP 200 OK), tổng thời lượng đàm thoại thực tế, tỷ lệ kết nối thành công ASR, tỷ lệ hiệu quả mạng NER và điểm MOS ITU-T G.107 trung bình theo từng Đơn vị/Nhóm người dùng.
   - **Báo cáo Lưu lượng 3 Hướng gọi (3-Way Traffic Report)**: Thống kê chi tiết 3 luồng cuộc gọi viễn thông. Phạm vi nhóm: Nội bộ nhóm (`calls_intra_group`), Gọi đi (`calls_outbound`), Gọi đến (`calls_inbound`). Phạm vi toàn hệ thống: Nội bộ nhóm (`calls_intra_group`), Liên nhóm (`calls_inter_group`), Chưa xác định nhóm (`calls_unassigned`). Báo cáo nhiều nhóm không có dòng "Tổng cộng" cộng dồn các nhóm; số tổng lấy từ dòng toàn hệ thống (quy tắc tại `docs/01_database_schema.md` mục 15), tính toán tỷ trọng gọi nội bộ phục vụ tối ưu phân bổ lưu lượng thoại và năng lực trung kế SIP.
   - **Báo cáo Phân tích Chất lượng Thoại QoS (Voice Quality QoS Report)**: Thống kê phân bố điểm MOS ITU-T G.107 theo 4 dải (`mos_excellent_count` $\ge 4.0$, `mos_good_count` $3.5 - <4.0$, `mos_fair_count` $3.0 - <3.5$, `mos_poor_count` $<3.0$; bảng dải tại `docs/01_database_schema.md` mục 2.1), tỷ lệ mất gói Packet Loss trung bình (tính từ `rtp_lost_packets_total / rtp_packets_total`) và độ trễ Jitter RFC 3550. Không có chỉ số RTCP RTT (dữ liệu PABX luôn NULL).
   - **Báo cáo Sự cố & Mã lỗi SIP (SIP Telephony Failure Report)**: Thống kê chi tiết các sự cố tổng đài (SIP 503 Service Unavailable, 408 Timeout, 486 Busy, 487 Cancel) và phân tích tỷ trọng lỗi hạ tầng mạng viễn thông.
2. **Quy tắc Hiệu năng Zero CDR Scan**:
   - **Tuyệt đối không quét bảng CDR thô**: Toàn bộ dữ liệu hiển thị xem trước và kết xuất file Excel/PDF đều được đọc trực tiếp từ bảng số liệu tổng hợp sẵn `stats_daily` (hoặc `stats_hourly`).
   - **Tốc độ kết xuất tức thì**: Thời gian sinh file Excel/PDF luôn $< 1\text{ giây}$ (thực tế $\approx 400-600\text{ms}$) ngay cả khi xuất báo cáo của cả quý hoặc cả năm, loại bỏ hoàn toàn nguy cơ nghẽn DB hoặc timeout.
3. **Yêu cầu kỹ thuật xuất dữ liệu**:
   - **Định dạng Microsoft Excel (`.xlsx`)**: Áp dụng thư viện `exceljs`, tạo bảng tính có tiêu đề Quốc hiệu, Tên Tập đoàn EVN, logo, kẻ viền (border), định dạng số. **Quy tắc dòng tổng**: báo cáo theo thời gian của **một phạm vi** (toàn hệ thống hoặc một nhóm) có dòng "Tổng" cộng các cột số đếm và thời lượng qua các ngày, còn các cột tỷ lệ (ASR, NER) và trung bình (MOS, ACD) ở dòng tổng **tính lại từ bộ đếm** theo quy tắc roll-up `docs/01_database_schema.md` mục 15 (không dùng `AVERAGE`). Báo cáo **so sánh nhiều nhóm** liệt kê từng nhóm và **không có dòng tổng cộng các nhóm**; nếu cần số toàn hệ thống thì in thêm dòng "Toàn hệ thống" lấy từ dòng `group_id IS NULL`, ghi rõ nhãn.
   - **Định dạng PDF (`.pdf`)**: Áp dụng thư viện `pdfmake` / `puppeteer`, tạo tài liệu PDF khổ A4 ngang/dọc, chuẩn font Unicode tiếng Việt không bị lỗi dấu, có phần ký tên của Người lập biểu, Trực ban vận hành và Lãnh đạo duyệt.

### 1.2. Phân quyền Truy cập Module Báo cáo (Group-Based Data Isolation)

- **Quản trị viên hệ thống (`ROOT_ADMIN` & `SYSTEM_ADMIN`)**:
  + Xem báo cáo tổng hợp toàn EVN hoặc lọc theo bất kỳ Nhóm người dùng nào trên hệ thống (`report:view`).
  + Xuất báo cáo (Excel/PDF) toàn hệ thống hoặc theo nhóm phục vụ kiểm tra, nghiệm thu (`report:export`).
  + Bộ chọn Nhóm người dùng được mở toàn quyền (`-- Toàn bộ Tập đoàn EVN --` hoặc từng nhóm người dùng cụ thể). Cây tổ chức chỉ dùng để hiển thị tham chiếu ngữ cảnh nhóm.
- **Phân hệ Người dùng đơn vị (User Scope - `GROUP_ADMIN`, `USER_RECORDING`, `REGULAR_USER`)**:
  + **Quyền hạn đồng nhất và bình đẳng**: Cả 3 đối tượng người dùng đơn vị gồm Quản trị viên nhóm (`GROUP_ADMIN`), Thành viên nghe ghi âm (`USER_RECORDING`) và Thành viên (`REGULAR_USER`) đều được trao quyền xem báo cáo (`report:view`) và xuất báo cáo (`report:export`).
  + **Cô lập dữ liệu báo cáo theo nhóm**: Khi người dùng đơn vị truy cập, backend tự động áp đặt bộ lọc `groupId = :userGroupId` từ token phiên đăng nhập. Bộ chọn nhóm trên giao diện tự động khóa cố định về nhóm của người dùng (kèm nhãn `🔒 Khóa theo phân quyền nhóm EVNICT Đà Nẵng`). Số liệu KPI, bảng xem trước và file xuất ra (Excel/PDF) hoàn toàn nằm trong ranh giới dữ liệu của nhóm mình (đọc trực tiếp từ `stats_daily`).

---

## 2. Đặc tả API Contracts

### 2.1. Lấy dữ liệu báo cáo xem trước (`GET /api/v1/reports/summary`)
- **Query Parameters**:
  - `reportType`: `general` | `traffic` | `quality` | `failure`
  - `period`: bộ giá trị chung tại `docs/02_api_contracts.md` mục 1.1
  - `fromDate`, `toDate`: khi `period = custom`
  - `groupId`: `number | null` — `user_groups.id`; bỏ trống hoặc `null` = toàn hệ thống (chỉ Admin Portal). User Portal không gửi tham số này; backend tự dùng nhóm trong token.
- **Response** (khung chung cho 4 loại báo cáo; nguồn `stats_daily`, riêng `period=today` đọc `stats_hourly` và `rows` theo giờ):

```json
{
  "success": true,
  "statusCode": 200,
  "data": {
    "reportType": "general",
    "scope": { "groupId": 2, "groupCode": "UMO-IT-01", "groupName": "Khối CNTT" },
    "period": { "from": "2026-10-01", "to": "2026-10-26" },
    "kpis": { "totalCalls": 3506, "answeredCalls": 2096, "totalDurationSec": 512340, "asrPercentage": 59.78, "nerPercentage": 96.12, "avgMos": 4.39 },
    "chart": { "labels": ["2026-10-01", "2026-10-02"], "series": { "totalCalls": [130, 142], "asrPercentage": [58.4, 61.2] } },
    "rows": [ { "date": "2026-10-01", "totalCalls": 130, "answeredCalls": 76, "totalDurationSec": 18320, "asrPercentage": 58.46, "nerPercentage": 95.38, "avgMos": 4.40 } ],
    "totals": { "totalCalls": 3506, "answeredCalls": 2096, "totalDurationSec": 512340, "asrPercentage": 59.78, "nerPercentage": 96.12, "avgMos": 4.39 }
  }
}
```

- `scope = null` khi xem toàn hệ thống. `totals` = `kpis`, tính lại từ bộ đếm theo quy tắc roll-up (`docs/01_database_schema.md` mục 15), không lấy trung bình các dòng.
- **Bộ chỉ số của `kpis` / `rows` / `totals` theo `reportType`** (chỉ số không có mẫu trả `null`):

  | `reportType` | Chỉ số |
  |---|---|
  | `general` | `totalCalls`, `answeredCalls`, `totalDurationSec`, `asrPercentage`, `nerPercentage`, `avgMos` |
  | `traffic` | phạm vi nhóm: `totalCalls`, `callsIntraGroup`, `callsOutbound`, `callsInbound`, `intraDurationSec`, `outboundDurationSec`, `inboundDurationSec`; toàn hệ thống: `totalCalls`, `callsIntraGroup`, `callsInterGroup`, `callsUnassigned`, `intraDurationSec`, `interDurationSec`, `unassignedDurationSec` |
  | `quality` | `qosSampleCount`, `avgMos`, `mosExcellentCount`, `mosGoodCount`, `mosFairCount`, `mosPoorCount`, `lossPercent`, `avgJitterMs`, `maxJitterMs`, `highPacketLossCalls` |
  | `failure` | `totalCalls`, `busyCalls`, `noAnswerCalls`, `failedCalls`, `sip200`, `sip486`, `sip487`, `sip503`, `sip408`, `sip480`, `sipOther`, `releasedByCaller`, `releasedByCalled`, `avgSip100DelayMs`, `avgSip180DelayMs`, `avgSip183DelayMs`, `avgAnswerDelayMs` |

- Excel/PDF (mục 2.2, 2.3) dùng đúng dữ liệu này: cột = chỉ số của `reportType`, dòng = `rows`, dòng "Tổng" = `totals`.

### 2.2. Xuất file Excel (`POST /api/v1/reports/export/excel`)
- **Guard**: `Permission: report:export`
- **Request Body**:
```json
{
  "reportType": "general",
  "period": "this_month",
  "groupId": null,
  "title": "BÁO CÁO TỔNG HỢP HIỆU NĂNG MẠNG THOẠI PABX EVN"
}
```
- **Response Header**:
  - `Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`
  - `Content-Disposition: attachment; filename="BaoCao_GENERAL_ToanTapDoanEVN_20260518.xlsx"`
- **Ghi Audit Log**: `EXPORT_REPORT` với `action_details.format = EXCEL`.

### 2.3. Xuất file PDF (`POST /api/v1/reports/export/pdf`)
- **Guard**: `Permission: report:export`
- **Request Body**:
```json
{
  "reportType": "quality",
  "period": "this_month",
  "groupId": 2,
  "title": "BÁO CÁO PHÂN TÍCH CHẤT LƯỢNG THOẠI QOS - EVNICT ĐÀ NẴNG"
}
```
- **Response Header**:
  - `Content-Type: application/pdf`
  - `Content-Disposition: attachment; filename="BaoCao_QUALITY_EVNICT_DaNang_20260518.pdf"`
- **Ghi Audit Log**: `EXPORT_REPORT` với `action_details.format = PDF`.

---

## 3. Kiến trúc Backend NestJS (`backend/src/modules/reports/`)

```
reports/
├── reports.module.ts
├── reports.controller.ts
├── reports.service.ts
├── exporters/
│   ├── excel-exporter.service.ts   <-- Xây dựng cấu trúc Workbook bằng exceljs
│   └── pdf-exporter.service.ts     <-- Render PDF bằng pdfmake
└── dto/
    ├── report-filter.dto.ts
    └── report-export.dto.ts
```

### 3.1. Implementation `ExcelExporterService` (Chuẩn EVN)
```typescript
@Injectable()
export class ExcelExporterService {
  async generateGeneralReport(data: any[], filter: any): Promise<Buffer> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'EVN CDR Analysis System';
    const sheet = workbook.addWorksheet('Báo cáo tổng hợp', {
      pageSetup: { paperSize: 9, orientation: 'landscape' }, // A4 Landscape
    });

    // 1. Header Quốc hiệu & Đơn vị
    sheet.mergeCells('A1:C1');
    sheet.getCell('A1').value = 'TẬP ĐOÀN ĐIỆN LỰC VIỆT NAM\nCÔNG TY VIỄN THÔNG ĐIỆN LỰC & CNTT';
    sheet.getCell('A1').font = { bold: true, size: 10 };
    sheet.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

    sheet.mergeCells('D1:H1');
    sheet.getCell('D1').value = 'CỘNG HÒA XÃ HỘI CHỦ NGHĨA VIỆT NAM\nĐộc lập - Tự do - Hạnh phúc';
    sheet.getCell('D1').font = { bold: true, size: 10 };
    sheet.getCell('D1').alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };

    // 2. Tiêu đề Báo cáo
    sheet.mergeCells('A3:H3');
    sheet.getCell('A3').value = 'BÁO CÁO TỔNG HỢP HIỆU NĂNG MẠNG THOẠI PABX EVN';
    sheet.getCell('A3').font = { bold: true, size: 14, color: { argb: '0033A0' } };
    sheet.getCell('A3').alignment = { horizontal: 'center', vertical: 'middle' };

    // 3. Bảng Dữ liệu (Columns)
    const headerRow = sheet.addRow([
      'STT', 'Ngày / Thời gian', 'Nhóm người dùng', 'Tổng cuộc gọi', 'Thành công (200 OK)', 'Thời lượng (Phút)', 'ASR (%)', 'NER (%)', 'Điểm MOS TB'
    ]);
    headerRow.font = { bold: true, color: { argb: 'FFFFFF' } };
    headerRow.eachCell((cell) => {
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '0033A0' } }; // Xanh EVN
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });

    // 4. Fill Data Rows
    data.forEach((item, index) => {
      const row = sheet.addRow([
        index + 1, item.date, item.groupName, item.totalCalls, item.answered, item.durationMinutes, `${item.asr}%`, `${item.ner}%`, item.mosAvg
      ]);
      row.eachCell(c => c.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } });
    });

    // 5. Chữ ký phê duyệt cuối trang
    const signRow = sheet.addRow(['', '', 'NGƯỜI LẬP BIỂU', '', '', '', 'TRƯỞNG ĐƠN VỊ PHÊ DUYỆT', '']);
    signRow.font = { bold: true };

    return (await workbook.xlsx.writeBuffer()) as Buffer;
  }
}
```

---

## 4. Kiến trúc Frontend Vue 3 / Giao diện Chuẩn hóa (`templates/reports.html`)

### 4.1. Bố cục Giao diện Chuẩn hóa
- **Page Header**:
  - Tiêu đề "Báo cáo Thống kê Viễn thông" kèm huy hiệu nổi bật `⚡ Zero CDR Scan` khẳng định dữ liệu trích xuất từ bảng `stats_daily`.
  - Nút "Xuất PDF" (`#btnExportPdf`): Màu trung tính viền nét mảnh, icon PDF, kèm hiệu ứng loading spinner 600ms khi kích hoạt.
  - Nút "Xuất Excel" (`#btnExportExcel`): Màu xanh nhận diện Excel (`.btn-excel`), kèm hiệu ứng loading spinner 600ms khi kích hoạt.
- **Thẻ Bộ lọc báo cáo (`.card.filter-card`)**:
  - **Loại báo cáo (`#reportType`)**:
    1. Báo cáo Tổng hợp Hiệu năng (`general`)
    2. Báo cáo Lưu lượng 3 Hướng gọi (`traffic`)
    3. Báo cáo Phân tích Chất lượng Thoại QoS (`quality`)
    4. Báo cáo Sự cố & Mã lỗi SIP (`failure`)
  - **Khoảng thời gian (`#period`)**: "Hôm nay", "Hôm qua", "7 ngày qua", "Tuần này", "Tháng này", "Tháng trước", "Tùy chỉnh khoảng ngày...". Khi chọn "Tùy chỉnh", container `#customDateContainer` tự động bung 2 ô nhập ngày `fromDate` và `toDate`.
  - **Nhóm người dùng (`#groupSelect`)**: chỉ hiển thị trên Admin Portal. Liệt kê các nhóm theo dạng "mã – tên" (`user_groups.code`, `user_groups.name`), có thể gom theo nhánh cây tổ chức để dễ tìm; lựa chọn đầu tiên "Toàn hệ thống" (gửi `groupId = null`). Giá trị gửi lên là `user_groups.id` (số nguyên), không bao giờ là đầu số. Trên User Portal không có bộ chọn: backend tự dùng nhóm của người dùng.
- **Lưới thẻ thống kê (4 KPI Cards)**:
  - Thẻ 1: Tổng Lưu Lượng Cuộc Gọi (`#kpiTotalCalls`).
  - Thẻ 2: Thời Lượng Đàm Thoại Thực Tế (`#kpiTotalDuration`).
  - Thẻ 3: Tỷ Lệ Trả Lời ASR & Hiệu Quả Mạng NER (`#kpiAsr` & `#kpiNer`).
  - Thẻ 4: Đổi linh hoạt theo loại báo cáo:
    + Khi chọn Tổng hợp: Điểm MOS TB (4.18 - Chuẩn ITU-T G.107).
    + Khi chọn Lưu lượng: Tỷ trọng cuộc gọi nội bộ nhóm (68.5%).
    + Khi chọn QoS: Tỷ lệ mất gói Packet Loss (0.42%), tô màu theo ngưỡng `PACKET_LOSS_PERCENT`.
    + Khi chọn Sự cố SIP: Tổng số lỗi hạ tầng SIP 503/408 (38 lỗi - Chiếm 0.32%).
- **Khu vực Biểu đồ Động (Charts Area)**:
  - **Biểu đồ 1 (`#volumeChart`)**:
    + Tổng hợp: Biểu đồ cột cuộc gọi thành công vs bận/lỗi theo ngày.
    + Lưu lượng: Biểu đồ cột xếp chồng 3 màu (Nội bộ / Gọi đi / Gọi đến).
    + QoS: Biểu đồ đường kép (Điểm MOS TB và Tỷ lệ Packet Loss %).
    + Sự cố SIP: Biểu đồ cột phân bố các mã lỗi SIP 503, 408, 486, 487.
  - **Biểu đồ 2 (`#branchChart`)**:
    + Tổng hợp: Doughnut tỷ trọng lưu lượng theo `call_type` của phạm vi đang xem (toàn hệ thống: Nội bộ nhóm / Liên nhóm / Chưa xác định nhóm; một nhóm: Nội bộ / Gọi đi / Gọi đến). Không có biểu đồ tỷ trọng giữa các nhóm (sẽ đếm đôi cuộc liên nhóm).
    + Lưu lượng: Doughnut cơ cấu 3 hướng cuộc gọi.
    + QoS: Doughnut phân bố 4 dải điểm MOS (Xuất sắc $\ge 4.0$, Tốt $3.5 - <4.0$, Trung bình $3.0 - <3.5$, Kém $<3.0$).
    + Sự cố SIP: Doughnut phân bố lỗi hạ tầng (503/408) vs người dùng (486/487).
- **Bảng xem trước dữ liệu (Data Preview Table)**:
  - Cấu trúc tiêu đề cột và nội dung dữ liệu tự động hoán đổi linh hoạt theo 4 loại báo cáo.
  - Tích hợp chuẩn hóa các huy hiệu màu đồng bộ với `qos-debug.html`:
    + Huy hiệu MOS (`.badge-mos.mos-excellent`, `.mos-good`, `.mos-fair`, `.mos-poor`, `.mos-na`).
    + Huy hiệu mã ngắt SIP (`.badge-sip-200`, `.badge-sip-486`, `.badge-sip-487`, `.badge-sip-503`, `.badge-sip-408`).
- **Hệ thống Toast thông báo & Tải file**:
  - Thông báo nổi góc màn hình hiển thị trạng thái chuyển loại báo cáo, và kết xuất file thành công với chỉ số thời gian xử lý siêu tốc chuẩn Zero CDR Scan.

---

## 5. Kịch bản kiểm thử (Test Plan for Agent)
1. **TC-REP-01**: Chuyển đổi giữa 4 loại báo cáo, xác nhận 4 Thẻ KPI, 2 Biểu đồ (Cột và Doughnut) cùng cấu trúc cột Bảng dữ liệu tự động thay đổi tương ứng.
2. **TC-REP-02**: Đăng nhập User Portal (thành viên nhóm id 2), mở báo cáo: không có bộ chọn nhóm, số liệu chỉ của nhóm 2; gửi thêm `groupId=5` lên API User thì bị bỏ qua hoặc trả `403`.
3. **TC-REP-03**: Đăng nhập Admin Portal, chọn "Toàn hệ thống" (`groupId = null`) rồi chọn nhóm id 2; xác nhận số liệu toàn hệ thống lấy từ dòng `group_id IS NULL`, và báo cáo so sánh nhiều nhóm không có dòng tổng cộng các nhóm.
4. **TC-REP-04**: Chọn khoảng thời gian "Tùy chỉnh khoảng ngày...", xác nhận 2 ô nhập "Từ ngày" và "Đến ngày" tự động hiển thị mượt mà.
5. **TC-REP-05**: Nhấn nút "Xuất Excel" và "Xuất PDF", kiểm tra hiệu ứng nút xoay loading trong 600ms, thông báo Toast hiện lên và trình duyệt tự động kích hoạt tải xuống tệp tin với tên chuẩn hóa `BaoCao_[LOAI]_[DONVI]_[NGAY].[xlsx/pdf]`.
