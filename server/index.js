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

startStandaloneServer(server, {
  /**
   * For every resolver we can provide a context. The "context" function is like
   * an Express middleware before the actual request handler (like an app.use),
   * which will handle f.e. the authentication stuff and then provide the result
   * of the authentication to the request handlers - the same is happening here: in the context
   * we can handle f.e. the authentication, then return a context with the auth data (logged in user data f.e.).
   */
  context: ({ req, res }) => {
    // It will contain the "customHeader" header - see App.jsx.
    // console.log(req.headers);
    return { req };
  },
}).then(({ url }) => {
  console.log(`YOUR API IS RUNNING AT: ${url} :)`);
});
