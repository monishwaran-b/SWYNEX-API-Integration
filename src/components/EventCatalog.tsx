import { ChevronLeft, ChevronRight, SearchX, Waves } from 'lucide-react';
import {
  formatCoordinates,
  formatRelativeTime,
  formatUtcDateTime,
  getSeverityLabel,
} from '../services/usgsApi';
import type { EarthquakeEvent } from '../types/earthquake';
import { SEVERITY_CONFIG } from './SeverityStyles';

interface EventCatalogProps {
  events: EarthquakeEvent[];
  selectedEventId: string | null;
  onSelectEvent: (event: EarthquakeEvent) => void;
  isLoading: boolean;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onResetFilters: () => void;
}

export function EventCatalog({
  events,
  selectedEventId,
  onSelectEvent,
  isLoading,
  page,
  pageSize,
  onPageChange,
  onResetFilters,
}: EventCatalogProps) {
  const totalPages = Math.max(1, Math.ceil(events.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const startIndex = (safePage - 1) * pageSize;
  const pageEvents = events.slice(startIndex, startIndex + pageSize);

  return (
    <section
      id="event-catalog"
      aria-label="Seismic event catalog"
      className="border border-slate-200 bg-white rounded-lg overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Recorded Seismic Events
          </h2>
          <p className="text-xs text-slate-500">
            Select any row to open full station and intensity telemetry
          </p>
        </div>

        <span className="text-xs font-mono tabular-nums text-slate-500 whitespace-nowrap">
          {events.length.toLocaleString()} events
        </span>
      </div>

      {/* Loading Skeleton */}
      {isLoading && events.length === 0 ? (
        <div className="divide-y divide-slate-200" aria-label="Loading seismic events">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="px-4 py-3.5 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="h-5 w-14 bg-slate-200 rounded-xs animate-pulse shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="h-4 w-3/5 bg-slate-200 rounded-xs animate-pulse" />
                  <div className="h-3 w-2/5 bg-slate-100 rounded-xs animate-pulse" />
                </div>
              </div>
              <div className="hidden sm:block h-4 w-24 bg-slate-100 rounded-xs animate-pulse shrink-0" />
            </div>
          ))}
        </div>
      ) : events.length === 0 ? (
        /* Empty Filter State */
        <div className="px-6 py-12 text-center space-y-3">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-slate-100 text-slate-500">
            <SearchX className="w-5 h-5" aria-hidden="true" />
          </div>
          <div className="space-y-1">
            <p className="text-sm font-semibold text-slate-900">
              No matching seismic events found
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              Adjust your search keywords, lower the minimum magnitude threshold, or switch to a wider USGS feed timeframe.
            </p>
          </div>
          <button
            type="button"
            onClick={onResetFilters}
            className="inline-flex items-center px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors cursor-pointer"
          >
            Clear Search &amp; Filters
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Data Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[11px] font-semibold text-slate-500">
                  <th scope="col" className="py-2.5 pl-4 pr-3 whitespace-nowrap">
                    Magnitude
                  </th>
                  <th scope="col" className="py-2.5 px-3">
                    Location &amp; Region
                  </th>
                  <th scope="col" className="py-2.5 px-3 text-right whitespace-nowrap">
                    Depth
                  </th>
                  <th scope="col" className="py-2.5 px-3 whitespace-nowrap">
                    Coordinates
                  </th>
                  <th scope="col" className="py-2.5 pl-3 pr-4 text-right whitespace-nowrap">
                    Origin Time
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-sm">
                {pageEvents.map((ev) => {
                  const isSelected = ev.id === selectedEventId;
                  const sev = SEVERITY_CONFIG[ev.severity];
                  return (
                    <tr
                      key={ev.id}
                      onClick={() => onSelectEvent(ev)}
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          onSelectEvent(ev);
                        }
                      }}
                      aria-selected={isSelected}
                      className={`cursor-pointer transition-colors focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-blue-600 ${
                        isSelected
                          ? 'bg-blue-50/70'
                          : 'hover:bg-slate-50'
                      }`}
                    >
                      <td className="py-3 pl-4 pr-3 whitespace-nowrap align-top">
                        <div className="flex items-baseline gap-2">
                          <span className={`font-mono tabular-nums font-semibold text-sm ${sev.textColor}`}>
                            {ev.magnitude.toFixed(1)}
                          </span>
                          <span className="text-xs text-slate-500">
                            {getSeverityLabel(ev.severity)}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-3 align-top max-w-[320px]">
                        <div className="font-medium text-slate-900 truncate" title={ev.place}>
                          {ev.place}
                        </div>
                        <div className="mt-0.5 flex items-center gap-1.5 text-xs text-slate-500">
                          <span>{ev.region}</span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono">{ev.id}</span>
                          {ev.tsunami && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="inline-flex items-center gap-1 font-medium text-rose-700">
                                <Waves className="w-3 h-3" aria-hidden="true" />
                                Tsunami flag
                              </span>
                            </>
                          )}
                          {ev.felt !== null && ev.felt > 0 && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="tabular-nums">{ev.felt} felt</span>
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right font-mono tabular-nums text-xs text-slate-700 whitespace-nowrap align-top">
                        {ev.depthKm.toFixed(1)} km
                      </td>
                      <td className="py-3 px-3 font-mono tabular-nums text-xs text-slate-600 whitespace-nowrap align-top">
                        {formatCoordinates(ev.latitude, ev.longitude)}
                      </td>
                      <td className="py-3 pl-3 pr-4 text-right whitespace-nowrap align-top">
                        <div className="text-xs font-medium text-slate-800 tabular-nums">
                          {formatRelativeTime(ev.time)}
                        </div>
                        <div className="text-[11px] font-mono tabular-nums text-slate-500">
                          {formatUtcDateTime(ev.time)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Hairline List */}
          <div className="md:hidden divide-y divide-slate-200">
            {pageEvents.map((ev) => {
              const isSelected = ev.id === selectedEventId;
              const sev = SEVERITY_CONFIG[ev.severity];
              return (
                <button
                  key={ev.id}
                  type="button"
                  onClick={() => onSelectEvent(ev)}
                  className={`w-full text-left px-4 py-3.5 transition-colors cursor-pointer ${
                    isSelected ? 'bg-blue-50/70' : 'hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="flex items-baseline gap-2">
                      <span className={`font-mono tabular-nums font-semibold text-base ${sev.textColor}`}>
                        M {ev.magnitude.toFixed(1)}
                      </span>
                      <span className="text-xs font-medium text-slate-600">
                        {getSeverityLabel(ev.severity)}
                      </span>
                    </div>
                    <span className="text-xs font-mono tabular-nums text-slate-500">
                      {formatRelativeTime(ev.time)}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-slate-900">
                    {ev.place}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-slate-500 font-mono tabular-nums">
                    <span>Depth {ev.depthKm.toFixed(1)} km</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatCoordinates(ev.latitude, ev.longitude)}</span>
                    {ev.tsunami && (
                      <>
                        <span aria-hidden="true">·</span>
                        <span className="font-sans font-medium text-rose-700">
                          Tsunami flag
                        </span>
                      </>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Pagination Footer */}
          {events.length > pageSize && (
            <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/60 flex items-center justify-between gap-4">
              <p className="text-xs font-mono tabular-nums text-slate-600">
                Showing {startIndex + 1}–{Math.min(startIndex + pageSize, events.length)} of{' '}
                {events.length.toLocaleString()}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => onPageChange(safePage - 1)}
                  disabled={safePage <= 1}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-md text-slate-700 hover:bg-slate-50 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                >
                  <ChevronLeft className="w-3.5 h-3.5" aria-hidden="true" />
                  <span>Previous</span>
                </button>
                <span className="text-xs font-mono tabular-nums text-slate-600 px-1">
                  {safePage} / {totalPages}
                </span>
                <button
                  type="button"
                  onClick={() => onPageChange(safePage + 1)}
                  disabled={safePage >= totalPages}
                  className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium bg-white border border-slate-200 rounded-md text-slate-700 hover:bg-slate-50 disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
                >
                  <span>Next</span>
                  <ChevronRight className="w-3.5 h-3.5" aria-hidden="true" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </section>
  );
}
