// Module dependencies
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();

// Custom modules
const members = require('../models/member.js');
const security = require('../utils/securityUtils.js');

// DB interactivity
const Member = members.getModel(mongoose.connection);

// The actual log in (Create route)
router.post('/', (req, res)=>{
  res.send('Attempting to log in');
});

// The actual log out (Destroy route)
router.delete('/', (req, res)=>{
  // Log them out and send the client to the main page
  req.session.destroy(()=>{
    res.redirect('/');
  });
});

// Display the log in form (New route)
router.get('/', (req, res)=>{
  res.send('Log in here.');
});

// Create the actual user (Create route)
router.post('/firsttime', (req, res)=>{
  res.send('Attempting to create user');
});

// Display the sign up form (New route)
router.get('/new', (req, res)=>{
  res.send('Sign up here.');
});

// Export the router for use as middleware
module.exports = router;
