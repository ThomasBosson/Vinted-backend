const User = require("../models/User");

const isAuthenticated = async (req, res, next) => {
  try {
    if (req.headers.authorization) {
      // Récupérer le token
      const token = req.headers.authorization.replace("Bearer ", "");
      // chercher dans la bdd
      const user = await User.findOne({ token: token }).select(
        "account email token"
      );
      if (user) {
        req.user = user;
        next();
      } else {
        return res.status(401).json({ message: "Unauthorized" });
      }
    } else {
      return res.status(401).json({ message: "Unauthorized" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

module.exports = isAuthenticated;
