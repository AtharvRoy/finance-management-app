# Finance Management App

A modular full-stack starter for personal finance management with clear separation between frontend, backend, and database migration layers.

## Project Structure

```text
finance-management-app/
├─ frontend/                   # React + TypeScript + Tailwind + Recharts
│  ├─ src/
│  │  ├─ modules/
│  │  │  ├─ auth/
│  │  │  ├─ income/
│  │  │  ├─ expenses/
│  │  │  ├─ investments/
│  │  │  ├─ emi_loans/
│  │  │  ├─ reminders/
│  │  │  └─ analytics/
│  │  ├─ app/
│  │  ├─ components/
│  │  └─ lib/
│  ├─ package.json
│  ├─ tsconfig.json
│  ├─ tailwind.config.ts
│  └─ vite.config.ts
├─ backend/                    # Node.js + Express + TypeScript
│  ├─ src/
│  │  ├─ modules/
│  │  │  ├─ auth/
│  │  │  ├─ income/
│  │  │  ├─ expenses/
│  │  │  ├─ investments/
│  │  │  ├─ emi_loans/
│  │  │  ├─ reminders/
│  │  │  └─ analytics/
│  │  ├─ config/
│  │  ├─ middleware/
│  │  ├─ routes/
│  │  └─ app.ts
│  ├─ package.json
│  └─ tsconfig.json
├─ database/
│  ├─ migrations/
│  │  └─ 001_init.sql
│  ├─ seed/
│  └─ README.md
├─ .env.example
└─ README.md
```

## Stack Choices

- **Frontend**: React + TypeScript + Vite + Tailwind CSS + Recharts.
- **Backend**: Node.js + Express + TypeScript.
- **Database**: PostgreSQL (preferred default). SQLite can be used for local-only MVP by changing `DATABASE_URL`.

## Core Domain Modules

Implemented as feature folders in both frontend and backend:

- `auth` (optional, can be disabled for single-user local mode)
- `income`
- `expenses`
- `investments`
- `emi_loans`
- `reminders`
- `analytics`

## Setup

### 1) Environment

Copy the shared env file and update values:

```bash
cp .env.example .env
```

### 2) Install dependencies

```bash
npm run install:all
```

### 3) Run development servers

```bash
npm run dev
```

This runs frontend and backend concurrently.

## Scripts (root)

- `npm run dev` - run frontend and backend in dev mode.
- `npm run build` - build frontend and backend.
- `npm run lint` - lint frontend and backend.
- `npm run format` - format all source files.
- `npm run install:all` - install dependencies in root/frontend/backend.

## Architecture Overview

- **Frontend** handles UI, data visualizations, and module-driven screens.
- **Backend** exposes REST APIs by module (`/api/income`, `/api/expenses`, etc.).
- **Database layer** contains SQL migrations and seed scripts.
- **Shared env** controls DB connections, auth secrets, ports, and app mode.

## Notes

- This scaffold is intentionally minimal and ready for iterative feature implementation.
- For production, add proper auth flows, validation, testing, and CI/CD pipelines.
