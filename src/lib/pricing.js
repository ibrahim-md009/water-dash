import { DEFAULT_SETTINGS } from '../config/app';

export function normalizeSettings(raw) {
  const minutesPerCup = Number(raw?.minutesPerCup);
  const pricePerCup = Number(raw?.pricePerCup);
  return {
    minutesPerCup: minutesPerCup > 0 ? minutesPerCup : DEFAULT_SETTINGS.minutesPerCup,
    pricePerCup: pricePerCup >= 0 ? pricePerCup : DEFAULT_SETTINGS.pricePerCup,
  };
}

/** السعر = الدقائق ÷ دقائق الكوب × سعر الكوب (لا يُكتب يدويًا أبدًا) */
export function calcPrice(minutes, settings) {
  const { minutesPerCup, pricePerCup } = normalizeSettings(settings);
  const value = (Number(minutes) * pricePerCup) / minutesPerCup;
  return Math.round(value * 100) / 100;
}

export function calcCups(minutes, minutesPerCup) {
  const per = Number(minutesPerCup) > 0 ? Number(minutesPerCup) : DEFAULT_SETTINGS.minutesPerCup;
  return Math.round((Number(minutes) / per) * 100) / 100;
}

/** قيمة الخصم على الحجز (₪)، 0 إن لم يوجد */
export function discountOf(r) {
  const d = Number(r?.discount);
  return Number.isFinite(d) && d > 0 ? d : 0;
}

/** السعر النهائي بعد الخصم — هو الذي يدخل الإحصائيات */
export function finalPrice(r, settings) {
  const base =
    r?.price !== null && r?.price !== undefined && Number.isFinite(Number(r.price))
      ? Number(r.price)
      : calcPrice(r?.minutes, settings);
  return Math.round(Math.max(0, base - discountOf(r)) * 100) / 100;
}
