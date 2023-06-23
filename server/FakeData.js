const UserList = [
  {
    id: 1,
    name: "John",
    username: "john",
    age: 20,
    nationality: "CANADA",
    friends: [2, 5],
  },
  {
    id: 2,
    name: "Pedro",
    username: "PedroTech",
    age: 20,
    nationality: "BRAZIL",
  },
  {
    id: 3,
    name: "Sarah",
    username: "cameron",
    age: 25,
    nationality: "INDIA",
    friends: [2],
  },
  {
    id: 4,
    name: "Rafe",
    username: "rafe123",
    age: 60,
    nationality: "GERMANY",
    friends: [3, 5],
  },
  {
    id: 5,
    name: "Kelly",
    username: "kelly2019",
    age: 5,
    nationality: "CHILE",
  },
];

const AdminList = [
  {
    id: 1,
    name: "Andrew",
    username: "andrew001",
    role: "SUPERADMIN",
  },
  {
    id: 2,
    name: "Chris",
    username: "chris007",
    role: "ADMIN",
  },
  {
    id: 3,
    name: "Jaro",
    username: "huskylover64",
    role: "ADMIN",
  },
];

const MovieList = [
  {
    id: 1,
    name: "Avengers Endgame",
    yearOfPublication: 2019,
    isInTheaters: true,
  },
  {
    id: 2,
    name: "Interstellar",
    yearOfPublication: 2007,
    isInTheaters: true,
  },
  {
    id: 3,
    name: "Superbad",
    yearOfPublication: 2009,
    isInTheaters: true,
  },
  {
    id: 4,
    name: "PedroTech The Movie",
    yearOfPublication: 2035,
    isInTheaters: false,
  },
];

module.exports = { UserList, AdminList, MovieList };
