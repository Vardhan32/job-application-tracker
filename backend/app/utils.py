import re
from datetime import date, datetime

from flask import request
from flask_jwt_extended import get_jwt_identity

from .extensions import db
from .models import User

EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")


class ApiError(Exception):
    def __init__(self, message, status_code=400, errors=None):
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.errors = errors


class Validator:
    """Small helper that collects field errors so the API can return them in one go."""

    def __init__(self, data):
        self.data = data
        self.errors = {}

    def _label(self, key, label):
        return label or key.replace("_", " ").capitalize()

    def text(self, key, label=None, required=False, max_length=500):
        label = self._label(key, label)
        value = self.data.get(key)

        if value is None:
            if required:
                self.errors[key] = f"{label} is required."
            return None
        if not isinstance(value, str):
            self.errors[key] = f"{label} must be text."
            return None

        value = value.strip()
        if required and not value:
            self.errors[key] = f"{label} is required."
            return None
        if len(value) > max_length:
            self.errors[key] = f"{label} must be under {max_length} characters."
            return None

        return value or None

    def enum(self, key, choices, label=None, required=True, default=None):
        label = self._label(key, label)
        value = self.text(key, label=label, required=required, max_length=50)
        if value is None:
            return default
        if value not in choices:
            self.errors[key] = f"{label} must be one of: {', '.join(choices)}."
            return default
        return value

    def date(self, key, label=None, required=False):
        label = self._label(key, label)
        value = self.data.get(key)
        if value in (None, ""):
            if required:
                self.errors[key] = f"{label} is required."
            return None
        try:
            return date.fromisoformat(str(value))
        except ValueError:
            self.errors[key] = f"{label} must use the YYYY-MM-DD format."
            return None

    def datetime(self, key, label=None, required=False):
        label = self._label(key, label)
        value = self.data.get(key)
        if value in (None, ""):
            if required:
                self.errors[key] = f"{label} is required."
            return None
        try:
            parsed = datetime.fromisoformat(str(value).replace("Z", "+00:00"))
            return parsed.replace(tzinfo=None)
        except ValueError:
            self.errors[key] = f"{label} must be a valid date and time."
            return None

    def number(self, key, label=None, minimum=0):
        label = self._label(key, label)
        value = self.data.get(key)
        if value in (None, ""):
            return None
        if isinstance(value, bool):
            self.errors[key] = f"{label} must be a number."
            return None
        try:
            parsed = float(value)
        except (TypeError, ValueError):
            self.errors[key] = f"{label} must be a number."
            return None
        if parsed < minimum:
            self.errors[key] = f"{label} cannot be less than {minimum}."
            return None
        return parsed

    def raise_if_errors(self):
        if self.errors:
            raise ApiError("Please check the submitted fields.", 422, self.errors)


def json_body():
    data = request.get_json(silent=True)
    if not isinstance(data, dict):
        raise ApiError("Request body must be a JSON object.", 400)
    return data


def current_user():
    identity = get_jwt_identity()
    user = db.session.get(User, int(identity))
    if user is None:
        raise ApiError("Account no longer exists.", 401)
    return user


def pagination_args(default_per_page=10):
    try:
        page = int(request.args.get("page", 1))
        per_page = int(request.args.get("per_page", default_per_page))
    except ValueError:
        raise ApiError("Page and per_page must be whole numbers.", 400)

    return max(page, 1), min(max(per_page, 1), 50)


def pagination_meta(pagination):
    return {
        "page": pagination.page,
        "per_page": pagination.per_page,
        "total": pagination.total,
        "pages": pagination.pages,
        "has_next": pagination.has_next,
        "has_prev": pagination.has_prev,
    }
