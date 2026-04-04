import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

import { GoalData, GoalSchema } from "@/lib/schemas/goal.schema";
export type { GoalData };

const COLLECTION_NAME = "goals";

export const goalsService = {
  // Subscribe to active goals
  subscribeActive: (userId: string, callback: (goals: GoalData[]) => void) => {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("userId", "==", userId),
      where("status", "==", "active"),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
      const goals = snapshot.docs.map((doc) => {
        const data = { id: doc.id, ...doc.data() };
        return GoalSchema.parse(data);
      });
      callback(goals);
    });
  },

  // Subscribe to completed goals (Hall of Fame)
  subscribeCompleted: (userId: string, callback: (goals: GoalData[]) => void) => {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("userId", "==", userId),
      where("status", "==", "completed"),
      orderBy("createdAt", "desc")
    );

    return onSnapshot(q, (snapshot) => {
      const goals = snapshot.docs.map((doc) => {
        const data = { id: doc.id, ...doc.data() };
        return GoalSchema.parse(data);
      });
      callback(goals);
    });
  },

  // One-time fetch for a single goal
  getGoalById: async (id: string): Promise<GoalData | null> => {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = { id: docSnap.id, ...docSnap.data() };
      return GoalSchema.parse(data);
    }
    return null;
  },

  // Real-time subscription for a single goal
  subscribeToGoal: (id: string, callback: (goal: GoalData | null) => void) => {
    const docRef = doc(db, COLLECTION_NAME, id);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = { id: docSnap.id, ...docSnap.data() };
        callback(GoalSchema.parse(data));
      } else {
        callback(null);
      }
    });
  },

  addGoal: async (userId: string, goal: string, dueDate: string, color?: string) => {
    return await addDoc(collection(db, COLLECTION_NAME), {
      userId,
      goal,
      dueDate,
      status: "active",
      color: color || null,
      createdAt: serverTimestamp(),
    });
  },

  completeGoal: async (id: string) => {
    const docRef = doc(db, COLLECTION_NAME, id);
    return await updateDoc(docRef, {
      status: "completed",
      completedAt: serverTimestamp(),
    });
  },

  updateGoal: async (id: string, data: Partial<GoalData>) => {
    const docRef = doc(db, COLLECTION_NAME, id);
    return await updateDoc(docRef, data);
  },

  deleteGoal: async (id: string) => {
    const docRef = doc(db, COLLECTION_NAME, id);
    return await deleteDoc(docRef);
  },
};
