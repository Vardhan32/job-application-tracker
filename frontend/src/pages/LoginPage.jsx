import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import FormField from "../components/FormField";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSubmitting(true);

    try {
      await login(email.trim(), password);
      navigate("/", { replace: true });
    } catch (requestError) {
      setError(
        requestError.response?.data?.message || "Could not sign in. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  }

  function fillDemo() {
    setEmail("demo@jobtracker.dev");
    setPassword("demo1234");
    setError("");
  }

  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <Link to="/login" className="brand brand--light">
          <span className="brand__mark brand__mark--light">T</span>
          <span className="brand__name">Tracker</span>
        </Link>

        <div className="auth-aside__copy">
          <span className="eyebrow eyebrow--light">Job search, organized</span>
          <h1>
            Every application.
            <br />
            One clear pipeline.
          </h1>
          <p>
            Log roles, keep interview notes, and see where each conversation stands.
            No more digging through spreadsheets and old emails.
          </p>
        </div>

        <div className="aside-board">
          <div className="aside-board__header">
            <span>This week</span>
            <span>6 active</span>
          </div>
          <div className="aside-row">
            <span className="status-dot status-dot--amber" />
            <div>
              <strong>Zoho</strong>
              <span>Technical Round 2 · tomorrow</span>
            </div>
            <span className="aside-tag">Interview</span>
          </div>
          <div className="aside-row">
            <span className="status-dot status-dot--green" />
            <div>
              <strong>Postman</strong>
              <span>Offer received · 2 days ago</span>
            </div>
            <span className="aside-tag">Offer</span>
          </div>
          <div className="aside-row">
            <span className="status-dot status-dot--blue" />
            <div>
              <strong>Freshworks</strong>
              <span>Application sent · 4 days ago</span>
            </div>
            <span className="aside-tag">Applied</span>
          </div>
        </div>
      </aside>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-mobile-brand">
            <span className="brand__mark">T</span>
            <span className="brand__name">Tracker</span>
          </div>

          <h2>Welcome back</h2>
          <p className="auth-sub">Sign in to pick up where you left off.</p>

          {error ? <div className="alert alert--error">{error}</div> : null}

          <form onSubmit={handleSubmit} noValidate>
            <FormField label="Email" htmlFor="email">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                required
              />
            </FormField>

            <FormField label="Password" htmlFor="password">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </FormField>

            <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
              {submitting ? <Loader2 size={18} className="spin" /> : null}
              Sign in
              {submitting ? null : <ArrowRight size={18} />}
            </button>
          </form>

          <button type="button" className="demo-link" onClick={fillDemo}>
            Fill demo credentials
          </button>

          <p className="auth-switch">
            New here? <Link to="/register">Create an account</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
