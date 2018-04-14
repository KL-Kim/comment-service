/**
 * CSRF Protection
 */
import csurf from 'csurf';

const csurfOptions = {
  cookie: true
};

export default csurf(csurfOptions);
