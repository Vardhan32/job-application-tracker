import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowUpRight,
  BriefcaseBusiness,
  CalendarClock,
  Plus,
  Search,
  Send,
  Trophy,
} from "lucide-react";
import api from "../api/client";
import ApplicationForm from "../components/ApplicationForm";
import EmptyState from "../components/EmptyState";
import Pagination from "../components/Pagination";
import StatCard from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";
import {
  STATUS_LABELS,
  STATUS_ORDER,
  formatDate,
  formatDateTime,
  initials,
} from "../utils/format";

const DEFAULT_META = {
  page: 1,
  per_page: 8,
  total: 0,
  pages: 0,
  has_next: false,
  has_prev: false,
};

export default function DashboardPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState({
    q: "",
    status: "",
    sort: "newest",
    page: 1,
  });
  const [applications, setApplications] = useState([]);
  const [meta, setMeta] = useState(DEFAULT_META);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [formOpen, setFormOpen] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((previous) =>
        previous.q === search ? previous : { ...previous, q: search, page: 1 }
      );
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let ignore = false;

    async function load() {
      setLoading(true);
      setError("");

      try {
        const params = {
          sort: filters.sort,
          page: filters.page,
          per_page: 8,
        };
        if (filters.q) params.q = filters.q;
        if (filters.status) params.status = filters.status;

        const [listResponse, statsResponse] = await Promise.all([
          api.get("/applications", { params }),
          api.get("/applications/stats"),
        ]);

        if (!ignore) {
          setApplications(listResponse.data.items);
          setMeta(listResponse.data.meta);
          setStats(statsResponse.data);
        }
      } catch (requestError) {
        if (!ignore) {
          setError(
            requestError.response?.data?.message ||
              "Could not load your applications. Please try again."
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
  }, [filters, refresh]);

  function changeFilter(patch) {
    setFilters((previous) => ({ ...previous, ...patch }));
  }

  const filtersActive = Boolean(filters.q || filters.status);

  return (
    <div className="page-stack">
      <header className="page-header">
        <div>
          <span className="eyebrow">Pipeline</span>
          <h1>Applications</h1>
          <p className="page-subtitle">
            Keep track of every role, conversation, and next step.
          </p>
        </div>
        <button type="button" className="btn btn--primary" onClick={() => setFormOpen(true)}>
          <Plus size={18} />
          Add application
        </button>
      </header>

      <section className="stat-grid">
        <StatCard
          label="Total applications"
          value={stats?.total ?? "—"}
          hint="Across every stage"
          tone="accent"
          icon={BriefcaseBusiness}
        />
        <StatCard
          label="Active pipeline"
          value={stats?.active ?? "—"}
          hint="Applied and interviewing"
          icon={Send}
        />
        <StatCard
          label="Interviews ahead"
          value={stats?.upcoming_interviews_count ?? "—"}
          hint="Pending rounds"
          icon={CalendarClock}
        />
        <StatCard
          label="Offers"
          value={stats?.offers ?? "—"}
          hint="Worth celebrating"
          icon={Trophy}
        />
      </section>

      <section className="panel panel--table">
        <div className="filter-bar">
          <div className="search-box">
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search company, role, or location"
              aria-label="Search applications"
            />
          </div>

          <select
            className="filter-select"
            value={filters.sort}
            onChange={(event) => changeFilter({ sort: event.target.value, page: 1 })}
            aria-label="Sort applications"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="applied">Recently applied</option>
            <option value="company">Company A–Z</option>
          </select>
        </div>

        <div className="status-tabs" role="tablist" aria-label="Filter by status">
          <button
            type="button"
            role="tab"
            aria-selected={filters.status === ""}
            className={`tab${filters.status === "" ? " is-active" : ""}`}
            onClick={() => changeFilter({ status: "", page: 1 })}
          >
            All <span className="tab__count">{stats?.total ?? 0}</span>
          </button>
          {STATUS_ORDER.map((status) => (
            <button
              key={status}
              type="button"
              role="tab"
              aria-selected={filters.status === status}
              className={`tab${filters.status === status ? " is-active" : ""}`}
              onClick={() => changeFilter({ status, page: 1 })}
            >
              {STATUS_LABELS[status]}
              <span className="tab__count">{stats?.by_status?.[status] ?? 0}</span>
            </button>
          ))}
        </div>

        {error ? (
          <div className="alert alert--error alert--inline">
            <span>{error}</span>
            <button type="button" className="text-btn" onClick={() => setRefresh((value) => value + 1)}>
              Retry
            </button>
          </div>
        ) : null}

        {loading ? (
          <div className="table-loading">
            <span className="spinner" />
            <span>Loading applications…</span>
          </div>
        ) : applications.length === 0 ? (
          <EmptyState
            title={filtersActive ? "No applications match those filters" : "Your pipeline is empty"}
            description={
              filtersActive
                ? "Try a different status or search term."
                : "Add the first role you are chasing and the tracker will start working for you."
            }
            action={
              filtersActive ? (
                <button
                  type="button"
                  className="btn btn--ghost"
                  onClick={() => {
                    setSearch("");
                    setFilters({ q: "", status: "", sort: "newest", page: 1 });
                  }}
                >
                  Clear filters
                </button>
              ) : (
                <button type="button" className="btn btn--primary" onClick={() => setFormOpen(true)}>
                  <Plus size={17} />
                  Add application
                </button>
              )
            }
          />
        ) : (
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Company</th>
                  <th className="hide-sm">Location</th>
                  <th>Status</th>
                  <th className="hide-sm">Applied</th>
                  <th>Next interview</th>
                  <th aria-label="Open" />
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr
                    key={application.id}
                    className="clickable-row"
                    tabIndex={0}
                    onClick={() => navigate(`/applications/${application.id}`)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter") navigate(`/applications/${application.id}`);
                    }}
                  >
                    <td>
                      <div className="company-cell">
                        <span className="company-avatar">{initials(application.company)}</span>
                        <div>
                          <strong>{application.company}</strong>
                          <span>{application.role}</span>
                        </div>
                      </div>
                    </td>
                    <td className="muted hide-sm">{application.location || "—"}</td>
                    <td>
                      <StatusBadge status={application.status} />
                    </td>
                    <td className="muted hide-sm">{formatDate(application.applied_on)}</td>
                    <td>
                      {application.next_interview_at ? (
                        <span className="next-interview">
                          <CalendarClock size={15} />
                          {formatDateTime(application.next_interview_at)}
                        </span>
                      ) : (
                        <span className="muted">—</span>
                      )}
                    </td>
                    <td className="row-action">
                      <ArrowUpRight size={17} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && applications.length > 0 ? (
          <Pagination
            meta={meta}
            onPageChange={(page) => changeFilter({ page })}
          />
        ) : null}
      </section>

      <ApplicationForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSaved={() => {
          setFormOpen(false);
          setRefresh((value) => value + 1);
        }}
      />
    </div>
  );
}
