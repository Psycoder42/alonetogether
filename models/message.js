// Module dependencies
const mongoose = require('mongoose');

// Schema definition
const messageSchema = mongoose.Schema({
  sender: {type: String, required: true},
  message: {type: String, required: true},
  isFriendInvite: Boolean
}, {timestamps: true});

// Model exports
module.exports.schema = messageSchema;
module.exports.getModel = (conn) => {
  return conn.model("Message", messageSchema);
}
