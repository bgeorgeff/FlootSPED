import { useQuery } from "@tanstack/react-query";
import {
  getStudents,
  InputType as StudentsInput,
} from "../endpoints/dashboard/students_GET.schema";
import {
  getStudentProgress,
  InputType as StudentProgressInput,
} from "../endpoints/dashboard/student/progress_GET.schema";
import {
  getAnalytics,
  InputType as AnalyticsInput,
} from "../endpoints/dashboard/analytics_GET.schema";
import {
  getActivity,
  InputType as ActivityInput,
} from "../endpoints/dashboard/activity_GET.schema";

export const useStudentsList = (params: StudentsInput) => {
  return useQuery({
    queryKey: ["dashboard", "students", params],
    queryFn: () => getStudents(params),
  });
};

export const useStudentProgress = (params: StudentProgressInput) => {
  return useQuery({
    queryKey: ["dashboard", "studentProgress", params.studentId, params],
    queryFn: () => getStudentProgress(params),
    enabled: !!params.studentId,
  });
};

export const useDashboardAnalytics = (params: AnalyticsInput) => {
  return useQuery({
    queryKey: ["dashboard", "analytics", params],
    queryFn: () => getAnalytics(params),
  });
};

export const useRecentActivity = (params: ActivityInput) => {
  return useQuery({
    queryKey: ["dashboard", "activity", params],
    queryFn: () => getActivity(params),
  });
};