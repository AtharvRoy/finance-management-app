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

app.get('/health', (_req, res) => res.json({ ok: true }));
app.get('/api/categories', (_req, res) => res.json({ categories: EXPENSE_CATEGORIES }));

app.post('/api/incomes', async (req, res) => {
  try {
    const { userId, month, amount } = req.body;
    validateNumber(userId, 'userId');
    validateNumber(amount, 'amount');
    const result = await query(
      'INSERT INTO incomes (user_id, month, amount) VALUES ($1, $2, $3) RETURNING *',
      [userId, month, amount]
    );
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

app.post('/api/simulator', (req, res) => {
  try {
    const {
      investmentPerMonth,
      returnRate,
      returnRateFrequency,
      tenureMonths,
      taxRate = 0,
      inflationRate = 0,
      annualStepUp = 0
    } = req.body;

    validateNumber(investmentPerMonth, 'investmentPerMonth');
    validateNumber(returnRate, 'returnRate');
    validateNumber(tenureMonths, 'tenureMonths');
    const output = simulateMutualFund({
      investmentPerMonth,
      returnRate,
      returnRateFrequency,
      tenureMonths,
      taxRate,
      inflationRate,
      annualStepUp
    });
    res.json(output);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post('/api/loans', (req, res) => {
  try {
    const { principal, annualInterestRate, tenureMonths } = req.body;
    validateNumber(principal, 'principal');
    validateNumber(annualInterestRate, 'annualInterestRate');
    validateNumber(tenureMonths, 'tenureMonths');
    const emi = calculateEMI({ principal, annualInterestRate, tenureMonths });
    const schedule = amortizationSchedule({ principal, annualInterestRate, tenureMonths, emi });
    res.json({ emi: Number(emi.toFixed(2)), schedule });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`backend running on ${port}`);
});
