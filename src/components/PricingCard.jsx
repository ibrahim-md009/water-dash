import { useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { saveSettings } from '../services/settings';
import { toArabicError } from '../lib/errors';
import { formatMoney, formatNumber } from '../lib/format';

export default function PricingCard() {
  const { settings } = useData();
  const toast = useToast();
  const [form, setForm] = useState({
    minutesPerCup: String(settings.minutesPerCup),
    pricePerCup: String(settings.pricePerCup),
  });
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const dirty =
    Number(form.minutesPerCup) !== settings.minutesPerCup ||
    Number(form.pricePerCup) !== settings.pricePerCup;

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const validate = () => {
    const er = {};
    const m = Number(form.minutesPerCup);
    const p = Number(form.pricePerCup);
    if (!form.minutesPerCup || !(m > 0)) er.minutesPerCup = 'أدخل قيمة أكبر من صفر.';
    if (form.pricePerCup === '' || !(p >= 0)) er.pricePerCup = 'أدخل سعرًا صحيحًا.';
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await saveSettings(form);
      toast.success('تم حفظ سعر الكوب');
    } catch (err) {
      toast.error(toArabicError(err));
    } finally {
      setSaving(false);
    }
  };

  const m = Number(form.minutesPerCup);
  const p = Number(form.pricePerCup);
  const showPreview = m > 0 && p >= 0 && form.pricePerCup !== '';

  return (
    <form className="card panel" onSubmit={onSubmit} noValidate>
      <header className="panel-head">
        <h2>سعر الكوب</h2>
      </header>

      <div className="form form-grid">
        <div className="field">
          <label htmlFor="minutesPerCup">دقائق الكوب الواحد</label>
          <input
            id="minutesPerCup"
            type="number"
            inputMode="decimal"
            min="1"
            step="any"
            className={`input ${errors.minutesPerCup ? 'invalid' : ''}`}
            value={form.minutesPerCup}
            onChange={set('minutesPerCup')}
            aria-invalid={!!errors.minutesPerCup}
          />
          {errors.minutesPerCup && <p className="field-error">{errors.minutesPerCup}</p>}
        </div>

        <div className="field">
          <label htmlFor="pricePerCup">سعر الكوب</label>
          <input
            id="pricePerCup"
            type="number"
            inputMode="decimal"
            min="0"
            step="any"
            className={`input ${errors.pricePerCup ? 'invalid' : ''}`}
            value={form.pricePerCup}
            onChange={set('pricePerCup')}
            aria-invalid={!!errors.pricePerCup}
          />
          {errors.pricePerCup && <p className="field-error">{errors.pricePerCup}</p>}
        </div>

        <div className="field field-wide">
          {showPreview && (
            <p className="field-hint">
              كل {formatNumber(m)} دقيقة = كوب بسعر {formatMoney(p)}. يسري السعر الجديد على الحجوزات الجديدة فقط،
              والحجوزات السابقة تحتفظ بسعرها.
            </p>
          )}
        </div>

        <div className="form-actions">
          <button type="submit" className="btn btn-primary" disabled={!dirty || saving}>
            {saving ? <Loader2 size={18} className="spin" aria-hidden="true" /> : <Save size={18} aria-hidden="true" />}
            حفظ
          </button>
        </div>
      </div>
    </form>
  );
}
