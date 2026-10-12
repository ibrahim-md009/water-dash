import { useMemo, useState } from 'react';
import { CalendarDays, Pencil, PiggyBank, Plus, Receipt, Trash2, Wallet } from 'lucide-react';
import DateFilter from '../components/DateFilter';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import StatCard from '../components/StatCard';
import ConfirmModal from '../components/ConfirmModal';
import ExpenseModal from '../components/ExpenseModal';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { computeRangeStats, filterExpenses } from '../lib/stats';
import { toArabicError } from '../lib/errors';
import { formatDateTime, formatMoney, toDate } from '../lib/format';
import { deleteExpense } from '../services/expenses';

export default function Expenses() {
  const { reservations, settings, statsMeta, expenses, extrasError, loading } = useData();
  const toast = useToast();
  const [filter, setFilter] = useState('month');
  const [editing, setEditing] = useState(null); // null | 'new' | expense
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);

  const stats = useMemo(
    () => computeRangeStats(reservations, settings, statsMeta, filter),
    [reservations, settings, statsMeta, filter],
  );
  const list = useMemo(
    () =>
      filterExpenses(expenses, statsMeta.resetAt, filter).sort(
        (a, b) => (toDate(b.date)?.getTime() || 0) - (toDate(a.date)?.getTime() || 0),
      ),
    [expenses, statsMeta.resetAt, filter],
  );

  const onDelete = async () => {
    setBusy(true);
    try {
      await deleteExpense(deleting.id);
      toast.success('تم حذف المصروف');
      setDeleting(null);
    } catch (err) {
      toast.error(toArabicError(err));
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <LoadingState />;

  return (
    <div className="stack">
      {extrasError && (
        <ErrorState message="تعذر تحميل بعض البيانات. تأكد من نشر قواعد Firestore الجديدة (firestore.rules) ثم حدّث الصفحة." />
      )}

      <div className="toolbar">
        <DateFilter value={filter} onChange={setFilter} />
        <div className="toolbar-actions">
          <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}>
            <Plus size={18} aria-hidden="true" />
            إضافة مصروف
          </button>
        </div>
      </div>

      <section className="grid grid-stats" aria-label="ملخص المصروفات">
        <StatCard icon={Wallet} label="إجمالي المصروفات" value={stats.expenses} unit="₪" />
        <StatCard icon={PiggyBank} label="صافي الربح" value={stats.netIncome} unit="₪" hint="الدخل − المصروفات" />
      </section>

      {list.length === 0 ? (
        <EmptyState icon={Receipt} title="لا توجد مصروفات في هذه الفترة" text="أضف مصروفًا ليُخصم من الدخل في الإحصائيات." />
      ) : (
        <div className="grid grid-cards">
          {list.map((e) => (
            <article key={e.id} className="card expense-card">
              <header className="expense-head">
                <h3>{e.title}</h3>
                <strong className="expense-amount">{formatMoney(e.amount)}</strong>
              </header>
              <p className="expense-date">
                <CalendarDays size={16} aria-hidden="true" />
                <span>{formatDateTime(e.date).split('،')[0]}</span>
              </p>
              {e.note && <p className="field-hint">{e.note}</p>}
              <footer className="card-actions">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(e)}>
                  <Pencil size={16} aria-hidden="true" /> تعديل
                </button>
                <button type="button" className="btn btn-danger-ghost btn-sm" onClick={() => setDeleting(e)}>
                  <Trash2 size={16} aria-hidden="true" /> حذف
                </button>
              </footer>
            </article>
          ))}
        </div>
      )}

      <ExpenseModal open={!!editing} expense={editing === 'new' ? null : editing} onClose={() => setEditing(null)} />
      <ConfirmModal
        open={!!deleting}
        title="حذف المصروف"
        message={deleting ? `سيُحذف المصروف «${deleting.title}» (${formatMoney(deleting.amount)}) ويرجع المبلغ للدخل الصافي. متأكد؟` : ''}
        confirmLabel="نعم، احذف"
        danger
        loading={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={onDelete}
      />
    </div>
  );
}
