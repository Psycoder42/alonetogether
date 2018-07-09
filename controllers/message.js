// Module dependencies
const express = require('express');
const router = express.Router();

// Custom modules
const security = require('../utils/securityUtils.js');

// These routes are for authenticated users only
router.use(security.authenticated('curUser', '/login'));



// Unresolved get requests should direct back to the member inbox
router.get('/*', (req, res)=>{
  res.redirect('/members/inbox');
})

// Export the router for use as middleware
module.exports = router;
