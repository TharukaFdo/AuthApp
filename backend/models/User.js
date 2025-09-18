// ========================================
// USER MODEL - Database Schema Definition
// ========================================
// This file defines the structure of user data in our MongoDB database
// It specifies what fields each user document must have and their validation rules

// IMPORT REQUIRED LIBRARIES
const mongoose = require('mongoose'); // MongoDB object modeling for Node.js
const bcrypt = require('bcryptjs'); // Library for hashing passwords securely

// DEFINE USER SCHEMA
// Schema = blueprint that defines structure and rules for documents in MongoDB
// It's like a template that every user document must follow
const userSchema = new mongoose.Schema({
  // USERNAME FIELD
  username: {
    type: String,                    // Data type must be text/string
    required: [true, 'Username is required'],     // Field is mandatory, shows error message if missing
    unique: true,                    // No two users can have same username (database enforces this)
    trim: true,                     // Removes spaces from beginning and end
    minlength: [3, 'Username must be at least 3 characters long'] // Minimum length validation
  },
  
  // EMAIL FIELD  
  email: {
    type: String,                    // Data type must be text/string
    required: [true, 'Email is required'],       // Field is mandatory
    unique: true,                    // No two users can have same email
    lowercase: true,                 // Automatically converts to lowercase
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email'] // Regex pattern to validate email format
    // Regex explanation: ^\S+@\S+\.\S+$ means:
    // ^ = start, \S+ = one or more non-space characters, @ = literal @
    // \S+ = domain name, \. = literal dot, \S+ = extension, $ = end
  },
  
  // PASSWORD FIELD
  password: {
    type: String,                    // Data type must be text/string
    required: [true, 'Password is required'],     // Field is mandatory
    minlength: [6, 'Password must be at least 6 characters long'] // Minimum length for security
    // Note: We'll hash this password before saving to database for security
  },

  // ROLE FIELD - defines user permissions and access levels
  role: {
    type: String,                    // Data type must be text/string
    enum: ['user', 'admin', 'moderator'], // Only these values are allowed
    default: 'user',                 // New users get 'user' role by default
    required: [true, 'Role is required'] // Field is mandatory
    // Role hierarchy: user < moderator < admin
    // user: basic access, moderator: can moderate content, admin: full system access
  }
}, {
  // SCHEMA OPTIONS
  timestamps: true  // Automatically adds 'createdAt' and 'updatedAt' fields to each document
});

// PRE-SAVE MIDDLEWARE - Runs BEFORE saving user to database
// This is where we hash the password for security
userSchema.pre('save', async function(next) {
  // 'this' refers to the user document being saved
  // Check if password field was modified (prevents re-hashing when updating other fields)
  if (!this.isModified('password')) return next();
  
  try {
    // PASSWORD HASHING PROCESS
    // Salt = random string added to password before hashing (prevents rainbow table attacks)
    // 10 = cost factor (higher = more secure but slower)
    const salt = await bcrypt.genSalt(10);
    
    // Hash the password with the salt
    // This converts "mypassword123" into something like "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAg..."
    this.password = await bcrypt.hash(this.password, salt);
    
    // Continue with saving the document
    next();
  } catch (error) {
    // If hashing fails, pass error to next middleware
    next(error);
  }
});

// INSTANCE METHODS - Custom methods available on each user document
// This method compares a plain text password with the hashed password in database
userSchema.methods.comparePassword = async function(candidatePassword) {
  // candidatePassword = plain text password from login form
  // this.password = hashed password stored in database
  // bcrypt.compare() safely compares them and returns true/false
  return await bcrypt.compare(candidatePassword, this.password);
};

// CREATE AND EXPORT THE MODEL
// mongoose.model() creates a model class from the schema
// 'User' = model name (MongoDB will create 'users' collection)
// userSchema = the schema definition we created above
module.exports = mongoose.model('User', userSchema);