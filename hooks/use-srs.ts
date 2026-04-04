import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { srsService, SRSItem } from "@/services/srs.service";
import { useAuth } from "@/components/auth-provider";
import { useMutationWrapper } from "./use-mutation-wrapper";

const QUERY_KEY = ["srs"];

export function useSRSItems() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Primary query for fetching items
  const query = useQuery({
    queryKey: [QUERY_KEY, user?.uid],
    queryFn: () => (user ? srsService.fetchItems(user.uid) : []),
    enabled: !!user,
  });

  // Real-time synchronization
  useEffect(() => {
    if (!user) return;

    const unsubscribe = srsService.subscribeToItems(user.uid, (items) => {
      queryClient.setQueryData([QUERY_KEY, user.uid], items);
    });

    return () => unsubscribe();
  }, [user, queryClient]);

  return query;
}

export function useAddSRSItem() {
  const { user } = useAuth();

  return useMutationWrapper({
    mutationFn: (vars: { topic: string; details: string; nextReviewDate: Date }) => {
      if (!user) throw new Error("Auth required");
      return srsService.addItem(user.uid, user.email, vars.topic, vars.details, vars.nextReviewDate);
    },
    invalidateKeys: [[QUERY_KEY, user?.uid]],
    successMessage: "Topic added to your SRS list.",
  });
}

export function useUpdateSRSItem() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutationWrapper({
    mutationFn: (vars: { itemId: string; data: Partial<SRSItem> }) => {
      return srsService.updateItem(vars.itemId, vars.data);
    },
    invalidateKeys: [[QUERY_KEY, user?.uid]],
    // Optimistic Update
    onMutate: async (newInfo) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, user?.uid] });
      const previousItems = queryClient.getQueryData<SRSItem[]>([QUERY_KEY, user?.uid]);

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
