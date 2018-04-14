/**
 * Parameters Validation Config
 * @export {Object}
 * @version 0.0.1
 */
import Joi from 'joi';

export default {

  // Get reviews
  "getReviews": {
    "query": {
      bid: Joi.string().hex(),
      uid: Joi.string().hex(),
			limit: Joi.number(),
			skip: Joi.number(),
			search: Joi.string().trim().strip().allow(''),
		}
  },

  // Add new review
  "addNewReview": {
    "body": {
      bid: Joi.string().hex().required(),
      uid: Joi.string().hex().required(),
      rating: Joi.number().required(),
      content: Joi.string().trim().required(),
      serviceGood: Joi.boolean(),
      envGood: Joi.boolean(),
      comeback: Joi.boolean(),
    }
  },
};
