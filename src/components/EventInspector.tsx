import { ExternalLink, Waves, X } from 'lucide-react';
import {
  formatCoordinates,
  formatRelativeTime,
  formatUtcDateTime,
  getSeverityLabel,
} from '../services/usgsApi';
import type { EarthquakeEvent } from '../types/earthquake';
import { SEVERITY_CONFIG } from './SeverityStyles';

interface EventInspectorProps {
  event: EarthquakeEvent | null;
  onCloseMobile: () => void;
  isMobileOpen: boolean;
}

function TelemetryRow({
  label,
  value,
  mono = true,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="py-2.5 flex items-baseline justify-between gap-4 border-b border-slate-100 last:border-b-0">
      <dt className="text-xs text-slate-500 shrink-0">{label}</dt>
      <dd
        className={`text-xs text-right text-slate-900 break-words ${
          mono ? 'font-mono tabular-nums' : 'font-medium'
        }`}
      >
        {value}
      </dd>
    </div>
  );
}

function InspectorBody({ event }: { event: EarthquakeEvent }) {
  const sev = SEVERITY_CONFIG[event.severity];

  return (
    <div className="space-y-5">
      {/* Magnitude & Place Header */}
      <div className="pb-4 border-b border-slate-200">
        <div className="flex items-baseline justify-between gap-3">
          <div className="flex items-baseline gap-2">
            <span className={`text-3xl font-bold font-mono tabular-nums ${sev.textColor}`}>
              {event.magnitude.toFixed(1)}
            </span>
            <span className="text-xs font-mono uppercase text-slate-500">
              {event.magType}
            </span>
          </div>
          <span className={`text-xs font-semibold ${sev.textColor}`}>
            {getSeverityLabel(event.severity)} · Tier {sev.range}
          </span>
        </div>

        <h3 className="mt-2 text-base font-semibold text-slate-900 leading-snug">
          {event.place}
        </h3>
        <p className="mt-1 text-xs text-slate-500 font-mono tabular-nums">
          {formatRelativeTime(event.time)} · {formatUtcDateTime(event.time)}
        </p>

        {event.tsunami && (
          <div className="mt-3 p-2.5 rounded-md bg-rose-50 border border-rose-200 flex items-center gap-2 text-xs font-medium text-rose-900">
            <Waves className="w-4 h-4 text-rose-700 shrink-0" aria-hidden="true" />
            <span>Tsunami advisory flag issued for this event</span>
          </div>
        )}
      </div>

      {/* Hypocenter & Coordinates */}
      <div>
        <h4 className="text-xs font-semibold text-slate-700 mb-1">
          Hypocenter Telemetry
        </h4>
        <dl>
          <TelemetryRow
            label="Coordinates"
            value={formatCoordinates(event.latitude, event.longitude)}
          />
          <TelemetryRow label="Focal Depth" value={`${event.depthKm.toFixed(2)} km`} />
          <TelemetryRow label="Event Type" value={event.eventType} mono={false} />
          <TelemetryRow label="Review Status" value={event.status} mono={false} />
          <TelemetryRow label="USGS Event ID" value={event.id} />
        </dl>
      </div>

      {/* Intensity & Impact */}
      <div>
        <h4 className="text-xs font-semibold text-slate-700 mb-1">
          Impact &amp; ShakeMap
        </h4>
        <dl>
          <TelemetryRow
            label="Felt Reports"
            value={event.felt !== null ? `${event.felt.toLocaleString()} responses` : 'None reported'}
          />
          <TelemetryRow
            label="Max Reported CDI"
            value={event.cdi !== null ? event.cdi.toFixed(1) : '—'}
          />
          <TelemetryRow
            label="Instrumental MMI"
            value={event.mmi !== null ? event.mmi.toFixed(1) : '—'}
          />
          <TelemetryRow
            label="PAGER Alert"
            value={event.alert ? event.alert.toUpperCase() : 'Not assigned'}
          />
          <TelemetryRow label="Significance Score" value={String(event.sig)} />
        </dl>
      </div>

      {/* Network Diagnostics */}
      <div>
        <h4 className="text-xs font-semibold text-slate-700 mb-1">
          Seismic Array Quality
        </h4>
        <dl>
          <TelemetryRow label="Contributing Network" value={event.net.toUpperCase()} />
          <TelemetryRow
            label="Reporting Stations"
            value={event.nst !== null ? `${event.nst} stations` : '—'}
          />
          <TelemetryRow
            label="Azimuthal Gap"
            value={event.gap !== null ? `${event.gap.toFixed(0)}°` : '—'}
          />
          <TelemetryRow
            label="RMS Travel Residual"
            value={event.rms !== null ? `${event.rms.toFixed(2)} s` : '—'}
          />
        </dl>
      </div>

      {/* External USGS Link */}
      <div className="pt-2">
        <a
          href={event.url}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md transition-colors"
        >
          <span>Open Official USGS Event Page</span>
          <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
        </a>
      </div>
    </div>
  );
}

export function EventInspector({
  event,
  onCloseMobile,
  isMobileOpen,
}: EventInspectorProps) {
  return (
    <>
      {/* Desktop Sticky Sidebar Inspector */}
      <aside
        aria-label="Selected earthquake telemetry inspector"
        className="hidden xl:block w-[370px] shrink-0"
      >
        <div className="sticky top-22 border border-slate-200 bg-white rounded-lg p-5">
          {event ? (
            <InspectorBody event={event} />
          ) : (
            <div className="py-10 text-center space-y-2">
              <p className="text-sm font-semibold text-slate-900">
                No Event Selected
              </p>
              <p className="text-xs text-slate-500">
                Click any marker on the seismic projection map or any row in the event catalog to inspect full USGS station telemetry.
              </p>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile / Tablet Slide-over Inspector Drawer */}
      {isMobileOpen && event && (
        <div
          className="xl:hidden fixed inset-0 z-40 flex justify-end bg-slate-900/40 backdrop-blur-[1px]"
          role="dialog"
          aria-modal="true"
          aria-label="Earthquake telemetry details"
        >
          <div className="fixed inset-0" onClick={onCloseMobile} aria-hidden="true" />
          <div className="relative z-10 w-full max-w-md bg-white h-full overflow-y-auto border-l border-slate-200 p-5 shadow-lg">
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-200">
              <span className="text-xs font-semibold text-slate-500">
                Event Telemetry
              </span>
              <button
                type="button"
                onClick={onCloseMobile}
                aria-label="Close telemetry panel"
                className="p-2 -mr-2 text-slate-500 hover:text-slate-900 rounded-md cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <InspectorBody event={event} />
          </div>
        </div>
      )}
    </>
  );
}
