import { useState } from 'react';
import { Droplets, Loader2, Plus } from 'lucide-react';
import AvailabilityCard from '../components/AvailabilityCard';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import { useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';
import { addAvailability } from '../services/availability';
import { toArabicError } from '../lib/errors';
import { calcCups, calcPrice } from '../lib/pricing';
import { formatMoney, formatNumber } from '../lib/format';

const INITIAL = { minutes: '', dateText: '', notes: '' };

export default function AddMinutes() {
  const { availability, settings, loading } = useData();
  const toast = useToast();
  const [form, setForm] = useState(INITIAL);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  const set = (key) => (e) => {
    setForm((f) => ({ ...f, [key]: e.target.value }));
    setErrors((er) => ({ ...er, [key]: undefined }));
  };

  const validate = () => {
    const er = {};
    const m = Number(form.minutes);
    if (!form.minutes || !Number.isInteger(m) || m <= 0) er.minutes = 'أدخل عدد دقائق صحيحًا أكبر من صفر.';
    if (!form.dateText.trim()) er.dateText = 'اكتب موعد التوفر، مثل: غدًا الساعة 5 مساءً.';
    setErrors(er);
    return Object.keys(er).length === 0;
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSaving(true);
    try {
      await addAvailability(form);
      toast.success(`تمت إضافة ${formatNumber(form.minutes)} دقيقة بنجاح`);
      setForm(INITIAL);
    } catch (err) {
      toast.error(toArabicError(err));
    } finally {
      setSaving(false);
    }
  };

  const recent = availability.filter((a) => a.status !== 'empty').slice(0, 12);
  const minutesNumber = Number(form.minutes);
  const showHint = Number.isInteger(minutesNumber) && minutesNumber > 0;

  return (
    <div className="stack">
      <section className="card panel">
        <header className="panel-head">
          <h2>إضافة دقائق جديدة</h2>
        </header>

        <form className="form form-grid" onSubmit={onSubmit} noValidate>
          <div className="field">
            <label htmlFor="minutes">عدد الدقائق</label>
            <input
              id="minutes"
              type="number"
              inputMode="numeric"
              min="1"
              step="1"
              className={`input ${errors.minutes ? 'invalid' : ''}`}
              placeholder="مثال: 60"
              value={form.minutes}
              onChange={set('minutes')}
              aria-invalid={!!errors.minutes}
            />
            {errors.minutes ? (
              <p className="field-error">{errors.minutes}</p>
            ) : (
              showHint && (
                <p className="field-hint">
                  = {formatNumber(calcCups(minutesNumber, settings.minutesPerCup))} كوب ·{' '}
                  {formatMoney(calcPrice(minutesNumber, settings))}
                </p>
              )
            )}
          </div>

          <div className="field">
            <label htmlFor="dateText">موعد التوفر</label>
            <input
              id="dateText"
              className={`input ${errors.dateText ? 'invalid' : ''}`}
              placeholder="مثال: غدًا الساعة 5 مساءً"
              value={form.dateText}
              onChange={set('dateText')}
              aria-invalid={!!errors.dateText}
            />
            {errors.dateText && <p className="field-error">{errors.dateText}</p>}
          </div>

          <div className="field field-wide">
            <label htmlFor="notes">
              الملاحظات <span className="optional">(اختياري)</span>
            </label>
            <textarea
              id="notes"
              className="input textarea"
              rows={3}
              placeholder="مثال: تعبئة الفترة المسائية"
              value={form.notes}
              onChange={set('notes')}
            />
          </div>

          <div className="form-actions">
            <button type="submit" className="btn btn-primary btn-lg" disabled={saving}>
              {saving ? <Loader2 size={20} className="spin" aria-hidden="true" /> : <Plus size={20} aria-hidden="true" />}
              إضافة الدقائق
            </button>
          </div>
        </form>
      </section>

      <section>
        <h2 className="section-title">آخر الدقائق المضافة</h2>
        {loading ? (
          <LoadingState />
        ) : recent.length === 0 ? (
          <EmptyState icon={Droplets} title="لم تتم إضافة دقائق بعد" text="ستظهر هنا الدقائق التي تضيفها مباشرة." />
        ) : (
          <div className="grid grid-cards">
            {recent.map((a) => (
              <AvailabilityCard key={a.id} availability={a} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
