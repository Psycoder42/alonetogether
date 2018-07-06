// Module dependencies
const mongoose = require('mongoose');

// Open a connection to a specific database
module.exports.openConnection = (dbName, mongoUri='mongodb://localhost:27017/') => {
  let conn = mongoose.createConnection(mongoUri+dbName);
  conn.on('error', (err) => console.log(err.message));
  conn.once('connected', () => console.log('Mongo connected: ', mongoUri+dbName));
  conn.once('disconnected', () => console.log('Mongo disconnected: ', mongoUri+dbName));
  conn.once('open', ()=> console.log('Connection open: ', mongoUri+dbName));
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
