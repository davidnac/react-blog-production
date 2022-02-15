
const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema ({
    username: {
        type: String,
        required: true,
        unique: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: false
    },
    role: {
        type: String,
        required: true
    },
    profilePic: {
        type: String,
        default: ""
    },
    bookmarks: {
        type: Array,
        required: false,
    },
    googleId: {
        type: String
    },  
    facebookId: {
        type: String
    },  
  },
  {timestamps: true}
  );

  //module.exports = mongoose.model("User", UserSchema);

  module.exports = {
    schema: UserSchema,
    model: mongoose.model("User", UserSchema),
};