import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateEMI, simulateMutualFund } from './simulator.js';

test('simulateMutualFund returns growing corpus', () => {
  const out = simulateMutualFund({
    investmentPerMonth: 10000,
    returnRate: 12,
    returnRateFrequency: 'annual',
    tenureMonths: 120,
    taxRate: 10,
    inflationRate: 6,
    annualStepUp: 5
  });

  assert.ok(out.nominalCorpus > out.totalInvested);
  assert.ok(out.postTaxCorpus < out.nominalCorpus);
  assert.equal(out.yearlySeries.length, 10);
});

test('calculateEMI calculates expected payment', () => {
  const emi = calculateEMI({ principal: 1000000, annualInterestRate: 10, tenureMonths: 120 });
  assert.ok(emi > 10000);
});
