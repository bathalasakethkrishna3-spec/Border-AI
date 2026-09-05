# BORDER AI
### AI-Based Intelligent Video Analytics Platform for Border Surveillance using Existing CCTV Infrastructure

![Theme](https://img.shields.io/badge/Theme-Smart%20Automation-cyan?style=for-the-badge)
![Security](https://img.shields.io/badge/Security-MIL--STD--810H-emerald?style=for-the-badge)
![Status](https://img.shields.io/badge/Status-OPERATIONAL-blue?style=for-the-badge)

---

## 🎯 Project Overview
**BORDER AI** is a state-of-the-art defense and surveillance command center application. It connects existing CCTV camera networks, FLIR thermal imagers, and low-light optical sensors to automated AI video analytics, providing real-time perimeter threat detection, GIS geofence mapping, and incident telemetry.

---

## 🏗 Technology Stack

### Frontend
- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS (Dark Defense Surveillance Theme)
- **Icons**: Lucide React
- **Routing**: React Router v6
- **Charts & Graphs**: Recharts
- **Mapping & GIS**: Leaflet & React-Leaflet with CARTO Dark Matter tiles
- **Video & HUD Simulation**: Procedural HTML5 Canvas Surveillance Engine (Optical, FLIR Thermal, Night-Vision NVG)

### Backend
- **Framework**: Python 3 (Flask 3.x)
- **Cross-Origin**: Flask-CORS
- **Database ORM**: SQLAlchemy (Flask-SQLAlchemy)
- **Authentication**: HMAC-SHA256 JWT Tokens with role-based access control
- **Security**: Werkzeug password hashing
- **Database**: SQLite (`borderai.db`) with automatic seeding

---

## 📁 Project Directory Structure

```
BorderAI/
│
├── backend/
│   ├── app.py                      # Flask application factory, routes, and DB initializer
│   ├── config.py                   # Configuration settings (JWT secret, DB URI)
│   ├── requirements.txt            # Python dependencies
│   ├── seed.py                     # Database initialization & realistic demo dataset
│   ├── test_api.py                 # Automated unit tests for all REST endpoints
│   ├── models/
│   │   ├── __init__.py             # SQLAlchemy db instance
│   │   ├── user.py                 # User model (Administrator, Operator, Analyst)
│   │   ├── camera.py               # Camera metadata, coordinates, stream types
│   │   ├── alert.py                # Threat alerts, severity levels, confidence
│   │   ├── detection.py            # AI object detections (PERSON, VEHICLE, WEAPON, etc.)
│   │   ├── notification.py         # Operator notifications
│   │   ├── audit_log.py            # Security audit event logs
│   │   └── system_setting.py       # AI sensitivity threshold parameters
│   ├── routes/
│   │   ├── auth.py                 # /api/auth (login, logout, profile)
│   │   ├── cameras.py              # /api/cameras (CRUD)
│   │   ├── alerts.py               # /api/alerts (triage, resolve, delete)
│   │   ├── analytics.py            # /api/analytics (dashboard & Recharts trends)
│   │   ├── detections.py           # /api/detections (YOLO ingestion & simulation)
│   │   ├── notifications.py        # /api/notifications
│   │   ├── users.py                # /api/users
│   │   ├── audit_logs.py           # /api/audit-logs
│   │   └── settings.py             # /api/settings
│   ├── services/
│   │   ├── detection_service.py    # Auto-alert generation & threshold gating
│   │   └── yolo_service.py         # Modular OpenCV & Ultralytics YOLO architecture stub
│   └── database/
│       └── borderai.db             # SQLite database file
│
├── frontend/
│   ├── index.html                  # HTML5 template with dark theme and Leaflet CSS
│   ├── package.json                # React, Vite, Tailwind, Leaflet, Recharts dependencies
│   ├── vite.config.js              # Vite configuration with API proxy to port 5000
│   ├── tailwind.config.js          # Tactical surveillance theme configuration
│   └── src/
│       ├── main.jsx                # Application root mount
│       ├── App.jsx                 # Router, protected routes, and layout wrappers
│       ├── index.css               # Surveillance scanlines, glowing borders, custom scrollbar
│       ├── context/
│       │   ├── AuthContext.jsx     # User session, JWT persistence, permissions
│       │   └── AlertContext.jsx    # Real-time alert polling, badge counts, notifications
│       ├── services/
│       │   └── api.js              # Centralized Axios client with JWT interceptor
│       ├── components/
│       │   ├── Sidebar.jsx         # Command center sidebar with logo, navigation, and badges
│       │   ├── Header.jsx          # Live auto-updating clock, threat level, user avatar
│       │   ├── StatCard.jsx        # Statistics card with progress bars & Recharts sparklines
│       │   ├── CameraCard.jsx      # Video stream card with HUD, scanlines, and spectrum modes
│       │   ├── CCTVCanvas.jsx      # Procedural video generator (Optical, FLIR Thermal, NVG)
│       │   ├── AlertCard.jsx       # Alert card with severity styling, confidence bar, actions
│       │   ├── NotificationPanel.jsx # Dropdown notifications with mark read
│       │   ├── BorderMap.jsx       # Leaflet dark map with pulsing markers & geofences
│       │   └── AddCameraModal.jsx  # Modal for provisioning and editing camera sensors
│       └── pages/
│           ├── Login.jsx           # Modern login page with 1-click demo access
│           ├── Dashboard.jsx       # 5 Stat cards, 2x2 CCTV grid, recent alerts, mini map
│           ├── LiveSurveillance.jsx# Multi-grid matrix (1x1, 2x2, 3x3) with spectrum filters
│           ├── CameraDetails.jsx   # Dedicated camera view, stream HUD, PTZ controls
│           ├── SmartAlerts.jsx     # Alert triage, batch resolve, threat simulation
│           ├── BorderMonitoring.jsx# Full interactive dark Leaflet map with sensor inventory
│           ├── AIAnalytics.jsx     # Recharts donut, 7-day trend line, sector distribution
│           ├── Reports.jsx         # Multi-filter incident logs with working CSV Export
│           ├── CameraManagement.jsx# Full CRUD table synced with SQLite DB and Leaflet Map
│           ├── UserManagement.jsx  # Operator and Administrator accounts directory
│           ├── Settings.jsx        # AI sensitivity sliders, alarm triggers, retention
│           └── AuditLogs.jsx       # Immutable timeline of operational actions
│
└── README.md
```

---

## 🚀 Windows Quick-Start Guide

### Step 1: Start the Python Flask Backend

Open **PowerShell** or **Command Prompt**:

```powershell
cd c:\Users\hp\Downloads\BorderAI\backend

# Optional: Create and activate virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the Flask backend
python app.py
```

> **Backend URL**: `http://127.0.0.1:5000`
> The database will automatically initialize and seed with realistic defense surveillance data on first startup.

---

### Step 2: Start the React Frontend

Open a **second** terminal window:

```powershell
cd c:\Users\hp\Downloads\BorderAI\frontend

# Install dependencies (already completed during setup)
npm install

# Start Vite development server
npm run dev
```

> **Frontend Application URL**: Open [http://localhost:5173](http://localhost:5173) in your web browser.

---

## 🔑 Demo Login Accounts

| Role | Username | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin` | `admin123` | Full control: Camera CRUD, User Management, System Config, Triage |
| **Operator** | `operator` | `operator123` | Operational control: Surveillance, Smart Alerts, GIS Map, Reporting |
| **Analyst** | `analyst` | `analyst123` | Analytics, Threat Pattern Reports, Audit Inspection |

---

## 📡 REST API Reference

### Authentication
- `POST /api/auth/login` - Authenticate user & receive JWT token
- `POST /api/auth/logout` - Invalidate session & log audit trail
- `GET /api/auth/me` - Get current authenticated operator profile

### Cameras
- `GET /api/cameras` - List all cameras (optional filters: `sector`, `status`)
- `GET /api/cameras/<id_or_code>` - Get single camera details, recent detections, and alerts
- `POST /api/cameras` - Provision new camera (automatically syncs to SQLite and Map)
- `PUT /api/cameras/<id>` - Update camera configuration
- `DELETE /api/cameras/<id>` - Decommission camera node

### Threat Alerts
- `GET /api/alerts` - List alerts (filters: `priority`, `status`, `sector`, `camera_id`)
- `GET /api/alerts/<id>` - Get alert details
- `POST /api/alerts/<id>/resolve` - Mark alert as resolved in SQLite DB
- `POST /api/alerts/resolve-all` - Batch resolve all active alerts
- `DELETE /api/alerts/<id>` - Delete alert record

### Detections & Future AI Ingestion
- `GET /api/detections` - Query detection events
- `POST /api/detections` - **YOLO / OpenCV Ingestion Endpoint**
- `POST /api/detections/simulate` - Trigger test simulation detection

### Analytics & Reporting
- `GET /api/analytics/dashboard` - Real-time metrics for top 5 stat cards and 2x2 grid
- `GET /api/analytics/trends` - Recharts datasets (7-day trend, donut breakdown, sector counts)
- `GET /api/audit-logs` - Query immutable operational audit events
- `GET /api/settings` & `PUT /api/settings` - Read and calibrate AI confidence thresholds

---

## 🤖 Future YOLO + OpenCV Integration Workflow

The backend has been structured specifically for seamless integration with OpenCV and Ultralytics YOLO.

```
CCTV RTSP / Video Stream
          ↓
OpenCV reads video frames (cv2.VideoCapture)
          ↓
YOLOv8/v11 AI model classifies objects (Person, Vehicle, Intruder, Weapon)
          ↓
Inference Pipeline posts detection payload:
POST /api/detections
{
  "camera_id": "CAM-01",
  "object_type": "PERSON",
  "confidence": 96.5,
  "bbox": {"x": 0.45, "y": 0.35, "w": 0.15, "h": 0.30},
  "timestamp": "2026-08-30T10:23:00"
}
          ↓
DetectionService compares confidence with threshold (e.g. 80.0%)
          ↓
1. Saves Detection record in SQLite
2. Automatically generates Alert (ALERT-008)
3. Spawns Operator Notification
4. Updates Camera Status (ONLINE -> ALERT)
5. Updates Dashboard statistics in real time
```

To activate live video processing:
1. `pip install opencv-python ultralytics`
2. Place your YOLO model weights (`yolov8n.pt` or custom weights) in `backend/`
3. Connect your RTSP camera URLs in `backend/services/yolo_service.py`.

---

## 🛡 Verification & Automated Testing
To run the automated backend test suite:
```powershell
cd backend
python test_api.py
```
All 10 tests verify authentication, camera CRUD, alert triage, YOLO detection ingestion, and analytics data streams.
