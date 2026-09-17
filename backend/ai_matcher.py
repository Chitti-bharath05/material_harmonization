"""
AI Deduplication and Similarity Engine for Cross-CPSE Material Masters.
Combines TF-IDF n-gram vectorization, Cosine Similarity, and Domain Attribute Matching
to calculate composite confidence scores and generate human-interpretable explanations.
"""

from typing import List, Dict, Any, Tuple
import numpy as np
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from ai_normalizer import extract_attributes, normalize_token_text


class MaterialMatcher:
    def __init__(self):
        self.vectorizer = TfidfVectorizer(
            ngram_range=(1, 3),
            analyzer="char_wb",
            sublinear_tf=True,
            min_df=1
        )
        self.fitted = False
        self.corpus_texts: List[str] = []
        self.material_db: List[Dict[str, Any]] = []

    def fit_corpus(self, materials: List[Dict[str, Any]]):
        """Fits TF-IDF model on corpus of standardized material descriptions."""
        self.material_db = materials
        self.corpus_texts = [
            f"{m.get('description', '')} {m.get('standardized_description', '')} {m.get('category', '')}"
            for m in materials
        ]
        if self.corpus_texts:
            self.tfidf_matrix = self.vectorizer.fit_transform(self.corpus_texts)
            self.fitted = True

    def calculate_attribute_similarity(self, attr_a: Dict[str, Any], attr_b: Dict[str, Any]) -> Tuple[float, List[str], List[str]]:
        """
        Calculates functional attribute similarity between two materials.
        Returns score (0.0 to 1.0), matching attributes list, and divergent attributes list.
        """
        matching_reasons = []
        divergent_reasons = []
        
        # Weights for critical engineering attributes
        weights = {
            "component_type": 0.30,
            "grade": 0.25,
            "dimension": 0.25,
            "pressure_rating": 0.15,
            "end_connection": 0.05,
        }
        total_weight = 0.0
        score = 0.0

        for key, w in weights.items():
            val_a = attr_a.get(key, "N/A")
            val_b = attr_b.get(key, "N/A")
            
            # Skip if both are unspecified/NA
            if val_a in ["N/A", "Standard Grade", "Unspecified"] and val_b in ["N/A", "Standard Grade", "Unspecified"]:
                continue
                
            total_weight += w
            if val_a == val_b and val_a not in ["N/A", "Standard Grade", "Unspecified"]:
                score += w
                matching_reasons.append(f"{key.replace('_', ' ').title()}: '{val_a}' matches identically.")
            elif val_a != val_b:
                divergent_reasons.append(f"{key.replace('_', ' ').title()} differs: '{val_a}' vs '{val_b}'.")

        # Normalize score over active weights
        normalized_attr_score = (score / total_weight) if total_weight > 0 else 0.5
        return normalized_attr_score, matching_reasons, divergent_reasons

    def find_duplicates(self, target_material: Dict[str, Any], top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Finds duplicate and equivalent candidates for a target material across CPSEs.
        """
        if not self.fitted or not self.material_db:
            return []

        target_text = f"{target_material.get('description', '')} {target_material.get('standardized_description', '')}"
        target_vec = self.vectorizer.transform([target_text])
        cosine_sims = cosine_similarity(target_vec, self.tfidf_matrix)[0]

        target_attr = target_material.get("attributes") or extract_attributes(target_material.get("description", ""))

        candidates = []
        for idx, item in enumerate(self.material_db):
            # Skip comparing material with itself if from same CPSE and same code
            if item.get("id") == target_material.get("id") or (
                item.get("cpse") == target_material.get("cpse") and 
                item.get("material_code") == target_material.get("material_code")
            ):
                continue

            item_attr = item.get("attributes") or extract_attributes(item.get("description", ""))
            attr_score, match_reasons, diff_reasons = self.calculate_attribute_similarity(target_attr, item_attr)
            lexical_score = float(cosine_sims[idx])

            # Composite match calculation
            composite_score = (lexical_score * 0.35) + (attr_score * 0.65)
            confidence_pct = round(composite_score * 100, 1)

            if confidence_pct >= 85.0:
                match_type = "DIRECT_DUPLICATE"
                match_label = "Direct Duplicate / Identical"
                action_recommended = "HARMONIZE_TO_CNMC"
            elif confidence_pct >= 70.0:
                match_type = "NEAR_DUPLICATE"
                match_label = "Functionally Equivalent"
                action_recommended = "REVIEW_AND_MAP"
            elif confidence_pct >= 50.0:
                match_type = "LOW_SIMILARITY"
                match_label = "Similar Category / Partial Match"
                action_recommended = "RETAIN_SEPARATE"
            else:
                continue

            candidates.append({
                "material": item,
                "confidence_score": confidence_pct,
                "lexical_similarity": round(lexical_score * 100, 1),
                "attribute_similarity": round(attr_score * 100, 1),
                "match_type": match_type,
                "match_label": match_label,
                "action_recommended": action_recommended,
                "matching_attributes": match_reasons,
                "divergent_attributes": diff_reasons,
            })

        # Sort candidates descending by confidence score
        candidates.sort(key=lambda x: x["confidence_score"], reverse=True)
        return candidates[:top_k]


def compare_two_materials(mat_a: Dict[str, Any], mat_b: Dict[str, Any]) -> Dict[str, Any]:
    """
    Direct side-by-side comparison between two material records with deep diff.
    """
    import re
    attr_a = mat_a.get("attributes") or extract_attributes(mat_a.get("description", ""))
    attr_b = mat_b.get("attributes") or extract_attributes(mat_b.get("description", ""))

    matcher = MaterialMatcher()
    attr_score, match_reasons, diff_reasons = matcher.calculate_attribute_similarity(attr_a, attr_b)

    # Word token overlap with regex cleanup
    tokens_a = set(re.findall(r"[a-z0-9]+", mat_a.get("description", "").lower()))
    tokens_b = set(re.findall(r"[a-z0-9]+", mat_b.get("description", "").lower()))
    jaccard = len(tokens_a.intersection(tokens_b)) / max(len(tokens_a.union(tokens_b)), 1)

    composite = (jaccard * 0.25) + (attr_score * 0.75)
    # If all critical engineering attributes match identically, elevate confidence
    if attr_score >= 0.90:
        composite = max(composite, 0.90)

    confidence_pct = round(composite * 100, 1)

    if confidence_pct >= 85:
        verdict = "Identical Specification (Safe for Direct CNMC Harmonization)"
    elif confidence_pct >= 70:
        verdict = "Functionally Equivalent (Substitute/Interchangeable)"
    else:
        verdict = "Distinct Materials (Keep Separate Master Records)"

    return {
        "confidence_score": confidence_pct,
        "attribute_score": round(attr_score * 100, 1),
        "lexical_score": round(jaccard * 100, 1),
        "verdict": verdict,
        "matching_reasons": match_reasons,
        "divergent_reasons": diff_reasons,
        "attributes_a": attr_a,
        "attributes_b": attr_b,
    }
