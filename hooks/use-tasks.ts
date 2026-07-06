import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import {
  tasksService,
  taskProjectsService,
  Task,
  TaskProject,
} from "@/services/tasks.service";
import { useAuth } from "@/components/auth-provider";
import { useMutationWrapper } from "./use-mutation-wrapper";
import {
  TaskStatus,
  TaskPriority,
  Subtask,
  TaskProjectColor,
} from "@/lib/schemas/task.schema";

const TASKS_KEY = ["tasks"];
const PROJECTS_KEY = ["taskProjects"];

// ---------------------------------------------------------------------------
// Tasks
// ---------------------------------------------------------------------------

export function useTasks() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [TASKS_KEY, user?.uid],
    queryFn: () => (user ? tasksService.fetchItems(user.uid) : []),
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const unsubscribe = tasksService.subscribeToItems(user.uid, (items) => {
      queryClient.setQueryData([TASKS_KEY, user.uid], items);
    });
    return () => unsubscribe();
  }, [user, queryClient]);

  return query;
}

export function useAddTask() {
  const { user } = useAuth();

  return useMutationWrapper({
    mutationFn: (vars: {
      title: string;
      description?: string | null;
      projectId?: string | null;
      status?: TaskStatus;
      priority?: TaskPriority;
      tags?: string[];
      dueDate?: Date | null;
      subtasks?: Subtask[];
      order?: number;
    }) => {
      if (!user) throw new Error("Auth required");
      return tasksService.addItem({
        userId: user.uid,
        email: user.email,
        ...vars,
      });
    },
    invalidateKeys: [[TASKS_KEY, user?.uid]],
    successMessage: "Task added.",
  });
}

export function useUpdateTask() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutationWrapper({
    mutationFn: (vars: { itemId: string; data: Partial<Task> }) => {
      return tasksService.updateItem(vars.itemId, vars.data);
    },
    invalidateKeys: [[TASKS_KEY, user?.uid]],
    onMutate: async (newInfo) => {
      await queryClient.cancelQueries({ queryKey: [TASKS_KEY, user?.uid] });
      const previousItems = queryClient.getQueryData<Task[]>([
        TASKS_KEY,
        user?.uid,
      ]);

      if (previousItems) {
        queryClient.setQueryData(
          [TASKS_KEY, user?.uid],
          previousItems.map((item) =>
            item.id === newInfo.itemId ? { ...item, ...newInfo.data } : item
          )
        );
      }

      return { previousItems };
    },
    onError: (err, newInfo, context: any) => {
      if (context?.previousItems) {
        queryClient.setQueryData([TASKS_KEY, user?.uid], context.previousItems);
      }
    },
  });
}

export function useDeleteTask() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutationWrapper({
    mutationFn: (itemId: string) => {
      return tasksService.deleteItem(itemId);
    },
    invalidateKeys: [[TASKS_KEY, user?.uid]],
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey: [TASKS_KEY, user?.uid] });
      const previousItems = queryClient.getQueryData<Task[]>([
        TASKS_KEY,
        user?.uid,
      ]);

      if (previousItems) {
        queryClient.setQueryData(
          [TASKS_KEY, user?.uid],
          previousItems.filter((item) => item.id !== itemId)
        );
      }

      return { previousItems };
    },
    onError: (err, itemId, context: any) => {
      if (context?.previousItems) {
        queryClient.setQueryData([TASKS_KEY, user?.uid], context.previousItems);
      }
    },
    successMessage: "Task deleted.",
  });
}

// ---------------------------------------------------------------------------
// Projects / lists
// ---------------------------------------------------------------------------

export function useTaskProjects() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: [PROJECTS_KEY, user?.uid],
    queryFn: () => (user ? taskProjectsService.fetchItems(user.uid) : []),
    enabled: !!user,
  });

  useEffect(() => {
    if (!user) return;
    const unsubscribe = taskProjectsService.subscribeToItems(
      user.uid,
      (items) => {
        queryClient.setQueryData([PROJECTS_KEY, user.uid], items);
      }
    );
    return () => unsubscribe();
  }, [user, queryClient]);

  return query;
}

export function useAddTaskProject() {
  const { user } = useAuth();

  return useMutationWrapper({
    mutationFn: (vars: { name: string; color?: TaskProjectColor }) => {
      if (!user) throw new Error("Auth required");
      return taskProjectsService.addItem({
        userId: user.uid,
        email: user.email,
        ...vars,
      });
    },
    invalidateKeys: [[PROJECTS_KEY, user?.uid]],
    successMessage: "List created.",
  });
}

export function useUpdateTaskProject() {
  const { user } = useAuth();

  return useMutationWrapper({
    mutationFn: (vars: { itemId: string; data: Partial<TaskProject> }) => {
      return taskProjectsService.updateItem(vars.itemId, vars.data);
    },
    invalidateKeys: [[PROJECTS_KEY, user?.uid]],
    successMessage: "List updated.",
  });
}

export function useDeleteTaskProject() {
  const { user } = useAuth();

  return useMutationWrapper({
    mutationFn: (itemId: string) => {
      return taskProjectsService.deleteItem(itemId);
    },
    invalidateKeys: [[PROJECTS_KEY, user?.uid]],
    successMessage: "List deleted.",
  });
}
