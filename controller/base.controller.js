import BaseAutoBindedClass from '../helper/base-autobind';

class BaseController extends BaseAutoBindedClass {
	constructor() {
		super();

		if (new.target === BaseController)
			throw new TypeError("Cannot construct BaseController instances directly");
	}

	authenticate(req, res, next) {}
}

export default BaseController;
