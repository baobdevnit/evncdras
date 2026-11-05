# MODULE 06: QUẢN LÝ THÔNG BÁO (NOTIFICATIONS: IN-APP & EMAIL)

## Đường dẫn tài liệu: `docs/modules/06_notifications.md`

## Ánh xạ giao diện mẫu: `templates/notifications.html`, `templates/notifications.css`, `templates/notifications.js`

---

## 1. Mục tiêu & Nghiệp vụ (Business Overview)

### 1.1. Bối cảnh nghiệp vụ

Hệ thống giám sát viễn thông EVN đòi hỏi khả năng cảnh báo sớm khi phát hiện các bất thường:

1. **Sự cố Chất lượng thoại (`QOS_ALERT`)**: sinh **theo giờ** khi chỉ số của khung giờ đã kết thúc ít nhất 60 phút (toàn hệ thống hoặc một nhóm) vượt ngưỡng trong `qos_threshold_configs` (MOS, mất gói, jitter, ASR), với khung giờ có ít nhất `qos_alert_min_calls` cuộc gọi. Không cảnh báo từng cuộc gọi. Ngưỡng, chống trùng và người nhận định nghĩa tại `docs/01_database_schema.md` mục 10.
2. **Mất kết nối Tổng đài PABX (`PABX_OFFLINE`)**: tiến trình làm giàu không đọc được bản ghi `cdr` mới trong `pabx_offline_minutes` (mặc định 60 phút, tính theo giờ backend); khi có dữ liệu trở lại thì tạo thông báo `INFO`.
3. **Sự cố tiến trình nền (`SYSTEM_JOB`)**: chỉ gửi Admin. `CRITICAL` khi tiến trình làm giàu CDR không chạy thành công quá 10 phút (do `backend-api` phát hiện, nên báo được cả khi worker chết), `INFO` khi chạy lại; `WARNING` tối đa 1 lần/ngày khi có CDR bị cách ly vì lỗi dữ liệu (`docs/01_database_schema.md` mục 2.3, 2.4).
4. **Bảo trì hệ thống (Maintenance Notice)**: Thông báo lịch nâng cấp định kỳ do EVNICT phát động.

### 1.2. Kênh phát thông báo

- **In-App Realtime Notification**: Bắn tín hiệu tức thời qua WebSocket (Socket.IO). Cập nhật số đếm badge chưa đọc (`.notification-badge-global`) trên thanh Sidebar mà không cần F5 trình duyệt.
- **Email Notification**: chỉ với thông báo `CRITICAL`, tới người nhận đã bật `email_notification_enabled`. Tạo thông báo chỉ đặt `notification_recipients.email_status = 'PENDING'`; job `email-dispatch` của `backend-worker` gửi qua SMTP (`smtp_*` trong `system_settings`) mỗi 1 phút, thử tối đa 3 lần, bỏ email của thông báo quá 24 giờ (`docs/01_database_schema.md` mục 11). Gửi lỗi không chặn việc tạo thông báo.
- **Người nhận**: luôn tạo một dòng `notification_recipients` cho mỗi tài khoản nhận (không có thông báo "global" không có người nhận). Admin soạn thông báo qua `POST /api/v1/admin/notifications` với `type` = `SYSTEM_MAINTENANCE` | `GENERAL` và `target` = `ALL_ADMINS` | `ALL_USERS` | `GROUP:{id}` | `EVERYONE`. Người nhận chỉ gồm tài khoản `ACTIVE` (người dùng chỉ thuộc nhóm `ACTIVE`); `GROUP:{id}` của nhóm `INACTIVE` trả `409 GROUP_INACTIVE` (`docs/01_database_schema.md` mục 10). Mỗi thông báo Admin soạn ghi `audit_logs` `SYSTEM / CREATE_NOTIFICATION` (`docs/01_database_schema.md` mục 13).

---

## 2. Thiết kế Dữ liệu (Database Schema)

Bảng MariaDB: `notifications` và `notification_recipients` (Mô tả chi tiết tại `docs/01_database_schema.md`).

---

## 3. Đặc tả API Contracts

### 3.1. Danh sách thông báo (`GET /api/v1/notifications`)

