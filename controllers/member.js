// Module dependencies
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');

// Custom modules
const members = require('../models/member.js');
const messages = require('../models/message.js');
const pageUtils = require('../utils/pageUtils.js');
const security = require('../utils/securityUtils.js');
const validation = require('../public/validation.js');

// DB interactivity
const Member = members.getModel(mongoose.connection);
const Message = messages.getModel(mongoose.connection);

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

// Return an array of paragraphs
const splitMessage = (message) => {
  let cleaned = pageUtils.cleanString(message);
  return cleaned.replace(/[\n\r]+/g,'\n').split('\n').reduce((arr, elem)=>{
    if (elem.trim().length > 0) arr.push(elem);
    return arr;
  },[]);
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

// Modify member (Edit route)
router.get('/account', (req, res)=>{
  res.render('member/edit.ejs', {
    user: req.session.curUser,
    member: req.session.curUser,
    updateMessage: null
  });
});

// Modify member (Edit route)
router.get('/inbox', (req, res)=>{
  Message.find({recipient: req.session.curUser.username}, (err, data)=>{
    let allMessages = data;
    if (err) {
      // log for debugging purposes
      console.log(err.message);
      // Make sure the page will still render
      allMessages = [];
    }
    let friendRequests = [];
    let otherMessages = [];
    allMessages.forEach((m)=>{
      if (m.isFriendInvite) friendRequests.push(m);
      else otherMessages.push(m);
    });
    res.render('member/inbox.ejs', {
      user: req.session.curUser,
      friendRequests: friendRequests,
      otherMessages: otherMessages,
      splitMessage: splitMessage
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
  let newUser = {
    internalName: name.toLowerCase(),
    username: name,
    password: security.hash(pass)
  };
  let randomAvatar = getAvatar();
  if (randomAvatar != null) newUser.profilePic = randomAvatar;
  Member.create(newUser, (err, newUser)=>{
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
      req.session.curUser = newUser;
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
    (err, updatedUser)=>{
      if (err || !updatedUser) {
        // Log it and show the error on the edit page
        if (err) console.log(err.message);
        res.render('member/edit.ejs', {
          user: req.session.curUser,
          member: req.session.curUser,
          updateMessage: "Update failed. Please try again later."
        });
      } else {
        // Update the session and show success
        req.session.curUser = updatedUser;
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
    (err, updatedUser)=>{
      if (err || !updatedUser) {
        // Log it and show the error on the edit page
        if (err) console.log(err.message);
        res.render('member/edit.ejs', {
          user: req.session.curUser,
          member: req.session.curUser,
          updateMessage: "Update failed. Please try again later."
        });
      } else {
        // Update the session and show success
        req.session.curUser = updatedUser;
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
  if (req.session.curUser.username!=name && !req.session.curUser.isAdmin) {
    // Non-admin user is trying to modify someone else
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

// Specific member page (Destroy route)
router.delete('/:username', (req, res)=>{
  let name = pageUtils.cleanString(req.params.username);
  if (req.session.curUser.username!=name && !req.session.curUser.isAdmin) {
    // Non-admin user is trying to delete someone else
    console.log(req.session.curUser.username, 'tried to delete', name);
    res.redirect('back');
  } else {
    // User is deleting their account
    Member.findByIdAndRemove(req.session.curUser._id, (err, removedUser)=>{
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
  let name = pageUtils.cleanString(req.params.username).toLowerCase();
  Member.findOne({internalName: name}, (err, foundUser)=>{
    if (err || !foundUser) {
      // Log for debugging purposes
      if (err) console.log(err.message);
      res.redirect(req.baseUrl);
    } else {
      let page = 'member/show.ejs';
      if (!canSee(foundUser, req.session.curUser)) {
        // Show the "hidden" user page instead of the actual page
        page = 'member/noshow.ejs';
      }
      res.render(page, {
        user: req.session.curUser,
        member: foundUser,
        splitMessage: splitMessage
      });
    }
  });
});

// Send a user a friend invite
router.post('/:username/befriend', (req, res)=>{
  let name = pageUtils.cleanString(req.params.username);
  let self = (req.session.curUser.internalName == name.toLowerCase());
  let blacklisted = (req.session.curUser.blacklist.indexOf(name) != -1);
  let alreadyFriends = (req.session.curUser.friends.indexOf(name) != -1);
  if (self || blacklisted || alreadyFriends) {
    // A friend request can't be sent to this member send them back to the member page
    res.redirect(req.baseUrl+'/'+name);
  } else {
    Member.findOne({internalName: name.toLowerCase()}, (err1, foundUser)=>{
      if (err1 || !foundUser) {
        // Log for debugging purposes
        if (err1) console.log(err1.message);
        res.redirect(req.baseUrl);
      } else {
        // Create a new friend request
        let friendRequest = {
          sender: req.session.curUser.username,
          recipient: foundUser.username,
          message: pageUtils.cleanString(req.body.message),
          isFriendInvite: true
        };
        Message.create(friendRequest, (err2, newMessage)=>{
          if (err2) {
            // Log error for debugging purposes
            console.log(err2.message);
            // Send the user back to the member page
            res.redirect(req.baseUrl+'/'+foundUser.username);
          } else {
            // Modify user to be aware of pending request
            let update = {$push: {pending: foundUser.username}};
            Member.findByIdAndUpdate(
              req.session.curUser._id,
              update,
              {new: true},
              (err3, updatedUser)=>{
                // Log error for debugging purposes
                if (err3) console.log(err3.message);
                // Update the user object on the session
                if (updatedUser) req.session.curUser = updatedUser;
                // Send the user back to the member page
                res.redirect(req.baseUrl+'/'+foundUser.username);
              }
            );
          }
        });
      }
    });
  }
})

// Export the router for use as middleware
module.exports = router;
