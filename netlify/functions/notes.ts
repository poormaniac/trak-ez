import type { Handler } from "@netlify/functions";
import { sql } from "./db";

// GET  /.netlify/functions/notes       → list latest notes
// POST /.netlify/functions/notes       → { message: string } to create

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod === "POST") {
      const { message } = JSON.parse(event.body || "{}");
      if (!message) return { statusCode: 400, body: "Missing message" };
      const [row] = await sql/*sql*/`
        insert into notes (message) values (${message})
        returning id, message, created_at
      `;
      return {
        statusCode: 201,
        headers: { "content-type": "application/json" },
        body: JSON.stringify(row),
      };
    }

    // default: GET
    const rows = await sql/*sql*/`
      select id, message, created_at
      from notes
      order by created_at desc
      limit 50
    `;
    return {
      statusCode: 200,
      headers: { "content-type": "application/json" },
      body: JSON.stringify(rows),
    };
  } catch (e: any) {
    return { statusCode: 500, body: e?.message ?? "error" };
  }
};