- **Query params**: `filter` (`UNREAD` | `READ`; không truyền = mọi thông báo, gửi `all` trả `400`, `docs/02_api_contracts.md` mục 2), `page=1`, `limit=20`
- **Response**:

```json
{
  "success": true,
  "statusCode": 200,
  "data": [
    {
      "id": 105,
      "type": "QOS_ALERT",
      "severity": "CRITICAL",
      "title": "MOS khung 09:00–10:00 dưới ngưỡng nghiêm trọng",
      "content": "Nhóm UMO-IT-01: MOS trung bình 2.85 (ngưỡng critical 3.0), 42 cuộc gọi",
      "isRead": false,
      "createdAt": "2026-10-12T11:00:00+07:00",
      "metadata": {
        "userGroupId": 1,
        "metric": "MOS_G107",
        "value": 2.85,
        "threshold": 3.0,
        "statDate": "2026-10-12",
        "statHour": 9
      }
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 42, "totalPages": 3, "hasNext": true, "hasPrev": false },
  "unreadCount": 3
}
```

- `createdAt` của `QOS_ALERT` luôn sau khi khung giờ kết thúc ít nhất 60 phút (khung 09:00–10:00 được đánh giá sớm nhất ở lần chạy 11:00, `docs/01_database_schema.md` mục 10). Cảnh báo đánh giá bù sau khi worker gián đoạn có `metadata.lateEvaluation = true`.
- `pagination` theo khung chung `docs/02_api_contracts.md` mục 2.2. `unreadCount` (tổng số thông báo chưa đọc của người gọi, không phụ thuộc `filter`) là khóa phụ cấp cao được phép theo `docs/02_api_contracts.md` mục 2.2.
- Không có trường thời gian tương đối (`timeAgo`): frontend tự tính từ `createdAt` (`docs/02_api_contracts.md` mục 2).

### 3.2. Đánh dấu đã đọc 1 thông báo (`PUT /api/v1/notifications/:id/read`)

- `:id` là `notifications.id` (trường `id` của phần tử mục 3.1). Người gọi không có dòng `notification_recipients` cho thông báo đó (`uniq_notif_recipient`) thì trả `404`. Đã đọc rồi thì giữ `read_at` cũ.
- **Response**: Trả về `success: true` và `unreadCount` mới.

### 3.3. Đánh dấu đã đọc tất cả (`PUT /api/v1/notifications/mark-all-read`)

- Cập nhật toàn bộ bản ghi của người dùng hiện tại trong bảng `notification_recipients`: `is_read = 1, read_at = NOW()`.

---

## 4. Kiến trúc Backend NestJS (`backend/src/core`, `apps/*`)

Theo quy tắc `docs/00_overview_and_architecture.md` mục 5.1: nghiệp vụ và entity ở `core`, controller ở `apps/admin` / `apps/member`, job nền ở `apps/worker`; các phần `apps/*` không import lẫn nhau.

```
backend/src/
├── core/notifications/
│   ├── notifications.module.ts
│   ├── notifications.service.ts        <-- tạo thông báo + notification_recipients (dedupe_key), đánh dấu đã đọc
│   ├── mailer/
│   │   ├── mailer.service.ts           <-- Gửi Email qua Nodemailer (SMTP đọc từ system_settings)
│   │   └── templates/                  <-- Handlebars HTML template email
│   └── entities/
│       ├── notification.entity.ts
│       └── notification-recipient.entity.ts
├── apps/admin/notifications/
│   ├── admin-notifications.module.ts
│   └── notifications.controller.ts     <-- /api/v1/admin/notifications* (đọc + POST soạn thông báo)
├── apps/member/notifications/
│   ├── member-notifications.module.ts
│   └── notifications.controller.ts     <-- /api/v1/notifications*
├── apps/worker/qos-alert/, apps/worker/pabx-offline/   <-- tạo cảnh báo QOS_ALERT / PABX_OFFLINE qua NotificationsService (docs/modules/13 mục 3)
├── apps/worker/email-dispatch/      <-- email-dispatch.job.ts: mỗi 1 phút gửi email các dòng email_status = PENDING qua MailerService
└── realtime/                           <-- chỉ chạy ở backend-api (AppModule)
    ├── realtime.module.ts
    ├── admin-notifications.gateway.ts  <-- namespace /admin/notifications (JWT_ADMIN_SECRET)
    ├── user-notifications.gateway.ts   <-- namespace /notifications (JWT_USER_SECRET)
    └── notification-push.poller.ts     <-- Đọc notifications mới (cửa sổ 5 phút + tập id đã phát) rồi gọi gateway
```

