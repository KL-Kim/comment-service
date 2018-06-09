import Promise from 'bluebird';
import grpc from 'grpc';
import httpStatus from 'http-status';
import passport from 'passport';
import _ from 'lodash';
import { AccessControl } from 'accesscontrol';

import config from '../config/config';
import BaseController from './base.controller';
import APIError from '../helper/api-error';
import Comment from '../models/comment.model';
import { businessProto, notificationProto } from '../config/grpc.client';
import grants from '../config/rbac.config';

class CommentController extends BaseController {
  constructor() {
    super();

    this._ac = new AccessControl(grants);

    this._notificationGrpcClient = new notificationProto.NotificationService(
      config.notificationGrpcServer.host + ':' + config.notificationGrpcServer.port,
      grpc.credentials.createInsecure()
    );

    this._notificationGrpcClient.waitForReady(Infinity, (err) => {
      if (err) console.error(err);

      console.log("Comment controller connect Notification gRPC Server succesfully!");
    });
  }

  /**
   * Get reviews list
   * @property {Number} req.query.skip - Number of list to skip
   * @property {Number} req.query.limit - Number of list to limit
   * @property {String} req.query.search - Search term
   * @property {ObjectId} req.query.uid - User id
   * @property {ObjectId} req.query.pid - Post id
   * @property {String} req.query.status - Comment status
   * @property {ObjectId} req.query.parentId - Comment parent id
   */
  getCommentsList(req, res, next) {
    const { skip, limit, search, uid, pid, status, parentId, orderBy } = req.query;

    Comment.getCount({
        filter: {
          postId: pid,
          userId: uid,
          status,
          parentId,
        },
        search,
        orderBy,
      })
      .then(count => {
        req.count = count;

        return Comment.getList({
          filter: {
            postId: pid,
            userId: uid,
            status,
            parentId,
          },
          search,
          orderBy,
        });
      })
      .then(list => {
        return res.json({
          totalCount: req.count,
          list: list,
        });
      })
      .catch(err => {
        return next(err);
      });
  }

  /**
   * Add new comment
   * @property {ObjectId} req.body.uid  - User id
   * @property {OBjectId} req.body.pid - Post id
   * @property {String} req.body.content - Comment content
   * @property {ObjectId} req.body.parentId - Comment parent id
   * @property {ObjectId} req.body.replyToComment - Reply comment id
   * @property {ObjectId} req.body.replyToUser - Reply comment to User
   */
  addNewComment(req, res, next) {
    CommentController.authenticate(req, res, next)
      .then(payload => {
        if (req.body.uid !== payload.uid) throw new APIError("Forbidden", httpStatus.FORBIDDEN);

        const { pid, uid, content, parentId, replyToUser } = req.body;

        const comment = new Comment({
          userId: uid,
          postId: pid,
          content: content,
          parentId: parentId,
          replyToUser: replyToUser,
        });

        if (replyToUser) {
          return new Promise((resolve, reject) => {
            this._notificationGrpcClient.addNotification({
              type: "COMMENT",
              event: "REPLY",
              userId: replyToUser,
              senderId: uid,
              subjectUrl: pid,
              commentContent: content,
              commentId: parentId,
            }, (err, response) => {
              if (err) reject(err);

              resolve(comment);
            });
          });
        }

        return comment;
      })
      .then(comment => {
        return comment.save();
      })
      .then(comment => {
        return res.status(204).send();
      })
      .catch(err => {
        return next(err);
      });
  }

  /**
   * Delete comment
   * @property {ObjectId} req.params.id - Comment Id
   * @property {ObjectId} req.body.uid - User id
   */
  deleteComment(req, res, next) {
    CommentController.authenticate(req, res, next)
      .then(payload => {
        if (req.body.uid !== payload.uid) throw new APIError("Forbidden", httpStatus.FORBIDDEN);

        return Comment.findById(req.params.id);
      })
      .then(comment => {
        if (_.isEmpty(comment)) throw new APIError("Not found", httpStatus.NOT_FOUND);
        if (comment.userId.toString() !== req.body.uid) throw new APIError("Forbidden", httpStatus.FORBIDDEN);

        return comment.remove();
      })
      .then(result => {
        return res.status(204).send();
      })
      .catch(err => {
        return next(err);
      });
  }

