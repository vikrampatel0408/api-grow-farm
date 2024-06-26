import express from "express";
import {
  registerUserF,
  registerUserS,
  authUser,
  getScheme,
  setPassword,
  followUser,
  getUserProfile,
  getUsers,
  unFollowUser,
  getFollowers,
  getFollowing,
  getnousers,
} from "../controllers/userController.js";
import { sendOTP, verifyOTP } from "../controllers/otpController.js";
import multer from "multer";
import { addFeedback, getFeedback } from "../controllers/feedbackController.js";
const router = express.Router();
const storage = multer.memoryStorage();
const multerUploads = multer({ storage }).single("file");

router.post("/follow/:id", followUser);
router.post("/unfollow/:id", unFollowUser);
router.get("/userprofile/:id", getUserProfile);
router.get("/getuserslist/:id", getUsers);
router.get("/getfollowers/:id", getFollowers);
router.get("/getfollowing/:id", getFollowing);
router.post("/regf", registerUserF);
router.post("/regs", multerUploads, registerUserS);
router.get("/schemes", getScheme);
router.post("/setPassword", setPassword);
router.post("/auth", authUser);
router.post("/twilio-sms/send-otp", sendOTP);
router.post("/twilio-sms/verify-otp", verifyOTP);
router.get("/getnousers", getnousers);
router.post("/feedback",addFeedback);
router.get("/feedback",getFeedback);
export default router;
