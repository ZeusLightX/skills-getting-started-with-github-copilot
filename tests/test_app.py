from fastapi.testclient import TestClient
from src.app import app, activities

client = TestClient(app)


def test_get_activities():
    resp = client.get("/activities")
    assert resp.status_code == 200
    data = resp.json()
    assert isinstance(data, dict)
    # Expect some known activities to exist
    assert "Chess Club" in data


def test_signup_and_unregister_flow():
    activity = "Chess Club"
    email = "pytest-tester@example.com"

    # Make sure email not already present; if present, remove it first
    if email in activities[activity]["participants"]:
        activities[activity]["participants"].remove(email)

    # Signup
    resp = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert resp.status_code == 200
    assert email in activities[activity]["participants"]
    assert "Signed up" in resp.json().get("message", "")

    # Duplicate signup should fail
    resp2 = client.post(f"/activities/{activity}/signup", params={"email": email})
    assert resp2.status_code == 400

    # Unregister
    resp3 = client.delete(f"/activities/{activity}/signup", params={"email": email})
    assert resp3.status_code == 200
    assert email not in activities[activity]["participants"]

    # Deleting again should return 404
    resp4 = client.delete(f"/activities/{activity}/signup", params={"email": email})
    assert resp4.status_code == 404
