const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    userId:
    {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true,
    },
    shopId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Shop',
        required: true,
    },
    message: {
        type: String,
        required: true
    },
    type: {
        type: String,
        enum: ['success', 'info', 'warning', 'error'],
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
}, { strict: false });

const Notification = mongoose.model('Notification', notificationSchema);

module.exports = Notification;
