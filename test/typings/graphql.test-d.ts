import { parse } from 'graphql'
import { graphql } from 'msw'
import { GetUserDetailDocument, LoginDocument } from 'graphql.test-data'

graphql.query<{ key: string }>('', (req, res, ctx) => {
  return res(
    ctx.data(
      // @ts-expect-error Response data doesn't match the query type.
      {},
    ),
  )
})

graphql.query<
  { key: string },
  // @ts-expect-error `null` is not a valid variables type.
  null
>('', (req, res, ctx) => {
  return res(ctx.data({ key: 'pass' }))
})

graphql.mutation<{ key: string }>('', (req, res, ctx) =>
  res(
    ctx.data(
      // @ts-expect-error Response data doesn't match the query type.
      {},
    ),
  ),
)

graphql.mutation<
  { key: string },
  // @ts-expect-error `null` is not a valid variables type.
  null
>('', (req, res, ctx) => {
  return res(ctx.data({ key: 'pass' }))
})

graphql.operation<{ key: string }>((req, res, ctx) => {
  return res(
    ctx.data(
      // @ts-expect-error Response data doesn't match the query type.
      {},
    ),
  )
})

graphql.operation<
  { key: string },
  // @ts-expect-error `null` is not a valid variables type.
  null
>((req, res, ctx) => {
  return res(ctx.data({ key: 'pass' }))
})

/**
 * Supports `DocumentNode` as the GraphQL operation name.
 */
const getUser = parse(`
  query GetUser {
    user {
      firstName
    }
  }
`)
graphql.query(getUser, (req, res, ctx) =>
  res(
    ctx.data({
      // Cannot extract query type from the runtime `DocumentNode`.
      arbitrary: true,
    }),
  ),
)

const createUser = parse(`
  mutation CreateUser {
    user {
      id
    }
  }
`)
graphql.mutation(createUser, (req, res, ctx) =>
  res(
    ctx.data({
      arbitrary: true,
    }),
  ),
)

/**
 * Supports `TypedDocumentNode` as the GraphQL operation name.
 */
graphql.query(GetUserDetailDocument, (req, res, ctx) => {
  return res(
    ctx.data({
      user: {
        id: req.variables.userId,
        firstName: 'John',
        age: 24,
      },
    }),
  )
})

graphql.mutation(LoginDocument, (req, res, ctx) => {
  req.variables.username
  return res(
    ctx.data({
      login: {
        id: 'abc-123',
      },
    }),
  )
})

graphql.query(GetUserDetailDocument, (req, res, ctx) => {
  req.variables.userId
  // @ts-expect-error Unknown operation variable.
  req.variables.unknownVariable

  return res(
    ctx.data(
      // @ts-expect-error Mocked response doesn't match the query type.
      {},
    ),
  )
})

graphql.mutation(LoginDocument, (req, res, ctx) => {
  req.variables.username
  // @ts-expect-error Unknown operation variable.
  req.variables.unknownVariable

  return res(
    ctx.data(
      // @ts-expect-error Mocked response doesn't match the query type.
      {},
    ),
  )
})
