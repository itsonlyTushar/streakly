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
  getDocs,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

import { DSAItem, DSAItemSchema, DSADifficulty } from "@/lib/schemas/dsa.schema";
export type { DSAItem };

const COLLECTION_NAME = "dsa";

export const dsaService = {
  // Real-time subscription (Observable pattern for React Query)
  subscribeToItems: (userId: string, callback: (items: DSAItem[]) => void) => {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("userId", "==", userId)
    );

    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => {
        const data = { id: doc.id, ...doc.data() };
        return DSAItemSchema.parse(data);
      });

      // Sort by creation date (newest first)
      items.sort((a, b) => {
        const dateA = a.createdAt?.toMillis() || 0;
        const dateB = b.createdAt?.toMillis() || 0;
        if (dateA !== dateB) return dateB - dateA;
        return a.problemName.localeCompare(b.problemName);
      });

      callback(items);
    });
  },

  // One-time fetch
  fetchItems: async (userId: string): Promise<DSAItem[]> => {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = { id: doc.id, ...doc.data() };
      return DSAItemSchema.parse(data);
    });
  },

  addItem: async (params: {
    userId: string;
    email: string | null;
    problemName: string;
    problemUrl?: string | null;
    difficulty: DSADifficulty;
    topics: string[];
    timeComplexity?: string | null;
    spaceComplexity?: string | null;
    intuition?: string | null;
    codeSnippet?: string | null;
    nextReviewDate: Date | null;
  }) => {
    const {
      userId,
      email,
      problemName,
      problemUrl,
      difficulty,
      topics,
      timeComplexity,
      spaceComplexity,
      intuition,
      codeSnippet,
      nextReviewDate,
    } = params;

    return await addDoc(collection(db, COLLECTION_NAME), {
      userId,
      userEmail: email,
      problemName: problemName.trim(),
      problemUrl: problemUrl?.trim() || null,
      difficulty,
      topics: topics.map(t => t.trim()).filter(Boolean),
      timeComplexity: timeComplexity?.trim() || null,
      spaceComplexity: spaceComplexity?.trim() || null,
      intuition: intuition?.trim() || null,
      codeSnippet: codeSnippet || null,
      dateLearned: serverTimestamp(),
      nextReviewDate: nextReviewDate ? Timestamp.fromDate(nextReviewDate) : null,
      reviewCount: 0,
      createdAt: serverTimestamp(),
    });
  },

  updateItem: async (itemId: string, data: Partial<DSAItem>) => {
    const docRef = doc(db, COLLECTION_NAME, itemId);
    return await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  deleteItem: async (itemId: string) => {
    const docRef = doc(db, COLLECTION_NAME, itemId);
    return await deleteDoc(docRef);
  },
};
