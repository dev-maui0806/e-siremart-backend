// models/user.js
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      unique: true,
      required: true,
      lowercase: true,
      trim: true,
      validate: {
        validator: (value) => /\S+@\S+\.\S+/.test(value),
        message: "Invalid email format",
      },
    },
    verify_token: {
      type: String,
      required: false,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    shopname: {
      type: String,
      trim: true,
    },
    shopId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shop", // Reference to Shop model
      trim: true,
    },
    password: {
      type: String,
      required: false,
      minlength: [6, "Password must be at least 6 characters long"],
    },
    first_name: {
      type: String,
      required: true,
      trim: true,
    },
    last_name: {
      type: String,
      required: true,
      trim: true,
    },
    phone_number: {
      type: String,
      trim: true,
      // validate: {
      //     validator: (value) => /^\d{10}$/.test(value),
      //     message: 'Invalid phone number format',
      // },
    },
    is_owner: {
      type: Boolean,
      default: false,
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    isDelivery: {
      type: Boolean,
      default: false,
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "inactive",
    },
    created_at: {
      type: Date,
      default: Date.now,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
    address: {
      type: String,
      trim: true,
    },
    longitude: {
      type: String,
      trim: true,
    },
    latitude: {
      type: String,
      trim: true,
    },
    isGoogle: {
      type: Boolean,
      required: false,
      default: false
    }
  },
  { strict: false }
);

// Hash the password before saving to the database
userSchema.pre("save", async function (next) {
  const user = this;

  if (user.isModified("password")) {
    user.password = await bcrypt.hash(user.password, 10);
  }

  // Set the created_at and updated_at timestamps
  const currentDate = new Date();
  user.updated_at = currentDate;
  if (!user.created_at) {
    user.created_at = currentDate;
  }

  next();
});

// Compare hashed password with provided password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

const User = mongoose.model("User", userSchema);

module.exports = User;
