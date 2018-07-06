// Module dependencies
const bcrypt = require('bcrypt');

// Returns a funtion to check whether the client is logged in and
// optionally if the client is admin and redirects to a designated page
// if the client does not meet the requirements
const genMiddlewareFunc = (
    sessionKey='authUser',
    adminFlag=null,
    redirect='/',
    exceptions=[]) => {
  return (req, res, next) => {
    // Check if the path is one of the exceptions
    let destination = req.path.trim().toLowerCase();
    for (let ePath of exceptions) {
      if (ePath.toLowerCase() == destination) {
        // This particular path is not secured
        next();
        // Make sure this middleware stops processing
        return;
      }
    }
    // Enforce the security
    if (req.session[sessionKey]) {
      let hasAccess = (adminFlag==null || req.session[sessionKey][adminFlag]);
      if (hasAccess) {
        next();
      } else {
        console.log(`Non-admin attempt to access: ${req.baseUrl}${req.path}`);
        res.redirect(redirect);
      }
    } else {
      console.log(`Unauthenticated attempt to access: ${req.baseUrl}${req.path}`);
      res.redirect(redirect);
    }
  };
}

// A simple middleware function to ensure that the user is authenticated
module.exports.authenticated = (
    sessionKey='authUser',
    redirect='/',
    exceptions=[]) => {
  return genMiddlewareFunc(sessionKey, null, redirect, exceptions);
}

// A simple middleware function to ensure that the user is authenticated and admin
module.exports.admin = (
    sessionKey='authUser',
    adminFlag='isAdmin',
    redirect='/',
    exceptions=[]) => {
  return genMiddlewareFunc(sessionKey, adminFlag, redirect, exceptions);
}

//
