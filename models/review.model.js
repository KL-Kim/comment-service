import Promise from 'bluebird';
import mongoose, { Schema } from 'mongoose';
import httpStatus from 'http-status';
import _ from 'lodash';

import APIError from '../helper/api-error';

const ReviewSchema = new Schema({
  "status": {
    type: String,
    required: true,
    default: 'normal',
    enum: ['normal', 'suspended']
  },
  "quality": {
    type: String,
    required: true,
    default: "normal",
    enum: ['normal', 'good'],
  },
  "businessId": {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Business'
  },
  "userId": {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  "content": {
    type: String,
    required: true,
  },
  "rating": {
    type: Number,
    required: true,
  },
  "serviceGood": {
    type: Boolean,
  },
  "envGood": {
    type: Boolean,
  },
  "comeback": {
    type: Boolean,
  },
  "upVote": [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  "downVote": [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  "imagesUri": [{
    type: String
  }],
});

/**
 * Index
 */
ReviewSchema.index({
  "quality": 1,
  "businessId": 1,
  "userId": 1,
  "content": "text",
});

/**
 * Virtuals
 */
ReviewSchema.virtual('id')
 	.get(function() { return this._id });

/**
 * Methods
 */
ReviewSchema.methods = {
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
ReviewSchema.statics = {
  /**
	 * List reviews in descending order of 'createdAt' timestamp.
   * @param {String} search - Search term
	 * @returns {Promise<Review[]>}
	 */
	getList({ skip = 0, limit = 20, search, filter = {} } = {}) {
    let searchCondition = {};

    const escapedString = _.escapeRegExp(search);

    if (escapedString) {
      searchCondition = {
        "content": {
          $regex: escapedString,
  				$options: 'i'
        }
      }
    }

		return this.find(searchCondition)
			.sort({ "createdAt": 1 })
			.exec();
	},

  /**
	 * Total count of requested reviews
   * @param {String} search - Search term
	 * @returns {Promise<Review[]>}
	 */
  getCount({search, filter = {} } = {}) {
    let searchCondition = {};

    const escapedString = _.escapeRegExp(search);

    if (escapedString) {
      searchCondition = {
        "content": {
          $regex: escapedString,
  				$options: 'i'
        }
      }
    }

		return this.count(searchCondition)
			.sort({ "createdAt": 1 })
			.exec();
  },

  /**
   * Get review by id
   * @param {ObjectId} id - Review id
   * @return {Promise<Review>}
   */
  getById(id) {
    return this.findById(id).exec();
  },

};

export default mongoose.model('Review', ReviewSchema);
