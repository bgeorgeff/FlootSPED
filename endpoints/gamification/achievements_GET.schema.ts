import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Achievements, UserAchievements } from "../../helpers/schema";

export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

export type AchievementWithProgress = Selectable<Achievements> &
  Pick<
    Selectable<UserAchievements>,
    "isCompleted" | "unlockedAt" | "progress"
  >;

export type OutputType = {
  achievements: AchievementWithProgress[];
};

export const getAchievements = async (
  body: InputType = {},
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`/_api/gamification/achievements`, {
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