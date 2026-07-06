import { Timestamp } from '@react-native-firebase/firestore';
import { srsService } from '../services/srs.service';
import { dsaService } from '../services/dsa.service';
import { calculateNextReviewDate } from './srs-utils';
import { SRSItem, DSAItem } from '../types';

// Shared spaced-repetition transitions, mirrored from the web revision calendar.

export function srsGotIt(item: SRSItem) {
  const nextCount = item.reviewCount + 1;
  const next = calculateNextReviewDate(nextCount);
  return srsService.updateItem(item.id, {
    reviewCount: nextCount,
    nextReviewDate: next ? Timestamp.fromDate(next) : null,
  });
}

export function srsForgot(item: SRSItem) {
  const next = calculateNextReviewDate(0);
  return srsService.updateItem(item.id, {
    reviewCount: 0,
    nextReviewDate: next ? Timestamp.fromDate(next) : null,
  });
}

export function dsaSolved(item: DSAItem) {
  const nextCount = item.reviewCount + 1;
  const base = item.dateLearned?.toDate?.() ?? item.createdAt?.toDate?.() ?? new Date();
  const next = calculateNextReviewDate(nextCount, base);
  return dsaService.updateItem(item.id, {
    reviewCount: nextCount,
    nextReviewDate: next ? Timestamp.fromDate(next) : null,
  });
}

export function dsaForgot(item: DSAItem) {
  const next = calculateNextReviewDate(0);
  return dsaService.updateItem(item.id, {
    reviewCount: 0,
    nextReviewDate: next ? Timestamp.fromDate(next) : null,
  });
}
