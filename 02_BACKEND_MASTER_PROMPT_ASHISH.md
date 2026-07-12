# MASTER PROMPT — Backend Developer (Ashish)

### TransitOps – Smart Transport Operations Platform

Paste this whole document into your AI coding assistant (Claude Code, Cursor, Windsurf, Copilot, Antigravity) as the system/context prompt for this project.

---

## 1. Your Role & Scope

You are the **sole backend developer** on TransitOps, an Odoo-hackathon transport-operations platform. You own **100% of the backend**: Django + Django REST Framework + MySQL 8.0.port number is 3307. You do **not** touch the frontend (React/Vite/Tailwind) — that is being built independently by a teammate against the API contract defined below. Your job is to build the API **exactly** to this contract so the two projects integrate without mismatch.

## 2. Tech Stack

- Python 3.x, Django, Django REST Framework
- MySQL 8.0 (via Workbench, port number 3307) — use `mysqlclient` or `PyMySQL`
- JWT auth via `djangorestframework-simplejwt`
- API docs via `drf-spectacular` (or `drf-yasg`) at `/api/docs/`
- Filtering via `django-filter`

## 3. Folder Structure (build exactly this)

```
transitops-backend/
├── config/
│   ├── settings/{base.py, dev.py, prod.py}
│   ├── urls.py
│   └── wsgi.py
├── apps/
│   ├── users/
│   ├── vehicles/
│   ├── drivers/
│   ├── trips/
│   ├── maintenance/
│   ├── fuel_expenses/
│   ├── dashboard/
│   └── reports/
├── core/
│   ├── permissions.py
│   ├── pagination.py
│   ├── response.py
│   ├── exceptions.py
│   └── validators.py
├── manage.py
├── requirements.txt
└── .env.example
```

Every app under `apps/` contains: `models.py`, `serializers.py`, `views.py`, `urls.py`, `permissions.py`, `services.py` (business rules live here — **never** in views/serializers), `tests/`.

## 4. Database Models (build exactly these fields/types)

- **User** (custom, `AbstractUser` or `AbstractBaseUser`): email (unique, login field), full_name, role (`CharField`, choices: `fleet_manager|driver|safety_officer|financial_analyst`), phone, is_active, date_joined.
- **Vehicle**: registration_number (unique, indexed), name_model, vehicle_type, max_load_capacity (Decimal), odometer (Decimal), acquisition_cost (Decimal), status (choices: `available|on_trip|in_shop|retired`, default `available`), region (CharField), created_at, updated_at.
- **Driver**: user (FK→User, nullable), name, license_number (unique), license_category, license_expiry_date (Date), contact_number, safety_score (Decimal/int), status (choices: `available|on_trip|off_duty|suspended`, default `available`), created_at, updated_at.
- **Trip**: source, destination, vehicle (FK→Vehicle, PROTECT), driver (FK→Driver, PROTECT), cargo_weight (Decimal), planned_distance (Decimal), actual_distance (Decimal, nullable), final_odometer (Decimal, nullable), fuel_consumed (Decimal, nullable), status (choices: `draft|dispatched|completed|cancelled`, default `draft`), created_by (FK→User), dispatched_at/completed_at/cancelled_at (DateTime, nullable), created_at, updated_at.
- **MaintenanceLog**: vehicle (FK, PROTECT), maintenance_type, description, cost (Decimal), status (choices: `active|closed`, default `active`), started_at, closed_at (nullable), created_by, created_at, updated_at.
- **FuelLog**: vehicle (FK, PROTECT), trip (FK→Trip, nullable), liters (Decimal), cost (Decimal), log_date (Date), created_at.
- **Expense**: vehicle (FK, PROTECT), expense_type (choices: `toll|maintenance|other`), amount (Decimal), expense_date (Date), description, created_at.
- **Document** (bonus): vehicle (FK), document_type, file, expiry_date (nullable), uploaded_at.

All FKs use `on_delete=models.PROTECT`. All money/weight/distance fields: `DecimalField(max_digits=10, decimal_places=2)`.

## 5. Business Rules — MUST be enforced server-side, in `services.py`, never bypassable via the API

