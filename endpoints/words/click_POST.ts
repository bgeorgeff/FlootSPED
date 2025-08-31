import { schema, OutputType } from "./click_POST.schema";
import superjson from 'superjson';
import { db } from "../../helpers/db";
import { sql } from "kysely";
import { getServerUserSession } from "../../helpers/getServerUserSession";

export async function handle(request: Request) {
  try {
    if (request.method !== 'POST') {
      return new Response(superjson.stringify({ error: 'Method not allowed' }), { status: 405 });
    }

    // Require authentication
    const { user } = await getServerUserSession(request);

    const json = superjson.parse(await request.text());
    const input = schema.parse(json);

    await db.insertInto('clickedWords')
      .values({
        word: input.word,
        materialId: input.materialId,
        materialTitle: input.materialTitle,
        readingLevel: input.readingLevel,
        userId: user.id,
        clickCount: 1,
        firstClickedAt: new Date(),
        lastClickedAt: new Date(),
      })
      .onConflict((oc) => oc
        .columns(['word', 'materialId', 'userId'])
        .doUpdateSet({
          clickCount: sql`clicked_words.click_count + 1`,
          lastClickedAt: new Date(),
        })
      )
      .execute();

    return new Response(superjson.stringify({ success: true } satisfies OutputType), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Error processing word click:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 400 });
  }
}