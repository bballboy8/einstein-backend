const { DUPLICATED_EMAIL } = require("../config/constants");
const User = require("../models/User");

checkExistingEmail = async (req, res, next) => {
  const { email } = req.body;
  let user = await User.findOne({ email: email });
  if (user) {
    res.status(401).send({
      message: DUPLICATED_EMAIL,
    });
    return;
  }
  next();
};

const verifyUser = {
  checkExistingEmail: checkExistingEmail,
};

module.exports = verifyUser;
