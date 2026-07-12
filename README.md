# TransitOps - Smart Transport Operations Platform

TransitOps is a centralized Smart Transport Operations Platform designed to digitize the complete logistics lifecycle, replacing manual spreadsheets and logbooks with a secure, responsive, role-based application.

---

## 🚀 Tech Stack

### Frontend

- **React 19**
- **Vite**
- **Tailwind CSS**
- **React Router DOM**
- **Axios**
- **React Hook Form**
- **React Icons**
- **Recharts**

### Backend

- **Django 5.x**
- **Django REST Framework (DRF)**
- **Simple JWT Authentication**
- **Django ORM**
- **ReportLab** (for PDF generation)

### Database

- **MySQL 8.0 CE**

---

## 🏗️ Architecture

```
React (Frontend) ➔ Axios ➔ Django REST API (v1) ➔ Business Services ➔ Django ORM ➔ MySQL Database
```

---

## 📂 Project Structure

```
transitops/
│
├── TransitOps-frontend/      # Vite + React Frontend Application
│   ├── src/
│   │   ├── api/             # API integration layer (Axios clients)
│   │   ├── components/      # Common UI Components (StatusBadge, etc.)
│   │   ├── context/         # AuthContext
│   │   ├── features/        # Feature modules (Dashboard, Maintenance, Reports, etc.)
│   │   └── rbac/            # Frontend Permission configs
│   └── package.json
│
├── backend/                  # Django REST Framework Backend Application
│   ├── apps/                 # Django App modules (vehicles, drivers, maintenance, fuel_expenses, reports)
│   ├── core/                 # Shared core utilities, middlewares, and permissions
│   ├── manage.py
│   └── requirements.txt
│
└── README.md
```

---

## 🔐 Role-Based Access Control (RBAC) Matrix

| Module              |       Fleet Manager       |   Safety Officer   |  Financial Analyst  | Dispatcher  |
| :------------------ | :-----------------------: | :----------------: | :-----------------: | :---------: |
| **Dashboard**       |        Full Access        |    Full Access     |      View Only      | Full Access |
| **Vehicles**        |        Full Access        |     No Access      |      View Only      |  View Only  |
| **Drivers**         |        Full Access        | Update Safety Only |      View Only      |  View Only  |
| **Trips**           |        Full Access        |     No Access      |      View Only      | Full Access |
| **Maintenance**     |     Full CRUD + Close     |     View Only      |      View Only      |  No Access  |
| **Fuel & Expenses** |        Full Access        |     No Access      |   Full CRUD (Own)   |  No Access  |
| **Reports**         | Operational + Maintenance |   Safety Reports   | Operational Reports |  No Access  |
| **CSV/PDF Export**  |            Yes            |        Yes         |         Yes         |     No      |

---

## 📦 Key Modules & Implementations

### 1. Maintenance Module

- **Full CRUD Support**: Schedule service with detailed fields (Vehicle, Service Type, Workshop, Mechanic, Cost, Start Date, Expected End Date, Priority, and Status).
- **Vehicle Status Sync**:
  - Starting maintenance or changing status to `Active` automatically transitions the vehicle status to `In Shop`.
  - Closing/completing maintenance restores the vehicle status to `Available` (unless `Retired`).
- **Validations**: Positive costs, required fields, and End Date >= Start Date checks.
- **Table Operations**: Advanced query-based searching, filtering by all statuses, sorting (newest, oldest, cost, vehicle name), and pagination limit parameters (`10`, `25`, `50`, `100`).

### 2. Driver Module (Safety Officer)

- Restricted fields validation: Safety Officers can **only** update License Number, License Category, Expiry Date, Safety Score, and Operational Status. Driver name, contact details, and ID are locked.
- Expiry date verification (must be a future date).

### 3. Reports & Exports

- **Operational Reports**: Fuel efficiency trends, trip completion stats, and Vehicle ROI tables.
- **Safety Reports**: Safety index trends, expired licenses audits, compliant vs suspended drivers counts.
- **Maintenance Reports**: Service costs trends, service type distribution charts, and vehicles in shop indices.
- **Exports Engine**: Custom downloads streaming auto-generated reports in **CSV** and **PDF** formats with authorized JWT credentials.

---

## 🔌 Core API Routes

### Authentication

- `POST /api/v1/login/`
- `POST /api/v1/logout/`
- `POST /api/v1/token/refresh/`

### Vehicles

- `GET/POST /api/v1/vehicles/`
- `GET/PUT/PATCH/DELETE /api/v1/vehicles/{id}/`

### Drivers

- `GET/POST /api/v1/drivers/`
- `GET/PUT/PATCH/DELETE /api/v1/drivers/{id}/`

### Trips

- `GET/POST /api/v1/trips/`
- `GET/PUT/PATCH/DELETE /api/v1/trips/{id}/`
- `POST /api/v1/trips/{id}/dispatch/`
- `POST /api/v1/trips/{id}/complete/`
- `POST /api/v1/trips/{id}/cancel/`

### Maintenance

- `GET/POST /api/v1/maintenance/`
- `GET/PUT/PATCH/DELETE /api/v1/maintenance/{id}/`
- `POST/PATCH /api/v1/maintenance/{id}/close/`

### Reports & Exports

- `GET /api/v1/reports/maintenance/`
- `GET /api/v1/reports/safety/`
- `GET /api/v1/reports/export/maintenance/csv/`
- `GET /api/v1/reports/export/maintenance/pdf/`

---

## 🛠️ Installation & Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- MySQL Server

### Backend Setup

1. Navigate to the `backend/` directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run database migrations:
   ```bash
   python manage.py makemigrations
   python manage.py migrate
   ```
4. Seed demo accounts and data:
   ```bash
   python manage.py seed_db
   ```
5. Run server:
   ```bash
   python manage.py runserver
   ```

### Frontend Setup

1. Navigate to the `TransitOps-frontend/` directory:
   ```bash
   cd TransitOps-frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run development server:
   ```bash
   npm run dev
   ```

---

## 👥 Team Member

- **Om Solanki**
- **Ashish Kalsara**
