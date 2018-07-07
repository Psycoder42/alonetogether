// Module dependencies
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();

// Custom modules
const members = require('../models/member.js');
const security = require('../utils/securityUtils.js');

// DB interactivity
const Member = members.getModel(mongoose.connection);

// These routes are for authenticated users only (with exceptions)
const exceptions = ['/new', '/create'];
router.use(security.authenticated('curUser', '/login', exceptions));

// Member index page (Index route)
router.get('/', (req, res)=>{
  res.send('List of Members');
});

// Member sign up form (New route)
router.get('/new', (req, res)=>{
  res.render('public/login.ejs', {
    isNew: true,
    error: null
  });
});

// Create the actual user (Create route)
router.post('/create', (req, res)=>{
  res.send('Attempting to create user');
});

// Specific member page (Update route)
router.put('/:username', (req, res)=>{
  res.send('Updating member settings');
});

// Specific member page (Destroy route)
router.delete('/:username', (req, res)=>{
  res.send('Deleting member');
});

// Specific member page (Show route)
router.get('/:username', (req, res)=>{
  res.send('Member page');
});

// Modify member settings (Edit route)
router.get('/:username/settings', (req, res)=>{
  res.send('Member settings');
});


// Export the router for use as middleware
module.exports = router;
