/**
 * رقم الأسبوع (يبدأ كل سبت 00:00 بتوقيت UTC). نفس الحساب بالظبط موجود في Firestore Rules:
 *   math.floor((request.time.toMillis() - 172800000) / 604800000)
 * (1970-01-03 كان سبت، ومن هنا الإزاحة 2 يوم). لو غيّرت هنا لازم تغيّر في الـ Rules.
 */
const DAY = 24 * 60 * 60 * 1000;
export const weekIndex = (ms = Date.now()) => Math.floor((ms - 2 * DAY) / (7 * DAY));
