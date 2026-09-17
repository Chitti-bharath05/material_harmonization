"""
REST API Server for AI-Driven National Unified Material Master Platform.
Python 3.7-compatible. Uses stdlib sqlite3 for persistence so data
survives server restarts (stored in materials.db).
"""

import http.server
import json
import os
import sqlite3
import sys
import time
import urllib.parse
from datetime import datetime
from typing import Any, Dict, List

from ai_normalizer import extract_attributes
from ai_matcher import MaterialMatcher, compare_two_materials
from cnmc_generator import generate_cnmc_code
from seed_data import load_seed_materials

# ---------------------------------------------------------------------------
# Database helpers
# ---------------------------------------------------------------------------
DB_PATH = os.path.join(os.path.dirname(__file__), "materials.db")


def get_conn() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db():
    """Create tables if they do not exist."""
    conn = get_conn()
    c = conn.cursor()
    c.executescript("""
        CREATE TABLE IF NOT EXISTS materials (
            id TEXT PRIMARY KEY,
            cpse TEXT,
            erp_system TEXT DEFAULT 'SAP S/4HANA',
            material_code TEXT,
            raw_description TEXT,
            description TEXT,
            standardized_description TEXT,
            attributes_json TEXT DEFAULT '{}',
            category TEXT,
            uom TEXT DEFAULT 'EA',
            stock_qty INTEGER DEFAULT 0,
            annual_procurement_qty INTEGER DEFAULT 0,
            unit_price_inr REAL DEFAULT 0.0,
            location TEXT DEFAULT '',
            suggested_cnmc TEXT DEFAULT '',
            unspsc_code TEXT DEFAULT '',
            hsn_code TEXT DEFAULT '',
            status TEXT DEFAULT 'UNHARMONIZED'
        );

        CREATE TABLE IF NOT EXISTS audit_logs (
            id TEXT PRIMARY KEY,
            timestamp TEXT,
            actor TEXT,
            cpse TEXT,
            action TEXT,
            details TEXT,
            cnmc_code TEXT DEFAULT '',
            affected_codes_json TEXT DEFAULT '[]'
        );
    """)
    conn.commit()
    conn.close()


def row_to_material(row) -> Dict[str, Any]:
    d = dict(row)
    try:
        d["attributes"] = json.loads(d.pop("attributes_json", "{}") or "{}")
    except Exception:
        d["attributes"] = {}
    return d


def row_to_audit(row) -> Dict[str, Any]:
    d = dict(row)
    try:
        d["affected_material_codes"] = json.loads(d.pop("affected_codes_json", "[]") or "[]")
    except Exception:
        d["affected_material_codes"] = []
    return d


def load_materials_from_db() -> List[Dict[str, Any]]:
    conn = get_conn()
    rows = conn.execute("SELECT * FROM materials").fetchall()
    conn.close()
    return [row_to_material(r) for r in rows]


