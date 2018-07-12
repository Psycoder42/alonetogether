// Module dependencies
// Common modules: ejs express mongoose method-override
const ejs = require('ejs');
const express = require('express');
const favicon = require('serve-favicon');
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
app.use(favicon('./public/favicon.ico'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use((req, res, next) => {
  // Move the _method property from the body to the headers
  // This hack prevents the url from showing the override parameter
  if (req.body._method) {
    req.headers['x-method-override'] = req.body._method
    delete req.body._method;
  }
  next();
});
app.use(methodOverride('x-method-override'));
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
// Message routes
const messageRoutes = require('./controllers/message.js');
app.use('/messages', messageRoutes);
// Post routes
const postRoutes = require('./controllers/post.js');
app.use('/posts', postRoutes);
// Public routes
const publicRoutes = require('./controllers/public.js');
app.use('/', publicRoutes);

// All others end up with the 404 page
app.get('*', (req, res)=>{
  res.render('public/404.ejs', { user: req.session.curUser});
});

// Use a global DB connection
connUtils.connect('mongodb://localhost:27017/alone_together');

// Start the server
app.listen(port, ()=>{
  console.log("Server listening on port", port);
});
