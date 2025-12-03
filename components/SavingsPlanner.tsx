import React, { useState, useEffect } from 'react';
import { PiggyBank, Wallet, TrendingUp, DollarSign, Calculator, Clock, ArrowRight } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ReferenceLine } from 'recharts';

export const SavingsPlanner: React.FC = () => {
  const [activeMode, setActiveMode] = useState<'AFFORDABILITY' | 'WEALTH'>('AFFORDABILITY');

  return (
    <div className="max-w-5xl mx-auto px-4 space-y-8 animate-in fade-in duration-500">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">Spar- & Finanzierungsplaner</h2>
        <p className="text-slate-500 max-w-2xl mx-auto">
            Plane deinen Weg zur ersten Immobilie: Vom Vermögensaufbau bis zur maximalen Kreditsumme.
        </p>
      </div>

      <div className="flex justify-center mb-8">
          <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 inline-flex">
              <button
                  onClick={() => setActiveMode('AFFORDABILITY')}
                  className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeMode === 'AFFORDABILITY' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
              >
                  <Wallet className="w-4 h-4"/> Finanzierbarkeit
              </button>
              <button
                  onClick={() => setActiveMode('WEALTH')}
                  className={`px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 ${activeMode === 'WEALTH' ? 'bg-emerald-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-800'}`}
              >
                  <TrendingUp className="w-4 h-4"/> Vermögensaufbau
              </button>
          </div>
      </div>

      {activeMode === 'AFFORDABILITY' ? <AffordabilityCalculator /> : <WealthBuilder />}
    </div>
  );
};

