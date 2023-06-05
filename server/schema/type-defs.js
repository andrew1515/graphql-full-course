const { gql } = require("apollo-server");

const typeDefs = gql`
  type User {
    id: ID!
    name: String!
    # The ! mark is indicating, that the value should be never null. So when we query the User
    # in the GraphQL API response the username should be never null.
    username: String!
    age: Int
    nationality: Nationality!
    # What if we use ! mark at arrays?
    # More here: https://stackoverflow.com/questions/46770501/graphql-non-nullable-array-list
    friends: [User!]
    favoriteMovies: [Movie!]
  }

  type Movie {
    id: ID!
    name: String!
    yearOfPublication: Int!
    isInTheaters: Boolean!
  }

  # This is a root type for queries. This type should contain all the queries existing in the API.
  # Queries are for getting data from GraphQL API, so it is a "read" operation.
  # It needed to be called "Query", because Apollo Server will need that
  type Query {
    users: [User!]!
    # Parametric query, which accepts an id with type ID
    # We can also define custom types for these parameters. These types are called Input, not Type. More on this
    # below on Mutations (but Inputs can be used also on Queries).
    # The ! mark has the same rules for parameters as for the response types (see above at the User type).
    user(id: ID!): User!
    movies: [Movie!]!
    movie(name: String!): Movie!
  }

  input CreateUserInput {
    name: String!
    username: String!
    age: Int!
    nationality: Nationality = BRAZIL
  }

  input UpdateUsernameInput {
    id: ID!
    newUsername: String!
  }

  # Root type for all mutations.
  # Needed to be called "Mutation", because Apollo Server will need that.
  type Mutation {
    # So in the createUser mutation we should provide a property (Input) from the client and
    # this property should have type CreateUserInput.
    createUser(input: CreateUserInput!): User
    updateUsername(input: UpdateUsernameInput!): User
    deleteUser(id: ID!): User
  }

  enum Nationality {
    CANADA
    BRAZIL
    INDIA
    GERMANY
    CHILE
    UKRAINE
  }
`;

module.exports = { typeDefs };
