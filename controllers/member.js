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

// Return the path to the user selected avatar or null if bad input
const getSelectedAvatar = (str) => {
  try {
    let userFileName = path.basename(str);
    let imgDir = path.resolve(__dirname, '../public/images/avatars/');
    let userImg = path.resolve(imgDir, userFileName);
    if (fs.existsSync(userImg)) {
      return '/images/avatars/'+userFileName;
    }
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

// Logic to update the basic settings
const updateMemberSettings = (req, res) => {
  // Validate that the profile pic is one of the available set
  let profilePic = getSelectedAvatar(pageUtils.cleanString(req.body.profilePic));
  if (!profilePic) {
    res.render('member/edit.ejs', {
      user: req.session.curUser,
      member: req.session.curUser,
      updateMessage: 'Unknown avatar selection.'
    });
    return;
  }
  // Update the user settings and return the usee the edit page
  let friendsOnly = pageUtils.isChecked(req.body.friendsOnly);
  let bio = pageUtils.cleanString(req.body.bio);
  let update = {$set: {bio: bio, profilePic: profilePic, friendsOnly: friendsOnly}};
  Member.findByIdAndUpdate(
    req.session.curUser._id,
    update,
    {new: true},
    (err, data)=>{
      if (err || !data) {
        // Log it and show the error on the edit page
        if (err) console.log(err.message);
        res.render('member/edit.ejs', {
          user: req.session.curUser,
          member: req.session.curUser,
          updateMessage: "Update failed. Please try again later."
        });
      } else {
        // Update the session and show success
        req.session.curUser = data;
        res.render('member/edit.ejs', {
          user: req.session.curUser,
          member: req.session.curUser,
          updateMessage: "Profile updated successfully."
        });
      }
    }
  );
}

// Logic to update the member password
const updateMemberPassword = (req, res) => {
  // Validate they are the correct user
  let curPass = pageUtils.cleanString(req.body.currentPass);
  if (!security.matchesHash(curPass, req.session.curUser.password)) {
    res.render('member/edit.ejs', {
      user: req.session.curUser,
      member: req.session.curUser,
      updateMessage: 'Incorrect current password.'
    });
    return;
  }
  // Validate the new password
  let newPass = pageUtils.cleanString(req.body.newPass);
  let passError = validation.validatePassword(newPass);
  if (passError) {
    res.render('member/edit.ejs', {
      user: req.session.curUser,
      member: req.session.curUser,
      updateMessage: passError
    });
    return
  }
  // Update the password and return them to the settings page
  let update = {$set: {password: security.hash(newPass)}};
  Member.findByIdAndUpdate(
    req.session.curUser._id,
    update,
    {new: true},
    (err, data)=>{
      if (err || !data) {
        // Log it and show the error on the edit page
        if (err) console.log(err.message);
        res.render('member/edit.ejs', {
          user: req.session.curUser,
          member: req.session.curUser,
          updateMessage: "Update failed. Please try again later."
        });
      } else {
        // Update the session and show success
        req.session.curUser = data;
        res.render('member/edit.ejs', {
          user: req.session.curUser,
          member: req.session.curUser,
          updateMessage: "Password updated successfully."
        });
      }
    }
  );
}

// Update basic information (Update route)
router.patch('/:username', (req, res)=>{
  let name = pageUtils.cleanString(req.params.username);
  if (req.session.curUser.username != name) {
    // User is trying to modify someone else
    console.log(req.session.curUser.username, 'tried to modify', name);
    res.redirect('back');
  } else {
    if (req.body.toUpdate == 'settings') {
      updateMemberSettings(req, res);
    } else if (req.body.toUpdate == 'password') {
      updateMemberPassword(req, res);
    } else {
      res.render('member/edit.ejs', {
        user: req.session.curUser,
        member: req.session.curUser,
        updateMessage: 'Unknown form submission.'
      });
    }
  }
});

// Update password (Update route)
router.patch('/:username/password', (req, res)=>{
  let name = pageUtils.cleanString(req.params.username);
  if (req.session.curUser.username != name) {
    // User is trying to modify someone else
    console.log(req.session.curUser.username, 'tried to modify', name);
    res.redirect('back');
  } else {
    // Validate the new password
    let pass = pageUtils.cleanString(req.body.newPass);
    let passError = validation.validatePassword(pass);
    if (passError) {
      return
    }

    let updates = {
      friendsOnly: pageUtils.isChecked(req.body.friendsOnly),
      bio: pageUtils.cleanString(req.body.bio)
    };
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
      member: req.session.curUser,
      updateMessage: null
    });
  }
});

// Export the router for use as middleware
module.exports = router;
