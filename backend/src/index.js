import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { EXPENSE_CATEGORIES } from './categories.js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

app.get('/api/categories', (_req, res) => res.json({ categories: EXPENSE_CATEGORIES }));

app.post('/api/simulator', (req, res) => {
  const { investmentPerMonth, annualReturnRate, tenureYears, taxRate = 0, inflationRate = 0 } = req.body;
  const months = tenureYears * 12;
  const monthlyRate = annualReturnRate / 12 / 100;
  let corpus = 0;
  for (let i = 0; i < months; i += 1) {
    corpus = (corpus + investmentPerMonth) * (1 + monthlyRate);
  }
  const postTax = corpus * (1 - taxRate / 100);
  const realValue = postTax / ((1 + inflationRate / 100) ** tenureYears);
  res.json({ nominalCorpus: corpus, postTaxCorpus: postTax, inflationAdjustedCorpus: realValue });
});

const port = process.env.PORT || 4000;
app.listen(port, () => {
  console.log(`backend running on ${port}`);
});
