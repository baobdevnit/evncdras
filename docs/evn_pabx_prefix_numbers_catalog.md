# DANH MỤC CÁC DẢI SỐ ĐIỆN THOẠI ĐƯỢC CẤP PHÁT TRÊN MẠNG PABX EVN
> **Nguồn trích xuất:** Tệp dữ liệu gốc `docs/evn_pabx_prefix_numbers.xlsx`  
> **Cơ quan quản lý & cấp phát:** Tập đoàn Điện lực Việt Nam (EVN) & Công ty Viễn thông Điện lực và CNTT (EVNICT)  
> **Căn cứ pháp lý:** Văn bản số `1444/EVN-VT&CNTT` ngày 13/04/2016 (Ủy quyền EVNICT cấp đầu số tổng đài nội bộ EVN) và Văn bản số `1010/EVN-VT&CNTT` ngày 21/03/2016 (Thu hồi và điều chỉnh dải số).

---

## 1. QUY TẮC ĐÁNH SỐ THUÊ BAO TỔNG ĐÀI PABX EVN (5 CHỮ SỐ)

Mạng viễn thông dùng riêng của EVN được quy hoạch thống nhất theo mô hình ma trận đánh số **5 chữ số**:

$$\text{Số máy PABX} = [H][C][X][X][X]$$

Trong đó:
- **$[H]$ (Hàng - Digit 1)**: Đại diện cho Khối / Miền chức năng (từ 0 đến 9).
- **$[C]$ (Cột - Digit 2)**: Đại diện cho Địa bàn Tỉnh/Thành phố hoặc Tổng công ty / Phân vùng trực thuộc.
- **$[X][X][X]$ (3 chữ số cuối - Digits 3, 4, 5)**: Dải số máy nhánh nội bộ cấp cho từng trạm biến áp, nhà máy điện hoặc đơn vị cụ thể:
  - Ký hiệu `xx`: Tương ứng dải 100 số (`00` đến `99`).
  - Ký hiệu `(00-49)` / `(50-99)`: Dải 50 số.
  - Ký hiệu `(00-19)` / `(0-4)`: Dải 20 hoặc 5 số.

*Ví dụ minh họa:*  
- Nhà máy điện Ninh Bình: Cấp dải $151\text{xx} \div 154\text{xx}$ (tương ứng từ số `15100` đến `15499`).  
- Trạm 500kV Thường Tín: Cấp dải $411\text{xx}$ (tương ứng từ số `41100` đến `41199`).

---

## 2. BẢNG PHÂN BỔ 10 KHỐI DẢI SỐ CHÍNH (SHEET: `EVNICT&Ban VTCNTT cap`)

| Khối (Digit 1) | Dải số chính | Phạm vi đối tượng cấp phát |
| :--- | :--- | :--- |
| **Khối 1** | `1xxxx` | **Khối Nguồn điện trọng điểm EVN**: Ialy, Uông Bí, Ninh Bình, Phả Lại, Thác Bà, Hòa Bình, Thác Mơ... |
| **Khối 2** | `2xxxx` | **Miền Bắc 1 (Tây Bắc & Đông Bắc)**: Vĩnh Phúc, Sơn La, Điện Biên, Bắc Giang, Lạng Sơn, Cao Bằng, Tuyên Quang, Thái Nguyên, Yên Bái, Lào Cai. |
| **Khối 3** | `3xxxx` | **Miền Bắc 2 (Đồng bằng & Duyên hải Bắc Bộ, Bắc Trung Bộ)**: Hải Phòng, Hải Dương - Hưng Yên, Quảng Ninh, Hà Tây cũ, Nam Định, Thái Bình, Thanh Hóa, Nghệ An, Hà Tĩnh, Ninh Bình. |
| **Khối 4** | `4xxxx` | **Khối Cơ quan Tập đoàn EVN, Điều độ & Đầu mối liên lạc**: Cơ quan EVN (Cửa Bắc), A0, A1, A2, A3, TTĐ1, TTĐ2, EPTC, EVNICT, Khách sạn Điện lực... |
| **Khối 5** | `5xxxx` | **Miền Trung & Tây Nguyên**: Đà Nẵng, Quảng Bình, Quảng Trị, TT-Huế, Quảng Ngãi, Bình Định, Phú Yên, Khánh Hòa, Gia Lai, Đắk Lắk, Đắk Nông. |
| **Khối 6** | `6xxxx` | **Miền Nam 1 & Đông Nam Bộ**: Đồng Nai, Bình Thuận, Lâm Đồng, Bà Rịa - Vũng Tàu, Bình Dương, Tây Ninh, Đồng Tháp, Ninh Thuận, Kon Tum. |
| **Khối 7** | `7xxxx` | **Miền Nam 2 & Tây Nam Bộ**: Cần Thơ, Hậu Giang, Long An, Tiền Giang, Trà Vinh, Bến Tre, An Giang, Kiên Giang, Bạc Liêu, Sóc Trăng, Vĩnh Long. |
| **Khối 8** | `8xxxx` | **Khối EVNHCMC & Hạ tầng điện TP.HCM**: Cơ quan EVNHCMC, Công ty TTĐ 4, NMĐ Thủ Đức, các TBA 500kV Cầu Bông, Nhà Bè, Phú Lâm, Long Bình... |
| **Khối 9** | `9xxxx` | **Khối các Tổng công ty trực thuộc EVN**: EVNHANOI (`90xxx`), EVNNPC (`91xxx`), EVNSPC (`92xxx`), EVNCPC (`93xxx`), EVNHCMC (`94xxx`), GENCO 1-2-3 (`95xxx`), EVNNPT/PTC1-2 (`96xxx`), PTC3-4 (`97xxx`), Dự phòng NSMO/EVN (`98xxx - 99xxx`). |
| **Khối 0** | `0xxxx` | **Đầu số dịch vụ đặc biệt**: Push-to-Talk (PTT), Thoại liên tỉnh, Di động, Quốc tế. |

---

## 3. DANH MỤC ĐẦU SỐ / MÃ TỈNH VIỄN THÔNG EVN (SHEET: `dau so` & `Ma vung`)

Bảng quy hoạch mã đầu số viễn thông nội bộ cấp cho 64 Tỉnh / Thành phố trên cả nước:

### 3.1. Khu vực Miền Bắc

| STT | Tỉnh / Thành phố | Mã đầu số PABX | Mã viết tắt | Ghi chú địa bàn |
| :---: | :--- | :---: | :---: | :--- |
| 1 | Hà Nội | `4` | `HNI` | Thủ đô Hà Nội |
| 2 | Hà Tây (cũ) | `4` | `HTY` | Sáp nhập Hà Nội |
| 3 | Hà Giang | `19` | `HGG` | Đông Bắc |
| 4 | Lào Cai | `20` | `LCI` | Tây Bắc |
| 5 | Phú Thọ | `210` | `PTO` | Trung du Bắc Bộ |
| 6 | Vĩnh Phúc | `211` | `VPC` | Đồng bằng sông Hồng |
| 7 | Hòa Bình | `218` | `HBH` | Tây Bắc |
| 8 | Sơn La | `22` | `SLA` | Tây Bắc |
| 9 | Điện Biên | `230` | `DBN` | Tây Bắc |
| 10 | Lai Châu | `231` | `LCU` | Tây Bắc |
| 11 | Bắc Giang | `240` | `BGG` | Đông Bắc |
| 12 | Bắc Ninh | `241` | `BNH` | Đồng bằng sông Hồng |
| 13 | Lạng Sơn | `25` | `LSN` | Đông Bắc |
| 14 | Cao Bằng | `26` | `CBG` | Đông Bắc |
| 15 | Tuyên Quang | `27` | `TQG` | Đông Bắc |
| 16 | Thái Nguyên | `280` | `TNN` | Đông Bắc |
| 17 | Bắc Kạn | `281` | `BKN` | Đông Bắc |
| 18 | Yên Bái | `29` | `YBI` | Tây Bắc |
| 19 | Ninh Bình | `30` | `NBH` | Đồng bằng sông Hồng |
| 20 | Hải Phòng | `31` | `HPG` | Thành phố trực thuộc TƯ |
| 21 | Hải Dương | `320` | `HDG` | Đồng bằng sông Hồng |
| 22 | Hưng Yên | `321` | `HYN` | Đồng bằng sông Hồng |
| 23 | Quảng Ninh | `33` | `QNH` | Vùng Đông Bắc |
| 24 | Nam Định | `350` | `NDH` | Đồng bằng sông Hồng |
| 25 | Hà Nam | `351` | `HNM` | Đồng bằng sông Hồng |
| 26 | Thái Bình | `36` | `TBH` | Đồng bằng sông Hồng |
| 27 | Thanh Hóa | `37` | `THA` | Bắc Trung Bộ |
| 28 | Nghệ An | `38` | `NAN` | Bắc Trung Bộ |
| 29 | Hà Tĩnh | `39` | `HTH` | Bắc Trung Bộ |

