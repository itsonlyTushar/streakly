import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  query,
  serverTimestamp,
  where,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface MachineCodingEntry {
  id: string;
  userId: string;
  userEmail: string | null;
  questionName: string;
  approach: string;
  solutionCode: string;
  language: "JavaScript" | "React";
  link?: string | null;
  createdAt?: { toMillis: () => number } | null;
}

const COLLECTION_NAME = "machineCoding";

export const machineCodingService = {
  subscribeToItems: (
    userId: string,
    callback: (items: MachineCodingEntry[]) => void
  ) => {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("userId", "==", userId)
    );

    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((item) => ({
        id: item.id,
        ...(item.data() as Omit<MachineCodingEntry, "id">),
      }));

      items.sort((a, b) => {
        const dateA = a.createdAt?.toMillis() || 0;
        const dateB = b.createdAt?.toMillis() || 0;
        return dateB - dateA;
      });

      callback(items);
    });
  },

  fetchItems: async (userId: string): Promise<MachineCodingEntry[]> => {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("userId", "==", userId)
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((item) => ({
      id: item.id,
      ...(item.data() as Omit<MachineCodingEntry, "id">),
    }));
  },

  addItem: async (params: {
    userId: string;
    email: string | null;
    questionName: string;
    approach: string;
    solutionCode: string;
    language: "JavaScript" | "React";
    link?: string | null;
  }) => {
    const { userId, email, questionName, approach, solutionCode, language, link } = params;

    return await addDoc(collection(db, COLLECTION_NAME), {
      userId,
      userEmail: email,
      questionName: questionName.trim(),
      approach: approach.trim(),
      solutionCode: solutionCode.trim(),
      language,
      link: link?.trim() || null,
      createdAt: serverTimestamp(),
    });
  },

  deleteItem: async (itemId: string) => {
    const docRef = doc(db, COLLECTION_NAME, itemId);
    return await deleteDoc(docRef);
  },
};
