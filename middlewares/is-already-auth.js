module.exports = (req, res, next) => {
  if(req.isLoggedIn) {
    return res.redirect("/");
  }

  next();
}