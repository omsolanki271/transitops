# TransitOps – Smart Transport Operations Platform
<<<<<<< HEAD

## System Analysis & Architecture Document

=======
## System Analysis & Architecture Document
>>>>>>> bb0a846d502fc10570879c4a0c688f596898c666
Prepared for: Ashish (Backend) & Om (Frontend) — Odoo Hackathon (8-hour build)

> **Assumptions flagged up front** (I don't have access to your `public/ui-design/` Stitch images, your live repo folder tree, or the Excalidraw board — it's a live collaborative link, not a static file). Everything below is derived from the written problem statement. Where I had to make a judgment call, it's marked **[ASSUMPTION]**. Both devs should sanity-check these against the actual Stitch screens before building.

---

## 1. Overall Architecture

Two independently developed, loosely-coupled applications integrated through a versioned REST API contract:

```
┌─────────────────────────┐        REST/JSON over HTTPS        ┌──────────────────────────┐
│   Frontend (React+Vite)  │  <───────────────────────────────>  │  Backend (Django + DRF)  │
│   Tailwind CSS            │        JWT Bearer Auth             │  MySQL 8.0 (Workbench)   │
└─────────────────────────┘                                     └──────────────────────────┘
```

- **Style**: Client-Server, stateless REST API, token-based auth (JWT).
- **Backend** exposes a versioned API (`/api/v1/...`); frontend never talks to the DB directly.
- **No shared codebase** — the only shared artifact is the **API Contract** (Section 15–17, 28) that both devs commit to before writing code.
- **Single source of truth for state transitions is the backend.** The frontend never computes status transitions (On Trip, In Shop, etc.) — it only calls endpoints and renders whatever the backend returns. This is the #1 rule preventing integration mismatches.

---

## 2. Folder Structure

### Backend (`transitops-backend/`)
<<<<<<< HEAD

=======
>>>>>>> bb0a846d502fc10570879c4a0c688f596898c666
```
transitops-backend/
├── config/                        # Django project (settings, root urls, wsgi/asgi)
│   ├── settings/
│   │   ├── base.py
│   │   ├── dev.py
│   │   └── prod.py
│   ├── urls.py
│   └── wsgi.py
├── apps/
│   ├── users/                     # custom user model, roles, auth
│   ├── vehicles/
│   ├── drivers/
│   ├── trips/
│   ├── maintenance/
│   ├── fuel_expenses/
│   ├── dashboard/                 # KPI aggregation endpoints
│   └── reports/                   # analytics + CSV/PDF export
├── core/                          # shared utilities across apps
│   ├── permissions.py             # RBAC permission classes
│   ├── pagination.py
│   ├── response.py                # standard response envelope helper
│   ├── exceptions.py              # global exception handler
│   └── validators.py
├── manage.py
├── requirements.txt
└── .env.example
```
<<<<<<< HEAD

Each app under `apps/` follows Django's standard internal layout: `models.py`, `serializers.py`, `views.py`, `urls.py`, `permissions.py`, `services.py` (business-rule logic lives here, not in views), `tests/`.

### Frontend (`transitops-frontend/`)

=======
Each app under `apps/` follows Django's standard internal layout: `models.py`, `serializers.py`, `views.py`, `urls.py`, `permissions.py`, `services.py` (business-rule logic lives here, not in views), `tests/`.

### Frontend (`transitops-frontend/`)
>>>>>>> bb0a846d502fc10570879c4a0c688f596898c666
```
transitops-frontend/
├── public/
│   └── ui-design/                 # Stitch reference images ONLY — never imported into the app
├── src/
│   ├── api/                       # axios instance + one file per resource (vehicles.api.js, trips.api.js...)
│   ├── assets/
│   ├── components/
│   │   ├── common/                 # Button, Modal, Table, StatusBadge, KPICard...
│   │   └── layout/                 # Sidebar, Topbar, ProtectedRoute
│   ├── features/                   # one folder per domain, mirrors backend apps
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── vehicles/
│   │   ├── drivers/
│   │   ├── trips/
│   │   ├── maintenance/
│   │   ├── fuel-expenses/
│   │   └── reports/
│   ├── hooks/
│   ├── context/                    # AuthContext / RoleContext
│   ├── routes/                     # route definitions + role guards
│   ├── utils/
│   ├── App.jsx
│   └── main.jsx
├── tailwind.config.js
└── vite.config.js
```
<<<<<<< HEAD

