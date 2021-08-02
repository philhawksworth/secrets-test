// This function replaces all but the last four digits of a string with zeroes
const sanitizeToken = (str: string, length = 16): string => {
  const len = str.length;
  const displayed = len > 4 ? str.substr(len - 4, len) : str;

  const padLength = length - displayed.length;
  return displayed.padStart(padLength, "*");
};

export const formatSecret = (secret: any): any => {
  if (!secret) {
    return;
  }

  return {
    bearerToken: secret.bearerToken ? sanitizeToken(secret.bearerToken) : null,
    friendlyServiceName: secret.friendlyServiceName,
    service: secret.service,
    grantedScopes: secret.grantedScopes?.map((scope: any) => scope.scope),
  };
};
