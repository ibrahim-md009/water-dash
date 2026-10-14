import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from './Modal';
import { useToast } from '../context/ToastContext';
import { toArabicError } from '../lib/errors';
import { UNLIMITED_MINUTES } from '../config/app';
import { createCustomer, saveCustomer } from '../services/customers';

/** إضافة عميل (customer = null) أو تعديل عميل موجود */
export default function CustomerModal({ open, customer, defaultLimit, onClose }) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [limit, setLimit] = useState('');
  const [blocked, setBlocked] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setName(customer?.name || '');
    setPhone(customer?.phone || '');
    setLimit(String(customer ? customer.weeklyMinutes ?? defaultLimit : defaultLimit));
    setBlocked(!!customer?.blocked);
    setError('');
  }, [open, customer, defaultLimit]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      if (customer) await saveCustomer(customer.id, { name, weeklyMinutes: limit, blocked });
      else await createCustomer({ name, phone, weeklyMinutes: limit });
      toast.success(customer ? 'تم حفظ بيانات العميل' : 'تمت إضافة العميل');
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
      title={customer ? 'تعديل العميل' : 'إضافة عميل'}
      size="md"
      busy={loading}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
            تراجع
          </button>
          <button type="submit" form="customer-form" className="btn btn-primary" disabled={loading}>
            {loading && <Loader2 size={18} className="spin" aria-hidden="true" />}
            حفظ
          </button>
        </>
      }
    >
      <form id="customer-form" className="form" onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor="cu-name">الاسم</label>
          <input id="cu-name" className="input" value={name} maxLength={100} onChange={(e) => setName(e.target.value)} disabled={loading} />
        </div>
        <div className="field">
          <label htmlFor="cu-phone">رقم الهاتف</label>
          <input
            id="cu-phone"
            className="input"
            dir="ltr"
            inputMode="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={loading || !!customer}
          />
          {customer && <span className="field-hint">الرقم هو هوية العميل ولا يمكن تعديله.</span>}
        </div>
        <div className="field">
          <label htmlFor="cu-limit">الحد الأسبوعي (بالدقائق)</label>
          <div className="inline-field">
            <input id="cu-limit" className="input" type="number" inputMode="numeric" min="0" max={UNLIMITED_MINUTES} step="1" value={limit} onChange={(e) => setLimit(e.target.value)} disabled={loading} />
            <button type="button" className="btn btn-ghost" onClick={() => setLimit(String(UNLIMITED_MINUTES))} disabled={loading}>
              بدون حد
            </button>
          </div>
          <span className="field-hint">0 = لا يستطيع الحجز. تتجدد الدقائق كل يوم سبت.</span>
        </div>
        {customer && (
          <label className="check-row">
            <input type="checkbox" checked={blocked} onChange={(e) => setBlocked(e.target.checked)} disabled={loading} />
            <span>حظر هذا العميل من الحجز</span>
          </label>
        )}
        {error && <span className="field-error">{error}</span>}
      </form>
    </Modal>
  );
}
