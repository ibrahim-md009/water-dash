import { useState } from 'react';
import { Landmark, Loader2, Save } from 'lucide-react';
import { savePaymentMethod } from '../services/paymentMethods';
import { toArabicError } from '../lib/errors';
import { useToast } from '../context/ToastContext';

const FIELDS = ['name', 'logoUrl', 'accountName', 'accountNumber', 'enabled'];
const pick = (m) => ({
  name: m.name || '',
  logoUrl: m.logoUrl || '',
  accountName: m.accountName || '',
  accountNumber: m.accountNumber || '',
  enabled: !!m.enabled,
});

export default function PaymentMethodCard({ method }) {
  const toast = useToast();
  const [form, setForm] = useState(() => pick(method));
  const [saving, setSaving] = useState(false);
  const [logoFailed, setLogoFailed] = useState(false);

  const saved = pick(method);
  const dirty = FIELDS.some((k) => form[k] !== saved[k]);
  const set = (key) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    if (key === 'logoUrl') setLogoFailed(false);
    setForm((f) => ({ ...f, [key]: value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await savePaymentMethod(method.id, form);
      toast.success(`تم حفظ بيانات ${form.name.trim()}`);
    } catch (err) {
      toast.error(toArabicError(err));
    } finally {
      setSaving(false);
    }
  };

  const id = (k) => `${method.id}-${k}`;

  return (
    <form className="card payment-card" onSubmit={onSubmit}>
      <header className="payment-head">
        <span className="payment-logo">
          {form.logoUrl && !logoFailed ? (
            <img src={form.logoUrl} alt="" onError={() => setLogoFailed(true)} />
          ) : (
            <Landmark size={24} aria-hidden="true" />
          )}
        </span>
        <h3>{saved.name || method.id}</h3>
        <label className="switch" title="حالة التفعيل">
          <input type="checkbox" checked={form.enabled} onChange={set('enabled')} />
          <span className="switch-track" aria-hidden="true" />
          <span className="switch-text">{form.enabled ? 'مفعّلة' : 'معطّلة'}</span>
        </label>
      </header>

      <div className="field">
        <label htmlFor={id('name')}>اسم الطريقة</label>
        <input id={id('name')} className="input" value={form.name} onChange={set('name')} required />
      </div>
      <div className="field">
        <label htmlFor={id('logo')}>رابط الشعار</label>
        <input
          id={id('logo')}
          className="input"
          dir="ltr"
          placeholder="https://..."
          value={form.logoUrl}
          onChange={set('logoUrl')}
        />
      </div>
      <div className="field">
        <label htmlFor={id('accName')}>اسم الحساب</label>
        <input id={id('accName')} className="input" value={form.accountName} onChange={set('accountName')} />
      </div>
      <div className="field">
        <label htmlFor={id('accNum')}>رقم الحساب / الهاتف</label>
        <input
          id={id('accNum')}
          className="input"
          dir="ltr"
          inputMode="tel"
          value={form.accountNumber}
          onChange={set('accountNumber')}
        />
      </div>

      <button type="submit" className="btn btn-primary btn-block" disabled={!dirty || saving}>
        {saving ? <Loader2 size={18} className="spin" aria-hidden="true" /> : <Save size={18} aria-hidden="true" />}
        حفظ
      </button>
    </form>
  );
}
