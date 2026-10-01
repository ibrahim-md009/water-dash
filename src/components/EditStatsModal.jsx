import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from './Modal';
import { useToast } from '../context/ToastContext';
import { toArabicError } from '../lib/errors';
import { addStatsAdjustment } from '../services/stats';

const FIELDS = [
  { key: 'completedMinutes', label: 'إجمالي الدقائق المنجزة', unit: 'دقيقة' },
  { key: 'cups', label: 'إجمالي أكواب المياه', unit: 'كوب' },
  { key: 'income', label: 'إجمالي الدخل', unit: '₪' },
  { key: 'completedCount', label: 'الحجوزات المكتملة', unit: 'حجز' },
  { key: 'cancelledCount', label: 'الحجوزات الملغاة', unit: 'حجز' },
  { key: 'rejectedCount', label: 'الطلبات المرفوضة', unit: 'طلب' },
];

/** تعديل أرقام الفترة المعروضة: يُحفظ الفرق كتصحيح بتاريخ اليوم دون تعديل أي حجز */
export default function EditStatsModal({ open, stats, periodLabel, onClose }) {
  const toast = useToast();
  const [values, setValues] = useState({});
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setValues(Object.fromEntries(FIELDS.map((f) => [f.key, String(stats[f.key] ?? 0)])));
    setError('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    const delta = {};
    for (const f of FIELDS) {
      const next = Number(values[f.key]);
      if (values[f.key] === '' || !Number.isFinite(next) || next < 0) {
        setError(`قيمة غير صحيحة في: ${f.label}`);
        return;
      }
      delta[f.key] = next - (Number(stats[f.key]) || 0);
    }
    setError('');
    setLoading(true);
    try {
      await addStatsAdjustment(delta);
      toast.success('تم تعديل الإحصائيات');
      onClose();
    } catch (err) {
      setError(toArabicError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="تعديل الإحصائيات"
      size="md"
      busy={loading}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
            تراجع
          </button>
          <button type="submit" form="edit-stats-form" className="btn btn-primary" disabled={loading}>
            {loading && <Loader2 size={18} className="spin" aria-hidden="true" />}
            حفظ التعديل
          </button>
        </>
      }
    >
      <form id="edit-stats-form" className="form" onSubmit={onSubmit} noValidate>
        <p className="field-hint">
          أدخل الأرقام الصحيحة لـ ({periodLabel}). يُسجَّل الفرق كتصحيح بتاريخ اليوم، ولا تتغير الحجوزات نفسها.
        </p>
        {FIELDS.map((f) => (
          <div className="field" key={f.key}>
            <label htmlFor={`st-${f.key}`}>
              {f.label} <span className="optional">({f.unit})</span>
            </label>
            <input
              id={`st-${f.key}`}
              className="input"
              type="number"
              inputMode="decimal"
              min="0"
              step="any"
              value={values[f.key] ?? ''}
              onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
              disabled={loading}
            />
          </div>
        ))}
        {error && <span className="field-error">{error}</span>}
      </form>
    </Modal>
  );
}
