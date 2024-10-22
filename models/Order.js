const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
    customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    addressData: {
        lat: { type: Number, required: true },
        lng: { type: Number, required: true },
        address: {type: String, required: true}
    },
    shopId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        require: true,
    },
    deliveryManId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        require: false
    },
    items: [
        {
            productId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product', // Reference to the Product model
                required: true,
            },
            quantity: {
                type: Number,
                required: true,
                min: 1
            },
            price: {
                type: Number,
                required: true,
            },
        },
    ],
    razorpay_order_id: { type: String, required: true },
    status: {
        type: String,
        enum: ['Created', 'Shipped', 'Delivered', 'Cancelled', 'Completed', 'Refund Requested', 'Refund Denied', 'Refund Completed'],
        default: 'Created',
    },
    totalPrice: {
        type: Number,
        required: true,
        min: 0,
    },
    feedback: {
        type: String,
    },
    created_at: {
        type: Date,
        default: Date.now,
    },
    updated_at: {
        type: Date,
        default: Date.now,
    },
}, { strict: false });

orderSchema.pre('save', function (next) {
    this.updated_at = Date.now();
    next();
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;