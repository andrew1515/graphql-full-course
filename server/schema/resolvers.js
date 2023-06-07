const DataLoader = require("dataloader");
const { GraphQLError } = require("graphql");
const _ = require("lodash");

const { UserList, MovieList } = require("../FakeData");

/**
 * Why do we need DataLoader?
 * Because in some cases there is a problem called "N+1 problem".
 * Let's have an example - you have the "users" query, which gets the list of all users.
 * Users can have a list of friends, which are also users. For the "friends" we have a separate
 * resolver.
 * What will now happen if we send this query to server:
 *
 * users {
 *   id
 *   friends {
 *     name
 *   }
 * }
 *
 * The resolver for the "users" query will run and then for EVERY user, then GraphQL will execute the "friends" resolver
 * for every user in the array separately. The "friends" resolver will see only
 * the concrete parent user in the "parent" function parameter, not the full list of users.
 *
 * This problem around this behavior is called N+1 problem (naming it 1+N, however, makes more sense), because the initial
 * resolver ("users") will run once, and then the "friends" resolver will run N times, depending on how many
 * users we will have.
 *
 * This is bad, because it can overload the database - imagine we have 200 users, then it means 201 DB queries - one for the users list, then
 * 200 other for the list of friends of every user. But only 2 queries should be enough - for all the "users", then collect the IDs of friends
 * run a query for all the friends of all users and then combine the data into final result.
 *
 * Here comes the DataLoader. It will collect every .load(id), .loadMany(ids) call and then in the next event loop tick,
 * it will execute the given function (getUsersByIds) for these collected IDs from "load" and "loadMany" calls.
 *
 * So in our case, the "friends" resolver will run for every user as we said above, but the .loadMany(friendIds) function will be called,
 * which will collect the list of friend IDs of the user. Then when GraphQL finishes looping through the users, event loop ticks and
 * DataLoader will execute the "getUsersByIds" function on the collected IDs to get the friends of the users. Then the promise from .loadMany() function
 * will resolve and we will get the friends list in the resolver for the given user (DataLoader will care about that, so .load() and .loadMany() function
 * will return only relevant data, not the full dataset loaded in the dataloader function - in our case "getUsersByIds").
 *
 * Why separate resolver for "friends"?
 * We should do separate resolvers for every field, which needs additional data load. The user's "name", "age", etc.
 * fields are loaded within the user object, but "friends" is only an array of IDs of users, which are friends of the given user.
 * In a real database, loading these "friends" will almost always need additional query.
 * - Okay, but why just don't do this additional query in the "users" resolver?
 * Because in that case we would lose one of the main benefits of GraphQL. We don't want to make the DB query if the GraphQL query from
 * the client isn't containing the "friends" field. But if we do the additional DB query in the "users" resolver, this fact will be ignored and
 * while it's true, that the "friends" field won't be returned in the response to the client, the additional DB query will be executed - completely
 * unneccessarily. But if we have a separate resolver for this "friends" field and the client query isn't containing the "friends" field,
 * the "friends" resolver won't be executed.
 *
 * .load() vs .loadMany()
 *
 * load - is used, when we have one-to-one relationship, so f.e. Book has an Author, so we will have .load(authorId)
 * loadMany - is used, when we have one-to-many relationship, so f.e. User has Friends, so we will have .loadMany(friendIds)
 *
 * More info:
 * https://medium.com/the-marcy-lab-school/how-to-use-dataloader-js-9727c527efd0
 * https://gajus.medium.com/using-dataloader-to-batch-requests-c345f4b23433
 * https://rahmanfadhil.com/graphql-dataloader/
 */
// --------------
const getUsersByIds = async (ids) => {
  return UserList.filter((user) => ids.includes(user.id));
};

const usersByIdLoader = new DataLoader(getUsersByIds);
// --------------

const resolvers = {
  /**
   * Resolvers for queries we defined in the Query type
   */
  Query: {
    users: () => {
      return UserList;
    },
    user: (parent, args) => {
      const id = args.id;
      const user = _.find(UserList, { id: Number(id) });

      if (!user) {
        /**
         * Throwing custom errors.
         */
        throw new GraphQLError(
          `User with ID ${id} not exists in the FakeData.js database`,
          {
            extensions: {
              // Overriding the default error code thrown by GraphQL
              code: "USER_NOT_EXISTS",
              // We can also add custom error properties
              userId: id,
            },
          }
        );
      }

      return user;
    },

    // MOVIE RESOLVERS
    movies: () => {
      return MovieList;
    },
    movie: (parent, args) => {
      const name = args.name;
      const movie = _.find(MovieList, { name });
      return movie;
    },
  },
  /**
   * But we can have resolvers for every type, not only for the main Query type.
   * How it will work?
   * Let's have the "user" query, which returns a User. User has a field named "friends",
   * which has a separate resolver. Then GraphQL will run the resolver for the "user" query, then
   * the resolver for the "friends" field and then he will combine all the data together and return
   * the final object in the response, which will include also all the "friends" of the user.
   *
   * Why is this useful and good practice? Read above the 'Why separate resolver for "friends"?' section.
   */
  User: {
    friends: (parent, args) => {
      const friendsIds = parent.friends;

      if (!friendsIds) {
        return [];
      }

      return usersByIdLoader.loadMany(friendsIds);
    },
    favoriteMovies: () => {
      return _.filter(
        MovieList,
        (movie) =>
          movie.yearOfPublication >= 2000 && movie.yearOfPublication <= 2010
      );
    },
  },
  Mutation: {
    createUser: (parent, args) => {
      const user = args.input;
      const lastId = UserList[UserList.length - 1].id;
      user.id = lastId + 1;
      UserList.push(user);
      return user;
    },
    updateUsername: (parent, args) => {
      const { id, newUsername } = args.input;
      let userUpdated;
      UserList.forEach((user) => {
        if (user.id === Number(id)) {
          user.username = newUsername;
          userUpdated = user;
        }
      });

      return userUpdated;
    },
    deleteUser: (parent, args) => {
      const id = args.id;
      _.remove(UserList, (user) => user.id === Number(id));
      return null;
    },
  },
};

module.exports = { resolvers };
