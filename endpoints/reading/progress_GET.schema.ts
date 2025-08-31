import { z } from "zod";
import superjson from "superjson";
import { ReadingLevel } from "../../helpers/schema";

export const schema = z.object({
  materialId: z.coerce.number().int().positive().optional(),
  sortBy: z.enum(["updatedAt", "startedAt", "completedAt", "materialTitle", "readingLevel"]).optional(),
  sortDirection: z.enum(["asc", "desc"]).optional(),
});

export type InputType = z.infer<typeof schema>;

export type UserProgress = {
  id: number;
  materialId: number;
  materialTitle: string;
  readingLevel: ReadingLevel;
  progressPercentage: number | null;
  readingTimeSeconds: number | null;
  wordsClickedCount: number | null;
  startedAt: Date | null;
  completedAt: Date | null;
  updatedAt: Date | null;
};

export type OutputType = {
  progress: UserProgress[];
} | {
  error: string;
};

export const getReadingProgress = async (
  params: InputType = {},
  init?: RequestInit
): Promise<OutputType> => {
  const validatedParams = schema.parse(params);
  const searchParams = new URLSearchParams();
  
  Object.entries(validatedParams).forEach(([key, value]) => {
    if (value !== undefined) {
      searchParams.append(key, String(value));
    }
  });

  const result = await fetch(`/_api/reading/progress?${searchParams.toString()}`, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const text = await result.text();
  if (!result.ok) {
    try {
      const errorObject = superjson.parse(text);
      throw new Error(typeof errorObject === 'object' && errorObject !== null && 'error' in errorObject ? (errorObject as any).error : "Failed to fetch progress");
    } catch (e) {
      throw new Error(text || "An unknown error occurred");
    }
  }
  
  return superjson.parse<OutputType>(text);
};