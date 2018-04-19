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
      then(payload => {
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
   * @property {String} req.body.vote - Review upVote
   * @property {Object} req.files - Review images
   * @property {String} req.body.status - Only manager, admin and god can update review status
   */
  updateReview(req, res, next) {
    ReviewController.authenticate(req, res, next)
      .then(payload => {
        req.role = payload;
        return Review.getById(req.body._id);
      })
      .then(review => {
        if (review) {
          let permission, upIndex, downIndex;

          if (review.userId.toString() === req.body.uid) {
            permission = this._ac.can(req.role).updateOwn('review');
          } else {
            permission = this._ac.can(req.role).updateAny('review');
          }

          const data = permission.filter(req.body);

          if (data.vote === 'upVote') {
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

          } else if (data.vote === 'downVote') {
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
          } else {
            _.map(data, (value, key) => {
              review[key] = value;
            });
          }

          if (data.files) {
            //add new images
          }

          return review.save();

        } else {
          throw new APIError("Not found", httpStatus.NOT_FOUND);
        }
      })
      .then(review => {
        return res.status(204).send();
      })
      .catch(err => {
        return next(err);
      });
  }

  /**
   * Delete review
   * @property {ObjectId} req.body._id - Review id
   */
  deleteReview(req, res, next) {
    ReviewController.authenticate(req, res, next)
      .then(role => {
        return Review.getById(req.body._id);
      })
      .then(review => {
        if (review) {
          if (review.userId.toString() !== req.body.uid) {
            throw new APIError("Forbidden", httpStatus.FORBIDDEN)
          }

          if (!_.isEmpty(review.imagesUri)) {
            // Delete related images
          }

          return review.remove();
        } else {
          throw new APIError("Not found", httpStatus.NOT_FOUND);
        }
      })
      .then(result => {
        return Review.getCount({ filter: { uid: req.body.uid } });
      })
      .then(count => {
        req.totalCount = count;
        return Review.getList({ filter: { uid: req.body.uid }, orderBy: 'new' });
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
