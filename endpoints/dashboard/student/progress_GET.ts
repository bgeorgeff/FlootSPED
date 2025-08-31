import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { schema, OutputType } from "./progress_GET.schema";
import superjson from "superjson";
import { sql } from "kysely";

export async function handle(request: Request): Promise<Response> {
  try {
    const { user } = await getServerUserSession(request);

    if (user.role !== "teacher" && user.role !== "parent") {
      return new Response(
        superjson.stringify({
          error: "Forbidden: You must be a teacher or parent to access this resource.",
        }),
        { status: 403 }
      );
    }

    const url = new URL(request.url);
    const queryParams = {
      studentId: parseInt(url.searchParams.get("studentId")!, 10),
      startDate: url.searchParams.get("startDate"),
      endDate: url.searchParams.get("endDate"),
    };

    const { studentId, startDate, endDate } = schema.parse(queryParams);

    // Authorization check: ensure the user has a relationship with the student
    const relationship = await db
      .selectFrom("teacherStudentRelationships")
      .where("teacherId", "=", user.id)
      .where("studentId", "=", studentId)
      .where("isActive", "=", true)
      .select("id")
      .executeTakeFirst();

    if (!relationship) {
      return new Response(
        superjson.stringify({
          error: "Forbidden: You are not authorized to view this student's progress.",
        }),
        { status: 403 }
      );
    }

    // Fetch student details
    const student = await db
      .selectFrom("users")
      .where("id", "=", studentId)
      .select(["id", "displayName", "avatarUrl"])
      .executeTakeFirstOrThrow();

    // Fetch reading sessions
    let sessionsQuery = db
      .selectFrom("readingSessions as rs")
      .innerJoin("readingMaterials as rm", "rs.materialId", "rm.id")
      .where("rs.userId", "=", studentId)
      .select([
        "rs.id",
        "rs.sessionStart",
        "rs.sessionEnd",
        "rs.durationSeconds",
        "rs.wordsClicked",
        "rs.completed",
        "rm.title as materialTitle",
        "rm.readingLevel",
      ])
      .orderBy("rs.sessionStart", "desc");

    if (startDate) {
      sessionsQuery = sessionsQuery.where("rs.sessionStart", ">=", new Date(startDate));
    }
    if (endDate) {
      sessionsQuery = sessionsQuery.where("rs.sessionStart", "<=", new Date(endDate));
    }
    const readingSessions = await sessionsQuery.execute();

    // Fetch word click stats
    let wordsQuery = db
      .selectFrom("clickedWords")
      .where("userId", "=", studentId)
      .select(["word", "clickCount"])
      .orderBy("clickCount", "desc")
      .limit(20);

    if (startDate) {
      wordsQuery = wordsQuery.where("lastClickedAt", ">=", new Date(startDate));
    }
    if (endDate) {
      wordsQuery = wordsQuery.where("lastClickedAt", "<=", new Date(endDate));
    }
    const wordClickStats = await wordsQuery.execute();

    const output: OutputType = {
      student,
      readingSessions,
      wordClickStats,
    };

    return new Response(superjson.stringify(output), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching student progress:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
    });
  }
}