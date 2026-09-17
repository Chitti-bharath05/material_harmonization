import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Download, 
  UserCheck, 
  Filter, 
  Layers,
  History,
  Check
} from 'lucide-react';
import { fetchAuditLogs, submitWorkflowAction } from '../api';

export default function GovernanceWorkflow({ materials, onRefresh }) {
  const [auditLogs, setAuditLogs] = useState([]);
  const [loadingAudit, setLoadingAudit] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [customRationale, setCustomRationale] = useState('Standardized per Consortium Material Master Policy');
  const [reviewingActor, setReviewingActor] = useState('Dr. R. K. Verma (Chief Materials Officer, ONGC)');
  const [actionSuccess, setActionSuccess] = useState('');

  useEffect(() => {
    loadAudit();
  }, []);

  const loadAudit = async () => {
    setLoadingAudit(true);
    try {
      const res = await fetchAuditLogs();
      setAuditLogs(res.audit_logs || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAudit(false);
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedItems((prev) => 
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleBulkApprove = async () => {
    if (selectedItems.length === 0) return;
    try {
      await submitWorkflowAction('APPROVE', selectedItems, null, customRationale);
      setActionSuccess(`Successfully approved & harmonized ${selectedItems.length} materials!`);
      setSelectedItems([]);
      if (onRefresh) onRefresh();
      loadAudit();
      setTimeout(() => setActionSuccess(''), 2500);
    } catch (err) {
      alert(`Error approving items: ${err.message}`);
    }
  };

  const handleExportAuditJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(auditLogs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `CPSE_Consortium_Audit_Trail_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const pendingItems = materials.filter((m) => m.status !== 'HARMONIZED');

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <span>Consortium Governance, Validation & Audit Trail</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Role-based human-in-the-loop review workflow, code validation, and immutable regulatory audit ledger.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportAuditJson}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4 text-sky-400" />
            <span>Export Audit Trail (JSON)</span>
          </button>
        </div>
      </div>

      {/* Reviewer Actor Badge */}
      <div className="glass-card p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 bg-slate-900/60">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <UserCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="text-xs text-slate-400 font-mono">Current Certified Governance Authority:</div>
            <div className="text-sm font-bold text-slate-100">{reviewingActor}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400">Review Level:</span>
          <span className="px-2.5 py-1 rounded bg-slate-800 text-xs font-mono text-emerald-400 border border-emerald-500/30">
            LEVEL-3 (NATIONAL CONSORTIUM SIGN-OFF)
          </span>
        </div>
      </div>

      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Pending Validation Queue */}
      <div className="glass-card p-6 rounded-xl border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>Pending Material Validation Queue ({pendingItems.length})</span>
            </h3>
            <p className="text-xs text-slate-400">
              Select records to validate AI recommendations and sign-off on CNMC mapping
            </p>
          </div>

          <div className="flex items-center gap-3">
            {selectedItems.length > 0 && (
              <button
                onClick={handleBulkApprove}
                className="px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition-all flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                <span>Approve Selected ({selectedItems.length})</span>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3 w-10">Select</th>
                <th className="p-3">CPSE</th>
                <th className="p-3">Material Code</th>
                <th className="p-3">Standardized Description</th>
                <th className="p-3">Recommended CNMC</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {pendingItems.map((item) => {
                const isSelected = selectedItems.includes(item.id);
                return (
                  <tr key={item.id} className={isSelected ? 'bg-sky-950/20' : 'hover:bg-slate-800/30'}>
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleToggleSelect(item.id)}
                        className="rounded bg-slate-900 border-slate-700 text-sky-500 focus:ring-0 cursor-pointer"
                      />
                    </td>
                    <td className="p-3 font-mono font-bold text-sky-400">{item.cpse}</td>
                    <td className="p-3 font-mono text-slate-200">{item.material_code}</td>
                    <td className="p-3 text-slate-300">{item.standardized_description}</td>
                    <td className="p-3 font-mono text-emerald-400 text-[11px] font-semibold">
                      {item.suggested_cnmc}
                    </td>
                    <td className="p-3">
                      <button
                        onClick={async () => {
                          await submitWorkflowAction('APPROVE', [item.id], item.suggested_cnmc, customRationale);
                          if (onRefresh) onRefresh();
                          loadAudit();
                        }}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 text-[11px] transition-colors"
                      >
                        Approve
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Immutable Regulatory Audit Trail Ledger */}
      <div className="glass-card p-6 rounded-xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <History className="w-4 h-4 text-sky-400" />
              <span>Consortium Immutable Audit Trail Ledger</span>
            </h3>
            <p className="text-xs text-slate-400">
              Tamper-evident record of all AI standardization validations, merges, and code assignments
            </p>
          </div>

          <span className="text-xs font-mono text-slate-500">
            {auditLogs.length} Total Audit Entries
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
              <tr>
                <th className="p-3">Log ID & Timestamp</th>
                <th className="p-3">Actor / Designation</th>
                <th className="p-3">CPSE Entity</th>
                <th className="p-3">Governance Action</th>
                <th className="p-3">Affected Codes / CNMC</th>
                <th className="p-3">Rationale & Change Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              {auditLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/30">
                  <td className="p-3 whitespace-nowrap">
                    <div className="text-slate-200 font-bold">{log.id}</div>
                    <div className="text-[10px] text-slate-500">{log.timestamp}</div>
                  </td>
                  <td className="p-3 font-sans text-slate-300 whitespace-nowrap">
                    {log.actor}
                  </td>
                  <td className="p-3 font-bold text-sky-400 whitespace-nowrap">
                    {log.cpse}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      log.action === 'APPROVE_MAPPING' || log.action === 'APPROVE'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : log.action === 'MERGE'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-300 border border-slate-700'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 text-emerald-400 text-[11px]">
                    <div>{log.cnmc_code}</div>
                    {log.affected_material_codes && (
                      <div className="text-[10px] text-slate-500">
                        Codes: {log.affected_material_codes.join(', ')}
                      </div>
                    )}
                  </td>
                  <td className="p-3 font-sans text-slate-300 text-xs">
                    {log.details}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