=======
>>>>>>> bb0a846d502fc10570879c4a0c688f596898c666
Each folder inside `features/` contains: `pages/`, `components/`, and (optionally) a `hooks.js`/`api.js` local to that feature.

---

## 3. Modules

<<<<<<< HEAD
| Module              | Backend App     | Frontend Feature |
| ------------------- | --------------- | ---------------- |
| Auth & RBAC         | `users`         | `auth`           |
| Dashboard/KPIs      | `dashboard`     | `dashboard`      |
| Vehicle Registry    | `vehicles`      | `vehicles`       |
| Driver Management   | `drivers`       | `drivers`        |
| Trip Management     | `trips`         | `trips`          |
| Maintenance         | `maintenance`   | `maintenance`    |
| Fuel & Expense      | `fuel_expenses` | `fuel-expenses`  |
| Reports & Analytics | `reports`       | `reports`        |
=======
| Module | Backend App | Frontend Feature |
|---|---|---|
| Auth & RBAC | `users` | `auth` |
| Dashboard/KPIs | `dashboard` | `dashboard` |
| Vehicle Registry | `vehicles` | `vehicles` |
| Driver Management | `drivers` | `drivers` |
| Trip Management | `trips` | `trips` |
| Maintenance | `maintenance` | `maintenance` |
| Fuel & Expense | `fuel_expenses` | `fuel-expenses` |
| Reports & Analytics | `reports` | `reports` |
>>>>>>> bb0a846d502fc10570879c4a0c688f596898c666

---

## 4. Database Design (MySQL 8.0)

**`users`**
<<<<<<< HEAD

- id (PK), email (unique), password (hashed), full_name, role (FK → roles or choice field — see §9), phone, is_active, date_joined

**`roles`** _(if using a table instead of a choice field — recommended for RBAC extensibility)_

- id, name (`fleet_manager`, `driver`, `safety_officer`, `financial_analyst`), description

**`vehicles`**

- id (PK), registration_number (unique, indexed), name_model, vehicle_type, max_load_capacity (decimal, kg), odometer (decimal, km), acquisition_cost (decimal), status (`available|on_trip|in_shop|retired`), region _(for dashboard filter — [ASSUMPTION], not explicitly in field list but required by §2 Dashboard filters)_, created_at, updated_at

**`drivers`**

- id (PK), user_id (FK → users, nullable — [ASSUMPTION]: a driver may or may not have login access), name, license_number (unique), license_category, license_expiry_date, contact_number, safety_score (int/decimal), status (`available|on_trip|off_duty|suspended`), created_at, updated_at

**`trips`**

- id (PK), source, destination, vehicle_id (FK), driver_id (FK), cargo_weight (decimal), planned_distance (decimal), actual_distance (decimal, nullable), final_odometer (decimal, nullable), fuel_consumed (decimal, nullable), status (`draft|dispatched|completed|cancelled`), created_by (FK → users), dispatched_at, completed_at, cancelled_at, created_at, updated_at

**`maintenance_logs`**

- id (PK), vehicle_id (FK), maintenance_type (e.g. Oil Change), description, cost (decimal), status (`active|closed`), started_at, closed_at (nullable), created_by, created_at, updated_at

**`fuel_logs`**

- id (PK), vehicle_id (FK), trip_id (FK, nullable), liters (decimal), cost (decimal), log_date, created_at

**`expenses`**

- id (PK), vehicle_id (FK), expense_type (`toll|maintenance|other`), amount (decimal), expense_date, description, created_at

**`documents`** _(bonus feature — vehicle document management)_

=======
- id (PK), email (unique), password (hashed), full_name, role (FK → roles or choice field — see §9), phone, is_active, date_joined

