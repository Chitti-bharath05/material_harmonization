import React, { useState } from 'react';
import { 
  TrendingUp, 
  Layers, 
  CheckCircle, 
  IndianRupee, 
  Building2, 
  PieChart, 
  ArrowRight, 
  Sparkles, 
  ShieldCheck,
  Percent
} from 'lucide-react';

export default function Dashboard({ analytics, onNavigateToStudio }) {
  const [savingsRate, setSavingsRate] = useState(14.2);

  const kpis = analytics?.kpis || {
    total_materials: 16,
    harmonized_count: 3,
    unharmonized_count: 13,
    duplicate_rate_pct: 50.0,
    total_spend_crores: 14.85,
    estimated_savings_crores: 2.11,
    participating_cpses: 6,
  };

  const calculatedSavings = (
    (kpis.total_spend_crores * (savingsRate / 100))
  ).toFixed(2);

  const cpseProgress = analytics?.cpse_progress || [
    { cpse: 'ONGC', total: 4, harmonized: 2, progress_pct: 50.0 },
    { cpse: 'IOCL', total: 3, harmonized: 1, progress_pct: 33.3 },
    { cpse: 'GAIL', total: 2, harmonized: 1, progress_pct: 50.0 },
    { cpse: 'SAIL', total: 3, harmonized: 0, progress_pct: 0.0 },
    { cpse: 'BHEL', total: 2, harmonized: 1, progress_pct: 50.0 },
    { cpse: 'NTPC', total: 2, harmonized: 0, progress_pct: 0.0 },
  ];

  const categoryBreakdown = analytics?.category_breakdown || [
    { category: 'Piping & Valves', count: 7 },
    { category: 'Mechanical & Bearings', count: 3 },
    { category: 'Electrical & Instrumentation', count: 2 },
    { category: 'Fasteners & Hardware', count: 2 },
    { category: 'Rotary Equipment', count: 2 },
  ];

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Top Banner */}
      <div className="glass-card rounded-2xl p-6 sm:p-8 relative overflow-hidden border border-sky-500/20 bg-gradient-to-r from-slate-900/90 via-sky-950/40 to-slate-900/90">
        <div className="absolute -right-16 -top-16 w-64 h-64 bg-sky-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs font-medium">
              <Sparkles className="w-3.5 h-3.5" />
              <span>National Unified Material Master Initiative</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              One Nation – One Material Code for CPSEs
            </h2>
            <p className="text-slate-300 text-sm leading-relaxed">
              Standardizing, deduplicating, and rationalizing cross-enterprise material masters across 
              India's major public sector enterprises to enable joint procurement, reduce redundant inventory, and unlock volume economies of scale.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={onNavigateToStudio}
              className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold text-sm shadow-lg shadow-sky-500/25 transition-all"
            >
              <span>Explore Deduplication Studio</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Total Cataloged */}
        <div className="glass-card rounded-xl p-5 border border-slate-800 hover:border-sky-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Cataloged Items</span>
            <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-white font-mono">{kpis.total_materials}</span>
            <span className="text-xs text-slate-400">across 6 CPSEs</span>
          </div>
          <div className="mt-3 text-xs text-slate-400 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-sky-400" />
            <span>Active SAP/ERP sync feeds</span>
          </div>
        </div>

        {/* Duplicate Density */}
        <div className="glass-card rounded-xl p-5 border border-slate-800 hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Cross-CPSE Duplicate Rate</span>
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Percent className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-amber-400 font-mono">{kpis.duplicate_rate_pct}%</span>
            <span className="text-xs text-amber-300/80">Identified overlap</span>
          </div>
          <div className="mt-3 text-xs text-slate-400">
            <span>High potential for item rationalization</span>
          </div>
        </div>

        {/* Harmonized to CNMC */}
        <div className="glass-card rounded-xl p-5 border border-slate-800 hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Harmonized to CNMC</span>
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <CheckCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-emerald-400 font-mono">{kpis.harmonized_count}</span>
            <span className="text-xs text-slate-400">approved codes</span>
          </div>
          <div className="mt-3 text-xs text-emerald-400/90 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Consortium governance approved</span>
          </div>
        </div>

        {/* Estimated Demand Savings */}
        <div className="glass-card rounded-xl p-5 border border-slate-800 hover:border-purple-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">Demand Aggregation</span>
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold text-purple-400 font-mono">₹{calculatedSavings} Cr</span>
            <span className="text-xs text-purple-300/80">Est. Savings</span>
          </div>
          <div className="mt-3 text-xs text-slate-400 flex items-center gap-1">
            <TrendingUp className="w-3.5 h-3.5 text-purple-400" />
            <span>Based on {savingsRate}% volume rebate</span>
          </div>
        </div>

      </div>

      {/* Demand Aggregation Interactive Calculator */}
      <div className="glass-card rounded-xl p-6 border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <IndianRupee className="w-4 h-4 text-emerald-400" />
              <span>Inter-CPSE Procurement Demand Aggregation Model</span>
            </h3>
            <p className="text-xs text-slate-400">
              Simulate procurement cost reduction when multiple CPSEs (e.g. ONGC + IOCL + GAIL) pool annual requirement volumes for identical standardized materials.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-slate-900/90 p-3 rounded-xl border border-slate-800">
            <span className="text-xs text-slate-300 font-medium whitespace-nowrap">Volume Rebate Rate:</span>
            <input
              type="range"
              min="8.0"
              max="25.0"
              step="0.5"
              value={savingsRate}
              onChange={(e) => setSavingsRate(parseFloat(e.target.value))}
              className="w-36 accent-sky-400 cursor-pointer"
            />
            <span className="font-mono text-sm font-bold text-sky-400 w-14 text-right">
              {savingsRate}%
            </span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 pt-6 border-t border-slate-800/80 text-center">
          <div className="p-3 bg-slate-900/50 rounded-lg">
            <div className="text-xs text-slate-400">Total Analyzed Catalog Spend</div>
            <div className="text-xl font-bold font-mono text-slate-200 mt-1">₹{kpis.total_spend_crores} Crores</div>
          </div>
          <div className="p-3 bg-slate-900/50 rounded-lg">
            <div className="text-xs text-slate-400">Projected Unified Procurement Spend</div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">
              ₹{(kpis.total_spend_crores - parseFloat(calculatedSavings)).toFixed(2)} Crores
            </div>
          </div>
          <div className="p-3 bg-emerald-950/30 border border-emerald-500/20 rounded-lg">
            <div className="text-xs text-emerald-300">Net National Exchequer Savings</div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">₹{calculatedSavings} Crores</div>
          </div>
        </div>
      </div>

      {/* Two Column Grid: CPSE Progress & Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CPSE Rationalization Progress */}
        <div className="glass-card rounded-xl p-6 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <Building2 className="w-4 h-4 text-sky-400" />
              <span>CPSE Master Harmonization Progress</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">6 Participating Enterprises</span>
          </div>

          <div className="space-y-4">
            {cpseProgress.map((item) => (
              <div key={item.cpse} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-200">{item.cpse}</span>
                    <span className="text-slate-500">({item.harmonized} / {item.total} harmonized)</span>
                  </div>
                  <span className="font-mono text-slate-400 font-medium">{item.progress_pct}%</span>
                </div>
                <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-sky-500 to-blue-500 rounded-full transition-all duration-500"
                    style={{ width: `${item.progress_pct}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Category Distribution Breakdown */}
        <div className="glass-card rounded-xl p-6 border border-slate-800 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-white flex items-center gap-2">
              <PieChart className="w-4 h-4 text-purple-400" />
              <span>Domain Material Classification</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">UNSPSC / CPSE Taxonomy</span>
          </div>

          <div className="space-y-3.5">
            {categoryBreakdown.map((cat, idx) => {
              const colors = [
                'bg-sky-500 text-sky-400', 
                'bg-purple-500 text-purple-400', 
                'bg-amber-500 text-amber-400', 
                'bg-emerald-500 text-emerald-400',
                'bg-rose-500 text-rose-400'
              ];
              const colorClass = colors[idx % colors.length];
              return (
                <div key={cat.category} className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/50 border border-slate-800/80">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-2.5 h-2.5 rounded-full ${colorClass.split(' ')[0]}`}></span>
                    <span className="text-xs font-medium text-slate-300">{cat.category}</span>
                  </div>
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                    {cat.count} items
                  </span>
                </div>
              );
            })}
          </div>
        </div>

      </div>

    </div>
  );
}
