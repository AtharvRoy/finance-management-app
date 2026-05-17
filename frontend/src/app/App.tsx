import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis } from 'recharts';

const data = [
  { name: 'Income', amount: 5000 },
  { name: 'Expenses', amount: 3200 },
  { name: 'Investments', amount: 1200 },
  { name: 'EMI/Loans', amount: 800 }
];

export function App() {
  return (
    <main className="min-h-screen bg-slate-950 p-8 text-white">
      <h1 className="mb-6 text-3xl font-bold">Finance Management App</h1>
      <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="rounded-xl bg-slate-900 p-4">auth module</div>
        <div className="rounded-xl bg-slate-900 p-4">income module</div>
        <div className="rounded-xl bg-slate-900 p-4">expenses module</div>
        <div className="rounded-xl bg-slate-900 p-4">investments module</div>
        <div className="rounded-xl bg-slate-900 p-4">emi_loans module</div>
        <div className="rounded-xl bg-slate-900 p-4">reminders module</div>
        <div className="rounded-xl bg-slate-900 p-4 md:col-span-2">analytics module</div>
      </section>
      <div className="mt-8 h-72 rounded-xl bg-slate-900 p-4">
        <ResponsiveContainer>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="name" stroke="#e2e8f0" />
            <YAxis stroke="#e2e8f0" />
            <Bar dataKey="amount" fill="#38bdf8" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </main>
  );
}
