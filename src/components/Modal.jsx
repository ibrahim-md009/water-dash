import { useEffect, useId, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

// مكدّس النوافذ: Escape يغلق النافذة العليا فقط
const stack = [];

export default function Modal({ open, onClose, title, size = 'md', footer, busy = false, children }) {
  const id = useId();
  const dialogRef = useRef(null);
  const titleId = `${id}-title`;

  useEffect(() => {
    if (!open) return undefined;
    stack.push(id);
    document.body.classList.add('modal-open');
    const previous = document.activeElement;
    dialogRef.current?.focus();

    const onKey = (e) => {
      if (e.key === 'Escape' && stack[stack.length - 1] === id && !busy) onClose();
    };
    document.addEventListener('keydown', onKey);

    return () => {
      document.removeEventListener('keydown', onKey);
      const i = stack.indexOf(id);
      if (i >= 0) stack.splice(i, 1);
      if (!stack.length) document.body.classList.remove('modal-open');
      previous?.focus?.();
    };
  }, [open, id, onClose, busy]);

  if (!open) return null;

  return createPortal(
    <div className="modal-overlay" onMouseDown={(e) => e.target === e.currentTarget && !busy && onClose()}>
      <div
        className={`modal modal-${size}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        tabIndex={-1}
        ref={dialogRef}
      >
        <div className="modal-head">
          <h2 id={titleId}>{title}</h2>
          <button type="button" className="btn btn-ghost btn-icon" onClick={onClose} disabled={busy} aria-label="إغلاق">
            <X size={20} />
          </button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>,
    document.body,
  );
}
