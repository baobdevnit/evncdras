# RÀ SOÁT THIẾT KẾ GIAO DIỆN EVN CDR AS

**Ngày rà soát:** 06/11/2026, UTC+7.  
**Phạm vi:** 30 trang HTML, 99 tệp HTML/CSS/JavaScript trong `templates/admin/` và `templates/member/`.  
**Đầu ra:** nhận xét và khuyến nghị; không sửa template, API hay thiết kế CSDL.

## 1. Trả lời bốn câu hỏi

| Câu hỏi | Kết luận | Căn cứ và độ tin cậy |
|---|---|---|
| Đã đầy đủ tính năng chưa? | **Chưa.** Đã có phần lớn màn hình nghiệp vụ, nhưng còn thiếu bố cục cho cấu hình ngưỡng QoS, thao tác tính lại thống kê và luồng tổng hợp lưu lượng theo đặc tả. Đồng thời còn những màn hình phân quyền đã bị đặc tả loại khỏi sản phẩm. | Cao đối với tài sản template và sai khác đặc tả; chưa xác minh được chức năng tích hợp backend. |
| Hiệu năng đã tốt chưa? | **Nhẹ và nhanh với dữ liệu mẫu trên máy kiểm thử; chưa đủ bằng chứng kết luận hiệu năng vận hành tốt.** Phụ thuộc CDN làm dashboard lỗi khi Internet bị chặn; chưa có đo tải lớn, API thật, mạng WAN hoặc thiết bị yếu. | Có số đo Chrome thực tế ở mục 5; giới hạn rõ theo điều kiện đo. |
| UI đã đẹp và phù hợp viễn thông chưa? | **Có nền tảng đẹp, sạch, phù hợp ứng dụng kỹ thuật doanh nghiệp.** Nhận diện EVN rõ, bảng dữ liệu và QoS hai chiều đúng hướng. Cần ưu tiên độ chính xác chỉ số, khả năng đọc bảng và mật độ thông tin hơn trang trí thêm. | Đã xem ảnh của cả 30 trang, kiểm tra sâu sáu màn hình trọng tâm; đánh giá thẩm mỹ là nhận định chuyên môn, chưa phải khảo sát người dùng. |
| UX đã hợp lý, dễ dùng chưa? | **Luồng cơ bản dễ hiểu nhưng chưa đồng đều và chưa sẵn sàng nghiệm thu.** CDR lọc/phân trang còn hình thức; quyền ghi âm không theo phiên; modal và sidebar còn hạn chế bàn phím; một số trạng thái số liệu gây hiểu nhầm. | Các lỗi chính đã tái hiện; lỗi/biên chưa hỗ trợ mô phỏng được ghi là chưa kiểm chứng. |

**Nhận định chung:** có thể giữ lại hướng thiết kế thị giác. Việc cần làm trước là chuẩn hóa nghiệp vụ, trạng thái và tương tác. Không nên chuyển nguyên trạng toàn bộ template sang Vue rồi coi đó là giao diện đã được nghiệm thu.

## 2. Phương pháp, nguồn chuẩn và bằng chứng

### 2.1. Nguồn đối chiếu

