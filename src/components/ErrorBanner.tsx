import { AlertTriangle, RotateCw } from 'lucide-react';

interface ErrorBannerProps {
  message: string;
  hasCachedData: boolean;
  isRetrying: boolean;
  onRetry: () => void;
}

export function ErrorBanner({
  message,
  hasCachedData,
  isRetrying,
  onRetry,
}: ErrorBannerProps) {
  return (
    <div
      role="alert"
      className="border border-rose-200 bg-rose-50/90 rounded-lg p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
    >
      <div className="flex items-start gap-3 min-w-0">
        <div className="shrink-0 mt-0.5 text-rose-700" aria-hidden="true">
          <AlertTriangle className="w-5 h-5" />
        </div>
        <div className="space-y-1 min-w-0">
          <p className="text-sm font-semibold text-rose-950">
            Data Fetch Failed — USGS Seismic Feed Unavailable
          </p>
          <p className="text-sm text-rose-800 break-words">
            {message}
            {hasCachedData
              ? ' Showing the previously loaded snapshot below until connection is restored.'
              : ''}
          </p>
        </div>
      </div>

      <button
        type="button"
        onClick={onRetry}
        disabled={isRetrying}
        className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-rose-700 hover:bg-rose-800 disabled:opacity-60 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-rose-700"
      >
        <RotateCw className={`w-3.5 h-3.5 ${isRetrying ? 'animate-spin' : ''}`} />
        <span>{isRetrying ? 'Retrying...' : 'Retry Request'}</span>
      </button>
    </div>
  );
}
