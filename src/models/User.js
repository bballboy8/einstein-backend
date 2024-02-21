const mongoose = require("mongoose");

var UserSchema = new mongoose.Schema({

  full_name: {
    type: String,
    maxLength: 100,
  },
  username: {
    type: String,
    maxLength: 100,
  },
  email: {
    type: String,
  },
  password: {
    type: String,
    maxLength: 100,
  },
  price: {
    type: Number,
    maxLength: 100
  },
  company_name: {
    type: String,
    maxLength: 100
  },
  job_title: {
    type: String,
    maxLength: 100
  },
  use_case: {
    type: String,
    maxLength: 100
  }
}, {
  timestamps: true
});

var User = mongoose.model("users", UserSchema);

module.exports = User;
