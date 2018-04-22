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
      orderBy: Joi.string().valid(['new', 'useful', 'recommended', '']),
		}
  },

  // Add new review
  "addNewReview": {
    "body": {
      bid: Joi.string().hex().required(),
      uid: Joi.string().hex().required(),
      rating: Joi.number().required(),
      content: Joi.string().trim().allow(''),
      serviceGood: Joi.boolean(),
      envGood: Joi.boolean(),
      comeback: Joi.boolean(),
    }
  },

  // Update review
  "updateReview": {
    "body": {
      _id: Joi.string().hex().required(),
      uid: Joi.string().hex().required(),
      rating: Joi.number(),
      content: Joi.string().trim().allow(''),
      serviceGood: Joi.boolean(),
      envGood: Joi.boolean(),
      comeback: Joi.boolean(),
      status: Joi.string().valid('normal', 'suspended'),
      quality: Joi.number(),
    }
  },

  // Delete review
  "deleteReview": {
    "body": {
      _id: Joi.string().hex().required(),
      uid: Joi.string().hex().required(),
    }
  },

  "voteReview": {
    "params": {
      id: Joi.string().hex().required(),
    },
    "body": {
      uid: Joi.string().hex().required(),
      vote: Joi.string().valid(['upVote', 'downVote']),
    }
  }
};
