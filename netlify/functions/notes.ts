import type { Handler } from "@netlify/functions";
import { sql } from "./db"; // you already have this

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod === "POST") {
      const { message } = JSON.parse(event.body || "{}");
      if (!message) return { statusCode: 400, body: "Missing message" };
      const [row] = await sql/*sql*/`
        insert into notes (message) values (${message})
        returning id, message, created_at
      `;
      return { statusCode: 201, body: JSON.stringify(row) };
    }

    // GET: list latest 20
    const rows = await sql/*sql*/`
      select id, message, created_at
      from notes
      order by created_at desc
      limit 20
    `;
    return { statusCode: 200, body: JSON.stringify(rows) };
  } catch (e: any) {
    return { statusCode: 500, body: e?.message ?? "error" };
  }
};
