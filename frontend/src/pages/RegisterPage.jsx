import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "../auth/AuthContext";
import FormField from "../components/FormField";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  function update(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => ({ ...previous, [field]: undefined }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};

    if (!form.name.trim()) nextErrors.name = "Your name is required.";
    if (!form.email.trim()) nextErrors.email = "Email is required.";
    if (form.password.length < 8) {
      nextErrors.password = "Use at least 8 characters.";
    }
    if (form.password !== form.confirm) {
      nextErrors.confirm = "Passwords do not match.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setError("");
    setSubmitting(true);

    try {
      await register(form.name.trim(), form.email.trim(), form.password);
      navigate("/", { replace: true });
    } catch (requestError) {
      const body = requestError.response?.data;
      if (body?.errors) setErrors(body.errors);
      setError(body?.message || "Could not create the account.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="auth-page">
      <aside className="auth-aside">
        <Link to="/login" className="brand brand--light">
          <span className="brand__mark brand__mark--light">T</span>
          <span className="brand__name">Tracker</span>
        </Link>

        <div className="auth-aside__copy">
          <span className="eyebrow eyebrow--light">A calmer search</span>
          <h1>
            Treat your job search
            <br />
            like a project.
          </h1>
          <p>
            Keep the pipeline, conversations, and next steps in one place. A small
            amount of structure goes a long way when you are applying every week.
          </p>
        </div>

        <ul className="auth-points">
          <li>Track every stage from wishlist to offer</li>
          <li>Schedule interview rounds with notes</li>
          <li>Search and filter your whole pipeline</li>
        </ul>
      </aside>

      <section className="auth-panel">
        <div className="auth-card">
          <div className="auth-mobile-brand">
            <span className="brand__mark">T</span>
            <span className="brand__name">Tracker</span>
          </div>

          <h2>Create your account</h2>
          <p className="auth-sub">Start with one application. Add the rest as you go.</p>

          {error ? <div className="alert alert--error">{error}</div> : null}

          <form onSubmit={handleSubmit} noValidate>
            <FormField label="Name" htmlFor="name" error={errors.name}>
              <input
                id="name"
                value={form.name}
                onChange={(event) => update("name", event.target.value)}
                placeholder="Your name"
                autoComplete="name"
                maxLength={100}
              />
            </FormField>

            <FormField label="Email" htmlFor="email" error={errors.email}>
              <input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) => update("email", event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
              />
            </FormField>

            <FormField label="Password" htmlFor="password" error={errors.password}>
              <input
                id="password"
                type="password"
                value={form.password}
                onChange={(event) => update("password", event.target.value)}
                placeholder="At least 8 characters"
                autoComplete="new-password"
              />
            </FormField>

            <FormField label="Confirm password" htmlFor="confirm" error={errors.confirm}>
              <input
                id="confirm"
                type="password"
                value={form.confirm}
                onChange={(event) => update("confirm", event.target.value)}
                placeholder="Repeat your password"
                autoComplete="new-password"
              />
            </FormField>

            <button type="submit" className="btn btn--primary btn--block" disabled={submitting}>
              {submitting ? <Loader2 size={18} className="spin" /> : null}
              Create account
              {submitting ? null : <ArrowRight size={18} />}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
