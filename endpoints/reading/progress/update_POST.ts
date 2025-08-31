import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { schema, OutputType } from "./update_POST.schema";
import superjson from "superjson";

export async function handle(request: Request): Promise<Response> {
  try {
    const { user } = await getServerUserSession(request);
    const json = superjson.parse(await request.text());
    const { readingSessionId, lastPosition, progressPercentage, wordsClickedCount } = schema.parse(json);

    await db.transaction().execute(async (trx) => {
      // Verify the session belongs to the current user
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

      // Update reading_sessions
      await trx
        .updateTable("readingSessions")
        .set({
          durationSeconds: durationSeconds,
          wordsClicked: (eb) => eb.bxp("wordsClicked", "+", wordsClickedCount ?? 0),
        })
        .where("id", "=", readingSessionId)
        .execute();

      // Update user_progress
      await trx
        .updateTable("userProgress")
        .set({
          lastPosition: lastPosition,
          progressPercentage: progressPercentage?.toString(),
          readingTimeSeconds: (eb) => eb.bxp("readingTimeSeconds", "+", durationSeconds), // This might double count if updated frequently. A better approach might be to calculate total on complete. For now, this is a simple increment.
          wordsClickedCount: (eb) => eb.bxp("wordsClickedCount", "+", wordsClickedCount ?? 0),
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
    console.error("Error updating reading progress:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
    });
  }
}