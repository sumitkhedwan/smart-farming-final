from __future__ import annotations

import re

from .knowledge import disease_remedy, soil_guidance


def answer_farming_question(message: str) -> str:
    """Return a concise response from the reviewed, bundled agronomy reference."""
    question = re.sub(r"\s+", " ", message.strip().lower())

    soil_names = ("sandy", "clay", "loamy", "silty", "black", "red", "alluvial")
    soil_name = next((soil for soil in soil_names if re.search(rf"\b{soil}\b", question)), None)
    if soil_name and any(term in question for term in ("soil", "irrigat", "fertiliz", "crop", "plant", "water")):
        advice = soil_guidance(soil_name)
        if "irrigat" in question or "water" in question:
            detail = advice["irrigation"]
        elif "fertiliz" in question or "nutrient" in question:
            detail = advice["fertilizer"]
        else:
            detail = "Suggested crops in the bundled reference: " + ", ".join(advice["crops"]) + ". " + advice["tests_to_confirm"][0] + "."
        return f"For {soil_name} soil: {detail} Confirm local conditions with a field inspection or soil test."

    diseases = {
        "apple scab": "apple_scab",
        "cedar apple rust": "cedar_apple_rust",
        "black rot": "black_rot",
        "early blight": "early_blight",
        "late blight": "late_blight",
    }
    disease_key = next((key for phrase, key in diseases.items() if phrase in question), None)
    if disease_key:
        advice = disease_remedy(disease_key)
        recommendation = " ".join(advice["organic"])
        return (
            f"The reference entry for {disease_key.replace('_', ' ')} says: {recommendation} "
            "This guide cannot diagnose a disease from a description. Confirm it with a local agricultural extension adviser before treatment."
        )

    if any(term in question for term in ("pesticide", "fungicide", "chemical", "dose", "dosage")):
        return "Do not apply a pesticide based only on a chat message or image result. Confirm the problem with a qualified local adviser and follow the registered product label, including crop, rate, protective equipment, and harvest interval."
    if any(term in question for term in ("fertiliz", "nutrient", "compost")):
        return "Base fertilizer decisions on a representative soil test and the crop's growth stage. The bundled guidance is general and does not calculate a field-specific nutrient rate."
    if any(term in question for term in ("water", "irrigat", "drought")):
        return "Check soil moisture and crop stage before irrigating. Apply water evenly, avoid prolonged saturation, and use local extension guidance for crop-specific scheduling."

    return (
        "This guide can summarize its bundled notes for soil types (sandy, clay, loamy, silty, black, red, alluvial) "
        "and common blights or apple diseases. It is a limited reference, not an AI adviser or diagnosis service. "
        "For a specific recommendation, share the crop and describe what you are observing; confirm treatment locally."
    )
