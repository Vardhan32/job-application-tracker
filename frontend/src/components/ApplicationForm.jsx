import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import api from "../api/client";
import { STATUS_LABELS, STATUS_ORDER, WORK_MODE_LABELS } from "../utils/format";
import FormField from "./FormField";
import Modal from "./Modal";

const EMPTY_FORM = {
  company: "",
  role: "",
  location: "",
  work_mode: "onsite",
  source: "",
  status: "applied",
  applied_on: "",
  salary_min: "",
  salary_max: "",
  job_url: "",
  notes: "",
};

export default function ApplicationForm({ open, application, onClose, onSaved }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    setErrors({});
    setMessage("");

    if (application) {
      setForm({
        company: application.company || "",
        role: application.role || "",
        location: application.location || "",
        work_mode: application.work_mode || "onsite",
        source: application.source || "",
        status: application.status || "applied",
        applied_on: application.applied_on || "",
        salary_min: application.salary_min ?? "",
        salary_max: application.salary_max ?? "",
        job_url: application.job_url || "",
        notes: application.notes || "",
      });
    } else {
      setForm(EMPTY_FORM);
    }
  }, [open, application]);

  function update(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
    setErrors((previous) => {
      if (!previous[field]) return previous;
      const next = { ...previous };
      delete next[field];
      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    const nextErrors = {};

    if (!form.company.trim()) nextErrors.company = "Company is required.";
    if (!form.role.trim()) nextErrors.role = "Role is required.";
    if (
      form.salary_min !== "" &&
      form.salary_max !== "" &&
      Number(form.salary_min) > Number(form.salary_max)
    ) {
      nextErrors.salary_max = "Maximum salary must be greater than the minimum.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    setMessage("");

    const payload = {
      ...form,
      company: form.company.trim(),
      role: form.role.trim(),
      salary_min: form.salary_min === "" ? null : Number(form.salary_min),
      salary_max: form.salary_max === "" ? null : Number(form.salary_max),
    };

    try {
      if (application) {
        await api.put(`/applications/${application.id}`, payload);
      } else {
        await api.post("/applications", payload);
      }
      onSaved();
    } catch (error) {
      const body = error.response?.data;
      setErrors(body?.errors || {});
      setMessage(body?.message || "Could not save the application.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <Modal
      title={application ? "Edit application" : "New application"}
      subtitle={
        application
          ? "Update the role details or move it to another stage."
          : "Add a role you have applied to, or one you want to keep an eye on."
      }
      onClose={onClose}
      wide
    >
      <form onSubmit={handleSubmit} noValidate>
        {message ? <div className="alert alert--error">{message}</div> : null}

        <div className="form-grid">
          <FormField label="Company" htmlFor="company" required error={errors.company}>
            <input
              id="company"
              value={form.company}
              onChange={(event) => update("company", event.target.value)}
              placeholder="Zoho"
              maxLength={150}
              autoFocus
            />
          </FormField>

          <FormField label="Role" htmlFor="role" required error={errors.role}>
            <input
              id="role"
              value={form.role}
              onChange={(event) => update("role", event.target.value)}
              placeholder="Backend Developer"
              maxLength={150}
            />
          </FormField>

          <FormField label="Location" htmlFor="location" error={errors.location}>
            <input
              id="location"
              value={form.location}
              onChange={(event) => update("location", event.target.value)}
              placeholder="Chennai"
              maxLength={120}
            />
          </FormField>

          <FormField label="Work mode" htmlFor="work_mode" error={errors.work_mode}>
            <select
              id="work_mode"
              value={form.work_mode}
              onChange={(event) => update("work_mode", event.target.value)}
            >
              {Object.entries(WORK_MODE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Status" htmlFor="status" error={errors.status}>
            <select
              id="status"
              value={form.status}
              onChange={(event) => update("status", event.target.value)}
            >
              {STATUS_ORDER.map((value) => (
                <option key={value} value={value}>
                  {STATUS_LABELS[value]}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Applied on" htmlFor="applied_on" error={errors.applied_on}>
            <input
              id="applied_on"
              type="date"
              value={form.applied_on}
              onChange={(event) => update("applied_on", event.target.value)}
            />
          </FormField>

          <FormField label="Minimum salary (₹/year)" htmlFor="salary_min" error={errors.salary_min}>
            <input
              id="salary_min"
              type="number"
              min="0"
              step="10000"
              value={form.salary_min}
              onChange={(event) => update("salary_min", event.target.value)}
              placeholder="900000"
            />
          </FormField>

          <FormField label="Maximum salary (₹/year)" htmlFor="salary_max" error={errors.salary_max}>
            <input
              id="salary_max"
              type="number"
              min="0"
              step="10000"
              value={form.salary_max}
              onChange={(event) => update("salary_max", event.target.value)}
              placeholder="1200000"
            />
          </FormField>

          <FormField
            label="Source"
            htmlFor="source"
            error={errors.source}
            className="span-2"
          >
            <input
              id="source"
              value={form.source}
              onChange={(event) => update("source", event.target.value)}
              placeholder="LinkedIn, referral, company site…"
              maxLength={80}
            />
          </FormField>

          <FormField
            label="Job posting URL"
            htmlFor="job_url"
            error={errors.job_url}
            className="span-2"
          >
            <input
              id="job_url"
              type="url"
              value={form.job_url}
              onChange={(event) => update("job_url", event.target.value)}
              placeholder="https://company.com/careers/backend-developer"
              maxLength={500}
            />
          </FormField>

          <FormField
            label="Notes"
            htmlFor="notes"
            error={errors.notes}
            className="span-2"
          >
            <textarea
              id="notes"
              rows={4}
              value={form.notes}
              onChange={(event) => update("notes", event.target.value)}
              placeholder="Recruiter name, referral, prep notes…"
              maxLength={5000}
            />
          </FormField>
        </div>

        <div className="modal__footer">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? <Loader2 size={17} className="spin" /> : null}
            {application ? "Save changes" : "Add application"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
