import { schema, OutputType } from "./read_POST.schema";
import { db } from "../../helpers/db";
import superjson from 'superjson';

export async function handle(request: Request): Promise<Response> {
  try {
    const json = superjson.parse(await request.text());
    const { id } = schema.parse(json);

    const material = await db.selectFrom('readingMaterials')
      .selectAll()
      .where('id', '=', id)
      .executeTakeFirst();

    if (!material) {
      return new Response(superjson.stringify({ error: "Reading material not found" }), { status: 404 });
    }

    return new Response(superjson.stringify(material satisfies OutputType), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Failed to fetch reading material:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 400 });
  }
}