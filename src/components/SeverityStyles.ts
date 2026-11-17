import type { SeverityTier } from '../types/earthquake';

export const SEVERITY_CONFIG: Record<
  SeverityTier,
  {
    label: string;
    range: string;
    dotFill: string;
    dotStroke: string;
    textColor: string;
    markerColor: string;
  }
> = {
  minor: {
    label: 'Minor',
    range: '< 2.5',
    dotFill: '#059669',
    dotStroke: '#047857',
    textColor: 'text-emerald-700',
    markerColor: '#059669',
  },
  light: {
    label: 'Light',
    range: '2.5–4.4',
    dotFill: '#2563EB',
    dotStroke: '#1D4ED8',
    textColor: 'text-blue-700',
    markerColor: '#2563EB',
  },
  moderate: {
    label: 'Moderate',
    range: '4.5–5.4',
    dotFill: '#D97706',
    dotStroke: '#B45309',
    textColor: 'text-amber-700',
    markerColor: '#D97706',
  },
  strong: {
    label: 'Strong',
    range: '5.5–6.4',
    dotFill: '#EA580C',
    dotStroke: '#C2410C',
    textColor: 'text-orange-700',
    markerColor: '#EA580C',
  },
  major: {
    label: 'Major',
    range: '6.5+',
    dotFill: '#DC2626',
    dotStroke: '#B91C1C',
    textColor: 'text-rose-700',
    markerColor: '#DC2626',
  },
};
