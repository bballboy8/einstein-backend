const jwt = require("jsonwebtoken");
const User = require("../models/User");

require("dotenv").config();

exports.authToken = (req, res, next) => {
  let token = req.headers.authorization;

  if (!token) {
    return res.status(403).send({
      message: "No token provided!",
    });
  }

  jwt.verify(token, process.env.token_key, (err, decoded) => {
    if (err) {
      return res.status(401).send({
        message: "Unauthorized!",
      });
    }

    User.findOne({ email: decoded.email, _id: decoded.id })
      .then((user) => {
        if (!user) return res.status(405).json({ errors: "Not user" });
        req.user = user;
        console.log("middleware success");
        return next();
      })
      .catch((err) => {
        return res.status(500).send({ message: err.message });
      });
  });
};
