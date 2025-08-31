import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./rewards_GET.schema";
import superjson from "superjson";
import { URL } from "url";

export async function handle(request: Request): Promise<Response> {
  try {
    const { user } = await getServerUserSession(request);
    const url = new URL(request.url, `http://${request.headers.get("host")}`);
    const rewardType = url.searchParams.get("rewardType");

    // Fetch user's points
    const userRewards = await db
      .selectFrom("userRewards")
      .select("availablePoints")
      .where("userId", "=", user.id)
      .executeTakeFirst();

    // Fetch all active rewards, with optional filtering
    let query = db
      .selectFrom("rewards")
      .selectAll()
      .where("isActive", "=", true);

    if (rewardType) {
      query = query.where("rewardType", "=", rewardType);
    }

    const allRewards = await query.orderBy("costPoints").execute();

    // Fetch user's unlocked rewards
    const unlockedRewardIds = await db
      .selectFrom("userRewardUnlocks")
      .select("rewardId")
      .where("userId", "=", user.id)
      .execute();

    const unlockedIdsSet = new Set(
      unlockedRewardIds.map((ur) => ur.rewardId)
    );

    // Combine data
    const rewardsWithStatus = allRewards.map((reward) => ({
      ...reward,
      isUnlocked: unlockedIdsSet.has(reward.id),
    }));

    return new Response(
      superjson.stringify({
        rewards: rewardsWithStatus,
        userPoints: userRewards?.availablePoints ?? 0,
      } satisfies OutputType)
    );
  } catch (error) {
    console.error("Error fetching rewards:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 500,
    });
  }
}