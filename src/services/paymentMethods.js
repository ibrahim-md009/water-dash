import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import {
  COLLECTIONS,
  DEFAULT_PAYMENT_METHODS,
  DEFAULT_SETTINGS,
  SETTINGS_DOC,
} from '../config/app';
import { AppError } from '../lib/errors';

/** حفظ بيانات طريقة دفع */
export async function savePaymentMethod(id, data) {
  const name = (data.name || '').trim();
  const accountNumber = (data.accountNumber || '').trim();
  if (!name) throw new AppError('اسم الطريقة مطلوب.');
  if (data.enabled && !accountNumber) {
    throw new AppError('أدخل رقم الحساب قبل تفعيل هذه الطريقة.');
  }
  await setDoc(
    doc(db, COLLECTIONS.paymentMethods, id),
    {
      name,
      logoUrl: (data.logoUrl || '').trim(),
      accountName: (data.accountName || '').trim(),
      accountNumber,
      enabled: !!data.enabled,
      updatedAt: serverTimestamp(),
    },
    { merge: true },
  );
}

/** ينشئ الإعدادات وطرق الدفع الافتراضية إن لم تكن موجودة (لا يكتب فوق شيء موجود) */
export async function ensureDefaults() {
  const settingsRef = doc(db, COLLECTIONS.settings, SETTINGS_DOC);
  if (!(await getDoc(settingsRef)).exists()) {
    await setDoc(settingsRef, { ...DEFAULT_SETTINGS, createdAt: serverTimestamp() });
  }

  await Promise.all(
    DEFAULT_PAYMENT_METHODS.map(async ({ id, name, order }) => {
      const ref = doc(db, COLLECTIONS.paymentMethods, id);
      if ((await getDoc(ref)).exists()) return;
      await setDoc(ref, {
        name,
        order,
        logoUrl: '',
        accountName: '',
        accountNumber: '',
        enabled: false,
        createdAt: serverTimestamp(),
      });
    }),
  );
}
