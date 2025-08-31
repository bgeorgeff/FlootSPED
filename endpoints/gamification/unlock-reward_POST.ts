import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./unlock-reward_POST.schema";
import superjson from "superjson";

export async function handle(request: Request): Promise<Response> {
  try {
    const { user } = await getServerUserSession(request);
    const json = superjson.parse(await request.text());
    const { rewardId } = schema.parse(json);

    const result = await db.transaction().execute(async (trx) => {
      // 1. Get reward details
      const reward = await trx
        .selectFrom("rewards")
        .select(["id", "costPoints", "isActive"])
        .where("id", "=", rewardId)
        .executeTakeFirst();

      if (!reward || !reward.isActive) {
        throw new Error("Reward not found or is not active.");
      }

      // 2. Check if user already unlocked it
      const existingUnlock = await trx
        .selectFrom("userRewardUnlocks")
        .select("id")
        .where("userId", "=", user.id)
        .where("rewardId", "=", rewardId)
        .executeTakeFirst();

      if (existingUnlock) {
        throw new Error("You have already unlocked this reward.");
      }

      // 3. Get user's points
      const userPoints = await trx
        .selectFrom("userRewards")
        .select("availablePoints")
        .where("userId", "=", user.id)
        .forUpdate() // Lock the row for this transaction
        .executeTakeFirst();

      const currentPoints = userPoints?.availablePoints ?? 0;

      // 4. Validate points
      if (currentPoints < reward.costPoints) {
        throw new Error("Insufficient points to unlock this reward.");
      }

      // 5. Deduct points
      const newPoints = currentPoints - reward.costPoints;
      const updatedUserRewards = await trx
        .updateTable("userRewards")
        .set({
          availablePoints: newPoints,
          updatedAt: new Date(),
        })
        .where("userId", "=", user.id)
        .returning("availablePoints")
        .executeTakeFirstOrThrow();

      // 6. Record the unlock
      await trx
        .insertInto("userRewardUnlocks")
        .values({
          userId: user.id,
          rewardId: rewardId,
          pointsSpent: reward.costPoints,
          unlockedAt: new Date(),
        })
        .execute();

      return {
        updatedBalance: updatedUserRewards.availablePoints,
      };
    });

    return new Response(
      superjson.stringify({
        success: true,
        message: "Reward unlocked successfully!",
        updatedBalance: result.updatedBalance,
      } satisfies OutputType)
    );
  } catch (error) {
    console.error("Error unlocking reward:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400, // Use 400 for client-side errors like insufficient points
    });
  }
}