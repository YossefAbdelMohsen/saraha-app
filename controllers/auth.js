const User = require("../models/user");
const Message = require("../models/message");

const { validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const crypto = require("crypto");


// Mails
const nodemailer = require("nodemailer");
const sendGridTransport = require("nodemailer-sendgrid-transport");
const { join } = require("path");
const { readdir, unlink, access, constants } = require("fs");

const transporter = nodemailer.createTransport(sendGridTransport({
  auth: {
    api_user: process.env.SEND_GRID_API_KEY 
  }
}));


exports.getLogin = (req, res) => {
  const flashMsg  = req.flash("error")[0];
  res.render("auth/login.ejs", {
    pageTitle: "Login",
    cssLinks: ["forms.css"],
    path: "/login",
    errorMsg: flashMsg
  });
};

exports.postLogin = (req, res) => {
  const email = req.body.email;
  const password = req.body.password;

  User.findOne({email: email}).then(user => {


    if(!user) {
      req.flash("error", "Can't find user with this email, Try signing up instead");
      return res.redirect("/login");
    } else {

      bcrypt.compare(password, user.password).then((doMatch) => {
        if(doMatch) {
          req.session.user = user;
          req.session.isLoggedIn = true;
          req.session.save();
          user.save().then(() => res.redirect("/"));
        } else {
          req.flash("error", "Incorrect password");
          return res.redirect("/login");
        }
      })

      
    }

  });
}

exports.getSignup = (req, res) => {
  res.render("auth/signup.ejs", {
    pageTitle: "Signup",
    cssLinks: ["forms.css"],
    path: "/signup",
    errorMsg: req.flash("error")[0],
    oldInputs: null,
  });
};

exports.postSignup = (req, res) => {
  const email = req.body.email;
  const username = req.body.username;

  const msgs = validationResult(req);
  let errorMsg;
  let oldInputs;
  if (!msgs.isEmpty()) {
    errorMsg = msgs.array()[0].msg;
    oldInputs = {
      username,
      email,
    };

    return res.render("auth/signup.ejs", {
      pageTitle: "Signup",
      cssLinks: ["forms.css"],
      path: "/signup",
      errorMsg,
      oldInputs,
    });
  } else {
    User.findOne({email}).then(user => {
      if(user) {
        req.flash('error', 'User already existed');
        return res.redirect("/signup");
      } 

      bcrypt.hash(req.body.password, 12).then(hashedPassword => {
        const newUser = new User({
          username,
          email,
          password: hashedPassword,
        });

        newUser.save().then(() => res.status(302).redirect("/login"));
      })

      
    })
  }
};

exports.getLogout = (req, res) => {
  req.session.destroy();
  res.redirect("/");
}

exports.getProfile = (req, res, next) => {
  const userId = req.params.userId;

  User.findById(userId).then(user => {
    if(!user) {
      return next("Failed to get user");
    }

    const errors = req.flash("error");

    res.render("auth/profile.ejs", {
      pageTitle: user.username + " Profile",
      cssLinks: ["forms.css"],
      path: "/profile",
      errorMsg: errors.length > 0 ? errors[0] : null,
      user
    })
  }).catch(err => {
    return next("Error while trying to get profie, Try again please!");
  });
}

exports.postProfile = (req, res, next) => {
  
  const userId = req.params.userId;

  User.findById(userId).then(user => {

    // Validation Errors
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      return res.render("auth/profile.ejs", {
        pageTitle: user.username + " Profile",
        cssLinks: ["forms.css"],
        path: "/profile",
        errorMsg: errors.array()[0].msg,
        user
      })
    }
    //

    if(req.file) {
      user.profileImg = `/images/${req.file.filename}`;
    } else if(!req.file && req.body.username === user.username) {
      req.flash("error", "Can't save, Profile pic. or username must change");
      return res.redirect("/profile/"+user._id);
    }

    user.username = req.body.username;

    user.save().then(() => {
      res.redirect("/");
    })
  })

}

exports.getDeleteUser = (req, res, next) => {
  const userId = req.params.userId;
  

  res.render("auth/confirm-deletion.ejs", {
    pageTitle: "Confirm Deletion",
    path: "",
    cssLinks: ["forms.css"],
    userId
  })

  // User.deleteOne({});
  
  // readdir(filesPath, (err, files) => {
  //   if(err) {
  //     return next("Error while deleting  user try again!");
  //   }
  // });
}

