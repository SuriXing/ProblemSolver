import React from 'react';

const EnvDebugRaw: React.FC = () => {
  return (
    <div className="env-debug-raw">
      <h2>Raw Environment Variables</h2>
      <div>
        <h3>import.meta.env keys:</h3>
        <pre>{JSON.stringify(Object.keys(import.meta.env), null, 2)}</pre>
        
        <h3>Direct access to specific vars:</h3>
        <pre>VITE_SUPABASE_URL: {import.meta.env.VITE_SUPABASE_URL || 'undefined'}</pre>
        <pre>VITE_SUPABASE_ANON_KEY: {import.meta.env.VITE_SUPABASE_ANON_KEY ? '[masked]' : 'undefined'}</pre>
      </div>
    </div>
  );
};

export default EnvDebugRaw; 