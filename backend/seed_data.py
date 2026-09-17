"""
Realistic Seed Material Master Data across 6 Major Indian CPSEs:
- ONGC (Oil and Natural Gas Corp)
- IOCL (Indian Oil Corp Ltd)
- SAIL (Steel Authority of India Ltd)
- BHEL (Bharat Heavy Electricals Ltd)
- NTPC (NTPC Ltd)
- GAIL (GAIL India Ltd)
"""

from typing import List, Dict, Any
from ai_normalizer import extract_attributes
from cnmc_generator import generate_cnmc_code

RAW_SEED_ITEMS = [
    # Cluster 1: 2-inch Stainless Steel 316 Ball Valve Class 150 (Identical cross-CPSE duplicate)
    {
        "id": "mat-001",
        "cpse": "ONGC",
        "erp_system": "SAP S/4HANA (Western Offshore)",
        "material_code": "VLV-BL-SS316-2IN-150#",
        "raw_description": "2 INCH SS316 BALL VALVE CL150 FLANGED RF BODY CF8M BALL SS316 API 6D",
        "uom": "EA",
        "stock_qty": 340,
        "annual_procurement_qty": 1200,
        "unit_price_inr": 18500,
        "location": "Hazira Supply Base, Gujarat",
        "status": "UNHARMONIZED"
    },
    {
        "id": "mat-002",
        "cpse": "IOCL",
        "erp_system": "SAP ECC 6.0 (Refineries Div)",
        "material_code": "IOCL-M-049821",
        "raw_description": "VALVE, BALL, 2\" (50 NB), RATING 150 LBS, FLGD RAISED FACE, MOC: ASTM A351 CF8M / SS 316",
        "uom": "NOS",
        "stock_qty": 215,
        "annual_procurement_qty": 950,
        "unit_price_inr": 19200,
        "location": "Panipat Refinery, Haryana",
        "status": "UNHARMONIZED"
    },
    {
        "id": "mat-003",
        "cpse": "GAIL",
        "erp_system": "SAP S/4HANA (Gas Pipeline)",
        "material_code": "GAIL-PIP-VLV-5011",
        "raw_description": "BALL VLV 50MM FLANGED CLASS 150# S.S. 316 CF8M TRIM 316 ASME B16.34",
        "uom": "NUM",
        "stock_qty": 180,
        "annual_procurement_qty": 600,
        "unit_price_inr": 18900,
        "location": "Pata Petrochemical Complex, UP",
        "status": "UNHARMONIZED"
    },
    {
        "id": "mat-004",
        "cpse": "SAIL",
        "erp_system": "Oracle ERP (Bokaro Steel)",
        "material_code": "SAIL-BSL-884210",
        "raw_description": "50 NB BALL VALVE SS-316 RF FLANGED ENDS CL 150 BS 5351",
        "uom": "SET",
        "stock_qty": 95,
        "annual_procurement_qty": 450,
        "unit_price_inr": 20400,
        "location": "Bokaro Steel Plant, Jharkhand",
        "status": "UNHARMONIZED"
    },

    # Cluster 2: Deep Groove Ball Bearing 6205-2RS (High volume standardized consumable)
    {
        "id": "mat-005",
        "cpse": "BHEL",
        "erp_system": "SAP S/4HANA (Power Sector)",
        "material_code": "BHEL-HWR-BRG-6205",
        "raw_description": "BEARING DEEP GROOVE BALL 6205-2RS RUBBER SEALED BOTH SIDES C3 CLEARANCE SKF/FAG",
        "uom": "NOS",
        "stock_qty": 1450,
        "annual_procurement_qty": 4200,
        "unit_price_inr": 480,
        "location": "Haridwar Heavy Electricals Plant, UK",
        "status": "UNHARMONIZED"
    },
    {
        "id": "mat-006",
        "cpse": "NTPC",
        "erp_system": "SAP ECC 6.0 (Ramagundam)",
        "material_code": "NTPC-GEN-BRG-00249",
        "raw_description": "BRG DGBB 6205 2RSC3 DUAL CONTACT SEAL 25X52X15 MM",
        "uom": "EA",
        "stock_qty": 820,
        "annual_procurement_qty": 3100,
        "unit_price_inr": 510,
        "location": "Ramagundam Super Thermal, Telangana",
        "status": "UNHARMONIZED"
    },
    {
        "id": "mat-007",
        "cpse": "SAIL",
        "erp_system": "Oracle ERP (Rourkela)",
        "material_code": "SAIL-RSP-77192",
        "raw_description": "DEEP GROOVE BALL BEARING 6205-2RS WITH SYNTHETIC RUBBER SEALS",
        "uom": "NOS",
        "stock_qty": 650,
        "annual_procurement_qty": 2800,
        "unit_price_inr": 525,
        "location": "Rourkela Steel Plant, Odisha",
        "status": "UNHARMONIZED"
    },

    # Cluster 3: 4-inch Gate Valve Class 300 ASTM A216 WCB Cast Carbon Steel
    {
        "id": "mat-008",
        "cpse": "ONGC",
        "erp_system": "SAP S/4HANA (Eastern Asset)",
        "material_code": "VLV-GT-WCB-4IN-300#",
        "raw_description": "GATE VALVE 4 INCH 300# FLANGED RAISED FACE BODY ASTM A216 WCB TRIM 13CR API 600",
        "uom": "EA",
        "stock_qty": 110,
        "annual_procurement_qty": 480,
        "unit_price_inr": 42000,
        "location": "Nazira Asset, Assam",
        "status": "UNHARMONIZED"
    },
    {
        "id": "mat-009",
        "cpse": "IOCL",
        "erp_system": "SAP ECC 6.0 (Gujarat Refinery)",
        "material_code": "IOCL-M-110482",
        "raw_description": "VALVE, GATE, 100 MM (4\"), CLASS 300 LBS, FLANGED RF, CAST CARBON STEEL WCB API 600",
        "uom": "NOS",
        "stock_qty": 140,
        "annual_procurement_qty": 550,
        "unit_price_inr": 43500,
        "location": "Koyali Refinery, Gujarat",
        "status": "UNHARMONIZED"
    },
    {
        "id": "mat-010",
        "cpse": "GAIL",
        "erp_system": "SAP S/4HANA (HVJ Pipeline)",
        "material_code": "GAIL-VLV-GT-100-300",
        "raw_description": "100NB GATE VLV CL.300 FLGD WCB BODY OS&Y BOLTED BONNET",
        "uom": "NUM",
        "stock_qty": 75,
        "annual_procurement_qty": 320,
        "unit_price_inr": 41800,
        "location": "Vijaipur Compressor Station, MP",
        "status": "UNHARMONIZED"
    },

    # Cluster 4: Power Cable 3 Core 240 sq mm 11kV XLPE Armoured
    {
        "id": "mat-011",
        "cpse": "NTPC",
        "erp_system": "SAP ECC 6.0 (Vindhyachal)",
        "material_code": "NTPC-E-CBL-11KV-240",
        "raw_description": "11 KV 3CX240 SQMM XLPE INSULATED ARMOURED ALUMINIUM CONDUCTOR POWER CABLE IS 7098 P2",
        "uom": "MTR",
        "stock_qty": 8500,
        "annual_procurement_qty": 25000,
        "unit_price_inr": 1650,
        "location": "Vindhyachal Super Thermal, MP",
        "status": "UNHARMONIZED"
    },
    {
        "id": "mat-012",
        "cpse": "BHEL",
        "erp_system": "SAP S/4HANA (Bhopal Unit)",
        "material_code": "BHEL-BPL-CBL-240-11",
        "raw_description": "HT POWER CABLE 3C X 240 SQ.MM AL XLPE ARMOURED STRANDED 11KV GRADE IS 7098",
        "uom": "MTR",
        "stock_qty": 6200,
        "annual_procurement_qty": 18000,
        "unit_price_inr": 1720,
        "location": "Bhopal Heavy Electricals, MP",
        "status": "UNHARMONIZED"
    },

    # Cluster 5: Stud Bolts Grade B7 with 2 Heavy Hex Nuts Grade 2H (3/4" x 110 mm)
    {
        "id": "mat-013",
        "cpse": "ONGC",
        "erp_system": "SAP S/4HANA (Mumbai High)",
        "material_code": "FST-STUD-B7-3/4X110",
        "raw_description": "STUD BOLT ASTM A193 GR B7 SIZE 3/4\" X 110MM WITH 2 HEAVY HEX NUTS ASTM A194 GR 2H",
        "uom": "SET",
        "stock_qty": 12000,
        "annual_procurement_qty": 45000,
        "unit_price_inr": 240,
        "location": "Nhava Offshore Yard, Maharashtra",
        "status": "UNHARMONIZED"
    },
    {
        "id": "mat-014",
        "cpse": "IOCL",
        "erp_system": "SAP ECC 6.0 (Mathura)",
        "material_code": "IOCL-FAST-09211",
        "raw_description": "STUD BOLT WITH 2 NUTS, 3/4 INCH DIA X 110 MM LG, MATL ASTM A193 B7 / A194 2H",
        "uom": "NOS",
        "stock_qty": 8500,
        "annual_procurement_qty": 38000,
        "unit_price_inr": 255,
        "location": "Mathura Refinery, UP",
        "status": "UNHARMONIZED"
    },

    # Cluster 6: Functionally Equivalent Near-Duplicate: 2" Ball Valve 300# vs 150# (Higher spec alternative)
    {
        "id": "mat-015",
        "cpse": "ONGC",
        "erp_system": "SAP S/4HANA (Deepwater)",
        "material_code": "VLV-BL-SS316-2IN-300#",
        "raw_description": "2 INCH SS316 BALL VALVE CL300 FLANGED RF CF8M API 6D HIGH PRESSURE",
        "uom": "EA",
        "stock_qty": 80,
        "annual_procurement_qty": 220,
        "unit_price_inr": 26000,
        "location": "Kakinada Deepwater Base, AP",
        "status": "UNHARMONIZED"
    },

    # Unique items
    {
        "id": "mat-016",
        "cpse": "BHEL",
        "erp_system": "SAP S/4HANA (Turbines)",
        "material_code": "BHEL-ROT-IMP-660MW",
        "raw_description": "660MW SUPERCRITICAL STEAM TURBINE HIGH PRESSURE ROTOR BLADE FORGING ALLOY X20CRMOV121",
        "uom": "EA",
        "stock_qty": 8,
        "annual_procurement_qty": 16,
        "unit_price_inr": 3800000,
        "location": "Haridwar Heavy Electricals Plant, UK",
        "status": "STANDARDIZED"
    }
]


def load_seed_materials() -> List[Dict[str, Any]]:
    """Loads and enriches the raw seed materials with AI extracted attributes and suggested CNMC."""
    enriched_materials = []
    for idx, raw in enumerate(RAW_SEED_ITEMS, start=1):
        item = dict(raw)
        item["attributes"] = extract_attributes(item["raw_description"])
        item["standardized_description"] = item["attributes"]["standardized_description"]
        cnmc_info = generate_cnmc_code(item["attributes"], sequence_id=idx)
        item["suggested_cnmc"] = cnmc_info["cnmc_code"]
        item["unspsc_code"] = cnmc_info["unspsc_equivalent"]
        item["hsn_code"] = cnmc_info["hsn_sac_code"]
        item["cnmc_hierarchy"] = cnmc_info["hierarchy"]
        item["description"] = item["raw_description"]
        item["category"] = item["attributes"]["category"]
        enriched_materials.append(item)
    return enriched_materials
