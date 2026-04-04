import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const COLLECTION_NAME = "profiles";

export interface ProfileData {
  userId: string;
  email?: string;
  bio?: string;
  emailNotifications?: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export const profileService = {
  getProfile: async (userId: string): Promise<ProfileData | null> => {
    const docRef = doc(db, COLLECTION_NAME, userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as ProfileData;
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
