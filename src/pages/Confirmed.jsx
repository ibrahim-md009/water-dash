import { CheckCheck, CheckCircle2, Ban } from 'lucide-react';
import ReservationsBoard from '../components/ReservationsBoard';
import { cancelReservation, completeReservation } from '../services/reservations';

const getActions = () => [
  {
    key: 'cancel',
    label: 'إلغاء',
    variant: 'danger',
    icon: Ban,
    success: 'تم إلغاء الحجز وإعادة الدقائق',
    run: (r) => cancelReservation(r.id),
    confirm: {
      title: 'إلغاء الحجز',
      message: 'هل أنت متأكد من إلغاء هذا الحجز المؤكد؟ ستعود الدقائق كدفعة متاحة مستقلة وسيُخصم سعره من الإحصائيات.',
      confirmLabel: 'نعم، ألغِ الحجز',
      danger: true,
    },
  },
  {
    key: 'complete',
    label: 'منجز',
    variant: 'success',
    icon: CheckCheck,
    success: 'تم تسجيل الحجز كمنجز',
    run: (r) => completeReservation(r.id),
    confirm: {
      title: 'تسجيل كمنجز',
      message: 'هل تم إنجاز هذا الحجز فعلًا؟ ستُضاف دقائقه وأكوابه إلى الإحصائيات (وسعره محسوب منذ التأكيد) ويختفي من الحجوزات المؤكدة.',
      confirmLabel: 'نعم، تم الإنجاز',
    },
  },
];

export default function Confirmed() {
  return (
    <ReservationsBoard
      status="confirmed"
      timeLabel="تأكد"
      timeField="confirmedAt"
      getActions={getActions}
      empty={{
        icon: CheckCircle2,
        title: 'لا توجد حجوزات مؤكدة حاليًا',
        text: 'الحجوزات التي تؤكدها ستظهر هنا حتى تُنجز أو تُلغى.',
      }}
    />
  );
}