**`roles`** *(if using a table instead of a choice field — recommended for RBAC extensibility)*
- id, name (`fleet_manager`, `driver`, `safety_officer`, `financial_analyst`), description

**`vehicles`**
- id (PK), registration_number (unique, indexed), name_model, vehicle_type, max_load_capacity (decimal, kg), odometer (decimal, km), acquisition_cost (decimal), status (`available|on_trip|in_shop|retired`), region *(for dashboard filter — [ASSUMPTION], not explicitly in field list but required by §2 Dashboard filters)*, created_at, updated_at

**`drivers`**
- id (PK), user_id (FK → users, nullable — [ASSUMPTION]: a driver may or may not have login access), name, license_number (unique), license_category, license_expiry_date, contact_number, safety_score (int/decimal), status (`available|on_trip|off_duty|suspended`), created_at, updated_at

**`trips`**
- id (PK), source, destination, vehicle_id (FK), driver_id (FK), cargo_weight (decimal), planned_distance (decimal), actual_distance (decimal, nullable), final_odometer (decimal, nullable), fuel_consumed (decimal, nullable), status (`draft|dispatched|completed|cancelled`), created_by (FK → users), dispatched_at, completed_at, cancelled_at, created_at, updated_at

**`maintenance_logs`**
- id (PK), vehicle_id (FK), maintenance_type (e.g. Oil Change), description, cost (decimal), status (`active|closed`), started_at, closed_at (nullable), created_by, created_at, updated_at

**`fuel_logs`**
- id (PK), vehicle_id (FK), trip_id (FK, nullable), liters (decimal), cost (decimal), log_date, created_at

**`expenses`**
- id (PK), vehicle_id (FK), expense_type (`toll|maintenance|other`), amount (decimal), expense_date, description, created_at

**`documents`** *(bonus feature — vehicle document management)*
>>>>>>> bb0a846d502fc10570879c4a0c688f596898c666
- id (PK), vehicle_id (FK), document_type, file, expiry_date (nullable), uploaded_at

---

## 5. Relationships

<<<<<<< HEAD
- `User` 1—1 `Driver` (optional; a driver _may_ be a login user, or may be a records-only profile — confirm role model with team) **[ASSUMPTION]**
=======
- `User` 1—1 `Driver` (optional; a driver *may* be a login user, or may be a records-only profile — confirm role model with team) **[ASSUMPTION]**
>>>>>>> bb0a846d502fc10570879c4a0c688f596898c666
- `Vehicle` 1—N `Trip`
- `Driver` 1—N `Trip`
- `Vehicle` 1—N `MaintenanceLog`
- `Vehicle` 1—N `FuelLog`
- `Trip` 1—N `FuelLog` (optional link — fuel can be logged per-trip or standalone)
- `Vehicle` 1—N `Expense`
- `Vehicle` 1—N `Document`

All FKs use `on_delete=PROTECT` (never CASCADE) — operational history must never silently disappear if a vehicle/driver record is removed. Use soft-delete (`is_active`/`status=retired`) instead of hard delete for Vehicles and Drivers.

---

## 6. API Strategy

- REST, resource-oriented, versioned under `/api/v1/`.
- Django REST Framework `ModelViewSet` per resource for standard CRUD + custom `@action` endpoints for state-transition operations (dispatch, complete, cancel, close-maintenance) — **these are POST actions, not raw PATCH-the-status-field**, so the backend fully controls business-rule enforcement.
- Filtering via query params (`?status=available&vehicle_type=truck&region=west`).
- Pagination: page-number based, default page size 20, DRF `PageNumberPagination`.
- All list endpoints support `?search=` and `?ordering=`.

---

## 7. Authentication Flow

1. `POST /api/v1/auth/login/` with email + password → returns `access` + `refresh` JWT and the `user` object (id, name, email, role).
2. Frontend stores `access` token in memory + `refresh` in httpOnly-cookie-equivalent handling **[ASSUMPTION: since this is a hackathon SPA without a BFF, store tokens in memory/localStorage with the known XSS tradeoff — acceptable for hackathon scope, call this out as a follow-up hardening item]**.
3. Every subsequent request sends `Authorization: Bearer <access>`.
4. `POST /api/v1/auth/refresh/` to rotate the access token.
5. `POST /api/v1/auth/logout/` blacklists the refresh token.
6. Unauthenticated requests to any protected endpoint → `401` with the standard error envelope (§17).