  /**
   * Vote comment
   * @property {ObjectId} req.body.uid - User id
   * @property {String} req.body.vote - Upvote or downvote
   * @property {String} req.body.postTitle - Post title
   */
  voteComment(req, res, next) {
    CommentController.authenticate(req, res, next)
      .then(payload => {
        if (req.body.uid !== payload.uid) throw new APIError("Forbidden", httpStatus.FORBIDDEN);

        req.role = payload.role;
        return Comment.findById(req.params.id);
      })
      .then(comment => {
        if (_.isEmpty(comment)) throw new APIError("Not found", httpStatus.NOT_FOUND);
        if (comment.userId.toString() === req.body.uid) throw new APIError("Forbidden", httpStatus.FORBIDDEN);

        const upIndex = comment.upvote.indexOf(req.body.uid);
        const downIndex = comment.downvote.indexOf(req.body.uid);

        if (req.body.vote === 'UPVOTE') {
          if (upIndex > -1) {
            comment.upvote.splice(upIndex, 1);

            // return new Promise((resolve, reject) => {
            //   this._notificationGrpcClient.addNotification({
            //     userId: comment.userId.toString(),
            //     senderId: req.body.uid,
            //     type: "COMMENT",
            //     event: "CANCEL_UPVOTE",
            //     subjectUrl: comment.postId.toString(),
            //     subjectTitle: req.body.postTitle,
            //     commentContent: comment.content,
            //     commentId: comment._id.toString(),
            //   }, (err, response) => {
            //     if (err) reject(err);
            //
            //     resolve(comment);
            //   });
            // });

            return comment;
          } else {
            if (downIndex > -1) {
              comment.downvote.splice(downIndex, 1);
            }

            comment.upvote.push(req.body.uid);

            return new Promise((resolve, reject) => {
              this._notificationGrpcClient.addNotification({
                userId: comment.userId.toString(),
                senderId: req.body.uid,
                type: "COMMENT",
                event: "UPVOTE",
                subjectUrl: comment.postId.toString(),
                subjectTitle: req.body.postTitle,
                commentContent: comment.content,
                commentId: comment._id.toString(),
              }, (err, response) => {
                if (err) reject(err);

                resolve(comment);
              });
            });
          }
        } else if (req.body.vote === 'DOWNVOTE') {
          if (downIndex > -1) {
            comment.downvote.splice(upIndex, 1);

            // return new Promise((resolve, reject) => {
            //   this._notificationGrpcClient.addNotification({
            //     userId: comment.userId.toString(),
            //     senderId: req.body.uid,
            //     type: "COMMENT",
            //     event: "CANCEL_DOWNVOTE",
            //     subjectUrl: comment.postId.toString(),
            //     subjectTitle: req.body.postTitle,
            //     commentContent: comment.content,
            //     commentId: comment._id.toString(),
            //   }, (err, response) => {
            //     if (err) reject(err);
            //
            //     resolve(comment);
            //   });
            // });

            return comment;
          } else {
            if (upIndex > -1) {
              comment.upvote.splice(upIndex, 1);
            }

            comment.downvote.push(req.body.uid);

            return new Promise((resolve, reject) => {
              this._notificationGrpcClient.addNotification({
                userId: comment.userId.toString(),
                senderId: req.body.uid,
                type: "COMMENT",
                event: "DOWNVOTE",
                subjectUrl: comment.postId.toString(),
                subjectTitle: req.body.postTitle,
                commentContent: comment.content,
                commentId: comment._id.toString(),
              }, (err, response) => {
                if (err) reject(err);

                resolve(comment);
              });
            });
          }

        }
      })
      .then(comment => {
        return comment.save();
      })
      .then(comment => {
        return res.json({
          comment
        });
      })
      .catch(err => {
        return next(err);
      })
  }

  /**
   * Update comment by admin
   * @property {ObjectId} req.params.id - Comment Id
   * @property {String} req.body.status - Comment status
   */
  updateCommentByAdmin(req, res, next) {
    CommentController.authenticate(req, res, next)
      .then(payload => {
        if (payload.role !== 'manager' && payload.role !== 'admin' && payload.role !== 'god') throw new APIError("Forbidden", httpStatus.FORBIDDEN);

        return Comment.findById(req.params.id);
      })
      .then(comment => {
        if (_.isEmpty(comment)) throw new APIError("Not found", httpStatus.NOT_FOUND);

        comment.status = req.body.status;

        return comment.save();
      })
      .then(comment => {
        return res.status(204).send();
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

        if (payload.isVerified) {
      		return resolve(payload);
      	} else {
          return reject(new APIError("Unauthorized", httpStatus.UNAUTHORIZED));
        }
 			})(req, res, next);
 		});
 	}
}

export default CommentController;
