import type { Handler } from "@netlify/functions";
import { sql } from "./db";

export const handler: Handler = async () => {
  try {
    const [row] = await sql`select now() as now`;
    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: true, now: row.now }),
    };
  } catch (err: any) {
    return {
      statusCode: 500,
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ok: false, error: err?.message ?? "unknown error" }),
    };
  }
};