---

## 8. Authorization Flow (RBAC)

- Role is embedded in the JWT payload and re-validated server-side on every request via a DRF permission class per view (never trust the frontend's role check alone).
- Backend defines one permission class per role capability, e.g. `IsFleetManager`, `IsSafetyOfficer`, `IsFinancialAnalyst`, `CanDispatchTrip`.
- Frontend uses the role only to **hide/show UI** and route-guard — it is a UX convenience, not a security boundary. The backend is the enforcement point.

### Role → Permission Matrix

<<<<<<< HEAD
| Action                        | Fleet Manager | Driver\*       | Safety Officer                | Financial Analyst |
| ----------------------------- | ------------- | -------------- | ----------------------------- | ----------------- |
| Manage Vehicles (CRUD)        | ✅            | ❌             | 👁 read-only                  | 👁 read-only      |
| Manage Drivers (CRUD)         | ✅            | ❌             | ✅ (status/compliance fields) | 👁 read-only      |
| Create/Dispatch/Complete Trip | ✅            | ✅             | 👁 read-only                  | 👁 read-only      |
| Maintenance Logs              | ✅            | ❌             | 👁 read-only                  | 👁 read-only      |
| Fuel/Expense Entry            | ✅            | ✅ (own trips) | ❌                            | 👁 read-only      |
| Reports & Analytics           | 👁            | ❌             | 👁 (safety-related)           | ✅ full           |
| Dashboard                     | ✅ all KPIs   | 👁 limited     | 👁 limited                    | 👁 financial KPIs |

_\*Per the problem statement's own wording, "Driver" is described as the role that "creates trips, assigns vehicles and drivers" — this reads like it may actually mean a **Dispatcher/Operations** role rather than the literal truck driver. **[FLAG FOR TEAM]**: confirm this before building RBAC — it materially changes the permission matrix. The matrix above assumes the literal reading from the doc (driver-as-dispatcher) but names it `driver` to match the spec's terminology._
=======
| Action | Fleet Manager | Driver* | Safety Officer | Financial Analyst |
|---|---|---|---|---|
| Manage Vehicles (CRUD) | ✅ | ❌ | 👁 read-only | 👁 read-only |
| Manage Drivers (CRUD) | ✅ | ❌ | ✅ (status/compliance fields) | 👁 read-only |
| Create/Dispatch/Complete Trip | ✅ | ✅ | 👁 read-only | 👁 read-only |
| Maintenance Logs | ✅ | ❌ | 👁 read-only | 👁 read-only |
| Fuel/Expense Entry | ✅ | ✅ (own trips) | ❌ | 👁 read-only |
| Reports & Analytics | 👁 | ❌ | 👁 (safety-related) | ✅ full |
| Dashboard | ✅ all KPIs | 👁 limited | 👁 limited | 👁 financial KPIs |

*\*Per the problem statement's own wording, "Driver" is described as the role that "creates trips, assigns vehicles and drivers" — this reads like it may actually mean a **Dispatcher/Operations** role rather than the literal truck driver. **[FLAG FOR TEAM]**: confirm this before building RBAC — it materially changes the permission matrix. The matrix above assumes the literal reading from the doc (driver-as-dispatcher) but names it `driver` to match the spec's terminology.*
>>>>>>> bb0a846d502fc10570879c4a0c688f596898c666

---

## 9. User Roles

Fixed enum, seeded via Django migration/fixture, **not** user-editable at runtime:
`fleet_manager`, `driver`, `safety_officer`, `financial_analyst`

Stored as a `CharField` with `choices` on the `User` model (simpler than a separate `roles` table for an 8-hour hackathon) — **[DECISION]**: use a choice field, not a M2M roles table, to keep scope tight. Document this so nobody builds the other way.

---

## 10. Feature Breakdown

1. **Auth** — login, JWT refresh, logout, "who am I" endpoint.
2. **Dashboard** — KPI cards (Active Vehicles, Available Vehicles, In Maintenance, Active Trips, Pending Trips, Drivers On Duty, Fleet Utilization %) + filters (vehicle type, status, region).
3. **Vehicle Registry** — CRUD, unique reg number validation, status lifecycle, document uploads (bonus).
4. **Driver Management** — CRUD, license expiry tracking, safety score, status lifecycle.
5. **Trip Management** — create (Draft), dispatch, complete, cancel; all business-rule validation (§12).
6. **Maintenance** — create/close maintenance log; auto vehicle status side-effects.
7. **Fuel & Expense** — log fuel/tolls/other costs; auto cost rollup per vehicle.
8. **Reports & Analytics** — Fuel Efficiency, Fleet Utilization, Operational Cost, Vehicle ROI; CSV export (mandatory), PDF export (bonus).
9. **Bonus**: email reminders for expiring licenses, dark mode, document management.

---

## 11. Development Order

**Backend (Ashish)**
<<<<<<< HEAD

=======
>>>>>>> bb0a846d502fc10570879c4a0c688f596898c666
1. Project skeleton, settings split, MySQL connection, custom User model + JWT auth
2. RBAC permission classes + role seed data
3. Vehicles app (CRUD + validation)
4. Drivers app (CRUD + validation)
5. Trips app (creation + validation rules) → dispatch/complete/cancel actions with status side-effects
6. Maintenance app (create/close + vehicle status side-effects)
7. Fuel & Expense app + cost rollup logic
8. Dashboard KPI aggregation endpoint
9. Reports endpoints + CSV export
10. Swagger/OpenAPI docs, seed data, polish, error handling audit

**Frontend (Om)**
<<<<<<< HEAD

=======
>>>>>>> bb0a846d502fc10570879c4a0c688f596898c666
1. Project skeleton, Tailwind setup, routing, layout shell (sidebar/topbar) from Stitch designs
2. Auth pages (login) + protected routes + role-based nav
3. Dashboard page (KPI cards + filters) — build against **mocked** API responses matching the contract (§28) until backend endpoints are live
4. Vehicle Registry pages (list/create/edit)
5. Driver Management pages
6. Trip Management pages (create/dispatch/complete/cancel flows)
7. Maintenance pages
8. Fuel & Expense pages
9. Reports & Analytics page (charts + CSV export button)
10. Polish: loading/empty/error states, dark mode (bonus), responsiveness pass

Both devs can work in parallel from day one because Section 28 (the API contract) is frozen before coding starts — the frontend builds against a mock matching that contract, the backend builds to satisfy it.

---

## 12. Business Rules (verbatim from spec — these are non-negotiable and backend-enforced)

- Vehicle registration number must be unique.
- Retired or In Shop vehicles must never appear in dispatch selection.
- Drivers with expired licenses or Suspended status cannot be assigned to trips.
- A driver or vehicle already marked On Trip cannot be assigned to another trip.
- Cargo Weight must not exceed the vehicle's maximum load capacity.
- Dispatching a trip → vehicle & driver status both become On Trip.
- Completing a trip → vehicle & driver status both return to Available.
- Cancelling a dispatched trip → vehicle & driver restored to Available.
- Creating an active maintenance record → vehicle status becomes In Shop.
- Closing maintenance → vehicle restored to Available (unless Retired).

All of the above live in **backend service-layer functions** (`apps/trips/services.py`, `apps/maintenance/services.py`), never in serializers or views directly — this keeps them unit-testable and keeps views thin.

---

## 13. Validation Rules

- Email format + uniqueness for `users`.
- `registration_number` unique, required, non-empty.
- `license_number` unique per driver.
- `license_expiry_date` must be a future date at creation time for the driver to be assignable (checked at assignment time, not just creation, since time passes).
- `cargo_weight` > 0 and ≤ vehicle's `max_load_capacity`.
- `planned_distance`, `odometer`, all monetary fields ≥ 0.
- Status fields restricted to their defined enum values only — reject anything else with `400`.
- Trip status transitions only allowed along the defined path: `Draft → Dispatched → Completed`, or `Dispatched → Cancelled`. Any other transition → `409 Conflict`.

---

## 14. Shared Data Models (the contract both devs must agree on byte-for-byte)

Enums (use these exact string values on both ends — case-sensitive):
<<<<<<< HEAD

=======
>>>>>>> bb0a846d502fc10570879c4a0c688f596898c666
- Vehicle status: `available`, `on_trip`, `in_shop`, `retired`
- Driver status: `available`, `on_trip`, `off_duty`, `suspended`
- Trip status: `draft`, `dispatched`, `completed`, `cancelled`
- Maintenance status: `active`, `closed`
- Expense type: `toll`, `maintenance`, `other`
- Roles: `fleet_manager`, `driver`, `safety_officer`, `financial_analyst`

All dates: ISO-8601 (`YYYY-MM-DD`), all datetimes: ISO-8601 with timezone (`YYYY-MM-DDTHH:MM:SSZ`). All money/decimal fields: JSON numbers with 2 decimal places, never strings.

---

## 15. API Naming Convention

- Plural, kebab-free (snake not used in URLs — use plural nouns): `/api/v1/vehicles/`, `/api/v1/drivers/`, `/api/v1/trips/`, `/api/v1/maintenance-logs/`, `/api/v1/fuel-logs/`, `/api/v1/expenses/`, `/api/v1/reports/`, `/api/v1/dashboard/summary/`
- Nested resource style avoided in favor of query params (`?vehicle=12`) rather than `/vehicles/12/trips/`, to keep routing simple for both devs.
- Custom actions as verbs on the resource: `POST /api/v1/trips/{id}/dispatch/`, `POST /api/v1/trips/{id}/complete/`, `POST /api/v1/trips/{id}/cancel/`, `POST /api/v1/maintenance-logs/{id}/close/`.
- JSON field names: `snake_case` everywhere (matches Python/Django convention; frontend maps this at the API layer, not by renaming the whole app to snake_case).

---

## 16. Response Format (standard envelope — used on every endpoint)

Success:
<<<<<<< HEAD

=======
>>>>>>> bb0a846d502fc10570879c4a0c688f596898c666
```json
{
  "success": true,
  "data": { ... } ,
  "meta": { "page": 1, "page_size": 20, "total": 57 }
}
```
<<<<<<< HEAD

`meta` only present on list endpoints.

Error:

=======
`meta` only present on list endpoints.

Error:
>>>>>>> bb0a846d502fc10570879c4a0c688f596898c666
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Cargo weight exceeds vehicle maximum load capacity.",
    "fields": { "cargo_weight": ["Must not exceed 500 kg."] }
  }
}
```

---

## 17. Error Handling Strategy

- Global DRF exception handler (`core/exceptions.py`) wraps all errors into the envelope above.
- HTTP status codes used meaningfully: `400` validation, `401` unauthenticated, `403` forbidden (role), `404` not found, `409` invalid state transition (e.g. dispatching an already-dispatched trip), `500` unexpected (never leaks stack traces in prod).
- Frontend has one central axios interceptor that reads `error.code`/`error.message` and renders a toast — no per-page bespoke error parsing.

---

## 18. Coding Standards

**Backend**: PEP8, Black formatting, isort, type hints on service-layer functions, docstrings on all service functions and custom actions. No business logic in views/serializers — views orchestrate, serializers validate shape, services own rules.

**Frontend**: ESLint + Prettier, functional components + hooks only, no class components, Tailwind utility classes only (no inline styles), one component = one file, props typed via JSDoc or PropTypes.

---

## 19. Git Workflow

- Two separate repositories (recommended) or two top-level folders in a monorepo with independent CI — either is fine since devs never touch each other's code.
- Conventional Commits: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`, `test:`.
- PRs (even solo) should reference the module, e.g. `feat(trips): add dispatch action with status side-effects`.

