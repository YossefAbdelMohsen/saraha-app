const {Schema, model} = require("mongoose");

const messageSchema = new Schema({
  messages: [{
    text: {
      type: String
    },
    sentAt: {
      type: Date,
      default: Date.now()
    }
  }],
  userId: {
    type: Schema.Types.ObjectId,
    ref: "User"
  }
});

module.exports = model("Message", messageSchema);