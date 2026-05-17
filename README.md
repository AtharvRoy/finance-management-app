# finance-management-app

Production-oriented starter for a finance management platform with:
- Monthly income + expense tracking by subdivisions
- Mutual fund simulator (monthly/annual return, tax, inflation, step-up)
- Loan EMI calculator and amortization schedule API

## Structure
- `frontend/` React + TypeScript + Vite + Recharts
- `backend/` Node.js + Express API
- `database/schema.sql` PostgreSQL schema

## Run locally
```bash
npm install
npm run dev
```

## Test and build
```bash
npm run test -w backend
npm run build
```

## Backend APIs
- `GET /health`
- `GET /api/categories`
- `POST /api/incomes`
- `POST /api/expenses`
- `GET /api/expenses?userId=1&month=2026-05-01`
- `POST /api/simulator`
- `POST /api/loans`

### Simulator payload
```json
{
  "investmentPerMonth": 10000,
  "returnRate": 12,
  "returnRateFrequency": "annual",
  "tenureMonths": 180,
  "taxRate": 10,
  "inflationRate": 6,
  "annualStepUp": 5
}
```
A FastAPI backend for tracking monthly income, planned allocations, actual spends, and month-wise summaries.

## Run locally

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload
```

## Endpoints

- `POST /category-groups` – Create category groups.
- `POST /categories` – Create custom categories with duplicate/conflict validation.
- `GET /categories` – List all categories (default + custom).
- `POST /person-names` – Set dynamic two-person labels (`person_a`, `person_b`).
- `POST /monthly-income` – Upsert a monthly income entry.
- `POST /planned-allocations` – Upsert planned amount per category per month.
- `POST /actual-spends` – Upsert actual spend per category per month.
- `GET /monthly-summary/{month}` – Get month-wise totals and per-category summary.

## Duplicate category validation

Category names are normalized before persistence and checked for duplicates in the same group.
Normalization includes:

- lowercase conversion
- punctuation cleanup
- replacing `&` with `and`
- whitespace collapsing

This prevents conflicting names such as `Food & Beverage` vs `food beverage` in the same group.
