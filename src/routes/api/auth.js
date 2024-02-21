
var express = require("express");
var router = express.Router();
const AuthController = require("../../controllers/Auth.controller");

router.post("/signin", AuthController.SignIn);
router.post("/signup", AuthController.SignUp);
router.post("/update", AuthController.Update);
router.post("/getuser", AuthController.getUserData);

module.exports = router;
