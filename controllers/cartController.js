// controllers/cartController.js
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const shopController = require('../controllers/shopController');
const notificationController = require('../controllers/notificationController');
const { ObjectId } = require('mongodb');

// Add a product to the cart
const addToCart = async (req, res) => {
    try {
        const { _id } = req.body;
        const quantity = 1;

        // Find the user's cart
        let cart = await Cart.findOne({ user: req.user.userId });

        if (!cart) {
            // If the cart doesn't exist, create a new one
            cart = new Cart({ user: req.user.userId, items: [] });
        }

        // Check if the product is already in the cart
        const existingItemIndex = cart.items.findIndex(item => item.product._id.equals(_id));

        if (existingItemIndex !== -1) {
            // If the product is already in the cart, update the quantity
            cart.items[existingItemIndex].quantity += quantity;
        } else {
            // If the product is not in the cart, fetch the product details
            const product = await Product.findById(_id);

            if (!product) {
                // If the product doesn't exist, return an error response
                return res.status(404).json({ message: 'Product not found' });
            }

            // Add the product to the cart
            cart.items.push({ product, quantity, productName: product.name });
        }

        // Save the updated cart
        await cart.save();

        // // Fetch the shop details
        // const shop = await shopController.getShopByOwnerId(product.owner);

        // if (shop) {
        //     // If the shop exists, create a notification
        //     await notificationController.createNotification(req.user.userId, product._id, shop._id, "Product added to user's cart successfully", "success");
        // }

        // Send a success response
        res.status(201).json({ message: 'Product added to the cart successfully', cart });
    } catch (error) {
        // If an error occurs, log the error and send an error response
        console.error('Add to Cart Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

// Get the user's cart
const getCart = async (req, res) => {
    // try {
    //     const userId = req.user.userId;
    //     const cart = await Cart.findOne({ user: userId }).populate('items.product', 'name price image');

    //     let totalPrice = 0;
    //     if (cart && cart.items.length > 0) {
    //         totalPrice = cart.items.reduce((acc, currentItem) => {
    //             return acc + (currentItem.product.price * currentItem.quantity);
    //         }, 0);
    //     }

    //     res.status(200).json({ cart: cart ? cart : [], totalPrice });
    // } catch (error) {
    //     console.error('Get Cart Error:', error);
    //     res.status(500).json({ message: 'Internal Server Error' });
    // }
};

const deleteFromCart = async (req, res) => {
    try {
        const productId = req.params.productId;
        const userId = req.user.userId;
        let cart = await Cart.findOne({ user: userId });
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }
        const itemIndex = cart.items.findIndex(item => item.product.equals(new ObjectId(productId)));


        if (itemIndex === -1) {
            return res.status(404).json({ message: 'Product not found in the cart' });
        }

        if (cart.items[itemIndex].quantity > 1) {
            cart.items[itemIndex].quantity--;
        } else {
            cart.items.splice(itemIndex, 1);
        }

        await cart.save();

        res.status(200).json({ message: 'Product quantity decreased in the cart successfully', cart });
    } catch (error) {
        console.error('Delete from Cart Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


module.exports = {
    addToCart,
    getCart,
    deleteFromCart
};
