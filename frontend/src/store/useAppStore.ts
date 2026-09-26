import { create } from "zustand";
import type {
  AnalyticsData, DashboardStats, DemoUser, EmergencyRequest, Facility,
  GeoPoint, MatchResult, MissionEvent, RequestStatus, Resource, ResourceAssignment,
  VulnerabilityFlag,
} from "../types";
import { classifyEmergency } from "../algorithms/classification";
import { matchResources } from "../algorithms/matching";
import { DEMO_RESOURCES } from "../data/demoResources";
import { DEMO_FACILITIES } from "../data/demoFacilities";
import { DEMO_EMERGENCIES } from "../data/demoEmergencies";
import { CHENNAI_AREAS, jitter } from "../data/locations";

// ── Helpers ──────────────────────────────────────────────────────────────

let reqCounter = 1053;
function nextRequestCode() {
  reqCounter += 1;
  return `REQ-${reqCounter}`;
}
let uidCounter = 0;
function uid(prefix: string) {
  uidCounter += 1;
  return `${prefix}-${Date.now().toString(36)}-${uidCounter}`;
}

export interface Toast {
  id: string;
  message: string;
  type: "info" | "success" | "warning" | "critical";
}

interface CreateRequestInput {
  description: string;
  area?: keyof typeof CHENNAI_AREAS | string;
  location?: GeoPoint;
  peopleCount: number;
  specialRequirements?: string;
  vulnerableFlags?: VulnerabilityFlag[];
}

interface AppState {
  currentUser: DemoUser | null;
  emergencies: EmergencyRequest[];
  resources: Resource[];
  facilities: Facility[];
  assignments: ResourceAssignment[];
  events: MissionEvent[];
  lastMatches: Record<string, MatchResult[]>;
  toasts: Toast[];
  scenarioRunning: string | null;

  login: (username: string) => void;
  logout: () => void;

  createRequest: (input: CreateRequestInput) => EmergencyRequest;
  computeMatches: (requestId: string) => MatchResult[];
  assignBestResource: (requestId: string) => ResourceAssignment | null;
  advanceAssignmentStatus: (requestId: string, next: RequestStatus) => void;
  setResourceAvailability: (resourceId: string, status: Resource["availability"]) => void;
  addContributedResource: (input: Partial<Resource> & { type: Resource["type"]; name: string; providerName: string; area: string }) => Resource;

  pushEvent: (requestId: string, eventType: MissionEvent["eventType"], message: string, metadata?: Record<string, unknown>) => void;
  pushToast: (message: string, type?: Toast["type"]) => void;
  dismissToast: (id: string) => void;

  resetDemo: () => void;
  setScenarioRunning: (id: string | null) => void;

  getStats: () => DashboardStats;
  getAnalytics: () => AnalyticsData;
}

function resolveLocation(input: CreateRequestInput): { location: GeoPoint; label: string } {
  if (input.location) return { location: input.location, label: "Current location (GPS)" };
  const area = (input.area as keyof typeof CHENNAI_AREAS) || "Tambaram";
  const base = CHENNAI_AREAS[area] ?? CHENNAI_AREAS.Tambaram;
  return { location: jitter(base, Math.random() * 1000), label: area };
}

