import { schema, OutputType } from "./materials_GET.schema";
import { db } from "../helpers/db";
import superjson from 'superjson';
import { Kysely } from "kysely";
import { DB } from "../helpers/schema";

export async function handle(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const queryParams = Object.fromEntries(url.searchParams.entries());
    
    // Zod will coerce the string params to the correct types if possible
    const input = schema.parse(queryParams);

    let query = db.selectFrom('readingMaterials')
      .selectAll()
      .orderBy('createdAt', 'desc');

    if (input.readingLevel) {
      query = query.where('readingLevel', '=', input.readingLevel);
    }

    if (input.contentType) {
      query = query.where('contentType', '=', input.contentType);
    }

    const materials = await query.execute();

    return new Response(superjson.stringify(materials satisfies OutputType), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error("Failed to fetch reading materials:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
    return new Response(superjson.stringify({ error: errorMessage }), { status: 400 });
  }
}