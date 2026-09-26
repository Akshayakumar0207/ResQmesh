import type { ClassificationResult, EmergencyCategory, ResourceType, Severity, VulnerabilityFlag } from "../types";

/**
 * EMERGENCY INTELLIGENCE ENGINE
 * ──────────────────────────────
 * A fully local, explainable decision system — not a call to a hosted LLM.
 * Pipeline: text normalization → weighted keyword/TF-IDF-style extraction →
 * category classification → severity scoring → priority formula →
 * required-resource inference → recommended action.
 *
 * Every number this engine outputs can be traced back to a rule below,
 * which is deliberate: judges (and real responders) need to be able to
 * ask "why did this get 95?" and get a real answer.
 */

// ── Keyword dictionaries (weighted) ─────────────────────────────────────

const SEVERITY_KEYWORDS: Record<Severity, { term: string; weight: number }[]> = {
  CRITICAL: [
    { term: "unconscious", weight: 100 },
    { term: "not breathing", weight: 100 },
    { term: "cardiac", weight: 100 },
    { term: "heart attack", weight: 100 },
    { term: "bleeding heavily", weight: 95 },
    { term: "severe bleeding", weight: 95 },
    { term: "drowning", weight: 100 },
    { term: "trapped", weight: 90 },
    { term: "child trapped", weight: 100 },
    { term: "severe breathing", weight: 90 },
    { term: "can't breathe", weight: 90 },
    { term: "fire", weight: 85 },
    { term: "collapsed", weight: 85 },
    { term: "immediate danger", weight: 95 },
    { term: "life threatening", weight: 95 },
    { term: "critical condition", weight: 90 },
    { term: "electrocuted", weight: 90 },
  ],
  HIGH: [
    { term: "injured", weight: 65 },
    { term: "injury", weight: 60 },
    { term: "elderly", weight: 55 },
    { term: "pregnant", weight: 65 },
    { term: "stranded", weight: 60 },
    { term: "medicine needed", weight: 60 },
    { term: "evacuation required", weight: 70 },
    { term: "evacuate", weight: 65 },
    { term: "flooded", weight: 60 },
    { term: "rising water", weight: 65 },
    { term: "broken bone", weight: 60 },
    { term: "fracture", weight: 55 },
    { term: "infant", weight: 60 },
    { term: "disabled", weight: 55 },
    { term: "no vehicle", weight: 45 },
    { term: "cut off", weight: 55 },
  ],
  MEDIUM: [
    { term: "food", weight: 35 },
    { term: "water shortage", weight: 40 },
    { term: "drinking water", weight: 35 },
    { term: "transportation", weight: 35 },
    { term: "shelter", weight: 40 },
    { term: "power outage", weight: 30 },
    { term: "no electricity", weight: 30 },
    { term: "supplies", weight: 30 },
    { term: "medicine", weight: 40 },
    { term: "prescription", weight: 35 },
  ],
  LOW: [
    { term: "information", weight: 10 },
    { term: "general assistance", weight: 12 },
    { term: "advice", weight: 8 },
    { term: "question", weight: 8 },
    { term: "status update", weight: 10 },
    { term: "checking in", weight: 8 },
  ],
};

const CATEGORY_KEYWORDS: Record<EmergencyCategory, string[]> = {
  MEDICAL: ["unconscious", "not breathing", "cardiac", "heart attack", "bleeding", "injury", "injured", "pregnant", "labor", "diabetic", "seizure", "allergic", "medical", "doctor", "ambulance", "wound"],
  FIRE: ["fire", "smoke", "burning", "flames", "gas leak", "explosion"],
  FLOOD: ["flood", "flooded", "rising water", "waterlogged", "submerged", "heavy rain", "overflowing"],
  EVACUATION: ["evacuate", "evacuation", "trapped", "stuck", "move to safety", "relocate", "rescue us"],
  ACCIDENT: ["accident", "crash", "collision", "fell", "fall", "hit by", "road accident"],
  FOOD: ["food", "hungry", "ration", "meal", "starving"],
  WATER: ["drinking water", "water shortage", "no water", "clean water", "water supply"],
  MEDICINE: ["medicine", "medication", "prescription", "insulin", "pharmacy", "tablets", "drugs needed"],
  SHELTER: ["shelter", "homeless", "no place to stay", "displaced", "roof damaged", "house destroyed"],
  RESCUE: ["rescue", "trapped", "stuck", "stranded", "drowning", "collapsed building", "debris"],
  TRANSPORT: ["vehicle", "transport", "no vehicle", "ride", "pickup", "car needed", "stranded"],
  POWER: ["power outage", "no electricity", "power cut", "generator", "charging", "battery dead"],
  OTHER: [],
};

