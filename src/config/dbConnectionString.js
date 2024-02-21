
const config = require("./config");
const { username, password, DB } = config;
module.exports = {
  dbString: () => {
    return `mongodb+srv://${username}:${password}@cluster0.mjgbz1t.mongodb.net/${DB}`;
  },
};