---

## 20. Branch Strategy

- `main` — always demo-able.
- `dev` — integration branch.
- `feature/<module-name>` — e.g. `feature/vehicle-registry`, `feature/trip-dispatch`.
- Given the 8-hour window, keep it lightweight: commit directly to `dev` per feature, merge to `main` at agreed checkpoints (e.g. hour 4 and hour 7) for integration testing.

---

## 21. Folder Naming Convention

- Backend: `snake_case` for all Python packages/modules (`fuel_expenses`, not `fuelExpenses`).
- Frontend: `kebab-case` for feature folders (`fuel-expenses`), `PascalCase` for component files (`VehicleForm.jsx`), `camelCase` for utility/hook files (`useAuth.js`).

---

## 22. File Naming Convention

- Backend: `models.py`, `serializers.py`, `views.py`, `urls.py`, `services.py`, `permissions.py` — identical filenames across every app, so anyone can navigate any app the same way.
- Frontend: `VehicleListPage.jsx`, `VehicleForm.jsx`, `vehicles.api.js`, `useVehicles.js` — resource name prefixes every file so grep/search is predictable.

---

## 23. Component Naming Convention

- `PascalCase` for all React components, named exactly after what they render: `KPICard`, `StatusBadge`, `TripDispatchModal`, `VehicleTable`.
- Reusable primitives live in `components/common/`; anything domain-specific lives inside its `features/<domain>/components/` folder — never the reverse.

