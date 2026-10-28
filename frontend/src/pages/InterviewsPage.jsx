import { useEffect, useState } from "react";
import { ArrowUpRight, CalendarDays } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../api/client";
import DateTile from "../components/DateTile";
import EmptyState from "../components/EmptyState";
import OutcomeBadge from "../components/OutcomeBadge";
import {
  INTERVIEW_MODE_LABELS,
  formatTime,
} from "../utils/format";

export default function InterviewsPage() {
  const [interviews, setInterviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const { data } = await api.get("/interviews");
        if (!ignore) setInterviews(data.interviews);
      } catch (requestError) {
        if (!ignore) {
          setError(
            requestError.response?.data?.message || "Could not load your interviews."
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
  }, []);

  const now = new Date();
  const upcoming = interviews
    .filter(
      (interview) =>
        interview.outcome === "pending" && new Date(interview.scheduled_at) >= now
    )
    .sort((a, b) => new Date(a.scheduled_at) - new Date(b.scheduled_at));

  const past = interviews
    .filter(
      (interview) =>
        interview.outcome !== "pending" || new Date(interview.scheduled_at) < now
    )
    .sort((a, b) => new Date(b.scheduled_at) - new Date(a.scheduled_at));

  function renderCard(interview) {
    return (
      <Link
        to={`/applications/${interview.application_id}`}
        className="interview-card"
        key={interview.id}
      >
        <DateTile value={interview.scheduled_at} subtitle={formatTime(interview.scheduled_at)} />
        <div className="interview-card__body">
          <div className="interview-card__top">
            <span className="interview-company">
              {interview.company} · {interview.role}
            </span>
            <OutcomeBadge outcome={interview.outcome} />
          </div>
          <h3>{interview.round_name}</h3>
          <p>{INTERVIEW_MODE_LABELS[interview.mode] || interview.mode}</p>
        </div>
        <ArrowUpRight size={18} className="interview-card__arrow" />
      </Link>
    );
  }

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">Calendar</span>
          <h1>Interviews</h1>
          <p className="page-subtitle">
            Every scheduled and completed round across your applications.
          </p>
        </div>
      </header>

      {error ? <div className="alert alert--error">{error}</div> : null}

      {loading ? (
        <div className="panel table-loading">
          <span className="spinner" />
          <span>Loading interviews…</span>
        </div>
      ) : interviews.length === 0 ? (
        <div className="panel">
          <EmptyState
            icon={CalendarDays}
            title="No interviews yet"
            description="Open an application and schedule a round when you hear back."
            action={
              <Link to="/" className="btn btn--primary">
                Go to applications
              </Link>
            }
          />
        </div>
      ) : (
        <>
          <section className="panel">
            <div className="panel__header">
              <h2>
                Upcoming
                <span className="count-pill">{upcoming.length}</span>
              </h2>
            </div>
            {upcoming.length === 0 ? (
              <p className="panel-note">Nothing on the calendar right now.</p>
            ) : (
              <div className="interview-board">{upcoming.map(renderCard)}</div>
            )}
          </section>

          <section className="panel">
            <div className="panel__header">
              <h2>
                Completed and past
                <span className="count-pill">{past.length}</span>
              </h2>
            </div>
            {past.length === 0 ? (
              <p className="panel-note">Past rounds will show up here.</p>
            ) : (
              <div className="interview-board interview-board--past">
                {past.map(renderCard)}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}
