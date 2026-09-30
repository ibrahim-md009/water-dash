import { Loader2 } from 'lucide-react';
import Modal from './Modal';
import ReceiptViewer from './ReceiptViewer';
import StatusBadge from './StatusBadge';
import { formatDateTime, formatMinutes, formatMoney } from '../lib/format';

function Field({ label, children }) {
  return (
    <div className="detail-field">
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}

/**
 * نافذة تفاصيل الحجز.
 * actions: [{ key, label, variant, icon }] — تُنفَّذ عبر onAction(action)
 */
export default function ReservationDetails({ reservation: r, actions = [], busyKey, onAction, onClose }) {
  const busy = !!busyKey;

  return (
    <Modal
      open={!!r}
      onClose={onClose}
      title="تفاصيل الحجز"
      size="lg"
      busy={busy}
      footer={
        actions.length > 0 && (
          <>
            {actions.map(({ key, label, variant, icon: Icon }) => (
              <button
                key={key}
                type="button"
                className={`btn btn-${variant}`}
                disabled={busy}
                onClick={() => onAction(actions.find((a) => a.key === key))}
              >
                {busyKey === key ? <Loader2 size={18} className="spin" aria-hidden="true" /> : Icon && <Icon size={18} aria-hidden="true" />}
                {label}
              </button>
            ))}
          </>
        )
      }
    >
      {r && (
        <div className="details-grid">
          <dl className="details-list">
            <Field label="الاسم">{r.name}</Field>
            <Field label="رقم الهاتف">
              <a href={`tel:${r.phone}`} dir="ltr" className="link-inline">
                {r.phone}
              </a>
            </Field>
            <Field label="عدد الدقائق">{formatMinutes(r.minutes)}</Field>
            <Field label="السعر">{formatMoney(r.price)}</Field>
            <Field label="موعد الحجز">{r.dateText || '—'}</Field>
            <Field label="الحالة">
              <StatusBadge status={r.status} />
            </Field>
            <Field label="وقت إرسال الطلب">{formatDateTime(r.createdAt)}</Field>
            {r.confirmedAt && <Field label="وقت التأكيد">{formatDateTime(r.confirmedAt)}</Field>}
            {r.notes && <Field label="ملاحظات">{r.notes}</Field>}
          </dl>

          <section className="details-receipt" aria-label="وصل الدفع">
            <h3>وصل الدفع</h3>
            <ReceiptViewer url={r.receiptUrl} variant="full" />
          </section>
        </div>
      )}
    </Modal>
  );
}
