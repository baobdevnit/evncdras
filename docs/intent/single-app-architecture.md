# Intent: Kiến trúc 1 ứng dụng Frontend, 1 ứng dụng Backend

> Chốt ngày 2026-11-03 · Thay thế mô hình "monorepo 2 ứng dụng frontend" (commit `48bb93d`) và cách chia backend theo tính năng `src/modules/<feature>/` trong `docs/00_overview_and_architecture.md`

- **Kết quả**: mỗi phía chỉ có một ứng dụng để build, cài đặt và triển khai, nhưng mã nguồn được chia ranh giới rõ như nhiều ứng dụng riêng, để mỗi cổng/phần có thể phát triển và kiểm thử độc lập.
- **Phạm vi**: chỉ sửa tài liệu trong `docs/`, `README.md`, `require_for_writing_docs.md`, `tasks/`. Không sửa `templates/`, không sinh code.

## Quyết định

| # | Nội dung | Chốt |
|---|---|---|
| A1 | Frontend | **1 ứng dụng Vue** (`frontend/`, 1 `package.json`, 1 Vite build, 1 router). Mã chia thành `src/apps/admin` (Cổng Quản trị), `src/apps/member` (Cổng Thành viên) và `src/shared`. Bỏ monorepo pnpm, `apps/*/` riêng và `packages/shared` |
| A2 | URL, route, quyền | Giữ nguyên: Admin ở `/admin/*`, Member ở `/*`, route name `admin.*`/`member.*`, `meta.permissions`. Mỗi route khai báo thêm `meta.portal` (`'admin'` \| `'member'`) |
| A3 | Phiên đăng nhập | Giữ nguyên tách theo cổng: store `authAdmin`/`authUser`, cookie refresh khác `Path`, API base `/api/v1/admin` và `/api/v1`. Chuyển cổng được dùng `RouterLink` bình thường; cổng nào chưa có Access Token thì guard của cổng đó gọi refresh một lần |
| A4 | Backend | **1 ứng dụng NestJS** (`backend/`, 1 build). Mã chia thành `src/apps/admin` (API Quản trị `/api/v1/admin/*`), `src/apps/member` (API Thành viên `/api/v1/*`), `src/apps/worker` (tác vụ chạy ngầm) và `src/core` (entity, service nghiệp vụ, guard dùng chung). Socket.IO đặt ở `src/realtime` |
| A5 | Tiến trình | Vẫn 2 tiến trình từ cùng bản build: `main.ts` (`AppModule` = Admin + Member + Realtime, chạy 1..N instance) và `main.worker.ts` (`WorkerAppModule`, đúng 1 instance) |
| A6 | Ranh giới mã | `apps/admin`, `apps/member`, `apps/worker` không import lẫn nhau; mọi phần chỉ dùng chung qua `core` (backend) hoặc `shared` (frontend). `core`/`shared` không import ngược `apps/*`. Ép bằng ESLint `no-restricted-imports` |

## Không đổi

Hợp đồng API (đường dẫn, payload, mã lỗi), schema CSDL, mã quyền, chính sách token, ánh xạ `templates/admin` ↔ Cổng Quản trị và `templates/member` ↔ Cổng Thành viên.

## Lý do

- Một ứng dụng frontend: một bộ phụ thuộc, một cấu hình build, một server dev; bỏ được việc proxy chéo giữa 2 Vite server và cấu hình Nginx cho 2 thư mục `dist`. Tách chunk theo cổng bằng lazy-load nên người dùng Member không tải mã Admin.
- Backend chia theo đối tượng ở cấp trên cùng: nhìn cây thư mục biết ngay mã nào thuộc cổng nào, controller Admin không vô tình dùng phạm vi dữ liệu Member và ngược lại; job nền tách hẳn khỏi phần HTTP nên không thể đăng ký nhầm vào tiến trình API.
