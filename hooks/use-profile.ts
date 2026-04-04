import { useQuery, useQueryClient } from "@tanstack/react-query";
import { profileService, ProfileData } from "@/services/profile.service";
import { useAuth } from "@/components/auth-provider";
import { useMutationWrapper } from "./use-mutation-wrapper";

const QUERY_KEY = ["profile"];

export function useProfile() {
  const { user } = useAuth();

  return useQuery({
    queryKey: [QUERY_KEY, user?.uid],
    queryFn: () => (user ? profileService.getProfile(user.uid) : null),
    enabled: !!user,
  });
}

export function useUpdateProfile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutationWrapper({
    mutationFn: (data: Partial<ProfileData>) => {
      if (!user) throw new Error("Auth required");
      return profileService.updateProfile(user.uid, data);
    },
    invalidateKeys: [[QUERY_KEY, user?.uid]],
    successMessage: "Profile updated successfully.",
    // Optimistic Update
    onMutate: async (newData) => {
      await queryClient.cancelQueries({ queryKey: [QUERY_KEY, user?.uid] });
      const previousProfile = queryClient.getQueriesData<ProfileData>({ queryKey: [QUERY_KEY, user?.uid] });

      if (previousProfile?.[0]) {
        queryClient.setQueryData([QUERY_KEY, user?.uid], {
          ...previousProfile[0][1],
          ...newData,
        });
      }

      return { previousProfile };
    },
    onError: (err, newData, context: any) => {
      if (context?.previousProfile?.[0]) {
        queryClient.setQueryData([QUERY_KEY, user?.uid], context.previousProfile[0][1]);
      }
    },
  });
}
