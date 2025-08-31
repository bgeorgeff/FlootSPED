import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  readingSessionId: z.number().int().positive(),
  lastPosition: z.number().int().optional(),
  progressPercentage: z.number().min(0).max(100).optional(),
  wordsClickedCount: z.number().int().min(0).optional().describe("The number of words clicked since the last update"),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: true;
} | {
  error: string;
};

export const postReadingProgressUpdate = async (
  body: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/reading/progress/update`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
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
      throw new Error(typeof errorObject === 'object' && errorObject !== null && 'error' in errorObject ? (errorObject as any).error : "Failed to update progress");
    } catch (e) {
      throw new Error(text || "An unknown error occurred");
    }
  }
  
  return superjson.parse<OutputType>(text);
};