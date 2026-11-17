import { Search, Waves, X } from 'lucide-react';
import { FEED_PRESETS } from '../services/usgsApi';
import type {
  FeedPresetId,
  MinMagnitudeFilter,
  SortOption,
} from '../types/earthquake';

interface FilterToolbarProps {
  feedPreset: FeedPresetId;
  onFeedPresetChange: (preset: FeedPresetId) => void;
  searchQuery: string;
  onSearchQueryChange: (q: string) => void;
  minMagnitude: MinMagnitudeFilter;
  onMinMagnitudeChange: (mag: MinMagnitudeFilter) => void;
  tsunamiOnly: boolean;
  onTsunamiOnlyChange: (value: boolean) => void;
  sortBy: SortOption;
  onSortByChange: (sort: SortOption) => void;
  hasActiveFilters: boolean;
  onResetFilters: () => void;
}

const MAG_OPTIONS: Array<{ id: MinMagnitudeFilter; label: string }> = [
  { id: 'all', label: 'All Mag' },
  { id: '2.5', label: 'M 2.5+' },
  { id: '4.5', label: 'M 4.5+' },
  { id: '6.0', label: 'M 6.0+' },
];

export function FilterToolbar({
  feedPreset,
  onFeedPresetChange,
  searchQuery,
  onSearchQueryChange,
  minMagnitude,
  onMinMagnitudeChange,
  tsunamiOnly,
  onTsunamiOnlyChange,
  sortBy,
  onSortByChange,
  hasActiveFilters,
  onResetFilters,
}: FilterToolbarProps) {
  return (
    <div className="border border-slate-200 bg-white rounded-lg p-4 space-y-4">
      {/* Row 1: Feed Window API Selector */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700 whitespace-nowrap">
            USGS Feed Window
          </span>
        </div>

        <div
          role="tablist"
          aria-label="USGS Feed Timeframe"
          className="flex items-center gap-1 p-1 bg-slate-100 rounded-md overflow-x-auto"
        >
          {FEED_PRESETS.map((preset) => {
            const active = feedPreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => onFeedPresetChange(preset.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 ${
                  active
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {preset.shortLabel}
              </button>
            );
          })}
        </div>
      </div>

      {/* Row 2: Client Search, Magnitude Filter, Tsunami Toggle, Sort */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        {/* Search Input */}
        <div className="relative flex-1 min-w-0">
          <label htmlFor="seismic-search" className="sr-only">
            Search earthquakes by place, country, or event ID
          </label>
          <Search
            className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            aria-hidden="true"
          />
          <input
            id="seismic-search"
            type="search"
            value={searchQuery}
            onChange={(e) => onSearchQueryChange(e.target.value)}
            placeholder="Search region, city, fault zone, or USGS ID..."
            className="w-full h-10 pl-9 pr-9 text-sm bg-slate-50 border border-slate-200 rounded-md text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-blue-600 focus:outline-none transition-colors"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => onSearchQueryChange('')}
              aria-label="Clear search query"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-xs cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Magnitude Threshold Segmented Buttons */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <div
            role="group"
            aria-label="Minimum magnitude filter"
            className="flex items-center gap-1 p-1 bg-slate-100 rounded-md"
          >
            {MAG_OPTIONS.map((opt) => {
              const active = minMagnitude === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => onMinMagnitudeChange(opt.id)}
                  className={`px-2.5 py-1.5 text-xs font-medium rounded-sm transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-blue-600 ${
                    active
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>

          {/* Tsunami Flag Toggle */}
          <button
            type="button"
            aria-pressed={tsunamiOnly}
            onClick={() => onTsunamiOnlyChange(!tsunamiOnly)}
            className={`inline-flex items-center gap-1.5 h-10 px-3 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
              tsunamiOnly
                ? 'bg-rose-50 border-rose-300 text-rose-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            <Waves className="w-3.5 h-3.5" aria-hidden="true" />
            <span>Tsunami Flag</span>
          </button>

          {/* Sort Select */}
          <div className="flex items-center gap-2 shrink-0">
            <label htmlFor="seismic-sort" className="text-xs font-medium text-slate-500 whitespace-nowrap">
              Sort
            </label>
            <select
              id="seismic-sort"
              value={sortBy}
              onChange={(e) => onSortByChange(e.target.value as SortOption)}
              className="h-10 px-3 text-xs font-medium bg-white border border-slate-200 rounded-md text-slate-800 focus:border-blue-600 focus:outline-none cursor-pointer"
            >
              <option value="newest">Most Recent</option>
              <option value="magnitude">Highest Magnitude</option>
              <option value="depth">Deepest Focus</option>
              <option value="significance">Highest Significance</option>
            </select>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={onResetFilters}
              className="h-10 px-3 text-xs font-medium text-blue-700 hover:text-blue-900 hover:bg-blue-50 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
