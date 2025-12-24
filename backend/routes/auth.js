const express = require('express');
const User = require('../models/User');
const supabase = require('../config/supabase');
const { createClient } = require('@supabase/supabase-js');
const router = express.Router();

// Create admin client for user management
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

// Route to sync user data after Supabase auth
router.post('/sync-user', async (req, res) => {
  try {
    const { supabase_id, username, email, phone, phone_verified, role } = req.body;

    console.log('Sync user request:', { supabase_id, username, email, phone, phone_verified, role });
    console.log('Phone value received:', phone, 'Type:', typeof phone);

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
      if (phone) {
        user.phone = phone;
        user.phone_verified = phone_verified || false;
        console.log('Updating existing user with phone:', phone);
      } else {
        console.log('No phone provided for existing user update');
      }
      // Only update role if explicitly provided and valid
      if (role && ['user', 'admin', 'moderator'].includes(role)) {
        user.role = role;
      }
      await user.save();
      console.log('User updated:', user._id, 'with phone:', user.phone);
    } else {
      // Check if user already exists by email (for OAuth users)
      const existingUserByEmail = await User.findOne({ email });

      if (existingUserByEmail) {
        // Link existing email user to Supabase
        existingUserByEmail.supabase_id = supabase_id;
        existingUserByEmail.username = username; // Update username to avoid conflicts
        if (phone) {
          existingUserByEmail.phone = phone;
          existingUserByEmail.phone_verified = phone_verified || false;
        }
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

        const userData = {
          supabase_id,
          username: finalUsername,
          email,
          role: finalRole
        };

        if (phone) {
          userData.phone = phone;
          userData.phone_verified = phone_verified || false;
          console.log('Adding phone to user data:', phone);
        } else {
          console.log('No phone provided, skipping phone fields');
        }

        console.log('Creating user with userData:', userData);
        user = new User(userData);
        await user.save();
        console.log('New user created:', user._id, 'with role:', user.role, 'and phone:', user.phone);
      }
    }

    res.status(201).json({
      message: 'User profile synced successfully',
      user: {
        id: user._id,
        supabase_id: user.supabase_id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        phone_verified: user.phone_verified,
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

// Route to link phone identity to email account using admin API
router.post('/link-phone-identity', async (req, res) => {
  try {
    const { email_user_id, phone_user_id, phone } = req.body;

    console.log('Link phone identity request received:', { email_user_id, phone_user_id, phone });

    if (!email_user_id || !phone_user_id || !phone) {
      console.log('Missing required fields');
      return res.status(400).json({
        message: 'Email user ID, phone user ID, and phone are required'
      });
    }

    console.log('Linking phone identity to email account:', { email_user_id, phone_user_id, phone });

    // Check if admin client is properly initialized
    if (!supabaseAdmin) {
      console.error('Supabase admin client not initialized');
      return res.status(500).json({
        message: 'Admin client not available'
      });
    }

    // Step 1: Get the phone identity from the phone user
    console.log('Step 1: Getting phone user data...');
    const { data: phoneUser, error: getPhoneUserError } = await supabaseAdmin.auth.admin.getUserById(phone_user_id);

    if (getPhoneUserError) {
      console.error('Error getting phone user:', getPhoneUserError);
      return res.status(500).json({
        message: 'Failed to get phone user',
        error: getPhoneUserError.message,
        details: getPhoneUserError
      });
    }

    console.log('Phone user retrieved:', phoneUser.user.id);

    // Step 2: Get the email user to check current state
    console.log('Step 2: Getting email user data...');
    const { data: emailUser, error: getEmailUserError } = await supabaseAdmin.auth.admin.getUserById(email_user_id);

    if (getEmailUserError) {
      console.error('Error getting email user:', getEmailUserError);
      return res.status(500).json({
        message: 'Failed to get email user',
        error: getEmailUserError.message,
        details: getEmailUserError
      });
    }

    console.log('Email user retrieved:', emailUser.user.id);

    // Step 3: Update the phone user with email data (reverse approach)
    console.log('Step 3: Updating phone user with email data...');
    const updatePayload = {
      email: emailUser.user.email,
      user_metadata: {
        ...emailUser.user.user_metadata,
        ...phoneUser.user.user_metadata,
        phone: phone,
        phone_verified: true,
        email: emailUser.user.email
      }
    };

    console.log('Update payload:', updatePayload);

    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      phone_user_id,
      updatePayload
    );

    if (updateError) {
      console.error('Error updating phone user with email:', updateError);
      return res.status(500).json({
        message: 'Failed to update phone user with email',
        error: updateError.message,
        details: updateError
      });
    }

    console.log('Phone user updated successfully with email');

    // Step 4: Delete the email-only user since we've merged the data
    console.log('Step 4: Deleting email-only user...');
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(email_user_id);

    if (deleteError) {
      console.error('Error deleting email user:', deleteError);
      // Continue anyway - the main linking succeeded
    } else {
      console.log('Email-only user deleted successfully');
    }

    console.log('Phone identity successfully linked to email account');

    res.status(200).json({
      message: 'Phone identity linked successfully',
      user: updatedUser.user,
      final_user_id: phone_user_id // The phone user is now the main account
    });

  } catch (error) {
    console.error('Link phone identity error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

// Route to cleanup temporary phone user by ID
router.post('/cleanup-phone-user', async (req, res) => {
  try {
    const { phone_user_id } = req.body;

    if (!phone_user_id) {
      return res.status(400).json({
        message: 'Phone user ID is required'
      });
    }

    console.log('Cleaning up phone user:', phone_user_id);

    // Delete the temporary phone user
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(phone_user_id);

    if (deleteError) {
      console.error('Error deleting phone user:', deleteError);
      return res.status(500).json({
        message: 'Failed to delete phone user',
        error: deleteError.message
      });
    }

    console.log('Phone user cleaned up successfully');

    res.status(200).json({
      message: 'Phone user cleaned up successfully'
    });

  } catch (error) {
    console.error('Cleanup phone user error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

// Route to cleanup abandoned phone verification by phone number
router.post('/cleanup-abandoned-phone', async (req, res) => {
  try {
    const { phone } = req.body;

    if (!phone) {
      return res.status(400).json({
        message: 'Phone number is required'
      });
    }

    console.log('Cleaning up abandoned phone verification for:', phone);

    // Get all users to find phone-only users with this number
    const { data: allUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error('Error listing users:', listError);
      return res.status(500).json({
        message: 'Failed to list users',
        error: listError.message
      });
    }

    // Find phone-only users with this phone number (no email)
    const phoneOnlyUsers = allUsers.users.filter(user =>
      user.phone === phone &&
      !user.email &&
      user.app_metadata?.provider === 'phone'
    );

    console.log(`Found ${phoneOnlyUsers.length} phone-only users to clean up`);

    // Delete phone-only users
    for (const user of phoneOnlyUsers) {
      try {
        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
        if (deleteError) {
          console.error(`Error deleting phone user ${user.id}:`, deleteError);
        } else {
          console.log(`Deleted phone-only user: ${user.id}`);
        }
      } catch (deleteErr) {
        console.error(`Exception deleting user ${user.id}:`, deleteErr);
      }
    }

    res.status(200).json({
      message: 'Abandoned phone verification cleaned up',
      deleted_users: phoneOnlyUsers.length
    });

  } catch (error) {
    console.error('Cleanup abandoned phone error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

// Route for manual phone linking (post-registration)
router.post('/manual-link-phone', async (req, res) => {
  try {
    const { user_id, phone } = req.body;

    if (!user_id || !phone) {
      return res.status(400).json({
        message: 'User ID and phone number are required'
      });
    }

    console.log('Manual phone linking request:', { user_id, phone });

    // Step 1: Get the current user
    const { data: currentUser, error: getUserError } = await supabaseAdmin.auth.admin.getUserById(user_id);

    if (getUserError || !currentUser) {
      console.error('Error getting user:', getUserError);
      return res.status(404).json({
        message: 'User not found',
        error: getUserError?.message
      });
    }

    console.log('Current user retrieved:', currentUser.user.email);

    // Step 2: Check if phone is already taken by another user
    const { data: existingUsers, error: searchError } = await supabaseAdmin.auth.admin.listUsers();

    if (searchError) {
      console.error('Error searching for existing phone:', searchError);
      return res.status(500).json({
        message: 'Error checking phone availability',
        error: searchError.message
      });
    }

    const phoneInUse = existingUsers.users.find(u => u.phone === phone && u.id !== user_id);

    if (phoneInUse) {
      return res.status(409).json({
        message: 'Phone number is already linked to another account',
        conflict: true
      });
    }

    // Step 3: Update user with phone using admin API
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user_id,
      {
        phone: phone,
        user_metadata: {
          ...currentUser.user.user_metadata,
          phone: phone,
          phone_linked_manually: true,
          phone_linked_at: new Date().toISOString()
        }
      }
    );

    if (updateError) {
      console.error('Error updating user with phone:', updateError);
      return res.status(500).json({
        message: 'Failed to link phone to account',
        error: updateError.message
      });
    }

    console.log('Phone successfully linked to user account');

    // Step 4: Update MongoDB record
    try {
      const mongoUser = await User.findOne({ supabase_id: user_id });
      if (mongoUser) {
        mongoUser.phone = phone;
        mongoUser.phone_verified = false; // Will be verified after OTP
        await mongoUser.save();
        console.log('Updated MongoDB record with phone');
      }
    } catch (mongoError) {
      console.error('Error updating MongoDB:', mongoError);
      // Continue anyway - main linking succeeded
    }

    res.status(200).json({
      message: 'Phone successfully linked to account',
      user: updatedUser.user,
      requires_verification: true
    });

  } catch (error) {
    console.error('Manual phone linking error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

// Route for phone verification after manual linking
router.post('/verify-linked-phone', async (req, res) => {
  try {
    const { user_id, phone } = req.body;

    if (!user_id || !phone) {
      return res.status(400).json({
        message: 'User ID and phone number are required'
      });
    }

    console.log('Verifying linked phone:', { user_id, phone });

    // Update user metadata to mark phone as verified
    const { data: updatedUser, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user_id,
      {
        user_metadata: {
          phone_verified: true,
          phone_verified_at: new Date().toISOString()
        }
      }
    );

    if (updateError) {
      console.error('Error marking phone as verified:', updateError);
      return res.status(500).json({
        message: 'Failed to verify phone',
        error: updateError.message
      });
    }

    // Update MongoDB record
    try {
      const mongoUser = await User.findOne({ supabase_id: user_id });
      if (mongoUser) {
        mongoUser.phone_verified = true;
        await mongoUser.save();
        console.log('Updated MongoDB record - phone verified');
      }
    } catch (mongoError) {
      console.error('Error updating MongoDB:', mongoError);
    }

    res.status(200).json({
      message: 'Phone verification completed',
      user: updatedUser.user
    });

  } catch (error) {
    console.error('Phone verification error:', error);
    res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

module.exports = router;