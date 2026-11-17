import type { EarthquakeEvent } from '../types/earthquake';

interface MetricsStripProps {
  allEvents: EarthquakeEvent[];
  filteredEvents: EarthquakeEvent[];
  isLoading: boolean;
}

export function MetricsStrip({
  allEvents,
  filteredEvents,
  isLoading,
}: MetricsStripProps) {
  if (isLoading && allEvents.length === 0) {
    return (
      <div
        aria-label="Loading seismic summary metrics"
        className="grid grid-cols-2 lg:grid-cols-4 border border-slate-200 bg-white rounded-lg divide-y sm:divide-y-0 sm:divide-x divide-slate-200"
      >
        {[0, 1, 2, 3].map((idx) => (
          <div key={idx} className="p-4 sm:p-5 space-y-2.5">
            <div className="h-3.5 w-28 bg-slate-200 rounded-xs animate-pulse" />
            <div className="h-7 w-24 bg-slate-200 rounded-xs animate-pulse" />
            <div className="h-3 w-36 bg-slate-100 rounded-xs animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  const target = filteredEvents;
  const totalCount = target.length;

  let peakEvent: EarthquakeEvent | null = null;
  let depthSum = 0;
  let shallowCount = 0;
  let tsunamiCount = 0;
  let alertCount = 0;

  for (const ev of target) {
    if (!peakEvent || ev.magnitude > peakEvent.magnitude) {
      peakEvent = ev;
    }
    depthSum += ev.depthKm;
    if (ev.depthKm < 70) {
      shallowCount += 1;
    }
    if (ev.tsunami) {
      tsunamiCount += 1;
    }
    if (ev.alert === 'yellow' || ev.alert === 'orange' || ev.alert === 'red') {
      alertCount += 1;
    }
  }

  const meanDepth = totalCount > 0 ? depthSum / totalCount : 0;
  const shallowPct = totalCount > 0 ? Math.round((shallowCount / totalCount) * 100) : 0;

  return (
    <section
      aria-label="Key seismic metrics"
      className="grid grid-cols-2 lg:grid-cols-4 border border-slate-200 bg-white rounded-lg divide-y lg:divide-y-0 sm:divide-x divide-slate-200"
    >
      {/* Metric 1: Matching Events */}
      <div className="p-4 sm:p-5">
        <p className="text-xs font-medium text-slate-500">Matching Events</p>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-2xl font-semibold font-mono tabular-nums text-slate-900">
            {totalCount.toLocaleString()}
          </span>
          <span className="text-xs font-mono text-slate-500">
            / {allEvents.length.toLocaleString()}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500 truncate">
          {totalCount === allEvents.length
            ? 'All recorded events in window'
            : 'Filtered from active USGS feed'}
        </p>
      </div>

      {/* Metric 2: Peak Magnitude */}
      <div className="p-4 sm:p-5">
        <p className="text-xs font-medium text-slate-500">Peak Magnitude</p>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-2xl font-semibold font-mono tabular-nums text-slate-900">
            {peakEvent ? peakEvent.magnitude.toFixed(1) : '—'}
          </span>
          <span className="text-xs font-mono uppercase text-slate-500">
            {peakEvent ? peakEvent.magType : 'Mw'}
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500 truncate" title={peakEvent?.place}>
          {peakEvent ? peakEvent.place : 'No events in current filter'}
        </p>
      </div>

      {/* Metric 3: Mean Focal Depth */}
      <div className="p-4 sm:p-5">
        <p className="text-xs font-medium text-slate-500">Mean Focal Depth</p>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span className="text-2xl font-semibold font-mono tabular-nums text-slate-900">
            {totalCount > 0 ? meanDepth.toFixed(1) : '—'}
          </span>
          <span className="text-xs font-mono text-slate-500">km</span>
        </div>
        <p className="mt-1 text-xs text-slate-500 truncate">
          {totalCount > 0 ? `${shallowPct}% shallow (< 70 km)` : 'Awaiting seismic records'}
        </p>
      </div>

      {/* Metric 4: Advisories */}
      <div className="p-4 sm:p-5">
        <p className="text-xs font-medium text-slate-500">Tsunami &amp; PAGER Alerts</p>
        <div className="mt-1.5 flex items-baseline gap-1.5">
          <span
            className={`text-2xl font-semibold font-mono tabular-nums ${
              tsunamiCount > 0 || alertCount > 0 ? 'text-rose-700' : 'text-slate-900'
            }`}
          >
            {tsunamiCount}
          </span>
          <span className="text-xs font-mono text-slate-500">
            tsunami · {alertCount} PAGER
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-500 truncate">
          {tsunamiCount > 0
            ? 'Active tsunami flag detected'
            : 'No tsunami bulletins in selection'}
        </p>
      </div>
    </section>
  );
}
