const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const mongoose = require("mongoose");
const moment = require("moment");
moment().format();

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
  userModel.find({}, "_id, username", function (err, users) {
    if (err) return console.error(err);
    res.json(users);
  });
});

// get exercise log
app.get("/api/exercise/log?", function(req, res) {
  let id = req.query.userId;
  let from = req.query.from ? moment(new Date(req.query.from)).format("X") : 0; // set to 0 if not specified 
  let to = req.query.to ? moment(new Date(req.query.to)).format("X") : moment().format("X"); // set to now if not specified (b/c you cannot have an exercise in the future)
  let limit = req.query.limit ? req.query.limit : 0; // handled on line 9
  // find by _id
  userModel.findOne({
    _id: id
  }, 
  function(err, user) {
    if (err) return console.error(err);
    // filter exercise log by dates and push into array
    let exerciseArr = [];
    if (! limit) {
      limit = user.exerciseLog.length; // set to log length if no limit set
    }
    for (let exercise = 0; exercise < limit; exercise++) {
      let exDate = moment(user.exerciseLog[exercise].date, "X");
      if (user.exerciseLog[exercise].date > from && user.exerciseLog[exercise].date < to) {
        exerciseArr.push({ 
          description: user.exerciseLog[exercise].description,
          duration: user.exerciseLog[exercise].duration,
          date: exDate.format("dddd, MMMM Do YYYY, h:mm a")
        });
      }
    }
    console.log("getting log: " + exerciseArr);
    res.json({_id: user._id, username: user.username, log: exerciseArr, count: user.exerciseCount });
  });
});

// post new user
app.post("/api/exercise/new-user", function(req, res) {
  var newUser = new userModel({ username: req.body.username, exerciseLog: [], exerciseCount: 0 });
  newUser.save(function (err, newUser) {
    if (err) return console.error(err);
  });
  console.log("Greetings " + newUser);
  res.json({ _id: newUser._id, username: newUser.username });
});

// post exercise to user
app.post("/api/exercise/add", function(req, res) {
  console.log("Adding exercise");
  console.dir(req.body);
  userModel.findById(req.body._id, function(err, user) {
    if (err) return console.error(err);
    // construct the date
    if (!req.body.date) {
      var exerciseDate = new Date();
    }
    else {
      var exerciseDate = new Date(req.body.date);
      if (exerciseDate.toUTCString() === "Invalid Date") {
        console.log("Invalid Date, default to today.");
        exerciseDate = new Date();
      }
    }
    // format date using moment.js
    var momentDate = moment(exerciseDate).format("X");
    var outputDate = moment(exerciseDate).format("dddd, MMMM Do YYYY, h:mm a"); // A nice human readable date
    // construct the exercise to be logged
    var newExercise = { description: req.body.description, duration: req.body.duration, date: momentDate };
    user.exerciseCount++;
    user.exerciseLog.push(newExercise);
    user.save();
    res.json({ _id: user._id, username: user.username, description: newExercise.description, duration: newExercise.duration, date: outputDate  });
  });
});

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
