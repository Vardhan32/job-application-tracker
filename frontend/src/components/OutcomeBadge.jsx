import { OUTCOME_LABELS } from "../utils/format";

export default function OutcomeBadge({ outcome }) {
  return (
    <span className={`badge badge--outcome-${outcome}`}>
      {OUTCOME_LABELS[outcome] || outcome}
    </span>
  );
}
