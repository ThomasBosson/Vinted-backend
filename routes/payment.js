const express = require("express");
// const formidable = require("express-formidable");
const router = express.Router();
// const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_KEY_SECRET);

// const app = express();
// app.use(formidable());
// app.use(cors());

// PAYMENT STRIPE

router.post("/payment", async (req, res) => {
  // Réception du stripeToken
  const stripeToken = req.fields.stripeToken;

  // Create transaction (request to Stripe)
  const response = await stripe.charges.create({
    amount: req.fields.price * 100,
    currency: "eur",
    description: req.fields.description,
    source: stripeToken,
  });
  console.log(response);
  if (response.status === "succeeded") {
    res.status.json("Paiement validé !");
  }
});

module.exports = router;
