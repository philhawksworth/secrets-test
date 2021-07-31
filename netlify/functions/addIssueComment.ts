import { withSecrets } from "@sgrove/netlify-functions";
import { Octokit } from "@octokit/core";
import { restEndpointMethods } from "@octokit/plugin-rest-endpoint-methods";

export const handler = withSecrets(async (event, { secrets }) => {
  const issueComment = (
    event.queryStringParameters.comment || ""
  ).toLocaleUpperCase();

  if (issueComment.trim() === "") {
    return {
      statusCode: 426,
      body: JSON.stringify({
        error: "comment query param must be either a full string",
      }),
      headers: {
        "Content-Type": "application/json",
      },
    };
  }

  if (!secrets.gitHub?.bearerToken) {
    return {
      statusCode: 412,
      body: JSON.stringify({
        error: "You must enable the GitHub auth in your Authlify dashboard",
      }),
      headers: {
        "Content-Type": "application/json",
      },
    };
  }

  const MyOctokit = Octokit.plugin(restEndpointMethods);
  const octokit = new MyOctokit({ auth: secrets.gitHub?.bearerToken });

  const result = await octokit.rest.issues.createComment({
    owner: "sgrove",
    repo: "blog",
    issue_number: 66,
    body: issueComment + "\n\nSorry to be so shouty, though",
  });

  return {
    statusCode: 200,
    body: JSON.stringify(result.data),
    headers: {
      "Content-Type": "application/json",
    },
  };
});
