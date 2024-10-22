// routes/cartRoutes.js
const express = require("express");
const router = express.Router();
const cartController = require("../controllers/cartController");
const { authenticate } = require("../middleware/auth");

// Define routes
router.post("/add-to-cart", authenticate, cartController.addToCart);
router.get("/", cartController.getCart);
router.delete(
  "/delete-from-cart/:productId",
  authenticate,
  cartController.deleteFromCart
);

module.exports = router;
