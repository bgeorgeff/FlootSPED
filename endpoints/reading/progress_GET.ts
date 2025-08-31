import { db } from "../../helpers/db";
import { getServerUserSession } from "../../helpers/getServerUserSession";
import { schema, OutputType } from "./progress_GET.schema";
import superjson from "superjson";
import { sql } from "kysely";

export async function handle(request: Request): Promise<Response> {
  try {
    const { user } = await getServerUserSession(request);
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    const { materialId, sortBy, sortDirection } = schema.parse(queryParams);

    let query = db
      .selectFrom("userProgress")
      .innerJoin("readingMaterials", "userProgress.materialId", "readingMaterials.id")
      .where("userProgress.userId", "=", user.id)
      .select([
        "userProgress.id",
        "userProgress.materialId",
        "readingMaterials.title as materialTitle",
        "readingMaterials.readingLevel",
        "userProgress.progressPercentage",
        "userProgress.readingTimeSeconds",
        "userProgress.wordsClickedCount",
        "userProgress.startedAt",
        "userProgress.completedAt",
        "userProgress.updatedAt",
      ]);

    if (materialId) {
      query = query.where("userProgress.materialId", "=", Number(materialId));
    }

    if (sortBy) {
      // Kysely's orderBy doesn't directly support dynamic column names from variables for type safety.
      // We validate the column name against a whitelist to prevent SQL injection.
      const validSortColumns = ["updatedAt", "startedAt", "completedAt", "materialTitle", "readingLevel"];
      if (validSortColumns.includes(sortBy)) {
        const columnReference = sortBy === 'materialTitle' || sortBy === 'readingLevel' 
            ? sql.ref(`readingMaterials.${sortBy === 'materialTitle' ? 'title' : 'reading_level'}`) 
            : sql.ref(`userProgress.${sortBy === 'updatedAt' ? 'updated_at' : sortBy === 'startedAt' ? 'started_at' : 'completed_at'}`);
        
        query = query.orderBy(columnReference, sortDirection ?? 'desc');
      }
    } else {
      query = query.orderBy("userProgress.updatedAt", "desc");
    }

    const progressRecords = await query.execute();

    // Convert numeric string from db to number
    const result = progressRecords.map(p => ({
        ...p,
        progressPercentage: p.progressPercentage ? parseFloat(p.progressPercentage) : null,
    }));

    return new Response(
      superjson.stringify({ progress: result } satisfies OutputType)
    );
  } catch (error) {
    console.error("Error fetching user progress:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
    });
  }
}