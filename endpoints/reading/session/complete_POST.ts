import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { schema, OutputType } from "./complete_POST.schema";
import superjson from "superjson";

export async function handle(request: Request): Promise<Response> {
  try {
    const { user } = await getServerUserSession(request);
    const json = superjson.parse(await request.text());
    const { readingSessionId } = schema.parse(json);

    await db.transaction().execute(async (trx) => {
      const session = await trx
        .selectFrom("readingSessions")
        .select(["id", "materialId", "sessionStart"])
        .where("id", "=", readingSessionId)
        .where("userId", "=", user.id)
        .where("completed", "=", false)
        .executeTakeFirst();

      if (!session) {
        throw new Error("Active reading session not found or access denied.");
      }

      const now = new Date();
      const durationSeconds = session.sessionStart ? Math.floor((now.getTime() - session.sessionStart.getTime()) / 1000) : 0;

      // Mark session as complete
      await trx
        .updateTable("readingSessions")
        .set({
          completed: true,
          sessionEnd: now,
          durationSeconds: durationSeconds,
        })
        .where("id", "=", readingSessionId)
        .execute();

      // Update final user progress
      await trx
        .updateTable("userProgress")
        .set({
          completedAt: now,
          progressPercentage: "100",
          updatedAt: now,
        })
        .where("userId", "=", user.id)
        .where("materialId", "=", session.materialId)
        .execute();
    });

    return new Response(
      superjson.stringify({ success: true } satisfies OutputType)
    );
  } catch (error) {
    console.error("Error completing reading session:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
    });
  }
}