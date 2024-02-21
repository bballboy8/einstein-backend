// Directory Model

// const { ObjectId } = require("mongodb");

// const axios = require("axios");
const jwt = require("jsonwebtoken");
var bcrypt = require("bcryptjs");
const { isEmpty } = require("../utils/isEmpty");
const User = require("../models/User");

class AuthController {
  
  async SignIn(req, res) {
    console.log('start')
    try {
      let user = await User.findOne({ username: req.body.username });
      if (isEmpty(user)) {
        console.log('not found')
        return res.status(201).json({ message: "Not user found" });
      }
      if(user.password == req.body.password) {
        console.log('success')
      } else {
        return res.status(201).json({ message: "Not password correctly" });
      }
      console.log(user)
      let name = user.firstname + " " + user.lastname
      const token = jwt.sign(
        { username: req.body.username, id: user._id },
        process.env.token_key,
        {
          expiresIn: 864000,
        }
      );
      return res.status(200).send({
        token: token,
        name: name,
        user_name: user.username,
        email: user.email,
        user_id: user._id,
        price: user.price
      });
    } catch (err) {
      res.status(500).send({ message: err.message });
    }
  }
  
  async SignUp(req, res) {
    let full_name = req.body.firstname + " " + req.body.lastname
    try {
      const new_user = new User({
        full_name: full_name,
        username: req.body.username,
        email: req.body.email,
        password: req.body.password,
        price: 5,
        company_name: "",
        job_title: "",
        use_case: ""
      });
      await new_user.save();
      res.status(200).send({ message: "Registered successfully" })
    } catch(error) {
      console.log(error)
    }
  }

  async Update(req, res) {
    try {
      await User.updateOne(
        { email: req.body.data.email },
        { $set: {
            full_name: req.body.data.name,
            username: req.body.data.username,
            company_name: req.body.data.company_name,
            job_title: req.body.data.job_title,
            use_case: req.body.data.use_case
        }}
      );
      res.status(200).json({message: "Updated successfully"})
    } catch (err) {
      console.log(err)
    }
  }

  async getUserData(req, res) {
    User.find({ email: req.body.email }).then((userData) => {
      console.log(userData)
      res.status(200).json({data: userData})
    });
  }

}

module.exports = new AuthController();
