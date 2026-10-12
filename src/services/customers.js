import { doc, getDoc, serverTimestamp, setDoc, updateDoc, deleteDoc, Timestamp, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS, SETTINGS_DOC } from '../config/app';
import { AppError } from '../lib/errors';
import { toDate } from '../lib/format';
import { canonicalPhone, validatePhone } from '../lib/phone';
import { RESERVATION_STATUS as S } from '../lib/constants';
import { weekIndex } from '../lib/week';

const customerRef = (id) => doc(db, COLLECTIONS.customers, id);
const CHUNK = 400;

function cleanLimit(value) {
  const n = Number(value);
  if (!Number.isInteger(n) || n < 0 || n > 999) throw new AppError('الحد الأسبوعي يجب أن يكون رقمًا صحيحًا من 0 إلى 999.');
  return n;
}

/** إضافة عميل يدويًا من المسؤول */
export async function createCustomer({ name, phone, weeklyLimit }) {
  const cleanName = (name || '').trim();
  if (!cleanName) throw new AppError('الاسم مطلوب.');
  if (cleanName.length > 100) throw new AppError('الاسم طويل جدًا.');
  const phoneError = validatePhone(phone);
  if (phoneError) throw new AppError(phoneError);
  const id = canonicalPhone(phone);
  if ((await getDoc(customerRef(id))).exists()) throw new AppError('هذا الرقم مسجّل مسبقًا.');

  await setDoc(customerRef(id), {
    name: cleanName,
    phone: id,
    weeklyLimit: cleanLimit(weeklyLimit),
    blocked: false,
    weekCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

/** تعديل الاسم والحد الأسبوعي والحظر (الرقم هو المعرّف ولا يُعدَّل) */
export async function saveCustomer(id, { name, weeklyLimit, blocked }) {
  const cleanName = (name || '').trim();
  if (!cleanName) throw new AppError('الاسم مطلوب.');
  if (cleanName.length > 100) throw new AppError('الاسم طويل جدًا.');
  await updateDoc(customerRef(id), {
    name: cleanName,
    weeklyLimit: cleanLimit(weeklyLimit),
    blocked: !!blocked,
    updatedAt: serverTimestamp(),
  });
}

/** تصفير عدّاد هذا الأسبوع للعميل */
export async function resetCustomerWeek(id) {
  await updateDoc(customerRef(id), { weekCount: 0, updatedAt: serverTimestamp() });
}

export async function deleteCustomer(id) {
  await deleteDoc(customerRef(id));
}

/** إعدادات العملاء: الحد الافتراضي + إلزام التسجيل (settings/general) */
export async function saveCustomerSettings({ defaultWeeklyLimit, requireCustomer }) {
  const patch = { updatedAt: serverTimestamp() };
  if (defaultWeeklyLimit !== undefined) patch.defaultWeeklyLimit = cleanLimit(defaultWeeklyLimit);
  if (requireCustomer !== undefined) patch.requireCustomer = !!requireCustomer;
  await setDoc(doc(db, COLLECTIONS.settings, SETTINGS_DOC), patch, { merge: true });
}

/**
 * ينشئ سجلات للعملاء الموجودين في الحجوزات السابقة (ولا يلمس أي سجل موجود).
 * عدّاد الأسبوع يُحسب من حجوزاتهم الفعلية هذا الأسبوع (قيد المراجعة/مؤكدة/منجزة).
 * يعيد عدد السجلات الجديدة.
 */
export async function importCustomersFromReservations(reservations, existingIds, defaultWeeklyLimit) {
  const known = new Set(existingIds);
  const nowWeek = weekIndex(new Date());
  const groups = new Map();

  reservations.forEach((r) => {
    const id = canonicalPhone(r.phone);
    if (!/^[0-9]{7,15}$/.test(id) || known.has(id)) return;
    const created = toDate(r.createdAt);
    let g = groups.get(id);
    if (!g) {
      g = { name: '', nameAt: 0, count: 0, last: null };
      groups.set(id, g);
    }
    const at = created?.getTime() || 0;
    if (r.name && at >= g.nameAt) {
      g.name = String(r.name).trim().slice(0, 100);
      g.nameAt = at;
    }
    const counts = [S.PENDING, S.CONFIRMED, S.COMPLETED].includes(r.status);
    if (counts && created && weekIndex(created) === nowWeek) {
      g.count += 1;
      if (!g.last || created > g.last) g.last = created;
    }
  });

  const entries = [...groups.entries()].filter(([, g]) => g.name);
  for (let i = 0; i < entries.length; i += CHUNK) {
    const batch = writeBatch(db);
    entries.slice(i, i + CHUNK).forEach(([id, g]) => {
      const data = {
        name: g.name,
        phone: id,
        weeklyLimit: cleanLimit(defaultWeeklyLimit),
        blocked: false,
        weekCount: g.count,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (g.last) data.lastBookingAt = Timestamp.fromDate(g.last);
      batch.set(customerRef(id), data);
    });
    await batch.commit();
  }
  return entries.length;
}
