const express = require('express');
const router = express.Router();
const Campground = require('../models/campground');
const middleware = require('../middleware');

// middlewares
const isLoggedIn = (request, response, next) => {
    if (request.isAuthenticated()) {
        return next();
    }
    response.redirect('/login');
}

// INDEX- show all campgrounds
router.get('/', (request, response) => {
    // Get all campgrounds from DB
    Campground.find({}, (err, allCampgrounds) => {
        if (err) {
            console.log('Error:', err);
        } else {
            response.render('campgrounds/index', { campgrounds: allCampgrounds });
        }
    });
});

// CREATE - add new campground
router.post("/", middleware.isLoggedin, (request, response) => {
    const name = request.body.name;
    const price = request.body.price;
    const image = request.body.image;
    const desc = request.body.description;
    const author = {
        id: request.user._id,
        username: request.user.username
    };
    const newCampground = { name: name, price: price, image: image, description: desc, author: author };
    // Create a new campground and save to DB
    Campground.create(newCampground, (err, newlyCreated) => {
        if (err) {
            console.log('Error:', err);
        } else {
            // redirect back to campgrounds page
            response.redirect("/campgrounds");
        }
    });
});

// NEW - show form to create new campground
router.get('/new', middleware.isLoggedin, (request, response) => {
    response.render("campgrounds/new");
});

// SHOW - shows more info about one campground
router.get('/:id', (request, response) => {
    // find campground with provided ID
    Campground.findById(request.params.id).populate("comments").exec((err, foundCampground) => {
        if (err || !foundCampground) {
            request.flash("error", "Campground not found");
            response.redirect("back");
        } else {
            // render show template with that campground
            response.render("campgrounds/show", { campground: foundCampground });
        }
    });
});

// EDIT CAMPGROUND ROUTE
router.get('/:id/edit', middleware.checkCampgroundOwnership, (request, response) => {
    Campground.findById(request.params.id, (err, foundCampground) => {
        response.render('campgrounds/edit', { campground: foundCampground });
    });
});

// UPDATE CAMPGROUND ROUTE
router.put('/:id', middleware.checkCampgroundOwnership, (request, response) => {
    // find and update the correct campground
    Campground.findByIdAndUpdate(request.params.id, request.body.campground, (err, updatedCampground) => {
        if (err) {
            res.redirect('/campgrounds');
        } else {
            // redirect somewhere(show page)
            response.redirect(`/campgrounds/${request.params.id}`);
        }
    });
});

// DESTROY CAMPGROUND ROUTE
router.delete('/:id', middleware.checkCampgroundOwnership, async (request, response) => {
    try {
        let foundCampground = await Campground.findByIdAndRemove(request.params.id);
        await foundCampground.remove();
        response.redirect('/campgrounds');
    } catch (err) {
        console.log('Error', err.message);
        response.redirect('/campgrounds');
    }
});

module.exports = router;