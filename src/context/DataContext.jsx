import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { collection, doc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS, SETTINGS_DOC } from '../config/app';
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
  const [ready, setReady] = useState({ availability: false, reservations: false, paymentMethods: false, settings: false });
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
    ];

    ensureDefaults().catch(onError);
    return () => unsubs.forEach((u) => u());
  }, []);

  const value = useMemo(
    () => ({
      availability,
      reservations,
      paymentMethods,
      settings: normalizeSettings(rawSettings),
      loading: !Object.values(ready).every(Boolean),
      error,
    }),
    [availability, reservations, paymentMethods, rawSettings, ready, error],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export const useData = () => useContext(DataContext);
