// Module dependencies
// Common modules: ejs express mongoose method-override
const express = require('express');
const methodOverride = require('method-override');

// Global configuration
const app = express();
const port = 3000;

// Middleware
app.use(express.urlencoded({extended:false}));
app.use(express.json());
app.use(methodOverride('_method'));

// Route to the controllers
const routes = require('./controllers/routes.js');
app.use('/', routes.router);

// Start the server
app.listen(port, ()=>{
  console.log("Server lisening on port", port);
});
