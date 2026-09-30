import { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';
import { AlertCircle, BellRing, CheckCircle2, X } from 'lucide-react';

const ToastContext = createContext(null);
const ICONS = { success: CheckCircle2, error: AlertCircle, info: BellRing };
const TITLES = { success: 'تم بنجاح', error: 'حدث خطأ', info: 'تنبيه جديد' };
const DURATION = { success: 4000, error: 6000, info: 5000 };

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => setToasts((list) => list.filter((t) => t.id !== id)), []);

  const push = useCallback(
    (type, message) => {
      idRef.current += 1;
      const id = idRef.current;
      const ms = DURATION[type] || 4000;
      setToasts((list) => [...list.slice(-3), { id, type, message, ms }]);
      setTimeout(() => dismiss(id), ms);
    },
    [dismiss],
  );

  const api = useMemo(
    () => ({
      success: (m) => push('success', m),
      error: (m) => push('error', m),
      info: (m) => push('info', m),
    }),
    [push],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-stack" role="status" aria-live="polite">
        {toasts.map((t) => {
          const Icon = ICONS[t.type];
          return (
            <div key={t.id} className={`toast toast-${t.type}`} style={{ '--toast-ms': `${t.ms}ms` }}>
              <span className="toast-icon">
                <Icon size={20} aria-hidden="true" />
              </span>
              <div className="toast-body">
                <strong>{TITLES[t.type]}</strong>
                <span>{t.message}</span>
              </div>
              <button type="button" className="toast-close" onClick={() => dismiss(t.id)} aria-label="إغلاق">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export const useToast = () => useContext(ToastContext);
