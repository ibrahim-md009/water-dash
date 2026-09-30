import { doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS, SETTINGS_DOC } from '../config/app';
import { AppError } from '../lib/errors';

/** حفظ سعر الكوب وعدد دقائقه (settings/general) */
export async function saveSettings({ minutesPerCup, pricePerCup }) {
  const minutes = Number(minutesPerCup);
  const price = Number(pricePerCup);
  if (!Number.isFinite(minutes) || minutes <= 0) {
    throw new AppError('أدخل عدد دقائق الكوب بقيمة أكبر من صفر.');
  }
  if (!Number.isFinite(price) || price < 0) {
    throw new AppError('أدخل سعرًا صحيحًا للكوب.');
  }
  if (minutes > 100000 || price > 100000) throw new AppError('القيمة كبيرة جدًا.');

  await setDoc(
    doc(db, COLLECTIONS.settings, SETTINGS_DOC),
    { minutesPerCup: minutes, pricePerCup: price, updatedAt: serverTimestamp() },
    { merge: true },
  );
}
