declare function getAppId(): string
declare function getAuthToken(): string

type GraphQLResponse = {
  data: { [key: string]: any }
  errors: any[]
}

declare function fetchOneGraph(
  authToken: string,
  operationsDoc: string,
  operationName: string,
  variables?: { [key: string]: any } | undefined,
): Promise<GraphQLResponse>

export declare function fetchLiveQueries(
  authToken: string,
  appId: string,
  after: string,
): Promise<any>
