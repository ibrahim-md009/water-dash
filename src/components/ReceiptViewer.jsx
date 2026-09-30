import { useState } from 'react';
import { ExternalLink, ImageOff, ZoomIn } from 'lucide-react';
import Modal from './Modal';

/**
 * عرض وصل الدفع.
 * variant="thumb": صورة مصغّرة للبطاقات — variant="full": صورة واضحة قابلة للتكبير.
 */
export default function ReceiptViewer({ url, variant = 'full', alt = 'وصل الدفع' }) {
  const [failed, setFailed] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [actualSize, setActualSize] = useState(false);

  if (!url || failed) {
    return (
      <div className={`receipt-empty ${variant === 'thumb' ? 'thumb' : ''}`}>
        <ImageOff size={variant === 'thumb' ? 20 : 28} aria-hidden="true" />
        {variant !== 'thumb' && <span>{url ? 'تعذر تحميل صورة الوصل' : 'لم يُرفق وصل دفع'}</span>}
        {variant !== 'thumb' && url && (
          <a href={url} target="_blank" rel="noreferrer" className="link-inline">
            فتح الرابط <ExternalLink size={14} aria-hidden="true" />
          </a>
        )}
      </div>
    );
  }

  if (variant === 'thumb') {
    return <img src={url} alt={alt} className="receipt-thumb" loading="lazy" onError={() => setFailed(true)} />;
  }

  return (
    <>
      <button type="button" className="receipt-full" onClick={() => setZoomOpen(true)} aria-label="تكبير وصل الدفع">
        <img src={url} alt={alt} onError={() => setFailed(true)} />
        <span className="receipt-zoom">
          <ZoomIn size={16} aria-hidden="true" /> اضغط للتكبير
        </span>
      </button>

      <Modal open={zoomOpen} onClose={() => setZoomOpen(false)} title="وصل الدفع" size="xl">
        <div className={`receipt-lightbox ${actualSize ? 'actual' : ''}`}>
          <img
            src={url}
            alt={alt}
            onClick={() => setActualSize((v) => !v)}
            title={actualSize ? 'اضغط للتصغير' : 'اضغط للحجم الحقيقي'}
          />
        </div>
        <a href={url} target="_blank" rel="noreferrer" className="link-inline">
          فتح في تبويب جديد <ExternalLink size={14} aria-hidden="true" />
        </a>
      </Modal>
    </>
  );
}
