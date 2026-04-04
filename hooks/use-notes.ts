import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { notesService, GoalNote } from "@/services/notes.service";
import { useAuth } from "@/components/auth-provider";
import { useMutationWrapper } from "./use-mutation-wrapper";

const QUERY_KEY = ["notes"];

export function useGoalNotes(goalId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery<GoalNote[]>({
    queryKey: [QUERY_KEY, "goal", goalId],
    queryFn: () => [],
    enabled: !!user && !!goalId,
  });

  useEffect(() => {
    if (!user || !goalId) return;
    const unsubscribe = notesService.subscribeByGoalId(goalId, user.uid, (notes) => {
      queryClient.setQueryData([QUERY_KEY, "goal", goalId], notes);
    });
    return () => unsubscribe();
  }, [user, goalId, queryClient]);

  return query;
}

export function useAddNote() {
  const { user } = useAuth();

  return useMutationWrapper<any, Error, { goalId: string; content: string }>({
    mutationFn: (vars) => {
      if (!user) throw new Error("Auth required");
      return notesService.addNote(vars.goalId, user.uid, vars.content);
    },
    invalidateKeys: (_, vars) => [[QUERY_KEY, "goal", vars.goalId]],
    successMessage: "Progress recorded.",
  });
}

export function useUpdateNote() {
  return useMutationWrapper<any, Error, { noteId: string; content: string; goalId: string }>({
    mutationFn: (vars) => {
      return notesService.updateNote(vars.noteId, vars.content);
    },
    invalidateKeys: (_, vars) => [[QUERY_KEY, "goal", vars.goalId]],
    successMessage: "Log updated.",
  });
}

export function useDeleteNote() {
  return useMutationWrapper<any, Error, { noteId: string; goalId: string }>({
    mutationFn: (vars) => {
      return notesService.deleteNote(vars.noteId);
    },
    invalidateKeys: (_, vars) => [[QUERY_KEY, "goal", vars.goalId]],
    successMessage: "Log deleted.",
  });
}
