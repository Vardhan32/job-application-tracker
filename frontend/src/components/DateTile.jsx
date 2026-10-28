export default function DateTile({ value, subtitle }) {
  const date = new Date(value);

  return (
    <div className="date-tile">
      <span>{date.toLocaleDateString("en-IN", { month: "short" })}</span>
      <strong>{date.getDate()}</strong>
      {subtitle ? <small>{subtitle}</small> : null}
    </div>
  );
}
