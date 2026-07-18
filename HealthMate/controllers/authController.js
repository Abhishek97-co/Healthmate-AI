const errorHandler = require("../middelwares/errorMiddleware");
const userModel = require("../models/userModel");
const errorResponse = require("../utils/errroResponse");

// JWT TOKEN
exports.sendToken = (user, statusCode, res) => {
  const token = user.getSignedToken(res);
  res.status(statusCode).json({
    success: true,
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      profile: user.profile,
    },
  });
};

//REGISTER
exports.registerContoller = async (req, res, next) => {
  try {
    const { username, email, password } = req.body;
    //exisitng user
    const exisitingEmail = await userModel.findOne({ email });
    if (exisitingEmail) {
      return next(new errorResponse("Email is already registered", 500));
    }
    const user = await userModel.create({ username, email, password });
    exports.sendToken(user, 201, res);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

//LOGIN
exports.loginController = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    //validation
    if (!email || !password) {
      return next(new errorResponse("Please provide email or password"));
    }
    const user = await userModel.findOne({ email });
    if (!user) {
      return next(new errorResponse("Invalid Credentials", 401));
    }
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return next(new errorResponse("Invalid Credentials", 401));
    }
    //res
    exports.sendToken(user, 200, res);
  } catch (error) {
    console.log(error);
    next(error);
  }
};

//LOGOUT
exports.logoutController = async (req, res) => {
  res.clearCookie("refreshToken");
  return res.status(200).json({
    success: true,
    message: "Logout Successfully",
  });
};

// GET USER PROFILE
exports.getProfileController = async (req, res, next) => {
  try {
    const user = await userModel.findById(req.user.id).select("-password");
    if (!user) {
      return next(new errorResponse("User not found", 404));
    }
    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};

// UPDATE USER PROFILE
exports.updateProfileController = async (req, res, next) => {
  try {
    const {
      age,
      gender,
      weight,
      height,
      vegpreference,
      healthGoal,
      healthProblem,
      allergy,
      locality,
    } = req.body;

    const user = await userModel.findById(req.user.id);
    if (!user) {
      return next(new errorResponse("User not found", 404));
    }

    user.profile = {
      age: age !== undefined ? age : user.profile.age,
      gender: gender !== undefined ? gender : user.profile.gender,
      weight: weight !== undefined ? weight : user.profile.weight,
      height: height !== undefined ? height : user.profile.height,
      vegpreference: vegpreference !== undefined ? vegpreference : user.profile.vegpreference,
      healthGoal: healthGoal !== undefined ? healthGoal : user.profile.healthGoal,
      healthProblem: healthProblem !== undefined ? healthProblem : user.profile.healthProblem,
      allergy: allergy !== undefined ? allergy : user.profile.allergy,
      locality: locality !== undefined ? locality : user.profile.locality,
    };

    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        profile: user.profile,
      },
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
};