def seed_db_if_empty():
    """Seed the DB from seed_data.py only if the materials table is empty."""
    conn = get_conn()
    count = conn.execute("SELECT COUNT(*) FROM materials").fetchone()[0]
    if count > 0:
        conn.close()
        return

    for m in load_seed_materials():
        attrs = m.get("attributes") or extract_attributes(m.get("description", ""))
        conn.execute("""
            INSERT OR IGNORE INTO materials
            (id, cpse, erp_system, material_code, raw_description, description,
             standardized_description, attributes_json, category, uom,
             stock_qty, annual_procurement_qty, unit_price_inr, location,
             suggested_cnmc, unspsc_code, hsn_code, status)
            VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
        """, (
            m["id"], m.get("cpse", ""), m.get("erp_system", "SAP S/4HANA"),
            m.get("material_code", ""),
            m.get("raw_description", m.get("description", "")),
            m.get("description", ""),
            m.get("standardized_description", ""),
            json.dumps(attrs),
            m.get("category", "General"), m.get("uom", "EA"),
            int(m.get("stock_qty", 0)), int(m.get("annual_procurement_qty", 0)),
            float(m.get("unit_price_inr", 0.0)),
            m.get("location", ""), m.get("suggested_cnmc", ""),
            m.get("unspsc_code", ""), m.get("hsn_code", ""),
            m.get("status", "UNHARMONIZED"),
        ))

    # Seed initial audit entries
    for log in [
        ("audit-001", "2026-09-16 10:15:30", "System Automation Engine (AI)",
         "National Master Consortium", "CORPUS_INDEXED",
         "Indexed legacy material master records across 6 CPSEs (ONGC, IOCL, SAIL, BHEL, NTPC, GAIL).",
         "SYSTEM-INIT", "[]"),
        ("audit-002", "2026-09-16 11:30:12",
         "Dr. R. K. Verma (Chief Materials Officer, ONGC)", "ONGC",
         "APPROVE_MAPPING",
         "Validated AI recommendation for 2-inch SS-316 Ball Valve Class 150 RF.",
         "CNMC-ENG-PIP-VLV-BL-SS316-DN50-C150-0001", "[]"),
    ]:
        conn.execute("""
            INSERT OR IGNORE INTO audit_logs
            (id, timestamp, actor, cpse, action, details, cnmc_code, affected_codes_json)
            VALUES (?,?,?,?,?,?,?,?)
        """, log)

    conn.commit()
    conn.close()


# ---------------------------------------------------------------------------
# Analytics
# ---------------------------------------------------------------------------
def calculate_analytics() -> Dict[str, Any]:
    materials = load_materials_from_db()
    total = len(materials)
    harmonized = sum(1 for m in materials if m.get("status") == "HARMONIZED")

    cpse_counts: Dict[str, Dict[str, int]] = {}
    category_counts: Dict[str, int] = {}
    total_spend = 0.0

    for item in materials:
        cpse = item.get("cpse", "Other")
        cat = item.get("category", "General")
        cpse_counts.setdefault(cpse, {"total": 0, "harmonized": 0})
        cpse_counts[cpse]["total"] += 1
        if item.get("status") == "HARMONIZED":
            cpse_counts[cpse]["harmonized"] += 1
        category_counts[cat] = category_counts.get(cat, 0) + 1
        total_spend += item.get("annual_procurement_qty", 0) * item.get("unit_price_inr", 0)

    savings = total_spend * 0.142
    return {
        "kpis": {
            "total_materials": total,
            "harmonized_count": harmonized,
            "unharmonized_count": total - harmonized,
            "duplicate_rate_pct": round((8 / max(total, 1)) * 100, 1),
            "total_spend_inr": total_spend,
            "total_spend_crores": round(total_spend / 10_000_000, 2),
            "estimated_savings_inr": savings,
            "estimated_savings_crores": round(savings / 10_000_000, 2),
            "participating_cpses": len(cpse_counts),
        },
        "cpse_progress": [
            {"cpse": c, "total": d["total"], "harmonized": d["harmonized"],
             "progress_pct": round((d["harmonized"] / max(d["total"], 1)) * 100, 1)}
            for c, d in cpse_counts.items()
        ],
        "category_breakdown": [
            {"category": cat, "count": cnt}
            for cat, cnt in category_counts.items()
        ],
    }


# ---------------------------------------------------------------------------
# Request handler
# ---------------------------------------------------------------------------
MATCHER = MaterialMatcher()