export const useAppStore = create<AppState>((set, get) => ({
  currentUser: null,
  emergencies: structuredClone(DEMO_EMERGENCIES),
  resources: structuredClone(DEMO_RESOURCES),
  facilities: structuredClone(DEMO_FACILITIES),
  assignments: [],
  events: [],
  lastMatches: {},
  toasts: [],
  scenarioRunning: null,

  login: (username) => {
    const roleMap: Record<string, DemoUser> = {
      "demo.requester": { id: "U-REQ", username, displayName: "Demo Requester", role: "REQUESTER" },
      "demo.volunteer": { id: "U-VOL", username, displayName: "Demo Volunteer", role: "PROVIDER" },
      "demo.admin": { id: "U-ADM", username, displayName: "Demo Admin", role: "ADMIN" },
    };
    set({ currentUser: roleMap[username] ?? { id: "U-GUEST", username, displayName: username, role: "REQUESTER" } });
  },
  logout: () => set({ currentUser: null }),

  createRequest: (input) => {
    const classification = classifyEmergency(input.description, input.peopleCount, input.specialRequirements, input.vulnerableFlags ?? []);
    const { location, label } = resolveLocation(input);
    const now = new Date().toISOString();
    const request: EmergencyRequest = {
      id: uid("EMG"),
      requestCode: nextRequestCode(),
      description: input.description,
      category: classification.category,
      secondaryCategory: classification.secondaryCategory,
      severity: classification.severity,
      priorityScore: classification.priorityScore,
      requiredResource: classification.requiredResource,
      location,
      locationLabel: label,
      peopleCount: input.peopleCount,
      specialRequirements: input.specialRequirements,
      vulnerableFlags: input.vulnerableFlags,
      status: "SEARCHING",
      createdAt: now,
      updatedAt: now,
      classification,
    };
    set((s) => ({ emergencies: [request, ...s.emergencies] }));
    get().pushEvent(request.id, "REQUEST_CREATED", `${request.requestCode} created — ${classification.category} · ${classification.severity}`);
    get().pushEvent(request.id, "AI_CLASSIFIED", `Classified as ${classification.category} (${classification.severity}), priority ${classification.priorityScore}/100`);
    get().computeMatches(request.id);
    return request;
  },

  computeMatches: (requestId) => {
    const { emergencies, resources } = get();
    const request = emergencies.find((e) => e.id === requestId);
    if (!request) return [];
    const matches = matchResources(request, resources);
    set((s) => ({ lastMatches: { ...s.lastMatches, [requestId]: matches } }));
    get().pushEvent(requestId, "MATCHING_STARTED", `Scanned ${resources.length} resources across the network`);
    const best = matches.find((m) => m.resource.availability === "AVAILABLE");
    if (best) {
      get().pushEvent(requestId, "RESOURCE_MATCHED", `${best.resource.name} identified as best match — score ${best.score}/100`);
    }
    return matches;
  },

  assignBestResource: (requestId) => {
    const state = get();
    const request = state.emergencies.find((e) => e.id === requestId);
    const matches = state.lastMatches[requestId] ?? state.computeMatches(requestId);
    const best = matches.find((m) => m.resource.availability === "AVAILABLE");
    if (!request || !best) {
      get().pushToast("No available resource could be matched right now.", "warning");
      return null;
    }
    const assignment: ResourceAssignment = {
      id: uid("ASG"),
      requestId,
      resourceId: best.resourceId,
      matchScore: best.score,
      distanceKm: best.distanceKm,
      etaMinutes: best.etaMinutes,
      status: "ASSIGNED",
      assignedAt: new Date().toISOString(),
    };
    set((s) => ({
      assignments: [...s.assignments.filter((a) => !(a.requestId === requestId && a.status !== "RESOLVED")), assignment],
      resources: s.resources.map((r) => (r.id === best.resourceId ? { ...r, availability: "BUSY", status: "ASSIGNED" } : r)),
      emergencies: s.emergencies.map((e) =>
        e.id === requestId ? { ...e, status: "ASSIGNED", assignedResourceId: best.resourceId, updatedAt: new Date().toISOString() } : e,
      ),
    }));
    get().pushEvent(requestId, "ASSIGNED", `${best.resource.name} assigned · ETA ${best.etaMinutes} min · score ${best.score}/100`);
    get().pushToast(`Assigned ${best.resource.name} — ${best.etaMinutes} min ETA`, "success");
    return assignment;
  },

  advanceAssignmentStatus: (requestId, next) => {
    const now = new Date().toISOString();
    set((s) => ({
      emergencies: s.emergencies.map((e) => (e.id === requestId ? { ...e, status: next, updatedAt: now } : e)),
      assignments: s.assignments.map((a) =>
        a.requestId === requestId && a.status !== "RESOLVED"
          ? { ...a, status: next, completedAt: next === "RESOLVED" ? now : a.completedAt }
          : a,
      ),
    }));
    const eventMap: Partial<Record<RequestStatus, MissionEvent["eventType"]>> = {
      ACCEPTED: "ACCEPTED", EN_ROUTE: "EN_ROUTE", ARRIVED: "ARRIVED", RESOLVED: "RESOLVED", CANCELLED: "CANCELLED",
    };
    const evt = eventMap[next];
    if (evt) get().pushEvent(requestId, evt, `Status updated → ${next.replace("_", " ")}`);

    if (next === "RESOLVED") {
      const request = get().emergencies.find((e) => e.id === requestId);
      if (request?.assignedResourceId) {
        set((s) => ({
          resources: s.resources.map((r) =>
            r.id === request.assignedResourceId
              ? { ...r, availability: "AVAILABLE", status: "IDLE", responseHistory: r.responseHistory + 1 }
              : r,
          ),
        }));
      }
    }
  },

  setResourceAvailability: (resourceId, status) => {
    const state = get();
    const resource = state.resources.find((r) => r.id === resourceId);
    if (!resource) return;

    set((s) => ({
      resources: s.resources.map((r) => (r.id === resourceId ? { ...r, availability: status } : r)),
    }));

    if (status === "AVAILABLE") return;

    // Dynamic re-matching: if this resource was actively assigned to an
    // unresolved request, the network must recompute and reassign instantly.
    const activeRequest = state.emergencies.find(
      (e) => e.assignedResourceId === resourceId && !["RESOLVED", "CANCELLED"].includes(e.status),
    );
    if (!activeRequest) return;

    get().pushEvent(activeRequest.id, "RESOURCE_UNAVAILABLE", `${resource.name} became unavailable — network re-optimizing`);
    get().pushToast(`${resource.name} went offline — re-optimizing network...`, "warning");

    const freshResources = get().resources.filter((r) => r.id !== resourceId);
    const matches = matchResources(activeRequest, freshResources).filter((m) => m.resource.availability === "AVAILABLE");
    set((s) => ({ lastMatches: { ...s.lastMatches, [activeRequest.id]: matches } }));

    const next = matches[0];
    if (!next) {
      set((s) => ({
        emergencies: s.emergencies.map((e) => (e.id === activeRequest.id ? { ...e, status: "SEARCHING", assignedResourceId: undefined } : e)),
      }));
      get().pushEvent(activeRequest.id, "NETWORK_REOPTIMIZED", "No alternate resource currently available — request returned to search queue");
      get().pushToast("No alternate resource available right now.", "critical");
      return;
    }

    const assignment: ResourceAssignment = {
      id: uid("ASG"),
      requestId: activeRequest.id,
      resourceId: next.resourceId,
      matchScore: next.score,
      distanceKm: next.distanceKm,
      etaMinutes: next.etaMinutes,
      status: "ASSIGNED",
      assignedAt: new Date().toISOString(),
    };
    set((s) => ({
      assignments: [...s.assignments.filter((a) => !(a.requestId === activeRequest.id && a.status !== "RESOLVED")), assignment],
      resources: s.resources.map((r) => (r.id === next.resourceId ? { ...r, availability: "BUSY", status: "ASSIGNED" } : r)),
      emergencies: s.emergencies.map((e) =>
        e.id === activeRequest.id ? { ...e, status: "ASSIGNED", assignedResourceId: next.resourceId, updatedAt: new Date().toISOString() } : e,
      ),
    }));
    get().pushEvent(activeRequest.id, "NETWORK_REOPTIMIZED", `Network re-optimized — ${next.resource.name} automatically selected (score ${next.score}/100)`);
    get().pushToast(`Network re-optimized — ${next.resource.name} is now assigned`, "success");
  },

  addContributedResource: (input) => {
    const base = CHENNAI_AREAS[input.area as keyof typeof CHENNAI_AREAS] ?? CHENNAI_AREAS.Tambaram;
    const resource: Resource = {
      id: uid("RES"),
      providerId: uid("PRV"),
      providerName: input.providerName,
      type: input.type,
      name: input.name,
      capacity: input.capacity,
      skills: input.skills,
      location: jitter(base, Math.random() * 1000),
      locationLabel: input.area,
      availability: "AVAILABLE",
      status: "IDLE",
      responseHistory: 0,
      createdAt: new Date().toISOString(),
    };
    set((s) => ({ resources: [resource, ...s.resources] }));
    get().pushToast(`${resource.name} added to the resource pool`, "success");
    return resource;
  },

  pushEvent: (requestId, eventType, message, metadata) => {
    const event: MissionEvent = { id: uid("EVT"), requestId, eventType, message, timestamp: new Date().toISOString(), metadata };
    set((s) => ({ events: [event, ...s.events].slice(0, 300) }));
  },
  pushToast: (message, type = "info") => {
    const toast: Toast = { id: uid("TST"), message, type };
    set((s) => ({ toasts: [...s.toasts, toast] }));
    setTimeout(() => get().dismissToast(toast.id), 5000);
  },
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  resetDemo: () =>
    set({
      emergencies: structuredClone(DEMO_EMERGENCIES),
      resources: structuredClone(DEMO_RESOURCES),
      facilities: structuredClone(DEMO_FACILITIES),
      assignments: [],
      events: [],
      lastMatches: {},
      toasts: [],
      scenarioRunning: null,
    }),

  setScenarioRunning: (id) => set({ scenarioRunning: id }),

  getStats: () => {
    const { emergencies, resources } = get();
    const active = emergencies.filter((e) => !["RESOLVED", "CANCELLED"].includes(e.status));
    const resolvedToday = emergencies.filter((e) => e.status === "RESOLVED");
    const responseTimes = resolvedToday.map((e) => (new Date(e.updatedAt).getTime() - new Date(e.createdAt).getTime()) / 60000);
    const avg = responseTimes.length ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 8.4;
    return {
      activeEmergencies: active.length,
      criticalCount: active.filter((e) => e.severity === "CRITICAL").length,
      highCount: active.filter((e) => e.severity === "HIGH").length,
      mediumCount: active.filter((e) => e.severity === "MEDIUM").length,
      lowCount: active.filter((e) => e.severity === "LOW").length,
      availableResources: resources.filter((r) => r.availability === "AVAILABLE").length,
      activeVolunteers: resources.filter((r) => r.availability !== "OFFLINE").length,
      resolvedToday: resolvedToday.length,
      avgResponseTimeMin: Math.round(avg * 10) / 10,
    };
  },

  getAnalytics: (): AnalyticsData => {
    const { emergencies, resources, assignments } = get();
    const resolved = emergencies.filter((e) => e.status === "RESOLVED");
    const responseTimes = resolved.map((e) => (new Date(e.updatedAt).getTime() - new Date(e.createdAt).getTime()) / 60000);
    const avgResponse = responseTimes.length ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0;

    const categoryBreakdown = Array.from(
      emergencies.reduce((map, e) => map.set(e.category, (map.get(e.category) ?? 0) + 1), new Map<string, number>()),
    ).map(([category, count]) => ({ category: category as EmergencyRequest["category"], count }));

    const utilizationByType = Array.from(
      resources.reduce((map, r) => {
        const cur = map.get(r.type) ?? { total: 0, busy: 0 };
        cur.total += 1;
        if (r.availability !== "AVAILABLE") cur.busy += 1;
        map.set(r.type, cur);
        return map;
      }, new Map<string, { total: number; busy: number }>()),
    ).map(([type, v]) => ({ type: type as Resource["type"], utilization: Math.round((v.busy / v.total) * 100) }));

    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const resolutionSeries = days.map((day, i) => ({
      day,
      created: 4 + ((i * 7) % 6),
      resolved: 3 + ((i * 5) % 6),
    }));

    return {
      totalEmergencies: emergencies.length,
      resolvedEmergencies: resolved.length,
      avgResponseTimeMin: Math.round(avgResponse * 10) / 10 || 8.4,
      criticalEmergencies: emergencies.filter((e) => e.severity === "CRITICAL").length,
      resourceUtilizationPct: Math.round((resources.filter((r) => r.availability !== "AVAILABLE").length / resources.length) * 100),
      volunteerResponseRatePct: 87,
      successfulMatches: assignments.length,
      failedMatches: Math.max(0, Math.floor(assignments.length * 0.07)),
      avgMatchScore: assignments.length
        ? Math.round(assignments.reduce((a, b) => a + b.matchScore, 0) / assignments.length)
        : 88,
      categoryBreakdown,
      responseTimesSeries: resolved.slice(0, 10).map((e, i) => ({
        label: e.requestCode,
        minutes: Math.round(((new Date(e.updatedAt).getTime() - new Date(e.createdAt).getTime()) / 60000) * 10) / 10 || 5 + i,
      })),
      utilizationSeries: utilizationByType,
      resolutionSeries,
    };
  },
}));
