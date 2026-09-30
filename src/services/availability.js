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

/** يتحقق من بيانات الدفعة (الإضافة والتعديل) */
function validateBatch({ minutes, dateText }) {
  const total = Number(minutes);
  if (!Number.isInteger(total) || total <= 0) {
    throw new AppError('أدخل عدد دقائق صحيحًا أكبر من صفر.');
  }
  if (total > 100000) throw new AppError('عدد الدقائق كبير جدًا.');
  const when = (dateText || '').trim();
  if (!when) throw new AppError('أدخل موعد التوفر.');
  return { total, when };
}

/** إضافة دفعة دقائق جديدة بسجل مستقل */
export async function addAvailability({ minutes, dateText, notes }) {
  const { total, when } = validateBatch({ minutes, dateText });

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

/**
 * تعديل دفعة موجودة (الدقائق الإجمالية، الموعد، الملاحظات).
 * المحجوز والمنجز لا يتغيّران، والمتاح = الإجمالي − المحجوز − المنجز.
 * تتم العملية داخل Transaction حتى لا تتعارض مع حجز يصل في نفس اللحظة.
 */
export async function updateAvailability(id, { minutes, dateText, notes }) {
  const { total, when } = validateBatch({ minutes, dateText });
  const ref = availabilityRef(id);

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) throw new AppError('هذه الدفعة لم تعد موجودة.');

    const a = snap.data();
    const reserved = Number(a.reservedMinutes) || 0;
    const completed = Number(a.completedMinutes) || 0;
    const used = reserved + completed;
    if (total < used) {
      throw new AppError(`لا يمكن أن تقل الدقائق عن ${used} لأن هذا القدر محجوز أو منجز.`);
    }

    const available = total - used;
    tx.update(ref, {
      totalMinutes: total,
      availableMinutes: available,
      dateText: when,
      notes: (notes || '').trim(),
      status: computeAvailabilityStatus({
        totalMinutes: total,
        availableMinutes: available,
        reservedMinutes: reserved,
      }),
      updatedAt: serverTimestamp(),
    });
  });
}

/** حذف دفعة — مسموح فقط إن لم يكن فيها دقائق محجوزة أو منجزة */
export async function deleteAvailability(id) {
  const ref = availabilityRef(id);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists()) return;
    const a = snap.data();
    if ((Number(a.reservedMinutes) || 0) > 0 || (Number(a.completedMinutes) || 0) > 0) {
      throw new AppError('لا يمكن حذف دفعة فيها دقائق محجوزة أو منجزة.');
    }
    tx.delete(ref);
  });
}
