import Express from 'express';
import reviewRoute from './review.route';
import commentRoute from './comment.route';

const router = Express.Router();

router.use('/review', reviewRoute);
router.use('/comment', commentRoute);

export default router;
