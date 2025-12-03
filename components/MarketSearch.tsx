import React, { useState } from 'react';
import { analyzeExternalLink, searchMarket } from '../services/geminiService';
import { Search, Link as LinkIcon, ExternalLink, Loader2, ArrowRight } from 'lucide-react';

export const MarketSearch: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [searchResults, setSearchResults] = useState<{ text: string, chunks: any[] } | null>(null);
  const [linkAnalysis, setLinkAnalysis] = useState<string | null>(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingLink, setLoadingLink] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery) return;
    setLoadingSearch(true);
    const res = await searchMarket(searchQuery);
    setSearchResults(res);
    setLoadingSearch(false);
  };

  const handleLinkAnalysis = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!linkUrl) return;
    setLoadingLink(true);
    setLinkAnalysis(null);
    const res = await analyzeExternalLink(linkUrl);
    setLinkAnalysis(res);
    setLoadingLink(false);
  };

  // Helper to extract domain for display
  const getDomain = (url: string) => {
      try {
          return new URL(url).hostname.replace('www.', '');
      } catch {
          return 'Link';
      }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 space-y-12 animate-in fade-in duration-500">
      
      {/* Header Section */}
      <div className="text-center space-y-2 mb-10">
          <h2 className="text-3xl font-bold text-primary">Markt & Deals</h2>
          <p className="text-slate-500">Analysiere Inserate oder finde neue Immobilien am Markt.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Left Column: Link Checker */}
          <div className="lg:col-span-5 space-y-6">
               <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                            <LinkIcon className="w-5 h-5"/>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Deal Check</h3>
                    </div>
                    <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                        Füge einen Link von Willhaben, ImmoScout24 etc. ein für eine KI-Bewertung.
                    </p>
                    <form onSubmit={handleLinkAnalysis} className="space-y-3">
                        <input 
                            type="url" 
                            placeholder="https://www.willhaben.at/..." 
                            className="w-full p-3 border border-slate-200 rounded-xl focus:ring-2 focus:ring-accent focus:border-accent outline-none text-sm transition-all"
                            value={linkUrl}
                            onChange={e => setLinkUrl(e.target.value)}
                        />
                        <button 
                            type="submit" 
                            disabled={loadingLink}
                            className="w-full bg-slate-800 text-white py-3 rounded-xl font-medium hover:bg-slate-900 disabled:opacity-70 flex items-center justify-center gap-2 transition-all shadow-lg shadow-slate-200"
                        >
                            {loadingLink ? <Loader2 className="animate-spin w-4 h-4"/> : 'Jetzt Analysieren'}
                        </button>
                    </form>

                    {linkAnalysis && (
                        <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200 text-sm text-slate-700 leading-relaxed whitespace-pre-wrap animate-in slide-in-from-top-2">
                            {linkAnalysis}
                        </div>
                    )}
               </div>
          </div>

          {/* Right Column: Active Search */}
          <div className="lg:col-span-7 space-y-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 min-h-[300px]">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                            <Search className="w-5 h-5"/>
                        </div>
                        <h3 className="text-lg font-bold text-slate-800">Immobilien Suche</h3>
                    </div>

                    <form onSubmit={handleSearch} className="mb-6">
                        <div className="relative group">
                            <input 
                                type="text" 
                                placeholder="z.B. Eigentumswohnung Graz unter 250k..." 
                                className="w-full p-4 pl-12 border border-slate-200 rounded-xl shadow-sm focus:ring-2 focus:ring-accent focus:border-accent outline-none transition-all"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                            />
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-accent transition-colors w-5 h-5"/>
                            <button 
                                type="submit"
                                className="absolute right-2 top-2 bottom-2 bg-accent text-white px-5 rounded-lg font-medium hover:bg-accentHover transition shadow-md"
                            >
                                {loadingSearch ? <Loader2 className="animate-spin w-4 h-4"/> : 'Suchen'}
                            </button>
                        </div>
                    </form>

                    {searchResults && (
                        <div className="space-y-6 animate-in fade-in">
                            <div className="prose prose-sm text-slate-600 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                <p className="whitespace-pre-wrap">{searchResults.text}</p>
                            </div>
                            
                            {searchResults.chunks.length > 0 && (
                                <div className="space-y-4">
                                    <h4 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Gefundene Angebote</h4>
                                    <div className="grid grid-cols-1 gap-3">
                                        {searchResults.chunks.map((chunk, i) => (
                                            chunk.web?.uri && (
                                                <div key={i} className="group bg-white border border-slate-200 p-4 rounded-xl hover:shadow-md hover:border-accent/30 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                                                    <div className="flex-1 min-w-0">
                                                        <h5 className="font-semibold text-slate-800 truncate pr-4" title={chunk.web.title}>
                                                            {chunk.web.title || "Immobilienangebot"}
                                                        </h5>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className="text-xs font-medium px-2 py-0.5 bg-slate-100 text-slate-500 rounded">
                                                                {getDomain(chunk.web.uri)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    
                                                    <a 
                                                        href={chunk.web.uri} 
                                                        target="_blank" 
                                                        rel="noreferrer"
                                                        className="flex items-center justify-center gap-2 bg-slate-900 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-accent transition-colors shadow-sm whitespace-nowrap"
                                                    >
                                                        Zum Angebot <ArrowRight className="w-3 h-3"/>
                                                    </a>
                                                </div>
                                            )
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                </div>
          </div>

      </div>
    </div>
  );
};