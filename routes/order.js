// routes/orderRoutes.js
const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const { authenticate } = require("../middleware/auth");

// Define routes
router.post("/place-order", authenticate, orderController.placeOrder);
// router.post("/order", authenticate, orderController.productOrder);
router.post("/create-order", authenticate, orderController.createOrder);
router.post("/verify-payment", authenticate, orderController.verifyPayment);
router.put("/:orderId/status", authenticate, orderController.updateOrderStatusById);
router.put("/updateOrder", authenticate, orderController.updateOrder);
router.put("/cancelOrder", authenticate, orderController.cancelOrder);
router.put("/refundRequestOrder", authenticate, orderController.refundRequestOrder)
router.put("/completeOrder", authenticate, orderController.completeOrder);
router.delete("/deleteOrder/:orderId", authenticate, orderController.deleteOrder);
router.get("/order-history/:customerId", orderController.getOrderHistory);
router.get("/", authenticate, orderController.getOrders);
router.get("/counts", orderController.getOrdersCounts);
router.post(
  "/checkout-session",
  authenticate,
  orderController.getCheckoutSession
);

router.post ("/:userId/:productId", orderController.creactOrder);
router.patch("/ship", authenticate, orderController.shipOrder);

module.exports = router;
