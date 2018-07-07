// Module dependencies
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Custom modules
const members = require('../models/member.js');
const pageUtils = require('../utils/pageUtils.js');
const security = require('../utils/securityUtils.js');
const validation = require('../public/validation.js');

// DB interactivity
const Member = members.getModel(mongoose.connection);

// Pick a random avatar image
const getAvatar = () => {
  try {
    let imgDir = path.resolve(__dirname, '../public/images/avatars/');
    let avatars = fs.readdirSync(imgDir);
    let idx = Math.floor(Math.random()*avatars.length);
    return '/images/avatars/'+avatars[idx];
  } catch (err) {
    // Log for debugging purposes
    console.log(err.message);
  }
  return null;
}

// Return true if m1 can view m2 details
const canSee = (m1, m2) => {
  // Shortcut if it is themself
  if (m1._id == m2._id) return true;
  // Check other conditions
  if (m1.friendsOnly) {
    // Only let friends see
    return members.areFriends(m1, m2);
  } else {
    // Anyone who is not blocked
    return !members.isBlocked(m1, m2);
  }
}

// These routes are for authenticated users only (with exceptions)
const exceptions = ['/new', '/create'];
router.use(security.authenticated('curUser', '/login', exceptions));

// Member index page (Index route)
router.get('/', (req, res)=>{
  Member.find({}, (err, data)=>{
    let allMembers = data;
    if (err) {
      // log for debugging purposes
      console.log(err.message);
      // Make sure the page will still render
      allMembers = [];
    }
    res.render('member/index.ejs', {
      user: req.session.curUser,
      allMembers: allMembers,
      canSee: canSee
    });
  })
});

// Member sign up form (New route)
router.get('/new', (req, res)=>{
  res.render('public/login.ejs', {
    user: req.session.curUser,
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
      user: req.session.curUser,
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
      user: req.session.curUser,
      isNew: true,
      error: passError
    });
    return;
  }
  // Attempt to create the user
  let newUser = {username: name, password: security.hash(pass)};
  let randomAvatar = getAvatar();
  if (randomAvatar != null) newUser.profilePic = randomAvatar;
  Member.create(newUser, (err, data)=>{
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
        user: req.session.curUser,
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
  let name = pageUtils.cleanString(req.params.username);
  if (req.session.curUser.username != name) {
    // User is trying to modify someone else
    console.log(req.session.curUser.username, 'tried to modify', name);
    res.redirect('back');
  } else {
    let updates = {
      friendsOnly: pageUtils.isChecked(req.body.friendsOnly),
      bio: pageUtils.cleanString(req.body.bio)
    };
    Member.findByIdAndUpdate
  }
  res.send('Updating member settings');
});

// Specific member page (Destroy route)
router.delete('/:username', (req, res)=>{
  let name = pageUtils.cleanString(req.params.username);
  if (req.session.curUser.username != name) {
    // User is trying to delete someone else
    console.log(req.session.curUser.username, 'tried to delete', name);
    res.redirect('back');
  } else {
    // User is deleting their account
    Member.findByIdAndRemove(req.session.curUser._id, (err, data)=>{
      if (err) {
        // Log for debuggin purposes
        console.log(err.message);
        res.redirect(req.baseUrl+'/'+name);
      } else {
        // Log the now deleted user out and redirect to main landing page
        req.session.curUser = null;
        res.redirect('/');
      }
    });
  }
});

// Specific member page (Show route)
router.get('/:username', (req, res)=>{
  let name = pageUtils.cleanString(req.params.username);
  Member.findOne({username: name}, (err, data)=>{
    if (err || !data) {
      // Log for debugging purposes
      if (err) console.log(err.message);
      res.redirect(req.baseUrl);
    } else {
      let page = 'member/show.ejs';
      if (!canSee(data, req.session.curUser)) {
        // Show the "hidden" user page instead of the actual page
        page = 'member/noshow.ejs';
      }
      res.render(page, {
        user: req.session.curUser,
        member: data
      });
    }
  });
});

// Modify member (Edit route)
router.get('/:username/account', (req, res)=>{
  let name = pageUtils.cleanString(req.params.username);
  if (req.session.curUser.username != name) {
    // User is trying to access someone else's settings
    console.log(req.session.curUser.username, 'tried to see setting for', name);
    res.redirect('back');
  } else {
    res.render('member/edit.ejs', {
      user: req.session.curUser,
      member: req.session.curUser
    });
  }
});

// Export the router for use as middleware
module.exports = router;