---

## 24. REST API Guidelines

- One resource per ViewSet, DRF routers for standard CRUD, explicit `@action(detail=True, methods=["post"])` for state transitions.
- `GET` never mutates state. All mutating state-transition endpoints are `POST`.
- Idempotency: dispatching an already-dispatched trip returns `409`, not a silent no-op and not a duplicate side-effect.
- Every list endpoint is paginated by default — no unbounded result sets.

---

## 25. Future Scalability

- Role model as a table (not a choice field) if roles need to become dynamic/configurable post-hackathon.
- Move JWT storage to httpOnly cookies + a lightweight BFF if this graduates past hackathon/demo stage.
- Add a `regions` table if multi-tenant/multi-branch fleets are needed.
- Introduce Celery + a message broker for the license-expiry email reminders (bonus feature) rather than a synchronous cron-in-request hack.
- Reports module is structured to add PDF export (WeasyPrint/ReportLab) without touching CSV logic — keep export format as a strategy-pattern function, not baked into the view.

---

## 26. Security Considerations

- Passwords hashed via Django's default PBKDF2 (or Argon2 if `django-argon2` is available in time).
- Rate-limit the login endpoint (DRF throttling) to blunt brute force.
- All endpoints require authentication except `/auth/login/` and `/auth/refresh/`.
- Role checks enforced server-side on every mutating endpoint — never rely on the frontend hiding a button.
- CORS restricted to the known frontend origin(s) only, not `*`.
- File uploads (documents, bonus) validated by MIME type and size limit.

