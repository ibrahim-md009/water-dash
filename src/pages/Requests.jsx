import { CheckCircle2, ClipboardList, XCircle } from 'lucide-react';
import ReservationsBoard from '../components/ReservationsBoard';
import { confirmReservation, rejectReservation } from '../services/reservations';

const getActions = () => [
  {
    key: 'reject',
    label: 'رفض الحجز',
    variant: 'danger',
    icon: XCircle,
    success: 'تم رفض الحجز وإعادة الدقائق',
    run: (r) => rejectReservation(r.id),
    confirm: {
      title: 'رفض الحجز',
      message: 'هل أنت متأكد من رفض هذا الحجز؟ ستعود الدقائق المحجوزة كدفعة متاحة مستقلة.',
      confirmLabel: 'نعم، ارفض الحجز',
      danger: true,
    },
  },
  {
    key: 'confirm',
    label: 'تأكيد الحجز',
    variant: 'primary',
    icon: CheckCircle2,
    success: 'تم تأكيد الحجز وإضافة سعره إلى الإحصائيات',
    offerSms: true,
    run: (r) => confirmReservation(r.id),
  },
];

export default function Requests() {
  return (
    <ReservationsBoard
      status="pending"
      allowDiscount
      timeLabel="أُرسل"
      timeField="createdAt"
      getActions={getActions}
      empty={{
        icon: ClipboardList,
        title: 'لا توجد طلبات معلقة حاليًا',
        text: 'ستظهر هنا طلبات الحجز الجديدة فور وصولها.',
      }}
    />
  );
}
