import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./students_GET.schema";
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
      sortBy: url.searchParams.get("sortBy") ?? "displayName",
      sortDirection: url.searchParams.get("sortDirection") ?? "asc",
      filter: url.searchParams.get("filter"),
      limit: url.searchParams.get("limit")
        ? parseInt(url.searchParams.get("limit")!, 10)
        : 20,
      offset: url.searchParams.get("offset")
        ? parseInt(url.searchParams.get("offset")!, 10)
        : 0,
    };

    const validatedParams = schema.parse(queryParams);

    const studentQuery = db
      .selectFrom("teacherStudentRelationships as tsr")
      .innerJoin("users as u", "tsr.studentId", "u.id")
      .where("tsr.teacherId", "=", user.id)
      .where("tsr.isActive", "=", true)
      .select([
        "u.id",
        "u.displayName",
        "u.avatarUrl",
        "u.createdAt",
        // Subquery to get the reading level from the most recently completed material
        (eb) =>
          eb
            .selectFrom("userProgress as up")
            .innerJoin(
              "readingMaterials as rm",
              "up.materialId",
              "rm.id"
            )
            .select("rm.readingLevel")
            .whereRef("up.userId", "=", "u.id")
            .where("up.completedAt", "is not", null)
            .orderBy("up.completedAt", "desc")
            .limit(1)
            .as("currentReadingLevel"),
      ]);

    if (validatedParams.filter) {
      studentQuery.where("u.displayName", "ilike", `%${validatedParams.filter}%`);
    }

    const orderedQuery = studentQuery.orderBy(
      sql.ref(validatedParams.sortBy),
      validatedParams.sortDirection
    );

    const students = await orderedQuery
      .limit(validatedParams.limit)
      .offset(validatedParams.offset)
      .execute();

    const totalStudentsResult = await studentQuery
      .clearSelect()
      .select((eb) => eb.fn.countAll().as("count"))
      .executeTakeFirstOrThrow();
    
    const totalStudents = Number(totalStudentsResult.count);

    const output: OutputType = {
      students: students.map(s => ({...s, currentReadingLevel: s.currentReadingLevel ?? null})),
      total: totalStudents,
    };

    return new Response(superjson.stringify(output), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching students:", error);
    const errorMessage =
      error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
    });
  }
}