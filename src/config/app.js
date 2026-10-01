// ─────────────────────────────────────────────
// إعدادات التطبيق العامة — عدّل من هنا فقط
// ─────────────────────────────────────────────

/** اسم المشروع (مؤقت) — يظهر في الشريط الجانبي وصفحة الدخول وعنوان التبويب */
export const APP_NAME = 'مياهك';
export const APP_TAGLINE = 'لوحة التحكم';

export const CURRENCY = '₪';

/** أول يوم في الأسبوع: 0 = الأحد ... 6 = السبت */
export const WEEK_START_DAY = 6;

/** القيم الافتراضية لوثيقة settings/general (تُنشأ تلقائيًا إن لم تكن موجودة) */
export const DEFAULT_SETTINGS = {
  minutesPerCup: 20,
  pricePerCup: 10,
};

export const COLLECTIONS = {
  availability: 'availability',
  reservations: 'reservations',
  paymentMethods: 'paymentMethods',
  settings: 'settings',
  admins: 'admins',
};

export const SETTINGS_DOC = 'general';
export const COUNTERS_DOC = 'counters';
/** تصحيحات الإحصائيات وتاريخ آخر تصفير (للمسؤول فقط — القاعدة الحالية تحميه) */
export const STATS_DOC = 'stats';

/** طرق الدفع الافتراضية (تُنشأ مرة واحدة إن لم تكن موجودة) */
export const DEFAULT_PAYMENT_METHODS = [
  { id: 'jawwal-pay', name: 'Jawwal Pay', order: 1 },
  { id: 'palpay', name: 'PalPay', order: 2 },
  { id: 'bank-of-palestine', name: 'Bank of Palestine', order: 3 },
];
