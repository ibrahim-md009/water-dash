import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { COLLECTIONS } from '../config/app';
import { AppError } from '../lib/errors';

const AuthContext = createContext(null);

const DENIED = 'هذا الحساب لا يملك صلاحية الدخول إلى لوحة التحكم.';

/** المسؤول = وجود وثيقة admins/{uid} (تُنشأ يدويًا من Firebase Console) */
async function checkAdmin(uid) {
  try {
    const snap = await getDoc(doc(db, COLLECTIONS.admins, uid));
    return snap.exists();
  } catch {
    return false;
  }
}

export function AuthProvider({ children }) {
  const [state, setState] = useState({ status: 'loading', user: null });

  useEffect(
    () =>
      onAuthStateChanged(auth, async (user) => {
        if (!user) {
          setState({ status: 'anon', user: null });
          return;
        }
        if (await checkAdmin(user.uid)) {
          setState({ status: 'authed', user });
        } else {
          await signOut(auth);
          setState({ status: 'anon', user: null });
        }
      }),
    [],
  );

  const login = useCallback(async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email.trim(), password);
    if (!(await checkAdmin(cred.user.uid))) {
      await signOut(auth);
      throw new AppError(DENIED, 'not-admin');
    }
  }, []);

  const logout = useCallback(() => signOut(auth), []);

  const value = useMemo(() => ({ ...state, login, logout }), [state, login, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
