const express = require('express');

const router = express.Router();
const passport = require('passport');
const User = require('../models/user');
const Campground = require('../models/campground');
const middleware = require('../middleware');

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
  const newUser = new User({
    username: request.body.username,
    firstName: request.body.firstName,
    lastName: request.body.lastName,
    email: request.body.email,
    avatar: request.body.avatar,
    description: request.body.description,
  });

  if (request.body.adminCode === 'palacinka25') {
    newUser.isAdmin = true;
  }

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
  (request, response) => {}
);

// logout route
router.get('/logout', (request, response) => {
  request.logout();
  request.flash('success', 'Logged you out!');
  response.redirect('/campgrounds');
});

// User Profiles
// SHOW - shows more info about one campground
router.get('/users/:id', (request, response) => {
  User.findById(request.params.id, (err, foundUser) => {
    if (err) {
      request.flash('error', 'Something went wrong.');
      response.redirect('/');
    }
    Campground.find()
      .where('author.id')
      .equals(foundUser._id)
      // eslint-disable-next-line no-shadow
      .exec((err, foundCampground) => {
        if (err) {
          request.flash('error', 'Something went wrong.');
          response.redirect('/');
        }
        response.render('users/show', {
          user: foundUser,
          campgrounds: foundCampground,
        });
      });
  });
});

// EDIT USER ROUTE
router.get(
  '/users/:id/edit',
  middleware.checkUserOwnership,
  (request, response) => {
    User.findById(request.params.id, (err, foundUser) => {
      if (err) {
        request.flash('error', 'Something went wrong.');
        response.redirect('/users/:id');
      } else {
        response.render('users/edit', { user: foundUser });
      }
    });
  }
);

// UPDATE USER ROUTE
router.put('/users/:id', middleware.checkUserOwnership, (request, response) => {
  // find and update the correct campground
  User.findByIdAndUpdate(
    request.params.id,
    request.body.user,
    (err, foundUser) => {
      if (err || !foundUser) {
        request.flash('error', 'Something went wrong.');
        response.redirect('/users/:id');
      } else {
        request.flash('success', 'Successfully Updated!');
        response.redirect(`/users/${request.params.id}`);
      }
    }
  );
});

// DESTROY USER ROUTE
router.delete(
  '/users/:id',
  middleware.checkUserOwnership,
  async (request, response) => {
    try {
      const foundUser = await User.findByIdAndRemove(request.params.id);
      await foundUser.remove();
      request.flash('success', 'User successfully removed');
      response.redirect('/campgrounds');
    } catch (err) {
      request.flash('error', 'Something went wrong');
      response.redirect(`/user/${request.params.id}`);
    }
  }
);

module.exports = router;
