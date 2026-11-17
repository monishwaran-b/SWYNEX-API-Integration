import { useCallback, useEffect, useMemo, useState } from 'react';
import { DepthMagnitudeChart } from './components/DepthMagnitudeChart';
import { ErrorBanner } from './components/ErrorBanner';
import { EventCatalog } from './components/EventCatalog';
import { EventInspector } from './components/EventInspector';
import { FilterToolbar } from './components/FilterToolbar';
import { Header } from './components/Header';
import { MetricsStrip } from './components/MetricsStrip';
import { SeismicMap } from './components/SeismicMap';
import {
  FEED_PRESETS,
  fetchEarthquakeFeed,
  formatUtcDateTime,
} from './services/usgsApi';
import type {
  EarthquakeEvent,
  FeedPresetId,
  MinMagnitudeFilter,
  SortOption,
} from './types/earthquake';

const PAGE_SIZE = 25;

export default function App() {
  const [feedPreset, setFeedPreset] = useState<FeedPresetId>('all_day');
  const [events, setEvents] = useState<EarthquakeEvent[]>([]);
  const [feedMeta, setFeedMeta] = useState<{
    title: string;
    generatedAt: number;
    sourceUrl: string;
  } | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState<number>(0);

  // Client-side search, filtering, sorting, pagination
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [minMagnitude, setMinMagnitude] = useState<MinMagnitudeFilter>('all');
  const [tsunamiOnly, setTsunamiOnly] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [page, setPage] = useState<number>(1);

  // Selection state
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);

  useEffect(() => {
    const controller = new AbortController();
    let isCurrent = true;

    async function load() {
      setIsLoading(true);
      setErrorMessage(null);

      try {
        const result = await fetchEarthquakeFeed(feedPreset, controller.signal);
        if (!isCurrent) return;

        setEvents(result.events);
        setFeedMeta({
          title: result.feedTitle,
          generatedAt: result.generatedAt,
          sourceUrl: result.sourceUrl,
        });
        setPage(1);

        // Select the highest-magnitude event on feed load if current selection is absent
        setSelectedEventId((prevId) => {
          if (prevId && result.events.some((e) => e.id === prevId)) {
            return prevId;
          }
          if (result.events.length === 0) return null;
          const peak = result.events.reduce((best, cur) =>
            cur.magnitude > best.magnitude ? cur : best
          );
          return peak.id;
        });
      } catch (err) {
        if (!isCurrent) return;
        if (err instanceof DOMException && err.name === 'AbortError') {
          return;
        }
        setErrorMessage(
          err instanceof Error
            ? err.message
            : 'Unable to fetch earthquake feed from USGS.'
        );
      } finally {
        if (isCurrent) {
          setIsLoading(false);
        }
      }
    }

    load();

    return () => {
      isCurrent = false;
      controller.abort();
    };
  }, [feedPreset, refreshNonce]);

  const filteredEvents = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    const minMagNum = minMagnitude === 'all' ? -Infinity : Number(minMagnitude);

    const matched = events.filter((ev) => {
      if (ev.magnitude < minMagNum) return false;
      if (tsunamiOnly && !ev.tsunami) return false;
      if (query) {
        const matchesPlace = ev.place.toLowerCase().includes(query);
        const matchesRegion = ev.region.toLowerCase().includes(query);
        const matchesId = ev.id.toLowerCase().includes(query);
        if (!matchesPlace && !matchesRegion && !matchesId) return false;
      }
      return true;
    });

    return [...matched].sort((a, b) => {
      switch (sortBy) {
        case 'magnitude':
          return b.magnitude - a.magnitude || b.time - a.time;
        case 'depth':
          return b.depthKm - a.depthKm || b.magnitude - a.magnitude;
        case 'significance':
          return b.sig - a.sig || b.magnitude - a.magnitude;
        case 'newest':
        default:
          return b.time - a.time;
      }
    });
  }, [events, searchQuery, minMagnitude, tsunamiOnly, sortBy]);

  // Reset pagination when filters change
  useEffect(() => {
    setPage(1);
  }, [searchQuery, minMagnitude, tsunamiOnly, sortBy]);

  const selectedEvent = useMemo(() => {
    if (!selectedEventId) return null;
    return events.find((e) => e.id === selectedEventId) ?? null;
  }, [events, selectedEventId]);

  const hasActiveFilters =
    searchQuery.trim().length > 0 || minMagnitude !== 'all' || tsunamiOnly;

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setMinMagnitude('all');
    setTsunamiOnly(false);
    setSortBy('newest');
    setPage(1);
  }, []);

  const handleSelectEvent = useCallback((event: EarthquakeEvent) => {
    setSelectedEventId(event.id);
    if (window.innerWidth < 1280) {
      setIsMobileDrawerOpen(true);
    }
  }, []);

  const handleRefresh = useCallback(() => {
    setRefreshNonce((n) => n + 1);
  }, []);

  const activePreset =
    FEED_PRESETS.find((preset) => preset.id === feedPreset) ?? FEED_PRESETS[1];

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      <Header isLoading={isLoading} onRefresh={handleRefresh} />

      <main className="flex-1 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 space-y-6">
        {/* Overview Title & Live Source Attribution */}
        <section id="overview" className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-3">
            <div className="space-y-1">
              <h1
                className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900"
                style={{ textWrap: 'balance' }}
              >
                Global Seismic Activity Monitor
              </h1>
              <p className="text-sm text-slate-600 max-w-2xl">
                {activePreset.description}
              </p>
            </div>

            {feedMeta && (
              <div className="text-xs font-mono tabular-nums text-slate-500 whitespace-nowrap">
                Feed updated {formatUtcDateTime(feedMeta.generatedAt)}
              </div>
            )}
          </div>

          {errorMessage && (
            <ErrorBanner
              message={errorMessage}
              hasCachedData={events.length > 0}
              isRetrying={isLoading}
              onRetry={handleRefresh}
            />
          )}

          <MetricsStrip
            allEvents={events}
            filteredEvents={filteredEvents}
            isLoading={isLoading}
          />
        </section>

        {/* Query & Filter Controls */}
        <FilterToolbar
          feedPreset={feedPreset}
          onFeedPresetChange={setFeedPreset}
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          minMagnitude={minMagnitude}
          onMinMagnitudeChange={setMinMagnitude}
          tsunamiOnly={tsunamiOnly}
          onTsunamiOnlyChange={setTsunamiOnly}
          sortBy={sortBy}
          onSortByChange={setSortBy}
          hasActiveFilters={hasActiveFilters}
          onResetFilters={handleResetFilters}
        />

        {/* Workspace Split: Analytical Stage + Event Inspector */}
        <div className="flex flex-col xl:flex-row items-start gap-6">
          <div className="w-full min-w-0 flex-1 space-y-6">
            <SeismicMap
              events={filteredEvents}
              selectedEventId={selectedEventId}
              onSelectEvent={handleSelectEvent}
              isLoading={isLoading}
            />

            <DepthMagnitudeChart
              events={filteredEvents}
              selectedEventId={selectedEventId}
              onSelectEvent={handleSelectEvent}
            />

            <EventCatalog
              events={filteredEvents}
              selectedEventId={selectedEventId}
              onSelectEvent={handleSelectEvent}
              isLoading={isLoading}
              page={page}
              pageSize={PAGE_SIZE}
              onPageChange={setPage}
              onResetFilters={handleResetFilters}
            />
          </div>

          <EventInspector
            event={selectedEvent}
            isMobileOpen={isMobileDrawerOpen}
            onCloseMobile={() => setIsMobileDrawerOpen(false)}
          />
        </div>
      </main>

      <footer className="border-t border-slate-200 bg-white mt-10">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            Telluric Atlas · Data sourced live from the USGS Earthquake Hazards Program GeoJSON Summary Feeds.
          </p>
          <a
            href="https://earthquake.usgs.gov/earthquakes/feed/v1.0/geojson.php"
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-700 hover:text-slate-900 underline underline-offset-4 whitespace-nowrap"
          >
            USGS GeoJSON Specification
          </a>
        </div>
      </footer>
    </div>
  );
}
