import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const COLLECTION_NAME = "profiles";

import { ProfileData, ProfileSchema } from "@/lib/schemas/profile.schema";
export type { ProfileData };

export const profileService = {
  getProfile: async (userId: string): Promise<ProfileData | null> => {
    const docRef = doc(db, COLLECTION_NAME, userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = { id: docSnap.id, ...docSnap.data() };
      return ProfileSchema.parse(data);
    }
    return null;
  },

  updateProfile: async (userId: string, data: Partial<ProfileData>) => {
    const docRef = doc(db, COLLECTION_NAME, userId);
    return await setDoc(
      docRef,
      {
        ...data,
        updatedAt: serverTimestamp(),
      },
      { merge: true }
    );
  },

  // Initialize profile with default values if it doesn't exist
  initializeProfile: async (userId: string, email?: string | null) => {
    const docRef = doc(db, COLLECTION_NAME, userId);
    const docSnap = await getDoc(docRef);
    if (!docSnap.exists()) {
      await setDoc(docRef, {
        userId,
        email,
        emailNotifications: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }
  },
};
