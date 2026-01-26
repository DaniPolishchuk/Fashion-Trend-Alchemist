/**
 * useDateRange Hook
 * Manages date range state and season selection
 */

import { useState, useCallback } from 'react';
import type { SeasonType } from '../constants/contextBuilder';
import { SEASON_DATE_RANGES } from '../constants/contextBuilder';
import { validateDate } from '../utils/dateValidation';

export interface DateRangeState {
  selectedSeason: SeasonType | null;
  startDay: string;
  startMonth: string;
  endDay: string;
  endMonth: string;
}

export function useDateRange() {
  const [selectedSeason, setSelectedSeason] = useState<SeasonType | null>(null);
  const [startDay, setStartDay] = useState<string>('');
  const [startMonth, setStartMonth] = useState<string>('');
  const [endDay, setEndDay] = useState<string>('');
  const [endMonth, setEndMonth] = useState<string>('');

  const handleSeasonClick = useCallback((season: SeasonType) => {
    setSelectedSeason((prev) => {
      if (prev === season) {
        // Deselect season
        setStartDay('');
        setStartMonth('');
        setEndDay('');
        setEndMonth('');
        return null;
      } else {
        // Select season and set dates
        const dates = SEASON_DATE_RANGES[season];
        setStartDay(dates.startDay);
        setStartMonth(dates.startMonth);
        setEndDay(dates.endDay);
        setEndMonth(dates.endMonth);
        return season;
      }
    });
  }, []);

  const handleDateInput = useCallback(
    (field: 'startDay' | 'startMonth' | 'endDay' | 'endMonth', value: string) => {
      // Only allow numeric input
      if (value && !/^\d+$/.test(value)) return;

      // Clear season when manually editing dates
      setSelectedSeason(null);

      switch (field) {
        case 'startDay':
          setStartDay(value);
          break;
        case 'startMonth':
          setStartMonth(value);
          break;
        case 'endDay':
          setEndDay(value);
          break;
        case 'endMonth':
          setEndMonth(value);
          break;
      }
    },
    []
  );

  const resetDates = useCallback(() => {
    setStartDay('');
    setStartMonth('');
    setEndDay('');
    setEndMonth('');
    setSelectedSeason(null);
  }, []);

  const getValidationState = useCallback(
    (field: 'startDay' | 'startMonth' | 'endDay' | 'endMonth'): 'None' | 'Negative' => {
      switch (field) {
        case 'startDay':
          return startDay && !validateDate(startDay, startMonth || '1') ? 'Negative' : 'None';
        case 'startMonth': {
          const m = parseInt(startMonth);
          return startMonth && (m < 1 || m > 12) ? 'Negative' : 'None';
        }
        case 'endDay':
          return endDay && !validateDate(endDay, endMonth || '1') ? 'Negative' : 'None';
        case 'endMonth': {
          const m = parseInt(endMonth);
          return endMonth && (m < 1 || m > 12) ? 'Negative' : 'None';
        }
        default:
          return 'None';
      }
    },
    [startDay, startMonth, endDay, endMonth]
  );

  return {
    selectedSeason,
    startDay,
    startMonth,
    endDay,
    endMonth,
    handleSeasonClick,
    handleDateInput,
    resetDates,
    getValidationState,
  };
}
