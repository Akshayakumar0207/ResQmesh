"""
SIMULATION DATA — fictional resources/facilities/requests placed near real
Chennai localities for geographic realism only. Not a directory of real
hospitals, shelters, volunteers, or emergency contacts.
"""

import random

from app.algorithms.classification import classify_emergency
from app.utils.ids import gen_id

CHENNAI_AREAS: dict[str, tuple[float, float]] = {
    "Tambaram": (12.9249, 80.1000),
    "Chromepet": (12.9516, 80.1462),
    "Pallavaram": (12.9675, 80.1491),
    "Velachery": (12.9791, 80.2212),
    "Guindy": (13.0067, 80.2206),
    "Adyar": (13.0012, 80.2565),
    "T. Nagar": (13.0418, 80.2341),
    "Perungudi": (12.9635, 80.2412),
    "Anna Nagar": (13.0850, 80.2101),
    "Porur": (13.0382, 80.1565),
    "Sholinganallur": (12.9010, 80.2279),
    "Medavakkam": (12.9166, 80.1892),
}


def jitter(lat: float, lng: float, seed: int) -> tuple[float, float]:
    dx = (random.Random(seed).random() - 0.5) * 0.024
    dy = (random.Random(seed + 1).random() - 0.5) * 0.024
    return lat + dx, lng + dy


RESOURCE_SEEDS = [
    ("Arun K.", "VEHICLE", "Vehicle #17 — Sedan", "Tambaram", 4, None, "AVAILABLE"),
    ("Deepak R.", "VEHICLE", "Vehicle #22 — SUV", "Chromepet", 6, None, "AVAILABLE"),
    ("Vignesh S.", "VEHICLE", "Vehicle #08 — Van", "Pallavaram", 8, None, "AVAILABLE"),
    ("Karthik M.", "VEHICLE", "Vehicle #31 — Sedan", "Velachery", 4, None, "BUSY"),
    ("Ramesh V.", "VEHICLE", "Vehicle #45 — Auto", "Guindy", 3, None, "AVAILABLE"),
    ("Priya N.", "RESCUE_SKILL", "Rescue Team Bravo", "Chromepet", 3, ["Water rescue", "Rope rescue"], "AVAILABLE"),
    ("Suresh T.", "RESCUE_SKILL", "Rescue Team Alpha", "Tambaram", 4, ["Structural collapse"], "AVAILABLE"),
    ("Dr. Meera J.", "MEDICAL_SKILL", "Field Medic — Meera", "Adyar", None, ["General medicine", "Trauma care"], "AVAILABLE"),
    ("Dr. Aravind P.", "MEDICAL_SKILL", "Field Medic — Aravind", "T. Nagar", None, ["Emergency medicine"], "AVAILABLE"),
    ("Nurse Kavya S.", "MEDICAL_SKILL", "Field Nurse — Kavya", "Velachery", None, ["First aid", "CPR"], "BUSY"),
    ("Selvi R.", "FIRST_AID_KIT", "First Aid Station — Selvi", "Perungudi", None, None, "AVAILABLE"),
    ("Anand B.", "FIRST_AID_KIT", "First Aid Kit — Anand", "Porur", None, None, "AVAILABLE"),
    ("City Pharmacy Co-op", "MEDICINE", "Pharmacy Relay — Tambaram", "Tambaram", None, None, "AVAILABLE"),
    ("HealthFirst Pharmacy", "MEDICINE", "Pharmacy Relay — Adyar", "Adyar", None, None, "AVAILABLE"),
    ("Lakshmi Devi", "FOOD", "Community Kitchen — Lakshmi", "Anna Nagar", 50, None, "AVAILABLE"),
    ("Iyyappan C.", "FOOD", "Food Relief Van", "Medavakkam", 30, None, "AVAILABLE"),
    ("Blue Tank Suppliers", "WATER", "Water Tanker #3", "Sholinganallur", 500, None, "AVAILABLE"),
    ("Ganesh P.", "WATER", "Water Cans — Ganesh", "Guindy", None, None, "AVAILABLE"),
    ("Meenakshi Trust", "SHELTER", "Community Hall Shelter", "Chromepet", 120, None, "AVAILABLE"),
    ("Rajesh K.", "POWER_BANK", "Power Bank Relay — Rajesh", "T. Nagar", None, None, "AVAILABLE"),
    ("Hamsini V.", "BLOOD", "Blood Donor — O+", "Adyar", None, None, "AVAILABLE"),
    ("Naveen D.", "BLOOD", "Blood Donor — B+", "Velachery", None, None, "OFFLINE"),
    ("TeleRelay Volunteers", "COMMUNICATION_EQUIPMENT", "Ham Radio Relay", "Porur", None, None, "AVAILABLE"),
    ("Bala S.", "TRANSPORT", "Mini Truck — Bala", "Pallavaram", 10, None, "AVAILABLE"),
    ("Divya M.", "VEHICLE", "Vehicle #52 — Sedan", "Sholinganallur", 4, None, "AVAILABLE"),
    ("Mohan R.", "RESCUE_SKILL", "Rescue Team Charlie", "Medavakkam", 3, ["Flood rescue"], "AVAILABLE"),
    ("Gokul V.", "VEHICLE", "Vehicle #63 — SUV", "Anna Nagar", 5, None, "AVAILABLE"),
    ("Sathya N.", "MEDICAL_SKILL", "Field Medic — Sathya", "Perungudi", None, ["Paramedic"], "AVAILABLE"),
    ("Yuva Relief Group", "FOOD", "Food Relief — Yuva", "Tambaram", 40, None, "AVAILABLE"),
    ("Elango T.", "VEHICLE", "Vehicle #71 — Auto", "Adyar", 2, None, "OFFLINE"),
]

