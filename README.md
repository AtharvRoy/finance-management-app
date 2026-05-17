# finance-management-app

A full-stack starter for a finance management system with:
- Monthly expense tracker with detailed subdivisions
- Investment simulator (mutual funds, tax, inflation)
- Loan/EMI tracking foundations

## Structure
- `frontend/` React + TypeScript + Vite + Recharts
- `backend/` Node.js + Express API
- `database/schema.sql` PostgreSQL schema

## Run locally
```bash
npm install
npm run dev
```

Frontend: http://localhost:5173  
Backend: http://localhost:4000

## API Starter Endpoints
- `GET /health`
- `GET /api/categories`
- `POST /api/simulator`

Sample simulator payload:
```json
{
  "investmentPerMonth": 1000,
  "annualReturnRate": 12,
  "tenureYears": 10,
  "taxRate": 10,
  "inflationRate": 6
}
```
