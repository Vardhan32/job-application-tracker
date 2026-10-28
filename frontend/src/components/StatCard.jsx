export default function StatCard({ label, value, hint, tone = "plain", icon: Icon }) {
  return (
    <article className={`stat-card stat-card--${tone}`}>
      <div className="stat-card__top">
        <span>{label}</span>
        {Icon ? <Icon size={18} strokeWidth={1.8} /> : null}
      </div>
      <strong className="stat-card__value">{value}</strong>
      {hint ? <span className="stat-card__hint">{hint}</span> : null}
    </article>
  );
}
