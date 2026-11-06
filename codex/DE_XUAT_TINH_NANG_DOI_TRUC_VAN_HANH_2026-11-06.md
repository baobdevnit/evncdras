# Đề xuất tính năng cho đội trực vận hành EVN CDR AS

**Ngày viết:** 06/11/2026 (UTC+7).  
**Định hướng:** hệ thống giám sát nội bộ phục vụ đội trực vận hành mạng thoại PABX EVN.  
**Tính chất:** ý kiến đề xuất sản phẩm dựa trên tài liệu và hiện trạng workspace; chưa phải yêu cầu đã được phê duyệt hoặc tính năng đã triển khai.

## 1. Ý kiến chính

Theo tôi, dự án nên tập trung vào một vòng công việc xuyên suốt: **phát hiện bất thường → có người nhận xử lý → tra cứu bằng chứng → theo dõi khôi phục → bàn giao ca**.

Tra cứu CDR, biểu đồ QoS và báo cáo là nền tảng cần thiết. Giá trị bổ sung lớn nhất cho đội trực là giúp họ biết **việc gì cần làm ngay, ai đang làm, dữ liệu có đáng tin và việc nào chưa xong khi đổi ca**. Tôi ưu tiên hoàn thiện vòng công việc này trước các tính năng phân tích phức tạp.

Kho hiện chủ yếu gồm đặc tả và giao diện HTML mẫu; chưa có mã ứng dụng backend/frontend đủ để xác nhận hành vi vận hành. Trong tài liệu này, “đã có” nghĩa là **đã có trong đặc tả**, không đồng nghĩa đã chạy thực tế. Nguồn chuẩn để đối chiếu là `docs/`.

## 2. Những nền tảng đã có, nên tận dụng

| Nội dung đã có trong đặc tả | Căn cứ | Hướng bổ sung phù hợp |
|---|---|---|
| Dashboard toàn hệ thống/theo nhóm, MOS, ASR, lưu lượng, cuộc gọi gần đây | [Module 05](../docs/modules/05_dashboard_analytics.md), mục 1–3 và 5 | Thêm góc nhìn phục vụ ca trực và độ mới dữ liệu |
| Cảnh báo `QOS_ALERT`, `PABX_OFFLINE`, `SYSTEM_JOB`; in-app và email | [Module 06](../docs/modules/06_notifications.md), mục 1 | Bổ sung nhận việc, theo dõi xử lý và chuyển cấp |
| Trạng thái job, lần chạy thành công, CDR bị cách ly, hàng đợi thống kê/email | [Module 07](../docs/modules/07_system_settings.md), mục 3.5–3.7 | Đưa tình trạng xử lý dữ liệu ra màn hình trực |
| Chi tiết CDR, các leg, ghi âm Mix có phân quyền | [Module 12](../docs/modules/12_core_business_cdr_and_audio.md), mục 1–3 | Mở đúng dữ liệu liên quan trực tiếp từ một sự cố |
| QoS hai chiều, phân bố mã SIP, ASR/NER và ngưỡng chất lượng | [Module 13](../docs/modules/13_core_business_qos_analysis.md), mục 1 và 3 | Khoanh vùng nhóm bị ảnh hưởng, theo dõi hồi phục |
| Báo cáo tổng hợp, lưu lượng, chất lượng và lỗi SIP; Excel/PDF | [Module 15](../docs/modules/15_core_business_reports_export.md), mục 1–2 | Bổ sung báo cáo ca và dòng thời gian xử lý |

Không nên đưa các mục trên vào danh sách “tính năng mới” như thể thiết kế hiện tại chưa có.

## 3. Danh sách ưu tiên

P0 là phần nên đưa vào phiên bản đầu phục vụ trực; P1 bổ sung sau khi luồng chính chạy ổn; P2 chỉ làm khi có nhu cầu và nguồn dữ liệu phù hợp. Mức công sức là tương đối, không phải ước lượng thời gian cam kết.

