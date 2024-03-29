const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const mongoose = require("mongoose");
mongoose.set("useCreateIndex", true);

const app = express();
require("dotenv").config();

mongoose.Promise = global.Promise;
mongoose.connect(process.env.DATABASE, { useNewUrlParser: true });

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(cookieParser());

// ========== Models ========== //
const { User } = require("./models/user");
const { Brand } = require("./models/brand");
const { Wood } = require("./models/wood");
const { Product } = require("./models/product");

// ========== Middlewares ========== //
const { auth } = require("./middleware/auth");
const { admin } = require("./middleware/admin");

// ========== PRODUCTS ========== //

// BY ARRIVAL
// "/api/product/articles?sortBy=createdAt&order=desc&limit=10&skip=5"
// BY SOLD QTY
// "/api/product/articles?sortBy=sold&order=desc&limit=4"
app.get("/api/product/articles", (req, res) => {
  const order = req.query.order || "asc";
  const sortBy = req.query.sortBy || "_id";
  const limit = parseInt(req.query.limit) || 100;
  // const skip = req.query.skip || 0;

  Product.find()
    .populate("brand")
    .populate("wood")
    .sort([[sortBy, order]])
    .limit(limit)
    .exec((err, articles) => {
      if (err) return res.status(400).send(err);
      res.send(articles);
    });
});

// /api/product/articles_by_id?id=90f09sdf,3490fdsf,dsdf903&type=array
// /api/product/articles_by_id?id=90f09sdf&type=single
app.get("/api/product/articles_by_id", (req, res) => {
  const type = req.query.type;
  let items = req.query.id;

  if (type === "array") {
    const ids = items.split(",");
    items = [];
    items = ids.map(item => {
      return mongoose.Types.ObjectId(item);
    });
  }

  Product.find({ _id: { $in: items } })
    .populate("brand")
    .populate("wood")
    .exec((err, docs) => {
      return res.status(200).send(docs);
    });
});

app.post("/api/product/article", auth, admin, (req, res) => {
  const product = new Product(req.body);

  product.save((err, doc) => {
    if (err) return res.json({ success: false, err });
    res.status(200).json({ success: true, article: doc });
  });
});

// ========== WOOD ========== //

app.post("/api/product/wood", auth, admin, (req, res) => {
  const wood = new Wood(req.body);

  wood.save((err, doc) => {
    if (err) return res.json({ success: false, err });

    res.status(200).json({ success: true, wood: doc });
  });
});

app.get("/api/product/woods", (req, res) => {
  Wood.find({}, (err, woods) => {
    if (err) return res.status(400).send(err);

    res.status(200).send(woods);
  });
});

// ========== BRAND ========== //

app.post("/api/product/brand", auth, admin, (req, res) => {
  const brand = new Brand(req.body);

  brand.save((err, doc) => {
    if (err) return res.json({ success: false, err });

    res.status(200).json({ success: true, brand: doc });
  });
});

app.get("/api/product/brands", (req, res) => {
  Brand.find({}, (err, brands) => {
    if (err) return res.status(400).send(err);

    res.status(200).send(brands);
  });
});

// ========== USER ========== //

app.get("/api/users/auth", auth, (req, res) => {
  res.status(200).json({
    isAdmin: req.user.role === 0 ? false : true,
    isAuth: true,
    email: req.user.email,
    name: req.user.name,
    lastname: req.user.lastname,
    role: req.user.role,
    cart: req.user.cart,
    history: req.user.history
  });
});

app.post("/api/users/register", (req, res) => {
  const user = new User(req.body);

  user.save((err, doc) => {
    if (err) return res.json({ success: false, err });

    res.status(200).json({
      success: true
    });
  });
});

app.post("/api/users/login", (req, res) => {
  User.findOne({ email: req.body.email }, (err, user) => {
    if (!user)
      return res.json({
        loginSuccess: false,
        message: "Auth failed, email not found"
      });

    user.comparePassword(req.body.password, (err, isMatch) => {
      if (!isMatch)
        return res.json({ loginSuccess: false, message: "Wrong password" });

      user.generateToken((err, user) => {
        if (err) return res.status(400).send(err);

        res
          .cookie("w_auth", user.token)
          .status(200)
          .json({
            loginSuccess: true
          });
      });
    });
  });
});

app.get("/api/user/logout", auth, (req, res) => {
  User.findOneAndUpdate({ _id: req.user._id }, { token: "" }, (err, doc) => {
    if (err) return res.json({ success: false, err });
    return res.status(200).send({ success: true });
  });
});

const port = process.env.PORT || 3002;

app.listen(port, () => {
  console.log(`Server running at ${port} ...`);
});
