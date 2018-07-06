// Module dependencies
const mongoose = require('mongoose');

// Open a connection to a specific database
module.exports.openConnection = (mongoUri=null) => {
  let uri = process.env.MONGODB_URI || mongoUri;
  let conn = mongoose.createConnection(uri, { useNewUrlParser: true });
  conn.on('error', (err) => console.log(err.message));
  conn.once('connected', () => console.log('Mongo connected: ', uri));
  conn.once('disconnected', () => console.log('Mongo disconnected: ', uri));
  conn.once('open', ()=> console.log('Connection open: ', uri));
  return conn;
}

// Generate a pseudo-random string of chars of a particular length
module.exports.genHash = (length=64) => {
  let hash = ''
  while (hash.length < length) {
    hash += Math.random().toString(36).substring(2);
  }
  return hash.substring(0, length);
}
