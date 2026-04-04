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

export interface GoalData {
  id: string;
  userId: string;
  goal: string;
  dueDate: string;
  status: "active" | "completed";
  color?: string;
  createdAt: any;
  completedAt?: any;
}

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
      const goals = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      })) as GoalData[];
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
      const goals = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as any),
      })) as GoalData[];
      callback(goals);
    });
  },

  // One-time fetch for a single goal
  getGoalById: async (id: string): Promise<GoalData | null> => {
    const docRef = doc(db, COLLECTION_NAME, id);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return { id: docSnap.id, ...(docSnap.data() as any) } as GoalData;
    }
    return null;
  },

  // Real-time subscription for a single goal
  subscribeToGoal: (id: string, callback: (goal: GoalData | null) => void) => {
    const docRef = doc(db, COLLECTION_NAME, id);
    return onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        callback({ id: docSnap.id, ...(docSnap.data() as any) } as GoalData);
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
