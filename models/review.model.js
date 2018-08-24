/**
 * Review Model
 *
 * @version 0.0.1
 *
 * @author KL-Kim (https://github.com/KL-Kim)
 * @license MIT
 */

import Promise from 'bluebird';
import mongoose, { Schema } from 'mongoose';
import httpStatus from 'http-status';
import _ from 'lodash';

import config from '../config/config';
import APIError from '../helper/api-error';

const businessDB = mongoose.createConnection(config.businessMongo.host + ':' + config.businessMongo.port + '/' + config.businessMongo.name);
const userDB = mongoose.createConnection(config.userMongo.host + ':' + config.userMongo.port + '/' + config.userMongo.name);

const Business = businessDB.model('Business', {});
const User = userDB.model('User', {});

const ReviewSchema = new Schema({
  "status": {
    type: String,
    required: true,
    default: 'NORMAL',
    enum: ['NORMAL', 'SUSPENDED']
  },
  "quality": {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    max: 9,
    index: true,
  },
  "businessId": {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Business',
    index: true,
  },
  "business": {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Business'
  },
  "userId": {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  "user": {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User',
    index: true,
  },
  "rating": {
    type: Number,
    required: true,
  },
  "content": {
    type: String,
    text: true
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
  "upvote": [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  "images": [{
    name: {
      type: String,
    },
    url: {
      type: String
    },
  }],
  "createdAt": {
		type: Date,
		default: Date.now,
    index: true,
	},
});

/**
 * Compound Indexes
 */
ReviewSchema.index({
  "quality": -1,
  "upvote": -1,
  "createdAt": -1,
});

ReviewSchema.index({
  "upvote": -1,
  "createdAt": -1,
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
		return obj;
	},
};

/**
 * Statics
 */
ReviewSchema.statics = {
  /**
	 * List reviews in descending order of 'createdAt' timestamp.
   * @property {String} search - Search term
   * @property {String} orderBy - List sort
   * @property {Number} skip - Number of list to skip
   * @property {Number} limit - Number of list to limit
   * @property {ObjectId} fitler.bid - Business id
   * @property {ObjectId} filter.uid - User id
	 * @returns {Promise<Review[]>}
	 */
	getList({ skip = 0, limit = 10, search, filter, orderBy } = {}) {
    let order;
    let conditions, businessCondition, userCondition, searchCondition, statusCondition;

    switch (orderBy) {
      case "new":
        order = {
          "createdAt": -1
        };
        break;

      case "useful":
        order = {
          "upvote": -1,
          "createdAt": -1,
        };
        break;

      default:
        order = {
          "quality": -1,
          "upvote": -1,
          "createdAt": -1
        };
    }

    if (filter.bid) {
      businessCondition = {
        "businessId": filter.bid
      }
    }

    if (filter.uid) {
      userCondition = {
        "userId": filter.uid
      };
    }

    if (filter.status) {
      statusCondition = {
        "status": filter.status,
      };
    }

    const escapedString = _.escapeRegExp(search);

    if (escapedString) {
      searchCondition = {
        "content": {
          $regex: escapedString,
  				$options: 'i'
        }
      }
    }

    if (businessCondition || userCondition || searchCondition || statusCondition) {
      conditions = {
        "$and": [
          _.isEmpty(statusCondition) ? {} : statusCondition,
          _.isEmpty(searchCondition) ? {} : searchCondition,
					_.isEmpty(businessCondition) ? {} : businessCondition,
          _.isEmpty(userCondition) ? {} : userCondition,
        ]
      }
    }

		return this.find(_.isEmpty(conditions) ? {} : conditions)
      .skip(skip)
      .limit(limit)
			.sort(order)
      .populate({
        path: 'business',
        select: ['krName', 'cnName', 'enName', 'status'],
        model: Business,
      })
      .populate({
        path: 'user',
        select: ['username', 'firstName', 'lastName', 'avatarUrl'],
        model: User,
      })
			.exec();
	},

  /**
	 * Total count of requested reviews
   * @param {String} search - Search term
   * @property {ObjectId} filter.bid - Business id
   * @property {ObjectId} fitler.uid - User id
	 * @returns {Promise<Review[]>}
	 */
  getCount({ search, filter = {} } = {}) {
    let conditions, businessCondition, userCondition, searchCondition, statusCondition;

    const escapedString = _.escapeRegExp(search);

    if (escapedString) {
      searchCondition = {
        "content": {
          $regex: escapedString,
  				$options: 'i'
        }
      }
    }

    if (filter.bid) {
      businessCondition = {
        "businessId": filter.bid
      }
    }

    if (filter.uid) {
      userCondition = {
        "userId": filter.uid
      };
    }

    if (filter.status) {
      statusCondition = {
        "status": filter.status,
      };
    }

    if (businessCondition || userCondition || searchCondition || statusCondition) {
      conditions = {
        "$and": [
          _.isEmpty(statusCondition) ? {} : statusCondition,
          _.isEmpty(searchCondition) ? {} : searchCondition,
					_.isEmpty(businessCondition) ? {} : businessCondition,
          _.isEmpty(userCondition) ? {} : userCondition
        ]
      }
    }

		return this.count(_.isEmpty(conditions) ? {} : conditions).exec();
  },

  /**
   * Get review by id
   * @param {ObjectId} id - Review id
   * @return {Promise<Review>}
   */
  getById(id) {
    return this.findById(id)
      .populate({
        path: 'business',
        select: ['krName', 'cnName', 'enName', 'status'],
        model: Business,
      })
      .populate({
        path: 'user',
        select: ['username', 'firstName', 'lastName', 'avatarUrl'],
        model: User,
      })
      .exec();
  },

};

export default mongoose.model('Review', ReviewSchema);
