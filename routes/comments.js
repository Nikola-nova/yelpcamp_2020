const express = require('express');

const router = express.Router({ mergeParams: true });
const Campground = require('../models/campground');
const Comment = require('../models/comment');
const middleware = require('../middleware');

// Comments New
router.get('/new', middleware.isLoggedin, (request, response) => {
  // find campground by id
  Campground.findById(request.params.id, (err, campground) => {
    if (err) {
      console.log('Error:', err);
    } else {
      response.render('comments/new', { campground: campground });
    }
  });
});

// Comments Create
router.post('/', middleware.isLoggedin, (request, response) => {
  // lookup campground using id
  Campground.findById(request.params.id, (err, campground) => {
    if (err) {
      console.log('Error:', err);
      response.redirect('/campgrounds');
    } else {
      // eslint-disable-next-line no-shadow
      Comment.create(request.body.comment, (err, comment) => {
        if (err) {
          request.flash('error', 'Something went wrong');
          console.log('Error:', err);
        } else {
          // add username and id to comment
          // eslint-disable-next-line no-param-reassign
          comment.author.id = request.user._id;
          // eslint-disable-next-line no-param-reassign
          comment.author.username = request.user.username;
          // save comment
          comment.save();
          campground.comments.push(comment);
          campground.save();
          request.flash('success', 'Successfully added comment');
          // eslint-disable-next-line no-underscore-dangle
          response.redirect(`/campgrounds/${campground._id}`);
        }
      });
    }
  });
});

// COMMENTS EDIT ROUTE
router.get(
  '/:comment_id/edit',
  middleware.checkCommentOwnership,
  (request, response) => {
    // eslint-disable-next-line consistent-return
    Campground.findById(request.params.id, (err, foundCampground) => {
      if (err || !foundCampground) {
        request.flash('error', 'No campground found');
        return response.redirect('back');
      }
      // eslint-disable-next-line no-shadow
      Comment.findById(request.params.comment_id, (err, foundComment) => {
        if (err) {
          response.redirect('back');
        } else {
          response.render('comments/edit', {
            campground_id: request.params.id,
            comment: foundComment,
          });
        }
      });
    });
  }
);

// COMMENTS UPDATE ROUTE
router.put(
  '/:comment_id',
  middleware.checkCommentOwnership,
  (request, response) => {
    Comment.findByIdAndUpdate(
      request.params.comment_id,
      request.body.comment,
      (err) => {
        if (err) {
          response.redirect('back');
        } else {
          response.redirect(`/campgrounds/${request.params.id}`);
        }
      }
    );
  }
);

// COMMENTS DESTROY ROUTE
router.delete(
  '/:comment_id',
  middleware.checkCommentOwnership,
  (request, response) => {
    Comment.findByIdAndRemove(request.params.comment_id, (err) => {
      if (err) {
        response.redirect('back');
      } else {
        request.flash('success', 'Comment deleted');
        response.redirect(`/campgrounds/${request.params.id}`);
      }
    });
  }
);

module.exports = router;
