import type { Resource, ResourceType } from "../types";
import { CHENNAI_AREAS, jitter } from "./locations";

let counter = 0;
function id(prefix: string) {
  counter += 1;
  return `${prefix}-${String(counter).padStart(3, "0")}`;
}

interface Seed {
  providerName: string;
  type: ResourceType;
  name: string;
  area: keyof typeof CHENNAI_AREAS;
  capacity?: number;
  skills?: string[];
  availability: Resource["availability"];
}

const SEEDS: Seed[] = [
  { providerName: "Arun K.", type: "VEHICLE", name: "Vehicle #17 — Sedan", area: "Tambaram", capacity: 4, availability: "AVAILABLE" },
  { providerName: "Deepak R.", type: "VEHICLE", name: "Vehicle #22 — SUV", area: "Chromepet", capacity: 6, availability: "AVAILABLE" },
  { providerName: "Vignesh S.", type: "VEHICLE", name: "Vehicle #08 — Van", area: "Pallavaram", capacity: 8, availability: "AVAILABLE" },
  { providerName: "Karthik M.", type: "VEHICLE", name: "Vehicle #31 — Sedan", area: "Velachery", capacity: 4, availability: "BUSY" },
  { providerName: "Ramesh V.", type: "VEHICLE", name: "Vehicle #45 — Auto", area: "Guindy", capacity: 3, availability: "AVAILABLE" },
  { providerName: "Priya N.", type: "RESCUE_SKILL", name: "Rescue Team Bravo", area: "Chromepet", capacity: 3, skills: ["Water rescue", "Rope rescue"], availability: "AVAILABLE" },
  { providerName: "Suresh T.", type: "RESCUE_SKILL", name: "Rescue Team Alpha", area: "Tambaram", capacity: 4, skills: ["Structural collapse", "First response"], availability: "AVAILABLE" },
  { providerName: "Dr. Meera J.", type: "MEDICAL_SKILL", name: "Field Medic — Meera", area: "Adyar", skills: ["General medicine", "Trauma care"], availability: "AVAILABLE" },
  { providerName: "Dr. Aravind P.", type: "MEDICAL_SKILL", name: "Field Medic — Aravind", area: "T. Nagar", skills: ["Emergency medicine"], availability: "AVAILABLE" },
  { providerName: "Nurse Kavya S.", type: "MEDICAL_SKILL", name: "Field Nurse — Kavya", area: "Velachery", skills: ["First aid", "CPR certified"], availability: "BUSY" },
  { providerName: "Selvi R.", type: "FIRST_AID_KIT", name: "First Aid Station — Selvi", area: "Perungudi", availability: "AVAILABLE" },
  { providerName: "Anand B.", type: "FIRST_AID_KIT", name: "First Aid Kit — Anand", area: "Porur", availability: "AVAILABLE" },
  { providerName: "City Pharmacy Co-op", type: "MEDICINE", name: "Pharmacy Relay — Tambaram", area: "Tambaram", availability: "AVAILABLE" },
  { providerName: "HealthFirst Pharmacy", type: "MEDICINE", name: "Pharmacy Relay — Adyar", area: "Adyar", availability: "AVAILABLE" },
  { providerName: "Lakshmi Devi", type: "FOOD", name: "Community Kitchen — Lakshmi", area: "Anna Nagar", capacity: 50, availability: "AVAILABLE" },
  { providerName: "Iyyappan C.", type: "FOOD", name: "Food Relief Van", area: "Medavakkam", capacity: 30, availability: "AVAILABLE" },
  { providerName: "Blue Tank Suppliers", type: "WATER", name: "Water Tanker #3", area: "Sholinganallur", capacity: 500, availability: "AVAILABLE" },
  { providerName: "Ganesh P.", type: "WATER", name: "Water Cans — Ganesh", area: "Guindy", availability: "AVAILABLE" },
  { providerName: "Meenakshi Trust", type: "SHELTER", name: "Community Hall Shelter", area: "Chromepet", capacity: 120, availability: "AVAILABLE" },
  { providerName: "Rajesh K.", type: "POWER_BANK", name: "Power Bank Relay — Rajesh", area: "T. Nagar", availability: "AVAILABLE" },
  { providerName: "Hamsini V.", type: "BLOOD", name: "Blood Donor — O+", area: "Adyar", availability: "AVAILABLE" },
  { providerName: "Naveen D.", type: "BLOOD", name: "Blood Donor — B+", area: "Velachery", availability: "OFFLINE" },
  { providerName: "TeleRelay Volunteers", type: "COMMUNICATION_EQUIPMENT", name: "Ham Radio Relay", area: "Porur", availability: "AVAILABLE" },
  { providerName: "Bala S.", type: "TRANSPORT", name: "Mini Truck — Bala", area: "Pallavaram", capacity: 10, availability: "AVAILABLE" },
  { providerName: "Divya M.", type: "VEHICLE", name: "Vehicle #52 — Sedan", area: "Sholinganallur", capacity: 4, availability: "AVAILABLE" },
  { providerName: "Mohan R.", type: "RESCUE_SKILL", name: "Rescue Team Charlie", area: "Medavakkam", capacity: 3, skills: ["Flood rescue"], availability: "AVAILABLE" },
  { providerName: "Gokul V.", type: "VEHICLE", name: "Vehicle #63 — SUV", area: "Anna Nagar", capacity: 5, availability: "AVAILABLE" },
  { providerName: "Sathya N.", type: "MEDICAL_SKILL", name: "Field Medic — Sathya", area: "Perungudi", skills: ["Paramedic"], availability: "AVAILABLE" },
  { providerName: "Yuva Relief Group", type: "FOOD", name: "Food Relief — Yuva", area: "Tambaram", capacity: 40, availability: "AVAILABLE" },
  { providerName: "Elango T.", type: "VEHICLE", name: "Vehicle #71 — Auto", area: "Adyar", capacity: 2, availability: "OFFLINE" },
];

export const DEMO_RESOURCES: Resource[] = SEEDS.map((s, i) => {
  const base = CHENNAI_AREAS[s.area];
  const location = jitter(base, i + 1);
  return {
    id: id("RES"),
    providerId: id("PRV"),
    providerName: s.providerName,
    type: s.type,
    name: s.name,
    capacity: s.capacity,
    skills: s.skills,
    location,
    locationLabel: s.area,
    availability: s.availability,
    status: s.availability === "AVAILABLE" ? "IDLE" : s.availability === "BUSY" ? "ON_MISSION" : "IDLE",
    responseHistory: Math.floor(Math.random() * 20) + 1,
    createdAt: new Date().toISOString(),
  };
});