| Mã | Tính năng đề xuất | Ưu tiên | Công sức | Lợi ích chính |
|---|---|---|---|---|
| VH-01 | Màn hình trực tập trung, có độ mới dữ liệu | P0 | Vừa | Nhìn ra việc cần xử lý và tránh tin số liệu đã cũ |
| VH-02 | Tiếp nhận và theo dõi xử lý sự cố | P0 | Vừa | Mỗi sự cố có người chịu trách nhiệm |
| VH-03 | Phân biệt thiếu dữ liệu, lỗi xử lý và mất kết nối | P0 | Vừa; cao nếu thêm đầu đo | Tránh báo mất tổng đài chỉ vì ít cuộc gọi |
| VH-04 | Sổ trực và bàn giao ca | P1; có thể làm bản tối thiểu sớm | Vừa | Ca sau tiếp tục được công việc đang dở |
| VH-05 | Gom cảnh báo, tạm ngưng thông báo khi bảo trì | P1 | Vừa | Giảm cảnh báo lặp và bỏ sót việc quan trọng |
| VH-06 | Lịch trực, nhắc nhận việc và chuyển cấp | P1 | Vừa | Sự cố quan trọng không bị bỏ quên |
| VH-07 | Cảnh báo QoS theo cửa sổ ngắn | P1 | Cao | Phát hiện sớm hơn cơ chế đánh giá theo giờ |
| VH-08 | Hướng dẫn xử lý và hồ sơ bằng chứng | P1 | Vừa | Giảm thao tác tra cứu và chuẩn hóa cách xử lý |
| VH-09 | Danh sách nhóm/số cần theo dõi, so sánh trước–sau | P2 | Vừa | Tập trung vào phạm vi quan trọng và kiểm tra hồi phục |
| VH-10 | Giám sát chủ động PABX/trunk, phân tích PCAP | P2, có điều kiện | Cao | Xác minh trạng thái và điều tra sâu khi CDR chưa đủ |

### VH-01. Màn hình trực tập trung

Đặt danh sách sự cố đang mở lên trước các biểu đồ thống kê dài hạn. Mỗi dòng gồm mức độ, phạm vi ảnh hưởng, thời điểm phát hiện, tuổi sự cố, người nhận và việc tiếp theo. Có bộ lọc “chưa ai nhận”, “đang xử lý”, “chờ phối hợp”, “đã khôi phục chờ xác nhận”.

Phía trên hiển thị tình trạng dữ liệu: lần gần nhất thấy CDR mới, lần làm giàu thành công, mốc thống kê được cập nhật và mốc QoS đã đánh giá. Phân biệt thời gian trình duyệt tải lại với thời gian dữ liệu thực sự được tính. Một lần F5 không làm số liệu cũ trở thành mới.

Chế độ màn hình lớn chỉ nên có dữ liệu tổng hợp phù hợp người có thể nhìn thấy; tránh tự hiện số điện thoại hoặc ghi âm. Có thể tự làm mới, nhưng giữ nguyên bộ lọc và vị trí người trực đang xem.

**Tiêu chí kiểm chứng:** dừng tổng hợp thống kê, màn hình vẫn thể hiện dữ liệu cũ và mốc cập nhật thực; không tiếp tục biểu diễn toàn bộ hệ thống là bình thường chỉ vì KPI gần nhất còn tốt.

### VH-02. Tiếp nhận và theo dõi xử lý sự cố

Thông báo “đã đọc” là trạng thái cá nhân; cần thêm trạng thái xử lý chung của sự cố. Luồng tối thiểu đề xuất:

`Mới → Đã nhận → Đang xử lý → Đã khôi phục → Đóng`.

Có người phụ trách, mức ảnh hưởng, ghi chú thao tác, liên kết các cảnh báo/CDR và lịch sử chuyển người. “Chờ phối hợp” có thể là nhãn kèm đầu mối và thời điểm cần kiểm tra lại. Hai người cùng bấm nhận thì hệ thống chỉ xác nhận một người nhận đầu tiên; người còn lại thấy thông tin mới.

Giữ riêng **trạng thái kỹ thuật** và **trạng thái công việc**: chỉ số hồi phục không có nghĩa người trực đã xác minh xong; người trực đánh dấu đã nhận cũng không làm chỉ số hết lỗi. Đóng sự cố cần kết quả kiểm tra và tóm tắt xử lý. Nếu triệu chứng tái xuất hiện, lưu rõ là mở lại hay tạo sự cố liên quan.

