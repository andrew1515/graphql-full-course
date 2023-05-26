import React, { useState } from "react";
import { useQuery, useLazyQuery, gql, useMutation } from "@apollo/client";

/**
 * Querying users
 *
 * We are using named query request. It is not required on queries (so when
 * we are getting data from the server), but it is requred on mutations and also
 * on queries with parameters.
 */
const QUERY_ALL_USERS = gql`
  query GetAllUsers {
    # The query name. For available queries, see type-defs.js
    # Then we provide all the fields what we want to load.
    users {
      id
      name
      age
      username
      nationality
      # The "friends" field is a nested one (it is a type User), so we
      # need to define the concrete fields here too.
      friends {
        name
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
 * Using unnamed query request. If we have a query (getting data) and we don't need
 * to provide any parameters, then we can use unnamed ones. Also for queries we can
 * avoid the "query" keyword here (we can't avoid it at mutations though).
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
 * Because we are providing parameters to the query, we need to have named query.
 *
 * How we can actually provide the "name" parameter to the query? Search for "fetchMovie" in
 * this file (you can provide a "variables" object into the query).
 */
const GET_MOVIE_BY_NAME = gql`
  query Movie($name: String!) {
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
  const [movieSearched, setMovieSearched] = useState("");

  // Create User States
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [age, setAge] = useState(0);
  const [nationality, setNationality] = useState("");

  const { data, loading, refetch } = useQuery(QUERY_ALL_USERS);
  const { data: movieData } = useQuery(QUERY_ALL_MOVIES);
  const [fetchMovie, { data: movieSearchedData, error: movieError }] =
    useLazyQuery(GET_MOVIE_BY_NAME);

  const [createUser] = useMutation(CREATE_USER_MUTATION);

  if (loading) {
    return <h1> DATA IS LOADING...</h1>;
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
