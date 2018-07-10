// Module dependencies
const mongoose = require('mongoose');

// Schema definition
const memberSchema = mongoose.Schema({
  internalName: {type: String, required: true, unique: true},
  username: {type: String, required: true},
  password: {type: String, required: true},
  isAdmin: {type: Boolean, default: false},
  friendsOnly: {type: Boolean, default: false},
  delOnBlacklist: {type: Boolean, default: true},
  profilePic: String,
  bio: String,
  blacklist: [String],
  friends: [String],
  pending: [String]
});

// Model exports

// The schema in case another schema wants to use this as a sub-document
module.exports.schema = memberSchema;

// A function to get the model for a specific DB connection
module.exports.getModel = (conn) => {
  return conn.model("Member", memberSchema);
}

// Returns true if m1 has m2 in their friends list
module.exports.areFriends = (m1, m2) => {
  return (m1.friends.indexOf(m2.username) > -1);
}

// Returns true if m1 has m2 in their blacklist
module.exports.isBlocked = (m1, m2) => {
  return (m1.blacklist.indexOf(m2.username) > -1);
}
