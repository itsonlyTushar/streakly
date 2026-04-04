import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { goalsService, GoalData } from "@/services/goals.service";
import { useAuth } from "@/components/auth-provider";
import { useMutationWrapper } from "./use-mutation-wrapper";

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

  return useMutationWrapper({
    mutationFn: (vars: { goal: string; dueDate: string; color?: string }) => {
      if (!user) throw new Error("Auth required");
      return goalsService.addGoal(user.uid, vars.goal, vars.dueDate, vars.color);
    },
    invalidateKeys: [[QUERY_KEY, "active", user?.uid]],
    successMessage: "Goal created! Stay consistent.",
  });
}

export function useCompleteGoal() {
  const { user } = useAuth();

  return useMutationWrapper({
    mutationFn: (id: string) => goalsService.completeGoal(id),
    invalidateKeys: [
      [QUERY_KEY, "active", user?.uid],
      [QUERY_KEY, "completed", user?.uid]
    ],
    successMessage: "Goal achieved! Welcome to the Hall of Fame.",
  });
}

export function useDeleteGoal() {
  const { user } = useAuth();

  return useMutationWrapper({
    mutationFn: (id: string) => goalsService.deleteGoal(id),
    invalidateKeys: [
      [QUERY_KEY, "active", user?.uid],
      [QUERY_KEY, "completed", user?.uid]
    ],
    successMessage: "Goal removed.",
  });
}
