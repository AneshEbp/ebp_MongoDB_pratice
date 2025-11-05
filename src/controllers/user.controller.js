import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import User from "../model/user.model.js";

const hashedPasswordfunc = async (password) => {
  try {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
  } catch (err) {
    throw new Error("Password hashing failed.");
  }
};

export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;
console.log(req.body);
  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required." });
  }

  try {
    const hashedPassword = await hashedPasswordfunc(password);
    const newUser = new User({
      name: username,
      email,
      hashedPassword: hashedPassword,
    });

    await newUser.save();
    return res.status(201).json({ message: "User registered successfully." });
  } catch (err) {
    return res.status(500).json({ message: "Server error." });
  }
};

export const verifyUser = async (req,res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    if (!user) {
      return false;
    }
    user.verified = true;
    await user.save();
    return res.status(200).json({ message: "User verified successfully." });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
};

const comparePassword = async (password, hashedPassword) => {
  try {
    const isMatch = await bcrypt.compare(password, hashedPassword);
    if (!isMatch) {
      return false;
    }
    return true;
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
};

export const loginUser = async (req, res) => {
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "Invalid email or password." });
    }
    const isPasswordValid = await comparePassword(
      password,
      user.hashedPassword
    );
    if (!isPasswordValid) {
      return res.status(400).json({ message: "Invalid email or password." });
    }
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    return res.status(200).json({ token });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
};

export const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId, { hashedPassword: 0 });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }
    return res.status(200).json(user);
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
};

export const updateUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const {updates} = req.body;
    console.log("Received updates:", updates.username);
    if (!userId) {
      return res.status(400).json({ message: "User ID is required." });
    }
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    if (updates.password) {
      user.hashedPassword = await hashedPasswordfunc(updates.password);
    }
    if (updates.username) {
      console.log("Updating username:", updates.username);
      user.name = updates.username;
    }
    if (updates.ph_no) {
      console.log("Updating phone number:", updates.ph_no);
      user.ph_no = updates.ph_no;
    }
    await user.save();
    return res.status(200).json({ message: "Profile updated successfully." });
  } catch (err) {
    res.status(500).json({ message: "Server error." });
  }
};
