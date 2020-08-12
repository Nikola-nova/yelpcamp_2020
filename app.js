const express = require('express');

const app = express();
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const flash = require('connect-flash');
const passport = require('passport');
const LocalStrategy = require('passport-local');
const methodOverride = require('method-override');
const User = require('./models/user');
// const seedDB = require('./seeds');

// requiring routes
const commentRoutes = require('./routes/comments');
const campgroundRoutes = require('./routes/campgrounds');
const indexRoutes = require('./routes/index');

const databaseUri = process.env.DATABASEURL || 'mongodb://localhost/yelp_camp';

mongoose
  .connect(databaseUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log('Connected to DB!'))
  .catch((err) => console.log(`Database connection error: ${err.message}`));

mongoose.set('useFindAndModify', false);
app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.use(express.static(`${__dirname}/public`));
app.use(methodOverride('_method'));
app.use(flash());
// seedDB(); // seed the database

// PASSPORT CONFIGURATION
app.use(
  require('express-session')({
    secret: 'Once again Rusty wins cutest dog!',
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((request, response, next) => {
  response.locals.currentUser = request.user;
  response.locals.error = request.flash('error');
  response.locals.success = request.flash('success');
  next();
});

app.use('/', indexRoutes);
app.use('/campgrounds', campgroundRoutes);
app.use('/campgrounds/:id/comments', commentRoutes);

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log('The YelpCamp Server Has Started!');
});
