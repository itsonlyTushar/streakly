// Shared domain types for the mobile app. Firestore Timestamps are modelled
// with the minimal read surface we use (no Zod on mobile).

export type FireTimestamp = {
  toDate: () => Date;
  toMillis: () => number;
};

export type DSADifficulty = 'Easy' | 'Medium' | 'Hard';
export type DSAPriority = 'High' | 'Medium' | 'Low' | 'Unprioritized';

export interface SRSItem {
  id: string;
  userId: string;
  userEmail?: string | null;
  topic: string;
  details?: string | null;
  dateLearned?: FireTimestamp | null;
  nextReviewDate?: FireTimestamp | null;
  reviewCount: number;
  reminderDate?: FireTimestamp | null;
  createdAt?: FireTimestamp | null;
}

export interface DSAItem {
  id: string;
  userId: string;
  userEmail?: string | null;
  problemName: string;
  problemUrl?: string | null;
  difficulty: DSADifficulty;
  priority?: DSAPriority;
  topics: string[];
  subPattern?: string | null;
  timeComplexity?: string | null;
  spaceComplexity?: string | null;
  intuition?: string | null;
  codeSnippet?: string | null;
  dateLearned?: FireTimestamp | null;
  nextReviewDate?: FireTimestamp | null;
  reviewCount: number;
  createdAt?: FireTimestamp | null;
}

export interface MachineCodingEntry {
  id: string;
  userId: string;
  userEmail?: string | null;
  questionName: string;
  approach: string;
  solutionCode: string;
  language: 'JavaScript' | 'React';
  createdAt?: FireTimestamp | null;
}
