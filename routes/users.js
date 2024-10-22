// routes/auth.js
const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { body } = require("express-validator");

const { authenticate } = require("../middleware/auth");

// Define routes

// Define validation rules
const userValidationRules = [
  body("phone_number").isMobilePhone().withMessage("Phone number is invalid"),
  body("username").notEmpty().withMessage("First name is required"),
  body("first_name").notEmpty().withMessage("First name is required"),
  body("last_name").notEmpty().withMessage("Last name is required"),
  body("email").isEmail().withMessage("Email is invalid"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Password must be at least 6 characters long"),
];

// Define routes
router.get("/counts", userController.getUsersCounts);
router.get("/", authenticate, userController.getAllUsers);
router.get("/getDeliveryPeople", authenticate, userController.getDeliveryPeople);
router.delete("/deleteDeliveryPerson/:email", userController.deleteDeliveryPerson);
router.post("/", userValidationRules, userController.createUser);
router.delete("/:userId", authenticate, userController.deleteUser);
router.put("/:userId/make-admin", authenticate, userController.makeUserAdmin);
router.get("/profile", authenticate, userController.getUserProfile);
router.put("/:userId", userController.updateUser)
router.put("/users/:userId/address", userController.updateAddressUser)
module.exports = router;
