import { useMemo, useState } from 'react';
import { Coins, Loader2, Plus, Trash2, TrendingUp, Wallet } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import DateFilter from '../components/DateFilter';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import StatCard from '../components/StatCard';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { addExpense, deleteExpense } from '../services/expenses';
import { toArabicError } from '../lib/errors';
import { STATS_FILTERS } from '../lib/constants';
import { computeRangeStats, expenseDate, expensesInRange } from '../lib/stats';
import { formatMoney } from '../lib/format';

const dateFormat = new Intl.DateTimeFormat('ar-u-nu-latn-ca-gregory', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
});

/** تاريخ اليوم بصيغة yyyy-mm-dd حسب توقيت الجهاز (قيمة input من نوع date) */
function todayInput() {
  const n = new Date();
  const pad = (v) => String(v).padStart(2, '0');
  return `${n.getFullYear()}-${pad(n.getMonth() + 1)}-${pad(n.getDate())}`;
}

/** yyyy-mm-dd -> Date في منتصف اليوم المحلي (يتفادى انزياح اليوم مع فرق التوقيت) */
function parseInputDate(value) {
  const [y, m, d] = String(value).split('-').map(Number);
  if (!y || !m || !d) return null;
  return new Date(y, m - 1, d, 12, 0, 0);
}

const initialForm = () => ({ title: '', amount: '', date: todayInput(), notes: '' });

export default function Expenses() {
  const { expenses, reservations, settings, statsMeta, loading } = useData();
  const toast = useToast();
  const [filter, setFilter] = useState('month');
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [deleteBusy, setDeleteBusy] = useState(false);

  const list = useMemo(() => expensesInRange(expenses, statsMeta, filter), [expenses, statsMeta, filter]);
  const stats = useMemo(
    () => computeRangeStats(reservations, settings, statsMeta, filter, undefined, expenses),
    [reservations, settings, statsMeta, filter, expenses],
  );
  const periodLabel = STATS_FILTERS.find((f) => f.value === filter)?.label || '';

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const validate = () => {
    const er = {};
    if (!form.title.trim()) er.title = 'اكتب بند المصروف، مثل: وقود أو صيانة.';
    const n = Number(form.amount);
    if (form.amount === '' || !Number.isFinite(n) || n <= 0) er.amount = 'أدخل مبلغًا صحيحًا أكبر من صفر.';
    if (!parseInputDate(form.date)) er.date = 'اختر تاريخ المصروف.';
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (saving || !validate()) return;
    setSaving(true);
    try {
      await addExpense({
        title: form.title,
        amount: form.amount,
        date: parseInputDate(form.date),
        notes: form.notes,
      });
      toast.success('تمت إضافة المصروف');
      setForm(initialForm());
    } catch (err) {
      toast.error(toArabicError(err));
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleting) return;
    setDeleteBusy(true);
    try {
      await deleteExpense(deleting.id);
      toast.success('تم حذف المصروف');
    } catch (err) {
      toast.error(toArabicError(err));
    } finally {
      setDeleteBusy(false);
      setDeleting(null);
    }
  };

  return (
    <div className="stack">
      <section className="card panel">
        <header className="panel-head">
          <h2>إضافة مصروف</h2>
        </header>

        <form className="form form-grid" onSubmit={onSubmit} noValidate>
          <div className="field">
            <label htmlFor="exp-title">البند</label>
            <input
              id="exp-title"
              className={`input ${errors.title ? 'invalid' : ''}`}
              placeholder="مثال: وقود، صيانة، أجرة عامل"
              maxLength={100}
              value={form.title}
              onChange={set('title')}
              aria-invalid={!!errors.title}
            />
            {errors.title && <p className="field-error">{errors.title}</p>}
          </div>

          <div className="field">
            <label htmlFor="exp-amount">المبلغ (₪)</label>
            <input
              id="exp-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="0.01"
              className={`input ${errors.amount ? 'invalid' : ''}`}
              placeholder="مثال: 50"
              value={form.amount}
              onChange={set('amount')}
              aria-invalid={!!errors.amount}
            />
            {errors.amount && <p className="field-error">{errors.amount}</p>}
          </div>

          <div className="field">
            <label htmlFor="exp-date">التاريخ</label>
            <input
              id="exp-date"
              type="date"
              dir="ltr"
              className={`input ${errors.date ? 'invalid' : ''}`}
              value={form.date}
              onChange={set('date')}
              aria-invalid={!!errors.date}
            />
            {errors.date && <p className="field-error">{errors.date}</p>}
          </div>

          <div className="field field-wide">
            <label htmlFor="exp-notes">
              ملاحظات <span className="optional">(اختياري)</span>
            </label>
            <input
              id="exp-notes"
              className="input"
              maxLength={300}
              value={form.notes}
              onChange={set('notes')}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
              {saving ? <Loader2 size={20} className="spin" aria-hidden="true" /> : <Plus size={20} aria-hidden="true" />}
              إضافة المصروف
            </button>
          </div>
        </form>
      </section>

      <div className="toolbar">
        <DateFilter value={filter} onChange={setFilter} />
      </div>

      {loading ? (
        <LoadingState />
      ) : (
        <>
          <section className="grid grid-stats" aria-label={`ملخص ${periodLabel}`}>
            <StatCard icon={Coins} label="الدخل" value={stats.income} unit="₪" />
            <StatCard icon={Wallet} label="المصاريف" value={stats.expenses} unit="₪" hint={`${stats.expensesCount} بند`} />
            <StatCard icon={TrendingUp} label="صافي الربح" value={stats.netProfit} unit="₪" hint="الدخل − المصاريف" />
          </section>

          <section className="card panel">
            <header className="panel-head">
              <h2>مصاريف {periodLabel}</h2>
            </header>
            {list.length === 0 ? (
              <EmptyState icon={Wallet} title="لا توجد مصاريف في هذه الفترة" text="أضف مصروفًا من النموذج بالأعلى." />
            ) : (
              <ul className="row-list static">
                {list.map((x) => {
                  const d = expenseDate(x);
                  return (
                    <li key={x.id}>
                      <div>
                        <span className="row-main">
                          <strong>{x.title}</strong>
                          <small>
                            {d ? dateFormat.format(d) : '—'}
                            {x.notes ? ` · ${x.notes}` : ''}
                          </small>
                        </span>
                        <span className="row-side">
                          <strong>{formatMoney(x.amount)}</strong>
                          <button
                            type="button"
                            className="btn btn-ghost btn-icon"
                            aria-label={`حذف مصروف ${x.title}`}
                            onClick={() => setDeleting(x)}
                          >
                            <Trash2 size={18} aria-hidden="true" />
                          </button>
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}

      <ConfirmModal
        open={!!deleting}
        title="حذف المصروف"
        message={deleting ? `هل أنت متأكد من حذف "${deleting.title}" (${formatMoney(deleting.amount)})؟ سيرجع هذا المبلغ إلى الأرباح.` : ''}
        confirmLabel="نعم، احذفه"
        danger
        loading={deleteBusy}
        onCancel={() => setDeleting(null)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
