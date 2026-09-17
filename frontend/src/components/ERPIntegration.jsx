import React, { useState, useEffect } from 'react';
import { 
  Database, 
  Server, 
  Download, 
  Upload, 
  FileCode, 
  CheckCircle, 
  Copy, 
  Check, 
  RefreshCw, 
  Layers, 
  Send,
  Building
} from 'lucide-react';
import { fetchSapPayload, uploadBatchMaterials } from '../api';

const ERP_CONNECTORS = [
  { cpse: 'ONGC', system: 'SAP S/4HANA 2023', protocol: 'OData v4 / RFC', endpoint: 'https://s4hana.ongc.co.in/sap/opu/odata/sap/API_PRODUCT_SRV', status: 'ACTIVE', latency: '24ms' },
  { cpse: 'IOCL', system: 'SAP ECC 6.0 EHP8', protocol: 'SAP RFC (pyrfc Gateway)', endpoint: 'rfc://ecc-gw.iocl.com:3300/RFC_READ_TABLE', status: 'ACTIVE', latency: '38ms' },
  { cpse: 'GAIL', system: 'SAP S/4HANA Cloud', protocol: 'OData REST API', endpoint: 'https://api.gail.co.in/odata/v2/MaterialMaster', status: 'ACTIVE', latency: '19ms' },
  { cpse: 'SAIL', system: 'Oracle ERP Cloud', protocol: 'REST / Fusion Middleware', endpoint: 'https://sail.oraclecloud.com/fscmRestApi/resources/items', status: 'ACTIVE', latency: '42ms' },
  { cpse: 'BHEL', system: 'SAP S/4HANA 2022', protocol: 'SAP BAPI / IDoc', endpoint: 'https://erp.bhel.in/sap/bc/bapi/BAPI_MATERIAL_SAVEDATA', status: 'ACTIVE', latency: '31ms' },
  { cpse: 'NTPC', system: 'SAP ECC 6.0', protocol: 'OData Services', endpoint: 'https://sap.ntpc.co.in/sap/opu/odata/sap/ZMM_CATALOG_SRV', status: 'ACTIVE', latency: '29ms' },
];

