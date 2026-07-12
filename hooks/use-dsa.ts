import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { dsaService, DSAItem } from "@/services/dsa.service";
import { useAuth } from "@/components/auth-provider";
import { useMutationWrapper } from "./use-mutation-wrapper";
import { DSADifficulty, DSAPriority } from "@/lib/schemas/dsa.schema";

const QUERY_KEY = ["dsa"];

export function useDSAItems() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Primary query for fetching items
  const query = useQuery({
    queryKey: [QUERY_KEY, user?.uid],
    queryFn: () => (user ? dsaService.fetchItems(user.uid) : []),
    enabled: !!user,
  });

  // Real-time synchronization
  useEffect(() => {
    if (!user) return;

    const unsubscribe = dsaService.subscribeToItems(user.uid, (items) => {
      queryClient.setQueryData([QUERY_KEY, user.uid], items);
    });

    return () => unsubscribe();
  }, [user, queryClient]);

  return query;
}

export function useAddDSAItem() {
  const { user } = useAuth();

  return useMutationWrapper({
    mutationFn: (vars: {
      problemName: string;
      problemUrl?: string | null;
      difficulty: DSADifficulty;
      topics: string[];
      subPattern?: string | null;
      timeComplexity?: string | null;
      spaceComplexity?: string | null;
      intuition?: string | null;
      codeSnippet?: string | null;
      nextReviewDate: Date | null;
      priority?: DSAPriority;
      link?: string | null;
    }) => {
      if (!user) throw new Error("Auth required");
      return dsaService.addItem({
        userId: user.uid,
        email: user.email,
        ...vars,
      });
    },
    invalidateKeys: [[QUERY_KEY, user?.uid]],
    successMessage: "DSA Problem added to your tracker.",
  });
}

export function useUpdateDSAItem() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutationWrapper({
    mutationFn: (vars: { itemId: string; data: Partial<DSAItem> }) => {
      return dsaService.updateItem(vars.itemId, vars.data);
    },
    invalidateKeys: [[QUERY_KEY, user?.uid]],
    // Optimistic Update
    onMutate: async (newInfo) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, user?.uid] });
      const previousItems = queryClient.getQueryData<DSAItem[]>([QUERY_KEY, user?.uid]);

      if (previousItems) {
        queryClient.setQueryData(
          [QUERY_KEY, user?.uid],
          previousItems.map((item) =>
            item.id === newInfo.itemId ? { ...item, ...newInfo.data } : item
          )
        );
      }

      return { previousItems };
    },
    onError: (err, newInfo, context: any) => {
      if (context?.previousItems) {
        queryClient.setQueryData([QUERY_KEY, user?.uid], context.previousItems);
      }
    },
  });
}

export function useDeleteDSAItem() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutationWrapper({
    mutationFn: (itemId: string) => {
      return dsaService.deleteItem(itemId);
    },
    invalidateKeys: [[QUERY_KEY, user?.uid]],
    // Optimistic Update
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, user?.uid] });
      const previousItems = queryClient.getQueryData<DSAItem[]>([QUERY_KEY, user?.uid]);

      if (previousItems) {
        queryClient.setQueryData(
          [QUERY_KEY, user?.uid],
          previousItems.filter((item) => item.id !== itemId)
        );
      }

      return { previousItems };
    },
    onError: (err, itemId, context: any) => {
      if (context?.previousItems) {
        queryClient.setQueryData([QUERY_KEY, user?.uid], context.previousItems);
      }
    },
    successMessage: "DSA Problem deleted from your tracker.",
  });
}
