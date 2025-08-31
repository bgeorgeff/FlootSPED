import { z } from "zod";
import superjson from "superjson";
import { ReadingLevel, ReadingLevelArrayValues } from "../../helpers/schema";

export const schema = z.object({});

export type InputType = z.infer<typeof schema>;

export type ChildInfo = {
  id: number;
  displayName: string;
  avatarUrl: string | null;
  currentReadingLevel: ReadingLevel | null;
  lastActivity: Date | null;
};

export type OutputType =
  | {
      children: ChildInfo[];
    }
  | {
      error: string;
      message?: string;
    };

export const getParentChildren = async (
  body?: z.infer<typeof schema>,
  init?: RequestInit
): Promise<OutputType> => {
  const result = await fetch(`/_api/parent/children`, {
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