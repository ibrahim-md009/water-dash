import { useMemo, useState } from 'react';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Ban, CheckCheck, Coins, GlassWater, LineChart, Timer, XCircle } from 'lucide-react';
import DateFilter from '../components/DateFilter';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import StatCard from '../components/StatCard';
import { useData } from '../context/DataContext';
import { computeRangeStats } from '../lib/stats';
import { formatNumber } from '../lib/format';

function ChartTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <strong>{label}</strong>
      <span>
        {formatNumber(payload[0].value)} {unit}
      </span>
    </div>
  );
}

const AXIS = { stroke: 'var(--text-2)', fontSize: 12, tickLine: false, axisLine: false };

function ChartCard({ title, unit, dataKey, series, type, color }) {
  const common = { data: series, margin: { top: 8, right: 4, left: 4, bottom: 0 } };
  const axes = (
    <>
      <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
      <XAxis dataKey="label" reversed interval="preserveStartEnd" minTickGap={16} {...AXIS} />
      <YAxis orientation="right" width={44} allowDecimals={false} {...AXIS} />
      <Tooltip content={<ChartTooltip unit={unit} />} cursor={{ fill: 'var(--hover)' }} />
    </>
  );

  return (
    <section className="card panel chart-card">
      <header className="panel-head">
        <h2>{title}</h2>
      </header>
      <div className="chart-box" dir="ltr">
        <ResponsiveContainer width="100%" height="100%">
          {type === 'area' ? (
            <AreaChart {...common}>
              {axes}
              <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2.5} fill={color} fillOpacity={0.15} />
            </AreaChart>
          ) : (
            <BarChart {...common}>
              {axes}
              <Bar dataKey={dataKey} fill={color} radius={[6, 6, 0, 0]} maxBarSize={36} />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export default function Statistics() {
  const { reservations, settings, loading } = useData();
  const [filter, setFilter] = useState('month');

  const stats = useMemo(
    () => computeRangeStats(reservations, settings, filter),
    [reservations, settings, filter],
  );

  return (
    <div className="stack">
      <div className="toolbar">
        <DateFilter value={filter} onChange={setFilter} />
      </div>

      {loading ? (
        <LoadingState />
      ) : (
        <>
          <section className="grid grid-stats" aria-label="أرقام الفترة">
            <StatCard icon={Timer} label="إجمالي الدقائق المنجزة" value={stats.completedMinutes} unit="دقيقة" />
            <StatCard icon={GlassWater} label="إجمالي أكواب المياه" value={stats.cups} unit="كوب" />
            <StatCard icon={Coins} label="إجمالي الدخل" value={stats.income} unit="₪" />
            <StatCard icon={CheckCheck} label="الحجوزات المكتملة" value={stats.completedCount} unit="حجز" />
            <StatCard icon={Ban} label="الحجوزات الملغاة" value={stats.cancelledCount} unit="حجز" />
            <StatCard icon={XCircle} label="الطلبات المرفوضة" value={stats.rejectedCount} unit="طلب" />
          </section>

          {stats.completedCount === 0 ? (
            <EmptyState
              icon={LineChart}
              title="لا توجد حجوزات منجزة في هذه الفترة"
              text="ستظهر الرسوم البيانية بمجرد تسجيل حجوزات كمنجزة."
            />
          ) : (
            <div className="grid grid-charts">
              <ChartCard title="الدخل" unit="₪" dataKey="income" series={stats.series} type="area" color="var(--chart-1)" />
              <ChartCard title="الدقائق المنجزة" unit="دقيقة" dataKey="minutes" series={stats.series} type="bar" color="var(--chart-2)" />
              <ChartCard title="عدد الحجوزات" unit="حجز" dataKey="bookings" series={stats.series} type="bar" color="var(--chart-1)" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
