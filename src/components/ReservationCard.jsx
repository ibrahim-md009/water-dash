import { CalendarClock, Clock, Phone } from 'lucide-react';
import StatusBadge from './StatusBadge';
import ReceiptViewer from './ReceiptViewer';
import { formatDateTime, formatMinutes, formatMoney } from '../lib/format';

export default function ReservationCard({ reservation: r, timeLabel, timeValue, onOpen }) {
  return (
    <article
      className="card reservation-card clickable"
      onClick={onOpen}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen())}
      tabIndex={0}
      role="button"
      aria-label={`تفاصيل حجز ${r.name}`}
    >
      <div className="reservation-main">
        <div className="reservation-info">
          <header className="reservation-head">
            <h3>{r.name}</h3>
            <StatusBadge status={r.status} />
          </header>
          <ul className="meta-list">
            <li>
              <Phone size={16} aria-hidden="true" />
              <span dir="ltr">{r.phone}</span>
            </li>
            <li>
              <CalendarClock size={16} aria-hidden="true" />
              <span>{r.dateText || '—'}</span>
            </li>
            <li>
              <Clock size={16} aria-hidden="true" />
              <span>
                {timeLabel}: {formatDateTime(timeValue)}
              </span>
            </li>
          </ul>
        </div>
        <ReceiptViewer url={r.receiptUrl} variant="thumb" />
      </div>
      <footer className="reservation-foot">
        <span className="reservation-minutes">{formatMinutes(r.minutes)}</span>
        <span className="reservation-price">{formatMoney(r.price)}</span>
      </footer>
    </article>
  );
}
