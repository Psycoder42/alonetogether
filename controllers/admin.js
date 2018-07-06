// Module dependencies
const express = require('express');
const router = express.Router();

// Custom modules
const security = require('../utils/securityUtils.js');

// These routes are for admin users only
router.use(security.admin('curUser', 'isAdmin', '/members'));

// Export the router for use as middleware
module.exports = router;
