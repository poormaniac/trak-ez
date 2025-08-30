import type { Handler } from "@netlify/functions";

export const handler: Handler = async () => {
  const clientId = process.env.PCO_CLIENT_ID || "";
  const redirect = process.env.PCO_REDIRECT_URL || "";

  const have = {
    PCO_CLIENT_ID: !!clientId,
    PCO_REDIRECT_URL: !!redirect,
  };

  const scope = encodeURIComponent("people services");
  const authorizeUrl =
    clientId && redirect
      ? `https://api.planningcenteronline.com/oauth/authorize` +
        `?client_id=${encodeURIComponent(clientId)}` +
        `&redirect_uri=${encodeURIComponent(redirect)}` +
        `&response_type=code&scope=${scope}`
      : "";

  return {
    statusCode: 200,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(
      {
        envOK: have,
        expectedRedirectFormat:
          "https://trakez.netlify.app/.netlify/functions/pco-oauth-callback",
        authorizeUrl,
        nextStep:
          authorizeUrl
            ? "Open the authorizeUrl in your browser to test PCO auth."
            : "Set env vars then redeploy (Clear cache and deploy).",
      },
      null,
      2
    ),
  };
};
