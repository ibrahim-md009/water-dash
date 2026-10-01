import { Timestamp, doc, runTransaction, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS, STATS_DOC } from '../config/app';
import { AppError } from '../lib/errors';

const statsRef = () => doc(db, COLLECTIONS.settings, STATS_DOC);

const KEYS = ['completedMinutes', 'cups', 'income', 'completedCount', 'cancelledCount', 'rejectedCount'];

/**
 * تعديل يدوي على الإحصائيات: يُحفظ "تصحيح" (فرق) بتاريخ الآن فوق الأرقام المحسوبة من الحجوزات.
 * لا يُعدَّل أي حجز.
 */
export async function addStatsAdjustment(delta) {
  const entry = { at: Timestamp.now() };
  let any = false;
  KEYS.forEach((k) => {
    const v = Math.round((Number(delta[k]) || 0) * 100) / 100;
    if (v !== 0) {
      entry[k] = v;
      any = true;
    }
  });
  if (!any) throw new AppError('لم تغيّر أي قيمة.');

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(statsRef());
    const list = snap.exists() ? snap.data().adjustments || [] : [];
    tx.set(statsRef(), { adjustments: [...list, entry], updatedAt: serverTimestamp() }, { merge: true });
  });
}

/** إعادة الإحصائيات للصفر: لا يُحذف أي حجز، فقط يُحسب ما بعد هذه اللحظة */
export async function resetStats() {
  await setDoc(statsRef(), { resetAt: serverTimestamp(), adjustments: [], updatedAt: serverTimestamp() });
}
