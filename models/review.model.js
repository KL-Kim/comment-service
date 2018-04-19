import Promise from 'bluebird';
import mongoose, { Schema } from 'mongoose';
import httpStatus from 'http-status';
import _ from 'lodash';

import config from '../config/config';
import APIError from '../helper/api-error';
const businessDB = mongoose.createConnection(config.businessMongo.host + ':' + config.businessMongo.port + '/' + config.businessMongo.name);
const userDB = mongoose.createConnection(config.userMongo.host + ':' +config.userMongo.port + '/' + config.userMongo.name);

const Business = businessDB.model('Business', {});
const User = userDB.model('User', {});


const ReviewSchema = new Schema({
  "status": {
    type: String,
    required: true,
    default: 'normal',
    enum: ['normal', 'suspended']
  },
  "quality": {
    type: Number,
    required: true,
    default: 0,
    min: 0,
    max: 9,
  },
  "businessId": {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'Business'
  },
  "business": {
    type: Schema.Types.ObjectId,
  },
  "userId": {
    type: Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  "user": {
    type: Schema.Types.ObjectId,
  },
  "rating": {
    type: Number,
    required: true,
  },
  "content": {
    type: String,
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
  "createdAt": {
		type: Date,
		default: Date.now
	},
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
	getList({ skip = 0, limit = 20, search, filter = {}, orderBy } = {}) {
    let order;
    let conditions, businessCondition, userCondition, searchCondition;

    switch (orderBy) {
      case "new":
        order = {
          "createdAt": -1
        };
        break;

      case "useful":
        order = {
          "upVote": -1
        };
        break;

      default:
        order = {
          "quality": 'desc'
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

    const escapedString = _.escapeRegExp(search);

    if (escapedString) {
      searchCondition = {
        "content": {
          $regex: escapedString,
  				$options: 'i'
        }
      }
    }

    if (businessCondition || userCondition || searchCondition) {
      conditions = {
        "$and": [
          _.isEmpty(searchCondition) ? {} : searchCondition,
					_.isEmpty(businessCondition) ? {} : businessCondition,
          _.isEmpty(userCondition) ? {} : userCondition
        ]
      }
    }

		return this.find(_.isEmpty(conditions) ? {} : conditions)
			.sort(order)
      .populate({
        path: 'business',
        select: ['krName', 'cnName', 'enName', 'status'],
        model: Business,
      })
      .populate({
        path: 'user',
        select: ['username', 'firstName', 'lastName'],
        model: User,
      })
			.exec();
	},

  /**
	 * Total count of requested reviews
   * @param {String} search - Search term
	 * @returns {Promise<Review[]>}
	 */
  getCount({search, filter = {} } = {}) {
    let conditions, businessCondition, userCondition, searchCondition;

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

    if (businessCondition || userCondition || searchCondition) {
      conditions = {
        "$and": [
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
    return this.findById(id).exec();
  },

};

export default mongoose.model('Review', ReviewSchema);
