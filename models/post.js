// Module dependencies
const mongoose = require('mongoose');

const validVisibilities = ['all','friends','self'];

// Schema definition
const postSchema = mongoose.Schema({
  author: {type: String, required: true},
  visibility: {type: String, enum: validVisibilities, required: true},
  content: {type: String, required: true}
}, {timestamps: true});

// Model exports
module.exports.schema = postSchema;
module.exports.getModel = (conn) => {
  return conn.model("Post", postSchema);
}

// Return a query that finds member's posts visible to curUser
module.exports.getPostQuery = (member, curUser) => {
  // Start wil finding all posts (good for self)
  let query = {author: member.username};
  if (member._id.toString() != curUser._id.toString()) {
    // Not self so we need to limit some more
    if (!curUser.isAdmin && member.friends.indexOf(curUser.username)==-1) {
      // Not friends only return the public posts
      query.visibility = 'all';
    } else {
      // Friends so just don't show the self posts
      // Admins can also see posts that are scoped outside 'self'
      query.visibility = {$ne: 'self'};
    }
  }
  return query;
};

module.exports.validScope = (str) => {
  return (validVisibilities.indexOf(str) != -1);
}
