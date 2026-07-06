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

import {
  Task,
  TaskSchema,
  TaskStatus,
  TaskPriority,
  Subtask,
} from "@/lib/schemas/task.schema";
import {
  TaskProject,
  TaskProjectSchema,
  TaskProjectColor,
} from "@/lib/schemas/task.schema";

export type { Task, TaskProject };

const TASKS_COLLECTION = "tasks";
const PROJECTS_COLLECTION = "taskProjects";

// Sort helper shared by tasks: manual `order` ascending, then newest first.
const sortByOrder = (a: Task, b: Task) => {
  if (a.order !== b.order) return a.order - b.order;
  const dateA = a.createdAt?.toMillis?.() || 0;
  const dateB = b.createdAt?.toMillis?.() || 0;
  return dateB - dateA;
};

export const tasksService = {
  subscribeToItems: (userId: string, callback: (items: Task[]) => void) => {
    const q = query(
      collection(db, TASKS_COLLECTION),
      where("userId", "==", userId)
    );

    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((docSnap) => {
        const data = { id: docSnap.id, ...docSnap.data() };
        return TaskSchema.parse(data);
      });
      items.sort(sortByOrder);
      callback(items);
    });
  },

  fetchItems: async (userId: string): Promise<Task[]> => {
    const q = query(
      collection(db, TASKS_COLLECTION),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    const items = snapshot.docs.map((docSnap) => {
      const data = { id: docSnap.id, ...docSnap.data() };
      return TaskSchema.parse(data);
    });
    items.sort(sortByOrder);
    return items;
  },

  addItem: async (params: {
    userId: string;
    email: string | null;
    title: string;
    description?: string | null;
    projectId?: string | null;
    status?: TaskStatus;
    priority?: TaskPriority;
    tags?: string[];
    dueDate?: Date | null;
    subtasks?: Subtask[];
    order?: number;
  }) => {
    const {
      userId,
      email,
      title,
      description,
      projectId,
      status,
      priority,
      tags,
      dueDate,
      subtasks,
      order,
    } = params;

    const resolvedStatus = status || "Todo";

    return await addDoc(collection(db, TASKS_COLLECTION), {
      userId,
      userEmail: email,
      title: title.trim(),
      description: description?.trim() || null,
      projectId: projectId || null,
      status: resolvedStatus,
      priority: priority || "None",
      tags: (tags || []).map((t) => t.trim()).filter(Boolean),
      dueDate: dueDate ? Timestamp.fromDate(dueDate) : null,
      subtasks: subtasks || [],
      order: order ?? Date.now(),
      completedAt: resolvedStatus === "Done" ? serverTimestamp() : null,
      createdAt: serverTimestamp(),
    });
  },

  updateItem: async (itemId: string, data: Partial<Task>) => {
    const docRef = doc(db, TASKS_COLLECTION, itemId);

    const payload: Record<string, unknown> = {
      ...data,
      updatedAt: serverTimestamp(),
    };

    // Keep completedAt in sync with status transitions.
    if (typeof data.status !== "undefined") {
      payload.completedAt = data.status === "Done" ? serverTimestamp() : null;
    }

    return await updateDoc(docRef, payload);
  },

  deleteItem: async (itemId: string) => {
    const docRef = doc(db, TASKS_COLLECTION, itemId);
    return await deleteDoc(docRef);
  },
};

export const taskProjectsService = {
  subscribeToItems: (
    userId: string,
    callback: (items: TaskProject[]) => void
  ) => {
    const q = query(
      collection(db, PROJECTS_COLLECTION),
      where("userId", "==", userId)
    );

    return onSnapshot(q, (snapshot) => {
      const items = snapshot.docs.map((docSnap) => {
        const data = { id: docSnap.id, ...docSnap.data() };
        return TaskProjectSchema.parse(data);
      });
      items.sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order;
        return a.name.localeCompare(b.name);
      });
      callback(items);
    });
  },

  fetchItems: async (userId: string): Promise<TaskProject[]> => {
    const q = query(
      collection(db, PROJECTS_COLLECTION),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => {
      const data = { id: docSnap.id, ...docSnap.data() };
      return TaskProjectSchema.parse(data);
    });
  },

  addItem: async (params: {
    userId: string;
    email: string | null;
    name: string;
    color?: TaskProjectColor;
    order?: number;
  }) => {
    const { userId, email, name, color, order } = params;
    return await addDoc(collection(db, PROJECTS_COLLECTION), {
      userId,
      userEmail: email,
      name: name.trim(),
      color: color || "violet",
      order: order ?? Date.now(),
      createdAt: serverTimestamp(),
    });
  },

  updateItem: async (itemId: string, data: Partial<TaskProject>) => {
    const docRef = doc(db, PROJECTS_COLLECTION, itemId);
    return await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  deleteItem: async (itemId: string) => {
    const docRef = doc(db, PROJECTS_COLLECTION, itemId);
    return await deleteDoc(docRef);
  },
};
