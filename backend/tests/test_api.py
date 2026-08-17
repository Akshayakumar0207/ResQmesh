import os

os.environ["DATABASE_URL"] = "sqlite:///./test_api.db"

import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture(scope="module")
def client():
    with TestClient(app) as c:
        yield c


@pytest.fixture(autouse=True)
def reset_demo_data(client):
    client.post("/api/demo/reset")
    yield


def test_health_endpoint(client):
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_create_emergency_validates_blank_description(client):
    r = client.post("/api/emergencies", json={"description": "   ", "people_count": 1})
    assert r.status_code == 422


def test_create_emergency_and_get_matches(client):
    r = client.post("/api/emergencies", json={
        "description": "House fire spreading fast, family trapped inside.",
        "area_label": "Chromepet", "people_count": 4,
    })
    assert r.status_code == 201
    data = r.json()
    assert data["severity"] in ("CRITICAL", "HIGH")
    assert data["category"] in ("FIRE", "RESCUE", "EVACUATION")

    matches = client.get(f"/api/emergencies/{data['id']}/matches")
    assert matches.status_code == 200
    assert len(matches.json()) > 0


def test_assign_best_resource_and_dynamic_reoptimization(client):
    created = client.post("/api/emergencies", json={
        "description": "Elderly man collapsed, unconscious, needs urgent medical help.",
        "area_label": "Adyar", "people_count": 1,
    }).json()

    assignment = client.post("/api/assignments", json={"request_id": created["id"]})
    assert assignment.status_code == 201
    resource_id = assignment.json()["resource_id"]

    # Make the assigned resource unavailable -> should trigger re-optimization
    resp = client.patch(f"/api/resources/{resource_id}/availability", json={"availability": "OFFLINE"})
    assert resp.status_code == 200

    updated_request = client.get(f"/api/emergencies/{created['id']}").json()
    # Either reassigned to a new resource, or returned to SEARCHING if none available
    assert updated_request["status"] in ("ASSIGNED", "SEARCHING")
    if updated_request["status"] == "ASSIGNED":
        assert updated_request["assigned_resource_id"] != resource_id

    events = client.get(f"/api/emergencies/{created['id']}/events").json()
    event_types = [e["event_type"] for e in events]
    assert "NETWORK_REOPTIMIZED" in event_types


def test_auth_register_login_me_flow(client):
    email = "pytest.user@example.com"
    reg = client.post("/api/auth/register", json={
        "email": email, "password": "TestPassword123", "display_name": "Pytest User",
    })
    assert reg.status_code == 201
    token = reg.json()["access_token"]

    me = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me.status_code == 200
    assert me.json()["email"] == email

    no_auth = client.get("/api/auth/me")
    assert no_auth.status_code == 401

    wrong_login = client.post("/api/auth/login", json={"email": email, "password": "wrong"})
    assert wrong_login.status_code == 401

    right_login = client.post("/api/auth/login", json={"email": email, "password": "TestPassword123"})
    assert right_login.status_code == 200


def test_forgot_password_does_not_leak_account_existence(client):
    r1 = client.post("/api/auth/forgot-password", json={"email": "definitely.not.registered@example.com"})
    assert r1.status_code == 200
    assert r1.json()["reset_link"] is None


def test_dashboard_and_analytics_endpoints(client):
    assert client.get("/api/dashboard").status_code == 200
    assert client.get("/api/analytics").status_code == 200
