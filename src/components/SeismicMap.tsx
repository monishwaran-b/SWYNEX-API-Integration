import { useMemo, useRef, useState } from 'react';
import {
  MAP_HEIGHT,
  MAP_WIDTH,
  WORLD_LANDMASS_PATHS,
  projectLonLat,
  unprojectPoint,
} from '../data/worldCoastlines';
import { formatCoordinates, getSeverityLabel } from '../services/usgsApi';
import type { EarthquakeEvent, MapRegionId } from '../types/earthquake';
import { SEVERITY_CONFIG } from './SeverityStyles';

interface SeismicMapProps {
  events: EarthquakeEvent[];
  selectedEventId: string | null;
  onSelectEvent: (event: EarthquakeEvent) => void;
  isLoading: boolean;
}

const REGION_VIEWBOXES: Record<
  MapRegionId,
  { label: string; viewBox: string; scaleFactor: number }
> = {
  global: { label: 'Global', viewBox: '0 0 1000 500', scaleFactor: 1 },
  pacific: { label: 'Pacific Rim', viewBox: '650 60 350 320', scaleFactor: 0.52 },
  americas: { label: 'Americas', viewBox: '50 55 370 360', scaleFactor: 0.52 },
  eurasia: { label: 'Eurasia', viewBox: '450 55 430 280', scaleFactor: 0.56 },
};

const LON_TICKS = [-150, -120, -90, -60, -30, 0, 30, 60, 90, 120, 150];
const LAT_TICKS = [-60, -30, 0, 30, 60];

