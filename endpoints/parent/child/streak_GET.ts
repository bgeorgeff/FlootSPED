import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { schema, OutputType } from "./streak_GET.schema";
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

    // Get distinct reading days
    const readingDaysResult = await db
      .selectFrom("readingSessions")
      .select(sql<string>`DATE(session_end)`.as("readingDate"))
      .where("userId", "=", childId)
      .where("sessionEnd", "is not", null)
      .distinct()
      .orderBy("readingDate", "desc")
      .execute();

    const readingDays = readingDaysResult.map(r => new Date(r.readingDate));

    let currentStreak = 0;
    let longestStreak = 0;
    let currentLongest = 0;

    if (readingDays.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);

      const lastReadingDay = new Date(readingDays[0]);
      lastReadingDay.setHours(0, 0, 0, 0);

      // Check if the streak is current
      if (lastReadingDay.getTime() === today.getTime() || lastReadingDay.getTime() === yesterday.getTime()) {
        currentStreak = 1;
        currentLongest = 1;
        longestStreak = 1;

        for (let i = 0; i < readingDays.length - 1; i++) {
          const currentDay = new Date(readingDays[i]);
          const previousDay = new Date(readingDays[i+1]);
          
          const diffTime = currentDay.getTime() - previousDay.getTime();
          const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays === 1) {
            currentLongest++;
          } else {
            longestStreak = Math.max(longestStreak, currentLongest);
            currentLongest = 1; // Reset for the next potential streak
          }
        }
        longestStreak = Math.max(longestStreak, currentLongest);
        currentStreak = (lastReadingDay.getTime() === today.getTime() || lastReadingDay.getTime() === yesterday.getTime()) ? currentLongest : 0;

      } else {
        // Streak is broken
        currentStreak = 0;
        // Calculate longest streak anyway
        if (readingDays.length > 0) {
            currentLongest = 1;
            longestStreak = 1;
            for (let i = 0; i < readingDays.length - 1; i++) {
                const currentDay = new Date(readingDays[i]);
                const previousDay = new Date(readingDays[i+1]);
                const diffTime = currentDay.getTime() - previousDay.getTime();
                const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));
                if (diffDays === 1) {
                    currentLongest++;
                } else {
                    longestStreak = Math.max(longestStreak, currentLongest);
                    currentLongest = 1;
                }
            }
            longestStreak = Math.max(longestStreak, currentLongest);
        }
      }
    }


    const output: OutputType = {
      childId,
      currentStreak,
      longestStreak,
      // Achievements are a future feature
      achievements: [],
    };

    return new Response(superjson.stringify(output));
  } catch (error) {
    console.error("Error fetching child streak:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      superjson.stringify({ error: "Failed to fetch streak data", message: errorMessage }),
      { status: 500 }
    );
  }
}