import { useEffect, useState } from 'react';
import { Loader2, ShieldCheck } from 'lucide-react';
import ConfirmModal from './ConfirmModal';
import { useToast } from '../context/ToastContext';
import { toArabicError } from '../lib/errors';
import { saveCustomerSettings } from '../services/customers';

/** الحد الأسبوعي الافتراضي + مفتاح إلزام التسجيل (settings/general) */
export default function CustomerSettingsCard({ settings }) {
  const toast = useToast();
  const [limit, setLimit] = useState(String(settings.defaultWeeklyLimit));
  const [saving, setSaving] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [toggling, setToggling] = useState(false);

  useEffect(() => setLimit(String(settings.defaultWeeklyLimit)), [settings.defaultWeeklyLimit]);

  const saveLimit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      await saveCustomerSettings({ defaultWeeklyLimit: limit });
      toast.success('تم حفظ الحد الافتراضي');
    } catch (err) {
      toast.error(toArabicError(err));
    } finally {
      setSaving(false);
    }
  };

  const setRequire = async (value) => {
    setToggling(true);
    try {
      await saveCustomerSettings({ requireCustomer: value });
      toast.success(value ? 'تم تفعيل إلزام التسجيل والحد الأسبوعي' : 'تم إيقاف الإلزام');
      setConfirming(false);
    } catch (err) {
      toast.error(toArabicError(err));
    } finally {
      setToggling(false);
    }
  };

  return (
    <section className="card panel">
      <header className="panel-head">
        <h2>إعدادات العملاء</h2>
      </header>

      <form className="form" onSubmit={saveLimit}>
        <div className="field">
          <label htmlFor="def-limit">الحد الأسبوعي الافتراضي للعميل الجديد</label>
          <div className="inline-field">
            <input id="def-limit" className="input" type="number" inputMode="numeric" min="0" max="999" step="1" value={limit} onChange={(e) => setLimit(e.target.value)} disabled={saving} />
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving && <Loader2 size={18} className="spin" aria-hidden="true" />}
              حفظ
            </button>
          </div>
          <span className="field-hint">يُطبَّق على من يسجّل بعد الآن. العملاء الحاليون لا يتغير حدّهم.</span>
        </div>
      </form>

      <div className={`enforce-box ${settings.requireCustomer ? 'on' : ''}`}>
        <ShieldCheck size={22} aria-hidden="true" />
        <div>
          <strong>إلزام التسجيل والحد الأسبوعي: {settings.requireCustomer ? 'مفعّل' : 'غير مفعّل'}</strong>
          <p className="field-hint">
            {settings.requireCustomer
              ? 'لا يُقبل أي حجز إلا من عميل مسجّل وضمن حدّه الأسبوعي.'
              : 'فعّله بعد نشر الموقع الجديد. قبل ذلك يستمر الموقع القديم بالعمل بشكل طبيعي.'}
          </p>
        </div>
        <button
          type="button"
          className={`btn ${settings.requireCustomer ? 'btn-ghost' : 'btn-primary'}`}
          onClick={() => (settings.requireCustomer ? setRequire(false) : setConfirming(true))}
          disabled={toggling}
        >
          {settings.requireCustomer ? 'إيقاف' : 'تفعيل'}
        </button>
      </div>

      <ConfirmModal
        open={confirming}
        title="تفعيل إلزام التسجيل"
        message="بعد التفعيل لن يُقبل أي حجز إلا من الموقع الجديد (عميل مسجّل وضمن حدّه). تأكد أنك نشرت الموقع الجديد واستوردت العملاء الحاليين. متابعة؟"
        confirmLabel="نعم، فعّل"
        loading={toggling}
        onCancel={() => setConfirming(false)}
        onConfirm={() => setRequire(true)}
      />
    </section>
  );
}
