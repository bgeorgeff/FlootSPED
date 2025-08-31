import { z } from "zod";
import superjson from "superjson";

export const schema = z.object({
  limit: z.number().int().min(1).max(100).default(20),
  offset: z.number().int().min(0).default(0),
});

export type InputType = z.infer<typeof schema>;

export type ActivityType = "session_started" | "material_completed";

export type Activity = {
  id: number;
  timestamp: Date;
  studentName: string;
  studentId: number;
  type: ActivityType;
  details: string;
};

export type OutputType = {
  activities: Activity[];
  total: number;
};

export const getActivity = async (
  params: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const query = new URLSearchParams({
    limit: String(params.limit),
    offset: String(params.offset),
  });

  const result = await fetch(`/_api/dashboard/activity?${query.toString()}`, {
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