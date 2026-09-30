import { STATS_FILTERS } from '../lib/constants';

export default function DateFilter({ value, onChange }) {
  return (
    <div className="segmented" role="radiogroup" aria-label="الفترة الزمنية">
      {STATS_FILTERS.map((f) => (
        <button
          key={f.value}
          type="button"
          role="radio"
          aria-checked={value === f.value}
          className={value === f.value ? 'active' : ''}
          onClick={() => onChange(f.value)}
        >
          {f.label}
        </button>
      ))}
    </div>
  );
}
