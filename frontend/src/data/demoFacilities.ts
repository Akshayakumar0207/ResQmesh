import type { Facility } from "../types";
import { CHENNAI_AREAS, jitter } from "./locations";

let counter = 0;
function id() {
  counter += 1;
  return `FAC-${String(counter).padStart(3, "0")}`;
}

interface Seed {
  name: string;
  type: Facility["type"];
  area: keyof typeof CHENNAI_AREAS;
  capacity: number;
  availability: Facility["availability"];
  services: string[];
}

// SIMULATION DATA — fictional facility names placed near real Chennai
// localities for demo realism. Not a directory of real hospitals/shelters.
const SEEDS: Seed[] = [
  { name: "Tambaram General Hospital", type: "HOSPITAL", area: "Tambaram", capacity: 40, availability: "AVAILABLE", services: ["Emergency ward", "ICU", "Ambulance bay"] },
  { name: "Chromepet Community Hospital", type: "HOSPITAL", area: "Chromepet", capacity: 18, availability: "LIMITED", services: ["Emergency ward", "Trauma care"] },
  { name: "Adyar Multi-Speciality Hospital", type: "HOSPITAL", area: "Adyar", capacity: 25, availability: "AVAILABLE", services: ["ICU", "Surgery", "Emergency ward"] },
  { name: "Velachery Care Hospital", type: "HOSPITAL", area: "Velachery", capacity: 10, availability: "FULL", services: ["Emergency ward"] },
  { name: "Guindy Relief Shelter", type: "SHELTER", area: "Guindy", capacity: 150, availability: "AVAILABLE", services: ["Beds", "Food", "Sanitation"] },
  { name: "Pallavaram Community Hall Shelter", type: "SHELTER", area: "Pallavaram", capacity: 100, availability: "AVAILABLE", services: ["Beds", "Power backup"] },
  { name: "T. Nagar HealthFirst Pharmacy", type: "PHARMACY", area: "T. Nagar", capacity: 0, availability: "AVAILABLE", services: ["Prescription medicine", "First aid supplies"] },
  { name: "Porur City Pharmacy", type: "PHARMACY", area: "Porur", capacity: 0, availability: "AVAILABLE", services: ["Prescription medicine", "Insulin stock"] },
  { name: "Anna Nagar Relief Kitchen", type: "FOOD_CENTER", area: "Anna Nagar", capacity: 300, availability: "AVAILABLE", services: ["Hot meals", "Dry rations"] },
  { name: "Sholinganallur Water Distribution Point", type: "WATER_CENTER", area: "Sholinganallur", capacity: 1000, availability: "AVAILABLE", services: ["Drinking water", "Water tankers"] },
  { name: "Medavakkam Emergency Shelter", type: "SHELTER", area: "Medavakkam", capacity: 80, availability: "LIMITED", services: ["Beds", "Food"] },
  { name: "Perungudi Community Clinic", type: "HOSPITAL", area: "Perungudi", capacity: 8, availability: "AVAILABLE", services: ["Outpatient", "First aid"] },
];

export const DEMO_FACILITIES: Facility[] = SEEDS.map((s, i) => {
  const location = jitter(CHENNAI_AREAS[s.area], 50 + i);
  return {
    id: id(),
    name: s.name,
    type: s.type,
    location,
    locationLabel: s.area,
    capacity: s.capacity,
    availability: s.availability,
    contact: "Contact routed via ResQMesh dispatch (demo)",
    services: s.services,
  };
});
