export const STATUS_LABELS = {
  wishlist: "Wishlist",
  applied: "Applied",
  interviewing: "Interviewing",
  offer: "Offer",
  rejected: "Rejected",
  withdrawn: "Withdrawn",
};

export const STATUS_ORDER = [
  "wishlist",
  "applied",
  "interviewing",
  "offer",
  "rejected",
  "withdrawn",
];

export const WORK_MODE_LABELS = {
  onsite: "On-site",
  hybrid: "Hybrid",
  remote: "Remote",
};

export const INTERVIEW_MODE_LABELS = {
  phone: "Phone",
  video: "Video call",
  onsite: "On-site",
};

export const OUTCOME_LABELS = {
  pending: "Pending",
  passed: "Passed",
  failed: "Failed",
  cancelled: "Cancelled",
};

export function formatDate(value) {
  if (!value) return "—";
  const date =
    typeof value === "string" && value.length === 10
      ? new Date(`${value}T00:00:00`)
      : new Date(value);
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function formatTime(value) {
  return new Date(value).toLocaleTimeString("en-IN", {
    hour: "numeric",
    minute: "2-digit",
  });
}

function lakhs(amount) {
  const value = amount / 100000;
  return `₹${Number.isInteger(value) ? value : value.toFixed(1)}L`;
}

export function formatSalary(min, max) {
  if (!min && !max) return "—";
  if (min && max) return `${lakhs(min)} – ${lakhs(max)}`;
  if (min) return `${lakhs(min)}+`;
  return `Up to ${lakhs(max)}`;
}

export function initials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");
}

export function daysFromNow(value) {
  const target = new Date(value);
  const now = new Date();
  const days = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  if (days < 0) return "Past";
  if (days === 0) return "Today";
  if (days === 1) return "Tomorrow";
  return `In ${days} days`;
}
