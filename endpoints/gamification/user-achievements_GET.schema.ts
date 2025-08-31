import { z } from "zod";
import superjson from "superjson";
import { AchievementWithProgress } from "./achievements_GET.schema";

export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  achievements: AchievementWithProgress[];
  stats: {
    unlockedCount: number;
    totalAchievements: number;
    completionPercentage: number;
  };
};

export const getUserAchievements = async (
  body: InputType = {},
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`/_api/gamification/user-achievements`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!result.ok) {
    const errorObject = superjson.parse(await result.text());
    throw new Error(typeof errorObject === 'object' && errorObject !== null && 'error' in errorObject ? (errorObject as any).error : "Request failed");
  }
  return superjson.parse<OutputType>(await result.text());
};