### 3.2. Khu vực Miền Trung & Tây Nguyên

| STT | Tỉnh / Thành phố | Mã đầu số PABX | Mã viết tắt | Ghi chú địa bàn |
| :---: | :--- | :---: | :---: | :--- |
| 30 | Đắk Lắk | `500` | `DLK` | Tây Nguyên |
| 31 | Đắk Nông | `501` | `DKN` | Tây Nguyên |
| 32 | Quảng Nam | `510` | `QNM` | Duyên hải Nam Trung Bộ |
| 33 | Đà Nẵng | `511` | `DNG` | Thành phố trực thuộc TƯ |
| 34 | Quảng Bình | `52` | `QBH` | Bắc Trung Bộ |
| 35 | Quảng Trị | `53` | `QTI` | Bắc Trung Bộ |
| 36 | Thừa Thiên Huế | `54` | `HUE` | Bắc Trung Bộ |
| 37 | Quảng Ngãi | `55` | `QNI` | Duyên hải Nam Trung Bộ |
| 38 | Bình Định | `56` | `BDH` | Duyên hải Nam Trung Bộ |
| 39 | Phú Yên | `57` | `PYN` | Duyên hải Nam Trung Bộ |
| 40 | Khánh Hòa | `58` | `KHA` | Duyên hải Nam Trung Bộ |
| 41 | Gia Lai | `59` | `GLI` | Tây Nguyên |
| 42 | Kon Tum | `60` | `KTM` | Tây Nguyên |

### 3.3. Khu vực Miền Nam

| STT | Tỉnh / Thành phố | Mã đầu số PABX | Mã viết tắt | Ghi chú địa bàn |
| :---: | :--- | :---: | :---: | :--- |
| 43 | TP. Hồ Chí Minh | `8` | `HCM` | Trung tâm kinh tế phía Nam |
| 44 | Đồng Nai | `61` | `DNI` | Đông Nam Bộ |
| 45 | Bình Thuận | `62` | `BTN` | Nam Trung Bộ / Đông Nam Bộ |
| 46 | Lâm Đồng | `63` | `LDG` | Tây Nguyên / Đông Nam Bộ |
| 47 | Bà Rịa - Vũng Tàu | `64` | `VTU` | Đông Nam Bộ |
| 48 | Bình Dương | `650` | `BDG` | Đông Nam Bộ |
| 49 | Bình Phước | `651` | `BPC` | Đông Nam Bộ |
| 50 | Tây Ninh | `66` | `TNH` | Đông Nam Bộ |
| 51 | Đồng Tháp | `67` | `DTP` | Đồng bằng sông Cửu Long |
| 52 | Ninh Thuận | `68` | `NTN` | Nam Trung Bộ |
| 53 | Vĩnh Long | `70` | `VLG` | Đồng bằng sông Cửu Long |
| 54 | Cần Thơ | `710` | `CTO` | Thành phố trực thuộc TƯ |
| 55 | Hậu Giang | `711` | `HGG` | Đồng bằng sông Cửu Long |
| 56 | Long An | `72` | `LAN` | Đồng bằng sông Cửu Long |
| 57 | Tiền Giang | `73` | `TGG` | Đồng bằng sông Cửu Long |
| 58 | Trà Vinh | `74` | `TVH` | Đồng bằng sông Cửu Long |
| 59 | Bến Tre | `75` | `BTE` | Đồng bằng sông Cửu Long |
| 60 | An Giang | `76` | `AGG` | Đồng bằng sông Cửu Long |
| 61 | Kiên Giang | `77` | `KGG` | Đồng bằng sông Cửu Long |
| 62 | Cà Mau | `780` | `CMU` | Đồng bằng sông Cửu Long |
| 63 | Bạc Liêu | `781` | `BLU` | Đồng bằng sông Cửu Long |
| 64 | Sóc Trăng | `79` | `STG` | Đồng bằng sông Cửu Long |

---

## 4. CHI TIẾT CẤP PHÁT DẢI SỐ THEO MA TRẬN 5 SỐ (SHEET: `EVNICT&Ban VTCNTT cap`)

### 4.1. Khối 1: Nguồn điện trọng điểm EVN (`1xxxx`)
- **131xx - 136xx**: BQL Nhà máy Thủy điện Ialy (Cột 3, 600 số).
- **138xx - 139xx**: Nhà máy Thủy điện Thác Mơ (Cột 3, 200 số).
- **140xx - 144xx**: Nhà máy Nhiệt điện Uông Bí 1 (Cột 4, 500 số).
- **145xx - 149xx**: Nhà máy Nhiệt điện Uông Bí mở rộng (Cột 4, 500 số).
- **151xx - 154xx**: Nhà máy Nhiệt điện Ninh Bình (Cột 5, 400 số).
- **15600 - 15634**: TBA 500kV Nho Quan (Cột 5, 35 số).
- **161xx - 165xx**: Nhà máy Nhiệt điện Phả Lại 1 (Cột 6, 500 số).
- **166xx - 169xx**: Nhà máy Nhiệt điện Phả Lại 2 (Cột 6, 400 số).
- **171xx - 173xx**: Nhà máy Thủy điện Thác Bà (Cột 7, 300 số).
- **181xx - 182xx**: Công ty Điện lực Hòa Bình (Cột 8, 200 số).
- **183xx - 187xx / 189xx**: Nhà máy Thủy điện Hòa Bình (Cột 8, 600 số).
- **188xx**: Trạm 220kV Xuân Mai (Cột 8, 100 số).

### 4.2. Khối 2: Miền Bắc 1 - Vùng Tây Bắc & Đông Bắc (`2xxxx`)
- **Cột 1 (Vĩnh Phúc)**: 
  - `21000 - 21019`: TBA 500kV Việt Trì (20 số).
  - `21600 - 21619`: TBA 220kV Vĩnh Yên (20 số).
  - `217xx`: Điện lực Vĩnh Phúc (100 số).
- **Cột 2 (Sơn La)**:
  - `22000 - 22049`: TBA 500kV Sơn La (50 số).
  - `22050 - 22099`: TBA 220kV Sơn La (50 số).
  - `22200 - 22249`: TBA 220kV Đông Anh (50 số).
  - `22250 - 22299`: TBA 220kV Tây Hồ (50 số).
  - `224xx`: Nhà máy Thủy điện Sơn La (100 số).
  - `225xx`: Điện lực Sơn La (100 số - dự phòng).
- **Cột 3 (Điện Biên & Lai Châu)**:
  - `23000 - 23049`: NMĐ Nậm Má (50 số).
  - `23250 - 23299`: Thủy điện Bản Chát (50 số).
  - `23300 - 23309`: TBA 220kV Than Uyên (10 số).
  - `23310 - 23399`: NM Thủy điện Lai Châu (90 số).
  - `23400 - 23499`: NM Thủy điện Huội Quảng (100 số).
