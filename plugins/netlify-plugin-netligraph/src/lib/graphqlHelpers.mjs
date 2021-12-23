/* eslint-disable no-unused-vars */
import {
  getNamedType,
  isEnumType,
  isInputObjectType,
  isInterfaceType,
  isListType,
  isNonNullType,
  isObjectType,
  isUnionType,
  isWrappingType,
  parseType,
  print,
  typeFromAST,
  TypeInfo,
  visit,
  visitWithTypeInfo,
} from 'graphql'
export default function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}
export function gatherAllReferencedTypes(schema, query) {
  const types = new Set([])
  const typeInfo = new TypeInfo(schema)
  visit(
    query,
    visitWithTypeInfo(typeInfo, {
      enter: () => {
        const fullType = typeInfo.getType()
        if (fullType) {
          const typ = getNamedType(fullType)
          if (typ) types.add(typ.name.toLocaleLowerCase().replace('oneme', ''))
        }
      },
    }),
  )
  const result = Array.from(types)
  return result
}
export function gatherVariableDefinitions(definition) {
  const extract = (varDef) => [varDef.variable.name.value, print(varDef.type)]
  return (definition && definition.variableDefinitions && definition.variableDefinitions.map(extract) || []).sort(
    ([a], [b]) => a.localeCompare(b),
  )
}
export function typeScriptForGraphQLType(schema, gqlType) {
  let scalarMap = {
    String: 'string',
    ID: 'string',
    Int: 'number',
    Float: 'number',
    Boolean: 'boolean',
  }
  if (isListType(gqlType)) {
    let subType = typeScriptForGraphQLType(schema, gqlType.ofType)
    return `Array<${subType}>`
  } else if (isObjectType(gqlType) || isInputObjectType(gqlType)) {
    let fields = Object.values(gqlType.getFields()).map((field) => {
      let nullable = !isNonNullType(field.type)
      let type = typeScriptForGraphQLType(schema, field.type)
      const description = field.description
        ? `/**
* ${field.description}
*/
`
        : ''
      return `${description}"${field.name}"${nullable ? '?' : ''}: ${type}`
    })
    return `{${fields.join(', ')}}`
  } else if (isWrappingType(gqlType)) {
    return typeScriptForGraphQLType(schema, gqlType.ofType)
  } else if (isEnumType(gqlType)) {
    let values = gqlType.getValues()
    let enums = values.map((enumValue) => `"${enumValue.value}"`)
    return enums.join(' | ')
  } else {
    let namedType = getNamedType(gqlType)
    // @ts-ignore metaprogramming
    let basicType = scalarMap[namedType && namedType.name] || 'any'
    return basicType
  }
}
export function typeScriptSignatureForOperationVariables(
  variableNames,
  schema,
  operationDefinition,
) {
  const helper = (variableDefinition) => {
    let variableName = variableDefinition.variable.name.value
    const result = [variableName, variableDefinition]
    return result
  }
  let variables = (operationDefinition.variableDefinitions || [])
    .map(helper)
    .filter(([variableName]) => {
      return variableNames.includes(variableName)
    })
  let typesObject = variables.map(([varName, varDef]) => {
    let printedType = print(varDef.type)
    let parsedType = parseType(printedType)
    //@ts-ignore
    let gqlType = typeFromAST(schema, parsedType)
    //@ts-ignore
    let tsType = typeScriptForGraphQLType(schema, gqlType)
    return [varName, tsType]
  })
  let typeFields = typesObject
    .map(([name, tsType]) => `"${name}": ${tsType}`)
    .join(', ')
  let types = `{${typeFields}}`
  return types === '' ? 'null' : types
}
//@ts-ignore
export function listCount(gqlType) {
  let inspectedType = gqlType
  let listCount = 0
  let totalCount = 0
  while (isWrappingType(inspectedType)) {
    if (isListType(inspectedType)) {
      listCount = listCount + 1
    }
    totalCount = totalCount + 1
    if (totalCount > 30) {
      console.warn('Bailing on potential infinite recursion')
      return -99
    }
    inspectedType = inspectedType.ofType
  }
  return listCount
}
export function typeScriptDefinitionObjectForOperation(
  schema,
  operationDefinition,
  fragmentDefinitions,
  shouldLog = true,
) {
  let scalarMap = {
    String: 'string',
    ID: 'string',
    Int: 'number',
    Float: 'number',
    Boolean: 'boolean',
    GitHubGitObjectID: 'string',
    // JSON: "JSON",
  }
  //@ts-ignore
  let helper = (parentGqlType, selection) => {
    if (!parentGqlType) {
      return
    }
    let parentNamedType =
      // @ts-ignore
      getNamedType(parentGqlType) || getNamedType(parentGqlType.type)
    let alias = selection.alias && selection.alias.value
    let name = selection.name.value
    let displayedName = alias || name
    //@ts-ignore
    let field = parentNamedType.getFields()[name]
    if (!field) {
      return
    }

    let gqlType = field && field.type
    if (name.startsWith('__')) {
      return [
        displayedName,
        { type: 'any', description: 'Internal GraphQL field' },
      ]
    }
    let namedType = getNamedType(gqlType)
    let isNullable = !isNonNullType(gqlType)
    let isList =
      isListType(gqlType) || (!isNullable && isListType(gqlType.ofType))
    let isObjectLike =
      isObjectType(namedType) ||
      isUnionType(namedType) ||
      isInterfaceType(namedType)
    let sub = selection.selectionSet && selection.selectionSet.selections
      //@ts-ignore
      .map(function innerHelper(selection) {
        if (selection.kind === 'Field') {
          return helper(namedType, selection)
        } else if (selection.kind === 'InlineFragment') {
          const fragmentGqlType = typeFromAST(schema, selection.typeCondition)
          if (!fragmentGqlType) {
            return null
          }
          const fragmentSelections = selection.selectionSet.selections.map(
            //@ts-ignore
            (subSelection) => {
              let subSel = helper(fragmentGqlType, subSelection)
              return subSel
            },
          )
          return fragmentSelections
        } else if (selection.kind === 'FragmentSpread') {
          const fragmentName = [selection.name.value]
          //@ts-ignore
          const fragment = fragmentDefinitions[fragmentName]
          if (fragment) {
            const fragmentGqlType = typeFromAST(schema, fragment.typeCondition)
            if (!fragmentGqlType) {
              return null
            }
            const fragmentSelections =
              fragment.selectionSet.selections.map(innerHelper)
            return fragmentSelections
          }
        }
        return null
      })
      .filter(Boolean)
      //@ts-ignore
      .reduce((acc, next) => {
        if (Array.isArray(next[0])) {
          return acc.concat(next)
        } else {
          return [...acc, next]
        }
      }, [])
    let nestingLevel = isList ? listCount(gqlType) : 0
    let isEnum = isEnumType(namedType)
    let basicType = isEnum
      ? //@ts-ignore
      new Set(namedType.getValues().map((gqlEnum) => gqlEnum.value))
      : //@ts-ignore
      scalarMap[namedType && namedType.name || 'any']
    let returnType
    if (isObjectLike) {
      returnType = sub ? Object.fromEntries(sub) : null
    } else if (basicType) {
      returnType = basicType
    } else {
      returnType = 'any'
    }
    if (returnType) {
      let finalType = returnType
      for (var i = 0; i < nestingLevel; i++) {
        finalType = [finalType]
      }
      const entry = [
        displayedName,
        { type: finalType, description: field && field.description },
      ]
      return entry
    }
    //@ts-ignore
    console.warn('No returnType!', basicType, namedType.name, selection)
  }
  let baseGqlType =
    operationDefinition.kind === 'OperationDefinition'
      ? operationDefinition.operation === 'query'
        ? schema.getQueryType()
        : operationDefinition.operation === 'mutation'
          ? schema.getMutationType()
          : operationDefinition.operation === 'subscription'
            ? schema.getSubscriptionType()
            : null
      : operationDefinition.kind === 'FragmentDefinition'
        ? //@ts-ignore
        schema.getType(operationDefinition.typeCondition.name.value)
        : null
  let selections = operationDefinition.selectionSet && operationDefinition.selectionSet.selections
  let sub = selections && selections.map((selection) => {
    return helper(baseGqlType, selection)
  })
  if (sub) {
    //@ts-ignore
    const object = Object.fromEntries(sub)
    const result = {
      data: {
        type: object,
        description: 'Any data retrieved by the function will be returned here',
      },
      errors: {
        type: ['any'],
        description: 'Any errors in the function will be returned here',
      },
    }
    return result
  } else {
    return {
      data: {
        //@ts-ignore
        type: 'any',
        description: 'Any data retrieved by the function will be returned here',
      },
      errors: {
        type: ['any'],
        description: 'Any errors in the function will be returned here',
      },
    }
  }
}
export function typeScriptForOperation(
  schema,
  operationDefinition,
  fragmentDefinitions,
) {
  let typeMap = typeScriptDefinitionObjectForOperation(
    schema,
    operationDefinition,
    fragmentDefinitions,
  )
  let valueHelper = (value) => {
    if (value && value.type && typeof value.type === 'string') {
      return value.type
    } else if (Array.isArray(value.type)) {
      let subType = valueHelper({ type: value.type[0] })
      return `Array<${subType}>`
    } else if (value.type instanceof Set) {
      //@ts-ignore
      const enums = Array.from(value.type.values())
        .map((value) => `"${value}"`)
        .join(' | ')
      return enums
    } else if (typeof value.type === 'object') {
      let fields = objectHelper(value.type)
      return `{
      ${fields.join(', ')}
  }`
    }
  }
  //@ts-ignore
  function objectHelper(obj) {
    return Object.entries(obj).map(([name, value]) => {
      //@ts-ignore
      const { type, description } = value
      //@ts-ignore
      let tsType = valueHelper(value)
      let doc = description
        ? `/**
* ${description}
*/
`
        : ''
      return `${doc}"${name}": ${tsType}`
    })
  }
  let fields = objectHelper(typeMap).join(', ')
  return `{${fields}}`
}
export function typeScriptTypeNameForOperation(name) {
  return `${capitalizeFirstLetter(name)}Payload`
}
export function typeScriptSignatureForOperation(
  schema,
  operationDefinition,
  fragmentDefinitions,
) {
  let types = typeScriptForOperation(
    schema,
    operationDefinition,
    fragmentDefinitions,
  )
  let name = operationDefinition.name && operationDefinition.name.value || 'unknown'
  return `${types}`
}
/**
 * Doesn't patch e.g. fragments
 */
