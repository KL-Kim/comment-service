/**
 * Parameters Validation Config
 * @export {Object}
 * @version 0.0.1
 */
import Joi from 'joi';

export default {

  // Get reviews
  "getReviewsList": {
    "query": {
      bid: Joi.string().hex(),
      uid: Joi.string().hex(),
			limit: Joi.number(),
			skip: Joi.number(),
			search: Joi.string().trim().strip().allow(''),
      orderBy: Joi.string().valid(['new', 'useful', 'recommended', '']),
		}
  },

  // Get single review
  "getSingleReview": {
    "params": {
      id: Joi.string().hex().required(),
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
    }
  },

  // Delete review
  "deleteReview": {
    "body": {
      _id: Joi.string().hex().required(),
      uid: Joi.string().hex().required(),
    }
  },

  // Vote review
  "voteReview": {
    "params": {
      id: Joi.string().hex().required(),
    },
    "body": {
      uid: Joi.string().hex().required(),
      vote: Joi.string().valid(['upvote', 'downvote']),
      businessName: Joi.string().trim(),
      businessSlug: Joi.string().trim(),
    }
  },

  // Update review
  "editReviewByAdmin": {
    "params": {
      id: Joi.string().hex().required(),
    },
    "body": {
      status: Joi.string().valid(['NORMAL', 'SUSPENDED']),
      quality: Joi.number(),
    }
  },

  /** GET /api/v1/comment - Get list of comments **/
  "getCommentsList": {
    "query": {
      skip: Joi.number(),
      limit: Joi.number(),
			search: Joi.string().trim().strip().allow(''),
      uid: Joi.string().hex(),
      pid: Joi.string().hex(),
      status: Joi.string().valid(['NORMAL', 'SUSPENDED', 'ALL']),
      parentId: Joi.string().hex(),
    },
  },

  /** POST /api/v1/comment - Add new comment **/
  "addNewComment": {
    "body": {
      uid: Joi.string().hex().required(),
      pid: Joi.string().hex().required(),
      content: Joi.string().trim(),
      parentId: Joi.string().hex(),
      replyToUser: Joi.string().hex(),
    }
  },

  /** DELETE /api/v1/comment/:id - Delete comment **/
  "deleteComment": {
    "params": {
      id: Joi.string().hex().required(),
    },
    "body": {
      uid: Joi.string().hex().required(),
    }
  },

  // Vote comment
  "voteComment": {
    "params": {
      id: Joi.string().hex().required(),
    },
    "body": {
      uid: Joi.string().hex().required(),
      vote: Joi.string().valid(['UPVOTE', 'DOWNVOTE']),
      postTitle: Joi.string().trim(),
    }
  },

  /** PUT /api/v1/admin/comment/:id - Update comment by admin **/
  "editCommentByAdmin": {
    "params": {
      id: Joi.string().hex().required(),
    },
    "body": {
      status: Joi.string().valid(['NORMAL', 'SUSPENDED']),
    }
  },
};
