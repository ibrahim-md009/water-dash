import { collection, doc, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS, SETTINGS_DOC } from '../config/app';
import { RESERVATION_STATUS as S } from '../lib/constants';
import { AppError } from '../lib/errors';
import { calcPrice, normalizeSettings } from '../lib/pricing';
import {
  availabilityRef,
  buildAvailability,
  computeAvailabilityStatus,
  newAvailabilityRef,
  readNextNumber,
  writeNumber,
} from './availability';

const reservationRef = (id) => doc(db, COLLECTIONS.reservations, id);
const STALE = 'تغيّرت حالة هذا الحجز. حدّث الصفحة وحاول مرة أخرى.';

// ─────────────────────────────────────────────────────────────
// إنشاء طلب حجز (يستخدمه الموقع الأساسي لاحقًا — لا توجد له واجهة هنا)
// يخصم الدقائق داخل Transaction: إن وصل طلبان معًا على نفس الدقائق ينجح واحد فقط.
// ─────────────────────────────────────────────────────────────
export async function createReservation({
  name,
  phone,
  minutes,
  availabilityId,
  receiptUrl = '',
  notes = '',
}) {
  const m = Number(minutes);
  if (!Number.isInteger(m) || m <= 0) throw new AppError('عدد الدقائق غير صحيح.');
  if (!name?.trim() || !phone?.trim()) throw new AppError('الاسم ورقم الهاتف مطلوبان.');

  const aRef = availabilityRef(availabilityId);
  const sRef = doc(db, COLLECTIONS.settings, SETTINGS_DOC);
  const rRef = doc(collection(db, COLLECTIONS.reservations));

  await runTransaction(db, async (tx) => {
    const aSnap = await tx.get(aRef);
    const sSnap = await tx.get(sRef);
    if (!aSnap.exists()) throw new AppError('هذه الدقائق لم تعد موجودة.');

    const a = aSnap.data();
    const available = Number(a.availableMinutes) || 0;
    if (available < m) {
      throw new AppError('لا تتوفر دقائق كافية، ربما حجزها شخص آخر للتو.');
    }

    const settings = normalizeSettings(sSnap.exists() ? sSnap.data() : null);
    const nextAvailable = available - m;
    const nextReserved = (Number(a.reservedMinutes) || 0) + m;

    tx.update(aRef, {
      availableMinutes: nextAvailable,
      reservedMinutes: nextReserved,
      status: computeAvailabilityStatus({
        ...a,
        availableMinutes: nextAvailable,
        reservedMinutes: nextReserved,
      }),
      updatedAt: serverTimestamp(),
    });

    tx.set(rRef, {
      name: name.trim(),
      phone: phone.trim(),
      minutes: m,
      price: calcPrice(m, settings),
      minutesPerCup: settings.minutesPerCup,
      pricePerCup: settings.pricePerCup,
      availabilityId,
      dateText: a.dateText || '',
      notes: notes.trim(),
      receiptUrl,
      status: S.PENDING,
      createdAt: serverTimestamp(),
    });
  });

  return rRef.id;
}

// ─────────────────────────────────────────────────────────────
// تأكيد الحجز: pending → confirmed (الدقائق تبقى محجوزة في الدفعة)
// ─────────────────────────────────────────────────────────────
export async function confirmReservation(id) {
  const rRef = reservationRef(id);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(rRef);
    if (!snap.exists()) throw new AppError('هذا الحجز غير موجود.');
    if (snap.data().status !== S.PENDING) throw new AppError(STALE);
    tx.update(rRef, {
      status: S.CONFIRMED,
      confirmedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  });
}

