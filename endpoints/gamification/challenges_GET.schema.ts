import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Challenges, UserChallenges } from "../../helpers/schema";

export const schema = z.object({
  challengeType: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
});

export type InputType = z.infer<typeof schema>;

export type ChallengeWithProgress = Selectable<Challenges> &
  Pick<Selectable<UserChallenges>, "progress" | "completedAt">;

export type OutputType = {
  challenges: ChallengeWithProgress[];
};

export const getChallenges = async (
  params?: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const searchParams = new URLSearchParams();
  if (params?.challengeType) {
    searchParams.set("challengeType", params.challengeType);
  }
  if (params?.startDate) {
    searchParams.set("startDate", params.startDate.toISOString());
  }
  if (params?.endDate) {
    searchParams.set("endDate", params.endDate.toISOString());
  }
  const queryString = searchParams.toString();
  const url = `/_api/gamification/challenges${
    queryString ? `?${queryString}` : ""
  }`;

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
    throw new Error(typeof errorObject === 'object' && errorObject !== null && 'error' in errorObject ? (errorObject as any).error : "Request failed");
  }
  return superjson.parse<OutputType>(await result.text());
};