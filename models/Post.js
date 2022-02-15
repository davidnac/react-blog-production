   
const mongoose = require("mongoose");


const PostSchema = new mongoose.Schema(
  {
    header: {
      type: String,
      required: true,
      unique: true,
    },
    content: {
      type: String,
      required: false,
    },
    direction: {
      type: String,
      required: true,
    },
    coverImage: {
      type: String,
      required: false,
    },
    author: {
      type: String,
      required: true,
    },
    views: {
      type: Number,
      required: false,
    },
    date: {
      type: String,
      required: true,
    },
    categoryArray: {
      type: Array,
      required: false,
    },
    comments: {
      type: Array,
      required: false,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Post", PostSchema);