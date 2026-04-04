import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { goalsService, GoalData } from "@/services/goals.service";
import { useAuth } from "@/components/auth-provider";

const QUERY_KEY = ["goals"];

export function useActiveGoals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery<GoalData[]>({
    queryKey: [QUERY_KEY, "active", user?.uid],
    queryFn: () => [],
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const unsubscribe = goalsService.subscribeActive(user.uid, (goals) => {
      queryClient.setQueryData([QUERY_KEY, "active", user.uid], goals);
    });
    return () => unsubscribe();
  }, [user, queryClient]);

  return query;
}

export function useCompletedGoals() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery<GoalData[]>({
    queryKey: [QUERY_KEY, "completed", user?.uid],
    queryFn: () => [],
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const unsubscribe = goalsService.subscribeCompleted(user.uid, (goals) => {
      queryClient.setQueryData([QUERY_KEY, "completed", user.uid], goals);
    });
    return () => unsubscribe();
  }, [user, queryClient]);

  return query;
}

export function useGoal(id: string) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [QUERY_KEY, "detail", id],
    queryFn: () => goalsService.getGoalById(id),
    enabled: !!id,
  });

  useEffect(() => {
    if (!id) return;
    const unsubscribe = goalsService.subscribeToGoal(id, (goal) => {
      queryClient.setQueryData([QUERY_KEY, "detail", id], goal);
    });
    return () => unsubscribe();
  }, [id, queryClient]);

  return query;
}

export function useAddGoal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (vars: { goal: string; dueDate: string; color?: string }) => {
      if (!user) throw new Error("Auth required");
      return goalsService.addGoal(user.uid, vars.goal, vars.dueDate, vars.color);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, "active", user?.uid] });
    },
  });
}

export function useCompleteGoal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => goalsService.completeGoal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, "active", user?.uid] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, "completed", user?.uid] });
    },
  });
}

export function useDeleteGoal() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => goalsService.deleteGoal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, "active", user?.uid] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, "completed", user?.uid] });
    },
  });
}
