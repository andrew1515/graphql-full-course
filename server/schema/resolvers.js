const DataLoader = require("dataloader");
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
  Query: {
    // USER RESOLVERS
    users: () => {
      return UserList;
    },
    user: (parent, args) => {
      const id = args.id;
      const user = _.find(UserList, { id: Number(id) });
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
  User: {
    friends: (parent) => {
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
