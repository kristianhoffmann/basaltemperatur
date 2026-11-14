// ============================================================================
// LOADING STATE (nur angemeldeter Bereich)
// Wird angezeigt, während Seiten des Dashboards laden.
//
// Liegt bewusst NICHT mehr unter app/: Als app/loading.tsx umschloss die Datei
// jede öffentliche Seite mit einer Suspense-Grenze. Das ausgelieferte HTML von
// Startseite, Ratgeber und Werkzeug begann dann sichtbar mit „Wird geladen...“,
// der eigentliche Inhalt samt H1 stand in <div hidden> und wurde erst per
// Inline-Skript eingetauscht (gemessen am 14.11.2026). Crawler ohne JavaScript
// sahen nur den Spinner. tests/seo-rendering-shell.test.ts sichert das ab.
// ============================================================================

export default function Loading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center">
        {/* Animated Logo/Spinner */}
        <div className="relative inline-flex">
          <div className="w-12 h-12 rounded-full border-4 border-gray-200 dark:border-gray-700" />
          <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-4 border-primary-600 border-t-transparent animate-spin" />
        </div>
        
        {/* Text */}
        <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">
          Wird geladen...
        </p>
      </div>
    </div>
  );
}
