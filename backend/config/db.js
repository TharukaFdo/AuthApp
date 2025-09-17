// ========================================
// DATABASE CONNECTION CONFIGURATION
// ========================================
// This file handles connecting our Node.js application to MongoDB database
// MongoDB is a NoSQL database that stores data in JSON-like documents

// IMPORT MONGOOSE
// Mongoose is an ODM (Object Document Mapper) that makes working with MongoDB easier
// It provides schema validation, query building, and other helpful features
const mongoose = require('mongoose');

// DATABASE CONNECTION FUNCTION
// async function - can use 'await' for asynchronous operations (like connecting to database)
// Async means the function doesn't block other code while waiting for database connection
const connectDB = async () => {
  // TRY-CATCH BLOCK - Error handling
  // try: attempt to connect to database
  // catch: handle any errors that occur during connection
  try {
    // CONNECT TO MONGODB
    // mongoose.connect() establishes connection to MongoDB database
    // process.env.MONGODB_URI gets database URL from environment variables (.env file)
    // await pauses execution until connection is established
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    
    // SUCCESS MESSAGE
    // If connection succeeds, print confirmation with database host
    // conn.connection.host shows which database server we connected to
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
  } catch (error) {
    // ERROR HANDLING
    // If connection fails, this code runs
    
    // Print error message to console for debugging
    console.error('Database connection error:', error.message);
    
    // EXIT THE APPLICATION
    // process.exit(1) stops the entire Node.js application
    // 1 indicates the app exited due to an error
    // We do this because the app can't work without a database connection
    process.exit(1);
  }
};

// EXPORT THE FUNCTION
// module.exports makes this function available to other files
// Other files can import this using: require('./config/db')
module.exports = connectDB;