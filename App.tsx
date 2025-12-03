import React, { useState } from 'react';
import { AppTab } from './types';
import { Calculator } from './components/Calculator';
import { PortfolioPlanner } from './components/PortfolioPlanner';
import { MarketSearch } from './components/MarketSearch';
import { SavingsPlanner } from './components/SavingsPlanner';
import { Calculator as CalcIcon, Briefcase, Search, Building2, PiggyBank } from 'lucide-react';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AppTab>(AppTab.CALCULATOR);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans">
      {/* Modern Header */}
      <header className="bg-primary text-white shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-20 flex items-center justify-between">
            {/* Logo Area */}
            <div className="flex items-center gap-3">
                <div className="bg-gradient-to-tr from-accent to-indigo-600 p-2 rounded-xl shadow-inner border border-white/10">
                    <Building2 className="text-white w-6 h-6" />
                </div>
                <div>
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white leading-none">
                        SKT Finance
                    </h1>
                    <span className="text-xs text-slate-400 font-medium tracking-widest uppercase">Immo Rechner</span>
                </div>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex bg-slate-800/50 p-1 rounded-xl backdrop-blur-sm border border-slate-700/50">
                <button 
                    onClick={() => setActiveTab(AppTab.CALCULATOR)}
                    className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                        activeTab === AppTab.CALCULATOR 
                        ? 'bg-accent text-white shadow-md' 
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <CalcIcon className="w-4 h-4"/> Kalkulator
                </button>
                <button 
                    onClick={() => setActiveTab(AppTab.PORTFOLIO)}
                    className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                        activeTab === AppTab.PORTFOLIO 
                        ? 'bg-accent text-white shadow-md' 
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <Briefcase className="w-4 h-4"/> Strategie
                </button>
                <button 
                    onClick={() => setActiveTab(AppTab.SAVINGS)}
                    className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                        activeTab === AppTab.SAVINGS 
                        ? 'bg-accent text-white shadow-md' 
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <PiggyBank className="w-4 h-4"/> Sparplan
                </button>
                <button 
                    onClick={() => setActiveTab(AppTab.MARKET)}
                    className={`px-5 py-2.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                        activeTab === AppTab.MARKET 
                        ? 'bg-accent text-white shadow-md' 
                        : 'text-slate-300 hover:text-white hover:bg-white/5'
                    }`}
                >
                    <Search className="w-4 h-4"/> Marktsuche
                </button>
            </nav>
        </div>
      </header>

      {/* Mobile Nav */}
      <div className="md:hidden bg-white border-b border-slate-200 px-4 py-3 flex justify-between gap-2 overflow-x-auto shadow-sm sticky top-20 z-40">
             <button 
                    onClick={() => setActiveTab(AppTab.CALCULATOR)}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition whitespace-nowrap ${
                        activeTab === AppTab.CALCULATOR 
                        ? 'bg-primary text-white' 
                        : 'text-slate-500 bg-slate-50'
                    }`}
                >
                    Kalkulator
                </button>
                <button 
                    onClick={() => setActiveTab(AppTab.PORTFOLIO)}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition whitespace-nowrap ${
                        activeTab === AppTab.PORTFOLIO 
                        ? 'bg-primary text-white' 
                        : 'text-slate-500 bg-slate-50'
                    }`}
                >
                    Strategie
                </button>
                <button 
                    onClick={() => setActiveTab(AppTab.SAVINGS)}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition whitespace-nowrap ${
                        activeTab === AppTab.SAVINGS 
                        ? 'bg-primary text-white' 
                        : 'text-slate-500 bg-slate-50'
                    }`}
                >
                    Sparplan
                </button>
                <button 
                    onClick={() => setActiveTab(AppTab.MARKET)}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wide transition whitespace-nowrap ${
                        activeTab === AppTab.MARKET 
                        ? 'bg-primary text-white' 
                        : 'text-slate-500 bg-slate-50'
                    }`}
                >
                    Suche
                </button>
      </div>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-7xl mx-auto py-6 md:py-10">
        {activeTab === AppTab.CALCULATOR && <Calculator />}
        {activeTab === AppTab.PORTFOLIO && <PortfolioPlanner />}
        {activeTab === AppTab.SAVINGS && <SavingsPlanner />}
        {activeTab === AppTab.MARKET && <MarketSearch />}
      </main>
      
      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-8 mt-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
            <div className="flex justify-center items-center gap-2 mb-2 opacity-50 grayscale hover:grayscale-0 transition-all">
                 <Building2 className="w-5 h-5" />
                 <span className="font-bold">SKT Finance</span>
            </div>
            <p className="text-sm text-slate-400">
                &copy; {new Date().getFullYear()} SKT Finance Immo Rechner. Alle Berechnungen sind Indikationen ohne Gewähr.
            </p>
        </div>
      </footer>
    </div>
  );
};

export default App;