### 4.1. Implementation Gateway WebSocket (2 namespace theo portal)

Theo quy tắc tách portal (`docs/02_api_contracts.md` mục 1.1 và 4): User và Admin dùng **hai namespace riêng**, mỗi namespace xác minh token bằng secret của portal đó. Token đi trong payload `auth` lúc handshake, không bao giờ trên query string. CORS chỉ cho domain frontend cấu hình trong `FRONTEND_ORIGIN`.

```typescript
// backend/src/realtime/*.gateway.ts – xác minh token bằng UserJwtService / AdminJwtService của core/auth
abstract class BaseNotificationsGateway implements OnGatewayConnection {
  @WebSocketServer() server: Server;
  protected abstract readonly actorType: 'USER' | 'ADMIN';
  protected abstract verify(token: string): Promise<{ id: number; userGroupId?: number }>;

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token as string;
      const actor = await this.verify(token);           // sai secret / hết hạn / PASSWORD_CHANGE_ONLY -> ngắt kết nối
      client.join(`${this.actorType.toLowerCase()}:${actor.id}`);   // room user:{id} hoặc admin:{id}
      if (this.actorType === 'USER') client.join(`group:${actor.userGroupId}`);
      else client.join('admins');
    } catch {
      client.disconnect(true);
    }
  }

  sendToRecipient(recipientId: number, payload: NotificationPayload) {
    this.server.to(`${this.actorType.toLowerCase()}:${recipientId}`).emit('notification:new', payload);
  }
}

@WebSocketGateway({ namespace: '/notifications', cors: { origin: process.env.FRONTEND_ORIGIN } })
export class UserNotificationsGateway extends BaseNotificationsGateway {
  protected readonly actorType = 'USER';
  constructor(private readonly userJwt: UserJwtService) { super(); }
  protected verify(token: string) { return this.userJwt.verifyAccessToken(token); }      // JWT_USER_SECRET
}

@WebSocketGateway({ namespace: '/admin/notifications', cors: { origin: process.env.FRONTEND_ORIGIN } })
export class AdminNotificationsGateway extends BaseNotificationsGateway {
  protected readonly actorType = 'ADMIN';
  constructor(private readonly adminJwt: AdminJwtService) { super(); }
  protected verify(token: string) { return this.adminJwt.verifyAccessToken(token); }     // JWT_ADMIN_SECRET
}
```

- Không có hàm broadcast toàn namespace: thông báo luôn được phát tới room của **từng người nhận** sau khi đã tạo dòng `notification_recipients`.
- **Nguồn phát duy nhất là `NotificationPushPoller`** (`docs/00_overview_and_architecture.md` mục 2.1). Cảnh báo do `backend-worker` tạo (QoS, PABX offline) và thông báo do Admin soạn qua API đều chỉ ghi DB; không service nào gọi `sendToRecipient` trực tiếp. Mỗi instance `backend-api` chạy poller riêng:
  - Poller giữ trong bộ nhớ tập `pushedIds` (id thông báo đã phát trong 5 phút gần nhất). **Không dùng watermark `id`**: thông báo được ghi đồng thời từ `backend-api` và `backend-worker`, id nhỏ hơn có thể commit sau id lớn hơn, nên watermark sẽ bỏ sót thông báo (`docs/01_database_schema.md` mục 11).
  - Khởi động: nạp vào `pushedIds` mọi id có `created_at >= :since` (`:since` = thời điểm hiện tại − 5 phút, backend tính), nên không phát lại thông báo cũ.
  - Mỗi 3 giây: `SELECT id FROM notifications WHERE created_at >= :since ORDER BY id` (index `idx_notif_created`), bỏ các id đã có trong `pushedIds`. Với mỗi id mới, đọc dòng `notifications` (`type`, `severity`, `title`, `content`, `metadata`, `created_at`) để dựng payload `notification:new` (`docs/02_api_contracts.md` mục 4), rồi đọc **toàn bộ** người nhận `SELECT recipient_type, recipient_id FROM notification_recipients WHERE notification_id = ?` (không cắt theo số dòng; một thông báo `EVERYONE` có thể có hàng nghìn người nhận), gọi `sendToRecipient` của gateway đúng `recipient_type`, rồi thêm id vào `pushedIds`. Xóa khỏi `pushedIds` các id có `created_at` cũ hơn cửa sổ.
  - Cửa sổ 5 phút đủ an toàn vì transaction tạo thông báo chỉ gồm các câu `INSERT` (không gửi email bên trong, `01` mục 11), commit trong vài giây.
  - Socket.IO không phát được tới client của instance khác, nên mỗi instance chỉ phát tới client đang kết nối vào chính nó; vì mọi instance cùng đọc mọi thông báo, người nhận ở instance nào cũng nhận đúng một lần.