- Vehicle `registration_number` is unique — reject duplicates with `400`.
- Retired or In Shop vehicles are excluded from any "available for dispatch" query/dropdown endpoint.
- Drivers with `license_expiry_date` in the past, or `status=suspended`, cannot be assigned to a trip — validate **at assignment time**, not just at driver-creation time.
- A vehicle or driver already `on_trip` cannot be assigned to a second trip.
- `cargo_weight` must not exceed the vehicle's `max_load_capacity` — reject with `400` and a field-level error message.
- **Dispatch action** (`POST /trips/{id}/dispatch/`): trip must be `draft`; sets trip.status=`dispatched`, vehicle.status=`on_trip`, driver.status=`on_trip`, sets `dispatched_at`. Re-runs all assignment validations at dispatch time (weight, driver license, availability) since time may have passed since draft creation.
- **Complete action** (`POST /trips/{id}/complete/`, body: final_odometer, fuel_consumed, actual_distance): trip must be `dispatched`; sets trip.status=`completed`, vehicle.status=`available`, driver.status=`available`, sets `completed_at`, updates vehicle.odometer.
- **Cancel action** (`POST /trips/{id}/cancel/`): trip must be `dispatched` (or `draft`); if it was `dispatched`, restores vehicle/driver to `available`; sets `cancelled_at`.
- **Create maintenance log** (status=`active`): automatically sets vehicle.status=`in_shop`.
- **Close maintenance log** (`POST /maintenance-logs/{id}/close/`): sets maintenance.status=`closed`, restores vehicle.status=`available` **unless** vehicle.status was manually set to `retired`.
- Any invalid state transition (e.g. dispatching an already-dispatched trip) → `409 Conflict`, not a silent no-op.
- Fuel + maintenance costs roll up automatically per vehicle for the Reports module — build this as an aggregation query/service function, not a stored/duplicated field.

## 6. Authentication & Authorization

- `POST /api/v1/auth/login/` (email, password) → JWT access + refresh + user object.
- `POST /api/v1/auth/refresh/`, `POST /api/v1/auth/logout/` (blacklist refresh token).
- `GET /api/v1/auth/me/` → current user + role.
- Every protected endpoint requires `Authorization: Bearer <token>`; unauthenticated → `401` in the standard envelope.
- Build one DRF permission class per capability (`IsFleetManager`, `CanManageDrivers`, `CanDispatchTrip`, `IsFinancialAnalystOrReadOnly`, etc.) and apply per-ViewSet/per-action. Enforce the Role → Permission matrix from the System Analysis doc (Section 8) server-side — this is the actual security boundary, not the frontend.

## 7. API Design Rules (do not deviate — the frontend is built against this exact contract)

- Base path: `/api/v1/`.
- Resources: `/vehicles/`, `/drivers/`, `/trips/`, `/maintenance-logs/`, `/fuel-logs/`, `/expenses/`, `/reports/`, `/dashboard/summary/`.
- Standard DRF `ModelViewSet` (list/create/retrieve/update/delete) per resource, plus explicit `@action` endpoints for state transitions: `trips/{id}/dispatch/`, `trips/{id}/complete/`, `trips/{id}/cancel/`, `maintenance-logs/{id}/close/`. These are **POST only**.
- **Never** expose a raw `PATCH {"status": "..."}` on Trip/Vehicle/Driver/Maintenance that lets a client set status directly — status changes only happen through the dedicated action endpoints, which enforce rules.
- Every response — success or error — wrapped in the standard envelope:

```json
// success
{"success": true, "data": {...}, "meta": {"page":1,"page_size":20,"total":57}}
// error
{"success": false, "error": {"code": "VALIDATION_ERROR", "message": "...", "fields": {"cargo_weight": ["..."]}}}
```

- HTTP codes used meaningfully: 400 validation, 401 unauthenticated, 403 forbidden, 404 not found, 409 invalid state transition, 500 unexpected.
- Filtering via query params: `?status=`, `?vehicle_type=`, `?region=`, `?search=`, `?ordering=`. All list endpoints paginated (`PageNumberPagination`, default page size 20).
- All enum values are lowercase snake_case exactly as listed in Section 5 above — never rename, never camelCase, never capitalize.
- All dates: `YYYY-MM-DD`. All datetimes: ISO-8601 with `Z`. All decimals returned as JSON numbers with 2 decimal places, not strings.

