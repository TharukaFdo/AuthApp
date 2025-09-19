const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  supabase_id: {
    type: String,
    required: [true, 'Supabase ID is required'],
    unique: true
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    unique: true,
    trim: true,
    minlength: [3, 'Username must be at least 3 characters long']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email']
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user',
    required: [true, 'Role is required']
  }
}, {
  timestamps: true
});

// Remove password-related methods since Supabase handles authentication

module.exports = mongoose.model('User', userSchema);