import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { z } from 'zod';
import { EXPENSE_CATEGORIES } from './categories.js';
import { query } from './db.js';
import { amortizationSchedule, calculateEMI, simulateMutualFund } from './simulator.js';

dotenv.config();

const numberField = z.number().finite();
const incomeSchema = z.object({ userId: numberField, month: z.string(), amount: numberField });
const expenseSchema = z.object({
  userId: numberField,
  month: z.string(),
  category: z.string().min(1),
  plannedAmount: numberField.default(0),
  actualAmount: numberField.default(0),
  personName: z.string().nullable().optional()
});
const scenarioSchema = z.object({
  userId: numberField,
  name: z.string().optional(),
  investmentPerMonth: numberField,
  returnRate: numberField,
  returnRateFrequency: z.enum(['monthly', 'annual']),
  tenureMonths: numberField,
  taxRate: numberField.default(0),
  inflationRate: numberField.default(0),
  annualStepUp: numberField.default(0)
});
const loanSchema = z.object({
  userId: numberField,
  lenderName: z.string().optional(),
  principal: numberField,
  annualInterestRate: numberField,
  tenureMonths: numberField,
  nextDueDate: z.string(),
  reminderDate: z.string().optional()
});

function getLoanStatus(nextDueDate) {
  const today = new Date();
  const due = new Date(nextDueDate);
  const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 5) return 'due';
  return 'upcoming';
}

function badRequest(res, error) {
  if (error?.issues) {
    return res.status(400).json({ error: 'Validation failed', details: error.issues.map((i) => i.message) });
  }
  return res.status(400).json({ error: error.message });
}

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  app.get('/health', (_req, res) => res.json({ ok: true }));
  app.get('/api/categories', (_req, res) => res.json({ categories: EXPENSE_CATEGORIES }));

  app.post('/api/incomes', async (req, res) => {
    try {
      const { userId, month, amount } = incomeSchema.parse(req.body);
      const result = await query('INSERT INTO incomes (user_id, month, amount) VALUES ($1, $2, $3) RETURNING *', [userId, month, amount]);
      res.status(201).json(result.rows[0]);
    } catch (error) { badRequest(res, error); }
  });

  app.post('/api/expenses', async (req, res) => {
    try {
      const { userId, month, category, plannedAmount, actualAmount, personName = null } = expenseSchema.parse(req.body);
      const result = await query(
        `INSERT INTO expenses (user_id, month, category, planned_amount, actual_amount, person_name)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
        [userId, month, category, plannedAmount, actualAmount, personName]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) { badRequest(res, error); }
  });

  app.get('/api/expenses', async (req, res) => {
    try {
      const result = await query('SELECT * FROM expenses WHERE user_id = $1 AND month = $2 ORDER BY id DESC', [req.query.userId, req.query.month]);
      res.json({ expenses: result.rows });
    } catch (error) { badRequest(res, error); }
  });

  app.post('/api/investments/scenarios', async (req, res) => {
    try {
      const input = scenarioSchema.parse(req.body);
      const projection = simulateMutualFund(input);
      const result = await query(
        `INSERT INTO investments
        (user_id, name, investment_per_month, return_rate, return_rate_frequency, tenure_months, tax_rate, inflation_rate, annual_step_up, projection_json)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
        [input.userId, input.name ?? 'Base Scenario', input.investmentPerMonth, input.returnRate, input.returnRateFrequency, input.tenureMonths, input.taxRate, input.inflationRate, input.annualStepUp, JSON.stringify(projection)]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) { badRequest(res, error); }
  });

  app.get('/api/investments/scenarios', async (req, res) => {
    try {
      const result = await query('SELECT * FROM investments WHERE user_id = $1 ORDER BY id DESC', [req.query.userId]);
      res.json({ scenarios: result.rows });
    } catch (error) { badRequest(res, error); }
  });

  app.post('/api/simulator', (req, res) => {
    try { res.json(simulateMutualFund(scenarioSchema.omit({ userId: true, name: true }).parse(req.body))); }
    catch (error) { badRequest(res, error); }
  });

  app.post('/api/loans', async (req, res) => {
    try {
      const input = loanSchema.parse(req.body);
      const emi = calculateEMI(input);
      const status = getLoanStatus(input.nextDueDate);
      const result = await query(
        `INSERT INTO loans (user_id, lender_name, principal, annual_interest_rate, tenure_months, emi_amount, next_due_date, reminder_date, status)
         VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
        [input.userId, input.lenderName, input.principal, input.annualInterestRate, input.tenureMonths, emi, input.nextDueDate, input.reminderDate, status]
      );
      res.status(201).json(result.rows[0]);
    } catch (error) { badRequest(res, error); }
  });

  app.get('/api/loans', async (req, res) => {
    try {
      const result = await query('SELECT * FROM loans WHERE user_id = $1 ORDER BY id DESC', [req.query.userId]);
      res.json({ loans: result.rows });
    } catch (error) { badRequest(res, error); }
  });

  app.get('/api/loans/:loanId/schedule', async (req, res) => {
    try {
      const result = await query('SELECT * FROM loans WHERE id = $1', [req.params.loanId]);
      if (!result.rows.length) return res.status(404).json({ error: 'Loan not found' });
      const loan = result.rows[0];
      const schedule = amortizationSchedule({ principal: Number(loan.principal), annualInterestRate: Number(loan.annual_interest_rate), tenureMonths: Number(loan.tenure_months), emi: Number(loan.emi_amount) });
      res.json({ loanId: req.params.loanId, schedule });
    } catch (error) { badRequest(res, error); }
  });

  return app;
}

const app = createApp();
const port = process.env.PORT || 4000;
if (process.argv[1] && process.argv[1].endsWith('index.js')) {
  app.listen(port, () => console.log(`backend running on ${port}`));
}
