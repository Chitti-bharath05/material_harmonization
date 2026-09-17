"""
Common National Material Code (CNMC) Generator.
Generates unique, structured, human-readable National Material Codes for CPSEs
with sector, category, subcategory, material grade, and specifications encoding.
"""

import hashlib
import re
from typing import Dict, Any


def generate_cnmc_code(attributes: Dict[str, Any], sequence_id: int = None) -> Dict[str, Any]:
    """
    Generates a structured Common National Material Code (CNMC) based on extracted attributes.
    Format: CNMC-[SECTOR]-[CAT]-[SUBCAT]-[GRADE]-[SIZE]-[RATING]-[SEQ]
    """
    # 1. Sector prefix (Energy, Heavy Eng, Steel, Mining, Power)
    category = attributes.get("category", "General")
    if "Piping" in category or "Valves" in category:
        sector = "ENG"
        cat_code = "PIP"
    elif "Electrical" in category:
        sector = "PWR"
        cat_code = "ELE"
    elif "Bearing" in category or "Mechanical" in category:
        sector = "MEC"
        cat_code = "BRG"
    elif "Fastener" in category:
        sector = "IND"
        cat_code = "FST"
    elif "Rotary" in category:
        sector = "ROT"
        cat_code = "PMP"
    else:
        sector = "CPSE"
        cat_code = "GEN"

    # 2. Subcategory / Component code
    comp = attributes.get("component_type", "GEN")
    subcat_map = {
        "Ball Valve": "VLV-BL",
        "Gate Valve": "VLV-GT",
        "Globe Valve": "VLV-GL",
        "Check Valve (NRV)": "VLV-CK",
        "Butterfly Valve": "VLV-BF",
        "Needle Valve": "VLV-ND",
        "Flange": "FLG-WN",
        "Gasket": "GKT-SP",
        "Deep Groove / Roller Bearing": "BRG-RL",
        "Bearing": "BRG-SL",
        "Circuit Breaker": "SWG-CB",
        "Power Cable": "CBL-PW",
        "Fastener / Stud Bolt": "FST-BL",
        "Pipe": "PIP-SM",
        "Pipe Fitting": "FIT-EL",
    }
    subcat_code = subcat_map.get(comp, "ITM-01")

    # 3. Material Grade Code
    grade = attributes.get("grade", attributes.get("material_base", "STD"))
    grade_cleaned = re.sub(r"[^A-Za-z0-9]", "", grade).upper()
    if "316" in grade_cleaned:
        grade_code = "SS316"
    elif "304" in grade_cleaned:
        grade_code = "SS304"
    elif "A105" in grade_cleaned:
        grade_code = "A105"
    elif "WCB" in grade_cleaned:
        grade_code = "WCB"
    elif "2062" in grade_cleaned:
        grade_code = "IS2062"
    elif "CARBON" in grade_cleaned:
        grade_code = "CS"
    elif "MILD" in grade_cleaned:
        grade_code = "MS"
    else:
        grade_code = grade_cleaned[:5] if grade_cleaned else "STD"

    # 4. Size Code
    dim = attributes.get("dimension", "NA")
    size_match = re.search(r"(\d+)\s*(?:mm|nb)", dim.lower())
    if size_match:
        size_code = f"DN{size_match.group(1)}"
    elif "1/2" in dim:
        size_code = "DN15"
    elif "3/4" in dim:
        size_code = "DN20"
    elif "1\"" in dim or "1 in" in dim:
        size_code = "DN25"
    elif "2\"" in dim or "2 in" in dim:
        size_code = "DN50"
    elif "3\"" in dim or "3 in" in dim:
        size_code = "DN80"
    elif "4\"" in dim or "4 in" in dim:
        size_code = "DN100"
    elif attributes.get("bearing_model"):
        size_code = f"M{attributes['bearing_model'][:6]}"
    else:
        size_code = "GEN"

    # 5. Rating Code
    rating = attributes.get("pressure_rating", "NA")
    rating_match = re.search(r"(\d+)", rating)
    if rating_match:
        rating_code = f"C{rating_match.group(1)}"
    else:
        rating_code = "STD"

    # 6. Sequence / Hash Suffix
    seed_str = f"{cat_code}-{subcat_code}-{grade_code}-{size_code}-{rating_code}"
    hash_digest = hashlib.sha256(seed_str.encode("utf-8")).hexdigest()[:4].upper()
    seq = f"{sequence_id:04d}" if sequence_id is not None else hash_digest

    cnmc_code = f"CNMC-{sector}-{cat_code}-{subcat_code}-{grade_code}-{size_code}-{rating_code}-{seq}"

    # Generate UNSPSC & Harmonized System (HSN) recommendation
    unspsc_code = "40141600" if "Valve" in comp else ("31171500" if "Bearing" in comp else "39121400")
    hsn_code = "8481.80" if "Valve" in comp else ("8482.10" if "Bearing" in comp else "8536.20")

    return {
        "cnmc_code": cnmc_code,
        "unspsc_equivalent": unspsc_code,
        "hsn_sac_code": hsn_code,
        "hierarchy": {
            "sector": sector,
            "category": cat_code,
            "sub_category": subcat_code,
            "material_grade": grade_code,
            "dimension": size_code,
            "rating": rating_code,
            "checksum": seq
        }
    }
