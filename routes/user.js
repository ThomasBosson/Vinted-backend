// Import du package "express"
const express = require("express");
// Appel à la fonction Router(), issue du package "express"
const router = express.Router();

// uid2 et crypto-js pour encrypter le mot de passe
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");

// Import du package cloudinary
const cloudinary = require("cloudinary").v2;

// Import des models User et Offer
const User = require("../models/User");
const Offer = require("../models/Offer");

// SIGN UP USER

router.post("/user/signup", async (req, res) => {
  try {
    // check si l'email du user existe déjà (unique)
    const user = await User.findOne({ email: req.fields.email });
    // Si l'utilisateur n'existe pas...
    if (!user) {
      // Si je reçois toutes les infos : email, username, password...
      if (req.fields.email && req.fields.username && req.fields.password) {
        // Génération du password : encryptage
        const password = req.fields.password;
        const salt = uid2(64);
        const hash = SHA256(password + salt).toString(encBase64);
        const token = uid2(64);
        // Création du nouveau user
        const newUser = new User({
          email: req.fields.email,
          account: {
            username: req.fields.username,
            phone: req.fields.phone,
          },
          token: token,
          hash: hash,
          salt: salt,
        });
        // Sauvegarde du nouveau user
        await newUser.save();
        // Retour user en cas de succès
        res.status(200).json({
          _id: newUser._id,
          token: newUser.token,
          account: {
            username: newUser.account.username,
            phone: newUser.account.phone,
          },
        });
      } else {
        // Gestion de l'erreur 1 si le username est manquant
        res.status(400).json({ message: "Missing parameters" });
      }
    } else {
      // Gestion de l'erreur 2 si le user est déjà dans la bdd
      res.status(400).json({ message: "User already exist" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// LOGIN USER

router.post("/user/login", async (req, res) => {
  try {
    // Trouve dans la BDD le user qui veut se connecter
    const user = await User.findOne({ email: req.fields.email });
    // Si le user existe...
    if (user) {
      // Si le hash est le même que le hash du user trouvé...
      if (
        // Reproduit ce qu'on a créé au sign up : password + salt et le compare à notre hash qui s'est généré aussi au sign up.
        SHA256(req.fields.password + user.salt).toString(encBase64) ===
        user.hash
      ) {
        // Authentification accordée...
        res.status(200).json({
          _id: user._id,
          token: user.token,
          account: {
            username: user.account.username,
            phone: user.account.phone,
          },
        });
      } else {
        res.status(401).json({ message: "login failed!" });
      }
    } else {
      res.status(401).json({ message: "login failed!" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
