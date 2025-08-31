import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./analytics_GET.schema";
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
    const { period } = schema.parse({
      period: url.searchParams.get("period") ?? "weekly",
    });

    const getStartDate = (p: "weekly" | "monthly") => {
      const now = new Date();
      if (p === "monthly") {
        now.setDate(now.getDate() - 30);
      } else {
        now.setDate(now.getDate() - 7);
      }
      return now;
    };
    const startDate = getStartDate(period);

    const studentIds = await db
      .selectFrom("teacherStudentRelationships")
      .where("teacherId", "=", user.id)
      .where("isActive", "=", true)
      .select("studentId")
      .execute();

    if (studentIds.length === 0) {
      const emptyOutput: OutputType = {
        totalStudents: 0,
        activeStudents: 0,
        avgReadingTime: 0,
        materialsCompleted: 0,
        progressTrends: [],
      };
      return new Response(superjson.stringify(emptyOutput), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const studentIdList = studentIds.map((s) => s.studentId);

    const totalStudents = studentIdList.length;

    const activeStudentsResult = await db
      .selectFrom("readingSessions")
            .select((eb) => eb.fn.count("userId").distinct().as("count"))
      .where("userId", "in", studentIdList)
      .where("sessionStart", ">=", startDate)
      .executeTakeFirstOrThrow();
    const activeStudents = Number(activeStudentsResult.count);

    const summaryStats = await db
      .selectFrom("readingSessions")
      .select([
        (eb) => eb.fn.sum("durationSeconds").as("totalDuration"),
        (eb) => eb.fn.count("id").filterWhere("completed", "=", true).as("completedCount"),
      ])
      .where("userId", "in", studentIdList)
      .where("sessionStart", ">=", startDate)
      .executeTakeFirstOrThrow();

    const totalDuration = Number(summaryStats.totalDuration ?? 0);
    const materialsCompleted = Number(summaryStats.completedCount ?? 0);
    const avgReadingTime = activeStudents > 0 ? totalDuration / activeStudents : 0;

    const progressTrends = await db
      .selectFrom("readingSessions")
      .select([
        sql<string>`DATE_TRUNC('day', "session_start")`.as("date"),
        (eb) => eb.fn.count("id").as("sessions"),
      ])
      .where("userId", "in", studentIdList)
      .where("sessionStart", ">=", startDate)
      .groupBy("date")
      .orderBy("date", "asc")
      .execute();

    const output: OutputType = {
      totalStudents,
      activeStudents,
      avgReadingTime,
      materialsCompleted,
      progressTrends: progressTrends.map(p => ({ date: p.date, sessions: Number(p.sessions) })),
    };

    return new Response(superjson.stringify(output), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching dashboard analytics:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
    });
  }
}