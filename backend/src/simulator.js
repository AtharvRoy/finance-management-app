export function toMonthlyRate(rate, frequency) {
  if (frequency === 'monthly') return rate / 100;
  const annual = rate / 100;
  return (1 + annual) ** (1 / 12) - 1;
}

export function simulateMutualFund({
  investmentPerMonth,
  returnRate,
  returnRateFrequency,
  tenureMonths,
  taxRate = 0,
  inflationRate = 0,
  annualStepUp = 0
}) {
  const monthlyRate = toMonthlyRate(returnRate, returnRateFrequency);
  const monthlyInflationRate = toMonthlyRate(inflationRate, 'annual');
  const yearlyStep = annualStepUp / 100;

  let monthlyInvestment = investmentPerMonth;
  let corpus = 0;
  const yearlySeries = [];

  for (let month = 1; month <= tenureMonths; month += 1) {
    if (month > 1 && month % 12 === 1) {
      monthlyInvestment *= 1 + yearlyStep;
    }
    corpus = (corpus + monthlyInvestment) * (1 + monthlyRate);

    if (month % 12 === 0 || month === tenureMonths) {
      const year = Math.ceil(month / 12);
      const inflationFactor = (1 + monthlyInflationRate) ** month;
      yearlySeries.push({
        year,
        nominalCorpus: Number(corpus.toFixed(2)),
        inflationAdjustedCorpus: Number((corpus / inflationFactor).toFixed(2))
      });
    }
  }

  const totalInvested = yearlySeries.length
    ? Number(
        yearlySeries
          .reduce((_, __, idx) => {
            const monthsInYear = idx === yearlySeries.length - 1 && tenureMonths % 12 !== 0 ? tenureMonths % 12 : 12;
            const yearInvestment = investmentPerMonth * (1 + yearlyStep) ** idx;
            return _ + yearInvestment * monthsInYear;
          }, 0)
          .toFixed(2)
      )
    : 0;

  const gains = corpus - totalInvested;
  const postTaxCorpus = totalInvested + gains * (1 - taxRate / 100);

  return {
    totalInvested,
    nominalCorpus: Number(corpus.toFixed(2)),
    postTaxCorpus: Number(postTaxCorpus.toFixed(2)),
    inflationAdjustedCorpus: Number((postTaxCorpus / ((1 + monthlyInflationRate) ** tenureMonths)).toFixed(2)),
    yearlySeries
  };
}

export function calculateEMI({ principal, annualInterestRate, tenureMonths }) {
  const monthlyRate = annualInterestRate / 12 / 100;
  if (monthlyRate === 0) return principal / tenureMonths;
  const top = principal * monthlyRate * (1 + monthlyRate) ** tenureMonths;
  const bottom = (1 + monthlyRate) ** tenureMonths - 1;
  return top / bottom;
}

export function amortizationSchedule({ principal, annualInterestRate, tenureMonths, emi }) {
  const monthlyRate = annualInterestRate / 12 / 100;
  let balance = principal;
  const schedule = [];

  for (let month = 1; month <= tenureMonths; month += 1) {
    const interest = balance * monthlyRate;
    const principalPaid = Math.min(emi - interest, balance);
    balance = Math.max(balance - principalPaid, 0);
    schedule.push({
      month,
      emi: Number(emi.toFixed(2)),
      interest: Number(interest.toFixed(2)),
      principal: Number(principalPaid.toFixed(2)),
      outstanding: Number(balance.toFixed(2))
    });
  }

  return schedule;
}
