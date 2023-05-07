const express = require("express");
const route = express.Router();

const userControllers = require("../controllers/user");


route.get("/", userControllers.getIndex);

route.get("/messages/:userId", userControllers.getMessages);

route.get("/delete-message/:msgId", userControllers.getDeleteMessage);

route.get("/send/:userId", userControllers.getSendMessage);

route.post("/send/:userId", userControllers.postSendMessage);

module.exports = route;