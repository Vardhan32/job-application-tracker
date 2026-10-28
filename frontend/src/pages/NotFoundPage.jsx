import { Link } from "react-router-dom";
import { Compass } from "lucide-react";

export default function NotFoundPage() {
  return (
    <div className="not-found">
      <span className="not-found__icon">
        <Compass size={30} strokeWidth={1.5} />
      </span>
      <span className="eyebrow">404</span>
      <h1>This page moved on</h1>
      <p>The link you followed does not point anywhere in the tracker.</p>
      <Link to="/" className="btn btn--primary">
        Back to applications
      </Link>
    </div>
  );
}
