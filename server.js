const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");

// Create connection with mongo
mongoose
  .connect(process.env.MLAB_URI || "mongodb://localhost/exercise-track", {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .catch(error => console.error(error));

app.use(cors());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/views/index.html");
});

// create schema and model for mongo docs
var Schema = mongoose.Schema;
var userSchema = new Schema({
  username: String,
  exerciseLog: Array,
  exerciseCount: Number
});
var userModel = mongoose.model("user", userSchema);

// get all users
app.get("/api/exercise/users", function(req, res) {
  console.log("requesting users");
  userModel.find({}, function (err, users) {
    if (err) return console.error(err);
    res.json(users);
  });
});

// post new user
app.post("/api/exercise/new-user", function(req, res) {
  var newUser = new userModel({username: req.body.username});
  newUser.save(function (err, newUser) {
    if (err) return console.error(err);
  });
  console.log("Greetings " + newUser);
  res.json(newUser);
});

// post exercise to user
app.post("/api/exercise/add", function(req, res) {
  console.log("Adding exercise: " + req.body);
  var exercise = req.body;
  var doc = userModel.findById(reqexercise);

})

// Not found middleware
app.use((req, res, next) => {
  return next({ status: 404, message: "not found" });
});

// Error Handling middleware
app.use((err, req, res, next) => {
  let errCode, errMessage;

  if (err.errors) {
    // mongoose validation error
    errCode = 400; // bad request
    const keys = Object.keys(err.errors);
    // report the first validation error
    errMessage = err.errors[keys[0]].message;
  } else {
    // generic or custom error
    errCode = err.status || 500;
    errMessage = err.message || "Internal Server Error";
  }
  res
    .status(errCode)
    .type("txt")
    .send(errMessage);
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log("Your app is listening on port " + listener.address().port);
});
