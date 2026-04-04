import { useMutation, useQueryClient, UseMutationOptions, QueryKey } from "@tanstack/react-query";
import { useToast } from "@/components/ui/toast";

type InvalidateKeys<TData, TVariables> = QueryKey[] | ((data: TData, variables: TVariables) => QueryKey[]);

interface MutationWrapperOptions<TData, TError, TVariables, TContext> 
  extends UseMutationOptions<TData, TError, TVariables, TContext> {
  invalidateKeys?: InvalidateKeys<TData, TVariables>;
  successMessage?: string;
  errorMessage?: string;
}

export function useMutationWrapper<TData = unknown, TError = Error, TVariables = void, TContext = unknown>(
  options: MutationWrapperOptions<TData, TError, TVariables, TContext>
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    ...options,
    onSuccess: async (data, variables, context, mutation) => {
      if (options.invalidateKeys) {
        const keys = typeof options.invalidateKeys === "function" 
          ? options.invalidateKeys(data, variables)
          : options.invalidateKeys;
          
        await Promise.all(
          keys.map(key => queryClient.invalidateQueries({ queryKey: key }))
        );
      }
      
      if (options.successMessage) {
        toast({
          title: "Success",
          description: options.successMessage,
          variant: "success",
        });
      }

      if (options.onSuccess) {
        options.onSuccess(data, variables, context, mutation);
      }
    },
    onError: (error, variables, context, mutation) => {
      console.error("Mutation error:", error);
      
      toast({
        title: "Error",
        description: options.errorMessage || (error instanceof Error ? error.message : "Something went wrong"),
        variant: "error",
      });

      if (options.onError) {
        options.onError(error, variables, context, mutation);
      }
    },
  });
}
