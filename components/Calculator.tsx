import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { CalculatorState, FinancialResult } from '../types';
import { analyzeLocationAndFairness, analyzeFinancialDeepDive } from '../services/geminiService';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine, ComposedChart, Line } from 'recharts';
import { Loader2, TrendingUp, TrendingDown, MapPin, Calculator as CalcIcon, Sliders, LineChart as ChartIcon, CalendarClock, Euro, Percent, Sparkles, BookOpen, ArrowLeftRight, Coins } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444']; // Modernized palette

const INITIAL_STATE: CalculatorState = {
  purchasePrice: 250000,
  renovationCost: 15000,
  closingCostsPercent: 10, // ~3.5% GrESt, 1.1% GB, 3.6% Makler, 2% Notar
  interestRate: 3.8,
  loanTermYears: 30,
  downPaymentMode: 'percent',
  downPaymentValue: 20,
  monthlyRent: 1200,
  monthlyMaintenance: 250,
  location: 'Wien, 1100',
};

// UI Component for modern inputs
const InputField = ({ label, value, onChange, type = "number", suffix, step }: any) => (
    <div className="relative group">
        <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1.5">{label}</label>
        <div className="relative">
            <input
                type={type}
                step={step}
                value={value}
                onChange={(e) => onChange(type === "number" ? Number(e.target.value) : e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-medium rounded-lg p-2.5 pl-3 focus:bg-white focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all shadow-sm"
            />
            {suffix && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-medium">{suffix}</span>
            )}
        </div>
    </div>
);

export const Calculator: React.FC = () => {
  const [state, setState] = useState<CalculatorState>(INITIAL_STATE);
  const [result, setResult] = useState<FinancialResult | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<{ text: string; sources: string[] } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [, setTargetRoi] = useState<number>(0);
  
  // New State for Deep Dive
  const [deepDiveAnalysis, setDeepDiveAnalysis] = useState<string | null>(null);
  const [isDeepDiving, setIsDeepDiving] = useState(false);

  // Scenario State
  const [simulatedRent, setSimulatedRent] = useState<number>(INITIAL_STATE.monthlyRent);
  const [indexationRate, setIndexationRate] = useState<number>(2.0); // Annual rent increase %
  const [inflationRate, setInflationRate] = useState<number>(2.0); // Maintenance cost increase %

  // Rent vs Sell State
  const [showExitStrategy, setShowExitStrategy] = useState(false);
  const [alternativeReturn, setAlternativeReturn] = useState(6.0); // ETF Return %
  const [propertyAppreciation, setPropertyAppreciation] = useState(2.0); // Property Value Increase %
  const [sellingTaxPercent, setSellingTaxPercent] = useState(30.0); // ImmoESt (Austria) approx

  // Calculate Logic
  const calculateFinancials = useCallback(() => {
    const {
      purchasePrice,
      renovationCost,
      closingCostsPercent,
      interestRate,
      loanTermYears,
      downPaymentMode,
      downPaymentValue,
      monthlyRent,
      monthlyMaintenance,
    } = state;

    const closingCosts = purchasePrice * (closingCostsPercent / 100);
    const totalCost = purchasePrice + closingCosts + renovationCost;

    let downPaymentAmount = 0;
    if (downPaymentMode === 'percent') {
      downPaymentAmount = purchasePrice * (downPaymentValue / 100);
    } else {
      downPaymentAmount = downPaymentValue;
    }

    const totalInvestment = downPaymentAmount + closingCosts + renovationCost; // Invested Capital (Cash needed)
    const loanAmount = Math.max(0, purchasePrice - downPaymentAmount);

    // Annuity Loan Formula
    const monthlyRateDecimal = interestRate / 100 / 12;
    const numberOfPayments = loanTermYears * 12;
    
    let monthlyLoanPayment = 0;
    if (loanAmount > 0 && monthlyRateDecimal > 0) {
      monthlyLoanPayment = (loanAmount * monthlyRateDecimal) / (1 - Math.pow(1 + monthlyRateDecimal, -numberOfPayments));
    } else if (loanAmount > 0) {
        monthlyLoanPayment = loanAmount / numberOfPayments;
    }

    const monthlyExpenses = monthlyLoanPayment + monthlyMaintenance;
    const monthlyCashflow = monthlyRent - monthlyExpenses;
    const annualCashflow = monthlyCashflow * 12;

    const roi = totalInvestment > 0 ? (annualCashflow / totalInvestment) * 100 : 0;
    const amortizationYears = annualCashflow > 0 ? totalInvestment / annualCashflow : 0;

    // Break Even Rent (to cover expenses)
    const breakEvenRent = monthlyExpenses;

    setResult({
      totalInvestment,
      loanAmount,
      monthlyRate: monthlyLoanPayment,
      monthlyCashflow,
      roi,
      breakEvenRent,
      totalCost,
      amortizationYears,
    });
    
  }, [state]);

  useEffect(() => {
    calculateFinancials();
  }, [calculateFinancials]);

  // Sync simulated rent when main rent changes manually
  useEffect(() => {
    setSimulatedRent(state.monthlyRent);
  }, [state.monthlyRent]);

  // Handle Input Changes
  const handleChange = (field: keyof CalculatorState, value: any) => {
    setState(prev => ({ ...prev, [field]: value }));
    // Reset analysis when key values change to encourage re-checking
    if (['purchasePrice', 'monthlyRent', 'location'].includes(field)) {
        setDeepDiveAnalysis(null);
    }
  };

  // Slider Logic: Change ROI -> Calculate needed Rent
  const handleTargetRoiChange = (newRoi: number) => {
    setTargetRoi(newRoi);
    if (!result) return;
    
    const annualCashflowNeeded = (newRoi / 100) * result.totalInvestment;
    const monthlyCashflowNeeded = annualCashflowNeeded / 12;
    const expenses = result.monthlyRate + state.monthlyMaintenance;
    const requiredRent = monthlyCashflowNeeded + expenses;

    setState(prev => ({ ...prev, monthlyRent: parseFloat(requiredRent.toFixed(2)) }));
  };

  // AI Analysis (Location)
  const handleAiAnalyze = async () => {
    if (!state.location) return;
    setIsAnalyzing(true);
    setAiAnalysis(null);
    const res = await analyzeLocationAndFairness(
        state.location, 
        state.purchasePrice, 
        0, // Size not in main inputs, optional
        state.renovationCost
    );
    setAiAnalysis(res);
    setIsAnalyzing(false);
  };

  // AI Deep Dive (Financial)
  const handleFinancialDeepDive = async () => {
      if (!result) return;
      setIsDeepDiving(true);
      const res = await analyzeFinancialDeepDive({
          purchasePrice: state.purchasePrice,
          monthlyRent: state.monthlyRent,
          monthlyRate: result.monthlyRate,
          roi: result.roi,
          location: state.location,
          equity: result.totalInvestment
      });
      setDeepDiveAnalysis(res);
      setIsDeepDiving(false);
  };

  // Simulation Data (Real-time calculation based on simulatedRent)
  useMemo(() => {
      if (!result) return null;
      const monthlyExpenses = result.monthlyRate + state.monthlyMaintenance;
      const simCashflow = simulatedRent - monthlyExpenses;
      const simRoi = (simCashflow * 12 / result.totalInvestment) * 100;
      return {
          cashflow: simCashflow,
          roi: simRoi,
          diff: simCashflow - result.monthlyCashflow
      };
  }, [result, simulatedRent, state.monthlyMaintenance]);

  // Advanced Projection & Dynamic Break Even
  const { projectionData, dynamicBreakEvenYear, staticBreakEvenYear } = useMemo(() => {
      if (!result) return { projectionData: [], dynamicBreakEvenYear: null, staticBreakEvenYear: null };
      
      const data = [];
      // Use simulatedRent here to make the chart and break-even interactive with the slider
      let currentRent = simulatedRent;
      let currentMaintenance = state.monthlyMaintenance;
      const loanRate = result.monthlyRate; 
      let accumulatedCashflow = -result.totalInvestment; // Start in debt (Equity)
      
      let foundDynamicBreakEven = null;
      let foundStaticBreakEven = null;

      // Calculate static simply based on initial cashflow derived from SIMULATED rent
      const initialSimulatedMonthlyCashflow = simulatedRent - (loanRate + currentMaintenance);
      if (initialSimulatedMonthlyCashflow > 0) {
          foundStaticBreakEven = result.totalInvestment / (initialSimulatedMonthlyCashflow * 12);
      }

      // Simulate up to Loan Term + 10 Years to show post-loan effect
      const maxYears = state.loanTermYears + 10;

      for(let year = 1; year <= maxYears; year++) {
          const annualRent = currentRent * 12;
          
          // Loan drops off after term
          const isLoanActive = year <= state.loanTermYears;
          const annualLoanCost = isLoanActive ? loanRate * 12 : 0;
          const annualMaintenance = currentMaintenance * 12;
          
          const annualExpenses = annualLoanCost + annualMaintenance;
          const annualCashflow = annualRent - annualExpenses;
          
          const prevAccumulated = accumulatedCashflow;
          accumulatedCashflow += annualCashflow;

          // Check for Break Even Crossing
          if (foundDynamicBreakEven === null && accumulatedCashflow >= 0) {
              // Interpolate for more precision
              const fraction = Math.abs(prevAccumulated) / annualCashflow;
              foundDynamicBreakEven = (year - 1) + fraction;
          }

          data.push({
              year,
              miete: annualRent,
              kosten: annualExpenses,
              cashflow: annualCashflow,
              accumulated: accumulatedCashflow,
              isLoanActive
          });

          // Apply Indexation for next year
          currentRent = currentRent * (1 + indexationRate / 100);
          currentMaintenance = currentMaintenance * (1 + inflationRate / 100);
      }
      return { projectionData: data, dynamicBreakEvenYear: foundDynamicBreakEven, staticBreakEvenYear: foundStaticBreakEven };
  }, [result, simulatedRent, state.monthlyMaintenance, state.loanTermYears, indexationRate, inflationRate]);

  // RENT VS SELL Logic
  const rentVsSellData = useMemo(() => {
      if (!result) return [];
      const data = [];
      const maxYears = 20;

      // Parameters
      let currentPropertyValue = state.purchasePrice + state.renovationCost; // Start value
      let currentLoanBalance = result.loanAmount;
      const loanRateDecimal = state.interestRate / 100 / 12;
      const monthlyPayment = result.monthlyRate;
      
      let currentRent = simulatedRent;
      let currentMaintenance = state.monthlyMaintenance;
      
      let accumulatedWealthRent = result.totalInvestment * -1; // Initial investment cost
      // Actually, for wealth comparison, we start at 0 (baseline) or Equity.
      // Strategy 1 (Rent): Wealth = (PropertyValue - LoanBalance) + AccumulatedNetCashflow
      // Strategy 2 (Sell): Wealth = (SalesProceedsInvested)
      // Initial Wealth if Sold Today: (Price - Costs - Loan) - Tax.
      // Let's assume we own it NOW.
      
      let accumulatedCashflowRent = 0;
      
      // Calculate initial proceeds if sold immediately (Year 0)
      // Assume Selling Costs ~3% (Broker/Legal)
      const sellingCostsRate = 0.03; 
      
      for(let year = 0; year <= maxYears; year++) {
          
          // --- Strategy: Keep & Rent ---
          // Equity in House
          const equityInHouse = currentPropertyValue - currentLoanBalance;
          const wealthRent = equityInHouse + accumulatedCashflowRent;

          // --- Strategy: Sell & Invest ---
          // If sold at start of this year
          const salesPrice = currentPropertyValue;
          const costOfSale = salesPrice * sellingCostsRate;
          const taxableGain = Math.max(0, salesPrice - (state.purchasePrice + state.renovationCost)); // Simplified
          const tax = taxableGain * (sellingTaxPercent / 100);
          const netProceeds = salesPrice - costOfSale - currentLoanBalance - tax;
          
          // If we had sold at Year 0 and invested? Or Sell at Year X?
          // Common comparison: Sell NOW (Year 0) vs Rent for X Years.
          // Wealth Sell (if sold at Year 0 and compounded):
          // Initial Proceeds at Year 0:
          const initialSalesPrice = state.purchasePrice + state.renovationCost; // Approx
          const initialProceeds = (initialSalesPrice * (1-sellingCostsRate)) - result.loanAmount - 0; // Tax 0 at start usually
          // But usually we compare: What if I sell NOW vs Keep.
          // So "Wealth Sell" is: Sell at Year 0, then invest in ETF.
          const wealthSellStrategy = Math.max(0, (result.totalInvestment)) * Math.pow(1 + alternativeReturn / 100, year);
          // Wait, if I sell, I get (Price - Loan). If I just bought, I get (Price - Loan) approx Downpayment.
          // Let's assume Wealth Sell = Downpayment * (1+ETF)^Year. 
          // Better: Calculate "Net Worth" if sold AT that year vs Net Worth if Kept.
          // Actually, standard Rent vs Buy calc compares:
          // A) Net Worth if I keep renting out (Equity + Cashflow)
          // B) Net Worth if I sell NOW and put money in ETF.
          
          // Let's use B: Sell NOW (at Year 0, which is just Equity) and compound.
          const initialEquity = result.totalInvestment; // This is what we put in.
          const wealthSellETF = initialEquity * Math.pow(1 + alternativeReturn / 100, year);

          data.push({
              year,
              wealthRent: Math.round(wealthRent), // Keeping property
              wealthSell: Math.round(wealthSellETF), // Selling and investing equity in ETF
          });

          // Update for next loop
          // 1. Property Value
          currentPropertyValue = currentPropertyValue * (1 + propertyAppreciation / 100);
          
          // 2. Loan Balance (Amortization)
          if(currentLoanBalance > 0) {
              // 12 months of amortization
              for(let m=0; m<12; m++) {
                  const interest = currentLoanBalance * loanRateDecimal;
                  const principal = monthlyPayment - interest;
                  currentLoanBalance -= principal;
                  if(currentLoanBalance < 0) currentLoanBalance = 0;
              }
          }

          // 3. Cashflow accumulation
          const annualRent = currentRent * 12;
          const annualCost = (monthlyPayment * 12) + (currentMaintenance * 12); // Mortgage + Maint
          const annualNet = annualRent - annualCost;
          accumulatedCashflowRent += annualNet; // Assume 0% reinvestment of cashflow for simplicity, or just pile it up

          // Indexation
          currentRent *= (1 + indexationRate / 100);
          currentMaintenance *= (1 + inflationRate / 100);
      }
      return data;

  }, [result, state, simulatedRent, indexationRate, inflationRate, propertyAppreciation, alternativeReturn, sellingTaxPercent]);


  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 px-4">
      {/* Input Section */}
      <div className="xl:col-span-4 space-y-6 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200 h-fit">
        <div className="flex items-center gap-3 border-b border-slate-100 pb-4 mb-6">
             <div className="p-2 bg-slate-100 rounded-lg">
                 <CalcIcon className="w-5 h-5 text-slate-600" />
             </div>
             <h2 className="text-lg font-bold text-slate-800">Immobilien Daten</h2>
        </div>

        <div className="space-y-5">
            <InputField 
                label="Kaufpreis" 
                value={state.purchasePrice} 
                onChange={(v: number) => handleChange('purchasePrice', v)}
                suffix="€"
            />

            <div>
                <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1.5">Lage (PLZ, Ort)</label>
                <div className="flex gap-2">
                    <input
                    type="text"
                    value={state.location}
                    onChange={(e) => handleChange('location', e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-800 font-medium rounded-lg p-2.5 focus:bg-white focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all shadow-sm"
                    />
                    <button 
                        onClick={handleAiAnalyze}
                        disabled={isAnalyzing}
                        className="bg-slate-800 text-white p-2.5 rounded-lg hover:bg-slate-900 transition disabled:opacity-50 shadow-md"
                        title="KI Standort Analyse"
                    >
                        {isAnalyzing ? <Loader2 className="animate-spin w-5 h-5"/> : <MapPin className="w-5 h-5"/>}
                    </button>
                </div>
            </div>

            <InputField 
                label="Sanierungskosten" 
                value={state.renovationCost} 
                onChange={(v: number) => handleChange('renovationCost', v)}
                suffix="€"
            />

            <div className="grid grid-cols-2 gap-4">
                <InputField 
                    label="Nebenkosten" 
                    value={state.closingCostsPercent} 
                    onChange={(v: number) => handleChange('closingCostsPercent', v)}
                    suffix="%"
                    step="0.1"
                />
                <InputField 
                    label="Zinssatz" 
                    value={state.interestRate} 
                    onChange={(v: number) => handleChange('interestRate', v)}
                    suffix="%"
                    step="0.1"
                />
            </div>

            <InputField 
                label="Kreditlaufzeit" 
                value={state.loanTermYears} 
                onChange={(v: number) => handleChange('loanTermYears', v)}
                suffix="Jahre"
            />

            {/* Down Payment Toggle */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                 <div className="flex justify-between items-center mb-3">
                    <label className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Eigenkapital</label>
                    <div className="flex bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
                        <button 
                            onClick={() => handleChange('downPaymentMode', 'percent')}
                            className={`px-3 py-1 rounded text-xs font-bold transition ${state.downPaymentMode === 'percent' ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            %
                        </button>
                        <button 
                            onClick={() => handleChange('downPaymentMode', 'absolute')}
                            className={`px-3 py-1 rounded text-xs font-bold transition ${state.downPaymentMode === 'absolute' ? 'bg-primary text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                        >
                            €
                        </button>
                    </div>
                 </div>
                 <div className="relative">
                    <input
                        type="number"
                        value={state.downPaymentValue}
                        onChange={(e) => handleChange('downPaymentValue', Number(e.target.value))}
                        className="w-full bg-white border border-slate-200 rounded-lg p-2 focus:ring-2 focus:ring-accent outline-none"
                    />
                    <span className="absolute right-3 top-2 text-slate-400 text-sm">{state.downPaymentMode === 'percent' ? '%' : '€'}</span>
                 </div>
                 {result && (
                     <div className="mt-2 text-right">
                         <span className="text-xs text-slate-500">Total Invest: <span className="font-bold">{result.totalInvestment.toLocaleString()} €</span></span>
                     </div>
                 )}
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                <InputField 
                    label="Kaltmiete (Mtl.)" 
                    value={state.monthlyRent} 
                    onChange={(v: number) => handleChange('monthlyRent', v)}
                    suffix="€"
                />
                <InputField 
                    label="Bewirtschaftung (Mtl.)" 
                    value={state.monthlyMaintenance} 
                    onChange={(v: number) => handleChange('monthlyMaintenance', v)}
                    suffix="€"
                />
            </div>
        </div>
      </div>

      {/* Results Section */}
      <div className="xl:col-span-8 space-y-8">
        
        {/* Top KPIs Modernized */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
             {/* Enhanced Cashflow KPI */}
             <div className={`relative overflow-hidden p-6 rounded-2xl shadow-sm border transition-all ${result && result.monthlyCashflow >= 0 ? 'bg-emerald-500 text-white border-emerald-400' : 'bg-rose-500 text-white border-rose-400'}`}>
                <div className="absolute top-0 right-0 p-4 opacity-20">
                    {result && result.monthlyCashflow >= 0 ? <TrendingUp className="w-16 h-16"/> : <TrendingDown className="w-16 h-16"/>}
                </div>
                <p className="text-xs font-medium opacity-80 mb-2 uppercase tracking-wide">Cashflow (Netto)</p>
                <div className="flex items-end gap-2">
                    <h3 className="text-4xl font-bold tracking-tight">
                        {result?.monthlyCashflow.toFixed(0)} €
                    </h3>
                    <span className="text-sm font-medium opacity-80 mb-1">/ mtl</span>
                </div>
             </div>

             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between group hover:border-accent/50 transition-all">
                <div className="flex justify-between items-start">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">ROI (Eigenkapital)</p>
                    <div className="p-2 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-100 transition-colors">
                        <Percent className="w-4 h-4"/>
                    </div>
                </div>
                <h3 className="text-3xl font-bold text-slate-800">{result?.roi.toFixed(1)} %</h3>
             </div>

             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between group hover:border-accent/50 transition-all">
                <div className="flex justify-between items-start">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Min. Miete</p>
                    <div className="p-2 bg-amber-50 text-amber-600 rounded-lg group-hover:bg-amber-100 transition-colors">
                        <Euro className="w-4 h-4"/>
                    </div>
                </div>
                <h3 className="text-3xl font-bold text-slate-800">{result?.breakEvenRent.toFixed(0)} €</h3>
             </div>

             <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col justify-between group hover:border-accent/50 transition-all">
                <div className="flex justify-between items-start">
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-wide">Amortisation</p>
                    <div className="p-2 bg-purple-50 text-purple-600 rounded-lg group-hover:bg-purple-100 transition-colors">
                        <CalendarClock className="w-4 h-4"/>
                    </div>
                </div>
                <h3 className="text-3xl font-bold text-slate-800">
                     {result && result.amortizationYears > 0 && result.amortizationYears !== Infinity ? result.amortizationYears.toFixed(1) : '∞'} <span className="text-sm font-medium text-slate-400">Jahre</span>
                </h3>
             </div>
        </div>

        <div className="flex flex-wrap gap-3 justify-end">
             <button
                onClick={() => setShowExitStrategy(!showExitStrategy)}
                disabled={!result}
                className={`px-5 py-3 rounded-xl font-bold transition-all shadow-lg flex items-center gap-2 text-sm border ${showExitStrategy ? 'bg-indigo-600 text-white border-indigo-500' : 'bg-white text-slate-700 border-slate-200 hover:border-indigo-500'}`}
            >
                <ArrowLeftRight className="w-4 h-4" />
                Exit-Strategie: Verkauf vs. Vermietung
            </button>
            <button
                onClick={handleFinancialDeepDive}
                disabled={isDeepDiving || !result}
                className="bg-slate-900 text-white px-5 py-3 rounded-xl font-bold hover:bg-accent transition-all shadow-lg shadow-slate-200 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
            >
                {isDeepDiving ? <Loader2 className="animate-spin w-4 h-4" /> : <Sparkles className="w-4 h-4" />}
                KI Finanz-Check starten
            </button>
        </div>

        {/* Exit Strategy Comparison Section */}
        {showExitStrategy && result && (
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-md border border-indigo-100 animate-in slide-in-from-top-4">
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-indigo-50">
                    <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                        <Coins className="w-5 h-5"/>
                    </div>
                    <div>
                        <h3 className="font-bold text-lg text-slate-800">Exit-Vergleich: Behalten vs. Verkaufen</h3>
                        <p className="text-xs text-slate-500">Vergleich des Nettovermögens bei Vermietung vs. Verkauf & Investment (ETF)</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                     <div className="lg:col-span-1 space-y-4 bg-slate-50 p-4 rounded-xl h-fit">
                        <h4 className="font-bold text-xs uppercase text-slate-400 mb-2">Parameter</h4>
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Wertsteigerung Immo (p.a.)</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    step="0.1" 
                                    value={propertyAppreciation} 
                                    onChange={e => setPropertyAppreciation(Number(e.target.value))}
                                    className="w-full p-2 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-accent outline-none"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                            </div>
                        </div>
                         <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Alternative Rendite (ETF)</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    step="0.1" 
                                    value={alternativeReturn} 
                                    onChange={e => setAlternativeReturn(Number(e.target.value))}
                                    className="w-full p-2 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-accent outline-none"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-medium text-slate-600 block mb-1">Verkaufsteuer (ImmoESt)</label>
                            <div className="relative">
                                <input 
                                    type="number" 
                                    step="1" 
                                    value={sellingTaxPercent} 
                                    onChange={e => setSellingTaxPercent(Number(e.target.value))}
                                    className="w-full p-2 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-accent outline-none"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">%</span>
                            </div>
                        </div>
                     </div>

                     <div className="lg:col-span-3 h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                            <ComposedChart data={rentVsSellData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                                <XAxis dataKey="year" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`}/>
                                <Tooltip 
                                    contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                                    formatter={(value: number) => `${value.toLocaleString()} €`}
                                />
                                <Legend />
                                <Line type="monotone" dataKey="wealthRent" name="Vermögen (Vermietung)" stroke="#3b82f6" strokeWidth={3} dot={false} />
                                <Line type="monotone" dataKey="wealthSell" name="Vermögen (Verkauf & ETF)" stroke="#f59e0b" strokeWidth={3} dot={false} strokeDasharray="5 5" />
                            </ComposedChart>
                        </ResponsiveContainer>
                        <p className="text-center text-xs text-slate-400 mt-2">
                            Vergleich: Nettovermögen (Equity + Cashflow) beim Halten vs. Verkaufserlös heute investiert in ETF.
                        </p>
                     </div>
                </div>
            </div>
        )}

        {/* Interactive Scenario Analysis */}
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-200">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Sliders className="w-5 h-5"/>
                </div>
                <h3 className="font-bold text-lg text-slate-800">
                    Szenario & Prognose
                </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-10">
                {/* Manual Simulation */}
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/60 lg:col-span-1">
                    <h4 className="font-bold text-slate-700 mb-3 text-sm">Cashflow Simulator</h4>
                    <p className="text-xs text-slate-500 mb-6">Wie verändert sich der Ertrag bei Mietanpassung?</p>
                    
                    <div className="mb-2">
                        <div className="flex justify-between text-sm mb-3">
                            <span className="text-slate-500">Miete Soll:</span>
                            <span className="font-bold text-accent">{simulatedRent.toFixed(0)} €</span>
                        </div>
                        <input 
                            type="range" 
                            min={state.monthlyRent * 0.5} 
                            max={state.monthlyRent * 1.5} 
                            step={10}
                            value={simulatedRent}
                            onChange={(e) => setSimulatedRent(Number(e.target.value))}
                            className="w-full h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-accent hover:accent-accentHover"
                        />
                         <div className="flex justify-end mt-2">
                            <button onClick={() => setSimulatedRent(state.monthlyRent)} className="text-[10px] uppercase font-bold text-slate-400 hover:text-accent transition-colors">Reset</button>
                        </div>
                    </div>
                </div>

                {/* Indexation Settings */}
                <div className="bg-slate-50 p-5 rounded-xl border border-slate-200/60">
                    <h4 className="font-bold text-slate-700 mb-3 text-sm">Parameter (p.a.)</h4>
                    <div className="space-y-3">
                         <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-slate-500">Mietsteigerung</label>
                            <input
                                type="number"
                                step="0.1"
                                value={indexationRate}
                                onChange={(e) => setIndexationRate(Number(e.target.value))}
                                className="w-16 p-1 text-right text-sm border border-slate-300 rounded focus:ring-1 focus:ring-accent outline-none"
                            />
                        </div>
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-slate-500">Inflation</label>
                            <input
                                type="number"
                                step="0.1"
                                value={inflationRate}
                                onChange={(e) => setInflationRate(Number(e.target.value))}
                                className="w-16 p-1 text-right text-sm border border-slate-300 rounded focus:ring-1 focus:ring-accent outline-none"
                            />
                        </div>
                    </div>
                </div>

                {/* DYNAMIC BREAK EVEN BOX */}
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-5 rounded-xl text-white shadow-lg flex flex-col justify-center relative overflow-hidden">
                    <div className="relative z-10">
                        <h4 className="font-bold text-indigo-100 mb-1 flex items-center gap-2 text-sm uppercase tracking-wide">
                            Break-Even Point
                        </h4>
                        <p className="text-[10px] text-indigo-200 mb-4 opacity-80">Dyn. Berechnung inkl. Tilgung & Indexierung</p>

                        <div className="flex items-baseline gap-2">
                            {dynamicBreakEvenYear !== null ? (
                                <>
                                    <span className="text-4xl font-extrabold text-white">
                                        {dynamicBreakEvenYear.toFixed(1)}
                                    </span>
                                    <span className="text-sm font-medium text-indigo-200">Jahre</span>
                                </>
                            ) : (
                                <span className="text-lg font-medium text-indigo-200">
                                    > {state.loanTermYears + 10} Jahre
                                </span>
                            )}
                        </div>
                    </div>
                    {/* Decorational Circle */}
                    <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                </div>
            </div>
            
            {/* Projection Chart */}
            <div className="mt-8 h-[350px]">
                <h4 className="font-bold text-slate-700 mb-6 flex items-center gap-2 text-sm uppercase tracking-wide">
                    <ChartIcon className="w-4 h-4"/> 30-Jahres Cashflow Projektion (Szenario)
                </h4>
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart
                        data={projectionData}
                        margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis 
                            dataKey="year" 
                            tickLine={false} 
                            axisLine={false} 
                            tick={{fontSize: 12, fill: '#94a3b8'}}
                            dy={10}
                        />
                        
                        <YAxis 
                            tickLine={false} 
                            axisLine={false} 
                            tick={{fontSize: 12, fill: '#94a3b8'}}
                        />
                        
                        <Tooltip 
                            contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                            labelFormatter={(label) => `Jahr ${label}`} 
                            formatter={(value: number, name: string) => [`${value.toFixed(0)} €`, name]} 
                        />
                        <Legend wrapperStyle={{ paddingTop: '20px' }} />

                        {/* Loan End Reference Line */}
                        <ReferenceLine x={state.loanTermYears} stroke="#ef4444" strokeDasharray="3 3" label={{ position: 'top', value: 'Kredit Ende', fill: '#ef4444', fontSize: 10 }} />
                        <ReferenceLine y={0} stroke="#cbd5e1" strokeWidth={2} />
                        
                        {/* Annual Cashflow Bar */}
                        <Bar 
                            dataKey="cashflow" 
                            name="Jährlicher Cashflow" 
                            fill="#10b981" 
                            barSize={20} 
                            radius={[4, 4, 0, 0]}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>

        </div>


        {/* Charts & Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 min-h-[300px]">
                <h3 className="font-bold text-slate-800 mb-6">Investitionsstruktur</h3>
                {result && (
                    <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                            <Pie
                                data={[
                                    { name: 'Kaufpreis', value: state.purchasePrice },
                                    { name: 'Nebenkosten', value: state.purchasePrice * (state.closingCostsPercent/100) },
                                    { name: 'Sanierung', value: state.renovationCost }
                                ]}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={90}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {COLORS.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                formatter={(value: number) => `${value.toFixed(0)} €`} 
                            />
                            <Legend verticalAlign='bottom' height={36}/>
                        </PieChart>
                    </ResponsiveContainer>
                )}
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 min-h-[300px]">
                <h3 className="font-bold text-slate-800 mb-6">Monatl. Kostenstruktur</h3>
                {result && (
                    <ResponsiveContainer width="100%" height={250}>
                        <BarChart
                            data={[
                                { name: 'Einnahmen', amount: state.monthlyRent, fill: '#10b981' },
                                { name: 'Kosten', amount: result.breakEvenRent, fill: '#ef4444' },
                            ]}
                            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                            <YAxis axisLine={false} tickLine={false} tick={{fontSize: 12, fill: '#64748b'}} />
                            <Tooltip 
                                cursor={{fill: 'transparent'}}
                                contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}
                                formatter={(value: number) => `${value.toFixed(0)} €`} 
                            />
                            <Bar dataKey="amount" radius={[6, 6, 0, 0]} barSize={50}>
                                {
                                    [{ name: 'Einnahmen', amount: state.monthlyRent, fill: '#10b981' },
                                    { name: 'Kosten', amount: result.breakEvenRent, fill: '#ef4444' }].map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.fill} />
                                    ))
                                }
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                )}
            </div>
        </div>

        {/* AI Analysis Container */}
        {(aiAnalysis || deepDiveAnalysis) && (
            <div className="space-y-6">
                
                {/* Location Analysis */}
                {aiAnalysis && (
                    <div className="bg-white border-l-4 border-indigo-600 p-6 rounded-r-xl shadow-lg animate-in slide-in-from-bottom-4">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                                <MapPin className="w-5 h-5"/>
                            </div>
                            <h3 className="font-bold text-lg text-slate-800">Standort & Deal Analyse</h3>
                        </div>
                        <div className="prose prose-sm prose-slate text-slate-600 max-w-none">
                            <p className="whitespace-pre-line leading-relaxed">{aiAnalysis.text}</p>
                        </div>
                        {aiAnalysis.sources.length > 0 && (
                            <div className="mt-6 pt-4 border-t border-slate-100">
                                <p className="text-[10px] uppercase font-bold text-slate-400 mb-2">Quellen</p>
                                <ul className="flex flex-wrap gap-2">
                                    {aiAnalysis.sources.slice(0,3).map((s, i) => (
                                        <li key={i}>
                                            <a href={s} target="_blank" rel="noreferrer" className="text-xs bg-slate-50 text-indigo-600 px-2 py-1 rounded border border-slate-200 hover:bg-white hover:shadow-sm transition truncate max-w-[200px] inline-block">
                                                {new URL(s).hostname.replace('www.','')}
                                            </a>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                )}

                {/* Financial Deep Dive Analysis */}
                {deepDiveAnalysis && (
                    <div className="bg-slate-900 text-slate-300 p-6 rounded-xl shadow-xl animate-in slide-in-from-bottom-4 border border-slate-700">
                        <div className="flex items-center gap-3 mb-6 border-b border-slate-700 pb-4">
                            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg">
                                <BookOpen className="w-5 h-5"/>
                            </div>
                            <div>
                                <h3 className="font-bold text-lg text-white">Finanz-Expertenmeinung</h3>
                                <p className="text-xs text-slate-500">Deep-Dive in Rendite, Risiko & Steuer</p>
                            </div>
                        </div>
                        <div className="prose prose-sm prose-invert max-w-none prose-p:text-slate-300 prose-headings:text-white prose-strong:text-white prose-li:text-slate-300">
                            <ReactMarkdown>{deepDiveAnalysis}</ReactMarkdown>
                        </div>
                    </div>
                )}
            </div>
        )}

      </div>
    </div>
  );
};