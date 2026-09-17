"""
AI Normalizer and Attribute Extraction Engine for CPSE Material Masters.
Standardizes cryptic abbreviations, normalizes units, grades, and dimensions,
and extracts structured technical attributes.
"""

import re
from typing import Dict, Any, List, Tuple

# Domain Dictionary for Abbreviations and Synonyms
DOMAIN_DICTIONARY = {
    # Material Types and Grades
    "materials": {
        r"\b(s\.?s\.?|stainless\s*steel)\b": "Stainless Steel",
        r"\b(c\.?s\.?|carbon\s*steel)\b": "Carbon Steel",
        r"\b(m\.?s\.?|mild\s*steel)\b": "Mild Steel",
        r"\b(a\.?s\.?|alloy\s*steel)\b": "Alloy Steel",
        r"\b(c\.?i\.?|cast\s*iron)\b": "Cast Iron",
        r"\b(d\.?i\.?|ductile\s*iron)\b": "Ductile Iron",
        r"\b(ptfe|teflon)\b": "PTFE (Teflon)",
        r"\b(cu|copper)\b": "Copper",
        r"\b(al|aluminium|aluminum)\b": "Aluminium",
        r"\b(brass)\b": "Brass",
        r"\b(bronze)\b": "Bronze",
        r"\b(inconel\s*(?:600|625|718)?)\b": "Inconel",
        r"\b(monel\s*(?:400|k500)?)\b": "Monel",
        r"\b(hastelloy\s*(?:c276|c22)?)\b": "Hastelloy",
        r"\b(titanium|ti)\b": "Titanium",
    },
    # Specific Grades
    "grades": {
        r"\b(ss\s*316l?|316\s*l|tp\s*316l?|cf8m)\b": "SS-316",
        r"\b(ss\s*304l?|304\s*l|tp\s*304l?|cf8)\b": "SS-304",
        r"\b(ss\s*321|tp\s*321)\b": "SS-321",
        r"\b(ss\s*410)\b": "SS-410",
        r"\b(a105|a105n|astm\s*a105)\b": "ASTM A105 Carbon Steel",
        r"\b(a216\s*wcb|wcb)\b": "WCB Cast Carbon Steel",
        r"\b(a350\s*lf2|lf2)\b": "ASTM A350 LF2 (Low Temp)",
        r"\b(a312|astm\s*a312)\b": "ASTM A312",
        r"\b(a182\s*f316|f316)\b": "ASTM A182 F316",
        r"\b(a182\s*f304|f304)\b": "ASTM A182 F304",
        r"\b(is\s*2062(?:\s*gr(?:\.|\s*)?b)?)\b": "IS 2062 Grade B",
        r"\b(en\s*8|en\s*24|en\s*19)\b": "Alloy Steel (EN Series)",
    },
    # Equipment and Component Types
    "components": {
        r"\b(vlv-bl|ball\s*vlv|valve\s*ball|ball\s*valve)\b": "Ball Valve",
        r"\b(vlv-gt|gate\s*vlv|valve\s*gate|gate\s*valve)\b": "Gate Valve",
        r"\b(vlv-gl|globe\s*vlv|valve\s*globe|globe\s*valve)\b": "Globe Valve",
        r"\b(vlv-ck|check\s*vlv|nrv|non\s*return\s*valve|check\s*valve)\b": "Check Valve (NRV)",
        r"\b(vlv-bf|bf\s*vlv|butterfly\s*valve|butterfly\s*vlv)\b": "Butterfly Valve",
        r"\b(vlv-nd|needle\s*valve|needle\s*vlv)\b": "Needle Valve",
        r"\b(flg|flange|flanged)\b": "Flange",
        r"\b(gkt|gasket)\b": "Gasket",
        r"\b(brg|bearing)\b": "Bearing",
        r"\b(swg|switchgear)\b": "Switchgear",
        r"\b(mcb|mccb|acb)\b": "Circuit Breaker",
        r"\b(cb-pvc|xlpe\s*cable|cable)\b": "Power Cable",
        r"\b(fst|fastener|bolt|stud|nut)\b": "Fastener / Stud Bolt",
        r"\b(pmp|pump|centrifugal\s*pump)\b": "Centrifugal Pump",
        r"\b(p-pipe|seamless\s*pipe|pipe)\b": "Pipe",
        r"\b(fitting|elbow|tee|reducer)\b": "Pipe Fitting",
    },
    # Pressure Classes
    "pressure_ratings": {
        r"\b(150#|150\s*lbs?|class\s*150|cl\.?\s*150|rating\s*150)\b": "Class 150",
        r"\b(300#|300\s*lbs?|class\s*300|cl\.?\s*300|rating\s*300)\b": "Class 300",
        r"\b(600#|600\s*lbs?|class\s*600|cl\.?\s*600|rating\s*600)\b": "Class 600",
        r"\b(800#|800\s*lbs?|class\s*800|cl\.?\s*800|rating\s*800)\b": "Class 800",
        r"\b(900#|900\s*lbs?|class\s*900|cl\.?\s*900|rating\s*900)\b": "Class 900",
        r"\b(1500#|1500\s*lbs?|class\s*1500|cl\.?\s*1500|rating\s*1500)\b": "Class 1500",
        r"\b(2500#|2500\s*lbs?|class\s*2500|cl\.?\s*2500|rating\s*2500)\b": "Class 2500",
        r"\b(pn\s*10|pn10)\b": "PN 10",
        r"\b(pn\s*16|pn16)\b": "PN 16",
        r"\b(pn\s*25|pn25)\b": "PN 25",
        r"\b(pn\s*40|pn40)\b": "PN 40",
    },
    # End Connections
    "end_connections": {
        r"\b(flgd|flanged|flange\s*end|rf|raised\s*face)\b": "Flanged (RF)",
        r"\b(ff|flat\s*face)\b": "Flat Face (FF)",
        r"\b(rtj|ring\s*joint)\b": "Ring Type Joint (RTJ)",
        r"\b(thrd|threaded|npt|bsp|screwed)\b": "Threaded (NPT)",
        r"\b(sw|socket\s*weld)\b": "Socket Weld (SW)",
        r"\b(bw|butt\s*weld)\b": "Butt Weld (BW)",
        r"\b(wafer)\b": "Wafer Type",
        r"\b(lug|lugged)\b": "Lugged Type",
    },
    # Dimensions / Nominal Bore (NB)
    "nominal_diameters": {
        r"\b(1/2\"?|1/2\s*in(?:ch)?|15\s*nb|15\s*mm|dn\s*15)\b": "15 mm (1/2\")",
        r"\b(3/4\"?|3/4\s*in(?:ch)?|20\s*nb|20\s*mm|dn\s*20)\b": "20 mm (3/4\")",
        r"\b(1\"?|1\s*in(?:ch)?|25\s*nb|25\s*mm|dn\s*25)\b": "25 mm (1\")",
        r"\b(1-1/2\"?|1\.5\"?|1\s*1/2\s*in(?:ch)?|40\s*nb|40\s*mm|dn\s*40)\b": "40 mm (1.5\")",
        r"\b(2\"?|2\s*in(?:ch)?|50\s*nb|50\s*mm|dn\s*50)\b": "50 mm (2\")",
        r"\b(2-1/2\"?|2\.5\"?|65\s*nb|65\s*mm|dn\s*65)\b": "65 mm (2.5\")",
        r"\b(3\"?|3\s*in(?:ch)?|80\s*nb|80\s*mm|dn\s*80)\b": "80 mm (3\")",
        r"\b(4\"?|4\s*in(?:ch)?|100\s*nb|100\s*mm|dn\s*100)\b": "100 mm (4\")",
        r"\b(6\"?|6\s*in(?:ch)?|150\s*nb|150\s*mm|dn\s*150)\b": "150 mm (6\")",
        r"\b(8\"?|8\s*in(?:ch)?|200\s*nb|200\s*mm|dn\s*200)\b": "200 mm (8\")",
        r"\b(10\"?|10\s*in(?:ch)?|250\s*nb|250\s*mm|dn\s*250)\b": "250 mm (10\")",
        r"\b(12\"?|12\s*in(?:ch)?|300\s*nb|300\s*mm|dn\s*300)\b": "300 mm (12\")",
    },
    # Industrial Standards
    "standards": {
        r"\b(api\s*6d|api6d)\b": "API 6D",
        r"\b(api\s*600|api600)\b": "API 600",
        r"\b(api\s*602|api602)\b": "API 602",
        r"\b(asme\s*b16\.34|b16\.34)\b": "ASME B16.34",
        r"\b(asme\s*b16\.5|b16\.5)\b": "ASME B16.5",
        r"\b(asme\s*b16\.9|b16\.9)\b": "ASME B16.9",
        r"\b(bs\s*5351|bs5351)\b": "BS 5351",
        r"\b(is\s*2062)\b": "IS 2062",
        r"\b(is\s*1239)\b": "IS 1239",
        r"\b(is\s*3589)\b": "IS 3589",
        r"\b(is\s*694)\b": "IS 694",
        r"\b(iec\s*60947)\b": "IEC 60947",
        r"\b(iso\s*9001)\b": "ISO 9001",
    }
}


