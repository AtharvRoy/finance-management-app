import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { EXPENSE_CATEGORIES } from './categories.js';
import { query } from './db.js';
import { amortizationSchedule, calculateEMI, simulateMutualFund } from './simulator.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

function validateNumber(value, name) {
  if (typeof value !== 'number' || Number.isNaN(value)) {
    throw new Error(`${name} must be a valid number`);
  }
}

function getLoanStatus(nextDueDate) {
  const today = new Date();
  const due = new Date(nextDueDate);
  const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'overdue';
  if (diffDays <= 5) return 'due';
  return 'upcoming';
}

app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/api/categories', (_req, res) => res.json({ categories: EXPENSE_CATEGORIES }));

app.post('/api/incomes', async (req, res) => {
  try {
    const { userId, month, amount } = req.body;
    validateNumber(userId, 'userId');
    validateNumber(amount, 'amount');
    const result = await query('INSERT INTO incomes (user_id, month, amount) VALUES ($1, $2, $3) RETURNING *', [userId, month, amount]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/expenses', async (req, res) => {
  try {
    const { userId, month, category, plannedAmount = 0, actualAmount = 0, personName = null } = req.body;
    validateNumber(userId, 'userId');
    if (!category) throw new Error('category is required');
    validateNumber(plannedAmount, 'plannedAmount');
    validateNumber(actualAmount, 'actualAmount');

    const result = await query(
      `INSERT INTO expenses (user_id, month, category, planned_amount, actual_amount, person_name)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [userId, month, category, plannedAmount, actualAmount, personName]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/expenses', async (req, res) => {
  try {
    const { userId, month } = req.query;
    const result = await query('SELECT * FROM expenses WHERE user_id = $1 AND month = $2 ORDER BY id DESC', [userId, month]);
    res.json({ expenses: result.rows });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/investments/scenarios', async (req, res) => {
  try {
    const {
      userId,
      name,
      investmentPerMonth,
      returnRate,
      returnRateFrequency,
      tenureMonths,
      taxRate = 0,
      inflationRate = 0,
      annualStepUp = 0
    } = req.body;

    validateNumber(userId, 'userId');
    validateNumber(investmentPerMonth, 'investmentPerMonth');
    validateNumber(returnRate, 'returnRate');
    validateNumber(tenureMonths, 'tenureMonths');

    const projection = simulateMutualFund({
      investmentPerMonth,
      returnRate,
      returnRateFrequency,
      tenureMonths,
      taxRate,
      inflationRate,
      annualStepUp
    });

    const result = await query(
      `INSERT INTO investments
      (user_id, name, investment_per_month, return_rate, return_rate_frequency, tenure_months, tax_rate, inflation_rate, annual_step_up, projection_json)
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
      RETURNING *`,
      [
        userId,
        name ?? 'Base Scenario',
        investmentPerMonth,
        returnRate,
        returnRateFrequency,
        tenureMonths,
        taxRate,
        inflationRate,
        annualStepUp,
        JSON.stringify(projection)
      ]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/investments/scenarios', async (req, res) => {
  try {
    const { userId } = req.query;
    const result = await query('SELECT * FROM investments WHERE user_id = $1 ORDER BY id DESC', [userId]);
    res.json({ scenarios: result.rows });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/simulator', (req, res) => {
  try {
    const { investmentPerMonth, returnRate, returnRateFrequency, tenureMonths, taxRate = 0, inflationRate = 0, annualStepUp = 0 } = req.body;
    validateNumber(investmentPerMonth, 'investmentPerMonth');
    validateNumber(returnRate, 'returnRate');
    validateNumber(tenureMonths, 'tenureMonths');
    res.json(simulateMutualFund({ investmentPerMonth, returnRate, returnRateFrequency, tenureMonths, taxRate, inflationRate, annualStepUp }));
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/loans', async (req, res) => {
  try {
    const { userId, lenderName, principal, annualInterestRate, tenureMonths, nextDueDate, reminderDate } = req.body;
    validateNumber(userId, 'userId');
    validateNumber(principal, 'principal');
    validateNumber(annualInterestRate, 'annualInterestRate');
    validateNumber(tenureMonths, 'tenureMonths');

    const emi = calculateEMI({ principal, annualInterestRate, tenureMonths });
    const status = getLoanStatus(nextDueDate);

    const result = await query(
      `INSERT INTO loans (user_id, lender_name, principal, annual_interest_rate, tenure_months, emi_amount, next_due_date, reminder_date, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
       RETURNING *`,
      [userId, lenderName, principal, annualInterestRate, tenureMonths, emi, nextDueDate, reminderDate, status]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/loans', async (req, res) => {
  try {
    const { userId } = req.query;
    const result = await query('SELECT * FROM loans WHERE user_id = $1 ORDER BY id DESC', [userId]);
    res.json({ loans: result.rows });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.get('/api/loans/:loanId/schedule', async (req, res) => {
  try {
    const { loanId } = req.params;
    const result = await query('SELECT * FROM loans WHERE id = $1', [loanId]);
    if (!result.rows.length) return res.status(404).json({ error: 'Loan not found' });
    const loan = result.rows[0];
    const schedule = amortizationSchedule({
      principal: Number(loan.principal),
      annualInterestRate: Number(loan.annual_interest_rate),
      tenureMonths: Number(loan.tenure_months),
      emi: Number(loan.emi_amount)
    });
    res.json({ loanId, schedule });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`backend running on ${port}`);
});
