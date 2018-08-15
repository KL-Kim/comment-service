/**
 * Review controller
 *
 * @export {Class}
 * @version 0.0.1
 *
 * @author KL-Kim (https://github.com/KL-Kim)
 * @license MIT
 */

import Promise from 'bluebird';
import httpStatus from 'http-status';
import passport from 'passport';
import fs from 'fs';
import fsx from 'fs-extra';
import _ from 'lodash';
import { AccessControl } from 'accesscontrol';
import grpc from 'grpc';

import { businessProto, notificationProto } from '../config/grpc.client';
import BaseController from './base.controller';
import APIError from '../helper/api-error';
import Review from '../models/review.model';
import grants from '../config/rbac.config';
import config from '../config/config';

class ReviewController extends BaseController {
  constructor() {
    super();

    this._ac = new AccessControl(grants);

    // this._businessGrpcClient = new businessProto.BusinessService(
    //   config.businessGrpcServer.host + ':' + config.businessGrpcServer.port,
    //   grpc.credentials.createSsl(
    //     config.rootCert,
    //     config.grpcPrivateKey,
    //     config.grpcPublicKey,
    //   ),
    //   {
    //     'grpc.ssl_target_name_override' : 'ikoreatown.net',
    //     'grpc.default_authority': 'ikoreatown.net'
    //   }
    // );

    // Connect to business service grpc server
    this._businessGrpcClient = new businessProto.BusinessService(
      config.businessGrpcServer.host + ':' + config.businessGrpcServer.port,
      grpc.credentials.createInsecure()
    );

    this._businessGrpcClient.waitForReady(Infinity, (err) => {
      if (err) console.error(err);

      console.log("Review controller connected Business gRPC Server succesfully!");
    });

    // Connect to notification service grpc server
    this._notificationGrpcClient = new notificationProto.NotificationService(
      config.notificationGrpcServer.host + ':' + config.notificationGrpcServer.port,
      grpc.credentials.createInsecure()
    );

    this._notificationGrpcClient.waitForReady(Infinity, (err) => {
      if (err) console.error(err);

      console.log("Review controller connected Notification gRPC Server succesfully!");
    });
  }

