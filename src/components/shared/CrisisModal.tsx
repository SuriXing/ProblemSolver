import { useTranslation } from 'react-i18next';
import { useEffect, useRef, useCallback } from 'react';
import './CrisisModal.css';

interface CrisisModalProps {
  open: boolean;
  onDismiss: () => void;
}

const CrisisModal: React.FC<CrisisModalProps> = ({ open, onDismiss }) => {
  const { t, i18n } = useTranslation();
  const dismissRef = useRef<HTMLButtonElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  // Auto-focus dismiss button when modal opens
  useEffect(() => {
    if (open) {
      // Small delay to ensure DOM is rendered
      requestAnimationFrame(() => {
        dismissRef.current?.focus();
      });
    }
  }, [open]);

  // Focus trap: keep Tab cycling within the modal
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        onDismiss();
        return;
      }
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])'
        );
        if (focusable.length === 0) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault();
            last!.focus();
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault();
            first!.focus();
          }
        }
      }
    },
    [onDismiss]
  );

  if (!open) return null;

  const lang = i18n.language;
  const hotlineLinks = getHotlineLinks(lang);

  return (
    <div
      className="crisis-modal-overlay"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="crisis-modal-title"
      aria-describedby="crisis-modal-message"
      onKeyDown={handleKeyDown}
      onClick={onDismiss}
    >
      <div className="crisis-modal" ref={modalRef} onClick={(e) => e.stopPropagation()}>
        <span className="crisis-modal__icon" aria-hidden="true">💛</span>
        <h2 className="crisis-modal__title" id="crisis-modal-title">{t('crisis.modal.title')}</h2>
        <p className="crisis-modal__message" id="crisis-modal-message">{t('crisis.modal.message')}</p>
        <div className="crisis-modal__hotlines" dangerouslySetInnerHTML={{ __html: hotlineLinks }} />
        <button className="crisis-modal__dismiss" onClick={onDismiss} type="button" ref={dismissRef}>
          {t('crisis.modal.dismiss')}
        </button>
      </div>
    </div>
  );
};

/** Convert hotline text into tappable tel: links */
function getHotlineLinks(lang: string): string {
  const hotlineMap: Record<string, { text: string; lines: { label: string; href: string; display: string }[] }> = {
    en: {
      text: '',
      lines: [
        { label: '988 Suicide &amp; Crisis Lifeline', href: 'tel:988', display: '988' },
        { label: 'Crisis Text Line', href: 'sms:741741&body=HOME', display: 'Text HOME to 741741' },
      ],
    },
    'zh-CN': {
      text: '',
      lines: [
        { label: '希望24热线', href: 'tel:400-161-9995', display: '400-161-9995' },
        { label: '北京心理危机研究与干预中心', href: 'tel:010-82951332', display: '010-82951332' },
      ],
    },
    ja: {
      text: '',
      lines: [
        { label: 'よりそいホットライン', href: 'tel:0120-279-338', display: '0120-279-338' },
        { label: 'いのちの電話', href: 'tel:0570-783-556', display: '0570-783-556' },
      ],
    },
    ko: {
      text: '',
      lines: [
        { label: '자살예방상담전화', href: 'tel:1393', display: '1393' },
        { label: '정신건강위기상담전화', href: 'tel:1577-0199', display: '1577-0199' },
      ],
    },
    es: {
      text: '',
      lines: [
        { label: 'SAPTEL (México)', href: 'tel:800-911-2000', display: '800-911-2000' },
        { label: 'Línea de Crisis (México)', href: 'tel:800-290-0024', display: '800-290-0024' },
        { label: 'Línea Internacional de Prevención del Suicidio', href: 'tel:+1-888-628-9454', display: '+1-888-628-9454 (español)' },
      ],
    },
  };

  const data = hotlineMap[lang] ?? hotlineMap['en']!;
  return data!.lines
    .map((l) => `${l.label} — <a href="${l.href}">${l.display}</a>`)
    .join('\n');
}

export default CrisisModal;
