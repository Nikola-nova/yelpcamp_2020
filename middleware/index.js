const Campground = require('../models/campground');
const Comment = require('../models/comment');

// all ther middleware goes here
const middlewareObj = {};

middlewareObj.checkCampgroundOwnership = (request, response, next) => {
	if (request.isAuthenticated()) {
		Campground.findById(request.params.id, (err, foundCampground) => {
			if (err || !foundCampground) {
				request.flash('error', 'Campground not found');
				response.redirect('back');
			} else {
				// does the user own the campground
				if (
					foundCampground.author.id.equals(request.user._id) ||
					request.user.isAdmin
				) {
					next();
				} else {
					request.flash('error', "You don't have permission to do that");
					response.redirect('back');
				}
			}
		});
	} else {
		request.flash('error', 'You need to be logged in to do that');
		response.redirect('back');
	}
};

middlewareObj.checkCommentOwnership = (request, response, next) => {
	if (request.isAuthenticated()) {
		Comment.findById(request.params.comment_id, (err, foundComment) => {
			if (err || !foundComment) {
				request.flash('error', 'Comment not found');
				response.redirect('back');
			} else {
				// does the user own the comment?
				if (
					foundComment.author.id.equals(request.user._id) ||
					request.user.isAdmin
				) {
					next();
				} else {
					request.flash('error', "You don't have permission to do that");
					response.redirect('back');
				}
			}
		});
	} else {
		request.flash('error', 'You need to be logged in to do that');
		response.redirect('back');
	}
};

middlewareObj.isLoggedin = (request, response, next) => {
	if (request.isAuthenticated()) {
		return next();
	}
	request.flash('error', 'You need to be logged in to do that');
	response.redirect('/login');
};

module.exports = middlewareObj;
