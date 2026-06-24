const express = require("express");
const Comment = require("../models/Comment");
const Post = require("../models/Post");
const { authMiddleware } = require("../middleware/authMiddleware");

const router = express.Router();

/*
========================================
ADD COMMENT
POST /api/comments/:postId
========================================
*/
router.post("/:postId", authMiddleware, async (req, res) => {
  try {
    const { comment } = req.body;

    if (!comment || comment.trim() === "") {
      return res.status(400).json({
        success: false,
        message: "Comment cannot be empty"
      });
    }

    const post = await Post.findById(req.params.postId);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found"
      });
    }

    const newComment = await Comment.create({
      comment,
      author: req.user._id,
      post: req.params.postId
    });

    const populatedComment = await Comment.findById(newComment._id)
      .populate("author", "username email");

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comment: populatedComment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add comment",
      error: error.message
    });
  }
});

/*
========================================
GET COMMENTS OF A POST
GET /api/comments/post/:postId
========================================
*/
router.get("/post/:postId", async (req, res) => {
  try {
    const comments = await Comment.find({
      post: req.params.postId
    })
      .populate("author", "username email")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      count: comments.length,
      comments
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch comments",
      error: error.message
    });
  }
});

/*
========================================
UPDATE COMMENT
PUT /api/comments/:id
========================================
*/
router.put("/:id", authMiddleware, async (req, res) => {
  try {
    const { comment } = req.body;

    const existingComment = await Comment.findById(req.params.id);

    if (!existingComment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found"
      });
    }

    if (
      existingComment.author.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to edit this comment"
      });
    }

    existingComment.comment = comment;
    existingComment.isEdited = true;

    await existingComment.save();

    res.json({
      success: true,
      message: "Comment updated successfully",
      comment: existingComment
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to update comment",
      error: error.message
    });
  }
});

/*
========================================
DELETE COMMENT
DELETE /api/comments/:id
========================================
*/
router.delete("/:id", authMiddleware, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found"
      });
    }

    if (
      comment.author.toString() !==
      req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this comment"
      });
    }

    await Comment.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Comment deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to delete comment",
      error: error.message
    });
  }
});

/*
========================================
LIKE / UNLIKE COMMENT
PUT /api/comments/like/:id
========================================
*/
router.put("/like/:id", authMiddleware, async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found"
      });
    }

    const alreadyLiked = comment.likes.includes(
      req.user._id
    );

    if (alreadyLiked) {
      comment.likes = comment.likes.filter(
        (id) =>
          id.toString() !== req.user._id.toString()
      );
    } else {
      comment.likes.push(req.user._id);
    }

    await comment.save();

    res.json({
      success: true,
      message: alreadyLiked
        ? "Comment unliked"
        : "Comment liked",
      totalLikes: comment.likes.length
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
