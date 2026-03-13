# CarbonTrack 🌍⚡

**Carbon Footprint Tracking Web Application**

CarbonTrack is a full-stack web application that helps users monitor their **daily carbon emissions** and understand their environmental impact.

The platform allows users to calculate their carbon footprint and track emissions over time through a **dashboard and activity tracker**.

The project is built using **React, Node.js, Express, MongoDB, and Firebase**, with deployment on **Vercel and Railway**.

---

# 🚀 Features

### Carbon Emission Dashboard

The dashboard provides a quick overview of the user's carbon footprint.

It displays:

* **Total carbon emissions**
* **Current month carbon emissions**

This helps users understand their overall environmental impact.

---

### Emission Tracker

The tracker page records carbon emissions **every time a calculation is made**.

It displays:

* **Day-wise emission data**
* **Time-wise emission entries**
* Historical records stored in the database

This allows users to track their emissions over time.

---

### User Authentication

Secure login system using **Firebase Authentication**.

Users can:

* Sign up
* Log in
* Access their personal carbon tracking data.

---

### Persistent Data Storage

All emission data is stored in **MongoDB**, allowing users to view their emission history anytime.

---

# 🛠 Tech Stack

### Frontend

* React.js
* CSS

### Backend

* Node.js
* Express.js

### Database

* MongoDB Atlas

### Authentication

* Firebase Authentication

### Deployment

* Vercel (Frontend hosting)
* Railway (Backend hosting)

---

# 🏗 System Architecture

User Activity Input
↓
React Frontend
↓
Node.js + Express API
↓
MongoDB Database
↓
Dashboard & Tracker Visualization

---

# 📊 Future Enhancements

* IoT-based electricity monitoring using **ESP8266 NodeMCU**
* Real-time energy usage tracking
* Smart energy alerts
* Carbon reduction suggestions
* Advanced analytics dashboard

---

# ⚙ Installation & Setup

### Clone the repository

```bash
git clone https://github.com/ketankumarjha2007/carbontrack.git
cd carbontrack
```

---

### Install dependencies

Backend

```bash
cd server
npm install
```

Frontend

```bash
cd client
npm install
```

---

### Setup Environment Variables

Create a `.env` file in the backend folder.

Example:

```
MONGO_URI=your_mongodb_connection_string
FIREBASE_API_KEY=your_firebase_key
```

---

### Run the project

Backend

```
npm start
```

Frontend

```
npm run dev
```

---

# 🌐 Deployment

Frontend hosted on **Vercel**
Backend hosted on **Railway**

---

# 🎯 Project Goal

CarbonTrack aims to help individuals **understand and track their carbon footprint**, encouraging sustainable habits through simple data tracking and visualization.

---

# 👨‍💻 Author

Ketan
Full Stack Developer
