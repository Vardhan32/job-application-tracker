import pytest

from app import create_app
from app.config import TestConfig
from app.extensions import db


@pytest.fixture()
def app():
    application = create_app(TestConfig)
    with application.app_context():
        db.create_all()
        yield application
        db.session.remove()
        db.drop_all()


@pytest.fixture()
def client(app):
    return app.test_client()


@pytest.fixture()
def register(client):
    def _register(name="Test User", email="test@example.com", password="password123"):
        response = client.post(
            "/api/auth/register",
            json={"name": name, "email": email, "password": password},
        )
        assert response.status_code == 201
        return response.get_json()["access_token"]

    return _register


@pytest.fixture()
def auth_headers(register):
    token = register()
    return {"Authorization": f"Bearer {token}"}
