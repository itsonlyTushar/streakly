import { startOfDay, startOfToday } from 'date-fns';
import { FireTimestamp } from '../types';

/** True if a review date falls on or before today (i.e. it's due). */
export const isDue = (ts?: FireTimestamp | null): boolean => {
  const d = ts?.toDate?.();
  if (!d) return false;
  return startOfDay(d).getTime() <= startOfToday().getTime();
};

/** True if the review date is strictly before today (overdue). */
export const isOverdue = (ts?: FireTimestamp | null): boolean => {
  const d = ts?.toDate?.();
  if (!d) return false;
  return startOfDay(d).getTime() < startOfToday().getTime();
};
