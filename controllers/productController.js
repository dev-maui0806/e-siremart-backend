const Product = require("../models/Product");
const Shop = require("../models/Shop");
const Cart = require("../models/Cart");
const { ObjectId } = require("mongodb");

// Get a single product by ID
const getAllShopProducts = async (req, res) => {
  try {
    const owner = req.user.userId;
    const searchText = req.query.search || "";
    const products = await Product.find({ owner: new ObjectId(owner), name: { $regex: searchText, $options: "i" } });
    res.status(200).json({ products });
  } catch (error) {
    console.error("Get Product by ID Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getProductCounts = async (req, res) => {
  try {
    try {
      const counts = await Product.countDocuments();
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

// const getProducts = async (req, res) => {
//   console.log("getProducts-line38");

//   try {
//     const latitude = req.headers["x-user-latitude"];
//     const longitude = req.headers["x-user-longitude"];
//     const { searchText, category, shopId, page = 1, limit = 10 } = req.body;

//     console.log(req.body);
//     console.log("latitude line 46: ", latitude);
//     console.log("longitude: ", longitude);

//     if (latitude && longitude) {
//       // Find nearest shops using $near operator
//       const nearestShops = await Shop.find({
//         "address.location": {
//           $near: {
//             $geometry: {
//               type: "Point",
//               coordinates: [parseFloat(longitude), parseFloat(latitude)],
//             },
//             $maxDistance: 5000,
//           },
//         },
//         ...(shopId ? { _id: shopId } : {}), // Include shopId only if provided
//       }).limit(5);

//       console.log(nearestShops);

//       if (nearestShops.length > 0) {
//         let shopProducts = [];

//         for (const shop of nearestShops) {
//           const skip = (page - 1) * limit;
//           const ownerId = shop.owner.toString();

//           // Query products based on owner and category
//           const products = await Product.find({
//             owner: ownerId,
//             ...(category
//               ? category == "All"
//                 ? {}
//                 : { category: category }
//               : {}),
//             ...(searchText
//               ? { name: { $regex: searchText, $options: "i" } }
//               : {}), // Apply search text filter
//           })
//             .skip(skip)
//             .limit(parseInt(limit))
//             .exec();

//           console.log(products);

//           shopProducts.push({
//             shopName: shop.name,
//             shopId: shop._id,
//             products: products,
//           });
//         }
//         return res.status(200).json({ products: shopProducts });
//       } else {
//         return res.status(404).json({ message: "No nearby shops found." });
//       }
//     } else {
//       return res
//         .status(400)
//         .json({ message: "Location coordinates not provided." });
//     }
//   } catch (error) {
//     console.error("Get Products Error:", error);
//     res.status(500).json({ message: "Internal Server Error" });
//   }
// };

const getProducts = async (req, res) => {

  try {
    const latitude = parseFloat(req.headers["x-user-latitude"]);  // Make sure they are numbers
    const longitude = parseFloat(req.headers["x-user-longitude"]);
    const { searchText, category, shopId, page = 1, limit = 10 } = req.body;
    console.log("shopId: ", shopId);

    if (latitude && longitude) {
      // Ensure that latitude and longitude are valid numbers
      if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
        return res.status(400).json({ message: "Invalid latitude or longitude." });
      }

      // Find nearest shops using $near operator
      const nearestShops = await Shop.find({
        "address.location": {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [longitude, latitude], // Ensure correct order: [longitude, latitude]
            },
            $maxDistance: 5000,
          },
        },
        ...(shopId ? { _id: shopId } : {}), // Include shopId only if provided
      }).limit(0);

      if (nearestShops.length > 0) {
        let shopProducts = [];

        for (const shop of nearestShops) {
          const skip = (page - 1) * limit;
          const ownerId = shop.owner.toString();

          // Query products based on owner and category
          const products = await Product.find({
            owner: ownerId,
            ...(category
              ? category == "All"
                ? {}
                : { category: category }
              : {}),
            ...(searchText
              ? { name: { $regex: searchText, $options: "i" } }
              : {}), // Apply search text filter
          })
            // .skip(skip)
            // .limit(parseInt(limit))
            .exec();

          shopProducts.push({
            shopName: shop.name,
            shopId: shop._id,
            products: products,
          });
        }
        return res.status(200).json({ products: shopProducts });
      } else {
        return res.status(404).json({ message: "No nearby shops found." });
      }
    } else {
      return res
        .status(400)
        .json({ message: "Location coordinates not provided." });
    }
  } catch (error) {
    console.error("Get Products Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getAllProducts = async (req, res) => {
  try {
    let query = {};
    const latitude = req.headers["x-user-latitude"];
    const longitude = req.headers["x-user-longitude"];
    const {
      searchText,
      category,
      shopId,
      page = 1,
      limit = 10,
      Nearby,
    } = req.body;

    console.log(req.body);

    if (searchText && searchText != "") {
      query.name = { $regex: searchText, $options: "i" };
    }
    if (category && category != "") {
      query.category = category;
    }
    if (shopId && shopId != "") {
      const shop = await Shop.findById(shopId);
      const ownerId = shop?.owner;
      console.log(shop, shopId, "djlsjflsfjlsfjlskjfl");

      query.owner = new ObjectId(ownerId);
    }
    if (latitude && longitude) {
      const nearestShops = await Shop.find({
        "address.location": {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [parseFloat(longitude), parseFloat(latitude)],
            },
            $maxDistance: 5000,
          },
        },
      }).limit(5);

      if (nearestShops.length > 0) {
        let ownerIds = [];
        if (!shopId || shopId == "") {
          ownerIds = nearestShops.map((shop) => shop.owner.toString());
          query.owner = { $in: ownerIds };
        }
        console.log(query.owner);
      } else {
        return res.json({ products: [] });
      }
    }

    const skip = (page - 1) * limit;
    const products = await Product.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .exec();

    if (products.length === 0) {
      return res
        .status(404)
        .json({ message: "No products found with the specified criteria" });
    }

    // console.log(req.user, ": req.user");

    // // Get cart items for the user
    // const userId = req.user.userId;
    // const userCart = await Cart.findOne({ user: userId }).populate(
    //   "items.product"
    // );

    // // Add product quantity to each product in the response
    // const productsWithQuantity = products.map((product) => {
    //   const cartItem = userCart?.items.find((item) =>
    //     item.product._id.equals(product._id)
    //   );
    //   const quantity = cartItem ? cartItem.quantity : 0;
    //   return { ...product._doc, quantity };
    // });

    console.log(products, "products");

    res.status(200).json({ products: products });
  } catch (error) {
    console.error("Get Products Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const createProduct = async (req, res) => {
  try {
    const { name, description, quantity, category, price } = req.body;
    let product;
    const owner = req.user.userId;

    const shop = await Shop.findOne({ owner });

    if (!shop) {
      return res.status(400).json({ error: "No shop found for this user." });
    }

    let image = [];
    if (req.files && req.files.length > 0) {
      image = req.files.map((file) => file.path); // Map each file to its path
    }

    if (req.params.id) {
      // Update existing product if product ID is provided
      product = await Product.findByIdAndUpdate(
        req.params.id,
        { name, description, quantity, category, price, image, owner, shop: shop._id },
        { new: true }
      );
    } else {
      // Create new product if no product ID is provided
      const products = await Product.find({}).sort({ createDate: 1 });

      if (!products[0]) {
        product = new Product({
          name,
          description,
          quantity,
          category,
          price,
          image,
          owner,
          shop: shop._id, // Include shop ID in product
          createDate: new Date(),
          updateDate: new Date(),
        });
      } else if (
        !products[0].startDate ||
        !products[0].endDate ||
        !products[0].discountPercent
      ) {
        product = new Product({
          name,
          description,
          quantity,
          category,
          price,
          image,
          owner,
          shop: shop._id, // Include shop ID in product
          createDate: new Date(),
          updateDate: new Date(),
        });
      } else {
        product = new Product({
          name,
          description,
          quantity,
          category,
          price,
          image,
          owner,
          shop: shop._id, // Include shop ID in product
          createDate: new Date(),
          updateDate: new Date(),
          // startDate: products[0].startDate,
          // endDate: products[0].endDate,
          // discountPercent: products[0].discountPercent,
        });
      }

      await product.save();
    }

    res.status(200).json({ product });
  } catch (error) {
    console.error("Error creating/updating product:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

// Get a single product by ID
const getProductById = async (req, res) => {
  try {
    const productId = req.params.id;
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({ product });
  } catch (error) {
    console.error("Get Product by ID Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Update a product by ID
const updateProductById = async (req, res) => {
  try {
    const productId = req.params.id;
    const { name, description, price, quantity, category } = req.body;
    console.log(req.body);

    let image = [];
    let updatedProduct;
    if (req.files && req.files.length > 0) {
      image = req.files.map((file) => file.path); // Map each file to its path
      updatedProduct = await Product.findByIdAndUpdate(
        productId,
        { name, description, price, quantity, image, category },
        { new: true }
      );
    } else {
      console.log(123456789);

      updatedProduct = await Product.findByIdAndUpdate(
        productId,
        { name, description, price, quantity, category },
        { new: true }
      );
    }
    console.log("updatedProduct");
    console.log(updatedProduct);
    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Update Product by ID Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Delete a product by ID
const deleteProductById = async (req, res) => {
  try {
    const productId = req.params.id;
    const deletedProduct = await Product.findByIdAndDelete(productId);
    if (!deletedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    // If the product is deleted successfully, remove it from all carts
    await Cart.updateMany(
      { "items.product": productId },
      { $pull: { items: { product: productId } } }
    );

    res.status(200).json({
      message: "Product deleted successfully",
      product: deletedProduct,
    });
  } catch (error) {
    console.error("Delete Product by ID Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const setDiscountDate = async (req, res) => {
  console.log("setDiscountDate");
  try {
    const productId = new ObjectId(req.params.id);
    const { startDate, endDate, discountPercent } = req.body;
    console.log(startDate, endDate, discountPercent);
    console.log(productId, "product ID");

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      { startDate, endDate, discountPercent },
      { new: true } // Return the updated document
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    res.status(200).json({
      message: "Product updated successfully",
      product: updatedProduct,
    });
  } catch (error) {
    console.error("Delete Product by ID Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getProductByCategory = async (req, res) => {
  try {
    let query = {};
    const latitude = req.headers["x-user-latitude"];
    const longitude = req.headers["x-user-longitude"];
    const { category, shopId } = req.params;
    const page = 1, limit = 10;

    if (category && category != "") {
      query.category = category;
    }

    if (shopId && shopId != "") {
      const shop = await Shop.findById(shopId);
      const ownerId = shop?.owner;
      query.owner = new ObjectId(ownerId);
    }

    if (latitude && longitude) {
      const nearestShops = await Shop.find({
        "address.location": {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [parseFloat(longitude), parseFloat(latitude)],
            },
            $maxDistance: 5000,
          },
        },
      }).limit(5);
      if (nearestShops.length > 0) {
        let ownerIds = [];
        if (!shopId || shopId == "") {
          ownerIds = nearestShops.map((shop) => shop.owner.toString());
          query.owner = { $in: ownerIds };
        }
        console.log(query.owner);
      } else {
        return res.json({ products: [] });
      }
    }

    const skip = (page - 1) * limit;
    const products = await Product.find(query)
      .skip(skip)
      .limit(parseInt(limit))
      .exec();

    if (products.length === 0) {
      return res
        .status(404)
        .json({ message: "No products found with the specified criteria" });
    }

    res.status(200).json({ products: products });
  } catch (error) {
    console.error("Get Products Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProductById,
  deleteProductById,
  getAllShopProducts,
  getProductCounts,
  getProducts,
  setDiscountDate,
  getProductByCategory
};