export function SeismicMap({
  events,
  selectedEventId,
  onSelectEvent,
  isLoading,
}: SeismicMapProps) {
  const [region, setRegion] = useState<MapRegionId>('global');
  const [hoveredEvent, setHoveredEvent] = useState<EarthquakeEvent | null>(null);
  const [cursorCoords, setCursorCoords] = useState<{ lat: number; lon: number } | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const activeRegion = REGION_VIEWBOXES[region];

  // Draw smaller events first so stronger events remain clickable on top
  const sortedForPaint = useMemo(() => {
    return [...events].sort((a, b) => a.magnitude - b.magnitude);
  }, [events]);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;

    const [vx, vy, vw, vh] = activeRegion.viewBox.split(' ').map(Number);
    const relX = (e.clientX - rect.left) / rect.width;
    const relY = (e.clientY - rect.top) / rect.height;
    const mapX = vx + relX * vw;
    const mapY = vy + relY * vh;
    setCursorCoords(unprojectPoint(mapX, mapY));
  };

  return (
    <section
      id="seismic-map"
      aria-label="Global seismic distribution map"
      className="border border-slate-200 bg-white rounded-lg overflow-hidden"
    >
      {/* Header bar */}
      <div className="px-4 py-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Global Seismic Projection
          </h2>
          <p className="text-xs text-slate-500">
            Equirectangular plot · Click any epicenter marker to inspect telemetry
          </p>
        </div>

        <div
          role="group"
          aria-label="Map region focus"
          className="flex items-center gap-1 p-1 bg-slate-100 rounded-md self-start sm:self-auto overflow-x-auto"
        >
          {(Object.keys(REGION_VIEWBOXES) as MapRegionId[]).map((id) => {
            const active = region === id;
            return (
              <button
                key={id}
                type="button"
                aria-pressed={active}
                onClick={() => setRegion(id)}
                className={`px-2.5 py-1 text-xs font-medium rounded-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {REGION_VIEWBOXES[id].label}
              </button>
            );
          })}
        </div>
      </div>

      {/* SVG Map Canvas */}
      <div className="relative bg-slate-100/80">
        {/* Live Crosshair Coordinate Readout */}
        <div className="absolute top-3 left-3 z-10 pointer-events-none bg-white/90 border border-slate-200 rounded-sm px-2.5 py-1 text-[11px] font-mono tabular-nums text-slate-700">
          {cursorCoords
            ? formatCoordinates(cursorCoords.lat, cursorCoords.lon)
            : 'Hover map for coordinates'}
        </div>

        {/* Hover Event Tooltip */}
        {hoveredEvent && (
          <div className="absolute top-3 right-3 z-10 pointer-events-none bg-slate-900 text-white rounded-md px-3 py-2 max-w-[260px] shadow-sm">
            <div className="flex items-center justify-between gap-3 text-xs font-mono tabular-nums">
              <span className="font-semibold">
                M {hoveredEvent.magnitude.toFixed(1)}
              </span>
              <span className="text-slate-300">
                Depth {hoveredEvent.depthKm.toFixed(1)} km
              </span>
            </div>
            <p className="mt-0.5 text-xs text-slate-100 line-clamp-2">
              {hoveredEvent.place}
            </p>
          </div>
        )}

        <svg
          ref={svgRef}
          viewBox={activeRegion.viewBox}
          preserveAspectRatio="xMidYMid meet"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setCursorCoords(null)}
          className="w-full h-auto block cursor-crosshair select-none aspect-[2/1]"
          role="img"
          aria-label={`World map plotting ${events.length} filtered earthquake epicenters`}
        >
          {/* Ocean backdrop */}
          <rect x={0} y={0} width={MAP_WIDTH} height={MAP_HEIGHT} fill="#F1F5F9" />

          {/* Graticule lines */}
          <g stroke="#CBD5E1" strokeWidth={0.5 * activeRegion.scaleFactor} strokeDasharray="2 3">
            {LON_TICKS.map((lon) => {
              const [x] = projectLonLat(lon, 0);
              return <line key={`lon-${lon}`} x1={x} y1={0} x2={x} y2={MAP_HEIGHT} />;
            })}
            {LAT_TICKS.map((lat) => {
              const [, y] = projectLonLat(0, lat);
              return (
                <line
                  key={`lat-${lat}`}
                  x1={0}
                  y1={y}
                  x2={MAP_WIDTH}
                  y2={y}
                  stroke={lat === 0 ? '#94A3B8' : '#CBD5E1'}
                />
              );
            })}
          </g>

          {/* World Landmasses */}
          <g fill="#E2E8F0" stroke="#94A3B8" strokeWidth={0.6 * activeRegion.scaleFactor}>
            {WORLD_LANDMASS_PATHS.map((d, idx) => (
              <path key={idx} d={d} />
            ))}
          </g>

          {/* Earthquake Markers */}
          <g>
            {sortedForPaint.map((ev) => {
              const [cx, cy] = projectLonLat(ev.longitude, ev.latitude);
              const style = SEVERITY_CONFIG[ev.severity];
              const isSelected = ev.id === selectedEventId;
              const isHovered = hoveredEvent?.id === ev.id;
              const baseRadius = Math.max(2.2, Math.pow(1.48, Math.max(0, ev.magnitude)) * 1.15);
              const radius = Math.min(18, baseRadius) * activeRegion.scaleFactor;

              return (
                <g
                  key={ev.id}
                  onClick={() => onSelectEvent(ev)}
                  onMouseEnter={() => setHoveredEvent(ev)}
                  onMouseLeave={() => setHoveredEvent((prev) => (prev?.id === ev.id ? null : prev))}
                  className="cursor-pointer"
                >
                  {isSelected && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={radius + 4.5 * activeRegion.scaleFactor}
                      fill="none"
                      stroke="#0F172A"
                      strokeWidth={1.6 * activeRegion.scaleFactor}
                    />
                  )}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={radius}
                    fill={style.dotFill}
                    fillOpacity={isSelected || isHovered ? 0.92 : 0.62}
                    stroke={isSelected ? '#0F172A' : style.dotStroke}
                    strokeWidth={(isSelected ? 1.4 : 0.8) * activeRegion.scaleFactor}
                  >
                    <title>
                      {`M ${ev.magnitude.toFixed(1)} (${getSeverityLabel(ev.severity)}) · ${ev.place} · Depth ${ev.depthKm.toFixed(1)} km`}
                    </title>
                  </circle>
                </g>
              );
            })}
          </g>
        </svg>

        {isLoading && (
          <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center">
            <span className="text-xs font-medium text-slate-700 bg-white border border-slate-200 px-3 py-1.5 rounded-md shadow-xs">
              Loading seismic feed...
            </span>
          </div>
        )}
      </div>

      {/* Calibrated Severity Legend */}
      <div className="px-4 py-2.5 border-t border-slate-200 bg-white flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
          {(['minor', 'light', 'moderate', 'strong', 'major'] as const).map((tier) => {
            const cfg = SEVERITY_CONFIG[tier];
            return (
              <span key={tier} className="inline-flex items-center gap-1.5 whitespace-nowrap">
                <span
                  className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                  style={{ backgroundColor: cfg.dotFill }}
                  aria-hidden="true"
                />
                <span className="font-medium text-slate-800">{cfg.label}</span>
                <span className="font-mono text-slate-500">M {cfg.range}</span>
              </span>
            );
          })}
        </div>
        <span className="font-mono tabular-nums text-slate-500">
          {events.length.toLocaleString()} plotted
        </span>
      </div>
    </section>
  );
}
