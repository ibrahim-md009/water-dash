import { useEffect, useState } from 'react';
import { AlertTriangle, Loader2 } from 'lucide-react';
import Modal from './Modal';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { toArabicError } from '../lib/errors';
import { factoryReset } from '../services/factoryReset';

const WRONG_PASSWORD = new Set(['auth/invalid-credential', 'auth/wrong-password']);

export default function FactoryResetModal({ open, onClose }) {
  const { reauthenticate } = useAuth();
  const toast = useToast();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setPassword('');
      setError('');
    }
  }, [open]);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;
    if (!password) {
      setError('أدخل كلمة السر للمتابعة.');
      return;
    }

    setError('');
    setLoading(true);

    // 1) تحقق من كلمة السر
    try {
      await reauthenticate(password);
    } catch (err) {
      setError(WRONG_PASSWORD.has(err?.code) ? 'كلمة السر غير صحيحة.' : toArabicError(err));
      setLoading(false);
      return;
    }

    // 2) تنفيذ المسح
    try {
      await factoryReset();
      toast.success('تم ضبط المصنع ومسح كل البيانات.');
      onClose();
    } catch (err) {
      console.error('factory reset failed:', err?.code, err);
      toast.error(toArabicError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="ضبط المصنع"
      size="sm"
      busy={loading}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onClose} disabled={loading}>
            تراجع
          </button>
          <button type="submit" form="factory-reset-form" className="btn btn-danger" disabled={loading}>
            {loading && <Loader2 size={18} className="spin" aria-hidden="true" />}
            {loading ? 'جاري المسح...' : 'مسح كل البيانات'}
          </button>
        </>
      }
    >
      <form id="factory-reset-form" className="form" onSubmit={onSubmit} noValidate>
        <div className="reset-warning">
          <div className="reset-warning-head">
            <AlertTriangle size={22} aria-hidden="true" />
            <span>هذا الإجراء نهائي ولا يمكن التراجع عنه.</span>
          </div>
          <ul className="reset-list">
            <li>كل الحجوزات (المعلّقة والمؤكدة والمنتهية)</li>
            <li>كل دفعات الدقائق وترقيمها</li>
            <li>سعر الكوب وطرق الدفع (ترجع للقيم الافتراضية)</li>
          </ul>
        </div>

        <div className="field">
          <label htmlFor="reset-password">كلمة السر للتأكيد</label>
          <input
            id="reset-password"
            type="password"
            className={`input ${error ? 'invalid' : ''}`}
            dir="ltr"
            autoComplete="current-password"
            autoFocus
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            disabled={loading}
          />
          {error && <span className="field-error">{error}</span>}
        </div>
      </form>
    </Modal>
  );
}
