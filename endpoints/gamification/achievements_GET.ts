import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./achievements_GET.schema";
import superjson from "superjson";

export async function handle(request: Request): Promise<Response> {
  try {
    const { user } = await getServerUserSession(request);

    // Fetch all active achievements
    const allAchievements = await db
      .selectFrom("achievements")
      .selectAll()
      .where("isActive", "=", true)
      .orderBy("name")
      .execute();

    // Fetch user's progress for all achievements
    const userAchievements = await db
      .selectFrom("userAchievements")
      .selectAll()
      .where("userId", "=", user.id)
      .execute();

    // Create a map for easy lookup of user progress
    const userAchievementsMap = new Map(
      userAchievements.map((ua) => [ua.achievementId, ua])
    );

    // Combine the two lists
    const achievementsWithProgress = allAchievements.map((achievement) => {
      const userProgress = userAchievementsMap.get(achievement.id);
      return {
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        category: achievement.category,
        icon: achievement.icon,
        pointsReward: achievement.pointsReward,
        unlockCriteria: achievement.unlockCriteria,
        createdAt: achievement.createdAt,
        isActive: achievement.isActive,
        isCompleted: userProgress?.isCompleted ?? false,
        unlockedAt: userProgress?.unlockedAt ?? null,
        progress: userProgress?.progress ?? null,
      };
    });

    return new Response(
      superjson.stringify({
        achievements: achievementsWithProgress,
      } satisfies OutputType)
    );
  } catch (error) {
    console.error("Error fetching achievements:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 500,
    });
  }
}