### 4.2. Implementation `MailerService`

`MailerService` chỉ được gọi từ job `email-dispatch` (`backend-worker`); `NotificationsService` (dùng ở cả API và worker) không gửi email, chỉ đặt `email_status` khi tạo dòng người nhận. Quy tắc hàng đợi (200 dòng/lượt, 3 lần thử, giãn cách `5 × email_attempts` phút, hết hạn 24 giờ, `smtp_host` rỗng thì giữ `PENDING`) tại `docs/01_database_schema.md` mục 11.

Thông số SMTP đọc từ `system_settings` (`smtp_host`, `smtp_port`, `smtp_user`, `smtp_password`, `smtp_from`) **mỗi lần gửi**, không lấy từ biến môi trường, để Admin đổi cấu hình là có hiệu lực ngay. `smtp_host` rỗng thì bỏ qua gửi email (ghi log cảnh báo).

```typescript
@Injectable()
export class MailerService {
  constructor(private readonly settings: SystemSettingsService) {}

  private createTransport() {
    const host = this.settings.get('smtp_host');
    if (!host) return null;
    return nodemailer.createTransport({
      host,
      port: Number(this.settings.get('smtp_port')),
      secure: false,
      auth: { user: this.settings.get('smtp_user'), pass: this.settings.get('smtp_password') },
    });
  }

  // Dùng cho mọi thông báo CRITICAL (QOS_ALERT, PABX_OFFLINE, thông báo Admin soạn): tiêu đề lấy từ notifications.title,
  // không viết cứng nội dung theo một loại sự cố
  async sendCriticalEmail(to: string, n: { title: string; content: string; createdAt: Date }) {
    const transporter = this.createTransport();
    if (!transporter) return;   // chưa cấu hình SMTP
    await transporter.sendMail({
      from: this.settings.get('smtp_from'),
      to,
      subject: `[CẢNH BÁO KHẨN CẤP] EVN CDR AS - ${n.title}`,
      html: `<h3>${escapeHtml(n.title)}</h3><p>${escapeHtml(n.content)}</p><p>Thời gian: ${n.createdAt.toLocaleString('vi-VN')}</p>`,
    });
  }
}
```

- Tiêu đề và nội dung email lấy từ dòng `notifications` (`title`, `content`, `created_at`), nên mỗi thông báo có tiêu đề riêng (vd. "MOS khung 09:00–10:00 dưới ngưỡng nghiêm trọng" ở mục 3.1). Nội dung do Admin soạn được escape HTML trước khi chèn.

---

## 5. Kiến trúc Frontend Vue 3 (`frontend/src/apps/admin/views/notifications/NotificationsView.vue` & `frontend/src/apps/member/views/notifications/NotificationsView.vue`)

### 5.1. Bố cục Giao diện (Theo `templates/notifications.html`)

- **Header**: Tiêu đề "Trung tâm thông báo", nút "Đánh dấu đã đọc tất cả" (`#markAllReadBtn`).
- **Bộ Tabs lọc**:
  - "Tất cả thông báo" (`data-filter="all"`).
  - "Chưa đọc" (`data-filter="unread"`) kèm huy hiệu số lượng badge đỏ.
  - "Đã đọc" (`data-filter="read"`).
