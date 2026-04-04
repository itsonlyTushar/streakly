import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { notesService, GoalNote } from "@/services/notes.service";
import { useAuth } from "@/components/auth-provider";

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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { goalId: string; content: string }) => {
      if (!user) throw new Error("Auth required");
      return notesService.addNote(vars.goalId, user.uid, vars.content);
    },
    onSuccess: (data, vars) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, "goal", vars.goalId] });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { noteId: string; content: string; goalId: string }) => {
      return notesService.updateNote(vars.noteId, vars.content);
    },
    onSuccess: (data, vars) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, "goal", vars.goalId] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { noteId: string; goalId: string }) => {
      return notesService.deleteNote(vars.noteId);
    },
    onSuccess: (data, vars) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, "goal", vars.goalId] });
    },
  });
}
