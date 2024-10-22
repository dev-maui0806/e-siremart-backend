// controllers/authController.js
const User = require("../models/User");
const { validationResult } = require("express-validator");
const bcrypt = require("bcryptjs");
const Shop = require("../models/Shop");

const getUsersCounts = async (req, res) => {
  try {
    try {
      const counts = await User.countDocuments();
      return res.status(201).json({ counts });
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

const getAllUsers = async (req, res) => {
  const isAdmin = await checkAdminStatus(req.user.userId);
  if (!isAdmin)
    return res
      .status(403)
      .send({ success: false, message: "User is not an admin" });

  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const search = req.query.search;

  try {
    const query = {};
    if (search) {
      query.$or = [
        { email: { $regex: search, $options: "i" } },
        { first_name: { $regex: search, $options: "i" } },
        { last_name: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(query)
      .skip((page - 1) * limit)
      .limit(limit);

    const count = await User.countDocuments(query);

    res.json({
      success: true,
      data: users,
      total: count,
      pages: Math.ceil(count / limit),
      current_page: page,
    });
  } catch (error) {
    res
      .status(500)
      .send({ success: false, message: "Server Error", error: error.message });
  }
};

const getDeliveryPeople = async (req, res) => {
  const userId = req.user.userId;
  const user = await User.findById(userId);
  if (user.is_owner) {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search;

    const shop = await Shop.findOne({ owner: userId });
    const shopId = shop._id;
  
    try {
      const query = { shopId: shopId };
      if (search) {
        query.$or = [
          { email: { $regex: search, $options: "i" } },
          { first_name: { $regex: search, $options: "i" } },
          { last_name: { $regex: search, $options: "i" } },
        ];
      }
  
      const users = await User.find(query)
        .skip((page - 1) * limit)
        .limit(limit);
  
      const count = await User.countDocuments(query);
  
      res.json({
        success: true,
        data: users,
        total: count,
        pages: Math.ceil(count / limit),
        current_page: page,
      });
    } catch (error) {
      res
        .status(500)
        .send({ success: false, message: "Server Error", error: error.message });
    }
  }
};

const checkAdminStatus = async (userId) => {
  try {
    const user = await User.findById(userId);
    if (!user) return false;
    return user.isAdmin;
  } catch (err) {
    console.error("Error checking admin status:", err);
    return false;
  }
};

async function hashPassword(password) {
  return bcrypt.hash(password, 8);
}

const createUser = async (req, res) => {
  const isAdmin = await checkAdminStatus(req.user.userId);
  if (!isAdmin)
    return res
      .status(403)
      .send({ success: false, message: "User is not an admin" });
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const {
      phone_number,
      first_name,
      middle_name,
      username,
      last_name,
      publishing_name,
      email,
      password,
      status,
    } = req.body;
    const hashedPassword = await hashPassword(password);
    const newUser = new User({
      email: email.toLowerCase(),
      password: hashedPassword,
      phone_number,
      first_name,
      username,
      last_name,
      middle_name,
      publishing_name,
      status,
      is_author_completed: 0,
      created_at: new Date(),
      updated_at: new Date(),
    });
    await newUser.save();
    res.status(201).json({
      success: true,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

const deleteUser = async (req, res) => {
  const isAdmin = await checkAdminStatus(req.user.userId);
  if (!isAdmin)
    return res
      .status(403)
      .send({ success: false, message: "User is not an admin" });

  const userId = req.params.userId;
  try {
    if (userId == undefined)
      return res.status(400).json({ success: false, message: "Id not found" });
    await User.findByIdAndDelete(userId);
    res.json({ success: true, message: "User deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteDeliveryPerson = async (req, res) => {
  const { email } = req.params;
  console.log(req.params);

  try {
    await User.deleteOne({ email: email });
    res.json({ success: true, message: "User deleted successfully." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const makeUserAdmin = async (req, res) => {
  const userId = req.params.userId;
  try {
    await User.findByIdAndUpdate(userId, { isAdmin: true });
    res.json({ success: true, message: "User is now an admin" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getUserProfile = async (req, res) => {
  const userId = req.user.userId;
  try {
    if (userId == undefined)
      return res.status(400).json({ success: false, message: "Id not found" });
    var user = await User.findById(userId);
    res.json({
      success: true,
      data: user,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateUser = async (req, res) => {
  const userId = req.params.userId;

  if (!userId) {
    return res.status(400).json({ success: false, message: "User ID is required" });
  }

  const { firstName, lastName, email, phone_number } = req.body;

  // Ensure at least one field is being updated
  if (!firstName && !lastName && !email && !phone_number) {
    return res.status(400).json({ success: false, message: "At least one field must be updated" });
  }

  try {
    console.log("UserID:", userId);
    console.log("Update data:", { firstName, lastName, email, phone_number });

    // Update user by userId
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone_number: phone_number,
        updated_at: new Date(),
      },
      { new: true } // Return the updated document
    );

    // Check if user is found
    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Send back the updated user
    res.json({
      success: true,
      message: "Profile updated successfully!",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

const updateAddressUser = async (req, res) => {
  const userId = req.params.userId;

  if (!userId) {
    return res.status(400).json({ success: false, message: "User ID is required" });
  }

  const { city, address, postalCode, street, latitude, longitude, country } = req.body;

  if (!city && !address && !postalCode && !street) {
    return res.status(400).json({ success: false, message: "At least one field must be updated" });
  }

  try {
    console.log("UserID:", userId);
    console.log("Update data:", { city, address, postalCode, street, latitude, longitude, country });

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        address: country + "," + city + "," + address + "," + postalCode,
        latitude: latitude,
        longitude: longitude,
        updated_at: new Date(),
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    res.json({
      success: true,
      message: "Profile updated successfully!",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};




module.exports = {
  getAllUsers,
  checkAdminStatus,
  createUser,
  deleteUser,
  makeUserAdmin,
  getUserProfile,
  getUsersCounts,
  updateUser,
  updateAddressUser,
  getDeliveryPeople,
  deleteDeliveryPerson
};