class MaterialMasterRequestHandler(http.server.BaseHTTPRequestHandler):
    def log_message(self, format, *args):  # suppress default access log noise
        pass

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")

    def do_OPTIONS(self):
        self.send_response(200)
        self._cors()
        self.end_headers()

    def _json(self, data: Any, status: int = 200):
        body = json.dumps(data, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self._cors()
        self.end_headers()
        self.wfile.write(body)

    def _read_body(self) -> dict:
        length = int(self.headers.get("Content-Length", 0))
        raw = self.rfile.read(length).decode("utf-8") if length > 0 else "{}"
        try:
            return json.loads(raw)
        except Exception:
            return {}

    # ---- GET ---------------------------------------------------------------
    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        qp = urllib.parse.parse_qs(parsed.query)

        if path == "/api/health":
            conn = get_conn()
            count = conn.execute("SELECT COUNT(*) FROM materials").fetchone()[0]
            conn.close()
            self._json({
                "status": "HEALTHY",
                "service": "AI National Unified Material Master API",
                "version": "2.1-SIH-SQLITE",
                "materials_count": count,
                "ai_engine": "Scikit-Learn TF-IDF + Domain Normalizer",
                "persistence": "SQLite (materials.db)",
                "timestamp": datetime.now().isoformat(),
            })

        elif path == "/api/materials":
            cpse_f = qp.get("cpse", [None])[0]
            cat_f = qp.get("category", [None])[0]
            status_f = qp.get("status", [None])[0]
            q = qp.get("q", [None])[0]

            sql = "SELECT * FROM materials WHERE 1=1"
            params = []
            if cpse_f and cpse_f != "ALL":
                sql += " AND cpse=?"; params.append(cpse_f)
            if cat_f and cat_f != "ALL":
                sql += " AND category=?"; params.append(cat_f)
            if status_f and status_f != "ALL":
                sql += " AND status=?"; params.append(status_f)

            conn = get_conn()
            rows = [row_to_material(r) for r in conn.execute(sql, params).fetchall()]
            conn.close()

            if q:
                ql = q.lower()
                rows = [m for m in rows if
                        ql in (m.get("raw_description") or "").lower() or
                        ql in (m.get("material_code") or "").lower() or
                        ql in (m.get("suggested_cnmc") or "").lower() or
                        ql in (m.get("cpse") or "").lower()]

            self._json({"total": len(rows), "materials": rows})

        elif path.startswith("/api/materials/"):
            mat_id = path[len("/api/materials/"):]
            conn = get_conn()
            row = conn.execute("SELECT * FROM materials WHERE id=?", (mat_id,)).fetchone()
            conn.close()
            if not row:
                self._json({"error": f"Material '{mat_id}' not found"}, 404)
                return
            mat = row_to_material(row)
            dups = MATCHER.find_duplicates(mat, top_k=6)
            self._json({"material": mat, "duplicates": dups})

        elif path == "/api/analytics":
            self._json(calculate_analytics())

        elif path == "/api/workflow/audit":
            conn = get_conn()
            rows = [row_to_audit(r) for r in
                    conn.execute("SELECT * FROM audit_logs ORDER BY timestamp DESC").fetchall()]
            conn.close()
            self._json({"total_logs": len(rows), "audit_logs": rows})

        else:
            self._json({"error": "Endpoint not found", "path": path}, 404)

    # ---- POST --------------------------------------------------------------
    def do_POST(self):
        path = urllib.parse.urlparse(self.path).path
        payload = self._read_body()

        # 1. Standardize
        if path == "/api/standardize":
            raw = payload.get("raw_description", "")
            if not raw:
                self._json({"error": "raw_description is required"}, 400); return
            attrs = extract_attributes(raw)
            cnmc = generate_cnmc_code(attrs)
            dummy = {"id": "query_temp", "description": raw,
                     "standardized_description": attrs["standardized_description"], "attributes": attrs}
            self._json({
                "raw_input": raw, "attributes": attrs,
                "standardized_description": attrs["standardized_description"],
                "cnmc": cnmc, "matching_candidates": MATCHER.find_duplicates(dummy, top_k=4),
            })

        # 2. Match
        elif path == "/api/match":
            raw = payload.get("raw_description", "")
            mat_id = payload.get("material_id")
            if mat_id:
                conn = get_conn()
                row = conn.execute("SELECT * FROM materials WHERE id=?", (mat_id,)).fetchone()
                conn.close()
                if not row:
                    self._json({"error": "Material ID not found"}, 404); return
                target = row_to_material(row)
            elif raw:
                attrs = extract_attributes(raw)
                target = {"id": "adhoc_search", "description": raw,
                          "standardized_description": attrs["standardized_description"], "attributes": attrs}
            else:
                self._json({"error": "Either material_id or raw_description must be provided"}, 400); return
            self._json({"target": target, "matches": MATCHER.find_duplicates(target, top_k=6)})

        # 3. Compare
        elif path == "/api/compare":
            a_id = payload.get("material_a_id")
            b_id = payload.get("material_b_id")
            conn = get_conn()
            ra = conn.execute("SELECT * FROM materials WHERE id=?", (a_id,)).fetchone()
            rb = conn.execute("SELECT * FROM materials WHERE id=?", (b_id,)).fetchone()
            conn.close()
            if not ra or not rb:
                self._json({"error": "Both material_a_id and material_b_id are required"}, 400); return
            ia, ib = row_to_material(ra), row_to_material(rb)
            self._json({"material_a": ia, "material_b": ib, "comparison": compare_two_materials(ia, ib)})

        # 4. Governance workflow
        elif path == "/api/workflow/action":
            action = payload.get("action")
            mat_ids = payload.get("material_ids", [])
            cnmc_code = payload.get("cnmc_code")
            actor = payload.get("actor", "CPSE Review Officer")
            rationale = payload.get("rationale", "Standardized per National Master Guidelines")
            if not mat_ids:
                self._json({"error": "material_ids array is required"}, 400); return

            conn = get_conn()
            updated = []
            for mid in mat_ids:
                row = conn.execute("SELECT * FROM materials WHERE id=?", (mid,)).fetchone()
                if row:
                    if action in ["APPROVE", "MERGE"]:
                        new_status = "HARMONIZED"
                        if cnmc_code:
                            conn.execute("UPDATE materials SET status=?, suggested_cnmc=? WHERE id=?",
                                         (new_status, cnmc_code, mid))
                        else:
                            conn.execute("UPDATE materials SET status=? WHERE id=?", (new_status, mid))
                    elif action == "REJECT":
                        conn.execute("UPDATE materials SET status=? WHERE id=?",
                                     ("REJECTED_MANUAL_REVIEW", mid))
                    row2 = conn.execute("SELECT * FROM materials WHERE id=?", (mid,)).fetchone()
                    updated.append(row_to_material(row2))

            count = conn.execute("SELECT COUNT(*) FROM audit_logs").fetchone()[0]
            log_id = f"audit-{count + 1:03d}"
            ts = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            cpse_val = updated[0].get("cpse", "Consortium") if updated else "Consortium"
            details = f"Processed {action} for {len(mat_ids)} material(s). Rationale: {rationale}"
            affected = json.dumps([u.get("material_code") for u in updated])
            conn.execute("""
                INSERT INTO audit_logs (id,timestamp,actor,cpse,action,details,cnmc_code,affected_codes_json)
                VALUES (?,?,?,?,?,?,?,?)
            """, (log_id, ts, actor, cpse_val, action, details, cnmc_code or "N/A", affected))
            conn.commit()
            conn.close()

            # Refit matcher with updated DB
            MATCHER.fit_corpus(load_materials_from_db())

            audit_entry = {"id": log_id, "timestamp": ts, "actor": actor, "cpse": cpse_val,
                           "action": action, "details": details, "cnmc_code": cnmc_code or "N/A",
                           "affected_material_codes": json.loads(affected)}
            self._json({"success": True, "action": action,
                        "updated_count": len(updated), "audit_entry": audit_entry})

        # 5. SAP Export
        elif path == "/api/erp/export-sap":
            mat_id = payload.get("material_id")
            conn = get_conn()
            row = (conn.execute("SELECT * FROM materials WHERE id=?", (mat_id,)).fetchone()
                   if mat_id else conn.execute("SELECT * FROM materials LIMIT 1").fetchone())
            conn.close()
            if not row:
                self._json({"error": "No material found"}, 404); return
            item = row_to_material(row)
            self._json({"d": {
                "__metadata": {"id": f"https://s4hana.cpse.gov.in/A_Product('{item['material_code']}')",
                               "type": "API_PRODUCT_SRV.A_ProductType"},
                "Product": item["material_code"], "ProductType": "ZCPSE_ROH",
                "BaseUnit": item["uom"], "NationalUnifiedCode": item["suggested_cnmc"],
                "UNSPSC": item["unspsc_code"], "HSNCode": item["hsn_code"],
                "StandardizedDescription": item["standardized_description"],
                "HarmonizationStatus": item["status"], "CPSEPlant": item["location"],
                "CrossEnterpriseMapping": {
                    "SynchronizedWithNationalMaster": True,
                    "ConsortiumAuthority": "Ministry of Heavy Industries / CPSE Consortium",
                    "LastSyncTimestamp": datetime.now().isoformat(),
                },
            }})

        # 6. Batch Upload
        elif path == "/api/upload-batch":
            conn = get_conn()
            count = conn.execute("SELECT COUNT(*) FROM materials").fetchone()[0]
            created = []
            for row in payload.get("materials", []):
                attrs = extract_attributes(row.get("raw_description", ""))
                cnmc = generate_cnmc_code(attrs, sequence_id=count + 1)
                new_id = f"mat-{count + 1:03d}"
                mat_code = row.get("material_code", f"MAT-BATCH-{count + 1}")
                conn.execute("""
                    INSERT INTO materials
                    (id,cpse,erp_system,material_code,raw_description,description,
                     standardized_description,attributes_json,category,uom,
                     stock_qty,annual_procurement_qty,unit_price_inr,location,
                     suggested_cnmc,unspsc_code,hsn_code,status)
                    VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)
                """, (
                    new_id, row.get("cpse", "CUSTOM_CPSE"),
                    row.get("erp_system", "SAP S/4HANA"), mat_code,
                    row.get("raw_description", ""), row.get("raw_description", ""),
                    attrs["standardized_description"], json.dumps(attrs), attrs["category"],
                    row.get("uom", "EA"), int(row.get("stock_qty", 50)),
                    int(row.get("annual_procurement_qty", 100)),
                    float(row.get("unit_price_inr", 1500.0)),
                    row.get("location", "Central Warehouse"),
                    cnmc["cnmc_code"], cnmc["unspsc_equivalent"], cnmc["hsn_sac_code"],
                    "UNHARMONIZED",
                ))
                new_row = conn.execute("SELECT * FROM materials WHERE id=?", (new_id,)).fetchone()
                created.append(row_to_material(new_row))
                count += 1

            conn.commit()
            conn.close()
            MATCHER.fit_corpus(load_materials_from_db())
            self._json({
                "message": f"Successfully ingested and normalized {len(created)} material master records.",
                "created_count": len(created), "sample": created[:3],
            })

        else:
            self._json({"error": "POST endpoint not found"}, 404)


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
def run_server(port: int = 8000):
    init_db()
    seed_db_if_empty()
    all_mats = load_materials_from_db()
    MATCHER.fit_corpus(all_mats)
    addr = ("", port)
    httpd = http.server.ThreadingHTTPServer(addr, MaterialMasterRequestHandler)
    print(f"=== AI Material Master Server v2.1 (SQLite) on http://localhost:{port} ===")
    print(f"    Loaded {len(all_mats)} materials from materials.db")
    print(f"    API docs: all endpoints at /api/*")
    httpd.serve_forever()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    run_server(port)
