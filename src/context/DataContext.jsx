import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS, SETTINGS_DOC, STATS_DOC } from '../config/app';
import { toDate } from '../lib/format';
import { toArabicError } from '../lib/errors';
import { normalizeSettings } from '../lib/pricing';
import { ensureDefaults } from '../services/paymentMethods';

const DataContext = createContext(null);

const SNAP_OPTS = { serverTimestamps: 'estimate' };
const byCreatedDesc = (a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0);

/**
 * اشتراك واحد لحظي (onSnapshot) لكل البيانات، تشاركه كل الصفحات.
 * هكذا تظهر أي إضافة أو تغيير فورًا دون إعادة تحميل.
 */
export function DataProvider({ children }) {
  const [availability, setAvailability] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [paymentMethods, setPaymentMethods] = useState([]);
  const [rawSettings, setRawSettings] = useState(null);
  const [rawStats, setRawStats] = useState(null);
  const [customers, setCustomers] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [extrasError, setExtrasError] = useState(false);
  const [ready, setReady] = useState({ availability: false, reservations: false, paymentMethods: false, settings: false, stats: false, customers: false, expenses: false });
  const [error, setError] = useState('');

  useEffect(() => {
    const markReady = (key) => setReady((r) => (r[key] ? r : { ...r, [key]: true }));
    const onError = (err) => setError(toArabicError(err));
    const mapDocs = (snap) => snap.docs.map((d) => ({ id: d.id, ...d.data(SNAP_OPTS) }));

    const unsubs = [
      onSnapshot(
        collection(db, COLLECTIONS.availability),
        (snap) => {
          setAvailability(mapDocs(snap).sort(byCreatedDesc));
          markReady('availability');
        },
        onError,
      ),
      onSnapshot(
        collection(db, COLLECTIONS.reservations),
        (snap) => {
          setReservations(mapDocs(snap).sort(byCreatedDesc));
          markReady('reservations');
        },
        onError,
      ),
      onSnapshot(
        collection(db, COLLECTIONS.paymentMethods),
        (snap) => {
          setPaymentMethods(mapDocs(snap).sort((a, b) => (a.order || 99) - (b.order || 99)));
          markReady('paymentMethods');
        },
        onError,
      ),
      onSnapshot(
        doc(db, COLLECTIONS.settings, SETTINGS_DOC),
        (snap) => {
          setRawSettings(snap.exists() ? snap.data() : null);
          markReady('settings');
        },
        onError,
      ),
      onSnapshot(
        doc(db, COLLECTIONS.settings, STATS_DOC),
        (snap) => {
          setRawStats(snap.exists() ? snap.data(SNAP_OPTS) : null);
          markReady('stats');
        },
        onError,
      ),
      // العملاء والمصروفات: إن فشلت القراءة (مثلًا القواعد لم تُنشر بعد) تبقى بقية اللوحة تعمل
      onSnapshot(
        collection(db, COLLECTIONS.customers),
        (snap) => {
          setCustomers(mapDocs(snap));
          markReady('customers');
        },
        () => {
          setExtrasError(true);
          markReady('customers');
        },
      ),
      onSnapshot(
        collection(db, COLLECTIONS.expenses),
        (snap) => {
          setExpenses(mapDocs(snap));
          markReady('expenses');
        },
        () => {
          setExtrasError(true);
          markReady('expenses');
        },
      ),
    ];

    ensureDefaults().catch(onError);
    return () => unsubs.forEach((u) => u());
  }, []);

  const statsMeta = useMemo(
    () => ({
      resetAt: toDate(rawStats?.resetAt),
      adjustments: (rawStats?.adjustments || []).map((a) => ({ ...a, at: toDate(a.at) })),
      // المصروفات تُخصم من الدخل في الإحصائيات
      expenses: expenses.map((e) => ({ ...e, date: toDate(e.date) || toDate(e.createdAt) })),
    }),
    [rawStats, expenses],
  );

  const value = useMemo(
    () => ({
      availability,
      reservations,
      paymentMethods,
      settings: normalizeSettings(rawSettings),
      statsMeta,
      customers,
      expenses,
      extrasError,
      loading: !Object.values(ready).every(Boolean),
      error,
    }),
    [availability, reservations, paymentMethods, rawSettings, statsMeta, customers, expenses, extrasError, ready, error],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => useContext(DataContext);
