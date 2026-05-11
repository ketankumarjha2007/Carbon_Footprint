# 🌍 CarbonTrack — Smart Carbon Footprint & AQI Monitoring Platform ⚡

<div align="center">

# 🚀 Track Your Carbon Impact. Monitor Air Quality. Build A Greener Future.

<img src="https://img.shields.io/badge/Frontend-React-blue?style=for-the-badge&logo=react" />
<img src="https://img.shields.io/badge/Backend-Node.js-green?style=for-the-badge&logo=node.js" />
<img src="https://img.shields.io/badge/Database-MongoDB-darkgreen?style=for-the-badge&logo=mongodb" />
<img src="https://img.shields.io/badge/Auth-Firebase-orange?style=for-the-badge&logo=firebase" />
<img src="https://img.shields.io/badge/Deployment-Vercel-black?style=for-the-badge&logo=vercel" />
<img src="https://img.shields.io/badge/API-Express-lightgrey?style=for-the-badge&logo=express" />

<br/>
<br/>

### 🌱 Full Stack Environmental Intelligence Platform

Track your **carbon emissions**, monitor **live AQI**, analyze environmental impact, and build sustainable habits with smart analytics and future IoT integration.

</div>

---

# ✨ Overview

**CarbonTrack** is a modern full-stack web application that helps users monitor and analyze their environmental impact through **carbon footprint tracking** and **real-time AQI monitoring**.

The platform provides detailed dashboards, historical analytics, emission tracking, and live air quality insights.

CarbonTrack combines:

✅ Carbon Footprint Tracking  
✅ Live AQI Monitoring  
✅ Dashboard Analytics  
✅ Historical Emission Data  
✅ Firebase Authentication  
✅ MongoDB Cloud Storage  
✅ Tree Plantation Donation Feature  
✅ Upcoming IoT-based Smart Energy Monitoring

---

# 🌟 Features

# ⚡ Carbon Emission Dashboard

The dashboard provides a complete overview of the user's environmental impact.

### Dashboard Includes

- 🌍 Total Carbon Emissions
- 📅 Current Month Emissions
- 📊 Emission Analytics
- 📈 Weekly Emission Trends
- 📉 Last 7 Days Graph
- 🧾 Historical Emission Records

---

# 📊 Emission Tracker

Every carbon calculation is automatically stored in the database for future analysis.

### Tracker Features

✅ Day-wise Emission Tracking  
✅ Month-wise Emission Graphs  
✅ Last 7 Days Analytics  
✅ Time-wise Emission Entries  
✅ Historical Data Visualization  
✅ Real-time Dashboard Updates

---

# 🌫 Live AQI Monitoring System

CarbonTrack provides **real-time Air Quality Index (AQI)** information for any city or country.

### AQI Features

🌍 Search Any City or Country  
📊 Real-time AQI Data  
⚠ AQI Severity Levels  
💨 Pollution Insights  
🌡 Environmental Monitoring  
📍 Location-based AQI Tracking

---

# 📌 AQI Classification

| AQI Range | Level | Status |
|------------|--------|--------|
| 0 - 50 | Good | 🟢 Safe |
| 51 - 100 | Moderate | 🟡 Acceptable |
| 101 - 150 | Unhealthy for Sensitive Groups | 🟠 Caution |
| 151 - 200 | Unhealthy | 🔴 Poor |
| 201 - 300 | Very Unhealthy | 🟣 Dangerous |
| 301+ | Hazardous | ⚫ Severe |

---

# 🔐 Authentication System

Secure authentication powered by **Firebase Authentication**.

### Features

- User Signup
- User Login
- Protected Routes
- Secure Sessions
- Personal Dashboard Access

---

# 🛢 Persistent Data Storage

All user emission records are stored securely in **MongoDB Atlas**.

Users can access their historical emission data anytime.

---

# 🌱 Donation Feature

Users can support environmental sustainability through the integrated donation system.

### Purpose

🌳 Tree Plantation  
🌍 Environmental Awareness  
♻ Sustainability Support

---

# 🤖 IoT Smart Energy Monitoring (Upcoming)

CarbonTrack is evolving into a complete **IoT-powered environmental monitoring ecosystem**.

The future system will use:

- ESP8266 NodeMCU
- ACS712 Current Sensor
- Smart Energy Monitoring
- Real-time Electricity Tracking

---

# 🔌 Planned IoT Features

## ⚡ Real-Time Electricity Monitoring

Track appliance electricity consumption in real time using IoT sensors.

---

## 📈 Live Energy Analytics

Monitor:

- Voltage
- Current
- Power Consumption
- Carbon Emission Estimation

---

## 🚨 Smart Alerts

Future updates will include:

- High energy usage alerts
- Abnormal consumption detection
- Smart energy optimization recommendations

