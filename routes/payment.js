const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_KEY_SECRET);

// PAYMENT STRIPE

router.post("/payment", async (req, res) => {
  try {
    // Réception du stripeToken
    const stripeToken = req.fields.stripeToken;
    const price = req.fields.amount;
    const title = req.fields.title;

    // Create transaction (request to Stripe)
    const response = await stripe.charges.create({
      title: title,
      amount: price * 100,
      currency: "eur",
      source: stripeToken,
    });
    console.log(response);
    if (response.status === "succeeded") {
      res.status(200).json({ message: "Payment validé" });
    }
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
