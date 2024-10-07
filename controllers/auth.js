import User from "../models/user.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export async function register(req, res) {
  //user sends username, email and password
  //validate the username is unique and password meets requirements
  //salt & hash the password to get a hashedPassword
  //store the hashedPassword in the DB when creating user
  //once successfully registered, the user will be logged in to the app
  //create a JWT to store as a cookie (to identify which user is using the app)

  try {
    const { username, password, email } = req.body;

    const existingUsername = await User.findOne({ username: username });
    if (existingUsername) {
      return res.status(400).json({ error: "username is already taken" });
    }

    const existingEmail = await User.findOne({ email: email });
    if (existingEmail) {
      return res.status(400).json({ error: "email is already taken" });
    }

    if (password.length < 6) {
      return res.status(400).json({ error: "password is not long enough" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      username: username,
      password: hashedPassword,
      email: email,
    });

    if (newUser) {
      var token = jwt.sign({ userId: newUser._id }, process.env.JWT_SECRET, {
        expiresIn: "15d",
      });

      res.cookie("JWT", token, {
        maxAge: 15 * 24 * 60 * 60 * 1000, //15 days in ms
        httpOnly: true, //prevent XSS attacks
        sameSite: "strict", //prevent CSRF attacks
      });

      return res.status(200).json({
        _id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        profileImage: newUser.profileImage,
        followers: newUser.followers,
        following: newUser.following,
      });
    } else {
      return res.status(400).json({ error: "user registration failed" });
    }
  } catch (error) {
    return res.status(500).json({ error });
  }
}

export async function login(req, res) {
  //user sends username and password
  //salt & hash the input password to get a hashedPassword
  //compared this hashedPassword to the one stored in the DB
  //if they are the same, log them in (create a JWT for that userID and set it as a cookie)
  try {
    const { username, password } = req.body;

    const existingUser = await User.findOne({ username: username });

    if (!existingUser) {
      return res.status(400).json({ error: "user not found" });
    }

    const isValidPassword = await bcrypt.compare(
      password,
      existingUser.password
    );

    if (isValidPassword) {
      var token = jwt.sign(
        { userId: existingUser._id },
        process.env.JWT_SECRET,
        {
          expiresIn: "15d",
        }
      );

      res.cookie("JWT", token, {
        maxAge: 15 * 24 * 60 * 60 * 1000, //15 days in ms
        httpOnly: true, //prevent XSS attacks
        sameSite: "strict", //prevent CSRF attacks
      });

      return res.status(200).json({
        _id: existingUser._id,
        username: existingUser.username,
        email: existingUser.email,
        profileImage: existingUser.profileImage,
        followers: existingUser.followers,
        following: existingUser.following,
      });
    } else {
      return res.status(400).json({ error: "invalid password" });
    }
  } catch (error) {
    return res.status(500).json({ error });
  }
}

export async function logout(req, res) {
  //to log a user out, simply clear the cookies
  try {
    res.clearCookie("JWT", {
      httpOnly: true, //prevent XSS attacks
      sameSite: "strict", //prevent CSRF attacks
    });

    return res.status(200).json({ message: "user has logged out" });
  } catch (error) {
    return res.status(500).json({ error });
  }
}

export async function getMe(req, res) {
  try {
    const user = await User.findById(req.user._id).select("-password");

    if (user) {
      return res.status(200).json(user);
    } else {
      return res.status(400).json({ error: "user not found" });
    }
  } catch (error) {
    return res.status(500).json({ error });
  }
}
