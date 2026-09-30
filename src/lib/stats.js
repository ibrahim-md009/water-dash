import { WEEK_START_DAY } from '../config/app';
import { AVAILABILITY_STATUS, RESERVATION_STATUS } from './constants';
import { toDate } from './format';
import { calcCups, calcPrice } from './pricing';

const DAY = 24 * 60 * 60 * 1000;
const startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());

/** تاريخ الحدث الذي يُحسب عليه الحجز في الإحصائيات */
export function eventDate(r) {
  const field = {
    completed: 'completedAt',
    cancelled: 'cancelledAt',
    rejected: 'rejectedAt',
  }[r.status];
  return toDate(r[field]) || toDate(r.updatedAt) || toDate(r.createdAt);
}

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

const inRange = (date, { start, end }) =>
  !!date && (!start || date >= start) && (!end || date < end);

const priceOf = (r, settings) =>
  Number.isFinite(Number(r.price)) && r.price !== null && r.price !== undefined
    ? Number(r.price)
    : calcPrice(r.minutes, settings);

const cupsOf = (r, settings) => calcCups(r.minutes, r.minutesPerCup || settings.minutesPerCup);

function totals(list, settings) {
  return list.reduce(
    (acc, r) => {
      acc.minutes += Number(r.minutes) || 0;
      acc.cups += cupsOf(r, settings);
      acc.income += priceOf(r, settings);
      acc.count += 1;
      return acc;
    },
    { minutes: 0, cups: 0, income: 0, count: 0 },
  );
}

const round2 = (n) => Math.round(n * 100) / 100;

/** إحصائيات الحجوزات المنجزة بين تاريخين */
export function statsBetween(reservations, settings, start, end) {
  const range = { start, end };
  const completed = reservations.filter(
    (r) => r.status === RESERVATION_STATUS.COMPLETED && inRange(eventDate(r), range),
  );
  const t = totals(completed, settings);
  return { minutes: t.minutes, cups: round2(t.cups), income: round2(t.income), count: t.count };
}

function buildSeries(completed, filter, range, settings, now) {
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
    if (!completed.length) return [];
    const dates = completed.map((r) => eventDate(r)).filter(Boolean);
    const min = startOfDay(new Date(Math.min(...dates)));
    const today = startOfDay(now);
    const spanDays = Math.round((today - min) / DAY);
    if (spanDays <= 62) {
      const fmt = new Intl.DateTimeFormat('ar-u-nu-latn', { day: 'numeric', month: 'numeric' });
      for (let d = new Date(min); d <= today; d = new Date(d.getTime() + DAY)) {
        add(startOfDay(d).toDateString(), fmt.format(d));
      }
      keyOf = (d) => startOfDay(d).toDateString();
    } else {
      const fmt = new Intl.DateTimeFormat('ar-u-nu-latn', { month: 'short', year: '2-digit' });
      for (
        let d = new Date(min.getFullYear(), min.getMonth(), 1);
        d <= today;
        d = new Date(d.getFullYear(), d.getMonth() + 1, 1)
      ) {
        add(`${d.getFullYear()}-${d.getMonth()}`, fmt.format(d));
      }
      keyOf = (d) => `${d.getFullYear()}-${d.getMonth()}`;
    }
  }

  completed.forEach((r) => {
    const d = eventDate(r);
    const bucket = d && buckets.get(keyOf(d));
    if (!bucket) return;
    bucket.income += priceOf(r, settings);
    bucket.minutes += Number(r.minutes) || 0;
    bucket.bookings += 1;
  });

  return [...buckets.values()].map((b) => ({ ...b, income: round2(b.income) }));
}

/** إحصائيات صفحة الإحصائيات حسب الفلتر */
export function computeRangeStats(reservations, settings, filter, now = new Date()) {
  const range = getRange(filter, now);
  const inPeriod = (status) =>
    reservations.filter((r) => r.status === status && inRange(eventDate(r), range));

  const completed = inPeriod(RESERVATION_STATUS.COMPLETED);
  const t = totals(completed, settings);

  return {
    completedMinutes: t.minutes,
    cups: round2(t.cups),
    income: round2(t.income),
    completedCount: t.count,
    cancelledCount: inPeriod(RESERVATION_STATUS.CANCELLED).length,
    rejectedCount: inPeriod(RESERVATION_STATUS.REJECTED).length,
    series: buildSeries(completed, filter, range, settings, now),
  };
}

const percentChange = (current, previous) =>
  previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;

/** أرقام الصفحة الرئيسية */
export function computeOverview(availability, reservations, settings, now = new Date()) {
  const liveAvailability = availability.filter((a) => a.status !== AVAILABILITY_STATUS.EMPTY);
  const availableMinutes = liveAvailability.reduce((s, a) => s + (Number(a.availableMinutes) || 0), 0);
  const availableBatches = liveAvailability.filter((a) => Number(a.availableMinutes) > 0).length;

  const pending = reservations.filter((r) => r.status === RESERVATION_STATUS.PENDING);
  const confirmed = reservations.filter((r) => r.status === RESERVATION_STATUS.CONFIRMED);
  const sum = (list) => list.reduce((s, r) => s + (Number(r.minutes) || 0), 0);

  const all = statsBetween(reservations, settings, null, null);
  const today = computeRangeStats(reservations, settings, 'today', now);
  const week = computeRangeStats(reservations, settings, 'week', now);
  const month = computeRangeStats(reservations, settings, 'month', now);

  // مقارنة الأسبوع الحالي حتى الآن بنفس المدة من الأسبوع السابق
  const weekRange = getRange('week', now);
  const prev = statsBetween(
    reservations,
    settings,
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
    completedMinutes: all.minutes,
    cups: all.cups,
    income: all.income,
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
