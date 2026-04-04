import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { srsService, SRSItem } from "@/services/srs.service";
import { useAuth } from "@/components/auth-provider";

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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { topic: string; details: string; nextReviewDate: Date }) => {
      if (!user) throw new Error("Auth required");
      return srsService.addItem(user.uid, user.email, vars.topic, vars.details, vars.nextReviewDate);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, user?.uid] });
    },
  });
}

export function useUpdateSRSItem() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { itemId: string; data: Partial<SRSItem> }) => {
      return srsService.updateItem(vars.itemId, vars.data);
    },
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
    onError: (err, newInfo, context) => {
      if (context?.previousItems) {
        queryClient.setQueryData([QUERY_KEY, user?.uid], context.previousItems);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, user?.uid] });
    },
  });
}
