'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

// ============================================================================
// GLOBAL ERROR BOUNDARY
// ============================================================================

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Application error:', error);
  }, [error]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ backgroundColor: 'var(--bg)' }}>
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 mb-6">
          <AlertTriangle className="w-8 h-8 text-red-500" />
        </div>

        <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--text)' }}>
          Ein Fehler ist aufgetreten
        </h1>
        <p className="mb-6" style={{ color: 'var(--text-secondary)' }}>
          Es tut uns leid, aber etwas ist schiefgelaufen.
          Bitte versuche es erneut oder kehre zur Startseite zurück.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-2xl text-left">
            <p className="text-xs font-mono text-red-800 break-all">
              {error.message}
            </p>
            {error.digest && (
              <p className="mt-2 text-xs text-red-600">
                Error ID: {error.digest}
              </p>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button onClick={reset} className="btn-primary">
            <RefreshCw className="w-4 h-4" />
            Erneut versuchen
          </button>
          <a href="/" className="btn-secondary">
            <Home className="w-4 h-4" />
            Zur Startseite
          </a>
        </div>
      </div>
    </div>
  );
}
