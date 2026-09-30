import { useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  LayoutDashboard,
  LogOut,
  PlusCircle,
  RotateCcw,
} from 'lucide-react';
import FactoryResetModal from './FactoryResetModal';
import Logo from './Logo';
import ThemeToggle from './ThemeToggle';
import { APP_NAME, APP_TAGLINE } from '../config/app';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';

const NAV = [
  { to: '/', label: 'الرئيسية', icon: LayoutDashboard, end: true },
  { to: '/add-minutes', label: 'إضافة الدقائق', icon: PlusCircle },
  { to: '/requests', label: 'طلبات الحجوزات', icon: ClipboardList, badge: true },
  { to: '/confirmed', label: 'الحجوزات المؤكدة', icon: CheckCircle2 },
  { to: '/statistics', label: 'الإحصائيات', icon: BarChart3 },
  { to: '/payment-settings', label: 'إعدادات الدفع', icon: CreditCard },
];

export default function Sidebar({ open, onClose }) {
  const { logout } = useAuth();
  const [resetOpen, setResetOpen] = useState(false);
  const { reservations } = useData();
  const pending = reservations.filter((r) => r.status === 'pending').length;

  return (
    <aside className={`sidebar ${open ? 'open' : ''}`} aria-label="القائمة الرئيسية">
      <div className="sidebar-brand">
        <Logo />
        <div>
          <strong>{APP_NAME}</strong>
          <span>{APP_TAGLINE}</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        {NAV.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink key={to} to={to} end={end} className="nav-link" onClick={onClose}>
            <Icon size={20} aria-hidden="true" />
            <span>{label}</span>
            {badge && pending > 0 && <span className="nav-badge">{pending}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-foot">
        <ThemeToggle />
        <button
          type="button"
          className="sidebar-reset"
          onClick={() => {
            onClose();
            setResetOpen(true);
          }}
        >
          <RotateCcw size={18} aria-hidden="true" />
          <span>ضبط المصنع</span>
        </button>
        <button type="button" className="nav-link logout" onClick={logout}>
          <LogOut size={20} aria-hidden="true" />
          <span>تسجيل الخروج</span>
        </button>
      </div>

      <FactoryResetModal open={resetOpen} onClose={() => setResetOpen(false)} />

      <svg className="sidebar-wave" viewBox="0 0 264 40" preserveAspectRatio="none" aria-hidden="true">
        <path d="M0 18 C44 4 88 32 132 18 S220 4 264 18 V40 H0 Z" />
      </svg>
    </aside>
  );
}
