import { CreditCard } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import PaymentMethodCard from '../components/PaymentMethodCard';
import { useData } from '../context/DataContext';

export default function PaymentSettings() {
  const { paymentMethods, loading } = useData();

  if (loading) return <LoadingState />;
  if (paymentMethods.length === 0) {
    return <EmptyState icon={CreditCard} title="لا توجد طرق دفع" text="جارٍ تجهيز طرق الدفع الافتراضية..." />;
  }

  return (
    <div className="stack">
      <p className="page-note">
        هذه البيانات يقرؤها الموقع الأساسي من Firestore ويعرضها للزبائن. الطرق المفعّلة فقط يجب أن تظهر لهم.
      </p>
      <div className="grid grid-cards">
        {paymentMethods.map((m) => (
          <PaymentMethodCard key={m.id} method={m} />
        ))}
      </div>
    </div>
  );
}
