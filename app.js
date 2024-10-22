// Load environment variables from .env file
require("dotenv").config();

// Import necessary modules
const cors = require("cors");
const bodyParser = require("body-parser");
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

// Import custom modules and middleware
const { authenticate } = require("./middleware/auth");
const { handleStripeWebhook, handleSuccess } = require("./controllers/orderController");
const connectDB = require("./db/connection");

// Initialize Express app
const app = express();

// Create an HTTP server with Express
const server = http.createServer(app);

// Create a Socket.IO server with CORS configuration
const io = new Server(server, {
  cors: {
    origin: "*", // Allow all origins. Adjust this as per your requirements.
//    methods: ["GET", "POST"], // Allowed HTTP methods
  },
});

// Middleware options for CORS
const corsOptions = {
  origin: function (origin, callback) {
    callback(null, true); // Allow requests from all origins
  },
  credentials: true, // Allow credentials (cookies, HTTP authentication)
};

// Connect to MongoDB using the connection function
connectDB();

// Configure middleware
app.use(cors(corsOptions)); // Enable CORS with options
app.use(bodyParser.json({ type: "application/vnd.api+json", strict: false })); // Parse JSON bodies with specific MIME type
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(express.json()); // Parse JSON bodies
app.use("/uploads", express.static("uploads")); // Serve static files from "uploads" directory

// Stripe webhook endpoint with raw body parser (uncomment if needed)
// app.post(
//   "/api/v1/orders/webhook-checkout",
//   express.raw({ type: "application/json" }),
//   handleStripeWebhook
// );

// Import route modules
const authRouter = require("./routes/auth");
const userRouter = require("./routes/users");
const productRouter = require("./routes/products");
const shopRouter = require("./routes/shops");
const orderRouter = require("./routes/order");
const cartRouter = require("./routes/cart");
const notificationRouter = require("./routes/notification");

app.get("/", (req, res) => {
  res.send("Hello World!");
  console.log("Hello World!");
})

// Register routes with base paths
app.use("/api/v1/auth", authRouter);
app.get("/api/v1/orders/success", handleSuccess); // Handle Stripe success callback

// Uncomm/.well-known/acme-challenge/ent the following line if authentication is required for all routes
// app.use(authenticate); 

app.get("/.well-known/acme-challenge/:id", (req, res) => {
    res.send("test")
})

// Define additional routes
app.use("/api/v1/users", userRouter);
app.use("/api/v1/product", productRouter);
app.use("/api/v1/shop", shopRouter);
app.use("/api/v1/orders", orderRouter);
app.use("/api/v1/cart", cartRouter);
app.use("/api/v1/notification", notificationRouter);

// Socket.IO setup for handling WebSocket connections
io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`); // Log when a user connects

  // Handle custom "message" event
  socket.on("message", (data) => {
    console.log(`Message received: ${data}`);
    socket.emit("messageResponse", `Server received your message: ${data}`);
  });

  // Handle user disconnect event
  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});


// Start the server and listen on the specified port
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server is running on ${PORT}`);
});