def normalize_token_text(text: str) -> str:
    """Pre-cleans raw description, removing extraneous noise and standardizing spacing."""
    if not text:
        return ""
    cleaned = text.strip()
    # Replace punctuation and separators with single spaces
    cleaned = re.sub(r"[,;_\t/]+", " ", cleaned)
    cleaned = re.sub(r"\s+", " ", cleaned)
    return cleaned


def extract_attributes(raw_description: str) -> Dict[str, Any]:
    """
    Extracts structured technical attributes from an unstructured material description.
    Returns a dictionary of normalized attributes.
    """
    text = normalize_token_text(raw_description)
    lower_text = text.lower()

    attributes = {
        "component_type": "Industrial Component",
        "category": "General Equipment",
        "material_base": "Unspecified",
        "grade": "Standard Grade",
        "dimension": "N/A",
        "pressure_rating": "N/A",
        "end_connection": "N/A",
        "standard": "General Industry Standard",
        "extracted_tokens": [],
    }

    # 1. Component Type & Category
    for pattern, val in DOMAIN_DICTIONARY["components"].items():
        if re.search(pattern, lower_text):
            attributes["component_type"] = val
            attributes["extracted_tokens"].append(val)
            if "Valve" in val:
                attributes["category"] = "Piping & Valves"
            elif val in ["Flange", "Pipe", "Pipe Fitting", "Gasket"]:
                attributes["category"] = "Piping & Spares"
            elif val in ["Switchgear", "Circuit Breaker", "Power Cable"]:
                attributes["category"] = "Electrical & Instrumentation"
            elif val in ["Bearing"]:
                attributes["category"] = "Mechanical & Bearings"
            elif val in ["Fastener / Stud Bolt"]:
                attributes["category"] = "Fasteners & Hardware"
            elif val in ["Centrifugal Pump"]:
                attributes["category"] = "Rotary Equipment"
            break

    # 2. Material Grade
    for pattern, val in DOMAIN_DICTIONARY["grades"].items():
        if re.search(pattern, lower_text):
            attributes["grade"] = val
            attributes["extracted_tokens"].append(val)
            break

    # 3. Base Material
    for pattern, val in DOMAIN_DICTIONARY["materials"].items():
        if re.search(pattern, lower_text):
            attributes["material_base"] = val
            attributes["extracted_tokens"].append(val)
            break
            
    # Infer base material if grade found but material_base still unspecified
    if attributes["material_base"] == "Unspecified":
        if "SS" in attributes["grade"] or "CF8" in attributes["grade"]:
            attributes["material_base"] = "Stainless Steel"
        elif "A105" in attributes["grade"] or "WCB" in attributes["grade"]:
            attributes["material_base"] = "Carbon Steel"
        elif "IS 2062" in attributes["grade"]:
            attributes["material_base"] = "Structural Mild Steel"

    # 4. Dimension / Nominal Diameter (NB)
    for pattern, val in DOMAIN_DICTIONARY["nominal_diameters"].items():
        if re.search(pattern, lower_text):
            attributes["dimension"] = val
            attributes["extracted_tokens"].append(val)
            break
    if attributes["dimension"] == "N/A":
        # Generic dimension fallback (e.g. 50x50, 12mm, etc.)
        dim_match = re.search(r"\b(\d+(?:\.\d+)?\s*(?:mm|mtr|m|inch|in|\"))\b", lower_text)
        if dim_match:
            attributes["dimension"] = dim_match.group(1).upper()
            attributes["extracted_tokens"].append(attributes["dimension"])

    # 5. Pressure Class
    for pattern, val in DOMAIN_DICTIONARY["pressure_ratings"].items():
        if re.search(pattern, lower_text):
            attributes["pressure_rating"] = val
            attributes["extracted_tokens"].append(val)
            break

    # 6. End Connection
    for pattern, val in DOMAIN_DICTIONARY["end_connections"].items():
        if re.search(pattern, lower_text):
            attributes["end_connection"] = val
            attributes["extracted_tokens"].append(val)
            break

    # 7. Industrial Standard
    for pattern, val in DOMAIN_DICTIONARY["standards"].items():
        if re.search(pattern, lower_text):
            attributes["standard"] = val
            attributes["extracted_tokens"].append(val)
            break

    # Special case for Bearings (e.g. 6205, 6309, 22218)
    bearing_match = re.search(r"\b([1-8][0-9]{3,4}(?:-[2rsc3z]+)?)\b", lower_text)
    if bearing_match:
        attributes["bearing_model"] = bearing_match.group(1).upper()
        attributes["extracted_tokens"].append(f"Model: {attributes['bearing_model']}")
        if attributes["component_type"] == "Industrial Component":
            attributes["component_type"] = "Deep Groove / Roller Bearing"
            attributes["category"] = "Mechanical & Bearings"

    # Generate Unified Technical Description (UTD)
    utd_parts = []
    if attributes["component_type"] != "Industrial Component":
        utd_parts.append(attributes["component_type"])
    
    if attributes["dimension"] != "N/A":
        utd_parts.append(f"Size: {attributes['dimension']}")

    if attributes["grade"] != "Standard Grade":
        utd_parts.append(f"Material: {attributes['grade']}")
    elif attributes["material_base"] != "Unspecified":
        utd_parts.append(f"Material: {attributes['material_base']}")

    if attributes["pressure_rating"] != "N/A":
        utd_parts.append(f"Rating: {attributes['pressure_rating']}")

    if attributes["end_connection"] != "N/A":
        utd_parts.append(f"Ends: {attributes['end_connection']}")

    if attributes["standard"] != "General Industry Standard":
        utd_parts.append(f"Std: {attributes['standard']}")

    attributes["standardized_description"] = ", ".join(utd_parts) if utd_parts else text
    return attributes
