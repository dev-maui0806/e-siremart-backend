const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Product name is required"],
    trim: true,
  },
  description: {
    type: String,
    trim: true,
  },
  price: {
    type: Number,
    required: [true, "Product price is required"],
    min: [0, "Price must be non-negative"],
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to User model
    required: true,
  },
  shop: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Shop", // Reference to Shop model
    required: true,
  },
  quantity: {
    type: Number,
    required: [true, "Product quantity is required"],
    min: [0, "Quantity must be non-negative"],
  },
  category: {
    type: String,
    trim: true,
  },
  image: {
    type: [String], // Array of image URLs/paths
  },
  startDate: {
    type: Date, // Use Date type for proper handling of date
  },
  endDate: {
    type: Date, // Use Date type for proper handling of date
  },
  discountPercent: {
    type: Number,
    min: [0, "Discount percent must be between 0 and 100"],
    max: [100, "Discount percent must be between 0 and 100"],
    default: 0, // Default discount to 0 if not provided
  },
  createDate: {
    type: Date,
    default: Date.now, // Automatically set createDate to the current date
  },
  updateDate: {
    type: Date,
    default: Date.now, // Automatically set updateDate to the current date
  },
});

// Pre-save hook to update the updateDate before saving
productSchema.pre("save", function (next) {
  this.updateDate = new Date();
  next();
});

const Product = mongoose.model("Product", productSchema);

module.exports = Product;
