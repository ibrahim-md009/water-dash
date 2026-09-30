export const RESERVATION_STATUS = {
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  REJECTED: 'rejected',
};

export const RESERVATION_STATUS_LABELS = {
  pending: 'قيد المراجعة',
  confirmed: 'مؤكد',
  completed: 'منجز',
  cancelled: 'ملغي',
  rejected: 'مرفوض',
};

export const AVAILABILITY_STATUS = {
  AVAILABLE: 'available',
  FULL: 'full',
  COMPLETED: 'completed',
  EMPTY: 'empty',
};

export const AVAILABILITY_STATUS_LABELS = {
  available: 'متاحة',
  full: 'محجوزة بالكامل',
  completed: 'منتهية',
  empty: 'فارغة',
};

export const STATS_FILTERS = [
  { value: 'today', label: 'اليوم' },
  { value: 'week', label: 'هذا الأسبوع' },
  { value: 'month', label: 'هذا الشهر' },
  { value: 'all', label: 'كل الوقت' },
];
