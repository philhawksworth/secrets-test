import { withSecrets } from "@netlify/functions"

export const handler = withSecrets(async (event, { secrets }) => {
return {
    statusCode: 200,
    body: JSON.stringify(secrets),
    headers: {
        "Content-Type": "application/json",
    },
}
})