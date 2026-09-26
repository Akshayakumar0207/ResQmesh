import type { EmergencyRequest } from "../types";
import { CHENNAI_AREAS, jitter } from "./locations";
import { classifyEmergency } from "../algorithms/classification";

let counter = 1041;
function code() {
  counter += 1;
  return `REQ-${counter}`;
}

interface Seed {
  description: string;
  area: keyof typeof CHENNAI_AREAS;
  peopleCount: number;
  status: EmergencyRequest["status"];
  minutesAgo: number;
}

const SEEDS: Seed[] = [
  { description: "Elderly man collapsed, unconscious, needs immediate medical help.", area: "Velachery", peopleCount: 1, status: "EN_ROUTE", minutesAgo: 6 },
  { description: "House fire spreading fast in a residential lane, family trapped inside.", area: "Chromepet", peopleCount: 4, status: "SEARCHING", minutesAgo: 2 },
  { description: "Pregnant woman needs transport to hospital, contractions started.", area: "Adyar", peopleCount: 1, status: "ASSIGNED", minutesAgo: 4 },
  { description: "Flood water rising near our street, need evacuation for elderly parents.", area: "Tambaram", peopleCount: 3, status: "ACCEPTED", minutesAgo: 9 },
  { description: "Road accident on main road, two people injured with visible bleeding.", area: "Guindy", peopleCount: 2, status: "ARRIVED", minutesAgo: 14 },
  { description: "Need drinking water supply, our area has been cut off for two days.", area: "Sholinganallur", peopleCount: 12, status: "SEARCHING", minutesAgo: 18 },
  { description: "Diabetic patient out of insulin, urgent medicine needed.", area: "T. Nagar", peopleCount: 1, status: "RESOLVED", minutesAgo: 55 },
  { description: "Family displaced after roof collapse, need temporary shelter for the night.", area: "Pallavaram", peopleCount: 5, status: "RESOLVED", minutesAgo: 80 },
  { description: "No electricity for 10 hours, need a power bank for medical equipment.", area: "Porur", peopleCount: 1, status: "SEARCHING", minutesAgo: 3 },
  { description: "Community requesting food supplies after two days of flooding.", area: "Medavakkam", peopleCount: 20, status: "ASSIGNED", minutesAgo: 22 },
  { description: "Child trapped on rooftop as flood water surrounds the house.", area: "Chromepet", peopleCount: 1, status: "SEARCHING", minutesAgo: 1 },
  { description: "General information needed about the nearest open shelter.", area: "Anna Nagar", peopleCount: 1, status: "RESOLVED", minutesAgo: 120 },
];

export const DEMO_EMERGENCIES: EmergencyRequest[] = SEEDS.map((s, i) => {
  const classification = classifyEmergency(s.description, s.peopleCount);
  const createdAt = new Date(Date.now() - s.minutesAgo * 60_000).toISOString();
  return {
    id: `EMG-${String(i + 1).padStart(3, "0")}`,
    requestCode: code(),
    description: s.description,
    category: classification.category,
    secondaryCategory: classification.secondaryCategory,
    severity: classification.severity,
    priorityScore: classification.priorityScore,
    requiredResource: classification.requiredResource,
    location: jitter(CHENNAI_AREAS[s.area], 100 + i),
    locationLabel: s.area,
    peopleCount: s.peopleCount,
    status: s.status,
    createdAt,
    updatedAt: createdAt,
    classification,
  };
});