- `docs/00_overview_and_architecture.md`: hai cổng, phạm vi nhóm, cấu trúc ứng dụng và quyền.
- `docs/02_api_contracts.md`: chức năng, endpoint và dạng phản hồi hiện hành.
- `docs/03_ui_design.md`: màu, typography, thành phần và thang MOS.
- Toàn bộ 15 phân hệ trong `docs/modules/`: đối chiếu các mục nghiệp vụ và yêu cầu frontend liên quan. Các đoạn SQL trong tài liệu không thuộc phạm vi kiểm toán đợt này.
- [Web Interface Guidelines](https://raw.githubusercontent.com/vercel-labs/web-interface-guidelines/main/command.md): tham chiếu accessibility, bàn phím, trạng thái, chuyển động và hiệu năng. Áp dụng phù hợp giao diện tiếng Việt; không máy móc áp dụng quy tắc biên tập tiếng Anh.

Quét toàn bộ 99 tệp để lập danh mục, tham chiếu, phụ thuộc và mẫu mã; đọc sâu phần tương tác, luồng nghiệp vụ và CSS liên quan các phát hiện. Không dùng các báo cáo CSDL cũ. Không ghi kết quả kiểm toán CSDL vào tài liệu này.

### 2.2. Điều kiện kiểm thử

- Chrome headless 156 trên Windows, profile kiểm thử riêng, phục vụ template bằng HTTP tại `127.0.0.1:8765`; không sử dụng phiên duyệt web cá nhân.
- Đã mở đủ **18 trang Admin + 12 trang Member**. Mỗi trang được kiểm tra ở 1440×900, 768×1024, 390×844, sáng và tối: **180 lượt bố cục**. Đây không phải 180 lượt kiểm thử đầy đủ mọi thao tác.
- Quét **711 tham chiếu cục bộ** `href/src`: không thấy đích tệp bị thiếu. Kết quả này không xác nhận liên kết neo, tính đúng nghiệp vụ của đích hoặc đường dẫn tạo động.
- Lượt đầu giữ nguyên phụ thuộc: Google Fonts, ui-avatars, CDN Chart.js và audio ngoài bị trình duyệt báo `ERR_NETWORK_ACCESS_DENIED`.
- Sau đó tải Chart.js vào thư mục bằng chứng và thay phản hồi URL CDN bằng bản tải đó **chỉ trong context kiểm thử**. Không sửa HTML/JS gốc. Phông chữ ngoài và avatar vẫn bị chặn; hình thức quan sát có dùng font dự phòng, ảnh avatar bị lỗi.
- Đã mô phỏng **200% bằng CSS `zoom: 2`** trên cả 30 trang. Chưa kiểm tra native browser zoom 200% trong cửa sổ Chrome tương tác; không coi hai phép thử là tương đương hoàn toàn.
- Không dùng dữ liệu sản xuất, không chạy backend, không kiểm chứng HTTP Range/streaming ghi âm thật, xuất báo cáo backend hoặc phân quyền phía máy chủ.

### 2.3. Hồ sơ bằng chứng

Trong [ui-audit-2026-11-06/](ui-audit-2026-11-06/):

- `baseline.json`: kết quả mở 30 trang nguyên trạng, lỗi runtime, request ngoài thất bại, DOM và thời gian tải.
- `responsive.json`: 180 kết quả bố cục; `zoom-simulation.json`: 30 kết quả mô phỏng zoom.
- `static-summary.json`: kích thước nguồn, tham chiếu, tệp trùng và chuyển động.
- `flows.json`: quan sát các kịch bản trọng tâm; `performance.json`: 18 mẫu đo hiệu năng hợp lệ.
- Ảnh toàn trang ban đầu theo tên cổng/trang; ảnh viewport trọng tâm theo chiều rộng và theme. Ảnh baseline một số trang chụp khi mock còn đang tải, không dùng trạng thái đó để kết luận trang bị hỏng.
- `desktop-contact-sheet.png`: sáu trang trọng tâm với Chart.js hoạt động. `all-pages-contact-sheet.png`: tổng hợp ảnh baseline đủ 30 trang.
- `settled.json`, `*-settled.png`, `all-pages-settled-sheet.png`: kiểm tra lại đủ 30 trang sau khi chờ mock tải ổn định, có Chart.js; không thấy pageerror ở lượt này. Đã xem lại ảnh tổng hợp để đánh giá các trang hồ sơ/tổ chức/nhóm sau tải.
- `mobile-dark-content-sheet.png`: sáu màn hình tối ở 390 px, menu đã đóng. Các ảnh `*-390-dark.png` trước đó có thể giữ menu mở sau đổi theme; dùng `*-390-dark-content.png` để đánh giá phần nội dung.
- `sample-export.pdf`: tệp tải từ nút PDF, thực chất là văn bản; chỉ lưu làm bằng chứng lỗi, không phải báo cáo PDF hợp lệ. `chart.js`: phụ thuộc dùng riêng cho kiểm thử.

## 3. Bao phủ tính năng và vai trò

Quy ước: **T** = có tương tác trong prototype; **M** = dữ liệu/thao tác mock; **S** = sai khác/thiếu so với đặc tả; **C** = chưa kiểm chứng tích hợp. Một màn hình có thể có nhiều trạng thái. Có tệp HTML không đồng nghĩa chức năng đã hoàn thành.

### 3.1. Danh mục đủ 30 trang đã mở

Mọi dòng dưới đây đã mở trên Chrome và qua sáu tổ hợp viewport/theme.

| Cổng | Trang HTML | Hiện trạng chức năng và khuyến nghị chính |
|---|---|---|
| Admin | `dashboard.html` | T/M/C; KPI, biểu đồ, kho số. Dữ liệu cố định; thiếu tính lại thống kê; cần xử lý Chart.js không tải được. |
| Admin | `notifications.html` | T/M/C; tab, đánh dấu đã đọc và trạng thái rỗng; dữ liệu localStorage dùng chung với Member. |
| Admin | `cdr-history.html` | T/M/S/C; mở chi tiết và audio mẫu; lọc, tổng số và phân trang chưa phản ánh dữ liệu thật. |
| Admin | `qos-debug.html` | T/M/S/C; lọc, phân trang, chi tiết QoS hai chiều; thang MOS chưa đồng bộ. |
| Admin | `reports.html` | T/M/S/C; chuyển loại và vẽ biểu đồ; thời gian/phạm vi/tổng hợp và định dạng xuất cần sửa. |
| Admin | `organization.html` | T/M/C; cây, chi tiết, tạo/sửa/xóa và các trạng thái lỗi có cấu trúc; cần giữ khi triển khai. |
| Admin | `prefix-management.html` | T/M/C; cấp phát/thu hồi, trạng thái, kho số và xác nhận; localStorage không thay thế API. |
| Admin | `prefix-history.html` | T/M/C; lọc lịch sử, timeline và CSV; cần kiểm chứng với API và lịch sử thật. |
| Admin | `user_group.html` | T/M/C; danh sách/chi tiết có mock response; một số thao tác quản lý vẫn mô phỏng. |
| Admin | `users.html` | T/M/C; tìm/lọc và modal; nhóm bị khóa khi sửa là đúng; lưu dữ liệu chưa đủ bằng chứng tích hợp. |
| Admin | `roles.html` | T/M/S; còn thêm/sửa vai trò, trái yêu cầu chỉ xem năm vai trò cố định. |
| Admin | `permissions.html` | T/M/S; chỉnh danh mục localStorage, có mã quyền cũ; đặc tả hiện hành nói không triển khai màn này. |
| Admin | `data-permissions.html` | T/M/S; ma trận nhiều thông tin kỹ thuật; đặc tả hiện hành nói không triển khai màn này. |
| Admin | `system-settings.html` | T/M/S/C; có quản trị Admin và audit log, deep link audit hoạt động; thiếu mục ngưỡng QoS và tính lại thống kê. |
| Admin | `profile.html` | T/M/C; hồ sơ, avatar, phiên và hoạt động gần đây có mô hình tải/lỗi; chưa xác minh upload/revoke thật. |
| Admin | `change-password.html` | T/M/C; kiểm tra mật khẩu, chế độ buộc đổi, trạng thái gửi/lỗi đã có trong mã. |
| Admin | `user-settings.html` | T/M/C; theme, số dòng, dashboard widget; cần kiểm các trang tiêu thụ đúng tùy chọn. |
| Admin | `login.html` | T/M/C; form đăng nhập riêng, lỗi và loading; chưa có chứng minh xác thực thật. |
| Member | `dashboard.html` | T/M/S/C; biểu đồ/KPI đơn vị mẫu, chưa thống nhất nhóm với các trang khác; lỗi Chart.js khi CDN bị chặn. |
| Member | `notifications.html` | T/M/C; cùng logic localStorage với Admin; cần tách theo tài khoản/cổng. |
| Member | `cdr-history.html` | T/M/S/C; chế độ GROUP_ADMIN cố định; không phản ánh `REGULAR_USER` hoặc cờ nhóm khi thử. |
| Member | `qos-debug.html` | T/M/S/C; JS giống hệt Admin; chưa thể dùng để nghiệm thu cô lập nhóm. |
| Member | `reports.html` | T/M/S/C; cố định phạm vi giả lập 51; cùng hạn chế tổng hợp/xuất với Admin. |
| Member | `org-prefix.html` | T/M/S/C; đọc dải số mẫu/localStorage và URL nhóm, chưa bám nhóm tài khoản. |
| Member | `group-admin.html` | T/M/S/C; thẻ/bảng, tìm kiếm, thêm/sửa/quyền/khóa; còn mô hình cờ cũ, quyền truy cập và số đếm cần sửa. |
| Member | `group-members.html` | T/M/C; danh bạ, thẻ/bảng, tìm/lọc/phân trang, chi tiết, CSV; thẻ tóm tắt mới hơn phần danh sách. |
| Member | `profile.html` | T/M/C; có trạng thái tải/lỗi và mock phiên; chưa xác minh backend. |
| Member | `change-password.html` | T/M/C; có kiểm tra và chế độ buộc đổi; chưa kiểm chứng thu hồi phiên thật. |
| Member | `user-settings.html` | T/M/C; theme, số dòng và thông báo; chưa chứng minh mọi màn hình tuân thủ số dòng đã chọn. |
| Member | `login.html` | T/M/C; đăng nhập riêng và lỗi mock; chưa xác minh refresh cookie/phiên thật. |

### 3.2. Ma trận đối chiếu 15 phân hệ

| Phân hệ trong docs | Bao phủ mẫu | Khoảng trống đáng chú ý |
|---|---|---|
| 01 Tổ chức | Admin có cây và CRUD/chi tiết | Không thấy thiếu toàn bộ màn hình; cần QA riêng các lỗi đồng thời theo đặc tả. |
| 02 Nhóm người dùng | Admin danh sách/chi tiết; Member tóm tắt và thành viên | Dữ liệu tổng/thành viên khác nhau; mock quyền cũ. |
| 03 Xác thực User | Login Member; users Admin; quản trị nhóm | Chưa đồng bộ permission trên các màn hình cũ. |
| 04 Xác thực Admin | Login và mục Admin trong settings | Không được đánh dấu thiếu quản lý tài khoản Admin chỉ vì không có tệp riêng. |
| 05 Dashboard | Hai dashboard | Thiếu thao tác tính lại thống kê theo API đã đặc tả; KPI/biểu đồ còn cố định. |
| 06 Thông báo | Hai trang thông báo | localStorage dùng chung; chưa chứng minh socket, phân trang hoặc email. |
| 07 Cài đặt | Settings, Admin, audit log | Thiếu mục `qos-thresholds`; lưu một số phần chỉ toast sau timeout. |
| 08 Hồ sơ User | Profile, đổi mật khẩu, preferences | Cần kiểm chứng tích hợp và hành vi giữ form khi lỗi. |
| 09 Hồ sơ Admin | Profile, đổi mật khẩu, preferences | Có thêm phiên/hoạt động; chưa kiểm chứng backend. |
| 10 Quyền/vai trò | Ba trang mẫu | Dư so với thiết kế: chỉ giữ danh sách vai trò chỉ xem; chuẩn hóa đổi vai trò thành viên. |
| 11 Kho số/dải số | Prefix management/history/org-prefix | Member chưa thống nhất nhóm; hành vi dữ liệu phụ thuộc localStorage. |
| 12 CDR/ghi âm | Hai trang CDR | Lọc, phân trang, quyền ghi âm, leg liên quan và streaming thật chưa hoàn thiện. |
| 13 QoS | Hai bảng debug và modal | Thang MOS sai khác; thiếu UI cấu hình ngưỡng; chưa chứng minh lấy threshold response. |
| 14 Lưu lượng | Có biểu đồ/dashboard và loại báo cáo traffic | Chưa có đầy đủ luồng `TrafficSummaryView` và chuyển từ tổng hợp đến CDR; không nhất thiết phải thêm tệp nếu tích hợp đủ vào màn hiện có. |
| 15 Báo cáo | Hai trang reports | Sai phạm vi mock, tính tổng QoS, thời gian và xuất định dạng thật. |

### 3.3. Vai trò

| Vai trò chuẩn | Thiết kế phải đáp ứng | Kết quả rà soát mẫu |
|---|---|---|
| ROOT_ADMIN | Toàn hệ thống, thêm quyền quản lý tài khoản Admin | Có session/permission mock; settings có điều kiện `admin:manage`. Chưa kiểm toàn bộ thao tác bằng phiên thật. |
| SYSTEM_ADMIN | Như Root trừ quản lý tài khoản Admin | Có mô phỏng; cần test riêng hidden/forbidden và deep link. Không suy ra an toàn từ việc ẩn nút. |
| GROUP_ADMIN | Dữ liệu nhóm, quản lý thành viên, ghi âm khi nhóm cho phép | Màn nhóm có tương tác, nhưng CDR dùng chế độ cố định; chưa đủ điều kiện nghiệm thu. |
| USER_RECORDING | Dữ liệu nhóm và ghi âm khi nhóm cho phép, không quản trị nhóm | main.js có mock vai trò nhưng các trang cũ chưa tiêu thụ đồng bộ. |
| REGULAR_USER | Xem dữ liệu nhóm, không nghe/tải ghi âm, không quản trị nhóm | Đã thử URL mock: vẫn có audio ở CDR và vẫn mở được trang group-admin có nút thêm. Đây là sai hành vi mẫu, chưa kết luận backend rò rỉ dữ liệu. |

## 4. Phát hiện và khuyến nghị ưu tiên

**P1:** cần sửa trước khi chốt mẫu/triển khai chức năng liên quan vì sai nghiệp vụ hoặc làm luồng chính không đáng tin cậy. **P2:** ảnh hưởng rõ đến usability, accessibility, độ ổn định hoặc bảo trì. **P3:** cải thiện chất lượng và năng suất. Các vị trí dưới đây tính theo nguồn hiện tại; ghi thêm cổng còn lại khi lỗi cùng mẫu.

### F01 — P1 — Màn vai trò/quyền đi ngược thiết kế hiện hành

**Bằng chứng:** `templates/admin/roles.html:250` có “Thêm vai trò mới”, `:370` có lưu; `roles.js:19` chỉ đóng modal và toast. `permissions.js:173` còn `role:manage`, `:257` và `:272` nạp/lưu danh mục localStorage. Đã mở được modal thêm trên trình duyệt. `deleteRole` còn trong mã JS, chưa thấy nút xóa tương ứng ở HTML; không coi đó là chức năng xóa khả dụng đã tái hiện.

**Đối chiếu:** `docs/modules/10_permissions_and_roles.md:13`, `:19`, `:363`: năm vai trò seed, chỉ xem; không triển khai `permissions.html` và `data-permissions.html`.

**Ảnh hưởng:** người dùng và đội phát triển hiểu nhầm chính sách quyền có thể cấu hình động. **Khuyến nghị bắt buộc:** màn vai trò chỉ đọc, đủ năm vai trò/quyền; bỏ hai màn không triển khai khỏi luồng sản phẩm. Nếu cần giữ mẫu làm tư liệu thì gắn nhãn tài liệu nội bộ, không giữ như chức năng sản phẩm.

### F02 — P1 — Quyền ghi âm Member không theo tài khoản và cờ nhóm

**Bằng chứng:** `templates/member/cdr-history.js:88` cố định `group_admin_enabled`; `:166` và `:169` tạo audio. Mở `cdr-history.html?role=REGULAR_USER&recording=0` vẫn có hai player trong bảng và một trong modal, kèm link tải.

**Ảnh hưởng:** mẫu trình bày quyền trái với session mock. **Khuyến nghị bắt buộc:** dùng `memberSession.getAccount().permissions` và cờ nhóm cho cả bảng, chi tiết, nghe/tải; kiểm đủ ba vai trò × bật/tắt ghi âm. Backend luôn kiểm quyền từng request; UI không phải hàng rào bảo mật.

### F03 — P1 — CDR lọc/phân trang chưa làm việc theo giao diện

**Bằng chứng:** `templates/admin/cdr-history.js:94` xử lý submit bằng render lại; `:128` duyệt toàn bộ bốn bản ghi. Bản Member tương tự. Nhập `999999999999` vẫn bốn dòng. `templates/admin/cdr-history.html:445` hiển thị tổng 1.245 trong khi chỉ có bốn mẫu; các trang phân trang không được kết nối logic tương ứng trong JS.

**Ảnh hưởng:** thao tác tìm kiếm tạo cảm giác thành công nhưng không thu hẹp dữ liệu. **Khuyến nghị bắt buộc:** kết nối lọc thật, reset trang khi đổi lọc, đồng bộ total/pageSize/page, trạng thái không có kết quả. Khi còn mock, thực hiện lọc trên fixture và ghi rõ dữ liệu minh họa. Kiểm tra các bộ lọc nâng cao/xuất CDR theo module 12, không chỉ giao diện tìm kiếm cơ bản.

### F04 — P1 — Xuất Excel/PDF chỉ là văn bản đổi đuôi

**Bằng chứng:** `templates/admin/reports.js:934` tạo chuỗi văn bản; `:935` đưa vào Blob gán MIME Excel/PDF; Member tương tự. Tệp `sample-export.pdf` tải thực tế không có header `%PDF-`, nội dung là năm dòng mô tả.

**Ảnh hưởng:** file tải thành công nhưng không dùng được như định dạng công bố. **Khuyến nghị bắt buộc:** khi triển khai, nhận file binary hợp lệ từ endpoint xuất tương ứng; kiểm mở bằng trình đọc chuẩn và đối chiếu bảng/KPI/tổng. Trong prototype, ghi “Mô phỏng xuất” và tránh thông báo thành công như file thật.

### F05 — P1 — Phạm vi báo cáo và khoảng thời gian không theo hợp đồng hiện hành

**Bằng chứng:** `templates/admin/reports.js:275` chỉ lọc `orgId`; không lọc ngày tại đây. `templates/member/reports.js:15` cố định nhóm/tổ chức 51, `:281` lọc `orgId === state.userGroupOrg`. Trang gọi bộ chọn là nhóm nhưng JS dùng tổ chức. Các dataset có cả `groupId` và `orgId` nhưng logic không dùng `groupId` cho lọc này.

**Ảnh hưởng:** chọn thời gian có thể vẫn cùng tập dữ liệu; phạm vi nhóm không gắn phiên và khái niệm tổ chức/nhóm bị lẫn. **Khuyến nghị bắt buộc:** API/fixture dùng `groupId`, kỳ/ngày thực sự tác động đến preview và file. Mỗi báo cáo đúng một phạm vi như module 15; so sánh nhóm đặt ở dashboard/traffic theo đặc tả, không cộng các nhóm thành tổng hệ thống.

### F06 — P1 — Công thức MOS/loss báo cáo không phù hợp số liệu tổng hợp

**Bằng chứng:** `templates/admin/reports.js:311` trọng số MOS bằng `totalCalls`; `:312` cũng trọng số phần trăm mất gói bằng `totalCalls`; Member tương tự. Module 15 quy định QoS theo mẫu leg và loss theo tổng gói mất/tổng gói RTP; dòng tổng tính lại từ bộ đếm.

**Ảnh hưởng:** con số nhìn hợp lý nhưng có thể sai khi số leg có QoS hoặc lượng RTP khác nhau. **Khuyến nghị bắt buộc:** render `totals` theo hợp đồng, tôn trọng `null`; fixture phải kiểm số mẫu khác nhau, không RTP và cuộc nhiều leg. Không dùng trung bình phần trăm hoặc số cuộc gọi thay bộ đếm QoS.

### F07 — P1 — Dải MOS và nhãn chất lượng không nhất quán

**Bằng chứng:** `templates/admin/qos-debug.html:340` gộp 3.0–<4.0 thành trung bình, `:341` gọi ≥4.0 là tốt; `qos-debug.js:2229` chỉ chia ba dải. `docs/03_ui_design.md` mục 2.4 quy định bốn dải ≥4.0, 3.5–<4.0, 3.0–<3.5, <3.0 và trạng thái không dữ liệu. CDR còn nhãn chuỗi kiểu “4.22 (Tốt)” ở fixture. Cả hai cổng cần cùng quy tắc.

**Ảnh hưởng:** kỹ sư có thể đánh giá khác nhau cho cùng một cuộc gọi tùy trang. **Khuyến nghị bắt buộc:** dùng một hàm định dạng/phân loại dùng chung theo đặc tả; test mốc 3.0, 3.5, 4.0 và `null`. Tô màu Jitter/Loss theo ngưỡng cấu hình, không đánh đồng không dữ liệu với chất lượng tốt.

### F08 — P1 — Member chưa thống nhất nhóm và quyền ở mọi trang

**Bằng chứng:** session/thẻ nhóm dùng Khối CNTT và dải 42/46; dashboard/reports dùng EVNICT Đà Nẵng/51. `templates/member/org-prefix.js:11`, `:61` chọn nhóm cố định hoặc đọc `ugId/groupId` từ URL; `:101` tìm nhóm từ localStorage. JS QoS Member giống hệt Admin. Mở trực tiếp `group-admin.html?role=REGULAR_USER` vẫn thấy nút thêm thành viên.

**Ảnh hưởng:** phạm vi hiển thị không theo danh tính; chuyển trang làm thay đổi ngữ cảnh làm việc. **Khuyến nghị bắt buộc:** mọi trang lấy nhóm từ account/store, chỉ mở quản trị nhóm khi đủ quyền; URL không tự quyết định phạm vi Member. Kiểm chứng API cô lập nhóm riêng khi tích hợp.

### F09 — P1 — Thiếu UI cho một số chức năng đã đặc tả

**Bằng chứng:** `templates/admin/system-settings.js:30` chỉ có analysis/reporting/advanced/admins/audit-logs; chưa có `qos-thresholds`. API contracts có GET/PUT ngưỡng QoS và POST tính lại thống kê. Module 14 mô tả tổng hợp lưu lượng, ALOC và drill-down CDR nhưng chưa có luồng UI đầy đủ tương ứng trong bộ mẫu.

**Khuyến nghị bắt buộc:** thêm mục ngưỡng QoS vào settings theo module 07/13; bố trí tính lại thống kê theo API trả 202, không báo đã xong ngay khi xếp hàng. Hoàn thiện tổng hợp lưu lượng theo module 14 bằng màn riêng hoặc phần tích hợp đủ trường và drill-down. Không tự thêm API hay một hệ thống giám sát mới ngoài đặc tả.

### F10 — P2 — Mô hình vai trò và số liệu quản trị nhóm còn lệch nhau

**Bằng chứng:** `templates/member/group-admin.js:22` và các fixture còn `isGroupAdmin`, `canAccessRecording`; `:800` bảo vệ hạ quyền bằng đếm tất cả Admin thay vì chỉ ACTIVE; trong khi khóa tài khoản tại `:1011` lại đếm ACTIVE. Module 10 đã chuyển sang vai trò cố định và yêu cầu giữ ít nhất một GROUP_ADMIN ACTIVE.

**Khuyến nghị bắt buộc:** dùng `roleCode`, chọn đích rõ ràng và giữ kiểm tra cuối cùng ở API; thống nhất safeguard giữa hạ quyền và khóa. Kiểm trường hợp một Admin ACTIVE và một Admin LOCKED trước khi chốt mẫu.

### F11 — P2 — Thẻ nhóm và danh sách thành viên tạo số tổng khó hiểu

**Bằng chứng:** `templates/member/group-summary.js:72` trả `userCount: 9`, `:184` ghi tổng; danh sách quản trị có sáu người, năm ACTIVE và một LOCKED. Trình duyệt hiển thị cùng lúc tổng 9 và danh sách 6 khi không lọc. Khi tải thẻ lỗi, tổng hiện 0 nhưng danh sách vẫn sáu người.

**Ảnh hưởng:** khó biết số 0 là không có dữ liệu hay chưa tải được. **Khuyến nghị:** dùng fixture nhất quán; khi thẻ lỗi hiển thị “—/Chưa tải được”, không số 0. Phân biệt tổng nhóm với số kết quả lọc. Việc thẻ tóm tắt và danh sách tải độc lập là đúng đặc tả; không cần chặn toàn bộ danh sách chỉ vì thẻ lỗi.

### F12 — P1 — Dashboard phụ thuộc Internet và chưa chịu được lỗi biểu đồ

**Bằng chứng:** `templates/admin/dashboard.html:12` dùng Chart.js CDN không pin phiên bản; `dashboard.js:20` gọi `new Chart` trực tiếp. Bản Member cùng vấn đề. Khi CDN bị chặn, cả hai phát `Chart is not defined`. Reports có guard `typeof Chart` nên không ném lỗi đó, nhưng biểu đồ trống chưa có giải thích rõ.

**Khuyến nghị:** đóng gói/pin thư viện trong build, phục vụ font/asset nội bộ phù hợp mạng EVN. Nếu không tải được biểu đồ, hiện thông báo và bảng/tóm tắt thay thế; lỗi biểu đồ không chặn phần KPI khác. Phân biệt đây là kịch bản mất tài nguyên ngoài đã tái hiện, không khẳng định CDN luôn lỗi trong mạng triển khai.

### F13 — P2 — Ghi âm tải tài nguyên sớm và chưa phải luồng Mix được kiểm chứng

**Bằng chứng:** `templates/admin/cdr-history.js:169` và Member gắn `src` audio ngoài ngay từng dòng, không quy định `preload="none"`; request audio xuất hiện ngay khi mở trang. Audio mẫu là MP3 SoundHelix, không phải bản ghi cuộc gọi Mix của hệ thống.

**Khuyến nghị:** chỉ khởi tạo stream khi người dùng bấm nghe/mở chi tiết; `preload="none"` nếu đặt player trong bảng. Hiện trạng thái tải/không tồn tại/không quyền/hết phiên và ngừng player khi đóng. Kiểm thử tua Range, thời lượng, hết phiên và tải file Mix với API thật; hiện chưa thể đánh giá các phần này.

### F14 — P2 — Bàn phím và modal chưa đáp ứng thao tác cơ bản

**Bằng chứng:** `templates/admin/dashboard.html:65` dùng `div onclick` cho nhóm menu; cùng mẫu ở nhiều trang, không focus bằng Tab mặc định. `templates/admin/cdr-history.html:489` modal không có role/aria-modal; mở bằng click dòng không chuyển focus, Escape không đóng đã tái hiện ở Member. Dòng CDR có click nhưng chưa có nút chi tiết focus được.

**Khuyến nghị:** dùng button cho mở nhóm menu và thao tác; `aria-expanded/controls`, focus hiển thị. Modal có nhãn, focus ban đầu, giữ focus bên trong, Escape khi không gửi và trả focus về nguồn mở. Thêm nút “Chi tiết” có tên truy cập thay vì buộc click dòng. Không kết luận mọi modal đều lỗi giống CDR; những màn mới cần kiểm riêng.

### F15 — P2 — Nhãn form và phản hồi hỗ trợ đọc màn hình chưa đồng đều

**Bằng chứng:** `templates/admin/cdr-history.html:279` input Caller có label bố cục nhưng không liên kết `for`; Member tương tự. Quét DOM thấy CDR Admin 7, Member 6 control chưa có label liên kết/aria-label/aria-labelledby; QoS mỗi cổng 10. Số quét bao gồm control trong hộp ẩn, là tín hiệu cần kiểm, không phải số vi phạm WCAG đã xác nhận. Một số nút icon chỉ có title; title có thể cung cấp tên nhưng không phải giải pháp tốt cho cảm ứng.

**Khuyến nghị:** label cho từng ngày/số gọi/số nhận, mô tả lỗi qua aria-describedby, lỗi chung/toast dùng live region phù hợp; nút icon có tên và tooltip nhìn thấy. Giữ focus ring hiện có của `.form-control:focus`; không đánh dấu mọi `outline:none` là lỗi vì một số đã có border/shadow thay thế.

### F16 — P2 — Mobile có chỗ chật và xuống dòng bất lợi

**Bằng chứng:** ảnh `mobile-dark-content-sheet.png`: tiêu đề/bộ lọc QoS dày, nút “Bộ lọc nâng cao” bị xuống nhiều dòng; ma trận có thanh nhiều nút khó đọc. Một số tiêu đề bắt đầu sát mép. Các bảng CDR/QoS/reports rộng hơn viewport nhưng nằm trong khung cuộn; không tự động coi đó là lỗi tràn toàn trang.

**Khuyến nghị:** padding nội dung tối thiểu nhất quán, header filter chia hàng rõ ở mobile, nút hành động không bị ép thành từng từ; với bảng kỹ thuật giữ cột khóa, chỉ dấu cuộn và mở chi tiết theo hàng. Trên mobile ưu tiên xem nhanh và tra cứu; vẫn bảo đảm chức năng truy cập được, không bắt người dùng phải có desktop mới thao tác được.

### F17 — P2 — Chuyển động và render lại có thể cải thiện

**Bằng chứng:** quét nguồn có **140** khai báo `transition: all`; chỉ `admin/profile.css` và `member/profile.css` có `prefers-reduced-motion`. `templates/admin/reports.js:367` hủy/vẽ lại biểu đồ khi refresh view; dữ liệu nhỏ chưa cho thấy nghẽn nghiêm trọng.

**Khuyến nghị:** khai báo thuộc tính chuyển động cụ thể, hỗ trợ reduced motion cả app shell/biểu đồ; update dataset thay destroy nếu phù hợp. Khi tích hợp, dùng phân trang server; chỉ áp dụng virtualization sau khi đo thấy cần, không mặc định bắt mọi bảng nhỏ dùng virtualization.

### F18 — P2 — Trạng thái tìm kiếm chưa lưu được ngữ cảnh điều tra

**Bằng chứng:** CDR submit không cập nhật URL; QoS có state cục bộ nhưng chưa lưu bộ lọc vào URL trong luồng kiểm thử. Đang tra cứu một sự cố rồi tải lại/chia sẻ link không đảm bảo giữ đúng thời gian/số máy. Settings đã có deep link `?section=` hoạt động; nên dùng làm hướng tham khảo.

**Khuyến nghị:** đồng bộ bộ lọc/trang/tab quan trọng vào query, giữ khi quay lại từ chi tiết; URL chỉ là trạng thái tìm kiếm, không thay quyền phạm vi nhóm. Chốt tên trường theo frontend contract hiện hành khi triển khai.

### F19 — P2 — Thông báo mẫu dùng chung khóa giữa hai cổng

**Bằng chứng:** `templates/admin/main.js:17`, `:25`, `:31` và hai `notifications.js` cùng dùng khóa `notifications`. Hai cổng cùng origin nên trạng thái đọc mẫu có thể đi theo nhau; JS notifications hai cổng giống hệt.

**Khuyến nghị:** dữ liệu thông báo thực lấy theo tài khoản/cổng từ API và socket. Fixture/cache thử nghiệm phải có namespace theo cổng và tài khoản; đăng xuất không để trạng thái của người trước xuất hiện cho người sau. Chưa kiểm chứng socket hoặc email thật.

### F20 — P2 — Thông điệp kỹ thuật và số đo giả dễ làm người dùng hiểu sai

**Bằng chứng:** `templates/admin/reports.js:945` toast luôn ghi “410ms - Zero CDR Scan” dù dùng timeout 600 ms; `reports.html:420` nhắc tên bảng `stats_daily`. Ma trận còn lộ tên Guard/decorator và mã quyền cũ (`data-permissions.js:159`, `:367`, `:394`). Module 10 đã loại ma trận khỏi sản phẩm.

**Khuyến nghị:** bỏ số tốc độ cố định, tên bảng và cơ chế backend khỏi UI nghiệp vụ; thông báo rõ dữ liệu/kỳ/phạm vi và trạng thái tác vụ. Ở prototype gắn nhãn “Dữ liệu mô phỏng”. Không dùng các chuỗi này làm bằng chứng hiệu năng.

### F21 — P3 — Chuẩn hóa thành phần để tránh hai cổng lệch nhau

**Bằng chứng:** mười tệp cùng tên có nội dung giống hoàn toàn giữa Admin/Member, gồm `style.css`, `qos-debug.js`, `notifications.js`; tổng nguồn ba loại tệp khoảng 2,93 MB chưa nén, không phải payload của một trang. Thành phần shell/menu lặp ở nhiều HTML.

**Khuyến nghị:** khi chuyển Vue dùng shared component/token cho bảng, modal, bộ lọc, QoS và theme; layout/menu/permission riêng theo cổng. Không cần gom template bằng một refactor lớn trong đợt báo cáo này. Loại CSS không dùng sau khi đo coverage, không xóa chỉ vì trùng tên.

### F22 — P3 — Cần tăng tính chính xác và tốc độ đọc của giao diện kỹ thuật

**Bằng chứng:** bố cục desktop có bảng QoS hai chiều, số máy, SIP code và đơn vị ms/%; đây là điểm mạnh. Tuy nhiên CDR dùng nhãn Anh/Việt lẫn nhau và chuỗi chất lượng khác dashboard; bảng/biểu đồ có nhiều chữ nhỏ và nhãn trạng thái xanh, vàng trên nền nhạt. Chưa thực hiện kiểm WCAG contrast đầy đủ nên không tuyên bố đạt/không đạt toàn hệ thống.

**Khuyến nghị:** thống nhất “Cuộc gọi đến/đi/nội bộ”, vẫn giữ mã SIP kỹ thuật; font monospace/tabular-nums cho số máy, Call ID, thời lượng và chỉ số; nhãn thể hiện đơn vị, timezone, dữ liệu thiếu và thời điểm cập nhật. Có chế độ mật độ bảng gọn, tăng cỡ chữ/độ tương phản phụ cho phiên trực dài; màu cảnh báo luôn đi kèm chữ/icon. Kiểm tra contrast thực tế cả sáng/tối trước nghiệm thu.

## 5. Hiệu năng: số đo và giới hạn

### 5.1. Kết quả đo thực

Đo sáu trang, ba lần/trang, không throttle CPU/mạng, cùng browser context; Chart.js được phục vụ bằng bản tải cục bộ trong bộ kiểm thử. FCP và thời gian load từ Performance API; LCP/CLS quan sát trong cửa sổ khoảng 1,1 giây sau `load`. Không có số INP đại diện người dùng thật.

| Trang | FCP ba lần (ms) | Load ba lần (ms, làm tròn) | Quan sát thêm |
|---|---|---|---|
| Admin dashboard | 188 / 76 / 60 | 171 / 56 / 53 | Một long task 107 ms ở lần đầu; LCP 60–188 ms trong cửa sổ đo. |
| Member dashboard | 112 / 100 / 52 | 101 / 97 / 58 | CLS khoảng 0,00074; chưa có dữ liệu API thật. |
| Admin QoS | 64 / 60 / 56 | 59 / 42 / 60 | CLS 0–0,0836 giữa ba lần; cần điều tra thêm khi tải font/data thật. |
| Admin reports | 88 / 72 / 64 | 76 / 52 / 53 | Không có pageerror trong ba lần có Chart.js. |
| Admin data-permissions | 176 / 116 / 108 | 127 / 96 / 89 | Khoảng 4.114 DOM nodes ở baseline, một long task 86 ms lần đầu; màn này không triển khai theo module 10. |
| Member group-admin | 88 / 60 / 60 | 69 / 42 / 41 | LCP khoảng 976–1.024 ms, chờ mock nhóm; CLS khoảng 0,0192. |

**Diễn giải:** tải tài nguyên cục bộ rất nhanh, nhưng FCP không đồng nghĩa dữ liệu sẵn sàng thao tác. Các trang có mock trì hoãn khoảng vài trăm ms đến gần một giây; tải HTML nhanh không chứng minh toàn luồng nhanh. Trong baseline nguyên trạng, hai dashboard có pageerror do CDN; sau khi phục vụ Chart.js trong context kiểm thử, sáu trang đo không có pageerror ở 18 lượt.

Không đánh giá tốt/xấu toàn hệ thống từ mẫu này vì thiếu: backend/API thật, tập dữ liệu lớn, số người đồng thời, máy người dùng, cold cache có font/CDN hoạt động, CPU chậm và mạng WAN EVN. Không có kết quả Lighthouse/field Core Web Vitals; LCP/CLS trên là quan sát lab ngắn, không phải kết quả nghiệm thu CWV.

### 5.2. Kiểm hiệu năng tiếp theo khi có ứng dụng thật

1. Đo lạnh/ấm và mất mạng tài nguyên ngoài; đo thời gian từ bấm lọc tới bảng/KPI hoàn tất, không chỉ `load`.
2. Thử 10/20/50 dòng với total lớn ở backend; xác minh request có phân trang, debounce, hủy/bỏ response cũ và index/API phù hợp trong đợt kiểm riêng.
3. Kiểm bảng QoS, kho số và export dài kỳ với fixture/backend phù hợp. Không đẩy toàn bộ kho số/CDR xuống browser để lọc.
4. Đo nghe/tua ghi âm trên mạng thực, tải file báo cáo hợp lệ, lỗi/hết phiên và phản hồi tác vụ bất đồng bộ.
5. Thu thập long task, CLS trong cả tương tác, CPU/memory sau nhiều lần mở/đóng modal và đổi báo cáo; chốt ngưỡng nghiệm thu cùng đội dự án theo môi trường triển khai.

## 6. Nhận xét UI và UX theo công việc viễn thông

### 6.1. Điểm nên giữ

- EVN blue, logo, nền trung tính, nhóm sidebar và thẻ KPI tạo nhận diện doanh nghiệp rõ. Light/dark có token dùng chung, phần nội dung nhìn nhất quán ở các trang chính.
- QoS đặt Caller/Called, MOS/Loss/Jitter và SIP code trong cùng bối cảnh; có bộ lọc nâng cao và modal, phù hợp kỹ sư cần khoanh vùng sự cố.
- Quản trị nhóm có dạng thẻ/bảng, thông tin nhóm bên cạnh, trạng thái khóa và xác nhận thao tác. Tổ chức và một số trang hồ sơ có trạng thái tải/lỗi/thử lại tương đối rõ.
- Settings đã có quản trị tài khoản Admin và nhật ký kiểm toán, hỗ trợ deep link. Không cần tạo thêm trang chỉ để đáp ứng tên menu.
- Các bảng rộng có khung cuộn, mobile đổi bố cục một cột, cả 30 trang chuyển được sáng/tối. Không phát hiện tràn ngang document trong 180 kiểm tra; vẫn cần kiểm từng thành phần vì `overflow-x:hidden` có thể che phần bị vượt.

### 6.2. Những điều làm UI chưa đủ “chuẩn kỹ thuật”

Một giao diện viễn thông tốt phải giúp phân biệt chính xác thời gian, phạm vi nhóm, leg, hướng gọi và chỉ số thiếu dữ liệu. Hiện mẫu có các tên nhóm khác nhau giữa trang, dải MOS khác nhau và số tổng không nhất quán. Những vấn đề này làm giảm niềm tin nhiều hơn việc thiếu hiệu ứng hoặc màu sắc.

Đề xuất tổ chức trải nghiệm điều tra: **chọn kỳ/phạm vi → phát hiện chỉ số bất thường → lọc cuộc gọi liên quan → xem chi tiết/QoS/ghi âm được phép → xuất bằng chứng**. Cần giữ bộ lọc và điều hướng quay lại. Liên kết này cần hoàn thiện theo các endpoint hiện có; chưa khẳng định mẫu hiện đã làm đủ chuỗi.

Trên desktop, có thể giảm diện tích biểu tượng/card khi người dùng chọn chế độ gọn, dành chỗ cho bảng và thời điểm cập nhật. Trên mobile, bộ lọc QoS hiện chiếm gần hết viewport đầu; nên có bản tóm tắt bộ lọc đang áp dụng và thu gọn phần nâng cao. Đây là **đề xuất UX**, không phải yêu cầu tạo dashboard NOC mới.

## 7. Kịch bản đã chạy và phần chưa kiểm chứng

| Kịch bản | Kết quả |
|---|---|
| Mở 30 trang nguyên trạng | Đều nhận HTML; hai dashboard lỗi Chart khi CDN bị chặn; tài nguyên font/avatar/audio ngoài bị chặn. |
| Sáu tổ hợp bố cục mỗi trang | 180 lượt, document không tràn ngang, theme đúng giá trị đích; không đồng nghĩa mọi nút/bảng đều hoàn hảo. |
| Zoom | 30 lượt CSS zoom 2 không tràn document; native zoom và screen reader chưa kiểm. |
| CDR số không khớp | Vẫn bốn dòng, ghi F03. |
| CDR mở chi tiết, focus, Escape | Mở được; focus BODY, Escape không đóng, ghi F14. |
| CDR REGULAR_USER + recording=0 | Vẫn có player, ghi F02. Không nghe được audio ngoài do môi trường chặn. |
| QoS số không khớp | Có trạng thái rỗng và hướng dẫn điều chỉnh bộ lọc; điểm tốt. |
| PDF báo cáo | Có download nhưng nội dung văn bản, ghi F04. Excel có cùng cách tạo Blob theo mã, chưa mở trong Excel thật. |
| Thêm vai trò | Modal mở được, trái đặc tả chỉ xem. |
| Group summary lỗi mạng và retry | Có thông điệp lỗi; bấm Thử lại và chờ ổn định thì tải lại thành công. |
| Group summary maintenance/khác nhóm | Có thông điệp bảo trì/không quyền riêng; danh sách thành viên vẫn tải độc lập. |
| Nhóm độc lập/chưa cấp dải | Có nhãn “Nhóm độc lập” và “Chưa cấp dải số”. |
| Mở group-admin bằng REGULAR_USER | Trang và nút thêm vẫn xuất hiện, ghi F08. |
| Audit deep link | `system-settings.html?section=audit-logs` mở được khu vực audit. |
| Biểu đồ khi Chart.js có sẵn | Dashboard/reports vẽ được; 18 lượt đo sáu trang không có pageerror. |

Chưa kiểm hết CRUD và ràng buộc đồng thời của mọi module; chưa thử mọi loại lỗi 400/401/403/409/423/503 trên từng màn; chưa test xâm nhập; chưa đánh giá backend tenant isolation. Chưa có kịch bản dài dữ liệu đủ đại diện để kết luận tên/mô tả cực dài đều đạt, chưa kiểm screen reader/contrast tự động toàn bộ. Các form mới có maxlength/escape tại một số nơi nhưng cần fixture biên khi nghiệm thu. Không lấy “không phát hiện ở lượt rà” làm bằng chứng chức năng đã đúng.

## 8. Thứ tự cải thiện đề xuất

### Đợt 1 — Chốt mẫu đúng đặc tả

1. Sửa F01/F02/F08: danh sách vai trò chỉ đọc, bỏ màn bị loại, thống nhất account/permissions/group trên mọi trang.
2. Sửa F03–F07: lọc/phân trang CDR, kỳ/phạm vi/tổng báo cáo, định dạng xuất, thang MOS dùng chung.
3. Hoàn thiện UI còn thiếu ở F09; bổ sung fixture sai quyền, nhóm tắt ghi âm, dữ liệu rỗng, thiếu QoS và nhiều leg.
4. Khắc phục lỗi phụ thuộc ngoài F12; không để dashboard vỡ khi mất CDN.

**Điều kiện xong:** mọi điều khiển công bố hoạt động có thể kiểm chứng trên fixture hoặc ghi rõ mô phỏng; không còn đường UI trái quyền/khái niệm nhóm; bảng, KPI và file cùng kỳ/phạm vi/công thức.

### Đợt 2 — Hoàn thiện khả năng sử dụng

Sửa F10/F11/F14–F16/F18/F19: safeguard Admin ACTIVE, tổng số/trạng thái lỗi đúng nghĩa, bàn phím/modal/label, bộ lọc mobile và giữ ngữ cảnh. Giữ thẻ nhóm tải độc lập. Kiểm thêm contrast, screen reader, native zoom 200%, tên/mô tả dài và màn hình thấp.

**Điều kiện xong:** luồng tra cứu chính dùng được bằng bàn phím và cảm ứng; lỗi cho biết cách phục hồi; trạng thái không có dữ liệu khác rõ chưa tải được dữ liệu.

### Đợt 3 — Tối ưu khi chuyển sang ứng dụng thật

Sửa F13/F17/F20/F21 và đo lại hiệu năng với API/dữ liệu/mạng thật. Dùng shared component đúng kiến trúc docs; chỉ tối ưu virtualization/lazy rendering ở chỗ có bằng chứng cần thiết. Đo xuất file, streaming, long task và bộ nhớ theo luồng làm việc.

### Đề xuất mở rộng tùy chọn

- Chế độ bảng gọn và tùy chọn cột cho kỹ sư trực; giữ chỉ số/đơn vị thiết yếu dễ đọc.
- Bộ lọc đã lưu và liên kết chia sẻ điều tra, trong ràng buộc quyền hiện hành.
- Timestamp cập nhật dữ liệu và dấu hiệu dữ liệu chậm để người trực biết độ mới. Khi cần dữ liệu backend bổ sung phải chốt contract riêng trước.

Các đề xuất này không mặc nhiên trở thành chức năng bắt buộc. Mọi kế hoạch mở rộng cần phân biệt rõ với phần sai/thiếu đã có căn cứ trong đặc tả.
