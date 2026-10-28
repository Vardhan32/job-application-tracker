from datetime import date, datetime, timedelta

from .extensions import db
from .models import Application, Interview, User


def seed():
    if User.query.filter_by(email="demo@jobtracker.dev").first():
        print("Demo data already exists, skipping.")
        return

    user = User(name="Demo User", email="demo@jobtracker.dev")
    user.set_password("demo1234")
    db.session.add(user)
    db.session.flush()

    today = date.today()

    applications = [
        {
            "company": "Zoho",
            "role": "Backend Developer",
            "location": "Chennai",
            "work_mode": "hybrid",
            "source": "Company site",
            "status": "interviewing",
            "applied_on": today - timedelta(days=12),
            "salary_min": 900000,
            "salary_max": 1200000,
            "job_url": "https://www.zoho.com/careers/",
            "notes": "Recruiter reached out after the online assessment. Two rounds done.",
        },
        {
            "company": "Freshworks",
            "role": "Software Engineer",
            "location": "Chennai",
            "work_mode": "hybrid",
            "source": "LinkedIn",
            "status": "applied",
            "applied_on": today - timedelta(days=4),
            "salary_min": 1000000,
            "salary_max": 1400000,
            "job_url": "https://www.freshworks.com/company/careers/",
            "notes": "",
        },
        {
            "company": "Razorpay",
            "role": "Backend Engineer",
            "location": "Bengaluru",
            "work_mode": "remote",
            "source": "Referral",
            "status": "interviewing",
            "applied_on": today - timedelta(days=20),
            "salary_min": 1400000,
            "salary_max": 1800000,
            "notes": "Referred by Ankit. System design round scheduled.",
        },
        {
            "company": "Postman",
            "role": "Full Stack Developer",
            "location": "Bengaluru",
            "work_mode": "remote",
            "source": "LinkedIn",
            "status": "offer",
            "applied_on": today - timedelta(days=32),
            "salary_min": 1600000,
            "salary_max": 2000000,
            "notes": "Offer received. Negotiating joining bonus.",
        },
        {
            "company": "TCS",
            "role": "Systems Engineer",
            "location": "Chennai",
            "work_mode": "onsite",
            "source": "Campus",
            "status": "rejected",
            "applied_on": today - timedelta(days=45),
            "notes": "Rejected after HR round.",
        },
        {
            "company": "Swiggy",
            "role": "SDE-1",
            "location": "Bengaluru",
            "work_mode": "hybrid",
            "source": "Careers page",
            "status": "wishlist",
            "salary_min": 1200000,
            "salary_max": 1600000,
            "job_url": "https://careers.swiggy.com/",
            "notes": "Referral contact found on LinkedIn.",
        },
        {
            "company": "Hasura",
            "role": "Backend Engineer",
            "location": "Remote",
            "work_mode": "remote",
            "source": "Wellfound",
            "status": "applied",
            "applied_on": today - timedelta(days=2),
            "job_url": "https://hasura.io/careers/",
        },
        {
            "company": "Infosys",
            "role": "Software Developer",
            "location": "Pune",
            "work_mode": "onsite",
            "source": "Job portal",
            "status": "withdrawn",
            "applied_on": today - timedelta(days=25),
            "notes": "Withdrew after accepting another interview process.",
        },
        {
            "company": "Chargebee",
            "role": "Product Engineer",
            "location": "Chennai",
            "work_mode": "hybrid",
            "source": "Referral",
            "status": "applied",
            "applied_on": today - timedelta(days=7),
            "salary_min": 1100000,
            "salary_max": 1500000,
        },
    ]

    created = []
    for item in applications:
        application = Application(user_id=user.id, **item)
        db.session.add(application)
        created.append(application)

    db.session.flush()

    interviews = [
        {
            "application": created[0],
            "round_name": "Technical Round 2",
            "scheduled_at": datetime.now() + timedelta(days=3, hours=2),
            "mode": "video",
            "interviewer": "Engineering Manager",
            "outcome": "pending",
            "notes": "Prepare database design and Flask questions.",
        },
        {
            "application": created[0],
            "round_name": "Technical Round 1",
            "scheduled_at": datetime.now() - timedelta(days=5),
            "mode": "video",
            "interviewer": "Senior Engineer",
            "outcome": "passed",
            "notes": "Mostly Python and SQL. One live coding question.",
        },
        {
            "application": created[2],
            "round_name": "System Design",
            "scheduled_at": datetime.now() + timedelta(days=1, hours=5),
            "mode": "video",
            "interviewer": "Staff Engineer",
            "outcome": "pending",
            "notes": "Mock a payments ledger design.",
        },
        {
            "application": created[3],
            "round_name": "HR Discussion",
            "scheduled_at": datetime.now() - timedelta(days=9),
            "mode": "phone",
            "interviewer": "HR Partner",
            "outcome": "passed",
            "notes": "Discussed compensation and notice period.",
        },
    ]

    for item in interviews:
        application = item.pop("application")
        db.session.add(Interview(application_id=application.id, **item))

    db.session.commit()
    print("Seeded demo user demo@jobtracker.dev / demo1234")
