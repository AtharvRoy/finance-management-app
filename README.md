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
