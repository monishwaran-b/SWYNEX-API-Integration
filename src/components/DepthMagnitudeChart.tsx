import { useMemo, useState } from 'react';
import type { EarthquakeEvent } from '../types/earthquake';
import { SEVERITY_CONFIG } from './SeverityStyles';

interface DepthMagnitudeChartProps {
  events: EarthquakeEvent[];
  selectedEventId: string | null;
  onSelectEvent: (event: EarthquakeEvent) => void;
}

const CHART_W = 680;
const CHART_H = 220;
const PAD_L = 48;
const PAD_R = 20;
const PAD_T = 16;
const PAD_B = 34;

export function DepthMagnitudeChart({
  events,
  selectedEventId,
  onSelectEvent,
}: DepthMagnitudeChartProps) {
  const [hovered, setHovered] = useState<EarthquakeEvent | null>(null);

  const { maxDepth, maxMag, minMag } = useMemo(() => {
    if (events.length === 0) {
      return { maxDepth: 300, maxMag: 8, minMag: 0 };
    }
    let highestDepth = 100;
    let hiMag = 6;
    let loMag = 0;
    for (const ev of events) {
      if (ev.depthKm > highestDepth) highestDepth = ev.depthKm;
      if (ev.magnitude > hiMag) hiMag = ev.magnitude;
      if (ev.magnitude < loMag) loMag = ev.magnitude;
    }
    return {
      maxDepth: Math.min(720, Math.ceil(highestDepth / 50) * 50),
      maxMag: Math.min(9.5, Math.ceil(hiMag + 0.5)),
      minMag: Math.floor(Math.min(0, loMag)),
    };
  }, [events]);

  const plotW = CHART_W - PAD_L - PAD_R;
  const plotH = CHART_H - PAD_T - PAD_B;

  const scaleX = (mag: number) =>
    PAD_L + ((mag - minMag) / Math.max(1, maxMag - minMag)) * plotW;

  const scaleY = (depth: number) => {
    const clamped = Math.max(0, Math.min(maxDepth, depth));
    return PAD_T + (clamped / maxDepth) * plotH;
  };

  const depthTicks = [0, 70, 300, maxDepth].filter(
    (v, i, arr) => v <= maxDepth && arr.indexOf(v) === i
  );
  const magTicks: number[] = [];
  for (let m = Math.ceil(minMag); m <= Math.floor(maxMag); m += 2) {
    magTicks.push(m);
  }

  return (
    <section
      id="depth-profile"
      aria-label="Focal depth versus magnitude profile"
      className="border border-slate-200 bg-white rounded-lg overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Focal Depth vs. Magnitude Profile
          </h2>
          <p className="text-xs text-slate-500">
            Subsurface depth (0 to {maxDepth} km) plotted downward from crust to mantle
          </p>
        </div>

        {hovered && (
          <div className="hidden sm:flex items-center gap-2 text-xs font-mono tabular-nums text-slate-700">
            <span className="font-semibold">M {hovered.magnitude.toFixed(1)}</span>
            <span className="text-slate-400">·</span>
            <span>{hovered.depthKm.toFixed(1)} km</span>
            <span className="text-slate-400">·</span>
            <span className="font-sans truncate max-w-[200px]">{hovered.region}</span>
          </div>
        )}
      </div>

      <div className="p-3 sm:p-4">
        {events.length === 0 ? (
          <div className="h-[180px] flex items-center justify-center text-xs text-slate-500">
            No events match the current filter to plot depth distribution.
          </div>
        ) : (
          <svg
            viewBox={`0 0 ${CHART_W} ${CHART_H}`}
            className="w-full h-auto block select-none"
            role="img"
            aria-label="Scatter chart of earthquake magnitude against focal depth in kilometers"
          >
            {/* Horizontal Depth Reference Grid */}
            {depthTicks.map((d) => {
              const y = scaleY(d);
              const isZoneLine = d === 70 || d === 300;
              return (
                <g key={`d-${d}`}>
                  <line
                    x1={PAD_L}
                    y1={y}
                    x2={CHART_W - PAD_R}
                    y2={y}
                    stroke={isZoneLine ? '#CBD5E1' : '#E2E8F0'}
                    strokeDasharray={isZoneLine ? '4 3' : undefined}
                    strokeWidth={1}
                  />
                  <text
                    x={PAD_L - 8}
                    y={y + 3}
                    textAnchor="end"
                    className="fill-slate-500 text-[10px] font-mono"
                  >
                    {d} km
                  </text>
                </g>
              );
            })}

            {/* Vertical Magnitude Grid */}
            {magTicks.map((m) => {
              const x = scaleX(m);
              return (
                <g key={`m-${m}`}>
                  <line
                    x1={x}
                    y1={PAD_T}
                    x2={x}
                    y2={CHART_H - PAD_B}
                    stroke="#F1F5F9"
                    strokeWidth={1}
                  />
                  <text
                    x={x}
                    y={CHART_H - 12}
                    textAnchor="middle"
                    className="fill-slate-500 text-[10px] font-mono"
                  >
                    M {m}
                  </text>
                </g>
              );
            })}

            {/* Zone annotation labels */}
            {maxDepth >= 70 && (
              <text
                x={CHART_W - PAD_R - 4}
                y={scaleY(70) - 4}
                textAnchor="end"
                className="fill-slate-400 text-[9px] font-mono"
              >
                70 km shallow crust boundary
              </text>
            )}
            {maxDepth >= 300 && (
              <text
                x={CHART_W - PAD_R - 4}
                y={scaleY(300) - 4}
                textAnchor="end"
                className="fill-slate-400 text-[9px] font-mono"
              >
                300 km deep mantle boundary
              </text>
            )}

            {/* Scatter Points */}
            {events.map((ev) => {
              const cx = scaleX(ev.magnitude);
              const cy = scaleY(ev.depthKm);
              const isSelected = ev.id === selectedEventId;
              const style = SEVERITY_CONFIG[ev.severity];
              return (
                <circle
                  key={ev.id}
                  cx={cx}
                  cy={cy}
                  r={isSelected ? 5.5 : 3.2}
                  fill={style.dotFill}
                  fillOpacity={isSelected ? 1 : 0.65}
                  stroke={isSelected ? '#0F172A' : style.dotStroke}
                  strokeWidth={isSelected ? 1.5 : 0.7}
                  onClick={() => onSelectEvent(ev)}
                  onMouseEnter={() => setHovered(ev)}
                  onMouseLeave={() => setHovered((prev) => (prev?.id === ev.id ? null : prev))}
                  className="cursor-pointer"
                >
                  <title>{`M ${ev.magnitude.toFixed(1)} · ${ev.depthKm.toFixed(1)} km · ${ev.place}`}</title>
                </circle>
              );
            })}
          </svg>
        )}
      </div>
    </section>
  );
}