exports.postDeleteUser = (req, res, next) => {
  const userId = req.params.userId;
  const filesPath = join(require.main.filename, "..", "util", "images");
  let profilePicPath;

  
  User.findOneAndDelete({_id: userId}).then((user) => {
    if(!user) {
      return res.redirect("/login");
    }

    // Delete Messages
    return Message.findOneAndDelete({userId: userId}).then((msgs) => {
      // End Session
      req.session.destroy();

      // Delete Profile Picture
      readdir(filesPath, (err, files) => {
        if(err) {
          return;
        }

        const fileName = files.find(file => file.includes(userId));
        if(!fileName) {
          return;
        }
        profilePicPath = join(filesPath, fileName);

        access(profilePicPath, constants.F_OK, err => {
          if(!err) {
            unlink(profilePicPath, (err) => {
              console.log(err);
            })
          }
        })
      });

      // Redirect
      return res.redirect("/");
      })

  })
  .catch((err) => next("Can't perform this operation"))
}

exports.getResetPassword = (req, res) => {
  const errors = req.flash("error");
  

  if(req.user) {
    res.render("auth/reset.ejs", {
      pageTitle: "Reset email",
      cssLinks: ["forms.css"],
      path: "",
      the__email: req.user.email,
      errorMsg: errors.length > 0 ? errors[0] : null,
      POST: false
    })
  } else {
    res.render("auth/reset.ejs", {
      pageTitle: "Reset email",
      cssLinks: ["forms.css"],
      path: "",
      the__email: "",
      errorMsg: errors.length > 0 ? errors[0] : null,
      POST: false
    })
  }
}

exports.postResetPassword = (req, res) => {
  const email = req.body.email;
  const errors = validationResult(req);

  if(!errors.isEmpty()) {
    return res.render("auth/reset.ejs", {
      pageTitle: "Reset email",
      cssLinks: ["forms.css"],
      path: "",
      the__email: "",
      errorMsg: errors.array()[0].msg
    })
  }

  User.findOne({email: email}).then(user => {
    if(!user) {
      req.flash("error", "Please enter an existed email");
      return res.redirect("/reset");
    }
    return crypto.randomBytes(32, (err, buffer) => {
      const resetToken = buffer.toString('hex');
      const resetTokenDate = Date.now() + 60*60*1000;

      user.resetToken = resetToken;
      user.resetTokenDate = resetTokenDate;

      return user.save().then(() => {
        const fullDomain  = req.protocol + "://" + req.get("host") + "/reset/"+resetToken;

        transporter.sendMail({
          to: email,
          from: "sarahateamnodeapp@gmail.com",
          subject: "Reset Password",
          html: `
            <p> You requested a reset password </p>
            
            <p> <a href="${fullDomain}">Click Here</a> to reset a password </p>

            <p> Please beware that this link is avalible for 1 hour </p>
          `
        })
        .then(() => {
          return res.render("auth/reset.ejs", {
            pageTitle: "Reset email",
            cssLinks: ["forms.css"],
            path: "",
            the__email: req.body.email,
            errorMsg: errors.length > 0 ? errors[0] : null,
            POST: true
          })
        });
          })
        })

  })
  .catch(err => next("Error while sending the email, please try again!"));

}

exports.getResetForm = (req, res) => {

  const resetToken = req.params.resetToken;

  User.findOne({resetToken: resetToken}).then(user => {
    if(!user) {
      req.flash("error", "The link is expired");
      return res.redirect("/reset");
    }
    if(user.resetTokenDate > Date.now()) {
      res.render("auth/reset-form.ejs", {
        pageTitle: "Reset password",
        cssLinks: ["forms.css"],
        path: "",
        errorMsg: null,
        resetToken: user.resetToken
      })
    } else {
      user.resetToken = null;
      user.resetTokenDate = null;

      user.save().then(() => {
        req.flash("error", "The link is expired");
        return res.redirect("/reset");
      })
    }
  })

  
}

exports.postResetForm = (req, res) => {
  const resetToken = req.params.resetToken;
  User.findOne({resetToken}).then(user => {
    
    if(!user) {
      req.flash("error", "The link is expired");
      return res.redirect("/reset");
    }
    
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      return res.render("auth/reset-form.ejs", {
        pageTitle: "Reset password",
        cssLinks: ["forms.css"],
        path: "",
        errorMsg: errors.array()[0].msg,
        resetToken: user.resetToken
      })
    }

    const password = req.body.password;

    bcrypt.hash(password, 12).then(hashedPassword => {
      user.password = hashedPassword;

      if(req.session) {
        req.session.destroy();
      }

      user.resetToken = null;
      user.resetTokenDate = null;

      user.save().then(() => {
        return res.redirect("/login");
      })
    })
  })
}