---

## ☁ Cloud Synchronization

IoT sensor data will sync directly with MongoDB for real-time analytics and visualization.

---

# 🏗 System Architecture

```text
                ┌─────────────────────┐
                │   User Activity     │
                └─────────┬───────────┘
                          │
                          ▼
                ┌─────────────────────┐
                │   React Frontend    │
                └─────────┬───────────┘
                          │
              REST APIs / Axios Requests
                          │
                          ▼
                ┌─────────────────────┐
                │ Node.js + Express   │
                └─────────┬───────────┘
                          │
        ┌─────────────────┴─────────────────┐
        ▼                                   ▼
┌─────────────────┐              ┌─────────────────┐
│ MongoDB Atlas   │              │ Firebase Auth   │
└─────────────────┘              └─────────────────┘

                          ▼
                ┌─────────────────────┐
                │ Dashboard Analytics │
                └─────────────────────┘

                          ▼
                ┌─────────────────────┐
                │  AQI Live Monitoring│
                └─────────────────────┘

                          ▼
                ┌─────────────────────┐
                │ IoT Energy Tracking │
                └─────────────────────┘
```

---

# 🛠 Tech Stack

# 🎨 Frontend

- React.js
- CSS
- Axios
- Chart.js / Recharts

---

# ⚙ Backend

- Node.js
- Express.js

---

# 🛢 Database

- MongoDB Atlas

---

# 🔐 Authentication

- Firebase Authentication

---

# ☁ Deployment

| Service | Purpose |
|----------|----------|
| Vercel | Frontend Hosting |
| Render | Backend Hosting |
| MongoDB Atlas | Cloud Database |
| Firebase | Authentication |

---

# 📂 Project Structure

```bash
CarbonTrack/
│
├── client/
│   ├── src/
│   ├── components/
│   ├── pages/
│   ├── charts/
│   └── styles/
│
├── server/
│   ├── routes/
│   ├── controllers/
│   ├── models/
│   ├── middleware/
│   └── config/
│
├── README.md
└── package.json
```

---

# ⚙ Installation & Setup

# 1️⃣ Clone Repository

```bash
git clone https://github.com/ketankumarjha2007/Carbon_Footprint
```

```bash
cd Carbon_Footprint
```

---

# 2️⃣ Install Dependencies

## Backend

```bash
cd server
npm install
```

## Frontend

```bash
cd client
npm install
```

---

# 3️⃣ Setup Environment Variables

Create a `.env` file inside the backend folder.

```env
MONGO_URI=your_mongodb_connection_string

FIREBASE_API_KEY=your_firebase_api_key

JWT_SECRET=your_secret_key

AQI_API_KEY=your_aqi_api_key
```

---

# 4️⃣ Run Backend

```bash
npm start
```

---

# 5️⃣ Run Frontend

```bash
npm run dev
```

---

# 🌐 Deployment

# Frontend Deployment

Deployed using **Vercel**

---

# Backend Deployment

Deployed using **Render**

---

# 📊 Core Functionalities

| Module | Description |
|--------|-------------|
| Carbon Calculator | Calculates user carbon emissions |
| Dashboard | Displays emission analytics |
| AQI Monitoring | Shows live air quality data |
| Authentication | Secure Firebase login system |
| Emission Tracker | Stores historical records |
| Donation System | Supports environmental causes |
| IoT Monitoring | Future real-time energy tracking |

---



# 🚀 Future Enhancements

- 🤖 AI-based Carbon Reduction Suggestions
- ⚡ Smart Appliance Monitoring
- 📱 Mobile App Version
- 🌍 Smart Sustainability Score
- 📈 Advanced Analytics Dashboard
- ☁ Real-time IoT Data Streaming
- 🔔 Smart Notifications & Alerts

---

# 🛡 Security Features

✅ Firebase Authentication  
✅ Protected API Routes  
✅ Secure Environment Variables  
✅ MongoDB Atlas Security  
✅ Authentication Middleware

---

# 💡 Why CarbonTrack?

CarbonTrack helps users:

🌍 Understand environmental impact  
📊 Track emissions over time  
⚡ Monitor live AQI conditions  
📈 Analyze electricity usage  
🌱 Build sustainable habits

---

# 👨‍💻 Author

# Ketan  
### Full Stack Developer 🚀

Passionate about:

- Full Stack Development
- IoT Systems
- Environmental Technology
- Smart Energy Solutions
- Scalable Web Applications

---

# ⭐ Support The Project

If you like this project:

🌟 Star the repository  
🍴 Fork the project  
📢 Share with others  
🌱 Spread environmental awareness

---

<div align="center">

# 🌍 "Small Daily Changes Create A Greener Tomorrow."

## CarbonTrack ⚡

</div>
