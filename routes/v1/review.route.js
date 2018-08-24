import Express from 'express';
import validate from 'express-validation';
import multer from 'multer';

import paramValidation from '../../config/param-validation';
import ReviewController from '../../controller/review.controller';

const router = Express.Router();
const reviewController = new ReviewController();

validate.options({
  allowUnknownBody: false,
  allowUnknownHeaders: true,
  allowUnknownQuery: true,
  allowUnknownParams: false,
  allowUnknownCookies: true
});

const storage = multer.diskStorage({
  "destination": 'tmp/images/',
  "filename": (req, file, cb) => {
    cb(null, file.originalname);
  }
});

const upload = multer({
  "storage": storage,
  "fileFilter": (req, file, cb) => {
    if (file.mimetype === 'image/jpeg'
      || file.mimetype === 'image/png'
      || file.mimetype === 'image/gif'
      || file.mimetype === 'image/webp') {
        cb(null, true);
    } else {
      cb(new Error("Image - Not supported format"));
    }
  }
});

/** GET /api/v1/review - Get list of reviews **/
router.get('/', validate(paramValidation.getReviewsList), reviewController.getReviewsList);

/** GET /api/v1/review/single/:id - Get single review **/
router.get('/single/:id', validate(paramValidation.getSingleReview), reviewController.getSingleReview);

/** POST /api/v1/review - Add new review **/
router.post('/', upload.fields([
  { name: "images", maxCount: 9 }
]), reviewController.addNewReview);

/** PUT /api/v1/review - Update review **/
router.put('/', validate(paramValidation.updateReview), reviewController.updateReview);

/** DELETE /api/v1/review - Delete review **/
router.delete('/', validate(paramValidation.deleteReview), reviewController.deleteReview);

/** POST /api/v1/review - Update review **/
router.post('/vote/:id', validate(paramValidation.voteReview), reviewController.voteReview);

/** GET /api/v1/review/admin - Get reviews list by admin **/
router.get('/admin', validate(paramValidation.getReviewsListByAdmin), reviewController.getReviewsListByAdmin);

/** POST /api/v1/review/admin/:id - Edit review by admin **/
router.post('/admin/:id', validate(paramValidation.editReviewByAdmin), reviewController.editReviewByAdmin);

export default router;