const AffordabilityCalculator = () => {
    // State
    const [netIncome, setNetIncome] = useState(3500);
    const [existingLoans, setExistingLoans] = useState(0);
    const [livingExpenses, setLivingExpenses] = useState(1200);
    const [interestRate, setInterestRate] = useState(3.8);
    const [loanTerm, setLoanTerm] = useState(30);
    const [equity, setEquity] = useState(50000);

    // Results
    const [maxMonthlyRate, setMaxMonthlyRate] = useState(0);
    const [maxLoanAmount, setMaxLoanAmount] = useState(0);
    const [maxPurchasePrice, setMaxPurchasePrice] = useState(0);

    useEffect(() => {
        // Calculation Rules (Generic DACH guidelines)
        // Rule 1: Household Surplus -> Income - Expenses - Existing Loans
        const surplus = netIncome - livingExpenses - existingLoans;
        
        // Rule 2: Debt-to-Income Ratio (e.g. max 40% of Net Income for loan)
        const dtiLimit = netIncome * 0.4;

        // The safe monthly rate is the lower of the surplus (minus a buffer) or the DTI limit
        // Let's take the stricter one but ensure surplus is positive
        const safeRate = Math.min(surplus, dtiLimit);
        
        setMaxMonthlyRate(Math.max(0, safeRate));

        // Calculate Max Loan Amount based on Annuity Formula
        // PV = PMT * (1 - (1 + r)^-n) / r
        if (safeRate > 0 && interestRate > 0) {
            const r = interestRate / 100 / 12;
            const n = loanTerm * 12;
            const loan = safeRate * (1 - Math.pow(1 + r, -n)) / r;
            setMaxLoanAmount(loan);
            
            // Approx Purchase Price (Loan + Equity - Closing Costs)
            // Assuming ~10% closing costs on the purchase price: Price + 0.1*Price = Loan + Equity
            // 1.1 * Price = Loan + Equity => Price = (Loan + Equity) / 1.1
            setMaxPurchasePrice((loan + equity) / 1.1);
        } else {
            setMaxLoanAmount(0);
            setMaxPurchasePrice(equity / 1.1);
        }

    }, [netIncome, existingLoans, livingExpenses, interestRate, loanTerm, equity]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                    <Calculator className="w-5 h-5 text-slate-400"/> Deine Daten
                </h3>
                <div className="space-y-5">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Netto Haushaltseinkommen</label>
                        <input type="number" value={netIncome} onChange={e => setNetIncome(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-accent outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Lebenshaltung</label>
                            <input type="number" value={livingExpenses} onChange={e => setLivingExpenses(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-accent outline-none" />
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Bestands-Kredite</label>
                            <input type="number" value={existingLoans} onChange={e => setExistingLoans(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-accent outline-none" />
                        </div>
                    </div>
                    <div className="pt-4 border-t border-slate-100">
                         <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Verfügbares Eigenkapital</label>
                        <input type="number" value={equity} onChange={e => setEquity(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-accent outline-none" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Zinssatz (aktuell)</label>
                            <div className="relative">
                                <input type="number" step="0.1" value={interestRate} onChange={e => setInterestRate(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-accent outline-none" />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">%</span>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Laufzeit</label>
                            <div className="relative">
                                <input type="number" value={loanTerm} onChange={e => setLoanTerm(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-accent outline-none" />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">Jahre</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 text-white p-6 md:p-8 rounded-2xl shadow-xl border border-slate-700 flex flex-col justify-between">
                <div>
                    <h3 className="font-bold text-slate-100 mb-1">Maximaler Kreditrahmen</h3>
                    <p className="text-sm text-slate-400 mb-8">Basierend auf 40% DTI-Regel und Haushaltsüberschuss.</p>

                    <div className="space-y-8">
                        <div>
                            <p className="text-xs uppercase font-bold text-slate-500 mb-1">Max. Mögliche Monatsrate</p>
                            <p className="text-4xl font-bold text-emerald-400">{maxMonthlyRate.toFixed(0)} €</p>
                        </div>
                         <div>
                            <p className="text-xs uppercase font-bold text-slate-500 mb-1">Max. Kreditbetrag (Bank)</p>
                            <p className="text-3xl font-bold text-white">{maxLoanAmount.toLocaleString(undefined, { maximumFractionDigits: 0 })} €</p>
                        </div>
                         <div className="pt-6 border-t border-slate-700">
                            <p className="text-xs uppercase font-bold text-slate-500 mb-1">Max. Immobilien-Kaufpreis</p>
                            <div className="flex items-baseline gap-2">
                                <p className="text-5xl font-extrabold text-white tracking-tight">{maxPurchasePrice.toLocaleString(undefined, { maximumFractionDigits: 0 })} €</p>
                            </div>
                            <p className="text-xs text-slate-400 mt-2 flex items-center gap-1">
                                <DollarSign className="w-3 h-3"/> inkl. Eigenkapital & ca. 10% Nebenkosten
                            </p>
                        </div>
                    </div>
                </div>
                
                <div className="mt-8 bg-slate-800 p-4 rounded-xl text-xs text-slate-400 leading-relaxed border border-slate-700">
                    <strong>Tipp:</strong> Banken rechnen oft Pauschalen für Lebenshaltungskosten. Stelle sicher, dass deine Haushaltsrechnung realistisch ist, um Kreditablehnungen zu vermeiden.
                </div>
            </div>
        </div>
    )
}

const WealthBuilder = () => {
    const [targetAmount, setTargetAmount] = useState(50000);
    const [monthlySavings, setMonthlySavings] = useState(500);
    const [initialCapital, setInitialCapital] = useState(5000);
    const [chartData, setChartData] = useState<any[]>([]);

    useEffect(() => {
        // Calculate Time to Target
        const data = [];
        let reachedSaving = false;
        let reachedInvest = false;
        
        let currentSaving = initialCapital;
        let currentInvest = initialCapital;
        const investRate = 0.07; // 7% ETF
        const savingRate = 0.01; // 1% Bank

        // Simulate up to 30 years or until both reached
        for (let year = 0; year <= 30; year++) {
            if (currentSaving >= targetAmount && !reachedSaving) reachedSaving = true;
            if (currentInvest >= targetAmount && !reachedInvest) reachedInvest = true;

            data.push({
                year,
                Sparbuch: Math.round(currentSaving),
                ETF_Depot: Math.round(currentInvest),
                Target: targetAmount
            });

            // Compound
            currentSaving = currentSaving * (1 + savingRate) + (monthlySavings * 12);
            currentInvest = currentInvest * (1 + investRate) + (monthlySavings * 12);

            if (reachedSaving && reachedInvest && year > 5) break; 
        }
        setChartData(data);
    }, [targetAmount, monthlySavings, initialCapital]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-6">
                 <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                        <PiggyBank className="w-5 h-5 text-slate-400"/> Spar-Ziele
                    </h3>
                    <div className="space-y-5">
                        <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
                             <label className="text-xs font-bold text-indigo-800 uppercase tracking-wider mb-1.5 block">Ziel-Eigenkapital</label>
                             <div className="relative">
                                <input type="number" value={targetAmount} onChange={e => setTargetAmount(Number(e.target.value))} className="w-full p-2 bg-white border border-indigo-200 rounded-lg font-bold text-lg text-indigo-700 focus:ring-2 focus:ring-accent outline-none" />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-indigo-400">€</span>
                            </div>
                        </div>

                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Startkapital heute</label>
                            <div className="relative">
                                <input type="number" value={initialCapital} onChange={e => setInitialCapital(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-accent outline-none" />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">€</span>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5 block">Monatliche Sparrate</label>
                            <div className="relative">
                                <input type="number" value={monthlySavings} onChange={e => setMonthlySavings(Number(e.target.value))} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-accent outline-none" />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">€</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-2xl">
                    <h4 className="font-bold text-emerald-800 mb-2 flex items-center gap-2"><Clock className="w-4 h-4"/> Zeitersparnis</h4>
                    <p className="text-sm text-emerald-700 leading-relaxed">
                        Mit einem ETF-Depot (Ø 7%) erreichst du dein Ziel deutlich schneller als auf dem Sparbuch (Ø 1%). 
                        <br/><br/>
                        <strong>Der Zinseszins arbeitet für dich und dein Eigenkapital.</strong>
                    </p>
                </div>
            </div>

            <div className="lg:col-span-8 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 min-h-[400px]">
                 <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-slate-800">Kapitalentwicklung</h3>
                    <div className="flex gap-4 text-xs font-bold">
                        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-slate-300"></div> Sparbuch (1%)</span>
                        <span className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-emerald-500"></div> ETF Depot (7%)</span>
                    </div>
                 </div>
                 
                 <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                        <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} label={{ value: 'Jahre', position: 'insideBottom', offset: -5, fontSize: 10, fill: '#94a3b8' }}/>
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} tickFormatter={(val) => `${val/1000}k`}/>
                        <Tooltip 
                            cursor={{fill: '#f8fafc'}}
                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                            formatter={(value: number) => `${value.toLocaleString()} €`}
                        />
                        <ReferenceLine y={targetAmount} label={{ value: 'Ziel', position: 'right', fill: '#f59e0b', fontSize: 12, fontWeight: 'bold' }} stroke="#f59e0b" strokeDasharray="3 3" />
                        <Bar dataKey="Sparbuch" fill="#cbd5e1" radius={[4, 4, 0, 0]} barSize={20} />
                        <Bar dataKey="ETF_Depot" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} />
                    </BarChart>
                 </ResponsiveContainer>
            </div>
        </div>
    );
}