export function patchSubscriptionWebhookField({ schema, definition }) {
  if (definition.operation !== 'subscription') {
    return definition
  }
  const subscriptionType = schema.getSubscriptionType()
  if (!subscriptionType) {
    return definition
  }
  const newSelections = definition.selectionSet.selections.map((selection) => {
    if (selection.kind !== 'Field') return selection
    const field = subscriptionType.getFields()[selection.name.value]
    const fieldHasWebhookUrlArg = field.args.some(
      (arg) => arg.name === 'webhookUrl',
    )
    const selectionHasWebhookUrlArg = selection.arguments && selection.arguments.some(
      (arg) => arg.name.value === 'webhookUrl',
    )
    if (fieldHasWebhookUrlArg && !selectionHasWebhookUrlArg) {
      return {
        ...selection,
        arguments: [
          ...(selection.arguments || []),
          {
            kind: 'Argument',
            name: {
              kind: 'Name',
              value: 'webhookUrl',
            },
            value: {
              kind: 'Variable',
              name: {
                kind: 'Name',
                value: 'netligraphWebhookUrl',
              },
            },
          },
        ],
      }
    }
    return selection
  })
  const hasWebhookVariableDefinition = definition.variableDefinitions && definition.variableDefinitions.find(
    (varDef) => varDef.variable.name.value === 'netligraphWebhookUrl',
  )
  const variableDefinitions = hasWebhookVariableDefinition
    ? definition.variableDefinitions
    : [
      ...(definition.variableDefinitions || []),
      {
        kind: 'VariableDefinition',
        type: {
          kind: 'NonNullType',
          type: {
            kind: 'NamedType',
            name: {
              kind: 'Name',
              value: 'String',
            },
          },
        },
        variable: {
          kind: 'Variable',
          name: {
            kind: 'Name',
            value: 'netligraphWebhookUrl',
          },
        },
      },
    ]
  return {
    ...definition,
    //@ts-ignore: Handle edge cases later
    variableDefinitions,
    //@ts-ignore: Handle edge cases later
    selectionSet: { ...definition.selectionSet, selections: newSelections },
  }
}
export function patchSubscriptionWebhookSecretField({ schema, definition }) {
  if (definition.operation !== 'subscription') {
    return definition
  }
  const subscriptionType = schema.getSubscriptionType()
  if (!subscriptionType) {
    return definition
  }
  const newSelections = definition.selectionSet.selections.map((selection) => {
    if (selection.kind !== 'Field') return selection
    const field = subscriptionType.getFields()[selection.name.value]
    const fieldHasWebhookSecretArg = field.args.some(
      (arg) => arg.name === 'secret',
    )
    const selectionHasWebhookSecretArg = selection.arguments && selection.arguments.some(
      (arg) => arg.name.value === 'secret',
    )
    if (fieldHasWebhookSecretArg && !selectionHasWebhookSecretArg) {
      return {
        ...selection,
        arguments: [
          ...(selection.arguments || []),
          {
            kind: 'Argument',
            name: {
              kind: 'Name',
              value: 'secret',
            },
            value: {
              kind: 'Variable',
              name: {
                kind: 'Name',
                value: 'netligraphWebhookSecret',
              },
            },
          },
        ],
      }
    }
    return selection
  })
  const hasWebhookVariableDefinition = definition.variableDefinitions && definition.variableDefinitions.find(
    (varDef) => varDef.variable.name.value === 'netligraphWebhookSecret',
  )

  const variableDefinitions = hasWebhookVariableDefinition
    ? definition.variableDefinitions
    : [
      ...(definition.variableDefinitions || []),
      {
        kind: 'VariableDefinition',
        type: {
          kind: 'NonNullType',
          type: {
            kind: 'NamedType',
            name: {
              kind: 'Name',
              value: 'OneGraphSubscriptionSecretInput',
            },
          },
        },
        variable: {
          kind: 'Variable',
          name: {
            kind: 'Name',
            value: 'netligraphWebhookSecret',
          },
        },
      },
    ]
  return {
    ...definition,
    //@ts-ignore: Handle edge cases later
    variableDefinitions,
    //@ts-ignore: Handle edge cases later
    selectionSet: { ...definition.selectionSet, selections: newSelections },
  }
}
