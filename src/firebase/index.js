import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { firebaseConfig } from '../config/firebaseConfig';

export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics اختياري ولا يجب أن يكسر التطبيق إن لم يكن مدعومًا
isSupported()
  .then((ok) => ok && getAnalytics(app))
  .catch(() => {});
