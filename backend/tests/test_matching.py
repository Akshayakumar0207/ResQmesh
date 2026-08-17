from app.algorithms.distance import estimate_eta_minutes, haversine_distance_km, quick_estimate
from app.algorithms.matching import match_resources, top_matches


def make_request(**overrides):
    base = {
        "latitude": 12.9249, "longitude": 80.1000,
        "required_resource": ["VEHICLE", "RESCUE_SKILL"],
        "people_count": 2,
    }
    base.update(overrides)
    return base


def make_resource(**overrides):
    base = {
        "id": "RES-1", "type": "VEHICLE", "name": "Test Vehicle",
        "capacity": 4, "latitude": 12.930, "longitude": 80.105, "availability": "AVAILABLE",
    }
    base.update(overrides)
    return base


def test_haversine_zero_distance_for_same_point():
    d = haversine_distance_km(12.9, 80.1, 12.9, 80.1)
    assert d == 0


def test_haversine_known_distance_reasonable():
    # Tambaram to Adyar is roughly 18-20km as the crow flies
    d = haversine_distance_km(12.9249, 80.1000, 13.0012, 80.2565)
    assert 15 < d < 25


def test_eta_scales_with_distance():
    assert estimate_eta_minutes(1) < estimate_eta_minutes(10)


def test_quick_estimate_returns_tuple():
    distance_km, eta = quick_estimate(12.9, 80.1, 12.95, 80.15)
    assert distance_km > 0
    assert eta >= 2


def test_nearby_available_resource_scores_higher_than_far_offline():
    request = make_request()
    near = make_resource(id="RES-near", latitude=12.926, longitude=80.102, availability="AVAILABLE")
    far_offline = make_resource(id="RES-far", latitude=13.100, longitude=80.300, availability="OFFLINE")
    ranked = match_resources(request, [near, far_offline])
    assert ranked[0].resource_id == "RES-near"
    assert ranked[0].score > ranked[1].score


def test_suitable_resource_type_beats_unsuitable_type_at_equal_distance():
    request = make_request(required_resource=["MEDICAL_SKILL"])
    medic = make_resource(id="RES-medic", type="MEDICAL_SKILL", capacity=None)
    vehicle = make_resource(id="RES-vehicle", type="VEHICLE")
    # place both at the same coordinates so distance/eta don't confound the comparison
    medic["latitude"] = vehicle["latitude"] = 12.930
    medic["longitude"] = vehicle["longitude"] = 80.105
    ranked = match_resources(request, [medic, vehicle])
    assert ranked[0].resource_id == "RES-medic"


def test_capacity_shortfall_lowers_score():
    request = make_request(people_count=6)
    small = make_resource(id="RES-small", capacity=2)
    large = make_resource(id="RES-large", capacity=8)
    ranked = match_resources(request, [small, large])
    large_result = next(m for m in ranked if m.resource_id == "RES-large")
    small_result = next(m for m in ranked if m.resource_id == "RES-small")
    assert large_result.score > small_result.score


def test_top_matches_excludes_offline():
    request = make_request()
    online = make_resource(id="RES-online", availability="AVAILABLE")
    offline = make_resource(id="RES-offline", availability="OFFLINE")
    result = top_matches(request, [online, offline])
    ids = [m.resource_id for m in result]
    assert "RES-online" in ids
    assert "RES-offline" not in ids


def test_match_reasons_are_explainable():
    request = make_request()
    resource = make_resource()
    ranked = match_resources(request, [resource])
    assert len(ranked[0].reasons) >= 3
    assert all("label" in r and "passed" in r for r in ranked[0].reasons)


def test_scores_bounded_0_100():
    request = make_request()
    resources = [make_resource(id=f"RES-{i}", latitude=12.9 + i * 0.05) for i in range(5)]
    ranked = match_resources(request, resources)
    for m in ranked:
        assert 0 <= m.score <= 100
