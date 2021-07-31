import { withSecrets } from "@sgrove/netlify-functions";
const process = require("process");

export const handler = withSecrets(async (event, { secrets }) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      ...secrets,
      authlifyToken: process.env.ONEGRAPH_AUTHLIFY_TOKEN,
    }),
    headers: {
      "Content-Type": "application/json",
    },
  };
});
