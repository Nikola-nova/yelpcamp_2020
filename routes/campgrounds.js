const express = require('express');

const router = express.Router();
const NodeGeocoder = require('node-geocoder');
const Campground = require('../models/campground');
const middleware = require('../middleware');

const options = {
  provider: 'google',
  httpAdapter: 'https',
  apiKey: process.env.GEOCODER_API_KEY,
  formatter: null,
};

const geocoder = NodeGeocoder(options);

// INDEX- show all campgrounds
router.get('/', (request, response) => {
  let noMatch = null;
  if (request.query.search) {
    const regex = new RegExp(escapeRegex(request.query.search), 'gi');
    // Get all campgrounds from DB
    Campground.find({ name: regex }, (err, allCampgrounds) => {
      if (err) {
        console.log('Error:', err);
      } else {
        if (allCampgrounds.length < 1) {
          noMatch = 'No campgrounds match that query, please try again.';
        }
        response.render('campgrounds/index', {
          campgrounds: allCampgrounds,
          page: 'campgrounds',
          noMatch,
        });
      }
    });
  } else {
    // Get all campgrounds from DB
    Campground.find({}, (err, allCampgrounds) => {
      if (err) {
        console.log('Error:', err);
      } else {
        response.render('campgrounds/index', {
          campgrounds: allCampgrounds,
          page: 'campgrounds',
          noMatch,
        });
      }
    });
  }
});

// CREATE - add new campground
router.post('/', middleware.isLoggedin, (request, response) => {
  const { name, price, image, description } = request.body;
  const author = {
    id: request.user._id,
    username: request.user.username,
  };
  geocoder.geocode(request.body.location, (err, geoData) => {
    if (err || !geoData.length) {
      request.flash('error', 'Invalid address');
      return response.redirect('back');
    }
    const lat = parseFloat(geoData[0].latitude);
    const lng = parseFloat(geoData[0].longitude);
    const location = geoData[0].formattedAddress;
    const newCampground = {
      name,
      price,
      image,
      description,
      author,
      location,
      lat,
      lng,
    };
    // Create a new campground and save to DB
    Campground.create(newCampground, () => {
      if (err) {
        request.flash('error', 'Something went wrong, please try again.');
        response.redirect('back');
      }
      // redirect back to campgrounds page
      return response.redirect('/campgrounds');
    });
  });
});

// NEW - show form to create new campground
router.get('/new', middleware.isLoggedin, (request, response) => {
  response.render('campgrounds/new');
});

// SHOW - shows more info about one campground
router.get('/:id', (request, response) => {
  // find campground with provided ID
  Campground.findById(request.params.id)
    .populate('comments')
    .exec((err, foundCampground) => {
      if (err || !foundCampground) {
        request.flash('error', 'Campground not found');
        response.redirect('back');
      } else {
        // render show template with that campground
        response.render('campgrounds/show', { campground: foundCampground });
      }
    });
});

// EDIT CAMPGROUND ROUTE
router.get(
  '/:id/edit',
  middleware.checkCampgroundOwnership,
  (request, response) => {
    Campground.findById(
      request.params.id,
      request.body.campground,
      (err, foundCampground) => {
        response.render('campgrounds/edit', { campground: foundCampground });
      }
    );
  }
);

// UPDATE CAMPGROUND ROUTE
router.put('/:id', middleware.checkCampgroundOwnership, (request, response) => {
  geocoder.geocode(request.body.location, (err, geoData) => {
    if (err || !geoData.length) {
      console.log(err);
      request.flash('error', 'Invalid address');
      return response.redirect('back');
    }
    request.body.campground.lat = geoData[0].latitude;
    request.body.campground.lng = geoData[0].longitude;
    request.body.campground.location = geoData[0].formattedAddress;

    // find and update the correct campground
    Campground.findByIdAndUpdate(
      request.params.id,
      request.body.campground,
      () => {
        if (err || !geoData) {
          request.flash('error', 'Invalid address');
          response.redirect('back');
        } else {
          request.flash('success', 'Successfully Updated!');
          return response.redirect(`/campgrounds/${request.params.id}`);
        }
      }
    );
  });
});

// DESTROY CAMPGROUND ROUTE
router.delete(
  '/:id',
  middleware.checkCampgroundOwnership,
  async (request, response) => {
    try {
      const foundCampground = await Campground.findByIdAndRemove(
        request.params.id
      );
      await foundCampground.remove();
      response.redirect('/campgrounds');
    } catch (err) {
      console.log('Error', err.message);
      response.redirect('/campgrounds');
    }
  }
);

function escapeRegex(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

module.exports = router;
