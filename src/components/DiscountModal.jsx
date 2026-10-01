import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from './Modal';
import { useToast } from '../context/ToastContext';
import { toArabicError } from '../lib/errors';
import { formatMoney } from '../lib/format';
import { setReservationDiscount } from '../services/reservations';

export default function DiscountModal({ reservation: r, onClose }) {
  const toast = useToast();
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setValue(r?.discount ? String(r.discount) : '');
    setError('');
  }, [r?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!r) return null;
  const price = Number(r.price) || 0;
  const amount = Number(value);
  const valid = value !== '' && Number.isFinite(amount) && amount >= 0 && amount <= price;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!valid) {
      setError(`أدخل خصمًا بين 0 و ${formatMoney(price)}.`);
      return;
    }
    setLoading(true);
    try {
      await setReservationDiscount(r.id, amount);
      toast.success(amount > 0 ? 'تم تطبيق الخصم' : 'تمت إزالة الخصم');
      onClose();
    } catch (err) {
      setError(toArabicError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open
      onClose={onClose}
      title="عمل خصم"
      size="sm"
      busy={loading}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
            تراجع
          </button>
          <button type="submit" form="discount-form" className="btn btn-primary" disabled={loading}>
            {loading && <Loader2 size={18} className="spin" aria-hidden="true" />}
            تطبيق الخصم
          </button>
        </>
      }
    >
      <form id="discount-form" className="form" onSubmit={onSubmit} noValidate>
        <div className="price-line">
          <span>السعر الأصلي</span>
          <strong>{formatMoney(price)}</strong>
        </div>
        <div className="field">
          <label htmlFor="discount-input">قيمة الخصم (₪)</label>
          <input
            id="discount-input"
            className={`input ${error ? 'invalid' : ''}`}
            type="number"
            inputMode="decimal"
            min="0"
            max={price}
            step="any"
            autoFocus
            value={value}
            onChange={(e) => setValue(e.target.value)}
            disabled={loading}
          />
          {error && <span className="field-error">{error}</span>}
        </div>
        <div className="price-line total">
          <span>السعر بعد الخصم</span>
          <strong>{formatMoney(valid ? price - amount : price)}</strong>
        </div>
        <p className="field-hint">يُحتسب الدخل في الإحصائيات بعد الخصم عند تأكيد الحجز. ضع 0 لإزالة الخصم.</p>
      </form>
    </Modal>
  );
}
