import { CalendarClock, RotateCcw, StickyNote } from 'lucide-react';
import StatusBadge from './StatusBadge';
import { formatAvailabilityNumber, formatDateTime, formatMinutes, formatNumber } from '../lib/format';

export default function AvailabilityCard({ availability: a }) {
  const total = Number(a.totalMinutes) || 0;
  const pct = (n) => (total > 0 ? Math.min(100, ((Number(n) || 0) / total) * 100) : 0);

  return (
    <article className="card availability-card">
      <header className="availability-head">
        <div>
          <span className="availability-number">{formatAvailabilityNumber(a)}</span>
          <h3>{formatMinutes(total)}</h3>
        </div>
        <StatusBadge status={a.status} type="availability" />
      </header>

      <div className="progress" aria-hidden="true">
        <span className="seg seg-available" style={{ width: `${pct(a.availableMinutes)}%` }} />
        <span className="seg seg-reserved" style={{ width: `${pct(a.reservedMinutes)}%` }} />
        <span className="seg seg-done" style={{ width: `${pct(a.completedMinutes)}%` }} />
      </div>

      <dl className="availability-stats">
        <div>
          <dt>المتاح حاليًا</dt>
          <dd className="strong">{formatNumber(a.availableMinutes)}</dd>
        </div>
        <div>
          <dt>محجوز</dt>
          <dd>{formatNumber(a.reservedMinutes)}</dd>
        </div>
        <div>
          <dt>منجز</dt>
          <dd>{formatNumber(a.completedMinutes)}</dd>
        </div>
      </dl>

      <ul className="meta-list">
        <li>
          <CalendarClock size={16} aria-hidden="true" />
          <span>{a.dateText || '—'}</span>
        </li>
        {a.notes && (
          <li>
            <StickyNote size={16} aria-hidden="true" />
            <span>{a.notes}</span>
          </li>
        )}
        {a.origin === 'returned' && (
          <li className="returned">
            <RotateCcw size={16} aria-hidden="true" />
            <span>دقائق مُعادة من حجز</span>
          </li>
        )}
      </ul>

      <footer className="card-foot">أُضيفت: {formatDateTime(a.createdAt)}</footer>
    </article>
  );
}
