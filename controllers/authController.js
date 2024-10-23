// controllers/authController.js
const User = require("../models/User");
const Shop = require("../models/Shop");
const jwt = require("jsonwebtoken");
const { JWT_SECRET, CUSTOMER_URL, SHOP_URL, API_URL } = process.env;
const crypto = require("crypto");
const sendEmail = require("../utils/emailConnection");
const generateVerifyToken = () => {
  return crypto.randomBytes(16).toString("hex");
};

const bcrypt = require("bcrypt");

const ownerRegister = async (req, res) => {
  try {
    const { email, password, first_name, last_name, phone_number, is_owner } =
      req.body.data.attributes;
    const user = new User({
      email,
      username: email,
      password,
      first_name,
      last_name,
      phone_number,
      is_owner,
    });

    try {
      user.verify_token = generateVerifyToken();
      await user.save();
      await sendEmail(email, user.verify_token, API_URL, "verification");
      return res.status(201).json({ message: "User registered successfully" });
    } catch (validationError) {
      console.log(validationError);
      let message = "Validation error";
      for (let key in validationError.errors) {
        message = validationError.errors[key].message;
      }
      return res.status(400).json({ message });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const userRegister = async (req, res) => {
  try {
    const {
      email,
      password,
      first_name,
      last_name,
      phone_number,
      longitude,
      latitude,
    } = req.body;
    const user = new User({
      email,
      username: first_name + " " + last_name,
      password,
      first_name,
      last_name,
      phone_number,
      longitude,
      latitude,
    });

    try {
      user.verify_token = generateVerifyToken();
      await user.save();
      await sendEmail(email, user.verify_token, API_URL, "verification");
      return res.status(201).json({
        message: "Success",
        username: user.username,
        email,
        phone_number,
        longitude,
        latitude,
      });
    } catch (validationError) {
      console.log(validationError);
      let message = "Validation error";
      for (let key in validationError.errors) {
        message = validationError.errors[key].message;
      }
      return res.status(400).json({ message });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const userRegisterApp = async (req, res) => {
  try {
    const { email, password, first_name, last_name, phone_number, username } =
      req.body;
    const user = new User({
      email,
      username: username,
      password,
      first_name,
      last_name,
      phone_number,
    });

    try {
      user.verify_token = generateVerifyToken();
      await user.save();
      await sendEmail(email, user.verify_token, API_URL, "verification");
      // return res.status(201).json({ message: 'User registered successfully' });
      return res.status(201).json({
        message: "Success",
        username,
        email,
        phone_number,
      });
    } catch (validationError) {
      console.log(validationError);
      let message = "Validation error";
      for (let key in validationError.errors) {
        message = validationError.errors[key].message;
      }
      return res.status(400).json({ message });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const deliverymanRegister = async (req, res) => {
  try {
    const {
      email,
      password,
      first_name,
      last_name,
      phone_number,
      shopname,
    } = req.body;

    if (
      !email ||
      !password ||
      !first_name ||
      !last_name ||
      !phone_number ||
      !shopname
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const shop = await Shop.findOne({ name: shopname });

    if (!shop) {
      return res.status(400).json({ message: "Shop does not exist" });
    }

    const user = new User({
      email,
      username: first_name + last_name,
      password,
      first_name,
      last_name,
      phone_number,
      shopname: shop.name,
      shopId: shop._id,
      isDelivery: true,
      isVerified: false
    });

    try {
      user.verify_token = generateVerifyToken();
      await user.save();
      await sendEmail(email, user.verify_token, API_URL, "verification");
      return res.status(201).json({
        message: "Success",
        shopname,
        first_name,
        last_name,
        email,
        phone_number,
      });
    } catch (validationError) {
      console.log(validationError);
      let message = "Validation error";
      for (let key in validationError.errors) {
        message = validationError.errors[key].message;
      }
      return res.status(400).json({ message });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const deliverymanRegisterWithOwner = async (req, res) => {
  try {
    const {
      email,
      password,
      first_name,
      last_name,
      phone_number,
    } = req.body;

    const shopOwnerId = req.user.userId;

    if (
      !email ||
      !password ||
      !first_name ||
      !last_name ||
      !phone_number
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const shop = await Shop.findOne({ owner: shopOwnerId });

    if (!shop) {
      return res.status(400).json({ message: "Shop does not exist" });
    }

    const user = new User({
      email,
      username: first_name + last_name,
      password,
      first_name,
      last_name,
      phone_number,
      shopname: shop.name,
      shopId: shop._id,
      isDelivery: true,
    });

    try {
      user.verify_token = generateVerifyToken();
      await user.save();
      await sendEmail(email, user.verify_token, API_URL, "verification");
      return res.status(201).json({
        success: true,
        message: "Person created successfully.",
      });
    } catch (validationError) {
      console.log(validationError);
      let message = "Validation error";
      for (let key in validationError.errors) {
        message = validationError.errors[key].message;
      }
      return res.status(400).json({ message });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const adminregister = async (req, res) => {
  try {
    const { email, password, firstName, lastName, phone_number, isAdmin } =
      req.body.data.attributes;
    const user = new User({
      email,
      username: email,
      password,
      firstName,
      lastName,
      phone_number,
      isAdmin,
    });

    try {
      user.verify_token = generateVerifyToken();
      await user.save();

      await sendEmail(email, user.verify_token, API_URL, "verification");

      return res.status(201).json({ message: "success" });
    } catch (validationError) {
      console.log(validationError);
      let message = "Validation error";
      for (let key in validationError.errors) {
        message = validationError.errors[key].message;
      }
      return res.status(400).json({ message });
    }
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body.data.attributes;

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(400).json({
        errors: [{ detail: "Please sign up..." }],
      });
    }
    if (!(await user.comparePassword(password))) {
      return res.status(400).json({
        errors: [{ detail: "Invalid password..." }],
      });
    }

    if (!user.isVerified) {
      return res.status(400).json({
        errors: [{ detail: "Please verify your account..." }],
      });
    }

    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7h" }
    );

    return res.json({
      token_type: "Bearer",
      expires_in: "7h",
      access_token: token,
      refresh_token: token,
    });
  } catch (error) {
    return res.status(400).json({
      errors: [{ detail: "Internal Server Error" }],
    });
  }
};

const loginapp = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        errors: [{ detail: "There are no registered users." }],
      });
    }
    if (!(await user.comparePassword(password))) {
      return res.status(400).json({
        errors: [{ detail: "Passwords do not match." }],
      });
    }
    if (!user.isVerified) {
      return res.status(400).json({
        errors: [{ detail: "Please verify your account..." }],
      });
    }
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7h" }
    );

    return res.json({
      token_type: "Bearer",
      expires_in: "7h",
      access_token: token,
      refresh_token: token,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone_number: user.phone_number,
      userId: user._id,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      errors: [{ detail: "Internal Server Error" }],
    });
  }
};

const deliverymanLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find the user by email
    const user = await User.findOne({ email });

    // If no user is found, return an error
    if (!user) {
      return res.status(400).json({
        errors: [{ detail: "There are no registered users." }],
      });
    }

    // Check if the provided password matches the stored hashed password
    if (!(await user.comparePassword(password))) {
      return res.status(400).json({
        errors: [{ detail: "Passwords do not match." }],
      });
    }

    // Check if the user is verified
    if (!user.isVerified) {
      return res.status(400).json({
        errors: [{ detail: "Please verify your account..." }],
      });
    }

    // Check if the user has an associated shop
    if (!user.shopId) {
      return res.status(400).json({
        errors: [{ detail: "User does not have an associated shop." }],
      });
    }

    // Find the shop in the Shop database using the shopId from the user
    const shop = await Shop.findById(user.shopId);

    if (!shop) {
      return res.status(400).json({
        errors: [{ detail: "Shop does not exist." }],
      });
    }

    // Compare the shop IDs and if they match, include shop data in the response
    if (user.shopId.toString() !== shop._id.toString()) {
      return res.status(400).json({
        errors: [{ detail: "User shop ID does not match the shop database." }],
      });
    }

    // Generate JWT token for authentication
    const token = jwt.sign(
      { userId: user._id, username: user.username },
      JWT_SECRET,
      { expiresIn: "7h" }
    );

    // Send the response with user and shop data
    return res.json({
      token_type: "Bearer",
      expires_in: "7h",
      access_token: token,
      refresh_token: token,
      username: user.username,
      first_name: user.first_name,
      last_name: user.last_name,
      email: user.email,
      phone_number: user.phone_number,
      userId: user._id,
      shopData: {
        shopname: shop.name,
        shopaddress: shop.address,
        owner: shop.shopowner,
        otherDetails: shop.otherDetails, // Include any additional shop data here
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      errors: [{ detail: "Internal Server Error" }],
    });
  }
};

const logout = async (req, res) => {
  return res.sendStatus(204);
};

const verify = async (req, res) => {
  const { token } = req.params;
  try {
    const user = await User.findOne({ verify_token: token });

    if (!user) {
      return res
        .status(404)
        .json({ message: "User not found or token is invalid" });
    }

    user.isVerified = true;
    await user.save();
    if (user.is_owner) {
      const newShop = new Shop({
        name: `${user.first_name + " " + user.last_name}'s Shop`,
        owner: user._id,
      });
      await newShop.save();
      //TODO: endpoint gded bt3ml approved 3 l shop
    }

    const redirectUrl = user.is_owner
      ? `${SHOP_URL}/auth/login`
      : `${CUSTOMER_URL}`;
    return res.redirect(redirectUrl);
  } catch (error) {
    console.error("Verification Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const forgotPassword = async (req, res) => {
  const { email } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "User not found." });
    }

    // Generate reset token and save it to the user
    const token = generateVerifyToken();
    user.verify_token = token;
    await user.save();

    // Send password reset email with the token
    const resetUrl = `${CUSTOMER_URL}/reset-password/${token}`;
    await sendEmail(email, token, resetUrl, "resetPassword");

    return res
      .status(200)
      .json({ message: "Password reset token sent to email." });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const resetPassword = async (req, res) => {
  const { password, token, email } = req.body;

  try {
    // Find user by token and email
    const user = await User.findOne({ email, verify_token: token });
    if (!user) {
      return res.status(400).json({ message: "Invalid or expired token." });
    }

    // Update user's password and clear the token
    user.password = password;
    user.verify_token = undefined; // Clear the token after successful password reset
    await user.save();

    return res
      .status(200)
      .json({ message: "Password has been reset successfully." });
  } catch (error) {
    console.error("Reset Password Error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};

const loginWithGoogle = async (req, res) => {
  try {
    const { email, first_name, last_name } = req.body;

    // Log the received data
    console.log("Request body:", req.body);

    // Check if the user exists
    let user = await User.findOne({ email });

    if (user) {
      // User exists, generate a JWT token
      const token = jwt.sign(
        { userId: user._id, username: user.username },
        JWT_SECRET,
        { expiresIn: "7h" }
      );

      return res.json({
        token_type: "Bearer",
        expires_in: "7h",
        access_token: token,
        refresh_token: token,
      });
    } else {
      // Create a new user with a default password
      user = new User({
        email,
        first_name,
        last_name,
        username: first_name + last_name,  // Use email as the username
        password: "123456789",  // Placeholder password
        isGoogle: true,
        isVerified: true,  // Assume Google users are verified
      });
      await user.save();

      const token = jwt.sign(
        { userId: user._id, username: user.username },
        JWT_SECRET,
        { expiresIn: "7h" }
      );

      return res.json({
        token_type: "Bearer",
        expires_in: "7h",
        access_token: token,
        refresh_token: token,
      });
    }
  } catch (error) {
    console.error("Error processing Google login:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const loginAsAdmin = async (req, res) => {
  const { token, shopId } = req.body;

  if (!token || !shopId) {
    return res.status(400).json({ message: 'Token and shopId are required' });
  }

  try {
    // Verify the token and extract userId
    const decodedToken = jwt.verify(token, JWT_SECRET);
    const { userId } = decodedToken;

    // Find the user in the database by userId
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if the user is an admin
    if (user.isAdmin === true) {
      // Find the shop by shopId
      const shop = await Shop.findById(shopId);
      if (!shop) {
        return res.status(404).json({ message: 'Shop not found' });
      }

      // Find the owner of the shop in the User model
      const owner = await User.findById(shop.owner);
      if (!owner) {
        return res.status(404).json({ message: 'Shop owner not found' });
      }

      // Create access token and refresh token
      const accessToken = jwt.sign(
        { userId: owner._id, username: owner.username },
        JWT_SECRET,
        { expiresIn: "7h" }  // Access token valid for 7 hours
      );

      const refreshToken = jwt.sign(
        { userId: owner._id, username: owner.username },
        JWT_SECRET,
        { expiresIn: "30d" }  // Refresh token valid for 30 days
      );

      // Send the tokens to the frontend
      return res.json({
        token_type: "Bearer",
        expires_in: "7h",  // Expiration for the access token
        access_token: accessToken,
        refresh_token: refreshToken,  // Long-lived refresh token
      });

    } else {
      return res.status(403).json({ message: 'Access denied. User is not an admin.' });
    }

  } catch (error) {
    console.error('Error verifying token:', error);
    return res.status(401).json({ message: 'Invalid or expired token', error: error.message });
  }
};


module.exports = {
  ownerRegister,
  login,
  loginapp,
  logout,
  verify,
  forgotPassword,
  resetPassword,
  adminregister,
  deliverymanRegister,
  deliverymanRegisterWithOwner,
  userRegister,
  userRegisterApp,
  deliverymanLogin,
  loginWithGoogle,
  loginAsAdmin
};
