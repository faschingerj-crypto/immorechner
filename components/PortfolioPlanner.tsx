import React, { useState, useRef, useEffect } from 'react';
import { generatePortfolioStrategy, refineStrategy } from '../services/geminiService';
import { Loader2, Target, Briefcase, Coins, Calendar, TrendingUp, Building, MessageSquare, Send, User, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export const PortfolioPlanner: React.FC = () => {
  const [goalCashflow, setGoalCashflow] = useState(2000);
  const [years, setYears] = useState(10);
  const [currentCapital, setCurrentCapital] = useState(50000);
  const [targetPropertyCount, setTargetPropertyCount] = useState(3);
  const [riskProfile, setRiskProfile] = useState('Mittel (Ausgewogen)');
  const [strategy, setStrategy] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Chat State
  const [chatHistory, setChatHistory] = useState<{role: 'user'|'ai', text: string}[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleGenerate = async () => {
    setLoading(true);
    const result = await generatePortfolioStrategy(goalCashflow, years, currentCapital, riskProfile, targetPropertyCount);
    setStrategy(result || '');
    setLoading(false);
    // Reset chat when new strategy is generated
    setChatHistory([]);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!chatInput.trim() || !strategy) return;
      
      const question = chatInput;
      setChatInput('');
      setChatHistory(prev => [...prev, {role: 'user', text: question}]);
      setChatLoading(true);

      const response = await refineStrategy(strategy, question);
      setChatHistory(prev => [...prev, {role: 'ai', text: response || "Entschuldigung, ich konnte darauf keine Antwort generieren."}]);
      setChatLoading(false);
  };

  useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory]);

  return (
    <div className="max-w-5xl mx-auto px-4 space-y-8 animate-in fade-in duration-500">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-slate-800 mb-2">SKT Finance Strategie</h2>
        <p className="text-slate-500 max-w-2xl mx-auto">
            Definiere deine Ziele und lasse dir von der KI einen maßgeschneiderten Immobilien-Entwicklungsplan erstellen.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Settings Panel */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-fit lg:sticky lg:top-24">
            <div className="flex items-center gap-2 mb-6 border-b border-slate-100 pb-4">
                <Target className="w-5 h-5 text-accent"/>
                <h3 className="font-bold text-lg text-slate-800">Deine Ziele</h3>
            </div>
            
            <div className="space-y-5">
                <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1.5">Ziel Cashflow (Netto/Monat)</label>
                    <div className="relative group">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Coins className="h-4 w-4 text-slate-400 group-focus-within:text-accent transition-colors"/>
                        </div>
                        <input
                            type="number"
                            value={goalCashflow}
                            onChange={(e) => setGoalCashflow(Number(e.target.value))}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all text-slate-800 font-medium"
                        />
                        <span className="absolute right-4 top-3 text-slate-400 text-sm font-medium">€</span>
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1.5">Wunsch Anzahl Immobilien</label>
                    <div className="relative group">
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Building className="h-4 w-4 text-slate-400 group-focus-within:text-accent transition-colors"/>
                        </div>
                        <input
                            type="number"
                            value={targetPropertyCount}
                            onChange={(e) => setTargetPropertyCount(Number(e.target.value))}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all text-slate-800 font-medium"
                        />
                         <span className="absolute right-4 top-3 text-slate-400 text-sm font-medium">Einheiten</span>
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1.5">Zeitraum</label>
                    <div className="relative group">
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Calendar className="h-4 w-4 text-slate-400 group-focus-within:text-accent transition-colors"/>
                        </div>
                        <input
                            type="number"
                            value={years}
                            onChange={(e) => setYears(Number(e.target.value))}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all text-slate-800 font-medium"
                        />
                         <span className="absolute right-4 top-3 text-slate-400 text-sm font-medium">Jahre</span>
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1.5">Startkapital</label>
                    <div className="relative group">
                         <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Briefcase className="h-4 w-4 text-slate-400 group-focus-within:text-accent transition-colors"/>
                        </div>
                        <input
                            type="number"
                            value={currentCapital}
                            onChange={(e) => setCurrentCapital(Number(e.target.value))}
                            className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all text-slate-800 font-medium"
                        />
                        <span className="absolute right-4 top-3 text-slate-400 text-sm font-medium">€</span>
                    </div>
                </div>

                <div>
                    <label className="block text-[10px] uppercase tracking-wider font-bold text-slate-400 mb-1.5">Risikoprofil</label>
                    <div className="relative">
                        <select 
                            value={riskProfile} 
                            onChange={(e) => setRiskProfile(e.target.value)}
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all text-slate-800 font-medium appearance-none"
                        >
                            <option>Konservativ (Sicherheit first)</option>
                            <option>Mittel (Ausgewogen)</option>
                            <option>Aggressiv (Max. Wachstum)</option>
                        </select>
                         <TrendingUp className="absolute right-4 top-3.5 h-4 w-4 text-slate-400 pointer-events-none"/>
                    </div>
                </div>

                <button
                    onClick={handleGenerate}
                    disabled={loading}
                    className="w-full bg-slate-900 text-white py-4 rounded-xl font-bold hover:bg-accent transition-all shadow-lg shadow-slate-200 flex justify-center items-center gap-2 mt-4 disabled:opacity-70"
                >
                    {loading ? <Loader2 className="animate-spin" /> : <Target className="w-5 h-5" />}
                    Strategie berechnen
                </button>
            </div>
        </div>

        {/* Results Panel */}
        <div className="lg:col-span-2 space-y-6">
            {strategy ? (
                <>
                {/* Main Strategy Output */}
                <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 animate-in slide-in-from-bottom-4">
                     <div className="prose prose-slate max-w-none prose-headings:text-slate-800 prose-a:text-accent prose-strong:text-slate-900">
                        <ReactMarkdown>{strategy}</ReactMarkdown>
                     </div>
                </div>

                {/* AI Chat Interface */}
                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 flex flex-col h-[500px]">
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-200">
                        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                            <MessageSquare className="w-5 h-5"/>
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800">Experten Chat</h3>
                            <p className="text-xs text-slate-500">Stelle Fragen zur Strategie (z.B. "Erbe vs. Kaufen?")</p>
                        </div>
                    </div>
                    
                    <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
                        {chatHistory.length === 0 && (
                            <div className="text-center text-slate-400 mt-10">
                                <p className="text-sm">Hast du Fragen zu deiner Strategie? Frag mich einfach!</p>
                            </div>
                        )}
                        {chatHistory.map((msg, idx) => (
                            <div key={idx} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-slate-200' : 'bg-indigo-600 text-white'}`}>
                                    {msg.role === 'user' ? <User className="w-4 h-4 text-slate-600"/> : <Bot className="w-4 h-4"/>}
                                </div>
                                <div className={`p-4 rounded-2xl text-sm max-w-[80%] ${msg.role === 'user' ? 'bg-white shadow-sm border border-slate-100 text-slate-700' : 'bg-indigo-50 text-indigo-900'}`}>
                                    <ReactMarkdown>{msg.text}</ReactMarkdown>
                                </div>
                            </div>
                        ))}
                        {chatLoading && (
                             <div className="flex gap-3">
                                <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center shrink-0">
                                    <Bot className="w-4 h-4"/>
                                </div>
                                <div className="p-4 rounded-2xl bg-indigo-50 text-indigo-900 text-sm flex items-center gap-2">
                                    <Loader2 className="animate-spin w-4 h-4"/> Denke nach...
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    <form onSubmit={handleChatSubmit} className="relative">
                        <input
                            type="text"
                            value={chatInput}
                            onChange={(e) => setChatInput(e.target.value)}
                            placeholder="Deine Frage an den Strategie-Experten..."
                            disabled={chatLoading}
                            className="w-full p-4 pr-12 rounded-xl border border-slate-200 focus:ring-2 focus:ring-accent focus:border-accent outline-none shadow-sm transition-all bg-white"
                        />
                        <button 
                            type="submit" 
                            disabled={!chatInput.trim() || chatLoading}
                            className="absolute right-2 top-2 bottom-2 bg-slate-900 text-white px-4 rounded-lg hover:bg-accent transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Send className="w-4 h-4"/>
                        </button>
                    </form>
                </div>
                </>
            ) : (
                <div className="h-full min-h-[400px] flex flex-col items-center justify-center text-slate-400 bg-slate-50/50 rounded-2xl border-2 border-dashed border-slate-200">
                    <div className="p-4 bg-slate-100 rounded-full mb-4">
                        <Target className="w-8 h-8 text-slate-300" />
                    </div>
                    <p className="font-medium">Gib deine Daten ein und starte die Berechnung.</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};