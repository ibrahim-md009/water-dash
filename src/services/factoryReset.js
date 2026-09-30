import { collection, doc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../firebase';
import { COLLECTIONS, COUNTERS_DOC, SETTINGS_DOC } from '../config/app';
import { ensureDefaults } from './paymentMethods';

const CHUNK = 400; // الحد الأقصى لعمليات الـ batch هو 500

/** يمسح كل وثائق مجموعة (Collection) على دفعات */
async function wipeCollection(name) {
  const snap = await getDocs(collection(db, name));
  for (let i = 0; i < snap.docs.length; i += CHUNK) {
    const batch = writeBatch(db);
    snap.docs.slice(i, i + CHUNK).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}

/**
 * ضبط المصنع: يمسح الحجوزات والدقائق وطرق الدفع والإعدادات وعدّاد الترقيم،
 * ثم يعيد القيم الافتراضية. وثائق المسؤولين (admins) لا تُمس أبدًا.
 * ملاحظة: صور الوصلات على Cloudinary لا يمكن حذفها من المتصفح وتبقى هناك.
 */
export async function factoryReset() {
  await wipeCollection(COLLECTIONS.reservations);
  await wipeCollection(COLLECTIONS.availability);
  await wipeCollection(COLLECTIONS.paymentMethods);

  const batch = writeBatch(db);
  batch.delete(doc(db, COLLECTIONS.settings, SETTINGS_DOC));
  batch.delete(doc(db, COLLECTIONS.settings, COUNTERS_DOC));
  await batch.commit();

  await ensureDefaults();
}