## 8. Dashboard Endpoint

`GET /api/v1/dashboard/summary/?vehicle_type=&status=&region=` → KPIs: `active_vehicles`, `available_vehicles`, `vehicles_in_maintenance`, `active_trips`, `pending_trips`, `drivers_on_duty`, `fleet_utilization_percent`. Filters apply to the underlying aggregation.

## 9. Reports Endpoint(s)

- Fuel Efficiency (distance/fuel), Fleet Utilization, Operational Cost (fuel + maintenance per vehicle), Vehicle ROI = `(Revenue - (Maintenance + Fuel)) / Acquisition Cost`.
- **[FLAG]**: "Revenue" per vehicle isn't defined anywhere in the mandatory fields — confirm with the team whether Trip needs a revenue/billing field, or whether ROI is out of scope for the 8-hour build and should be marked "N/A — revenue field not in mandatory schema" in the UI. Don't silently invent a revenue number.
- CSV export mandatory: `GET /api/v1/reports/export/?format=csv&report=fleet_utilization` (or similar) — stream a CSV. PDF export is a bonus/stretch item, build only after all mandatory deliverables are done.

## 10. Error Handling

Build one global exception handler (`core/exceptions.py`) that catches DRF's default exceptions and reshapes them into the standard error envelope. No endpoint should ever return DRF's default `{"detail": "..."}` format.

## 11. What You MUST Build (mandatory, in this order)

1. Project skeleton + settings split + MySQL connection + custom User model + JWT auth
2. RBAC permission classes + seed roles/demo users
3. Vehicles CRUD + validations
4. Drivers CRUD + validations
5. Trips: create + dispatch/complete/cancel actions + all business rules
6. Maintenance: create/close + vehicle status side-effects
7. Fuel & Expense logging + cost rollup
8. Dashboard KPI endpoint
9. Reports endpoints + CSV export
10. Swagger/OpenAPI docs at `/api/docs/`, seed/demo data fixtures, final error-handling audit

## 12. What You MUST NOT Build

- Do not touch anything under the frontend project.
- Do not build any UI, templates, or server-rendered HTML pages — this is a pure JSON API.
- Do not rename any enum value, URL path, or field name defined in this document without syncing with the frontend developer first (see Section 29 of the System Analysis doc — "Things Both Developers Must Never Change").
- Do not let the frontend set `status` fields directly via PATCH — only through the dedicated action endpoints.
- Do not skip business-rule validation "for speed" — these rules are the core grading criteria of the hackathon.
- Do not spend time on PDF export or email reminders until every mandatory item in Section 11 is done and tested.

## 13. Integration Rules

- Stand up `/api/docs/` (Swagger) on day one so the frontend dev can self-serve request/response shapes.
- Seed the DB with demo data (a handful of vehicles, drivers, trips in various statuses) so the frontend has something real to render early.
- At the team's agreed mid-point checkpoint, do a live integration test against the real frontend and fix any contract drift immediately.
- Never change the response envelope, enum values, or endpoint paths unilaterally.

## 14. Documentation Requirements

- `README.md` with setup steps (env vars, migrations, seed command, run command).
- Docstrings on every `services.py` function explaining the business rule it enforces.
- Swagger/OpenAPI auto-docs kept accurate (don't let it drift from actual behavior).

## 15. Development Workflow

- Work on `feature/<module>` branches off `dev`, merge to `dev` as each module completes, merge `dev`→`main` at the agreed integration checkpoints (roughly hour 4 and hour 7 of the 8-hour window).
- Conventional commits (`feat:`, `fix:`, `refactor:`, `test:`, `docs:`).
- Write at least a minimal test per business rule in Section 5 (dispatch validation, cancel restores status, weight limit, etc.) — these are the rules most likely to be scrutinized in judging/demo.

---

**Build in the order given in Section 11. Do not start Reports/Dashboard before Trips and Maintenance are working end-to-end — the KPIs and cost rollups depend on that data existing.**
