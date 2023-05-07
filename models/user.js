const {Schema, model} = require("mongoose");

const userSchema = new Schema({
  username: {
    type: String,
    required: true
  },
  profileImg: {
    type: String,
    default: "/images/default_user.png"
  },
  email: {
    type: String,
    lowercase: true,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  resetToken: {
    type: String,
    default: null
  },
  resetTokenDate: {
    type: Date,
    default: null
  }
});


module.exports = model("User", userSchema);