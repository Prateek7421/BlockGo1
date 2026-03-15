console.log("userAuth router loaded");

const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models");

const authrouter = express.Router();


authrouter.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "Email and password required" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ msg: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      email,
      password: hashedPassword
    });

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_KEY,
      { expiresIn: "12h" }
    );

    res
      .status(201)
      .json({
        msg: "User registered successfully",
        token
      });

  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ error: err.message });
  }
});


authrouter.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ msg: "Email and password required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ msg: "User not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ msg: "Invalid credentials" });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_KEY,
      { expiresIn: "12h" }
    );

    res.json({
      msg: "Login successful",
      token
    });

  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: err.message });
  }
});



authrouter.post("/logout", (req, res) => {

  res.json({ msg: "Logout successful" });
});

module.exports = authrouter;
