import { useCallback, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, BellOff, LogOut, Menu, User } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useOutsideClick } from '../hooks/useOutsideClick';
import { formatMinutes } from '../lib/format';

function Dropdown({ label, trigger, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const close = useCallback(() => setOpen(false), []);
  useOutsideClick(ref, close, open);

  return (
    <div className="dropdown" ref={ref}>
      <button
        type="button"
        className="btn btn-ghost btn-icon"
        aria-label={label}
        aria-expanded={open}
        aria-haspopup="true"
        onClick={() => setOpen((o) => !o)}
      >
        {trigger}
      </button>
      {open && <div className="dropdown-panel">{children(close)}</div>}
    </div>
  );
}

export default function Header({ title, description, onMenu }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { reservations } = useData();
  const pending = reservations.filter((r) => r.status === 'pending');

  return (
    <header className="topbar">
      <button type="button" className="btn btn-ghost btn-icon menu-btn" onClick={onMenu} aria-label="فتح القائمة">
        <Menu size={22} />
      </button>

      <div className="topbar-title">
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>

      <div className="topbar-actions">
        <div className="topbar-theme">
          <ThemeToggle variant="icon" />
        </div>

        <Dropdown
          label={`الإشعارات${pending.length ? ` (${pending.length} طلب جديد)` : ''}`}
          trigger={
            <span className="bell">
              <Bell size={20} />
              {pending.length > 0 && <span className="bell-badge">{pending.length > 9 ? '9+' : pending.length}</span>}
            </span>
          }
        >
          {(close) => (
            <div className="notif">
              <h4>طلبات بانتظار المراجعة</h4>
              {pending.length === 0 ? (
                <p className="notif-empty">
                  <BellOff size={18} aria-hidden="true" /> لا توجد طلبات جديدة
                </p>
              ) : (
                <ul>
                  {pending.slice(0, 5).map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        onClick={() => {
                          close();
                          navigate('/requests', { state: { openId: r.id } });
                        }}
                      >
                        <strong>{r.name}</strong>
                        <span>{formatMinutes(r.minutes)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              {pending.length > 5 && (
                <button
                  type="button"
                  className="btn btn-ghost btn-sm btn-block"
                  onClick={() => {
                    close();
                    navigate('/requests');
                  }}
                >
                  عرض كل الطلبات ({pending.length})
                </button>
              )}
            </div>
          )}
        </Dropdown>

        <Dropdown label="الحساب" trigger={<User size={20} />}>
          {() => (
            <div className="notif account">
              <p className="account-label">مسجّل الدخول باسم</p>
              <p className="account-email" dir="ltr">
                {user?.email}
              </p>
              <button type="button" className="btn btn-ghost btn-sm btn-block" onClick={logout}>
                <LogOut size={16} aria-hidden="true" /> تسجيل الخروج
              </button>
            </div>
          )}
        </Dropdown>
      </div>
    </header>
  );
}
