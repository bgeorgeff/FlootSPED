import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./user-achievements_GET.schema";
import superjson from "superjson";

export async function handle(request: Request): Promise<Response> {
  try {
    const { user } = await getServerUserSession(request);

    // Fetch user's achievements with details
    const userAchievements = await db
      .selectFrom("userAchievements")
      .innerJoin(
        "achievements",
        "achievements.id",
        "userAchievements.achievementId"
      )
      .where("userAchievements.userId", "=", user.id)
      .selectAll("achievements")
      .select([
        "userAchievements.isCompleted",
        "userAchievements.unlockedAt",
        "userAchievements.progress",
      ])
      .orderBy("achievements.name")
      .execute();

    // Calculate completion statistics
    const totalAchievementsResult = await db
      .selectFrom("achievements")
      .select((eb) => eb.fn.countAll<string>().as("total"))
      .where("isActive", "=", true)
      .executeTakeFirstOrThrow();

    const totalAchievements = parseInt(totalAchievementsResult.total, 10);
    const unlockedCount = userAchievements.filter(
      (ua) => ua.isCompleted
    ).length;

    const completionPercentage =
      totalAchievements > 0 ? (unlockedCount / totalAchievements) * 100 : 0;

    return new Response(
      superjson.stringify({
        achievements: userAchievements,
        stats: {
          unlockedCount,
          totalAchievements,
          completionPercentage: parseFloat(completionPercentage.toFixed(2)),
        },
      } satisfies OutputType)
    );
  } catch (error) {
    console.error("Error fetching user achievements:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 500,
    });
  }
}