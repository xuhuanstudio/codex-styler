import type { APIRoute } from "astro";
import companionSchema from "../../../../../packages/theme-core/schema/companion.schema.json";

export const prerender = true;

export const GET: APIRoute = () =>
  new Response(JSON.stringify(companionSchema, null, 2), {
    headers: { "Content-Type": "application/schema+json; charset=utf-8" },
  });
