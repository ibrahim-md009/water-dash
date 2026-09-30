import { TrendingDown, TrendingUp } from 'lucide-react';
import { formatNumber } from '../lib/format';

export default function StatCard({ icon: Icon, label, value, unit, hint, trend, trendLabel = 'عن الأسبوع الماضي' }) {
  const hasTrend = typeof trend === 'number';
  return (
    <article className="card stat-card">
      <div className="stat-top">
        <span className="stat-icon">
          <Icon size={22} aria-hidden="true" />
        </span>
        {hasTrend && trend !== 0 && (
          <span className={`trend ${trend > 0 ? 'up' : 'down'}`} title={trendLabel}>
            {trend > 0 ? <TrendingUp size={14} aria-hidden="true" /> : <TrendingDown size={14} aria-hidden="true" />}
            <span dir="ltr">{trend > 0 ? '+' : ''}{trend}%</span>
          </span>
        )}
      </div>
      <p className="stat-label">{label}</p>
      <p className="stat-value">
        {formatNumber(value)}
        {unit && <span className="stat-unit"> {unit}</span>}
      </p>
      {hint && <p className="stat-hint">{hint}</p>}
    </article>
  );
}
