const express = require("express");
const formidable = require("express-formidable");
const router = express.Router();
const cors = require("cors");
const stripe = require("stripe")(process.env.STRIPE_KEY_SECRET);

const app = express();
app.use(formidable());
app.use(cors());

// PAYMENT STRIPE

router.post("/payment", async (req, res) => {
  // Réception du stripeToken
  const stripeToken = req.fields.stripeToken;
  const price = req.fields.price;
  const title = req.fields.title;

  // Create transaction (request to Stripe)
  const response = await stripe.charges.create({
    title: title,
    amount: price * 100,
    currency: "eur",
    source: stripeToken,
  });
  console.log(response);
  res.json("Paiement validé");
});

module.exports = router;
