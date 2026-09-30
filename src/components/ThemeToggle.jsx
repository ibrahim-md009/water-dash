import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

/** variant="segmented": زران واضحان (نهاري / ليلي) — variant="icon": زر أيقونة مضغوط */
export default function ThemeToggle({ variant = 'segmented' }) {
  const { theme, setTheme, toggle } = useTheme();

  if (variant === 'icon') {
    return (
      <button
        type="button"
        className="btn btn-ghost btn-icon"
        onClick={toggle}
        aria-label={theme === 'dark' ? 'التبديل إلى الوضع النهاري' : 'التبديل إلى الوضع الليلي'}
      >
        {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
      </button>
    );
  }

  return (
    <div className="segmented" role="radiogroup" aria-label="وضع العرض">
      <button
        type="button"
        role="radio"
        aria-checked={theme === 'light'}
        className={theme === 'light' ? 'active' : ''}
        onClick={() => setTheme('light')}
      >
        <Sun size={16} aria-hidden="true" />
        الوضع النهاري
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={theme === 'dark'}
        className={theme === 'dark' ? 'active' : ''}
        onClick={() => setTheme('dark')}
      >
        <Moon size={16} aria-hidden="true" />
        الوضع الليلي
      </button>
    </div>
  );
}