  /**
   * Get reviews list
   * @role - *
   * @since 0.0.1
   * @property {ObjectId} req.query.bid - Business id
   * @property {ObjectId} req.query.uid - User id
   * @property {Number} req.query.skip - Number of reviews to skip
   * @property {Number} req.query.limit - Number of reviews page limit
   * @property {String} req.query.orderBy - Get list order by new, useful, recommended
   * @property {String} req.query.search - Search term
   */
  getReviewsList(req, res, next) {
    const { skip, limit, search, bid, uid, orderBy } = req.query;

    Review.getCount({ search, filter: { bid, uid, status: "NORMAL" } })
      .then(totalCount => {
        req.totalCount = totalCount;

        return Review.getList({ skip, limit, search, filter: { bid, uid, status: "NORMAL" }, orderBy });
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
   * Get single review
   * @role - *
   * @since 0.0.1
   * @property {ObjectId} req.params.id - Review id
   */
  getSingleReview(req, res, next) {
    Review.getById(req.params.id)
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
   * Add new review
   * @role - *
   * @since 0.0.1
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
    ReviewController.authenticate(req, res, next)
      .then(payload => {
        if (!payload.isVerified) throw new APIError("Unauthorized", httpStatus.UNAUTHORIZED);
        if (payload.uid !== req.body.uid) throw new APIError("Forbidden", httpStatus.FORBIDDEN);

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

          this._businessGrpcClient.addReview(data, (err, response) => {
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
          return res.status(204).send();
        else {
          throw new APIError("Bad gRPC Response", httpStatus.INTERNAL_SERVER_ERROR);
        }
      }).catch(err => {
        return next(err);
      });
  }

  /**
   * Update review
   * @role - *
   * @since 0.0.1
   * @property {ObjectId} req.body._id - Review id
   * @property {ObjectId} req.body.uid - User id
   * @property {String} req.body.content  - Review content
   * @property {Number} req.body.rating - Review rating
   * @property {Number} req.body.serviceGood - Review rating
   * @property {Number} req.body.envGood - Review rating
   * @property {Number} req.body.comeback - Review rating
   * @property {Object} req.files - Review images
   */
  updateReview(req, res, next) {
    ReviewController.authenticate(req, res, next)
      .then(payload => {
        if (!payload.isVerified) throw new APIError("Unauthorized", httpStatus.UNAUTHORIZED);
        if (payload.uid !== req.body.uid) throw new APIError("Forbidden", httpStatus.FORBIDDEN);

        return Review.findById(req.body._id);
      })
      .then(review => {
        if (_.isEmpty(review)) throw new APIError("Not found", httpStatus.NOT_FOUND);

        let difference;

        if (req.body.rating) difference = req.body.rating - review.rating;

        // Recalculate business's average rating
        if (difference && difference !== 0) {
          return new Promise((resolve, reject) => {
            const data = {
              rid: review._id.toString(),
              bid: review.businessId.toString(),
              difference: difference,
            };

            this._businessGrpcClient.updateReview(data, (err, response) => {
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
        return res.status(204).send();
      })
      .catch(err => {
        return next(err);
      });
  }

  /**
   * Delete review
   * @role - *
   * @since 0.0.1
   * @property {ObjectId} req.body._id - Review id
   * @property {ObjectId} req.body.uid - User's id
   */
  deleteReview(req, res, next) {
    ReviewController.authenticate(req, res, next)
      .then(payload => {
        if (!payload.isVerified) throw new APIError("Unauthorized", httpStatus.UNAUTHORIZED);
        if (payload.uid !== req.body.uid) throw new APIError("Forbidden", httpStatus.FORBIDDEN);

        return Review.findById(req.body._id);
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

          this._businessGrpcClient.deleteReview(data, (err, response) => {
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
        return res.status(204).send();
      })
      .catch(err => {
        return next(err);
      });
  }

  /**
   * Vote review
   * @role - *
   * @since 0.0.1
   * @property {ObjectId} req.params.id - Review id
   * @property {String} req.body.vote - Vote review
   * @property {ObjectId} req.body.uid - User id
   * @property {String} req.body.businessName - Business name
   * @property {String} req.body.businessSlug - Business slug
   */
  voteReview(req, res, next) {
    ReviewController.authenticate(req, res, next)
      .then(payload => {
        if (payload.uid !== req.body.uid) throw new APIError("Forbidden", httpStatus.FORBIDDEN);

        req.role = payload.role;
        return Review.getById(req.params.id);
      })
      .then(review => {
        if (_.isEmpty(review)) throw new APIError("Not found", httpStatus.NOT_FOUND);
        if (review.userId.toString() === req.body.uid) throw new APIError("Forbidden", httpStatus.FORBIDDEN);

        let upIndex;

        if (req.body.vote === 'upvote') {
          upIndex = review.upvote.indexOf(req.body.uid);

          if (upIndex > -1) {
            review.upvote.splice(upIndex, 1);

            // return new Promise((resolve, reject) => {
            //   this._notificationGrpcClient.addNotification({
            //     userId: review.userId.toString(),
            //     senderId: req.body.uid,
            //     type: "REVIEW",
            //     event: "CANCEL_UPVOTE",
            //     subjectUrl: req.body.businessSlug,
            //     subjectTitle: req.body.businessName,
            //     commentId: review._id.toString(),
            //   }, (err, response) => {
            //     if (err) reject(err);
            //
            //     resolve(review);
            //   });
            // });

            return review;
          } else {
            review.upvote.push(req.body.uid);

            return new Promise((resolve, reject) => {
              this._notificationGrpcClient.addNotification({
                userId: review.userId.toString(),
                senderId: req.body.uid,
                type: "REVIEW",
                event: "UPVOTE",
                subjectUrl: req.body.businessSlug,
                subjectTitle: req.body.businessName,
                commentId: review._id.toString(),
                commentContent: review.content,
              }, (err, response) => {
                if (err) reject(err);

                resolve(review);
              });
            });
          }
        }
      })
      .then(review => {
        return review.save();
      })
      .then(review => {
        return res.json({
          review,
        });
      })
      .catch(err => {
        return next(err);
      });
  }

  /**
   * Get reviews list by admin
   * @role - manager, admin, god
   * @since 0.0.1
   * @property {Number} req.query.skip - Number of reviews to skip
   * @property {Number} req.query.limit - Number of reviews page limit
   * @property {String} req.query.orderBy - Get list order by new, useful, recommended
   * @property {String} req.query.search - Search term
   * @property {String} req.query.status - Review status
   * @property {ObjectId} req.query.bid - Business id
   * @property {ObjectId} req.query.uid - User id
   */
  getReviewsListByAdmin(req, res, next) {
    const { skip, limit, search, bid, uid, status, orderBy } = req.query;

    ReviewController.authenticate(req, res, next)
      .then(payload => {
        if (!payload.isVerified) throw new APIError("Unauthorized", httpStatus.UNAUTHORIZED);
        if (payload.role !== 'manager' && payload.role !== 'admin' && payload.role !== 'god') throw new APIError("Forbidden", httpStatus.FORBIDDEN);

        return Review.getCount({ search, filter: { bid, uid, status } });
      })
      .then(totalCount => {
        req.totalCount = totalCount;

        return Review.getList({ skip, limit, search, filter: { bid, uid, status }, orderBy });
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
   * Edit review by admin
   * @role - manager, admin, god
   * @since 0.0.1
   * @property {ObjectId} req.params.id - Review Id
   * @property {String} req.body.status - Review status
   * @property {Number} req.body.quality - Only manager, admin and god can update review quality
   * @returns {void}
   */
  editReviewByAdmin(req, res, next) {
    ReviewController.authenticate(req, res, next)
      .then(payload => {
        if (!payload.isVerified) throw new APIError("Unauthorized", httpStatus.UNAUTHORIZED);
        if (payload.role !== 'manager' && payload.role !== 'admin' && payload.role !== 'god') throw new APIError("Forbidden", httpStatus.FORBIDDEN);

        return Review.findById(req.params.id);
      })
      .then(review => {
        if (_.isEmpty(review)) throw new APIError("Not found", httpStatus.NOT_FOUND);

        const { status, quality } = req.body;

        return review.update({...req.body});
      })
      .then(review => {
        return res.status(204).send();
      })
      .catch(err => {
        return next(err);
      });
  }

  /**
   * Authenticate
   * @since 0.0.1
   * @returns {Promise<Object, APIError>}
   */
  static authenticate(req, res, next) {
 		return new Promise((resolve, reject) => {
 			passport.authenticate('access-token', (err, payload, info) => {
 				if (err) return reject(err);
 				if (info) return reject(new APIError(info.message, httpStatus.UNAUTHORIZED));

        return resolve(payload);
 			})(req, res, next);
 		});
 	}
}

export default ReviewController;
