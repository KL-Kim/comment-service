import Express from 'express';
import validate from 'express-validation';

import CommentController from '../../controller/comment.controller';

const router = Express.Router();
const commentController = new CommentController();

/** GET /api/v1/comment - Get list of reviews **/
router.get('/', commentController.getCommetsList);

export default router;
