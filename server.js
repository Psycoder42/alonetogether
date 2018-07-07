// Module dependencies
// Common modules: ejs express mongoose method-override
const express = require('express');
const session = require('express-session');
const methodOverride = require('method-override');
const MemoryStore = require('memorystore')(session);

// Custom modules
const connUtils = require('./utils/connectionUtils.js');

// Global configuration
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.static('./public'));
app.use(express.urlencoded({extended: false}));
app.use(express.json());
app.use(methodOverride('_method'));
app.use(session({
  resave: false,
  saveUninitialized: false,
  secret: connUtils.genHash(),
  store: new MemoryStore({
    // Remove expired every 24 hours (1000ms x 60s x 60m x 24h = 86400000)
    checkPeriod: 86400000
  })
}));

// Route to the controllers
// Login routes
const logInRoutes = require('./controllers/login.js');
app.use('/login', logInRoutes);
// Admin routes
const adminRoutes = require('./controllers/admin.js');
app.use('/admins', adminRoutes);
// Member routes
const memberRoutes = require('./controllers/member.js');
app.use('/members', memberRoutes);
// Public routes
const publicRoutes = require('./controllers/public.js');
app.use('/', publicRoutes);

// All others end up with the 404 page
app.get('*', (req, res)=>{
  res.status(404).send("Here Be Dragons");
})

// Use a global DB connection
connUtils.connect('mongodb://localhost:27017/alone_together');

// Start the server
app.listen(port, ()=>{
  console.log("Server listening on port", port);
});
