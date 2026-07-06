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
import { SRSItem } from '../types';

const COLLECTION_NAME = 'srs';

export const srsService = {
  subscribeToItems: (userId: string, callback: (items: SRSItem[]) => void) => {
    const q = query(collection(db, COLLECTION_NAME), where('userId', '==', userId));

    return onSnapshot(q, snapshot => {
      const items: SRSItem[] = snapshot.docs.map(
        (d: FirebaseFirestoreTypes.QueryDocumentSnapshot) => ({ id: d.id, ...d.data() } as SRSItem),
      );
      items.sort((a, b) => {
        const da = a.createdAt?.toMillis?.() || 0;
        const dbb = b.createdAt?.toMillis?.() || 0;
        if (da !== dbb) return dbb - da;
        return a.topic.localeCompare(b.topic);
      });
      callback(items);
    });
  },

  addItem: async (
    userId: string,
    email: string | null,
    topic: string,
    details: string,
    nextReviewDate: Date | null,
    reminderDate?: Date | null,
  ) => {
    return addDoc(collection(db, COLLECTION_NAME), {
      userId,
      userEmail: email,
      topic: topic.trim(),
      details: details.trim(),
      dateLearned: serverTimestamp(),
      nextReviewDate: nextReviewDate ? Timestamp.fromDate(nextReviewDate) : null,
      reviewCount: 0,
      reminderDate: reminderDate ? Timestamp.fromDate(reminderDate) : null,
      createdAt: serverTimestamp(),
    });
  },

  updateItem: async (itemId: string, data: Partial<SRSItem>) => {
    return updateDoc(doc(db, COLLECTION_NAME, itemId), {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  deleteItem: async (itemId: string) => {
    return deleteDoc(doc(db, COLLECTION_NAME, itemId));
  },
};
