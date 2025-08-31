import { z } from "zod";
import superjson from "superjson";
import { ReadingLevel, ReadingLevelArrayValues } from "../../helpers/schema";
import { Selectable } from "kysely";
import { Users } from "../../helpers/schema";

export const schema = z.object({
  sortBy: z.enum(["displayName", "createdAt"]).default("displayName"),
  sortDirection: z.enum(["asc", "desc"]).default("asc"),
  filter: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type InputType = z.infer<typeof schema>;

export type Student = Pick<Selectable<Users>, "id" | "displayName" | "avatarUrl"> & {
  currentReadingLevel: ReadingLevel | null;
};

export type OutputType = {
  students: Student[];
  total: number;
};

export const getStudents = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const query = new URLSearchParams({
    sortBy: params.sortBy,
    sortDirection: params.sortDirection,
    limit: String(params.limit),
    offset: String(params.offset),
    ...(params.filter && { filter: params.filter }),
  });

  const result = await fetch(`/_api/dashboard/students?${query.toString()}`, {
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