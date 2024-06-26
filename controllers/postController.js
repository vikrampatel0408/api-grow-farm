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
        roles: user.roles,
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
    const userId = req.params.id;
    const user = await User.findOne({ _id: userId });
    const { following } = user;
    let homePosts = await Post.find({ user: { $in: following } }).populate(
      "user",
      { name: 1, roles: 1, profilePicture: 1 }
    );
    homePosts = homePosts.map((post) => ({
      ...post.toObject(),
      name: post.user.name,
      roles: post.user.roles,
      profilePicture: post.user.profilePicture,
    }));
    homePosts.forEach((post) => {
      delete post.user;
      delete post.__v;
      delete post.updatedAt;
    });
    res.status(200).json({ result: homePosts });
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
  let user = await User.findById(id).select({ followers: 1, following: 1, profilePicture: 1, _id: 0 });
  try {
    let posts = await Post.find({ user: id })
      .select({
        updatedAt: 0,
        __v: 0,
      })
      .populate({
        path: "user",
        select: "name roles following followers profilePicture",
      });
      // console.log(posts);
    if (posts.length != 0) {
      const followers = posts[0].user.followers.length;
      const following = posts[0].user.following.length;
      const profilePicture = posts[0].user.profilePicture;
      //  console.log(profilePicture);

      posts = posts.map((post) => ({
        ...post.toObject(),
        name: post.user.name,
        roles: post.user.roles,
      }));
      posts.forEach((post) => {
        delete post.user;
      });
      res.status(200).json({ result: posts, followers: followers, following: following, profilePicture: profilePicture })
    } else {
      return res.status(200).json({
        result: [], followers: user.followers.length,
        following: user.following.length,
        profilePicture: user.profilePicture
      });
    }
  } catch (error) {
    res.status(500).json({
      message: "Internal server error"
    });
  }
};

const deletePost = async (req, res) => {
  const id = req.params.postId;
  try {
    const post = await Post.findById(id);
    if (post) {
      const publicId = post.postMedia[0];

      let cloudinary_publicId = publicId.split("/").pop();
      cloudinary_publicId = cloudinary_publicId.slice(0, -4);

      // console.log(publicId)
      cloudinary.v2.api.delete_resources([cloudinary_publicId], {
        type: "upload",
        resource_type: "image",
      });

      await Post.findByIdAndDelete(id);
      const user = await User.findById(post.user);
      if (user) {
        user.posts.pull(id);
        await user.save();
      }
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
const getComments = async (req, res) => {
  const postid = req.params.id;
  try {
    const Comments = await Post.findById(postid).select({ comments: 1 });
    // console.log(Comments);
    if (Comments.comments.length === 0) {
      return res.status(200).json({ comments:[] });
    }
    let postComments = await Comment.find({ _id: { $in: Comments.comments } })
      .select({ createdAt: 0, updatedAt: 0, __v: 0 }).populate("user", { name: 1, _id: 0 });
    postComments = postComments.map((comments) => ({
      ...comments.toObject(),
      _id: comments._id,
      username: comments.user.name,
    }))
    postComments.forEach((comments) => {
      delete comments.user;
    })
    console.log(postComments);
    return res.status(200).json({ comments: postComments });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
const getnoposts = async (req, res) => {
  let posts = await Post.find();
  posts = posts.map((post) => {
    return {
      roles: post.roles,
      likes: post.likes.length,
      createdAt: post.createdAt,
    };
  });
  res.status(200).json({ posts });
};
export {
  addPost,
  getPostsForHomePage,
  getUserPost,
  getPost,
  likePost,
  addComment,
  deletePost,
  getComments,
  getnoposts,
};
