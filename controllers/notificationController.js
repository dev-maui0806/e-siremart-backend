const Notification = require('../models/Notification');
const User = require('../models/User');

// Get a single shop by ID
const getShopNotification = async (req, res) => {
    try {
        let owner = req.user.userId;
        const notifications = await Notification.find({ shopId: owner });
        const notificationsWithUserName = await Promise.all(notifications.map(async (notification) => {
            const user = await User.findById(notification.userId);
            return {
                ...notification.toObject(),
                userName: user ? user.username : 'Unknown User',
            };
        }));
        res.json(notificationsWithUserName);
    } catch (error) {
        console.error('Get Notifications Error:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const createNotification = async (userId, productId, shopId, message, type) => {
    try {
        const newNotification = new Notification({
            userId,
            productId,
            shopId,
            message,
            type,
        });

        const savedNotification = await newNotification.save();

        return savedNotification;
    } catch (error) {
        console.error('Create Notification Error:', error);
        throw error;
    }
};

module.exports = {
    getShopNotification,
    createNotification
};
