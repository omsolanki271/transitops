# TransitOps Backend - Smart Transport Operations Platform

This is the Python Django REST Framework (DRF) backend for the TransitOps platform. It integrates with MySQL 8.0 on port 3307 and serves as the single source of truth for transport lifecycles, operational KPIs, role permissions (RBAC), and calculations.

---

## Tech Stack

- **Framework**: Python 3.13 + Django 5.x + Django REST Framework 3.15.x
- **Database**: MySQL 8.0 (Workbench compatible, default port 3307)
- **Authentication**: JWT Auth via `djangorestframework-simplejwt`
- **API Documentation**: OpenAPI 3.0 via `drf-spectacular` + Swagger UI
- **CORS**: Enabled via `django-cors-headers`

---

## Directory Structure

```
backend/
├── config/                  # Django project configuration
│   ├── settings/            # Environments: base, dev, prod
│   ├── urls.py              # Root routing table
│   └── wsgi.py              
├── apps/                    # Local apps representing domain modules
│   ├── users/               # Custom User model, login, logout, me endpoints
│   ├── vehicles/            # Vehicle registry & Document uploads (bonus)
│   ├── drivers/             # Driver profile registry & compliance status
│   ├── trips/               # Trip lifecycles (dispatch, complete, cancel actions)
│   ├── maintenance/         # Maintenance log registry (create/close)
│   ├── fuel_expenses/       # Fuel logs and expenses CRUD + cost rollups
│   ├── dashboard/           # Summary KPI calculations
│   └── reports/             # Vehicle Performance ROI, fuel efficiency, CSV exports
├── core/                    # Shared utilities, exception handler, pagination, wrappers
│   ├── permissions.py       # RBAC matrix permission classes
│   ├── response.py          # Envelope wrappers
│   └── exceptions.py        # Global error handlers
├── manage.py
├── requirements.txt
└── .env.example
```

---

## Installation & Setup

### 1. Prerequisites
- Python 3.x installed.
- MySQL 8.0 running on port **3307**.

### 2. Database Creation
Ensure the `transitops` database is created. You can create it in MySQL Workbench or run:
```sql
CREATE DATABASE transitops CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 3. Environment Variables
Copy `.env.example` to `.env` in the root of the `backend/` directory:
```bash
cp .env.example .env
```
Ensure the database credentials are correct:
- `DB_HOST`: `127.0.0.1` or `localhost`
- `DB_PORT`: `3307`
- `DB_USER`: `root`
- `DB_PASSWORD`: `abc123`
- `DB_NAME`: `transitops`

### 4. Dependency Installation
Install required packages using pip:
```bash
pip install -r requirements.txt
```

### 5. Run Database Migrations
Generate initial migration files and run migrations to create the database tables:
```bash
python manage.py makemigrations users vehicles drivers trips maintenance fuel_expenses
python manage.py migrate
```

### 6. Seed the Database
Seed the database with sample data (demo users, vehicles, drivers, trips, maintenance logs, and expenses):
```bash
python manage.py seed_db
```
This creates the following default demo credentials (password for all is `password123`):
- **Fleet Manager**: `fleet@transitops.com`
- **Driver**: `driver@transitops.com`
- **Safety Officer**: `safety@transitops.com`
- **Financial Analyst**: `finance@transitops.com`

### 7. Run the Server
Launch the development server:
```bash
python manage.py runserver
```
The API will be available at `http://127.0.0.1:8000/`.

---

## API Endpoints & Base Route

The versioned API base route is `/api/v1/`.

### Authentication
- `POST /api/v1/auth/login/`: Login with email + password -> returns tokens + user profile.
- `POST /api/v1/auth/refresh/`: Rotate access token.
- `POST /api/v1/auth/logout/`: Blacklist refresh token.
- `GET /api/v1/auth/me/`: Retrieve current user details and role.

### Vehicles
- `GET/POST /api/v1/vehicles/`: List and create vehicles.
- `GET/PUT/DELETE /api/v1/vehicles/{id}/`: Retrieve, edit, and delete vehicles.
- `GET /api/v1/vehicles/available-for-dispatch/`: Dropdown helper excluding retired or in-shop vehicles.

### Drivers
- `GET/POST /api/v1/drivers/`: List and create drivers.
- `GET/PUT/DELETE /api/v1/drivers/{id}/`: Retrieve, edit, and delete drivers.
- `GET /api/v1/drivers/available-for-dispatch/`: Dropdown helper excluding suspended or expired license drivers.

### Trips & Lifecycles (Action-Based Transitions)
- `GET/POST /api/v1/trips/`: List and create trips (initial state is `draft`).
- `POST /api/v1/trips/{id}/dispatch/`: Dispatches trip -> transitions vehicle/driver to `on_trip` status.
- `POST /api/v1/trips/{id}/complete/`: Completes trip -> updates vehicle odometer, restores vehicle/driver status to `available`. (Body: `final_odometer`, `fuel_consumed`, `actual_distance`).
- `POST /api/v1/trips/{id}/cancel/`: Cancels trip -> restores resources to `available` if dispatched.

### Maintenance
- `GET/POST /api/v1/maintenance-logs/`: List and create maintenance logs. Creation automatically puts the vehicle in `in_shop` status.
- `POST /api/v1/maintenance-logs/{id}/close/`: Closes maintenance log and restores vehicle status to `available` (unless retired).

### Fuel & Expenses
- `GET/POST /api/v1/fuel-logs/`: List and create fuel entries.
- `GET/POST /api/v1/expenses/`: List and create expenses (toll, maintenance, other).

### Dashboard KPIs
- `GET /api/v1/dashboard/summary/?vehicle_type=&status=&region=`: Aggregate metrics (active vehicles, fleet utilization percentage, drivers on duty, etc.) with cascaded filters.

### Reports & CSV Export
- `GET /api/v1/reports/performance/`: ROI, operational cost, and fuel efficiency metrics per vehicle.
- `GET /api/v1/reports/export/?format=csv&report=vehicle_performance`: Streams a CSV file attachment. (Options: `vehicle_performance` or `fleet_utilization`).

---

## API Documentation (Swagger)

A self-serve Swagger UI interactive interface is available on:
- **Swagger Documentation URL**: [http://127.0.0.1:8000/api/docs/](http://127.0.0.1:8000/api/docs/)

---

## Running Automated Tests

To verify that all backend validations, state-transition rules, and security checks are operating properly:
```bash
python manage.py test
```
