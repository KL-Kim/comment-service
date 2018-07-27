/**
 * Comment Model
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

import APIError from '../helper/api-error';
import config from '../config/config';

const blogDB = mongoose.createConnection(config.blogMongo.host + ':' + config.blogMongo.port + '/' + config.blogMongo.name);
const userDB = mongoose.createConnection(config.userMongo.host + ':' + config.userMongo.port + '/' + config.userMongo.name);
const User = userDB.model('User', {});
const Post = blogDB.model('Post', {});

const CommentSchema = new Schema({
  "status": {
    type: String,
    required: true,
    default: 'NORMAL',
    enum: ['NORMAL', 'SUSPENDED']
  },
  "userId": {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  "postId": {
    type: Schema.Types.ObjectId,
    'ref': 'Post',
    required: true,
    index: true,
  },
  "parentId": {
    type: Schema.Types.ObjectId,
    ref: 'Comment'
  },
  "replyToUser":{
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  "content": {
    type: String,
    required: true,
    'text': true
  },
  "upvote": [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  "downvote": [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  "createdAt": {
    type: Date,
    default: Date.now,
    index: true,
  },
});

/**
 * Index
 */
CommentSchema.index({
  "upvote": -1,
  "createdAt": -1
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
	getList({ skip, limit, search, filter = {}, orderBy } = {}) {
    let conditions,
        userCondition,
        postCondition,
        statusCondition,
        searchCondition,
        sort;

    switch (orderBy) {
      case 'new':
        sort = {
          "createdAt": -1
        };
        break;

      default:
        sort = {
          "upvote": -1,
          "createdAt": -1
        }
    }

    if (filter.postId) {
      postCondition = {
        "postId": filter.postId
      };
    }

    if (filter.userId) {
      userCondition = {
        "userId": filter.userId
      };
    }

    if (filter.status === 'ALL') {
      statusCondition = {};
    } else if (filter.status) {
      statusCondition = {
        "status": filter.status
      };
    } else {
      statusCondition = {
        "status": 'NORMAL'
      };
    }

    const escapedString = _.escapeRegExp(search);

    if (escapedString) {
      searchCondition = {
        "content": {
          $regex: escapedString,
					$options: 'i'
        }
      };
    }

    if (searchCondition || statusCondition || userCondition || postCondition) {
      conditions = {
        "$and": [
          _.isEmpty(searchCondition) ? {} : searchCondition,
          _.isEmpty(userCondition) ? {} : userCondition,
          _.isEmpty(postCondition)? {} : postCondition,
          _.isEmpty(statusCondition)? {} : statusCondition,
        ]
      }
    }

    return this.find(_.isEmpty(conditions) ? {} : conditions)
      .skip(skip)
      .limit(limit)
			.sort(sort)
      .populate({
        path: 'userId',
        select: ['username', 'firstName', 'lastName', 'profilePhotoUri'],
        model: User,
      })
      .populate({
        path: 'postId',
        select: ['title', 'status'],
        model: Post,
      })
      .populate({
        path: 'parentId',
        select: ['content', 'status'],
      })
      .populate({
        path: 'replyToUser',
        select: ['username', 'firstName', 'lastName'],
        model: User,
      })
			.exec();
	},

  /**
   * Get comments count
   */
  getCount({ search, filter = {} } = {}) {
    let conditions,
        userCondition,
        postCondition,
        statusCondition,
        searchCondition;

    if (filter.userId) {
      userCondition = {
        "userId": filter.userId
      };
    }

    if (filter.status === 'ALL') {
      statusCondition = {};
    } else if (filter.status) {
      statusCondition = {
        "status": filter.status
      };
    } else {
      statusCondition = {
        "status": 'NORMAL'
      };
    }

    if (filter.postId) {
      postCondition = {
        "postId": filter.postId
      };
    }

    const escapedString = _.escapeRegExp(search);

    if (escapedString) {
      searchCondition = {
        "content": {
          $regex: escapedString,
					$options: 'i'
        }
      };
    }

    if (searchCondition || statusCondition || userCondition || postCondition) {
      conditions = {
        "$and": [
          _.isEmpty(searchCondition) ? {} : searchCondition,
          _.isEmpty(userCondition) ? {} : userCondition,
          _.isEmpty(postCondition)? {} : postCondition,
          _.isEmpty(statusCondition)? {} : statusCondition,
        ]
      }
    }

    return this.count(_.isEmpty(conditions) ? {} : conditions).exec();
  },

  /**
   * Get comment by id
   * @param {ObjectId} id - Comment id
   * @return {Promise<Comment>}
   */
  getById(id) {
    return this.findById(id)
      .populate({
        path: 'userId',
        select: ['username', 'firstName', 'lastName', 'profilePhotoUri'],
        model: User,
      })
      .exec();
  },

};

export default mongoose.model('Comment', CommentSchema);
