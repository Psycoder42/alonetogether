// Module dependencies
const mongoose = require('mongoose');

// Schema definition
const postSchema = mongoose.Schema({
  author: {type: String, required: true},
  visibility: {type: String, enum: ['all','friends','self'], required: true},
  content: {type: String, required: true},
  likes: {type: Number, min: 0, default: 0}
}, {timestamps: true});

// Model exports
module.exports.schema = messageSchema;
module.exports.getModel = (conn) => {
  return conn.model("Message", messageSchema);
}
