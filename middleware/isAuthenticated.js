import jwt from "jsonwebtoken";
import User from "../models/user.js";

export async function isAuthenticated(req, res, next) {
  try {
    const { JWT } = req.cookies;

    if (!JWT) {
      return res.status(400).json({ error: "unauthorized request" });
    }

    const decoded = jwt.verify(JWT, process.env.JWT_SECRET);

    if (!decoded) {
      return res.status(400).json({ error: "invalid token" });
    }

    const { userId } = decoded;
    const user = await User.findById(userId).select("-password");

    if (user) {
      req.user = user; //remove this later
      // res.status(200).send(user);
      return next();
    } else {
      return res.status(400).json({ error: "user not found" });
    }
  } catch (error) {
    return res.status(500).json({ error: "server error" });
  }
}
