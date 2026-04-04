import { addDays, set } from "date-fns";

export const SRS_INTERVALS = [1, 3, 7, 30];

export const calculateNextReviewDate = (currentReviewCount: number, fromDate: Date = new Date()): Date | null => {
  if (currentReviewCount < SRS_INTERVALS.length) {
    const nextInterval = SRS_INTERVALS[currentReviewCount];
    return set(addDays(fromDate, nextInterval), {
      hours: 10,
      minutes: 0,
      seconds: 0,
      milliseconds: 0,
    });
  }
  return null;
};

export const getInitialReviewDate = (fromDate: Date = new Date()): Date => {
  return set(addDays(fromDate, 1), {
    hours: 10,
    minutes: 0,
    seconds: 0,
    milliseconds: 0,
  });
};
