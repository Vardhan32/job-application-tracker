import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BriefcaseBusiness,
  CalendarDays,
  Clock,
  ExternalLink,
  MapPin,
  Pencil,
  Plus,
  Trash2,
} from "lucide-react";
import api from "../api/client";
import ApplicationForm from "../components/ApplicationForm";
import DateTile from "../components/DateTile";
import EmptyState from "../components/EmptyState";
import InterviewForm from "../components/InterviewForm";
import OutcomeBadge from "../components/OutcomeBadge";
import StatusBadge from "../components/StatusBadge";
import {
  INTERVIEW_MODE_LABELS,
  STATUS_LABELS,
  STATUS_ORDER,
  WORK_MODE_LABELS,
  formatDate,
  formatDateTime,
  formatSalary,
  initials,
} from "../utils/format";

function toPayload(application, overrides = {}) {
  return {
    company: application.company,
    role: application.role,
    location: application.location,
    work_mode: application.work_mode,
    source: application.source,
    status: application.status,
    applied_on: application.applied_on,
    salary_min: application.salary_min,
    salary_max: application.salary_max,
    job_url: application.job_url,
    notes: application.notes,
    ...overrides,
  };
}

export default function ApplicationDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [application, setApplication] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [interviewFormOpen, setInterviewFormOpen] = useState(false);
  const [editingInterview, setEditingInterview] = useState(null);
  const [statusSaving, setStatusSaving] = useState(false);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const { data } = await api.get(`/applications/${id}`);
        if (!ignore) setApplication(data.application);
      } catch (requestError) {
        if (!ignore) {
          setError(
            requestError.response?.data?.message ||
              "Could not load this application."
          );
        }
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    load();
    return () => {
      ignore = true;
    };
  }, [id, refresh]);

  async function handleStatusChange(event) {
    const status = event.target.value;
    setStatusSaving(true);
    setActionError("");

    try {
      const { data } = await api.put(
        `/applications/${application.id}`,
        toPayload(application, { status })
      );
      setApplication(data.application);
    } catch (requestError) {
      setActionError(
        requestError.response?.data?.message || "Could not update the status."
      );
    } finally {
      setStatusSaving(false);
    }
  }

  async function handleDeleteApplication() {
    const confirmed = window.confirm(
      `Delete the application at ${application.company}? Its interviews will be removed too.`
    );
    if (!confirmed) return;

    try {
      await api.delete(`/applications/${application.id}`);
      navigate("/", { replace: true });
    } catch (requestError) {
      setActionError(
        requestError.response?.data?.message || "Could not delete the application."
      );
    }
  }

  async function handleDeleteInterview(interview) {
    const confirmed = window.confirm(`Remove "${interview.round_name}" from this application?`);
    if (!confirmed) return;

    try {
      await api.delete(`/interviews/${interview.id}`);
      setRefresh((value) => value + 1);
    } catch (requestError) {
      setActionError(
        requestError.response?.data?.message || "Could not delete the interview."
      );
    }
  }

  if (loading) {
    return (
      <div className="page-loading">
        <span className="spinner" />
      </div>
    );
  }

  if (!application) {
    return (
      <div className="page-stack">
        <Link to="/" className="back-link">
          <ArrowLeft size={16} />
          All applications
        </Link>
        <div className="panel">
          <EmptyState
            title="Application not found"
            description={error || "It may have been deleted."}
            action={
              <Link to="/" className="btn btn--primary">
                Back to applications
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="page-stack">
      <Link to="/" className="back-link">
        <ArrowLeft size={16} />
        All applications
      </Link>

      {actionError ? <div className="alert alert--error">{actionError}</div> : null}

      <header className="detail-header">
        <span className="company-mark">{initials(application.company)}</span>

        <div className="detail-heading">
          <span className="eyebrow">{application.company}</span>
          <h1>{application.role}</h1>
          <div className="meta-row">
            {application.location ? (
              <span className="meta-item">
                <MapPin size={14} />
                {application.location}
              </span>
            ) : null}
            <span className="meta-item">
              <BriefcaseBusiness size={14} />
              {WORK_MODE_LABELS[application.work_mode] || application.work_mode}
            </span>
            {application.applied_on ? (
              <span className="meta-item">
                <CalendarDays size={14} />
                Applied {formatDate(application.applied_on)}
              </span>
            ) : null}
          </div>
        </div>

        <div className="detail-actions">
          <select
            className={`status-select status-select--${application.status}`}
            value={application.status}
            onChange={handleStatusChange}
            disabled={statusSaving}
            aria-label="Application status"
          >
            {STATUS_ORDER.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>

          <button type="button" className="btn btn--ghost" onClick={() => setEditOpen(true)}>
            <Pencil size={16} />
            Edit
          </button>
          <button
            type="button"
            className="icon-btn icon-btn--danger"
            onClick={handleDeleteApplication}
            aria-label="Delete application"
            title="Delete application"
          >
            <Trash2 size={18} />
          </button>
        </div>
      </header>

      <div className="detail-grid">
        <div className="stack">
          <section className="panel">
            <div className="panel__header">
              <h2>Notes</h2>
            </div>
            {application.notes ? (
              <p className="notes-body">{application.notes}</p>
            ) : (
              <p className="panel-note">No notes yet. Add context from the edit form.</p>
            )}
          </section>

          <section className="panel">
            <div className="panel__header">
              <h2>
                Interviews
                <span className="count-pill">{application.interviews.length}</span>
              </h2>
              <button
                type="button"
                className="btn btn--sm btn--ghost"
                onClick={() => {
                  setEditingInterview(null);
                  setInterviewFormOpen(true);
                }}
              >
                <Plus size={16} />
                Schedule
              </button>
            </div>

            {application.interviews.length === 0 ? (
              <p className="panel-note">
                No rounds booked yet. Schedule one when you hear back.
              </p>
            ) : (
              <div className="interview-list">
                {application.interviews.map((interview) => (
                  <article className="interview-item" key={interview.id}>
                    <DateTile value={interview.scheduled_at} />
                    <div className="interview-item__body">
                      <div className="interview-item__top">
                        <h3>{interview.round_name}</h3>
                        <OutcomeBadge outcome={interview.outcome} />
                      </div>
                      <div className="interview-meta">
                        <span>
                          <Clock size={14} />
                          {formatDateTime(interview.scheduled_at)}
                        </span>
                        <span>{INTERVIEW_MODE_LABELS[interview.mode] || interview.mode}</span>
                        {interview.interviewer ? <span>{interview.interviewer}</span> : null}
                      </div>
                      {interview.notes ? (
                        <p className="interview-notes">{interview.notes}</p>
                      ) : null}
                    </div>
                    <div className="interview-item__actions">
                      <button
                        type="button"
                        className="icon-btn"
                        onClick={() => {
                          setEditingInterview(interview);
                          setInterviewFormOpen(true);
                        }}
                        aria-label={`Edit ${interview.round_name}`}
                        title="Edit interview"
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        type="button"
                        className="icon-btn icon-btn--danger"
                        onClick={() => handleDeleteInterview(interview)}
                        aria-label={`Delete ${interview.round_name}`}
                        title="Delete interview"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>
        </div>

        <aside className="stack">
          <section className="panel">
            <div className="panel__header">
              <h2>Overview</h2>
            </div>
            <div className="summary-list">
              <div className="summary-row">
                <span>Status</span>
                <StatusBadge status={application.status} />
              </div>
              <div className="summary-row">
                <span>Applied on</span>
                <strong>{formatDate(application.applied_on)}</strong>
              </div>
              <div className="summary-row">
                <span>Work mode</span>
                <strong>{WORK_MODE_LABELS[application.work_mode] || "—"}</strong>
              </div>
              <div className="summary-row">
                <span>Salary</span>
                <strong>{formatSalary(application.salary_min, application.salary_max)}</strong>
              </div>
              <div className="summary-row">
                <span>Source</span>
                <strong>{application.source || "—"}</strong>
              </div>
              <div className="summary-row">
                <span>Last updated</span>
                <strong>{formatDate(application.updated_at)}</strong>
              </div>
            </div>
          </section>

          <section className="panel">
            <div className="panel__header">
              <h2>Job posting</h2>
            </div>
            {application.job_url ? (
              <a
                href={application.job_url}
                target="_blank"
                rel="noreferrer"
                className="job-link"
              >
                Open the original posting
                <ExternalLink size={15} />
              </a>
            ) : (
              <p className="panel-note">No posting link saved for this role.</p>
            )}
          </section>
        </aside>
      </div>

      <ApplicationForm
        open={editOpen}
        application={application}
        onClose={() => setEditOpen(false)}
        onSaved={() => {
          setEditOpen(false);
          setRefresh((value) => value + 1);
        }}
      />

      <InterviewForm
        open={interviewFormOpen}
        applicationId={application.id}
        interview={editingInterview}
        onClose={() => {
          setInterviewFormOpen(false);
          setEditingInterview(null);
        }}
        onSaved={() => {
          setInterviewFormOpen(false);
          setEditingInterview(null);
          setRefresh((value) => value + 1);
        }}
      />
    </div>
  );
}
