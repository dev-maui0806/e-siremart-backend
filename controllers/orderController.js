// controllers/orderController.js
const Razorpay = require("razorpay");
const crypto = require('crypto');
const Order = require("../models/Order");
const Product = require("../models/Product");
const Cart = require("../models/Cart");
const User = require("../models/User");
const Shop = require("../models/Shop");
const notificationController = require("./notificationController");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const endpointSecret = "whsec_omar";
const razorpaySecretKey = process.env.RAZOR_PAY_KEY_SECRET;
const razorpayKeyId = process.env.RAZOR_PAY_KEY_ID;
//Get Order Counts

const getCheckoutSession = async (req, res) => {
  try {
    //1) Get the Cart item
    const customer = req.user.userId;

    const cart = await Cart.findOne({ user: customer }).populate(
      "items.product"
    );
    for (const item of cart.items) {
      if (item.quantity > item.product.quantity) {
        return res.status(400).json({
          message: `Requested quantity for ${item.productName} is not available.`,
        });
      }
    }
    //2) Create Chechout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: cart.items.map((item) => ({
        price_data: {
          currency: "inr",
          product_data: {
            name: item.productName,
          },
          unit_amount: item.product.price * 100,
        },
        quantity: item.quantity,
      })),
      mode: "payment",
      success_url: `http://localhost:8080/api/v1/orders/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.protocol}://${req.get("host")}/api/v1/cart/`,
      metadata: { customerId: customer || req.user.userId },
    });

    //3) Create Session as Response
    res.json({
      message: "Session Created successfully",
      session,
      id: session.id,
    });
  } catch (error) {
    console.error("Create Session Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
const handleSuccess = async (req, res) => {
  console.log(req.query);
  const sessionId = req.query.session_id;
  console.log("sessionId", sessionId);
  const session = await stripe.checkout.sessions.retrieve(sessionId);
  console.log("session", session);
  if (session.payment_status) {
    const customerId = session.metadata.customerId;
    const cart = await Cart.findOne({ user: customerId }).populate(
      "items.product"
    );

    if (!cart) {
      console.error("Cart not found for customer:", customerId);
      return res.status(400).send("Cart not found");
    }

    const totalPrice = cart.items.reduce((total, item) => {
      return total + item.product.price * item.quantity;
    }, 0);

    const newOrder = new Order({
      customer: customerId,
      items: cart.items,
      totalPrice,
    });
    await newOrder.save();

    await Cart.findOneAndUpdate({ user: customerId }, { $set: { items: [] } });

    var productId = cart.items[0].product._id;
    var product = await Product.findById(productId);
    await notificationController.createNotification(
      customerId,
      productId,
      product.owner,
      "Create new Order successfully",
      "success"
    );

    console.log("Order placed successfully:", newOrder);
    res.redirect("http://localhost:3000/");
  } else {
    res.send("Payment not completed.");
  }
};
//Handle Webhook Stripe

const handleStripeWebhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, secret);
  } catch (err) {
    console.error("Webhook Error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    console.log("event", event);

    try {
      const session = event.data.object;
      console.log("session", session);

      const customerId = session.metda_data.customerId;
      const cart = await Cart.findOne({ user: customerId }).populate(
        "items.product"
      );

      if (!cart) {
        console.error("Cart not found for customer:", customerId);
        return res.status(400).send("Cart not found");
      }

      const totalPrice = cart.items.reduce((total, item) => {
        return total + item.product.price * item.quantity;
      }, 0);

      const newOrder = new Order({
        customer: customerId,
        items: cart.items,
        totalPrice,
      });
      await newOrder.save();

      await Cart.findOneAndUpdate(
        { user: customerId },
        { $set: { items: [] } }
      );

      var productId = cart.items[0].product._id;
      var product = await Product.findById(productId);
      await notificationController.createNotification(
        customerId,
        productId,
        product.owner,
        "Create new Order successfully",
        "success"
      );

      console.log("Order placed successfully:", newOrder);
      return res.status(200).send("Received webhook");
    } catch (err) {
      console.log("Failed to create order:", err);
      return res.status(500).send();
    }
  } else {
    return res.status(200).send();
  }
};

