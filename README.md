# GreenRoute - From ideas to action. From action to impact

**Dự án Hackathon MVP bởi Team I - iMPACT**

## Thông tin nhóm
- **Tên nhóm**: Team I - iMPACT
- **Khẩu hiệu**: *From ideas to action. From action to impact*
- **Danh sách thành viên**:
  1. **Nguyễn Hữu Dũng** (ID: 29) - Trường Đại học Công nghệ Thông tin - ĐHQG-HCM (UIT)
  2. **Trịnh Hoàng Tú** (ID: 2) - Trường Đại học Ngoại ngữ - Tin học TP.HCM (HUFLIT)
  3. **Nguyễn Phước Nhật Duy** (ID: 101) - Trường Đại học Bách khoa - ĐHQG-HCM (HCMUT)
  4. **Nguyễn Hoàng An** (ID: 84) - Trường Đại học FPT (FPT)
  5. **Tiêu Thị Kim Cương** (ID: 69) - Trường Đại học Kinh tế TP.HCM (UEH)

---

## Giới thiệu về GreenRoute
**GreenRoute** là một bản mẫu ứng dụng di động (mobile web prototype) dành cho tài xế và người giao hàng (shippers). Ứng dụng giúp họ đưa ra các quyết định an toàn hơn và nhận thức về khí hậu trong điều kiện nắng nóng gay gắt hoặc mưa bão tại khu vực đô thị (khu vực Thủ Đức / ĐHQG-HCM làm trung tâm):
- Tìm điểm dừng mát mẻ (**CoolStop**) để nghỉ ngơi tạm thời hoặc đợi đơn hàng.
- Tránh các khu vực rủi ro nhiệt độ cực đoan và các điểm ngập nước nghiêm trọng.
- So sánh các tuyến đường khí hậu (**Climate Routes**): Tuyến đường Nhanh nhất (Fastest), Tuyến đường Cân bằng (Balanced), Tuyến đường Mát nhất (Coolest).
- Gợi ý điểm đón/trả khách an toàn hơn thay thế cho điểm mặc định bị nắng/ngập.
- Báo cáo thời tiết khí hậu thời gian thực lưu vào thiết bị (`localStorage`) và hiển thị ngay trên bản đồ.

---

## Công nghệ sử dụng
- **Framework**: Next.js 14+ (App Router)
- **Ngôn ngữ**: TypeScript
- **Styling**: Tailwind CSS
- **Bản đồ**: Leaflet kết hợp OpenStreetMap thông qua React-Leaflet
- **Icons**: Lucide React
- **Quản lý dữ liệu**: Dữ liệu tĩnh JSON cho Demo & `localStorage` lưu trữ báo cáo

---

## Hướng dẫn cài đặt và chạy thử nghiệm

### 1. Cài đặt các thư viện cần thiết
Nếu chạy lần đầu tiên, hãy cài đặt các thư viện phụ thuộc:
```bash
npm install
```

### 2. Chạy ứng dụng trong môi trường phát triển
```bash
npm run dev
```
Mở trình duyệt truy cập: [http://localhost:3000](http://localhost:3000)

### 3. Build ứng dụng cho Production (Deploy lên Vercel)
```bash
npm run build
```
Dự án được cấu hình sẵn sàng để deploy lên Vercel một cách nhanh chóng.
