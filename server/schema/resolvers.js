const DataLoader = require("dataloader");
const { GraphQLError } = require("graphql");
const _ = require("lodash");

const { UserList, MovieList, AdminList } = require("../FakeData");

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
      /**
       * As we defined in type-defs, the "users" query can return either User-s and Admin-s
       * because of the UserAdmin union return type of the query. UserList contains both User-s and Admin-s.
       */
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
   * which has a separate resolver. GraphQL then will run the resolver for the "user" query, then
   * the resolver for the "friends" field and then he will combine all the data together and return
   * the final object in the response, which will include also all the "friends" of the user.
   *
   * Why is this useful and good practice? Read above the 'Why separate resolver for "friends"?' section.
   *
   * parent - it holds the resolved data of the previous level. Lets have a "user" query, which returns a User.
   *   The resolver for the query will execute the query, then check whether some fields of the User have
   *   some extra resolvers. They do, f.e. "friends", so GraphQL will execute the "friends" resolver for the
   *   "friends" field. The "parent" in this "friends" resolver will be the resolved value of the "user" query, without
   *   the values from the extra resolvers - so "friends" will be still an array of IDs in the "parent". That's the point,
   *   we are going to resolve these IDs in the "friends" resolver.
   *   Note, that the "parent" isn't a full User type, it is just a half-resolved one, so it can have also different fields.
   *   We don't have to be "friends" in the parent, we can have also "friendIds" - in this case we would have
   *   `const friendsIds = parent.friendIds;`. It is a good practice to have this unified, so every parent should have
   *   the list of friends IDs under the same property and not like parent from the "user" resolver will have "friends" and
   *   parent from the "users" resolver will have "friendIds"...
   *
   * args - accessing the query arguments
   * context - accessing the context (see index.js)
   * info - deep details about the GraphQL query
   */
  User: {
    friends: (parent, args, context, info) => {
      // It will contain the "customHeader" header - see App.jsx.
      // console.log(context.req.headers);
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
  /**
   * If a query is returning a union type, we need to define a resolver for the
   * union type itself. We need to define a special resolver called __resolveType, where we
   * need to write the logic for deciding, when to return which type from the union.
   * In our case we have the UserAdmin union type, which is union of the User and Admin types.
   * Admin type has a specific field "role", which the User type doesn't include, so
   * when the given object from the parent query (in our case "users") has a "role" property, it means
   * that we need to return the Admin type, otherwise the User type. We need to return the name of the
   * concrete GraphQL type.
   *
   * What is that "obj"?
   * It is basically the parent object (as we have it also in other resolvers, f.e. User.friends), we just
   * called it "obj", because I think it gives more sense in this case.
   * In our case, the "users" query is returning an array, so the __resolveType will be called for
   * every array element (as it works for other, regular resolvers, f.e. User.friends).
   *
   * Why is this needed even? Why we can't just have the "users" resolver, why is this "__resolveType" resolver needed?
   * GraphQL can't decide just according to the object in the array, which type they are, on other hand
   * GraphQL need to know the exact type for every item in the array. So we need to do this specific resolver.
   * A practical reason for this is in DisplayData.jsx.
   */
  UserAdmin: {
    __resolveType: (obj) => {
      if (obj.role) {
        return "Admin";
      }

      return "User";
    },
  },
  /**
   * Similar to union types, we need to define a special resolver (__resolveType) also
   * for interfaces. The reason is the same - GraphQL needs to know the exact type of the resolved data.
   * Currently the Movie interface is implemented by TvMovie and TheaterMovie type, so we should decide,
   * whether the current object has a TvMovie or TheaterMovie type.
   */
  Movie: {
    __resolveType: (obj) => {
      if (obj.yearFirstAired) {
        return "TvMovie";
      }

      return "TheaterMovie";
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