// ─────────────────────────────────────────────────────────────
// إنجاز الحجز: confirmed → completed
// تنتقل الدقائق من "محجوزة" إلى "منجزة" داخل نفس الدفعة.
// ─────────────────────────────────────────────────────────────
export async function completeReservation(id) {
  const rRef = reservationRef(id);
  await runTransaction(db, async (tx) => {
    const rSnap = await tx.get(rRef);
    if (!rSnap.exists()) throw new AppError('هذا الحجز غير موجود.');
    const r = rSnap.data();
    if (r.status !== S.CONFIRMED) throw new AppError(STALE);

    const minutes = Number(r.minutes) || 0;
    const aRef = r.availabilityId ? availabilityRef(r.availabilityId) : null;
    const aSnap = aRef ? await tx.get(aRef) : null;

    tx.update(rRef, {
      status: S.COMPLETED,
      completedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    if (aSnap?.exists()) {
      const a = aSnap.data();
      const reserved = Math.max(0, (Number(a.reservedMinutes) || 0) - minutes);
      const completed = (Number(a.completedMinutes) || 0) + minutes;
      tx.update(aRef, {
        reservedMinutes: reserved,
        completedMinutes: completed,
        status: computeAvailabilityStatus({ ...a, reservedMinutes: reserved }),
        updatedAt: serverTimestamp(),
      });
    }
  });
}

// ─────────────────────────────────────────────────────────────
// إعادة الدقائق: الرفض (pending → rejected) والإلغاء (confirmed → cancelled)
// الدقائق تعود كدفعة مستقلة جديدة ولا تُدمج مع الدفعة الأصلية.
// ─────────────────────────────────────────────────────────────
async function releaseReservation(id, { from, to, timeField }) {
  const rRef = reservationRef(id);
  const newRef = newAvailabilityRef();

  await runTransaction(db, async (tx) => {
    // كل القراءات أولًا
    const rSnap = await tx.get(rRef);
    if (!rSnap.exists()) throw new AppError('هذا الحجز غير موجود.');
    const r = rSnap.data();
    if (r.status !== from) throw new AppError(STALE);

    const minutes = Number(r.minutes) || 0;
    const aRef = r.availabilityId ? availabilityRef(r.availabilityId) : null;
    const aSnap = aRef ? await tx.get(aRef) : null;
    const number = await readNextNumber(tx);

    // ثم الكتابات
    tx.update(rRef, {
      status: to,
      [timeField]: serverTimestamp(),
      returnedAvailabilityId: newRef.id,
      updatedAt: serverTimestamp(),
    });

    let dateText = r.dateText || '';
    let notes = '';
    if (aSnap?.exists()) {
      const a = aSnap.data();
      dateText = a.dateText || dateText;
      notes = a.notes || '';
      const total = Math.max(0, (Number(a.totalMinutes) || 0) - minutes);
      const reserved = Math.max(0, (Number(a.reservedMinutes) || 0) - minutes);
      tx.update(aRef, {
        totalMinutes: total,
        reservedMinutes: reserved,
        status: computeAvailabilityStatus({ ...a, totalMinutes: total, reservedMinutes: reserved }),
        updatedAt: serverTimestamp(),
      });
    }

    tx.set(
      newRef,
      buildAvailability({
        number,
        minutes,
        dateText,
        notes,
        origin: 'returned',
        sourceReservationId: id,
      }),
    );
    writeNumber(tx, number);
  });
}

export const rejectReservation = (id) =>
  releaseReservation(id, { from: S.PENDING, to: S.REJECTED, timeField: 'rejectedAt' });

export const cancelReservation = (id) =>
  releaseReservation(id, { from: S.CONFIRMED, to: S.CANCELLED, timeField: 'cancelledAt' });

// ─────────────────────────────────────────────────────────────
// تعديل بيانات الزبون (الاسم، الهاتف، الملاحظات) للحجوزات غير المنتهية.
// الدقائق والسعر والوصل لا تُعدَّل من هنا حتى لا تختل حسابات الدفعات.
// ─────────────────────────────────────────────────────────────
export async function updateReservationDetails(id, { name, phone, notes }) {
  const cleanName = (name || '').trim();
  const cleanPhone = (phone || '').trim();
  if (!cleanName) throw new AppError('الاسم مطلوب.');
  if (cleanName.length > 100) throw new AppError('الاسم طويل جدًا.');
  if (cleanPhone.length < 5 || cleanPhone.length > 20) {
    throw new AppError('أدخل رقم هاتف صحيحًا (من 5 إلى 20 خانة).');
  }

  const rRef = reservationRef(id);
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(rRef);
    if (!snap.exists()) throw new AppError('هذا الحجز غير موجود.');
    const status = snap.data().status;
    if (status !== S.PENDING && status !== S.CONFIRMED) throw new AppError(STALE);
    tx.update(rRef, {
      name: cleanName,
      phone: cleanPhone,
      notes: (notes || '').trim(),
      updatedAt: serverTimestamp(),
    });
  });
}
