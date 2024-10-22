const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected MongoDB successfully!');
    } catch (error) {
        console.error('MongoDB disconnected by hackers:', error);
        process.exit(1);
    }
};

module.exports = connectDB;
