import { z } from "zod";
import superjson from "superjson";
import { Selectable } from "kysely";
import { Rewards } from "../../helpers/schema";

export const schema = z.object({
  rewardType: z.string().optional(),
});

export type InputType = z.infer<typeof schema>;

export type RewardWithStatus = Selectable<Rewards> & {
  isUnlocked: boolean;
};

export type OutputType = {
  rewards: RewardWithStatus[];
  userPoints: number;
};

export const getRewards = async (
  params?: InputType,
  init?: RequestInit
): Promise<OutputType> => {
  const searchParams = new URLSearchParams();
  if (params?.rewardType) {
    searchParams.set("rewardType", params.rewardType);
  }
  const queryString = searchParams.toString();
  const url = `/_api/gamification/rewards${
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