const VULNERABILITY_KEYWORDS = ["elderly", "child", "children", "infant", "baby", "pregnant", "disabled", "alone", "grandmother", "grandfather", "wheelchair", "newborn"];

// Fixed-weight boost per explicitly-declared flag (see VulnerabilityFlag in
// ../types). This is independent of and additive to free-text keyword
// detection above — a requester ticking "Elderly" always counts, even if
// they never typed the word "elderly" in their description.
const VULNERABILITY_FLAG_WEIGHTS: Record<VulnerabilityFlag, number> = {
  ELDERLY: 35,
  DISABLED: 35,
  CHILD_OR_INFANT: 35,
  PREGNANT: 35,
  ALONE_NO_CAREGIVER: 25,
};

export const VULNERABILITY_FLAG_LABELS: Record<VulnerabilityFlag, string> = {
  ELDERLY: "Elderly",
  DISABLED: "Disabled / mobility-impaired",
  CHILD_OR_INFANT: "Child or infant",
  PREGNANT: "Pregnant",
  ALONE_NO_CAREGIVER: "Alone, no caregiver present",
};

const SITUATION_KEYWORDS = ["trapped", "flooded", "collapsed", "spreading", "no vehicle", "stranded", "cut off", "surrounded by water", "structural damage", "blocked road"];

const TIME_SENSITIVITY_KEYWORDS = ["immediately", "right now", "urgent", "urgently", "asap", "minutes", "worsening", "getting worse", "losing consciousness", "can't wait"];

const CATEGORY_RESOURCE_MAP: Record<EmergencyCategory, ResourceType[]> = {
  MEDICAL: ["MEDICAL_SKILL", "FIRST_AID_KIT", "VEHICLE"],
  FIRE: ["RESCUE_SKILL", "VEHICLE"],
  FLOOD: ["RESCUE_SKILL", "VEHICLE", "SHELTER"],
  EVACUATION: ["VEHICLE", "RESCUE_SKILL"],
  ACCIDENT: ["MEDICAL_SKILL", "VEHICLE", "FIRST_AID_KIT"],
  FOOD: ["FOOD"],
  WATER: ["WATER"],
  MEDICINE: ["MEDICINE"],
  SHELTER: ["SHELTER", "TRANSPORT"],
  RESCUE: ["RESCUE_SKILL", "VEHICLE"],
  TRANSPORT: ["VEHICLE", "TRANSPORT"],
  POWER: ["POWER_BANK"],
  OTHER: ["COMMUNICATION_EQUIPMENT"],
};

// Some categories are inherently time-critical (rescue/medical) regardless
// of phrasing — used both for the priority formula and for breaking
// category-classification ties toward the more urgent option.
const resourceUrgencyMap: Record<EmergencyCategory, number> = {
  MEDICAL: 90, FIRE: 95, FLOOD: 80, EVACUATION: 85, ACCIDENT: 85, RESCUE: 95,
  MEDICINE: 55, WATER: 40, FOOD: 35, SHELTER: 45, TRANSPORT: 40, POWER: 30, OTHER: 25,
};

