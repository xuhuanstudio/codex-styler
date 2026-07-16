import schema from "@codex-styler/theme-core/schema";

export const prerender = true;

export function GET() {
  return new Response(JSON.stringify(schema, null, 2), {
    headers: {
      "Content-Type": "application/schema+json; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
