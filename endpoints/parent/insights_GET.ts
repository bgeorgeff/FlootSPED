import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./insights_GET.schema";
import superjson from "superjson";
import { sql } from "kysely";

async function verifyParentChildLink(parentId: number, childId: number) {
  const relationship = await db
    .selectFrom("teacherStudentRelationships")
    .selectAll()
    .where("teacherId", "=", parentId)
    .where("studentId", "=", childId)
    .where("relationshipType", "=", "parent")
    .where("isActive", "=", true)
    .limit(1)
    .executeTakeFirst();

  if (!relationship) {
    throw new Error("Parent is not associated with this child.");
  }
}

export async function handle(request: Request): Promise<Response> {
  try {
    const { user } = await getServerUserSession(request);
    if (user.role !== "parent") {
      return new Response(
        superjson.stringify({
          error: "Forbidden",
          message: "You must be a parent to access this resource.",
        }),
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const rawChildId = url.searchParams.get("childId");
    const validatedInput = schema.parse({ childId: rawChildId ? Number(rawChildId) : undefined });
    const { childId } = validatedInput;

    await verifyParentChildLink(user.id, childId);

    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const weeklyStats = await db
      .selectFrom("readingSessions")
      .select([
        db.fn.sum<number>("durationSeconds").as("totalSeconds"),
        db.fn.count<number>("id").as("sessionCount"),
      ])
      .where("userId", "=", childId)
      .where("sessionEnd", ">=", oneWeekAgo)
      .executeTakeFirst();

    const monthlyStats = await db
      .selectFrom("readingSessions")
      .select([
        db.fn.sum<number>("durationSeconds").as("totalSeconds"),
        db.fn.count<number>("id").as("sessionCount"),
      ])
      .where("userId", "=", childId)
      .where("sessionEnd", ">=", oneMonthAgo)
      .executeTakeFirst();

    const totalCompleted = await db
      .selectFrom("userProgress")
      .select(db.fn.count<number>("id").as("count"))
      .where("userId", "=", childId)
      .where("completedAt", "is not", null)
      .executeTakeFirst();

    const output: OutputType = {
      childId,
      weeklySummary: {
        minutesRead: Math.round((weeklyStats?.totalSeconds ?? 0) / 60),
        sessions: weeklyStats?.sessionCount ?? 0,
      },
      monthlySummary: {
        minutesRead: Math.round((monthlyStats?.totalSeconds ?? 0) / 60),
        sessions: monthlyStats?.sessionCount ?? 0,
      },
      totalMaterialsCompleted: totalCompleted?.count ?? 0,
      // Reading recommendations and encouragement are content/AI features to be added later.
      recommendations: [],
      encouragement: "Keep up the great work! Consistent reading builds strong skills.",
    };

    return new Response(superjson.stringify(output));
  } catch (error) {
    console.error("Error fetching child insights:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      superjson.stringify({ error: "Failed to fetch insights", message: errorMessage }),
      { status: 500 }
    );
  }
}