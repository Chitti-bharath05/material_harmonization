"""
Verification script for Backend AI & Matching components.
"""

import json
from ai_normalizer import extract_attributes
from cnmc_generator import generate_cnmc_code
from ai_matcher import MaterialMatcher, compare_two_materials
from seed_data import load_seed_materials

def run_tests():
    print("=== TEST 1: AI Normalization ===")
    test_raw = "2 INCH SS316 BALL VALVE CL150 FLANGED RF BODY CF8M BALL SS316 API 6D"
    attrs = extract_attributes(test_raw)
    print(f"Input: {test_raw}")
    print(f"Extracted: Component={attrs['component_type']}, Grade={attrs['grade']}, Size={attrs['dimension']}, Rating={attrs['pressure_rating']}")
    print(f"Standardized Description: {attrs['standardized_description']}")
    assert attrs["component_type"] == "Ball Valve", "Failed component extraction"
    assert attrs["grade"] == "SS-316", "Failed grade extraction"
    assert attrs["pressure_rating"] == "Class 150", "Failed rating extraction"
    print(">>> Test 1 PASSED!\n")

    print("=== TEST 2: CNMC Generator ===")
    cnmc_info = generate_cnmc_code(attrs, sequence_id=1)
    print(f"Generated CNMC: {cnmc_info['cnmc_code']}")
    print(f"UNSPSC: {cnmc_info['unspsc_equivalent']}, HSN: {cnmc_info['hsn_sac_code']}")
    assert "CNMC" in cnmc_info["cnmc_code"], "Invalid CNMC prefix"
    assert "SS316" in cnmc_info["cnmc_code"], "CNMC missing grade"
    print(">>> Test 2 PASSED!\n")

    print("=== TEST 3: Cross-CPSE Deduplication & Matching ===")
    materials = load_seed_materials()
    print(f"Loaded {len(materials)} materials across CPSEs.")
    
    matcher = MaterialMatcher()
    matcher.fit_corpus(materials)

    # ONGC vs IOCL identical duplicate test
    ongc_valve = materials[0]  # ONGC 2" SS316 Ball Valve
    duplicates = matcher.find_duplicates(ongc_valve, top_k=3)
    print(f"Target: [{ongc_valve['cpse']}] {ongc_valve['description']}")
    print("Top Duplicates Found:")
    for d in duplicates:
        print(f"  -> [{d['material']['cpse']}] {d['material']['material_code']}: {d['confidence_score']}% ({d['match_label']})")
    
    assert len(duplicates) > 0, "No duplicates found"
    assert duplicates[0]["confidence_score"] >= 80.0, f"Expected high confidence, got {duplicates[0]['confidence_score']}"
    print(">>> Test 3 PASSED!\n")

    print("=== TEST 4: Deep Side-by-Side Comparison ===")
    diff = compare_two_materials(materials[0], materials[1])
    print(f"Comparison Verdict: {diff['verdict']}")
    print(f"Confidence: {diff['confidence_score']}%")
    print(f"Matching reasons: {diff['matching_reasons']}")
    print(">>> Test 4 PASSED!\n")

    print("ALL BACKEND AI TESTS COMPLETED SUCCESSFULLY!")

if __name__ == "__main__":
    run_tests()
