import { getSecrets, Handler, NetlifySecrets } from "@netlify/functions";
import { formatSecret } from "../../lib";

export const handler: Handler = async (event) => {
  const skipSecrets = event.queryStringParameters.skipSecrets === "true";

  let secrets: NetlifySecrets = {};

  if (!skipSecrets) {
    secrets = await getSecrets(event);

    // Sanitize the secrets before showing them to the user
    secrets = {
      gitHub: formatSecret(secrets.gitHub),
      salesforce: formatSecret(secrets.salesforce),
      spotify: formatSecret(secrets.spotify),
      stripe: formatSecret(secrets.stripe),
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify(secrets),
    headers: {
      "Content-Type": "application/json",
    },
  };
};
