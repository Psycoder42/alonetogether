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
    if (err || !data) {
      // log for debugging purposes
      if (err) console.log(err.message);
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
    if (err || !data) {
      // log for debugging purposes
      if (err) console.log(err.message);
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
router.post('/create', async (req, res)=>{
  try {
    let curUser = req.session.curUser
    // Validate the username
    let name = pageUtils.cleanString(req.body.username);
    let nameError = validation.validateUsername(name);
    if (nameError) {
      res.render('public/login.ejs', {user: curUser, isNew: true, error: nameError});
      return;
    }
    // Validate the password
    let pass = pageUtils.cleanString(req.body.password);
    let passError = validation.validatePassword(pass);
    if (passError) {
      res.render('public/login.ejs', {user: curUser, isNew: true, error: passError});
      return;
    }
    // Attempt to create the user
    let userInfo = {internalName: name.toLowerCase(), username: name, password: security.hash(pass)};
    let randomAvatar = getAvatar();
    if (randomAvatar != null) userInfo.profilePic = randomAvatar;
    let newUser = await Member.create(userInfo);
    // Update the session and send the user to their settings page
    req.session.curUser = newUser;
    res.redirect(req.baseUrl+'/account');
  } catch (err) {
    let message = "Account creation was unsuccessful. Please try again later.";
    if (err.code == 11000) {
      // Username already exists
      message = "Username already in use.";
    } else {
      // log the error for debugging purposes
      console.log(err.message);
    }
    res.render('public/login.ejs', {user: curUser, isNew: true, error: message});
  }
});

// Logic to update the basic settings
const updateMemberSettings = async (req, res) => {
  try {
    let curUser = req.session.curUser;
    // Validate that the profile pic is one of the available set
    let profilePic = getSelectedAvatar(pageUtils.cleanString(req.body.profilePic));
    if (!profilePic) {
      let message = 'Unknown avatar selection.';
      res.render(
        'member/edit.ejs',
        {user: curUser, member: curUser, updateMessage: message}
      );
      return;
    }
    // Update the user settings and return the usee the edit page
    let bio = pageUtils.cleanString(req.body.bio);
    let friendsOnly = pageUtils.isChecked(req.body.friendsOnly);
    let delOnBlacklist = pageUtils.isChecked(req.body.delOnBlacklist);
    let update = {$set: {
      bio: bio,
      profilePic: profilePic,
      friendsOnly: friendsOnly,
      delOnBlacklist: delOnBlacklist
    }};
    curUser = await Member.findByIdAndUpdate(curUser._id, update, {new: true});
    req.session.curUser = curUser;
    // Return to the settings page
    let message = "Profile updated successfully."
    res.render(
      'member/edit.ejs',
      {user: curUser, member: curUser, updateMessage: message}
    );
  } catch (err) {
    // Log it and show the error on the edit page
    console.log(err.message);
    let message = "Update failed. Please try again later.";
    res.render(
      'member/edit.ejs',
      {user: curUser, member: curUser, updateMessage: message}
    );
  }
}

// Logic to update the member password
const updateMemberPassword = async (req, res) => {
  try {
    let curUser = req.session.curUser;
    // Validate they are the correct user
    let curPass = pageUtils.cleanString(req.body.currentPass);
    if (!security.matchesHash(curPass, req.session.curUser.password)) {
      let message = 'Incorrect current password.';
      res.render(
        'member/edit.ejs',
        {user: curUser, member: curUser, updateMessage: message}
      );
      return;
    }
    // Validate the new password
    let newPass = pageUtils.cleanString(req.body.newPass);
    let passError = validation.validatePassword(newPass);
    if (passError) {
      res.render(
        'member/edit.ejs',
        {user: curUser, member: curUser, updateMessage: passError}
      );
      return
    }
    // Update the password and return them to the settings page
    let update = {$set: {password: security.hash(newPass)}};
    curUser = await Member.findByIdAndUpdate(curUser._id, update, {new: true});
    req.session.curUser = curUser;
    // Return to the settings page
    let message = "Password updated successfully.";
    res.render(
      'member/edit.ejs',
      {user: curUser, member: curUser, updateMessage: message}
    );
  } catch (err) {
    // Log it and show the error on the edit page
    console.log(err.message);
    let message = "Update failed. Please try again later.";
    res.render(
      'member/edit.ejs',
      {user: curUser, member: curUser, updateMessage: message}
    );
  }
}

// Update basic information (Update route)
router.patch('/:username', (req, res)=>{
  let curUser = req.session.curUser;
  let name = pageUtils.cleanString(req.params.username);
  if (curUser.username!=name && !curUser.isAdmin) {
    // Non-admin user is trying to modify someone else
    console.log(curUser.username, 'tried to modify', name);
    res.redirect('back');
  } else {
    if (req.body.toUpdate == 'settings') {
      updateMemberSettings(req, res);
    } else if (req.body.toUpdate == 'password') {
      updateMemberPassword(req, res);
    } else {
      res.render('member/edit.ejs', {
        user: curUser,
        member: curUser,
        updateMessage: 'Unknown form submission.'
      });
    }
  }
});

// Specific member page (Destroy route)
router.delete('/:username', async (req, res)=>{
  try {
    let curUser = req.session.curUser;
    let name = pageUtils.cleanString(req.params.username);
    if (curUser.username!=name && !curUser.isAdmin) {
      // Non-admin user is trying to delete someone else
      console.log(curUser.username, 'tried to delete', name);
      res.redirect('back');
    } else {
      // Delete all the pending friend requests by this user
      await Message.remove({sender: curUser.username, isFriendInvite: true});
      // Delete all the messages sent to this user
      await Message.remove({recipient: curUser.username});
      // Delete the user
      await Member.findByIdAndRemove(curUser._id);
      // Log the now deleted user out and redirect to main landing page
      req.session.curUser = null;
      res.redirect('/');
    }
  } catch (err) {
    // Log for debugging purposes
    console.log(err.message);
    res.redirect(req.baseUrl+'/account');
  }
});

// Specific member page (Show route)
router.get('/:username', async (req, res)=>{
  try {
    let curUser = req.session.curUser;
    let name = pageUtils.cleanString(req.params.username).toLowerCase();
    let foundUser = await Member.findOne({internalName: name});
    if (!foundUser) {
      // Was a bogus user name, redirect back to the member index
      res.redirect(req.baseUrl);
    } else {
      // Check to see if the member has sent the user a friend request
      let criteria = {sender: foundUser.username, recipient: curUser.username, isFriendInvite: true};
      let friendRequest = await Message.findOne(criteria);
      let frExists = (friendRequest ? true : false);
      // Switch which page is shown based on user settings/relation
      let fullySee = curUser.isAdmin || canSee(foundUser, curUser);
      res.render(
        (fullySee ? 'member/show.ejs' : 'member/noshow.ejs'),
        {user: curUser, member: foundUser, awaitingReply: frExists, splitMessage: splitMessage}
      );
    }
  } catch (err) {
    // Log for debugging purposes
    console.log(err.message);
    res.redirect(req.baseUrl);
  }
});

// Revoke a friend request
router.get('/:username/revoke', async (req, res)=>{
  try {
    let curUser = req.session.curUser;
    let name = pageUtils.cleanString(req.params.username);
    let pending = (curUser.pending.indexOf(name) != -1);
    if (pending) {
      // Remove the pending status
      let update = {$pull: {pending: name}};
      curUser = await Member.findByIdAndUpdate(curUser._id, update, {new: true});
      req.session.curUser = curUser;
      // Delete the request
      let toRemove = {sender: curUser.username, recipient: name, isFriendInvite: true};
      await Message.remove(toRemove);
    }
  } catch (err) {
    // Log for debugging purposes
    console.log(err.message);
  }
  // Send them back
  res.redirect('back');
});

// Send a user a friend invite
router.post('/:username/befriend', async (req, res)=>{
  let name = pageUtils.cleanString(req.params.username);
  try {
    let curUser = req.session.curUser;
    let self = (curUser.internalName == name.toLowerCase());
    let blacklisted = (curUser.blacklist.indexOf(name) != -1);
    let alreadyFriends = (curUser.friends.indexOf(name) != -1);
    if (!(self || blacklisted || alreadyFriends)) {
      // Find the member
      let foundUser = await Member.findOne({internalName: name.toLowerCase()});
      if (!foundUser) {
        // Member doesn't exist - send user to members page
        res.redirect(req.baseUrl);
        return;
      }
      // Modify user to be aware they sent a request
      let update = {$push: {pending: foundUser.username}};
      curUser = await Member.findByIdAndUpdate(curUser._id, update, {new: true});
      req.session.curUser = curUser;
      // Create a new friend request (if the member hasn't blacklisted the user)
      let allowSend = (foundUser.blacklist.indexOf(curUser.username) == -1);
      if (allowSend) {
        let friendRequest = {
          sender: curUser.username,
          recipient: foundUser.username,
          message: pageUtils.cleanString(req.body.message),
          isFriendInvite: true
        };
        await Message.create(friendRequest);
      }
    }
  } catch (err) {
    // Log for debugging purposes
    console.log(err.message);
  }
  // Send the user back to the member page
  res.redirect(req.baseUrl+'/'+name);
});

// Logic for defreinding - returns the updated curUser
const defriend = async (curUser, member) => {
  // don't use a try/catch so any errors will propogate up
  await Member.findByIdAndUpdate(member._id, {
    $pull: {friends: curUser.username}
  });
  return await Member.findByIdAndUpdate(curUser._id, {
    $pull: {friends: member.username}
  });
}

// Defriend a member
router.post('/:username/defriend', async (req, res)=>{
  try {
    let curUser = req.session.curUser;
    let name = pageUtils.cleanString(req.params.username);
    let areFriends = (curUser.friends.indexOf(name) != -1);
    if (areFriends) {
      let foundUser = await Member.findOne({internalName: name.toLowerCase()});
      if (foundUser) {
        curUser = defriend(curUser, foundUser);
        req.session.curUser = curUser;
      }
    }
  } catch (err) {
    // Log for debugging purposes
    console.log(err.message);
  }
  // Send the user back
  res.redirect('back');
});

// Blacklist a member
router.post('/:username/blacklist', async (req, res)=>{
  try {
    let curUser = req.session.curUser;
    let name = pageUtils.cleanString(req.params.username);
    let self = (curUser.internalName == name.toLowerCase());
    let alreadyBlacklisted = (curUser.blacklist.indexOf(name) != -1);
    if (!(self || alreadyBlacklisted)) {
      let foundUser = await Member.findOne({internalName: name.toLowerCase()});
      if (foundUser) {
        let areFriends = (curUser.friends.indexOf(foundUser.username) != -1);
        if (areFriends) {
          // defriend the user before blacklisting
          curUser = defriend(curUser, foundUser);
          req.session.curUser = curUser;
        }
        // Modify user to know who they've blacklisted
        let update = {$push: {blacklist: foundUser.username}};
        curUser = await Member.findByIdAndUpdate(curUser._id, update, {new: true});
        req.session.curUser = curUser;
        // Delete any messages sent to user by blacklisted member
        let toDelete = {sender: foundUser.username, recipient: curUser.username};
        if (!curUser.delOnBlacklist) {
          // Only delete the friend requests
          toDelete.isFriendInvite = true;
        }
        await Message.remove(toDelete);
      }
    }
  } catch (err) {
    // Log for debugging purposes
    console.log(err.message);
  }
  // Send them back
  res.redirect('back');
});

// Unresolved get requests should direct back to the member index
router.get('/*', (req, res)=>{
  res.redirect(req.baseUrl);
})

// Export the router for use as middleware
module.exports = router;
