from datetime import date

from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required
from sqlalchemy import or_

from ..extensions import db
from ..models import (
    APPLICATION_STATUSES,
    INTERVIEW_OUTCOMES,
    WORK_MODES,
    Application,
    Interview,
    utcnow,
)
from ..utils import (
    ApiError,
    Validator,
    current_user,
    json_body,
    pagination_args,
    pagination_meta,
)

bp = Blueprint("applications", __name__, url_prefix="/api/applications")

SORT_OPTIONS = {
    "newest": (Application.created_at.desc(),),
    "oldest": (Application.created_at.asc(),),
    "company": (Application.company.asc(),),
    "applied": (Application.applied_on.desc().nullslast(),),
}


def get_owned_application(application_id, user):
    application = Application.query.filter_by(
        id=application_id, user_id=user.id
    ).first()
    if application is None:
        raise ApiError("Application not found.", 404)
    return application


def read_application_fields(data):
    validator = Validator(data)

    fields = {
        "company": validator.text("company", required=True, max_length=150),
        "role": validator.text("role", required=True, max_length=150),
        "location": validator.text("location", max_length=120),
        "work_mode": validator.enum(
            "work_mode", WORK_MODES, required=False, default="onsite"
        ),
        "source": validator.text("source", max_length=80),
        "status": validator.enum(
            "status", APPLICATION_STATUSES, required=False, default="applied"
        ),
        "applied_on": validator.date("applied_on"),
        "salary_min": validator.number("salary_min", "Minimum salary"),
        "salary_max": validator.number("salary_max", "Maximum salary"),
        "job_url": validator.text("job_url", max_length=500),
        "notes": validator.text("notes", max_length=5000),
    }

    if (
        fields["salary_min"] is not None
        and fields["salary_max"] is not None
        and fields["salary_min"] > fields["salary_max"]
    ):
        validator.errors["salary_max"] = (
            "Maximum salary must be greater than the minimum."
        )

    if fields["job_url"] and not fields["job_url"].startswith(
        ("http://", "https://")
    ):
        validator.errors["job_url"] = "Job URL must start with http:// or https://."

    validator.raise_if_errors()

    if fields["applied_on"] is None and fields["status"] not in (
        "wishlist",
        "withdrawn",
    ):
        fields["applied_on"] = date.today()

    return fields


@bp.get("")
@jwt_required()
def list_applications():
    user = current_user()
    page, per_page = pagination_args()
    search = request.args.get("q", "").strip()
    status = request.args.get("status", "").strip()
    sort = request.args.get("sort", "newest")

    query = Application.query.filter_by(user_id=user.id)

    if status:
        if status not in APPLICATION_STATUSES:
            raise ApiError("Unknown application status.", 400)
        query = query.filter(Application.status == status)

    if search:
        pattern = f"%{search}%"
        query = query.filter(
            or_(
                Application.company.ilike(pattern),
                Application.role.ilike(pattern),
                Application.location.ilike(pattern),
            )
        )

    if sort not in SORT_OPTIONS:
        raise ApiError("Unknown sort option.", 400)

    pagination = query.order_by(*SORT_OPTIONS[sort]).paginate(
        page=page, per_page=per_page, error_out=False
    )

    return jsonify(
        items=[application.to_dict() for application in pagination.items],
        meta=pagination_meta(pagination),
    )


@bp.get("/stats")
@jwt_required()
def application_stats():
    user = current_user()

    rows = (
        db.session.query(Application.status, db.func.count(Application.id))
        .filter(Application.user_id == user.id)
        .group_by(Application.status)
        .all()
    )
    counts = {status: 0 for status in APPLICATION_STATUSES}
    for status, count in rows:
        counts[status] = count

    upcoming_query = (
        Interview.query.join(Application)
        .filter(
            Application.user_id == user.id,
            Interview.outcome == "pending",
            Interview.scheduled_at >= utcnow(),
        )
        .order_by(Interview.scheduled_at.asc())
    )
    upcoming_count = upcoming_query.count()
    upcoming = upcoming_query.limit(5).all()

    return jsonify(
        total=sum(counts.values()),
        active=counts["applied"] + counts["interviewing"],
        offers=counts["offer"],
        rejected=counts["rejected"],
        by_status=counts,
        upcoming_interviews_count=upcoming_count,
        upcoming_interviews=[interview.to_dict() for interview in upcoming],
    )


@bp.post("")
@jwt_required()
def create_application():
    user = current_user()
    fields = read_application_fields(json_body())

    application = Application(user_id=user.id, **fields)
    db.session.add(application)
    db.session.commit()

    return jsonify(application=application.to_dict(include_interviews=True)), 201


@bp.get("/<int:application_id>")
@jwt_required()
def get_application(application_id):
    application = get_owned_application(application_id, current_user())
    return jsonify(application=application.to_dict(include_interviews=True))


@bp.put("/<int:application_id>")
@jwt_required()
def update_application(application_id):
    application = get_owned_application(application_id, current_user())
    fields = read_application_fields(json_body())

    for field, value in fields.items():
        setattr(application, field, value)

    db.session.commit()
    return jsonify(application=application.to_dict(include_interviews=True))


@bp.delete("/<int:application_id>")
@jwt_required()
def delete_application(application_id):
    application = get_owned_application(application_id, current_user())
    db.session.delete(application)
    db.session.commit()
    return "", 204


@bp.get("/<int:application_id>/interviews")
@jwt_required()
def list_application_interviews(application_id):
    application = get_owned_application(application_id, current_user())
    return jsonify(
        interviews=[interview.to_dict() for interview in application.interviews]
    )


@bp.post("/<int:application_id>/interviews")
@jwt_required()
def create_interview(application_id):
    application = get_owned_application(application_id, current_user())
    data = json_body()
    validator = Validator(data)

    fields = {
        "round_name": validator.text("round_name", "Round name", required=True, max_length=120),
        "scheduled_at": validator.datetime("scheduled_at", "Interview date", required=True),
        "mode": validator.enum(
            "mode", ("phone", "video", "onsite"), required=False, default="video"
        ),
        "interviewer": validator.text("interviewer", max_length=150),
        "outcome": validator.enum(
            "outcome", INTERVIEW_OUTCOMES, required=False, default="pending"
        ),
        "notes": validator.text("notes", max_length=2000),
    }
    validator.raise_if_errors()

    interview = Interview(application_id=application.id, **fields)
    db.session.add(interview)
    db.session.commit()

    return jsonify(interview=interview.to_dict()), 201
