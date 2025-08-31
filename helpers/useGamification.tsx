import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getAchievements,
  AchievementWithProgress,
} from "../endpoints/gamification/achievements_GET.schema";
import {
  getUserAchievements,
  OutputType as UserAchievementsOutputType,
} from "../endpoints/gamification/user-achievements_GET.schema";
import {
  getRewards,
  InputType as RewardsInputType,
  OutputType as RewardsOutputType,
} from "../endpoints/gamification/rewards_GET.schema";
import {
  postUnlockReward,
  InputType as UnlockRewardInputType,
} from "../endpoints/gamification/unlock-reward_POST.schema";
import {
  getChallenges,
  InputType as ChallengesInputType,
  OutputType as ChallengesOutputType,
} from "../endpoints/gamification/challenges_GET.schema";
import { toast } from "sonner";

// React Query Keys
export const GAMIFICATION_QUERY_KEYS = {
  all: ["gamification"] as const,
  achievements: () =>
    [...GAMIFICATION_QUERY_KEYS.all, "achievements"] as const,
  userAchievements: () =>
    [...GAMIFICATION_QUERY_KEYS.all, "user-achievements"] as const,
  rewards: (filters: RewardsInputType) =>
    [...GAMIFICATION_QUERY_KEYS.all, "rewards", filters] as const,
  challenges: (filters: ChallengesInputType) =>
    [...GAMIFICATION_QUERY_KEYS.all, "challenges", filters] as const,
};

// Hook to fetch all achievements with user progress
export const useAchievements = () => {
  return useQuery<AchievementWithProgress[], Error>({
    queryKey: GAMIFICATION_QUERY_KEYS.achievements(),
    queryFn: async () => {
      const data = await getAchievements();
      return data.achievements;
    },
  });
};

// Hook to fetch the current user's achievements and stats
export const useUserAchievements = () => {
  return useQuery<UserAchievementsOutputType, Error>({
    queryKey: GAMIFICATION_QUERY_KEYS.userAchievements(),
    queryFn: getUserAchievements,
  });
};

// Hook to fetch the rewards catalog
export const useRewards = (filters: RewardsInputType = {}) => {
  return useQuery<RewardsOutputType, Error>({
    queryKey: GAMIFICATION_QUERY_KEYS.rewards(filters),
    queryFn: () => getRewards(filters),
  });
};

// Hook to unlock a reward
export const useUnlockReward = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: UnlockRewardInputType) =>
      postUnlockReward(variables),
    onSuccess: (data) => {
      toast.success(data.message);
      // Invalidate rewards and user achievements to refetch updated data
      queryClient.invalidateQueries({
        queryKey: GAMIFICATION_QUERY_KEYS.rewards({}),
      });
      queryClient.invalidateQueries({
        queryKey: GAMIFICATION_QUERY_KEYS.userAchievements(),
      });
    },
    onError: (error: Error) => {
      toast.error(error.message || "Failed to unlock reward.");
    },
  });
};

// Hook to fetch active challenges
export const useChallenges = (filters: ChallengesInputType = {}) => {
  return useQuery<ChallengesOutputType, Error>({
    queryKey: GAMIFICATION_QUERY_KEYS.challenges(filters),
    queryFn: () => getChallenges(filters),
  });
};