module.exports = (req, res, next) => {
  if(!req.isLoggedIn) {
    return res.redirect("/login");
  } else {
    if(req.user._id.toString() !== req.params.userId) {
      return res.redirect("/profile/"+req.user._id);
    }
  }
  next();
}