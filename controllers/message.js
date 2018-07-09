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
          let sentMessage = await Message.create(content);
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

// Unresolved get requests should direct back to the member inbox
router.get('/*', (req, res)=>{
  res.redirect('/members/inbox');
});

// Export the router for use as middleware
module.exports = router;
