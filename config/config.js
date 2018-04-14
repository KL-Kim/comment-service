/**
 * Config Environment Properties
 * @export {Object}
 * @version 0.0.1
 */

import fs from 'fs';
import Joi from 'joi';
import ms from 'ms';
require('dotenv').config();

function setConfig() {

	/**
	 * Joi Validation Schema
	 */
	const envVarsSchema = Joi.object({
		NODE_ENV: Joi.string()
			.allow('development', 'production', 'test')
			.default('development'),
		SERVER_PORT: Joi.number()
			.default(3002),
		MONGO_HOST: Joi.string().default('mongodb://localhost'),
		MONGO_PORTS: Joi.number().default(27017),
		WEB_SERVICE_HOST: Joi.string(),
		WEB_SERVICE_PORT: Joi.number().default(80),
		ACCESS_JWT_ALGORITHM: Joi.string().default('RS256'),
		ACCESS_JWT_ISSUER: Joi.string().allow(''),
		ACCESS_JWT_AUDIENCE: Joi.string().allow(''),
		ACCESS_JWT_EXPIRATION: Joi.string().default(ms('1h')),
	}).unknown(true);

	const {error, value: envVars} = Joi.validate(process.env, envVarsSchema);

	if (error) {
		throw new Error(`Config Validation Error: ${error.message}`);
	}

	const config = {
		env: envVars.NODE_ENV,
		port: envVars.SERVER_PORT,
		mongo: {
			host: envVars.MONGO_HOST,
			port: envVars.MONGO_PORTS
		},
		webService: {
			host: envVars.WEB_SERVICE_HOST,
			port: envVars.WEB_SERVICE_PORT,
			accountVerifyUrl: envVars.WEB_SERVICE_HOST + ':' + envVars.WEB_SERVICE_PORT + '/verify/',
			changePasswordUrl: envVars.WEB_SERVICE_HOST + ':' + envVars.WEB_SERVICE_PORT + '/change-password/',
		},
		// sessionSecret: envVars.SESSION_SECRET,
		accessTokenOptions: {
			algorithm: envVars.ACCESS_JWT_ALGORITHM,
			expiresIn: envVars.ACCESS_JWT_EXPIRATION,
			//issuer: envVars.ACCESS_JWT_ISSUER,
			//audience: envVars.ACCESS_JWT_AUDIENCE,
		},
	};

	try {
		config.serverPublicKey = fs.readFileSync(__dirname + '/secret/server.cert.pem', 'utf8');
		config.serverPrivateKey = fs.readFileSync(__dirname + '/secret/server.key.pem', 'utf8');
    config.accessTokenPublicKey = fs.readFileSync(__dirname + '/secret/access.jwt.cert.pem', 'utf8');
	} catch(err) {
		throw err;
	}


	return config;
}

export default setConfig();
