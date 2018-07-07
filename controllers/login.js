// Module dependencies
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();

// Custom modules
const members = require('../models/member.js');
const pageUtils = require('../utils/pageUtils.js');
const security = require('../utils/securityUtils.js');

// DB interactivity
const Member = members.getModel(mongoose.connection);

// The actual log in (Create route)
router.post('/', (req, res)=>{
  let name = pageUtils.cleanString(req.body.username);
  let pass = pageUtils.cleanString(req.body.password);
  Member.findOne({username: name}, (err, data)=>{
    if (err) {
      // Log error for debugging purposes
      console.log(err.message);
      res.render('public/login.ejs', {
        user: req.session.curUser,
        isNew: false,
        error: "Log in was unsuccessful. Please try again later."
      });
    } else if (!security.matchesHash(pass, data.password)) {
      // Bad password
      res.render('public/login.ejs', {
        user: req.session.curUser,
        isNew: false,
        error: "Incorrect username/password combination."
      });
    } else {
      // log them in and send them to their page
      req.session.curUser = data;
      res.redirect('/members/'+name);
    }
  });
});

// The actual log out (Destroy route)
router.delete('/', (req, res)=>{
  // Log them out and send them to the main page
  req.session.destroy(()=>{
    res.redirect('/');
  });
});

// Display the log in form (New route)
router.get('/', (req, res)=>{
  res.render('public/login.ejs', {
    user: req.session.curUser,
    isNew: false,
    error: null
  });
});

// Export the router for use as middleware
module.exports = router;
