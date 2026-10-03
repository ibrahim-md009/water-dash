import { WEEK_START_DAY } from '../config/app';
import { AVAILABILITY_STATUS, RESERVATION_STATUS } from './constants';
import { toDate } from './format';
import { calcCups, discountOf, finalPrice } from './pricing';

const DAY = 24 * 60 * 60 * 1000;
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
const round2 = (n) => Math.round(n * 100) / 100;

/**
 * قواعد الاحتساب:
 *  - الدخل (بعد الخصم): يُحسب لحظة التأكيد (مؤكد + منجز) بتاريخ التأكيد.
 *  - الدقائق والأكواب والحجوزات المكتملة: عند "منجز" فقط بتاريخ الإنجاز.
 *  - الملغاة والمرفوضة: بتاريخ الإلغاء/الرفض.
 *  - statsMeta = { resetAt, adjustments } : التصفير والتعديلات اليدوية (settings/stats).
 */

/** تاريخ الحدث الذي يُحسب عليه الحجز في الإحصائيات (غير الدخل) */
export function eventDate(r) {
  const field = { completed: 'completedAt', cancelled: 'cancelledAt', rejected: 'rejectedAt' }[r.status];
  return toDate(r[field]) || toDate(r.updatedAt) || toDate(r.createdAt);
}

/** تاريخ احتساب دخل الحجز = وقت التأكيد */
export function incomeDate(r) {
  return toDate(r.confirmedAt) || toDate(r.completedAt) || toDate(r.updatedAt) || toDate(r.createdAt);
}

const countsIncome = (r) =>
  r.status === RESERVATION_STATUS.CONFIRMED || r.status === RESERVATION_STATUS.COMPLETED;

export function getRange(filter, now = new Date()) {
  const today = startOfDay(now);
  switch (filter) {
    case 'today':
      return { start: today, end: new Date(today.getTime() + DAY) };
    case 'week': {
      const diff = (now.getDay() - WEEK_START_DAY + 7) % 7;
      const start = new Date(today.getFullYear(), today.getMonth(), today.getDate() - diff);
      return { start, end: new Date(start.getFullYear(), start.getMonth(), start.getDate() + 7) };
    }
    case 'month':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
      };
    default:
      return { start: null, end: null };
  }
}

const inRange = (date, { start, end }) => !!date && (!start || date >= start) && (!end || date < end);

/** لا نحتسب أي شيء قبل آخر تصفير */
function clampToReset(range, resetAt) {
  if (!resetAt) return range;
  return { start: !range.start || resetAt > range.start ? resetAt : range.start, end: range.end };
}

/** مجموع كل الأرقام لفترة معيّنة (حجوزات + تصحيحات يدوية) */
function aggregate(reservations, settings, meta, rawRange) {
  const range = clampToReset(rawRange, meta?.resetAt);
  const t = {
    completedMinutes: 0,
    cups: 0,
    income: 0,
    pendingIncome: 0,
    incomeCount: 0,
    discounts: 0,
    completedCount: 0,
    cancelledCount: 0,
    rejectedCount: 0,
  };

  reservations.forEach((r) => {
    if (countsIncome(r) && inRange(incomeDate(r), range)) {
      const price = finalPrice(r, settings);
      t.income += price;
      t.incomeCount += 1;
      if (r.status === RESERVATION_STATUS.CONFIRMED) t.pendingIncome += price;
      t.discounts += discountOf(r);
    }
    if (!inRange(eventDate(r), range)) return;
    if (r.status === RESERVATION_STATUS.COMPLETED) {
      t.completedMinutes += Number(r.minutes) || 0;
      t.cups += calcCups(r.minutes, r.minutesPerCup || settings.minutesPerCup);
      t.completedCount += 1;
    } else if (r.status === RESERVATION_STATUS.CANCELLED) {
      t.cancelledCount += 1;
    } else if (r.status === RESERVATION_STATUS.REJECTED) {
      t.rejectedCount += 1;
    }
  });

  (meta?.adjustments || []).forEach((a) => {
    if (!inRange(a.at, range)) return;
    ['completedMinutes', 'cups', 'income', 'completedCount', 'cancelledCount', 'rejectedCount'].forEach((k) => {
      t[k] += Number(a[k]) || 0;
    });
  });

  return {
    ...t,
    cups: round2(t.cups),
    income: round2(t.income),
    pendingIncome: round2(t.pendingIncome),
    discounts: round2(t.discounts),
  };
}

