import { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import EmptyState from './EmptyState';
import LoadingState from './LoadingState';
import ReservationCard from './ReservationCard';
import ReservationDetails from './ReservationDetails';
import ConfirmModal from './ConfirmModal';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { toArabicError } from '../lib/errors';
import { toDate } from '../lib/format';

/**
 * لوحة حجوزات مشتركة (تُستخدم في صفحة الطلبات وصفحة المؤكدة).
 * getActions(reservation) يرجع الأزرار: { key, label, variant, icon, success, run, confirm? }
 */
export default function ReservationsBoard({ status, timeLabel, timeField, getActions, empty }) {
  const { reservations, loading } = useData();
  const toast = useToast();
  const location = useLocation();
  const navigate = useNavigate();

  const [selectedId, setSelectedId] = useState(null);
  const [pending, setPending] = useState(null); // { action, reservation }
  const [busyKey, setBusyKey] = useState(null);

  const list = useMemo(() => {
    const at = (r) => (toDate(r[timeField]) || toDate(r.createdAt))?.getTime() || 0;
    return reservations.filter((r) => r.status === status).sort((a, b) => at(b) - at(a));
  }, [reservations, status, timeField]);

  const selected = list.find((r) => r.id === selectedId) || null;
  const actions = selected ? getActions(selected) : [];

  // فتح حجز محدد قادم من الإشعارات أو الصفحة الرئيسية
  useEffect(() => {
    const openId = location.state?.openId;
    if (openId && !loading) {
      setSelectedId(openId);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location, loading, navigate]);

  const run = async (action, reservation) => {
    setBusyKey(action.key);
    try {
      await action.run(reservation);
      toast.success(action.success);
      setSelectedId(null);
    } catch (err) {
      toast.error(toArabicError(err));
    } finally {
      setBusyKey(null);
      setPending(null);
    }
  };

  const onAction = (action) => {
    if (action.confirm) setPending({ action, reservation: selected });
    else run(action, selected);
  };

  if (loading) return <LoadingState />;

  return (
    <>
      {list.length === 0 ? (
        <EmptyState {...empty} />
      ) : (
        <div className="grid grid-cards">
          {list.map((r) => (
            <ReservationCard
              key={r.id}
              reservation={r}
              timeLabel={timeLabel}
              timeValue={r[timeField] || r.createdAt}
              onOpen={() => setSelectedId(r.id)}
            />
          ))}
        </div>
      )}

      <ReservationDetails
        reservation={selected}
        actions={actions}
        busyKey={pending ? null : busyKey}
        onAction={onAction}
        onClose={() => setSelectedId(null)}
      />

      <ConfirmModal
        open={!!pending}
        title={pending?.action.confirm.title}
        message={pending?.action.confirm.message}
        confirmLabel={pending?.action.confirm.confirmLabel}
        danger={pending?.action.confirm.danger}
        loading={!!busyKey}
        onCancel={() => setPending(null)}
        onConfirm={() => run(pending.action, pending.reservation)}
      />
    </>
  );
}
