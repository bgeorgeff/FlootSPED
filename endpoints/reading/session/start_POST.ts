import { db } from "../../../helpers/db";
import { getServerUserSession } from "../../../helpers/getServerUserSession";
import { schema, OutputType } from "./start_POST.schema";
import superjson from "superjson";
import { Selectable } from "kysely";
import { ReadingSessions, UserProgress } from "../../../helpers/schema";

export async function handle(request: Request): Promise<Response> {
  try {
    const { user } = await getServerUserSession(request);
    const json = superjson.parse(await request.text());
    const { materialId } = schema.parse(json);

    let readingSession: Selectable<ReadingSessions>;
    let userProgress: Selectable<UserProgress>;

    await db.transaction().execute(async (trx) => {
      const material = await trx
        .selectFrom("readingMaterials")
        .select("id")
        .where("id", "=", materialId)
        .executeTakeFirst();

      if (!material) {
        throw new Error("Reading material not found.");
      }

      // Create a new reading session
      const newSession = await trx
        .insertInto("readingSessions")
        .values({
          userId: user.id,
          materialId: materialId,
          sessionStart: new Date(),
          completed: false,
        })
        .returningAll()
        .executeTakeFirstOrThrow();
      
      readingSession = newSession;

      // Find or create user progress record
      const existingProgress = await trx
        .selectFrom("userProgress")
        .where("userId", "=", user.id)
        .where("materialId", "=", materialId)
        .selectAll()
        .executeTakeFirst();

      if (existingProgress) {
        userProgress = existingProgress;
        // Optionally update the `updatedAt` timestamp
        await trx
          .updateTable("userProgress")
          .set({ updatedAt: new Date() })
          .where("id", "=", existingProgress.id)
          .execute();
      } else {
        const newProgress = await trx
          .insertInto("userProgress")
          .values({
            userId: user.id,
            materialId: materialId,
            startedAt: new Date(),
            updatedAt: new Date(),
          })
          .returningAll()
          .executeTakeFirstOrThrow();
        userProgress = newProgress;
      }
    });

    return new Response(
      superjson.stringify({
        readingSessionId: readingSession!.id,
        userProgressId: userProgress!.id,
      } satisfies OutputType)
    );
  } catch (error) {
    console.error("Error starting reading session:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), {
      status: 400,
    });
  }
}