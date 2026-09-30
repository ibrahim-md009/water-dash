import { AVAILABILITY_STATUS_LABELS, RESERVATION_STATUS_LABELS } from '../lib/constants';

const RESERVATION_TONES = {
  pending: 'warning',
  confirmed: 'info',
  completed: 'success',
  cancelled: 'neutral',
  rejected: 'danger',
};

const AVAILABILITY_TONES = {
  available: 'success',
  full: 'info',
  completed: 'neutral',
  empty: 'neutral',
};

export default function StatusBadge({ status, type = 'reservation' }) {
  const labels = type === 'availability' ? AVAILABILITY_STATUS_LABELS : RESERVATION_STATUS_LABELS;
  const tones = type === 'availability' ? AVAILABILITY_TONES : RESERVATION_TONES;
  return (
    <span className={`badge badge-${tones[status] || 'neutral'}`}>
      {labels[status] || status || '—'}
    </span>
  );
}
