from datetime import datetime, timedelta

from tests.test_applications import create_application


def test_interview_lifecycle(client, auth_headers):
    application_id = create_application(client, auth_headers).get_json()["application"][
        "id"
    ]
    scheduled_at = (datetime.now() + timedelta(days=1)).isoformat()

    created = client.post(
        f"/api/applications/{application_id}/interviews",
        json={
            "round_name": "Technical Round 1",
            "scheduled_at": scheduled_at,
            "mode": "video",
            "interviewer": "Priya",
        },
        headers=auth_headers,
    )
    assert created.status_code == 201
    interview = created.get_json()["interview"]
    assert interview["outcome"] == "pending"
    assert interview["company"] == "Acme"

    listed = client.get(
        f"/api/applications/{application_id}/interviews", headers=auth_headers
    ).get_json()
    assert len(listed["interviews"]) == 1

    updated = client.put(
        f"/api/interviews/{interview['id']}",
        json={
            "round_name": "Technical Round 1",
            "scheduled_at": scheduled_at,
            "mode": "video",
            "outcome": "passed",
            "notes": "Strong SQL answers.",
        },
        headers=auth_headers,
    )
    assert updated.status_code == 200
    assert updated.get_json()["interview"]["outcome"] == "passed"

    detail = client.get(
        f"/api/applications/{application_id}", headers=auth_headers
    ).get_json()["application"]
    assert detail["interview_count"] == 1

    all_interviews = client.get("/api/interviews", headers=auth_headers).get_json()
    assert len(all_interviews["interviews"]) == 1

    deleted = client.delete(
        f"/api/interviews/{interview['id']}", headers=auth_headers
    )
    assert deleted.status_code == 204
    assert client.get("/api/interviews", headers=auth_headers).get_json()["interviews"] == []


def test_interview_requires_round_and_date(client, auth_headers):
    application_id = create_application(client, auth_headers).get_json()["application"][
        "id"
    ]

    response = client.post(
        f"/api/applications/{application_id}/interviews",
        json={"round_name": "", "scheduled_at": "not-a-date"},
        headers=auth_headers,
    )

    assert response.status_code == 422
    assert set(response.get_json()["errors"]) == {"round_name", "scheduled_at"}


def test_interviews_are_scoped_to_owner(client, register):
    token_one = register(email="one@example.com")
    token_two = register(name="Second", email="two@example.com")
    headers_one = {"Authorization": f"Bearer {token_one}"}
    headers_two = {"Authorization": f"Bearer {token_two}"}

    application_id = create_application(client, headers_one).get_json()["application"][
        "id"
    ]
    scheduled_at = (datetime.now() + timedelta(days=1)).isoformat()
    interview_id = client.post(
        f"/api/applications/{application_id}/interviews",
        json={"round_name": "HR Round", "scheduled_at": scheduled_at},
        headers=headers_one,
    ).get_json()["interview"]["id"]

    assert (
        client.post(
            f"/api/applications/{application_id}/interviews",
            json={"round_name": "HR Round", "scheduled_at": scheduled_at},
            headers=headers_two,
        ).status_code
        == 404
    )
    assert (
        client.put(
            f"/api/interviews/{interview_id}",
            json={"round_name": "Changed", "scheduled_at": scheduled_at},
            headers=headers_two,
        ).status_code
        == 404
    )
    assert (
        client.delete(
            f"/api/interviews/{interview_id}", headers=headers_two
        ).status_code
        == 404
    )
