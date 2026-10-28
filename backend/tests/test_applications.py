from datetime import date, datetime, timedelta


def create_application(client, headers, **overrides):
    payload = {
        "company": "Acme",
        "role": "Backend Developer",
        "location": "Chennai",
        "work_mode": "hybrid",
        "status": "applied",
        "salary_min": 800000,
        "salary_max": 1200000,
    }
    payload.update(overrides)
    return client.post("/api/applications", json=payload, headers=headers)


def test_application_crud_flow(client, auth_headers):
    created = create_application(client, auth_headers)
    assert created.status_code == 201
    application = created.get_json()["application"]
    assert application["company"] == "Acme"
    assert application["applied_on"] == date.today().isoformat()

    application_id = application["id"]
    fetched = client.get(f"/api/applications/{application_id}", headers=auth_headers)
    assert fetched.status_code == 200

    updated = client.put(
        f"/api/applications/{application_id}",
        json={
            "company": "Acme Corp",
            "role": "Senior Backend Developer",
            "status": "interviewing",
            "location": "Remote",
            "work_mode": "remote",
        },
        headers=auth_headers,
    )
    assert updated.status_code == 200
    assert updated.get_json()["application"]["company"] == "Acme Corp"
    assert updated.get_json()["application"]["status"] == "interviewing"

    deleted = client.delete(
        f"/api/applications/{application_id}", headers=auth_headers
    )
    assert deleted.status_code == 204
    assert (
        client.get(f"/api/applications/{application_id}", headers=auth_headers).status_code
        == 404
    )


def test_application_validation_errors(client, auth_headers):
    response = client.post(
        "/api/applications",
        json={
            "company": "",
            "role": "",
            "status": "pending",
            "salary_min": 1000,
            "salary_max": 500,
            "job_url": "acme.com/jobs",
        },
        headers=auth_headers,
    )

    assert response.status_code == 422
    errors = response.get_json()["errors"]
    assert {"company", "role", "status", "salary_max", "job_url"} <= set(errors)


def test_search_filter_and_sort(client, auth_headers):
    create_application(
        client, auth_headers, company="Zoho", role="Backend Developer", status="applied"
    )
    create_application(
        client, auth_headers, company="Freshworks", role="Frontend Developer", status="interviewing"
    )
    create_application(
        client, auth_headers, company="Razorpay", role="Backend Engineer", status="offer"
    )

    search = client.get("/api/applications?q=back", headers=auth_headers).get_json()
    assert search["meta"]["total"] == 2

    filtered = client.get(
        "/api/applications?status=offer", headers=auth_headers
    ).get_json()
    assert filtered["meta"]["total"] == 1
    assert filtered["items"][0]["company"] == "Razorpay"

    sorted_result = client.get(
        "/api/applications?sort=company", headers=auth_headers
    ).get_json()
    assert [item["company"] for item in sorted_result["items"]] == [
        "Freshworks",
        "Razorpay",
        "Zoho",
    ]


def test_pagination(client, auth_headers):
    for index in range(3):
        create_application(client, auth_headers, company=f"Company {index}")

    response = client.get("/api/applications?per_page=2", headers=auth_headers)
    body = response.get_json()

    assert len(body["items"]) == 2
    assert body["meta"]["total"] == 3
    assert body["meta"]["pages"] == 2
    assert body["meta"]["has_next"] is True


def test_users_cannot_access_each_others_applications(client, register):
    token_one = register(email="one@example.com")
    token_two = register(name="Second", email="two@example.com")
    headers_one = {"Authorization": f"Bearer {token_one}"}
    headers_two = {"Authorization": f"Bearer {token_two}"}

    application_id = create_application(client, headers_one).get_json()["application"]["id"]

    assert (
        client.get(f"/api/applications/{application_id}", headers=headers_two).status_code
        == 404
    )
    assert (
        client.get("/api/applications", headers=headers_two).get_json()["meta"]["total"]
        == 0
    )
    assert (
        client.delete(f"/api/applications/{application_id}", headers=headers_two).status_code
        == 404
    )


def test_stats_include_statuses_and_upcoming_interviews(client, auth_headers):
    first_id = create_application(
        client, auth_headers, company="Zoho", status="interviewing"
    ).get_json()["application"]["id"]
    create_application(client, auth_headers, company="Freshworks", status="offer")
    create_application(client, auth_headers, company="TCS", status="rejected")

    scheduled_at = (datetime.now() + timedelta(days=2)).isoformat()
    client.post(
        f"/api/applications/{first_id}/interviews",
        json={"round_name": "Technical Round", "scheduled_at": scheduled_at},
        headers=auth_headers,
    )

    stats = client.get("/api/applications/stats", headers=auth_headers).get_json()

    assert stats["total"] == 3
    assert stats["offers"] == 1
    assert stats["rejected"] == 1
    assert stats["by_status"]["interviewing"] == 1
    assert stats["upcoming_interviews_count"] == 1
    assert stats["upcoming_interviews"][0]["company"] == "Zoho"


def test_unknown_status_filter_returns_400(client, auth_headers):
    response = client.get("/api/applications?status=ghosted", headers=auth_headers)
    assert response.status_code == 400
