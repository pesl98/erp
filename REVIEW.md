# ERP v0.1 — Code Review & Roadmap

> Review authored alongside the v0.1 release. Covers architecture quality, what works well, bugs fixed before release, and a prioritised roadmap for v0.2 and beyond.

---

## Overall Assessment

This is a **solid, production-leaning foundation** for a full-stack ERP. The technology choices are modern and well-matched to the problem domain: FastAPI with async SQLAlchemy on the backend, React 18 + TypeScript + Ant Design on the frontend, PostgreSQL for persistence, and Docker Compose for local orchestration. The code is clean, consistently structured, and meaningfully covers the core ERP workflows (products, vendors, purchasing, goods receipts, warehouse management, inventory). For a v0.1 it punches above its weight.

**Verdict: Strong foundation. Ship it, then iterate.**

---

## What Works Well

### Architecture
- **Clean layered backend** — routers handle HTTP, services handle business logic, models handle persistence. Easy to navigate and extend.
- **Async throughout** — FastAPI + SQLAlchemy 2.0 async is the right stack for a multi-user ERP; the implementation is consistent.
- **Typed end-to-end** — Pydantic v2 schemas on the backend, TypeScript on the frontend. Runtime and compile-time safety at both ends.
- **Docker Compose** — single `docker compose up` brings up Postgres + backend + frontend. Excellent developer experience.
- **Alembic migrations** — schema changes are tracked and reproducible.

### Frontend
- **Ant Design** is well-suited to a data-dense ERP; the component choices (Table, Form, Select, DatePicker) are all appropriate.
- **Consistent page structure** — list pages with search/pagination, detail/form pages with validation, shared `PageHeader` component.
- **Axios interceptor** handles token refresh transparently — users are not logged out mid-session on token expiry.
- **Shared `extractErrorMessage` utility** — prevents raw Pydantic v2 error arrays from crashing the React tree.

### Backend
- **PO status machine** is clearly modelled (draft → pending_approval → approved → sent → partially_received → received / cancelled). Business rules are enforced in the service layer, not scattered across routes.
- **Row locking on stock updates** (`SELECT FOR UPDATE`) — race conditions are handled correctly for concurrent goods receipts.
- **Vendor deactivation guard** — cannot deactivate a vendor with open POs; good domain integrity.
- **Reorder alerts** — inventory reorder logic is in place.

---

## Bugs Fixed in v0.1

The following issues were identified and resolved before this release:

| # | Severity | Area | Issue | Fix |
|---|----------|------|-------|-----|
| 1 | 🔴 Critical | Frontend | React stale closure in PO form — two `setLineItems()` calls with stale state reset `product_id` to `''`, silently breaking PO creation | Merged into single functional `setLineItems(prev => ...)` updater |
| 2 | 🔴 Critical | Frontend | `message.error(pydanticArray \|\| fallback)` passed a truthy array to Ant Design, crashing React with "Objects are not valid as React child" across 6 pages | Added `extractErrorMessage()` utility; applied to all error handlers |
| 3 | 🔴 Critical | Backend | `create_product` / `update_product` called `db.refresh()` which does not load the `images` relationship → `MissingGreenlet` 500 on every product save | Both methods now route through `get_product()` which uses `selectinload(Product.images)` |
| 4 | 🔴 Critical | Backend | Invalid / expired JWT tokens returned HTTP 400 instead of 401; no `WWW-Authenticate` header | Added `UnauthorizedException`; all auth errors now return 401 |
| 5 | 🟠 High | Backend | `POST /auth/register` was open to unauthenticated requests — anyone could create an account | Endpoint now requires `admin` role |
| 6 | 🟠 High | Backend | PO approval endpoint required `"manager"` role which is never assigned or seeded | Corrected to `require_roles("admin")` |
| 7 | 🟡 Medium | Backend | Stock level update in `receive_goods` had no row lock — concurrent receipts could corrupt stock counts | Added `.with_for_update()` |
| 8 | 🟡 Medium | Backend | In-memory rate-limit store grew without bound — memory leak under sustained traffic | Added cleanup when store exceeds 10,000 entries |
| 9 | 🟢 Low | Backend | Dead code variable `movement_type` in inventory service | Removed |
| 10 | 🟢 Low | Backend | `jose` and `settings` imports were deferred inside function bodies in auth router | Moved to module level |

