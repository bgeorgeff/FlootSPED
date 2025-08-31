import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  childId: z.number().int().positive(),
});

export type InputType = z.infer<typeof schema>;

export type Achievement = {
  name: string;
  description: string;
  unlockedAt: Date;
  iconUrl: string;
};

export type OutputType =
  | {
      childId: number;
      currentStreak: number; // in days
      longestStreak: number; // in days
      achievements: Achievement[];
    }
  | {
      error: string;
      message?: string;
    };

export const getParentChildStreak = async (
  body: z.infer<typeof schema>,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const params = new URLSearchParams({
    childId: validatedInput.childId.toString(),
  });

  const result = await fetch(
    `/_api/parent/child/streak?${params.toString()}`,
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