import mongoose from "mongoose";

const connectDB = async () => {
  // Setup connection event listeners to monitor the connection status
  mongoose.connection.on('connected', () => {
    console.log('MongoDB connection established successfully');
  });

  mongoose.connection.on('error', (err) => {
    console.error('MongoDB connection encountered an error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected. Mongoose will automatically attempt to reconnect.');
  });

  // Function to connect with a retry mechanism if the initial connection fails
  const connectWithRetry = async () => {
    try {
      await mongoose.connect(process.env.MONGODB_URI, {
        serverSelectionTimeoutMS: 5000, // Wait 5 seconds before failing
      });
    } catch (error) {
      console.error("MongoDB initial connection failed:", error.message);
      console.log("Retrying MongoDB connection in 5 seconds...");
      // Try again after 5 seconds instead of crashing the server
      setTimeout(connectWithRetry, 5000);
    }
  };

  await connectWithRetry();
};

export default connectDB; 
