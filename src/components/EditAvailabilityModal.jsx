import { useId, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import Modal from './Modal';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { updateAvailability } from '../services/availability';
import { toArabicError } from '../lib/errors';
import { calcCups, calcPrice } from '../lib/pricing';
import { formatAvailabilityNumber, formatMoney, formatNumber } from '../lib/format';

/** تعديل دفعة دقائق. يُعرض فقط عند وجود دفعة؛ استخدم key={id} ليُعاد ضبط الحقول. */
export default function EditAvailabilityModal({ availability: a, onClose }) {
  const toast = useToast();
  const { settings } = useData();
  const formId = useId();
  const [form, setForm] = useState({
    minutes: String(a.totalMinutes ?? ''),
    dateText: a.dateText || '',
    notes: a.notes || '',
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const used = (Number(a.reservedMinutes) || 0) + (Number(a.completedMinutes) || 0);
  const minutesNumber = Number(form.minutes);
  const validMinutes = Number.isInteger(minutesNumber) && minutesNumber > 0;

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const validate = () => {
    const er = {};
    if (!validMinutes) er.minutes = 'أدخل عدد دقائق صحيحًا أكبر من صفر.';
    else if (minutesNumber < used) er.minutes = `لا يمكن أن تقل عن ${formatNumber(used)} دقيقة (محجوزة أو منجزة).`;
    if (!form.dateText.trim()) er.dateText = 'اكتب موعد التوفر.';
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await updateAvailability(a.id, form);
      toast.success('تم حفظ التعديلات');
      onClose();
    } catch (err) {
      toast.error(toArabicError(err));
      setSaving(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title={`تعديل الدفعة ${formatAvailabilityNumber(a)}`}
      size="md"
      busy={saving}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>
            تراجع
          </button>
          <button type="submit" form={formId} className="btn btn-primary" disabled={saving}>
            {saving ? <Loader2 size={18} className="spin" aria-hidden="true" /> : <Save size={18} aria-hidden="true" />}
            حفظ التعديلات
          </button>
        </>
      }
    >
      <form id={formId} className="form" onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor={`${formId}-minutes`}>إجمالي الدقائق</label>
          <input
            id={`${formId}-minutes`}
            type="number"
            inputMode="numeric"
            min="1"
            step="1"
            className={`input ${errors.minutes ? 'invalid' : ''}`}
            value={form.minutes}
            onChange={set('minutes')}
            aria-invalid={!!errors.minutes}
          />
          {errors.minutes ? (
            <p className="field-error">{errors.minutes}</p>
          ) : (
            validMinutes && (
              <p className="field-hint">
                = {formatNumber(calcCups(minutesNumber, settings.minutesPerCup))} كوب ·{' '}
                {formatMoney(calcPrice(minutesNumber, settings))}
              </p>
            )
          )}
          {used > 0 && (
            <p className="field-hint">
              منها {formatNumber(used)} دقيقة محجوزة أو منجزة، والمتاح بعد التعديل:{' '}
              {formatNumber(Math.max(0, minutesNumber - used) || 0)}
            </p>
          )}
        </div>

        <div className="field">
          <label htmlFor={`${formId}-date`}>موعد التوفر</label>
          <input
            id={`${formId}-date`}
            className={`input ${errors.dateText ? 'invalid' : ''}`}
            value={form.dateText}
            onChange={set('dateText')}
            aria-invalid={!!errors.dateText}
          />
          {errors.dateText && <p className="field-error">{errors.dateText}</p>}
          <p className="field-hint">الحجوزات السابقة تحتفظ بالموعد الذي حُجزت عليه.</p>
        </div>

        <div className="field">
          <label htmlFor={`${formId}-notes`}>
            الملاحظات <span className="optional">(اختياري)</span>
          </label>
          <textarea
            id={`${formId}-notes`}
            className="input textarea"
            rows={3}
            value={form.notes}
            onChange={set('notes')}
          />
        </div>
      </form>
    </Modal>
  );
}
