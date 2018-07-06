// Module dependencies
const express = require('express');
const router = express.Router();

// Custom modules
const security = require('../utils/securityUtils.js');

// The actual log in (Create route)
router.post('/', (req, res)=>{
  res.send('Attempting to log in');
});

// The actual log out (Destroy route)
router.delete('/', (req, res)=>{
  // Log them out and send the client to the main page
  req.session.destroy(()=>{
    res.redirect('/');
  });
});

// Display the log in form (New route)
router.get('/', (req, res)=>{
  res.send('Log in here.');
});

// Export the router for use as middleware
module.exports = router;
