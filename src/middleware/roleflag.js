import User from "../model/user.model.js";

export const roleflag = async (req, res, next) => {
  const userId = req.user.userId;
  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    req.userRole = user.role;
    next();
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
};
