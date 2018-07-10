// Module dependencies
const express = require('express');
const router = express.Router();

// The main landing page (Index route)
router.get('/', (req, res)=>{
  res.render('public/index.ejs', {
    user: req.session.curUser
  });
});

// Information about the website
router.get('/about', (req, res)=>{
  res.render('public/about.ejs', {
    user: req.session.curUser
  });
});

// A call that just sends you back (page refresh)
router.get('/refresh', (req, res)=>{
  res.redirect('back');
});

// Export the router for use as middleware
module.exports = router;
