// ── Enums ────────────────────────────────────────────────────────────────

export type EmergencyCategory =
  | "MEDICAL"
  | "FIRE"
  | "FLOOD"
  | "EVACUATION"
  | "ACCIDENT"
  | "FOOD"
  | "WATER"
  | "MEDICINE"
  | "SHELTER"
  | "RESCUE"
  | "TRANSPORT"
  | "POWER"
  | "OTHER";

export type Severity = "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";

export type ResourceType =
  | "VEHICLE"
  | "FIRST_AID_KIT"
  | "MEDICINE"
  | "BLOOD"
  | "FOOD"
  | "WATER"
  | "SHELTER"
  | "POWER_BANK"
  | "MEDICAL_SKILL"
  | "RESCUE_SKILL"
  | "TRANSPORT"
  | "COMMUNICATION_EQUIPMENT"
  | "OTHER";

export type AvailabilityStatus = "AVAILABLE" | "BUSY" | "OFFLINE";

export type RequestStatus =
  | "SEARCHING"
  | "ASSIGNED"
  | "ACCEPTED"
  | "EN_ROUTE"
  | "ARRIVED"
  | "RESOLVED"
  | "CANCELLED";

export type FacilityType = "HOSPITAL" | "SHELTER" | "PHARMACY" | "FOOD_CENTER" | "WATER_CENTER";

export type UserRole = "REQUESTER" | "VOLUNTEER" | "PROVIDER" | "ADMIN";

// Explicit, requester-declared vulnerability flags. These are distinct from
// (and additive to) whatever the free-text description implies — a
// requester or a neighbor reporting on someone else's behalf can mark
// these directly, so an elderly or disabled person isn't only "found" by
// the classifier guessing at keywords in a hastily-typed message.
export type VulnerabilityFlag =
  | "ELDERLY"
  | "DISABLED"
  | "CHILD_OR_INFANT"
  | "PREGNANT"
  | "ALONE_NO_CAREGIVER";

// ── Core entities ────────────────────────────────────────────────────────

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface EmergencyRequest {
  id: string;
  requestCode: string; // e.g. REQ-1042
  description: string;
  category: EmergencyCategory;
  secondaryCategory?: EmergencyCategory;
  severity: Severity;
  priorityScore: number; // 0-100
  requiredResource: ResourceType[];
  location: GeoPoint;
  locationLabel: string;
  peopleCount: number;
  specialRequirements?: string;
  vulnerableFlags?: VulnerabilityFlag[];
  status: RequestStatus;
  createdAt: string;
  updatedAt: string;
  assignedResourceId?: string;
  classification?: ClassificationResult;
}

export interface Resource {
  id: string;
  providerId: string;
  providerName: string; // display name only, never full PII
  type: ResourceType;
  name: string;
  capacity?: number;
  skills?: string[];
  location: GeoPoint;
  locationLabel: string;
  availability: AvailabilityStatus;
  status: "IDLE" | "ASSIGNED" | "EN_ROUTE" | "ON_MISSION";
  responseHistory: number; // completed missions count
  createdAt: string;
}

export interface Facility {
  id: string;
  name: string;
  type: FacilityType;
  location: GeoPoint;
  locationLabel: string;
  capacity: number;
  availability: "AVAILABLE" | "LIMITED" | "FULL";
  contact: string;
  services: string[];
}

export interface MatchExplanation {
  label: string;
  passed: boolean;
}

export interface MatchResult {
  resourceId: string;
  resource: Resource;
  score: number; // 0-100 composite
  breakdown: {
    urgencyCompatibility: number;
    distanceScore: number;
    resourceCompatibility: number;
    availabilityScore: number;
    etaScore: number;
  };
  distanceKm: number;
  etaMinutes: number;
  reasons: MatchExplanation[];
  rank: number;
}

export interface ResourceAssignment {
  id: string;
  requestId: string;
  resourceId: string;
  matchScore: number;
  distanceKm: number;
  etaMinutes: number;
  status: RequestStatus;
  assignedAt: string;
  completedAt?: string;
}

export interface MissionEvent {
  id: string;
  requestId: string;
  eventType:
    | "REQUEST_CREATED"
    | "AI_CLASSIFIED"
    | "MATCHING_STARTED"
    | "RESOURCE_MATCHED"
    | "ASSIGNED"
    | "ACCEPTED"
    | "EN_ROUTE"
    | "ARRIVED"
    | "RESOLVED"
    | "RESOURCE_UNAVAILABLE"
    | "NETWORK_REOPTIMIZED"
    | "CANCELLED";
  message: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

export interface ClassificationResult {
  category: EmergencyCategory;
  secondaryCategory?: EmergencyCategory;
  severity: Severity;
  priorityScore: number;
  requiredResource: ResourceType[];
  matchedKeywords: string[];
  scoreBreakdown: {
    keywordScore: number;
    resourceUrgency: number;
    vulnerabilityScore: number;
    situationScore: number;
    timeSensitivity: number;
  };
  recommendedAction: string;
  confidence: number; // 0-1
}

export interface DashboardStats {
  activeEmergencies: number;
  criticalCount: number;
  highCount: number;
  mediumCount: number;
  lowCount: number;
  availableResources: number;
  activeVolunteers: number;
  resolvedToday: number;
  avgResponseTimeMin: number;
}

export interface AnalyticsData {
  totalEmergencies: number;
  resolvedEmergencies: number;
  avgResponseTimeMin: number;
  criticalEmergencies: number;
  resourceUtilizationPct: number;
  volunteerResponseRatePct: number;
  successfulMatches: number;
  failedMatches: number;
  avgMatchScore: number;
  categoryBreakdown: { category: EmergencyCategory; count: number }[];
  responseTimesSeries: { label: string; minutes: number }[];
  utilizationSeries: { type: ResourceType; utilization: number }[];
  resolutionSeries: { day: string; resolved: number; created: number }[];
}

export interface DemoUser {
  id: string;
  username: string;
  displayName: string;
  role: UserRole;
}
