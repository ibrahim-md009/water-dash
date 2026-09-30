import { AlertCircle } from 'lucide-react';

export default function ErrorState({ message }) {
  return (
    <div className="alert alert-error" role="alert">
      <AlertCircle size={20} aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
