const typeDefs = `#graphql
  type User {
    # The ID type is a special type for unique identifiers. It is basically
    # a String type with this special feature.
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

  # If we want to restrict some field to certain list of values, we can
  # define an enum type for that field.
  # Enums are case-sensitive, so if we have all the enum items in the type with uppercase,
  # the values in the data source should be also uppercase.
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

/**
 * Note about type conversions:
 * If a given resolver is returning an object with a property of type String,
 * but according to our typedefs it should be a number (f.e. Int), GraphQL will convert it
 * to number (if possible). This is also true opposite way. In the end, it is true in general, if
 * this situation happens, GraphQL will try to make the type conversion.
 *
 * However, this is not completely true for query parameters (like we have in the "user" query the "id" parameter).
 * For ID type GraphQL will accept either Int or String, but for Int and String types we can provide only the exact type.
 *
 * Long story short, it's better to have exact types every time.
 */
