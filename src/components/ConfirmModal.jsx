import { Loader2 } from 'lucide-react';
import Modal from './Modal';

export default function ConfirmModal({
  open,
  title,
  message,
  confirmLabel = 'تأكيد',
  cancelLabel = 'تراجع',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      size="sm"
      busy={loading}
      footer={
        <>
          <button type="button" className="btn btn-ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </button>
          <button
            type="button"
            className={`btn ${danger ? 'btn-danger' : 'btn-primary'}`}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading && <Loader2 size={18} className="spin" aria-hidden="true" />}
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="confirm-message">{message}</p>
    </Modal>
  );
}
