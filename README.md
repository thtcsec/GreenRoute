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

## Why GreenRoute is different

GreenRoute is not another map or a generic green-route planner.

Most navigation tools optimize for speed. GreenRoute optimizes climate-safe working decisions for drivers and shippers during high-risk moments: waiting, stopping, pickup/drop-off, and routing under heat or rain.

Our key differentiation:
- **Driver-first**: designed for drivers and shippers, not casual commuters.
- **Stop-first**: recommends safer waiting and pickup/drop-off points, not only routes.
- **Rain-aware**: combines rain signals, local flood-risk points, and driver reports.
- **Report-driven**: drivers become real-time climate sensors for the city.
- **Integration-ready**: can become an API/SDK layer for mobility platforms and city dashboards.

---

## Data & API Strategy

**Live data:**
- OpenStreetMap + Leaflet for base map and markers.
- Weather forecast API for heat and rain signal.
- Driver reports for real-time hotspot updates.

**Pilot layer:**
- Local urban flood-risk points for water pooling, hard-to-stop locations, and unsafe pickup/drop-off areas.

**Why hybrid:**
Regional flood forecasts do not fully capture street-level urban waterlogging. GreenRoute combines forecast context with local driver intelligence to produce practical recommendations.

---

## Judging Criteria Fit

### Problem Definition & Relevance
Drivers and shippers are exposed to heat, rain, flooding, poor shade, and unsafe stops during daily work. Current maps optimize speed, but not climate-safe working decisions.

### Solution Quality & Innovation
GreenRoute adds a climate-safety decision layer for waiting, stopping, pickup/drop-off, and routing under heat or rain.

### Feasibility & Implementation
The MVP uses a mobile web app, OpenStreetMap, pilot data, precomputed routes, and driver reports to prove the core flow within the hackathon timeframe.

### Demo & Pitch
The demo follows a driver journey: heat alert → CoolStop → balanced route → safer pickup/drop-off → report hotspot.

### Adoption & Scalability
GreenRoute can start with drivers and shippers, then scale to mobility platforms, campuses, urban districts, and cities.

---

## Công nghệ sử dụng
- **Framework**: Next.js 14+ (App Router)
- **Ngôn ngữ**: TypeScript
- **Styling**: Tailwind CSS
- **Bản đồ**: Leaflet kết hợp OpenStreetMap thông qua React-Leaflet
- **Icons**: Lucide React
- **Cơ sở dữ liệu**: MongoDB Atlas (Lưu trữ và đồng bộ hóa báo cáo thời tiết thời gian thực của các tài xế)
- **Đường truyền phát triển**: Cloudflare Tunnel (Wrangler Tunnel) hỗ trợ chạy thử trực tiếp trên điện thoại di động

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

### 4. Chia sẻ ứng dụng & Demo trên điện thoại (Cloudflare Tunnel)
Để tạo một đường truyền công khai (Public URL) miễn phí giúp ban giám khảo hoặc các thành viên quét mã QR truy cập trực tiếp ứng dụng đang chạy ở `localhost:3000` trên điện thoại di động:

Sử dụng lệnh **Quick Tunnel** tích hợp sẵn trong Wrangler (không cần đăng nhập Cloudflare):
```bash
npx wrangler tunnel quick-start http://localhost:3000
```

Sau khi chạy lệnh trên, Wrangler sẽ tải xuống công cụ `cloudflared` và in ra một đường dẫn ngẫu nhiên có đuôi dạng:
`https://xxx-xxx-xxx.trycloudflare.com`

**Cách dùng:**
1. Hãy quét mã QR hoặc truy cập đường link `.trycloudflare.com` này trên điện thoại di động để demo trực tiếp.
2. Mọi thao tác trên điện thoại sẽ gọi trực tiếp đến API trên máy tính của bạn và cập nhật bản đồ theo thời gian thực.
