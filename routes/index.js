const express = require('express');

const router = express.Router();
const passport = require('passport');
const User = require('../models/user');

// root route
router.get('/', (request, response) => {
  response.render('landing');
});

// show register form
router.get('/register', (request, response) => {
  response.render('register', { page: 'register' });
});

// handle sign up logic
router.post('/register', (request, response) => {
  const newUser = new User({ username: request.body.username });
  if (request.body.adminCode === 'palacinka25') {
    newUser.isAdmin = true;
  }
  // eslint-disable-next-line consistent-return
  User.register(newUser, request.body.password, (err, user) => {
    if (err) {
      request.flash('error', err.message);
      return response.redirect('/register');
    }
    passport.authenticate('local')(request, response, () => {
      request.flash('success', `Welcome to YelpCamp ${user.username}`);
      response.redirect('/campgrounds');
    });
  });
});

// show login form
router.get('/login', (request, response) => {
  response.render('login', { page: 'login' });
});

// handle login logic
router.post(
  '/login',
  passport.authenticate('local', {
    successRedirect: '/campgrounds',
    failureRedirect: '/login',
  }),
  // eslint-disable-next-line no-unused-vars
  (request, response) => {}
);

// logout route
router.get('/logout', (request, response) => {
  request.logout();
  request.flash('success', 'Logged you out!');
  response.redirect('/campgrounds');
});

module.exports = router;
