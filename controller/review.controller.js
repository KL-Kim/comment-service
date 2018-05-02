import Promise from 'bluebird';
import httpStatus from 'http-status';
import passport from 'passport';
import fs from 'fs';
import fsx from 'fs-extra';
import _ from 'lodash';
import { AccessControl } from 'accesscontrol';
import grpc from 'grpc';

import businessProto from '../config/grpc.config';
import BaseController from './base.controller';
import APIError from '../helper/api-error';
import Review from '../models/review.model';
import grants from '../config/rbac.config';
import config from '../config/config';

class ReviewController extends BaseController {
  constructor() {
    super();

    this._ac = new AccessControl(grants);
    this._grpcClient = new businessProto.BusinessService(
      config.businessGrpcServer.host + ':' + config.businessGrpcServer.port,
      grpc.credentials.createSsl(
        config.rootCert,
        config.grpcPrivateKey,
        config.grpcPublicKey,
      ),
      {
        'grpc.ssl_target_name_override' : 'ikoreatown.net',
        'grpc.default_authority': 'ikoreatown.net'
      }
    );
  }

  /**
   * Get reviews list
   * @property {ObjectId} req.query.bid - business id
   * @property {ObjectId} req.query.uid - user id
   * @property {Number} req.query.skip - Number of reviews to skip
   * @property {Number} req.query.limit - Number of reviews page limit
   * @property {String} req.query.orderBy - Get list order by new, useful, recommended
   * @property {String} req.query.search - Search term
   */
  getReviews(req, res, next) {
    const { skip, limit, search, bid, uid, orderBy } = req.query;

    Review.getCount({search, filter: { bid, uid }})
      .then(totalCount => {
        req.totalCount = totalCount;

        return Review.getList({ skip, limit, search, filter: { bid, uid }, orderBy });
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
      then(role => {
        if (role !== 'regular') throw new APIError("Forbidden", httpStatus.FORBIDDEN);

        const review = new Review({
          userId: req.body.uid,
          user: req.body.uid,
          businessId: req.body.bid,
          business: req.body.bid,
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
        return new Promise((resolve, reject) => {
          const data = {
            bid: review.businessId.toString(),
            rid: review._id.toString(),
            rating: review.rating,
          };

          this._grpcClient.addReview(data, (err, response) => {
            if (err) {
              review.remove();
              return reject(err);
            }

            return resolve(response);
          });
        });
      })
      .then(response => {
        if (response.businessId)
          return Review.getCount({ filter: { bid: req.body.bid } });
      })
      .then(count => {
        req.totalCount = count;
        return Review.getList({ filter: { bid: req.body.bid }, orderBy: 'new' });
      })
      .then(list => {
        return res.json({
          totalCount: req.totalCount,
          list: list,
        });
      }).catch(err => {
        return next(err);
      });
  }

  /**
   * Update review
   * @property {ObjectId} req.body._id - Review id
   * @property {ObjectId} req.body.uid - User id
   * @property {String} req.body.content  - Review content
   * @property {Number} req.body.rating - Review rating
   * @property {Object} req.files - Review images
   * @property {String} req.body.status - Only manager, admin and god can update review status
   * @property {Number} req.body.quality - Only manager, admin and god can update review quality
   */
  updateReview(req, res, next) {
    ReviewController.authenticate(req, res, next)
      .then(payload => {
        req.role = payload;
        return Review.getById(req.body._id);
      })
      .then(review => {
        if (_.isEmpty(review)) throw new APIError("Not found", httpStatus.NOT_FOUND);

        let permission, difference;
        req.bid = review.businessId;

        if (review.userId.toString() === req.body.uid) {
          permission = this._ac.can(req.role).updateOwn('review');
          req.isOwn = true;
        } else {
          permission = this._ac.can(req.role).updateAny('review');
          req.isOwn = false;
        }

        const data = permission.filter(req.body);

        if (_.isEmpty(data)) return review;

        _.map(data, (value, key) => {
          if (key === 'rating') {
            difference = data.rating - review.rating;
          }

          review[key] = value;
        });


        if (!_.isUndefined(difference) && difference !== 0) {
          return new Promise((resolve, reject) => {
            const data = {
              rid: review._id.toString(),
              bid: review.businessId.toString(),
              difference: difference,
            };

            this._grpcClient.updateReview(data, (err, response) => {
              if (err) {
                return reject(err);
              }

              return resolve(review);
            });
          });
        }

        if (data.files) {
          //add new images
        }

        return review;
      })
      .then(review => {
        return review.save();
      })
      .then(review => {
        let filter = {};

        if (req.isOwn) {
          filter = {
            uid: req.body.uid
          }
        }

        return Review.getCount({ filter: filter });
      })
      .then(count => {
        req.totalCount = count;

        let filter = {};

        if (req.isOwn) {
          filter = {
            uid: req.body.uid
          }
        }

        return Review.getList({ filter: filter, orderBy: 'new' });
      })
      .then(list => {
        return res.json({
          totalCount: req.totalCount,
          list:list,
        });
      })
      .catch(err => {
        return next(err);
      });
  }

  /**
   * Delete review
   * @property {ObjectId} req.body._id - Review id
   * @property {ObjectId} req.body.uid - User's id
   */
  deleteReview(req, res, next) {
    ReviewController.authenticate(req, res, next)
      .then(role => {
        return Review.getById(req.body._id);
      })
      .then(review => {
        if (_.isEmpty(review)) throw new APIError("Not found", httpStatus.NOT_FOUND);


        if (review.userId.toString() !== req.body.uid) {
          throw new APIError("Forbidden", httpStatus.FORBIDDEN)
        }

        return new Promise((resolve, reject) => {
          const data = {
            bid: review.businessId.toString(),
            rid: review._id.toString(),
            rating: review.rating,
          };

          this._grpcClient.deleteReview(data, (err, response) => {
            if (err) {
              return reject(err);
            }

            return resolve(review);
          });
        });
      })
      .then(review => {
        if (!_.isEmpty(review.imagesUri)) {
          // Delete related images
        }
        return review.remove();
      })
      .then(result => {
        return Review.getCount({
          filter: {
            uid: req.body.uid
          }
        });
      })
      .then(count => {
        req.totalCount = count;
        return Review.getList({
          "filter": {
            uid: req.body.uid
          },
          "orderBy": 'new'
        });
      })
      .then(list => {
        return res.json({
          totalCount: req.totalCount,
          list:list,
        });
      })
      .catch(err => {
        return next(err);
      });
  }

  /**
   * Vote review
   */
  voteReview(req, res, next) {
    ReviewController.authenticate(req, res, next)
      .then(payload => {
        req.role = payload;
        return Review.getById(req.params.id);
      })
      .then(review => {
        if (_.isEmpty(review)) throw new APIError("Not found", httpStatus.NOT_FOUND);

        if (review.userId.toString() === req.body.uid) {
          throw new APIError("Forbidden", httpStatus.FORBIDDEN)
        }

        req.bid = review.businessId;
        let upIndex, downIndex;
        let permission = this._ac.can(req.role).updateAny('review');

        if (req.body.vote === 'upVote') {
          upIndex = review.upVote.indexOf(req.body.uid);
          downIndex = review.downVote.indexOf(req.body.uid);

          if (upIndex > -1) {
            review.upVote.splice(upIndex, 1);
          } else {
            review.upVote.push(req.body.uid);
          }

          if (downIndex > -1) {
            review.downVote.splice(downIndex, 1);
          }

        } else if (req.body.vote === 'downVote') {
          downIndex = review.downVote.indexOf(req.body.uid);
          upIndex = review.upVote.indexOf(req.body.uid);

          if (downIndex > -1) {
            review.downVote.splice(downIndex, 1);
          } else {
            review.downVote.push(req.body.uid);
          }

          if (upIndex > -1) {
            review.upVote.splice(upIndex, 1);
          }
        }

        return review.save();
      })
      .then(review => {
        return res.json({
          review: review
        });
      })
      .catch(err => {
        return next(err);
      });
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
