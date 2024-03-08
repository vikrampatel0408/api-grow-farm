import asyncHandler from "express-async-handler";
import Post from "../models/Post.js";
import User from "../models/User.js";
import { cloudinary } from "../config/cloudinary.js";
import path from "path";
import DataURIParser from "datauri/parser.js";
import Comment from "../models/Comment.js";

const addPost = asyncHandler(async (req, res) => {
  try {
    const { postTitle, userId, description } = req.body;
    const user = await User.findOne({ _id: userId });
    const postMedia = [];
    if (req.file) {
      console.log(req.file);
      const parser = new DataURIParser();
      const file = parser.format(
        path.extname(req.file.originalname).toString(),
        req.file.buffer
      );
      const uploadedResponse = await cloudinary.uploader.upload(file.content, {
        upload_preset: "growfarm",
      });
      console.log(uploadedResponse);

      postMedia.push(uploadedResponse.url);
    }

    if (user) {
      const post = await Post.create({
        postTitle: postTitle,
        user: userId,
        description: description,
        postMedia: postMedia,
      });
      console.log(post);
      user.posts.push(post._id);
      await user.save();
      res.status(200);
      res.json({
        message: "Post added successfully",
      });
    } else {
      res.status(400);
      res.json({
        message: "User does not Exist",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500);
    res.json({
      message: "Something went wrong",
    });
  }
});
const getPostsForHomePage = async (req, res) => {
  try {
    // const posts = await Post.aggregate([
    //   {
    //     $match: {
    //       likes: { $exists: true, $not: { $size: 0 } },
    //     },
    //   },
    //   {
    //     $addFields: {
    //       likesCount: { $size: "$likes" },
    //     },
    //   },
    //   {
    //     $match: {
    //       likesCount: { $gte: 10 },
    //     },
    //   },
    //   {
    //     $sort: { createdAt: -1 },
    //   },
    //   {
    //     $limit: 10,
    //   },
    // ]);
    // res.status(200).json(posts);
    const latestPosts = await Post.find().sort({ createdAt: -1 }).limit(10);
    res.status(200).json(latestPosts);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
};
const getUserPost = async (req, res) => {
  const id = req.params.id;
  try {
    const posts = await Post.find({ user: id }).select({
      user: 0,
      updatedAt: 0,
      __v: 0,
    });
    res.status(200);
    res.json({ result: posts });
  } catch (error) {
    res.status(500);
    res.json({
      message: "Something went wrong",
    });
  }
};
const deletePost = async (req, res) => {
  const id = req.params.postId;
  try {
    const post = await Post.findById(id);
    if (post) {
      await Post.findByIdAndDelete(id);
      res.status(200);
      res.json({
        message: "Post deleted successfully",
      });
    } else {
      res.status(404);
      res.json({
        message: "Post not found",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500);
    res.json({
      message: "Something went wrong",
    });
  }
};
const getPost = async (req, res) => {
  const id = req.params.postId;
  try {
    const post = await Post.findById(id)
      .populate("user")
      .populate("likes")
      .populate("comments");
    res.status(200);
    res.json(post);
  } catch (error) {
    res.status(500);
    res.json({
      message: "Something went wrong",
    });
  }
};

const likePost = async (req, res) => {
  const { userId } = req.body;
  const { postId } = req.params;
  try {
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.likes.includes(userId)) {
      return res.status(400).json({ message: "Post already liked" });
    }

    post.likes.push(userId);
    await post.save();

    res.status(200).json({ message: "Post liked successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
const addComment = async (req, res) => {
  const { postId } = req.params;
  console.log(postId);
  const { userId, commentDescription } = req.body;

  try {
    const post = await Post.findById(postId);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const comment = await Comment.create({
      commentDescription,
      user: userId,
    });

    post.comments.push(comment._id);
    await post.save();

    res.status(200).json({ message: "Comment added successfully." });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export {
  addPost,
  getPostsForHomePage,
  getUserPost,
  getPost,
  likePost,
  addComment,
  deletePost,
};
