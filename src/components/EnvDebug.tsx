import React, { useState, useEffect } from 'react';

interface EnvVars {
  [key: string]: string;
}

export const EnvDebug: React.FC = () => {
  const [viteVars, setViteVars] = useState<EnvVars>({});
  const [processVars, setProcessVars] = useState<EnvVars>({});

  useEffect(() => {
    // Get Vite environment variables
    const viteEnvVars: EnvVars = {};
    Object.keys(import.meta.env).forEach(key => {
      if (key.startsWith('VITE_')) {
        // Mask sensitive values
        const value = typeof import.meta.env[key] === 'string' ? import.meta.env[key] as string : '';
        viteEnvVars[key] = key.includes('KEY') ? 
          (value ? value.substring(0, 10) + '...' : 'not set') : 
          value;
      }
    });
    setViteVars(viteEnvVars);

    // Get process.env variables
    const processEnvVars: EnvVars = {};
    Object.keys(process.env).forEach(key => {
      if (key.startsWith('REACT_APP_')) {
        // Mask sensitive values
        const value = process.env[key] || '';
        processEnvVars[key] = key.includes('KEY') ? 
          (value ? value.substring(0, 10) + '...' : 'not set') : 
          value;
      }
    });
    setProcessVars(processEnvVars);
  }, []);

  return (
    <div className="env-debug">
      <h2>Vite Environment Variables</h2>
      <pre>{JSON.stringify(viteVars, null, 2)}</pre>
      
      <h2>Process Environment Variables</h2>
      <pre>{JSON.stringify(processVars, null, 2)}</pre>
    </div>
  );
};

export default EnvDebug; 