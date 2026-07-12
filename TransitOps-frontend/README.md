# TransitOps – Smart Transport Operations Platform Frontend

This is the React + Vite + Tailwind CSS frontend application for the TransitOps transport operations platform.

## Features Included

1. **Authentication**: Complete login flow with role-based navigation.
2. **Dashboard**: 12 KPI metric cards, filters (by status, region, vehicle type), and operational charts.
3. **Vehicle Registry**: Searchable & sortable directory listing with creation and edit modal forms.
4. **Driver Management**: Roster list, safety compliance alerts, and license expiry warnings.
5. **Trip Management**: Trip status workflows (Dispatch, Complete, Cancel) with cargo weight validation.
6. **Maintenance Logs**: Vehicle service logs with interactive closing capabilities.
7. **Fuel & Expense Logging**: Auditing tabs for fuel refills, tolls, and per-vehicle operational costs.
8. **Reports & Analytics**: Visual charts for fuel efficiency, ROI, and CSV dataset exporter.
9. **Standalone Mock Database**: Direct state persistence to `localStorage` for offline testing.

---

## Getting Started

### 1. Installation

Install all node dependencies:
```bash
npm install
```

### 2. Environment Configurations

Create a `.env` file in the root directory to customize configuration flags:
```env
# Set to false to connect to the live Django backend API instead of mock database
VITE_USE_MOCK=true

# Django REST Framework backend API endpoint base URL
VITE_API_BASE_URL=http://localhost:8000/api/v1/
```

### 3. Running Development Server

Start the local development server:
```bash
npm run dev
```

---

## User Roles Demo Credentials

To test specific views and access rights, use these quick-fill email shortcuts on the login screen (with any password):

*   **Fleet Manager**: `manager@transitops.com` (Full Access)
*   **Driver / Dispatcher**: `driver@transitops.com` (Trips & Expenses)
*   **Safety Officer**: `safety@transitops.com` (Vehicles, Drivers, Trips, Maintenance, Reports - Read Only/Compliance)
*   **Financial Analyst**: `finance@transitops.com` (Vehicles, Drivers, Trips, Maintenance, Expenses, Reports - Read Only/ROI)
