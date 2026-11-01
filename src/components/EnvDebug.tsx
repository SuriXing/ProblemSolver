import React, { useState, useEffect } from 'react';

interface EnvVars {
  [key: string]: string;
}

const EnvDebug: React.FC = () => {
  const [viteVars, setViteVars] = useState<EnvVars>({});

  useEffect(() => {
    // Dev-only panel. NEVER read process.env here: `Object.keys(process.env)`
    // made Vite inline the whole build-machine environment (RESEND_API_KEY,
    // NOTIFICATION_TRIGGER_SECRET, LLM keys and the Vercel plumbing) into a
    // publicly serveable chunk — see the 2026-11-01 incident. Only the
    // VITE_* public vars are shown, and only in dev builds.
    if (!import.meta.env.DEV) return;
    const viteEnvVars: EnvVars = {};
    Object.keys(import.meta.env).forEach(key => {
      if (key.startsWith('VITE_')) {
        const value = typeof import.meta.env[key] === 'string' ? import.meta.env[key] as string : '';
        viteEnvVars[key] = key.includes('KEY') ?
          (value ? value.substring(0, 10) + '...' : 'not set') :
          value;
      }
    });
    setViteVars(viteEnvVars);
  }, []);

  if (!import.meta.env.DEV) return null;

  return (
    <div className="env-debug">
      <h2>Vite Environment Variables</h2>
      <pre>{JSON.stringify(viteVars, null, 2)}</pre>
    </div>
  );
};

export default EnvDebug; 