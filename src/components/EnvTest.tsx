import React from 'react';
import { SUPABASE_URL, SUPABASE_ANON_KEY } from '../utils/environment';

const EnvTest = () => {
  return (
    <div>
      <h1>Environment Variable Test</h1>
      <p>SUPABASE_URL: {SUPABASE_URL ? 'Available' : 'Not Available'}</p>
      <p>SUPABASE_ANON_KEY: {SUPABASE_ANON_KEY ? 'Available' : 'Not Available'}</p>
      <pre>
        {JSON.stringify(import.meta.env, null, 2)}
      </pre>
    </div>
  );
};

export default EnvTest; 