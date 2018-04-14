import Promise from 'bluebird';
import mongoose, { Schema } from 'mongoose';
import httpStatus from 'http-status';
import _ from 'lodash';

import APIError from '../helper/api-error';

const CommentSchema = new Schema({
  "status": {
    type: String,
    required: true,
    enum: ['normal', 'suspended']
  },
  "itemId": {
    type: Schema.Types.ObjectId,
    required: true,
  },
  "userId": {
    type: Schema.Types.ObjectId,
    ref: 'User'
    required: true,
  },
  "title": {
    type: String,
    required: true,
  },
  "content": {
    type: String,
  },
  "parentId": {
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  },
  "upVote": {
    type: Number,
    required: true,
    default: 0,
  },
  "downVote": {
    type: Number,
    required: true,
    default: 0,
  },
});

/**
 * Index
 */
CommentSchema.index({
  "itemId": 1,
  "userId": 1,
  "title": "text",
  "content": "text",
});

/**
 * Virtuals
 */
CommentSchema.virtual('id')
 	.get(function() { return this._id });

/**
 * Methods
 */
CommentSchema.methods = {
  /**
	 * Remove unnecessary info
	 */
  toJSON() {
		let obj = this.toObject();
		delete obj.__v;
		delete obj.createdAt;
		return obj;
	},
};

/**
 * Statics
 */
CommentSchema.statics = {
  /**
	 * List comments in descending order of 'createdAt' timestamp.
   * @param {String} search - Search term
	 * @returns {Promise<Comment[]>}
	 */
	getList(search) {
    let searchCondition = {};

    const escapedString = _.escapeRegExp(search);

    if (escapedString)
      searchCondition = {
        $or: [
          {
            "title": {
              $regex: escapedString,
							$options: 'i'
            }
          },
          {
            "content": {
              $regex: escapedString,
							$options: 'i'
            }
          }
        ]
      }
    }

		return this.find(searchCondition)
			.sort({ "createdAt": 1 })
			.exec();
	},

  /**
   * Get comment by id
   * @param {ObjectId} id - Comment id
   * @return {Promise<Comment>}
   */
  getById(id) {
    return this.findById(id).exec();
  },

};

export default mongoose.model('Comment', CommentSchema);
