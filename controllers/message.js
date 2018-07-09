// Module dependencies
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();

// Custom modules
const members = require('../models/member.js');
const messages = require('../models/message.js');
const pageUtils = require('../utils/pageUtils.js');
const security = require('../utils/securityUtils.js');

// DB interactivity
const Member = members.getModel(mongoose.connection);
const Message = messages.getModel(mongoose.connection);

// These routes are for authenticated users only
router.use(security.authenticated('curUser', '/login'));

// Send a message (Create route)
router.post('/', async (req, res)=>{
  try {
    let curUser = req.session.curUser;
    let to = pageUtils.cleanString(req.body.recipient);
    let message = pageUtils.cleanString(req.body.message);
    if (to.length>0 && message.length>0) {
      let foundUser = await Member.findOne({internalName: to.toLowerCase()});
      if (foundUser) {
        let blacklisted = (foundUser.blacklist.indexOf(curUser.username) != -1);
        if (!blacklisted) {
          // Send the message
          let content = {
            sender: curUser.username,
            recipient: foundUser.username,
            message: message,
            isFriendInvite: false
          };
          await Message.create(content);
        }
      }
    }
  } catch (err) {
    // Log for debugging purposes
    console.log(err.message);
  }
  // Send them back
  res.redirect('back');
});

// Logic to delete a message
const deleteMessage = async (curUser, toDelete) => {
  let deleted = null;
  let canDelete = (curUser.isAdmin || toDelete.recipient==curUser.username);
  if (canDelete) {
    deleted = await Message.remove({_id: toDelete._id});
  }
  return deleted;
};

// Delete a message (Destroy route)
router.delete('/:id', async (req, res)=>{
  try {
    let curUser = req.session.curUser;
    let messageId = pageUtils.cleanString(req.params.id);
    if (messageId.length > 0) {
      let toDelete = await Message.findById(messageId);
      if (toDelete) {
        let canDelete = (curUser.isAdmin || toDelete.recipient==curUser.username);
        if (canDelete) {
          deleteMessage(curUser, toDelete);
        }
      }
    }
  } catch (err) {
    // Log for debugging purposes
    console.log(err.message);
  }
  // Send them back
  res.redirect('back');
});

// Logic to reply to a friend request
const respondToRequest = async (req, res, accept) => {
  try {
    let curUser = req.session.curUser;
    let messageId = pageUtils.cleanString(req.params.id);
    if (messageId.length > 0) {
      let respondingTo = await Message.findById(messageId);
      if (respondingTo && respondingTo.isFriendInvite) {
        // Only deal with messages that are friend requests
        let canRespond = (curUser.isAdmin || respondingTo.recipient==curUser.username);
        if (canRespond) {
          let otherMember = await Member.findOne({username: respondingTo.sender});
          if (otherMember) {
            // Prime to remove the pending state
            let friendUpdate = {$pull: {pending: curUser.username}};
            if (accept) {
              // Add the new friend as part of the update of the other member
              friendUpdate['$push'] = {friends: curUser.username};
              // Add friend to the curUser and update the session
              let userUpdate = {$push: {friends: otherMember.username}};
              curUser = await Member.findByIdAndUpdate(curUser._id, userUpdate, {new: true});
              req.session.curUser = curUser;
            }
            // Remove the pending tracker (and update friends if accepted)
            await Member.findByIdAndUpdate(otherMember._id, friendUpdate);
          }
          // Get rid of the friend request
          deleteMessage(curUser, respondingTo);
        }
      }
    }
  } catch (err) {
    // Log for debugging purposes
    console.log(err.message);
  }
  // Send them back
  res.redirect('back');
}

// Accept a friend request
router.post('/:id/accept', (req, res)=>{
  respondToRequest(req, res, true);
});

// Reject a friend request
router.post('/:id/reject', (req, res)=>{
  respondToRequest(req, res, false);
});

// Unresolved get requests should direct back to the member inbox
router.get('/*', (req, res)=>{
  res.redirect('/members/inbox');
});

// Export the router for use as middleware
module.exports = router;
