import { useTranslation } from 'react-i18next';
import './CrisisModal.css';

interface CrisisModalProps {
  open: boolean;
  onDismiss: () => void;
}

const CrisisModal: React.FC<CrisisModalProps> = ({ open, onDismiss }) => {
  const { t } = useTranslation();

  if (!open) return null;

  return (
    <div className="crisis-modal-overlay" role="dialog" aria-modal="true" aria-label={t('crisis.modal.title')}>
      <div className="crisis-modal">
        <span className="crisis-modal__icon" aria-hidden="true">💛</span>
        <h2 className="crisis-modal__title">{t('crisis.modal.title')}</h2>
        <p className="crisis-modal__message">{t('crisis.modal.message')}</p>
        <div className="crisis-modal__hotlines">{t('crisis.modal.hotlines')}</div>
        <button className="crisis-modal__dismiss" onClick={onDismiss} type="button">
          {t('crisis.modal.dismiss')}
        </button>
      </div>
    </div>
  );
};

export default CrisisModal;
