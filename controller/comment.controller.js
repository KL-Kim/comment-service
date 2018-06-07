import Promise from 'bluebird';
import httpStatus from 'http-status';
import passport from 'passport';
import _ from 'lodash';

import BaseController from './base.controller';
import APIError from '../helper/api-error';
import Comment from '../models/comment.model';

class CommentController extends BaseController {
  constructor() {
    super();
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
    const { skip, limit, seach, uid, pid, status, parentId } = req.query;

    Comment.getCount()
      .then(count => {
        req.count = count;

        return Comment.getList();
      })
      .then(list => {
        return res.json({
          totalCount: req.count,
          list: list,
        });
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

        const { pid, uid, content, parentId, replyToComment, replyToUser } = req.body;

        const comment = new Comment({
          userId: uid,
          postId: pid,
          content: content,
          parentId: parentId,
          replyToComment: replyToComment,
          replyToUser: replyToUser,
        });

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
