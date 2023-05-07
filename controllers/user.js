const User = require("../models/user");
const Message = require("../models/message");



exports.getIndex = (req, res, next) => {
  if(req.isLoggedIn) {
    const userId = req.user._id;
    return User.findById(userId).then((user) => {
      if(!user) {
        return next("Error while getting user");
      }

      
      const userId = user._id;
      const fullDomain  = req.protocol + "://" + req.get("host") + "/send/"+userId;
      console.log(fullDomain)
      return res.render("user/index.ejs", {
        pageTitle: `Main page`,
        cssLinks: ['index.css'],
        path: "/",
        user: user,
        link: fullDomain
      });
    })
    
  }

  res.render("user/index.ejs", {
    pageTitle: "Main page",
    cssLinks: ['index.css'],
    path: "/",
    user: null,
    link: null
  })
}

exports.getMessages = (req, res, next) => {
  const userId = req.params.userId;
  User.findById(userId).then(user => {
    if(!user) {
      throw new Error("User Error");
    }

    Message.findOne({userId: user._id}).then(messages => {

      if(!messages) {
        return res.render("user/messages.ejs", {
          pageTitle: "Messages page",
          cssLinks: ['messages.css'],
          path: "/messages",
          user,
          messages: null
        });
      }

      res.render("user/messages.ejs", {
        pageTitle: "Messages page",
        cssLinks: ['messages.css'],
        path: "/messages",
        user,
        messages: messages.messages
      })
    })

    
  })
  .catch(() => {
    return next("Can't find your messages, Please try again!");
  })
  
}

exports.getDeleteMessage = (req, res) => {
  const msgId = req.params.msgId;

  if(!req.user) {
    return res.redirect("/login");
  }

  Message.findOne({userId: req.user._id}).then(msgs => {
    if(!msgs) {
      return res.redirect("/messages/"+req.user._id);
    }
    msgs.messages = msgs.messages.filter((msg) => msg._id.toString() !== msgId);
    
    
    return msgs.save().then(() => res.redirect("/messages/" + req.user._id));
  })
}

exports.getSendMessage = (req, res, next) => {
  const userId = req.params.userId;

  if(req.isLoggedIn) {
    if(userId === req.user._id.toString()) {
      return res.redirect("/");
    }
  }


  User.findById(userId).then((user) => {
    if(!user) {
      return next("Can't find user");
    }

    res.render("user/send.ejs", {
      pageTitle: "Send to " + user.username,
      cssLinks: ["send.css"],
      path: "",
      user,
      errorMsg: req.flash("error")[0]
    })
  })
}

exports.postSendMessage = (req, res, next) => {
  const userId = req.params.userId;
  const msg = req.body.message;

  if(req.isLoggedIn) {
    if(userId === req.user._id.toString()) {
      return res.redirect("/");
    }
  }

  User.findById(userId).then(user => {
    if(!user) {
      return res.redirect("/");
    }

    if(msg.length < 3) {
      req.flash("error", "Message can't be less 3 characters!");

      return res.redirect("/send/" + userId)
    } else if(msg.length > 200) {
      req.flash("error", "Message can't be longer than 200 characters!");
      return res.redirect("/send/" + userId)
    }

    Message.findOne({userId: user._id}).then(messages => {

      if(!messages) {
        const newMsg = new Message({
          messages: [{
            text: msg
          }],
          userId: user._id
        })

        newMsg.save().then(() => res.redirect("/")).catch(err => {
          return next("Error while trying to save message, Try again!")
        })
      } else {
        messages.messages.push({text: msg});

        messages.save().then(() => res.redirect("/")).catch(err => {
          return next("Error while trying to save message, Try again!")
        })
      }
    })

    
  })
}

