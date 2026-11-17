export interface USGSFeatureProperties {
  mag: number | null;
  place: string | null;
  time: number;
  updated: number;
  tz: number | null;
  url: string;
  detail: string;
  felt: number | null;
  cdi: number | null;
  mmi: number | null;
  alert: 'green' | 'yellow' | 'orange' | 'red' | null;
  status: string;
  tsunami: number;
  sig: number;
  net: string;
  code: string;
  ids: string;
  sources: string;
  types: string;
  nst: number | null;
  dmin: number | null;
  rms: number | null;
  gap: number | null;
  magType: string | null;
  type: string;
  title: string;
}

export interface USGSFeature {
  type: 'Feature';
  id: string;
  properties: USGSFeatureProperties;
  geometry: {
    type: 'Point';
    coordinates: [number, number, number]; // [longitude, latitude, depthKm]
  };
}

export interface USGSGeoJSONResponse {
  type: 'FeatureCollection';
  metadata: {
    generated: number;
    url: string;
    title: string;
    status: number;
    api: string;
    count: number;
  };
  features: USGSFeature[];
}

export type SeverityTier = 'minor' | 'light' | 'moderate' | 'strong' | 'major';

export interface EarthquakeEvent {
  id: string;
  magnitude: number;
  magType: string;
  place: string;
  region: string;
  time: number;
  updated: number;
  longitude: number;
  latitude: number;
  depthKm: number;
  tsunami: boolean;
  felt: number | null;
  cdi: number | null;
  mmi: number | null;
  alert: 'green' | 'yellow' | 'orange' | 'red' | null;
  sig: number;
  status: string;
  net: string;
  nst: number | null;
  gap: number | null;
  rms: number | null;
  dmin: number | null;
  eventType: string;
  url: string;
  severity: SeverityTier;
}

export type FeedPresetId =
  | 'all_hour'
  | 'all_day'
  | '2.5_day'
  | '4.5_week'
  | 'significant_month';

export interface FeedPreset {
  id: FeedPresetId;
  label: string;
  shortLabel: string;
  description: string;
  endpoint: string;
}

export type MinMagnitudeFilter = 'all' | '2.5' | '4.5' | '6.0';
export type SortOption = 'newest' | 'magnitude' | 'depth' | 'significance';
export type MapRegionId = 'global' | 'pacific' | 'americas' | 'eurasia';
