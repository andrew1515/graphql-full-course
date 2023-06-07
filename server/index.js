const { ApolloServer } = require("@apollo/server");
const { startStandaloneServer } = require("@apollo/server/standalone");
const { typeDefs } = require("./schema/type-defs");
const { resolvers } = require("./schema/resolvers");

// If we would use .graphql file as typedef, we can import it and then use it like this:
//
// const typeDefs = readFileSync('./schema.graphql', { encoding: 'utf-8' });
// const server = new ApolloServer({ typeDefs, resolvers });

const server = new ApolloServer({
  typeDefs,
  resolvers,
  // If we want to send the error in different format to the client
  // (f.e. with more human-readable error message), we can do it here.
  formatError: (formattedError, error) => {
    if (formattedError.extensions.code === "USER_NOT_EXISTS") {
      return {
        ...formattedError,
        message: `User with ID ${formattedError.extensions.userId} not exists`,
      };
    }

    return formattedError;
  },
  // Place for plugins - f.e. some Apollo Studio reporting or Sentry error handler or so...
  // plugins: []
});

startStandaloneServer(server).then(({ url }) => {
  console.log(`YOUR API IS RUNNING AT: ${url} :)`);
});
