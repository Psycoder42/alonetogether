// Module dependencies
// Common modules: ejs express mongoose method-override
const express = require('express');
const session = require('express-session');
const methodOverride = require('method-override');

// Custom modules
const connUtils = require('./utils/connectionUtils.js');

// Global configuration
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.urlencoded({extended:false}));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: connUtils.genHash()
}));

// Route to the controllers
// const routes = require('./controllers/routes.js');
// app.use('/', routes.router);

app.get('/', (req, res)=>{
  res.send("Here Be Dragons");
})

// Start the server
app.listen(port, ()=>{
  console.log("Server listening on port", port);
});
