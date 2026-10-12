import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import Modal from './Modal';
import { useToast } from '../context/ToastContext';
import { toArabicError } from '../lib/errors';
import { toDate } from '../lib/format';
import { addExpense, updateExpense } from '../services/expenses';

const pad = (n) => String(n).padStart(2, '0');
const toInputDate = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** إضافة/تعديل مصروف. expense = null → إضافة جديدة */
export default function ExpenseModal({ open, expense, onClose }) {
  const toast = useToast();
  const [title, setTitle] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(expense?.title || '');
    setAmount(expense ? String(expense.amount) : '');
    setDate(toInputDate(toDate(expense?.date) || new Date()));
    setNote(expense?.note || '');
    setError('');
  }, [open, expense]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);
    setError('');
    try {
      const data = { title, amount, date, note };
      if (expense) await updateExpense(expense.id, data);
      else await addExpense(data);
      toast.success(expense ? 'تم تعديل المصروف' : 'تمت إضافة المصروف');
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
      title={expense ? 'تعديل مصروف' : 'إضافة مصروف'}
      size="md"
      busy={loading}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
            تراجع
          </button>
          <button type="submit" form="expense-form" className="btn btn-primary" disabled={loading}>
            {loading && <Loader2 size={18} className="spin" aria-hidden="true" />}
            {expense ? 'حفظ' : 'إضافة'}
          </button>
        </>
      }
    >
      <form id="expense-form" className="form" onSubmit={onSubmit} noValidate>
        <div className="field">
          <label htmlFor="ex-title">وصف المصروف</label>
          <input id="ex-title" className="input" value={title} maxLength={100} placeholder="مثال: فلاتر، صيانة، وقود" onChange={(e) => setTitle(e.target.value)} disabled={loading} autoFocus />
        </div>
        <div className="field">
          <label htmlFor="ex-amount">المبلغ (₪)</label>
          <input id="ex-amount" className="input" type="number" inputMode="decimal" min="0" step="any" value={amount} onChange={(e) => setAmount(e.target.value)} disabled={loading} />
        </div>
        <div className="field">
          <label htmlFor="ex-date">التاريخ</label>
          <input id="ex-date" className="input" type="date" value={date} onChange={(e) => setDate(e.target.value)} disabled={loading} />
        </div>
        <div className="field">
          <label htmlFor="ex-note">
            ملاحظة <span className="optional">(اختياري)</span>
          </label>
          <textarea id="ex-note" className="input textarea" value={note} maxLength={300} onChange={(e) => setNote(e.target.value)} disabled={loading} />
        </div>
        {error && <span className="field-error">{error}</span>}
      </form>
    </Modal>
  );
}
