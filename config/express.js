import Promise from 'bluebird';
import Express from 'express';
import compression from 'compression';
import bodyParser from 'body-parser';
import methodOverride from 'method-override';
import cookieParser from 'cookie-parser';

// Security concern
import helmet from 'helmet';
import cors from './security/cors.config';
// import csurf from './security/csurf.config';
// import csp from './security/csp.config';

// Debugging and monitoring
import logger from 'morgan';
import errorHandler from '../helper/error-handler.js'

// Passport Configuration
import passport from './passport.config';

// Router
import routes from '../routes/index.route';

const app = new Express();

if (process.env.NODE_ENV === 'development') {
	app.use(logger('combined'));
} else if (process.env.NODE_ENV === 'production') {
	app.use(compress());
}

// The sessionID should never be cached
// app.use((req, res, next) => {
// 	res.header('Cache-Control', 'no-cache="Set-Cookie, Set-Cookie2"');
// 	next();
// });

// Security Concern
app.use(helmet());
app.use(helmet.hidePoweredBy());
app.use(cors);
// app.use(csurf);
// app.use(csp);

app.use(methodOverride());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json({ limit: '20mb' }));

// Passport Initialization
// app.use(passport.initialize());

// Connect MongoDB
const db = require('./db.config');

// App routes
app.use('/api', routes);

// Static files
app.use('/', Express.static('public'));

// Error Handler
app.use(errorHandler);

export default app;
