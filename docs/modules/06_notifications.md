# MODULE 06: QUẢN LÝ THÔNG BÁO (NOTIFICATIONS: IN-APP & EMAIL)

## Đường dẫn tài liệu: `docs/modules/06_notifications.md`

## Ánh xạ giao diện mẫu: `templates/notifications.html`, `templates/notifications.css`, `templates/notifications.js`

---

## 1. Mục tiêu & Nghiệp vụ (Business Overview)

### 1.1. Bối cảnh nghiệp vụ

Hệ thống giám sát viễn thông EVN đòi hỏi khả năng cảnh báo sớm khi phát hiện các bất thường:

1. **Sự cố Chất lượng thoại (`QOS_ALERT`)**: sinh **theo giờ** khi chỉ số của khung giờ vừa kết thúc (toàn hệ thống hoặc một nhóm) vượt ngưỡng trong `qos_threshold_configs` (MOS, mất gói, jitter, ASR), với khung giờ có ít nhất `qos_alert_min_calls` cuộc gọi. Không cảnh báo từng cuộc gọi. Ngưỡng, chống trùng và người nhận định nghĩa tại `docs/01_database_schema.md` mục 10.
2. **Mất kết nối Tổng đài PABX (`PABX_OFFLINE`)**: không có bản ghi `cdr` mới trong `pabx_offline_minutes` (mặc định 60 phút); khi có dữ liệu trở lại thì tạo thông báo `INFO`.
3. **Bảo trì hệ thống (Maintenance Notice)**: Thông báo lịch nâng cấp định kỳ do EVNICT phát động.

### 1.2. Kênh phát thông báo

- **In-App Realtime Notification**: Bắn tín hiệu tức thời qua WebSocket (Socket.IO). Cập nhật số đếm badge chưa đọc (`.notification-badge-global`) trên thanh Sidebar mà không cần F5 trình duyệt.
- **Email Notification**: chỉ với thông báo `CRITICAL`, gửi qua SMTP cấu hình trong `system_settings` (`smtp_*`) tới người nhận đã bật `email_notification_enabled`. Gửi lỗi không chặn việc tạo thông báo.
- **Người nhận**: luôn tạo một dòng `notification_recipients` cho mỗi tài khoản nhận (không có thông báo "global" không có người nhận). Admin soạn thông báo qua `POST /api/v1/admin/notifications` với `target` = `ALL_ADMINS` | `ALL_USERS` | `GROUP:{id}` | `EVERYONE`.

---

## 2. Thiết kế Dữ liệu (Database Schema)

Bảng MariaDB: `notifications` và `notification_recipients` (Mô tả chi tiết tại `docs/01_database_schema.md`).

---

## 3. Đặc tả API Contracts

### 3.1. Danh sách thông báo (`GET /api/v1/notifications`)

- **Query params**: `filter=all` (`all`, `unread`, `read`), `page=1`, `limit=20`
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
      "createdAt": "2026-10-12T09:30:00+07:00",
      "timeAgo": "15 phút trước",
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
  "unreadCount": 3
}
```

### 3.2. Đánh dấu đã đọc 1 thông báo (`PUT /api/v1/notifications/:id/read`)

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
└── realtime/                           <-- chỉ chạy ở backend-api (AppModule)
    ├── realtime.module.ts
    ├── admin-notifications.gateway.ts  <-- namespace /admin/notifications (JWT_ADMIN_SECRET)
    ├── user-notifications.gateway.ts   <-- namespace /notifications (JWT_USER_SECRET)
    └── notification-push.poller.ts     <-- Đọc notifications mới (watermark id) rồi gọi gateway
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
  - Khởi động: `lastId = SELECT MAX(id) FROM notifications` (không phát lại thông báo cũ).
  - Mỗi 3 giây: đọc `notification_recipients` JOIN `notifications` với `notifications.id > lastId` (`ORDER BY id`, tối đa 500 dòng), gọi `sendToRecipient` của gateway đúng `recipient_type`, rồi đặt `lastId` = id lớn nhất đã đọc.
  - Socket.IO không phát được tới client của instance khác, nên mỗi instance chỉ phát tới client đang kết nối vào chính nó; vì mọi instance cùng đọc mọi thông báo, người nhận ở instance nào cũng nhận đúng một lần.

### 4.2. Implementation `MailerService`

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

  async sendCriticalAlertEmail(to: string, alertData: { title: string; content: string }) {
    const transporter = this.createTransport();
    if (!transporter) return;   // chưa cấu hình SMTP
    await transporter.sendMail({
      from: this.settings.get('smtp_from'),
      to,
      subject: `[CẢNH BÁO KHẨN CẤP] Sự cố chất lượng thoại tổng đài PABX EVN - ${alertData.title}`,
      html: `<h3>${alertData.title}</h3><p>${alertData.content}</p><p>Thời gian: ${new Date().toLocaleString('vi-VN')}</p>`,
    });
  }
}
```

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
  - Hiển thị thời gian tương đối (`timeAgo`): "Vừa xong", "15 phút trước", "2 giờ trước".
- **Trạng thái rỗng (`.empty-state`)**: Hiển thị icon SVG hộp thư rỗng và dòng chữ "Không có thông báo nào" khi tab không có bản ghi.

### 5.2. Soạn thông báo (chỉ khu vực Admin)

- Nút "Soạn thông báo" trên header `NotificationsView` của khu vực Admin, chỉ hiện khi tài khoản có `system:manage`. Template `notifications.html` chưa có nút này: dựng modal theo kiểu `.modal` chung.
- Modal gồm `title`, `content`, `severity`, `target` (`ALL_ADMINS` \| `ALL_USERS` \| `GROUP:{id}` với dropdown nhóm từ `GET /api/v1/admin/user-groups` \| `EVERYONE`); gửi `POST /api/v1/admin/notifications`, thành công thì đóng modal và hiện toast.
- Khu vực Member không có chức năng này.

### 5.3. Quản lý trạng thái Pinia Store (`useNotificationStore`)

- Kết nối WebSocket khi người dùng đăng nhập thành công.
- Lắng nghe sự kiện `notification:new`:
  - Phát âm thanh chuông thông báo (tùy chọn trong profile).
  - Tăng `unreadCount += 1`.
  - Hiển thị Pop-up Toast góc màn hình (`#toastContainer`).
  - Chèn thông báo mới vào đầu mảng `notifications`.

---

## 6. Kịch bản kiểm thử (Test Plan for Agent)

1. **TC-NOTIF-01**: Khi khung giờ vừa kết thúc của một nhóm có MOS trung bình dưới ngưỡng critical (và đủ số cuộc gọi tối thiểu), WebSocket gửi sự kiện `notification:new` tới trình duyệt, kiểm tra số badge trên Sidebar tự động tăng lên 1 đơn vị.
2. **TC-NOTIF-02**: Nhấn vào tab "Chưa đọc", xác nhận danh sách chỉ chứa các mục có `isRead == false`.
3. **TC-NOTIF-03**: Nhấn nút "Đánh dấu đã đọc tất cả", kiểm tra số badge trở về 0 và toàn bộ mục chuyển sang class `.read`.
4. **TC-NOTIF-04**: Cấu hình `smtp_*` trong `system_settings` qua `PUT /api/v1/admin/settings/system`, tạo một cảnh báo `CRITICAL`: email được gửi tới người nhận có `email_notification_enabled = 1` và `notification_recipients.is_emailed = 1`. Để `smtp_host` rỗng: thông báo vẫn được tạo, không có email, `is_emailed = 0`.
