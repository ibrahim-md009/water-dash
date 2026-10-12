import { addDoc, collection, deleteDoc, doc, serverTimestamp, Timestamp, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from '../config/app';
import { AppError } from '../lib/errors';

function clean({ title, amount, date, note }) {
  const t = (title || '').trim();
  const value = Math.round(Number(amount) * 100) / 100;
  if (!t) throw new AppError('أدخل وصف المصروف.');
  if (t.length > 100) throw new AppError('الوصف طويل جدًا.');
  if (!Number.isFinite(value) || value <= 0) throw new AppError('أدخل مبلغًا صحيحًا أكبر من صفر.');
  if (value > 10000000) throw new AppError('المبلغ كبير جدًا.');
  // التاريخ من حقل date (YYYY-MM-DD) — نثبّته عند الظهر لتفادي انزياح اليوم بسبب فروق التوقيت
  const parts = String(date || '').split('-').map(Number);
  const d = parts.length === 3 && parts.every(Number.isFinite) ? new Date(parts[0], parts[1] - 1, parts[2], 12) : new Date();
  return { title: t, amount: value, note: (note || '').trim().slice(0, 300), date: Timestamp.fromDate(d) };
}

export async function addExpense(data) {
  await addDoc(collection(db, COLLECTIONS.expenses), {
    ...clean(data),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function updateExpense(id, data) {
  await updateDoc(doc(db, COLLECTIONS.expenses, id), { ...clean(data), updatedAt: serverTimestamp() });
}

export async function deleteExpense(id) {
  await deleteDoc(doc(db, COLLECTIONS.expenses, id));
}
