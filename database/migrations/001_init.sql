-- Initial schema for finance management app

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS income (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  source TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  received_on DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  category TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  spent_on DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS investments (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  instrument TEXT NOT NULL,
  amount NUMERIC(12,2) NOT NULL,
  invested_on DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS emi_loans (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  lender TEXT NOT NULL,
  principal NUMERIC(12,2) NOT NULL,
  monthly_emi NUMERIC(12,2) NOT NULL,
  next_due_date DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS reminders (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  due_at TIMESTAMP NOT NULL,
  is_completed BOOLEAN NOT NULL DEFAULT FALSE
);