---

## Areas for Improvement

### 🔴 Security (Address Before Production)

**1. Secrets in environment / compose files**
Passwords and secret keys are currently hardcoded in `docker-compose.yml` / `.env`. Before any real deployment, all secrets must move to a secrets manager (AWS Secrets Manager, HashiCorp Vault, or at minimum environment-injected secrets in CI/CD). Never commit `.env` to source control.

**2. JWT tokens stored in `localStorage`**
`localStorage` is accessible to any JavaScript on the page, making tokens vulnerable to XSS attacks. The industry-standard approach is `httpOnly` cookies with `SameSite=Strict` (or `Lax`), which are inaccessible to JavaScript entirely.

**3. No HTTPS in local setup**
The Docker Compose setup serves over plain HTTP. Even for development, using a self-signed cert via a reverse proxy (nginx/Caddy) is good practice, and production deployments must enforce HTTPS.

**4. Password policy**
There is no minimum password length, complexity, or breach-check (e.g. HaveIBeenPwned) on registration or password change. At minimum enforce 12+ character minimum server-side.

**5. No audit log**
An ERP deals with financial and inventory data. Every mutation (who changed what, when, from what value to what value) should be recorded in an `audit_log` table. This is essential for compliance and debugging.

**6. Rate limiting is in-memory and per-process**
The current rate limiter resets on restart and doesn't work across multiple backend replicas. Use Redis (via `slowapi` or a custom middleware) for distributed rate limiting.

---

### 🟠 Reliability & Data Integrity

**7. No database backups or point-in-time recovery**
Production Postgres needs automated backups (pg_dump cron, WAL archiving, or a managed service). This is completely absent from the current setup.

**8. Missing database constraints**
Several business rules enforced in Python are not enforced at the DB level (e.g. stock quantities should never go below zero). Add `CHECK` constraints to the schema so the DB is a last line of defence even if application logic has a bug.

**9. Soft-delete pattern is inconsistent**
Products use `status = "inactive"` for deletion. Some other entities do hard-deletes. Pick one pattern and apply it everywhere, otherwise cascade deletes or referential integrity errors will appear unexpectedly.

**10. No transaction rollback on partial failures**
Several multi-step service operations don't have explicit rollback handling. FastAPI's dependency injection commits the session at the end of a request, but unhandled exceptions inside a service may leave the session in an inconsistent state. Use `async with db.begin_nested()` (savepoints) for multi-step operations.

---

### 🟡 Observability & Operations

**11. No structured logging**
`print()` / `logging.info()` is used without a structured format. In production, use `structlog` or configure Python's logging to emit JSON. This makes log aggregation (Datadog, Grafana Loki, CloudWatch) drastically easier.

**12. No health check endpoint**
Add `GET /health` returning `{"status": "ok", "db": "ok"}` (with an actual DB ping). Docker / Kubernetes liveness and readiness probes need this.

**13. No metrics / tracing**
There's no Prometheus metrics endpoint or OpenTelemetry tracing. For an ERP, slow DB queries and high-latency endpoints are critical to catch early.

**14. No error tracking**
Integrate Sentry (or similar) so unhandled exceptions are captured with full context (user, request, stack trace) without having to dig through logs.

---

### 🟡 Testing

**15. Test coverage is thin**
The test suite exists (good!) but covers only a small fraction of the business logic. Priority areas to add tests:
- PO status transitions (all invalid state changes should raise)
- Stock level updates under concurrent load
- Authentication / authorisation (all protected routes with wrong roles)
- Goods receipt with partial quantities

