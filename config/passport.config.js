/**
 * Passport local & Passport jwt Config
 * @export {passport}
 * @version 0.0.1
 */

import passport from 'passport';
import httpStatus from 'http-status';
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;

import config from './config';
import APIError from '../helper/api-error';

// Passport-jwt access token strategy options
const accessTokenOptions = {
	"jwtFromRequest": ExtractJwt.fromAuthHeaderAsBearerToken(),
	"secretOrKey": config.accessTokenPublicKey,
	"algorithm": config.accessTokenOptions.algorithm,
	"issuer": config.accessTokenOptions.issuer || '',
	"audience": config.accessTokenOptions.audience || '',
	"jsonWebTokenOptions": {
		"expiresIn": config.accessTokenOptions.expiresIn
	},
};

passport.use('access-token', new JwtStrategy(accessTokenOptions, (payload, done) => {
	if (payload.uid && payload.role) return done(null, payload, false);
	else return done(new APIError("Unauthorized", httpStatus.UNAUTHORIZED))
}));

export default passport;
