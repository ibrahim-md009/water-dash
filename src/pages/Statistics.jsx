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
import { Ban, CheckCheck, Coins, GlassWater, LineChart, Pencil, RotateCcw, Tag, Timer, XCircle } from 'lucide-react';
import DateFilter from '../components/DateFilter';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import StatCard from '../components/StatCard';
import ConfirmModal from '../components/ConfirmModal';
import EditStatsModal from '../components/EditStatsModal';
import { useToast } from '../context/ToastContext';
import { toArabicError } from '../lib/errors';
import { STATS_FILTERS } from '../lib/constants';
import { resetStats } from '../services/stats';
import { useData } from '../context/DataContext';
import { computeRangeStats } from '../lib/stats';
import { formatMoney, formatNumber } from '../lib/format';

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
  const { reservations, settings, statsMeta, loading } = useData();
  const toast = useToast();
  const [filter, setFilter] = useState('month');
  const [editing, setEditing] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [resetBusy, setResetBusy] = useState(false);

  const stats = useMemo(
    () => computeRangeStats(reservations, settings, statsMeta, filter),
    [reservations, settings, statsMeta, filter],
  );
  const periodLabel = STATS_FILTERS.find((f) => f.value === filter)?.label || '';

  const onReset = async () => {
    setResetBusy(true);
    try {
      await resetStats();
      toast.success('تمت إعادة الإحصائيات للصفر');
      setResetting(false);
    } catch (err) {
      toast.error(toArabicError(err));
    } finally {
      setResetBusy(false);
    }
  };

  return (
    <div className="stack">
      <div className="toolbar">
        <DateFilter value={filter} onChange={setFilter} />
        <div className="toolbar-actions">
          <button type="button" className="btn btn-ghost" onClick={() => setEditing(true)} disabled={loading}>
            <Pencil size={18} aria-hidden="true" />
            تعديل الإحصائيات
          </button>
          <button type="button" className="btn btn-danger" onClick={() => setResetting(true)} disabled={loading}>
            <RotateCcw size={18} aria-hidden="true" />
            إعادة للصفر
          </button>
        </div>
      </div>

      {loading ? (
        <LoadingState />
      ) : (
        <>
          <section className="grid grid-stats" aria-label="أرقام الفترة">
            <StatCard icon={Timer} label="إجمالي الدقائق المنجزة" value={stats.completedMinutes} unit="دقيقة" />
            <StatCard icon={GlassWater} label="إجمالي أكواب المياه" value={stats.cups} unit="كوب" />
            <StatCard
              icon={Coins}
              label="إجمالي الدخل"
              value={stats.income}
              unit="₪"
              hint={stats.pendingIncome > 0 ? `منه ${formatMoney(stats.pendingIncome)} مؤكد بانتظار الإنجاز` : 'يُحتسب من لحظة تأكيد الحجز'}
            />
            <StatCard icon={CheckCheck} label="الحجوزات المكتملة" value={stats.completedCount} unit="حجز" />
            <StatCard icon={Tag} label="إجمالي الخصومات" value={stats.discounts} unit="₪" />
            <StatCard icon={Ban} label="الحجوزات الملغاة" value={stats.cancelledCount} unit="حجز" />
            <StatCard icon={XCircle} label="الطلبات المرفوضة" value={stats.rejectedCount} unit="طلب" />
          </section>

          {stats.completedCount === 0 && stats.incomeCount === 0 ? (
            <EmptyState
              icon={LineChart}
              title="لا توجد حجوزات مؤكدة أو منجزة في هذه الفترة"
              text="يظهر الدخل بعد تأكيد الحجز، وتظهر الدقائق والأكواب بعد تسجيله كمنجز."
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

      <EditStatsModal open={editing} stats={stats} periodLabel={periodLabel} onClose={() => setEditing(false)} />
      <ConfirmModal
        open={resetting}
        title="إعادة الإحصائيات للصفر"
        message="ستعود كل الإحصائيات إلى الصفر (الدقائق والأكواب والدخل والخصومات والعدادات) ولن تُحسب إلا الحجوزات بعد الآن. الحجوزات نفسها لا تُحذف. هل أنت متأكد؟"
        confirmLabel="نعم، صفّر الإحصائيات"
        danger
        loading={resetBusy}
        onCancel={() => setResetting(false)}
        onConfirm={onReset}
      />
    </div>
  );
}
