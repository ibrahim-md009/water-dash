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
