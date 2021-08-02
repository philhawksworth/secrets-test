import { NetlifySecrets, withSecrets } from "@sgrove/netlify-functions";
import { formatSecret } from "../../lib";

export const handler = withSecrets(async (event, { secrets }) => {
  console.log("All secrets JSON: ", JSON.stringify(secrets, null, 2));
  // Sanitize the secrets before showing them to the user
  const sanitizedSecrets: NetlifySecrets = {
    gitHub: formatSecret(secrets.gitHub),
    salesforce: formatSecret(secrets.salesforce),
    spotify: formatSecret(secrets.spotify),
    stripe: formatSecret(secrets.stripe),
  };

  return {
    statusCode: 200,
    body: JSON.stringify(sanitizedSecrets),
    headers: {
      "Content-Type": "application/json",
    },
  };
});
