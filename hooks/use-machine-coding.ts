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
    }) => {
      const currentUser = userRef.current;
      if (!currentUser) throw new Error("Auth required");

      return machineCodingService.addItem({
        userId: currentUser.uid,
        email: currentUser.email,
        ...vars,
      });
    },
    invalidateKeys: [[QUERY_KEY]],
    successMessage: "Machine-coding entry saved to your library.",
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
    invalidateKeys: [[QUERY_KEY]],
    successMessage: "Machine-coding entry removed.",
  });
}
