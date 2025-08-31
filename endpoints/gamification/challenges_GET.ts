import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./challenges_GET.schema";
import superjson from "superjson";
import { URL } from "url";

export async function handle(request: Request): Promise<Response> {
  try {
    const { user } = await getServerUserSession(request);
    const url = new URL(request.url, `http://${request.headers.get("host")}`);

    // Parse and validate query params
    const params = schema.parse({
      challengeType: url.searchParams.get("challengeType") || undefined,
      startDate: url.searchParams.get("startDate") || undefined,
      endDate: url.searchParams.get("endDate") || undefined,
    });

    const now = new Date();

    // Base query for active challenges
    let query = db
      .selectFrom("challenges")
      .selectAll()
      .where("isActive", "=", true)
      .where("startDate", "<=", now)
      .where("endDate", ">=", now);

    // Apply filters
    if (params.challengeType) {
      query = query.where("challengeType", "=", params.challengeType);
    }
    if (params.startDate) {
      query = query.where("startDate", ">=", params.startDate);
    }
    if (params.endDate) {
      query = query.where("endDate", "<=", params.endDate);
    }

    const activeChallenges = await query.orderBy("endDate").execute();

    if (activeChallenges.length === 0) {
      return new Response(
        superjson.stringify({ challenges: [] } satisfies OutputType)
      );
    }

    // Fetch user's progress for these specific challenges
    const challengeIds = activeChallenges.map((c) => c.id);
    const userChallenges = await db
      .selectFrom("userChallenges")
      .selectAll()
      .where("userId", "=", user.id)
      .where("challengeId", "in", challengeIds)
      .execute();

    const userChallengesMap = new Map(
      userChallenges.map((uc) => [uc.challengeId, uc])
    );

    // Combine data
    const challengesWithProgress = activeChallenges.map((challenge) => {
      const userProgress = userChallengesMap.get(challenge.id);
      return {
        ...challenge,
        progress: userProgress?.progress ?? null,
        completedAt: userProgress?.completedAt ?? null,
      };
    });

    return new Response(
      superjson.stringify({
        challenges: challengesWithProgress,
      } satisfies OutputType)
    );
  } catch (error) {
    console.error("Error fetching challenges:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unexpected error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 500,
    });
  }
}