export default function ERPIntegration({ materials, onRefresh }) {
  const [selectedMatId, setSelectedMatId] = useState(materials[0]?.id || '');
  const [sapPayload, setSapPayload] = useState(null);
  const [loadingSap, setLoadingSap] = useState(false);
  const [copiedPayload, setCopiedPayload] = useState(false);

  // Batch Upload State
  const [batchInput, setBatchInput] = useState(
    'CPSE,MATERIAL_CODE,RAW_DESCRIPTION,UOM,PRICE_INR\n' +
    'ONGC,VLV-CH-SS316-DN50,CHECK VALVE 50NB SS316 RATING 150# FLANGED,EA,14500\n' +
    'IOCL,FAST-M20-BOLT,HEX BOLT M20 X 80MM HIGH TENSILE GR 8.8 IS 1363,NOS,180\n' +
    'SAIL,PIPE-SM-100NB,SEAMLESS STEEL PIPE 100 NB SCH 40 ASTM A106 GR B,MTR,3200'
  );
  const [uploadStatus, setUploadStatus] = useState('');
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (selectedMatId) {
      loadSapPayload(selectedMatId);
    }
  }, [selectedMatId]);

  const loadSapPayload = async (id) => {
    setLoadingSap(true);
    try {
      const data = await fetchSapPayload(id);
      setSapPayload(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSap(false);
    }
  };

  const handleCopyPayload = () => {
    if (!sapPayload) return;
    navigator.clipboard.writeText(JSON.stringify(sapPayload, null, 2));
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2000);
  };

  const handleBatchUpload = async () => {
    setUploading(true);
    setUploadStatus('');
    try {
      const lines = batchInput.trim().split('\n');
      const header = lines[0].split(',');
      const rows = [];

      for (let i = 1; i < lines.length; i++) {
        const parts = lines[i].split(',');
        if (parts.length >= 3) {
          rows.push({
            cpse: parts[0]?.trim() || 'CUSTOM_CPSE',
            material_code: parts[1]?.trim() || `MAT-NEW-${i}`,
            raw_description: parts[2]?.trim() || '',
            uom: parts[3]?.trim() || 'EA',
            unit_price_inr: parseFloat(parts[4]?.trim() || '1000'),
          });
        }
      }

      if (rows.length === 0) {
        setUploadStatus('No valid CSV rows found.');
        return;
      }

      const res = await uploadBatchMaterials(rows);
      setUploadStatus(`Batch upload successful: Ingested & normalized ${res.created_count} items!`);
      if (onRefresh) onRefresh();
    } catch (err) {
      setUploadStatus(`Upload failed: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  const handleExportCatalog = () => {
    const csvContent = 
      "data:text/csv;charset=utf-8," +
      "ID,CPSE,Legacy_Code,CNMC_Code,UNSPSC,Standardized_Description,Raw_Description,Location\n" +
      materials.map(m => `"${m.id}","${m.cpse}","${m.material_code}","${m.suggested_cnmc}","${m.unspsc_code}","${m.standardized_description}","${m.raw_description}","${m.location}"`).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `National_Material_Master_Catalog_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Database className="w-5 h-5 text-sky-400" />
            <span>Enterprise SAP / ERP Integration Hub</span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-time OData & RFC connectivity simulator, bidirectional CPSE ERP synchronization, and batch ingestion.
          </p>
        </div>

        <button
          onClick={handleExportCatalog}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-sky-500/20 transition-all"
        >
          <Download className="w-4 h-4" />
          <span>Export Harmonized Catalog (CSV)</span>
        </button>
      </div>

      {/* Active Connectors Grid */}
      <div className="glass-card p-6 rounded-xl border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Server className="w-4 h-4 text-emerald-400" />
          <span>Active CPSE Enterprise Connectors (OData / RFC Gateway)</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {ERP_CONNECTORS.map((conn) => (
            <div key={conn.cpse} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded text-xs font-mono font-bold bg-slate-800 text-sky-400 border border-slate-700">
                  {conn.cpse}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] text-emerald-400 font-mono">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  {conn.status} ({conn.latency})
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-200">{conn.system}</div>
              <div className="text-[11px] text-slate-400 font-mono">{conn.protocol}</div>
              <div className="text-[10px] text-slate-500 truncate font-mono">{conn.endpoint}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Two Column Section: Live SAP OData Payload & Batch Uploader */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Live SAP Payload Viewer */}
        <div className="glass-card p-6 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-sky-400" />
              <h3 className="text-sm font-bold text-white">SAP S/4HANA OData Payload Simulator</h3>
            </div>
            <button
              onClick={handleCopyPayload}
              className="p-1.5 text-slate-400 hover:text-sky-400 rounded hover:bg-slate-800 transition-colors"
              title="Copy SAP Payload"
            >
              {copiedPayload ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex items-center gap-3">
            <label className="text-xs text-slate-400 whitespace-nowrap font-mono">Select Material:</label>
            <select
              value={selectedMatId}
              onChange={(e) => setSelectedMatId(e.target.value)}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-sky-500"
            >
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  [{m.cpse}] {m.material_code} — {m.standardized_description?.slice(0, 40)}...
                </option>
              ))}
            </select>
          </div>

          {/* Code Viewer */}
          <div className="relative">
            <pre className="p-4 bg-slate-950/90 rounded-xl border border-slate-800 text-[11px] font-mono text-emerald-300 overflow-x-auto max-h-[380px] scrollbar-thin">
              {loadingSap ? 'Generating SAP OData BAPI payload...' : JSON.stringify(sapPayload, null, 2)}
            </pre>
          </div>
          <div className="text-[10px] text-slate-500">
            Compliant with standard SAP S/4HANA Product Master API (`API_PRODUCT_SRV`) for two-way synchronization.
          </div>
        </div>

        {/* Batch CSV Ingestion */}
        <div className="glass-card p-6 rounded-xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Batch Material Master CSV Ingestion</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">Simulated SAP Export Feed</span>
          </div>

          <p className="text-xs text-slate-400">
            Paste legacy CPSE inventory records to automatically run batch attribute extraction, CNMC recommendation, and deduplication.
          </p>

          <textarea
            rows={8}
            value={batchInput}
            onChange={(e) => setBatchInput(e.target.value)}
            className="w-full bg-slate-950/90 border border-slate-800 rounded-xl p-3 text-xs font-mono text-slate-200 focus:outline-none focus:border-sky-500"
          />

          {uploadStatus && (
            <div className={`p-3 rounded-lg text-xs font-mono ${
              uploadStatus.includes('successful')
                ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/30'
                : 'bg-rose-500/10 text-rose-300 border border-rose-500/30'
            }`}>
              {uploadStatus}
            </div>
          )}

          <div className="flex justify-end">
            <button
              onClick={handleBatchUpload}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs shadow-lg shadow-amber-600/20 disabled:opacity-50 transition-all"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{uploading ? 'Processing Batch...' : 'Run Batch Standardization'}</span>
            </button>
          </div>
        </div>

      </div>

    </div>
  );
}
