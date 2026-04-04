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
} from "firebase/firestore";
import { db } from "@/lib/firebase";

import { SRSItem, SRSItemSchema } from "@/lib/schemas/srs.schema";
export type { SRSItem };

const COLLECTION_NAME = "srs";

export const srsService = {
  // Real-time subscription (Observable pattern for React Query)
  subscribeToItems: (userId: string, callback: (items: SRSItem[]) => void) => {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("userId", "==", userId)
    );

    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((doc) => {
        const data = { id: doc.id, ...doc.data() };
        return SRSItemSchema.parse(data);
      });

      // Sort by creation date (newest first)
      items.sort((a, b) => {
        const dateA = a.createdAt?.toMillis() || 0;
        const dateB = b.createdAt?.toMillis() || 0;
        if (dateA !== dateB) return dateB - dateA;
        return a.topic.localeCompare(b.topic);
      });

      callback(items);
    });
  },

  // One-time fetch (useful for initial load or static generation)
  fetchItems: async (userId: string): Promise<SRSItem[]> => {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = { id: doc.id, ...doc.data() };
      return SRSItemSchema.parse(data);
    });
  },

  addItem: async (userId: string, email: string | null, topic: string, details: string, nextReviewDate: Date) => {
    return await addDoc(collection(db, COLLECTION_NAME), {
      userId,
      userEmail: email,
      topic: topic.trim(),
      details: details.trim(),
      dateLearned: serverTimestamp(),
      nextReviewDate: Timestamp.fromDate(nextReviewDate),
      reviewCount: 0,
      createdAt: serverTimestamp(),
    });
  },

  updateItem: async (itemId: string, data: Partial<SRSItem>) => {
    const docRef = doc(db, COLLECTION_NAME, itemId);
    return await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },
};
