import React, { useState } from "react";
import { useQuery, useLazyQuery, gql, useMutation } from "@apollo/client";

/**
 * Querying users
 *
 * Query request syntax no. 1:
 * This is a "named" query without parameters. It's a good practice to name the queries, it's easier to read and
 * it provides an unified syntax.
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
