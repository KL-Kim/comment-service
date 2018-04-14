import Promise from 'bluebird';
import httpStatus from 'http-status';
import passport from 'passport';
import fs from 'fs';
import fsx from 'fs-extra';
import _ from 'lodash';

import BaseController from './base.controller';
import APIError from '../helper/api-error';
import Review from '../models/review.model';
import ac from '../config/rbac.config';

class ReviewController extends BaseController {
  constructor() {
    super();
  }

  /**
   * Get reviews list
   * @property {ObjectId} req.query.bid - business id
   * @property {ObjectId} req.query.uid - user id
   * @property {Number} req.query.skip - Number of reviews to skip
   * @property {Number} req.query.limit - Number of reviews page limit
   * @property {String} req.query.search - Search term
   */
  getReviews(req, res, next) {
    const { skip, limit, search, bid, uid } = req.query;

    Review.getCount({search, filter: { bid, uid }}).then(totalCount => {
      req.totalCount = totalCount;

      return Review.getList({ skip, limit, search, filter: { bid, uid } })
    })
    .then(list => {
      return res.json({
        list: list,
        totalCount: req.totalCount,
      });
    })
    .catch(err => {
      return next(err);
    });
  }

  /**
   * Add new review
   * @property {ObjectId} req.body.businessId - Business id
   * @property {ObjectId} req.body.uid - User id
   * @property {String} req.body.content  - Review content
   * @property {Number} req.body.rating - Review rating
   * @property {Boolean} req.body.serviceGood - Service is good or not
   * @property {Boolean} req.body.envGood - Environment is good or not
   * @property {Boolean} req.body.comeback - Will come back or not
   * @property {Object} req.files - Review images
   */
  addNewReview(req, res, next) {
    ReviewController.authenticate(req, res, next).
      then(payload => {
        const review = new Review({
          userId: req.body.uid,
          businessId: req.body.bid,
          rating: req.body.rating,
          content: req.body.content,
          serviceGood: req.body.serviceGood,
          envGood: req.body.envGood,
          comeback: req.body.comeback,
        });

        if (req.files) {
          // Save images files url
        }

        return review.save();
      })
      .then(review => {
        return res.json(review);
      });
  }

  /**
   * Update review
   * @property {ObjectId} req.body.id - Review id
   * @property {ObjectId} req.body.uid - User id
   * @property {String} req.body.content  - Review content
   * @property {Number} req.body.rating - Review rating
   * @property {Number} req.body.upVote - Review upVote
   * @property {Number} req.body.downVote - Review downVote
   * @property {Object} req.files - Review images
   * @property {String} req.body.status - Only manager, admin and god can update review status
   */
  updateReview(req, res, next) {
    ReviewController.authenticate(req, res, next)
      .then(payload => {
        req.payload = payload;
        return Review.getById(req.body.id);
      })
      .then(review => {
        if (review) {
          let permission;

          if (review.id.toString() === req.body.uid) {
            permission = ac.can(payload.role).udpateOwn('review');
          } else {
            permission = ac.can(payload.role).udpateAny('review');
          }

          const data = permission.filter(req.body);

          if (data.content)
            review.content = data.content;

          if (data.rating)
            review.rating = data.rating;

          if (data.files) {
            //add new images
          }

          return review.save();

        } else {
          throw new APIError("Not found", httpStatus.NOT_FOUND);
        }
      })
      .then(review => {
        return review.json(review);
      })
      .catch(err => {
        return next(err);
      });
  }

  /**
   * Delete review
   * @property {ObjectId} req.body.id - Review id
   */
  deleteReview(req, res, next) {
    ReviewController.authenticate(req, res, next)
      .then(payload => {
        req.payload = payload;
        return Review.findByIdAndRemove(req.body.id).exec();
      })
      .then(review => {
        if (review) {
          // Delete related iamges
        } else {
          throw new APIError("Not found", httpStatus.NOT_FOUND);
        }
      })
      .catch(err => {
        return next(err);
      });
  }

  /**
   * Delete review image
   */
  deleteImage(req, res, next) {
    return res.json("Delete review image");
  }

  /**
   * Authenticate
   */
  static authenticate(req, res, next) {
 		return new Promise((resolve, reject) => {
 			passport.authenticate('access-token', (err, payload, info) => {
 				if (err) return reject(err);
 				if (info) return reject(new APIError(info.message, httpStatus.UNAUTHORIZED));

        if (payload.uid !== req.body.uid) {
          reject(new APIError("Forbidden", httpStatus.FORBIDDEN));
        } else {
          return resolve(payload.role);
        }
 			})(req, res, next);
 		});
 	}
}

export default ReviewController;
