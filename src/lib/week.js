/**
 * حساب الأسبوع — يجب أن يطابق دالة weekIdx في firestore.rules تمامًا.
 * الأسبوع يبدأ يوم السبت عند منتصف الليل بتوقيت UTC+2 (ثابت، بدون توقيت صيفي).
 */
const OFFSET_MS = 2 * 60 * 60 * 1000;
const DAY_MS = 24 * 60 * 60 * 1000;

const toMs = (d) => (d instanceof Date ? d.getTime() : Number(d));

/** رقم الأسبوع (عدد صحيح يزيد 1 كل سبت) */
export function weekIndex(date) {
  const day = Math.floor((toMs(date) + OFFSET_MS) / DAY_MS);
  return Math.floor((day + 5) / 7);
}

/** بداية الأسبوع الذي ينتمي إليه التاريخ */
export function weekStart(date) {
  const idx = weekIndex(date);
  return new Date((idx * 7 - 5) * DAY_MS - OFFSET_MS);
}

/** بداية الأسبوع التالي (موعد تجدّد الحد الأسبوعي) */
export function nextWeekStart(date) {
  return new Date(weekStart(date).getTime() + 7 * DAY_MS);
}

export const isSameWeek = (a, b) => !!a && !!b && weekIndex(a) === weekIndex(b);
