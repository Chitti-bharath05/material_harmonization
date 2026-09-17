import React from 'react';
import { ShieldCheck, Activity, Database, Layers, CheckCircle2, RefreshCw } from 'lucide-react';

export default function Header({ activeTab, setActiveTab, systemHealth, onRefreshData }) {
  const tabs = [
    { id: 'dashboard', label: 'Executive Analytics', icon: Activity },
    { id: 'studio', label: 'Deduplication Studio', icon: Layers },
    { id: 'sandbox', label: 'AI Matcher Sandbox', icon: SparklesIcon },
    { id: 'governance', label: 'Governance & Audit', icon: ShieldCheck },
    { id: 'erp', label: 'SAP / ERP Hub', icon: Database },
  ];

  return (
    <header className="sticky top-0 z-50 glass-panel border-b border-sky-900/40 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Brand & National Emblem Styling */}
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-amber-500 via-sky-600 to-indigo-700 p-0.5 shadow-lg shadow-sky-500/20">
              <div className="h-full w-full bg-[#070e17] rounded-[10px] flex items-center justify-center">
                <span className="font-mono font-bold text-amber-400 text-lg tracking-wider">NUM</span>
              </div>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                  <span>National Unified Material Master</span>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/30 font-mono">
                    CPSE AI Engine
                  </span>
                </h1>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>One Nation – One Material Code</span>
                <span className="text-slate-600">•</span>
                <span className="text-slate-400">ONGC • IOCL • SAIL • BHEL • NTPC • GAIL</span>
              </p>
            </div>
          </div>

          {/* Right Status & Refresh */}
          <div className="flex items-center space-x-3">
            <div className="hidden md:flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300 font-mono">
              <span className="text-slate-400">Status:</span>
              {systemHealth?.status === 'HEALTHY' ? (
                <span className="flex items-center text-emerald-400 font-semibold gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> ONLINE ({systemHealth.materials_count} Master Items)
                </span>
              ) : (
                <span className="text-amber-400 flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 animate-spin" /> CONNECTING
                </span>
              )}
            </div>

            <button
              id="refresh-btn"
              onClick={onRefreshData}
              title="Refresh Master Data"
              className="p-2 text-slate-400 hover:text-sky-400 hover:bg-slate-800/80 rounded-lg border border-slate-800 transition-colors"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 sm:space-x-2 overflow-x-auto pb-2 sm:pb-0 scrollbar-none border-t border-slate-800/60 pt-1">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`tab-${tab.id}`}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm shadow-sky-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-sky-400' : 'text-slate-400'}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
}

function SparklesIcon(props) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z"/>
      <path d="M5 3v4"/>
      <path d="M19 17v4"/>
      <path d="M3 5h4"/>
      <path d="M17 19h4"/>
    </svg>
  );
}