FACILITY_SEEDS = [
    ("Tambaram General Hospital", "HOSPITAL", "Tambaram", 40, "AVAILABLE", ["Emergency ward", "ICU", "Ambulance bay"]),
    ("Chromepet Community Hospital", "HOSPITAL", "Chromepet", 18, "LIMITED", ["Emergency ward", "Trauma care"]),
    ("Adyar Multi-Speciality Hospital", "HOSPITAL", "Adyar", 25, "AVAILABLE", ["ICU", "Surgery", "Emergency ward"]),
    ("Velachery Care Hospital", "HOSPITAL", "Velachery", 10, "FULL", ["Emergency ward"]),
    ("Guindy Relief Shelter", "SHELTER", "Guindy", 150, "AVAILABLE", ["Beds", "Food", "Sanitation"]),
    ("Pallavaram Community Hall Shelter", "SHELTER", "Pallavaram", 100, "AVAILABLE", ["Beds", "Power backup"]),
    ("T. Nagar HealthFirst Pharmacy", "PHARMACY", "T. Nagar", 0, "AVAILABLE", ["Prescription medicine", "First aid supplies"]),
    ("Porur City Pharmacy", "PHARMACY", "Porur", 0, "AVAILABLE", ["Prescription medicine", "Insulin stock"]),
    ("Anna Nagar Relief Kitchen", "FOOD_CENTER", "Anna Nagar", 300, "AVAILABLE", ["Hot meals", "Dry rations"]),
    ("Sholinganallur Water Distribution Point", "WATER_CENTER", "Sholinganallur", 1000, "AVAILABLE", ["Drinking water", "Water tankers"]),
    ("Medavakkam Emergency Shelter", "SHELTER", "Medavakkam", 80, "LIMITED", ["Beds", "Food"]),
    ("Perungudi Community Clinic", "HOSPITAL", "Perungudi", 8, "AVAILABLE", ["Outpatient", "First aid"]),
]

EMERGENCY_SEEDS = [
    ("Elderly man collapsed, unconscious, needs immediate medical help.", "Velachery", 1, "EN_ROUTE", 6),
    ("House fire spreading fast in a residential lane, family trapped inside.", "Chromepet", 4, "SEARCHING", 2),
    ("Pregnant woman needs transport to hospital, contractions started.", "Adyar", 1, "ASSIGNED", 4),
    ("Flood water rising near our street, need evacuation for elderly parents.", "Tambaram", 3, "ACCEPTED", 9),
    ("Road accident on main road, two people injured with visible bleeding.", "Guindy", 2, "ARRIVED", 14),
    ("Need drinking water supply, our area has been cut off for two days.", "Sholinganallur", 12, "SEARCHING", 18),
    ("Diabetic patient out of insulin, urgent medicine needed.", "T. Nagar", 1, "RESOLVED", 55),
    ("Family displaced after roof collapse, need temporary shelter for the night.", "Pallavaram", 5, "RESOLVED", 80),
    ("No electricity for 10 hours, need a power bank for medical equipment.", "Porur", 1, "SEARCHING", 3),
    ("Community requesting food supplies after two days of flooding.", "Medavakkam", 20, "ASSIGNED", 22),
    ("Child trapped on rooftop as flood water surrounds the house.", "Chromepet", 1, "SEARCHING", 1),
    ("General information needed about the nearest open shelter.", "Anna Nagar", 1, "RESOLVED", 120),
]

