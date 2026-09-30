import { useId, useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import Modal from './Modal';
import { useToast } from '../context/ToastContext';
import { updateReservationDetails } from '../services/reservations';
import { toArabicError } from '../lib/errors';

/** تعديل بيانات الزبون في حجز (الاسم، الهاتف، الملاحظات). استخدم key={id}. */
export default function EditReservationModal({ reservation: r, onClose }) {
  const toast = useToast();
  const formId = useId();
  const [form, setForm] = useState({ name: r.name || '', phone: r.phone || '', notes: r.notes || '' });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const validate = () => {
    const er = {};
    if (!form.name.trim()) er.name = 'الاسم مطلوب.';
    const phone = form.phone.trim();
    if (phone.length < 5 || phone.length > 20) er.phone = 'أدخل رقم هاتف صحيحًا.';
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await updateReservationDetails(r.id, form);
      toast.success('تم حفظ بيانات الزبون');
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
      title="تعديل بيانات الزبون"
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
          <label htmlFor={`${formId}-name`}>الاسم</label>
          <input
            id={`${formId}-name`}
            className={`input ${errors.name ? 'invalid' : ''}`}
            value={form.name}
            onChange={set('name')}
            aria-invalid={!!errors.name}
          />
          {errors.name && <p className="field-error">{errors.name}</p>}
        </div>

        <div className="field">
          <label htmlFor={`${formId}-phone`}>رقم الهاتف</label>
          <input
            id={`${formId}-phone`}
            className={`input ${errors.phone ? 'invalid' : ''}`}
            dir="ltr"
            inputMode="tel"
            value={form.phone}
            onChange={set('phone')}
            aria-invalid={!!errors.phone}
          />
          {errors.phone && <p className="field-error">{errors.phone}</p>}
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

        <p className="field-hint">الدقائق والسعر ووصل الدفع لا تُعدَّل من هنا. للتغيير، ارفض الحجز أو ألغِه ثم أنشئ حجزًا جديدًا.</p>
      </form>
    </Modal>
  );
}
