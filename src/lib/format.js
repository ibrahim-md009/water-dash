import { CURRENCY } from '../config/app';

const numberFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });
const dateTimeFormat = new Intl.DateTimeFormat('ar-u-nu-latn-ca-gregory', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export function toDate(value) {
  if (!value) return null;
  if (typeof value.toDate === 'function') return value.toDate();
  if (value instanceof Date) return value;
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export const formatNumber = (n) => numberFormat.format(Number(n) || 0);
export const formatMinutes = (n) => `${formatNumber(n)} دقيقة`;
export const formatMoney = (n) => `${formatNumber(n)} ${CURRENCY}`;

export function formatDateTime(value) {
  const d = toDate(value);
  return d ? dateTimeFormat.format(d) : '—';
}

/** رقم الدفعة بالشكل #001 */
export function formatAvailabilityNumber(a) {
  if (a?.number) return `#${String(a.number).padStart(3, '0')}`;
  return `#${(a?.id || '').slice(0, 4).toUpperCase()}`;
}