// Place a new order
const placeOrder = async (req, res) => {
  try {
    const customer = req.user.userId;

    const cart = await Cart.findOne({ user: customer }).populate(
      "items.product"
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        message:
          "Cart is empty. Add items to the cart before placing an order.",
      });
    }

    const totalPrice = cart.items.reduce((total, item) => {
      return total + item.product.price * item.quantity;
    }, 0);

    const newOrder = new Order({ customer, items: cart.items, totalPrice });
    await newOrder.save();

    await Cart.findOneAndUpdate({ user: customer }, { $set: { items: [] } });

    var productId = cart.items[0].product._id;
    console.log(productId);
    var product = await Product.findById(productId);
    console.log(product);
    await notificationController.createNotification(
      customer,
      productId,
      product.owner,
      "Create new Order successfully",
      "success"
    );
    res
      .status(201)
      .json({ message: "Order placed successfully", order: newOrder });
  } catch (error) {
    console.error("Place Order Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getOrdersCounts = async (req, res) => {
  try {
    try {
      const counts = await Order.countDocuments();
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

// Get order history for a customer 
const getOrderHistory = async (req, res) => {
  try {
    const customerId = req.params.customerId;
    const orders = await Order.find({ customer: customerId }).sort({
      createdAt: "desc",
    });

    res.status(200).json({ orders });
  } catch (error) {
    console.error("Get Order History Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const getOrders = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findById(userId);
    if (user == null) {
      res.status(403).json({ message: "User not found" });
    }

    if (user.is_owner) {
      console.log(user.is_owner);

      let orders = [];
      const shop = await Shop.findOne({ owner: userId });

      if (shop) {
        const shopId = shop._id;

        const products = await Product.find({ shop: shopId });
        const productIds = products.map((product) => product._id);

        orders = await Order.find({ "items.productId": { $in: productIds } })
          .populate({
            path: "customer",
            model: "User",
            select: "username email phone_number", // Fields to select from User schema
          })
          .populate({
            path: "items.productId",
            model: "Product",
            select: "name price", // Fields to select from Product schema
          })
          .populate({
            path: "deliveryManId",
            model: "User",
            select: "username email phone_number"
          })
          .exec();
      }

      res.status(200).json({ orders: orders, count: orders.length });
    } else if (user.isDelivery) {
      const orders = await Order.find({
        deliveryManId: userId,
      })
        .populate({
          path: "customer",
          model: "User",
          select: "username email phone_number", // Fields to select from User schema
        })
        .populate({
          path: "items.productId",
          model: "Product",
          select: "name price image", // Fields to select from Product schema
        })
        .populate({
          path: "shopId",
          model: "Shop",
          select: "shopname", // Fields to select from Shop schema
        })
        .exec();

      res.status(200).json({ orders: orders, count: orders.length })
    } else {
      const orders = await Order.find({
        customer: userId,
      })
        .populate('shopId', 'name')
        .populate('items.productId', 'name price')
        .exec();

      // const groupedByRazorpayOrderId = orders.reduce((acc, order) => {
      //   const razorpayOrderId = order.razorpay_order_id;

      //   if (!acc[razorpayOrderId]) {
      //     acc[razorpayOrderId] = {
      //       razorpayOrderId,
      //       orders: [],
      //       totalAmount: 0,
      //       status: order.status,
      //       createdAt: order.created_at,
      //     };
      //   }

      //   acc[razorpayOrderId].orders.push(order);
      //   acc[razorpayOrderId].totalAmount += order.totalPrice; // Sum up the total amount for the grouped order ID

      //   return acc;
      // }, {});

      // res.json({orders: groupedByRazorpayOrderId});      
      res.json({ orders });
    }
  } catch (error) {
    console.error("Get Order History Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const updateOrderStatusById = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const { status } = req.body;
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );
    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }
    res
      .status(200)
      .json({ message: "Order updated successfully", Order: updatedOrder });
  } catch (error) {
    console.error("Update Order by ID Error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

const verifyPayment = async (req, res) => {
  const { paymentDetails, cartItems } = req.body;

  const body = paymentDetails.razorpay_order_id + "|" + paymentDetails.razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac('sha256', razorpaySecretKey)
    .update(body.toString())
    .digest('hex');

  if (expectedSignature === paymentDetails.razorpay_signature) {
    saveOrderToDatabase(paymentDetails, cartItems, req.user);
    res.json({ success: true, message: 'Payment verified, order saved' });
  } else {
    console.log("Signature doesn't match, payment is invalid");
    res.status(400).json({ success: false, message: 'Payment verification failed' });
  }
}

const saveOrderToDatabase = (paymentDetails, cartItems, user) => {
  const orders = cartItems.reduce((acc, item) => {
    if (!acc[item.shopId]) {
      acc[item.shopId] = {
        totalPrice: 0,
        orderItems: [],
      };
    }

    acc[item.shopId].totalPrice += item.newPrice * item.quantity;

    acc[item.shopId].orderItems.push({
      productId: item.id,
      quantity: item.quantity,
      price: item.newPrice,
    });

    return acc;
  }, {});

  Object.entries(orders).map(([shopId, order]) => {
    const newOrder = new Order({
      customer: user.userId,
      shopId: shopId,
      items: order.orderItems,
      totalPrice: order.totalPrice,
      address: {
        lat: paymentDetails.addressData.lat,
        lng: paymentDetails.addressData.lng
      },
      paymentDetails: {
        razorpay_payment_id: paymentDetails.razorpay_payment_id,
        razorpay_order_id: paymentDetails.razorpay_order_id,
        razorpay_signature: paymentDetails.razorpay_signature,
        amount: paymentDetails.amount,
        currency: paymentDetails.currency,
        paymentStatus: "Paid", // Pending, Completed, Failed
      },
      status: 'Pending'
    });

    newOrder.save();
  });
};

const creactOrder = async (req, res) => {
  try {
    const { userId, productId } = req.params.productId; // Extract productId from the request params

    // Fetch the product details from the Product model
    const product = await Product.findOne(productId);
    const user = await User.findOne(userId)

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // Extract customer and quantity from the request body
    const { quantity } = req.body;

    if (!user) {
      return res.status(400).json({ message: 'Customer is required' });
    }

    // Calculate the total price (quantity * product price)
    const totalPrice = product.price * quantity;

    // Create a new order object
    const order = new Order({
      customer: user._id, // Use the correct customer reference from the request
      items: [
        {
          product: product._id, // Reference to the product
          productName: product.name, // Storing the product name
          quantity, // Quantity from the request body
        },
      ],
      totalPrice,
    });

    // Save the order to the database
    await order.save();

    return res.status(201).json({
      message: 'Order created successfully',
      orderId: order._id,
    });

  } catch (error) {
    console.error("Error while creating the order:", error);
    return res.status(500).json({ message: 'Internal Server Error' });
  }
};

const createOrder = async (req, res) => {
  if (req.method === "POST") {
    console.log("------------------------------------");
    const { orders, addressData, currency } = req.body;

    const razorpay = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpaySecretKey,
    });

    try {
      const orderPromises = orders.map(async (item) => {
        const options = {
          amount: item.grandTotal * 100, // Razorpay requires amount in the smallest currency unit (e.g., paise)
          currency: currency,
          notes: {
            note1: "Fund transfer note",
          },
          receipt: `receipt_${Date.now()}`
        };

        const razor_order = await razorpay.orders.create(options);
        console.log("OrderID: ", razor_order.id);
        return razor_order;
      });

      const razorpayOrders = await Promise.all(orderPromises);
      console.log("Razorpay Orders created successfully.");

      orders.map((item, index) => {
        const orderItems = item.items.map(orderItem => {
          return {
            productId: orderItem.product.id,
            quantity: orderItem.quantity,
            price: orderItem.product.newPrice
          }
        });

        const new_order = new Order({
          customer: req.user.userId,
          addressData,
          shopId: item.shopId,
          items: orderItems,
          razorpay_order_id: razorpayOrders[index].id,
          totalPrice: item.grandTotal
        });

        new_order.save();
      })

      res.status(200).json({
        success: true,
        message: "Order crated successfully"
      });
    } catch (error) {
      console.error('Error creating order');
      res.status(500).json({
        success: false,
        error: "Order creation failed",
        details: error.message
      });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
};

const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.userId;

    // Find and update the order to "Cancelled"
    const updatedOrder = await Order.findOneAndUpdate(
      { razorpay_order_id: orderId, customer: userId },  // Ensure the user owns the order
      { status: "Cancelled" },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.json({ success: true, message: "Order Cancelled successfully", order: updatedOrder });
  } catch (error) {
    console.error("Error cancelling order:", error);
    return res.status(500).json({ success: false, message: "Failed to cancel order" });
  }
};

const refundRequestOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.userId;

    // Find and update the order to "Refunded"
    const updatedOrder = await Order.findOneAndUpdate(
      { razorpay_order_id: orderId, customer: userId },  // Ensure the user owns the order
      { status: "Refund Requested" },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    // Optionally, you might want to integrate with Razorpay or another payment gateway to process the refund.

    return res.json({ success: true, message: "Order refunded successfully", order: updatedOrder });
  } catch (error) {
    console.error("Error processing refund:", error);
    return res.status(500).json({ success: false, message: "Failed to process refund" });
  }
};

const completeOrder = async (req, res) => {
  try {
    const { orderId } = req.body;
    const userId = req.user.userId;

    // Find and update the order to "Completed"
    const updatedOrder = await Order.findOneAndUpdate(
      { razorpay_order_id: orderId, customer: userId },  // Ensure the user owns the order
      { status: "Completed" },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.json({ success: true, message: "Order marked as completed", order: updatedOrder });
  } catch (error) {
    console.error("Error completing order:", error);
    return res.status(500).json({ success: false, message: "Failed to complete order" });
  }
};

const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const userId = req.user.userId;

    // Find and remove the order
    const deletedOrder = await Order.findOneAndDelete(
      { razorpay_order_id: orderId, customer: userId }  // Ensure the user owns the order
    );

    if (!deletedOrder) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    return res.json({ success: true, message: "Order deleted successfully" });
  } catch (error) {
    console.error("Error deleting order:", error);
    return res.status(500).json({ success: false, message: "Failed to delete order" });
  }
};

const shipOrder = async (req, res) => {
  const ownerId = req.user.userId;
  const { deliveryMan, orderId } = req.body;

  const user = await User.findById(ownerId);

  if (user.is_owner) {
    const shop = await Shop.findOne({ owner: user._id });
    const shopId = shop._id;
    console.log("shopId: ", shopId);
    const deliverPerson = await User.findOne({ isDelivery: true, email: deliveryMan });

    if (deliverPerson) {
      try {

        const updatedOrder = await Order.findOneAndUpdate(
          { "razorpay_order_id": orderId, shopId: shopId },
          { status: "Shipped", deliveryManId: deliverPerson._id },
          { new: true }
        );

        res.json({ success: true, message: "Order shipped into delivery man" });

      } catch (err) {
        console.log(err);

      }

    } else {
      return res.json({ success: false, message: "Delivery Man not exist" });
    }

  }
}

const updateOrder = async (req, res) => {
  const { status, orderId, amount } = req.body;
  const userId = req.user.userId;
  const user = User.findById(userId);

  if (user.isDelivery) {

  } else {
    if (status == "Delivered") {
      const updatedOrder = await Order.findOneAndUpdate(
        { _id: orderId },
        { status: status }
      );

      return res.json({ success: true, message: "Order Delivered successfully" });
    } else if (status == "Cancelled") {
      console.log(status, orderId, amount);
      try {
        const order = await Order.findById(orderId);
        const paymentId = order.paymentDetails.razorpay_payment_id

        const razorpay = new Razorpay({
          key_id: razorpayKeyId,
          key_secret: razorpaySecretKey
        });

        const refund = await razorpay.payments.refund(paymentId, {
          amount: amount * 100, // Amount in paise
          notes: {
            reason: "Refund for order #123"
          }
        });
        console.log(refund);

        const updatedOder = await Order.findOneAndUpdate(
          { _id: orderId },
          { status: status }
        );

        return res.json({ sucess: true, message: "Order Cancelled successful" });
      } catch (error) {
        console.error(error);
      }



    } else {
      return res.status(400).json({ success: false, message: "Bad request!" });
    }
  }
}

module.exports = {
  placeOrder,
  getOrderHistory,
  getOrders,
  updateOrderStatusById,
  getOrdersCounts,
  getCheckoutSession,
  handleStripeWebhook,
  handleSuccess,
  createOrder,
  verifyPayment,
  creactOrder,
  shipOrder,
  cancelOrder,
  refundRequestOrder,
  completeOrder,
  deleteOrder,
  updateOrder,
};
