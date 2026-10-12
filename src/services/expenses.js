import { Timestamp, addDoc, collection, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS } from '../config/app';
import { AppError } from '../lib/errors';

const MAX_AMOUNT = 10000000;

/**
 * إضافة مصروف. الحقول: { title, amount, date, notes, createdAt }
 * date = تاريخ المصروف الذي يختاره المسؤول (يحدد في أي فترة يُخصم من الأرباح).
 */
export async function addExpense({ title, amount, date, notes }) {
  const t = (title || '').trim();
  if (!t) throw new AppError('اكتب بند المصروف.');

  const n = Math.round(Number(amount) * 100) / 100;
  if (!Number.isFinite(n) || n <= 0) throw new AppError('أدخل مبلغًا صحيحًا أكبر من صفر.');
  if (n > MAX_AMOUNT) throw new AppError('المبلغ كبير جدًا، تأكد من صحته.');

  const d = date instanceof Date && !Number.isNaN(date.getTime()) ? date : new Date();

  await addDoc(collection(db, COLLECTIONS.expenses), {
    title: t.slice(0, 100),
    amount: n,
    date: Timestamp.fromDate(d),
    notes: (notes || '').trim().slice(0, 300),
    createdAt: serverTimestamp(),
  });
}

export async function deleteExpense(id) {
  if (!id) throw new AppError('مصروف غير معروف.');
  await deleteDoc(doc(db, COLLECTIONS.expenses, id));
}
