"""
EMERGENCY INTELLIGENCE ENGINE
──────────────────────────────
A fully local, explainable decision system — not a call to a hosted LLM.
Pipeline: text normalization -> weighted keyword/TF-IDF-style extraction ->
category classification -> severity scoring -> priority formula ->
required-resource inference -> recommended action.

This mirrors frontend/src/algorithms/classification.ts term-for-term and
weight-for-weight, so the backend and the standalone frontend demo engine
always agree on a classification for the same input.
"""

import re
from dataclasses import dataclass, field

CATEGORIES = [
    "MEDICAL", "FIRE", "FLOOD", "EVACUATION", "ACCIDENT", "FOOD", "WATER",
    "MEDICINE", "SHELTER", "RESCUE", "TRANSPORT", "POWER", "OTHER",
]
SEVERITIES = ["CRITICAL", "HIGH", "MEDIUM", "LOW"]

SEVERITY_KEYWORDS: dict[str, list[tuple[str, int]]] = {
    "CRITICAL": [
        ("unconscious", 100), ("not breathing", 100), ("cardiac", 100), ("heart attack", 100),
        ("bleeding heavily", 95), ("severe bleeding", 95), ("drowning", 100), ("trapped", 90),
        ("child trapped", 100), ("severe breathing", 90), ("can't breathe", 90), ("fire", 85),
        ("collapsed", 85), ("immediate danger", 95), ("life threatening", 95),
        ("critical condition", 90), ("electrocuted", 90),
    ],
    "HIGH": [
        ("injured", 65), ("injury", 60), ("elderly", 55), ("pregnant", 65), ("stranded", 60),
        ("medicine needed", 60), ("evacuation required", 70), ("evacuate", 65), ("flooded", 60),
        ("rising water", 65), ("broken bone", 60), ("fracture", 55), ("infant", 60),
        ("disabled", 55), ("no vehicle", 45), ("cut off", 55),
    ],
    "MEDIUM": [
        ("food", 35), ("water shortage", 40), ("drinking water", 35), ("transportation", 35),
        ("shelter", 40), ("power outage", 30), ("no electricity", 30), ("supplies", 30),
        ("medicine", 40), ("prescription", 35),
    ],
    "LOW": [
        ("information", 10), ("general assistance", 12), ("advice", 8), ("question", 8),
        ("status update", 10), ("checking in", 8),
    ],
}

CATEGORY_KEYWORDS: dict[str, list[str]] = {
    "MEDICAL": ["unconscious", "not breathing", "cardiac", "heart attack", "bleeding", "injury", "injured", "pregnant", "labor", "diabetic", "seizure", "allergic", "medical", "doctor", "ambulance", "wound"],
    "FIRE": ["fire", "smoke", "burning", "flames", "gas leak", "explosion"],
    "FLOOD": ["flood", "flooded", "rising water", "waterlogged", "submerged", "heavy rain", "overflowing"],
    "EVACUATION": ["evacuate", "evacuation", "trapped", "stuck", "move to safety", "relocate", "rescue us"],
    "ACCIDENT": ["accident", "crash", "collision", "fell", "fall", "hit by", "road accident"],
    "FOOD": ["food", "hungry", "ration", "meal", "starving"],
    "WATER": ["drinking water", "water shortage", "no water", "clean water", "water supply"],
    "MEDICINE": ["medicine", "medication", "prescription", "insulin", "pharmacy", "tablets", "drugs needed"],
    "SHELTER": ["shelter", "homeless", "no place to stay", "displaced", "roof damaged", "house destroyed"],
    "RESCUE": ["rescue", "trapped", "stuck", "stranded", "drowning", "collapsed building", "debris"],
    "TRANSPORT": ["vehicle", "transport", "no vehicle", "ride", "pickup", "car needed", "stranded"],
    "POWER": ["power outage", "no electricity", "power cut", "generator", "charging", "battery dead"],
    "OTHER": [],
}

VULNERABILITY_KEYWORDS = ["elderly", "child", "children", "infant", "baby", "pregnant", "disabled", "alone", "grandmother", "grandfather", "wheelchair", "newborn"]

# Fixed-weight boost per explicitly-declared flag (mirrors
# frontend/src/algorithms/classification.ts VULNERABILITY_FLAG_WEIGHTS).
# Independent of and additive to free-text keyword detection above — a
# requester (or someone reporting on their behalf) ticking "Elderly" always
# counts, even if the word never appears in the description.
VULNERABILITY_FLAG_WEIGHTS: dict[str, int] = {
    "ELDERLY": 35,
    "DISABLED": 35,
    "CHILD_OR_INFANT": 35,
    "PREGNANT": 35,
    "ALONE_NO_CAREGIVER": 25,
}

