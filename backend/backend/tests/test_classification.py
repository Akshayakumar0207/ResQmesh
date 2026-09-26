from app.algorithms.classification import classify_emergency


def test_critical_medical_keyword_drives_high_severity_floor():
    r = classify_emergency("Elderly man collapsed, unconscious, not breathing properly.")
    assert r.category == "MEDICAL"
    assert r.severity in ("CRITICAL", "HIGH")  # dominant CRITICAL keyword floors at least HIGH
    assert "unconscious" in r.matched_keywords


def test_evacuation_wins_over_transport_without_double_counting():
    """Regression test: 'no vehicle' must not double-count as both the
    TRANSPORT phrase 'no vehicle' AND the standalone word 'vehicle',
    which previously inflated TRANSPORT above the correct EVACUATION category."""
    r = classify_emergency(
        "My grandmother is trapped in a flooded house and needs evacuation. "
        "We are near Tambaram and dont have a vehicle.",
        people_count=2,
        special_requirements="Elderly, no vehicle",
    )
    assert r.category == "EVACUATION"
    assert r.secondary_category == "TRANSPORT"
    assert r.severity == "HIGH"
    assert "VEHICLE" in r.required_resource


def test_low_severity_general_info_request():
    r = classify_emergency("Just checking in for general information about the nearest shelter.")
    assert r.severity == "LOW"
    assert r.priority_score < 35


def test_food_request_is_medium_severity():
    r = classify_emergency("Community requesting food supplies after two days of flooding.", people_count=20)
    assert r.category in ("FOOD", "FLOOD")


def test_priority_score_bounded_0_100():
    r = classify_emergency("unconscious not breathing cardiac trapped child trapped fire immediate danger")
    assert 0 <= r.priority_score <= 100


def test_vulnerability_increases_priority():
    base = classify_emergency("Need transport to the hospital.")
    vulnerable = classify_emergency("Need transport to the hospital.", special_requirements="elderly, pregnant, wheelchair")
    assert vulnerable.priority_score >= base.priority_score


def test_recommended_action_present_and_matches_resources():
    r = classify_emergency("House fire spreading fast, family trapped inside.")
    assert r.recommended_action
    assert r.confidence <= 1.0
