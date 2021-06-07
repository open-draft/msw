import { DocumentNode } from 'graphql'
import { Headers } from 'headers-utils/lib'
import { context } from '..'
import { createMockedRequest } from '../../test/support/utils'
import { GetUserDetailDocument, LoginDocument } from '../graphql.test-data'
import { response } from '../response'
import {
  GraphQLContext,
  GraphQLHandler,
  GraphQLRequest,
  GraphQLRequestBody,
} from './GraphQLHandler'
import { MockedRequest, ResponseResolver } from './RequestHandler'

const resolver: ResponseResolver<
  GraphQLRequest<{ userId: string }>,
  GraphQLContext<any>
> = (req, res, ctx) => {
  return res(
    ctx.data({
      user: { id: req.variables.userId },
    }),
  )
}

function createGetGraphQLRequest(
  body: GraphQLRequestBody<any>,
  hostname = 'https://example.com',
) {
  const requestUrl = new URL(hostname)
  requestUrl.searchParams.set('query', body?.query)
  requestUrl.searchParams.set('variables', JSON.stringify(body?.variables))
  return createMockedRequest({
    url: requestUrl,
  })
}

function createPostGraphQLRequest(
  body: GraphQLRequestBody<any>,
  hostname = 'https://example.com',
  initMockedRequest: Partial<MockedRequest> = {},
) {
  return createMockedRequest({
    method: 'POST',
    url: new URL(hostname),
    ...initMockedRequest,
    headers: new Headers({ 'Content-Type': 'application/json ' }),
    body,
  })
}

const GET_USER = `
  query GetUser {
    user {
      id
    }
  }
`

const LOGIN = `
  mutation Login {
    user {
      id
    }
  }
`

