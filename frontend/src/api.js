/**
 * API client for the National Unified Material Master Backend.
 */

const API_BASE = "http://localhost:8000/api";

export async function fetchHealth() {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error("Health check failed");
    return await res.json();
  } catch (err) {
    return { status: "OFFLINE", error: err.message };
  }
}

export async function fetchMaterials(params = {}) {
  const query = new URLSearchParams();
  if (params.cpse && params.cpse !== "ALL") query.set("cpse", params.cpse);
  if (params.category && params.category !== "ALL") query.set("category", params.category);
  if (params.status && params.status !== "ALL") query.set("status", params.status);
  if (params.q) query.set("q", params.q);

  const res = await fetch(`${API_BASE}/materials?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch materials");
  return await res.json();
}

export async function fetchMaterialById(id) {
  const res = await fetch(`${API_BASE}/materials/${id}`);
  if (!res.ok) throw new Error(`Failed to fetch material ${id}`);
  return await res.json();
}

export async function standardizeDescription(rawDescription) {
  const res = await fetch(`${API_BASE}/standardize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ raw_description: rawDescription }),
  });
  if (!res.ok) throw new Error("Standardization failed");
  return await res.json();
}

export async function matchMaterial(rawDescription = "", materialId = null) {
  const res = await fetch(`${API_BASE}/match`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      raw_description: rawDescription,
      material_id: materialId,
    }),
  });
  if (!res.ok) throw new Error("Matching request failed");
  return await res.json();
}

export async function compareMaterials(matAId, matBId) {
  const res = await fetch(`${API_BASE}/compare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      material_a_id: matAId,
      material_b_id: matBId,
    }),
  });
  if (!res.ok) throw new Error("Comparison failed");
  return await res.json();
}

export async function submitWorkflowAction(action, materialIds, cnmcCode = null, rationale = "") {
  const res = await fetch(`${API_BASE}/workflow/action`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      action,
      material_ids: materialIds,
      cnmc_code: cnmcCode,
      rationale,
      actor: "Authorized CPSE Material Master Reviewer",
    }),
  });
  if (!res.ok) throw new Error("Workflow action failed");
  return await res.json();
}

export async function fetchAnalytics() {
  const res = await fetch(`${API_BASE}/analytics`);
  if (!res.ok) throw new Error("Failed to fetch analytics");
  return await res.json();
}

export async function fetchAuditLogs() {
  const res = await fetch(`${API_BASE}/workflow/audit`);
  if (!res.ok) throw new Error("Failed to fetch audit logs");
  return await res.json();
}

export async function fetchSapPayload(materialId) {
  const res = await fetch(`${API_BASE}/erp/export-sap`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ material_id: materialId }),
  });
  if (!res.ok) throw new Error("Failed to fetch SAP payload");
  return await res.json();
}

export async function uploadBatchMaterials(materials) {
  const res = await fetch(`${API_BASE}/upload-batch`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ materials }),
  });
  if (!res.ok) throw new Error("Batch upload failed");
  return await res.json();
}
