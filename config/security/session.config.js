/**
 * Session Config
 * @export {Session}
 * @deprecated true
 * @version 0.0.1
 */

import session from 'express-session';
import ms from 'ms';
import config from './config';

session.Session.prototype.login = function login(next) {
	let that = this;
	let req = this.req;
	this.regenerate(function (err) {
		if (err) return next(err);
	});
	this._loggedInAt = Date.now();
	this._ip = req.ip;
	this._ua = req.headers['user-agent'];
	return next();
};

session.Session.prototype.isLoggedIn = function isLoggedIn() {
	return !!this._loggedInAt;
};

session.Session.prototype.isFresh = function isFresh() {
	// return true if logged in less than 10 minitues ago
	return (this._loggedInAt && (Date.now() - this._loggedInAt) < (1000 * 60 * 10));
};

const sessionOptions = {
	// Should be imported other places
	secret: config.sessionSecret,
	// Using Redis Store for production
	// store: new RedisStore({
	// 	host: 'localhost',
	// 	port: 6379,
	// 	db: 2,
	// 	pass: 'password here',
	// 	ttl: (20 * 60)
	// }),
	name: 'id',
	resave: false,
	saveUninitialized: true,
	cookie: {
		// domain: "www.ikoreatown.net",
		// path: '/',
		httpOnly: true,
		secure: false,
		maxAge: ms('2h')
	}
};

export default session(sessionOptions);

