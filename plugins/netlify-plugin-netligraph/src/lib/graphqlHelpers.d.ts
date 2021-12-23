import {
  GraphQLSchema,
  FragmentDefinitionNode,
  OperationDefinitionNode,
  GraphQLType,
} from 'graphql'
export default function capitalizeFirstLetter(string: string): string
export declare function gatherAllReferencedTypes(
  schema: GraphQLSchema,
  query: OperationDefinitionNode,
): Array<string>
export declare function gatherVariableDefinitions(
  definition: OperationDefinitionNode,
): Array<[string, string]>
export declare function typeScriptForGraphQLType(
  schema: GraphQLSchema,
  gqlType: GraphQLType,
): string
export declare function typeScriptSignatureForOperationVariables(
  variableNames: Array<string>,
  schema: GraphQLSchema,
  operationDefinition: OperationDefinitionNode,
): string
export declare function listCount(gqlType: any): number
export declare function typeScriptDefinitionObjectForOperation(
  schema: GraphQLSchema,
  operationDefinition: OperationDefinitionNode,
  fragmentDefinitions: Array<FragmentDefinitionNode>,
  shouldLog?: boolean,
): {
  data: {
    type: any
    description: string
  }
  errors: {
    type: string[]
    description: string
  }
}
export declare function typeScriptForOperation(
  schema: GraphQLSchema,
  operationDefinition: OperationDefinitionNode,
  fragmentDefinitions: Array<FragmentDefinitionNode>,
): string
export declare function typeScriptTypeNameForOperation(name: string): string
export declare function typeScriptSignatureForOperation(
  schema: GraphQLSchema,
  operationDefinition: OperationDefinitionNode,
  fragmentDefinitions: Array<FragmentDefinitionNode>,
): string
/**
 * Doesn't patch e.g. fragments
 */
export declare function patchSubscriptionWebhookField({
  schema,
  definition,
}: {
  schema: GraphQLSchema
  definition: OperationDefinitionNode
}): OperationDefinitionNode
export declare function patchSubscriptionWebhookSecretField({
  schema,
  definition,
}: {
  schema: GraphQLSchema
  definition: OperationDefinitionNode
}): OperationDefinitionNode
