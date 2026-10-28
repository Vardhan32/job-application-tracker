from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required

from ..extensions import db
from ..models import INTERVIEW_MODES, INTERVIEW_OUTCOMES, Application, Interview
from ..utils import ApiError, Validator, current_user, json_body

bp = Blueprint("interviews", __name__, url_prefix="/api/interviews")


def get_owned_interview(interview_id, user):
    interview = (
        Interview.query.join(Application)
        .filter(Interview.id == interview_id, Application.user_id == user.id)
        .first()
    )
    if interview is None:
        raise ApiError("Interview not found.", 404)
    return interview


@bp.get("")
@jwt_required()
def list_interviews():
    user = current_user()
    interviews = (
        Interview.query.join(Application)
        .filter(Application.user_id == user.id)
        .order_by(Interview.scheduled_at.asc())
        .all()
    )
    return jsonify(interviews=[interview.to_dict() for interview in interviews])


@bp.put("/<int:interview_id>")
@jwt_required()
def update_interview(interview_id):
    interview = get_owned_interview(interview_id, current_user())
    data = json_body()
    validator = Validator(data)

    fields = {
        "round_name": validator.text("round_name", "Round name", required=True, max_length=120),
        "scheduled_at": validator.datetime("scheduled_at", "Interview date", required=True),
        "mode": validator.enum(
            "mode", INTERVIEW_MODES, required=False, default=interview.mode
        ),
        "interviewer": validator.text("interviewer", max_length=150),
        "outcome": validator.enum(
            "outcome", INTERVIEW_OUTCOMES, required=False, default=interview.outcome
        ),
        "notes": validator.text("notes", max_length=2000),
    }
    validator.raise_if_errors()

    for field, value in fields.items():
        setattr(interview, field, value)

    db.session.commit()
    return jsonify(interview=interview.to_dict())


@bp.delete("/<int:interview_id>")
@jwt_required()
def delete_interview(interview_id):
    interview = get_owned_interview(interview_id, current_user())
    db.session.delete(interview)
    db.session.commit()
    return "", 204
