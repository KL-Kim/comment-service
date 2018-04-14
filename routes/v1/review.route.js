import Express from 'express';
import validate from 'express-validation';
import multer from 'multer';
import mkdirp from 'mkdirp';

import paramValidation from '../../config/param-validation';
import ReviewController from '../../controller/review.controller';

const router = Express.Router();
const reviewController = new ReviewController();

validate.options({
  allowUnknownBody: false,
  allowUnknownHeaders: true,
  allowUnknownQuery: true,
  allowUnknownParams: true,
  allowUnknownCookies: true
});

/** GET /api/v1/review - Get list of reviews **/
router.get('/', validate(paramValidation.getReviews), reviewController.getReviews);

/** POST /api/v1/review - Add new review **/
router.post('/', validate(paramValidation.addNewReview), reviewController.addNewReview);

export default router;
