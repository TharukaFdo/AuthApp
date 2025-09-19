const express = require('express');
const User = require('../models/User');
const supabase = require('../config/supabase');
const router = express.Router();

// Route to sync user data after Supabase auth
router.post('/sync-user', async (req, res) => {
  try {
    const { supabase_id, username, email, role } = req.body;

    console.log('Sync user request:', { supabase_id, username, email, role });

    if (!supabase_id || !username || !email) {
      return res.status(400).json({
        message: 'Supabase ID, username, and email are required'
      });
    }

    // Check if user already exists
    let user = await User.findOne({ supabase_id });
    console.log('Existing user found:', user ? 'Yes' : 'No');

    if (user) {
      // Update existing user (but keep role if already set)
      user.username = username;
      user.email = email;
      // Only update role if explicitly provided and valid
      if (role && ['user', 'admin', 'moderator'].includes(role)) {
        user.role = role;
      }
      await user.save();
      console.log('User updated:', user._id);
    } else {
      // Check if user already exists by email (for OAuth users)
      const existingUserByEmail = await User.findOne({ email });

      if (existingUserByEmail) {
        // Link existing email user to Supabase
        existingUserByEmail.supabase_id = supabase_id;
        existingUserByEmail.username = username; // Update username to avoid conflicts
        await existingUserByEmail.save();
        user = existingUserByEmail;
        console.log('Linked existing email user to Supabase:', user._id);
      } else {
        // Create new user profile
        const validRoles = ['user', 'admin', 'moderator'];

        // Ensure username is unique for OAuth users
        let finalUsername = username;
        let counter = 1;
        while (await User.findOne({ username: finalUsername })) {
          finalUsername = `${username}${counter}`;
          counter++;
        }

        const finalRole = role && validRoles.includes(role) ? role : 'user';
        console.log('Role assignment:', { received: role, valid: validRoles.includes(role), final: finalRole });

        user = new User({
          supabase_id,
          username: finalUsername,
          email,
          role: finalRole
        });
        await user.save();
        console.log('New user created:', user._id, 'with role:', user.role);
      }
    }

    res.status(201).json({
      message: 'User profile synced successfully',
      user: {
        id: user._id,
        supabase_id: user.supabase_id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });

  } catch (error) {
    console.error('Sync user error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;