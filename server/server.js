const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");

const app = express();
require("dotenv").config();

mongoose.Promise = global.Promise;
mongoose.connect(process.env.DATABASE, { useNewUrlParser: true });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// ========== Models ========== //
const { User } = require("./models/user");

// ========== USERS ========== //
app.post("/api/users/register", (req, res) => {
  res.status(200).send("test");
});

const port = process.env.PORT || 3002;

app.listen(port, () => {
  console.log(`Server running at ${port} ...`);
});