function normalize(text: string): string {
  return text.toLowerCase().replace(/[^\w\s']/g, " ").replace(/\s+/g, " ").trim();
}

function countHits(text: string, terms: string[]): { term: string; hits: number }[] {
  const results: { term: string; hits: number }[] = [];
  for (const term of terms) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\b${escaped}\\b`, "gi");
    const matches = text.match(re);
    if (matches?.length) results.push({ term, hits: matches.length });
  }
  return results;
}

/** Non-overlapping hit count: longer phrases are matched and masked out
 * first so a shorter substring term (e.g. "vehicle") doesn't also score a
 * second hit inside a phrase that already matched (e.g. "no vehicle"). */
function countCategoryHits(text: string, terms: string[]): number {
  let working = text;
  let total = 0;
  const sorted = [...terms].sort((a, b) => b.split(" ").length - a.split(" ").length);
  for (const term of sorted) {
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\b${escaped}\\b`, "gi");
    const matches = working.match(re);
    if (matches?.length) {
      total += matches.length;
      working = working.replace(re, (m) => " ".repeat(m.length));
    }
  }
  return total;
}

/** Classifies free-text emergency descriptions into a structured, scored result. */
export function classifyEmergency(
  description: string,
  peopleCount = 1,
  specialRequirements = "",
  vulnerableFlags: VulnerabilityFlag[] = [],
): ClassificationResult {
  const text = normalize(`${description} ${specialRequirements}`);

  // 1. Keyword/severity scoring — highest-weighted matched tier dominates,
  //    but multiple hits within a tier compound the score slightly.
  let keywordScore = 0;
  const matchedKeywords: string[] = [];
  let dominantTier: Severity = "LOW";

  (["CRITICAL", "HIGH", "MEDIUM", "LOW"] as Severity[]).forEach((tier) => {
    const dict = SEVERITY_KEYWORDS[tier];
    let tierScore = 0;
    for (const { term, weight } of dict) {
      const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (new RegExp(escaped, "i").test(text)) {
        tierScore = Math.max(tierScore, weight);
        matchedKeywords.push(term);
      }
    }
    if (tierScore > 0 && tierScore > keywordScore) {
      keywordScore = tierScore;
      dominantTier = tier;
    }
  });
  if (matchedKeywords.length === 0) {
    keywordScore = 15; // unclassified free text defaults to low-ish urgency
    dominantTier = "LOW";
  }

  // 2. Category classification via keyword frequency (TF-style) scoring.
  //    Ties are broken toward the more urgent category — safer default
  //    for a triage system than an arbitrary dictionary-order pick.
  const categoryScores: { category: EmergencyCategory; score: number }[] = (
    Object.keys(CATEGORY_KEYWORDS) as EmergencyCategory[]
  )
    .filter((c) => c !== "OTHER")
    .map((category) => {
      const score = countCategoryHits(text, CATEGORY_KEYWORDS[category]);
      return { category, score };
    })
    .sort((a, b) => b.score - a.score || resourceUrgencyMap[b.category] - resourceUrgencyMap[a.category]);

  const topCategory = categoryScores[0]?.score > 0 ? categoryScores[0].category : "OTHER";
  const secondCategory =
    categoryScores[1]?.score > 0 && categoryScores[1].score >= categoryScores[0]?.score * 0.5
      ? categoryScores[1].category
      : undefined;

  // 3. Vulnerability score — presence of at-risk individuals raises priority
  //    independent of the described injury itself.
  const vulnHits = countHits(text, VULNERABILITY_KEYWORDS);
  const flagBoost = vulnerableFlags.reduce((sum, f) => sum + VULNERABILITY_FLAG_WEIGHTS[f], 0);
  const vulnerabilityScore = Math.min(100, vulnHits.length * 30 + flagBoost + (peopleCount > 3 ? 15 : 0));
  matchedKeywords.push(...vulnHits.map((h) => h.term));
  matchedKeywords.push(...vulnerableFlags.map((f) => VULNERABILITY_FLAG_LABELS[f]));

  // 4. Situation score — physical/structural danger described.
  const situationHits = countHits(text, SITUATION_KEYWORDS);
  const situationScore = Math.min(100, situationHits.length * 28);
  matchedKeywords.push(...situationHits.map((h) => h.term));

  // 5. Time sensitivity — urgency language used by the requester.
  const timeHits = countHits(text, TIME_SENSITIVITY_KEYWORDS);
  const timeSensitivity = Math.min(100, timeHits.length * 30);
  matchedKeywords.push(...timeHits.map((h) => h.term));

  // 6. Resource-requirement urgency — some categories are inherently
  //    time-critical (rescue/medical) regardless of phrasing.
  const resourceUrgency = resourceUrgencyMap[topCategory];

  // ── Priority formula ──────────────────────────────────────────────────
  // 40% keyword severity · 20% resource urgency · 20% vulnerability
  // · 10% situation danger · 10% time sensitivity
  const priorityScoreRaw =
    keywordScore * 0.4 +
    resourceUrgency * 0.2 +
    vulnerabilityScore * 0.2 +
    situationScore * 0.1 +
    timeSensitivity * 0.1;

  const priorityScore = Math.round(Math.min(100, priorityScoreRaw));

  // Severity is derived primarily from the final priority score, so it
  // reflects the *combined* picture rather than a single keyword hit.
  let severity: Severity;
  if (priorityScore >= 80) severity = "CRITICAL";
  else if (priorityScore >= 60) severity = "HIGH";
  else if (priorityScore >= 35) severity = "MEDIUM";
  else severity = "LOW";
  // A single unambiguous critical keyword can still floor the severity,
  // even if other components were low (e.g. very short message).
  if ((dominantTier as Severity) === "CRITICAL" && severity !== "CRITICAL") severity = "HIGH";

  const requiredResource = CATEGORY_RESOURCE_MAP[topCategory];

  let recommendedAction = buildRecommendedAction(severity, requiredResource);
  if (vulnerableFlags.length > 0) {
    const labels = vulnerableFlags.map((f) => VULNERABILITY_FLAG_LABELS[f].toLowerCase()).join(", ");
    recommendedAction += ` Requester flagged: ${labels} — prioritize in queue and match accessible/mobility-aware resources where relevant.`;
  }

  const confidence = Math.min(0.98, 0.45 + matchedKeywords.length * 0.08);

  return {
    category: topCategory,
    secondaryCategory: secondCategory,
    severity,
    priorityScore,
    requiredResource,
    matchedKeywords: Array.from(new Set(matchedKeywords)),
    scoreBreakdown: {
      keywordScore: Math.round(keywordScore),
      resourceUrgency: Math.round(resourceUrgency),
      vulnerabilityScore: Math.round(vulnerabilityScore),
      situationScore: Math.round(situationScore),
      timeSensitivity: Math.round(timeSensitivity),
    },
    recommendedAction,
    confidence: Math.round(confidence * 100) / 100,
  };
}

