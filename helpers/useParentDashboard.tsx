import { useQuery } from "@tanstack/react-query";
import { getParentChildren } from "../endpoints/parent/children_GET.schema";
import { getParentChildInsights } from "../endpoints/parent/insights_GET.schema";
import { getParentChildStreak } from "../endpoints/parent/child/streak_GET.schema";

export const PARENT_DASHBOARD_QUERY_KEY = "parentDashboard" as const;

export const useParentChildren = () => {
  return useQuery({
    queryKey: [PARENT_DASHBOARD_QUERY_KEY, "children"],
    queryFn: () => getParentChildren(),
  });
};

export const useParentChildInsights = (childId: number | null) => {
  return useQuery({
    queryKey: [PARENT_DASHBOARD_QUERY_KEY, "insights", childId],
    queryFn: () => getParentChildInsights({ childId: childId! }),
    enabled: !!childId, // Only run query if childId is not null
  });
};

export const useParentChildStreak = (childId: number | null) => {
  return useQuery({
    queryKey: [PARENT_DASHBOARD_QUERY_KEY, "streak", childId],
    queryFn: () => getParentChildStreak({ childId: childId! }),
    enabled: !!childId, // Only run query if childId is not null
  });
};