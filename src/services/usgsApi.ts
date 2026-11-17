import type {
  EarthquakeEvent,
  FeedPreset,
  FeedPresetId,
  SeverityTier,
  USGSFeature,
  USGSGeoJSONResponse,
} from '../types/earthquake';

export const FEED_PRESETS: FeedPreset[] = [
  {
    id: 'all_hour',
    label: 'Past Hour (All)',
    shortLabel: 'Past Hour',
    description: 'All earthquakes recorded globally in the last 60 minutes.',
    endpoint: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_hour.geojson',
  },
  {
    id: 'all_day',
    label: 'Past 24 Hours (All)',
    shortLabel: 'Past 24h',
    description: 'All global seismic events recorded over the past 24 hours.',
    endpoint: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/all_day.geojson',
  },
  {
    id: '2.5_day',
    label: 'Past 24h (M2.5+)',
    shortLabel: '24h · M2.5+',
    description: 'Earthquakes of magnitude 2.5 or greater in the past 24 hours.',
    endpoint: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/2.5_day.geojson',
  },
  {
    id: '4.5_week',
    label: 'Past 7 Days (M4.5+)',
    shortLabel: '7d · M4.5+',
    description: 'Moderate to major global earthquakes (M4.5+) over the past week.',
    endpoint: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_week.geojson',
  },
  {
    id: 'significant_month',
    label: 'Past 30 Days (Significant)',
    shortLabel: '30d · Significant',
    description: 'High-impact global earthquakes over the past 30 days.',
    endpoint: 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_month.geojson',
  },
];

export class UsgsApiError extends Error {
  status?: number;
  isTimeout: boolean;

  constructor(message: string, options?: { status?: number; isTimeout?: boolean }) {
    super(message);
    this.name = 'UsgsApiError';
    this.status = options?.status;
    this.isTimeout = Boolean(options?.isTimeout);
  }
}

export function getSeverityTier(magnitude: number): SeverityTier {
  if (magnitude >= 6.5) return 'major';
  if (magnitude >= 5.5) return 'strong';
  if (magnitude >= 4.5) return 'moderate';
  if (magnitude >= 2.5) return 'light';
  return 'minor';
}

export function getSeverityLabel(tier: SeverityTier): string {
  switch (tier) {
    case 'major':
      return 'Major';
    case 'strong':
      return 'Strong';
    case 'moderate':
      return 'Moderate';
    case 'light':
      return 'Light';
    case 'minor':
      return 'Minor';
  }
}

function extractRegion(place: string): string {
  const commaIdx = place.lastIndexOf(',');
  if (commaIdx !== -1 && commaIdx < place.length - 1) {
    return place.slice(commaIdx + 1).trim();
  }
  const ofIdx = place.toLowerCase().indexOf(' of ');
  if (ofIdx !== -1 && ofIdx + 4 < place.length) {
    return place.slice(ofIdx + 4).trim();
  }
  return place.trim() || 'Unspecified Region';
}

function normalizeFeature(feature: USGSFeature): EarthquakeEvent | null {
  const { properties, geometry, id } = feature;
  if (!geometry || !Array.isArray(geometry.coordinates) || geometry.coordinates.length < 2) {
    return null;
  }

  const [longitude, latitude, rawDepth] = geometry.coordinates;
  if (
    typeof longitude !== 'number' ||
    typeof latitude !== 'number' ||
    Number.isNaN(longitude) ||
    Number.isNaN(latitude)
  ) {
    return null;
  }

  const magnitude = typeof properties.mag === 'number' && !Number.isNaN(properties.mag)
    ? properties.mag
    : 0;
  const place = properties.place?.trim() || 'Unclassified seismic location';
  const depthKm = typeof rawDepth === 'number' && !Number.isNaN(rawDepth) ? rawDepth : 0;

  return {
    id,
    magnitude,
    magType: properties.magType || 'ml',
    place,
    region: extractRegion(place),
    time: properties.time,
    updated: properties.updated,
    longitude,
    latitude,
    depthKm,
    tsunami: properties.tsunami === 1,
    felt: properties.felt,
    cdi: properties.cdi,
    mmi: properties.mmi,
    alert: properties.alert,
    sig: properties.sig ?? 0,
    status: properties.status || 'automatic',
    net: properties.net || 'us',
    nst: properties.nst,
    gap: properties.gap,
    rms: properties.rms,
    dmin: properties.dmin,
    eventType: properties.type || 'earthquake',
    url: properties.url,
    severity: getSeverityTier(magnitude),
  };
}

