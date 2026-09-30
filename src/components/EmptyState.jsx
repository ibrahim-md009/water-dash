import { Inbox } from 'lucide-react';

export default function EmptyState({ icon: Icon = Inbox, title, text, action }) {
  return (
    <div className="state">
      <span className="state-icon">
        <Icon size={28} aria-hidden="true" />
      </span>
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  );
}
