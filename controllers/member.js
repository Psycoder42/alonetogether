// Module dependencies
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();

// Custom modules
const members = require('../models/member.js');
const pageUtils = require('../utils/pageUtils.js');
const security = require('../utils/securityUtils.js');
const validation = require('../public/validation.js');

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
  // Validate the username
  let name = pageUtils.cleanString(req.body.username);
  let nameError = validation.validateUsername(name);
  if (nameError) {
    res.render('public/login.ejs', {
      isNew: true,
      error: nameError
    });
    return;
  }
  // Validate the password
  let pass = pageUtils.cleanString(req.body.password);
  let passError = validation.validatePassword(pass);
  if (passError) {
    res.render('public/login.ejs', {
      isNew: true,
      error: passError
    });
    return;
  }
  // Attempt to create the user
  Member.create({username: name, password: security.hash(pass)}, (err, data)=>{
    if (err) {
      let message = "Account creation was unsuccessful. Please try again later.";
      if (err.code == 11000) {
        // Username already exists
        message = "Username already in use.";
      } else {
        // log the error for debugging purposes
        console.log(err.message);
      }
      res.render('public/login.ejs', {
        isNew: true,
        error: message
      });
    } else {
      req.session.curUser = data;
      res.redirect(req.baseUrl+'/'+name);
    }
  });
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
