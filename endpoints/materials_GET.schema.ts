import { z } from "zod";
import superjson from 'superjson';
import { Selectable } from "kysely";
import type { ReadingMaterials } from "../helpers/schema";
import { ReadingLevelArrayValues, ContentTypeArrayValues } from "../helpers/schema";

export const schema = z.object({
  readingLevel: z.enum(ReadingLevelArrayValues).optional(),
  contentType: z.enum(ContentTypeArrayValues).optional(),
});

export type InputType = z.infer<typeof schema>;

export type OutputType = Selectable<ReadingMaterials>[];

export const getMaterials = async (params?: InputType, init?: RequestInit): Promise<OutputType> => {
  const validatedParams = schema.parse(params || {});
  const searchParams = new URLSearchParams();

  if (validatedParams.readingLevel) {
    searchParams.append('readingLevel', validatedParams.readingLevel);
  }
  if (validatedParams.contentType) {
    searchParams.append('contentType', validatedParams.contentType);
  }

  const queryString = searchParams.toString();
  const url = `/_api/materials${queryString ? `?${queryString}` : ''}`;

  const result = await fetch(url, {
    method: "GET",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  if (!result.ok) {
    const errorObject = superjson.parse(await result.text());
    throw new Error(typeof errorObject === 'object' && errorObject !== null && 'error' in errorObject ? (errorObject as any).error : "Failed to fetch materials");
  }
  return superjson.parse<OutputType>(await result.text());
};