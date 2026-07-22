const express = require("express");
const { protect } = require("../middelwares/authMiddleware");
const {
  registerContoller,
  loginController,
  logoutController,
  getProfileController,
  updateProfileController,
  refreshTokenController,
  resetPasswordController,
} = require("../controllers/authController");

//router object
const router = express.Router();

//routes
// REGISTER
router.post("/register", registerContoller);

//LOGIN
router.post("/login", loginController);

//LOGOUT
router.post("/logout", logoutController);

//RESET PASSWORD
router.post("/reset-password", resetPasswordController);

//PROFILE
router.get("/profile", protect, getProfileController);
router.put("/profile", protect, updateProfileController);

//REFRESH TOKEN
router.get("/refresh-token", refreshTokenController);

module.exports = router;