**Tiêu chí kiểm chứng:** đọc thông báo không tự nhận sự cố; mọi ca trực cùng thấy người phụ trách và dòng thời gian thay đổi.

### VH-03. Phân biệt thiếu dữ liệu và sự cố tổng đài

Theo Module 06 mục 1.1, `PABX_OFFLINE` hiện dựa trên việc không đọc được CDR mới trong khoảng cấu hình, mặc định 60 phút. Với trực nội bộ, nên hiển thị rõ đây là **dấu hiệu gián đoạn dữ liệu CDR**, chưa đủ để kết luận PABX hoặc trunk ngừng hoạt động.

Đề xuất các trạng thái dễ hiểu: “có dữ liệu mới”, “chưa có cuộc gọi mới”, “dữ liệu trễ”, “lỗi xử lý”, “không xác định”. Đánh giá kết hợp trạng thái job, thời điểm thấy dữ liệu mới và khung hoạt động dự kiến. Nếu chưa có tín hiệu độc lập, hiển thị “chưa có dữ liệu mới/chưa xác minh kết nối”, tránh khẳng định một nguyên nhân.

Tận dụng `system/jobs` để trình bày CDR bị cách ly, hàng đợi thống kê và email chờ gửi. Nếu cần độ trễ tiếp nhận/làm giàu chính xác, worker phải ghi thêm mốc đo; không suy độ trễ từ `Created` một cách máy móc, không lấy chênh lệch ID làm số bản ghi tồn và không để dashboard quét CDR thô.

