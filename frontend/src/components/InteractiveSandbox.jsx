import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  Search, 
  CheckCircle, 
  ExternalLink, 
  ArrowRight, 
  Cpu, 
  Copy, 
  Check, 
  Layers, 
  Tag, 
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { standardizeDescription } from '../api';

const PRESETS = [
  {
    title: 'ONGC Ball Valve',
    source: 'ONGC (Western Offshore)',
    text: '2 INCH SS316 BALL VALVE CL150 FLANGED RF BODY CF8M BALL SS316 API 6D',
  },
  {
    title: 'IOCL Duplicate Valve',
    source: 'IOCL (Panipat Refinery)',
    text: 'VALVE, BALL, 2" (50 NB), RATING 150 LBS, FLGD RAISED FACE, MOC: ASTM A351 CF8M / SS 316',
  },
  {
    title: 'BHEL Heavy Bearing',
    source: 'BHEL (Haridwar)',
    text: 'BEARING DEEP GROOVE BALL 6205-2RS RUBBER SEALED BOTH SIDES C3 CLEARANCE SKF/FAG',
  },
  {
    title: 'NTPC High-Tension Cable',
    source: 'NTPC (Vindhyachal)',
    text: '11 KV 3CX240 SQMM XLPE INSULATED ARMOURED ALUMINIUM CONDUCTOR POWER CABLE IS 7098 P2',
  },
  {
    title: 'SAIL Pipe Fitting',
    source: 'SAIL (Bokaro Steel)',
    text: '50 NB BALL VALVE SS-316 RF FLANGED ENDS CL 150 BS 5351',
  },
];

