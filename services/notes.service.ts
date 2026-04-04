import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { format } from "date-fns";

import { Note as GoalNote, NoteSchema } from "@/lib/schemas/note.schema";
export type { GoalNote };

const COLLECTION_NAME = "notes";

export const notesService = {
  // Subscribe to notes for a specific goal
  subscribeByGoalId: (goalId: string, userId: string, callback: (notes: GoalNote[]) => void) => {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("goalId", "==", goalId),
      where("userId", "==", userId),
      orderBy("date", "asc")
    );

    return onSnapshot(q, (snapshot) => {
      const notes = snapshot.docs.map((doc) => {
        const data = { id: doc.id, ...doc.data() };
        return NoteSchema.parse(data);
      });
      callback(notes);
    });
  },

  // One-time fetch
  fetchByGoalId: async (goalId: string, userId: string): Promise<GoalNote[]> => {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("goalId", "==", goalId),
      where("userId", "==", userId),
      orderBy("date", "asc")
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = { id: doc.id, ...doc.data() };
      return NoteSchema.parse(data);
    });
  },

  addNote: async (goalId: string, userId: string, content: string) => {
    return await addDoc(collection(db, COLLECTION_NAME), {
      goalId,
      userId,
      content,
      date: serverTimestamp(),
      dateString: format(new Date(), "yyyy-MM-dd"),
    });
  },

  updateNote: async (id: string, content: string) => {
    const docRef = doc(db, COLLECTION_NAME, id);
    return await updateDoc(docRef, {
      content,
      updatedAt: serverTimestamp(),
    });
  },

  deleteNote: async (id: string) => {
    const docRef = doc(db, COLLECTION_NAME, id);
    return await deleteDoc(docRef);
  },
};