VULNERABILITY_FLAG_LABELS: dict[str, str] = {
    "ELDERLY": "Elderly",
    "DISABLED": "Disabled / mobility-impaired",
    "CHILD_OR_INFANT": "Child or infant",
    "PREGNANT": "Pregnant",
    "ALONE_NO_CAREGIVER": "Alone, no caregiver present",
}
SITUATION_KEYWORDS = ["trapped", "flooded", "collapsed", "spreading", "no vehicle", "stranded", "cut off", "surrounded by water", "structural damage", "blocked road"]
TIME_SENSITIVITY_KEYWORDS = ["immediately", "right now", "urgent", "urgently", "asap", "minutes", "worsening", "getting worse", "losing consciousness", "can't wait"]

CATEGORY_RESOURCE_MAP: dict[str, list[str]] = {
    "MEDICAL": ["MEDICAL_SKILL", "FIRST_AID_KIT", "VEHICLE"],
    "FIRE": ["RESCUE_SKILL", "VEHICLE"],
    "FLOOD": ["RESCUE_SKILL", "VEHICLE", "SHELTER"],
    "EVACUATION": ["VEHICLE", "RESCUE_SKILL"],
    "ACCIDENT": ["MEDICAL_SKILL", "VEHICLE", "FIRST_AID_KIT"],
    "FOOD": ["FOOD"],
    "WATER": ["WATER"],
    "MEDICINE": ["MEDICINE"],
    "SHELTER": ["SHELTER", "TRANSPORT"],
    "RESCUE": ["RESCUE_SKILL", "VEHICLE"],
    "TRANSPORT": ["VEHICLE", "TRANSPORT"],
    "POWER": ["POWER_BANK"],
    "OTHER": ["COMMUNICATION_EQUIPMENT"],
}

RESOURCE_URGENCY_MAP: dict[str, int] = {
    "MEDICAL": 90, "FIRE": 95, "FLOOD": 80, "EVACUATION": 85, "ACCIDENT": 85, "RESCUE": 95,
    "MEDICINE": 55, "WATER": 40, "FOOD": 35, "SHELTER": 45, "TRANSPORT": 40, "POWER": 30, "OTHER": 25,
}


