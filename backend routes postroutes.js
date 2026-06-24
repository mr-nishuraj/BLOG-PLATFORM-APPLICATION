const express = require("express");
const Post = require("../models/Post");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

/*
========================================
CREATE POST
POST /api/posts
========================================
*/
router.post("/", authMiddleware, async (req, res) => {
  try {
    const { title, content, category, tags, imageUrl } = req.body;

    const post = await Post.create({
      title,
      content,
      category,
      tags,
      imageUrl,
      author: req.user._id
    });

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      post
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to create post",
      error: error.message
    });
  }
});

/*
========================================
GET ALL POSTS
GET /api/posts
========================================
*/
router.get("/", async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author", "username email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: posts.length,
      posts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch posts",
      error: error.message
    });
  }
});

/*
========================================
GET SINGLE POST
GET /api/posts/:id
========================================
*/
router.get("/:id", async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author", "username email bio");

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    // Increase view count
    post.views += 1;
    await post.save();

    res.json({
      success: true,
      post
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch post",
      error: error.message
    });
  }
});

/*
========================================
UPDATE POST
PUT /api/posts/:id
========================================
*/
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { title, content, category, tags, imageUrl } = req.body;

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to edit this post"
      });
    }

    post.title = title || post.title;
    post.content = content || post.content;
    post.category = category || post.category;
    post.tags = tags || post.tags;
    post.imageUrl = imageUrl || post.imageUrl;

    await post.save();

    res.json({
      success: true,
      message: "Post updated successfully",
      post
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update post",
      error: error.message
    });
  }
});

/*
========================================
DELETE POST
DELETE /api/posts/:id
========================================
*/
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    if (post.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this post"
      });
    }

    await Post.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Post deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete post",
      error: error.message
    });
  }
});

/*
========================================
LIKE / UNLIKE POST
PUT /api/posts/like/:id
========================================
*/
router.put("/like/:id", authMiddleware, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    const alreadyLiked = post.likes.includes(req.user._id);

    if (alreadyLiked) {
      post.likes = post.likes.filter(
        (id) => id.toString() !== req.user._id.toString()
      );
    } else {
      post.likes.push(req.user._id);
    }

    await post.save();

    res.json({
      success: true,
      message: alreadyLiked
        ? "Post unliked"
        : "Post liked",
      totalLikes: post.likes.length
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Like action failed",
      error: error.message
    });
  }
});

module.exports = router;
