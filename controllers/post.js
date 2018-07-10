// Module dependencies
const mongoose = require('mongoose');
const express = require('express');
const router = express.Router();

// Custom modules
const posts = require('../models/post.js');
const pageUtils = require('../utils/pageUtils.js');
const security = require('../utils/securityUtils.js');

// DB interactivity
const Post = posts.getModel(mongoose.connection);

// Parse the post object from form data
const parsePostObj = (curUser, formData) => {
  let postObj = {
    author: curUser.username,
    visibility: pageUtils.cleanString(formData.scope).toLowerCase(),
    content: pageUtils.cleanString(formData.content)
  };
  // Return null if the data is bad
  if (!postObj.content || !posts.validScope(postObj.visibility)) {
    return null;
  }
  // Return the parsed object
  return postObj;
};

// These routes are for authenticated users only
router.use(security.authenticated('curUser', '/login'));

// Create a new post (Create route)
router.post('/', async (req, res)=>{
  try {
    let curUser = req.session.curUser;
    let postObj = parsePostObj(curUser, req.body);
    if (postObj) {
      // Create the new post
      await Post.create(postObj);
    }
  } catch (err) {
    // Log for debugging purposes
    console.log(err.message);
  }
  // Send the user back
  res.redirect('back');
});

// Detele a post (Destroy route)
router.delete('/:id', async (req, res)=>{
  try {
    let curUser = req.session.curUser;
    let postId = pageUtils.cleanString(req.params.id);
    let foundPost = await Post.findById(postId);
    if (foundPost) {
      if (curUser.username != foundPost.author) {
        // User tried to delete someone else's post
        console.log(curUser.username, 'tried to delete post from ', foundPost.author);
      } else {
        // Delete the post
        await Post.findByIdAndRemove(foundPost._id);
      }
    }
  } catch (err) {
    // Log for debugging purposes
    console.log(err.message);
  }
  // Send the user back
  res.redirect('back');
});

// Edit a post (Update route)
router.put('/:id', async (req, res)=>{
  try {
    let curUser = req.session.curUser;
    let postId = pageUtils.cleanString(req.params.id);
    let foundPost = await Post.findById(postId);
    if (foundPost) {
      if (curUser.username != foundPost.author) {
        // User tried to update someone else's post
        console.log(curUser.username, 'tried to edit post from ', foundPost.author);
      } else {
        // Update the post
        let postObj = parsePostObj(curUser, req.body);
        if (postObj) {
          // Create the new post
          await Post.findByIdAndUpdate(foundPost._id, postObj);
        }
      }
    }
  } catch (err) {
    // Log for debugging purposes
    console.log(err.message);
  }
  // Send the user back
  res.redirect('back');
});

// Export the router for use as middleware
module.exports = router;
