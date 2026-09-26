import type { EmergencyRequest, MatchExplanation, MatchResult, Resource } from "../types";
import { quickEstimate } from "./distance";

/**
 * RESOURCE MATCHING ALGORITHM
 * ────────────────────────────
 * MATCH SCORE = 35% urgency compatibility + 25% distance + 20% resource
 * compatibility + 10% availability + 10% ETA. Every sub-score is normalized
 * 0–100 and the final ranking always shows *why* a resource ranked where
 * it did, so the recommendation is auditable rather than a black box.
 */

const MAX_RELEVANT_DISTANCE_KM = 15; // beyond this, distance score bottoms out
const MAX_RELEVANT_ETA_MIN = 40;

function scoreUrgencyCompatibility(request: EmergencyRequest, resource: Resource): number {
  // A resource that matches the request's required type gets full marks;
  // partial category overlap (e.g. any medical-adjacent skill for a
  // medical request) gets partial credit instead of zero.
  if (request.requiredResource.includes(resource.type)) return 100;

  const medicalAdjacent = ["MEDICAL_SKILL", "FIRST_AID_KIT"];
  const rescueAdjacent = ["RESCUE_SKILL", "VEHICLE"];
  const reqSet = new Set(request.requiredResource);

  if ([...medicalAdjacent].some((t) => reqSet.has(t as never)) && medicalAdjacent.includes(resource.type)) return 70;
  if ([...rescueAdjacent].some((t) => reqSet.has(t as never)) && rescueAdjacent.includes(resource.type)) return 65;

  return 20;
}

function scoreDistance(distanceKm: number): number {
  const clamped = Math.min(distanceKm, MAX_RELEVANT_DISTANCE_KM);
  return Math.round(100 - (clamped / MAX_RELEVANT_DISTANCE_KM) * 100);
}

function scoreResourceCompatibility(request: EmergencyRequest, resource: Resource): number {
  let score = request.requiredResource.includes(resource.type) ? 80 : 40;
  if (resource.capacity && resource.capacity >= request.peopleCount) score += 20;
  else if (resource.capacity && resource.capacity < request.peopleCount) score -= 15;
  return Math.max(0, Math.min(100, score));
}

function scoreAvailability(resource: Resource): number {
  if (resource.availability === "AVAILABLE") return 100;
  if (resource.availability === "BUSY") return 20;
  return 0; // OFFLINE
}

function scoreEta(etaMinutes: number): number {
  const clamped = Math.min(etaMinutes, MAX_RELEVANT_ETA_MIN);
  return Math.round(100 - (clamped / MAX_RELEVANT_ETA_MIN) * 100);
}

function buildReasons(
  request: EmergencyRequest,
  resource: Resource,
  distanceKm: number,
  etaMinutes: number,
  rank: number,
): MatchExplanation[] {
  const reasons: MatchExplanation[] = [];
  reasons.push({
    label: request.requiredResource.includes(resource.type) ? "Suitable resource type" : "Related resource type",
    passed: request.requiredResource.includes(resource.type),
  });
  reasons.push({ label: rank === 1 ? "Closest available match" : `${distanceKm.toFixed(1)} km away`, passed: rank === 1 });
  reasons.push({ label: etaMinutes <= 10 ? "Fast ETA" : `ETA ${etaMinutes} min`, passed: etaMinutes <= 10 });
  reasons.push({
    label: resource.capacity ? `Capacity sufficient (${resource.capacity})` : "No capacity limit",
    passed: !resource.capacity || resource.capacity >= request.peopleCount,
  });
  reasons.push({ label: resource.availability === "AVAILABLE" ? "Currently available" : "Limited availability", passed: resource.availability === "AVAILABLE" });
  return reasons;
}

/** Ranks every candidate resource against a single emergency request. */
export function matchResources(request: EmergencyRequest, resources: Resource[]): MatchResult[] {
  const candidates = resources.filter((r) => r.availability !== "OFFLINE" || true); // offline still scored, but will rank low

  const scored = candidates.map((resource) => {
    const { distanceKm, etaMinutes } = quickEstimate(request.location, resource.location);

    const urgencyCompatibility = scoreUrgencyCompatibility(request, resource);
    const distanceScore = scoreDistance(distanceKm);
    const resourceCompatibility = scoreResourceCompatibility(request, resource);
    const availabilityScore = scoreAvailability(resource);
    const etaScore = scoreEta(etaMinutes);

    const score = Math.round(
      urgencyCompatibility * 0.35 +
        distanceScore * 0.25 +
        resourceCompatibility * 0.2 +
        availabilityScore * 0.1 +
        etaScore * 0.1,
    );

    return {
      resourceId: resource.id,
      resource,
      score,
      breakdown: { urgencyCompatibility, distanceScore, resourceCompatibility, availabilityScore, etaScore },
      distanceKm,
      etaMinutes,
      reasons: [] as MatchExplanation[],
      rank: 0,
    };
  });

  scored.sort((a, b) => b.score - a.score);
  scored.forEach((m, i) => {
    m.rank = i + 1;
    m.reasons = buildReasons(request, m.resource, m.distanceKm, m.etaMinutes, m.rank);
  });

  return scored as MatchResult[];
}

/** Returns only resources realistically dispatchable right now (available, non-offline). */
export function topMatches(request: EmergencyRequest, resources: Resource[], limit = 5): MatchResult[] {
  return matchResources(request, resources)
    .filter((m) => m.resource.availability !== "OFFLINE")
    .slice(0, limit);
}
