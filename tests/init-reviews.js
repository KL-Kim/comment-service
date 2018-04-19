import fs from 'fs';

const db = require('../config/db.config');
import Review from '../models/review.model';

Review.remove({}), err => {
  if (err) throw err;

  console.log("Clear mongodb documents");


};
