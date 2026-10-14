import { Eye, EyeOff } from 'lucide-react';

/** مفتاح التحكم بظهور الدقائق للعملاء في الموقع (يُستخدم في الإضافة والتعديل). */
export default function VisibilitySwitch({ checked, onChange, disabled = false }) {
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
        <span className="switch-text">إظهار الدقائق للعملاء في الموقع</span>
      </label>
      <p className="field-hint">
        {checked ? (
          <Eye size={14} aria-hidden="true" />
        ) : (
          <EyeOff size={14} aria-hidden="true" />
        )}{' '}
        {checked ? 'ستظهر للعملاء ويمكنهم حجزها.' : 'لن تظهر للعملاء حتى تفعّل الإظهار.'}
      </p>
    </div>
  );
}
