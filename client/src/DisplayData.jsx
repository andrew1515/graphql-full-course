import React, { useState } from "react";
import { useQuery, useLazyQuery, gql, useMutation } from "@apollo/client";

/**
 * Fragments
 *
 * With fragments we can create reusable GraphQL query partials, which we can then use in multiple queries.
 * The GetAgeAndName fragment is a fragment for some query, which will return an User. If we use this fragment in
 * some query, we can replace the "name" and "age" fields with this fragment.
 */
const FRAGMENTS = gql`
  fragment GetAgeAndName on User {
    name
    age
  }
`;

/**
 * Querying users
 *
 * Query request syntax no. 1:
 * This is a "named" query without parameters. It's a good practice to name the queries, it's easier to read and
 * it provides an unified syntax.
 */
const QUERY_ALL_USERS = gql`
  # Needs to be referenced here if we want to use the fragments in the actual query.
  ${FRAGMENTS}
  query GetAllUsers {
    # The query name. For available queries, see type-defs.js
    # Then we provide all the fields what we want to load.
    users {
      id
      # Using the fragment instead of "name" and "age"
      ...GetAgeAndName
      username
      nationality
      # The "friends" field is a nested one (it is a type User), so we
      # need to define the concrete fields here too.
      friends {
        id
        ...GetAgeAndName
        # Same here, we need to define concrete fields to load.
        favoriteMovies {
          name
          yearOfPublication
        }
      }
    }
  }
`;

/**
 * Query request syntax no. 2:
 * Using "unnamed" query request without parameters. For queries we can
 * avoid the "query" keyword if we don't have any parameters (we can't avoid it at mutations though).
 */
const QUERY_ALL_MOVIES = gql`
  {
    movies {
      name
    }
  }
`;

/**
 * Querying a movie by his name
 *
 * How we can actually provide the "name" parameter to the query? Search for "fetchMovie" in
 * this file (you can provide a "variables" object into the query).
 *
 * Query request syntax no. 3:
 * "Unnamed" query request with parameter.
 */
const GET_MOVIE_BY_NAME = gql`
  query ($name: String!) {
    movie(name: $name) {
      name
      yearOfPublication
    }
  }
`;

/**
 * Mutation - creating a new user
 *
 * The syntax is pretty mich the same here, providing the user data as parameter to the mutation
 * (the property will be then processed in the corresponding resolver).
 * Mutations can also send values in response (in this case it will be a User - the newly created one),
 * and we want the "name" and the "id" of the user.
 *
 * Query request syntax no. 4:
 * "Named" query request with parameter.
 */
const CREATE_USER_MUTATION = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      name
      id
    }
  }
`;

function DisplayData() {
  /**
   * useState
   *
   * It is for defining a variable (state), which will be used in the component's template and
   * also we will want to re-render the component when the value of the state changes.
   * When we call setMovieSearched("new value"), the component will get re-rendered with the new
   * value for the movieSearched. (So the value of the "movieSearched" is not mutated, the whole DisplayData function
   * gets called again on "setMovieSearched" call, with the newly initialized "movieSearched" variable with a new value.)
   */
  const [movieSearched, setMovieSearched] = useState("");

  // Create User States
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [age, setAge] = useState(0);
  const [nationality, setNationality] = useState("");

  /**
   * useQuery
   *
   * This will execute a GraphQL query (getting the data).
   * Executing the query will start immediately at this call. useQuery most probably utilizes the useState
   * hook under the hood - the query is started an when the response is available from the server, an useState call
   * is made and the component gets re-rendered (so the DisplayData gets called again).
   *
   * data - holding response from the query
   * loading - whether the query is loading or the response is already available
   * error - if the query ends with an error response
   * referch - if we want to trigger the query again
   *
   * options:
   * variables - if we have a query with parameter, we can provide those parameters there
   */
  const { data, loading, error, refetch } = useQuery(QUERY_ALL_USERS, {
    // variables: {}
  });

  const { data: movieData } = useQuery(QUERY_ALL_MOVIES);

  /**
   * useLazyQuery
   *
   * Same as useQuery, but the query will be not executed immediately, but on demand - so when the
   * "fetchMovie" function is called.
   *
   * If we have a parametric query, we can provide the parameters in the same way as in case of useQuery (through
   * the "variables" object) or we can provide them in the "fetchMovie" function itself (see below).
   */
  const [fetchMovie, { data: movieSearchedData, error: movieError }] =
    useLazyQuery(GET_MOVIE_BY_NAME, {
      // variables: {}
    });

  /**
   * useMutation
   *
   * Executing the mutation. It will work similar to the useLazyQuery, so the mutation won't execute immediately, but on
   * the call of the "createUser" function. Everything else is the same as at the useLazyQuery.
   */
  const [createUser] = useMutation(CREATE_USER_MUTATION, {
    // variables: {}
  });

  if (loading) {
    return <h1> DATA IS LOADING...</h1>;
  }

  if (error) {
    return <h1>Error happened: {error.message}</h1>;
  }

  return (
    <div>
      <div>
        <input
          type="text"
          placeholder="Name..."
          onChange={(event) => {
            setName(event.target.value);
          }}
        />
        <input
          type="text"
          placeholder="Username..."
          onChange={(event) => {
            setUsername(event.target.value);
          }}
        />
        <input
          type="number"
          placeholder="Age..."
          onChange={(event) => {
            setAge(event.target.value);
          }}
        />
        <input
          type="text"
          placeholder="Nationality..."
          onChange={(event) => {
            setNationality(event.target.value.toUpperCase());
          }}
        />
        <button
          onClick={() => {
            createUser({
              variables: {
                input: { name, username, age: Number(age), nationality },
              },
            });

            refetch();
          }}
        >
          Create User
        </button>
      </div>
      {/* TODO: why data.users and not just data? */}
      {data &&
        data.users.map((user) => {
          return (
            <div>
              <h1>Name: {user.name}</h1>
              <h1>Username: {user.username}</h1>
              <h1>Age: {user.age}</h1>
              <h1>Nationality: {user.nationality}</h1>
              <h1>
                Friends: {user.friends?.map((friend) => friend.name) ?? "none"}
              </h1>
            </div>
          );
        })}

      {movieData &&
        movieData.movies.map((movie) => {
          return <h1>Movie Name: {movie.name}</h1>;
        })}

      <div>
        <input
          type="text"
          placeholder="Interstellar..."
          onChange={(event) => {
            setMovieSearched(event.target.value);
          }}
        />
        <button
          onClick={() => {
            fetchMovie({
              variables: {
                name: movieSearched,
              },
            });
          }}
        >
          Fetch Data
        </button>
        <div>
          {movieSearchedData && (
            <div>
              <h1>MovieName: {movieSearchedData.movie.name}</h1>
              <h1>
                Year Of Publication: {movieSearchedData.movie.yearOfPublication}
              </h1>{" "}
            </div>
          )}
          {movieError && <h1> There was an error fetching the data</h1>}
        </div>
      </div>
    </div>
  );
}

export default DisplayData;
