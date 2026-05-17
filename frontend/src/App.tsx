import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

const categories = [
  'Food and beverage','Food, beverages, groceries','Utility and bills','Travel and transport','Education','Health','Lifestyle','Two people','Agriculture','Airlines','Cabs and cab rentals','Clothing and apparel','Durables and home goods','Fuel','Government services','Hotels, motels, resorts','Online shopping','Railways and roadways','Repairs and services','Tolls','Trading','Others'
];

const growthData = [
  { month: 'Year 1', corpus: 12000 },
  { month: 'Year 3', corpus: 46000 },
  { month: 'Year 5', corpus: 92000 },
  { month: 'Year 10', corpus: 250000 }
];

export function App() {
  return (
    <main className="container">
      <h1>Finance Management App</h1>
      <section>
        <h2>Monthly Expense Tracker</h2>
        <p>Track monthly income, allocations, and expenses across subdivisions.</p>
        <ul>{categories.map((c) => <li key={c}>{c}</li>)}</ul>
      </section>

      <section>
        <h2>Investment & Mutual Fund Simulator</h2>
        <p>Supports monthly investment, return rate (monthly/annual), tenure, tax, and inflation assumptions.</p>
        <div style={{ width: '100%', height: 240 }}>
          <ResponsiveContainer>
            <LineChart data={growthData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line dataKey="corpus" stroke="#4f46e5" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section>
        <h2>Loans / EMI</h2>
        <p>Add loans, track amortization and due-date reminders with interest impact visibility.</p>
      </section>
    </main>
  );
}
