import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./children_GET.schema";
import superjson from "superjson";
import { sql } from "kysely";

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

    const children = await db
      .selectFrom("teacherStudentRelationships as tsr")
      .innerJoin("users as student", "tsr.studentId", "student.id")
      .leftJoin(
        (eb) =>
          eb
            .selectFrom("readingSessions as rs")
            .select([
              "rs.userId",
              sql<Date>`MAX(rs.session_end)`.as("lastActivity"),
            ])
            .where("rs.sessionEnd", "is not", null)
            .groupBy("rs.userId")
            .as("lastReading"),
        (join) => join.onRef("lastReading.userId", "=", "student.id")
      )
      .leftJoin(
        (eb) =>
          eb
            .selectFrom("userProgress as up")
            .innerJoin(
              "readingMaterials as rm",
              "up.materialId",
              "rm.id"
            )
            .select([
              "up.userId",
              "rm.readingLevel",
              sql<Date>`MAX(up.updated_at)`.as("latestProgressUpdate"),
            ])
            .groupBy(["up.userId", "rm.readingLevel"])
            .as("latestProgress"),
        (join) => join.onRef("latestProgress.userId", "=", "student.id")
      )
      .where("tsr.teacherId", "=", user.id)
      .where("tsr.relationshipType", "=", "parent")
      .where("tsr.isActive", "=", true)
      .select([
        "student.id",
        "student.displayName",
        "student.avatarUrl",
        "lastReading.lastActivity",
        "latestProgress.readingLevel as currentReadingLevel",
        "latestProgress.latestProgressUpdate",
      ])
      // This distinctOn is a bit tricky. We want the latest reading level based on the most recent progress update.
      // A window function or a more complex subquery would be more robust, but for simplicity,
      // we'll order by the progress update and take the first one for each student.
      // Note: Kysely doesn't have great support for DISTINCT ON, so we rely on ordering and grouping.
      // A better approach would be a lateral join or window function if performance becomes an issue.
      .groupBy([
        "student.id",
        "student.displayName",
        "student.avatarUrl",
        "lastReading.lastActivity",
        "latestProgress.readingLevel",
        "latestProgress.latestProgressUpdate",
      ])
      .orderBy("student.displayName")
      .orderBy("latestProgress.latestProgressUpdate", "desc")
      .execute();

    // Since the query might return multiple rows per child if they have progress in multiple reading levels,
    // we need to deduplicate and pick the one with the most recent activity.
    const childMap = new Map<number, (typeof children)[0]>();
    for (const child of children) {
      if (!childMap.has(child.id) || (child.latestProgressUpdate && childMap.get(child.id)!.latestProgressUpdate! < child.latestProgressUpdate)) {
        childMap.set(child.id, child);
      }
    }
    
    const uniqueChildren = Array.from(childMap.values()).map(child => ({
      id: child.id,
      displayName: child.displayName,
      avatarUrl: child.avatarUrl,
      lastActivity: child.lastActivity,
      currentReadingLevel: child.currentReadingLevel,
    }));

    return new Response(
      superjson.stringify({ children: uniqueChildren } satisfies OutputType)
    );
  } catch (error) {
    console.error("Error fetching parent's children:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(
      superjson.stringify({ error: "Failed to fetch children", message: errorMessage }),
      { status: 500 }
    );
  }
}