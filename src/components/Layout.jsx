import { useEffect, useRef, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import ErrorState from './ErrorState';
import { DataProvider, useData } from '../context/DataContext';
import { useToast } from '../context/ToastContext';

const PAGES = {
  '/': { title: 'لوحة التحكم', description: 'ملخص سريع لحالة النظام' },
  '/add-minutes': { title: 'إضافة الدقائق', description: 'أضف دقائق جديدة أو عدّل ما أضفته' },
  '/requests': { title: 'طلبات الحجوزات', description: 'الطلبات التي تنتظر موافقتك' },
  '/confirmed': { title: 'الحجوزات المؤكدة', description: 'حجوزات تم تأكيدها وتنتظر الإنجاز' },
  '/statistics': { title: 'الإحصائيات', description: 'أداء الحجوزات والدخل' },
  '/payment-settings': { title: 'إعدادات الدفع', description: 'سعر الكوب وطرق التحويل التي ستظهر للزبائن' },
};

/** ينبّه بتوست عند وصول طلب جديد أثناء فتح اللوحة */
function useNewRequestToast() {
  const { reservations, loading } = useData();
  const toast = useToast();
  const seen = useRef(null);

  useEffect(() => {
    if (loading) return;
    const pending = reservations.filter((r) => r.status === 'pending');
    if (seen.current === null) {
      seen.current = new Set(pending.map((r) => r.id));
      return;
    }
    pending.forEach((r) => {
      if (!seen.current.has(r.id)) {
        seen.current.add(r.id);
        toast.info(`طلب حجز جديد من ${r.name}`);
      }
    });
  }, [reservations, loading, toast]);
}

function Shell() {
  const { pathname } = useLocation();
  const { error } = useData();
  const [drawer, setDrawer] = useState(false);
  const page = PAGES[pathname] || PAGES['/'];
  useNewRequestToast();

  useEffect(() => setDrawer(false), [pathname]);

  return (
    <div className="app-shell">
      <Sidebar open={drawer} onClose={() => setDrawer(false)} />
      {drawer && <div className="drawer-backdrop" onClick={() => setDrawer(false)} aria-hidden="true" />}

      <div className="main">
        <Header title={page.title} description={page.description} onMenu={() => setDrawer(true)} />
        <main className="content">
          {error && <ErrorState message={error} />}
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default function Layout() {
  return (
    <DataProvider>
      <Shell />
    </DataProvider>
  );
}
