import { useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2, LogIn } from 'lucide-react';
import Logo from '../components/Logo';
import ThemeToggle from '../components/ThemeToggle';
import ErrorState from '../components/ErrorState';
import { APP_NAME, APP_TAGLINE } from '../config/app';
import { useAuth } from '../context/AuthContext';
import { toArabicError } from '../lib/errors';

export default function Login() {
  const { status, login } = useAuth();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (status === 'authed') return <Navigate to={location.state?.from || '/'} replace />;

  const onSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err) {
      setError(toArabicError(err));
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-theme">
        <ThemeToggle variant="icon" />
      </div>

      <div className="card login-card">
        <svg className="login-wave" viewBox="0 0 400 60" preserveAspectRatio="none" aria-hidden="true">
          <path d="M0 0 H400 V34 C340 58 280 12 200 34 S60 56 0 30 Z" />
        </svg>

        <div className="login-brand">
          <Logo size={56} />
          <h1>{APP_NAME}</h1>
          <p>{APP_TAGLINE}</p>
        </div>

        <form onSubmit={onSubmit} className="form" noValidate={false}>
          {error && <ErrorState message={error} />}

          <div className="field">
            <label htmlFor="email">البريد الإلكتروني</label>
            <input
              id="email"
              type="email"
              className="input"
              dir="ltr"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="field">
            <label htmlFor="password">كلمة المرور</label>
            <input
              id="password"
              type="password"
              className="input"
              dir="ltr"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
            {loading ? <Loader2 size={20} className="spin" aria-hidden="true" /> : <LogIn size={20} aria-hidden="true" />}
            تسجيل الدخول
          </button>
        </form>
      </div>
    </div>
  );
}
