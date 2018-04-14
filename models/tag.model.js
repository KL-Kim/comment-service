import Promise from 'bluebird';
import mongoose, { Schema } from 'mongoose';
import httpStatus from 'http-status';
import _ from 'lodash';

import APIError from '../helper/api-error';

const TagSchema = new Schema({
  "code": {
    "type": Number,
    "required": true,
    "unique": true,
  },
  "enName": {
    "type": String,
    "required": true,
    "unique": true,
    "lowercase": true,
  },
  "cnName": {
    "type": String,
    "required": true,
    "unique": true,
  },
  "krName": {
    "type": String,
    "required": true,
    "unique": true,
  },
});

/**
 * Index
 */
TagSchema.index({
  "code": 1,
  "enName": 'text',
  "cnName": 'text',
  "krName": 'text',
});

/**
 * Virtuals
 */
TagSchema.virtual('id')
 	.get(function() { return this._id });

/**
 * Methods
 */
TagSchema.methods = {
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
TagSchema.statics = {

  /**
	 *  List tags in descending order of 'code'.
	 * @returns {Promise<Tag[]>}
	 */
	getTagsList(search) {
    let searchCondition = {};

    const escapedString = _.escapeRegExp(search);
    const num = _.toNumber(search);

    if (num) {
      searchCondition = {
        "code": num
      };
    } else {
      searchCondition = {
        $or: [
          {
            "krName": {
              $regex: escapedString,
							$options: 'i'
            }
          },
          {
            "cnName": {
              $regex: escapedString,
							$options: 'i'
            }
          },
          {
            "enName": {
              $regex: escapedString,
							$options: 'i'
            }
          },
        ]
      }
    }

		return this.find(searchCondition)
			.sort({ "code": 1 })
			.exec();
	},

  /**
   * Get tag by id
   * @param {Object} id - tag id
   * @return {Promise<Tag>}
   */
  getById(id) {
    return this.findById(id).exec();
  },

  /**
   * Get tag by code
   * @param {Number} code - tag code
   * @return {Promise<Tag>}
   */
  getByCode(code) {
    return this.findOne({"code": code}).exec();
  },
};

export default mongoose.model('Tag', TagSchema);
