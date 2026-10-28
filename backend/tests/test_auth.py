def test_register_returns_user_and_token(client):
    response = client.post(
        "/api/auth/register",
        json={"name": "Asha", "email": "asha@example.com", "password": "password123"},
    )

    assert response.status_code == 201
    body = response.get_json()
    assert body["user"]["email"] == "asha@example.com"
    assert body["access_token"]


def test_register_rejects_duplicate_email(client):
    payload = {"name": "Asha", "email": "asha@example.com", "password": "password123"}
    client.post("/api/auth/register", json=payload)

    response = client.post("/api/auth/register", json=payload)

    assert response.status_code == 409
    assert "already exists" in response.get_json()["message"]


def test_register_validates_fields(client):
    response = client.post(
        "/api/auth/register",
        json={"name": "", "email": "not-an-email", "password": "short"},
    )

    assert response.status_code == 422
    errors = response.get_json()["errors"]
    assert set(errors) == {"name", "email", "password"}


def test_login_success_and_failure(client):
    client.post(
        "/api/auth/register",
        json={"name": "Asha", "email": "asha@example.com", "password": "password123"},
    )

    success = client.post(
        "/api/auth/login",
        json={"email": "asha@example.com", "password": "password123"},
    )
    failure = client.post(
        "/api/auth/login",
        json={"email": "asha@example.com", "password": "wrongpass"},
    )

    assert success.status_code == 200
    assert failure.status_code == 401


def test_me_requires_token(client):
    assert client.get("/api/auth/me").status_code == 401

    token = client.post(
        "/api/auth/register",
        json={"name": "Asha", "email": "asha@example.com", "password": "password123"},
    ).get_json()["access_token"]

    response = client.get(
        "/api/auth/me", headers={"Authorization": f"Bearer {token}"}
    )

    assert response.status_code == 200
    assert response.get_json()["user"]["name"] == "Asha"
