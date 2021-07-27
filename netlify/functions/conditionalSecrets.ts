import { getSecrets, NetlifySecrets } from "@sgrove/netlify-functions";

export const handler = async (event) => {
  const skipSecrets = event.queryStringParameters.skipSecrets === "true";

  let secrets: NetlifySecrets = {};

  if (!skipSecrets) {
    secrets = await getSecrets();
  }

  return {
    statusCode: 200,
    body: JSON.stringify(secrets),
    headers: {
      "Content-Type": "application/json",
    },
  };
};
