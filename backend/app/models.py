from datetime import datetime, timezone

from werkzeug.security import check_password_hash, generate_password_hash

from .extensions import db

APPLICATION_STATUSES = (
    "wishlist",
    "applied",
    "interviewing",
    "offer",
    "rejected",
    "withdrawn",
)
WORK_MODES = ("onsite", "hybrid", "remote")
INTERVIEW_MODES = ("phone", "video", "onsite")
INTERVIEW_OUTCOMES = ("pending", "passed", "failed", "cancelled")


def utcnow():
    """Naive UTC timestamp, stored the same way on SQLite and MySQL."""
    return datetime.now(timezone.utc).replace(tzinfo=None)


class User(db.Model):
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(255), nullable=False, unique=True, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)

    applications = db.relationship(
        "Application", back_populates="user", cascade="all, delete-orphan"
    )

    def set_password(self, password):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password):
        return check_password_hash(self.password_hash, password)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "email": self.email,
            "created_at": self.created_at.isoformat(),
        }


class Application(db.Model):
    __tablename__ = "applications"
    __table_args__ = (
        db.Index("ix_applications_user_status", "user_id", "status"),
    )

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(
        db.Integer, db.ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    company = db.Column(db.String(150), nullable=False)
    role = db.Column(db.String(150), nullable=False)
    location = db.Column(db.String(120))
    work_mode = db.Column(db.String(20), nullable=False, default="onsite")
    source = db.Column(db.String(80))
    status = db.Column(db.String(20), nullable=False, default="applied")
    applied_on = db.Column(db.Date)
    salary_min = db.Column(db.Numeric(12, 2))
    salary_max = db.Column(db.Numeric(12, 2))
    job_url = db.Column(db.String(500))
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)
    updated_at = db.Column(
        db.DateTime, nullable=False, default=utcnow, onupdate=utcnow
    )

    user = db.relationship("User", back_populates="applications")
    interviews = db.relationship(
        "Interview",
        back_populates="application",
        cascade="all, delete-orphan",
        order_by="Interview.scheduled_at",
    )

    def next_interview(self):
        upcoming = [
            interview
            for interview in self.interviews
            if interview.outcome == "pending" and interview.scheduled_at >= utcnow()
        ]
        return min(upcoming, key=lambda item: item.scheduled_at, default=None)

    def to_dict(self, include_interviews=False):
        data = {
            "id": self.id,
            "company": self.company,
            "role": self.role,
            "location": self.location,
            "work_mode": self.work_mode,
            "source": self.source,
            "status": self.status,
            "applied_on": self.applied_on.isoformat() if self.applied_on else None,
            "salary_min": float(self.salary_min) if self.salary_min is not None else None,
            "salary_max": float(self.salary_max) if self.salary_max is not None else None,
            "job_url": self.job_url,
            "notes": self.notes,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "interview_count": len(self.interviews),
        }

        next_interview = self.next_interview()
        data["next_interview_at"] = (
            next_interview.scheduled_at.isoformat() if next_interview else None
        )

        if include_interviews:
            data["interviews"] = [interview.to_dict() for interview in self.interviews]

        return data


class Interview(db.Model):
    __tablename__ = "interviews"

    id = db.Column(db.Integer, primary_key=True)
    application_id = db.Column(
        db.Integer,
        db.ForeignKey("applications.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    round_name = db.Column(db.String(120), nullable=False)
    scheduled_at = db.Column(db.DateTime, nullable=False)
    mode = db.Column(db.String(20), nullable=False, default="video")
    interviewer = db.Column(db.String(150))
    outcome = db.Column(db.String(20), nullable=False, default="pending")
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, nullable=False, default=utcnow)

    application = db.relationship("Application", back_populates="interviews")

    def to_dict(self):
        return {
            "id": self.id,
            "application_id": self.application_id,
            "round_name": self.round_name,
            "scheduled_at": self.scheduled_at.isoformat(),
            "mode": self.mode,
            "interviewer": self.interviewer,
            "outcome": self.outcome,
            "notes": self.notes,
            "company": self.application.company,
            "role": self.application.role,
        }
