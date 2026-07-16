import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import { useAuth } from "@/components/auth-provider";
import { useMutationWrapper } from "@/hooks/use-mutation-wrapper";
import {
  machineCodingService,
  type MachineCodingEntry,
} from "@/services/machine-coding.service";

const QUERY_KEY = ["machine-coding"];

export function useMachineCodingItems() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery<MachineCodingEntry[]>({
    queryKey: [QUERY_KEY, user?.uid],
    queryFn: () => (user ? machineCodingService.fetchItems(user.uid) : []),
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;

    const unsubscribe = machineCodingService.subscribeToItems(user.uid, (items) => {
      queryClient.setQueryData([QUERY_KEY, user.uid], items);
    });

    return () => unsubscribe();
  }, [user, queryClient]);

  return query;
}

export function useAddMachineCodingItem() {
  const { user } = useAuth();
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  return useMutationWrapper({
    mutationFn: (vars: {
      questionName: string;
      approach: string;
      solutionCode: string;
      language: "JavaScript" | "React";
      link?: string | null;
      practiceDate?: Date | null;
    }) => {
      const currentUser = userRef.current;
      if (!currentUser) throw new Error("Auth required");

      return machineCodingService.addItem({
        userId: currentUser.uid,
        email: currentUser.email,
        ...vars,
      });
    },
    invalidateKeys: [[QUERY_KEY, user?.uid]],
    successMessage: "Machine-coding entry saved to your library.",
  });
}

export function useUpdateMachineCodingItem() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutationWrapper({
    mutationFn: (vars: { itemId: string; data: Partial<MachineCodingEntry> }) => {
      return machineCodingService.updateItem(vars.itemId, vars.data);
    },
    invalidateKeys: [[QUERY_KEY, user?.uid]],
    // Optimistic Update
    onMutate: async (newInfo) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, user?.uid] });
      const previousItems = queryClient.getQueryData<MachineCodingEntry[]>([QUERY_KEY, user?.uid]);

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

export function useDeleteMachineCodingItem() {
  const { user } = useAuth();
  const userRef = useRef(user);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  return useMutationWrapper({
    mutationFn: (itemId: string) => {
      const currentUser = userRef.current;
      if (!currentUser) throw new Error("Auth required");
      return machineCodingService.deleteItem(itemId);
    },
    invalidateKeys: [[QUERY_KEY, user?.uid]],
    successMessage: "Machine-coding entry removed.",
  });
}