**16. No frontend tests**
There are no React component tests (Vitest + React Testing Library) or end-to-end tests (Playwright/Cypress). At minimum, test the PO creation flow and the product form.

**17. No API contract tests**
Consider using Schemathesis or Dredd to automatically fuzz-test the FastAPI OpenAPI schema — it catches response validation errors (like the `MissingGreenlet` bug) automatically.

---

### 🟢 Developer Experience & Code Quality

**18. `response_model=dict` on `list_products`**
The `/products` list endpoint uses `response_model=dict` which bypasses FastAPI's automatic response validation and documentation. Create a proper `PaginatedProductResponse` Pydantic model.

**19. Magic strings for status values**
PO statuses (`"draft"`, `"pending_approval"`, etc.) and product statuses (`"active"`, `"inactive"`) are bare strings throughout. Replace with Python `enum.StrEnum` on the backend and TypeScript `const` enums / union types on the frontend.

**20. Frontend has no global state management**
Auth state (current user, roles) is stored in `localStorage` and re-read per-component. Add a lightweight global store (Zustand or React Context) so role-based UI rendering (show/hide buttons based on role) is centralised.

**21. API layer has no request caching**
The frontend re-fetches reference data (vendors, products, categories) on every page mount. Add React Query or SWR — this eliminates redundant network requests and gives you loading/error states for free.

**22. No `.env.example` file**
New developers joining the project have no reference for what environment variables are required. Add `.env.example` with placeholder values.

---

## Roadmap

### v0.2 — Hardening (Recommended Next Sprint)

- [ ] Move JWT to `httpOnly` cookies
- [ ] Add audit log table and middleware
- [ ] Add `GET /health` endpoint
- [ ] Add `CHECK` constraints to DB schema (stock ≥ 0, prices ≥ 0)
- [ ] Replace `response_model=dict` with typed Pydantic models
- [ ] Replace status magic strings with `StrEnum`
- [ ] Add `.env.example`
- [ ] Integrate Sentry for error tracking
- [ ] Expand test coverage to PO state machine and auth boundaries

### v0.3 — Features

- [ ] **Sales Orders** — mirror the purchasing flow for outbound orders
- [ ] **Customer management** — CRM-lite linked to sales orders
- [ ] **Product images** — the schema supports images but there's no upload UI; integrate S3/MinIO
- [ ] **Reports & dashboards** — inventory valuation, PO spend by vendor, stock movement history
- [ ] **Email notifications** — notify on PO approval, low stock, goods receipt
- [ ] **Barcode scanning** — for goods receipt and stock counting

### v0.4 — Scale & Operations

- [ ] Redis for sessions, rate limiting, and caching
- [ ] Celery + Redis for background jobs (reorder notifications, report generation)
- [ ] Postgres read replica for reporting queries
- [ ] CI/CD pipeline (GitHub Actions: lint → test → build → deploy)
- [ ] Kubernetes / Docker Swarm deployment manifests
- [ ] Automated DB backup strategy

### v1.0 — Production Readiness

- [ ] Full RBAC (role-based access control) with fine-grained permissions
- [ ] Multi-tenancy (if SaaS)
- [ ] GDPR / data-retention policies
- [ ] Penetration test + security audit
- [ ] Full end-to-end test suite
- [ ] SLA monitoring and on-call runbook

---

## Tech Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend framework | FastAPI | 0.115.x |
| ORM | SQLAlchemy (async) | 2.0.x |
| Database | PostgreSQL | 16 |
| Migrations | Alembic | latest |
| Auth | python-jose (JWT) + passlib/bcrypt | — |
| Frontend framework | React | 18 |
| Language | TypeScript | 5.x |
| UI library | Ant Design | 5.x |
| HTTP client | Axios | latest |
| Build tool | Vite | latest |
| Containerisation | Docker Compose | v2 |

---

*Review generated at v0.1 release — February 2026.*
