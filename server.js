import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";

dotenv.config();
const app = express();
const PORT = process.env.PORT;

app.use(express.json());
app.use("/api/auth", authRoutes);

mongoose.connect(process.env.DATABASE_URL).then(() => {
  console.log("connected to DB");
  app.listen(PORT, () => {
    console.log(`server running on http://localhost:${PORT}`);
  });
});

app.get("/", (req, res) => {
  res.send("yoo");
});
