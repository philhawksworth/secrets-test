Deploy this repo to Netlify, then go to https://authlify-dev.netlify.app/ to enable the addon

After it's deployed, you can hit three endpoints:

1. "/.netlify/functions/secret" - see all enabled auths + secrets
1. "/.netlify/functions/conditionalSecrets?skipSecrets=true" - see and endpoint that can optionally retrieve secrets, useful to see the overhead of the current implementation
1. "/.netlify/functions/addIssueComment?comment=Hello there!" - an endpoint that requires GitHub to be authenticated with sufficient scopes (default should be fine). Will leave a comment on https://github.com/sgrove/blog/issues/66

Be sure to destroy the app after you finish testing so there are no leaked secrets.