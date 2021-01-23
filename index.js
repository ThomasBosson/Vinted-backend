require("dotenv").config();
const express = require("express");
const formidable = require("express-formidable");
const mongoose = require("mongoose");
const cors = require("cors");
const userRoutes = require("./routes/user");
const offerRoutes = require("./routes/offer");

const app = express();
app.use(formidable());
app.use(cors());
app.use(userRoutes);
app.use(offerRoutes);

// Initialiser la BDD
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
});

// Importer Cloudinary
const cloudinary = require("cloudinary").v2;

// Config Cloudinary
cloudinary.config({
  cloud_name: "doucnifj5",
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

app.all("*", (req, res) => {
  res.status(404).json({ message: "Cette route n'existe pas" });
});

app.listen(process.env.PORT, () => {
  console.log("Server Started");
});
