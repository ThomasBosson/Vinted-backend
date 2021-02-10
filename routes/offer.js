// Import du package "express"
const express = require("express");
// Appel à la fonction Router(), issue du package "express"
const router = express.Router();

// Import du middleware isAuthenticated
const isAuthenticated = require("../middleware/isAuthenticated");

// Import du package cloudinary
const cloudinary = require("cloudinary").v2;

// Import des models User et Offer
const Offer = require("../models/Offer");
const User = require("../models/User");

// POSTER UNE NOUVELLE ANNONCE

router.post("/offer/publish", isAuthenticated, async (req, res) => {
  try {
    // Conditions limites de caractères dans title, description et price
    if (req.fields.title.length >= 3 && req.fields.title.length <= 50) {
      if (
        req.fields.description.length >= 3 &&
        req.fields.description.length <= 500
      ) {
        if (req.fields.price >= 1 && req.fields.price <= 100000) {
          // Créer une nouvelle annonce
          const newOffer = new Offer({
            product_name: req.fields.title,
            product_description: req.fields.description,
            product_price: req.fields.price,
            product_details: [
              { MARQUE: req.fields.brand },
              { TAILLE: req.fields.size },
              { ÉTAT: req.fields.condition },
              { COULEUR: req.fields.color },
              { EMPLACEMENT: req.fields.location },
            ],
            owner: req.user,
          });

          // Envoyer l'image à Cloudinary
          const pictureToUpload = req.files.picture.path;
          const result = await cloudinary.uploader.upload(pictureToUpload, {
            folder: `api/vinted/offers/${newOffer._id}`,
            public_id: "preview",
            cloud_name: "doucnifj5",
          });

          // Ajouter le résultat de l'upload dans newOffer
          newOffer.product_image = result;

          // Sauvegarder la nouvelle publication
          await newOffer.save();
          res.status(201).json(newOffer);
        } else {
          res.status(400).json({ message: "price between 1 and 100000" });
        }
      } else {
        res
          .status(400)
          .json({ message: "Description between 3 and 500 characters" });
      }
    } else {
      res.status(400).json({ message: "Title between 3 and 50 characters" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// MODIFIER UNE ANNONCE PAR LES USERS

router.put("/offer/update/:id", isAuthenticated, async (req, res) => {
  const offerToUpdate = await Offer.findById(req.params.id);
  try {
    if (req.fields.title) {
      offerToUpdate.product_name = req.fields.title;
    }
    if (req.fields.description) {
      offerToUpdate.product_description = req.fields.description;
    }
    if (req.fields.price) {
      offerToUpdate.product_price = req.fields.price;
    }

    if (req.fields.brand) {
      offerToUpdate.product_details[0].MARQUE = req.fields.brand;
    }

    if (req.fields.size) {
      offerToUpdate.product_details[1].TAILLE = req.fields.size;
    }

    if (req.fields.condition) {
      offerToUpdate.product_details[2].ÉTAT = req.fields.condition;
    }

    if (req.fields.color) {
      offerToUpdate.product_details[3].COULEUR = req.fields.color;
    }

    if (req.fields.location) {
      offerToUpdate.product_details[4].EMPLACEMENT = req.fields.location;
    }

    // Notifie Mongoose que le tableau product_details est modifié
    offerToUpdate.markModified("product_details");

    if (req.files.picture) {
      const pictureToUpload = req.files.picture.path;
      const result = await cloudinary.uploader.upload(pictureToUpload, {
        public_id: `/vinted/offers/${offerToUpdate._id}/preview`,
      });
      offerToUpdate.product_image = result;
    }
    await offerToUpdate.save();
    res.status(200).json(offerToUpdate);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// RÉCUPÉRER LES INFORMATIONS D'UNE OFFRE EN FONCTION DE SON ID

router.get("/offer/:id", async (req, res) => {
  try {
    const byId = req.params.id;
    const offer = await Offer.findById(byId).populate({
      path: "owner",
      select: "account.username account.phone",
    });
    if (offer) {
      res.status(200).json(offer);
    } else {
      res.status(400).json({ message: "announce not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// FILTRER LES ANNONCES

router.get("/offers", async (req, res) => {
  try {
    // Création d'un objet dans lequel on va stocker nos filtres
    let filters = {};

    if (req.query.title) {
      // J'ajoute une clé product_name à l'objet filters
      filters.product_name = new RegExp(req.query.title, "i");
    }

    if (req.query.priceMin) {
      // Ajout d'une clé product price à filters
      filters.product_price = {
        // Retourner un nombre supérieur ou égal au prix minimum
        $gte: Number(req.query.priceMin),
      };
    }

    if (req.query.priceMax) {
      if (filters.product_price) {
        filters.product_price.$lte = req.query.priceMax;
      } else {
        filters.product_price = {
          $lte: req.query.priceMax,
        };
      }
    }

    let sort = {};

    if (req.query.sort === "price-desc") {
      sort = { product_price: -1 };
    }

    if (req.query.sort === "price-asc") {
      sort = { product_price: 1 };
    }

    let page;
    // forcer à afficher la page 1 si la query n'est pas envoyée
    if (Number(req.query.page) < 1) {
      page = 1;
    } else {
      // sinon, page est égale à ce qui est demandé
      page = Number(req.query.page);
    }

    let limit = Number(req.query.limit);

    const offers = await Offer.find(filters)
      .populate({
        path: "owner",
        select: "account",
      })
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit);

    // retourner le nombre d'annonces trouvées en fonction des filtres
    const count = await Offer.countDocuments(filters);

    res.status(200).json({
      count: count,
      offers: offers,
    });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// SUPPRIMER UNE ANNONCE
router.delete("/offer/delete/:id", isAuthenticated, async (req, res) => {
  try {
    // Supprimer ce qu'il y a dans le dossier
    await cloudinary.api.delete_resources_by_prefix(
      `api/vinted/offers/${req.params.id}`
    );
    // Une fois le dossier vide, je peux le supprimer
    await cloudinary.api.delete_folder(`api/vinted/offers/${req.params.id}`);
    offerToDelete = await Offer.findById(req.params.id);

    await offerToDelete.delete();
    res.status(200).json("Offer successfully deleted!");
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
