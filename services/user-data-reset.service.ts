import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const USER_DATA_COLLECTIONS = [
  "goals",
  "notes",
  "tasks",
  "taskProjects",
  "flashcards",
  "srs",
  "dsa",
  "machineCoding",
] as const;

const DELETE_BATCH_SIZE = 450;

const APP_STORAGE_KEYS = [
  "soundEnabled",
  "streakly:dsa:gemini_api_key",
  "streakly:dsa:ai_enabled",
  "streakly:wizard:walkthrough_data",
  "streakly:wizard:active_line_idx",
  "streakly:patterns:completed",
  "streakly-compiler-code",
  "streakly-compiler-stdin",
] as const;

const RETIRED_COACH_HISTORY_PREFIX = "streakly:ai_assistant:history:";

export async function resetUserData(userId: string): Promise<void> {
  if (!userId) {
    throw new Error("A signed-in user is required to reset account data.");
  }

  const snapshots = await Promise.all(
    USER_DATA_COLLECTIONS.map((collectionName) =>
      getDocs(
        query(
          collection(db, collectionName),
          where("userId", "==", userId)
        )
      )
    )
  );

  const documentRefs = snapshots.flatMap((snapshot) =>
    snapshot.docs.map((snapshotDoc) => snapshotDoc.ref)
  );
  documentRefs.push(
    doc(db, "notebooks", userId),
    doc(db, "profiles", userId)
  );

  for (let index = 0; index < documentRefs.length; index += DELETE_BATCH_SIZE) {
    const batch = writeBatch(db);
    documentRefs
      .slice(index, index + DELETE_BATCH_SIZE)
      .forEach((documentRef) => batch.delete(documentRef));
    await batch.commit();
  }
}

export function clearAppBrowserData(): void {
  for (const key of APP_STORAGE_KEYS) {
    localStorage.removeItem(key);
  }

  for (let index = localStorage.length - 1; index >= 0; index -= 1) {
    const key = localStorage.key(index);
    if (key?.startsWith(RETIRED_COACH_HISTORY_PREFIX)) {
      localStorage.removeItem(key);
    }
  }
}
