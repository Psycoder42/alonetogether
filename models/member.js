// Module dependencies
const mongoose = require('mongoose');

// Schema definition
const memberSchema = mongoose.Schema({
  username: {type: String, required: true, unique: true},
  password: {type: String, required: true},
  isAdmin: {type: Boolean, default: false},
  isHiding: {type: Boolean, default: false},
  friendsOnly: {type: Boolean, default: false},
  softBlacklist: {type: Boolean, default: true},
  profilePic: String,
  bio: String,
  inbox: [String],
  blacklist: [String],
  friends: [{
    id: String,
    username: String
  }]
});

// Model exports

// The schema in case another schema wants to use this as a sub-document
module.exports.schema = memberSchema;

// A function to get the model for a specific DB connection
module.exports.getModel = (conn) => {
  return conn.model("Member", memberSchema);
}
