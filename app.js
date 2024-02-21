// var createError = require("http-errors");
var cors = require("cors");
var bodyParser = require("body-parser");
var express = require("express");
var path = require("path");
// var cookieParser = require("cookie-parser");
// const fileupload = require("express-fileupload");
// var logger = require("morgan");
require("dotenv").config();
// Include Database config/connection
const config = require("./src/config/dbConnectionString");
const mongoose = require("mongoose");

const apiRouter = express.Router();

// Routes
var authRouter = require("./src/routes/api/auth");
var aiRouter = require("./src/routes/api/text");
var imgRouter = require("./src/routes/api/img");
var stripeRouter =  require("./src/routes/api/stripe")
var app = express();
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);

// app.use(fileupload());
app.use(express.static("file"));

//DB connection
mongoose.connect(config.dbString(), {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// view engine setup
app.set("views", path.join(__dirname, "src/views"));
app.set("view engine", "jade");

// Enable Cors
app.use(cors());

// app.use(logger("dev"));

app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

apiRouter.use("/auth", authRouter);
apiRouter.use("/ai", aiRouter);
apiRouter.use("/",stripeRouter);
apiRouter.use("/img", imgRouter);
app.use("/api", apiRouter);
app.use(express.json());

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render("error");
});

const PORT = process.env.PORT || 5000;
process.env.NODE_ENV = "production";

const server = app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}.`);
});

module.exports = app;
