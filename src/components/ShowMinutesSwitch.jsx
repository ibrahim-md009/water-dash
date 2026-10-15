import { Eye, EyeOff } from 'lucide-react';

/** مفتاح التحكم بإظهار عدد الدقائق المتاحة للعميل في الموقع (يُستخدم في الإضافة والتعديل). */
export default function ShowMinutesSwitch({ checked, onChange, disabled = false }) {
  const Icon = checked ? Eye : EyeOff;
  return (
    <div className="field-visibility">
      <label className="switch">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
        />
        <span className="switch-track" aria-hidden="true" />
        <span className="switch-text">إظهار عدد الدقائق المتاحة للعميل</span>
      </label>
      <p className="field-hint">
        <Icon size={14} aria-hidden="true" />{' '}
        {checked
          ? 'سيرى العميل عدد الدقائق المتاحة في هذا الحجز.'
          : 'سيرى العميل «متوفر حجز» بدون عدد الدقائق.'}
      </p>
    </div>
  );
}
