'use client';

import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { cn } from '@/lib/utils';

// ============================================================================
// PWA CONTEXT & HOOKS
// Service Worker Registration und Install Prompt
// ============================================================================

interface PWAContextType {
  isInstallable: boolean;
  isInstalled: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  installApp: () => Promise<void>;
  updateApp: () => void;
  dismissInstallPrompt: () => void;
}

const PWAContext = createContext<PWAContextType | null>(null);

// ============================================================================
// PWA PROVIDER
// ============================================================================

interface PWAProviderProps {
  children: ReactNode;
}

export function PWAProvider({ children }: PWAProviderProps) {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Service Worker registrieren
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
      return;
    }

    // Service Worker registrieren
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('Service Worker registered:', reg);
        setRegistration(reg);

        // Auf Updates prüfen
        reg.addEventListener('updatefound', () => {
          const newWorker = reg.installing;
          if (newWorker) {
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                setIsUpdateAvailable(true);
              }
            });
          }
        });
      })
      .catch((error) => {
        console.error('Service Worker registration failed:', error);
      });

    // Prüfen ob bereits installiert
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
  }, []);

  // Install Prompt Event
  useEffect(() => {
    const handler = (e: BeforeInstallPromptEvent) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handler as EventListener);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler as EventListener);
    };
  }, []);

  // App Installed Event
  useEffect(() => {
    const handler = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('appinstalled', handler);

    return () => {
      window.removeEventListener('appinstalled', handler);
    };
  }, []);

  // Online/Offline Status
  useEffect(() => {
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // App installieren
  const installApp = useCallback(async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    console.log('Install prompt outcome:', outcome);
    
    if (outcome === 'accepted') {
      setIsInstallable(false);
    }
    
    setDeferredPrompt(null);
  }, [deferredPrompt]);

  // App aktualisieren
  const updateApp = useCallback(() => {
    if (registration?.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  }, [registration]);

  // Install Prompt ausblenden
  const dismissInstallPrompt = useCallback(() => {
    setIsInstallable(false);
    // In localStorage speichern, damit nicht erneut gezeigt wird
    if (typeof window !== 'undefined') {
      localStorage.setItem('pwa-install-dismissed', Date.now().toString());
    }
  }, []);

  return (
    <PWAContext.Provider
      value={{
        isInstallable,
        isInstalled,
        isOnline,
        isUpdateAvailable,
        installApp,
        updateApp,
        dismissInstallPrompt,
      }}
    >
      {children}
    </PWAContext.Provider>
  );
}

// ============================================================================
// USE PWA HOOK
// ============================================================================

export function usePWA() {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWA must be used within a PWAProvider');
  }
  return context;
}

// ============================================================================
// INSTALL BANNER
// ============================================================================

interface InstallBannerProps {
  className?: string;
}

export function InstallBanner({ className }: InstallBannerProps) {
  const { isInstallable, installApp, dismissInstallPrompt } = usePWA();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Prüfen ob bereits dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed');
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      const daysSinceDismissed = (Date.now() - dismissedTime) / (1000 * 60 * 60 * 24);
      // Nach 7 Tagen erneut zeigen
      if (daysSinceDismissed < 7) {
        return;
      }
    }
    
    // Mit Verzögerung einblenden
    if (isInstallable) {
      const timer = setTimeout(() => setIsVisible(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [isInstallable]);

  if (!isVisible) return null;

  return (
    <div
      className={cn(
        'fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50',
        'bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700',
        'p-4 animate-in slide-in-from-bottom-4 fade-in-0',
        className
      )}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
          <Smartphone className="w-6 h-6 text-primary-600 dark:text-primary-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white">
            App installieren
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Installieren Sie die App für schnelleren Zugriff und Offline-Nutzung.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <button
              onClick={installApp}
              className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-primary-600 hover:bg-primary-700 rounded-md transition-colors"
            >
              <Download className="w-4 h-4" />
              Installieren
            </button>
            <button
              onClick={() => {
                dismissInstallPrompt();
                setIsVisible(false);
              }}
              className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
            >
              Später
            </button>
          </div>
        </div>
        <button
          onClick={() => {
            dismissInstallPrompt();
            setIsVisible(false);
          }}
          className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// UPDATE BANNER
// ============================================================================

export function UpdateBanner() {
  const { isUpdateAvailable, updateApp } = usePWA();

  if (!isUpdateAvailable) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 z-50 bg-blue-600 text-white rounded-lg shadow-xl p-4 animate-in slide-in-from-bottom-4">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">
          Eine neue Version ist verfügbar!
        </p>
        <button
          onClick={updateApp}
          className="px-3 py-1 text-sm font-medium bg-white text-blue-600 rounded hover:bg-blue-50 transition-colors"
        >
          Aktualisieren
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// OFFLINE INDICATOR
// ============================================================================

export function OfflineIndicator() {
  const { isOnline } = usePWA();

  if (isOnline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-50 bg-yellow-500 text-yellow-900 text-center py-2 text-sm font-medium">
      Sie sind offline. Einige Funktionen sind möglicherweise eingeschränkt.
    </div>
  );
}

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}
