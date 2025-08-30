import type { Handler } from "@netlify/functions";
import { sql } from "./db";

type TokenResponse = {
  access_token: string;
  token_type: "Bearer";
  expires_in: number;         // seconds
  refresh_token: string;
  created_at?: number;        // epoch seconds (PCO usually returns this)
};

async function exchangeCodeForTokens(code: string) {
  const clientId = process.env.PCO_CLIENT_ID!;
  const clientSecret = process.env.PCO_CLIENT_SECRET!;
  const redirect = process.env.PCO_REDIRECT_URL!;

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: redirect,
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch("https://api.planningcenteronline.com/oauth/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body,
  });

  if (!res.ok) throw new Error(`Token exchange failed: ${res.status} ${await res.text()}`);
  const json = (await res.json()) as TokenResponse;
  return json;
}

export const handler: Handler = async (event) => {
  try {
    const code = event.queryStringParameters?.code;
    if (!code) return { statusCode: 400, body: "Missing code" };

    const t = await exchangeCodeForTokens(code);

    const now = Date.now();
    const base = t.created_at ? t.created_at * 1000 : now;
    const expiresAt = new Date(base + t.expires_in * 1000).toISOString();

    // upsert a single row
    await sql/*sql*/`
      insert into pco_oauth (access_token, refresh_token, expires_at)
      values (${t.access_token}, ${t.refresh_token}, ${expiresAt})
      on conflict (id) do update set
        access_token = excluded.access_token,
        refresh_token = excluded.refresh_token,
        expires_at = excluded.expires_at,
        updated_at = now()
    `;

    // simple success page
    return {
      statusCode: 200,
      headers: { "content-type": "text/html; charset=utf-8" },

      body:
        `<h1>Connected to Planning Center ✅</h1>` +
        `<p>You can close this tab and return to TrakEZ.</p>`,
    };
  } catch (e: any) {
    return { statusCode: 500, body: e.message ?? "oauth error" };
  }
};
