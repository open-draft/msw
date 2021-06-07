import { graphql } from './graphql'
import {
  GetUserDetailDocument,
  GetUserDetailQueryVariables,
  LoginDocument,
  LoginMutationVariables,
} from './graphql.test-data'

test('exports supported GraphQL operation types', () => {
  expect(graphql).toBeDefined()
  expect(Object.keys(graphql)).toEqual([
    'operation',
    'query',
    'mutation',
    'link',
  ])
})

test('pass proper type to request variable and data payload parameter for query', () => {
  const op = graphql.query(GetUserDetailDocument, (req, res, ctx) => {
    // If type doesn't match, this should fail compilation
    const variables: GetUserDetailQueryVariables = req.variables

    // MANUAL VERIFICATION: intellisense on `ctx.data` should be of type `DataContext<GetUserDetailQuery>`.
    // Not sure how to test this.
    ctx.data
  })
})

test('pass proper type to request variable and data payload parameter for mutation', () => {
  const op = graphql.mutation(LoginDocument, (req, res, ctx) => {
    // If type doesn't match, this should fail compilation
    const variables: LoginMutationVariables = req.variables

    // MANUAL VERIFICATION: intellisense on `ctx.data` should be of type `DataContext<LoginMutation>`.
    // Not sure how to test this.
    ctx.data
  })
})
