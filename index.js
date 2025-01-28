import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bookRouter from "./routes/bookRoutes.js";
import userRouter from "./routes/userRoute.js";
import dotenv from "dotenv"; // Import dotenv

dotenv.config(); // Load .env file variables

const app = express();
app.use(express.urlencoded({ extended: true }));
app.use(cors());
app.use(express.json());
app.use("/book", bookRouter);
app.use("/user", userRouter);

const MONGODB_URL = process.env.MONGODB_URL;
const PORT = process.env.PORT || 3000; // Fallback to 3000 if PORT is not defined

mongoose
  .connect(MONGODB_URL)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server started running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log(`MongoDB connection error: ${error}`);
  });