import React from "react";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  createHttpLink,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";

import "./App.css";
import DisplayData from "./DisplayData";

/**
 * Adding custom headers to our GraphQL requests. This is the way we can add
 * f.e. the Authorization header with the user's JWT token to the request.
 *
 * More info:
 * - about authentication: https://www.apollographql.com/docs/react/networking/authentication/
 * - about Apollo Links: https://www.apollographql.com/docs/react/api/link/introduction/
 */
const httpLink = createHttpLink({
  uri: "http://localhost:4000/graphql",
});

const headers = setContext((_, { headers }) => {
  return {
    headers: {
      ...headers,
      customHeader: "testtest",
    },
  };
});

function App() {
  const client = new ApolloClient({
    cache: new InMemoryCache(),
    uri: "http://localhost:4000/graphql",
    link: headers.concat(httpLink),
  });

  return (
    <ApolloProvider client={client}>
      <div className="App">
        <DisplayData />
      </div>
    </ApolloProvider>
  );
}

export default App;
