const express = require("express");
const route = express.Router();

const errorsControllers = require("../controllers/error");

route.get("/server_error", errorsControllers.get500);

route.use(errorsControllers.get404);


module.exports = route;