---

## 27. Integration Strategy

- Section 28's contract is frozen **before** either dev writes a line of feature code.
- Backend stands up a Swagger/OpenAPI page (`drf-spectacular` or `drf-yasg`) at `/api/docs/` from day one so the frontend can self-serve exact request/response shapes without pinging Ashish constantly.
- Frontend uses a mock-data layer (matching the exact contract shape) so it can be built and demoed even if the backend endpoint for a given feature isn't live yet — swapping mock → real is a one-line change in `src/api/`.
- A shared checkpoint at roughly the midpoint of the hackathon where both devs plug the real backend into the real frontend and fix mismatches together, rather than discovering them at the very end.

---

## 28. Frontend–Backend Communication Contract (the non-negotiable core)

- Base URL: `/api/v1/`
- Auth header: `Authorization: Bearer <token>` on every request except login/refresh.
- Content-Type: `application/json` for all requests except file uploads (`multipart/form-data`).
- Response envelope: exactly as defined in §16, on every single endpoint, success or error — no exceptions, no raw DRF default error bodies leaking through.
- Enum values: exactly as defined in §14 — lowercase, snake_case, never renamed or reformatted on either side.
- Status-changing actions are dedicated POST endpoints (`/trips/{id}/dispatch/`), never a raw `PATCH {"status": "dispatched"}` — this is what guarantees business rules can't be bypassed by the frontend sending an arbitrary status value.
- Pagination shape: `meta.page`, `meta.page_size`, `meta.total` — frontend table components read these exact keys.

