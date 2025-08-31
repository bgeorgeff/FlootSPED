import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./activity_GET.schema";
import superjson from "superjson";

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
    const { limit, offset } = schema.parse({
      limit: url.searchParams.get("limit")
        ? parseInt(url.searchParams.get("limit")!, 10)
        : 20,
      offset: url.searchParams.get("offset")
        ? parseInt(url.searchParams.get("offset")!, 10)
        : 0,
    });

    const studentIds = await db
      .selectFrom("teacherStudentRelationships")
      .where("teacherId", "=", user.id)
      .where("isActive", "=", true)
      .select("studentId")
      .execute();

    if (studentIds.length === 0) {
      return new Response(superjson.stringify({ activities: [], total: 0 }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    const studentIdList = studentIds.map((s) => s.studentId);

    const baseQuery = db
      .selectFrom("readingSessions as rs")
      .innerJoin("users as u", "rs.userId", "u.id")
      .innerJoin("readingMaterials as rm", "rs.materialId", "rm.id")
      .where("rs.userId", "in", studentIdList);

    const activities = await baseQuery
      .select([
        "rs.id",
        "rs.sessionStart as timestamp",
        "u.displayName as studentName",
        "u.id as studentId",
        "rm.title as materialTitle",
        "rs.completed",
      ])
      .orderBy("rs.sessionStart", "desc")
      .limit(limit)
      .offset(offset)
      .execute();

    const totalResult = await baseQuery
      .clearSelect()
      .select((eb) => eb.fn.countAll().as("count"))
      .executeTakeFirstOrThrow();

    const total = Number(totalResult.count);

    const output: OutputType = {
      activities: activities.map(a => ({
        id: a.id,
        timestamp: a.timestamp || new Date(),
        studentName: a.studentName,
        studentId: a.studentId,
        type: a.completed ? 'material_completed' : 'session_started',
        details: a.completed 
          ? `Completed "${a.materialTitle}"`
          : `Started reading "${a.materialTitle}"`
      })),
      total,
    };

    return new Response(superjson.stringify(output), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching recent activity:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
    });
  }
}