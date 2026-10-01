import { useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { CheckCircle2, Coins, GlassWater, Hourglass, Timer, Droplets, ChevronLeft } from 'lucide-react';
import StatCard from '../components/StatCard';
import StatusBadge from '../components/StatusBadge';
import LoadingState from '../components/LoadingState';
import EmptyState from '../components/EmptyState';
import { useData } from '../context/DataContext';
import { computeOverview } from '../lib/stats';
import {
  formatAvailabilityNumber,
  formatDateTime,
  formatMinutes,
  formatMoney,
  formatNumber,
} from '../lib/format';
import { ClipboardList } from 'lucide-react';

export default function Overview() {
  const navigate = useNavigate();
  const { availability, reservations, settings, loading } = useData();

  const o = useMemo(
    () => computeOverview(availability, reservations, settings),
    [availability, reservations, settings],
  );

  if (loading) return <LoadingState />;

  const latestPending = reservations.filter((r) => r.status === 'pending').slice(0, 5);
  const latestAvailability = availability.filter((a) => a.status !== 'empty').slice(0, 5);

  return (
    <div className="stack">
      <section className="grid grid-stats" aria-label="الإحصائيات">
        <StatCard
          icon={Droplets}
          label="الدقائق المتاحة"
          value={o.availableMinutes}
          unit="دقيقة"
          hint={`في ${formatNumber(o.availableBatches)} دفعة متاحة`}
        />
        <StatCard
          icon={Hourglass}
          label="الطلبات المعلقة"
          value={o.pendingCount}
          unit="طلب"
          hint={`${formatMinutes(o.pendingMinutes)} بانتظار المراجعة`}
        />
        <StatCard
          icon={CheckCircle2}
          label="الحجوزات المؤكدة"
          value={o.confirmedCount}
          unit="حجز"
          hint={`${formatMinutes(o.confirmedMinutes)} بانتظار الإنجاز`}
        />
        <StatCard
          icon={Timer}
          label="الدقائق المنجزة"
          value={o.completedMinutes}
          unit="دقيقة"
          hint={`اليوم: ${formatMinutes(o.today.completedMinutes)}`}
          trend={o.trends.minutes}
        />
        <StatCard
          icon={GlassWater}
          label="عدد أكواب المياه"
          value={o.cups}
          unit="كوب"
          hint={`كل ${formatNumber(settings.minutesPerCup)} دقيقة = كوب`}
          trend={o.trends.cups}
        />
        <StatCard
          icon={Coins}
          label="إجمالي الدخل"
          value={o.income}
          unit="₪"
          hint={o.pendingIncome > 0 ? `منه ${formatMoney(o.pendingIncome)} بانتظار الإنجاز` : `اليوم: ${formatMoney(o.today.income)}`}
          trend={o.trends.income}
        />
      </section>

      <div className="grid grid-panels">
        <section className="card panel">
          <header className="panel-head">
            <h2>آخر طلبات الحجوزات</h2>
            <Link to="/requests" className="link-inline">
              عرض الكل <ChevronLeft size={16} aria-hidden="true" />
            </Link>
          </header>
          {latestPending.length === 0 ? (
            <EmptyState icon={ClipboardList} title="لا توجد طلبات معلقة حاليًا" />
          ) : (
            <ul className="row-list">
              {latestPending.map((r) => (
                <li key={r.id}>
                  <button type="button" onClick={() => navigate('/requests', { state: { openId: r.id } })}>
                    <span className="row-main">
                      <strong>{r.name}</strong>
                      <small>{formatDateTime(r.createdAt)}</small>
                    </span>
                    <span className="row-side">
                      <span>{formatMinutes(r.minutes)}</span>
                      <StatusBadge status={r.status} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card panel">
          <header className="panel-head">
            <h2>آخر الدقائق المضافة</h2>
            <Link to="/add-minutes" className="link-inline">
              إضافة <ChevronLeft size={16} aria-hidden="true" />
            </Link>
          </header>
          {latestAvailability.length === 0 ? (
            <EmptyState icon={Droplets} title="لم تتم إضافة دقائق بعد" />
          ) : (
            <ul className="row-list static">
              {latestAvailability.map((a) => (
                <li key={a.id}>
                  <div>
                    <span className="row-main">
                      <strong>
                        {formatAvailabilityNumber(a)} · {formatMinutes(a.totalMinutes)}
                      </strong>
                      <small>{a.dateText || '—'}</small>
                    </span>
                    <span className="row-side">
                      <span>متاح {formatNumber(a.availableMinutes)}</span>
                      <StatusBadge status={a.status} type="availability" />
                    </span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card panel income-panel">
          <header className="panel-head">
            <h2>ملخص الدخل</h2>
            <Link to="/statistics" className="link-inline">
              التفاصيل <ChevronLeft size={16} aria-hidden="true" />
            </Link>
          </header>
          <dl className="income-list">
            <div>
              <dt>اليوم</dt>
              <dd>{formatMoney(o.today.income)}</dd>
            </div>
            <div>
              <dt>هذا الأسبوع</dt>
              <dd>{formatMoney(o.week.income)}</dd>
            </div>
            <div>
              <dt>هذا الشهر</dt>
              <dd>{formatMoney(o.month.income)}</dd>
            </div>
            <div className="total">
              <dt>الإجمالي</dt>
              <dd>{formatMoney(o.income)}</dd>
            </div>
          </dl>
        </section>
      </div>
    </div>
  );
}
