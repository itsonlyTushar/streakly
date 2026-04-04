import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const COLLECTION_NAME = "notebooks";

export interface NotebookData {
  userId: string;
  drawing: string;
  updatedAt?: any;
}

export const notebookService = {
  getNotebook: async (userId: string): Promise<NotebookData | null> => {
    const docRef = doc(db, COLLECTION_NAME, userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as NotebookData;
    }
    return null;
  },

  saveNotebook: async (userId: string, drawing: string) => {
    const docRef = doc(db, COLLECTION_NAME, userId);
    return await setDoc(
      docRef,
      {
        userId,
        drawing,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  },
};
