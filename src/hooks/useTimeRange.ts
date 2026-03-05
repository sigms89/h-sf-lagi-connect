// ============================================================
// useTimeRange.ts
// Global time range filter context + hook for Húsfélagið.is
// Provides date-scoping for all data queries across the app
// ============================================================

import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { format, subMonths, subYears, startOfYear } from 'date-fns';

// ---------------------------------------------------------------
// Types
// ---------------------------------------------------------------

export type TimeRangePreset = 'all' | '12m' | '3y' | 'ytd' | 'custom';

export interface TimeRangeValue {
  preset: TimeRangePreset;
  from: string | null; // yyyy-MM-dd
  to: string | null;   // yyyy-MM-dd
}

interface TimeRangeContextValue {
  range: TimeRangeValue;
  setPreset: (preset: TimeRangePreset) => void;
  setCustomRange: (from: string, to: string) => void;
  getDateFilter: () => { from: string | null; to: string | null };
  label: string;
}

// ---------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------

const TODAY = (): string => format(new Date(), 'yyyy-MM-dd');

function computeDates(preset: Exclude<TimeRangePreset, 'custom'>): {
  from: string | null;
  to: string | null;
} {
  const now = new Date();
  switch (preset) {
    case 'all':
      return { from: null, to: null };
    case '12m':
      return { from: format(subMonths(now, 12), 'yyyy-MM-dd'), to: TODAY() };
    case '3y':
      return { from: format(subYears(now, 3), 'yyyy-MM-dd'), to: TODAY() };
    case 'ytd':
      return { from: format(startOfYear(now), 'yyyy-MM-dd'), to: TODAY() };
  }
}

function presetLabel(range: TimeRangeValue): string {
  switch (range.preset) {
    case 'all':
      return 'Allt tímabil';
    case '12m':
      return 'Síðustu 12 mánuðir';
    case '3y':
      return 'Síðustu 3 ár';
    case 'ytd':
      return 'Á þessu ári';
    case 'custom': {
      const fromStr = range.from ?? '—';
      const toStr = range.to ?? '—';
      return `${fromStr} – ${toStr}`;
    }
  }
}

// ---------------------------------------------------------------
// Default state
// ---------------------------------------------------------------

const DEFAULT_RANGE: TimeRangeValue = {
  preset: '12m',
  ...computeDates('12m'),
};

// ---------------------------------------------------------------
// Context
// ---------------------------------------------------------------

export const TimeRangeContext = createContext<TimeRangeContextValue | null>(null);

// ---------------------------------------------------------------
// Provider
// ---------------------------------------------------------------

export function TimeRangeProvider({ children }: { children: React.ReactNode }) {
  const [range, setRange] = useState<TimeRangeValue>(DEFAULT_RANGE);

  const setPreset = useCallback((preset: TimeRangePreset) => {
    if (preset === 'custom') {
      // When switching to custom, keep current from/to but mark preset as custom
      setRange((prev) => ({ ...prev, preset: 'custom' }));
      return;
    }
    const dates = computeDates(preset);
    setRange({ preset, ...dates });
  }, []);

  const setCustomRange = useCallback((from: string, to: string) => {
    setRange({ preset: 'custom', from, to });
  }, []);

  const getDateFilter = useCallback(
    () => ({ from: range.from, to: range.to }),
    [range.from, range.to],
  );

  const label = useMemo(() => presetLabel(range), [range]);

  const value = useMemo<TimeRangeContextValue>(
    () => ({ range, setPreset, setCustomRange, getDateFilter, label }),
    [range, setPreset, setCustomRange, getDateFilter, label],
  );

  return React.createElement(TimeRangeContext.Provider, { value }, children);
}

// ---------------------------------------------------------------
// Hook
// ---------------------------------------------------------------

/**
 * useTimeRange
 *
 * Returns the current global time range filter and setters.
 * Must be used inside <TimeRangeProvider>.
 *
 * @example
 * const { range, setPreset, getDateFilter, label } = useTimeRange();
 * const { from, to } = getDateFilter();
 * // Pass from/to into Supabase .gte / .lte filters
 */
export function useTimeRange(): TimeRangeContextValue {
  const ctx = useContext(TimeRangeContext);
  if (!ctx) {
    throw new Error('useTimeRange must be used within a <TimeRangeProvider>');
  }
  return ctx;
}
