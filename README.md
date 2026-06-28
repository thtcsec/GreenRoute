# GreenRoute - Eco-Routing & Climate-Safety Assistant

**Hackathon MVP Project by Team I - iMPACT**
**Slogan**: *From ideas to action. From action to impact*

---

## 1. Problem Statement

According to UNDP research, 94% of outdoor workers (especially gig drivers and shippers) have experienced health issues due to extreme weather, such as severe heatwaves. Over 66% have incurred additional expenses for vehicle repairs or medical care due to exposure to heavy rain and urban flooding.

However, almost all current navigation and mapping applications solve only one core problem: **"What is the fastest route?"** while completely ignoring a more critical question for gig workers: **"What is the safest route to work?"**. Drivers are frequently pushed into heat cores, deep flood zones, or forced to wait for orders in areas lacking shade, directly impacting their health and livelihood.

---

## 2. Solution Overview

**GreenRoute** is not built to replace Google Maps. We are building a **Climate-Safety Layer** integrated on top of existing map platforms, empowering drivers and shippers to make safer working decisions based on real-time climate data.

The philosophy of GreenRoute is **"Suggest, don't force"**. The application provides a comprehensive view of environmental risks (Heat, Flood, Lack of Shade, Traffic Congestion), and then suggests optimal alternative pickup/drop-off points and routes. Drivers are given **full autonomy** to balance between completing trips quickly and protecting their personal health.

In the long term, GreenRoute is positioned as a **B2B SaaS**, providing Routing APIs and a Climate Analytics Dashboard for ride-hailing super apps, logistics enterprises, and Smart City projects.

---

## 3. Features

1. **Climate-Aware Map:**
   - An intuitive map layer that visualizes Heat Zones (orange/red) and Flood Risks (blue) in real-time.
2. **Safety Pickup Suggestion & Alerts:**
   - Automatically scans the passenger's location upon a ride request. If the passenger is in a high-risk area (e.g., severe flooding), the AI triggers an emergency alert and suggests a new, safer pickup point nearby.
3. **CoolStop Recommendation:**
   - Scans and recommends cool, shaded stops or covered areas along the way for drivers to rest safely while waiting for their next ride.
4. **Smart Route Comparison (Routing Engine):**
   - Calculates and directly compares multiple routes: **Fastest Route** (speed optimized) vs **Balanced Route** (recommended by AI—accepting a minor 1-3 minute delay to avoid major heat cores and flood spots).
   - Consistently calculates estimated earnings and fuel costs based on the chosen route.
5. **Community Report:**
   - Allows drivers to quickly report hotspots, flooded roads, fallen trees, or traffic jams to provide instant warnings for the entire driver community.

---

## 4. Setup, Installation Steps, and Prerequisites

### Prerequisites
- **Node.js**: v18.17.0 or higher.
- **npm** (Node Package Manager): Usually installed alongside Node.js.
- **Git**: To clone the repository.
- Modern web browser (Chrome, Safari, Firefox, Edge).

### Installation Steps
1. Clone the repository:
   ```bash
   git clone https://github.com/thtcsec/GreenRoute.git
   cd GreenRoute
   ```
2. Install dependencies:
   ```bash
   npm install
   ```

---

## 5. Run Instructions (Local & Cloud)

### Run Locally (Development)
Start the local development server:
```bash
npm run dev
```
Open your browser and navigate to: `http://localhost:3000`

### Build and Run for Production
To build the application and run it in production mode:
```bash
npm run build
npm run start
```
*Note: The project is fully configured to be easily deployed to Vercel with zero configuration.*

### Share Mobile Demo (via Cloudflare Tunnel)
To test the mobile-responsive UI directly on your phone:
```bash
npx wrangler tunnel quick-start http://localhost:3000
```
Scan the provided QR code or access the `.trycloudflare.com` link on your mobile device.

---

## 6. User Guide (How to use the product)

