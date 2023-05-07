const express = require("express");
const route = express.Router();

const authControllers = require("../controllers/auth");

// Middlewares
const isAlreadyAuth = require('../middlewares/is-already-auth');
const authProtector = require("../middlewares/protect-with-id");

// Express validato
const { body } = require("express-validator");

route.get("/login", isAlreadyAuth, authControllers.getLogin);

route.post("/login", isAlreadyAuth, authControllers.postLogin);


route.get("/logout", authControllers.getLogout);

route.get("/signup", isAlreadyAuth, authControllers.getSignup);

route.post("/signup", isAlreadyAuth, 
[
  body('username')
  .isLength({min: 2, max: 20})
  .withMessage("Username must be 1 length at minimum and 20 at maximum"),
  body("email").isEmail().withMessage("Please enter your Email correctly"),
  body("password").isStrongPassword().withMessage("Please Enter a strong password"),
  body("confirmPassword").custom((value, {req}) =>  {
    if(value !== req.body.password) {
      throw new Error("Sorry passwords must match");
    } 

    return true;
  })
],
authControllers.postSignup);

route.get("/profile/:userId", authProtector, authControllers.getProfile);

route.post("/profile/:userId", authProtector, 
[
  body("username").isLength({min: 2, max: 20})
  .withMessage("Username must be 1 length at minimum and 20 at maximum")
]
,authControllers.postProfile);

route.get("/delete-user/:userId", authControllers.getDeleteUser);
route.post("/delete-user/:userId", authControllers.postDeleteUser);

route.get("/reset", authControllers.getResetPassword);
route.post("/reset", 
[
  body("email").isEmail().withMessage("Please enter a valid Email")
]
,authControllers.postResetPassword);

route.get("/reset/:resetToken", authControllers.getResetForm);

route.post("/reset/:resetToken", 
[
  body("password").isStrongPassword().withMessage("Please write a strong password"),
  body("confirmPassword").custom((value, {req}) =>  {
    if(value !== req.body.password) {
      throw new Error("Sorry passwords must match");
    } 

    return true;
  })
]
,authControllers.postResetForm);

module.exports = route;
