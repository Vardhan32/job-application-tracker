from flask import Blueprint, jsonify
from flask_jwt_extended import create_access_token, jwt_required

from ..extensions import db
from ..models import User
from ..utils import (
    EMAIL_RE,
    ApiError,
    Validator,
    current_user,
    json_body,
)

bp = Blueprint("auth", __name__, url_prefix="/api/auth")


@bp.post("/register")
def register():
    data = json_body()
    validator = Validator(data)

    name = validator.text("name", required=True, max_length=100)
    email = validator.text("email", required=True, max_length=255)
    password = data.get("password")

    if email and not EMAIL_RE.match(email):
        validator.errors["email"] = "Enter a valid email address."
    if not isinstance(password, str) or len(password) < 8:
        validator.errors["password"] = "Password must be at least 8 characters."
    elif len(password) > 128:
        validator.errors["password"] = "Password must be under 128 characters."

    validator.raise_if_errors()

    email = email.lower()
    if User.query.filter_by(email=email).first():
        raise ApiError("An account with this email already exists.", 409)

    user = User(name=name, email=email)
    user.set_password(password)
    db.session.add(user)
    db.session.commit()

    token = create_access_token(identity=str(user.id))
    return jsonify(user=user.to_dict(), access_token=token), 201


@bp.post("/login")
def login():
    data = json_body()
    validator = Validator(data)
    email = validator.text("email", required=True, max_length=255)
    password = data.get("password")

    if not password:
        validator.errors["password"] = "Password is required."
    validator.raise_if_errors()

    user = User.query.filter_by(email=email.lower()).first()
    if user is None or not user.check_password(str(password)):
        raise ApiError("Incorrect email or password.", 401)

    token = create_access_token(identity=str(user.id))
    return jsonify(user=user.to_dict(), access_token=token)


@bp.get("/me")
@jwt_required()
def me():
    return jsonify(user=current_user().to_dict())
