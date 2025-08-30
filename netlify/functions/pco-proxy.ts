import type { Handler } from "@netlify/functions";
import { sql } from "./db";

const BASE = "https://api.planningcenteronline.com";

// get valid access token; refresh if needed
async function getAccessToken(): Promise<string> {
  const rows = await sql/*sql*/`select id, access_token, refresh_token, expires_at from pco_oauth order by id asc limit 1`;
  const row = rows[0];
  if (!row) throw new Error("PCO not connected. Visit /.netlify/functions/pco-login");

  const expiresAt = new Date(row.expires_at).getTime();
  const now = Date.now() + 60_000; // 60s early refresh window
  if (expiresAt > now) return row.access_token;

  // refresh
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: row.refresh_token,
    client_id: process.env.PCO_CLIENT_ID!,
    client_secret: process.env.PCO_CLIENT_SECRET!,
  });

  const res = await fetch(`${BASE}/oauth/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });
  if (!res.ok) throw new Error(`Refresh failed: ${res.status} ${await res.text()}`);
  const t = (await res.json()) as {
    access_token: string; refresh_token: string; expires_in: number; created_at?: number;
  };

  const base = t.created_at ? t.created_at * 1000 : Date.now();
  const expiresAtIso = new Date(base + t.expires_in * 1000).toISOString();

  await sql/*sql*/`
    update pco_oauth set
      access_token=${t.access_token},
      refresh_token=${t.refresh_token},
      expires_at=${expiresAtIso},
      updated_at=now()
    where id in (select id from pco_oauth order by id asc limit 1)
  `;
  return t.access_token;
}

function isAllowedPath(path: string): boolean {
  // VERY IMPORTANT: only allow read-only Services endpoints we need
  const ok = [
    /^\/services\/v2\/songs(\/\d+)?$/i,
    /^\/services\/v2\/arrangements(\/\d+)?$/i,
    /^\/services\/v2\/arrangements\/\d+\/keys$/i,
    /^\/services\/v2\/media(\/\d+)?$/i,
  ];
  return ok.some((re) => re.test(path));
}

export const handler: Handler = async (event) => {
  try {
    const rawPath = event.queryStringParameters?.path || "";
    const qs = event.queryStringParameters?.qs || ""; // optional extra query (already encoded)
    if (!rawPath.startsWith("/")) return { statusCode: 400, body: "path must start with '/'" };
    if (!isAllowedPath(rawPath)) return { statusCode: 403, body: "blocked endpoint" };

    const token = await getAccessToken();
    const url = `${BASE}${rawPath}${qs ? (rawPath.includes("?") ? "&" : "?") + qs : ""}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
    });

    const headers: Record<string, string> = {
      "content-type": res.headers.get("content-type") || "application/json",
      "access-control-allow-origin": "*", // allow your frontend
    };

    // stream JSON/text responses; for media we’ll just pass JSON metadata (PCO media is usually URLs)
    const body = await res.text();
    return { statusCode: res.status, headers, body };
  } catch (e: any) {
    return { statusCode: 500, body: e?.message ?? "proxy error" };
  }
};
