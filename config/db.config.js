/**
 * Database Config
 * @export {Mongoose Object}
 * @version 0.0.1
 */

import Promise from 'bluebird';
import mongoose from 'mongoose';
import config from './config';

mongoose.Promise = Promise;
const mongoUri = `${config.mongo.host}:${config.mongo.port}/comment-service`;
mongoose.connect(mongoUri, {
	promiseLibrary: Promise,
	keepAlive: 3000000,
}).catch((error) => {
	throw error;
});

export default mongoose;
