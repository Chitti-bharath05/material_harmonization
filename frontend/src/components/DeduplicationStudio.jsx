import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  GitCompare, 
  CheckCircle, 
  AlertCircle, 
  ExternalLink, 
  ChevronRight, 
  Sparkles, 
  Building2, 
  Layers, 
  Check, 
  X,
  Share2
} from 'lucide-react';
import { submitWorkflowAction, compareMaterials } from '../api';

export default function DeduplicationStudio({ materials, onRefresh, onSelectForSandbox }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCpse, setSelectedCpse] = useState('ALL');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Modal State for Side-by-Side Comparison
  const [activeCompareModal, setActiveCompareModal] = useState(false);
  const [selectedMatA, setSelectedMatA] = useState(null);
  const [selectedMatB, setSelectedMatB] = useState(null);
  const [comparisonResult, setComparisonResult] = useState(null);
  const [loadingCompare, setLoadingCompare] = useState(false);
  const [actionSuccessMessage, setActionSuccessMessage] = useState('');

  const cpses = ['ALL', 'ONGC', 'IOCL', 'GAIL', 'SAIL', 'BHEL', 'NTPC'];
  const categories = [
    'ALL', 
    'Piping & Valves', 
    'Piping & Spares',
    'Mechanical & Bearings', 
    'Electrical & Instrumentation', 
    'Fasteners & Hardware', 
    'Rotary Equipment'
  ];

  // Filtering Logic
  const filteredMaterials = materials.filter((item) => {
    if (selectedCpse !== 'ALL' && item.cpse !== selectedCpse) return false;
    if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
    if (selectedStatus !== 'ALL' && item.status !== selectedStatus) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      const matchText = `${item.raw_description} ${item.material_code} ${item.suggested_cnmc} ${item.cpse} ${item.location}`.toLowerCase();
      if (!matchText.includes(q)) return false;
    }
    return true;
  });

  const getCpseBadgeColor = (cpse) => {
    switch (cpse) {
      case 'ONGC': return 'bg-red-500/10 text-red-400 border-red-500/30';
      case 'IOCL': return 'bg-amber-500/10 text-amber-400 border-amber-500/30';
      case 'SAIL': return 'bg-blue-500/10 text-blue-400 border-blue-500/30';
      case 'BHEL': return 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30';
      case 'NTPC': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
      case 'GAIL': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
    }
  };

  const handleOpenComparison = async (matA, matB = null) => {
    setSelectedMatA(matA);
    setActionSuccessMessage('');
    
    // If matB not passed, find first duplicate candidate from different CPSE
    let targetB = matB;
    if (!targetB) {
      targetB = materials.find(
        (m) => m.id !== matA.id && (m.attributes?.component_type === matA.attributes?.component_type)
      ) || materials.find((m) => m.id !== matA.id);
    }
    setSelectedMatB(targetB);
    setActiveCompareModal(true);

    if (targetB) {
      setLoadingCompare(true);
      try {
        const res = await compareMaterials(matA.id, targetB.id);
        setComparisonResult(res.comparison);
      } catch (err) {
        console.error("Comparison error", err);
      } finally {
        setLoadingCompare(false);
      }
    }
  };

  const handleSelectDifferentMatB = async (newMatB) => {
    setSelectedMatB(newMatB);
    setLoadingCompare(true);
    try {
      const res = await compareMaterials(selectedMatA.id, newMatB.id);
      setComparisonResult(res.comparison);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCompare(false);
    }
  };

  const handleWorkflowSubmit = async (action) => {
    if (!selectedMatA) return;
    const ids = selectedMatB ? [selectedMatA.id, selectedMatB.id] : [selectedMatA.id];
    try {
      await submitWorkflowAction(
        action, 
        ids, 
        selectedMatA.suggested_cnmc,
        `Consortium Governance ${action} by CPSE Lead Reviewer`
      );
      setActionSuccessMessage(`Successfully applied ${action} across selected materials!`);
      if (onRefresh) onRefresh();
      setTimeout(() => {
        setActiveCompareModal(false);
        setActionSuccessMessage('');
      }, 1500);
    } catch (err) {
      alert(`Error submitting action: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-5 h-5 text-sky-400" />
            <span>AI Deduplication & Cross-CPSE Catalog Studio</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Identify duplicates, compare technical attribute overlaps, and harmonize CPSE codes to the Common National Material Code (CNMC).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
            Showing <strong className="text-sky-400">{filteredMaterials.length}</strong> of {materials.length} records
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="glass-card p-4 rounded-xl border border-slate-800 flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search by CPSE, legacy code, keyword, or CNMC..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/90 border border-slate-800 rounded-lg pl-10 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-sky-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* CPSE Filter */}
          <select
            value={selectedCpse}
            onChange={(e) => setSelectedCpse(e.target.value)}
            className="bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          >
            {cpses.map((c) => (
              <option key={c} value={c}>{c === 'ALL' ? 'All CPSEs' : c}</option>
            ))}
          </select>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat === 'ALL' ? 'All Categories' : cat}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="bg-slate-900/90 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
          >
            <option value="ALL">All Statuses</option>
            <option value="UNHARMONIZED">Unharmonized</option>
            <option value="HARMONIZED">Harmonized</option>
          </select>
        </div>
      </div>

      {/* Materials Master Table */}
      <div className="glass-card rounded-xl border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/90 text-slate-400 uppercase font-mono tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-4 py-3.5">CPSE / Source</th>
                <th className="px-4 py-3.5">Legacy Material Code</th>
                <th className="px-4 py-3.5 min-w-[280px]">Raw Description & AI Standardization</th>
                <th className="px-4 py-3.5">Extracted Attributes</th>
                <th className="px-4 py-3.5">Suggested CNMC</th>
                <th className="px-4 py-3.5">Status</th>
                <th className="px-4 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredMaterials.map((mat) => {
                const isHarmonized = mat.status === 'HARMONIZED';
                const attrs = mat.attributes || {};
                return (
                  <tr key={mat.id} className="hover:bg-slate-800/40 transition-colors">
                    {/* CPSE */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[11px] border font-mono ${getCpseBadgeColor(mat.cpse)}`}>
                          {mat.cpse}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono">{mat.location?.split(',')[0]}</div>
                      </div>
                    </td>

                    {/* Legacy Code */}
                    <td className="px-4 py-3.5 whitespace-nowrap font-mono font-medium text-slate-200">
                      <div>{mat.material_code}</div>
                      <div className="text-[10px] text-slate-500">{mat.erp_system?.split(' ')[0]}</div>
                    </td>

                    {/* Raw vs Standardized Description */}
                    <td className="px-4 py-3.5">
                      <div className="space-y-1">
                        <div className="text-slate-300 line-clamp-2">{mat.raw_description}</div>
                        <div className="text-[11px] text-sky-400/90 flex items-center gap-1 font-mono">
                          <Sparkles className="w-3 h-3 flex-shrink-0 text-sky-400" />
                          <span className="line-clamp-1">{mat.standardized_description}</span>
                        </div>
                      </div>
                    </td>

                    {/* Extracted Attributes Chips */}
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {attrs.grade && attrs.grade !== 'Standard Grade' && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-slate-300 font-mono">
                            {attrs.grade}
                          </span>
                        )}
                        {attrs.dimension && attrs.dimension !== 'N/A' && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-sky-300 font-mono">
                            {attrs.dimension}
                          </span>
                        )}
                        {attrs.pressure_rating && attrs.pressure_rating !== 'N/A' && (
                          <span className="px-1.5 py-0.5 rounded bg-slate-800 text-[10px] text-amber-300 font-mono">
                            {attrs.pressure_rating}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* CNMC Code */}
                    <td className="px-4 py-3.5 whitespace-nowrap font-mono text-[11px]">
                      <div className="text-emerald-400 font-semibold">{mat.suggested_cnmc}</div>
                      <div className="text-[10px] text-slate-500">UNSPSC: {mat.unspsc_code}</div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      {isHarmonized ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[11px] font-medium">
                          <CheckCircle className="w-3 h-3" /> Harmonized
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700 text-[11px]">
                          Pending Review
                        </span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3.5 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenComparison(mat)}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-400 border border-sky-500/30 text-xs font-medium transition-colors"
                          title="Compare & Find Cross-CPSE Duplicates"
                        >
                          <GitCompare className="w-3.5 h-3.5" />
                          <span>Compare</span>
                        </button>

                        <button
                          onClick={() => onSelectForSandbox(mat)}
                          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
                          title="Open in AI Sandbox"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Side-by-Side Comparison Modal */}
      {activeCompareModal && selectedMatA && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
          <div className="glass-card rounded-2xl w-full max-w-5xl border border-sky-500/30 shadow-2xl max-h-[92vh] flex flex-col overflow-hidden">
            
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <GitCompare className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <span>Cross-CPSE Material Duplicate Analysis & Diff</span>
                    {comparisonResult?.confidence_score && (
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold ${
                        comparisonResult.confidence_score >= 85 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' 
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                      }`}>
                        {comparisonResult.confidence_score}% Match Confidence
                      </span>
                    )}
                  </h3>
                  <p className="text-xs text-slate-400">
                    Deep semantic and attribute-level comparison across enterprise catalogs
                  </p>
                </div>
              </div>

              <button
                onClick={() => setActiveCompareModal(false)}
                className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              
              {actionSuccessMessage && (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>{actionSuccessMessage}</span>
                </div>
              )}

              {/* Top Verdict Card */}
              {comparisonResult && (
                <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-400 uppercase">AI Verdict</span>
                    <span className="text-xs font-mono text-sky-400">
                      Attribute Match: {comparisonResult.attribute_score}% • Lexical Token Match: {comparisonResult.lexical_score}%
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-white flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>{comparisonResult.verdict}</span>
                  </div>

                  {/* Matching Reasons */}
                  {comparisonResult.matching_reasons?.length > 0 && (
                    <div className="pt-2 flex flex-wrap gap-1.5">
                      {comparisonResult.matching_reasons.map((r, i) => (
                        <span key={i} className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-500/30">
                          <Check className="w-3 h-3 text-emerald-400" /> {r}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Side-by-Side Comparison Columns */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                
                {/* Item A */}
                <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border ${getCpseBadgeColor(selectedMatA.cpse)}`}>
                      {selectedMatA.cpse} (Primary)
                    </span>
                    <span className="text-xs font-mono text-slate-400">{selectedMatA.location}</span>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500 font-mono">Legacy Code:</div>
                    <div className="text-sm font-bold text-slate-100 font-mono">{selectedMatA.material_code}</div>
                  </div>

                  <div>
                    <div className="text-xs text-slate-500">Raw Description:</div>
                    <div className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 mt-1 font-mono">
                      {selectedMatA.raw_description}
                    </div>
                  </div>

                  <div className="space-y-1.5 pt-2 border-t border-slate-800">
                    <div className="text-xs font-semibold text-sky-400">Standardized Technical Description:</div>
                    <div className="text-xs text-slate-200">{selectedMatA.standardized_description}</div>
                  </div>

                  {/* Suggested CNMC */}
                  <div className="p-3 rounded-lg bg-slate-950/80 border border-emerald-500/20">
                    <div className="text-[10px] text-slate-400 font-mono">Common National Material Code:</div>
                    <div className="text-xs font-bold text-emerald-400 font-mono mt-0.5">
                      {selectedMatA.suggested_cnmc}
                    </div>
                  </div>
                </div>

                {/* Item B (Comparison Candidate) */}
                <div className="p-5 rounded-xl bg-slate-900/60 border border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold font-mono border ${getCpseBadgeColor(selectedMatB?.cpse)}`}>
                        {selectedMatB?.cpse || 'Select Candidate'}
                      </span>
                      <span className="text-xs text-slate-400">Candidate Match</span>
                    </div>

                    {/* Selector to switch candidate */}
                    <select
                      value={selectedMatB?.id || ''}
                      onChange={(e) => {
                        const next = materials.find((m) => m.id === e.target.value);
                        if (next) handleSelectDifferentMatB(next);
                      }}
                      className="bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-slate-200"
                    >
                      {materials
                        .filter((m) => m.id !== selectedMatA.id)
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            [{m.cpse}] {m.material_code}
                          </option>
                        ))}
                    </select>
                  </div>

                  {selectedMatB && (
                    <>
                      <div>
                        <div className="text-xs text-slate-500 font-mono">Legacy Code:</div>
                        <div className="text-sm font-bold text-slate-100 font-mono">{selectedMatB.material_code}</div>
                      </div>

                      <div>
                        <div className="text-xs text-slate-500">Raw Description:</div>
                        <div className="text-xs text-slate-300 bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 mt-1 font-mono">
                          {selectedMatB.raw_description}
                        </div>
                      </div>

                      <div className="space-y-1.5 pt-2 border-t border-slate-800">
                        <div className="text-xs font-semibold text-sky-400">Standardized Technical Description:</div>
                        <div className="text-xs text-slate-200">{selectedMatB.standardized_description}</div>
                      </div>

                      <div className="p-3 rounded-lg bg-slate-950/80 border border-emerald-500/20">
                        <div className="text-[10px] text-slate-400 font-mono">Target National Material Code:</div>
                        <div className="text-xs font-bold text-emerald-400 font-mono mt-0.5">
                          {selectedMatB.suggested_cnmc}
                        </div>
                      </div>
                    </>
                  )}
                </div>

              </div>

              {/* Attribute Diff Matrix Table */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider mb-3">
                  Technical Specifications Diff Matrix
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-950/60 text-slate-400 font-mono">
                      <tr>
                        <th className="p-2">Attribute</th>
                        <th className="p-2">{selectedMatA.cpse} ({selectedMatA.material_code})</th>
                        <th className="p-2">{selectedMatB?.cpse} ({selectedMatB?.material_code})</th>
                        <th className="p-2">Compatibility Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {[
                        { label: 'Component Type', key: 'component_type' },
                        { label: 'Material Grade', key: 'grade' },
                        { label: 'Dimension / Size', key: 'dimension' },
                        { label: 'Pressure Rating', key: 'pressure_rating' },
                        { label: 'End Connection', key: 'end_connection' },
                        { label: 'Standard', key: 'standard' },
                      ].map((row) => {
                        const valA = selectedMatA.attributes?.[row.key] || 'N/A';
                        const valB = selectedMatB?.attributes?.[row.key] || 'N/A';
                        const isMatch = valA === valB && valA !== 'N/A';
                        return (
                          <tr key={row.key}>
                            <td className="p-2 font-medium text-slate-400">{row.label}</td>
                            <td className="p-2 font-mono text-slate-200">{valA}</td>
                            <td className="p-2 font-mono text-slate-200">{valB}</td>
                            <td className="p-2">
                              {isMatch ? (
                                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
                                  <Check className="w-3.5 h-3.5" /> Identical
                                </span>
                              ) : valA === 'N/A' || valB === 'N/A' ? (
                                <span className="text-[11px] text-slate-500">Unspecified</span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 font-medium">
                                  <AlertCircle className="w-3.5 h-3.5" /> Variation
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>

            {/* Modal Footer / Governance Actions */}
            <div className="p-5 border-t border-slate-800 bg-slate-900/90 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-slate-400">
                Action will be permanently recorded in the National Consortium Audit Trail.
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={() => handleWorkflowSubmit('REJECT')}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors"
                >
                  Flag as Distinct
                </button>

                <button
                  onClick={() => handleWorkflowSubmit('MERGE')}
                  className="px-4 py-2 rounded-lg bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-md transition-colors"
                >
                  Merge into Single CNMC
                </button>

                <button
                  onClick={() => handleWorkflowSubmit('APPROVE')}
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-600/30 transition-colors flex items-center gap-1.5"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Approve & Harmonize</span>
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
