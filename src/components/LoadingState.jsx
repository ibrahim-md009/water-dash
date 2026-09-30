import { Loader2 } from 'lucide-react';

export default function LoadingState({ label = 'جارٍ التحميل...', fullscreen = false }) {
  return (
    <div className={`state ${fullscreen ? 'state-fullscreen' : ''}`} role="status">
      <Loader2 className="spin" size={32} aria-hidden="true" />
      <p>{label}</p>
    </div>
  );
}
