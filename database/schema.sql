CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE
);

CREATE TABLE IF NOT EXISTS incomes (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  month DATE NOT NULL,
  amount NUMERIC(12,2) NOT NULL
);

CREATE TABLE IF NOT EXISTS expenses (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  month DATE NOT NULL,
  category TEXT NOT NULL,
  planned_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  actual_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
  person_name TEXT
);

CREATE TABLE IF NOT EXISTS investments (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  name TEXT NOT NULL DEFAULT 'Base Scenario',
  investment_per_month NUMERIC(12,2) NOT NULL,
  return_rate NUMERIC(8,4) NOT NULL,
  return_rate_frequency TEXT NOT NULL CHECK (return_rate_frequency IN ('monthly', 'annual')),
  tenure_months INTEGER NOT NULL,
  tax_rate NUMERIC(6,3) NOT NULL DEFAULT 0,
  inflation_rate NUMERIC(6,3) NOT NULL DEFAULT 0,
  annual_step_up NUMERIC(6,3) NOT NULL DEFAULT 0,
  projection_json JSONB,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS loans (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  lender_name TEXT,
  principal NUMERIC(12,2) NOT NULL,
  annual_interest_rate NUMERIC(8,4) NOT NULL,
  tenure_months INTEGER NOT NULL,
  emi_amount NUMERIC(12,2),
  due_day INTEGER CHECK (due_day BETWEEN 1 AND 31),
  next_due_date DATE,
  reminder_date DATE,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'due', 'overdue')),
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);
