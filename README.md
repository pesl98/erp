# Webshop ERP

A full-stack ERP application for webshop operations management, built with FastAPI, React, TypeScript, and PostgreSQL.

## Features

- **Product Management** - Create/edit products with SKU, categories, pricing, dimensions, reorder points
- **Vendor Management** - Vendor master data with contact info, payment terms, lead times, ratings
- **Warehouse Management** - Multi-warehouse support with zones and bin locations
- **Purchasing** - Full PO workflow: draft, approval, send, goods receipt with automatic stock updates
- **Inventory Management** - Stock levels, reorder alerts, adjustments, transfers, movement audit trail
- **Dashboard & Reports** - KPIs, stock valuation, purchase history, vendor performance

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.12, FastAPI, SQLAlchemy 2.0 (async), Alembic |
| Frontend | React 18, TypeScript, Vite, Ant Design 5, Recharts |
| Database | PostgreSQL 16 |
| Auth | JWT (python-jose + passlib) |
| Infra | Docker Compose |

## Quick Start

### With Docker Compose

```bash
docker-compose up --build
```

This starts PostgreSQL, the backend API, and the frontend dev server.

### Manual Setup

**Prerequisites:** Python 3.11+, Node.js 18+, PostgreSQL 15+

#### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt

# Copy and edit .env
cp .env.example .env

# Run migrations
alembic upgrade head

# Seed demo data
python seed.py

# Start server
uvicorn app.main:app --reload
```

#### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Access

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Docs:** http://localhost:8000/docs

### Demo Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@erp.local | admin123 |
| Buyer | buyer@erp.local | buyer123 |

## Project Structure

```
erp/
├── backend/
│   ├── app/
│   │   ├── auth/          # Authentication (JWT)
│   │   ├── products/      # Product & category CRUD
│   │   ├── vendors/       # Vendor CRUD
│   │   ├── warehouse/     # Warehouse/zone/location management
│   │   ├── purchasing/    # Purchase orders & goods receipts
│   │   ├── inventory/     # Stock levels, movements, adjustments
│   │   └── reporting/     # Dashboard KPIs & reports
│   ├── alembic/           # Database migrations
│   ├── tests/
│   └── seed.py            # Demo data seeder
├── frontend/
│   └── src/
│       ├── api/           # Typed API client functions
│       ├── auth/          # Auth context & login
│       ├── layouts/       # App shell with sidebar
│       ├── pages/         # All page components
│       ├── components/    # Shared UI components
│       ├── types/         # TypeScript interfaces
│       └── utils/         # Formatters & constants
└── docker-compose.yml
```

## API Endpoints

All endpoints under `/api/v1`. Full interactive docs at `/docs`.

- `POST /auth/login` - Login
- `GET/POST /products` - Product CRUD
- `GET/POST /vendors` - Vendor CRUD
- `GET/POST /warehouses` - Warehouse management
- `GET/POST /purchase-orders` - PO management with workflow actions
- `GET /inventory/stock-levels` - Stock overview
- `GET /inventory/reorder-alerts` - Low stock alerts
- `GET /dashboard/kpis` - Dashboard metrics