- **Cột 4 (Bắc Giang & Bắc Ninh)**:
  - `24000 - 24049`: TBA 500kV Hiệp Hòa (50 số).
  - `24050 - 24069`: TBA 220kV Bắc Ninh 2 (20 số).
  - `244xx - 245xx`: TBA 220kV Bắc Giang (200 số).
  - `246xx`: TBA 220kV Bắc Ninh (100 số).
- **Cột 6 (Cao Bằng)**:
  - `26100 - 26119`: TBA 220kV Cao Bằng (20 số).
  - `26120 - 26139`: TBA 220kV Bảo Lâm (20 số).
  - `26700 - 26749`: TBA 220kV Rạch Giá (50 số).
- **Cột 7 (Tuyên Quang)**:
  - `274xx`: Thủy điện Tuyên Quang (100 số).
  - `275xx - 276xx`: Nhà điều hành TĐ Tuyên Quang (200 số).
  - `27800 - 27809`: TBA 220kV Tuyên Quang (10 số).
- **Cột 8 (Thái Nguyên & Bắc Kạn)**:
  - `28400 - 28429`: TBA 220kV Bắc Kạn (30 số).
- **Cột 0 (Lào Cai)**:
  - `20100 - 20109`: TBA 220kV Bảo Thắng, Lào Cai (10 số).

### 4.3. Khối 3: Miền Bắc 2 - Đồng Bằng Sông Hồng & Bắc Trung Bộ (`3xxxx`)
- **Cột 1 (Hải Phòng)**:
  - `315xx`: Trạm 220kV Tràng Bạch / Đồng Hòa (100 số).
  - `316xx`: Trạm 220kV Vật Cách (100 số).
  - `31700 - 31749`: Nhà máy Nhiệt điện Hải Phòng (50 số).
- **Cột 2 (Hải Dương & Hưng Yên)**:
  - `324xx`: Trạm 220kV Phố Nối (100 số).
  - `32500 - 32549`: TBA 220kV Hải Dương 1 (50 số).
  - `32550 - 32559`: TBA 220kV Hải Dương 2 (10 số).
  - `32560 - 32569`: TBA 220kV Kim Động (10 số).
  - `32570 - 32599`: TBA 500kV Phố Nối (30 số).
- **Cột 3 (Quảng Ninh)**:
  - `335xx`: Trạm 220kV Quảng Ninh (100 số).
  - `336xx - 337xx`: NM Nhiệt điện Mông Dương 1 (200 số).
  - `338xx`: TBA 500kV Quảng Ninh (100 số).
  - `33900 - 33949`: NM Nhiệt điện Mạo Khê (50 số).
- **Cột 4 (Hà Tây cũ & Hà Nam)**:
  - `343xx`: Trạm 220kV Ba La (100 số).
  - `34400 - 34434`: TBA 220kV Thường Tín (35 số).
  - `34500 - 34539`: NMĐ Bản Cốc (40 số).
  - `34540 - 34599`: Trạm 110kV Truông Bành (60 số).
- **Cột 5 (Nam Định & Ninh Bình)**:
  - `353xx`: TBA 220kV Trực Ninh (100 số).
  - `354xx`: Công ty Điện lực Hà Nam (100 số).
  - `35500 - 35549`: TBA 220kV Phủ Lý (50 số).
- **Cột 6 (Thái Bình)**:
  - `364xx`: Trạm 220kV Thái Bình (100 số).
- **Cột 7 (Thanh Hóa)**:
  - `374xx`: Trạm 220kV Ba Chè (100 số).
  - `37500 - 37509`: TBA 220kV Bỉm Sơn (10 số).
  - `37510 - 37539`: Công ty Thủy điện Trung Sơn (30 số).
  - `37540 - 37559`: NM Thủy điện Trung Sơn (20 số).
  - `37600 - 37649`: Ban Quản lý Dự án Nhiệt điện 2 & NMĐ Nghi Sơn (50 số).
- **Cột 8 (Nghệ An)**:
  - `384xx`: Trạm 220kV Hưng Đông (100 số).
  - `38500 - 38529`: TBA 220kV Đô Lương (30 số).
  - `38600 - 38649`: Công ty Thủy điện Bản Vẽ (50 số).
  - `38650 - 38699`: Ban Quản lý Thủy điện 2 (50 số).
- **Cột 0 (Lào Cai / Ninh Bình)**:
  - `30400 - 30449`: TBA 220kV Lào Cai (50 số).

