/**
 * Suspense fallback for lazy-loaded routes.
 *
 * Pure CSS spinner — no FontAwesome — so the Suspense fallback itself doesn't
 * drag the FA vendor chunk into the eager critical path. P1.2 review caught
 * the prior `<FontAwesomeIcon icon={faSpinner} />` version forcing FA into
 * the main bundle even though no critical-path route used it.
 */
const LoadingPage: React.FC = () => {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh',
        backgroundColor: '#f5f5f5',
      }}
    >
      <div
        aria-hidden="true"
        style={{
          width: '3rem',
          height: '3rem',
          border: '4px solid #e6e6e6',
          borderTopColor: '#1890ff',
          borderRadius: '50%',
          marginBottom: '1rem',
          animation: 'loading-spin 0.8s linear infinite',
        }}
      />
      <h2 style={{ color: '#333', fontWeight: 'normal' }}>Loading...</h2>
      <p style={{ color: '#666' }}>Please wait while we connect to the server</p>
      <style>{`@keyframes loading-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default LoadingPage;