**Tiêu chí kiểm chứng:** ban đêm không phát sinh cuộc gọi nhưng worker vẫn chạy được phân biệt với worker dừng; dữ liệu QoS không đủ mẫu không mang màu “tốt”. Cách tách “không có dữ liệu” và “lỗi đánh giá” cũng có thể tham khảo [tài liệu Grafana](https://grafana.com/docs/grafana/latest/alerting/fundamentals/alert-rule-evaluation/nodata-and-error-states/).

### VH-04. Sổ trực và bàn giao ca

Một trang bàn giao gồm ca/người trực, sự cố chưa đóng, việc đang chờ phối hợp, lịch bảo trì, phạm vi cần theo dõi và thời điểm cần kiểm tra tiếp. Hệ thống tự gợi ý sự cố mở; người giao bổ sung nhận xét và người nhận xác nhận tiếp nhận.

Cho phép ghi nhận phản ánh của đơn vị khi chưa có cảnh báo tự động, rồi liên kết với sự cố nếu cần. Lưu bản bàn giao tại thời điểm chốt; sửa bổ sung có lịch sử. Tóm tắt ca có số sự cố phát sinh, tồn đầu/cuối ca và kết quả xử lý, tránh biến sổ trực thành việc nhập lại toàn bộ số liệu dashboard.

**Tiêu chí kiểm chứng:** một sự cố đi qua hai ca vẫn giữ nguyên lịch sử; bàn giao có người nhận và danh sách việc cần tiếp tục. Sự cố mở sau khi chốt vẫn xuất hiện trong hàng đợi trực hiện tại.

### VH-05. Giảm nhiễu cảnh báo và hỗ trợ bảo trì

Thiết kế đã có chống trùng thông báo; phần mới là gom các lần phát hiện liên tiếp thành một đợt sự cố, theo dõi số lần lặp, thời điểm bắt đầu và lần cuối còn lỗi. Gom theo quy tắc rõ ràng như loại triệu chứng, phạm vi và cửa sổ thời gian; không tự coi các cảnh báo gần nhau là cùng nguyên nhân.

Thêm lịch bảo trì theo phạm vi và thời hạn, kèm người tạo/lý do. Trong cửa sổ bảo trì vẫn thu thập, đánh giá và lưu lịch sử nhưng điều chỉnh việc gửi thông báo; màn hình phải cho biết đang tạm ngưng thông báo. Hết hạn tự trở lại chính sách thường và đánh giá lỗi còn tồn tại.

Đây là mở rộng khác với `system_maintenance_mode` hiện có, vốn chặn phần lớn API Member. Không bật chế độ chặn truy cập chỉ để tắt chuông khi bảo trì một phần mạng.

**Tiêu chí kiểm chứng:** lỗi lặp cập nhật sự cố đang mở; lịch bảo trì một nhóm không tắt cảnh báo nhóm khác, cũng không che việc chính hệ thống giám sát đang ngừng chạy.

### VH-06. Lịch trực và chuyển cấp

Khai báo người/nhóm đang trực, đầu mối phối hợp và trưởng ca. Sự cố quan trọng chưa có người nhận trong thời gian cấu hình được nhắc lại hoặc chuyển cấp; thời hạn phải do đội vận hành thống nhất theo mức ảnh hưởng. Bắt đầu với in-app/email đã có, chỉ thêm SMS hoặc kênh nội bộ khác khi có hạ tầng được phép sử dụng.

Một điểm cần tính ngay: email hiện được gửi bởi `backend-worker`, trong khi chính worker có thể là đối tượng bị giám sát. Muốn báo được khi worker chết, cần đường giám sát/gửi cảnh báo độc lập, ưu tiên dùng hạ tầng giám sát hiện có của đơn vị. Nếu cả API hoặc DB dừng, hệ thống không thể tự bảo đảm gửi báo qua cùng chuỗi phụ thuộc.

**Tiêu chí kiểm chứng:** mô phỏng worker dừng và xác nhận đầu mối trực nhận được cảnh báo qua đường độc lập; nhận việc dừng nhắc “chưa có người nhận” nhưng không tự đóng sự cố. [Prometheus khuyến nghị kiểm tra cả chuỗi cảnh báo đầu cuối](https://prometheus.io/docs/practices/alerting/), phù hợp để tham khảo cho bài kiểm tra này.

### VH-07. Cảnh báo sớm theo cửa sổ ngắn

Cơ chế hiện tại đánh giá khung giờ đã kết thúc ít nhất 60 phút; ví dụ 09:00–10:00 được đánh giá sớm nhất lúc 11:00. WebSocket phát nhanh sau khi tạo thông báo không làm giảm độ trễ đánh giá đó.

Đề xuất khảo sát thêm cửa sổ 5 phút cho lỗi kết nối SIP, tỷ lệ thất bại và chất lượng thoại. Đây là thay đổi xử lý/tổng hợp ở worker, không chỉ đổi chu kỳ làm mới giao diện. Giữ tổng hợp giờ/ngày phục vụ báo cáo; màn hình chỉ đọc kết quả đã tổng hợp.

Cần quy định số mẫu tối thiểu, số cửa sổ liên tiếp, điều kiện khôi phục, xử lý CDR đến muộn và các cuộc gọi còn đang diễn ra. Hiển thị số mẫu QoS hợp lệ; không biến thiếu MOS thành MOS bằng 0. ASR giảm phải đi kèm NER và mã SIP để tránh coi bận/không trả lời là lỗi hạ tầng.

**Tiêu chí kiểm chứng:** thử cả nhóm có nhiều cuộc và nhóm ít cuộc; đo thời gian từ khi đủ dữ liệu đến lúc phát cảnh báo. Mốc 5 phút là phương án thử nghiệm, chưa phải cam kết phát hiện sự cố sau 5 phút và chưa phải giám sát cuộc gọi đang diễn ra.

### VH-08. Hướng dẫn xử lý và hồ sơ bằng chứng

Mỗi loại cảnh báo gắn một hướng dẫn ngắn: cần kiểm tra gì trước, mở màn hình nào, liên hệ ai và điều kiện nào để kết luận hồi phục. Ưu tiên các tình huống sát thực tế: tăng lỗi SIP 503/408, giảm MOS, tăng mất gói, ngừng có dữ liệu CDR, worker lỗi và không truy cập được ghi âm.

Từ sự cố, mở ngay CDR/QoS với bộ lọc thời gian và phạm vi liên quan; lưu ID các cuộc gọi mẫu, mốc dữ liệu, chỉ số và ngưỡng lúc phát hiện. Một thao tác xuất hồ sơ nên ưu tiên tóm tắt kỹ thuật, lịch sử xử lý và liên kết bằng chứng. Ghi âm chỉ được truy cập theo quyền hiện có; không tự đính kèm file thoại vào email hay gói chia sẻ.

**Tiêu chí kiểm chứng:** người trực mở được hướng dẫn và dữ liệu liên quan từ cùng màn hình; liên kết không cho người dùng xem vượt phạm vi. Nếu CDR đã hết hạn lưu, vẫn đọc được tóm tắt kỹ thuật của sự cố và thấy rõ bằng chứng gốc không còn.

### VH-09. Theo dõi phạm vi quan trọng và kiểm tra trước–sau

Cho phép ghim nhóm hoặc số máy cần theo dõi trong ca, với lý do, người phụ trách và thời hạn. Danh sách này là cấu hình vận hành trong phạm vi được cấp quyền; không suy mức quan trọng từ tên đơn vị hoặc từ lưu lượng cao.

Sau xử lý, so sánh trước–sau về tỷ lệ thất bại, mã SIP, MOS/mất gói, số mẫu và độ mới dữ liệu. Khoanh vùng theo nhóm, chiều gọi hoặc endpoint khi đủ dữ liệu; gọi đó là “phạm vi có triệu chứng”, chưa phải kết luận tuyến mạng gây lỗi.

**Tiêu chí kiểm chứng:** một nhóm ít cuộc vẫn có thể được ghim; kết luận “đã hồi phục” không dựa vào việc hết cuộc gọi hoặc mất dữ liệu. Nếu cần thống kê theo số/endpoint ngoài các chiều tổng hợp hiện có, phải thiết kế thêm xử lý giới hạn phạm vi và kiểm chứng chi phí truy vấn.

### VH-10. Giám sát chủ động và PCAP có điều kiện

Nếu đội trực cần biết PABX/trunk có hoạt động ngay cả khi không có cuộc gọi, cần nguồn độc lập: heartbeat/API trạng thái, SNMP hoặc kiểm tra SIP có giới hạn. Trước tiên khảo sát khả năng tích hợp hạ tầng giám sát mạng hiện có. Ping chỉ kiểm tra được một phần khả năng kết nối, không chứng minh dịch vụ thoại hoạt động đầy đủ.

PCAP và sơ đồ SIP ladder có thể hữu ích cho điều tra chuyên sâu, nhưng Module 13 hiện chủ động để ngoài phạm vi. Chỉ xem xét khi xác nhận file thực sự tồn tại, truy cập được, có chính sách lưu trữ và quyền phù hợp; không thể dựng chuỗi bản tin SIP đầy đủ chỉ từ vài trường thời gian trong CDR.

**Tiêu chí kiểm chứng:** trạng thái trực tiếp có nguồn đo và thời điểm đo; mất đầu đo trả “không xác định”. Kiểm tra chủ động phải được giới hạn tần suất/phạm vi và thống nhất với người quản trị PABX trước khi bật.

## 4. Ba hướng phát triển và lựa chọn đề nghị

| Hướng | Điểm mạnh | Đánh đổi | Đánh giá |
|---|---|---|---|
| A. Mở rộng biểu đồ và báo cáo | Tận dụng nhiều đặc tả sẵn có; hỗ trợ xem lại xu hướng | Chưa giải quyết nhận việc, theo dõi và bàn giao | Nên hoàn thiện nền tảng, chưa phải trọng tâm bổ sung |
| B. Hoàn thiện công cụ ca trực trên nền CDR/QoS | Sát công việc hằng ca; tận dụng hệ thống hiện có | Cần thống nhất quy trình và trách nhiệm xử lý | **Đề nghị chọn làm hướng chính** |
| C. Mở rộng thành giám sát thoại chủ động, điều tra sâu | Có thể xác minh tình trạng độc lập với lưu lượng CDR | Phụ thuộc tích hợp PABX, đầu đo và vận hành thêm | Làm có chọn lọc sau B, theo nhu cầu thực tế |

Không nên đồng thời mở rộng thành hệ thống ticket tổng quát, nền tảng phân tích AI, quản lý tài sản và điều khiển PABX. Nếu đơn vị đã có hệ thống tiếp nhận sự cố, ưu tiên lưu mã/liên kết hồ sơ tại đó và xác định hệ thống nào giữ trạng thái xử lý chính, tránh hai danh sách người phụ trách mâu thuẫn nhau.

## 5. Phạm vi phiên bản đầu tôi đề nghị

1. Triển khai ổn định nền tảng CDR/QoS/thông báo và trạng thái job đã được đặc tả.
2. Thêm màn hình trực có độ mới dữ liệu, trạng thái thiếu dữ liệu rõ ràng và danh sách sự cố đang mở (VH-01, VH-03).
3. Bổ sung nhận việc, người phụ trách, ghi chú, khôi phục và đóng sự cố (VH-02).
4. Thêm bản bàn giao tối thiểu: ca/người giao–nhận, sự cố tồn và việc tiếp theo (phần cốt lõi VH-04).
5. Gắn một bộ hướng dẫn xử lý ngắn cho các cảnh báo chính; kiểm tra đường cảnh báo khi worker dừng (phần cốt lõi VH-08 và VH-06).

Chỉ sau khi thử nghiệm qua các ca thực tế mới chốt lịch trực/chuyển cấp đầy đủ, gom cảnh báo nâng cao và cửa sổ QoS ngắn. Không ấn định lịch triển khai khi chưa biết nhân lực và trạng thái ứng dụng chạy thực tế.

## 6. Nguyên tắc để triển khai đúng phạm vi nội bộ

- **Người trực cần quyền phù hợp:** `GET /admin/system/jobs` hiện yêu cầu `system:manage`. Nếu người trực chỉ xem sức khỏe hệ thống, nên bổ sung quyền chỉ đọc thay vì cấp quyền sửa toàn bộ cấu hình. Vai trò trực vận hành là đề xuất mở rộng, cần cập nhật đặc tả quyền khi được chọn.
- **Giữ cô lập theo nhóm:** mọi sự cố, bàn giao, bộ lọc lưu sẵn và file xuất đều kiểm tra phạm vi tại backend. Nhóm thành viên chỉ nhận phần thông tin được phép; sự cố xuyên nhóm do đội vận hành có quyền phù hợp xử lý.
- **Giữ đường dữ liệu nhẹ:** KPI/dashboard/báo cáo tiếp tục dùng số liệu tổng hợp; tra cứu CDR chi tiết có giới hạn thời gian và phân trang. Tính năng mới cần chiều tổng hợp mới phải được đánh giá riêng.
- **Không tạo số liệu giả:** không thêm cảnh báo RTT hay RX/TX ghi âm khi dữ liệu hiện tại không có; không suy trạng thái trunk hoặc cuộc gọi đang diễn ra từ số liệu tổng hợp lịch sử.
- **Đo hiệu quả thực tế:** theo dõi thời gian từ cảnh báo đến nhận việc, từ nhận việc đến khôi phục đã xác minh, số sự cố tồn qua ca và tỷ lệ cảnh báo không cần hành động. Tách thời điểm phát sinh triệu chứng, thời điểm phát hiện và thời điểm nhận việc; chưa có nguồn đo đáng tin thì không tuyên bố đo được đầy đủ thời gian phát hiện sự cố.

## 7. Căn cứ và giới hạn

Các nhận định về hiện trạng dựa trên tài liệu được liên kết ở mục 2, [kiến trúc hệ thống](../docs/00_overview_and_architecture.md) và [hợp đồng API](../docs/02_api_contracts.md). Đây là đề xuất tính năng phục vụ vận hành, không phải rà soát thiết kế CSDL; tài liệu không đưa ra thay đổi bảng hay migration.

Tài liệu Prometheus và Grafana được tham khảo ngày 06/11/2026 cho nguyên tắc cảnh báo và xử lý thiếu dữ liệu, không phải đề xuất bắt buộc cài thêm các sản phẩm này. Thứ tự ưu tiên, luồng xử lý và tiêu chí kiểm chứng ở trên là ý kiến thiết kế cho dự án; cần hiệu chỉnh bằng tình huống thực tế của đội trực trước khi chuyển thành đặc tả triển khai.
