import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  doc,
  updateDoc,
  deleteDoc,
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import { db } from '../lib/firebase';
import { DSAItem, DSADifficulty } from '../types';

const COLLECTION_NAME = 'dsa';

export const dsaService = {
  subscribeToItems: (userId: string, callback: (items: DSAItem[]) => void) => {
    const q = query(collection(db, COLLECTION_NAME), where('userId', '==', userId));

    return onSnapshot(q, snapshot => {
      const items: DSAItem[] = snapshot.docs.map(
        (d: FirebaseFirestoreTypes.QueryDocumentSnapshot) => ({ id: d.id, ...d.data() } as DSAItem),
      );
      items.sort((a, b) => {
        const da = a.createdAt?.toMillis?.() || 0;
        const dbb = b.createdAt?.toMillis?.() || 0;
        if (da !== dbb) return da - dbb;
        return a.problemName.localeCompare(b.problemName);
      });
      callback(items);
    });
  },

  addItem: async (params: {
    userId: string;
    email: string | null;
    problemName: string;
    problemUrl?: string | null;
    difficulty: DSADifficulty;
    topics: string[];
    subPattern?: string | null;
    timeComplexity?: string | null;
    spaceComplexity?: string | null;
    intuition?: string | null;
    codeSnippet?: string | null;
    nextReviewDate: Date | null;
  }) => {
    return addDoc(collection(db, COLLECTION_NAME), {
      userId: params.userId,
      userEmail: params.email,
      problemName: params.problemName.trim(),
      problemUrl: params.problemUrl?.trim() || null,
      difficulty: params.difficulty,
      topics: params.topics.map(t => t.trim()).filter(Boolean),
      subPattern: params.subPattern?.trim() || null,
      timeComplexity: params.timeComplexity?.trim() || null,
      spaceComplexity: params.spaceComplexity?.trim() || null,
      intuition: params.intuition?.trim() || null,
      codeSnippet: params.codeSnippet || null,
      dateLearned: serverTimestamp(),
      nextReviewDate: params.nextReviewDate ? Timestamp.fromDate(params.nextReviewDate) : null,
      reviewCount: 0,
      priority: 'Unprioritized',
      createdAt: serverTimestamp(),
    });
  },

  updateItem: async (itemId: string, data: Partial<DSAItem>) => {
    return updateDoc(doc(db, COLLECTION_NAME, itemId), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  deleteItem: async (itemId: string) => {
    return deleteDoc(doc(db, COLLECTION_NAME, itemId));
  },
};
