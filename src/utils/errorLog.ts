import { supabase } from '../lib/supabase';

export interface LogErrorOpts {
  source: 'client' | 'api' | 'cron';
  message: string;
  stack?: string;
  route?: string;
  extra?: Record<string, unknown>;
}

let installed = false;

function simpleFingerprint(message: string, stack?: string): string {
  const s = (message + (stack ?? '')).slice(0, 200);
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  }
  return String(h);
}

export async function logError(opts: LogErrorOpts): Promise<void> {
  try {
    const route = opts.route ?? (typeof window !== 'undefined' ? window.location.hash : undefined);
    const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : undefined;

    await supabase.from('app_errors').insert([
      {
        source: opts.source,
        route: route ?? null,
        user_agent: userAgent ?? null,
        error_message: opts.message.slice(0, 500),
        error_stack: opts.stack?.slice(0, 4000) ?? null,
        extra: opts.extra ?? null,
        fingerprint: simpleFingerprint(opts.message, opts.stack),
      },
    ]);
  } catch {
    // Never throw from the logger. If logging fails we degrade silently —
    // the original error is already surfaced to the user. Swallowing here
    // prevents a broken logger from cascading into a broken catch block.
  }
}

/**
 * Install global error handlers. Call once at app startup.
 *
 * Captures:
 *   - uncaught errors (window.onerror)
 *   - unhandled promise rejections (window.onunhandledrejection)
 *
 * React render errors are caught separately by the ErrorBoundary component.
 */
export function installGlobalErrorHandlers(): void {
  if (installed || typeof window === 'undefined') return;
  installed = true;

  window.addEventListener('error', (event) => {
    void logError({
      source: 'client',
      message: event.message || 'window.onerror',
      stack: event.error instanceof Error ? event.error.stack : undefined,
      extra: {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
      },
    });
  });

  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message =
      reason instanceof Error
        ? reason.message
        : typeof reason === 'string'
          ? reason
          : 'unhandledrejection';
    const stack = reason instanceof Error ? reason.stack : undefined;

    void logError({
      source: 'client',
      message,
      stack,
      extra: { kind: 'unhandledrejection' },
    });
  });
}

export { simpleFingerprint as _simpleFingerprint };
