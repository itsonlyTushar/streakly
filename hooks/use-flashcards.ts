import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { flashcardsService, Flashcard, ReviewRating } from "@/services/flashcards.service";
import { useAuth } from "@/components/auth-provider";
import { useMutationWrapper } from "./use-mutation-wrapper";

const QUERY_KEY = ["flashcards"];

export function useFlashcards() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [QUERY_KEY, user?.uid],
    queryFn: () => (user ? flashcardsService.fetchCards(user.uid) : []),
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;

    const unsubscribe = flashcardsService.subscribeToCards(user.uid, (cards) => {
      queryClient.setQueryData([QUERY_KEY, user.uid], cards);
    });

    return () => unsubscribe();
  }, [user, queryClient]);

  return query;
}

export function useAddFlashcard() {
  const { user } = useAuth();

  return useMutationWrapper({
    mutationFn: (vars: { deck: string; front: string; back: string; tags?: string[] }) => {
      if (!user) throw new Error("Auth required");
      return flashcardsService.addCard(user.uid, user.email, vars);
    },
    invalidateKeys: [[QUERY_KEY, user?.uid]],
    successMessage: "Flashcard added successfully.",
  });
}

export function useUpdateFlashcard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutationWrapper({
    mutationFn: (vars: { cardId: string; data: Partial<Flashcard> }) => {
      return flashcardsService.updateCard(vars.cardId, vars.data);
    },
    invalidateKeys: [[QUERY_KEY, user?.uid]],
    onMutate: async (vars) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, user?.uid] });
      const previousCards = queryClient.getQueryData<Flashcard[]>([QUERY_KEY, user?.uid]);

      if (previousCards) {
        queryClient.setQueryData(
          [QUERY_KEY, user?.uid],
          previousCards.map((c) => (c.id === vars.cardId ? { ...c, ...vars.data } : c))
        );
      }

      return { previousCards };
    },
    onError: (err, vars, context: any) => {
      if (context?.previousCards) {
        queryClient.setQueryData([QUERY_KEY, user?.uid], context.previousCards);
      }
    },
    successMessage: "Flashcard updated.",
  });
}

export function useRecordFlashcardReview() {
  const { user } = useAuth();

  return useMutationWrapper({
    mutationFn: (vars: { card: Flashcard; rating: ReviewRating }) => {
      return flashcardsService.recordReview(vars.card, vars.rating);
    },
    invalidateKeys: [[QUERY_KEY, user?.uid]],
  });
}

export function useDeleteFlashcard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutationWrapper({
    mutationFn: (cardId: string) => {
      return flashcardsService.deleteCard(cardId);
    },
    invalidateKeys: [[QUERY_KEY, user?.uid]],
    onMutate: async (cardId) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, user?.uid] });
      const previousCards = queryClient.getQueryData<Flashcard[]>([QUERY_KEY, user?.uid]);

      if (previousCards) {
        queryClient.setQueryData(
          [QUERY_KEY, user?.uid],
          previousCards.filter((c) => c.id !== cardId)
        );
      }

      return { previousCards };
    },
    onError: (err, cardId, context: any) => {
      if (context?.previousCards) {
        queryClient.setQueryData([QUERY_KEY, user?.uid], context.previousCards);
      }
    },
    successMessage: "Flashcard deleted.",
  });
}