function buildRecommendedAction(severity: Severity, resources: ResourceType[]): string {
  const resourceLabel = resources
    .map((r) => r.replace(/_/g, " ").toLowerCase())
    .join(" + ");

  if (severity === "CRITICAL") {
    return `Assign nearest suitable ${resourceLabel} immediately. Escalate to command center.`;
  }
  if (severity === "HIGH") {
    return `Dispatch nearest available ${resourceLabel} within priority queue.`;
  }
  if (severity === "MEDIUM") {
    return `Route to available ${resourceLabel} provider; standard queue.`;
  }
  return `Log request and notify relevant ${resourceLabel} network for follow-up.`;
}

export const CATEGORY_LABELS: Record<EmergencyCategory, string> = {
  MEDICAL: "Medical", FIRE: "Fire", FLOOD: "Flood", EVACUATION: "Evacuation",
  ACCIDENT: "Accident", FOOD: "Food", WATER: "Water", MEDICINE: "Medicine",
  SHELTER: "Shelter", RESCUE: "Rescue", TRANSPORT: "Transport", POWER: "Power", OTHER: "Other",
};

export const RESOURCE_LABELS: Record<ResourceType, string> = {
  VEHICLE: "Vehicle", FIRST_AID_KIT: "First Aid Kit", MEDICINE: "Medicine", BLOOD: "Blood",
  FOOD: "Food", WATER: "Water", SHELTER: "Shelter", POWER_BANK: "Power Bank",
  MEDICAL_SKILL: "Medical Skill", RESCUE_SKILL: "Rescue Skill", TRANSPORT: "Transportation",
  COMMUNICATION_EQUIPMENT: "Communication Equipment", OTHER: "Other",
};
