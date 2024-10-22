// routes/shops.js
const express = require('express');
const router = express.Router();
const Notifications = require('../controllers/notificationController');
const { authenticate } = require("../middleware/auth");

// Define routes
router.get('/', authenticate, Notifications.getShopNotification);

module.exports = router;
