# GreenRoute - Eco-Routing & Climate-Safety Assistant

**Hackathon MVP Project by Team I - iMPACT**
**Slogan**: *From ideas to action. From action to impact*

---

## 🛑 Problem Statement

According to UNDP research, 94% of outdoor workers (especially gig drivers and shippers) have experienced health issues due to extreme weather, such as severe heatwaves. Over 66% have incurred additional expenses for vehicle repairs or medical care due to exposure to heavy rain and urban flooding.

However, almost all current navigation and mapping applications solve only one core problem: **"What is the fastest route?"** while completely ignoring a more critical question for gig workers: **"What is the safest route to work?"**. Drivers are frequently pushed into heat cores, deep flood zones, or forced to wait for orders in areas lacking shade, directly impacting their health and livelihood.

---

## 💡 Solution Overview

**GreenRoute** is not built to replace Google Maps. We are building a **Climate-Safety Layer** integrated on top of existing map platforms, empowering drivers and shippers to make safer working decisions based on real-time climate data.

The philosophy of GreenRoute is **"Suggest, don't force"**. The application provides a comprehensive view of environmental risks (Heat, Flood, Lack of Shade, Traffic Congestion), and then suggests optimal alternative pickup/drop-off points and routes. Drivers are given **full autonomy** to balance between completing trips quickly and protecting their personal health.

In the long term, GreenRoute is positioned as a **B2B SaaS**, providing Routing APIs and a Climate Analytics Dashboard for ride-hailing super apps, logistics enterprises, and Smart City projects.

---

## 🚀 Features

1. **Climate-Aware Map:**
   - An intuitive map layer that visualizes Heat Zones (orange/red) and Flood Risks (blue) in real-time.

2. **Safety Pickup Suggestion & Alerts:**
   - Automatically scans the passenger's location upon a ride request. If the passenger is in a high-risk area (e.g., severe flooding), the AI triggers an emergency alert and suggests a new, safer pickup point nearby (e.g., a high-ground apartment lobby 60m away).

3. **CoolStop Recommendation:**
   - Scans and recommends cool, shaded stops or covered areas along the way for drivers to rest safely while waiting for their next ride.

4. **Smart Route Comparison (Routing Engine):**
   - Calculates and directly compares multiple routes:
     - **Fastest Route:** Purely optimized for speed.
     - **Balanced Route:** Recommended by the AI as "Optimal"—accepting a 1-3 minute delay but avoiding most heat cores and flood spots.
   - Consistently calculates estimated earnings and fuel costs based on the chosen route.

5. **Community Report:**
   - Allows drivers to quickly report hotspots, flooded roads, fallen trees, or traffic jams to provide instant warnings for the entire driver community.

---

## 👥 Team Information (Team I - iMPACT)
1. **Nguyen Huu Dung** (ID: 29) - UIT
2. **Trinh Hoang Tu** (ID: 2) - HUFLIT
3. **Nguyen Phuoc Nhat Duy** (ID: 101) - HCMUT
4. **Nguyen Hoang An** (ID: 84) - FPT
5. **Tieu Thi Kim Cuong** (ID: 69) - UEH

---

## 🛠 Technologies Used
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **Map**: Leaflet & OpenStreetMap (via React-Leaflet)
- **Database**: MongoDB Atlas (Real-time tracking)
- **Routing Engine**: OSRM (Open Source Routing Machine) combined with an internal spatial sampling algorithm to calculate the Climate Score.

---

## 📦 Installation and Demo Guide

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Run Development Server (Localhost):**
   ```bash
   npm run dev
   ```
   Open your browser and navigate to: [http://localhost:3000](http://localhost:3000)

3. **Share Mobile Demo (via Cloudflare Tunnel):**
   ```bash
   npx wrangler tunnel quick-start http://localhost:3000
   ```
   Scan the provided QR code or access the `.trycloudflare.com` link to demo the application directly on your mobile phone.