function buildSeries(reservations, filter, range, settings, meta, now) {
  const rangeClamped = clampToReset(range, meta?.resetAt);
  const completed = reservations.filter(
    (r) => r.status === RESERVATION_STATUS.COMPLETED && inRange(eventDate(r), rangeClamped),
  );
  const incomeList = reservations.filter((r) => countsIncome(r) && inRange(incomeDate(r), rangeClamped));

  const buckets = new Map();
  const add = (key, label) => buckets.set(key, { key, label, income: 0, minutes: 0, bookings: 0 });
  let keyOf;

  if (filter === 'today') {
    for (let h = 0; h < 24; h += 1) add(h, `${h}:00`);
    keyOf = (d) => d.getHours();
  } else if (filter === 'week' || filter === 'month') {
    const dayLabel =
      filter === 'week'
        ? new Intl.DateTimeFormat('ar', { weekday: 'short' })
        : { format: (d) => String(d.getDate()) };
    for (let d = new Date(range.start); d < range.end; d = new Date(d.getTime() + DAY)) {
      const day = startOfDay(d);
      add(day.toDateString(), dayLabel.format(day));
    }
    keyOf = (d) => startOfDay(d).toDateString();
  } else {
    const dates = [...completed.map(eventDate), ...incomeList.map(incomeDate)].filter(Boolean);
    if (!dates.length) return [];
    const min = startOfDay(new Date(Math.min(...dates)));
    const today = startOfDay(now);
    const spanDays = Math.round((today - min) / DAY);
    if (spanDays <= 62) {
      // LRI/PDI: نعزل التاريخ كي لا ينقلب ترتيب اليوم والشهر داخل الواجهة العربية (2/10 وليس 210/)
      for (let d = new Date(min); d <= today; d = new Date(d.getTime() + DAY)) {
        add(startOfDay(d).toDateString(), `\u2066${d.getDate()}/${d.getMonth() + 1}\u2069`);
      }
      keyOf = (d) => startOfDay(d).toDateString();
    } else {
      const fmt = new Intl.DateTimeFormat('ar-u-nu-latn', { month: 'short', year: '2-digit' });
      for (
        let d = new Date(min.getFullYear(), min.getMonth(), 1);
        d <= today;
        d = new Date(d.getFullYear(), d.getMonth() + 1, 1)
      ) {
        add(`${d.getFullYear()}-${d.getMonth()}`, `\u2068${fmt.format(d)}\u2069`);
      }
      keyOf = (d) => `${d.getFullYear()}-${d.getMonth()}`;
    }
  }

  incomeList.forEach((r) => {
    const d = incomeDate(r);
    const bucket = d && buckets.get(keyOf(d));
    if (bucket) bucket.income += finalPrice(r, settings);
  });
  completed.forEach((r) => {
    const d = eventDate(r);
    const bucket = d && buckets.get(keyOf(d));
    if (!bucket) return;
    bucket.minutes += Number(r.minutes) || 0;
    bucket.bookings += 1;
  });

  return [...buckets.values()].map((b) => ({ ...b, income: round2(b.income) }));
}

/** إحصائيات بين تاريخين (للمقارنات) */
export function statsBetween(reservations, settings, meta, start, end) {
  const t = aggregate(reservations, settings, meta, { start, end });
  return { minutes: t.completedMinutes, cups: t.cups, income: t.income, count: t.completedCount };
}

/** إحصائيات صفحة الإحصائيات حسب الفلتر (الأرقام المعروضة = المحسوبة + التعديلات اليدوية) */
export function computeRangeStats(reservations, settings, meta, filter, now = new Date()) {
  const range = getRange(filter, now);
  const t = aggregate(reservations, settings, meta, range);
  return { ...t, series: buildSeries(reservations, filter, range, settings, meta, now) };
}

const percentChange = (current, previous) =>
  previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;

/** أرقام الصفحة الرئيسية */
export function computeOverview(availability, reservations, settings, meta, now = new Date()) {
  const liveAvailability = availability.filter((a) => a.status !== AVAILABILITY_STATUS.EMPTY);
  const availableMinutes = liveAvailability.reduce((s, a) => s + (Number(a.availableMinutes) || 0), 0);
  const availableBatches = liveAvailability.filter((a) => Number(a.availableMinutes) > 0).length;

  const pending = reservations.filter((r) => r.status === RESERVATION_STATUS.PENDING);
  const confirmed = reservations.filter((r) => r.status === RESERVATION_STATUS.CONFIRMED);
  const sum = (list) => list.reduce((s, r) => s + (Number(r.minutes) || 0), 0);

  const all = aggregate(reservations, settings, meta, { start: null, end: null });
  const today = computeRangeStats(reservations, settings, meta, 'today', now);
  const week = computeRangeStats(reservations, settings, meta, 'week', now);
  const month = computeRangeStats(reservations, settings, meta, 'month', now);

  // مقارنة الأسبوع الحالي حتى الآن بنفس المدة من الأسبوع السابق
  const weekRange = getRange('week', now);
  const prev = statsBetween(
    reservations,
    settings,
    meta,
    new Date(weekRange.start.getTime() - 7 * DAY),
    new Date(now.getTime() - 7 * DAY),
  );

  return {
    availableMinutes,
    availableBatches,
    pendingCount: pending.length,
    pendingMinutes: sum(pending),
    confirmedCount: confirmed.length,
    confirmedMinutes: sum(confirmed),
    completedMinutes: all.completedMinutes,
    cups: all.cups,
    income: all.income,
    pendingIncome: all.pendingIncome,
    today,
    week,
    month,
    trends: {
      minutes: percentChange(week.completedMinutes, prev.minutes),
      cups: percentChange(week.cups, prev.cups),
      income: percentChange(week.income, prev.income),
    },
  };
}
