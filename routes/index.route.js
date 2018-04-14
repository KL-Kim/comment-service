import Express from 'express';
import routes from './v1/v1.route.js';

const router = Express.Router();

router.use('/v1', routes);

// Check route goes well
router.get('/say', (req, res) => {
	res.json('Comment & Review');
});

export default router;
