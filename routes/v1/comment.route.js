import Express from 'express';
import validate from 'express-validation';

import paramValidation from '../../config/param-validation';
import CommentController from '../../controller/comment.controller';

const router = Express.Router();
const commentController = new CommentController();

validate.options({
  allowUnknownBody: false,
  allowUnknownHeaders: true,
  allowUnknownQuery: true,
  allowUnknownParams: false,
  allowUnknownCookies: true
});

/** GET /api/v1/comment - Get list of comments **/
router.get('/', validate(paramValidation.getCommentsList), commentController.getCommentsList);

/** POST /api/v1/comment - Add new comment **/
router.post('/', validate(paramValidation.addNewComment), commentController.addNewComment);

/** DELETE /api/v1/comment/:id - Delete comment **/
router.delete('/:id', validate(paramValidation.deleteComment), commentController.deleteComment);

/** POST /api/v1/comment/vote/:id - Vote comment **/
router.post('/vote/:id', validate(paramValidation.voteComment), commentController.voteComment);

/** POST /api/v1/admin/comment/:id - Update comment by admin **/
router.post('/admin/:id', validate(paramValidation.editCommentByAdmin), commentController.editCommentByAdmin);

export default router;
