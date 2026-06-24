const mongoose = require("mongoose");

const postSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, "Post title is required"],
      trim: true,
      maxlength: 200
    },

    content: {
      type: String,
      required: [true, "Post content is required"]
    },

    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    category: {
      type: String,
      default: "General"
    },

    tags: [
      {
        type: String,
        trim: true
      }
    ],

    imageUrl: {
      type: String,
      default: ""
    },

    likes: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      }
    ],

    views: {
      type: Number,
      default: 0
    },

    isPublished: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Virtual field for total likes
postSchema.virtual("totalLikes").get(function () {
  return this.likes.length;
});

// Include virtuals when converting to JSON
postSchema.set("toJSON", { virtuals: true });
postSchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Post", postSchema);
