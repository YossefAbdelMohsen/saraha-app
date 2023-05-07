const express = require("express");
const app = express();

// Built in modules
const { join, extname } = require("path");

// Body parser
const bodyParser = require("body-parser");

app.use(bodyParser.urlencoded({ extended: true }));

// Cookie Parser
const cookieParser = require("cookie-parser");
app.use(cookieParser());

// Flash
const flash = require("connect-flash");
app.use(flash());

// Static Files
app.use(express.static(join(__dirname, "views", "public")));
app.use("/images", express.static(join(__dirname, "util", "images")));

// Sessions
const MONGO_URI = process.env.MONGO_URI;

const session = require("express-session");
const { default: mongoose } = require("mongoose");
const mongoSession = require("connect-mongodb-session")(session);

const store = new mongoSession({
  uri: MONGO_URI,
  collection: "session",
});

app.use(
  session({
    secret: "saraha_app_secret",
    saveUninitialized: false,
    resave: false,
    store,
    cookie: {
      httpOnly: true,
    },
  })
);

// Save user to req

app.use((req, res, next) => {
  req.user = req.session.user;
  req.isLoggedIn = req.session.isLoggedIn;
  res.locals.isAuthed = req.session.isLoggedIn;

  if (req.session.user) {
    res.locals.userId = req.session.user._id;
  }

  next();
});

// Multer
const multer = require("multer");

const fileStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, join("util", "images"));
  },

  filename: (req, file, cb) => {
    const fileName = req.user._id + extname(file.originalname);

    const filesPath = join(__dirname, "util", "images");

    readdir(filesPath)
      .then((files) => {
        if (req.user) {
          files.map((file) => {
            if (file.includes(req.user._id.toString())) {
              return unlink(join(filesPath, file), (err) => {
                if (err) {
                  return;
                }
              });
            }
          });
        }
      })
      .then(() => cb(null, fileName));
  },
});

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    cb(null, true);
  } else {
    cb(null, false);
  }
};

const upload = multer({ fileFilter, storage: fileStorage });

app.use(upload.single("avatar"));

// Routes
const authRoute = require("./routes/auth");
const errorsHandler = require("./routes/error");
const userRoute = require("./routes/user");
const { readdir } = require("fs/promises");
const { unlink } = require("fs");

app.use(userRoute);
app.use(authRoute);
app.use(errorsHandler);

// Error Handler
app.use((error, req, res, next) => {
  req.flash("500_err", error);
  res.redirect("/server_error");
});

//

const port = process.env.PORT || 3000;
mongoose.connect(MONGO_URI).then(() => {
  app.listen(port);
});
