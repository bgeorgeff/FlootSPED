import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  postReadingSessionStart,
  InputType as StartSessionInput,
} from "../endpoints/reading/session/start_POST.schema";
import {
  postReadingProgressUpdate,
  InputType as UpdateProgressInput,
} from "../endpoints/reading/progress/update_POST.schema";
import {
  postReadingSessionComplete,
  InputType as CompleteSessionInput,
} from "../endpoints/reading/session/complete_POST.schema";
import {
  getReadingProgress,
  InputType as GetProgressInput,
  UserProgress,
} from "../endpoints/reading/progress_GET.schema";
import { toast } from "sonner";

export const READING_PROGRESS_QUERY_KEY = ["reading", "progress"] as const;

/**
 * Query to fetch user's reading progress for all materials.
 * @param params - Optional filtering and sorting parameters.
 */
export const useUserProgress = (params?: GetProgressInput) => {
  return useQuery({
    queryKey: [...READING_PROGRESS_QUERY_KEY, params],
    queryFn: async () => {
      const result = await getReadingProgress(params);
      if ("error" in result) {
        throw new Error(result.error);
      }
      return result.progress;
    },
  });
};

/**
 * Mutation to start a new reading session.
 */
export const useStartReadingSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: StartSessionInput) => {
      const result = await postReadingSessionStart(input);
      if ("error" in result) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      // Invalidate progress queries to refetch the new/updated progress record
      queryClient.invalidateQueries({ queryKey: READING_PROGRESS_QUERY_KEY });
      toast.success("Reading session started!");
    },
    onError: (error) => {
      toast.error(`Failed to start session: ${error.message}`);
    },
  });
};

/**
 * Mutation to update reading progress during a session.
 */
export const useUpdateReadingProgress = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: UpdateProgressInput) => {
      const result = await postReadingProgressUpdate(input);
      if ("error" in result) {
        throw new Error(result.error);
      }
      return result;
    },
    // Optimistic updates can be complex here, so we'll stick to invalidation.
    // For a smoother UX, one could implement optimistic updates by updating the specific progress item in the cache.
    onSuccess: () => {
      // Invalidate to show the latest progress, though this might be too frequent.
      // Consider debouncing or throttling calls to this mutation on the frontend.
      queryClient.invalidateQueries({ queryKey: READING_PROGRESS_QUERY_KEY });
    },
    onError: (error) => {
      // Avoid spamming toasts for a frequently called endpoint.
      console.error("Failed to update progress:", error.message);
    },
  });
};

/**
 * Mutation to complete a reading session.
 */
export const useCompleteReadingSession = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: CompleteSessionInput) => {
      const result = await postReadingSessionComplete(input);
      if ("error" in result) {
        throw new Error(result.error);
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: READING_PROGRESS_QUERY_KEY });
      toast.success("Congratulations on completing your reading!");
    },
    onError: (error) => {
      toast.error(`Failed to complete session: ${error.message}`);
    },
  });
};