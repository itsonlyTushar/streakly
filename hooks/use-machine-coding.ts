import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
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

  return useMutationWrapper({
    mutationFn: (vars: {
      questionName: string;
      approach: string;
      solutionCode: string;
      language: "JavaScript" | "React";
    }) => {
      if (!user) throw new Error("Auth required");
      return machineCodingService.addItem({
        userId: user.uid,
        email: user.email,
        ...vars,
      });
    },
    invalidateKeys: [[QUERY_KEY, user?.uid]],
    successMessage: "Machine-coding entry saved to your library.",
  });
}

export function useDeleteMachineCodingItem() {
  const { user } = useAuth();

  return useMutationWrapper({
    mutationFn: (itemId: string) => machineCodingService.deleteItem(itemId),
    invalidateKeys: [[QUERY_KEY, user?.uid]],
    successMessage: "Machine-coding entry removed.",
  });
}
