import { z } from "zod";
import superjson from 'superjson';
import { ReadingLevelArrayValues } from "../../helpers/schema";

export const schema = z.object({
  word: z.string().min(1, "Word cannot be empty"),
  materialId: z.number().int().positive("Material ID must be a positive integer"),
  materialTitle: z.string().min(1, "Material title cannot be empty"),
  readingLevel: z.enum(ReadingLevelArrayValues),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = {
  success: boolean;
};

export const postWordsClick = async (body: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedInput = schema.parse(body);
  const result = await fetch(`/_api/words/click`, {
    method: "POST",
    body: superjson.stringify(validatedInput),
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!result.ok) {
    const errorObject = superjson.parse(await result.text());
    throw new Error(typeof errorObject === 'object' && errorObject !== null && 'error' in errorObject ? (errorObject as any).error : "An unknown error occurred");
  }
  return superjson.parse<OutputType>(await result.text());
};