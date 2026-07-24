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
import { Flashcard, FlashcardSchema, ReviewRating } from "@/lib/schemas/flashcard.schema";
import { addDays } from "date-fns";

export type { Flashcard, ReviewRating };

const COLLECTION_NAME = "flashcards";

export const flashcardsService = {
  // Real-time subscription
  subscribeToCards: (userId: string, callback: (cards: Flashcard[]) => void) => {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("userId", "==", userId)
    );

    return onSnapshot(q, (snapshot) => {
      const cards = snapshot.docs.map((doc) => {
        const data = { id: doc.id, ...doc.data() };
        return FlashcardSchema.parse(data);
      });

      // Sort cards: due cards first, then by creation date descending
      cards.sort((a, b) => {
        const dateA = a.createdAt?.toMillis() || 0;
        const dateB = b.createdAt?.toMillis() || 0;
        return dateB - dateA;
      });

      callback(cards);
    });
  },

  // One-time fetch
  fetchCards: async (userId: string): Promise<Flashcard[]> => {
    const q = query(
      collection(db, COLLECTION_NAME),
      where("userId", "==", userId)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
      const data = { id: doc.id, ...doc.data() };
      return FlashcardSchema.parse(data);
    });
  },

  // Create card
  addCard: async (
    userId: string,
    email: string | null,
    data: {
      deck: string;
      front: string;
      back: string;
      tags?: string[];
    }
  ) => {
    const now = new Date();
    const initialNextReview = addDays(now, 1);

    return await addDoc(collection(db, COLLECTION_NAME), {
      userId,
      userEmail: email,
      deck: data.deck.trim() || "General",
      front: data.front.trim(),
      back: data.back.trim(),
      tags: data.tags || [],
      reviewCount: 0,
      easeFactor: 2.5,
      intervalDays: 1,
      nextReviewDate: Timestamp.fromDate(initialNextReview),
      lastReviewedAt: null,
      mastered: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
  },

  // Update card
  updateCard: async (cardId: string, data: Partial<Flashcard>) => {
    const docRef = doc(db, COLLECTION_NAME, cardId);
    return await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  },

  // Record review rating
  recordReview: async (card: Flashcard, rating: ReviewRating) => {
    const docRef = doc(db, COLLECTION_NAME, card.id);
    const currentInterval = card.intervalDays || 1;
    const currentReviewCount = card.reviewCount || 0;

    let nextIntervalDays = 1;
    let isMastered = card.mastered;

    switch (rating) {
      case "again":
        nextIntervalDays = 1;
        break;
      case "hard":
        nextIntervalDays = Math.max(2, Math.round(currentInterval * 1.2));
        break;
      case "good":
        nextIntervalDays = Math.max(4, Math.round(currentInterval * 2.0));
        break;
      case "easy":
        nextIntervalDays = Math.max(7, Math.round(currentInterval * 2.8));
        break;
      case "mastered":
        nextIntervalDays = 30;
        isMastered = true;
        break;
    }

    const nextReviewDate = addDays(new Date(), nextIntervalDays);

    return await updateDoc(docRef, {
      reviewCount: currentReviewCount + 1,
      intervalDays: nextIntervalDays,
      nextReviewDate: Timestamp.fromDate(nextReviewDate),
      lastReviewedAt: serverTimestamp(),
      mastered: isMastered,
      updatedAt: serverTimestamp(),
    });
  },

  // Delete card
  deleteCard: async (cardId: string) => {
    const docRef = doc(db, COLLECTION_NAME, cardId);
    return await deleteDoc(docRef);
  },
};