---

## 29. Things Both Developers Must Never Change Unilaterally

- Any enum value/spelling in §14.
- The response envelope shape in §16.
- Any URL path/verb in §15 (adding a new endpoint is fine; renaming/moving an existing one requires syncing with the other dev first).
- Role names/permission boundaries in §8–9.
- Field names on any shared model (vehicle, driver, trip, maintenance, fuel log, expense) — add fields, don't rename/remove without agreement.
- The Trip status transition graph in §13.

If a change to any of the above is genuinely needed mid-hackathon, it gets a 2-minute sync between Ashish and Om before either touches code — never a silent one-sided change.

---

## 30. Risk Analysis

<<<<<<< HEAD
| Risk                                                                    | Impact                              | Mitigation                                                                                                                              |
| ----------------------------------------------------------------------- | ----------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| API contract drifts because devs work in isolation                      | High — integration fails at the end | Freeze §28 contract before coding; Swagger docs from hour 1; mid-point integration checkpoint                                           |
| "Driver" role ambiguity (dispatcher vs. literal driver)                 | Medium — wrong RBAC built           | Confirm reading with team immediately (§8 flag) before building permissions                                                             |
| Status side-effects implemented differently on frontend vs backend      | High — data corruption              | All status transitions are backend-only dedicated endpoints; frontend never sets status directly                                        |
| 8-hour time budget vs. 30-item scope                                    | High                                | Follow Development Order (§11) strictly; bonus features (PDF export, email reminders, dark mode, doc management) are last and droppable |
| No shared UI reference beyond Stitch images (not machine-readable here) | Medium                              | Om builds directly from the Stitch images in `public/ui-design/`; treat as pixel reference, not literal asset                           |
| MySQL decimal precision mismatches (cost/weight fields)                 | Low-Medium                          | Standardize `DecimalField(max_digits=10, decimal_places=2)` across all money/weight fields, documented in §14                           |
| Over-scoping bonus features and running out of time for mandatory ones  | Medium                              | Mandatory deliverables (§7 of problem statement) always take priority over bonus features                                               |
=======
| Risk | Impact | Mitigation |
|---|---|---|
| API contract drifts because devs work in isolation | High — integration fails at the end | Freeze §28 contract before coding; Swagger docs from hour 1; mid-point integration checkpoint |
| "Driver" role ambiguity (dispatcher vs. literal driver) | Medium — wrong RBAC built | Confirm reading with team immediately (§8 flag) before building permissions |
| Status side-effects implemented differently on frontend vs backend | High — data corruption | All status transitions are backend-only dedicated endpoints; frontend never sets status directly |
| 8-hour time budget vs. 30-item scope | High | Follow Development Order (§11) strictly; bonus features (PDF export, email reminders, dark mode, doc management) are last and droppable |
| No shared UI reference beyond Stitch images (not machine-readable here) | Medium | Om builds directly from the Stitch images in `public/ui-design/`; treat as pixel reference, not literal asset |
| MySQL decimal precision mismatches (cost/weight fields) | Low-Medium | Standardize `DecimalField(max_digits=10, decimal_places=2)` across all money/weight fields, documented in §14 |
| Over-scoping bonus features and running out of time for mandatory ones | Medium | Mandatory deliverables (§7 of problem statement) always take priority over bonus features |
>>>>>>> bb0a846d502fc10570879c4a0c688f596898c666

---

### Summary
<<<<<<< HEAD

=======
>>>>>>> bb0a846d502fc10570879c4a0c688f596898c666
The architecture above gives both developers a single, frozen contract (Sections 14–17, 28–29) to build against independently. Backend owns all business-rule enforcement and state transitions; frontend owns presentation and UX, driven entirely by API responses. Next: the two Master Prompts, one per developer, ready to hand to an AI coding assistant.
