import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  period: z.enum(["weekly", "monthly"]).default("weekly"),
});

export type InputType = z.infer<typeof schema>;

export type ProgressTrend = {
  date: string;
  sessions: number;
};

export type OutputType = {
  totalStudents: number;
  activeStudents: number;
  avgReadingTime: number; // in seconds
  materialsCompleted: number;
  progressTrends: ProgressTrend[];
};

export const getAnalytics = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const query = new URLSearchParams({
    period: params.period,
  });

  const result = await fetch(
    `/_api/dashboard/analytics?${query.toString()}`,
    {
      method: "GET",
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {}),
      },
    }
  );

  if (!result.ok) {
    const errorObject = superjson.parse(await result.text());
    throw new Error(typeof errorObject === 'object' && errorObject !== null && 'error' in errorObject ? (errorObject as any).error : "Request failed");
  }
  return superjson.parse<OutputType>(await result.text());
};