export default function InteractiveSandbox({ initialInput = '' }) {
  const [inputText, setInputText] = useState(
    initialInput || '2 INCH SS316 BALL VALVE CL150 FLANGED RF BODY CF8M BALL SS316 API 6D'
  );
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (initialInput) {
      setInputText(initialInput);
      handleAnalyze(initialInput);
    } else {
      handleAnalyze(inputText);
    }
  }, [initialInput]);

  const handleAnalyze = async (textToAnalyze = inputText) => {
    if (!textToAnalyze.trim()) return;
    setLoading(true);
    try {
      const res = await standardizeDescription(textToAnalyze);
      setResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCNMC = (code) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-sky-400" />
          <span>Live AI Standardization & CNMC Generator Sandbox</span>
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Test any unstructured CPSE material description to witness real-time domain parsing, technical attribute extraction, CNMC recommendation, and cross-enterprise deduplication.
        </p>
      </div>

      {/* Preset Quick Buttons */}
      <div className="space-y-2">
        <span className="text-xs text-slate-400 font-medium">Quick Industrial Presets (Click to test):</span>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((p) => (
            <button
              key={p.title}
              onClick={() => {
                setInputText(p.text);
                handleAnalyze(p.text);
              }}
              className="text-xs px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-sky-500/40 transition-all font-medium flex items-center gap-1.5"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
              <span>{p.title}</span>
              <span className="text-[10px] text-slate-500">({p.source})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Input Box */}
      <div className="glass-card p-5 rounded-xl border border-slate-800 space-y-4">
        <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
          Raw Material Description / Specification String
        </label>
        <div className="relative">
          <textarea
            rows={3}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Type or paste any CPSE material text here (e.g. 2 INCH SS316 BALL VALVE CL150 FLANGED...)"
            className="w-full bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-sm text-slate-100 font-mono focus:outline-none focus:border-sky-500 transition-colors placeholder-slate-600"
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-xs text-slate-500">
            Supports ASTM, ASME, IS, DIN, API standards and CPSE domain jargon
          </span>
          <button
            onClick={() => handleAnalyze(inputText)}
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold shadow-lg shadow-sky-500/20 disabled:opacity-50 transition-all"
          >
            <Sparkles className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>{loading ? 'Analyzing NLP...' : 'Run AI Harmonization'}</span>
          </button>
        </div>
      </div>

      {/* Analysis Results Display */}
      {result && (
        <div className="space-y-6">
          
          {/* Main Output Cards: CNMC & Standardized Description */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* CNMC Code Card */}
            <div className="glass-card p-6 rounded-xl border border-emerald-500/30 bg-gradient-to-br from-slate-900/90 to-emerald-950/20 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  Recommended Common National Material Code (CNMC)
                </span>
                <button
                  onClick={() => handleCopyCNMC(result.cnmc?.cnmc_code)}
                  className="p-1.5 text-slate-400 hover:text-emerald-400 rounded-md hover:bg-slate-800 transition-colors"
                  title="Copy CNMC"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80">
                <div className="font-mono text-lg font-bold text-emerald-300 tracking-wide break-all">
                  {result.cnmc?.cnmc_code}
                </div>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-400 font-mono">
                  <span>UNSPSC: <strong className="text-slate-200">{result.cnmc?.unspsc_equivalent}</strong></span>
                  <span>•</span>
                  <span>HSN/SAC: <strong className="text-slate-200">{result.cnmc?.hsn_sac_code}</strong></span>
                </div>
              </div>

              {/* Hierarchy Breakdown */}
              {result.cnmc?.hierarchy && (
                <div className="pt-2">
                  <div className="text-xs text-slate-400 font-mono mb-2">Code Taxonomy Breakdown:</div>
                  <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-[11px] font-mono">
                    <div className="p-2 bg-slate-900 rounded border border-slate-800">
                      <div className="text-slate-500 text-[10px]">SECTOR</div>
                      <div className="text-sky-400 font-bold">{result.cnmc.hierarchy.sector}</div>
                    </div>
                    <div className="p-2 bg-slate-900 rounded border border-slate-800">
                      <div className="text-slate-500 text-[10px]">CATEGORY</div>
                      <div className="text-sky-400 font-bold">{result.cnmc.hierarchy.category}</div>
                    </div>
                    <div className="p-2 bg-slate-900 rounded border border-slate-800">
                      <div className="text-slate-500 text-[10px]">COMPONENT</div>
                      <div className="text-purple-400 font-bold">{result.cnmc.hierarchy.sub_category}</div>
                    </div>
                    <div className="p-2 bg-slate-900 rounded border border-slate-800">
                      <div className="text-slate-500 text-[10px]">GRADE</div>
                      <div className="text-amber-400 font-bold">{result.cnmc.hierarchy.material_grade}</div>
                    </div>
                    <div className="p-2 bg-slate-900 rounded border border-slate-800">
                      <div className="text-slate-500 text-[10px]">SIZE</div>
                      <div className="text-emerald-400 font-bold">{result.cnmc.hierarchy.dimension}</div>
                    </div>
                    <div className="p-2 bg-slate-900 rounded border border-slate-800">
                      <div className="text-slate-500 text-[10px]">RATING</div>
                      <div className="text-rose-400 font-bold">{result.cnmc.hierarchy.rating}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Standardized Technical Description (UTD) */}
            <div className="glass-card p-6 rounded-xl border border-sky-500/30 space-y-4">
              <span className="text-xs font-bold text-sky-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" />
                Unified Technical Description (UTD)
              </span>

              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-sm text-slate-100 font-medium leading-relaxed">
                {result.standardized_description}
              </div>

              {/* Extracted Attributes Badges */}
              <div className="space-y-2 pt-2">
                <div className="text-xs text-slate-400 font-mono">Dissected Attributes:</div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
                    <span className="text-slate-500">Component:</span>
                    <span className="font-semibold text-slate-200">{result.attributes?.component_type}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
                    <span className="text-slate-500">Grade:</span>
                    <span className="font-semibold text-amber-300">{result.attributes?.grade}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
                    <span className="text-slate-500">Dimension:</span>
                    <span className="font-semibold text-sky-300">{result.attributes?.dimension}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
                    <span className="text-slate-500">Rating:</span>
                    <span className="font-semibold text-emerald-300">{result.attributes?.pressure_rating}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
                    <span className="text-slate-500">Ends:</span>
                    <span className="font-semibold text-slate-300">{result.attributes?.end_connection}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-900 border border-slate-800 flex justify-between">
                    <span className="text-slate-500">Standard:</span>
                    <span className="font-semibold text-slate-300">{result.attributes?.standard}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Cross-CPSE Duplicates Found */}
          <div className="glass-card p-6 rounded-xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-400" />
                <span>Identified Cross-CPSE Catalog Duplicates & Equivalents</span>
              </h3>
              <span className="text-xs font-mono text-slate-400">
                {result.matching_candidates?.length || 0} potential duplicates matched
              </span>
            </div>

            {result.matching_candidates && result.matching_candidates.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.matching_candidates.map((cand, idx) => {
                  const item = cand.material;
                  const isHigh = cand.confidence_score >= 85;
                  return (
                    <div 
                      key={idx}
                      className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 hover:border-sky-500/40 transition-all space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-slate-800 text-sky-400 border border-slate-700">
                            {item.cpse}
                          </span>
                          <span className="text-xs font-mono text-slate-300 font-semibold">{item.material_code}</span>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full text-xs font-mono font-bold ${
                          isHigh 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                            : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        }`}>
                          {cand.confidence_score}% Match
                        </span>
                      </div>

                      <div className="text-xs text-slate-300 line-clamp-2">
                        {item.raw_description}
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center justify-between border-t border-slate-800/80 pt-2 font-mono">
                        <span>Classification: <strong className="text-slate-300">{cand.match_label}</strong></span>
                        <span className="text-emerald-400 font-semibold">{cand.action_recommended}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 bg-slate-950/40 rounded-xl border border-slate-800">
                No identical duplicates found in current corpus. Item represents a unique industrial specification.
              </div>
            )}
          </div>

        </div>
      )}

    </div>
  );
}