describe('info', () => {
  test('exposes request handler information for query', () => {
    const handler = new GraphQLHandler('query', 'GetUser', '*', resolver)

    expect(handler.info).toHaveProperty('header', 'query GetUser (origin: *)')
    expect(handler.info).toHaveProperty('operationType', 'query')
    expect(handler.info).toHaveProperty('operationName', 'GetUser')
  })

  test('exposes request handler information for mutation', () => {
    const handler = new GraphQLHandler('mutation', 'Login', '*', resolver)

    expect(handler.info).toHaveProperty('header', 'mutation Login (origin: *)')
    expect(handler.info).toHaveProperty('operationType', 'mutation')
    expect(handler.info).toHaveProperty('operationName', 'Login')
  })

  test('parses operation name out of DocumentNode for query', () => {
    const handler = new GraphQLHandler(
      'query',
      GetUserDetailDocument,
      '*',
      resolver,
    )

    expect(handler.info).toHaveProperty(
      'header',
      'query GetUserDetail (origin: *)',
    )
    expect(handler.info).toHaveProperty('operationType', 'query')
    expect(handler.info).toHaveProperty('operationName', 'GetUserDetail')
  })

  test('parses operation name out of DocumentNode for mutation', () => {
    const handler = new GraphQLHandler('mutation', LoginDocument, '*', resolver)

    expect(handler.info).toHaveProperty('header', 'mutation Login (origin: *)')
    expect(handler.info).toHaveProperty('operationType', 'mutation')
    expect(handler.info).toHaveProperty('operationName', 'Login')
  })

  test('throws exception for mismatch operation type on DocumentNode for query', () => {
    const getUserDetailDocument: DocumentNode = {
      kind: 'Document',
      definitions: [
        {
          kind: 'OperationDefinition',
          operation: 'mutation',
          name: { kind: 'Name', value: 'GetUserDetail' },
          variableDefinitions: [
            {
              kind: 'VariableDefinition',
              variable: {
                kind: 'Variable',
                name: { kind: 'Name', value: 'userId' },
              },
              type: {
                kind: 'NonNullType',
                type: {
                  kind: 'NamedType',
                  name: { kind: 'Name', value: 'String' },
                },
              },
            },
          ],
          selectionSet: {
            kind: 'SelectionSet',
            selections: [
              {
                kind: 'Field',
                name: { kind: 'Name', value: 'user' },
                selectionSet: {
                  kind: 'SelectionSet',
                  selections: [
                    { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                  ],
                },
              },
            ],
          },
        },
      ],
    }
    expect(
      () => new GraphQLHandler('query', getUserDetailDocument, '*', resolver),
    ).toThrowError()
  })

  test('throws exception for mismatch operation type on DocumentNode for mutation', () => {
    const loginDocument: DocumentNode = {
      kind: 'Document',
      definitions: [
        {
          kind: 'OperationDefinition',
          operation: 'query',
          name: { kind: 'Name', value: 'Login' },
          variableDefinitions: [
            {
              kind: 'VariableDefinition',
              variable: {
                kind: 'Variable',
                name: { kind: 'Name', value: 'username' },
              },
              type: {
                kind: 'NonNullType',
                type: {
                  kind: 'NamedType',
                  name: { kind: 'Name', value: 'String' },
                },
              },
            },
          ],
          selectionSet: {
            kind: 'SelectionSet',
            selections: [
              {
                kind: 'Field',
                name: { kind: 'Name', value: 'login' },
                arguments: [
                  {
                    kind: 'Argument',
                    name: { kind: 'Name', value: 'username' },
                    value: {
                      kind: 'Variable',
                      name: { kind: 'Name', value: 'username' },
                    },
                  },
                ],
                selectionSet: {
                  kind: 'SelectionSet',
                  selections: [
                    { kind: 'Field', name: { kind: 'Name', value: 'id' } },
                  ],
                },
              },
            ],
          },
        },
      ],
    }
    expect(
      () => new GraphQLHandler('mutation', loginDocument, '*', resolver),
    ).toThrowError()
  })
})

describe('parse', () => {
  describe('query', () => {
    test('parses a query without variables (GET)', () => {
      const handler = new GraphQLHandler('query', 'GetUser', '*', resolver)
      const request = createGetGraphQLRequest({
        query: GET_USER,
      })

      expect(handler.parse(request)).toEqual({
        operationType: 'query',
        operationName: 'GetUser',
        variables: undefined,
      })
    })

    test('parses a query with variables (GET)', () => {
      const handler = new GraphQLHandler('query', 'GetUser', '*', resolver)
      const request = createGetGraphQLRequest({
        query: GET_USER,
        variables: {
          userId: 'abc-123',
        },
      })

      expect(handler.parse(request)).toEqual({
        operationType: 'query',
        operationName: 'GetUser',
        variables: {
          userId: 'abc-123',
        },
      })
    })

    test('parses a query without variables (POST)', () => {
      const handler = new GraphQLHandler('query', 'GetUser', '*', resolver)
      const request = createPostGraphQLRequest({
        query: GET_USER,
      })

      expect(handler.parse(request)).toEqual({
        operationType: 'query',
        operationName: 'GetUser',
        variables: undefined,
      })
    })

    test('parses a query with variables (POST)', () => {
      const handler = new GraphQLHandler('query', 'GetUser', '*', resolver)
      const request = createPostGraphQLRequest({
        query: GET_USER,
        variables: {
          userId: 'abc-123',
        },
      })

      expect(handler.parse(request)).toEqual({
        operationType: 'query',
        operationName: 'GetUser',
        variables: {
          userId: 'abc-123',
        },
      })
    })
  })

  describe('mutation', () => {
    test('parses a mutation without variables (GET)', () => {
      const handler = new GraphQLHandler('mutation', 'GetUser', '*', resolver)
      const request = createGetGraphQLRequest({
        query: LOGIN,
      })

      expect(handler.parse(request)).toEqual({
        operationType: 'mutation',
        operationName: 'Login',
        variables: undefined,
      })
    })

    test('parses a mutation with variables (GET)', () => {
      const handler = new GraphQLHandler('mutation', 'GetUser', '*', resolver)
      const request = createGetGraphQLRequest({
        query: LOGIN,
        variables: {
          userId: 'abc-123',
        },
      })

      expect(handler.parse(request)).toEqual({
        operationType: 'mutation',
        operationName: 'Login',
        variables: {
          userId: 'abc-123',
        },
      })
    })

    test('parses a mutation without variables (POST)', () => {
      const handler = new GraphQLHandler('mutation', 'GetUser', '*', resolver)
      const request = createPostGraphQLRequest({
        query: LOGIN,
      })

      expect(handler.parse(request)).toEqual({
        operationType: 'mutation',
        operationName: 'Login',
        variables: undefined,
      })
    })

    test('parses a mutation with variables (POST)', () => {
      const handler = new GraphQLHandler('mutation', 'GetUser', '*', resolver)
      const request = createPostGraphQLRequest({
        query: LOGIN,
        variables: {
          userId: 'abc-123',
        },
      })

      expect(handler.parse(request)).toEqual({
        operationType: 'mutation',
        operationName: 'Login',
        variables: {
          userId: 'abc-123',
        },
      })
    })
  })
})

describe('predicate', () => {
  test('respects operation type', () => {
    const handler = new GraphQLHandler('query', 'GetUser', '*', resolver)
    const request = createPostGraphQLRequest({
      query: GET_USER,
    })
    const alienRequest = createPostGraphQLRequest({
      query: LOGIN,
    })

    expect(handler.predicate(request, handler.parse(request))).toBe(true)
    expect(handler.predicate(alienRequest, handler.parse(alienRequest))).toBe(
      false,
    )
  })

  test('respects operation name', () => {
    const handler = new GraphQLHandler('query', 'GetUser', '*', resolver)
    const request = createPostGraphQLRequest({
      query: GET_USER,
    })
    const alienRequest = createPostGraphQLRequest({
      query: `
          query GetAllUsers {
            user {
              id
            }
          }
        `,
    })

    expect(handler.predicate(request, handler.parse(request))).toBe(true)
    expect(handler.predicate(alienRequest, handler.parse(alienRequest))).toBe(
      false,
    )
  })

  test('respects custom endpoint', () => {
    const handler = new GraphQLHandler(
      'query',
      'GetUser',
      'https://api.github.com/graphql',
      resolver,
    )
    const request = createPostGraphQLRequest(
      {
        query: GET_USER,
      },
      'https://api.github.com/graphql',
    )
    const alienRequest = createPostGraphQLRequest({
      query: GET_USER,
    })

    expect(handler.predicate(request, handler.parse(request))).toBe(true)
    expect(handler.predicate(alienRequest, handler.parse(alienRequest))).toBe(
      false,
    )
  })
})

describe('test', () => {
  test('respects operation type', () => {
    const handler = new GraphQLHandler('query', 'GetUser', '*', resolver)
    const request = createPostGraphQLRequest({
      query: GET_USER,
    })
    const alienRequest = createPostGraphQLRequest({
      query: LOGIN,
    })

    expect(handler.test(request)).toBe(true)
    expect(handler.test(alienRequest)).toBe(false)
  })

  test('respects operation name', () => {
    const handler = new GraphQLHandler('query', 'GetUser', '*', resolver)
    const request = createPostGraphQLRequest({
      query: GET_USER,
    })
    const alienRequest = createPostGraphQLRequest({
      query: `
          query GetAllUsers {
            user {
              id
            }
          }
        `,
    })

    expect(handler.test(request)).toBe(true)
    expect(handler.test(alienRequest)).toBe(false)
  })

  test('respects custom endpoint', () => {
    const handler = new GraphQLHandler(
      'query',
      'GetUser',
      'https://api.github.com/graphql',
      resolver,
    )
    const request = createPostGraphQLRequest(
      {
        query: GET_USER,
      },
      'https://api.github.com/graphql',
    )
    const alienRequest = createPostGraphQLRequest({
      query: GET_USER,
    })

    expect(handler.test(request)).toBe(true)
    expect(handler.test(alienRequest)).toBe(false)
  })
})

describe('run', () => {
  test('returns a mocked response given a matching query', async () => {
    const handler = new GraphQLHandler('query', 'GetUser', '*', resolver)
    const request = createPostGraphQLRequest({
      query: GET_USER,
      variables: {
        userId: 'abc-123',
      },
    })
    const result = await handler.run(request)

    expect(result).toEqual({
      handler,
      request: {
        ...request,
        variables: {
          userId: 'abc-123',
        },
      },
      parsedResult: {
        operationType: 'query',
        operationName: 'GetUser',
        variables: {
          userId: 'abc-123',
        },
      },
      response: await response(
        context.data({
          user: { id: 'abc-123' },
        }),
      ),
    })
  })

  test('returns null given a non-matching query', async () => {
    const handler = new GraphQLHandler('query', 'GetUser', '*', resolver)
    const request = createPostGraphQLRequest({
      query: LOGIN,
    })
    const result = await handler.run(request)

    expect(result).toBeNull()
  })
})
