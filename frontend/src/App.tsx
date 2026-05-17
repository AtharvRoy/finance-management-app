import { useEffect, useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, BarChart, Bar, Legend } from 'recharts';

const API_BASE = 'http://localhost:4000';
const USER_ID = 1;
const currentMonth = new Date().toISOString().slice(0, 10).replace(/-\d{2}$/, '-01');

const categories = [
  'Food and beverage', 'Food, beverages, groceries', 'Utility and bills', 'Travel and transport', 'Education', 'Health', 'Lifestyle', 'Two people', 'Agriculture', 'Airlines', 'Cabs and cab rentals', 'Clothing and apparel', 'Durables and home goods', 'Fuel', 'Government services', 'Hotels, motels, resorts', 'Online shopping', 'Railways and roadways', 'Repairs and services', 'Tolls', 'Trading', 'Others'
];

export function App() {
  const [monthlyIncome, setMonthlyIncome] = useState(100000);
  const [expenseItems, setExpenseItems] = useState([{ category: categories[0], planned: 12000, actual: 10500 }]);
  const [simInput, setSimInput] = useState({ name: 'My Scenario', investmentPerMonth: 10000, returnRate: 12, returnRateFrequency: 'annual', tenureMonths: 180, taxRate: 10, inflationRate: 6, annualStepUp: 5 });
  const [savedScenarios, setSavedScenarios] = useState<any[]>([]);

  const totalPlanned = useMemo(() => expenseItems.reduce((s, x) => s + x.planned, 0), [expenseItems]);
  const totalActual = useMemo(() => expenseItems.reduce((s, x) => s + x.actual, 0), [expenseItems]);

  useEffect(() => {
    fetch(`${API_BASE}/api/expenses?userId=${USER_ID}&month=${currentMonth}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.expenses?.length) {
          setExpenseItems(
            data.expenses.map((e: any) => ({ category: e.category, planned: Number(e.planned_amount), actual: Number(e.actual_amount) }))
          );
        }
      })
      .catch(() => undefined);

    fetch(`${API_BASE}/api/investments/scenarios?userId=${USER_ID}`)
      .then((res) => res.json())
      .then((data) => setSavedScenarios(data.scenarios ?? []))
      .catch(() => undefined);
  }, []);

  const addExpenseRow = () => setExpenseItems((p) => [...p, { category: categories[0], planned: 0, actual: 0 }]);

  const saveIncome = async () => {
    await fetch(`${API_BASE}/api/incomes`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: USER_ID, month: currentMonth, amount: monthlyIncome })
    });
    alert('Income saved');
  };

  const saveExpenses = async () => {
    await Promise.all(expenseItems.map((row) => fetch(`${API_BASE}/api/expenses`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: USER_ID, month: currentMonth, category: row.category, plannedAmount: row.planned, actualAmount: row.actual })
    })));
    alert('Expenses saved');
  };

  const saveScenario = async () => {
    const res = await fetch(`${API_BASE}/api/investments/scenarios`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: USER_ID, ...simInput })
    });
    const scenario = await res.json();
    setSavedScenarios((p) => [scenario, ...p]);
  };

  const projection = useMemo(() => {
    const monthlyRate = simInput.returnRateFrequency === 'monthly'
      ? simInput.returnRate / 100
      : (1 + simInput.returnRate / 100) ** (1 / 12) - 1;
    let sip = simInput.investmentPerMonth;
    let corpus = 0;
    const points = [];
    for (let m = 1; m <= simInput.tenureMonths; m += 1) {
      if (m > 1 && m % 12 === 1) sip *= 1 + simInput.annualStepUp / 100;
      corpus = (corpus + sip) * (1 + monthlyRate);
      if (m % 12 === 0) points.push({ year: `Y${m / 12}`, corpus: Number(corpus.toFixed(0)) });
    }
    return points;
  }, [simInput]);

  return (
    <main className="container">
      <h1>Finance Management App</h1>
      <section>
        <h2>Monthly Expense Tracker</h2>
        <label>Monthly Income
          <input type="number" value={monthlyIncome} onChange={(e) => setMonthlyIncome(Number(e.target.value))} />
        </label>
        <button onClick={saveIncome}>Save Income</button>
        {expenseItems.map((item, idx) => (
          <div key={idx} className="row">
            <select value={item.category} onChange={(e) => setExpenseItems((p) => p.map((r, i) => i === idx ? { ...r, category: e.target.value } : r))}>{categories.map((c) => <option key={c}>{c}</option>)}</select>
            <input type="number" value={item.planned} onChange={(e) => setExpenseItems((p) => p.map((r, i) => i === idx ? { ...r, planned: Number(e.target.value) } : r))} placeholder="Planned" />
            <input type="number" value={item.actual} onChange={(e) => setExpenseItems((p) => p.map((r, i) => i === idx ? { ...r, actual: Number(e.target.value) } : r))} placeholder="Actual" />
          </div>
        ))}
        <button onClick={addExpenseRow}>+ Add Category</button>
        <button onClick={saveExpenses}>Save Expenses</button>
        <p>Planned: ₹{totalPlanned.toLocaleString()} | Actual: ₹{totalActual.toLocaleString()} | Savings: ₹{(monthlyIncome - totalActual).toLocaleString()}</p>
        <div style={{ width: '100%', height: 220 }}><ResponsiveContainer><BarChart data={[{ name: 'Budget', Planned: totalPlanned, Actual: totalActual }]}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Legend /><Bar dataKey="Planned" fill="#2563eb" /><Bar dataKey="Actual" fill="#dc2626" /></BarChart></ResponsiveContainer></div>
      </section>

      <section>
        <h2>Mutual Funds Simulator</h2>
        <div className="grid">
          {Object.entries(simInput).map(([key, value]) => key === 'returnRateFrequency' ? (
            <label key={key}>{key}<select value={value as string} onChange={(e) => setSimInput((p) => ({ ...p, [key]: e.target.value }))}><option value="annual">annual</option><option value="monthly">monthly</option></select></label>
          ) : (
            <label key={key}>{key}<input type={key === 'name' ? 'text' : 'number'} value={value as string | number} onChange={(e) => setSimInput((p) => ({ ...p, [key]: key === 'name' ? e.target.value : Number(e.target.value) }))} /></label>
          ))}
        </div>
        <button onClick={saveScenario}>Save Scenario</button>
        <p>Saved scenarios: {savedScenarios.length}</p>
        <div style={{ width: '100%', height: 240 }}><ResponsiveContainer><LineChart data={projection}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="year" /><YAxis /><Tooltip /><Line dataKey="corpus" stroke="#4f46e5" strokeWidth={3} /></LineChart></ResponsiveContainer></div>
      </section>
    </main>
  );
}
