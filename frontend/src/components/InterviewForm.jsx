import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import api from "../api/client";
import { INTERVIEW_MODE_LABELS, OUTCOME_LABELS } from "../utils/format";
import FormField from "./FormField";
import Modal from "./Modal";

function defaultSchedule() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(10, 0, 0, 0);
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`;
}

const EMPTY_FORM = {
  round_name: "",
  scheduled_at: defaultSchedule(),
  mode: "video",
  interviewer: "",
  outcome: "pending",
  notes: "",
};

export default function InterviewForm({
  open,
  applicationId,
  interview,
  onClose,
  onSaved,
}) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) return;

    setErrors({});
    setMessage("");

    if (interview) {
      setForm({
        round_name: interview.round_name || "",
        scheduled_at: interview.scheduled_at?.slice(0, 16) || "",
        mode: interview.mode || "video",
        interviewer: interview.interviewer || "",
        outcome: interview.outcome || "pending",
        notes: interview.notes || "",
      });
    } else {
      setForm({ ...EMPTY_FORM, scheduled_at: defaultSchedule() });
    }
  }, [open, interview]);

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

    if (!form.round_name.trim()) nextErrors.round_name = "Round name is required.";
    if (!form.scheduled_at) nextErrors.scheduled_at = "Pick a date and time.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      if (interview) {
        await api.put(`/interviews/${interview.id}`, form);
      } else {
        await api.post(`/applications/${applicationId}/interviews`, form);
      }
      onSaved();
    } catch (error) {
      const body = error.response?.data;
      setErrors(body?.errors || {});
      setMessage(body?.message || "Could not save the interview.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <Modal
      title={interview ? "Edit interview" : "Schedule an interview"}
      subtitle="Keep the round, time, and outcome together with the application."
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} noValidate>
        {message ? <div className="alert alert--error">{message}</div> : null}

        <div className="form-grid">
          <FormField
            label="Round"
            htmlFor="round_name"
            required
            error={errors.round_name}
            className="span-2"
          >
            <input
              id="round_name"
              value={form.round_name}
              onChange={(event) => update("round_name", event.target.value)}
              placeholder="Technical Round 1"
              maxLength={120}
              autoFocus
            />
          </FormField>

          <FormField
            label="Date and time"
            htmlFor="scheduled_at"
            required
            error={errors.scheduled_at}
          >
            <input
              id="scheduled_at"
              type="datetime-local"
              value={form.scheduled_at}
              onChange={(event) => update("scheduled_at", event.target.value)}
            />
          </FormField>

          <FormField label="Mode" htmlFor="mode" error={errors.mode}>
            <select
              id="mode"
              value={form.mode}
              onChange={(event) => update("mode", event.target.value)}
            >
              {Object.entries(INTERVIEW_MODE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Interviewer" htmlFor="interviewer" error={errors.interviewer}>
            <input
              id="interviewer"
              value={form.interviewer}
              onChange={(event) => update("interviewer", event.target.value)}
              placeholder="Name or panel"
              maxLength={150}
            />
          </FormField>

          <FormField label="Outcome" htmlFor="outcome" error={errors.outcome}>
            <select
              id="outcome"
              value={form.outcome}
              onChange={(event) => update("outcome", event.target.value)}
            >
              {Object.entries(OUTCOME_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </FormField>

          <FormField
            label="Notes"
            htmlFor="interview_notes"
            error={errors.notes}
            className="span-2"
          >
            <textarea
              id="interview_notes"
              rows={3}
              value={form.notes}
              onChange={(event) => update("notes", event.target.value)}
              placeholder="Topics to revise, feedback, follow-ups…"
              maxLength={2000}
            />
          </FormField>
        </div>

        <div className="modal__footer">
          <button type="button" className="btn btn--ghost" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="btn btn--primary" disabled={saving}>
            {saving ? <Loader2 size={17} className="spin" /> : null}
            {interview ? "Save changes" : "Schedule interview"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
