import { useMemo, useState } from 'react';
import { DownloadCloud, Pencil, Phone, Plus, RotateCcw, Search, Trash2, UserPlus, Users } from 'lucide-react';
import ConfirmModal from '../components/ConfirmModal';
import CustomerModal from '../components/CustomerModal';
import CustomerSettingsCard from '../components/CustomerSettingsCard';
import EmptyState from '../components/EmptyState';
import ErrorState from '../components/ErrorState';
import LoadingState from '../components/LoadingState';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { RESERVATION_STATUS as S } from '../lib/constants';
import { toArabicError } from '../lib/errors';
import { toDate } from '../lib/format';
import { canonicalPhone } from '../lib/phone';
import { isSameWeek } from '../lib/week';
import { deleteCustomer, importCustomersFromReservations, resetCustomerWeek } from '../services/customers';

const norm = (s) => String(s || '').toLowerCase();

export default function Customers() {
  const { customers, reservations, settings, extrasError, loading } = useData();
  const toast = useToast();
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState(null); // null | 'new' | customer
  const [deleting, setDeleting] = useState(null);
  const [busy, setBusy] = useState(false);
  const [importing, setImporting] = useState(false);

  // عدد حجوزات كل عميل (كل الأوقات، دون المرفوضة والملغاة)
  const totals = useMemo(() => {
    const map = new Map();
    reservations.forEach((r) => {
      if ([S.REJECTED, S.CANCELLED].includes(r.status)) return;
      const id = canonicalPhone(r.phone);
      map.set(id, (map.get(id) || 0) + 1);
    });
    return map;
  }, [reservations]);

  const rows = useMemo(() => {
    const now = new Date();
    const q = norm(query).trim();
    return customers
      .map((c) => {
        const used = isSameWeek(toDate(c.lastBookingAt), now) ? Number(c.weekCount) || 0 : 0;
        return { ...c, used, remaining: Math.max(0, (Number(c.weeklyLimit) || 0) - used), total: totals.get(c.id) || 0 };
      })
      .filter((c) => !q || norm(c.name).includes(q) || c.phone.includes(q))
      .sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0));
  }, [customers, totals, query]);

  const missingCount = useMemo(() => {
    const known = new Set(customers.map((c) => c.id));
    const ids = new Set(reservations.map((r) => canonicalPhone(r.phone)).filter((id) => /^[0-9]{7,15}$/.test(id) && !known.has(id)));
    return ids.size;
  }, [customers, reservations]);

  const onImport = async () => {
    setImporting(true);
    try {
      const n = await importCustomersFromReservations(reservations, customers.map((c) => c.id), settings.defaultWeeklyLimit);
      toast.success(n > 0 ? `تم استيراد ${n} عميل` : 'لا يوجد عملاء جدد للاستيراد');
    } catch (err) {
      toast.error(toArabicError(err));
    } finally {
      setImporting(false);
    }
  };

  const onReset = async (c) => {
    try {
      await resetCustomerWeek(c.id);
      toast.success('تم تصفير عدّاد الأسبوع');
    } catch (err) {
      toast.error(toArabicError(err));
    }
  };

  const onDelete = async () => {
    setBusy(true);
    try {
      await deleteCustomer(deleting.id);
      toast.success('تم حذف العميل');
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
        <ErrorState message="تعذر تحميل بيانات العملاء. تأكد من نشر قواعد Firestore الجديدة (firestore.rules) ثم حدّث الصفحة." />
      )}

      <CustomerSettingsCard settings={settings} />

      {missingCount > 0 && (
        <div className="alert import-alert">
          <DownloadCloud size={20} aria-hidden="true" />
          <span>يوجد {missingCount} عميل في الحجوزات السابقة بدون سجل. استوردهم ليظهروا هنا ويُحسب حدّهم الأسبوعي.</span>
          <button type="button" className="btn btn-primary btn-sm" onClick={onImport} disabled={importing}>
            {importing ? 'جارٍ الاستيراد...' : 'استيراد العملاء'}
          </button>
        </div>
      )}

      <div className="toolbar">
        <label className="search-box">
          <Search size={18} aria-hidden="true" />
          <input
            type="search"
            className="input"
            placeholder="ابحث بالاسم أو الرقم"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="بحث في العملاء"
          />
        </label>
        <div className="toolbar-actions">
          <button type="button" className="btn btn-primary" onClick={() => setEditing('new')}>
            <UserPlus size={18} aria-hidden="true" />
            إضافة عميل
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <EmptyState
          icon={Users}
          title={customers.length === 0 ? 'لا يوجد عملاء بعد' : 'لا نتائج مطابقة'}
          text={customers.length === 0 ? 'يظهر العميل هنا عندما يسجّل اسمه ورقمه في الموقع.' : 'جرّب كلمة بحث أخرى.'}
        />
      ) : (
        <div className="grid grid-cards">
          {rows.map((c) => (
            <article key={c.id} className={`card customer-card ${c.blocked ? 'is-blocked' : ''}`}>
              <header className="customer-head">
                <h3>{c.name}</h3>
                {c.blocked ? <span className="badge badge-danger">محظور</span> : c.remaining === 0 ? <span className="badge badge-warning">وصل الحد</span> : <span className="badge badge-success">نشط</span>}
              </header>
              <ul className="meta-list">
                <li>
                  <Phone size={16} aria-hidden="true" />
                  <span dir="ltr">{c.phone}</span>
                </li>
              </ul>
              <div className="customer-usage">
                <div>
                  <span className="field-hint">هذا الأسبوع</span>
                  <strong>
                    {c.used} / {c.weeklyLimit >= 999 ? '∞' : c.weeklyLimit}
                  </strong>
                </div>
                <div>
                  <span className="field-hint">إجمالي الحجوزات</span>
                  <strong>{c.total}</strong>
                </div>
              </div>
              <footer className="card-actions">
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => setEditing(c)}>
                  <Pencil size={16} aria-hidden="true" /> تعديل
                </button>
                <button type="button" className="btn btn-ghost btn-sm" onClick={() => onReset(c)} disabled={c.used === 0} title="تصفير عدّاد هذا الأسبوع">
                  <RotateCcw size={16} aria-hidden="true" /> تصفير
                </button>
                <button type="button" className="btn btn-danger-ghost btn-sm" onClick={() => setDeleting(c)}>
                  <Trash2 size={16} aria-hidden="true" /> حذف
                </button>
              </footer>
            </article>
          ))}
        </div>
      )}

      <CustomerModal
        open={!!editing}
        customer={editing === 'new' ? null : editing}
        defaultLimit={settings.defaultWeeklyLimit}
        onClose={() => setEditing(null)}
      />
      <ConfirmModal
        open={!!deleting}
        title="حذف العميل"
        message={deleting ? `سيُحذف سجل «${deleting.name}». حجوزاته السابقة تبقى، وإن أراد الحجز مجددًا سيسجّل من جديد بالحد الافتراضي. متأكد؟` : ''}
        confirmLabel="نعم، احذف"
        danger
        loading={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={onDelete}
      />
    </div>
  );
}
