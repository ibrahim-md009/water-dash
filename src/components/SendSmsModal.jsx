import { MessageSquare } from 'lucide-react';
import Modal from './Modal';
import { APP_NAME } from '../config/app';
import { formatMinutes } from '../lib/format';

/** نص رسالة تأكيد الحجز — عدّله من هنا */
export function buildConfirmMessage(r) {
  const parts = [`مرحبًا ${r.name || ''}،`, `تم تأكيد حجزك لدى ${APP_NAME}.`];
  if (r.minutes) parts.push(`المدة: ${formatMinutes(r.minutes)}.`);
  if (r.dateText) parts.push(`الموعد: ${r.dateText}.`);
  parts.push('شكرًا لك.');
  return parts.join('\n');
}

/** رابط SMS جاهز (iOS يستخدم & قبل body، وأندرويد ؟) */
export function smsLink(phone, body) {
  const number = String(phone || '').replace(/[^\d+]/g, '');
  const sep = /iPhone|iPad|iPod/i.test(navigator.userAgent) ? '&' : '?';
  return `sms:${number}${sep}body=${encodeURIComponent(body)}`;
}

/** تظهر بعد تأكيد الحجز: خيار إرسال رسالة SMS للعميل */
export default function SendSmsModal({ reservation: r, onClose }) {
  return (
    <Modal
      open={!!r}
      onClose={onClose}
      title="تم تأكيد الحجز"
      size="sm"
      footer={
        r && (
          <>
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              لاحقًا
            </button>
            <a className="btn btn-primary" href={smsLink(r.phone, buildConfirmMessage(r))} onClick={onClose}>
              <MessageSquare size={18} aria-hidden="true" />
              إرسال رسالة للعميل
            </a>
          </>
        )
      }
    >
      {r && (
        <>
          <p className="confirm-message">هل تريد إرسال رسالة للعميل لإعلامه بتأكيد حجزه؟</p>
          <p className="confirm-message" dir="ltr" style={{ marginTop: 8 }}>
            {r.phone}
          </p>
        </>
      )}
    </Modal>
  );
}
