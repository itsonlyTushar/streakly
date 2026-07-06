import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  doc,
  deleteDoc,
  FirebaseFirestoreTypes,
} from '@react-native-firebase/firestore';
import { db } from '../lib/firebase';
import { MachineCodingEntry } from '../types';

const COLLECTION_NAME = 'machineCoding';

export const machineCodingService = {
  subscribeToItems: (
    userId: string,
    callback: (items: MachineCodingEntry[]) => void,
  ) => {
    const q = query(collection(db, COLLECTION_NAME), where('userId', '==', userId));

    return onSnapshot(q, snapshot => {
      const items: MachineCodingEntry[] = snapshot.docs.map(
        (d: FirebaseFirestoreTypes.QueryDocumentSnapshot) =>
          ({ id: d.id, ...d.data() } as MachineCodingEntry),
      );
      items.sort((a, b) => {
        const da = a.createdAt?.toMillis?.() || 0;
        const dbb = b.createdAt?.toMillis?.() || 0;
        return dbb - da;
      });
      callback(items);
    });
  },

  addItem: async (params: {
    userId: string;
    email: string | null;
    questionName: string;
    approach: string;
    solutionCode: string;
    language: 'JavaScript' | 'React';
  }) => {
    return addDoc(collection(db, COLLECTION_NAME), {
      userId: params.userId,
      userEmail: params.email,
      questionName: params.questionName.trim(),
      approach: params.approach.trim(),
      solutionCode: params.solutionCode.trim(),
      language: params.language,
      createdAt: serverTimestamp(),
    });
  },

  deleteItem: async (itemId: string) => {
    return deleteDoc(doc(db, COLLECTION_NAME, itemId));
  },
};
