# MODULE 12: NGHIỆP VỤ TRA CỨU LOG CDR & NGHE/TẢI GHI ÂM THOẠI IP (CDR MONITORING & AUDIO REPLAY)
## Đường dẫn tài liệu: `docs/modules/12_core_business_cdr_and_audio.md`
## Ánh xạ giao diện mẫu: `templates/cdr-history.html`, `templates/cdr-history.css`, `templates/cdr-history.js`

---

## 1. Mục tiêu & Bối cảnh Nghiệp vụ (Business Overview)

### 1.1. Bối cảnh nghiệp vụ
Hệ thống tổng đài IP PABX của EVN ghi nhận hàng ngày hàng chục nghìn phiên đàm thoại giữa cán bộ nhân viên, điều độ viên hệ thống điện và khách hàng sử dụng điện:
- Mỗi leg SIP sinh ra một bản ghi trong bảng `cdr` kèm tệp ghi âm tương ứng trên máy chủ lưu trữ (File Storage). Cuộc gọi đi qua lõi PABX có **2 leg** (leg A: máy gọi → lõi, leg B: lõi → máy nhận), tức 2 bản ghi. Tiến trình làm giàu gộp các leg theo quy tắc tại `docs/01_database_schema.md` mục 2.1 (`leg_role`, `call_group_key`, `is_primary_leg`).
  - Danh sách lịch sử CDR mặc định chỉ hiển thị leg chính (`is_primary_leg = 1`), mỗi cuộc gọi một dòng.
  - Modal chi tiết và trang QoS debug hiển thị đủ các leg cùng `call_group_key`, kèm file ghi âm và chỉ số QoS riêng của từng leg.
- **Tiến trình làm giàu dữ liệu (Enrichment Pipeline)**:
  - Một tiến trình Batch Scheduler chạy ngầm định thời (Near-Realtime Polling mỗi 3 - 5 giây) tự động đọc các bản ghi mới từ bảng `cdr`, xác định nhóm sở hữu số gọi đi và số gọi đến, rồi sao chép sang bảng `cdr_enriched` kèm 2 trường `caller_group_id` và `called_group_id`.
  - Nếu số điện thoại thuộc dải số do một nhóm người dùng quản lý (tra cứu **duy nhất** qua chuỗi `phone_numbers.range_id → phone_prefix_ranges.prefix_group_id → user_groups.phone_prefix_group_id` (mọi trạng thái số, quy tắc tại `docs/01_database_schema.md` mục 8); không so khớp theo `prefix` hay `range_from..range_to`), trường tương ứng nhận ID nhóm; nếu chưa quy hoạch hoặc ngoại mạng thì nhận giá trị `NULL`.
- **Nguyên tắc Cô lập dữ liệu theo nhóm (Group-Based Data Isolation)**:
  - **Mọi tương tác của Backend đối với dữ liệu CDR (truy vấn danh sách, xem chi tiết, thống kê QoS, thống kê thời lượng & lưu lượng thoại) đều thực hiện độc quyền trên bảng `cdr_enriched`**.
  - **Người dùng đơn vị (User / Group Admin)**: Chỉ được phép truy cập các bản ghi CDR nếu số gọi đi HOẶC số nhận cuộc gọi thuộc quyền quản lý của nhóm người dùng của họ:
    ```sql
    WHERE (caller_group_id = :currentUserGroupId OR called_group_id = :currentUserGroupId)
    ```
  - **Quản trị viên hệ thống (Admin Portal)**: Được toàn quyền xem 100% bản ghi CDR (bao gồm cả các bản ghi có `caller_group_id` hoặc `called_group_id` bằng `NULL`). Thông tin nhóm của bên gọi và bên nghe được hiển thị trực tiếp dưới dạng nhãn Badge; kèm bộ lọc "Nhóm người dùng" để lọc nhanh theo đơn vị.
- **Phân quyền Ghi âm Kiểm soát 2 Tầng (2-Tier Recording Access Gate)**:
  - **Tầng 1 (Cấp nhóm - Do Quản trị viên hệ thống cấp phép)**:
    - Quản trị viên hệ thống quyết định cấp quyền truy cập ghi âm cho Nhóm người dùng thông qua trường `user_groups.allow_recording_access` (cấu hình trong form Thêm/Sửa nhóm).
    - **Khi nhóm chưa được cấp phép (`allow_recording_access = 0`)**:
      + Cột "File ghi âm" hoàn toàn không xuất hiện trên bảng lịch sử cuộc gọi (`cdr-history.html`) của toàn bộ người dùng nhóm đó (bảng tự động co lại còn 6 cột).
      + Trong Modal chi tiết cuộc gọi, khối Audio Player được thay thế hoàn toàn bằng thông báo trang nhã: *"Tính năng ghi âm chưa được kích hoạt cho đơn vị của bạn"*.
      + Trên giao diện Quản trị nhóm (`group-admin.html`), các nút bấm, cột và switch phân quyền ghi âm cho thành viên bị ẩn triệt để; Quản trị viên nhóm không có quyền nghe/tải và không thể cấp quyền cho ai.
      + Backend API chặn tức thì mọi yêu cầu stream và download với mã lỗi `403 Forbidden` (`Tổ chức/Nhóm người dùng của bạn chưa được cấp phép sử dụng tính năng ghi âm`).
    - **Khi nhóm được cấp phép (`allow_recording_access = 1`)**: Kích hoạt phân quyền Tầng 2.
  - **Tầng 2 (Vai trò - Do Quản trị viên nhóm đổi vai trò thành viên khi Tầng 1 đã mở)**: quyền `cdr:listen_audio`/`cdr:download_audio` thuộc vai trò (`permission_roles`), không lưu cờ trên người dùng.
    - **Quản trị viên nhóm (`GROUP_ADMIN`)**: Vai trò có sẵn hai quyền này, nên mặc định nghe/tải được ghi âm của nhóm.
    - **Ủy quyền cho thành viên**: Quản trị viên nhóm đổi vai trò thành viên giữa `REGULAR_USER` và `USER_RECORDING` (`PUT /api/v1/users/:id/role`, `docs/modules/10_permissions_and_roles.md` mục 1.3).
    - Thành viên nghe ghi âm (`USER_RECORDING`): Được phép nghe luồng âm thanh trực tuyến và tải file ghi âm của các cuộc gọi thuộc nhóm mình.
    - Thành viên (`REGULAR_USER`): Giao diện hiển thị nhãn ổ khóa `Chưa cấp quyền`, không thể phát hoặc tải âm thanh; Backend chặn `403 FORBIDDEN_PERMISSION`.
