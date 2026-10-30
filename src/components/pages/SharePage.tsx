import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTypeSafeTranslation } from '../../utils/translationHelper';
import Layout from '../layout/Layout';

/**
 * SharePage is a thin redirector: /share/:accessCode → stash the code in
 * sessionStorage, then navigate to /past-questions.
 *
 * The earlier version (pre-C2.2) rendered a full social-share UI after the
 * redirect useEffect, but that branch was unreachable — the effect fires on
 * every mount with a valid code. C2.1's tsconfig tightening exposed this
 * (setUserData was never called, so `userData` was always null, so the
 * post-redirect render was unreachable). C2.2 review flagged it; rather than
 * paper over with a rename, the dead render branches are deleted here and
 * the component reduced to its actual responsibility.
 *
 * If a real share UI is wanted later, revive from git history (e8076a9^1).
 */
const SharePage: React.FC = () => {
  const { t } = useTypeSafeTranslation();
  const { accessCode } = useParams<{ accessCode: string }>();
  const navigate = useNavigate();

  useEffect(() => {
    if (accessCode) {
      sessionStorage.setItem('temp_access_code', accessCode);
      navigate('/past-questions', { replace: true });
    }
  }, [accessCode, navigate]);

  if (!accessCode) {
    return (
      <Layout>
        <div style={{ padding: '20px' }}>
          <div className="error-message" role="alert">No access code provided</div>
          <button type="button" className="btn-primary-outline" onClick={() => navigate('/past-questions')} style={{ marginTop: 12 }}>
            {t('goToPastQuestions')}
          </button>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <div className="loading-spinner" style={{ margin: '0 auto 12px' }}></div>
        <p>{t('redirecting')}</p>
      </div>
    </Layout>
  );
};

export default SharePage;
