import type { EmergencyRequest } from "../types";

export interface DemoScenario {
  id: string;
  title: string;
  tagline: string;
  request: {
    description: string;
    area: string;
    peopleCount: number;
    specialRequirements?: string;
  };
  narrative: string[];
  forceResourceUnavailable?: boolean; // triggers the re-matching beat mid-scenario
}

export const DEMO_SCENARIOS: DemoScenario[] = [
  {
    id: "medical",
    title: "Scenario 1 — Medical Emergency",
    tagline: "Cardiac arrest reported near Adyar. Every second of routing delay matters.",
    request: {
      description:
        "My father just collapsed and is unconscious, he's not breathing properly. We are near Adyar and need urgent medical help.",
      area: "Adyar",
      peopleCount: 1,
      specialRequirements: "Elderly, possible cardiac event",
    },
    narrative: [
      "Emergency reported by requester",
      "AI classifies as MEDICAL · CRITICAL",
      "Matching engine scans available resources",
      "Nearest field medic + vehicle ranked and assigned",
      "Volunteer accepts and heads en route",
    ],
    forceResourceUnavailable: true,
  },
  {
    id: "flood",
    title: "Scenario 2 — Flood Evacuation",
    tagline: "Rising flood water in Chromepet traps a family with an elderly relative.",
    request: {
      description:
        "My grandmother is trapped in a flooded house and needs evacuation. We are near Chromepet and don't have a vehicle.",
      area: "Chromepet",
      peopleCount: 3,
      specialRequirements: "Elderly, no vehicle access, water still rising",
    },
    narrative: [
      "Evacuation request submitted with location",
      "AI classifies as EVACUATION + RESCUE · CRITICAL",
      "Engine ranks nearby rescue teams and vehicles",
      "Best-matched rescue vehicle assigned",
      "Network re-optimizes when the lead vehicle goes offline",
    ],
    forceResourceUnavailable: true,
  },
  {
    id: "medicine",
    title: "Scenario 3 — Medicine Shortage",
    tagline: "A diabetic patient in T. Nagar has run out of insulin during a supply disruption.",
    request: {
      description:
        "My mother is diabetic and we've run out of insulin. Pharmacies nearby are closed due to the flooding. We need medicine urgently.",
      area: "T. Nagar",
      peopleCount: 1,
      specialRequirements: "Insulin-dependent, no transport available",
    },
    narrative: [
      "Medicine request submitted",
      "AI classifies as MEDICINE · HIGH",
      "Engine matches nearest pharmacy relay volunteer",
      "Volunteer accepts and delivers medicine",
      "Request marked resolved",
    ],
  },
];

export type ScenarioStep =
  | "CREATED"
  | "CLASSIFIED"
  | "MATCHING"
  | "MATCHED"
  | "ASSIGNED"
  | "ACCEPTED"
  | "EN_ROUTE"
  | "UNAVAILABLE"
  | "REOPTIMIZED"
  | "RESOLVED";

export const SCENARIO_STEP_LABELS: Record<ScenarioStep, string> = {
  CREATED: "Emergency Created",
  CLASSIFIED: "AI Classified",
  MATCHING: "Scanning Resource Network",
  MATCHED: "Resource Matched",
  ASSIGNED: "Assigned",
  ACCEPTED: "Volunteer Accepted",
  EN_ROUTE: "En Route",
  UNAVAILABLE: "Resource Unavailable",
  REOPTIMIZED: "Network Re-optimized",
  RESOLVED: "Resolved",
};

export function requestStatusFromStep(step: ScenarioStep): EmergencyRequest["status"] {
  switch (step) {
    case "CREATED":
    case "CLASSIFIED":
    case "MATCHING":
    case "MATCHED":
      return "SEARCHING";
    case "ASSIGNED":
    case "UNAVAILABLE":
    case "REOPTIMIZED":
      return "ASSIGNED";
    case "ACCEPTED":
      return "ACCEPTED";
    case "EN_ROUTE":
      return "EN_ROUTE";
    case "RESOLVED":
      return "RESOLVED";
    default:
      return "SEARCHING";
  }
}