- **Kênh ghi âm**: chỉ có `Recorded_Mix_FileName` (âm thanh trộn hai chiều, `.wav`, mỗi leg một file). `Recorded_RX_FileName`/`Recorded_TX_FileName` luôn NULL trên dữ liệu thật và không được dùng (mục 2.3).

---

## 2. Thiết kế Cơ sở Dữ liệu & Lưu trữ Tệp tin

### 2.1. Bảng `cdr_enriched` (87 cột gốc của `cdr` + các cột làm giàu, định nghĩa đầy đủ tại `docs/01_database_schema.md` mục 2.1)
Bảng trung tâm lưu trữ toàn bộ dữ liệu CDR đã được làm giàu, phục vụ Backend:
- `id`: Định danh duy nhất (khóa chính, kế thừa 1-1 từ `cdr.id`).
- `Created`, `Answered`, `Destroyed`: Mốc thời gian khởi tạo, bắt máy, ngắt kết nối.
- `Direction`: Giá trị thô của PABX (luôn `'remote'` trên dữ liệu thật), không mang nghĩa hướng gọi. Hướng gọi `Inbound`/`Outbound`/`Internal` được tính lúc truy vấn (xem tham số `direction` ở mục 3.1).
- `CallerId`, `CallerDisplayName`: Thông tin phía gọi.
- `CalledId`, `CalledDisplayName`: Thông tin phía nhận.
- `caller_group_id`: ID nhóm sở hữu số gọi đi (`user_groups.id`, `NULL` nếu chưa quy hoạch/ngoại mạng).
- `called_group_id`: ID nhóm sở hữu số nhận cuộc gọi (`user_groups.id`, `NULL` nếu chưa quy hoạch/ngoại mạng).
- `enriched_at`: Thời điểm tiến trình hoàn tất làm giàu dữ liệu.
- `leg_role`: Vai trò leg (`A_LEG`, `B_LEG`, `UNKNOWN`) xác định theo setting `pabx_core_ip_list`.
- `call_group_key`: `id` của leg chính; các leg của cùng một cuộc gọi mang cùng giá trị.
- `is_primary_leg`: `1` nếu là leg chính (được đếm vào thống kê, hiển thị trong danh sách), `0` nếu là leg phụ.
- `DisconnectionStatus`: Reason-phrase SIP thô do PABX ghi (`OK`, `RequestTerminated`, `TemporarilyUnavailable`, `RequestTimeout`, `ServiceUnavailable`, `BusyHere`, `Declined`, `NotFound`). Chỉ dùng để hiển thị, không dùng để lọc/đếm.
- `DisconnectionCode`: Mã ngắt cuộc gọi chuẩn SIP (ví dụ: `200`, `480`, `486`, `487`, `503`).
- `call_status`: Trạng thái chuẩn hóa `ANSWERED` | `BUSY` | `NO_ANSWER` | `FAILED`, ánh xạ từ `DisconnectionCode` theo bảng tại `docs/01_database_schema.md` mục 2.1. Mọi bộ lọc trạng thái và thống kê dùng cột này.
- `Answered_Duration`: Thời lượng đàm thoại thô do PABX ghi, tính bằng **mili-giây**. Không dùng trực tiếp.
- `answered_duration_sec`: Thời lượng đàm thoại (giây) = `ROUND(Answered_Duration / 1000)` nếu `call_status = ANSWERED`, ngược lại `0`. Trường `duration` của API lấy từ cột này.
- `call_type`: `INTRA_GROUP` / `INTER_GROUP` / `UNASSIGNED` (quy tắc tại `docs/01_database_schema.md` mục 9).
- `Recorded_Mix_FileName`: Đường dẫn **tuyệt đối trên máy PABX** (Windows) của file ghi âm `.wav` kênh trộn của leg, ví dụ `D:\StarTrinity\recordings\2025_06_11\08_03_06_591_42118_42200_<SipCallId>.wav`. Có ở 100 % bản ghi thật. Backend đổi sang đường dẫn cục bộ theo setting `recording_path_map` (mục 2.3).
- `Recorded_RX_FileName`, `Recorded_TX_FileName`: luôn NULL trên dữ liệu thật; giữ cột nhưng **không dùng** (hệ thống chỉ có kênh Mix).
- `Sip_Pcap_FileName`, `Sip_And_Rtp_Pcap_FileName`: PABX có ghi (`Sip_And_Rtp_Pcap_FileName` có ở ~98 % bản ghi), hệ thống chưa khai thác trong phiên bản này; không có API cho PCAP.