- **Danh sách (`.notifications-list`)**:
  - Item chưa đọc (`.notification-item.unread`): Viền xanh nổi bật, nền sáng nhẹ, icon chuông/cảnh báo.
  - Item đã đọc (`.notification-item.read`): Màu chữ mờ hơn, nền xám nhạt.
  - Hiển thị thời gian tương đối do frontend tính từ `createdAt`: "Vừa xong", "15 phút trước", "2 giờ trước".
- **Trạng thái rỗng (`.empty-state`)**: Hiển thị icon SVG hộp thư rỗng và dòng chữ "Không có thông báo nào" khi tab không có bản ghi.

### 5.2. Soạn thông báo (chỉ khu vực Admin)

- Nút "Soạn thông báo" trên header `NotificationsView` của khu vực Admin, chỉ hiện khi tài khoản có `system:manage`. Template `notifications.html` chưa có nút này: dựng modal theo kiểu `.modal` chung.
- Modal gồm `type` (`SYSTEM_MAINTENANCE` \| `GENERAL`), `title`, `content`, `severity` (`INFO` \| `WARNING` \| `CRITICAL`; `CRITICAL` gửi thêm email cho người nhận đã bật `email_notification_enabled`, `docs/01_database_schema.md` mục 10), `target` (`ALL_ADMINS` \| `ALL_USERS` \| `GROUP:{id}` với dropdown chỉ liệt kê nhóm `ACTIVE` từ `GET /api/v1/admin/user-groups?status=ACTIVE&limit=100` (đọc tiếp các trang khi `pagination.hasNext`; hiển thị `code` – `name`, `docs/modules/02_user_group.md` mục 3.1) \| `EVERYONE`); gửi `POST /api/v1/admin/notifications`; thành công trả `201` với `data = { id, recipientCount }` (`recipientCount` = số dòng `notification_recipients` đã tạo), đóng modal và hiện toast.
- Khu vực Member không có chức năng này.

### 5.3. Quản lý trạng thái Pinia Store (`useNotificationStore`)

- Kết nối WebSocket khi người dùng đăng nhập thành công.
- Lắng nghe sự kiện `notification:new` (payload `{ id, type, severity, title, content, isRead: false, createdAt, metadata }`, cùng cấu trúc phần tử mục 3.1, `docs/02_api_contracts.md` mục 4):
  - Phát âm thanh chuông thông báo (tùy chọn trong profile).
  - Tăng `unreadCount += 1`.
  - Hiển thị Pop-up Toast góc màn hình (`#toastContainer`).
  - Chèn thông báo mới vào đầu mảng `notifications`; thời gian tương đối tính ở frontend từ `createdAt`.

---

## 6. Kịch bản kiểm thử (Test Plan for Agent)

1. **TC-NOTIF-01**: Khi khung giờ đã kết thúc ít nhất 60 phút của một nhóm có MOS trung bình dưới ngưỡng critical (và đủ số cuộc gọi tối thiểu), WebSocket gửi sự kiện `notification:new` tới trình duyệt, kiểm tra số badge trên Sidebar tự động tăng lên 1 đơn vị.
2. **TC-NOTIF-02**: Nhấn vào tab "Chưa đọc", xác nhận danh sách chỉ chứa các mục có `isRead == false`.
3. **TC-NOTIF-03**: Nhấn nút "Đánh dấu đã đọc tất cả", kiểm tra số badge trở về 0 và toàn bộ mục chuyển sang class `.read`.
4. **TC-NOTIF-04**: Cấu hình `smtp_*` trong `system_settings` qua `PUT /api/v1/admin/settings/system`, tạo một cảnh báo `CRITICAL`: dòng người nhận có `email_notification_enabled = 1` được tạo với `email_status = 'PENDING'`, người tắt email và thông báo không phải `CRITICAL` là `NOT_REQUIRED`; trong vòng 1 phút email được gửi, `email_status = 'SENT'`. SMTP lỗi: `email_attempts` tăng tới 3 rồi `FAILED`, `email_last_error` có nội dung. Để `smtp_host` rỗng: thông báo vẫn được tạo, dòng giữ `PENDING`, sau 24 giờ chuyển `FAILED` (`EXPIRED`); cấu hình SMTP trước 24 giờ thì email được gửi.