def _normalize(text: str) -> str:
    text = text.lower()
    text = re.sub(r"[^\w\s']", " ", text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def _count_hits(text: str, terms: list[str]) -> list[tuple[str, int]]:
    results = []
    for term in terms:
        pattern = r"\b" + re.escape(term) + r"\b"
        matches = re.findall(pattern, text, flags=re.IGNORECASE)
        if matches:
            results.append((term, len(matches)))
    return results


def _count_category_hits(text: str, terms: list[str]) -> int:
    """Non-overlapping hit count: longer phrases are matched and masked out
    first so a shorter substring term (e.g. 'vehicle') doesn't also score a
    second hit inside a phrase that already matched (e.g. 'no vehicle')."""
    working = text
    total = 0
    for term in sorted(terms, key=lambda t: -len(t.split())):
        pattern = r"\b" + re.escape(term) + r"\b"
        matches = list(re.finditer(pattern, working, flags=re.IGNORECASE))
        if matches:
            total += len(matches)
            working = re.sub(pattern, lambda m: " " * len(m.group(0)), working, flags=re.IGNORECASE)
    return total


@dataclass
class ClassificationResult:
    category: str
    severity: str
    priority_score: int
    required_resource: list[str]
    matched_keywords: list[str]
    score_breakdown: dict
    recommended_action: str
    confidence: float
    secondary_category: str | None = field(default=None)


def classify_emergency(
    description: str,
    people_count: int = 1,
    special_requirements: str = "",
    vulnerable_flags: list[str] | None = None,
) -> ClassificationResult:
    vulnerable_flags = vulnerable_flags or []
    text = _normalize(f"{description} {special_requirements or ''}")

    # 1. Keyword/severity scoring
    keyword_score = 0
    matched_keywords: list[str] = []
    dominant_tier = "LOW"

    for tier in ["CRITICAL", "HIGH", "MEDIUM", "LOW"]:
        tier_score = 0
        for term, weight in SEVERITY_KEYWORDS[tier]:
            if re.search(re.escape(term), text, flags=re.IGNORECASE):
                tier_score = max(tier_score, weight)
                matched_keywords.append(term)
        if tier_score > 0 and tier_score > keyword_score:
            keyword_score = tier_score
            dominant_tier = tier

    if not matched_keywords:
        keyword_score = 15
        dominant_tier = "LOW"

    # 2. Category classification via keyword frequency
    category_scores = []
    for category, terms in CATEGORY_KEYWORDS.items():
        if category == "OTHER":
            continue
        score = _count_category_hits(text, terms)
        category_scores.append((category, score))
    category_scores.sort(key=lambda x: (x[1], RESOURCE_URGENCY_MAP[x[0]]), reverse=True)

    top_category = category_scores[0][0] if category_scores and category_scores[0][1] > 0 else "OTHER"
    secondary_category = None
    if len(category_scores) > 1 and category_scores[1][1] > 0 and category_scores[0][1] > 0:
        if category_scores[1][1] >= category_scores[0][1] * 0.5:
            secondary_category = category_scores[1][0]

    # 3. Vulnerability score
    vuln_hits = _count_hits(text, VULNERABILITY_KEYWORDS)
    flag_boost = sum(VULNERABILITY_FLAG_WEIGHTS.get(f, 0) for f in vulnerable_flags)
    vulnerability_score = min(100, len(vuln_hits) * 30 + flag_boost + (15 if people_count > 3 else 0))
    matched_keywords += [h[0] for h in vuln_hits]
    matched_keywords += [VULNERABILITY_FLAG_LABELS.get(f, f) for f in vulnerable_flags]

    # 4. Situation score
    situation_hits = _count_hits(text, SITUATION_KEYWORDS)
    situation_score = min(100, len(situation_hits) * 28)
    matched_keywords += [h[0] for h in situation_hits]

    # 5. Time sensitivity
    time_hits = _count_hits(text, TIME_SENSITIVITY_KEYWORDS)
    time_sensitivity = min(100, len(time_hits) * 30)
    matched_keywords += [h[0] for h in time_hits]

    # 6. Resource-requirement urgency
    resource_urgency = RESOURCE_URGENCY_MAP[top_category]

    # ── Priority formula ──
    # 40% keyword severity + 20% resource urgency + 20% vulnerability
    # + 10% situation danger + 10% time sensitivity
    priority_raw = (
        keyword_score * 0.4
        + resource_urgency * 0.2
        + vulnerability_score * 0.2
        + situation_score * 0.1
        + time_sensitivity * 0.1
    )
    priority_score = round(min(100, priority_raw))

    if priority_score >= 80:
        severity = "CRITICAL"
    elif priority_score >= 60:
        severity = "HIGH"
    elif priority_score >= 35:
        severity = "MEDIUM"
    else:
        severity = "LOW"

    if dominant_tier == "CRITICAL" and severity != "CRITICAL":
        severity = "HIGH"

    required_resource = CATEGORY_RESOURCE_MAP[top_category]
    recommended_action = _build_recommended_action(severity, required_resource)
    if vulnerable_flags:
        labels = ", ".join(VULNERABILITY_FLAG_LABELS.get(f, f).lower() for f in vulnerable_flags)
        recommended_action += f" Requester flagged: {labels} — prioritize in queue and match accessible/mobility-aware resources where relevant."
    confidence = min(0.98, round(0.45 + len(matched_keywords) * 0.08, 2))

    return ClassificationResult(
        category=top_category,
        secondary_category=secondary_category,
        severity=severity,
        priority_score=priority_score,
        required_resource=required_resource,
        matched_keywords=list(dict.fromkeys(matched_keywords)),
        score_breakdown={
            "keywordScore": round(keyword_score),
            "resourceUrgency": round(resource_urgency),
            "vulnerabilityScore": round(vulnerability_score),
            "situationScore": round(situation_score),
            "timeSensitivity": round(time_sensitivity),
        },
        recommended_action=recommended_action,
        confidence=confidence,
    )


def _build_recommended_action(severity: str, resources: list[str]) -> str:
    resource_label = " + ".join(r.replace("_", " ").lower() for r in resources)
    if severity == "CRITICAL":
        return f"Assign nearest suitable {resource_label} immediately. Escalate to command center."
    if severity == "HIGH":
        return f"Dispatch nearest available {resource_label} within priority queue."
    if severity == "MEDIUM":
        return f"Route to available {resource_label} provider; standard queue."
    return f"Log request and notify relevant {resource_label} network for follow-up."


CATEGORY_LABELS = {
    "MEDICAL": "Medical", "FIRE": "Fire", "FLOOD": "Flood", "EVACUATION": "Evacuation",
    "ACCIDENT": "Accident", "FOOD": "Food", "WATER": "Water", "MEDICINE": "Medicine",
    "SHELTER": "Shelter", "RESCUE": "Rescue", "TRANSPORT": "Transport", "POWER": "Power", "OTHER": "Other",
}

RESOURCE_LABELS = {
    "VEHICLE": "Vehicle", "FIRST_AID_KIT": "First Aid Kit", "MEDICINE": "Medicine", "BLOOD": "Blood",
    "FOOD": "Food", "WATER": "Water", "SHELTER": "Shelter", "POWER_BANK": "Power Bank",
    "MEDICAL_SKILL": "Medical Skill", "RESCUE_SKILL": "Rescue Skill", "TRANSPORT": "Transportation",
    "COMMUNICATION_EQUIPMENT": "Communication Equipment", "OTHER": "Other",
}