The application simulates the workflow of a gig driver app. To experience the core value:
1. **Explore the Map**: Upon opening the app, you will see the map highlighting Heat Zones (orange/red polygons) and Flood Risks (blue polygons). You can toggle these layers using the **Layers** button (top left).
2. **Find a CoolStop**: The driver starts idle. Click on any **CoolStop** (snowflake icon) on the map to see its details and get a route to a shaded resting area.
3. **Receive a Ride (Emergency Alert)**: Click the **"Bật nhận chuyến" (Go Online)** button at the bottom. A ride request will appear. Notice the red alert: The passenger's original pickup point is heavily flooded. The app automatically suggests a safer pickup point 60 meters away.
4. **Compare Routes**: Click **"Chấp nhận" (Accept)**. The app calculates routes to the passenger. It will present a **Fastest Route** (going straight through heat) and a **Balanced Route** (a slight detour that avoids heat cores). Select the Balanced Route to prioritize health.
5. **Start Journey**: Click **"Bắt đầu hành trình" (Start Journey)**. Follow the simulated GPS dot (green pulsing marker).
6. **Community Reporting**: At any time, click the **Warning Triangle** icon (top right) to drop a pin and report an incident (e.g., severe flooding, fallen tree) to the community map.

---

## 7. Tech Stack + Architecture Notes

### Tech Stack
- **Frontend**: Next.js 14 (App Router), React, TypeScript, Tailwind CSS, Framer Motion.
- **Map & Geospatial**: Leaflet, React-Leaflet, OpenStreetMap.
- **Backend/API**: Next.js Serverless API Routes.
- **Database**: MongoDB Atlas (for live real-time tracking of community reports).

### Architecture Notes (Brief)
- **Monorepo Structure**: The Next.js framework handles both the React frontend and the backend API routes, keeping the codebase unified.
- **Client-Side Rendering (CSR) for Maps**: Leaflet maps are dynamically imported on the client side (`ssr: false`) because mapping libraries require direct access to the browser's `window` object.
- **Climate Scoring Engine**: Runs on the backend (`/src/app/api/routes`). When calculating routes, we fetch raw geometries from OSRM, sample points along the route, and intersect them with our geospatial risk zones (Heat/Flood) to compute a *Climate Score* penalty using the Haversine formula and spatial math.
- **State Management**: React Context / Hooks are used to manage the driver's current location, the active route, and UI modal states.

---

## 8. Reproducibility

This repository contains all necessary dependency files and configurations required to build and run the project immediately:
- `package.json` and `package-lock.json`: Locks down exactly which NPM packages and versions are required.
- `tsconfig.json`: TypeScript compiler configuration.
- `tailwind.config.ts` and `postcss.config.js`: Required for styling compilation.
- `next.config.mjs`: Next.js build configuration.
- *Environment Variables*: No mandatory `.env` secrets are required to run the basic MVP flow (MongoDB is public for demo purposes, and OSRM uses the public Demo API).

---

## 9. Attribution & Licensing

We proudly acknowledge the following third-party assets and open-source tools that made this project possible:
- **Routing Engine**: [Open Source Routing Machine (OSRM)](http://project-osrm.org/) API (Demo server) is used to generate street-level paths.
- **Map Tiles**: [OpenStreetMap](https://www.openstreetmap.org/copyright) contributors.
- **Map Library**: [Leaflet](https://leafletjs.com/) and [React-Leaflet](https://react-leaflet.js.org/).
- **UI Icons**: [Lucide React](https://lucide.dev/).
- **AI Code Generation Disclosure**: During the hackathon, we utilized generative AI coding assistants (including **Google DeepMind Antigravity / Gemini**) to accelerate scaffolding, boilerplate generation, and Tailwind CSS UI styling. All AI-generated code was actively reviewed, tested, and modified by our human team members to fit the project's logic and architecture.

### License
This project is submitted for the Hackathon. Source code is provided as-is. Standard open-source MIT Licensing applies to the application shell.

---
**Team I - iMPACT**
1. Nguyen Huu Dung (ID: 29) - UIT
2. Trinh Hoang Tu (ID: 2) - HUFLIT
3. Nguyen Phuoc Nhat Duy (ID: 101) - HCMUT
4. Nguyen Hoang An (ID: 84) - FPT
5. Tieu Thi Kim Cuong (ID: 69) - UEH
