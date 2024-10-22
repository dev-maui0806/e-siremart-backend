// routes/auth.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

const { authenticate } = require("../middleware/auth");

// Define routes
router.post("/loginWithGoogle", authController.loginWithGoogle);
router.post("/ownerRegister", authController.ownerRegister);
router.post("/login", authController.login);
router.post("/userRegister", authController.userRegister);
router.post("/login1", authController.loginapp);
router.post("/userRegisterApp", authController.userRegisterApp);
router.post("/deliverymanRegister", authController.deliverymanRegister);
router.post("/deliverymanRegisterWithOwner", authenticate, authController.deliverymanRegisterWithOwner)
router.post("/deliverymanLogin", authController.deliverymanLogin);
// router.post("/register", authController.adminregister);
router.post("/logout", authController.logout);
router.get("/verify/:token", authController.verify);
router.post("/password-forgot", authController.forgotPassword);
router.post("/password-reset", authController.resetPassword);

module.exports = router;
