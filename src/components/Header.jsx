import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { Bell, BellOff, ChevronLeft, LogOut, Menu, User } from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { useOutsideClick } from '../hooks/useOutsideClick';
import { formatMinutes, formatMoney, toDate } from '../lib/format';

/** وقت نسبي مختصر: الآن / منذ 5 د / منذ 3 س / منذ 2 يوم */
function timeAgo(value) {
  const d = toDate(value);
  if (!d) return '';
  const sec = Math.max(0, Math.floor((Date.now() - d.getTime()) / 1000));
  if (sec < 60) return 'الآن';
  const min = Math.floor(sec / 60);
  if (min < 60) return `منذ ${min} د`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `منذ ${hr} س`;
  return `منذ ${Math.floor(hr / 24)} يوم`;
}

/** هل الشاشة جوال؟ (على الجوال تظهر القوائم كـ Bottom Sheet) */
function useIsMobile(query = '(max-width: 680px)') {
  const [match, setMatch] = useState(() => typeof window !== 'undefined' && window.matchMedia(query).matches);
  useEffect(() => {
    const mq = window.matchMedia(query);
    const onChange = () => setMatch(mq.matches);
    onChange();
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, [query]);
  return match;
}

/** عدد الطلبات الظاهرة في الإشعارات (الباقي من صفحة الطلبات) */
const NOTIF_LIMIT = 3;

const initial = (name) => (name || '?').trim().charAt(0).toUpperCase();

function Dropdown({ label, trigger, children }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const isMobile = useIsMobile();
  const close = useCallback(() => setOpen(false), []);
  // على الجوال الإغلاق يتم عبر الخلفية المعتمة (القائمة تُرسم خارج الهيدر)
  useOutsideClick(ref, close, open && !isMobile);

  useEffect(() => {
    if (!open || !isMobile) return undefined;
    const onKey = (e) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, isMobile, close]);

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
      {open && !isMobile && <div className="dropdown-panel">{children(close)}</div>}
      {open &&
        isMobile &&
        createPortal(
          <>
            <div className="sheet-backdrop" onClick={close} aria-hidden="true" />
            <div className="sheet" role="dialog" aria-label={label}>
              <span className="sheet-handle" aria-hidden="true" />
              {children(close)}
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}

export default function Header({ title, description, onMenu }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { reservations } = useData();
  // الأحدث أولًا
  const pending = useMemo(
    () =>
      reservations
        .filter((r) => r.status === 'pending')
        .sort((a, b) => (toDate(b.createdAt)?.getTime() || 0) - (toDate(a.createdAt)?.getTime() || 0)),
    [reservations],
  );
  const rest = Math.max(0, pending.length - NOTIF_LIMIT);

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
              <div className="notif-head">
                <h4>طلبات بانتظار المراجعة</h4>
                {pending.length > 0 && <span className="notif-count">{pending.length}</span>}
              </div>

              {pending.length === 0 ? (
                <div className="notif-empty">
                  <span className="notif-empty-icon">
                    <BellOff size={22} aria-hidden="true" />
                  </span>
                  <strong>لا توجد طلبات جديدة</strong>
                  <span>سيظهر هنا أي طلب حجز جديد فور وصوله.</span>
                </div>
              ) : (
                <ul className="notif-list">
                  {pending.slice(0, NOTIF_LIMIT).map((r) => (
                    <li key={r.id}>
                      <button
                        type="button"
                        className="notif-item"
                        onClick={() => {
                          close();
                          navigate('/requests', { state: { openId: r.id } });
                        }}
                      >
                        <span className="notif-avatar" aria-hidden="true">
                          {initial(r.name)}
                        </span>
                        <span className="notif-main">
                          <strong>{r.name}</strong>
                          <span>
                            {formatMinutes(r.minutes)}
                            {r.price ? ` · ${formatMoney(r.price)}` : ''}
                          </span>
                        </span>
                        <span className="notif-time">{timeAgo(r.createdAt)}</span>
                        <ChevronLeft size={16} className="notif-arrow" aria-hidden="true" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}

              {pending.length > 0 && (
                <button
                  type="button"
                  className="notif-all"
                  onClick={() => {
                    close();
                    navigate('/requests');
                  }}
                >
                  {rest > 0 ? `عرض باقي الطلبات (${rest})` : 'عرض كل الطلبات'}
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
