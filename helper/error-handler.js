/**
 * Error Handler
 * @version 0.0.1
 */
import httpStatus from 'http-status';
import APIError from './api-error';

function errorHandler(err, req, res, next) {

	if (err.code === 11000 && (err.name === 'MongoError' || err.name === 'BulkWriteError')) {
		return next(new APIError("Already exists", httpStatus.CONFLICT))
	}

	if (err.code === 'EBADCSRFTOKEN') {
		// handle CSRF token errors here
	  return res.status(403).send('form tampered with')
	}

	if (err) {
		if (process.env.NODE_ENV !== 'development') {
			delete err.stack;
		}
		return next(err);
	}

	return next();
}

export default errorHandler;
