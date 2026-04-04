import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { notebookService, NotebookData } from "@/services/notebook.service";
import { useAuth } from "@/components/auth-provider";

const QUERY_KEY = ["notebook"];

export function useNotebook() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [QUERY_KEY, user?.uid],
    queryFn: () => (user ? notebookService.getNotebook(user.uid) : null),
    enabled: !!user,
  });
}

export function useSaveNotebook() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (drawing: string) => {
      if (!user) throw new Error("Auth required");
      return notebookService.saveNotebook(user.uid, drawing);
    },
    // Optimistic Update
    onMutate: async (newDrawing) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, user?.uid] });
      const previousNotebook = queryClient.getQueryData<NotebookData>([QUERY_KEY, user?.uid]);

      if (previousNotebook) {
        queryClient.setQueryData([QUERY_KEY, user?.uid], {
          ...previousNotebook,
          drawing: newDrawing,
        });
      }

      return { previousNotebook };
    },
    onError: (err, newDrawing, context) => {
      if (context?.previousNotebook) {
        queryClient.setQueryData([QUERY_KEY, user?.uid], context.previousNotebook);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEY, user?.uid] });
    },
  });
}
