import { useMutation, useQueryClient } from "@tanstack/react-query";
import { postWordsClick, InputType } from "../endpoints/words/click_POST.schema";
import { toast } from "sonner";

export const useWordClickMutation = () => {
  const queryClient = useQueryClient();

  return useMutation<void, Error, InputType>({
    mutationFn: async (variables) => {
      await postWordsClick(variables);
    },
    onSuccess: () => {
      // Invalidate queries that might be affected by this mutation,
      // for example, a query that fetches word click statistics.
      // queryClient.invalidateQueries({ queryKey: ['word-statistics'] });
      console.log("Word click tracked successfully.");
    },
    onError: (error) => {
      console.error("Failed to track word click:", error);
      if (error.message.includes("authentication") || error.message.includes("authenticated")) {
        toast.error("Please log in to track your progress.");
      } else {
        toast.error("Could not save word click data. Please try again.");
      }
    },
  });
};