### 4.4. Khối 4: Cơ Quan Tập Đoàn EVN, Điều Độ & Đầu Mối Liên Lạc (`4xxxx`)
- **400xx - 409xx**: Cơ quan Tập đoàn EVN - Cửa Bắc Tháp B (Tổng đài MX1, 1.000 số).
- **410xx - 419xx**: EVNICT, Tư vấn 2, Tư vấn 3, Điều độ A2.
- **420xx - 422xx**: Trung tâm Điều độ HTĐ Miền Nam (A2) (300 số).
- **431xx - 433xx**: Trung tâm Điều độ HTĐ Miền Trung (A3).
- **440xx - 449xx**: Công ty Truyền tải điện 1 (TTĐ1) & Các đơn vị dịch vụ sửa chữa.
- **450xx - 451xx**: TBA 500kV Hòa Bình (200 số).
- **452xx - 453xx**: TBA 500kV Hà Tĩnh (200 số).
- **454xx - 455xx**: TBA 500kV Đà Nẵng (200 số).
- **456xx - 457xx**: TBA 500kV Pleiku (200 số).
- **458xx - 459xx**: TBA 500kV Phú Lâm (Trạm #1) (200 số).
- **460xx - 469xx**: Cơ quan Tập đoàn EVN - Cửa Bắc Tháp A (Tổng đài MX1, 1.000 số).
- **47010 - 47059**: Khách sạn Điện lực Hà Nội (50 số).
- **480xx - 489xx**: Khối cơ quan Flexicom Hà Nội & Ban Quản lý Dự án Điện lực.
- **490xx**: TBA 220kV Sóc Sơn (100 số).
- **49100 - 49119**: Trạm 220kV Chèm (20 số).
- **49200 - 49209**: TBA 220kV Thành Công (10 số).
- **49210 - 49219**: TBA 220kV Sơn Tây (10 số).
- **49220 - 49239**: TBA 220kV Đông Anh (20 số).
- **493xx**: Trạm 220kV Mai Động (100 số).
- **498xx - 499xx**: Công ty Mua bán điện (EPTC) (200 số).

### 4.5. Khối 5: Miền Trung & Tây Nguyên (`5xxxx`)
- **Cột 1 (Đà Nẵng)**:
  - `51000 - 51049`: TBA 500kV Thạnh Mỹ (50 số).
  - `51050 - 51099`: TBA 220kV Thạnh Mỹ (50 số).
  - `511xx`: Ban Quản lý Dự án Điện miền Trung (100 số).
  - `512xx`: Tổng công ty Điện lực miền Trung (EVNCPC - Điện lực 3) (100 số).
  - `517xx - 518xx`: Trung tâm Điều hành SCADA RLDC3 (200 số).
- **Cột 2 (Quảng Bình & Quảng Nam)**:
  - `52000 - 52019`: Nhà điều hành Thủy điện Sông Bung 4 (20 số).
  - `52020 - 52069`: Thủy điện A Vương (50 số).
  - `52070 - 52079`: TBA 220kV Ba Đồn (10 số).
  - `52100 - 52119`: Ban QLDA Sông Bung 4 (20 số).
  - `52120 - 52159`: Công ty Thủy điện Sông Tranh (40 số).
  - `52160 - 52199`: Ban Quản lý Thủy điện 3 (40 số).
- **Cột 4 (Huế)**:
  - `54000 - 54019`: Nhà máy Thủy điện Sông Bung 2 (20 số).
  - `54700 - 54749`: Nhà máy Thủy điện A Lưới (50 số).
- **Cột 7 (Bình Định)**:
  - `571xx - 572xx`: Công ty Điện lực Bình Định (200 số).
  - `577xx`: Nhà máy Thủy điện Vĩnh Sơn (100 số).
  - `578xx`: Trạm 220kV Quy Nhơn (100 số).
  - `57950 - 57999`: Nhà máy Thủy điện An Khê (50 số).
- **Cột 8 (Phú Yên)**:
  - `58000 - 58049`: NM Thủy điện Sông Ba Hạ (50 số).
  - `58050 - 58099`: Công ty CP Thủy điện Sông Ba Hạ (50 số).
  - `589xx`: TBA 220kV Tuy Hòa (100 số).
- **Cột 9 (Khánh Hòa)**:
  - `597xx`: SCADA Nha Trang (100 số).
  - `59830 - 59859`: Trạm Ninh Hòa (30 số).
  - `59900 - 59949`: Công ty Tư vấn Điện 4 (PECC4) (50 số).
- **Cột 0 (Đắk Lắk & Đắk Nông)**:
  - `500xx`: Công ty Truyền tải điện Đắk Lắk (100 số).
  - `50100 - 50149`: Điện lực Đắk Nông (50 số).
  - `50150 - 50199`: TBA 500kV Đắk Nông (50 số).
  - `502xx`: Ban Quản lý Dự án Thủy điện 5 (100 số).
  - `50800 - 50849`: NM Thủy điện Đồng Nai 3 (50 số).
  - `509xx`: NM Thủy điện Đồng Nai 4 (100 số).

### 4.6. Khối 6: Miền Nam 1 & Đông Nam Bộ (`6xxxx`)
- **Cột 1 (Đồng Nai)**:
  - `611xx - 615xx`: Nhà máy Thủy điện Trị An (500 số).
  - `616xx`: Hệ thống SCADA A2 Trị An (100 số).
  - `617xx - 618xx`: Khu vực Long Thành (200 số).
  - `61900 - 61929`: TBA 500kV Sông Mây (30 số).
  - `61930 - 61949`: TBA 220kV TP. Nhơn Trạch (20 số).
- **Cột 2 (Bình Thuận)**:
  - `621xx`: Dự phòng Nhà máy điện Đại Ninh (100 số).
  - `622xx`: Công ty Thủy điện Đại Ninh & NMĐ Đại Ninh (100 số).
  - `62600 - 62649`: TBA 500kV Vĩnh Tân (50 số).
  - `62650 - 62699`: NM Nhiệt điện Vĩnh Tân 2 (50 số).
  - `627xx`: NM Nhiệt điện Vĩnh Tân 2 (cũ: NM Bắc Bình) (100 số).
  - `62800 - 62849`: NM Nhiệt điện Vĩnh Tân 2 (50 số).
  - `62850 - 62899`: NM Nhiệt điện Vĩnh Tân 4 (50 số).
- **Cột 3 (Lâm Đồng)**:
  - `63000 - 63049`: NM Thủy điện Đồng Nai 4 (50 số).
  - `63050 - 63099`: Công ty Thủy điện Đồng Nai (50 số).
  - `634xx`: TBA 500kV Di Linh (100 số).
  - `635xx`: NM Thủy điện Hàm Thuận (100 số).
  - `636xx`: Công ty CP Thủy điện Đa Nhim - Hàm Thuận - Đa Mi (ĐHĐ) (100 số).
  - `637xx`: NM Thủy điện Đa Mi (100 số).
  - `63800 - 63819`: Trạm 110kV Bảo Lộc mới (20 số).
  - `63860 - 63899`: Văn phòng NMĐ ĐHĐ (40 số).
  - `63900 - 63919`: Trạm 110kV Bảo Lộc cũ (20 số).
- **Cột 4 (Bà Rịa - Vũng Tàu)**:
  - `64100 - 64119`: Khu vực Long Thành - TBA 108 (20 số).
  - `64300 - 64349`: TBA 500kV Phú Mỹ (50 số).
  - `64350 - 64359`: TBA 220kV KCN Phú Mỹ 2 (Tân Thành) (10 số).
  - `64360 - 64379`: TBA 220kV Mỹ Xuân (20 số).
  - `64380 - 64399`: TBA 220kV Vũng Tàu (20 số).
  - `644xx`: NM Nhiệt điện Phú Mỹ (100 số).
  - `645xx - 646xx`: NM Nhiệt điện Bà Rịa (200 số).
  - `64900 - 64999`: NM Nhiệt điện Bà Rịa (100 số).
- **Cột 5 (Bình Dương)**:
  - `65400 - 65419`: TBA 220kV Bình Hòa (20 số).
  - `65460 - 65499`: TBA 500kV Tân Định (40 số).
  - `65500 - 65549`: TBA 220kV Uyên Hưng (50 số).
  - `65700 - 65719`: TBA 220kV Thuận An (20 số).
- **Cột 6 (Tây Ninh)**:
  - `66400 - 66449`: TBA 220kV Tràng Bàng (50 số).
  - `66450 - 66479`: TBA 220kV Tây Ninh (30 số).
- **Cột 8 (Ninh Thuận)**:
  - `682xx - 683xx`: NM Thủy điện Đa Nhim (200 số).
  - `68400 - 68409`: TBA 220kV Tháp Chàm (10 số).
  - `68500 - 68549`: Ban Quản lý Dự án Điện hạt nhân Ninh Thuận (50 số).
- **Cột 0 (Kon Tum & Thủy điện Gia Lai)**:
  - `60410 - 60429`: Trạm 110kV Kon Tum (20 số).
  - `605xx - 606xx`: Thủy điện Sê San 3 (200 số).
  - `607xx`: Thủy điện Pleikrông (100 số).
  - `60800 - 60849`: NM Thủy điện Sê San 4 (50 số).
  - `60850 - 60899`: Thủy điện Sê San 3A (50 số).
  - `60900 - 60929`: TBA 220kV Kon Tum (30 số).

### 4.7. Khối 7: Miền Nam 2 & Tây Nam Bộ (`7xxxx`)
- **Cột 1 (Cần Thơ & Hậu Giang)**:
  - `71100 - 71249`: Văn phòng Tổng công ty Phát điện 2 (GENCO2) (150 số).
  - `71500 - 71549`: NM Nhiệt điện Cần Thơ (50 số).
  - `717xx - 718xx`: NM Nhiệt điện Ô Môn (200 số).
  - `719xx`: TBA 220kV Thốt Nốt (100 số).
- **Cột 2 (Long An)**:
  - `724xx`: TBA 220kV Long An (100 số).
  - `72500 - 72529`: TBA 220kV Đức Hòa (30 số).
- **Cột 3 (Tiền Giang)**:
  - `73700 - 73719`: TBA 500kV Mỹ Tho (20 số).
- **Cột 4 (Trà Vinh)**:
  - `741xx - 743xx`: Công ty Điện lực Trà Vinh (300 số).
  - `74400 - 74409`: TBA 220kV Trà Vinh (10 số).
  - `74410 - 74429`: TBA 500kV Duyên Hải (20 số).
  - `74500 - 74699`: NM Nhiệt điện Duyên Hải 1 (200 số).
  - `74700 - 74899`: NM Nhiệt điện Duyên Hải 3 (200 số).
- **Cột 5 (Bến Tre)**:
  - `75400 - 75419`: TBA 220kV Bến Tre (20 số).
  - `75420 - 75439`: TBA 220kV Mỏ Cày (20 số).
- **Cột 6 (An Giang)**:
  - `764xx`: TBA 220kV Châu Đốc (100 số).
- **Cột 7 (Kiên Giang)**:
  - `774xx`: TBA 220kV Rạch Giá (100 số).
  - `77700 - 77719`: TBA 220kV Kiên Lương (20 số).
- **Cột 8 (Bạc Liêu)**:
  - `78100 - 78139`: TBA 220/110kV Bạc Liêu (40 số).
- **Cột 9 (Sóc Trăng)**:
  - `79400 - 79449`: TBA 220kV Sóc Trăng (50 số).
- **Cột 0 (Vĩnh Long)**:
  - `70400 - 70449`: TBA 220kV Vĩnh Long (50 số).

### 4.8. Khối 8: EVNHCMC & Hệ Thống Điện TP. Hồ Chí Minh (`8xxxx`)
- **81xxx - 82xxx**: Tổng công ty Điện lực TP.HCM (EVNHCMC) (2.000 số).
- **831xx - 833xx**: Công ty Truyền tải điện 4 (TTĐ4) (300 số).
- **83400 - 83439`: TBA 500kV Cầu Bông (40 số).
- **83500 - 83549`: Ban Quản lý Dự án Thủy điện 6 (50 số).
- **83550 - 83599`: Ban Quản lý Dự án Nhiệt điện 3 (50 số).
- **836xx - 839xx**: Nhà máy Nhiệt điện Thủ Đức (400 số).
- **84xxx**: Tổng công ty Điện lực TP.HCM (EVNHCMC).
- **85xxx**: Tổng công ty Điện lực TP.HCM (EVNHCMC).
- **86xxx**: Tổng công ty Điện lực TP.HCM (EVNHCMC).
- **871xx**: Trạm 220kV Cát Lái (100 số).
- **872xx**: Trạm 220kV Nhà Bè (100 số).
- **873xx**: Trạm 220kV Phú Lâm (100 số).
- **874xx**: Trạm 220kV Long Bình (100 số).
- **87500 - 87549`: TBA 500kV Phú Mỹ (50 số).
- **87550 - 87599`: TBA 500kV Nhà Bè (50 số).
- **87600 - 87649`: TBA 220kV Nam Sài Gòn (50 số).
- **88xxx**: Tổng công ty Điện lực TP.HCM (EVNHCMC) (1.000 số).
- **89900 - 89999`: TBA 500kV Phú Lâm #2 (100 số).

### 4.9. Khối 9: Các Tổng Công Ty Điện Lực, Phát Điện & Truyền Tải Điện (`9xxxx`)
- **90xxx**: Tổng công ty Điện lực TP. Hà Nội (**EVNHANOI**) & Công ty Viễn thông Điện lực CNTT (**EVNICT**).
- **91xxx**: Tổng công ty Điện lực miền Bắc (**EVNNPC**).
- **92xxx**: Tổng công ty Điện lực miền Nam (**EVNSPC**).
- **93xxx**: Tổng công ty Điện lực miền Trung (**EVNCPC**).
- **94xxx**: Tổng công ty Điện lực TP. Hồ Chí Minh (**EVNHCMC**).
- **95xxx**: Khối các Tổng công ty Phát điện (**EVNGENCO**):
  - `950xx - 952xx`: Tổng công ty Phát điện 1 (**EVNGENCO 1**).
  - `953xx - 955xx`: Tổng công ty Phát điện 2 (**EVNGENCO 2**).
  - `956xx - 958xx`: Tổng công ty Phát điện 3 (**EVNGENCO 3**).
  - `959xx`: Dự phòng GENCO.
- **96xxx**: Tổng công ty Truyền tải điện Quốc gia (**EVNNPT**) & Công ty Truyền tải điện 1, 2:
  - `960xx - 967xx`: Cơ quan EVNNPT và Công ty Truyền tải điện 1 (**PTC1**).
  - `968xx - 969xx`: Công ty Truyền tải điện 2 (**PTC2**).
- **97xxx**: Công ty Truyền tải điện 3 & 4:
  - `970xx - 972xx`: Công ty Truyền tải điện 3 (**PTC3**).
  - `973xx - 979xx`: Công ty Truyền tải điện 4 (**PTC4**).
- **98xxx - 99xxx**: Dải số dự phòng dùng riêng cho Trung tâm Điều độ HTĐ Quốc gia (**NSMO**), Cơ quan Tập đoàn EVN và Hệ thống phân tán.

---

## 5. DANH MỤC DẢI SỐ CÁC TRẠM BIẾN ÁP 500KV TOÀN QUỐC (SHEET: `500`)

Toàn bộ 25 Trạm biến áp 500kV truyền tải huyết mạch thuộc lưới điện quốc gia được cấp dải số như sau:

| STT | Tên Trạm Biến Áp 500kV | Cấp Điện Áp | Miền | Dải Số Bắt Đầu | Dải Số Kết Thúc | Tổng Số Máy |
| :---: | :--- | :---: | :---: | :---: | :---: | :---: |
| 1 | **T500 HÒA BÌNH** | 500kV | Bắc | `450xx` | `451xx` | 200 |
| 2 | **T500 HÀ TĨNH** | 500kV | Bắc | `452xx` | `453xx` | 200 |
| 3 | **T500 NHO QUAN** | 500kV | Bắc | `156xx` | `156xx` | 100 |
| 4 | **T500 THƯỜNG TÍN** | 500kV | Bắc | `411xx` | `411xx` | 100 |
| 5 | **T500 QUẢNG NINH** | 500kV | Bắc | `338xx` | `338xx` | 100 |
| 6 | **T500 SƠN LA** | 500kV | Bắc | `2200x` | `2204x` | 50 |
| 7 | **T500 HIỆP HOÀ** | 500kV | Bắc | `2400x` | `2404x` | 50 |
| 8 | **T500 PHỐ NỐI** | 500kV | Bắc | `32570` | `32599` | 30 |
| 9 | **T500 ĐÀ NẴNG** | 500kV | Trung | `5900x` | `5904x` | 50 |
| 10 | **T500 DỐC SỎI** | 500kV | Trung | `412xx` | `412xx` | 100 |
| 11 | **T500 PLEIKU** | 500kV | Trung | `456xx` | `457xx` | 200 |
| 12 | **T500 IALY** | 500kV | Trung | `413xx` | `413xx` | 100 |
| 13 | **T500 ĐẮK NÔNG** | 500kV | Trung | `5015x` | `5019x` | 50 |
| 14 | **T500 THẠNH MỸ** | 500kV | Trung | `5105x` | `5109x` | 50 |
| 15 | **T500 DI LINH** | 500kV | Nam | `634xx` | `634xx` | 100 |
| 16 | **T500 TÂN ĐỊNH** | 500kV | Nam | `6546x` | `6549x` | 40 |
| 17 | **T500 SÔNG MÂY** | 500kV | Nam | `61900` | `61929` | 30 |
| 18 | **T500 VĨNH TÂN** | 500kV | Nam | `62600` | `62649` | 50 |
| 19 | **T500 CẦU BÔNG** | 500kV | Nam | `8340x` | `8343x` | 40 |
| 20 | **T500 MỸ THO** | 500kV | Nam | `73700` | `73719` | 20 |
| 21 | **T500 PHÚ LÂM #1** | 500kV | Nam | `458xx` | `459xx` | 200 |
| 22 | **T500 PHÚ LÂM #2** | 500kV | Nam | `89900` | `89923` | 24 |
| 23 | **T500 PHÚ MỸ** | 500kV | Nam | `8750x` | `8754x` | 50 |
| 24 | **T500 NHÀ BÈ** | 500kV | Nam | `8755x` | `8759x` | 50 |
| 25 | **T500 Ô MÔN** | 500kV | Nam | `414xx` | `414xx` | 100 |
| 26 | **T500 DUYÊN HẢI** | 500kV | Nam | `74410` | `74429` | 20 |

---

## 6. DANH MỤC DẢI SỐ CÁC TRẠM BIẾN ÁP 220KV TIÊU BIỂU (SHEET: `220`)

Trích lục các trạm 220kV trọng điểm:

| STT | Tên Trạm 220kV | Cấp Điện Áp | Miền | Dải Số Cấp | Tổng Số Máy |
| :---: | :--- | :---: | :---: | :---: | :---: |
| 1 | **HÀ ĐÔNG 220KV** | 220kV | Bắc | `343xx` | 100 |
| 2 | **CHÈM 220KV** | 220kV | Bắc | `491xx` | 100 |
| 3 | **HƯNG ĐÔNG 220KV** | 220kV | Bắc | `384xx` | 100 |
| 4 | **BA CHÈ 220KV** | 220kV | Bắc | `374xx` | 100 |
| 5 | **NINH BÌNH 220KV** | 220kV | Bắc | `2810x - 2814x` | 50 |
| 6 | **THÁI NGUYÊN 220KV** | 220kV | Bắc | `2815x - 2819x` | 50 |
| 7 | **HOÀNH BỒ 220KV** | 220kV | Bắc | `2820x - 2824x` | 50 |
| 8 | **THÁI BÌNH 220KV** | 220kV | Bắc | `364xx` | 100 |
| 9 | **NGHI SƠN 220KV** | 220kV | Bắc | `2825x - 2829x` | 50 |
| 10 | **VIỆT TRÌ 220KV** | 220kV | Bắc | `2830x - 2834x` | 50 |
| 11 | **NAM ĐỊNH 220KV** | 220kV | Bắc | `2835x - 2839x` | 50 |
| 12 | **MAI ĐỘNG 220KV** | 220kV | Bắc | `493xx` | 100 |
| 13 | **PHỐ NỐI 220KV** | 220kV | Bắc | `2840x - 2844x` | 50 |
| 14 | **TRÀNG BẠCH 220KV** | 220kV | Bắc | `315xx` | 100 |
| 15 | **BẮC GIANG 220KV** | 220kV | Bắc | `244xx - 245xx` | 200 |
| 16 | **VẬT CÁCH 220KV** | 220kV | Bắc | `316xx` | 100 |
| 17 | **ĐỒNG HOÀ 220KV** | 220kV | Bắc | `317xx` | 100 |
| 18 | **SÓC SƠN 220KV** | 220kV | Bắc | `490xx` | 100 |
| 19 | **XUÂN MAI 220KV** | 220kV | Bắc | `188xx` | 100 |
| 20 | **BẮC NINH 220KV** | 220kV | Bắc | `246xx` | 100 |
| 21 | **YÊN BÁI 220KV** | 220kV | Bắc | `294xx` | 100 |
| 22 | **ĐÌNH VŨ 220KV** | 220kV | Bắc | `2845x - 2849x` | 50 |
| 23 | **VĨNH YÊN 220KV** | 220kV | Bắc | `2160x - 2161x` | 20 |
| 24 | **LÀO CAI 220KV** | 220kV | Bắc | `3040x - 3044x` | 50 |
| 25 | **HÀ GIANG 220KV** | 220kV | Bắc | `2040x - 2044x` | 50 |
| 26 | **HẢI DƯƠNG 220KV** | 220kV | Bắc | `3250x - 3254x` | 50 |
| 27 | **PHỦ LÝ 220KV** | 220kV | Bắc | `3550x - 3554x` | 50 |
| 28 | **CAO BẰNG 220KV** | 220kV | Bắc | `2865x - 2869x` | 50 |
| 29 | **VÂN TRÌ 220KV** | 220kV | Bắc | `2870x - 2874x` | 50 |
| 30 | **ĐỒNG HỚI 220KV** | 220kV | Trung | `2880x - 2884x` | 50 |
| 31 | **ĐÔNG HÀ 220KV** | 220kV | Trung | `2885x - 2889x` | 50 |
| 32 | **HUẾ 220KV** | 220kV | Trung | `2890x - 2894x` | 50 |
| 33 | **HÒA KHÁNH 220KV** | 220kV | Trung | `2895x - 2899x` | 50 |
| 34 | **QUY NHƠN 220KV** | 220kV | Trung | `2900x - 2904x` | 50 |
| 35 | **NHA TRANG 220KV** | 220kV | Trung | `2905x - 2909x` | 50 |
| 36 | **KRÔNG BUK 220KV** | 220kV | Trung | `2600x - 2604x` | 50 |
| 37 | **DUNG QUẤT 220KV** | 220kV | Trung | `2605x - 2609x` | 50 |
| 38 | **TRÀ VINH 220KV** | 220kV | Nam | `2800x - 2804x` | 50 |
| 39 | **VĨNH LONG 2 220KV** | 220kV | Nam | `2805x - 2809x` | 50 |
| 40 | **BÌNH LONG 220KV** | 220kV | Nam | `2350x - 2354x` | 50 |
| 41 | **CÀ MAU 220KV** | 220kV | Nam | `2355x - 2359x` | 50 |
| 42 | **BẠC LIÊU 220KV** | 220kV | Nam | `2650x - 2654x` | 50 |
| 43 | **BẢO LỘC 220KV** | 220kV | Nam | `2655x - 2659x` | 50 |
| 44 | **BÀ RỊA 220KV** | 220kV | Nam | `2660x - 2664x` | 50 |
| 45 | **NHƠN TRẠCH 220KV** | 220kV | Nam | `2670x - 2674x` | 50 |
| 46 | **PHÚ LÂM 220KV** | 220kV | Nam | `2675x - 2679x` | 50 |
| 47 | **RẠCH GIÁ 220KV** | 220kV | Nam | `2680x - 2684x` | 50 |
| 48 | **SÔNG PHA 220KV** | 220kV | Nam | `2685x - 2689x` | 50 |
| 49 | **TAO ĐÀN 220KV** | 220kV | Nam | `2690x - 2694x` | 50 |
| 50 | **TRÀ NÓC 220KV** | 220kV | Nam | `2695x - 2699x` | 50 |
| 51 | **CAI LẬY 220KV** | 220kV | Nam | `2910x - 2914x` | 50 |
| 52 | **CAO LÃNH 220KV** | 220kV | Nam | `2915x - 2919x` | 50 |
| 53 | **CÁT LÁI 220KV** | 220kV | Nam | `2920x - 2924x` | 50 |
| 54 | **CHÂU ĐỐC 220KV** | 220kV | Nam | `2925x - 2929x` | 50 |
| 55 | **HÓC MÔN 220KV** | 220kV | Nam | `2930x - 2934x` | 50 |
| 56 | **LONG BÌNH 220KV** | 220kV | Nam | `2935x - 2939x` | 50 |
| 57 | **LONG THÀNH 220KV** | 220kV | Nam | `2940x - 2944x` | 50 |
| 58 | **MỸ PHƯỚC 220KV** | 220kV | Nam | `2945x - 2949x` | 50 |
| 59 | **MỸ THO 220KV** | 220kV | Nam | `2950x - 2954x` | 50 |
| 60 | **NHÀ BÈ 220KV** | 220kV | Nam | `2955x - 2959x` | 50 |

---

## 7. DANH MỤC DẢI SỐ CÁC NHÀ MÁY ĐIỆN TRỌNG ĐIỂM (SHEET: `NMD`)

| STT | Tên Nhà Máy Điện | Công Suất / Phân Loại | Miền | Dải Số Cấp Phát | Tổng Số Thuê Bao |
| :---: | :--- | :---: | :---: | :---: | :---: |
| 1 | **TĐ Hòa Bình** | $8 \times 240\text{ MW}$ (EVN) | Bắc | `189xx` | 100 |
| 2 | **NĐ Phả Lại 1** | $4 \times 110\text{ MW}$ | Bắc | `161xx - 165xx` | 500 |
| 3 | **NĐ Phả Lại 2** | $2 \times 300\text{ MW}$ | Bắc | `166xx - 169xx` | 400 |
| 4 | **NĐ Uông Bí 1 & 2** | $2 \times 55\text{ MW} + 300\text{ MW}$ (EVN) | Bắc | `140xx - 149xx` | 1.000 |
| 5 | **TĐ Thác Bà** | $3 \times 30\text{ MW}$ | Bắc | `170xx - 179xx` | 1.000 |
| 6 | **NĐ Ninh Bình** | $4 \times 25\text{ MW}$ | Bắc | `151xx - 154xx` | 400 |
| 7 | **NĐ than Sơn Động** | $2 \times 110\text{ MW}$ | Bắc | `910xx - 911xx` | 200 |
| 8 | **TĐ Cửa Đạt** | $2 \times 48.5\text{ MW}$ | Bắc | `920xx` | 100 |
| 9 | **NĐ Hải Phòng** | $2 \times 125 + 50\text{ MW}$ | Bắc | `318xx - 319xx` | 200 |
| 10 | **NĐ Quảng Ninh** | $2 \times 300\text{ MW}$ | Bắc | `337xx` | 100 |
| 11 | **TĐ Tuyên Quang** | $3 \times 114\text{ MW}$ (EVN) | Bắc | `274xx - 279xx` | 600 |
| 12 | **TĐ Sơn La** | $6 \times 400\text{ MW}$ (EVN) | Bắc | `224xx` | 100 |
| 13 | **TĐ Huội Quảng** | $2 \times 260\text{ MW}$ (EVN) | Bắc | `234xx` | 100 |
| 14 | **TĐ Bản Chát** | $2 \times 110\text{ MW}$ (EVN) | Bắc | `2325x - 2329x` | 50 |
| 15 | **TĐ Lai Châu** | $3 \times 400\text{ MW}$ (EVN) | Bắc | `2331x - 2339x` | 90 |
| 16 | **NĐ Mông Dương 1** | $2 \times 540\text{ MW}$ (EVN) | Bắc | `336xx` | 100 |
| 17 | **NĐ Mạo Khê** | $2 \times 220\text{ MW}$ | Bắc | `3390x - 3394x` | 50 |
| 18 | **TĐ Ialy** | $4 \times 180\text{ MW}$ (EVN) | Trung | `131xx - 136xx` | 600 |
| 19 | **TĐ Sê San 3 & 3A** | $260\text{ MW} + 108\text{ MW}$ | Trung | `605xx, 6085x - 6089x` | 250 |
| 20 | **TĐ Sê San 4** | $3 \times 120\text{ MW}$ | Trung | `6080x - 6084x` | 50 |
| 21 | **TĐ Pleikrông** | $2 \times 50\text{ MW}$ | Trung | `607xx` | 100 |
| 22 | **TĐ A Vương** | $2 \times 105\text{ MW}$ | Trung | `5202x - 5206x` | 50 |
| 23 | **TĐ Sông Bung 2 & 4** | $100\text{ MW} + 156\text{ MW}$ | Trung | `5400x, 5200x` | 40 |
| 24 | **TĐ Sông Ba Hạ** | $2 \times 110\text{ MW}$ | Trung | `5800x - 5809x` | 100 |
| 25 | **TĐ Bản Vẽ** | $2 \times 160\text{ MW}$ | Trung | `3860x - 3864x` | 50 |
| 26 | **TĐ Trị An** | $4 \times 100\text{ MW}$ (EVN) | Nam | `611xx - 615xx` | 500 |
| 27 | **TĐ Thác Mơ** | $2 \times 75\text{ MW}$ | Nam | `138xx - 139xx` | 200 |
| 28 | **NĐ Phú Mỹ** | Cụm Phú Mỹ $1, 2, 4$ | Nam | `644xx` | 100 |
| 29 | **NĐ Bà Rịa** | Tuabin khí hỗn hợp | Nam | `645xx - 646xx, 649xx` | 300 |
| 30 | **TĐ Đa Nhim** | $4 \times 40\text{ MW}$ | Nam | `682xx - 683xx` | 200 |
| 31 | **TĐ Hàm Thuận** | $2 \times 150\text{ MW}$ | Nam | `635xx` | 100 |
| 32 | **TĐ Đa Mi** | $2 \times 87.5\text{ MW}$ | Nam | `637xx` | 100 |
| 33 | **TĐ Đại Ninh** | $2 \times 150\text{ MW}$ | Nam | `622xx` | 100 |
| 34 | **NĐ Vĩnh Tân 2 & 4** | $2 \times 622\text{ MW} + 1200\text{ MW}$ | Nam | `6265x - 6269x, 628xx` | 200 |
| 35 | **NĐ Ô Môn** | $2 \times 330\text{ MW}$ | Nam | `717xx - 718xx` | 200 |
| 36 | **NĐ Cần Thơ** | Nhiệt điện dầu / khí | Nam | `7150x - 7154x` | 50 |
| 37 | **NĐ Duyên Hải 1 & 3** | $2 \times 622\text{ MW} + 2 \times 622\text{ MW}$ | Nam | `745xx - 748xx` | 400 |

---

## 8. BẢNG PHÂN BỔ & ĐỊNH TUYẾN DẢI SỐ VẬN HÀNH MIỀN NAM (VHMN) (SHEET: `DAU SO VHMN`)

Mạng thông tin vận hành hệ thống điện Miền Nam kết nối qua các nút chuyển mạch chính:

### 8.1. Đầu số đấu nối trực tiếp vào các tổng đài nút
- **Tổng đài Phú Lâm #1 (Nút 10010)**:
  - Thuê bao nội bộ Phú Lâm #1: `458xx - 459xx` (200 số).
  - Kết nối NMĐ Bà Rịa: `645xx - 646xx, 64900 - 64999` (300 số qua 30T/E1).
  - Kết nối TBA 500kV Sông Mây: `61900 - 61929` (30 số qua 4W E&M).
  - Kết nối TBA 220kV Uyên Hưng: `65500 - 65549` (50 số qua 4W E&M).
  - Kết nối TBA 500kV Tân Định: `65460 - 65499` (40 số qua 4W E&M).
  - Kết nối VP GENCO2: `71100 - 71249` (130 số qua PRI2DT).
  - Kết nối TBA 220kV Long An: `72400 - 72499` (100 số qua 4W E&M).
  - Kết nối NMĐ Hàm Thuận: `63500 - 63599` (100 số qua 30T).
  - Kết nối VP Cty ĐHĐ: `63600 - 63699, 6386x - 6389x, 6393x - 6398x` (200 số qua E1).
  - Kết nối NMĐ Đa Mi: `63700 - 63799` (100 số qua E1).
  - Kết nối NMĐ Đa Nhim: `682xx - 683xx` (200 số qua E1).
  - Kết nối Nút Pleiku (10001): `456xx - 457xx` (200 số qua PRI30).
  - Kết nối Phú Lâm #2 (10004): `89900 - 89999` (100 số qua PRI30).
- **Tổng đài Phú Lâm #2 (Nút 10004)**:
  - Thuê bao nội bộ Phú Lâm #2: `89900 - 89999` (100 số).
  - Kết nối TBA 220kV Tây Ninh: `66450 - 66479` (30 số).
  - Kết nối Công ty TTĐ4: `831xx - 833xx` (300 số qua PRI2DT).
  - Kết nối NMĐ Đại Ninh: `62200 - 62299` (100 số).
  - Kết nối NMĐ Thác Mơ: `138xx - 139xx` (200 số qua PRI2DT).
  - Kết nối NMĐ Phú Mỹ: `644xx` (100 số).
  - Kết nối TBA 500kV Cầu Bông: `83400 - 83439` (40 số).
  - Kết nối TBA 220kV Đức Hòa: `72500 - 72529` (30 số).
- **Tổng đài Trung tâm Điều độ HTĐ Miền Nam - A2 (Nút 10000)**:
  - Thuê bao tại A2: `420xx - 422xx` (300 số).
  - Kết nối EVNSPC: `92xxx` (1.000 số qua PRI).
  - Kết nối EVNHCMC: `81xxx, 82xxx, 88xxx` (3.000 số).
  - Kết nối Cửa Bắc (EVN): `46xxx` (1.000 số).
  - Kết nối Điều độ Miền Trung (A3 - Đà Nẵng): `454xx - 455xx` (200 số).
  - Kết nối NMĐ Thủ Đức: `836xx - 839xx` (400 số qua 4W E&M).
  - Kết nối TBA 500kV Mỹ Tho: `73700 - 73719` (20 số).
  - Kết nối NMĐ Duyên Hải 3: `747xx - 748xx` (200 số).
  - Kết nối TBA 500kV Duyên Hải: `74410 - 74429` (20 số).
  - Kết nối NMĐ Trị An: `611xx - 615xx` (500 số).
  - Kết nối NMĐ Ô Môn: `717xx - 718xx` (200 số).

### 8.2. Quy tắc định tuyến cuộc gọi (Call Routing Tables)
1. **Routing qua Tổng đài A2 (10000)**:  
   Định tuyến các đầu số liên tỉnh, đầu số các đơn vị thành viên: `5`, `14`, `16`, `18`, `22`, `23`, `33`, `34`, `35`, `37`, `40`, `43`, `44`, `46`, `48`, `81`, `82`, `88`, `317`, `420 - 429`, `450 - 455`, `611 - 615`, `627`, `643`, `681`, `684`, `710`, `713 - 719`, `734`, `745 - 748`, `770 - 779`, `836 - 839`, `851`, `876`, `1120`, `1121`, `6193`, `6194`, `6265 - 6269`, `6280 - 6284`, `6570`, `6571`, `7370`, `7371`, `7441`, `7442`, `7542`, `7543`.
2. **Routing qua Tổng đài Pleiku (10001)**:  
   Định tuyến các đầu số Tây Nguyên và miền Trung: `49`, `131`, `132`, `138`, `139`, `456`, `457`, `601`, `604`, `605`, `606`, `608`, `6090 - 6092`, `6260 - 6264`, `634` (Di Linh).
3. **Routing qua Tổng đài Phú Lâm #2 (10004)**:  
   Định tuyến các đầu số miền Đông & Tây Nam Bộ: `89`, `634`, `640`, `641`, `644`, `647`, `648`, `664`, `725`, `834`.
4. **Routing ra Đà Nẵng (A3)**:  
   `435xx - 437xx`, `46 -> 60`, `131`, `132`, `434 -> 437`, `454 -> 457`, `684`, `685`.
5. **Routing về Cửa Bắc (Hà Nội - EVN)**:  
   `14`, `15`, `16`, `17`, `18`, `22`, `23`, `33`, `34`, `35`, `37`, `40 -> 44`, `46`, `450 -> 453`, `851`.

---

## 9. BẢNG TỔNG HỢP THỐNG KÊ TOÀN BỘ 1.037 DẢI SỐ (SHEET: `tong hop`)

Sheet `tong hop` lưu trữ chi tiết **1.037 dải số điện thoại** được quy hoạch trong mạng PABX EVN, phân loại theo cấp quản lý và đối tượng sử dụng:

| Nhóm đối tượng quản lý / sử dụng | Số lượng dải số đã cấp | Quy mô số lượng máy | Đặc điểm phân bổ dải số |
| :--- | :---: | :---: | :--- |
| **Trạm Biến áp 110kV** | 542 dải | $10 \div 50$ số/trạm | Bắt đầu từ số `10000 ÷ 11999` và các dải `xx000 ÷ xx009` rải đều khắp các tỉnh thành. |
| **Trạm Biến áp 220kV** | 99 dải | $20 \div 100$ số/trạm | Bắt đầu bằng các đầu số tỉnh thành kết hợp đuôi `28xxx`, `29xxx`, `26xxx`, `31xxx`... |
| **Trạm Biến áp 500kV** | 25 dải | $20 \div 200$ số/trạm | Các dải số nút mạng quan trọng: `450xx` (Hòa Bình), `452xx` (Hà Tĩnh), `456xx` (Pleiku), `458xx` (Phú Lâm), `619xx` (Sông Mây)... |
| **Nhà máy điện (>30MW & <30MW)** | 127 dải | $50 \div 1.000$ số/NM | Khối Nguồn điện `1xxxx` (Hòa Bình, Phả Lại, Uông Bí, Thác Bà, Ninh Bình, Ialy, Trị An...) và `9xxxx` cho các cụm nhà máy vừa và nhỏ. |
| **Tổng công ty Điện lực (NPC, SPC, CPC, HANOI, HCMC)** | 55 dải | $1.000 \div 3.000$ số/TCT | Các dải đầu số `40xxx`, `48xxx`, `81xxx ÷ 88xxx`, `90xxx ÷ 94xxx`. |
| **Công ty Truyền tải điện (PTC1, PTC2, PTC3, PTC4, TTĐ)** | 72 dải | $100 \div 500$ số/đơn vị | Các dải số `44xxx`, `50xxx`, `83xxx`, `96xxx ÷ 97xxx`. |
| **Công ty Điện lực Tỉnh / Thành phố** | 64 dải | $100 \div 500$ số/đơn vị | Phân bổ theo mã tỉnh trong Sheet `dau so` (Ví dụ: `251xx` - Lạng Sơn, `321xx` - Hải Dương, `721xx` - Long An...). |
| **Cơ quan Tập đoàn EVN, Ban Quản lý Dự án & Tư vấn** | 53 dải | $50 \div 1.000$ số/đơn vị | Tập trung tại khối `40xxx - 49xxx` (Cửa Bắc Tháp A & Tháp B, EVNICT, EPTC, PECC1-4...). |
| **Tổng cộng toàn hệ thống** | **1.037 dải số** | **> 50.000 thuê bao** | **Toàn bộ mạng lưới PABX dùng riêng EVN.** |

---

## 10. GHI CHÚ QUẢN LÝ & CẬP NHẬT DẢI SỐ

1. **Ủy quyền cấp phát:** Theo Văn bản số `1444/EVN-VT&CNTT` ngày 13/04/2016 của Tập đoàn EVN, EVNICT được toàn quyền quản lý, thẩm định kỹ thuật và cấp phát dải số tổng đài nội bộ cho các đơn vị thành viên.
2. **Quy định thu hồi dải số:**
   - Theo Văn bản số `1010/EVN-VT&CNTT` ngày 21/03/2016, đã thu hồi dải số `64200 ÷ 64299` (trước đây cấp cho NMĐ Bà Rịa nhưng không sử dụng).
   - Thu hồi dải số `64300 ÷ 64349` (trước đây cấp cho TBA 500kV Phú Mỹ, do đã chuyển sang sử dụng thuê bao kéo xa từ TBA 500kV Phú Lâm).
   - Yêu cầu GENCO 2 trả lại dải số `71550 ÷ 71699` của Nhà máy điện Cần Thơ về Tập đoàn quản lý.
3. **Quy chuẩn hiển thị trong CSDL Hệ thống EVN CDR AS:**
   - Khóa ánh xạ: Cặp giá trị `prefix` (đầu số) + `range_from` đến `range_to`.
   - Độ dài tiêu chuẩn: **5 chữ số** (hỗ trợ số máy lẻ 4 chữ số tại một số trạm cũ qua bảng dịch số tổng đài).
