const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const errorResponse = require("../utils/errroResponse");

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) {
    return next(new errorResponse("Not authorized to access this route", 401));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET);
    req.user = await User.findById(decoded.id).select("-password");
    if (!req.user) {
      return next(new errorResponse("No user found with this id", 404));
    }
    next();
  } catch (error) {
    return next(new errorResponse("Not authorized to access this route", 401));
  }
};

module.exports = { protect };
