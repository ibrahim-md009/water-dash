import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS, COUNTERS_DOC } from '../config/app';
import { AVAILABILITY_STATUS } from '../lib/constants';
import { AppError } from '../lib/errors';

/** يحسب حالة الدفعة من أرقامها */
export function computeAvailabilityStatus({
  totalMinutes = 0,
  availableMinutes = 0,
  reservedMinutes = 0,
}) {
  if (totalMinutes <= 0) return AVAILABILITY_STATUS.EMPTY;
  if (availableMinutes > 0) return AVAILABILITY_STATUS.AVAILABLE;
  if (reservedMinutes > 0) return AVAILABILITY_STATUS.FULL;
  return AVAILABILITY_STATUS.COMPLETED;
}

export const availabilityRef = (id) => doc(db, COLLECTIONS.availability, id);
export const newAvailabilityRef = () => doc(collection(db, COLLECTIONS.availability));
export const countersRef = () => doc(db, COLLECTIONS.settings, COUNTERS_DOC);

/**
 * ترقيم الدفعات (#001, #002 ...). القراءة يجب أن تتم قبل أي كتابة داخل الـ Transaction.
 * readNextNumber ثم writeNumber.
 */
export async function readNextNumber(tx) {
  const snap = await tx.get(countersRef());
  return (snap.exists() ? Number(snap.data().availabilitySeq) || 0 : 0) + 1;
}

export function writeNumber(tx, number) {
  tx.set(countersRef(), { availabilitySeq: number }, { merge: true });
}

export function buildAvailability({
  number,
  minutes,
  dateText,
  notes = '',
  origin = 'admin',
  sourceReservationId = null,
}) {
  return {
    number,
    totalMinutes: minutes,
    availableMinutes: minutes,
    reservedMinutes: 0,
    completedMinutes: 0,
    dateText,
    notes,
    status: AVAILABILITY_STATUS.AVAILABLE,
    origin,
    sourceReservationId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

/** إضافة دفعة دقائق جديدة بسجل مستقل */
export async function addAvailability({ minutes, dateText, notes }) {
  const total = Number(minutes);
  if (!Number.isInteger(total) || total <= 0) {
    throw new AppError('أدخل عدد دقائق صحيحًا أكبر من صفر.');
  }
  if (total > 100000) throw new AppError('عدد الدقائق كبير جدًا.');
  const when = (dateText || '').trim();
  if (!when) throw new AppError('أدخل موعد التوفر.');

  const ref = newAvailabilityRef();
  await runTransaction(db, async (tx) => {
    const number = await readNextNumber(tx);
    tx.set(
      ref,
      buildAvailability({ number, minutes: total, dateText: when, notes: (notes || '').trim() }),
    );
    writeNumber(tx, number);
  });
  return ref.id;
}
