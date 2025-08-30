import type { Handler } from "@netlify/functions";

// Sends user to PCO OAuth authorize page
export const handler: Handler = async () => {
  const clientId = process.env.PCO_CLIENT_ID!;
  const redirect = encodeURIComponent(process.env.PCO_REDIRECT_URL!);
  const scope = encodeURIComponent("people services"); // read-only scopes
  const url =
    `https://api.planningcenteronline.com/oauth/authorize?` +
    `client_id=${clientId}&redirect_uri=${redirect}&response_type=code&scope=${scope}`;

  return {
    statusCode: 302,
    headers: { Location: url },
    body: "",
  };
};