DEMO_SCENARIOS = [
    {
        "id": "medical",
        "title": "Scenario 1 — Medical Emergency",
        "description": "My father just collapsed and is unconscious, he's not breathing properly. We are near Adyar and need urgent medical help.",
        "area": "Adyar", "people_count": 1,
        "special_requirements": "Elderly, possible cardiac event",
        "force_resource_unavailable": True,
    },
    {
        "id": "flood",
        "title": "Scenario 2 — Flood Evacuation",
        "description": "My grandmother is trapped in a flooded house and needs evacuation. We are near Chromepet and don't have a vehicle.",
        "area": "Chromepet", "people_count": 3,
        "special_requirements": "Elderly, no vehicle access, water still rising",
        "force_resource_unavailable": True,
    },
    {
        "id": "medicine",
        "title": "Scenario 3 — Medicine Shortage",
        "description": "My mother is diabetic and we've run out of insulin. Pharmacies nearby are closed due to the flooding. We need medicine urgently.",
        "area": "T. Nagar", "people_count": 1,
        "special_requirements": "Insulin-dependent, no transport available",
        "force_resource_unavailable": False,
    },
]


def build_resources() -> list[dict]:
    out = []
    for i, (provider_name, rtype, name, area, capacity, skills, availability) in enumerate(RESOURCE_SEEDS):
        base_lat, base_lng = CHENNAI_AREAS[area]
        lat, lng = jitter(base_lat, base_lng, i + 1)
        out.append({
            "id": gen_id("RES"),
            "provider_id": gen_id("PRV"),
            "provider_name": provider_name,
            "type": rtype,
            "name": name,
            "capacity": capacity,
            "skills": skills,
            "latitude": lat,
            "longitude": lng,
            "location_label": area,
            "availability": availability,
            "status": "ASSIGNED" if availability == "BUSY" else "IDLE",
            "response_history": random.randint(1, 20),
        })
    return out


def build_facilities() -> list[dict]:
    out = []
    for i, (name, ftype, area, capacity, availability, services) in enumerate(FACILITY_SEEDS):
        base_lat, base_lng = CHENNAI_AREAS[area]
        lat, lng = jitter(base_lat, base_lng, 50 + i)
        out.append({
            "id": gen_id("FAC"),
            "name": name,
            "type": ftype,
            "latitude": lat,
            "longitude": lng,
            "location_label": area,
            "capacity": capacity,
            "availability": availability,
            "contact": "Contact routed via ResQMesh dispatch (demo)",
            "services": services,
        })
    return out


def build_emergencies() -> list[dict]:
    import datetime

    out = []
    counter = 1041
    for i, (desc, area, people, status, minutes_ago) in enumerate(EMERGENCY_SEEDS):
        counter += 1
        classification = classify_emergency(desc, people)
        base_lat, base_lng = CHENNAI_AREAS[area]
        lat, lng = jitter(base_lat, base_lng, 100 + i)
        created = datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(minutes=minutes_ago)
        out.append({
            "id": gen_id("EMG"),
            "request_code": f"REQ-{counter}",
            "description": desc,
            "category": classification.category,
            "secondary_category": classification.secondary_category,
            "severity": classification.severity,
            "priority_score": classification.priority_score,
            "required_resource": classification.required_resource,
            "latitude": lat,
            "longitude": lng,
            "location_label": area,
            "people_count": people,
            "status": status,
            "recommended_action": classification.recommended_action,
            "confidence": classification.confidence,
            "matched_keywords": classification.matched_keywords,
            "classification_breakdown": classification.score_breakdown,
            "created_at": created,
            "updated_at": created,
        })
    return out