### 2.2. Bảng Trạng thái Đồng bộ Làm giàu `cdr_enrichment_state`
Quản lý High-Watermark cho tiến trình Batch Scheduler định thời (3-5 giây):
- `last_processed_cdr_id`: ID bản ghi cao nhất đã đọc từ bảng `cdr`.
- `batch_size`: Số bản ghi xử lý trong 1 mẻ (mặc định 1000).
- `status`: `IDLE`, `PROCESSING`, `ERROR`.

### 2.3. Truy cập file ghi âm từ backend
- Thư mục ghi âm của PABX (`D:\StarTrinity\recordings\`, chia theo ngày `YYYY_MM_DD`) được chia sẻ qua SMB/NFS và **gắn chỉ đọc** lên server backend, ví dụ `/mnt/pabx_recordings/`. Hệ thống không sao chép, không chuyển mã và không xóa file (việc dọn file thuộc phía PABX).
- Setting `recording_path_map` (nhóm `ADVANCED`, JSON) ánh xạ tiền tố đường dẫn PABX sang đường dẫn cục bộ, ví dụ `[{"from": "D:\\StarTrinity\\recordings\\", "to": "/mnt/pabx_recordings/"}]`.
- Thuật toán tìm file của một leg: lấy `Recorded_Mix_FileName` → so khớp tiền tố `from` (không phân biệt hoa thường) → thay bằng `to` → đổi `\` thành `/` → chuẩn hóa đường dẫn (`path.resolve`) → **bắt buộc** kết quả vẫn nằm trong thư mục `to` (chặn path traversal), sai thì `404`.
- `hasAudio` trong các API danh sách/chi tiết = `Recorded_Mix_FileName IS NOT NULL` (không kiểm tra file thật). Khi stream/tải mà file không tồn tại: `404` với mã lỗi `RECORDING_FILE_NOT_FOUND`.
- Mỗi leg có file riêng; trình phát mặc định phát leg chính, modal chi tiết cho chọn leg (`legs[]`).

---

## 3. Đặc tả API Contracts

### 3.1. Tra cứu danh sách CDR (`GET /api/v1/cdr`)
- **Headers**: `Authorization: Bearer <token>`
- **Query Parameters**:
  - `fromDate`, `toDate`: bắt buộc, ISO 8601 (vd: `2026-05-25T00:00:00+07:00`); khoảng tối đa **31 ngày**, mặc định 7 ngày gần nhất; vượt quá trả `400`. Ngoài cửa sổ `retention_online_months` chỉ Admin truy cập được qua `includeArchive=true`.
  - `toDate`: Định dạng ISO (vd: `2026-05-25T23:59:59`)
  - `callerId`: Chuỗi tìm kiếm số gọi đi (vd: `45678`)
  - `calledId`: Chuỗi tìm kiếm số nhận (vd: `46001`)
  - `status`: `all` | `ANSWERED` | `NO_ANSWER` | `BUSY` | `FAILED` (lọc theo `cdr_enriched.call_status` của leg chính)
  - `direction`: `all` | `Inbound` | `Outbound` | `Internal`. Hướng gọi **tính lúc truy vấn** so với nhóm đang xem `:g` (nhóm của người dùng, hoặc `groupId` Admin chọn), không lưu thành cột. Ví dụ `Outbound`: `caller_group_id = :g AND (called_group_id <> :g OR called_group_id IS NULL)`; công thức đầy đủ tại `docs/01_database_schema.md` mục 2.1. Admin không chọn `groupId` thì dùng `callType` (`INTRA_GROUP` | `INTER_GROUP` | `UNASSIGNED`) thay cho `direction`.
  - `callType`: (Chỉ dành cho Admin Scope khi không chọn `groupId`) lọc theo `cdr_enriched.call_type`.
  - `includeArchive`: (Chỉ dành cho Admin Scope, mặc định `false`) cho phép tra cứu dữ liệu cũ hơn `retention_online_months`. Khi `true`, bắt buộc `fromDate`/`toDate`, khoảng tối đa 31 ngày. Người dùng nhóm luôn bị giới hạn trong cửa sổ trực tuyến; `fromDate` cũ hơn cửa sổ trả `400`.
  - `fromDate`/`toDate` luôn được áp dụng (mặc định 7 ngày gần nhất) để truy vấn chỉ quét đúng partition (`docs/01_database_schema.md` mục 2.1).
  - `groupId`: (Chỉ dành cho Admin Scope) Lọc theo ID nhóm người dùng (cả gọi đi hoặc nhận)
  - Bộ lọc nâng cao (yêu cầu quyền `cdr:filter_advanced`; gửi các tham số này khi thiếu quyền thì trả `403`): `callerIp`, `calledIp`, `disconnectionCode` (một hoặc nhiều mã, phân tách dấu phẩy), `codec` (`G711U`, `G711A`...), `releasedBy` (`caller` | `called`), `minMos`/`maxMos` (thang thập phân).
  - Trường `direction` trong response được tính theo nhóm đang xem; bằng `null` khi Admin không chọn `groupId`.
  - `page`: Số trang (mặc định 1)
  - `limit`: Số dòng mỗi trang (10, 20, 50 - mặc định 10)
- **Quy tắc Kiểm tra Phân quyền tại Backend**:
  - **User Portal**: Backend tự động thêm mệnh đề SQL:
    ```sql
    AND (caller_group_id = :userGroupId OR called_group_id = :userGroupId)
    ```
  - **Admin Portal**: Không tự động lọc nhóm; nếu có `groupId` trên query param thì lọc theo `(caller_group_id = :groupId OR called_group_id = :groupId)`.
- **Response**:
```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "id": "00000000000000005370",
      "created": "2026-05-25T10:15:32+07:00",
      "callerId": "45678",
      "callerDisplayName": "Ban Kỹ thuật EVN",
      "callerGroup": {
        "id": 1,
        "code": "UG-KT-01",
        "name": "Nhóm Kỹ thuật Ban KT"
      },
      "calledId": "46001",
      "calledDisplayName": "Trực ban Vận hành IT",
      "calledGroup": {
        "id": 2,
        "code": "UG-IT-01",
        "name": "Khối CNTT"
      },
      "direction": "Inbound",
      "status": "ANSWERED",
      "callType": "INTER_GROUP",
      "disconnectionCode": "200",
      "disconnectionStatus": "OK",
      "mos": 4.41,
      "duration": 135,
      "durationFormatted": "02:15",
      "hasAudio": true,
      "audioFileName": "10_15_32_120_45678_46001_0_656507171@10.65.7.1.wav",
      "canAccessAudio": true
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1245,
    "totalPages": 125
  }
}
```

> [!NOTE]
> Trường `canAccessAudio` được Backend tính toán động cho từng dòng dựa trên mô hình kiểm soát 2 tầng:
> - Đối với Admin Portal: `true` nếu vai trò có `cdr:listen_audio` (cả `ROOT_ADMIN` và `SYSTEM_ADMIN` đều có).
> - Đối với User Portal:
>   + Nếu nhóm chưa được cấp phép ghi âm (`user.group.allow_recording_access === 0`): Trả về `canAccessAudio: false`, `hasAudio: false`, `audioFileName: null`.
>   + Nếu nhóm đã được cấp phép (`user.group.allow_recording_access === 1`): Trả về `true` nếu vai trò của người dùng có `cdr:listen_audio` (`GROUP_ADMIN`, `USER_RECORDING`); ngược lại (`REGULAR_USER`) trả về `false`.
> - Nếu số điện thoại chưa gán nhóm nào, `callerGroup` hoặc `calledGroup` trả về `null` (Frontend hiển thị badge "Chưa xác định nhóm").

### 3.1.1. Xuất danh sách CDR (`GET /api/v1/cdr/export`)

- **Guard**: `UserAuthGuard` trên route User; bản sao `/api/v1/admin/...` dùng `AdminAuthGuard` (quy tắc tách portal tại `docs/02_api_contracts.md` mục 1.1). `Permission: cdr:export`
- **Query params**: giống `GET /api/v1/cdr` (trừ `page`, `limit`), thêm `format=xlsx|csv`.
- **Phạm vi**: chỉ leg chính (`is_primary_leg = 1`), cô lập nhóm như API danh sách. File không kèm ghi âm. Mỗi lần xuất ghi `audit_logs` (`resource_name = CDR`, `action = EXPORT_CDR`).
- **Lưu ý route**: khai báo `/cdr/export` trước `/cdr/:id` trong controller để không bị bắt nhầm thành `:id = 'export'`.

### 3.2. Xem chi tiết 87 tham số CDR (`GET /api/v1/cdr/:id`)
- **Backend xử lý**: Truy vấn từ `cdr_enriched`. Kiểm tra cô lập dữ liệu nhóm nếu người gọi thuộc User Portal (`caller_group_id = user.user_group_id OR called_group_id = user.user_group_id`). Nếu không đúng -> `403 FORBIDDEN`.
- **Response** gồm hai phần:
  - **Trường nghiệp vụ camelCase** ở cấp trên cùng: toàn bộ trường của item `GET /cdr` (`id`, `created`, `answered`, `destroyed`, `callerId`, `callerDisplayName`, `callerGroup`, `calledId`, `calledDisplayName`, `calledGroup`, `direction`, `status`, `callType`, `disconnectionCode`, `disconnectionStatus`, `releasedBy`, `duration`, `mos`, `hasAudio`, `canAccessAudio`), cộng thêm `callGroupKey`, `legRole`, `isPrimaryLeg`, `legs[]`, `qos` (`mosCaller`, `mosCalled`, `rFactorCaller`, `rFactorCalled`, `lossPercent`, `jitterMeanMs`, `jitterMaxMs`, `codec`) và `sipDelays` (`sip100DelayMs`, `sip180DelayMs`, `sip183DelayMs`, `answerDelayMs`).
  - **Object `raw`**: đủ **87 cột của bảng `cdr` với nguyên tên cột PABX** (`"RTP_Caller_G107MOS": 4`, `"_100_Delay": 14`, `"Recorded_Mix_FileName": "..."`…), giá trị giữ nguyên như trong DB (thời gian theo định dạng ISO `+07:00`). Dùng cho tab "Thông số kỹ thuật"; đường dẫn file ghi âm trong `raw` chỉ trả cho người có quyền nghe/tải.
- `:id` là `cdr_enriched.id` của một leg bất kỳ. Response có thêm mảng `legs[]` gồm mọi leg cùng `call_group_key` (mỗi phần tử: `id`, `legRole`, `isPrimaryLeg`, `callerIp`, `calledIp`, `mos`, `hasAudio`), leg chính đứng đầu. Các API audio `/cdr/:id/audio/*` phát file ghi âm của **đúng leg** có `id` đó.

### 3.3. Phát luồng âm thanh ghi âm (`GET /api/v1/cdr/:id/audio/stream`)
- **Query params**: không có (chỉ có kênh Mix).
- **HTTP Header Hỗ trợ**: `Range: bytes=0-`
- **Xử lý Kiểm tra Nghiêm ngặt tại Backend (2-Tier Recording Gate Check)**:
  1. Truy vấn bản ghi từ `cdr_enriched` theo `:id`.
  2. **Kiểm tra Cô lập Dữ liệu (Group Isolation Check)**:
     - Nếu là User Portal: Kiểm tra `(record.caller_group_id == user.user_group_id || record.called_group_id == user.user_group_id)`. Nếu sai -> ném `ForbiddenException('Bạn không có quyền truy cập dữ liệu cuộc gọi của nhóm khác')`.
  3. **Kiểm tra Phân quyền Ghi âm 2 Tầng (2-Tier Recording Gate)**: do `PermissionsGuard` thực hiện trước khi vào service (`@RequirePermissions('cdr:listen_audio')`, thuật toán `docs/modules/10_permissions_and_roles.md` mục 2.3):
     - Nếu là User Portal:
       + **Tầng 1 (Quyền nhóm)**: `user_groups.allow_recording_access = 1`. Nếu bằng 0 -> `403 GROUP_RECORDING_DISABLED` ('Tổ chức/Nhóm người dùng của bạn chưa được Quản trị viên hệ thống kích hoạt tính năng ghi âm').
       + **Tầng 2 (Quyền vai trò)**: vai trò trong token phải có `cdr:listen_audio` (`GROUP_ADMIN`, `USER_RECORDING`). Nếu không -> `403 FORBIDDEN_PERMISSION` ('Bạn chưa được Quản trị viên nhóm cấp quyền nghe và tải ghi âm').
     - Nếu là Admin Portal: chỉ xét quyền vai trò.
  4. Tìm file theo thuật toán mục 2.3 (`recording_path_map`); không có file thì `404 RECORDING_FILE_NOT_FOUND`. Stream với Header `Accept-Ranges: bytes`, `Content-Type: audio/wav`, trả về mã `206 Partial Content` khi có `Range`.
  5. Ghi `audit_logs` (`docs/01_database_schema.md` mục 13): `action = 'LISTEN_AUDIO'`, `resource_name = 'AUDIO'`, `resource_id` = id leg CDR, `actor_type`/`actor_id`/`actor_name` theo tài khoản gọi API (`USER` hoặc `ADMIN`), `ip_address`, `user_agent`, `action_details = { "userGroupId": <nhóm của người gọi, NULL với Admin>, "callGroupKey": <call_group_key> }`.

### 3.4. Tải file ghi âm cuộc gọi (`GET /api/v1/cdr/:id/audio/download`)
- **Query params**: không có.
- **Xử lý Backend**:
  1. Thực hiện các bước kiểm tra cô lập nhóm và kiểm tra 2 tầng (Group Gate & Member Gate) tương tự API stream ở mục 3.3.
  2. Đính kèm Header `Content-Disposition: attachment; filename="..."`.
  3. Stream file về cho Client tải xuống.
  4. Ghi `audit_logs` như mục 3.3 bước 5, với `action = 'DOWNLOAD_AUDIO'`.

---

## 4. Kiến trúc Backend NestJS (`backend/src/core`, `apps/*`)

Theo quy tắc `docs/00_overview_and_architecture.md` mục 5.1: nghiệp vụ và entity ở `core`, controller ở `apps/admin` / `apps/member`, job nền ở `apps/worker`; các phần `apps/*` không import lẫn nhau.

```
backend/src/
├── core/cdr/
│   ├── cdr.module.ts
│   ├── cdr-query.service.ts             <-- tra cứu/chi tiết/xuất cdr_enriched; nhận scope SYSTEM | GROUP (cô lập nhóm)
│   ├── audio-stream.service.ts          <-- Xử lý HTTP Range Request Streaming & Access Control
│   ├── cdr-enrichment.service.ts        <-- Logic làm giàu 1 batch (gộp leg, call_status, MOS, nhóm sở hữu)
│   ├── dto/
│   │   ├── cdr-query.dto.ts
│   │   └── cdr-detail-response.dto.ts
│   └── entities/
│       ├── cdr.entity.ts                <-- Entity ánh xạ bảng cdr gốc từ PABX
│       ├── cdr-enriched.entity.ts       <-- Entity ánh xạ bảng cdr_enriched trung tâm
│       └── cdr-enrichment-state.entity.ts <-- Watermark state tracking
├── apps/admin/cdr/
│   ├── admin-cdr.module.ts
│   ├── cdr.controller.ts                <-- /api/v1/admin/cdr* (scope SYSTEM, groupId, includeArchive)
│   └── dto/admin-cdr-query.dto.ts       <-- mở rộng CdrQueryDto với tham số riêng Admin
├── apps/member/cdr/
│   ├── member-cdr.module.ts
│   ├── cdr.controller.ts                <-- /api/v1/cdr* (scope GROUP, gồm audio/stream, audio/download)
│   └── guards/
│       └── group-data-isolation.guard.ts <-- Kiểm tra quyền truy cập bản ghi theo nhóm người dùng
└── apps/worker/cdr-enrichment/
    ├── cdr-enrichment-worker.module.ts
    └── cdr-enrichment.scheduler.ts      <-- Direct Batch Scheduler polling 3-5s, gọi CdrEnrichmentService
```

### 4.1. Implementation Stream Audio với HTTP 206 trong `audio-stream.service.ts`
```typescript
@Injectable()
export class AudioStreamService {
  constructor(private readonly settings: SystemSettingsService) {}

  // Đổi đường dẫn Windows của PABX sang đường dẫn cục bộ theo recording_path_map (mục 2.3)
  resolveRecordingPath(pabxPath: string | null): string {
    if (!pabxPath) throw new NotFoundException({ code: 'RECORDING_FILE_NOT_FOUND' });
    const maps: { from: string; to: string }[] = this.settings.getJson('recording_path_map');
    const m = maps.find(x => pabxPath.toLowerCase().startsWith(x.from.toLowerCase()));
    if (!m) throw new NotFoundException({ code: 'RECORDING_FILE_NOT_FOUND' });
    const root = path.resolve(m.to);
    const local = path.resolve(root, pabxPath.slice(m.from.length).replace(/\\/g, '/'));
    if (!local.startsWith(root + path.sep)) throw new NotFoundException({ code: 'RECORDING_FILE_NOT_FOUND' });
    return local;
  }

  streamAudioFile(filePath: string, rangeHeader: string | undefined, res: Response) {
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException({ code: 'RECORDING_FILE_NOT_FOUND', message: 'Tệp tin ghi âm không tồn tại trên máy chủ' });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;

    if (rangeHeader) {
      const parts = rangeHeader.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });

      res.writeHead(HttpStatus.PARTIAL_CONTENT, {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'audio/wav',
      });
      file.pipe(res);
    } else {
      res.writeHead(HttpStatus.OK, {
        'Content-Length': fileSize,
        'Content-Type': 'audio/wav',
      });
      fs.createReadStream(filePath).pipe(res);
    }
  }
}
```

### 4.2. Implementation Tiến trình Làm giàu dữ liệu (`apps/worker/cdr-enrichment` + `core/cdr`)

Tiến trình áp dụng đúng các quy tắc tại `docs/01_database_schema.md` mục 2.1 (gộp leg, `call_status`, cột dẫn xuất, MOS) và mục 8 (quyền sở hữu số). Mỗi batch chạy trong **một transaction**: watermark chỉ tiến lên khi toàn bộ batch đã ghi xong.

Lớp lịch chạy nằm ở phần Chạy ngầm, chỉ giữ nhịp và chống chạy chồng:

```typescript
// backend/src/apps/worker/cdr-enrichment/cdr-enrichment.scheduler.ts
@Injectable()
export class CdrEnrichmentScheduler {
  private isRunning = false;

  constructor(
    private readonly cacheVersion: CacheVersionWatcher,
    private readonly enrichment: CdrEnrichmentService,
  ) {}

  @Interval(3000)
  async tick() {
    if (this.isRunning) return;
    this.isRunning = true;
    try {
      await this.cacheVersion.reloadIfChanged(); // nạp lại cache sở hữu số / system_settings khi cache_version đổi
      await this.enrichment.runBatch();
    } finally {
      this.isRunning = false;
    }
  }
}
```

Logic một batch nằm ở phần lõi:

```typescript
// backend/src/core/cdr/cdr-enrichment.service.ts
@Injectable()
export class CdrEnrichmentService {
  private readonly logger = new Logger(CdrEnrichmentService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly numberOwnership: NumberOwnershipCacheService, // map số 5 chữ số -> user_groups.id, dựng từ phone_numbers.range_id
    private readonly settings: SystemSettingsService,
  ) {}

  async runBatch() {
    const qr = this.dataSource.createQueryRunner();
    await qr.connect();
    await qr.startTransaction();
    try {
      // 1. Khóa và đọc watermark (FOR UPDATE chỉ có tác dụng bên trong transaction)
      const [state] = await qr.query(
        'SELECT last_processed_cdr_id, batch_size FROM cdr_enrichment_state WHERE id = 1 FOR UPDATE',
      );
      const rows = await qr.query('SELECT * FROM cdr WHERE id > ? ORDER BY id ASC LIMIT ?', [
        state.last_processed_cdr_id, state.batch_size,
      ]);
      if (rows.length === 0) { await qr.commitTransaction(); return; }

      const coreIps = this.settings.getList('pabx_core_ip_list');
      const internalPattern = new RegExp(this.settings.get('analysis_internal_extension_pattern'));

      for (const r of rows) {
        // 2. Cột dẫn xuất của từng leg
        const callerGroupId = internalPattern.test(r.CallerId ?? '') ? this.numberOwnership.resolve(r.CallerId) : null;
        const calledGroupId = internalPattern.test(r.CalledId ?? '') ? this.numberOwnership.resolve(r.CalledId) : null;
        const callStatus = mapCallStatus(r.DisconnectionCode); // bảng ánh xạ 01 §2.1
        const mosCaller = mosX100FromR(r.RTP_Caller_G107R);    // E-model, NULL nếu R NULL
        const mosCalled = mosX100FromR(r.RTP_Called_G107R);
        const leg = {
          // Chép các cột kỹ thuật của PABX theo danh sách cột cố định (87 cột của cdr, trừ created_at/updated_at)
          ...pickPabxColumns(r),
          Created: r.Created ?? r.Destroyed ?? new Date(),
          caller_group_id: callerGroupId,
          called_group_id: calledGroupId,
          leg_role: coreIps.includes(r.CalledIp) ? 'A_LEG' : coreIps.includes(r.CallerIp) ? 'B_LEG' : 'UNKNOWN',
          call_status: callStatus,
          answered_duration_sec: callStatus === 'ANSWERED' ? Math.round((r.Answered_Duration ?? 0) / 1000) : 0,
          call_type: classifyCallType(callerGroupId, calledGroupId), // INTRA_GROUP / INTER_GROUP / UNASSIGNED
          mos_caller_x100: mosCaller,
          mos_called_x100: mosCalled,
          mos_x100: avgNullable(mosCaller, mosCalled),
          call_group_key: r.id,  // tạm thời: chính nó; bước 4 có thể đổi
          is_primary_leg: 1,
          enriched_at: new Date(),
        };

        // 3. Ghi leg (idempotent khi chạy lại batch)
        await upsertCdrEnriched(qr, leg);

        // 4. Gộp leg: tìm leg đối ứng (khác leg_role, cùng CallerId/CalledId, Created lệch <= 2s, chưa có cặp)
        await regroupLegs(qr, leg); // đặt call_group_key chung, is_primary_leg theo quy tắc 3 của 01 §2.1
      }

      // 5. Tiến watermark trong cùng transaction
      await qr.query(
        `UPDATE cdr_enrichment_state
            SET last_processed_cdr_id = ?, records_enriched_total = records_enriched_total + ?,
                last_run_at = NOW(), last_success_at = NOW(), status = 'IDLE', error_message = NULL
          WHERE id = 1`,
        [rows[rows.length - 1].id, rows.length],
      );
      await qr.commitTransaction();
    } catch (err: any) {
      await qr.rollbackTransaction();
      this.logger.error(`Lỗi tiến trình CDR Enrichment: ${err.message}`, err.stack);
      await this.dataSource.query(
        "UPDATE cdr_enrichment_state SET status = 'ERROR', error_message = ?, last_run_at = NOW() WHERE id = 1",
        [err.message],
      );
    } finally {
      await qr.release();
    }
  }
}
```

- `NumberOwnershipCacheService` dựng map `phone_number → user_groups.id` **chỉ** từ chuỗi `phone_numbers.range_id → phone_prefix_ranges.prefix_group_id → user_groups.phone_prefix_group_id` (mọi trạng thái số, theo `01` §8). Không tra theo `prefix` hay `range_from..range_to`. Cache được nạp khi khởi động và nạp lại khi `cdr_enrichment_state.cache_version` khác bản đang giữ (kiểm tra ở đầu mỗi chu kỳ); API tăng `cache_version` sau mỗi thao tác cấp phát/thu hồi dải số.
- `CdrEnrichmentScheduler` nằm trong `src/apps/worker/cdr-enrichment/`, chỉ được `WorkerAppModule` import và chạy ở tiến trình `backend-worker` (đúng 1 instance). `CdrModule` trong `core` chỉ export `CdrEnrichmentService`, không chứa lớp lịch chạy (`docs/00_overview_and_architecture.md` mục 2.1, 5.1).
- Thay đổi `analysis_internal_extension_pattern` hoặc `pabx_core_ip_list` chỉ áp dụng cho bản ghi làm giàu sau thời điểm lưu.
- Watermark theo `id` giả định PABX là **một tiến trình ghi duy nhất**, cấp `id` tăng dần theo thứ tự commit (đúng với dữ liệu thật).
- Khi ghi hoặc đổi leg chính của một bản ghi có `Created` cũ hơn 3 giờ, tiến trình thêm (`DATE(Created)`, `HOUR(Created)`) vào `stats_recompute_queue` (`INSERT IGNORE`) để job tổng hợp tính lại khung giờ đó (`docs/01_database_schema.md` mục 15.0).

---

## 5. Kiến trúc Frontend Vue 3 (`frontend/src/apps/admin/views/cdr/CdrHistoryView.vue` & `frontend/src/apps/member/views/cdr/CdrHistoryView.vue`)

### 5.1. Bố cục Giao diện (Ánh xạ `templates/cdr-history.html`)
- **Page Header**: Tiêu đề "Tra cứu Lịch sử Cuộc gọi (CDR)", phụ đề hướng dẫn.
- **Khung Bộ lọc tìm kiếm (`.search-filter-wrapper`)**:
  - Tiêu đề "Bộ lọc tìm kiếm", nút "Xóa bộ lọc" (`btn-outline`).
  - Lưới lọc (`.filter-grid`):
    - Khoảng thời gian: Ô chọn ngày giờ từ (`filterFromDate`) đến (`filterToDate`).
    - Số gọi đi (`filterCallerId`) và Số nhận (`filterCalledId`).
    - Trạng thái kết nối (`filterStatus`): Dropdown options (`ANSWERED`, `NO_ANSWER`, `BUSY`, `FAILED`), giá trị gửi lên khớp enum `call_status`.
    - **Bộ lọc Nhóm người dùng (`#filterGroupSelect`)**: Chỉ hiển thị trên giao diện của Quản trị viên hệ thống (Admin Portal), cho phép chọn xem dữ liệu của một nhóm cụ thể hoặc "Tất cả các nhóm".
    - Nút "Tìm kiếm" lớn (`.search-btn-large`) kèm icon kính lúp.
- **Bảng dữ liệu cuộc gọi (`.data-table`)**:
  - Cột 1: Thời gian (`.datetime-cell` hiển thị Ngày và Giờ).
  - Cột 2: Số gọi đi (`.phone-number.text-primary` kèm nhãn Badge đơn vị/nhóm `.badge-group` ví dụ `[Khối CNTT]`, nếu chưa quy hoạch thì hiển thị `.badge-unassigned` `[Chưa xác định nhóm]`).
  - Cột 3: Số nhận (`.phone-number` kèm nhãn Badge đơn vị/nhóm tương tự).
  - Cột 4: Hướng gọi (Badge `.badge-inbound`, `.badge-outbound`, `.badge-internal`).
  - Cột 5: Trạng thái (Badge `.status-badge.success` cho Answered, `.error` cho No Answer, `.warning` cho Busy).
  - Cột 6: Thời lượng (`MM:SS`).
  - Cột 7: File ghi âm & Quyền truy cập (Áp dụng Chốt chặn Tầng 1):
    - **Nếu nhóm chưa được cấp phép ghi âm (`currentUser.group.allowRecordingAccess === false`)**: Cột 7 này **hoàn toàn không được render vào bảng** (bảng tự động co về 6 cột).
    - **Nếu nhóm đã được cấp phép (`currentUser.group.allowRecordingAccess === true`)**:
      - Nếu có file ghi âm VÀ `canAccessAudio == true`: Render thanh phát âm thanh `<audio controls class="custom-audio" :src="streamUrl">` kèm nút Tải xuống `.btn-download`.
      - Nếu có file ghi âm NHƯNG `canAccessAudio == false`: Render nhãn vô hiệu hóa có biểu tượng ổ khóa: `<span class="badge-locked" title="Chưa được Quản trị viên nhóm cấp quyền nghe"><svg>...</svg> Chưa cấp quyền</span>`.
      - Nếu không có file ghi âm: Render `<span class="text-muted text-sm italic">Không có ghi âm</span>`.
- **Modal Chi tiết cuộc gọi (`#cdrDetailModal`)**:
  - Khi nhóm chưa được cấp phép ghi âm: Thay thế toàn bộ khối phát Audio Player bằng khung thông báo chuyên dụng: `<div class="recording-notice-box"><svg>...</svg><span>Tính năng ghi âm chưa được kích hoạt cho đơn vị của bạn</span></div>`.
- **Phân trang (`.pagination-container`)**:
  - Chọn hiển thị 10, 20, 50 bản ghi mỗi trang.
  - Các nút điều hướng trang: Đầu, Trước, 1, 2, 3, Tiếp, Cuối.

---

## 6. Kịch bản kiểm thử (Test Plan for Agent)
1. **TC-CDR-01**: Lọc cuộc gọi theo số gọi đi `45678`, kiểm tra danh sách trả về từ `cdr_enriched` chỉ chứa các cuộc gọi có `CallerId == 45678`.
2. **TC-CDR-02**: Nhấn Play trên thanh Audio Player của dòng cuộc gọi có ghi âm (khi `canAccessAudio == true`), kiểm tra trình duyệt nhận mã HTTP `206 Partial Content` và âm thanh phát trơn tru.
3. **TC-CDR-03**: Nhấn nút "Tải xuống", kiểm tra file âm thanh được tải về máy với định dạng `.wav`, và bản ghi tương ứng được lưu trong bảng `audit_logs` với action `DOWNLOAD_AUDIO`.
4. **TC-CDR-04 (Group Isolation)**: Đăng nhập tài khoản thuộc Nhóm A (ví dụ: `user_group_id = 1`), kiểm tra truy vấn danh sách CDR chỉ chứa các cuộc gọi có `caller_group_id = 1` HOẶC `called_group_id = 1`. Tuyệt đối không xuất hiện các bản ghi chỉ thuộc Nhóm B (`caller_group_id = 2` và `called_group_id = 2`).
5. **TC-CDR-05 (Group-Level Gate: allow_recording_access = 0)**:
   - Cấu hình nhóm có `allow_recording_access = 0`.
   - Đăng nhập cả tài khoản Quản trị viên nhóm và Thành viên thường của nhóm này.
   - Xác nhận bảng CDR chỉ hiển thị 6 cột (không có cột "File ghi âm").
   - Mở modal xem chi tiết cuộc gọi: Xác nhận khối audio player được thay thế bằng thông báo: *"Tính năng ghi âm chưa được kích hoạt cho đơn vị của bạn"*.
   - Gửi request trực tiếp đến `GET /api/v1/cdr/:id/audio/stream` và `GET /api/v1/cdr/:id/audio/download`, xác nhận nhận mã lỗi `403 Forbidden` với message: `Tổ chức/Nhóm người dùng của bạn chưa được cấp phép sử dụng tính năng ghi âm`.
6. **TC-CDR-06 (Recording Access Delegation khi Tầng 1 đã mở)**: 
   - Quản trị viên hệ thống bật `allow_recording_access = 1` cho nhóm.
   - Đăng nhập Quản trị viên nhóm: Xác nhận tự động thấy cột ghi âm và nghe/tải trực tiếp bình thường (mặc định có quyền).
   - Đăng nhập tài khoản thành viên vai trò `REGULAR_USER`: Xác nhận thấy cột ghi âm nhưng ở trạng thái khóa (`badge-locked`).
   - Quản trị viên nhóm vào giao diện `group-admin.html` bật switch "Nghe ghi âm" cho thành viên (đổi vai trò sang `USER_RECORDING`). Đăng nhập lại tài khoản thành viên: Xác nhận nghe và tải file thành công.
7. **TC-CDR-07 (Admin View & Badges)**: Đăng nhập tài khoản Quản trị viên hệ thống (Admin Portal), kiểm tra danh sách hiển thị đầy đủ các bản ghi (kể cả các bản ghi có group_id là `NULL`), trên mỗi dòng xuất hiện đầy đủ nhãn Badge của bên gọi và bên nghe. Lọc thử theo `groupId = 1`, kiểm tra kết quả trả về chính xác.

