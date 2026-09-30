import { CreditCard } from 'lucide-react';
import EmptyState from '../components/EmptyState';
import LoadingState from '../components/LoadingState';
import PaymentMethodCard from '../components/PaymentMethodCard';
import PricingCard from '../components/PricingCard';
import { useData } from '../context/DataContext';

export default function PaymentSettings() {
  const { paymentMethods, loading } = useData();

  if (loading) return <LoadingState />;

  return (
    <div className="stack">
      <PricingCard />

      <section className="stack">
        <h2 className="section-title">طرق الدفع</h2>
        <p className="page-note">
          هذه البيانات يقرؤها الموقع الأساسي من Firestore ويعرضها للزبائن. الطرق المفعّلة فقط يجب أن تظهر لهم.
        </p>
        {paymentMethods.length === 0 ? (
          <EmptyState icon={CreditCard} title="لا توجد طرق دفع" text="جارٍ تجهيز طرق الدفع الافتراضية..." />
        ) : (
          <div className="grid grid-cards">
            {paymentMethods.map((m) => (
              <PaymentMethodCard key={m.id} method={m} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