export interface FetchFeedResult {
  events: EarthquakeEvent[];
  feedTitle: string;
  generatedAt: number;
  apiVersion: string;
  sourceUrl: string;
}

export async function fetchEarthquakeFeed(
  presetId: FeedPresetId,
  externalSignal?: AbortSignal
): Promise<FetchFeedResult> {
  const preset = FEED_PRESETS.find((item) => item.id === presetId) ?? FEED_PRESETS[1];
  const controller = new AbortController();
  let timedOut = false;

  const timeoutId = window.setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, 12000);

  const onExternalAbort = () => controller.abort();
  if (externalSignal) {
    if (externalSignal.aborted) {
      window.clearTimeout(timeoutId);
      throw new DOMException('Aborted', 'AbortError');
    }
    externalSignal.addEventListener('abort', onExternalAbort, { once: true });
  }

  try {
    const response = await fetch(preset.endpoint, {
      method: 'GET',
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!response.ok) {
      throw new UsgsApiError(
        `USGS API returned HTTP ${response.status} (${response.statusText || 'Request failed'}).`,
        { status: response.status }
      );
    }

    const data = (await response.json()) as USGSGeoJSONResponse;
    if (!data || !Array.isArray(data.features)) {
      throw new UsgsApiError('Received malformed GeoJSON payload from USGS feed.');
    }

    const events = data.features
      .map(normalizeFeature)
      .filter((item): item is EarthquakeEvent => item !== null);

    return {
      events,
      feedTitle: data.metadata?.title || preset.label,
      generatedAt: data.metadata?.generated || Date.now(),
      apiVersion: data.metadata?.api || '1.0',
      sourceUrl: preset.endpoint,
    };
  } catch (error) {
    if (error instanceof UsgsApiError) {
      throw error;
    }
    if (error instanceof DOMException && error.name === 'AbortError') {
      if (timedOut) {
        throw new UsgsApiError(
          'USGS GeoJSON feed timed out after 12 seconds. Check network connectivity and retry.',
          { isTimeout: true }
        );
      }
      throw error;
    }
    throw new UsgsApiError(
      error instanceof Error
        ? `Unable to reach USGS seismic feed: ${error.message}`
        : 'Unexpected network error while fetching USGS seismic data.'
    );
  } finally {
    window.clearTimeout(timeoutId);
    externalSignal?.removeEventListener('abort', onExternalAbort);
  }
}

export function formatCoordinates(lat: number, lon: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(2)}° ${latDir}, ${Math.abs(lon).toFixed(2)}° ${lonDir}`;
}

export function formatUtcDateTime(timestampMs: number): string {
  const d = new Date(timestampMs);
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  const hours = String(d.getUTCHours()).padStart(2, '0');
  const mins = String(d.getUTCMinutes()).padStart(2, '0');
  const secs = String(d.getUTCSeconds()).padStart(2, '0');
  return `${year}-${month}-${day} ${hours}:${mins}:${secs} UTC`;
}

export function formatRelativeTime(timestampMs: number, nowMs = Date.now()): string {
  const diffSec = Math.max(0, Math.floor((nowMs - timestampMs) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 48) return `${diffHr}h ago`;
  const diffDays = Math.floor(diffHr / 24);
  return `${diffDays}d ago`;
}
