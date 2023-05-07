exports.get404 = (req, res) => {
  res.render("errors/404.ejs", {
    pageTitle: "Page not found",
    cssLinks: null,
    path: ""
  })
}

exports.get500 = (req, res) => {
  res.render("errors/500.ejs", {
    pageTitle: "Server Error",
    cssLinks: null,
    path: "",
    errorMsg: req.flash("500_err")[0]
  })
}